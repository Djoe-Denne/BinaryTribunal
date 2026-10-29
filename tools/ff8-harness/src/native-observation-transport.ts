/** Existing service, GET only. No caller endpoint or authority factory. */
import type { AtRestImageV1 } from "./graph-native-at-rest";
import type { NativeObservationTransportV1 } from "./graph-native-observations";
import { isOwnedNativeObservationGuardV1 } from "./graph-store";
const ports = new WeakSet<NativeObservationTransportV1>();
export function nativeObservationTransportV1(): NativeObservationTransportV1 {
  const refuse = async (): Promise<Response> => { throw new Error("rms-observation: OWN binding required"); };
  const port = Object.freeze({ info: refuse, log: refuse, message: refuse }); ports.add(port); return port;
}
export function bindOwnedNativeObservationTransportV1(port: NativeObservationTransportV1, check: () => void, image: AtRestImageV1): NativeObservationTransportV1 {
  if (!isOwnedNativeObservationGuardV1(check)) throw new Error("rms-observation: OWN binding required");
  if (!ports.has(port)) return port; // Never inspect or call an injected binder.
  let connection: Promise<{ url: string; headers: Record<string, string> }> | undefined;
  const get = async (path: string, signal: AbortSignal): Promise<Response> => {
    const guard = () => { check(); signal.throwIfAborted(); };
    guard();
    connection ??= (async () => {
      const { Service } = await import("@opencode/client/service"); guard();
      const endpoint = await Service.discover(); guard();
      if (!endpoint) throw new Error("rms-observation: existing service unavailable");
      return { url: endpoint.url, headers: Service.headers(endpoint) ?? {} };
    })();
    const c = await connection; guard();
    return await fetch(new URL(path, c.url), { method: "GET", headers: c.headers, redirect: "error", signal });
  };
  const session = encodeURIComponent(image.sessionId), message = encodeURIComponent(image.messageId);
  return Object.freeze({ info: (signal: AbortSignal) => get("/api/info", signal),
    log: (after: number | null, signal: AbortSignal) => {
      if (after !== null && (!Number.isSafeInteger(after) || after < 0)) throw new Error("rms-observation: native cursor required");
      return get(`/api/experimental/session/${session}/log?follow=false${after === null ? "" : `&after=${after}`}`, signal);
    }, message: (signal: AbortSignal) => get(`/api/session/${session}/message/${message}`, signal) });
}
