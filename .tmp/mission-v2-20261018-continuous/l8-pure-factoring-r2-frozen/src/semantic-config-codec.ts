// Pure semantic configuration checks, fingerprinting and ownership copying.
import { canonical, hash } from "./validation";
import type { MultiviewConfig, FrozenEncoder, ProvenanceView, MultiviewViews } from "./semantic-index";

/** Own the data before validation or any host hook; never freeze caller objects. */
export function immutableSnapshot<T>(value: T): T {
  const copy = structuredClone(value);
  const pending: unknown[] = [copy];
  const seen = new Set<object>();
  while (pending.length) {
    const item = pending.pop();
    if (item === null || typeof item !== "object" || seen.has(item)) continue;
    seen.add(item);
    for (const child of Object.values(item)) pending.push(child);
    Object.freeze(item);
  }
  return copy;
}


export const ALGORITHM = "multiview-components";


export const ALGORITHM_VERSION = "2";


export const LEXICAL_RULESET_VERSION = "ff8-tech-syn-1";


export function configFingerprint(config: MultiviewConfig, encoder: Omit<FrozenEncoder, "encode"> | null): string {
  config = immutableSnapshot(config);
  return hash(canonical({
    algorithm: ALGORITHM,
    algorithmVersion: ALGORITHM_VERSION,
    rulesetVersion: config.rulesetVersion,
    synonyms: config.synonyms,
    bm25: config.bm25,
    topK: config.topK,
    scoreTieDecimals: config.scoreTieDecimals,
    similarityThreshold: config.similarityThreshold,
    maxPostingDf: config.maxPostingDf,
    maxCandidates: config.maxCandidates,
    hubMinDegree: config.hubMinDegree,
    hysteresis: config.hysteresis,
    views: config.views,
    encoder: encoder && config.views.embeddings ? {
      modelId: encoder.modelId,
      tokenizerRevision: encoder.tokenizerRevision,
      parameterFingerprint: encoder.parameterFingerprint,
      dimension: encoder.dimension,
      implementationSha256: encoder.implementationSha256 ?? null,
      tokenizerSha256: encoder.tokenizerSha256 ?? null,
    } : null,
  }));
}


export function provenanceReady(provenance: ProvenanceView): boolean {
  return !!provenance && typeof provenance.source === "string" && provenance.source.length > 0
    && typeof provenance.sourceVersion === "string" && provenance.sourceVersion.length > 0
    && ["instruction", "object", "import", "table", "extractor"].includes(provenance.siteKind)
    && ["code", "data", "none"].includes(provenance.xrefType)
    && (provenance.siteRva === null ? ["import", "extractor"].includes(provenance.siteKind) : typeof provenance.siteRva === "string" && /^0x(?:0|[1-9A-F][0-9A-F]*)$/.test(provenance.siteRva))
    && /^[a-f0-9]{64}$/.test(provenance.moduleSha256)
    && /^[a-f0-9]{64}$/.test(provenance.evidenceSha256)
    && /^[a-f0-9]{64}$/.test(provenance.sourceHash);
}


export function validConfig(config: MultiviewConfig): boolean {
  if (!config || !config.bm25 || !config.views || config.rulesetVersion !== LEXICAL_RULESET_VERSION || typeof config.synonyms !== "boolean") return false;
  const integer = (value: number, min: number, max: number) => Number.isSafeInteger(value) && value >= min && value <= max;
  return Number.isFinite(config.bm25.k1) && config.bm25.k1 > 0 && config.bm25.k1 <= 100
    && Number.isFinite(config.bm25.b) && config.bm25.b >= 0 && config.bm25.b <= 1
    && integer(config.topK, 1, 100) && integer(config.maxCandidates, 1, 10000) && integer(config.maxPostingDf, 1, 1000000)
    && integer(config.scoreTieDecimals, 0, 12) && integer(config.hubMinDegree, 1, 1000000)
    && Number.isFinite(config.similarityThreshold) && config.similarityThreshold >= 0 && config.similarityThreshold <= 1
    && Number.isFinite(config.hysteresis) && config.hysteresis >= 0 && config.hysteresis <= 1
    && ["structure", "data", "lexical", "embeddings", "validatedRelations", "capabilities"].every(key => typeof config.views[key as keyof MultiviewViews] === "boolean");
}

