from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess,shutil
r=Path(r'C:\Users\djden\source\repos\retro-eng\re-ff8');base=r/'docs/tech/investigation/battle-static-discovery/driver-passthrough';v=base/'lot25/v18';t=r/'tools/af3dn_state'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def emit(p,d):
 with p.open('x',encoding='utf-8') as f:json.dump(d,f,ensure_ascii=False,indent=2)
initial=load(v/'initial_state.json');frozen={}
for name,expected in initial['frozen'].items():
 actual=sha(r/name);assert actual==expected,name;frozen[name]=actual
build=load(next(v.glob('build-*/receipt.json')));assert build['exit']==0
candidate={}
for name in ['gfx_driver_passthrough.c','gfx_driver_passthrough.h','gfx_driver_passthrough.dll','gfx_driver_passthrough.map']:
 h=sha(v/name);assert h==build['hashes'][name],name;candidate[name]={'sha256':h,'bytes':(v/name).stat().st_size}
assert candidate['gfx_driver_passthrough.dll']['sha256']=='d36f7366d16961adcf5ec670f840907d715fa28d687e3f67812cbc8cc7633265'
archive_checks={}
for folder,manifest in [('lifecycle-artifacts','archive_manifest.json'),('writer-pin-artifacts','manifest.json'),('writer-strict-artifacts','manifest.json')]:
 records=load(v/folder/manifest)
 for name,item in records.items():
  p=v/folder/name;assert sha(p)==item['sha256'] and p.stat().st_size==item['bytes'],p
 archive_checks[folder]=len(records)
assert sha(t/'gate_lot25_v18_lifecycle.py')==sha(v/'lifecycle-artifacts/gate_lot25_v18_lifecycle.py')
assert sha(t/'harness_lot25_v18_lifecycle.c')==sha(v/'lifecycle-artifacts/harness_lot25_v18_lifecycle.c')
native=load(v/'native_parent_validation.json');assert native['controller_exit']==native['compile_exit']==0;assert sum(x['checks'] for x in native['cases'].values())==860
for case,x in native['cases'].items():assert x['fails']==0 and x['exit']==(73 if case=='H' else 0)
writer={}
for mode in ['pin','strict']:
 d=load(v/('writer_'+mode+'_receipt.json'));assert d['exit_code']==d['harness']['compile_exit']==0
 for name,h in d['writer_evidence']['reader_source_hashes'].items():assert sha(t/name)==h,name
 processes=d['harness']['processes'];assert sorted(x['checks'] for x in processes.values())==[106,684]
 assert all(x['exit']==x['fails']==0 for x in processes.values())
 assert sha(t/'harness_lot25_v18_writer.c')==sha(v/('writer-'+mode+'-artifacts')/'harness_lot25_v18_writer.c')
 writer[mode]={'status':d['status'],'exit':d['exit_code'],'processes':processes}
py=load(v/'python_tests_receipt.json');assert py['passed'] and py['exit']==0 and py['tests']==303 and py['skips']==[]
for item in py['fixtures'].values():assert sha(Path(item['path']))==item['sha256']
old=load(v/'v17_evidence_preserved.json');olddir=base/'lot25/v17/unload-audit-20261004T155604Z-10423954'
for name,item in old['checks'].items():assert sha(olddir/name)==item['expected']
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=r,text=True).strip();assert head==initial['head']
status=subprocess.run(['git','status','--porcelain=v1','-uall'],cwd=r,capture_output=True);assert status.returncode==0
missing=set((v/'initial_git_status.txt').read_bytes().splitlines())-set(status.stdout.splitlines());assert not missing,repr(missing)
pscmd=['powershell','-NoProfile','-Command',r"@(Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'FF8|FFVIII|harness_lot25_v18' -or $_.ExecutablePath -like '*FINAL FANTASY VIII*' } | Select-Object ProcessId,Name,ExecutablePath) | ConvertTo-Json -Compress"]
p=subprocess.run(pscmd,capture_output=True,text=True);assert p.returncode==0 and not p.stdout.strip(),p.stdout
game=Path(r'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII');installed=game/'AF3DN.P';assert sha(installed)==initial['installed_sha256'];assert installed.stat().st_size==145920
side={name:(game/name).exists() for name in initial['sidecars']};assert not any(side.values())
qmd=load(v/'qmd_refresh_receipt.json');assert qmd['status']=='PASS' and qmd['embed']['errors']==0 and qmd['after']['doc_count']==188;assert load(v/'qmd_controller_receipt.json')['exit']==0;assert load(v/'wiki_parent_validation.json')['passed']
paths=['tools/af3dn_state/lot24_contract.py','tools/af3dn_state/test_lot25_builds.py','tools/af3dn_state/test_lot25_render_input.py','obsidian-docs/.manifest.json','obsidian-docs/log.md','obsidian-docs/index.md','obsidian-docs/projects/re-ff8/re-ff8.md','obsidian-docs/projects/re-ff8/references/af3dn-lot25-v17-unload-audit-2026-10-04.md','obsidian-docs/projects/re-ff8/references/af3dn-captures-evidence-catalog-lot25.md']+[str((base/name).relative_to(r)) for name in ['LOT25_V17_UNLOAD_AUDIT_2026-10-04.md','LIVE_CARD_lot25pass2bis_2026-10-04.md']]
diff=subprocess.run(['git','diff','--check','--',*paths],cwd=r,capture_output=True,text=True);assert diff.returncode==0,diff.stdout
with (v/'final_git_status.txt').open('xb') as f:f.write(status.stdout)
receipt={'schema':'lot25-v18-final-offline-validation-v1','utc':datetime.now(timezone.utc).isoformat(),'status':'PASS_OFFLINE_STAGE0_GATES_A_I','build':'0x5646','candidate':candidate,'head_unchanged':head,'initial_dirty_status_rows_preserved':True,'initial_status_count':len((v/'initial_git_status.txt').read_bytes().splitlines()),'final_status_count_before_receipt':len(status.stdout.splitlines()),'frozen_sha256':frozen,'v17_historical_evidence_hashes_verified':len(old['checks']),'historical_red_exit':3,'archive_hashes_verified':archive_checks,'lifecycle':{'controller_exit':0,'compile_exit':0,'checks':860,'fails':0,'cases':native['cases']},'writer':writer,'python':{'exit':0,'tests':303,'skips':0,'fixtures_rehashed':3},'knowledge':{'raw_copies_verified':8,'manifest_entries_rehashed':18,'qmd_documents':188,'qmd_pending_embeddings':0,'qmd_refresh_exit':0,'initial_qmd_attempt_exit':1,'initial_qmd_attempt_preserved':'qmd-attempt1/','serena_memory':'battle_driver_lot25_v18_offline'},'closure':{'process_query':pscmd,'process_query_exit':p.returncode,'matching_processes':[],'installed_dll_sha256':sha(installed),'installed_dll_bytes':installed.stat().st_size,'sidecars':side,'deployed':False,'game_launched':False,'game_capture_armed':False,'docker_resources_created':False,'commit_or_push':False},'scoped_git_diff_check_exit':diff.returncode,'promotion_satisfied':False,'live_authorized':False,'live_blockers':['pre-PIN generic Present/ODS detours and trampolines','proxy and native-object lifetimes','concurrent execution/rundown and patch atomicity','unqualified live caller loader-lock context'],'artifact_manifest':'artifact_manifest.json'}
emit(v/'final_validation.json',receipt)
with Path(__file__).open('rb') as src,(v/'closure_verification_executed.py').open('xb') as dst:shutil.copyfileobj(src,dst,1024*1024)
print('FINAL PASS: frozen',len(frozen),'historical',len(old['checks']),'archive files',sum(archive_checks.values()),'native860/python303. Installed rollback intact, FF8/harness absent, sidecars absent, HEAD and dirty statuses preserved.')
print('Candidate DLL bytes',candidate['gfx_driver_passthrough.dll']['bytes'],'initial status rows',receipt['initial_status_count'])
