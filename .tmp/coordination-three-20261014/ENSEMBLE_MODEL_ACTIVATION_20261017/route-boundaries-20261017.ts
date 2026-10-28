import { readFileSync } from 'node:fs';

const bundle = readFileSync('C:/Users/djden/.config/opencode/local-plugins/ensemble/20261016-mission-policy-5504fe8e8df8/index.js', 'utf8');
const segment = (from: string, to: string) => bundle.slice(bundle.indexOf(from), bundle.indexOf(to, bundle.indexOf(from) + 1));
const router = new Function(`${segment('// src/model-costs.ts', '// src/model-routing-policy.ts')}${segment('// src/model-router.ts', '// src/classification-protocol.ts')}\nreturn { routeNormalizedModel };`)();
const routing = JSON.parse(readFileSync('C:/Users/djden/.config/opencode/ensemble.json', 'utf8')).modelRouting;
const team = (await (await fetch('http://127.0.0.1:4747/api/state')).json()).teams.find((t: any) => t.name === 're-graph-scheduler');
const tier = (c: number, r: number) => {
  const s = router.routeNormalizedModel({ ...routing, complexity: c / 100, risk: r / 100, providerOrder: team.routingPolicy.providerOrder, preference: team.modelPolicy.policy, distributionState: {} }).selected;
  return s.id.includes('glm') ? 'GLM' : s.id.includes('grok') ? 'Grok' : s.id.includes('opus') ? 'Opus' : s.id;
};
const bands: Record<string, string> = {};
for (const r of [0, 50, 80, 90, 99]) {
  const seq = Array.from({ length: 101 }, (_, c) => tier(c, r));
  const ranges: string[] = [];
  let start = 0;
  for (let c = 1; c <= 101; c++) if (c === 101 || seq[c] !== seq[start]) { ranges.push(`${seq[start]} ${start}-${c - 1}`); start = c; }
  bands[`risk${r}`] = ranges.join(', ');
}
console.log(JSON.stringify({ policyRevision: team.modelPolicy.revision, providerRevision: team.routingPolicy.revision, bands }, null, 1));
