/** Native REST v2.2.1, lazy and image-bound. No authority or retry is minted here. */
import { assertExecutionJsonV1 } from "./graph-execution-envelope";
import type { NativeRestWireImageV1, NativeRuntimeAuthorityV1, OwnedNpmHostProvenanceV1 } from "./graph-runtime-binding";
import { verifyOwnedNativeHostCapabilityV1 } from "./client";
import { verifyOwnedAuthHostCapabilityV1, claimOwnedAuthConnectV1 } from "./client";
import { assertOwnedAuthRequestV1, assertOwnedAuthLocalizedEnvelopeV1, ownedAuthConnectRouteV1, ownedAuthIntegrationProjectionV1, ownedAuthStatusProjectionV1 } from "./graph-runtime-binding";
import { canonical, hash } from "./validation";
import { isOwnedNativeRuntimeGuardV1 } from "./graph-store";
import type { Admission } from "./graph-store";

export interface NativeRestRequestV1 {
  sessionId: string; messageId: string; directory: string;
  profile: string; model: { providerID: string; id: string; variant: string };
  permissions: Array<{ action: string; resource: string; effect: "allow" | "deny" | "ask" }>;
  text: string; metadata: Record<string, unknown>;
  delivery: "queue"; resume: true;
}
function requireNative(ok: unknown): asserts ok {
  if (!ok) throw new Error("rms-native: retained REST image/identity refused");
}
/** Selected current ServerInfo contract, not a qualification certificate. */
export function assertNativeServiceIdentityV1(value: unknown, expected: NativeRuntimeAuthorityV1["server"]): void {
  const info = value as Record<string, unknown> | null;
  requireNative(info !== null && typeof info === "object" && !Array.isArray(info)
    && Object.keys(info).every(k => ["version", "pid", "urls", "paths", "hostname", "capabilities"].includes(k))
    && info.version === expected.version && info.pid === expected.pid && Number.isSafeInteger(info.pid)
    && Array.isArray(info.urls) && info.urls.every(u => typeof u === "string")
    && info.paths !== null && typeof info.paths === "object" && !Array.isArray(info.paths)
    && Object.keys(info.paths).every(k => k === "tmp") && typeof (info.paths as Record<string, unknown>).tmp === "string"
    && (info.hostname === undefined || info.hostname === null || typeof info.hostname === "string")
    && (info.capabilities === undefined || info.capabilities === null || typeof info.capabilities === "object" && !Array.isArray(info.capabilities)));
}
function nativePromptUtf8V1(id: string, text: string, metadata: Record<string, unknown>, resume: boolean): string {
  assertExecutionJsonV1({ id, text, metadata, resume });
  requireNative(/^msg_[A-Za-z0-9_]+$/.test(id) && typeof text === "string" && text.length > 0 && typeof resume === "boolean");
  return canonical({ id, text, metadata, delivery: "queue", resume });
}
export function encodeNativeRestWireImageV1(request: NativeRestRequestV1): NativeRestWireImageV1 {
  assertExecutionJsonV1(request);
  const r: NativeRestRequestV1 = JSON.parse(canonical(request));
  requireNative(canonical(Object.keys(r).sort()) === canonical(["sessionId", "messageId", "directory", "profile", "model", "permissions", "text", "metadata", "delivery", "resume"].sort()));
  requireNative(/^ses_[A-Za-z0-9_]+$/.test(r.sessionId) && /^msg_[A-Za-z0-9_]+$/.test(r.messageId));
  requireNative([r.directory, r.profile, r.text].every(v => typeof v === "string" && v.trim().length > 0));
  requireNative(r.delivery === "queue" && r.resume === true);
  requireNative(canonical(Object.keys(r.model).sort()) === canonical(["providerID", "id", "variant"].sort())
    && Object.values(r.model).every(v => typeof v === "string" && v.trim()) && !r.model.id.includes("#"));
  requireNative(Array.isArray(r.permissions) && r.permissions.length > 0);
  r.permissions.forEach(p => requireNative(canonical(Object.keys(p).sort()) === canonical(["action", "resource", "effect"].sort())
    && typeof p.action === "string" && p.action.length > 0 && typeof p.resource === "string" && p.resource.length > 0
    && ["allow", "deny", "ask"].includes(p.effect)));
  const createUtf8 = canonical({ id: r.sessionId, agent: r.profile, model: r.model,
    location: { directory: r.directory }, permissions: r.permissions, metadata: r.metadata });
  const promptUtf8 = nativePromptUtf8V1(r.messageId, r.text, r.metadata, r.resume);
  const body = <R extends string>(route: R, utf8: string) => ({ method: "POST" as const, route, utf8,
    sha256: hash(Buffer.from(utf8, "utf8")), byteLength: Buffer.byteLength(utf8, "utf8") });
  const create = body("/api/session", createUtf8), prompt = body(`/api/session/${encodeURIComponent(r.sessionId)}/prompt`, promptUtf8);
  return { version: "rms-native-rest-wire-image-v1", domain: "opencode-rest-2.2.1-v1", sessionId: r.sessionId,
    messageId: r.messageId, create, prompt, totalBodyUtf8Bytes: create.byteLength + prompt.byteLength };
}
/** The admission, not a caller's second prompt, supplies the emitted text/model.
 * The retained wire digest remains a separate domain from the Admission digest. */
export function encodeNativeAdmissionWireV1(admission: Admission, location: Pick<NativeRestRequestV1, "sessionId" | "messageId" | "directory" | "permissions">): NativeRestWireImageV1 {
  assertExecutionJsonV1({ admission, location }); const command = admission.command;
  requireNative(typeof command.prompt === "string" && typeof command.profile === "string" && command.dossier && command.metadata);
  requireNative(command.files === undefined && command.agents === undefined && command.skills === undefined);
  return encodeNativeRestWireImageV1({ ...location, profile: command.profile,
    model: command.model as NativeRestRequestV1["model"], delivery: "queue", resume: true,
    text: canonical({ prompt: command.prompt, dossier: command.dossier, metadata: command.metadata }),
    metadata: { rmsNative: { version: "rms-native-runtime-v1", executionId: admission.executionId, requestDigest: hash(canonical(admission)) } } });
}
export interface NativeRuntimeHttpPortV1 {
  /** Connection must be independently verified by the parent host before binding. */
  request(method: "GET" | "POST", route: string, utf8: string | undefined, signal: AbortSignal): Promise<Response>;
}
const connectedRuntimePorts = new WeakSet<NativeRuntimeHttpPortV1>();
/** Membership is not qualification; only this factory can register a connection. */
export function isConnectedNativeRuntimeHttpPortV1(port: NativeRuntimeHttpPortV1): boolean { return connectedRuntimePorts.has(port); }
declare const ownedHostCapabilityBrandV1: unique symbol;
export interface OwnedHostCapabilityV1 { readonly [ownedHostCapabilityBrandV1]: true }
/** Private verifier output; never an issuer input or a serializable authority. */
export interface OwnedHostConnectionViewV1 {
  origin: string; pid: number; epoch: string; authorization: string; signal: AbortSignal;
  provenance: OwnedNpmHostProvenanceV1;
}
export interface OwnedAuthConnectionViewV1 {
  kind: "owned-openai-auth-only-v1"; origin: string; pid: number; epoch: string; authorization: string; signal: AbortSignal;
  intentId: string; pinsSha256: string; attemptId: string | null; expectedDirectory: string;
}
/** Local bounded codes ONLY, never an imported error/cause/message. */
export class OwnedAuthHttpErrorV1 extends Error {
  constructor(readonly code: "HTTP_REFUSED" | "IO_TIMEOUT" | "IO_AMBIGUOUS" | "RESPONSE_REFUSED") { super(code); }
}
/** Same transport module, but NOT registered as a model/runtime work port.
 * Private registry and durable claim are statically bound, never caller hooks. */
export async function connectOwnedAuthHttpV1(capability: unknown): Promise<NativeRuntimeHttpPortV1> {
  const initial = verifyOwnedAuthHostCapabilityV1(capability);
  if (!initial) throw new Error("AUTH_CAPABILITY_REFUSED");
  const checked = () => {
    const live = verifyOwnedAuthHostCapabilityV1(capability);
    if (!live || live.kind !== initial.kind || live.origin !== initial.origin || live.pid !== initial.pid || live.epoch !== initial.epoch
      || live.authorization !== initial.authorization || live.intentId !== initial.intentId || live.pinsSha256 !== initial.pinsSha256
      || live.expectedDirectory !== initial.expectedDirectory) throw new Error("AUTH_CUSTODY_REFUSED");
    return live;
  };
  const port: NativeRuntimeHttpPortV1 = Object.freeze({ async request(method: "GET" | "POST", route: string, utf8: string | undefined, signal: AbortSignal) {
    let live = checked(); assertOwnedAuthRequestV1(method, route, utf8, live.attemptId);
    const url = new URL(live.origin);
    if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.username || url.password || url.pathname !== "/" || url.search || url.hash || url.origin !== live.origin) throw new Error("AUTH_ORIGIN_REFUSED");
    const timeout = AbortSignal.timeout(10000), combined = AbortSignal.any([signal, live.signal, timeout]); combined.throwIfAborted();
    if (method === "POST" && !claimOwnedAuthConnectV1(capability)) throw new Error("AUTH_CONNECT_ALREADY_CLAIMED_OR_REFUSED");
    live = checked(); combined.throwIfAborted();
    let response: Response;
    try { response = await fetch(`${live.origin}${route}`, { method, ...(utf8 === undefined ? {} : { body: utf8 }),
      headers: { authorization: live.authorization, accept: "application/json", ...(method === "POST" ? { "content-type": "application/json" } : {}) }, redirect: "error", signal: combined }); }
    catch { throw new OwnedAuthHttpErrorV1(timeout.aborted ? "IO_TIMEOUT" : "IO_AMBIGUOUS"); }
    const reader = response.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try {
      checked(); combined.throwIfAborted();
      if (!response.ok) throw new OwnedAuthHttpErrorV1("HTTP_REFUSED");
      if (response.redirected || (response.headers.get("content-type") ?? "").split(";")[0]?.trim() !== "application/json") throw new OwnedAuthHttpErrorV1("RESPONSE_REFUSED");
      if (reader) for (;;) { const next = await reader.read(); checked(); combined.throwIfAborted(); if (next.done) break;
        size += next.value.length; if (size > (route === "/openapi.json" ? 8388608 : 262144)) throw new Error("AUTH_RESPONSE_BOUND"); chunks.push(next.value); }
      const raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))); checked();
      let projection: unknown = raw;
      if (route !== "/api/info" && route !== "/openapi.json") assertOwnedAuthLocalizedEnvelopeV1(raw, live.expectedDirectory);
      if (route === "/api/integration" || route === "/api/integration/openai")
        projection = { location: { directory: raw.location.directory }, data: ownedAuthIntegrationProjectionV1(raw, live.expectedDirectory) };
      else if (method === "GET" && route.startsWith(`${ownedAuthConnectRouteV1}/`)) {
        const s = ownedAuthStatusProjectionV1(raw, live.expectedDirectory);
        projection = { location: { directory: raw.location.directory }, data: { status: s.status.toLowerCase(), time: { created: s.created, expires: s.expires } } };
      }
      // No response headers, hashes, captures or imported error messages escape.
      // CONNECT contains ephemeral UI-only data and remains in lexical memory.
      return Response.json(projection);
    } catch (error) { if (error instanceof OwnedAuthHttpErrorV1) throw error;
      throw new OwnedAuthHttpErrorV1(timeout.aborted ? "IO_TIMEOUT" : "RESPONSE_REFUSED"); }
    finally { if (reader) { void reader.cancel().catch(() => {}); reader.releaseLock(); } }
  } });
  checked(); return port;
}
/** Unconditional even for a genuine live cap: tranche A cannot send any POST. */
export function assertOwnedReadonlyRequestV1(method: string, route: string, utf8: unknown): void {
  if (method !== "GET" || utf8 !== undefined || !["/api/info", "/openapi.json"].includes(route))
    throw new Error("owned readonly method/body/raw target refused; POST requires future tranche B");
}
/** Same port domain/WeakSet as service discovery. No callback can register/mint
 * custody: this verifier is statically bound to the private parent registry. */
export async function connectOwnedNativeRuntimeHttpV1(capability: unknown): Promise<NativeRuntimeHttpPortV1> {
  const initial = verifyOwnedNativeHostCapabilityV1(capability);
  if (!initial) throw new Error("owned live host capability unavailable");
  const checked = () => {
    const live = verifyOwnedNativeHostCapabilityV1(capability);
    if (!live || live.epoch !== initial.epoch || live.pid !== initial.pid || live.origin !== initial.origin
      || live.authorization !== initial.authorization || canonical(live.provenance) !== canonical(initial.provenance))
      throw new Error("owned live host custody changed");
    return live;
  };
  const port: NativeRuntimeHttpPortV1 = Object.freeze({ async request(method: "GET" | "POST", route: string, utf8: string | undefined, signal: AbortSignal) {
    assertOwnedReadonlyRequestV1(method, route, utf8);
    const live = checked();
    const url = new URL(live.origin);
    if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.username || url.password
      || url.pathname !== "/" || url.search || url.hash || url.origin !== live.origin) throw new Error("owned loopback origin refused");
    const combined = AbortSignal.any([signal, live.signal, AbortSignal.timeout(2500)]);
    combined.throwIfAborted();
    const response = await fetch(`${live.origin}${route}`, { method: "GET", headers: { authorization: live.authorization, accept: "application/json" }, redirect: "error", signal: combined });
    const reader = response.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try {
      checked();
      if (response.redirected) throw new Error("owned response redirected");
      if (reader) for (;;) {
        const next = await reader.read(); checked(); combined.throwIfAborted(); if (next.done) break;
        size += next.value.length;
        if (size > (route === "/openapi.json" ? 8388608 : 65536)) throw new Error("owned readonly response byte cap");
        chunks.push(next.value);
      }
      checked();
      return new Response(Buffer.concat(chunks), { status: response.status, statusText: response.statusText, headers: response.headers });
    } finally { if (reader) { void reader.cancel().catch(() => {}); reader.releaseLock(); } }
  } });
  checked(); connectedRuntimePorts.add(port); return port;
}
/** Parent-owned direct composition only. No service start, retry, redirect,
 * caller headers or re-serialization of retained request bytes. */
export async function connectNativeRuntimeHttpV1(directory: string, registrationFile?: string, signal: AbortSignal = AbortSignal.timeout(10000)): Promise<NativeRuntimeHttpPortV1> {
  requireNative(typeof directory === "string" && directory.length > 0);
  const { Service } = await import("@opencode/client/service");
  let interrupted!: () => void;
  const stop = new Promise<never>((_, reject) => { interrupted = () => reject(new Error("native runtime discovery deadline")); });
  signal.throwIfAborted(); signal.addEventListener("abort", interrupted, { once: true });
  let endpoint: Awaited<ReturnType<typeof Service.discover>>;
  try { endpoint = await Promise.race([Service.discover(registrationFile ? { file: registrationFile } : {}), stop]); }
  finally { signal.removeEventListener("abort", interrupted); }
  signal.throwIfAborted();
  requireNative(endpoint && /^https?:$/.test(new URL(endpoint.url).protocol));
  const base = new URL(endpoint.url), headers = Service.headers(endpoint) ?? {};
  requireNative(!base.username && !base.password && (base.protocol === "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)));
  const port: NativeRuntimeHttpPortV1 = Object.freeze({ async request(method: "GET" | "POST", route: string, utf8: string | undefined, signal: AbortSignal) {
    signal.throwIfAborted();
    requireNative(route.startsWith("/") && !route.startsWith("//") && !route.includes("#") && !route.includes("\\"));
    const url = new URL(route, base), session = /^\/api\/session\/ses_[A-Za-z0-9_]+(?:\/inbox|\/message\/msg_[A-Za-z0-9_]+)?$/;
    requireNative(url.origin === base.origin && (method === "POST"
      ? (url.pathname === "/api/session" || /^\/api\/session\/ses_[A-Za-z0-9_]+\/prompt$/.test(url.pathname)) && !url.search && typeof utf8 === "string"
      : method === "GET" && utf8 === undefined && (url.pathname === "/api/info" || session.test(url.pathname)
        || /^\/api\/agent\/[A-Za-z0-9_.-]+$/.test(url.pathname) || url.pathname === "/api/model"
        || /^\/api\/experimental\/session\/ses_[A-Za-z0-9_]+\/log$/.test(url.pathname))));
    if (url.pathname.endsWith("/log")) requireNative(url.searchParams.get("follow") === "false"
      && [...url.searchParams.keys()].every(k => k === "follow" || k === "after")
      && (!url.searchParams.has("after") || /^\d+$/.test(url.searchParams.get("after")!)));
    else requireNative([...url.searchParams.keys()].every(k => k === "location[directory]")
      && (!url.searchParams.has("location[directory]") || url.searchParams.get("location[directory]") === directory));
    return await fetch(url, { method, headers: { ...headers, ...(method === "POST" ? { "content-type": "application/json" } : {}) },
      redirect: "error", signal, ...(utf8 === undefined ? {} : { body: utf8 }) });
  } });
  connectedRuntimePorts.add(port); return port;
}
export interface NativeRuntimeIoHooksV1 {
  check(): void;
  claimed(phase: "create" | "prompt"): boolean;
  /** Durable claim before effect; false means GET reconciliation ONLY, including 404. */
  claim(phase: "create" | "prompt"): boolean;
  observed(phase: string, responseSha256: string | null): void;
  refresh?(purpose: "effect" | "physical-observation", signal: AbortSignal): Promise<void>;
  signal?: AbortSignal;
}
export interface NativeRuntimeAdmissionDataV1 {
  version: "rms-native-runtime-admission-data-v1";
  sessionId: string; messageId: string; imageSha256: string;
  status: "CONFIRMED" | "AMBIGUOUS";
  /** Admission DATA is neither result validity nor terminality. */
  terminalProof: null;
}
export interface NativeNotificationWireV1 {
  version: "rms-native-notification-wire-v1"; sessionId: string; messageId: string;
  method: "POST"; route: string; utf8: string; byteLength: number; sha256: string;
}
export function encodeNativeNotificationWireV1(sessionId: string, missionId: string, commandId: string,
  request: Record<string, unknown>, runtimeImageSha256: string): NativeNotificationWireV1 {
  assertExecutionJsonV1({ sessionId, missionId, commandId, request, runtimeImageSha256 });
  requireNative(/^ses_[A-Za-z0-9_]+$/.test(sessionId) && /^[a-f0-9]{64}$/.test(runtimeImageSha256)
    && typeof commandId === "string" && commandId.length > 0 && request.commandId === commandId && request.sessionId === sessionId);
  const messageId = `msg_rmscmd_${hash(canonical({ missionId, commandId, runtimeImageSha256 })).slice(0, 32)}`;
  const metadata = { rmsOrdered: { version: "rms-native-command-v1", commandId, requestDigest: hash(canonical(request)), runtimeImageSha256 } };
  const utf8 = nativePromptUtf8V1(messageId, canonical({ version: "rms-native-command-v1", missionId, request }), metadata, false);
  return { version: "rms-native-notification-wire-v1", sessionId, messageId, method: "POST", route: `/api/session/${encodeURIComponent(sessionId)}/prompt`,
    utf8, byteLength: Buffer.byteLength(utf8, "utf8"), sha256: hash(Buffer.from(utf8, "utf8")) };
}
function nativeRuntimeJsonReaderV1(port: NativeRuntimeHttpPortV1, hooks: Pick<NativeRuntimeIoHooksV1, "check" | "observed" | "refresh" | "signal">) {
  requireNative(isOwnedNativeRuntimeGuardV1(hooks.check));
  const deadline = performance.now() + 10000;
  const interrupted = new Promise<never>((_, reject) => { if (hooks.signal) {
    const stop = () => reject(new Error("native runtime operation deadline"));
    if (hooks.signal.aborted) stop(); else hooks.signal.addEventListener("abort", stop, { once: true });
  } }); void interrupted.catch(() => {});
  const wait = async <T>(pending: Promise<T>): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([pending, interrupted, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("rms-native: deadline")), Math.max(1, Math.ceil(deadline - performance.now())));
    })]); } finally { if (timer !== undefined) clearTimeout(timer); }
  };
  return async (method: "GET" | "POST", route: string, body?: string): Promise<unknown | null> => {
    const timeout = AbortSignal.timeout(Math.max(1, Math.ceil(deadline - performance.now())));
    const signal = hooks.signal ? AbortSignal.any([hooks.signal, timeout]) : timeout;
    if (hooks.refresh && method === "POST") await wait(hooks.refresh("effect", signal));
    hooks.check(); requireNative(performance.now() < deadline);
    const response = await wait(port.request(method, route, body, signal));
    requireNative(!response.redirected);
    const reader = response.body?.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
    try { if (reader) for (;;) {
      const next = await wait(reader.read()); if (next.done) break;
      bytes += next.value.length; requireNative(bytes <= 262144); chunks.push(next.value);
    } } finally { if (reader) { void reader.cancel().catch(() => {}); reader.releaseLock(); } }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
    // Conserve the committed response under current local physical rights and
    // the still-bounded connection snapshot BEFORE another remote read can fail.
    hooks.observed(`${method}:${route}`, hash(text));
    if (hooks.refresh && method === "POST") await wait(hooks.refresh("physical-observation", signal));
    hooks.check();
    if (response.status === 404 && method === "GET") return null;
    requireNative(response.ok && (response.headers.get("content-type") ?? "").split(";")[0]!.trim() === "application/json");
    const value = JSON.parse(text); assertExecutionJsonV1(value); return value;
  };
}
function nativeSessionMatchesV1(image: NativeRestWireImageV1, value: unknown): void {
  const session = (value as { data?: Record<string, unknown> } | null)?.data, create = JSON.parse(image.create.utf8);
  requireNative(value && typeof value === "object" && Object.keys(value).length === 1 && Object.hasOwn(value, "data"));
  requireNative(session && session.id === image.sessionId && session.parentID === undefined && session.fork === undefined
    && ["id", "projectID", "cost", "tokens", "time", "location"].every(k => Object.hasOwn(session, k)));
  const time = session.time as Record<string, unknown> | null;
  requireNative(typeof session.projectID === "string" && time && typeof time.created === "number" && Number.isFinite(time.created)
    && typeof time.updated === "number" && Number.isFinite(time.updated));
  requireNative(Object.keys(session).every(k => ["id", "parentID", "fork", "projectID", "agent", "model", "cost", "tokens", "outcome", "time", "title", "subpath", "metadata", "permissions", "revert", "location"].includes(k)));
  for (const key of ["agent", "model", "location", "permissions", "metadata"]) requireNative(canonical(session[key]) === canonical(create[key]));
}
/** Same runner for qualification and later qualified work. Never repeats a claimed POST. */
export async function submitNativeRestWireImageV1(image: NativeRestWireImageV1, authority: NativeRuntimeAuthorityV1,
  port: NativeRuntimeHttpPortV1, hooks: NativeRuntimeIoHooksV1): Promise<NativeRuntimeAdmissionDataV1> {
  requireNative(isOwnedNativeRuntimeGuardV1(hooks.check));
  assertExecutionJsonV1({ image, authority });
  const create = JSON.parse(image.create.utf8), prompt = JSON.parse(image.prompt.utf8);
  requireNative(canonical(encodeNativeRestWireImageV1({ sessionId: image.sessionId, messageId: image.messageId,
    directory: create.location.directory, profile: create.agent, model: create.model, permissions: create.permissions,
    metadata: create.metadata, text: prompt.text, delivery: prompt.delivery, resume: prompt.resume })) === canonical(image)
    && canonical(prompt.metadata) === canonical(create.metadata));
  const result: NativeRuntimeAdmissionDataV1 = { version: "rms-native-runtime-admission-data-v1", sessionId: image.sessionId,
    messageId: image.messageId, imageSha256: hash(canonical(image)), status: "AMBIGUOUS", terminalProof: null };
  const io = nativeRuntimeJsonReaderV1(port, hooks);
  const service = async () => {
    assertNativeServiceIdentityV1(await io("GET", "/api/info"), authority.server);
  };
  const sessionPath = `/api/session/${encodeURIComponent(image.sessionId)}`;
  const sessionMatches = (value: unknown) => nativeSessionMatchesV1(image, value);
  const inboxMatches = (item: Record<string, unknown>) => {
    requireNative(Object.keys(item).every(k => ["id", "sessionID", "time", "type", "payload", "delivery"].includes(k))
      && item.id === image.messageId && item.sessionID === image.sessionId && item.type === "user" && item.delivery === prompt.delivery
      && canonical(item.payload) === canonical({ text: prompt.text, metadata: prompt.metadata }));
    const time = item.time as Record<string, unknown> | null;
    requireNative(time && Object.keys(time).length === 1 && typeof time.created === "number" && Number.isFinite(time.created));
  };
  try {
    await service(); let session = await io("GET", sessionPath);
    if (session === null) {
      if (!hooks.claim("create")) return result;
      await service(); await io("POST", image.create.route, image.create.utf8); session = await io("GET", sessionPath);
    } else requireNative(hooks.claimed("create"));
    sessionMatches(session);
    const inbox = await io("GET", `${sessionPath}/inbox`) as { data?: unknown[] } | null;
    requireNative(inbox && Array.isArray(inbox.data) && inbox.data.length <= 1);
    const exactInbox = inbox.data.find(v => (v as Record<string, unknown>)?.id === image.messageId) as Record<string, unknown> | undefined;
    if (!exactInbox) {
      const delivered = await io("GET", `${sessionPath}/message/${encodeURIComponent(image.messageId)}`) as { data?: Record<string, unknown> } | null;
      if (!delivered) {
        if (!hooks.claim("prompt")) return result;
        await service(); const admitted = await io("POST", image.prompt.route, image.prompt.utf8) as { data?: Record<string, unknown> } | null;
        requireNative(admitted?.data); inboxMatches(admitted.data);
        sessionMatches(await io("GET", sessionPath)); await service(); hooks.check(); result.status = "CONFIRMED"; return result;
      }
      requireNative(hooks.claimed("prompt"));
      requireNative(delivered.data?.id === image.messageId && delivered.data.type === "user" && delivered.data.text === prompt.text
        && canonical(delivered.data.metadata) === canonical(prompt.metadata));
    } else {
      requireNative(hooks.claimed("prompt"));
      inboxMatches(exactInbox);
    }
    sessionMatches(await io("GET", sessionPath)); await service(); hooks.check(); result.status = "CONFIRMED"; return result;
  } catch {
    hooks.observed("response-unknown-or-refused", null); return result;
  }
}
/** Ordered notification uses the SAME JSON reader, retained session and prompt
 * encoder. resume:false is part of the exact image, never an inferred no-wake. */
export async function submitNativeNotificationWireV1(wire: NativeNotificationWireV1, image: NativeRestWireImageV1,
  authority: NativeRuntimeAuthorityV1, port: NativeRuntimeHttpPortV1,
  hooks: Pick<NativeRuntimeIoHooksV1, "check" | "observed" | "refresh" | "signal"> & { claim(): boolean; claimed(): boolean }): Promise<{ sessionId: string; messageId: string; wireSha256: string; responseSha256: string } | null> {
  requireNative(isOwnedNativeRuntimeGuardV1(hooks.check)); assertExecutionJsonV1({ wire, image, authority });
  const prompt = JSON.parse(wire.utf8), payload = JSON.parse(prompt.text);
  requireNative(canonical(encodeNativeNotificationWireV1(image.sessionId, payload.missionId, payload.request.commandId,
    payload.request, hash(canonical(image)))) === canonical(wire) && prompt.resume === false && prompt.delivery === "queue");
  const io = nativeRuntimeJsonReaderV1(port, hooks), session = `/api/session/${encodeURIComponent(image.sessionId)}`;
  const service = async () => {
    assertNativeServiceIdentityV1(await io("GET", "/api/info"), authority.server);
  };
  const itemMatches = (item: Record<string, unknown>) => {
    const time = item.time as Record<string, unknown> | null;
    requireNative(Object.keys(item).every(k => ["id", "sessionID", "time", "type", "payload", "delivery"].includes(k))
      && time && Object.keys(time).length === 1 && typeof time.created === "number" && Number.isFinite(time.created)
      && item.id === wire.messageId && item.sessionID === image.sessionId
      && item.type === "user" && item.delivery === "queue" && canonical(item.payload) === canonical({ text: prompt.text, metadata: prompt.metadata }));
  };
  let admitted: unknown;
  try {
    await service(); nativeSessionMatchesV1(image, await io("GET", session));
    const inbox = await io("GET", `${session}/inbox`) as { data?: Array<Record<string, unknown>> } | null;
    requireNative(inbox && Array.isArray(inbox.data) && inbox.data.length <= 1024);
    const item = inbox.data.find(i => i?.id === wire.messageId);
    if (item) { requireNative(hooks.claimed()); itemMatches(item); admitted = item; }
    else {
      const message = await io("GET", `${session}/message/${encodeURIComponent(wire.messageId)}`) as { data?: Record<string, unknown> } | null;
      if (message) {
        requireNative(hooks.claimed());
        requireNative(message.data?.id === wire.messageId && message.data.type === "user" && message.data.text === prompt.text
          && canonical(message.data.metadata) === canonical(prompt.metadata)); admitted = message.data;
      } else {
        if (!hooks.claim()) return null;
        await service(); const response = await io("POST", wire.route, wire.utf8) as { data?: Record<string, unknown> } | null;
        requireNative(response?.data); itemMatches(response.data); admitted = response.data;
      }
    }
    nativeSessionMatchesV1(image, await io("GET", session)); await service(); hooks.check();
    return { sessionId: image.sessionId, messageId: wire.messageId, wireSha256: hash(canonical(wire)), responseSha256: hash(canonical(admitted)) };
  } catch { hooks.observed("notification-response-unknown-or-refused", null); return null; }
}
