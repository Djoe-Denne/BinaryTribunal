"""Archive the executed IDB sync evidence, preserving the large backup in Temp."""
import collections
import datetime
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

WORK=Path('C:/Users/djden/AppData/Local/Temp/opencode/ff8-idb-sync-20261007T171059Z-a96482')
ROOT=Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
REL=Path('docs/tech/investigation/battle-static-discovery/idb-sync-2026-10-07')
DEST=ROOT/REL


def sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()


def write(path,value):
    with path.open('x',encoding='utf-8') as stream:
        json.dump(value,stream,ensure_ascii=False,indent=2)


def copy(source,target):
    with source.open('rb') as src,target.open('xb') as dst:
        shutil.copyfileobj(src,dst,1024*1024)
    assert sha(source)==sha(target)


def main():
    final=json.loads((WORK/'independent_validation.json').read_text(encoding='utf-8'))
    plan=json.loads((WORK/'plan.json').read_text(encoding='utf-8'))
    extra=json.loads((WORK/'followup_plan.json').read_text(encoding='utf-8'))
    post=json.loads((WORK/'final_post_state.json').read_text(encoding='utf-8'))
    assert final['status']=='PASS'
    assert sha(final['idb'])==final['idb_sha256']
    assert sha(final['backup'])==final['backup_sha256']
    applied={r['ea'] for r in plan['functions']+extra['functions'] if 'name' in r}
    rows=[]
    for row in plan['name_delta_dispositions']:
        item=dict(row,current_name=post['functions'][row['ea']]['name'])
        if row['ea'] in applied:
            item['disposition']='APPLIED_VERIFIED_NAME'
        elif row['documented_name']==item['current_name'].split('::')[-1]:
            item['disposition']='ALREADY_ALIGNED_WITH_NAMESPACE'
        rows.append(item)
    dispositions=dict(initial_deltas=174,applied_names_from_initial_deltas=sum(x['ea'] in applied for x in rows),
                      scope_note='Filename/name differences are a triage set, not a count of missing proven identities.',
                      counts=dict(collections.Counter(x['disposition'] for x in rows)),rows=rows)
    write(WORK/'final_dispositions.json',dispositions)
    write(WORK/'backup_reference.json',dict(path=final['backup'],sha256=final['backup_sha256'],
          bytes=Path(final['backup']).stat().st_size,verified_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
          copied_into_repository=False))
    DEST.mkdir()
    for source in sorted(WORK.iterdir()):
        if source.is_file() and source.suffix in {'.json','.jsonl','.py','.c','.txt'}:
            copy(source,DEST/source.name)
    audit=Path('C:/Users/djden/AppData/Local/Temp/opencode/ff8-idb-gap-20261007T170337Z')
    copy(audit/'snapshot.json',DEST/'audit_snapshot.json')
    copy(audit/'types_and_data.json',DEST/'audit_types_and_data.json')
    head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    assert head=='31b9f0035efc3482933074fe483f4ddb2c676fe2'
    now=subprocess.check_output(['git','status','--porcelain=v1','-uall'],cwd=ROOT).decode('utf-8')
    before=(WORK/'initial_git_status.txt').read_text(encoding='utf-8')
    missing=set(before.splitlines())-set(now.splitlines())
    assert not missing,('pre-existing dirty rows disappeared',sorted(missing))
    write(DEST/'closure.json',dict(status='PASS',utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        idb_sha256=final['idb_sha256'],backup_sha256=final['backup_sha256'],git_head=head,
        prior_dirty_status_rows_preserved=True,prior_dirty_status_rows=len(before.splitlines()),
        report='docs/tech/investigation/battle-static-discovery/IDB_SYNC_2026-10-07.md',
        independent_validation_sha256=sha(DEST/'independent_validation.json'),
        first_mutation_journal_sha256=sha(DEST/'mutation_journal.jsonl'),
        followup_mutation_journal_sha256=sha(DEST/'followup_journal.jsonl'),
        counts=final['counts'],decompiler_smokes=len(final['decompiler_smoke']),
        commit_created=False,push_performed=False))
    files=[p for p in DEST.iterdir() if p.is_file()]
    files += [ROOT/'docs/tech/investigation/battle-static-discovery/IDB_SYNC_2026-10-07.md',
              ROOT/'docs/tech/investigation/battle-static-discovery/semantic-certainty.md']
    entries=[dict(path=p.relative_to(ROOT).as_posix(),bytes=p.stat().st_size,sha256=sha(p)) for p in sorted(files)]
    write(DEST/'artifact_manifest.json',dict(schema=1,files=entries,large_backup_reference='backup_reference.json'))
    for item in entries:
        assert sha(ROOT/item['path'])==item['sha256']
    print(json.dumps(dict(status='ARCHIVED_VERIFIED',directory=str(DEST),files=len(entries),
        archived_bytes=sum(x['bytes'] for x in entries),manifest_sha256=sha(DEST/'artifact_manifest.json'),
        closure_sha256=sha(DEST/'closure.json'),dispositions=dispositions['counts'],git_head=head)))


if __name__=='__main__':
    main()
