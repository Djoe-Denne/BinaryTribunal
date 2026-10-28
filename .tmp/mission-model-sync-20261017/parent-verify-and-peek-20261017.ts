import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Database } from 'bun:sqlite';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const cfgPath = 'C:/Users/djden/.config/opencode/ensemble.json';
const bytes = readFileSync(cfgPath);
const sha = createHash('sha256').update(bytes).digest('hex');
const cfg = JSON.parse(bytes.toString('utf8'));
const models: any[] = cfg.modelRouting?.models ?? [];
const st = statSync(cfgPath);
const statedSha = '0a0e3d4d67812ebc09ca5c76ea0b73d5f0b677e10e1c89bc66ff753e8f42ebaa';

const before = JSON.parse(readFileSync(root + '/.tmp/coordination-three-20261014/ENSEMBLE_MODEL_ACTIVATION_20261017/ensemble.json.before', 'utf8'));
const beforeKeys = new Set(before.modelRouting.models.map((m: any) => `${m.id}#${m.reasoningEffort ?? 'default'}`));
const newEntries = models
  .filter((m: any) => !beforeKeys.has(`${m.id}#${m.reasoningEffort ?? 'default'}`))
  .map((m: any) => ({ id: m.id, effort: m.reasoningEffort, available: m.available, iq: m.intelligenceScore }));

const authorized: Array<[string, string]> = [
  ['opencode-go/glm-5.3-flash', 'max'],
  ['zai-coding-plan/glm-5.3-flash', 'max'],
  ['cursor/grok-4.7', 'Grok 4.7 Extra High'],
  ['cursor/claude-opus-5-5', 'Claude Opus 5.5 Max'],
];
const authorizedStatus = authorized.map(([id, effort]) => {
  const m = models.find((x: any) => x.id === id && (x.reasoningEffort ?? 'default') === effort);
  return { id, effort, found: !!m, available: m?.available ?? null };
});

const syncDir = root + '/.tmp/mission-model-sync-20261017';
let syncFiles: any[] = [];
try {
  syncFiles = readdirSync(syncDir).map((n) => {
    if (n === 'parent-verify-and-peek-20261017.ts') return null;
    const s = statSync(syncDir + '/' + n);
    return { n, bytes: s.size, mtimeUtc: s.mtime.toISOString() };
  }).filter(Boolean);
} catch (e) {
  syncFiles = [{ error: String(e).slice(0, 140) }];
}

const endpoint = await Service.discover();
if (!endpoint) throw new Error('OpenCode service not discovered');
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const auth = (await client.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
const lead = await client.session.get({ sessionID: 'ses_eca40a8e2ffeanEKTBLiGjDNw8' });

const state = await (await fetch('http://127.0.0.1:4747/api/state')).json();
const team = state.teams.find((t: any) => t.name === 're-graph-scheduler');
const exposed: any[] = team.modelPolicy.catalogue ?? [];
const exposedAuthorized = exposed
  .filter((m: any) => m.enabled && m.preference > 0)
  .map((m: any) => `${m.id}#${m.reasoningEffort}=${m.preference}${m.reserve ? 'R' : ''}`);

const db = new Database('C:/Users/djden/.config/opencode/ensemble.db', { readonly: true });
const undelivered = db
  .query("SELECT from_name, to_name, time_created, length(content) AS bytes, substr(content,1,240) AS preview FROM team_message WHERE team_id = ? AND delivered = 0 ORDER BY time_created ASC LIMIT 20")
  .all(team.id) as any[];
db.close();

console.log(JSON.stringify({
  global: {
    sha256: sha, matchUserStated: sha === statedSha,
    entries: models.length, matchUserStatedCount: models.length === 55,
    mtimeUtc: st.mtime.toISOString(),
    beta: cfg.modelRouting.beta, intelligenceRange: cfg.modelRouting.intelligenceRange, costMode: cfg.modelRouting.costMode,
    pausedTeamsGlobal: cfg.modelRouting.pausedTeams ?? null,
  },
  authorizedPairsStillAvailable: authorizedStatus,
  newEntriesVsPreActivation: newEntries,
  missionSyncDir: syncFiles,
  auth: { ready: auth.ready, availablePairs: auth.availablePairs, teamPaused: (auth.pausedTeams ?? []).includes(team.id), admissionPaused: (auth.admissionPausedTeams ?? []).includes(team.id) },
  leadModelPreserved: lead.model,
  mission: { policyRevision: team.modelPolicy.revision, mode: team.modelPolicy.policy.mode, costMode: team.modelPolicy.policy.costMode, providerRevision: team.routingPolicy.revision, providerOrder: team.routingPolicy.providerOrder, exposedAuthorized, scheduling: team.scheduling, capacity: team.capacity },
  undeliveredCount: undelivered.length,
  undelivered: undelivered.map((m: any) => ({ from: m.from_name, to: m.to_name, at: new Date(m.time_created).toISOString(), bytes: m.bytes, preview: String(m.preview).replace(/\s+/g, ' ') })),
}, null, 1));
