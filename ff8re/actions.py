"""
FF8-specific action handlers for the binaryTribunal hypothesis runner.

These actions operate on FF8 battle memory structures (slots, pending
actions, phase flags, action globals) and are registered as a plugin
on the generic :class:`binaryTribunal.runner.HypothesisRunner`.
"""

from __future__ import annotations

from binaryTribunal.evidence import Evidence
from binaryTribunal.hypothesis import Step
from binaryTribunal.mcp_client import McpClient, McpToolError, McpTransportError
from binaryTribunal.runner import HypothesisRunner

from .battle_state import FF8BattleState


def register_ff8_actions(
    runner: HypothesisRunner,
    battle: FF8BattleState,
) -> None:
    """Register all FF8-specific action handlers on *runner*.

    This is the plugin entry point called by the FF8 CLI wrapper to
    extend the generic engine with FF8 battle domain actions.
    """

    # ------------------------------------------------------------------
    # snapshot_slot
    # ------------------------------------------------------------------
    def do_snapshot_slot(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        slot_id = step.slot
        snapshot = battle.snapshot_slot(slot_id)
        evidence.snapshots[step.label] = snapshot
        evidence.log(
            f"    {step.label}: slot {slot_id} HP={snapshot['current_hp']}")

    runner.register_action("snapshot_slot", do_snapshot_slot)

    # ------------------------------------------------------------------
    # write_pending_action
    # ------------------------------------------------------------------
    def do_write_pending_action(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        f = step.fields
        battle.write_pending_action(
            entry_index=step.slot,
            target_mask=f.get("target_mask", 0),
            attacker_slot=f.get("attacker_slot", 0),
            command_id=f.get("command_id", 0),
            command_arg=f.get("command_arg", 0),
            active=f.get("active", 1),
        )
        evidence.log(f"    Wrote pending action slot {step.slot}: {f}")

    runner.register_action("write_pending_action", do_write_pending_action)

    # ------------------------------------------------------------------
    # read_pending_action
    # ------------------------------------------------------------------
    def do_read_pending_action(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        entry = battle.read_pending_action(step.slot)
        evidence.snapshots[step.label] = entry
        evidence.log(f"    Pending action [{step.label}]: {entry}")

    runner.register_action("read_pending_action", do_read_pending_action)

    # ------------------------------------------------------------------
    # read_phase_flags
    # ------------------------------------------------------------------
    def do_read_phase_flags(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        flags = battle.read_phase_flags()
        evidence.snapshots[step.label] = flags
        evidence.log(f"    Phase flags [{step.label}]: {flags}")

    runner.register_action("read_phase_flags", do_read_phase_flags)

    # ------------------------------------------------------------------
    # read_action_globals
    # ------------------------------------------------------------------
    def do_read_action_globals(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        globs = battle.read_action_globals()
        evidence.snapshots[step.label] = globs
        evidence.log(f"    Action globals [{step.label}]: {globs}")

    runner.register_action("read_action_globals", do_read_action_globals)

    # ------------------------------------------------------------------
    # sync_to_battle_tick
    # ------------------------------------------------------------------
    def do_sync_to_battle_tick(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        """Synchronize to a known battle-tick boundary.

        Handles all three input states:
          - Game running:   the sync BP will fire on the next frame tick
          - Game paused:    continue resumes until the sync BP fires
          - Game at a BP:   continue resumes until the sync BP fires

        Uses the address from the step (default: FUNC_ATB_TICK) as the
        sync point.  After hitting it, the sync BP is removed so it
        doesn't interfere with subsequent execution.
        """
        sync_addr = step.resolved_address(constants)
        if sync_addr == 0:
            sync_addr = battle.FUNC_ATB_TICK
        timeout_ms = step.timeout_ms or 15000
        sync_label = step.label or "_sync_bp"

        evidence.log(f"    Syncing to battle tick @ {hex(sync_addr)} "
                     f"(timeout={timeout_ms}ms)")

        # Arm the sync breakpoint
        runner.mcp.add_breakpoint(sync_addr)
        runner._bp_addrs[sync_label] = sync_addr
        evidence.breakpoint_hits[sync_label] = False

        # Continue — works whether already paused or running
        timeout_s = timeout_ms / 1000.0
        try:
            runner.mcp.continue_exec(timeout=timeout_s)
        except (McpTransportError, McpToolError) as exc:
            evidence.log(f"    Sync continue error: {exc}")

        # Check if we landed on the sync BP
        try:
            regs = runner.mcp.get_gpregs()
            eip = runner.extract_eip(regs)
            if eip is not None:
                hit = (eip == sync_addr or eip == sync_addr + 1
                       or eip == sync_addr - 1)
                evidence.breakpoint_hits[sync_label] = hit
                evidence.log(f"    Sync landed at EIP={hex(eip)}, "
                             f"match={hit}")
            else:
                evidence.log("    Sync: could not determine EIP")
        except Exception as exc:
            evidence.log(f"    Sync register read error: {exc}")

        # Remove the sync BP so it doesn't keep firing
        try:
            runner.mcp.delete_breakpoint(sync_addr)
            runner._bp_addrs.pop(sync_label, None)
            evidence.log(f"    Sync BP removed @ {hex(sync_addr)}")
        except Exception as exc:
            evidence.log(f"    Sync BP cleanup error: {exc}")

    runner.register_action("sync_to_battle_tick", do_sync_to_battle_tick)

    # ------------------------------------------------------------------
    # set_enemy_hp_all_10000
    # ------------------------------------------------------------------
    def do_set_enemy_hp_all_10000(
        step: Step, constants: dict[str, int], evidence: Evidence,
    ) -> None:
        """Set current HP to 10,000 on live enemy slots."""
        hp = int(step.fields.get("hp", 10000))
        hp = max(0, min(0xFFFF, hp))
        touched: list[int] = []
        skipped: list[int] = []

        for slot_id in battle.iter_enemy_slots():
            if battle.is_enemy_slot_live(slot_id):
                battle.write_hp(slot_id, hp)
                touched.append(slot_id)
            else:
                skipped.append(slot_id)

        readback = {slot_id: battle.read_hp(slot_id) for slot_id in touched}
        evidence.snapshots[step.label or "set_enemy_hp_all_10000"] = {
            "hp": hp,
            "touched_slots": touched,
            "skipped_slots": skipped,
            "readback_hp": readback,
        }
        evidence.log(
            f"    Set enemy HP={hp} for live slots={touched}; skipped={skipped}"
        )

    runner.register_action("set_enemy_hp_all_10000", do_set_enemy_hp_all_10000)
