import { readFileSync, readdirSync, statSync, chmodSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const ROOTR = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const CO = ROOTR + '/.tmp/coordination-three-20261014';
const DOCS = ROOTR + '/docs/missions/re-graph-scheduler';
const SCHEMAS = ROOTR + '/tools/ff8-harness/schemas';
const SRC = ROOTR + '/tools/ff8-harness/src';

const verify = (p, kind, expectPrefix) => {
  const st = statSync(p);
  assert(st.isFile() && st.nlink === 1, 'regular+nlink1: ' + p);
  const bytes = readFileSync(p);
  const h = createHash('sha256').update(bytes).digest('hex');
  if (expectPrefix) assert.ok(h.startsWith(expectPrefix), 'shaPrefix: ' + p + ' got ' + h.slice(0, 12));
  return { path: p, kind, bytes: bytes.length, sha256: h };
};

function finish(dir, member, entries) {
  mkdirSync(dir, { recursive: true });
  try { for (const n of readdirSync(dir)) chmodSync(dir + '/' + n, 0o666); } catch {}
  const manifest = {
    at: new Date().toISOString(),
    missionId: 'team_mv6tmopg_0000_4urn3c',
    member,
    mode: 'in-place-admitted-source-packet',
    files: entries,
    totalBytes: entries.reduce((n, e) => n + e.bytes, 0),
    stage: 'PARENT_ADMITTED_IN_PLACE_READONLY_PREPARED_NOT_APPROVED',
  };
  writeFileSync(dir + '/INPUT_MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n', { flag: 'w' });
  const rc = {
    at: new Date().toISOString(),
    owner: 'lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (opencode-go/glm-5.3-flash#max)',
    note: 'Detached PARENT_ACCESS_RECEIPT per FOLLOWUP_PACKET_EPERM_DISPOSITION_20261017.',
    manifestSha256: createHash('sha256').update(readFileSync(dir + '/INPUT_MANIFEST.json')).digest('hex'),
    requiresParentApproval: true,
    workerAccessVerified: false,
    nativeValidation: false,
  };
  writeFileSync(dir + '/PARENT_ACCESS_RECEIPT.json', JSON.stringify(rc, null, 2) + '\n', { flag: 'w' });
  for (const n of readdirSync(dir)) chmodSync(dir + '/' + n, 0o444);
  return { dir, files: entries.length, totalBytes: manifest.totalBytes, manifestSha256: rc.manifestSha256 };
}

// ---- Q1 L1 arbitration packet (committed docs only) ----
const q1 = CO + '/V3_Q1_L1_ARBITRATION_INPUTS_20261018';
const q1entries = [
  verify(q1 + '/SCOPE.md', 'rule'),
  verify(DOCS + '/L1_BRIDGES_RARE_INCOMPATIBILITY_20261015.md', 'rule'),
  verify(DOCS + '/CORRECTIVE_FINAL_GATES_20261014.json', 'rule'),
  verify(DOCS + '/ORDRE_MISSION_V2_20261018.md', 'rule'),
];

// ---- L8 parser-B ratification packet (real schemas in place) ----
const l8 = CO + '/V3_L8_PARSER_B_INPUTS_20261018';
const l8entries = [
  verify(l8 + '/SCOPE.md', 'rule'),
  verify(CO + '/l8-command-b-matrix-r1-PUBLIC-REPORT-20261017.md', 'rule'),
  verify(CO + '/l8-schemas-parent-acquisition-20261017.json', 'rule'),
  verify(SCHEMAS + '/cluster-partition-v1.schema.json', 'real-schema-in-place', '199d505c'),
  verify(SCHEMAS + '/investigation-group-v1.schema.json', 'real-schema-in-place', '732ca008'),
  verify(SCHEMAS + '/knowledge-delta-v1.schema.json', 'real-schema-in-place', '732ce472'),
  verify(SRC + '/lineage.ts', 'frozen-loader-reference'),
  verify(SRC + '/investigation-groups.ts', 'frozen-loader-reference'),
];

console.log(JSON.stringify({
  q1: finish(q1, 'l1-arbitration-r1', q1entries),
  l8: finish(l8, 'v3-l8-parser-b-ratifier-r1', l8entries),
}, null, 1));
