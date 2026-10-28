import { readFileSync } from 'node:fs';
import { fixtureJson, sha, bytes } from '../oracle/wire';
import type { IndependentlyLoadedSourcesV1 } from '../../../src/graph-execution-envelope';
// Mutable JSON fixture building is deliberately separate from candidate constructors.
// No source file below is evaluated: it is read exclusively as a pinned byte input.
export type Data = Record<string, any>;
export const fp = (v: unknown): string => sha(fixtureJson(v));
export function bd(kind: string, v: unknown) {
  const utf8 = fixtureJson(v);
  return { ref: { kind, encoding: 'utf8-json-v1' as const, byteLength: bytes(utf8).length, sha256: sha(utf8) }, utf8 };
}
export const value = (kind: string, v: unknown) => ({ kind, codec: 'l8-json-c14n-v1', sha256: fp({ kind, value: v }) });
export const decode = (d: { utf8: string }): Data => JSON.parse(d.utf8);
export function signed(v: Data): Data { const { fingerprint: ignored, ...rest } = v; return { ...rest, fingerprint: fp(rest) }; }
// Qualified wire identity for the supplied fixed families/policy/context; no planner invocation.
export function manualPlanId(snapshot: string, policy: Data, families: string[][], context?: Data): string {
  return 'plan:' + fp({ snapshot, policy, families, relationViewVersion: 'planner-relations-v1', relationPolicyVersion: 'planner-relation-policy-v2', ...(context ? { admissionAccountingVersion: 'planner-admission-accounting-v1', admissionBudgetContext: context } : {}) });
}
export function manualPreparation(knowledgeInput?: Data) {
  const rawSnapshot = readFileSync(new URL('../../../../../inputs/historical-snapshots/isolates.json', import.meta.url));
  if (rawSnapshot.length !== 3057 || sha(rawSnapshot) !== '658b438153ce8ecac1719457792334a3043efe09c1df1f264e511749e31dd1af') throw Error('historical DATA drift');
  const snapshot: Data = JSON.parse(rawSnapshot.toString('utf8'));
  const missionId: string = snapshot.missionId, lineageId = 'qa-lineage-é😀', partitionId = 'qa-partition';
  const node: Data = snapshot.nodes[0], artifact: Data = snapshot.binaryArtifacts[0];
  const h = 'a'.repeat(64), model = { providerID: 'qa', id: 'manual', variant: 'high' };
  const modelMap = Object.fromEntries(['explore','evaluate','A','B','R'].map(r => [r, { ...model }]));
  const frozen = knowledgeInput?.frozen ?? { version: 'qa-knowledge', fingerprint: h, leadsFingerprint: h, files: [] };
  const activation = { version: 'l8-activation-policy-source-v1', missionId, lineageId, maxActivationAttempts: 2, maxCandidateReplacements: 1 };
  const activationDoc = bd('l8-activation-policy-source-v1', activation);
  const rule = { path: 'C:/synthetic-qa/common-rule.json', sha256: activationDoc.ref.sha256, version: '1', provenance: 'synthetic independent QA', kind: 'rule', approvedForBlind: false };
  const fileBytes = { file: rule, bytes: { ref: { ...activationDoc.ref, kind: 'qa-rule-bytes', encoding: 'raw-v1' }, base64: Buffer.from(activationDoc.utf8).toString('base64') } };
  const config = { schemaVersion: 1, missionId, binary: { sha256: artifact.contentSha256, version: artifact.versionLabel }, fixture: true,
    evaluation: { method: 'qa-manual', version: '1', maxDifficulty: 1 }, subsetSize: 1, maxCycles: 2, stagnationLimit: 1,
    models: modelMap, knowledge: frozen, commonInputs: [rule], accessibleRules: [rule.path], requiredTools: [], outputDirectory: 'C:/synthetic-qa/out',
    retryPolicy: { maxAttempts: 1, retryDelayMs: 0, fixtureSynthetic: true } };
  const mission = { schemaVersion: 1, missionId, revision: 1, config, status: 'running', cycle: 1, stage: 'analyse', noProgressCycles: 0,
    candidates: [], cycles: [{ number: 1, knowledge: frozen, subset: [], frozen: true, groups: [] }], intents: [], reconciliations: [] };
  const template: Data = { version: 'l8-execution-template-v1', settings: { profiles: { A: 'qa', B: 'qa', R: 'qa' }, maxConcurrent: 2, familyTtlEvents: 4, maxAdmissionAttempts: 1, retryDelayMs: 0 },
    workers: [{ workerId: 'qa-worker', profile: 'qa', model: 'primary', tools: ['qa-read'], accountId: 'qa-account', slots: 2, cpu: 2, gpu: 2, budget: 20, available: true }],
    accounts: [{ accountId: 'qa-account', slots: 2, budget: 20 }] };
  const spec = { version: 'l8-execution-source-v1', templateFingerprint: fp(template), models: modelMap, binary: config.binary, outputDirectory: config.outputDirectory, rePolicy: null };
  const input = { version: 'l8-input-source-v1', commonInputs: [rule], cycleKnowledge: frozen, inputsByFunction: {}, accessibleRules: [rule.path], requiredTools: [], publicationsByFunction: {}, proposalPolicy: 'exact-validated-same-function-A+B-v1' };
  // Retain the selected independent DATA source's original bytes, not a reformatted echo.
  const snapshotDoc = { ref: { kind: 'graph-snapshot-v1', encoding: 'utf8-json-v1' as const, byteLength: rawSnapshot.length, sha256: sha(rawSnapshot) }, utf8: rawSnapshot.toString('utf8') };
  const missionDoc = bd('l8-source-mission-snapshot-v1', mission);
  const templateDoc = bd('l8-execution-template-v1', template), specDoc = bd('l8-execution-source-v1', spec), inputDoc = bd('l8-input-source-v1', input);
  const context = { version: 'planner-admission-context-v1', missionId, snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint, partitionId,
    knowledgeRevision: 1, missionConfigFingerprint: fp(config), executionSpecFingerprint: fp(spec), inputManifestFingerprint: fp(input), admissionCodecVersion: 'l8-fixture-admission-codec-v2', cycle: 1, budgetEpoch: 1 };
  const allocation = signed({ version: 'complete-admission-cap-v1', scope: 'one-immutable-run', executionProfile: 'one-execution-per-subintent-v1', context,
    capsByFunction: { [node.id]: { completeBodyMaxUtf8Bytes: { known: true, value: 100000 }, maxNewExecutionsPerRole: { A: 1, B: 1, R: 1 } } } });
  const policy: Data = { version: 'complete-admission-cap-v1:qa', estimationVersion: 'qa-estimate', partitionId, investigationKind: 'decompilation', artifactKind: 'reconciled_c', publicationLevel: 1,
    contextEnvelopeMaxUtf8Bytes: 1000000, totalContextBudgetUtf8Bytes: 1000000, maxSelectedUnits: 1, sccMaxFunctions: 1, sccMaxIterations: 1, sccCostBudget: 100,
    requirementsByFunction: {}, estimatesByFunction: { [node.id]: { version: 'qa-estimate', A: 1, B: 1, R: 1, validation: 1 } },
    resourcesByFunction: { [node.id]: { profiles: ['qa'], models: ['primary'], tools: ['qa-read'], accounts: ['qa-account'], slots: 1, cpu: 1, gpu: 0, budget: 1 } }, admissionBudgetMode: 'complete-admission-cap-v1', admissionBudget: allocation };
  const unitId = 'unit:' + fp({ investigationKind: 'decompilation', functionIds: [node.id] });
  const prefix = 'sub:' + fp({ unitId, functionId: node.id });
  const ownershipConflict = { id: 'conflict:' + fp({ unitId, functionId: node.id }), kind: 'owned_function', resourceKey: 'fn:' + node.id, withUnitId: null };
  // Membership is the manual singleton/no-edge fact, not a computed SCC oracle.
  // Only its qualified wire identifier convention is applied here.
  const component = { id: 'scc:' + fp([node.id]), functionIds: [node.id], exclusive: false, hasSelfLoop: false, selfLoopPreserved: true };
  const unit: Data = { schemaVersion: 1, unitId, snapshotId: snapshot.snapshotId, partitionId, knowledgeRevision: 1, ownedFunctionIds: [node.id], contextFunctionIds: [], investigationKind: 'decompilation', pipeline: '2+1',
    subIntents: ['A','B','R'].map(role => ({ subIntentId: prefix + ':' + role, functionId: node.id, role, harnessIdentity: { sha256: node.moduleSha256, version: artifact.versionLabel, ea: node.ea }, waitsForSubIntentIds: role === 'R' ? [prefix + ':A',prefix + ':B'] : [], sharesFamilyLease: true, outputDisjoint: true })),
    prerequisites: [], conflicts: [ownershipConflict], estimatedCost: { known: true, value: 3 }, requiredPublicationLevel: 1, state: 'PENDING' };
  const currentCap = { known: true, value: 100000 };
  const structuralBytes = bytes(fixtureJson({ snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint, policyVersion: policy.version, unit, functions: [node], requirements: [], dispensations: [] })).length;
  const plan = signed({ schemaVersion: 1, planId: manualPlanId(snapshot.normalizedFingerprint, policy, [[node.id]], context), missionId, snapshotId: snapshot.snapshotId, partitionId, knowledgeRevision: 1, units: [{ unitId, ownedFunctionIds: [node.id], contextFunctionIds: [], requiredPublicationLevel: 1, state: 'PENDING', contextEnvelopeUtf8Bytes: currentCap }], prerequisites: [], g1Edges: [], g2Conflicts: [ownershipConflict], g3Affinities: [], sccs: [component], selectedUnitIds: [unitId], decisions: [{ id: 'qa-decision', unitId, action: 'include', reason: 'independent singleton known-cap fixture' }],
    budgets: { unit: 'utf8-bytes', contextEnvelopeMaxUtf8Bytes: 1000000, countsSqliteLength: false, nativeLineCharLimit: 2000 }, policyVersion: policy.version, estimationVersion: policy.estimationVersion });
  const sidecar = signed({ schemaVersion: 1, policyVersion: policy.version, estimationVersion: policy.estimationVersion, planId: plan.planId, planFingerprint: plan.fingerprint,
    snapshotFingerprint: snapshot.normalizedFingerprint, knowledgeRevision: 1, policy, relationView: { version: 'planner-relations-v1', relations: [] }, requirementById: {}, dispensationById: {}, externalReceiptById: {},
    localOrders: { [unitId]: { sccIds: [component.id], functionIds: [node.id], recursive: false, maxIterations: 1, publication: 'whole-unit-only' } },
    estimatesByUnit: { [unitId]: { version: policy.estimationVersion, cost: { known: true, value: 3 }, modelCosts: {} } }, resourcesByUnit: { [unitId]: policy.resourcesByFunction[node.id] }, envelopeBytesByUnit: { [unitId]: 100000 },
    unitFingerprints: { [unitId]: fp(Object.fromEntries(Object.entries(unit).filter(([k]) => k !== 'state'))) }, diagnostics: [],
    admissionBudget: { version: 'planner-admission-accounting-v1', context, allocationFingerprint: allocation.fingerprint, byUnit: { [unitId]: { structuralEnvelopeUtf8Bytes: structuralBytes, admissionCapUtf8Bytes: currentCap, maxNewExecutions: { known: true, value: 3 }, totalAdmissionUtf8Bytes: { known: true, value: 300000 } } }, selectedTotalAdmissionUtf8Bytes: 300000 } });
  const planning = { plan, units: [unit], sidecar, diagnostics: [], binding: signed({ schemaVersion: 1, planFingerprint: plan.fingerprint, sidecarFingerprint: sidecar.fingerprint }) };
  const policyDoc = bd('l8-planning-policy-source-v1', policy), planningDoc = bd('l8-planning-source-v1', planning);
  const allocationDoc = bd('l8-admission-allocation-source-v1', allocation);
  const rootAccountId = value('l8-budget-root-v1', { missionId, lineageId, rootAllocationRef: allocationDoc.ref }).sha256;
  const grants = { version: 'l8-root-slot-grants-v1', missionId, lineageId, rootAccountId, rootAllocationRef: allocationDoc.ref, sourceSnapshotRef: snapshotDoc.ref, sourcePlanningRef: planningDoc.ref, sourcePolicyRef: policyDoc.ref,
    grants: ['A','B','R'].map(role => ({ slot: { rootAccountId, functionIdentity: { sha256: node.moduleSha256, version: artifact.versionLabel, ea: node.ea }, role, pass: 1 }, functionId: node.id, bodyCapUtf8Bytes: 1000000, reservedDebitUtf8Bytes: 1000000 })) };
  const models = { version: 'l8-root-model-bindings-v1', missionId, lineageId, rootAccountId, sourceExecutionTemplateRef: templateDoc.ref, sourceExecutionSpecRef: specDoc.ref,
    bindings: [{ label: 'primary', model }, { label: 'alias', model: { ...model } }], roleLabels: { explore: 'primary', evaluate: 'alias', A: 'primary', B: 'alias', R: 'primary' } };
  const grantsDoc = bd('l8-root-slot-grants-v1', grants), modelsDoc = bd('l8-root-model-bindings-v1', models);
  const root: Data = { allocation: allocationDoc, contextEnvelopeMaxUtf8Bytes: 1000000, totalContextBudgetUtf8Bytes: 1000000, maxSelectedUnits: 1, executionTemplate: templateDoc, rootSlotGrants: grantsDoc, rootModelBindings: modelsDoc };
  const rootDoc = bd('l8-root-limits-v1', root);
  const bootstrap = { snapshot: snapshotDoc, missionSnapshot: missionDoc, planning: planningDoc, planningPolicy: policyDoc, executionTemplate: templateDoc, executionSourceSpec: specDoc };
  const pins: Data = {}, codecBytes: Data[] = [];
  const paths: Record<string,string> = { envelopeCodec:'src/graph-execution-envelope.ts', fullSnapshotSchema:'schemas/graph-snapshot-v1.schema.json', fullSnapshotModule:'src/graph.ts', proposalCodec:'src/graph-transport.ts', plannerCodec:'src/planner.ts', inputCodec:'src/graph-pure-codecs.ts', admissionCodec:'src/graph-pure-codecs.ts', preparedTransportSchema:'schemas/l8-prepared-graph-v3.schema.json', adoptionTransportSchema:'schemas/l8-partition-adoption-v1.schema.json', domainModule:'src/domain.ts', validationModule:'src/validation.ts', plannerDerivedCodec:'src/planner-derived-codecs.ts', functionOrderCodec:'src/function-order.ts', plannerRelationCodec:'src/planner-relation-codecs.ts', sparseGraphCodec:'src/sparse-graph-codecs.ts', groupContextCodec:'src/group-context-codecs.ts', lineagePureCodec:'src/lineage-pure-codecs.ts', graphPersistenceErrorsCodec:'src/graph-persistence-errors.ts', rePolicyCodec:'src/re-policy.ts', transportCodec:'src/graph-transport.ts', bProjectionCodec:'src/graph-b-projection.ts', clusterTypesModule:'src/cluster.ts', groupTypesModule:'src/investigation-groups.ts', envelopeSchema:'schemas/l8-execution-envelope-v1.schema.json', clusterPartitionSchema:'schemas/cluster-partition-v1.schema.json', workUnitSchema:'schemas/work-unit-v1.schema.json', knowledgeCommitSchema:'schemas/knowledge-commit-v1.schema.json', missionPlanSchema:'schemas/mission-plan-v1.schema.json', investigationGroupSchema:'schemas/investigation-group-v1.schema.json' };
  const seen = new Set<string>();
  for (const [key,path] of Object.entries(paths)) {
    const b = readFileSync(new URL('../../../' + path, import.meta.url));
    const schema = key.endsWith('Schema');
    const ref = { kind: schema ? 'json-schema-source-v1' : 'typescript-source-v1', encoding: schema ? 'utf8-json-v1' : 'raw-v1', byteLength: b.length, sha256: sha(b) };
    pins[key] = ref;
    if (!seen.has(fp(ref))) { seen.add(fp(ref)); codecBytes.push({ ref, base64: b.toString('base64') }); }
  }
  const algorithm = 'qa-fixed', algorithmVersion = '1', configFingerprint = h;
  const contentId = fp({ algorithm, algorithmVersion, configFingerprint, memberIds: [node.id] });
  const community = { contentId, lineageId, parentContentIds: [], memberIds: [node.id], kernelIds: [node.id], externalContextIds: [], conductance: { known: false, value: null } };
  const partition = { schemaVersion: 1, partitionId, lineageId, parentLineageId: null, snapshotId: snapshot.snapshotId, snapshotFingerprint: snapshot.normalizedFingerprint, regime: 'A', algorithm, algorithmVersion, configFingerprint, seed: 'qa', communities: [community], modularity: { known: false, value: null }, maturity: 'structural', adopted: false };
  const group = { schemaVersion: 1, groupId: 'qa-group', partitionId, communityContentId: contentId, ownedFunctionIds: [node.id], contextFunctionIds: [], capabilityIds: [], granularity: 'function', estimatedCost: { known: true, value: 16 }, uncoveredIds: [], memberMaturity: [{ functionId: node.id, semanticMaturity: 'none' }] };
  const groupingConfig = { version: 'qa-group-policy', minSize: 1, maxSize: 1, maxContextFunctions: 1, smallPolicy: 'preserve-community', costSource: 'bytes', costPerUnit: 1, fixedCost: 0 };
  const projectionFingerprint = fp({ version: 'group-adjacency-v2', numericBinding: null, nodes: [node.id], adjacency: [[node.id, []]] });
  const contextBinding = { version: 'group-context-binding-v1', projectionSource: 'raw-active-control-relations', projectionFingerprint, hubSetFingerprint: fp([]), bindingFingerprint: '' };
  contextBinding.bindingFingerprint = fp({ version: contextBinding.version, projectionSource: contextBinding.projectionSource, projectionFingerprint, hubSetFingerprint: contextBinding.hubSetFingerprint, snapshotFingerprint: snapshot.normalizedFingerprint, partitionId, configFingerprint: fp(groupingConfig) });
  const groupMetrics = { version: 'group-metrics-v1', configFingerprint: fp(groupingConfig), partitionId, snapshotFingerprint: snapshot.normalizedFingerprint,
    ownerByFunctionId: { [node.id]: group.groupId }, uncoveredOwnerByFunctionId: {}, uncoveredCommunityByFunctionId: {}, sourceCommunitiesByGroupId: { [group.groupId]: [contentId] }, kernelIdsByGroupId: { [group.groupId]: [node.id] }, contextIdListUtf8BytesByGroupId: { [group.groupId]: 2 }, omittedContextIdsByGroupId: { [group.groupId]: [] }, omittedCommunityContextIds: { [contentId]: [] }, allCapabilityIdsByGroupId: { [group.groupId]: [] }, smallGroupIds: [], isolatedIds: [node.id], hubIds: [], nonCoveredIds: [], coverageStatus: 'complete', contextBinding,
    contentFingerprintByGroupId: { [group.groupId]: fp({ version: 'group-artifact-content-v1', contextBinding, group, sourceCommunities: [contentId], allCapabilityIds: [], omittedContextIds: [], omittedCommunityContextIds: [[contentId, []]] }) }, diagnostics: [] };
  const transport = { schemaVersion: 3, partition, groups: [group] };
  const groupSource = { groupsRef: value('l8-groups-value-v1', transport.groups), groupingConfig: bd('l8-grouping-config-source-v1', groupingConfig), groupingMetrics: bd('group-metrics-v1', groupMetrics),
    communityBinding: bd('l8-community-binding-v1', { version: 'l8-community-binding-v1', groups: [{ groupId: group.groupId, communityContentId: contentId, kernelIds: [node.id], parentContentIds: [], capabilityIds: [], memberMaturity: group.memberMaturity }] }),
    fullContextByGroup: bd('l8-full-context-by-group-v1', { version: 'l8-full-context-by-group-v1', groups: [{ groupId: group.groupId, functionIds: [node.id], nodes: snapshot.nodes, edges: [], objects: [], unresolved: [], capabilities: [] }] }),
    contextOmissions: bd('l8-context-omissions-v1', { version: 'l8-context-omissions-v1', byGroup: [{ groupId: group.groupId, functionIds: [] }], byCommunity: [{ communityContentId: contentId, functionIds: [] }] }) };
  const numericVersion = 'scaled-binary64-exact-leiden-interval-ppr-v1';
  const graph = { version: 'sparse-graph-numeric-v1', ids: [node.id], arcs: [], numericPolicy: { version: numericVersion, weightConvention: 'canonical-arcs-v1', bindingFingerprint: fp({ version: numericVersion, weightConvention: 'canonical-arcs-v1', projection: { ids: [node.id], arcs: [], out: [[]], incoming: [[]], outDegree: [0], inDegree: [0], totalWeight: 0 }, source: null }) } };
  const producerPolicy = { version: 'l8-projection-policy-source-v1', producer: 'projectStructural', fullGraphSnapshotRef: snapshotDoc.ref, numericPolicyVersion: numericVersion, weights: { version: 'qa-weights', direct: 1, tail: 1, indirectHigh: 1, indirectOther: 1, thunk: 1, dispatch: 1, rareData: 1, memoryWeak: 1, memoryWindow: 1, rareObjectMaxUsers: 2, importFactor: 1, utilityFactor: 1, hubThreshold: 1, hubFactor: 1 } };
  const numericSource = { version: 'l8-numeric-graph-source-v1', fullGraphSnapshotRef: snapshotDoc.ref, producerModuleRef: pins.clusterTypesModule, producerPolicy: bd('l8-projection-policy-source-v1', producerPolicy), graph: bd('sparse-graph-numeric-v1', graph), hubIds: [], summary: { version: numericVersion, weightConvention: 'canonical-arcs-v1', canonicalArcCount: 0, sourceArcCount: 0, retainedSourceArcCount: 0, sourceArcBudget: 1000000, budgetVersion: 'numeric-source-arc-budget-v1' } };
  const contextSources = { version: 'l8-public-context-sources-v1', partitionContext: bd('l8-numeric-graph-source-v1', numericSource), groupAdjacency: { kind: 'raw-active-control-relations' } };
  const knowledgeDoc = bd('l8-knowledge-source-v1', knowledgeInput ?? { version: 'l8-knowledge-source-v1', missionId, knowledgeRevision: 1, rootHash: h, frozen, files: [], facts: [], materializations: [], ledgerRevision: 1, ledgerDigest: h });
  const approvalsDoc = bd('l8-approval-source-v1', { version: 'l8-approval-source-v1', revision: 1, records: [] });
  const completeInput = { document: inputDoc, files: [fileBytes] };
  const body: Data = { version: 'l8-execution-envelope-v1', mode: 'offline-fixture-v1', missionId, generation: { lineageId, ordinal: 0, parentGenerationId: null }, authorizationKind: 'bootstrap-a-fixture-v1', contractPins: pins, preparedTransport: bd('l8-prepared-graph-v3', transport), adoptionIntent: null,
    sourceRefs: { partitionRef: value('l8-partition-value-v1', partition), groupsRef: value('l8-groups-value-v1', transport.groups), proposalEvidenceRef: null, lineageRef: null, partitionStoreDigest: fp(partition) }, fullGraphSnapshot: snapshotDoc, sourceMissionSnapshot: missionDoc, groupSource,
    admissionSource: { version: 'l8-admission-source-v2', admissionCodecVersion: 'l8-fixture-admission-codec-v2', cycle: 1, budgetEpoch: 1, executionTemplate: templateDoc, executionSourceSpec: specDoc, inputManifestSource: completeInput, context, allocation,
      sourceFingerprints: { executionTemplate: fp(template), executionSourceSpec: fp(spec), inputManifest: fp(input), context: fp(context), allocation: allocation.fingerprint }, knowledgeSource: knowledgeDoc, approvalSource: approvalsDoc, budgetLineage: { version: 'l8-budget-lineage-v1', rootAccountId, rootAllocationRef: allocationDoc.ref, rootLimits: rootDoc, epoch: 1 } },
    activationPolicy: { sourcePolicyRef: activationDoc.ref, maxActivationAttempts: 2, maxCandidateReplacements: 1 }, rootBootstrapSources: bootstrap, planningPolicy: policyDoc, contextSources,
    preparationObservationT0: { observedEventSequence: 0, parentGenerationId: null, headRevision: 0, activePlanRevision: null, sourceMissionRevision: 1, controllerFence: 1, knowledgeRevision: 1, knowledgeRootHash: knowledgeInput?.rootHash ?? h, knowledgeLedgerRevision: knowledgeInput?.ledgerRevision ?? 1, knowledgeLedgerDigest: knowledgeInput?.ledgerDigest ?? h, budgetLedgerRevision: 0, budgetLedgerDigest: h, spentBySlot: null, encumberedBySlot: null, inventoryRevision: null, inventoryDigest: null, partitionStoreDigest: fp(partition), authorityRecordRefs: null, proofRecordRefs: null, rootLimitsRef: rootDoc.ref, rootSlotGrantsRef: grantsDoc.ref, rootModelBindingsRef: modelsDoc.ref } };
  const independent = structuredClone({ fullGraphSnapshot: snapshotDoc, sourceMissionSnapshot: missionDoc, executionTemplate: templateDoc, executionSourceSpec: specDoc, inputManifestSource: completeInput, knowledgeSource: knowledgeDoc, approvalSource: approvalsDoc, contractPins: pins, parentEnvelope: null, rootLimits: rootDoc, rootBootstrapSources: bootstrap, planningPolicy: policyDoc, contextSources, groupingConfig: groupSource.groupingConfig, codecBytes }) as IndependentlyLoadedSourcesV1;
  return { body, independent, policy, planning, root, models, grants, template, spec, context, allocation, snapshot, node, group, partition, groupMetrics };
}
export type Manual = ReturnType<typeof manualPreparation>;
export function envelopeValue(f: Manual): Data {
  const body = { ...f.body, planning: bd('l8-planning-source-v1', f.planning) };
  return { ...body, fingerprint: value('l8-execution-envelope-v1', body).sha256 };
}
export function descendant(f: Manual): void {
  const parent = envelopeValue(f), generationId = 'l8gen:' + parent.fingerprint;
  f.independent.parentEnvelope = bd('l8-execution-envelope-v1', parent) as typeof f.independent.parentEnvelope;
  f.body.authorizationKind = 'transition-a-fixture-v1';
  f.body.generation = { ...f.body.generation, ordinal: 1, parentGenerationId: generationId };
  f.body.preparationObservationT0.parentGenerationId = generationId;
  f.body.preparationObservationT0.headRevision = 1;
}
export function refreshCurrent(f: Manual): void {
  const a = f.body.admissionSource;
  a.executionTemplate = bd('l8-execution-template-v1', f.template);
  f.spec.templateFingerprint = fp(f.template);
  a.executionSourceSpec = bd('l8-execution-source-v1', f.spec);
  f.context.executionSpecFingerprint = fp(f.spec);
  f.allocation = signed({ ...f.allocation, context: f.context });
  a.allocation = f.allocation; a.context = f.context;
  f.policy.admissionBudget = f.allocation;
  f.body.planningPolicy = bd('l8-planning-policy-source-v1', f.policy);
  a.sourceFingerprints = { ...a.sourceFingerprints, executionTemplate: fp(f.template), executionSourceSpec: fp(f.spec), context: fp(f.context), allocation: f.allocation.fingerprint };
  f.independent.executionTemplate = structuredClone(a.executionTemplate);
  f.independent.executionSourceSpec = structuredClone(a.executionSourceSpec);
  f.independent.planningPolicy = structuredClone(f.body.planningPolicy);
  f.planning.plan = signed({ ...f.planning.plan, planId: manualPlanId(f.snapshot.normalizedFingerprint, f.policy, [[f.node.id]], f.context) });
  f.planning.sidecar = signed({ ...f.planning.sidecar, planId: f.planning.plan.planId, planFingerprint: f.planning.plan.fingerprint, policy: f.policy, admissionBudget: { ...f.planning.sidecar.admissionBudget, context: f.context, allocationFingerprint: f.allocation.fingerprint } });
  f.planning.binding = signed({ schemaVersion: 1, planFingerprint: f.planning.plan.fingerprint, sidecarFingerprint: f.planning.sidecar.fingerprint });
}
