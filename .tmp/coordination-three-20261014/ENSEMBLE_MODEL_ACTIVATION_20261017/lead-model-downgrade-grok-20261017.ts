import { writeFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { Database } from 'bun:sqlite';
import { Service } from '../../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const endpoint = await Service.discover();
if (!endpoint) throw new Error('OpenCode service not discovered');
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });

const state = await (await fetch('http://127.0.0.1:4747/api/state')).json();
const team = state.teams.find((t: any) => t.name === 're-graph-scheduler');
const leadId = team.leadSessionId;

const before = await client.session.get({ sessionID: leadId });
assert.equal(before.id, 'ses_eca40a8e2ffeanEKTBLiGjDNw8', 'unexpected lead session');

// Grok 4.7 Extra High is enabled (pref 100) in mission policy rev 5 and available globally,
// so the model-authorization guard admits this switch. Takes effect on subsequent lead turns.
const desired = { providerID: 'cursor', id: 'grok-4.7', variant: 'Grok 4.7 Extra High' };
await client.session.switchModel({ sessionID: leadId, model: desired });
const after = await client.session.get({ sessionID: leadId });
assert.deepEqual(after.model, desired, 'switch did not apply');

const receipt = {
  at: new Date().toISOString(),
  leadSession: after.id,
  before: before.model,
  after: after.model,
  reason:
    'User objected to Opus 5.5 Max cost for the supervisor. Reverted to the user-stated mid-tier default Grok 4.7 Extra High (subsidized Cursor pool, far cheaper). Hard design/review work stays delegated to workers at the right complexity tier. Effective on subsequent lead turns; this turn not retroactively repriced.',
  policyRevisionUnchanged: team.modelPolicy.revision,
  providerRevisionUnchanged: team.routingPolicy.revision,
  schedulingUnchanged: team.scheduling,
  capacityUnchanged: team.capacity,
};
writeFileSync(new URL('./lead-model-downgrade-grok-20261017.json', import.meta.url), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });

// Read-only peek at what the wake refers to. No consumption, bounded previews, keeps this turn lean.
const db = new Database('C:/Users/djden/.config/opencode/ensemble.db', { readonly: true });
const undelivered = db
  .query(
    "SELECT from_name, to_name, delivered, time_created, length(content) AS bytes, substr(content,1,200) AS preview FROM team_message WHERE team_id = ? AND delivered = 0 ORDER BY time_created DESC LIMIT 12",
  )
  .all(team.id) as any[];
const recentToLead = db
  .query(
    "SELECT from_name, delivered, time_created, length(content) AS bytes, substr(content,1,140) AS preview FROM team_message WHERE team_id = ? AND to_name='lead' ORDER BY time_created DESC LIMIT 6",
  )
  .all(team.id) as any[];
db.close();

const fmt = (m: any) => ({ from: m.from_name, to: m.to_name, delivered: m.delivered, at: new Date(m.time_created).toISOString(), bytes: m.bytes, preview: String(m.preview).replace(/\s+/g, ' ') });
console.log(
  JSON.stringify(
    {
      switch: { before: before.model, after: after.model },
      undeliveredCount: undelivered.length,
      undelivered: undelivered.map(fmt),
      recentToLead: recentToLead.map(fmt),
    },
    null,
    1,
  ),
);
