/** Prospective DATA only. Nothing here grants execution or terminality. */
import { randomUUID } from "node:crypto";
import { canonical, hash } from "./validation";
import { assertExecutionJsonV1 } from "./graph-execution-envelope";

export interface AtRestRequestV1 {
  version: "rms-native-at-rest-request-v1";
  server: { version: "2.1.4"; pid: number };
  directory: string;
}
export interface AtRestImageV1 {
  version: "rms-native-at-rest-image-v1";
  scope: { missionId: string; unitId: string; executionId: string; owner: string; controllerFence: number; familyFence: number; revision: number; admissionDigest: string };
  request: AtRestRequestV1;
  sessionId: string; messageId: string;
  createUtf8: string; promptUtf8: string; createSha256: string; promptSha256: string;
}
export interface AtRestTransportV1 {
  info(): Promise<unknown>;
  getSession(id: string): Promise<unknown | null>;
  getInbox(id: string): Promise<unknown>;
  create(body: Record<string, unknown>): Promise<unknown>;
  prompt(id: string, body: Record<string, unknown>): Promise<unknown>;
}
export interface AtRestResultV1 {
  version: "rms-native-at-rest-result-v1"; status: "ADMITTED_AT_REST_ONLY";
  sessionId: string; messageId: string; imageSha256: string;
  nativeQualificationRef: null; executionReceipt: null;
}
/** DATA-only failure: no raw body, headers or remote exception escapes. */
export class ReceivedAtRestResponseErrorV1 extends Error {
  constructor(readonly responseSha256: string) { super("rms-at-rest: received response refused"); }
}
export function atRestCheck(ok: unknown): asserts ok { if (!ok) throw new Error("rms-at-rest: closed contract/collision/authority refused"); }
function object(value: unknown): Record<string, any> {
  atRestCheck(value !== null && typeof value === "object" && !Array.isArray(value)); return value as Record<string, any>;
}
export function captureAtRestRequestV1(value: AtRestRequestV1): AtRestRequestV1 {
  assertExecutionJsonV1(value); const r = JSON.parse(canonical(value));
  atRestCheck(canonical(Object.keys(r).sort()) === canonical(["directory", "server", "version"]));
  atRestCheck(r.version === "rms-native-at-rest-request-v1" && typeof r.directory === "string" && r.directory.trim());
  atRestCheck(canonical(Object.keys(object(r.server)).sort()) === canonical(["pid", "version"])
    && r.server.version === "2.1.4" && Number.isSafeInteger(r.server.pid) && r.server.pid > 0);
  return r;
}
export function makeAtRestImageV1(scope: AtRestImageV1["scope"], request: AtRestRequestV1, command: Record<string, any>, retainedIds?: Pick<AtRestImageV1, "sessionId" | "messageId">): AtRestImageV1 {
  request = captureAtRestRequestV1(request); assertExecutionJsonV1(command);
  for (const field of ["files", "agents", "skills"]) atRestCheck(command[field] === undefined);
  atRestCheck(command.resume === undefined && typeof command.prompt === "string" && command.prompt.length > 0);
  const model = object(command.model);
  atRestCheck(canonical(Object.keys(model).sort()) === canonical(["id", "providerID", "variant"])
    && Object.values(model).every(v => typeof v === "string" && v.trim()) && !model.id.includes("#"));
  atRestCheck(typeof command.profile === "string" && command.profile.trim());
  const sessionId = retainedIds?.sessionId ?? `ses_rmsat_${randomUUID().replaceAll("-", "")}`, messageId = retainedIds?.messageId ?? `msg_rmsat_${randomUUID().replaceAll("-", "")}`;
  atRestCheck(/^ses_rmsat_[a-f0-9]{32}$/.test(sessionId) && /^msg_rmsat_[a-f0-9]{32}$/.test(messageId));
  const metadata = { rmsAtRest: { version: "rms-native-at-rest-v1", scope, executionRequested: false } };
  const createUtf8 = canonical({ id: sessionId, parentID: null, title: `RMS DATA at rest ${scope.executionId}`, agent: command.profile,
    model, location: { directory: request.directory }, permissions: [{ action: "*", resource: "*", effect: "deny" }], metadata });
  // The exact frozen dossier and metadata are text, not unqualified attachments.
  const promptUtf8 = canonical({ id: messageId, text: canonical({ prompt: command.prompt, dossier: command.dossier, metadata: command.metadata }),
    metadata, delivery: "queue", resume: false });
  return { version: "rms-native-at-rest-image-v1", scope, request, sessionId, messageId, createUtf8, promptUtf8,
    createSha256: hash(createUtf8), promptSha256: hash(promptUtf8) };
}
export function compareAtRestSessionV1(image: AtRestImageV1, value: unknown): void {
  const s = object(value), expected = JSON.parse(image.createUtf8);
  const allowed = ["id", "parentID", "agent", "model", "title", "metadata", "permissions", "location", "projectID", "cost", "tokens", "time"];
  atRestCheck(Object.keys(s).every(k => allowed.includes(k)) && (s.parentID === undefined || s.parentID === null));
  for (const k of ["id", "agent", "model", "title", "metadata", "permissions"]) atRestCheck(canonical(s[k]) === canonical(expected[k]));
  atRestCheck(canonical(s.location) === canonical(expected.location));
}
export function compareAtRestInboxV1(image: AtRestImageV1, value: unknown): boolean {
  atRestCheck(Array.isArray(value)); const items = value as Array<Record<string, any>>;
  // Fresh owned session: an extra item is never silently treated as ours.
  atRestCheck(items.length <= 1); if (!items.length) return false;
  const item = object(items[0]), prompt = JSON.parse(image.promptUtf8);
  atRestCheck(Object.keys(item).every(k => ["id", "sessionID", "time", "type", "payload", "delivery"].includes(k)));
  atRestCheck(item.id === image.messageId && item.sessionID === image.sessionId && item.type === "user" && item.delivery === "queue"
    && canonical(item.payload) === canonical({ text: prompt.text, metadata: prompt.metadata })); return true;
}
/** Hooks are supplied privately by GraphStore; exported DATA never supplies authority. */
export async function runAtRestV1(image: AtRestImageV1, port: AtRestTransportV1, hooks: {
  check(): void; claim(phase: string): boolean; observed(phase: string, outcome: string, responseSha256: string | null): void;
}): Promise<AtRestResultV1> {
  const io = async <T>(phase: string, operation: () => Promise<T>): Promise<T> => {
    hooks.check(); let result: T;
    try { result = await operation(); }
    catch (error) {
      let responseSha256: string | null = null;
      // Treat injected/forged exceptions as hostile DATA, including getters and
      // prototype traps. Capture once and validate at consumption, not construction.
      try {
        if (error instanceof ReceivedAtRestResponseErrorV1) {
          const captured: unknown = error.responseSha256;
          if (typeof captured === "string" && /^[a-f0-9]{64}$/.test(captured)) responseSha256 = captured;
        }
      } catch { /* malformed exception: no remote value or error text escapes */ }
      hooks.observed(phase, responseSha256 === null ? "unknown-response" : "response-received-refused", responseSha256);
      hooks.check(); throw new Error("rms-at-rest: response unknown; same identities retained");
    }
    assertExecutionJsonV1(result);
    hooks.observed(phase, "response-received", hash(canonical(result))); hooks.check(); return result;
  };
  const identity = async () => {
    const info = object(await io("server", () => port.info()));
    atRestCheck(info.version === image.request.server.version && info.pid === image.request.server.pid);
  };
  await identity();
  let session = await io("session-read", () => port.getSession(image.sessionId));
  if (session === null) {
    atRestCheck(hooks.claim("create")); await identity();
    await io("create", () => port.create(JSON.parse(image.createUtf8)));
    session = await io("session-read", () => port.getSession(image.sessionId));
  }
  compareAtRestSessionV1(image, session);
  let inbox = await io("inbox-read", () => port.getInbox(image.sessionId));
  if (!compareAtRestInboxV1(image, inbox)) {
    atRestCheck(hooks.claim("prompt")); await identity();
    await io("prompt", () => port.prompt(image.sessionId, JSON.parse(image.promptUtf8)));
    inbox = await io("inbox-read", () => port.getInbox(image.sessionId));
  }
  atRestCheck(compareAtRestInboxV1(image, inbox));
  // Recheck stored attributes after admission as well as the pinned process.
  compareAtRestSessionV1(image, await io("session-final", () => port.getSession(image.sessionId)));
  await identity(); hooks.check();
  return { version: "rms-native-at-rest-result-v1", status: "ADMITTED_AT_REST_ONLY", sessionId: image.sessionId, messageId: image.messageId,
    imageSha256: hash(canonical(image)), nativeQualificationRef: null, executionReceipt: null };
}
