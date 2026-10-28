import { readFileSync, writeFileSync } from 'node:fs';

const plugin = 'C:/Users/djden/.config/opencode/local-plugins/ensemble/20261016-mission-policy-5504fe8e8df8/index.js';
const bundle = readFileSync(plugin, 'utf8');
const segment = (from: string, to: string) => {
  const start = bundle.indexOf(from), end = bundle.indexOf(to, start + 1);
  if (start < 0 || end <= start) throw new Error(`router marker missing: ${from}`);
  return bundle.slice(start, end);
};
const source = segment('// src/model-costs.ts', '// src/model-routing-policy.ts') + segment('// src/model-router.ts', '// src/classification-protocol.ts');
const router = new Function(`${source}\nreturn { routeNormalizedModel, effectiveModelPreference, validateModelPreference };`)();

const routing = JSON.parse(readFileSync('C:/Users/djden/.config/opencode/ensemble.json', 'utf8')).modelRouting;
const state = await (await fetch('http://127.0.0.1:4747/api/state')).json();
const team = state.teams.find((t: any) => t.name === 're-graph-scheduler');
const current = { policy: team.modelPolicy.policy, revision: team.modelPolicy.revision, providerOrder: team.routingPolicy.providerOrder, providerRevision: team.routingPolicy.revision };

const proposedModels = current.policy.models.filter((m: any) => m.id !== 'opencode/step-5-preview-free');
proposedModels.push({ id: 'opencode/step-5-preview-free', reasoningEffort: 'default', preference: 0, enabled: false, reserve: false });
const proposed = {
  policy: { ...current.policy, mode: 'legacy', costMode: 'benchmark', models: proposedModels },
  providerOrder: ['opencode-go', 'zai-coding-plan', 'cursor'],
};
router.validateModelPreference(proposed.policy);

const label = (m: any) => {
  const key = `${m.id}#${m.reasoningEffort ?? 'default'}`;
  const short: Record<string, string> = {
    'opencode-go/glm-5.3-flash#max': 'G', 'zai-coding-plan/glm-5.3-flash#max': 'Z',
    'cursor/grok-4.7#Grok 4.7 Extra High': 'K', 'cursor/claude-opus-5-5#Claude Opus 5.5 Max': 'O',
    'openai/gpt-6.1-sol#max': 'S', 'openai/gpt-6.1-sol#xhigh': 's',
  };
  return short[key] ?? `?(${key})`;
};
const userRule = (c: number) => (c <= 60 ? 'G' : c <= 80 ? 'K' : 'O');
const authorized = (cfg: any) => routing.models
  .filter((m: any) => m.available)
  .filter((m: any) => { const e = router.effectiveModelPreference(m, cfg.policy, cfg.providerOrder); return e.enabled && e.preference > 0; })
  .map((m: any) => `${m.id}#${m.reasoningEffort ?? 'default'}`);

const complexities = [0, 20, 40, 50, 55, 57, 58, 60, 61, 65, 70, 75, 76, 77, 78, 80, 81, 85, 90, 95, 100];
const risks = [0, 30, 50, 80, 90, 99];
const route = (cfg: any, c: number, r: number) => router.routeNormalizedModel({
  ...routing, complexity: c / 100, risk: r / 100, providerOrder: cfg.providerOrder, preference: cfg.policy, distributionState: {},
});

const report: any = { at: new Date().toISOString(), plugin, beta: routing.beta, intelligenceRange: routing.intelligenceRange, globalCostMode: routing.costMode,
  current: { revision: current.revision, mode: current.policy.mode, costMode: current.policy.costMode, providerOrder: current.providerOrder, providerRevision: current.providerRevision, authorized: authorized(current) },
  proposed: { mode: proposed.policy.mode, costMode: proposed.policy.costMode, providerOrder: proposed.providerOrder, authorized: authorized(proposed) },
  legend: 'G=opencode-go GLM 5.3 Flash max, Z=zai GLM 5.3 Flash max, K=cursor Grok 4.7 Extra High, O=cursor Claude Opus 5.5 Max, S/s=openai Sol max/xhigh',
  grid: [] as any[] };
const lines: string[] = [`c:        ${complexities.map((c) => String(c).padStart(3)).join('')}`, `user(c):  ${complexities.map((c) => userRule(c).padStart(3)).join('')}`];
for (const [name, cfg] of [['current', current], ['proposed', proposed]] as const) {
  for (const r of risks) {
    const cells = complexities.map((c) => {
      const result = route(cfg, c, r);
      report.grid.push({ config: name, complexity: c, risk: r, demand: result.demand, requiredIntelligence: result.requiredIntelligence, selected: `${result.selected.id}#${result.selected.reasoningEffort}`, fallback: result.fallback ? `${result.fallback.id}#${result.fallback.reasoningEffort}` : null });
      return label(result.selected);
    });
    lines.push(`${name.slice(0, 4)} r=${String(r).padStart(2)}: ${cells.map((x) => x.padStart(3)).join('')}`);
  }
}
const proposedRisk0 = report.grid.filter((g: any) => g.config === 'proposed' && g.risk === 0);
report.proposedRisk0MismatchesVsUserRule = proposedRisk0.filter((g: any) => label({ id: g.selected.split('#')[0], reasoningEffort: g.selected.split('#')[1] }) !== userRule(g.complexity)).map((g: any) => g.complexity);
report.openAiAutomaticSelectionsProposed = report.grid.filter((g: any) => g.config === 'proposed' && g.selected.startsWith('openai/')).length;
writeFileSync(new URL('./route-preview-result-20261017.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(lines.join('\n'));
console.log(JSON.stringify({ currentAuthorized: report.current.authorized.length, proposedAuthorized: report.proposed.authorized, extraInCurrent: report.current.authorized.filter((k: string) => !report.proposed.authorized.includes(k)), proposedRisk0Mismatches: report.proposedRisk0MismatchesVsUserRule, openAiAutomaticSelectionsProposed: report.openAiAutomaticSelectionsProposed }));
