/** Envelope DATA only; source contract 68bc26b7. Never execution evidence. */
import { canonical, hash } from "./validation";
import type { AtRestImageV1 } from "./graph-native-at-rest";

export const NATIVE_OBSERVATION_LIMITS_V1 = Object.freeze({ timeoutMs: 10000, bytes: 262144, frames: 1024, frameBytes: 65536 });
export interface NativeObservationTransportV1 {
  info(signal: AbortSignal): Promise<Response>;
  log(after: number | null, signal: AbortSignal): Promise<Response>;
  message(signal: AbortSignal): Promise<Response>;
}
const durableTypes = new Set(`created agent.selected model.selected moved renamed metadata.updated permissions viewed archived unarchived message.content.updated usage.recorded deleted forked inbox.delivered inbox.enqueued inbox.cancelled inbox.delivery.changed execution.started execution.succeeded execution.failed execution.interrupted instructions.updated synthetic skill.activated shell.started shell.ended step.started step.streamed step.ended step.failed text.started text.ended reasoning.started reasoning.ended tool.input.started tool.input.ended tool.called tool.success tool.failed retry.scheduled compaction.started compaction.ended compaction.failed revert.staged revert.cleared revert.committed`.split(" ").map(s => `session.${s}`));
const v2 = new Set(["session.deleted", "session.forked", "session.instructions.updated", "session.tool.success", "session.tool.failed"]);
const messageTypes = new Set(["agent-switched", "model-switched", "location-switched", "user", "synthetic", "system", "skill", "shell", "assistant", "compaction", "idle"]);
export type NativeObservationLogItemV1 =
  | { kind: "EVENT"; nativeType: string; nativeVersion: number; seq: number; eventIdSha256: string; eventJsonSha256: string }
  | { kind: "SYNCED"; seq: number | null; eventJsonSha256: string };
export interface NativeObservationMessageV1 { status: "NOT_REQUESTED" | "NOT_FOUND" | "PRESENT" | "INCOMPLETE"; nativeType: string | null; messageJsonSha256: string | null }
type Phase = "INFO_INITIAL" | "LOG" | "INFO_BEFORE_MESSAGE" | "MESSAGE" | "INFO_FINAL";
type Reason = "OK" | "DISCOVERY_UNAVAILABLE" | "SERVICE_IDENTITY" | "HTTP_REFUSED" | "BAD_MIME" | "BAD_SSE" | "BAD_JSON" | "UNKNOWN_KIND_OR_VERSION" | "FOREIGN_IDENTITY" | "DIVERGENT_EVENT" | "CUT" | "BYTE_LIMIT" | "FRAME_LIMIT" | "DEADLINE" | "REVOKED" | "CURSOR_CAS" | "RMS_REFUSED";
export interface NativeObservationDataV1 {
  version: "rms-native-observation-data-v1"; imageDigest: string; attemptKey: string; sessionId: string; messageId: string;
  afterBefore: number | null; afterCommitted: number | null; logComplete: boolean; progressCommitted: boolean;
  authorityCurrentBeforeAppend: boolean; logItems: NativeObservationLogItemV1[]; message: NativeObservationMessageV1;
  io: Array<{ phase: Phase; prefixBytes: number; bodyComplete: boolean; wirePrefixSha256: string | null }>;
  reason: Reason; dataSha256: string;
}
export function observationDataHashV1(data: Omit<NativeObservationDataV1, "dataSha256"> | NativeObservationDataV1): string {
  const { dataSha256: _ignored, ...content } = data as NativeObservationDataV1;
  return hash(canonical({ domain: "rms-native-observation-data-v1", data: content }));
}
class Refusal extends Error { constructor(readonly reason: Reason) { super("rms-native-observation: DATA incomplete"); } }
function requireData(ok: unknown, reason: Reason): asserts ok { if (!ok) throw new Refusal(reason); }
const record = (v: unknown): v is Record<string, any> => v !== null && typeof v === "object" && !Array.isArray(v);
const seq = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const jsonHash = (domain: string, data: unknown) => hash(canonical({ domain, data }));

export async function runNativeObservationDataV1(image: AtRestImageV1, imageDigest: string, attemptKey: string,
  after: number | null, prior: NativeObservationLogItemV1[], port: NativeObservationTransportV1, check: () => void,
  deadline = performance.now() + NATIVE_OBSERVATION_LIMITS_V1.timeoutMs): Promise<NativeObservationDataV1> {
  const data: NativeObservationDataV1 = { version: "rms-native-observation-data-v1", imageDigest, attemptKey, sessionId: image.sessionId,
    messageId: image.messageId, afterBefore: after, afterCommitted: after, logComplete: false, progressCommitted: false,
    authorityCurrentBeforeAppend: false, logItems: [], message: { status: "NOT_REQUESTED", nativeType: null, messageJsonSha256: null }, io: [], reason: "OK", dataSha256: "" };
  const controller = new AbortController();
  let rejectDeadline!: (error: unknown) => void, bytes = 0, frames = 0;
  const expired = new Promise<never>((_, reject) => { rejectDeadline = reject; });
  // Always consumed by races, including when an injected call throws synchronously.
  void expired.catch(() => {});
  const timer = setTimeout(() => { controller.abort(); rejectDeadline(new Refusal("DEADLINE")); }, Math.max(0, deadline - performance.now()));
  const guard = () => {
    requireData(performance.now() < deadline && !controller.signal.aborted, "DEADLINE");
    try { check(); } catch { throw new Refusal("REVOKED"); }
  };
  const wait = async <T>(operation: () => Promise<T>): Promise<T> => { guard(); return await Promise.race([operation(), expired]); };
  let synced: Extract<NativeObservationLogItemV1, { kind: "SYNCED" }> | undefined, last = after ?? -1;
  const known = prior.filter((e): e is Extract<NativeObservationLogItemV1, { kind: "EVENT" }> => e.kind === "EVENT");
  const consume = (text: string, event: string) => {
    requireData(++frames <= NATIVE_OBSERVATION_LIMITS_V1.frames, "FRAME_LIMIT");
    requireData(event !== "effect/http-api/stream/failure", "CUT");
    requireData(event === "" || event === "message", "BAD_SSE");
    let value: unknown; try { value = JSON.parse(text); } catch { throw new Refusal("BAD_JSON"); }
    requireData(record(value), "BAD_JSON");
    if (value.type === "log.synced") {
      requireData(value.aggregateID === image.sessionId, "FOREIGN_IDENTITY");
      const n = value.seq === undefined ? null : value.seq;
      requireData(n === null ? last === -1 : seq(n) && n >= last, "BAD_SSE");
      const item = { kind: "SYNCED" as const, seq: n, eventJsonSha256: jsonHash("native-event-v1", value) };
      requireData(!synced || canonical(synced) === canonical(item), "BAD_SSE");
      if (!synced) data.logItems.push(item); synced = item; return;
    }
    requireData(!synced, "BAD_SSE");
    requireData(durableTypes.has(value.type) && record(value.durable) && value.durable.version === (v2.has(value.type) ? 2 : 1), "UNKNOWN_KIND_OR_VERSION");
    requireData(value.durable.aggregateID === image.sessionId && record(value.data) && value.data.sessionID === image.sessionId, "FOREIGN_IDENTITY");
    requireData(typeof value.id === "string" && value.id.startsWith("evt_") && seq(value.durable.seq) && typeof value.created === "number" && Number.isFinite(value.created), "BAD_JSON");
    const item = { kind: "EVENT" as const, nativeType: value.type as string, nativeVersion: value.durable.version as number,
      seq: value.durable.seq as number, eventIdSha256: hash(value.id), eventJsonSha256: jsonHash("native-event-v1", value) };
    const old = known.find(e => e.seq === item.seq || e.eventIdSha256 === item.eventIdSha256);
    if (old) requireData(canonical(old) === canonical(item), "DIVERGENT_EVENT");
    else { requireData(item.seq > last, "BAD_SSE"); known.push(item); data.logItems.push(item); }
    last = Math.max(last, item.seq);
  };
  const read = async (phase: Phase, call: () => Promise<Response>, sse = false): Promise<{ status: number; text: string }> => {
    const io = { phase, prefixBytes: 0, bodyComplete: false, wirePrefixSha256: null as string | null }; data.io.push(io);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let response: Response | undefined;
    const chunks: Uint8Array[] = []; let text = "", line = "", cr = false, frameBytes = 0, fields: string[] = [], event = "";
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const endLine = () => {
      if (!line) { if (fields.length || event) consume(fields.join("\n"), event); fields = []; event = ""; frameBytes = 0; }
      else if (!line.startsWith(":")) {
        const colon = line.indexOf(":"), name = colon < 0 ? line : line.slice(0, colon);
        let v = colon < 0 ? "" : line.slice(colon + 1); if (v.startsWith(" ")) v = v.slice(1);
        if (name === "data") fields.push(v); else if (name === "event") event = v;
      }
      line = "";
    };
    const feed = (part: string) => { for (const c of part) {
      frameBytes += new TextEncoder().encode(c).length; requireData(frameBytes <= NATIVE_OBSERVATION_LIMITS_V1.frameBytes, "FRAME_LIMIT");
      if (cr) { cr = false; if (c === "\n") continue; }
      if (c === "\r" || c === "\n") { endLine(); cr = c === "\r"; } else line += c;
    } };
    try {
      response = await wait(call); guard();
      const status = response.status;
      requireData(!response.redirected, "HTTP_REFUSED");
      if (response.ok) requireData((response.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase() === (sse ? "text/event-stream" : "application/json"), "BAD_MIME");
      requireData(response.body, "CUT"); reader = response.body.getReader();
      for (;;) {
        const next = await wait(() => reader!.read());
        if (next.done) { guard(); io.bodyComplete = true; break; }
        const remaining = NATIVE_OBSERVATION_LIMITS_V1.bytes - bytes, chunk = next.value.subarray(0, remaining);
        bytes += chunk.byteLength; io.prefixBytes += chunk.byteLength; chunks.push(chunk.slice());
        const part = decoder.decode(chunk, { stream: true }); if (sse && response.ok) feed(part); else text += part;
        requireData(next.value.byteLength <= remaining, "BYTE_LIMIT"); guard();
      }
      const tail = decoder.decode(); if (sse && response.ok) { feed(tail); requireData(!line && !fields.length && !event, "CUT"); } else text += tail;
      requireData(response.ok || status === 404 && phase === "MESSAGE", "HTTP_REFUSED");
      return { status, text };
    } finally {
      io.wirePrefixSha256 = hash(Buffer.concat(chunks));
      if (reader) { try { void reader.cancel().catch(() => {}); } catch {} try { reader.releaseLock(); } catch {} }
      else if (response?.body) { try { void response.body.cancel().catch(() => {}); } catch {} }
    }
  };
  const identity = async (phase: Phase) => {
    const r = await read(phase, () => port.info(controller.signal)); guard();
    let v: unknown; try { v = JSON.parse(r.text); } catch { throw new Refusal("BAD_JSON"); }
    requireData(record(v) && v.version === image.request.server.version && v.pid === image.request.server.pid, "SERVICE_IDENTITY");
  };
  try {
    await identity("INFO_INITIAL");
    await read("LOG", () => port.log(after, controller.signal), true); guard(); requireData(synced, "CUT");
    await identity("INFO_BEFORE_MESSAGE");
    data.message.status = "INCOMPLETE";
    const response = await read("MESSAGE", () => port.message(controller.signal)); guard();
    if (response.status === 404) data.message.status = "NOT_FOUND";
    else {
      let v: unknown; try { v = JSON.parse(response.text); } catch { throw new Refusal("BAD_JSON"); }
      requireData(record(v) && record(v.data), "BAD_JSON");
      requireData(v.data.id === image.messageId, "FOREIGN_IDENTITY"); requireData(messageTypes.has(v.data.type), "UNKNOWN_KIND_OR_VERSION");
      data.message = { status: "PRESENT", nativeType: v.data.type, messageJsonSha256: jsonHash("native-message-v1", v.data) };
    }
    await identity("INFO_FINAL"); guard(); data.logComplete = true;
  } catch (error) {
    data.reason = performance.now() >= deadline ? "DEADLINE" : "CUT";
    try { if (error instanceof Refusal) data.reason = error.reason; } catch { /* hostile exception is never inspected further */ }
  }
  finally { clearTimeout(timer); controller.abort(); }
  data.dataSha256 = observationDataHashV1(data); return data;
}
