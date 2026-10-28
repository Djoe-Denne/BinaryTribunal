import type { ExecutionClient } from "./client";
import type { Intent } from "./domain";
import { assertNativeREBindings, disasmWitnesses, validateNeighborhood, type EffectiveREPolicy, type NativeReadWitness } from "./re-policy";
import { canonical, hash, identityKey, normalizeEA, validateIdentity } from "./validation";

// Frozen generic wire. Publication keys are private to the bridge; IDs are opaque
// SHA256 identities correlated across snapshot and native author trace, not rehashed here.
export interface BulletinAuthor { executionId: string; sessionId: string; model: { providerID: string; id: string; variant?: string }; profile: string }
export interface BulletinReference { id: string; seq: number; channel: string; payloadSha256: string; schemaSha256: string; author: BulletinAuthor }
export interface BulletinMessage extends BulletinReference { payload: unknown }
export interface CommunicationTrace { published: BulletinReference[]; received: BulletinReference[]; cursor: number }
export interface BulletinSnapshot { version: 1; missionId: string; revision: number; messages: BulletinMessage[] }
export interface BulletinAuthorProof {
  author: BulletinAuthor; dossierSha256: string; rePolicySha256: string; neighborhoodSha256: string;
  nativeToolBindings: Array<{ tool: string; accesses: Array<{ action: string; resource: string }> }>;
  nativeToolBindingsSha256: string; communicationSha256: string;
}
export interface CommunicationAudit {
  version: 1; verifier: "ff8-harness.scoped-bulletin.v1"; status: "scope-verified";
  missionId: string; executionId: string; channel: string; schemaSha256: string; rePolicySha256: string;
  trace: CommunicationTrace; traceSha256: string; snapshot: BulletinSnapshot; snapshotSha256: string;
  authors: BulletinAuthorProof[]; nativeDisasmWitnesses: NativeReadWitness[];
  interpretation: "provisional-leads-only; not independent confirmation or scientific acceptance";
  evidenceHashes: "publisher-declared source fingerprints; not native ASM return attestations";
}
function check(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`RE communication audit: ${message}`); }
function record(value: unknown, label: string): Record<string, unknown> {
  check(value !== null && typeof value === "object" && !Array.isArray(value), `${label} object required`); return value as Record<string, unknown>;
}
function closed(value: unknown, keys: string[], label: string, optional: string[] = []): Record<string, unknown> {
  const r = record(value, label);
  check(keys.every(k => Object.hasOwn(r, k)) && Object.keys(r).every(k => keys.includes(k) || optional.includes(k)), `${label} exact fields required`); return r;
}
function text(value: unknown, label: string, max = 1024): asserts value is string { check(typeof value === "string" && value.trim().length > 0 && value.length <= max, `${label} bounded nonempty string required`); }
function sha(value: unknown, label: string): asserts value is string { check(typeof value === "string" && /^[a-f0-9]{64}$/.test(value), `${label} SHA256 required`); }
function integer(value: unknown, label: string, min = 0): asserts value is number { check(typeof value === "number" && Number.isSafeInteger(value) && value >= min, `${label} integer >= ${min} required`); }
function array(value: unknown, label: string, max: number, min = 0): asserts value is unknown[] { check(Array.isArray(value) && value.length >= min && value.length <= max, `${label} must contain ${min}..${max} items`); }
function author(value: unknown): BulletinAuthor {
  const a = closed(value, ["executionId", "sessionId", "model", "profile"], "author"), m = closed(a.model, ["providerID", "id"], "author model", ["variant"]);
  for (const key of ["executionId", "sessionId", "profile"]) text(a[key], `author.${key}`);
  text(m.providerID, "model.providerID"); text(m.id, "model.id"); if (Object.hasOwn(m, "variant")) text(m.variant, "model.variant");
  return structuredClone(a) as unknown as BulletinAuthor;
}
function reference(value: unknown, message = false): BulletinReference {
  const r = closed(value, ["id", "seq", "channel", "payloadSha256", "schemaSha256", "author", ...(message ? ["payload"] : [])], message ? "message" : "reference");
  sha(r.id, "message identity"); sha(r.payloadSha256, "payload digest"); sha(r.schemaSha256, "schema digest");
  integer(r.seq, "message sequence", 1); text(r.channel, "channel", 128);
  return { id: r.id, seq: r.seq, channel: r.channel, payloadSha256: r.payloadSha256, schemaSha256: r.schemaSha256, author: author(r.author) };
}
export function decodeBulletinSnapshot(value: unknown, missionId: string, channel?: string): BulletinSnapshot {
  const s = closed(value, ["version", "missionId", "revision", "messages"], "snapshot");
  check(s.version === 1 && s.missionId === missionId, "snapshot version/mission mismatch"); integer(s.revision, "snapshot revision", 1); array(s.messages, "snapshot messages", 1024);
  const ids = new Set<string>(); let previous: BulletinReference | undefined;
  const messages = s.messages.map(value => {
    const ref = reference(value, true), payload = (value as Record<string, unknown>).payload;
    check(channel === undefined || ref.channel === channel, "snapshot channel mismatch");
    check(!ids.has(ref.id), "duplicate snapshot message identity"); ids.add(ref.id);
    check(!previous || previous.channel < ref.channel || (previous.channel === ref.channel && previous.seq < ref.seq), "snapshot channel/sequence order mismatch"); previous = ref;
    const encoded = canonical(payload); check(Buffer.byteLength(encoded) <= 65536 && hash(encoded) === ref.payloadSha256, "payload hash/size mismatch");
    return { ...ref, payload: structuredClone(payload) };
  });
  return { version: 1, missionId, revision: s.revision, messages };
}
function trace(value: unknown, policy: EffectiveREPolicy): CommunicationTrace {
  const r = closed(value, ["published", "received", "cursor"], "communication trace"); integer(r.cursor, "trace cursor");
  const refs = (value: unknown, label: string, max: number) => {
    array(value, label, max); let seq = 0; const ids = new Set<string>();
    return value.map(v => { const ref = reference(v);
      check(ref.seq > seq && !ids.has(ref.id), `${label} order/duplicate mismatch`); seq = ref.seq; ids.add(ref.id);
      check(ref.channel === policy.communication!.channel && ref.schemaSha256 === policy.communication!.schemaSha256, `${label} channel/schema mismatch`); return ref;
    });
  };
  const published = refs(r.published, "published references", 256), received = refs(r.received, "received references", 1024);
  check(received.every(ref => ref.seq <= (r.cursor as number)), "received reference exceeds cursor");
  return { published, received, cursor: r.cursor };
}
function validatePayload(value: unknown, intent: Intent, policy: EffectiveREPolicy): void {
  const p = closed(value, ["sourceBinary", "kind", "status", "summary", "evidence", "affectedEAs", "questions"], "payload");
  closed(p.sourceBinary, ["sha256", "version"], "source binary");
  check(canonical(p.sourceBinary) === canonical(intent.binary), "source binary mismatch");
  check(typeof p.kind === "string" && ["observation", "hypothesis"].includes(p.kind) && p.status === "provisional", "only provisional observations/hypotheses are allowed");
  text(p.summary, "summary", 1800);
  const members = validateNeighborhood(intent).members.map(m => m.ea), disasm = policy.idaReadBindings.find(b => b.operation === "disasm")!;
  array(p.affectedEAs, "affected members", members.length, 1);
  check(new Set(p.affectedEAs).size === p.affectedEAs.length && p.affectedEAs.every(ea => typeof ea === "string" && members.includes(ea)), "affected member outside frozen neighborhood");
  array(p.questions, "questions", 32); p.questions.forEach(q => text(q, "question", 1800));
  array(p.evidence, "ASM source anchors", 32, 1);
  for (const raw of p.evidence) {
    const e = closed(raw, ["memberEA", "address", "asm", "tool", "resource", "sha256"], "ASM source anchor");
    check(p.affectedEAs.includes(e.memberEA), "ASM anchor must concern an affected frozen member");
    text(e.address, "ASM address", 18); normalizeEA(e.address); text(e.asm, "ASM excerpt", 1800);
    check(e.tool === disasm.tool && disasm.accesses.some(a => a.resource === e.resource), "ASM source binding mismatch");
    // This is a source declaration, not a measured hash of the native tool return.
    check(typeof e.sha256 === "string" && /^[a-fA-F0-9]{64}$/.test(e.sha256), "declared ASM source hash format mismatch");
  }
}
function inspectedExecution(value: unknown): Record<string, unknown> {
  const response = closed(value, ["version", "revision", "execution", "cursor"], "author inspect response");
  check(response.version === 1, "author inspect version mismatch"); integer(response.revision, "author inspect revision", 1); integer(response.cursor, "author inspect journal cursor");
  return record(response.execution, "public inspected author");
}
function authorProof(execution: Record<string, unknown>, expected: BulletinAuthor, intent: Intent, policy: EffectiveREPolicy, directory: string): { proof: BulletinAuthorProof; trace: CommunicationTrace } {
  check(execution.executionId === expected.executionId && execution.missionId === intent.missionId && execution.nativeSessionId === expected.sessionId, "author execution/mission/session mismatch");
  const native = record(execution.native, "native author"), selection = record(execution.selection, "author selection"), hashes = record(selection.hashes, "selection hashes");
  check(native.directory === directory && selection.directory === directory && native.profile === expected.profile && selection.profile === expected.profile && expected.profile === policy.profile
    && canonical(native.model) === canonical(expected.model) && canonical(selection.model) === canonical(expected.model), "native author tuple mismatch");
  check(canonical(selection.context) === canonical({ mode: "fresh" }) && selection.worktree === false, "author native fresh context mismatch");
  const d = record(execution.dossier, "author dossier"), input = record(d.inputs, "author inputs"), metadata = record(execution.metadata, "author metadata"), header = record(d.resultHeader, "author result header");
  const identity = validateIdentity(d.function, intent.binary);
  check(canonical(identity) === canonical(d.function) && validateNeighborhood(intent).members.some(m => identityKey(m) === identityKey(identity)), "author function outside frozen neighborhood");
  check(d.version === 3 && d.role === "R" && d.cycle === intent.cycle && d.fixture === intent.fixture && canonical(d.binary) === canonical(intent.binary)
    && input.role === "R" && input.cycle === intent.cycle && canonical(input.identity) === canonical(identity) && canonical(input.neighborhood) === canonical(intent.inputs.neighborhood), "author R/cycle/neighborhood mismatch");
  check(header.missionId === intent.missionId && header.executionId === expected.executionId && header.authorId === expected.executionId && header.cycle === intent.cycle
    && canonical(header.identity) === canonical(identity) && header.inputFingerprint === metadata.inputFingerprint && canonical(d.effectiveModel) === canonical(expected.model), "author dossier identity/model mismatch");
  sha(metadata.inputFingerprint, "author input fingerprint");
  const dossierSha256 = hash(JSON.stringify(JSON.parse(canonical(d)), null, 2) + "\n"), rePolicySha256 = hash(canonical(policy));
  check(metadata.dossierHash === dossierSha256 && canonical(d.rePolicy) === canonical(policy) && metadata.rePolicyHash === rePolicySha256 && metadata.roleInstructionsHash === policy.roleInstructionsHash, "author immutable dossier/policy hash mismatch");
  check(canonical(execution.communication) === canonical(policy.communication) && hashes.communication === hash(canonical(policy.communication)), "author communication contract/hash mismatch");
  assertNativeREBindings(policy, execution);
  const authorTrace = trace(execution.communicationTrace, policy);
  check(authorTrace.published.every(ref => canonical(ref.author) === canonical(expected)), "author publication tuple mismatch");
  return { trace: authorTrace, proof: { author: structuredClone(expected), dossierSha256, rePolicySha256, neighborhoodSha256: hash(canonical(input.neighborhood)),
    nativeToolBindings: structuredClone(selection.nativeToolBindings) as BulletinAuthorProof["nativeToolBindings"], nativeToolBindingsSha256: hashes.nativeToolBindings as string, communicationSha256: hashes.communication as string } };
}
/** Only public controller reads; worker records/provisional payloads never enter accepted science. */
export async function auditCommunication(client: ExecutionClient, intent: Intent, policy: EffectiveREPolicy, execution: Record<string, unknown>, directory: string): Promise<CommunicationAudit> {
  try {
    check(intent.role === "R" && policy.communication, "R communication contract required");
    const ownAuthor: BulletinAuthor = { executionId: intent.executionId, sessionId: String(execution.nativeSessionId), model: intent.requestedModel, profile: policy.profile };
    const own = authorProof(execution, ownAuthor, intent, policy, directory), ownTrace = own.trace;
    const snapshot = decodeBulletinSnapshot(await client.bulletinSnapshot(intent.missionId, policy.communication.channel), intent.missionId, policy.communication.channel);
    const head = snapshot.messages.at(-1)?.seq ?? 0; check(ownTrace.cursor <= head, "cursor exceeds snapshot head");
    const messages = new Map(snapshot.messages.map(message => [message.id, message]));
    for (const ref of [...ownTrace.published, ...ownTrace.received]) {
      const message = messages.get(ref.id); check(message, "trace references missing snapshot message");
      const { payload: _, ...nativeRef } = message; check(canonical(nativeRef) === canonical(ref), "trace/snapshot reference mismatch");
    }
    const authors = new Map<string, ReturnType<typeof authorProof>>([[ownAuthor.executionId, own]]), sessions = new Map([[ownAuthor.sessionId, ownAuthor.executionId]]);
    for (const message of snapshot.messages) {
      check(message.schemaSha256 === policy.communication.schemaSha256, "message schema mismatch"); validatePayload(message.payload, intent, policy);
      let proof = authors.get(message.author.executionId);
      if (!proof || (message.author.executionId === ownAuthor.executionId && !proof.trace.published.some(ref => ref.id === message.id))) {
        const response = await client.inspect(intent.missionId, message.author.executionId);
        proof = authorProof(inspectedExecution(response), message.author, intent, policy, directory);
        authors.set(message.author.executionId, proof);
      }
      check(canonical(proof.proof.author) === canonical(message.author), "message author tuple mismatch");
      check(!sessions.has(message.author.sessionId) || sessions.get(message.author.sessionId) === message.author.executionId, "different authors reused one native session"); sessions.set(message.author.sessionId, message.author.executionId);
      const { payload: _, ...ref } = message;
      check(proof.trace.published.some(publication => canonical(publication) === canonical(ref)), "snapshot message missing from native author's published trace");
    }
    return { version: 1, verifier: "ff8-harness.scoped-bulletin.v1", status: "scope-verified", missionId: intent.missionId, executionId: intent.executionId,
      channel: policy.communication.channel, schemaSha256: policy.communication.schemaSha256, rePolicySha256: hash(canonical(policy)),
      trace: structuredClone(ownTrace), traceSha256: hash(canonical(ownTrace)), snapshot, snapshotSha256: hash(canonical(snapshot)),
      authors: [...authors.values()].map(a => a.proof).sort((a, b) => a.author.executionId < b.author.executionId ? -1 : a.author.executionId > b.author.executionId ? 1 : 0),
      nativeDisasmWitnesses: structuredClone(disasmWitnesses(policy, execution, ownAuthor.sessionId)),
      interpretation: "provisional-leads-only; not independent confirmation or scientific acceptance",
      evidenceHashes: "publisher-declared source fingerprints; not native ASM return attestations" };
  } catch (error) { const message = error instanceof Error ? error.message : String(error); throw new Error(message.startsWith("RE communication audit:") ? message : `RE communication audit: ${message}`); }
}
/** Durable controller replay guard. A re-read may add older deliveries, but never erase them. */
export function assertAuditContinuation(previous: CommunicationAudit, next: CommunicationAudit): void {
  for (const key of ["version", "missionId", "executionId", "channel", "schemaSha256", "rePolicySha256"] as const) check(previous[key] === next[key], `replay ${key} changed`);
  check(next.snapshot.revision >= previous.snapshot.revision && next.trace.cursor >= previous.trace.cursor, "replay revision/cursor regressed");
  for (const kind of ["published", "received"] as const) for (const ref of previous.trace[kind]) check(next.trace[kind].some(current => canonical(current) === canonical(ref)), `replay ${kind} reference missing or changed`);
  check(next.snapshot.messages.length >= previous.snapshot.messages.length && previous.snapshot.messages.every((m, i) => canonical(m) === canonical(next.snapshot.messages[i])), "replay snapshot message changed or disappeared");
  for (const author of previous.authors) check(next.authors.some(current => canonical(current) === canonical(author)), "replay author provenance changed");
}
