import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const snapRaw = readFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/mission-model-sync-20261017/ensemble-global-snapshot.json', 'utf8');
const snapSha = createHash('sha256').update(snapRaw).digest('hex');
const snap = JSON.parse(snapRaw);
const cur = JSON.parse(readFileSync('C:/Users/djden/.config/opencode/ensemble.json', 'utf8'));

const sm = snap.modelRouting ?? snap;
const cm = cur.modelRouting;
const snapModels: any[] = sm.models ?? [];
const key = (m: any) => `${m.id}#${m.reasoningEffort ?? 'default'}`;
const curMap = new Map((cm.models ?? []).map((m: any) => [key(m), m]));
const snapMap = new Map(snapModels.map((m: any) => [key(m), m]));

const onlyInSnap: string[] = [];
const onlyInCur: string[] = [];
const changed: any[] = [];
for (const [k, m] of snapMap) {
  const c = curMap.get(k);
  if (!c) { onlyInSnap.push(k); continue; }
  const diffs: Record<string, [unknown, unknown]> = {};
  for (const f of ['available', 'intelligenceScore', 'averageCostPerTask', 'benchmarkCostPerTask', 'amortizedCostPerTask', 'accessMode', 'effectiveCostPerTask']) {
    if (JSON.stringify(m[f]) !== JSON.stringify(c[f])) diffs[f] = [m[f], c[f]];
  }
  if (Object.keys(diffs).length) changed.push({ k, diffs });
}
for (const k of curMap.keys()) if (!snapMap.has(k)) onlyInCur.push(k);

console.log(JSON.stringify({
  snapshotSha256: snapSha,
  snapshotMatchesUserStatedSha: snapSha === '0a0e3d4d67812ebc09ca5c76ea0b73d5f0b677e10e1c89bc66ff753e8f42ebaa',
  snapshotEntries: snapModels.length,
  snapshotIntelligenceRange: sm.intelligenceRange ?? null,
  snapshotCostMode: sm.costMode ?? null,
  snapshotBeta: sm.beta ?? null,
  currentEntries: curMap.size,
  currentIntelligenceRange: cm.intelligenceRange,
  currentCostMode: cm.costMode,
  onlyInSnapshot: onlyInSnap,
  onlyInCurrent: onlyInCur,
  changedCount: changed.length,
  changedEntries: changed.slice(0, 40),
}, null, 1));
