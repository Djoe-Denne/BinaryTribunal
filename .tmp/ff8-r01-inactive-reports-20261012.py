from pathlib import Path
import sqlite3, json, re

root = Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
out = root / 'docs/missions/ff8-decomp-semantics-2026-10-11-run01/resume-repair-20261012'
backup = json.loads((out / 'routing-snapshot.json').read_text(encoding='utf8'))['backup']
inventory = json.loads((out / 'inactive-inventory.json').read_text(encoding='utf8'))['rows']
rows = []
with sqlite3.connect(Path(backup).as_uri() + '?mode=ro', uri=True) as db:
    db.row_factory = sqlite3.Row
    for item in inventory:
        member = dict(db.execute('SELECT * FROM team_member WHERE team_id=? AND name=?', ('team_mv41qy6o_0000_vbge32',item['member'])).fetchone())
        msgs = [dict(r) for r in db.execute('SELECT id,content,time_created FROM team_message WHERE team_id=? AND from_name=? AND to_name=? ORDER BY time_created', ('team_mv41qy6o_0000_vbge32', item['member'], 'lead'))]
        reports = [r for r in msgs if '<task-result>' in r['content'] or 'BLOC' in r['content'].upper() or 'BLOCK' in r['content'].upper()]
        rows.append({'task_id':item['id'],'member':item['member'],'session_id':member['session_id'],
          'worktree_dir':member['worktree_dir'],'worktree_branch':member['worktree_branch'],
          'model_routing':json.loads(member['model_routing']) if member['model_routing'] else None,
          'model_override':member['model_override'],'model_variant':member['model_variant'],
          'context_mode':member['context_mode'],'source_session_id':member['source_session_id'],
          'context_message_id':member['context_message_id'],'reports':reports})
with (out / 'inactive-reports.json').open('x',encoding='utf8') as f: json.dump(rows,f,indent=2,ensure_ascii=False)
for r in rows:
    report = r['reports'][-1]['content'] if r['reports'] else ''
    summary = re.search(r'<summary>([\s\S]*?)</summary>',report)
    print(json.dumps({'id':r['task_id'],'member':r['member'],'reports':len(r['reports']),
      'worktree':r['worktree_dir'],'summary':summary.group(1) if summary else report[:400]},ensure_ascii=False))
