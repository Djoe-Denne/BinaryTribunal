import { Database } from 'bun:sqlite';

const db = new Database('C:/Users/djden/.config/opencode/ensemble.db', { readonly: true });
const team = 'team_mv6tmopg_0000_4urn3c';
const out: Record<string, unknown> = {};
for (const member of ['v3-guardian-core-r1', 'v3-kernel-observer-r1']) {
  const row = db.query('SELECT content, time_created FROM team_message WHERE team_id = ? AND from_name = ? ORDER BY time_created DESC LIMIT 1').get(team, member) as { content: string; time_created: number } | null;
  const text = row?.content ?? '';
  const pins = [...text.matchAll(/([A-Za-z.]+\.(?:cs|md|json))\s*[—-]\s*(\d+)B\s*[—-]\s*([0-9a-f]{64})/g)].map((m) => ({ file: m[1], bytes: Number(m[2]), sha256: m[3] }));
  out[member] = { at: row ? new Date(row.time_created).toISOString() : null, completed: /Status:\s*completed|<status>completed/.test(text), pins };
}
db.close();
console.log(JSON.stringify(out, null, 1));
