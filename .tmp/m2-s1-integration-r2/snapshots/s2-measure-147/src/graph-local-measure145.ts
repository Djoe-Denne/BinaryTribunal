/**146 Temporary RAM diagnostics only; no imports, IO, authority, callbacks or validation cache. */
// Internal consumers only: the three instrumented modules and one lexical test.
// Never re-export from a product API or use a counter to admit/skip an operation.
const sites145 = ["bind", "stage", "finalDocument"] as const;
const phases145 = ["fixture-oldFinal-and-NEW", "stageNEW", "swap", "oldActivate", "freshCollect", "freshActivate", "assertions-close"] as const;
type Issue145 = "returned" | "rejected" | "null" | "thrown";
type Stats145 = { calls: number; returned: number; rejected: number; null: number; thrown: number;
  inclusiveMs: number; residualInstrumentedMs: number; maxMs: number; utf8Bytes: number; bytesUnavailableCalls: number };
type Frame145 = { token: number; site: number; phase: number; start: number; childrenMs: number };
type Reason145 = "nested-session" | "overflow" | "token-mismatch" | "phase-mismatch" | "clock" | "collector-failure" | "unfinished-span";
type Session145 = { active: boolean; incomplete: Reason145 | null; phase: number; phaseStart: number; enteredPhases: number;
  phaseMs: number[]; rootUnionMs: number[]; stats: Stats145[]; stack: Frame145[]; next: number };
let local145: Session145 | null = null;
let nextToken145 = 0; // Statistics reset per session; stale token identities never reset/rebind.
function incomplete145(reason: Reason145): void {
  if (local145) { local145.active = false; local145.incomplete ??= reason; }
}
export function beginLocal145(): void {
  try {
    if (local145) { incomplete145("nested-session"); return; }
    local145 = { active: true, incomplete: null, phase: 0, phaseStart: 0, enteredPhases: 1, next: 0, stack: [],
      phaseMs: phases145.map(() => 0), rootUnionMs: phases145.map(() => 0),
      stats: phases145.flatMap(() => sites145.map(() => ({ calls: 0, returned: 0, rejected: 0, null: 0, thrown: 0,
        inclusiveMs: 0, residualInstrumentedMs: 0, maxMs: 0, utf8Bytes: 0, bytesUnavailableCalls: 0 }))) };
    const now = performance.now();
    if (!Number.isFinite(now)) { incomplete145("clock"); return; }
    local145.phaseStart = now;
  } catch { incomplete145("collector-failure"); }
}
export function phaseLocal145(phase: typeof phases145[number]): void {
  const s = local145; if (!s?.active) return;
  try {
    const next = phases145.indexOf(phase);
    if (next < s.phase || next < 0 || s.stack.length) { incomplete145("phase-mismatch"); return; }
    if (next === s.phase) return;
    const now = performance.now();
    if (!Number.isFinite(now) || now < s.phaseStart) { incomplete145("clock"); return; }
    s.phaseMs[s.phase] = s.phaseMs[s.phase]! + (now - s.phaseStart); s.phase = next; s.phaseStart = now;
    s.enteredPhases |= 1 << next;
  } catch { incomplete145("collector-failure"); }
}
export function enterLocal145(site: typeof sites145[number]): number {
  const s = local145; if (!s?.active) return 0; // Inactive: no clock, bytes scan or token allocation.
  try {
    const index = sites145.indexOf(site);
    if (index < 0) { incomplete145("token-mismatch"); return 0; }
    // 21 aggregate rows, at most32 frames; no per-call history or business data retained.
    if (s.stack.length >= 32 || s.next >= 1000000 || nextToken145 >= Number.MAX_SAFE_INTEGER) { incomplete145("overflow"); return 0; }
    const now = performance.now();
    if (!Number.isFinite(now) || now < s.phaseStart) { incomplete145("clock"); return 0; }
    s.next++; const token = ++nextToken145;
    s.stack.push({ token, site: index, phase: s.phase, start: now, childrenMs: 0 });
    s.stats[s.phase * sites145.length + index]!.calls++; return token;
  } catch { incomplete145("collector-failure"); return 0; }
}
export function leaveLocal145(token: number, issue: Issue145, text?: string): void {
  const s = local145; if (!s?.active) return;
  try {
    const frame = s.stack.at(-1);
    if (!frame || frame.token !== token || frame.phase !== s.phase
      || !["returned", "rejected", "null", "thrown"].includes(issue)) { incomplete145("token-mismatch"); return; }
    const now = performance.now(), elapsed = now - frame.start;
    if (!Number.isFinite(now) || !Number.isFinite(elapsed) || elapsed < frame.childrenMs) { incomplete145("clock"); return; }
    // Only this already available string; no object traversal/serialization or declared ref length.
    const bytes = typeof text === "string" ? Buffer.byteLength(text, "utf8") : null;
    const stats = s.stats[frame.phase * sites145.length + frame.site]!;
    if (bytes !== null && !Number.isSafeInteger(stats.utf8Bytes + bytes)) { incomplete145("overflow"); return; }
    // Residual excludes only directly nested instrumented spans, NOT all other work/GC/SQLite.
    stats[issue]++; stats.inclusiveMs += elapsed; stats.residualInstrumentedMs += elapsed - frame.childrenMs;
    stats.maxMs = Math.max(stats.maxMs, elapsed);
    if (bytes === null) stats.bytesUnavailableCalls++; else stats.utf8Bytes += bytes;
    s.stack.pop(); const parent = s.stack.at(-1);
    if (parent) parent.childrenMs += elapsed; else s.rootUnionMs[frame.phase] = s.rootUnionMs[frame.phase]! + elapsed;
  } catch { incomplete145("collector-failure"); }
}
export function finishLocal145() {
  const s = local145; if (!s) return null;
  const wasActive = s.active; s.active = false; // Disable BEFORE snapshot/readout, even if it fails.
  try {
    if (s.stack.length) incomplete145("unfinished-span");
    if (wasActive) {
      const now = performance.now();
      if (!Number.isFinite(now) || now < s.phaseStart) incomplete145("clock");
      else s.phaseMs[s.phase] = s.phaseMs[s.phase]! + (now - s.phaseStart);
    }
    // Detached numbers/closed labels only. Missing spans remain incomplete, never extrapolated.
    return { diagnostic: "local-145-v1", incomplete: s.incomplete,
      phases: phases145.map((phase, index) => ({ phase, entered: (s.enteredPhases & (1 << index)) !== 0, elapsedMs: s.phaseMs[index]!, rootUnionMs: s.rootUnionMs[index]!,
        sites: sites145.map((site, i) => ({ site, ...s.stats[index * sites145.length + i]! })) })) };
  } catch { return { diagnostic: "local-145-v1", incomplete: "collector-failure" }; }
  finally { local145 = null; }
}
