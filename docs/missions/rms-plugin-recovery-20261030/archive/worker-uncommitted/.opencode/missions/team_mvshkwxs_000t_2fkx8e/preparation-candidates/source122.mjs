/** Candidate for parent inspection only. Not imported, executed or validated.
 * New SOURCE FIXTURE records only; no native authority, observations or effects.
 * Materializes the proposal Part1 + 2A/2B/2C and its explicit cfg guards.
 */
import { resolve, isAbsolute } from "node:path";
import { buildGraphSnapshot } from "../../../../tools/ff8-harness/src/graph-normalize.ts";
import { clusterGraph, exportSparseGraph, NUMERIC_POLICY_VERSION } from "../../../../tools/ff8-harness/src/cluster.ts";
import { buildInvestigationGroups, DEFAULT_GROUP_CONFIG } from "../../../../tools/ff8-harness/src/investigation-groups.ts";
import { inspectPreparedGraphV3 } from "../../../../tools/ff8-harness/src/graph-transport.ts";
import { projectExecutionSourcesForL5V1 } from "../../../../tools/ff8-harness/src/graph-b-projection.ts";
import { planMission } from "../../../../tools/ff8-harness/src/planner.ts";
import { makeBoundDocumentV1 as doc, executionValueRefV1 as valueRef,
  bindExecutionPreparationV1, assertExecutionJsonV1 } from "../../../../tools/ff8-harness/src/graph-execution-envelope.ts";
import { canonical, hash, fingerprint as fp, exactPath } from "../../../../tools/ff8-harness/src/validation.ts";
const need = (v, why) => { if (!v) throw new Error(`HOLD: ${why}`); };
const take = r => { need(r.ok, (r.reasons || ["source refused"]).join("; ")); return r.value; };
const utf8Length = s => new TextEncoder().encode(s).length;
const hex = n => `0x${BigInt(n).toString(16).toUpperCase()}`;

export function source122(Dtext, Qtext, contractText, cfg, codecs) {
  assertExecutionJsonV1({ Dtext, Qtext, contractText, cfg, codecs });
  need(utf8Length(Dtext) === 2974 && hash(Dtext) ===
    "158ab93e2724a982cfb8204069dadcb1317a07e8ab2ad6bbdf01d0cda43ef989", "decision bytes");
  need(utf8Length(Qtext) === 1206 && hash(Qtext) ===
    "d447d28b89e3dec58db1e35f1f550d1921be9bbea66e4eaa4d3b24b841e1274c", "model bytes");
  const D = JSON.parse(Dtext), Q = JSON.parse(Qtext), hd = hash(Dtext), hq = hash(Qtext);
  need(Q.decision.sha256 === hd && D.fixture === true && Q.fixture === true
    && D.nativeAuthority.status === "HOLD" && Q.nativeAuthority === "NONE", "fixture domains");
  need(contractText.length === 2 && D.corpus.every((c, i) => hash(contractText[i]) === c.sha256), "corpus bytes");
  for (const k of ["repoRoot", "outputDirectory", "activationRulePath", "template",
    "lifecycle", "scc", "activation", "roleLabel"]) need(Object.hasOwn(cfg, k), `cfg.${k}`);
  for (const [name, keys] of [
    ["activation", ["maxActivationAttempts", "maxCandidateReplacements"]],
    ["lifecycle", ["evaluation", "maxCycles", "stagnationLimit", "retryPolicy"]],
    ["scc", ["maxFunctions", "maxIterations", "costBudget"]]
  ]) {
    need(cfg[name] !== null && typeof cfg[name] === "object" && !Array.isArray(cfg[name]), `cfg.${name}`);
    for (const key of keys) need(Object.hasOwn(cfg[name], key), `cfg.${name}.${key}`);
  }
  need(cfg.lifecycle.retryPolicy !== null && typeof cfg.lifecycle.retryPolicy === "object"
    && ["maxAttempts", "retryDelayMs", "fixtureSynthetic"].every(k => Object.hasOwn(cfg.lifecycle.retryPolicy, k))
    && cfg.lifecycle.retryPolicy.fixtureSynthetic === true, "explicit fixture retry declaration");
  need(isAbsolute(cfg.repoRoot), "repoRoot absolute");
  exactPath(cfg.outputDirectory); exactPath(cfg.activationRulePath);
  const mid = `rms-qualification-${hq.slice(0, 16)}`, lid = `qualification:${hd}`;
  const sid = `qualification-snapshot:${hq}`, V = D.coordinates.versionLabel;
  const base = hex(D.coordinates.imageBase), rva = hex(D.coordinates.rva), ea = hex(D.coordinates.ea);
  need(D.coordinates.ea === D.coordinates.imageBase + D.coordinates.rva
    && Q.function.ea === D.coordinates.ea && Q.function.rva === D.coordinates.rva
    && Q.function.imageBase === D.coordinates.imageBase && Q.relations.length === 0, "ratified coordinates/model");
  const fid = `${hq}:${rva}`, identity = { sha256: hq, version: V, ea };
  const unknown = () => ({ known: false, value: null });
  const artifact = { schemaVersion: 1, artifactId: `qualification-model:${hq}`,
    moduleName: D.coordinates.moduleName, contentSha256: hq, versionLabel: V,
    format: D.coordinates.format, architecture: D.coordinates.architecture, imageBase: base,
    idbIdentity: "", sections: [], provenance: { moduleSha256: hq, siteRva: null,
      siteKind: "extractor", xrefType: "none", source: Q.decision.path,
      sourceVersion: D.version, sourceHash: hd, evidenceSha256: hq },
    analysisVersion: "declared-fixture-model-only", extractorVersion: Q.version };
  const node = { schemaVersion: 1, id: fid, moduleSha256: hq, rva, ea, imageBase: base,
    name: Q.function.name, observedDescription: D.observationMeaning, boundaries: [],
    sizeBytes: unknown(), instructionCount: unknown(), basicBlockCount: unknown(),
    functionClass: "internal", status: "observed", semanticMaturity: "none",
    analysisRefs: [Q.decision.path], byteAgreement: "unknown", admissibleAsOracle: false,
    byteDivergence: { known: false, peMismatchByteCount: null, frozenSha256: null, peSha256: null } };
  const { snapshot } = buildGraphSnapshot({ missionId: mid, snapshotId: sid, artifacts: [artifact],
    nodes: [node], edges: [], objects: [], unresolved: [], capabilities: [], knowledgeRevision: 0,
    scopeDescription: "Complete declared one-function fixture model only; no machine/program coverage",
    coverage: { status: "partial", uncoveredReason: "modèle déclaratif fixture ; aucune extraction native de tails ni couverture de programme", tailsIterated: false, selfLoopsPreserved: true },
    toolVersions: { extractor: "parent-declaration-record", extractorHash: hd, normalizer: "buildGraphSnapshot@782ec396" },
    configFingerprint: fp({ decision: hd, model: hq }) });
  const clustered = clusterGraph(snapshot, { algorithm: "hub-baseline", maxCommunitySize: 1 });
  const gc = structuredClone(DEFAULT_GROUP_CONFIG);
  const grouped = buildInvestigationGroups(snapshot, clustered.partition, gc, { hubIds: clustered.metrics.hubIds });
  const transport = { schemaVersion: 3, partition: clustered.partition, groups: grouped.groups };
  const inspection = inspectPreparedGraphV3(transport);
  need(inspection.wellFormed && inspection.coherent && grouped.groups.length === 1, "transport A");
  const community = transport.partition.communities[0], group = grouped.groups[0];
  need(transport.partition.regime === "A" && community.memberIds.length === 1
    && community.memberIds[0] === fid && group.ownedFunctionIds.length === 1
    && group.ownedFunctionIds[0] === fid && group.contextFunctionIds.length === 0, "singleton model ownership");
  const grouping = { groupingConfig: gc, groupingMetrics: grouped.metrics,
    communityBinding: { version: "l8-community-binding-v1", groups: [{ groupId: group.groupId,
      communityContentId: community.contentId, kernelIds: community.kernelIds, parentContentIds: community.parentContentIds,
      capabilityIds: grouped.metrics.allCapabilityIdsByGroupId[group.groupId], memberMaturity: group.memberMaturity }] },
    fullContextByGroup: { version: "l8-full-context-by-group-v1", groups: [{ groupId: group.groupId,
      functionIds: [fid], nodes: snapshot.nodes, edges: [], objects: [], unresolved: [], capabilities: [] }] },
    contextOmissions: { version: "l8-context-omissions-v1",
      byGroup: [{ groupId: group.groupId, functionIds: grouped.metrics.omittedContextIdsByGroupId[group.groupId] }],
      byCommunity: [{ communityContentId: community.contentId, functionIds: grouped.metrics.omittedCommunityContextIds[community.contentId] }] } };
  const snapshotDoc = doc("graph-snapshot-v1", snapshot);
  const groupSource = { groupsRef: valueRef("l8-groups-value-v1", transport.groups),
    groupingConfig: doc("l8-grouping-config-source-v1", gc), groupingMetrics: doc("group-metrics-v1", grouped.metrics),
    communityBinding: doc("l8-community-binding-v1", grouping.communityBinding),
    fullContextByGroup: doc("l8-full-context-by-group-v1", grouping.fullContextByGroup),
    contextOmissions: doc("l8-context-omissions-v1", grouping.contextOmissions) };
  need(codecs.contractPins && Array.isArray(codecs.codecBytes), "qualified codec bundle");
  const numeric = doc("l8-numeric-graph-source-v1", { version: "l8-numeric-graph-source-v1",
    fullGraphSnapshotRef: snapshotDoc.ref, producerModuleRef: codecs.contractPins.clusterTypesModule,
    producerPolicy: doc("l8-projection-policy-source-v1", { version: "l8-projection-policy-source-v1",
      producer: "projectStructural", fullGraphSnapshotRef: snapshotDoc.ref,
      numericPolicyVersion: NUMERIC_POLICY_VERSION, weights: clustered.projection.weights }),
    graph: doc("sparse-graph-numeric-v1", exportSparseGraph(clustered.projection.graph)),
    hubIds: clustered.metrics.hubIds, summary: clustered.metrics.numericGraph });
  const contextSources = { version: "l8-public-context-sources-v1",
    partitionContext: numeric, groupAdjacency: { kind: "raw-active-control-relations" } };
  const activation = doc("l8-activation-policy-source-v1", { version: "l8-activation-policy-source-v1",
    missionId: mid, lineageId: lid, maxActivationAttempts: cfg.activation.maxActivationAttempts,
    maxCandidateReplacements: cfg.activation.maxCandidateReplacements });
  const entry = (path, utf8, provenance) => { exactPath(path); const h = hash(utf8);
    return { file: { path, sha256: h, version: `sha256:${h}`, provenance, kind: "rule", approvedForBlind: false },
      bytes: { ref: { kind: "l8-artifact-bytes-v1", encoding: "raw-v1", byteLength: utf8Length(utf8), sha256: h },
        base64: Buffer.from(utf8, "utf8").toString("base64") } }; };
  const entries = D.corpus.map((c, i) => entry(resolve(cfg.repoRoot, c.path), contractText[i], c.status));
  const controlEntry = entry(cfg.activationRulePath, activation.utf8, "parent-fixture-control-policy");
  entries.push(controlEntry);
  need(new Set(entries.map(e => e.file.path.toLowerCase())).size === entries.length, "distinct rule paths");
  const commonInputs = entries.map(e => e.file), accessibleRules = commonInputs.map(f => f.path);
  const frozen = { version: "qualification-fixture-empty-knowledge-v1", files: [],
    fingerprint: fp({ domain: "qualification-fixture-empty-knowledge", missionId: mid, files: [] }),
    leadsFingerprint: fp({ domain: "qualification-fixture-empty-leads", missionId: mid, leads: [] }) };
  const template = structuredClone(cfg.template);
  need(template.version === "l8-execution-template-v1"
    && canonical(template.settings.profiles) === canonical(D.profiles)
    && template.workers.length > 0
    && template.workers.every(w => w.profile === D.profiles.A && Array.isArray(w.tools) && w.tools.length === 0), "explicit source template");
  const labels = [...new Set(template.workers.map(w => w.model))];
  need(labels.includes(cfg.roleLabel), "explicit role model label");
  const models = Object.fromEntries(D.modelRoles.map(role => [role, structuredClone(D.model)]));
  const binary = { sha256: hq, version: V };
  const config = { schemaVersion: 1, missionId: mid, binary, fixture: true,
    evaluation: cfg.lifecycle.evaluation, maxCycles: cfg.lifecycle.maxCycles,
    stagnationLimit: cfg.lifecycle.stagnationLimit, subsetSize: 1,
    retryPolicy: cfg.lifecycle.retryPolicy, models, knowledge: frozen, commonInputs,
    accessibleRules, requiredTools: [], outputDirectory: cfg.outputDirectory };
  const mission = { schemaVersion: 1, missionId: mid, revision: 0, config, status: "running",
    cycle: 1, stage: "analyse", noProgressCycles: 0, candidates: [],
    cycles: [{ number: 1, knowledge: frozen, subset: [], frozen: true, groups: [] }], intents: [], reconciliations: [] };
  const spec = { version: "l8-execution-source-v1", templateFingerprint: fp(template),
    models, binary, outputDirectory: config.outputDirectory, rePolicy: null };
  const inputs = { version: "l8-input-source-v1", commonInputs, cycleKnowledge: frozen,
    inputsByFunction: {}, accessibleRules, requiredTools: [], publicationsByFunction: {},
    proposalPolicy: "exact-validated-same-function-A+B-v1" };
  const templateDoc = doc("l8-execution-template-v1", template), specDoc = doc("l8-execution-source-v1", spec);
  const missionDoc = doc("l8-source-mission-snapshot-v1", mission);
  const manifest = { document: doc("l8-input-source-v1", inputs), files: entries };
  const context = { version: "planner-admission-context-v1", missionId: mid, snapshotId: sid,
    snapshotFingerprint: snapshot.normalizedFingerprint, partitionId: transport.partition.partitionId,
    knowledgeRevision: 0, missionConfigFingerprint: fp(config), executionSpecFingerprint: fp(spec),
    inputManifestFingerprint: fp(inputs), admissionCodecVersion: "l8-fixture-admission-codec-v2", cycle: 1, budgetEpoch: 1 };
  const B = D.proposedSourceBounds, cap = B.perRoleBodyCapUtf8Bytes.A;
  need(B.status === "FIXTURE_PLANNING_CEILINGS_NOT_NATIVE_ACQUISITIONS"
    && B.maxSelectedUnits === 1 && ["A", "B", "R"].every(r => B.perRoleBodyCapUtf8Bytes[r] === cap)
    && cap === 262144 && B.aggregateRoleBodyCapUtf8Bytes === 3 * cap, "fixed source ceilings122");
  const allocationBody = { version: "complete-admission-cap-v1", scope: "one-immutable-run",
    executionProfile: "one-execution-per-subintent-v1", context, capsByFunction: {
      [fid]: { completeBodyMaxUtf8Bytes: { known: true, value: cap }, maxNewExecutionsPerRole: { A: 1, B: 1, R: 1 } } } };
  const allocation = { ...allocationBody, fingerprint: fp(allocationBody) };
  const policy = { version: "complete-admission-cap-v1:q122", estimationVersion: "declared-fixture-model-only",
    partitionId: context.partitionId, investigationKind: "structural", artifactKind: "structural_fact", publicationLevel: 1,
    contextEnvelopeMaxUtf8Bytes: cap, totalContextBudgetUtf8Bytes: B.aggregateRoleBodyCapUtf8Bytes,
    maxSelectedUnits: B.maxSelectedUnits, sccMaxFunctions: cfg.scc.maxFunctions,
    sccMaxIterations: cfg.scc.maxIterations, sccCostBudget: cfg.scc.costBudget,
    requirementsByFunction: {}, estimatesByFunction: {}, resourcesByFunction: {},
    admissionBudgetMode: "complete-admission-cap-v1", admissionBudget: allocation };
  const projected = take(projectExecutionSourcesForL5V1(snapshot, transport, grouping, policy, context));
  const planning = planMission(structuredClone(projected.graph), structuredClone(projected.groups), policy, context);
  need(planning.plan.selectedUnitIds.length === 1, "one selected fixture unit");
  const unit = planning.units.find(u => u.unitId === planning.plan.selectedUnitIds[0]);
  const budget = planning.sidecar.admissionBudget?.byUnit[unit?.unitId];
  need(unit && unit.ownedFunctionIds.length === 1 && unit.ownedFunctionIds[0] === fid
    && unit.subIntents.length === 3 && budget?.admissionCapUtf8Bytes.known === true
    && budget.admissionCapUtf8Bytes.value === cap && budget.maxNewExecutions.known === true
    && budget.maxNewExecutions.value === 3 && budget.totalAdmissionUtf8Bytes.known === true
    && budget.totalAdmissionUtf8Bytes.value === B.aggregateRoleBodyCapUtf8Bytes
    && planning.sidecar.admissionBudget.selectedTotalAdmissionUtf8Bytes === B.aggregateRoleBodyCapUtf8Bytes,
    "Cunit=262144/N=3/total=786432; never enlarge");
  const allocationDoc = doc("l8-admission-allocation-source-v1", allocation);
  const rootId = valueRef("l8-budget-root-v1", { missionId: mid, lineageId: lid, rootAllocationRef: allocationDoc.ref }).sha256;
  const planningDoc = doc("l8-planning-source-v1", planning), policyDoc = doc("l8-planning-policy-source-v1", policy);
  const slotGrants = doc("l8-root-slot-grants-v1", { version: "l8-root-slot-grants-v1",
    missionId: mid, lineageId: lid, rootAccountId: rootId, rootAllocationRef: allocationDoc.ref,
    sourceSnapshotRef: snapshotDoc.ref, sourcePlanningRef: planningDoc.ref, sourcePolicyRef: policyDoc.ref,
    grants: unit.subIntents.map(sub => ({ slot: { rootAccountId: rootId, functionIdentity: sub.harnessIdentity,
      role: sub.role, pass: 1 }, functionId: sub.functionId, bodyCapUtf8Bytes: cap, reservedDebitUtf8Bytes: cap })) });
  const modelBindings = doc("l8-root-model-bindings-v1", { version: "l8-root-model-bindings-v1",
    missionId: mid, lineageId: lid, rootAccountId: rootId, sourceExecutionTemplateRef: templateDoc.ref,
    sourceExecutionSpecRef: specDoc.ref, bindings: labels.map(label => ({ label, model: D.model })),
    roleLabels: Object.fromEntries(D.modelRoles.map(role => [role, cfg.roleLabel])) });
  const rootLimits = doc("l8-root-limits-v1", { allocation: allocationDoc,
    contextEnvelopeMaxUtf8Bytes: cap, totalContextBudgetUtf8Bytes: B.aggregateRoleBodyCapUtf8Bytes,
    maxSelectedUnits: B.maxSelectedUnits, executionTemplate: templateDoc, rootSlotGrants: slotGrants, rootModelBindings: modelBindings });
  const bootstrap = { snapshot: snapshotDoc, missionSnapshot: missionDoc, planning: planningDoc,
    planningPolicy: policyDoc, executionTemplate: templateDoc, executionSourceSpec: specDoc };
  const knowledge = doc("l8-knowledge-source-v1", { version: "l8-knowledge-source-v1", missionId: mid,
    knowledgeRevision: 0, rootHash: frozen.fingerprint, frozen, files: [], facts: [], materializations: [],
    ledgerRevision: 0, ledgerDigest: fp({ domain: "new-qualification-fixture-knowledge-ledger", entries: [] }) });
  const approvals = doc("l8-approval-source-v1", { version: "l8-approval-source-v1", revision: 0, records: [] });
  const body = { version: "l8-execution-envelope-v1", mode: "offline-fixture-v1", missionId: mid,
    generation: { lineageId: lid, ordinal: 0, parentGenerationId: null }, contractPins: codecs.contractPins,
    preparedTransport: doc("l8-prepared-graph-v3", transport), fullGraphSnapshot: snapshotDoc, sourceMissionSnapshot: missionDoc, groupSource,
    admissionSource: { version: "l8-admission-source-v2", admissionCodecVersion: "l8-fixture-admission-codec-v2",
      cycle: 1, budgetEpoch: 1, executionTemplate: templateDoc, executionSourceSpec: specDoc, inputManifestSource: manifest, context, allocation,
      sourceFingerprints: { executionTemplate: fp(template), executionSourceSpec: fp(spec), inputManifest: fp(inputs), context: fp(context), allocation: allocation.fingerprint },
      knowledgeSource: knowledge, approvalSource: approvals, budgetLineage: { version: "l8-budget-lineage-v1",
        rootAccountId: rootId, rootAllocationRef: allocationDoc.ref, rootLimits, epoch: 1 } },
    activationPolicy: { sourcePolicyRef: activation.ref, maxActivationAttempts: cfg.activation.maxActivationAttempts, maxCandidateReplacements: cfg.activation.maxCandidateReplacements },
    preparationObservationT0: { observedEventSequence: 0, parentGenerationId: null, headRevision: 0, activePlanRevision: null,
      sourceMissionRevision: 0, controllerFence: 0, knowledgeRevision: 0, knowledgeRootHash: frozen.fingerprint,
      knowledgeLedgerRevision: 0, knowledgeLedgerDigest: JSON.parse(knowledge.utf8).ledgerDigest, budgetLedgerRevision: 0,
      budgetLedgerDigest: fp({ domain: "new-qualification-fixture-budget-ledger", entries: [] }), spentBySlot: [], encumberedBySlot: [],
      inventoryRevision: null, inventoryDigest: null, partitionStoreDigest: fp(transport.partition), authorityRecordRefs: [], proofRecordRefs: [],
      rootLimitsRef: rootLimits.ref, rootSlotGrantsRef: slotGrants.ref, rootModelBindingsRef: modelBindings.ref },
    rootBootstrapSources: bootstrap, planningPolicy: policyDoc, contextSources, adoptionIntent: null, authorizationKind: "bootstrap-a-fixture-v1",
    sourceRefs: { partitionRef: valueRef("l8-partition-value-v1", transport.partition), groupsRef: groupSource.groupsRef,
      proposalEvidenceRef: null, lineageRef: null, partitionStoreDigest: fp(transport.partition) } };
  const independentSources = { fullGraphSnapshot: snapshotDoc, sourceMissionSnapshot: missionDoc,
    executionTemplate: templateDoc, executionSourceSpec: specDoc, inputManifestSource: manifest, knowledgeSource: knowledge,
    approvalSource: approvals, contractPins: codecs.contractPins, parentEnvelope: null, rootLimits, rootBootstrapSources: bootstrap,
    planningPolicy: policyDoc, contextSources, groupingConfig: groupSource.groupingConfig, codecBytes: codecs.codecBytes };
  take(bindExecutionPreparationV1(body, independentSources, policy));
  return { status: "SOURCE_FIXTURE_DATA_ONLY_NATIVE_HOLD", snapshot, transport, grouping,
    preparation: { body, independentSources, policy }, controlRule: { utf8: activation.utf8, entry: controlEntry },
    qualificationCorpus: D.corpus.map((c, i) => ({ ...c, absolutePath: resolve(cfg.repoRoot, c.path), utf8: contractText[i] })), identity };
}
