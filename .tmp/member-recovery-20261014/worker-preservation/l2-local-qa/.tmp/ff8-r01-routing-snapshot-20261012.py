"""Read-only online backup; inspect only the backup, never mutate Ensemble DB."""
from pathlib import Path
import sqlite3
import json
import datetime
import hashlib
import sys

root = Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
dest = root / '.tmp' / ('ff8-r01-ensemble-readonly-' + stamp + '.db')
source = Path.home() / '.config/opencode/ensemble.db'
with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True) as src:
    with sqlite3.connect(dest) as backup:
        src.backup(backup)
with sqlite3.connect(dest.as_uri() + '?mode=ro', uri=True) as db:
    db.row_factory = sqlite3.Row
    tables = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")]
    schemas = {t: [r[1] for r in db.execute('PRAGMA table_info("' + t + '")')]
               for t in tables if any(s in t for s in ['member', 'task', 'routing', 'message', 'event'])}
    members = [dict(r) for r in db.execute('SELECT * FROM team_member WHERE team_id=?', ('team_mv41qy6o_0000_vbge32',))]
    wanted = ['pool-195', 'pool-219', 'resume-canary-495d80-b'] + [f'pool-{i}' for i in range(196,204)]
    rows = [{k: v for k, v in r.items() if k in ['name', 'session_id', 'model', 'model_routing', 'model_override', 'model_variant', 'source_session_id', 'context_mode', 'context_message_id', 'time_created', 'worktree_dir', 'directory', 'variant'] or 'context' in k} for r in members if r['name'] in wanted]
report = {'at': stamp, 'backup': str(dest), 'backup_sha256': hashlib.sha256(dest.read_bytes()).hexdigest(), 'schemas': schemas, 'members': rows}
label = sys.argv[1] if len(sys.argv) > 1 else 'routing-snapshot'
assert label.replace('-', '').isalnum()
out = root / ('docs/missions/ff8-decomp-semantics-2026-10-11-run01/resume-repair-20261012/' + label + '.json')
with out.open('x', encoding='utf8') as f:
    json.dump(report, f, indent=2, ensure_ascii=False)
print(json.dumps({'receipt': str(out), 'backup': str(dest), 'members': [{'name':r['name'], 'session':r['session_id'], 'override':r.get('model_override'), 'selected':json.loads(r['model_routing'])['selected'] if r.get('model_routing') else None} for r in rows]}, ensure_ascii=False))
