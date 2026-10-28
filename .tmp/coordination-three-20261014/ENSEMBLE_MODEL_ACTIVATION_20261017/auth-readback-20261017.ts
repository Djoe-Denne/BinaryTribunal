import { writeFileSync } from 'node:fs';
import { Service } from '../../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const endpoint = await Service.discover();
if (!endpoint) throw new Error('OpenCode service not discovered');
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const auth = (await client.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} })).output as any;
const state = await (await fetch('http://127.0.0.1:4747/api/state')).json();
const team = state.teams.find((t: any) => t.name === 're-graph-scheduler');
const lead = await client.session.get({ sessionID: team.leadSessionId });
const busy = team.members.filter((m: any) => m.status === 'busy').map((m: any) => ({ name: m.name, model: m.model }));
const out = {
  at: new Date().toISOString(),
  guardReady: auth.ready,
  teamPaused: auth.pausedTeams.includes(team.id),
  teamAdmissionPaused: auth.admissionPausedTeams.includes(team.id),
  availablePairsGlobal: auth.availablePairs ?? auth.available?.length ?? null,
  modelPolicyRevision: team.modelPolicy.revision,
  modelPolicyMode: team.modelPolicy.policy.mode,
  costMode: team.modelPolicy.policy.costMode,
  providerOrder: team.routingPolicy.providerOrder,
  providerRevision: team.routingPolicy.revision,
  scheduling: team.scheduling,
  capacity: team.capacity,
  leadSession: lead.id,
  leadModel: lead.model,
  busyMembers: busy,
};
writeFileSync(new URL(`./policy-rev${out.modelPolicyRevision}-readback-20261017.json`, import.meta.url), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out));
