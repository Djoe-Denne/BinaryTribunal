/** Closed, lazy transport. Constructing this port performs no discovery/network. */
import { ReceivedAtRestResponseErrorV1, type AtRestImageV1, type AtRestTransportV1 } from "./graph-native-at-rest";
import { canonical, hash } from "./validation";
import { isOwnedNativeAtRestGuardV1 } from "./graph-store";
const nativePorts = new WeakSet<AtRestTransportV1>();
export function nativeAtRestTransportV1(): AtRestTransportV1 {
  const refused = async (): Promise<never> => { throw new Error("rms-at-rest: OWN operation binding required"); };
  const port = Object.freeze({ info: refused, getSession: refused, getInbox: refused, create: refused, prompt: refused });
  nativePorts.add(port); return port;
}
/** Only registered identity is inspected: never invoke a caller-provided binder.
 * Public callers cannot mint the private GraphStore guard required here. */
export function bindOwnedAtRestTransportV1(port: AtRestTransportV1, check: () => void, image: AtRestImageV1): AtRestTransportV1 {
  if (!isOwnedNativeAtRestGuardV1(check)) throw new Error("rms-at-rest: OWN operation binding required");
  return nativePorts.has(port) ? boundTransport(check, image) : port;
}
function boundTransport(check: () => void, image: AtRestImageV1): AtRestTransportV1 {
  let connection: Promise<{ url: string; headers: Record<string, string> }> | undefined;
  const connect = () => connection ??= (async () => {
    const { Service } = await import("@opencode/client/service");
    check(); const endpoint = await Service.discover(); check();
    if (!endpoint) throw new Error("rms-at-rest: existing service unavailable");
    const headers = Service.headers(endpoint) ?? {};
    return { url: endpoint.url, headers };
  })();
  const request = async (method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<unknown> => {
    try {
      check(); const c = await connect(); check();
      const response = await fetch(new URL(path, c.url), { method, headers: { ...c.headers, "content-type": "application/json" },
        redirect: "error", signal: AbortSignal.timeout(20000), ...(body ? { body: JSON.stringify(body) } : {}) });
      if (response.status === 404 && method === "GET" && !path.endsWith("/inbox")) return null;
      if (!response.ok) throw new ReceivedAtRestResponseErrorV1(hash(await response.text()));
      // Finish reading this already-received response even after revocation.
      // The private owner records its digest before its post-await guard refuses.
      return await response.json();
    } catch (error) {
      if (error instanceof ReceivedAtRestResponseErrorV1) throw error;
      throw new Error("rms-at-rest: transport response unknown");
    }
  };
  const path = (id: string) => { if (id !== image.sessionId) throw new Error("rms-at-rest: retained identity required"); return `/api/session/${id}`; };
  return {
    info: () => request("GET", "/api/info"),
    getSession: id => request("GET", path(id)), getInbox: id => request("GET", `${path(id)}/inbox`),
    create(body) {
      if (canonical(body) !== image.createUtf8) throw new Error("rms-at-rest: retained create image required");
      if (body.parentID !== null || canonical(body.permissions) !== canonical([{ action: "*", resource: "*", effect: "deny" }])
        || Object.keys(body).some(k => !["id", "parentID", "title", "agent", "model", "location", "permissions", "metadata"].includes(k))) throw new Error("rms-at-rest: closed deny-all session only");
      path(String(body.id)); return request("POST", "/api/session", body);
    },
    prompt(id, body) {
      if (canonical(body) !== image.promptUtf8) throw new Error("rms-at-rest: retained prompt image required");
      if (body.resume !== false || body.delivery !== "queue" || Object.keys(body).some(k => !["id", "text", "metadata", "delivery", "resume"].includes(k))) throw new Error("rms-at-rest: paused text only");
      return request("POST", `${path(id)}/prompt`, body);
    },
  };
}
