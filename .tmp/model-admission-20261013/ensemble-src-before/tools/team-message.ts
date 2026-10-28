import type { ToolDeps } from "../types"
import { formatTeamCapacity, getTeamCapacity, setTeamCapacity, validateWorkerLimit } from "../capacity"
import { isCapacityQueued } from "../capacity-delivery"
import { resolveRecipientSession } from "../types"
import { requireTeamMember } from "./shared"
import { sendMessage, markDelivered, hasReportedCompletion } from "../messaging"
import { parseModelId, getMemberPromptModel } from "../member-model"
import { log } from "../log"
import { getMissionClassification, resolveMissionClassification, type MissionClassificationConfig } from "../mission-classification"
import { classifyBoardTasks } from "../board-classification"
import { pumpTeam } from "../dispatch"
import { formatProviderPolicy, saveProviderPolicy } from "../provider-policy"
import { formatModelPolicy, saveModelPolicy } from "../model-routing-policy"
import type { ModelPreferencePolicy } from "../model-preference"
import { isExecutionOwned } from "../execution-store"

/**
 * Execute the team_message tool. Sends a direct message to a teammate or lead.
 * Optionally approves or rejects a teammate's plan (lead only).
 * Optionally forces delivery to a teammate who already reported completion (lead only) —
 * see the `force` guard below.
 * Optionally updates a teammate's model in-place (lead only) via the `model`
 * param — see #26. When `model` is set, `text` is optional: if omitted, the
 * model is updated without delivering a message.
 */
export async function executeTeamMessage(
  deps: ToolDeps,
  args: { to: string; text?: string; approve?: boolean; reject?: string; force?: boolean; model?: string; classification?: Partial<MissionClassificationConfig>; max_running_members?: number; auto_dispatch?: boolean; auto_scale?: boolean; provider_order?: string[]; provider_order_revision?: number; model_policy?: ModelPreferencePolicy | null; model_policy_revision?: number },
  sessionId: string,
): Promise<string> {
  const teamInfo = requireTeamMember(deps, sessionId)
  if (teamInfo.role === "member" && isExecutionOwned(deps.db, teamInfo.teamId) && args.to !== "lead") throw new Error("External execution workers may only message the lead")

  if (args.model_policy !== undefined || args.model_policy_revision !== undefined) {
    if (teamInfo.role !== "lead") throw new Error("Only the lead can change mission model policy")
    if (args.to !== "lead" || args.model || args.approve || args.reject || args.force || args.classification || args.provider_order !== undefined || args.provider_order_revision !== undefined || args.max_running_members !== undefined || args.auto_dispatch !== undefined || args.auto_scale !== undefined) throw new Error("Model policy updates must target lead and use a separate call from other controls")
    const policy = saveModelPolicy(deps.db, teamInfo.teamId, args.model_policy, deps.config.modelRouting, args.model_policy_revision)
    deps.scheduleCapacity?.(teamInfo.teamId)
    return formatModelPolicy(policy)
  }

  if (args.provider_order !== undefined || args.provider_order_revision !== undefined) {
    if (teamInfo.role !== "lead") throw new Error("Only the lead can change mission provider order")
    if (args.to !== "lead" || args.model || args.approve || args.reject || args.force || args.classification || args.max_running_members !== undefined || args.auto_dispatch !== undefined || args.auto_scale !== undefined) throw new Error("Provider order updates must target lead and use a separate call from other controls")
    const policy = saveProviderPolicy(deps.db, teamInfo.teamId, args.provider_order, args.provider_order_revision)
    deps.scheduleCapacity?.(teamInfo.teamId)
    return formatProviderPolicy(policy)
  }

  if (args.max_running_members !== undefined || args.auto_dispatch !== undefined || args.auto_scale !== undefined) {
    if (teamInfo.role !== "lead") throw new Error("Only the lead can change mission scheduling")
    if (args.to !== "lead" || args.model || args.approve || args.reject || args.force || args.classification) throw new Error("Scheduling updates must target lead and cannot include other control operations")
    if (args.max_running_members !== undefined) validateWorkerLimit(args.max_running_members)
    deps.db.transaction(() => {
      if (args.max_running_members !== undefined) setTeamCapacity(deps.db, teamInfo.teamId, args.max_running_members)
      if (args.auto_dispatch !== undefined) deps.db.run("UPDATE team SET auto_dispatch = ?, time_updated = ? WHERE id = ?", [Number(args.auto_dispatch), Date.now(), teamInfo.teamId])
      if (args.auto_scale !== undefined) deps.db.run("UPDATE team SET auto_scale = ?, time_updated = ? WHERE id = ?", [Number(args.auto_scale), Date.now(), teamInfo.teamId])
    })()
    void pumpTeam(deps, teamInfo.teamId).catch(error => log(`capacity:pump-failed ${String(error)}`))
    if (!args.text) return formatTeamCapacity(getTeamCapacity(deps.db, teamInfo.teamId, deps.config.maxActiveMembers))
  }

  if (args.classification !== undefined) {
    if (teamInfo.role !== "lead") throw new Error("Only the lead can update mission classification")
    if (args.to !== "lead" || args.model || args.approve || args.reject || args.force) throw new Error("Classification updates must target lead and cannot include other control operations")
    const frozen = getMissionClassification(deps.db, teamInfo.teamId, true)
    const inherited = frozen ? { ...frozen, mode: frozen.mode ?? (frozen.method === "manual" ? "off" as const : frozen.method) } : deps.config.classification
    const policy = await resolveMissionClassification({ ...deps, config: { ...deps.config, classification: inherited } }, args.classification)
    deps.db.transaction(() => {
      deps.db.run("UPDATE team SET classification_policy = ?, mission_mode = ?, mission_state = 'running', time_updated = ? WHERE id = ?", [JSON.stringify(policy), policy.missionMode ?? "supervised", Date.now(), teamInfo.teamId])
      deps.db.run("UPDATE team_task SET classification_status = CASE WHEN ? = 'manual' AND NOT (? = 1 AND task_type = 'x86') THEN 'not_required' ELSE 'pending' END, classification_result = NULL, classification_token = NULL, classification_until = NULL, classification_error = NULL, classification_attempts = 0 WHERE team_id = ? AND classification_status IN ('pending', 'running', 'blocked') AND status IN ('pending', 'blocked') AND assignee IS NULL", [policy.method, policy.specialized ? 1 : 0, teamInfo.teamId])
      sendMessage(deps.db, { teamId: teamInfo.teamId, from: "system", to: "lead", content: `Mission classification changed explicitly: ${policy.method}, tool=${policy.toolId || "none"}, helper=${policy.helperModel || "unset"}. ${policy.reason}` })
    })()
    void classifyBoardTasks(deps, teamInfo.teamId).catch(error => { log(`classification:drain-failed ${String(error)}`) })
    void pumpTeam(deps, teamInfo.teamId)
    if (!args.text) return `Mission classification updated: ${policy.reason}`
  }

  if (args.force && teamInfo.role !== "lead") {
    throw new Error("Only the lead can force-deliver a message to a completed teammate.")
  }

  const senderName = teamInfo.role === "lead" ? "lead" : (teamInfo.memberName ?? "unknown")

  // In-place model update (lead only). Handled before recipient session
  // resolution so it works even when the member is idle/not in the registry,
  // and rejects terminal members explicitly. See #26.
  if (args.model !== undefined) {
    if (teamInfo.role !== "lead") throw new Error("Only the lead can update a teammate's model.")
    const parsed = parseModelId(args.model)
    if (!parsed) throw new Error(`Invalid model "${args.model}" — expected "provider/model" format (e.g. "anthropic/claude-sonnet").`)
    const member = deps.db.query("SELECT status FROM team_member WHERE team_id = ? AND name = ?")
      .get(teamInfo.teamId, args.to) as { status: string } | null
    if (!member) throw new Error(`Teammate "${args.to}" not found in team "${teamInfo.teamName}".`)
    if (member.status === "shutdown" || member.status === "error") {
      throw new Error(`Teammate "${args.to}" is shut down — spawn a new teammate instead of updating the model.`)
    }
    deps.db.run(
      "UPDATE team_member SET model = ?, model_variant = NULL, model_routing = NULL, model_override = 1, time_updated = ? WHERE team_id = ? AND name = ?",
      [args.model, Date.now(), teamInfo.teamId, args.to],
    )
    log(`team_message:model-update to=${args.to} model=${args.model}`)

    // If there's no accompanying message, we're done — the new model applies
    // on the teammate's next natural delivery.
    if (!args.text) {
      return `Updated ${args.to}'s model to ${args.model}. It applies on their next turn.`
    }
  }

  if (args.text === undefined) {
    throw new Error("team_message requires either 'text' or 'model'.")
  }
  const text = args.text

  const recipientSessionId = resolveRecipientSession(deps.db, deps.registry, teamInfo.teamId, args.to)

  // If recipient not found, store the message for later delivery (they may not be spawned yet)
  // Reject approve/reject flags for unspawned recipients — plan approval requires the member to exist
  if (!recipientSessionId && args.to !== "lead") {
    if (args.approve || args.reject) {
      throw new Error(`Cannot approve/reject plan for "${args.to}" — they haven't been spawned yet.`)
    }
    sendMessage(deps.db, {
      teamId: teamInfo.teamId,
      from: senderName,
      to: args.to,
      content: text,
    })
    log(`team_message:queued from=${senderName} to=${args.to} (recipient not yet spawned)`)
    return `Message queued for ${args.to} — they haven't been spawned yet. It will be delivered when they join the team.`
  }
  if (!recipientSessionId) throw new Error(`Recipient "${args.to}" not found in team "${teamInfo.teamName}"`)

  // Handle plan approval/rejection
  let messageText = text
  if (args.approve || args.reject) {
    if (args.approve && args.reject) {
      throw new Error("Cannot both approve and reject a plan.")
    }
    if (teamInfo.role !== "lead") {
      throw new Error("Only the lead can approve or reject plans.")
    }
    const recipient = deps.db.query(
      "SELECT plan_approval FROM team_member WHERE team_id = ? AND name = ?"
    ).get(teamInfo.teamId, args.to) as { plan_approval: string } | null
    if (!recipient || recipient.plan_approval !== "pending") {
      throw new Error(`Recipient "${args.to}" is not in plan approval mode (plan_approval is not pending).`)
    }
    if (args.approve) {
      deps.db.run(
        "UPDATE team_member SET plan_approval = 'approved', time_updated = ? WHERE team_id = ? AND name = ?",
        [Date.now(), teamInfo.teamId, args.to]
      )
      messageText = `[Plan Approved] ${args.text}`
    } else {
      deps.db.run(
        "UPDATE team_member SET plan_approval = 'rejected', time_updated = ? WHERE team_id = ? AND name = ?",
        [Date.now(), teamInfo.teamId, args.to]
      )
      messageText = `[Plan Rejected: ${args.reject}] ${args.text}`
    }
  }

  const msgId = sendMessage(deps.db, {
    teamId: teamInfo.teamId,
    from: senderName,
    to: args.to,
    content: messageText,
  })

  const isToLead = args.to === "lead"

  // Lead-bound messages: store in DB, then wake the lead with a minimal promptAsync.
  // The system prompt transform delivers the actual message content on the lead's next turn.
  // This runs in the teammate's worktree instance — the event hook can't wake the lead
  // because session.idle events are scoped per-instance.
  if (isToLead) {
    log(`team_message:wake-lead from=${senderName} recipientSession=${recipientSessionId}`)
    deps.client.session.promptAsync({
      sessionID: recipientSessionId,
      parts: [{ type: "text", text: `[System: New team message from ${senderName}]` }],
      synthetic: true,
    }).catch((err) => {
      log(`team_message:wake-lead:failed from=${senderName} err=${err instanceof Error ? err.message : String(err)}`)
    })
    return `Message sent to ${args.to}.`
  }

  // Guard: skip promptAsync delivery to teammates who have already reported completion (issue #3),
  // unless the lead explicitly forces it. Forcing wakes the session; the natural busy transition
  // (handleSessionStatusEvent) resets the completion flag when the teammate next goes idle, the
  // same reset that already happens for a normal re-activation — this just gives the lead a way
  // to trigger it deliberately instead of it being unreachable once the guard is set.
  if (hasReportedCompletion(deps.db, teamInfo.teamId, args.to) && !args.force) {
    return `Message stored for ${args.to} (teammate has completed their task — message will not wake them). Pass force:true to re-activate them.`
  }

  // For member-to-member messages, fire-and-forget delivery is safe.
  // Deliver on the recipient's configured model, if any (#26).
  const deliveryText = `[Team message from ${senderName}]: ${messageText}`
  const recipientModel = getMemberPromptModel(deps.db, teamInfo.teamId, args.to)
  deps.client.session.promptAsync({
    sessionID: recipientSessionId,
    parts: [{ type: "text", text: deliveryText }],
    ...recipientModel,
    ensemble: { messageId: msgId, ...(args.force ? { force: true } : {}) },
  }).then(result => {
    if (!isCapacityQueued(result)) markDelivered(deps.db, msgId)
  }).catch((err) => {
    log(`team_message:deliver:failed to=${args.to} err=${err instanceof Error ? err.message : String(err)}`)
  })

  return `Message sent to ${args.to}.`
}
