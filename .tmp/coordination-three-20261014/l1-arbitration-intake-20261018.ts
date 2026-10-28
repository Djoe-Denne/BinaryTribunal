import { readFileSync, readdirSync, lstatSync, statSync, chmodSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';

const OUT = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014/V3_Q1_L1_ARBITRATION_OUTPUT_20261018';
const CO = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014';
const p = OUT + '/L1_ARBITRATION_PROPOSAL.md';
const l = lstatSync(p);
assert(l.isFile() && !l.isSymbolicLink() && statSync(p).nlink === 1, 'regular+nlink1');
assert.strictEqual(readdirSync(OUT).sort().join(','), 'L1_ARBITRATION_PROPOSAL.md', 'exactly 1 file');
const bytes = readFileSync(p);
assert.strictEqual(bytes.length, 18327, 'size');
assert.strictEqual(createHash('sha256').update(bytes).digest('hex'), '01365c743ad78de6640b3bc4461469c4f56a24ef0c37fad9c7a8ba6b891a43fa', 'sha');
chmodSync(p, 0o444);

const receipt = {
  at: new Date().toISOString(),
  owner: 'lead ses_eca40a8e2ffeanEKTBLiGjDNw8 (opencode-go/glm-5.3-flash#max)',
  author: 'l1-arbitration-r1 ses_eb1ef5546ffeye3txx4zNalV8v (opencode-go/glm-5.3-flash max)',
  file: { name: 'L1_ARBITRATION_PROPOSAL.md', bytes: 18327, sha256: '01365c743ad78de6640b3bc4461469c4f56a24ef0c37fad9c7a8ba6b891a43fa', frozenReadonly: true },
  sections: '5/5 per SCOPE: strict protection (3 invariants, original rejection = correct regression on incompatible fixture), positive-variant real scope (discriminates site/span incoherence, NOT L1-L2 compat), missing link verified by greps (NO test:line anchor for the strict-reject/positive pair in pinned sources — options A/B1/B2), closure-without-whitelist cumulative C1-C5 + forever-outside list, impacted gates + what the author does not decide',
  parentDisposition: {
    adopted: 'B1 — read-only search of the FROZEN L7 QA test gels for D1 (original strict rejection of 69278ee8) and D2 (positive bb3b194a): if both found, the link closes by parent-quoted test:line; execution parent-only, next gate',
    fallback: 'B2 — minimal disjoint test case (D1+D2+D3 derived invariants) via separate sourceGO + fresh author',
    rejected: 'A (already-covered) — refused without test:line proof, per the proposal itself',
    closureVerb: 'stays parent-only, infallible wording: "clos pour la paire telle que gelée, aucune règle changée" — L1BridgesRare20261015 remains OPEN in the gates until every cumulative condition C1-C5 is evidenced',
  },
  stage: 'L1_ARBITRATION_PROPOSAL_INTAKE_PARENT_DISPOSITION_B1_ADOPTED_SEARCH_PENDING_NOT_CLOSURE',
};
writeFileSync(CO + '/l1-arbitration-intake-disposition-20261018.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ intake: true, disposition: 'B1 adopted', file: receipt.file }));
