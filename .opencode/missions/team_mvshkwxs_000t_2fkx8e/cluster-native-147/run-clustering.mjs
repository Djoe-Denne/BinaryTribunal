// Existing pure clusterGraph on a pinned live-IDA topology export. No RMS store/admission.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const repo = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const dir = join(repo, '.opencode/missions/team_mvshkwxs_000t_2fkx8e/cluster-native-147');
const wt = 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-2fkx8e-raccord-native-runtime';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (v, why) => { if (!v) throw new Error(why); };
const [algorithm, expectedInputHash] = process.argv.slice(2);
const started = Date.now();
try {
  need(process.argv.length === 4 && ['historical-cc', 'hub-baseline', 'leiden'].includes(algorithm)
    && /^[a-f0-9]{64}$/.test(expectedInputHash), 'Expected supported algorithm and independently witnessed export SHA');
  const target = join(dir, `clusters-${algorithm}.json`);
  need(!existsSync(target), 'Output exists; no overwrite or implicit retry');
  const raw = readFileSync(join(dir, 'ida-calls.json'));
  need(sha(raw) === expectedInputHash, 'Native topology bytes differ from witnessed export');
  const source = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
  need(source.version === 'ida-direct-topology-test-v2' && source.inputSha256
    === '064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
    && source.idbMutated === false && source.debuggeeStarted === false && source.coverage.status === 'partial',
    'Not the retained read-only partial native export');
  need(source.extractorSha256 === sha(readFileSync(join(dir, 'export_ida_calls.py'))), 'Extractor provenance differs');
  // Canonical symbol-navigation version and pinned candidate must have identical clustering code.
  for (const name of ['cluster.ts', 'graph.ts', 'validation.ts', 'planner-relation-codecs.ts', 'sparse-graph-codecs.ts', 'group-context-codecs.ts']) {
    const rel = `tools/ff8-harness/src/${name}`;
    need(sha(readFileSync(join(repo, rel))) === sha(readFileSync(join(wt, rel))), `Canonical/candidate source differs: ${name}`);
  }
  const { clusterGraph } = await import(pathToFileURL(join(wt, 'tools/ff8-harness/src/cluster.ts')).href);
  const { fnId, canonicalAddr } = await import(pathToFileURL(join(wt, 'tools/ff8-harness/src/graph.ts')).href);
  const { fingerprint } = await import(pathToFileURL(join(wt, 'tools/ff8-harness/src/validation.ts')).href);
  const byEa = new Map(source.nodes.map(n => [n.ea, n]));
  need(byEa.size === source.nodes.length && byEa.size > 0, 'Duplicate/empty native function universe');
  const id = ea => fnId(source.inputSha256, canonicalAddr(ea - source.imageBase));
  const nodes = source.nodes.map(n => {
    need(n.ea - source.imageBase === n.rva && n.chunks.every(([a,b]) => a < b)
      && n.sizeBytes === n.chunks.reduce((s,[a,b]) => s+b-a,0), 'Invalid native node projection');
    return { id: id(n.ea), moduleSha256: source.inputSha256, rva: canonicalAddr(n.rva),
      functionClass: n.functionClass, status: 'observed', semanticMaturity: 'none',
      sizeBytes: { known: true, value: n.sizeBytes }, instructionCount: { known: false, value: null } };
  });
  const edges = source.edges.map(e => {
    need(byEa.has(e.sourceEa) && byEa.has(e.destinationEa)
      && ['direct_call','tail_jump','thunk'].includes(e.kind) && e.sites.length > 0, 'Missing native relation endpoint');
    const owner = byEa.get(e.sourceEa);
    need(e.sites.every(site => owner.chunks.some(([a,b]) => a <= site && site < b)), 'Relation site outside actual owner chunks');
    return { sourceId: id(e.sourceEa), destinationId: id(e.destinationEa), kind: e.kind,
      status: 'observed', confidence: 'high', retiredInRevision: null,
      sites: e.sites.map(site => ({ siteRva: canonicalAddr(site-source.imageBase), xrefType: 'code' })) };
  });
  const input = { snapshotId: `ida-topology:${expectedInputHash}`, normalizedFingerprint: fingerprint({
    nativeExportSha256: expectedInputHash, adapterVersion: 'ida-direct-cluster-input-v2' }),
    nodes, edges, objects: [], unresolved: [], capabilities: [], coverage: source.coverage };
  const computeStart = Date.now();
  const result = clusterGraph(input, { algorithm });
  const computeMs = Date.now() - computeStart;
  const members = result.partition.communities.flatMap(c => c.memberIds);
  const expectedIds = new Set(nodes.map(n => n.id));
  need(members.length === nodes.length && new Set(members).size === nodes.length
    && members.every(x => expectedIds.has(x)), 'Partition drops/duplicates/adds a native function');
  for (const c of result.partition.communities) {
    const owned = new Set(c.memberIds);
    need(c.memberIds.length > 0 && c.kernelIds.every(x => owned.has(x))
      && c.externalContextIds.every(x => expectedIds.has(x) && !owned.has(x)), 'Invalid community ownership/context');
  }
  let deterministicRepeatMs = null;
  if (algorithm === 'leiden') {
    const repeatStart = Date.now(), repeat = clusterGraph(input, { algorithm });
    deterministicRepeatMs = Date.now() - repeatStart;
    need(fingerprint(repeat.partition) === fingerprint(result.partition), 'Seeded Leiden not deterministic on exact same input');
  }
  const output = { version: 'ida-clustering-test-result-v1', algorithm,
    inputRef: { sha256: expectedInputHash, byteLength: raw.length },
    moduleSha256: source.inputSha256, adapterVersion: 'ida-direct-cluster-input-v2', coverage: source.coverage,
    sourceQuarantinedEas: source.quarantinedEas, sourceUnresolvedCounts: source.counts,
    projectionLimits: 'Topology-only test: omitted indirect resolutions, shared-data/callback affinities and capabilities are NOT claimed absent. Default algorithm affinities/weights are heuristic, not calibrated.',
    partition: result.partition, metrics: result.metrics,
    checks: { exactPartitionCoverage: true, uniqueOwnership: true, validExternalContext: true,
      deterministicRepeat: algorithm === 'leiden' ? true : null },
    computeMs, deterministicRepeatMs, durationMs: Date.now()-started,
    nativeModelExecuted: false, rmsOriginCommitted: false, idbMutated: false, scientificPromotion: false };
  const utf8 = JSON.stringify(output) + '\n';
  writeFileSync(target, utf8, { flag: 'wx' });
  need(readFileSync(target).equals(Buffer.from(utf8)), 'Cluster output exact readback failed');
  const sizes = result.partition.communities.map(c => c.memberIds.length).sort((a,b)=>b-a);
  console.log(JSON.stringify({ status:'CLUSTERING_TEST_PASS', algorithm, path:target, sha256:sha(Buffer.from(utf8)),
    byteLength:Buffer.byteLength(utf8), nodes:nodes.length, relations:edges.length,
    communities:sizes.length, largestSizes:sizes.slice(0,10), singletons:sizes.filter(n=>n===1).length,
    modularity:result.metrics.modularity, hubs:result.metrics.hubIds.length, isolated:result.metrics.isolatedIds.length,
    computeMs, deterministicRepeatMs, durationMs:Date.now()-started, checks:output.checks,
    nativeModelExecuted:false, rmsOriginCommitted:false, idbMutated:false }));
} catch(e) {
  console.error(JSON.stringify({ status:'CLUSTERING_TEST_REFUSED', algorithm,
    error:String(e?.message||e).slice(0,2500), durationMs:Date.now()-started,
    instruction:'Preserve outputs; no automatic retry/overwrite', nativeModelExecuted:false, idbMutated:false }));
  process.exitCode=1;
}
