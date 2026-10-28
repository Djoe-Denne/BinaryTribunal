"""Read-only routing snapshot for admission hardening; never write the live DB."""
from pathlib import Path
import datetime
import hashlib
import json
import sqlite3

root = Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
backup_path = root / '.tmp' / ('ff8-r01-hardening-readonly-' + stamp + '.db')
source = Path.home() / '.config/opencode/ensemble.db'
with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True) as source_db:
    with sqlite3.connect(backup_path) as backup_db:
        source_db.backup(backup_db)
with sqlite3.connect(backup_path.as_uri() + '?mode=ro', uri=True) as db:
    db.row_factory = sqlite3.Row
    members = [dict(row) for row in db.execute(
        'SELECT * FROM team_member WHERE team_id=?', ('team_mv41qy6o_0000_vbge32',))]
    keep = {'name', 'session_id', 'model', 'model_routing', 'model_override',
            'model_variant', 'source_session_id', 'context_mode', 'context_message_id',
            'time_created', 'worktree_dir', 'directory', 'variant'}
    members = [{k: v for k, v in row.items() if k in keep or 'context' in k} for row in members]
report = {'at': stamp, 'backup': str(backup_path),
          'backup_sha256': hashlib.sha256(backup_path.read_bytes()).hexdigest(), 'members': members}
folder = root / 'docs/missions/ff8-decomp-semantics-2026-10-11-run01/input-admission-hardening-20261012'
folder.mkdir(parents=True, exist_ok=True)
destination = folder / ('routing-' + stamp + '.json')
with destination.open('x', encoding='utf8') as stream:
    json.dump(report, stream, indent=2, ensure_ascii=False)
print(json.dumps({'path': str(destination), 'members': len(members)}))
