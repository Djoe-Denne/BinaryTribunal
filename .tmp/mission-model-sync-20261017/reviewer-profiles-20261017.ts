import { Database } from 'bun:sqlite';
const db = new Database('C:/Users/djden/.config/opencode/ensemble.db', { readonly: true });
const rows = db
  .query("SELECT name, agent, model, status FROM team_member WHERE team_id = ? AND name IN ('v3-contract-review-r1','mission-frontier-r1','v3-budget-source-r1')")
  .all('team_mv6tmopg_0000_4urn3c');
db.close();
console.log(JSON.stringify(rows, null, 1));
