// L2 — deterministic local capability rules (ORDRE_MISSION §6) with an
// explicit-invalidation cache. Bounded rule table, no network, no capa
// download, no LLM: facts are derived only from snapshot evidence. A
// hypothetical business role is stored separately from the observed
// capability (CONTRAT.md §3.6) and is never promoted by this module.
import { canonical, fingerprint, hash } from "./validation";
import {
  CapabilityFactV1, EvidenceRef, GraphSnapshotV1, Provenance, ReferencedObjectV1, Sha256,
   compareText, fnId, parseAddr, assertSnapshotContract, fingerprintWithout,
} from "./graph";

export const CAPABILITY_RULESET_ID = "tools/ff8-harness/src/capabilities.ts";
export const CAPABILITY_RULESET_VERSION = "l2-local-rules-v3";

export interface CapabilityConfig {
  /** 0 disables propagation; 1 copies callee facts to direct callers as inferred/propagated. */
  propagationDepth: 0 | 1;
  /** Deterministic safety bound on propagated facts (canonical order keeps the first N). */
  maxPropagationTotal: number;
}
export const DEFAULT_CAPABILITY_CONFIG: CapabilityConfig = { propagationDepth: 0, maxPropagationTotal: 512 };

interface ImportRule { suffix: string; capability: string; role: string | null }
// Bounded import-name table over the observed FF8 IAT (§6 categories only).
const IMPORT_RULES: readonly ImportRule[] = [
  { suffix: "MSACM32.dll!acmStream", capability: "audio.compression.acm", role: "ADPCM stream codec (hypothetical)" },
  { suffix: "OPENGL32.dll!gl", capability: "rendering.opengl", role: "3D rasterization (hypothetical)" },
  { suffix: "GDI32.dll!", capability: "rendering.gdi", role: "2D blitting (hypothetical)" },
  { suffix: "USER32.dll!", capability: "windowing.messages", role: "window/input pump (hypothetical)" },
  { suffix: "WINMM.dll!time", capability: "time.multimedia", role: "frame pacing (hypothetical)" },
  { suffix: "KERNEL32.dll!Sleep", capability: "time.sleep", role: null },
  { suffix: "KERNEL32.dll!LocalFree", capability: "memory.allocation", role: null },
  { suffix: "KERNEL32.dll!VirtualAlloc", capability: "memory.allocation", role: null },
  { suffix: "KERNEL32.dll!HeapAlloc", capability: "memory.allocation", role: null },
  { suffix: "KERNEL32.dll!ReadFile", capability: "files.read", role: null },
  { suffix: "KERNEL32.dll!WriteFile", capability: "files.write", role: null },
  { suffix: "DDRAW.dll!DirectDrawCreate", capability: "rendering.directdraw", role: null },
  { suffix: "DSOUND.dll!DirectSoundCreate", capability: "audio.directsound", role: null },
  { suffix: "DINPUT.dll!DirectInputCreate", capability: "input.directinput", role: null },
  { suffix: "WS2_32.dll!socket", capability: "network.socket", role: null },
  { suffix: "KERNEL32.dll!EnterCriticalSection", capability: "sync.critical-section", role: null },
  { suffix: "KERNEL32.dll!LeaveCriticalSection", capability: "sync.critical-section", role: null },
  { suffix: "KERNEL32.dll!InitializeCriticalSection", capability: "sync.critical-section", role: null },
  { suffix: "KERNEL32.dll!DeleteCriticalSection", capability: "sync.critical-section", role: null },
  { suffix: "KERNEL32.dll!InterlockedIncrement", capability: "sync.interlocked", role: null },
  { suffix: "KERNEL32.dll!InterlockedDecrement", capability: "sync.interlocked", role: null },
  { suffix: "KERNEL32.dll!InterlockedExchange", capability: "sync.interlocked", role: null },
  { suffix: "KERNEL32.dll!OutputDebugStringA", capability: "diagnostics.debug-output", role: null },
];
const TABLE_DISPATCH_RULES: ReadonlyArray<{ match: RegExp; capability: string; role: string | null }> = [
  { match: /^g_.*Dispatch$/, capability: "rendering.prim-dispatch-table", role: "GPU/software primitive dispatch (hypothetical)" },
  { match: /MagicList|^logic$|^texture_load$/, capability: "magic.table-dispatch", role: "GF magic dispatch (hypothetical)" },
  { match: /^menu_sprite/, capability: "ui.sprite-table", role: "menu sprite draw (hypothetical)" },
];
const RULES_DIGEST: Sha256 = hash(canonical({ import: IMPORT_RULES, table: TABLE_DISPATCH_RULES.map(rule => ({ ...rule, match: rule.match.source })) }));

function factId(parts: Record<string, unknown>): string { return `cap:${hash(canonical(parts)).slice(0, 24)}`; }
function evidenceFrom(record: unknown, id: string, source: string, detail: string): EvidenceRef {
  return { id, source, sha256: hash(canonical(record)), detail };
}
function rulesProvenance(moduleSha256: Sha256, evidence: EvidenceRef[], site: { rva: string | null; kind: Provenance["siteKind"]; xrefType: Provenance["xrefType"] }): Provenance {
  return {
    moduleSha256,
    siteRva: site.rva,
    siteKind: site.kind,
    xrefType: site.xrefType,
    source: CAPABILITY_RULESET_ID,
    sourceVersion: CAPABILITY_RULESET_VERSION,
    sourceHash: RULES_DIGEST,
    evidenceSha256: hash(canonical(evidence)),
  };
}

/**
 * Evaluate the bounded local rule set over a snapshot. Deterministic and
 * order-stable: facts are returned sorted by id. Callers embed the result via
 * withCapabilities(); the cache key below ignores embedded capabilities so the
 * pipeline cannot chase its own tail.
 */
export function evaluateCapabilities(snapshot: GraphSnapshotV1, config: CapabilityConfig = DEFAULT_CAPABILITY_CONFIG): CapabilityFactV1[] {
  if (![0, 1].includes(config.propagationDepth) || !Number.isSafeInteger(config.maxPropagationTotal) || config.maxPropagationTotal < 0 || config.maxPropagationTotal > 16384) throw new Error("capabilities: invalid bounded propagation configuration");
  const facts: CapabilityFactV1[] = [];
  const subjectNodes = new Map(snapshot.nodes.map(node => [node.id, node]));
  const moduleSha256 = snapshot.binaryArtifacts[0]?.contentSha256;
  if (!moduleSha256) throw new Error("capabilities: snapshot without a binary artifact");

  for (const object of snapshot.objects) {
    if (object.kind === "import") {
      const rule = IMPORT_RULES.find(candidate => object.name.includes(candidate.suffix));
      if (!rule) continue;
      const evidence = [evidenceFrom(object, `ev:${object.id}`, "snapshot.objects", `IAT import ${object.name} observed in module`)];
      facts.push({
        schemaVersion: 1,
        id: factId({ rule: "import-capability", subject: object.id, capability: rule.capability }),
        ruleId: "import-capability",
        ruleVersion: CAPABILITY_RULESET_VERSION,
        subjectKind: "region",
        subjectId: object.id,
        capability: rule.capability,
        evidence,
        confidence: "observed",
        scope: "direct",
        hypotheticalRole: rule.role,
        provenance: rulesProvenance(object.moduleSha256, evidence, { rva: null, kind: "import", xrefType: "none" }),
      });
      continue;
    }
    if (object.kind === "table") {
      const rule = TABLE_DISPATCH_RULES.find(candidate => candidate.match.test(object.name));
      if (!rule) continue;
      const evidence = [evidenceFrom(object, `ev:${object.id}`, "snapshot.objects", `dispatch table ${object.name} at ${object.rva ?? "null"} (slot targets tracked, never callees)`)];
      facts.push({
        schemaVersion: 1,
        id: factId({ rule: "table-dispatch", subject: object.id, capability: rule.capability }),
        ruleId: "table-dispatch",
        ruleVersion: CAPABILITY_RULESET_VERSION,
        subjectKind: "region",
        subjectId: object.id,
        capability: rule.capability,
        evidence,
        confidence: "inferred", // a table name is lexical evidence, not a validated business role
        scope: "direct",
        hypotheticalRole: rule.role,
        provenance: rulesProvenance(object.moduleSha256, evidence, { rva: object.rva, kind: "object", xrefType: "data" }),
      });
    }
  }

  // A witnessed import reference supplies a function-local seed. Merely seeing
  // that import elsewhere in the module does not give every function its capability.
  const importFacts = new Map(facts.filter(f => f.ruleId === "import-capability").map(f => [f.subjectId, f]));
  const importUseByFunction = new Map<string, typeof snapshot.unresolved>();
  for (const ref of snapshot.unresolved) {
    if (ref.kind !== "import_unresolved" || !ref.referencedObjectId || !importFacts.has(ref.referencedObjectId)) continue;
    const key = `${ref.fromFunctionId}\u0000${ref.referencedObjectId}`;
    importUseByFunction.set(key, [...(importUseByFunction.get(key) ?? []), ref]);
  }
  for (const refs of importUseByFunction.values()) {
    refs.sort((a, b) => compareText(a.id, b.id));
    const ref = refs[0]!, imported = importFacts.get(ref.referencedObjectId!)!;
    const evidence = [...imported.evidence, evidenceFrom(refs, `ev:import-use:${ref.fromFunctionId}:${imported.id}`, "snapshot.unresolved", "Observed import reference sites; no architecture membership or executed-path claim")];
    const subject = subjectNodes.get(ref.fromFunctionId);
    if (!subject || ref.provenance.moduleSha256 !== subject.moduleSha256 || ref.provenance.siteRva !== ref.siteRva) throw new Error("capabilities: import-use source provenance mismatch");
    facts.push({ ...imported, id: factId({ rule: "import-use", function: ref.fromFunctionId, import: imported.id }), ruleId: "import-use", subjectKind: "function", subjectId: ref.fromFunctionId, evidence, provenance: rulesProvenance(subject.moduleSha256, evidence, { rva: ref.siteRva, kind: "instruction", xrefType: ref.provenance.xrefType }) });
  }

  // Callback candidates stay hypotheses: the capability records registration
  // evidence, never a demonstrated call (ADR-004).
  const callbacksBySource = new Map<string, typeof snapshot.edges>();
  for (const edge of snapshot.edges) {
    if (edge.kind !== "callback_candidate" || edge.status === "invalidated" || edge.retiredInRevision !== null) continue;
    callbacksBySource.set(edge.sourceId, [...(callbacksBySource.get(edge.sourceId) ?? []), edge]);
  }
  for (const [sourceId, sourceEdges] of callbacksBySource) {
    const evidence = [evidenceFrom(sourceEdges.sort((a, b) => compareText(a.id, b.id)), `ev:cb:${sourceId}`, "snapshot.edges", `${sourceEdges.length} callback candidate edge(s) from push-immediate heuristic; hypothesis, not a call`)];
    facts.push({
      schemaVersion: 1,
      id: factId({ rule: "callback-hypothesis", subject: sourceId }),
      ruleId: "callback-hypothesis",
      ruleVersion: CAPABILITY_RULESET_VERSION,
      subjectKind: "function",
      subjectId: sourceId,
      capability: "callback.registration-hypothesis",
      evidence,
      confidence: "inferred",
      scope: "direct",
      hypotheticalRole: null,
      provenance: rulesProvenance(sourceId.split(":")[0]!, evidence, { rva: null, kind: "extractor", xrefType: "none" }),
    });
  }

  if (config.propagationDepth >= 1) {
    const directBySubject = new Map<string, CapabilityFactV1[]>();
    for (const fact of facts) if (fact.scope === "direct" && fact.subjectKind === "function") {
      directBySubject.set(fact.subjectId, [...(directBySubject.get(fact.subjectId) ?? []), fact]);
    }
    const propagated: CapabilityFactV1[] = [];
    const callersByCallee = new Map<string, string[]>();
    for (const edge of snapshot.edges) {
      if (edge.kind !== "direct_call" || edge.status === "invalidated" || edge.retiredInRevision !== null) continue;
      callersByCallee.set(edge.destinationId, [...(callersByCallee.get(edge.destinationId) ?? []), edge.sourceId]);
    }
    for (const [calleeId, subjectFacts] of [...directBySubject.entries()].sort((a, b) => compareText(a[0], b[0]))) {
      const callers = [...new Set(callersByCallee.get(calleeId) ?? [])].sort(compareText);
      for (const callerId of callers) {
        for (const fact of subjectFacts.sort((a, b) => compareText(a.id, b.id))) {
          if (propagated.length >= config.maxPropagationTotal) break;
          const evidence = [evidenceFrom({ callerId, calleeId, capability: fact.capability }, `ev:prop:${callerId}:${fact.id}`, "snapshot.edges", `direct_call ${callerId} -> ${calleeId}; propagated copy of ${fact.capability}, inferred`)];
          propagated.push({
            schemaVersion: 1,
            id: factId({ rule: "propagation-depth1", caller: callerId, source: fact.id }),
            ruleId: "propagation-depth1",
            ruleVersion: CAPABILITY_RULESET_VERSION,
            subjectKind: "function",
            subjectId: callerId,
            capability: fact.capability,
            evidence,
            confidence: "inferred",
            scope: "propagated",
            hypotheticalRole: fact.hypotheticalRole,
            provenance: rulesProvenance(callerId.split(":")[0]!, evidence, { rva: null, kind: "extractor", xrefType: "none" }),
          });
        }
      }
    }
    facts.push(...propagated);
  }
  return facts.sort((a, b) => compareText(a.id, b.id));
}

// --------------------------------------------------------------- cache ----

export interface CapabilityCacheKey {
  moduleSha256: Sha256;
  moduleSha256s: Sha256[];
  inputFingerprint: Sha256;
  rulesetVersion: string;
  configFingerprint: Sha256;
}
export function capabilityInputFingerprint(snapshot: GraphSnapshotV1): Sha256 {
  // Content identity for the cache: the snapshot without embedded capabilities
  // (and without its digest, which would otherwise cover them).
  const stripped: Record<string, unknown> = { ...(snapshot as unknown as Record<string, unknown>) };
  delete stripped.capabilities;
  delete stripped.normalizedFingerprint;
  return hash(canonical(stripped));
}
export function capabilityCacheKey(snapshot: GraphSnapshotV1, config: CapabilityConfig): CapabilityCacheKey {
  assertSnapshotContract(snapshot);
  return {
    moduleSha256: snapshot.binaryArtifacts[0]!.contentSha256,
    moduleSha256s: snapshot.binaryArtifacts.map(a => a.contentSha256).sort(compareText),
    inputFingerprint: capabilityInputFingerprint(snapshot),
    rulesetVersion: `${CAPABILITY_RULESET_VERSION}:${RULES_DIGEST}`,
    configFingerprint: fingerprint(config),
  };
}
const keyText = (key: CapabilityCacheKey): string => canonical(key);

export interface CapabilityCacheStats { size: number; hits: number; misses: number }
/** In-memory cache keyed by binary + normalized content + ruleset version + config. */
export class CapabilityCache {
  private entries = new Map<string, { facts: CapabilityFactV1[]; modules: Sha256[] }>();
  private hits = 0;
  private misses = 0;
  constructor(private readonly maxEntries = 16) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) throw new Error("capabilities: positive cache bound required");
  }
  get(key: CapabilityCacheKey): CapabilityFactV1[] | undefined {
    const entry = this.entries.get(keyText(key));
    if (entry === undefined) { this.misses += 1; return undefined; }
    this.hits += 1;
    return structuredClone(entry.facts);
  }
  set(key: CapabilityCacheKey, facts: CapabilityFactV1[]): void {
    if (!this.entries.has(keyText(key)) && this.entries.size >= this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(keyText(key), { facts: structuredClone(facts), modules: [...key.moduleSha256s] });
  }
  /** Explicit invalidation: all entries, or one module's entries. Returns evicted count. */
  invalidate(moduleSha256?: Sha256): number {
    if (moduleSha256 === undefined) {
      const count = this.entries.size;
      this.entries.clear();
      return count;
    }
    let evicted = 0;
    for (const [key, value] of this.entries) if (value.modules.includes(moduleSha256)) { this.entries.delete(key); evicted += 1; }
    return evicted;
  }
  stats(): CapabilityCacheStats { return { size: this.entries.size, hits: this.hits, misses: this.misses }; }
}
export function evaluateCapabilitiesCached(snapshot: GraphSnapshotV1, cache: CapabilityCache, config: CapabilityConfig = DEFAULT_CAPABILITY_CONFIG): CapabilityFactV1[] {
  const key = capabilityCacheKey(snapshot, config);
  const cached = cache.get(key);
  if (cached) return cached;
  const facts = evaluateCapabilities(snapshot, config);
  cache.set(key, facts);
  return facts;
}

// ------------------------------------------------------- optional capa ----
// This adapter consumes an explicitly supplied, flattened capa export. It does
// not run capa, install rules, or infer the availability of its IDA backend.
export interface CapaEvaluation {
  status: "absent" | "available";
  version: string | null;
  license: string | null;
  backend: "file" | "ida" | null;
  rulesSha256: Sha256 | null;
  limitation: string;
  automaticInstall: false;
  networkRequired: false;
}
export function evaluateCapaAvailability(local: Omit<CapaEvaluation, "status" | "limitation" | "automaticInstall" | "networkRequired"> | null = null): CapaEvaluation {
  if (local && (!local.version || !local.license || !local.backend || !local.rulesSha256 || !/^[a-f0-9]{64}$/.test(local.rulesSha256))) throw new Error("capa: explicit version/license/backend/rules digest required");
  return { status: local ? "available" : "absent", version: local?.version ?? null, license: local?.license ?? null, backend: local?.backend ?? null, rulesSha256: local?.rulesSha256 ?? null, limitation: local ? "Explicit local metadata only; backend coverage and accuracy need a separate measured native evaluation. Runtime consumes frozen exports; no implicit analyzer invocation." : "No local capa metadata supplied; bounded local rules are the deterministic fallback. Neither capa nor its IDA adapter is installed by this module.", automaticInstall: false, networkRequired: false };
}
export interface CapaFrozenExport {
  moduleSha256: Sha256;
  tool: { version: string; license: string; backend: "file" | "ida"; rulesSha256: Sha256; sourceSha256: Sha256 };
  matches: Array<{ functionRva: string; ruleId: string; capability: string; siteRvas: string[]; evidence: EvidenceRef[] }>;
}
export function importCapaCapabilities(snapshot: GraphSnapshotV1, report: CapaFrozenExport): CapabilityFactV1[] {
  assertSnapshotContract(snapshot);
  evaluateCapaAvailability(report.tool);
  if (!/^[a-f0-9]{64}$/.test(report.tool.sourceSha256)) throw new Error("capa: frozen source hash required");
  if (!snapshot.binaryArtifacts.some(a => a.contentSha256 === report.moduleSha256)) throw new Error("capa: export module identity mismatch");
  if (report.matches.length > 16384) throw new Error("capa: match bound exceeded");
  const nodes = new Map(snapshot.nodes.map(n => [n.id, n]));
  const byId = new Map<string, CapabilityFactV1>();
  for (const match of report.matches) {
    const subjectId = fnId(report.moduleSha256, match.functionRva), node = nodes.get(subjectId);
    if (!node || node.status === "quarantined") throw new Error("capa: absent/quarantined function cannot receive native facts");
    if (!match.ruleId || !match.capability || !match.siteRvas.length || match.siteRvas.length > 64 || !match.evidence.length || match.evidence.some(e => !e.id || !e.source || !e.detail || !/^[a-f0-9]{64}$/.test(e.sha256))) throw new Error("capa: match requires bounded sites and evidence");
    const siteRvas = [...new Set(match.siteRvas.map(s => `0x${parseAddr(s).toString(16).toUpperCase()}`))].sort((a, b) => parseAddr(a) < parseAddr(b) ? -1 : parseAddr(a) > parseAddr(b) ? 1 : 0);
    for (const site of siteRvas) if (!node.boundaries.some(span => parseAddr(site) >= parseAddr(span.rva) && parseAddr(site) < parseAddr(span.endRvaExclusive))) throw new Error("capa: evidence site is outside known function chunks");
    const evidence = [...match.evidence].sort((a, b) => compareText(a.id, b.id));
    const fact: CapabilityFactV1 = { schemaVersion: 1, id: factId({ rule: match.ruleId, subjectId, capability: match.capability, sites: siteRvas, rulesSha256: report.tool.rulesSha256 }), ruleId: `capa:${match.ruleId}`, ruleVersion: report.tool.version, subjectKind: "function", subjectId, capability: match.capability, evidence, confidence: "observed", scope: "direct", hypotheticalRole: null, provenance: { moduleSha256: report.moduleSha256, siteRva: siteRvas[0]!, siteKind: "instruction", xrefType: "none", source: `capa-frozen-export:${report.tool.backend}`, sourceVersion: report.tool.version, sourceHash: report.tool.sourceSha256, evidenceSha256: hash(canonical({ siteRvas, evidence, rulesSha256: report.tool.rulesSha256 })) } };
    const prior = byId.get(fact.id);
    if (prior && canonical(prior) !== canonical(fact)) throw new Error("capa: conflicting duplicate match");
    byId.set(fact.id, fact);
  }
  const facts = [...byId.values()].sort((a, b) => compareText(a.id, b.id));
  const candidate = { ...snapshot, capabilities: facts };
  candidate.normalizedFingerprint = fingerprintWithout(candidate, "normalizedFingerprint");
  assertSnapshotContract(candidate);
  return facts;
}
