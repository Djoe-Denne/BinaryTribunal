import fs from 'node:fs';
const e=JSON.parse(fs.readFileSync(0,'utf8'));
if(!e.event)throw Error('Missing event kind');
fs.appendFileSync('docs/missions/ff8-decomp-semantics-2026-10-11-run01/ledger.jsonl',JSON.stringify({at_utc:new Date().toISOString(),...e})+'\n','utf8');
console.log(JSON.stringify({recorded:e.event,ea:e.ea}));
