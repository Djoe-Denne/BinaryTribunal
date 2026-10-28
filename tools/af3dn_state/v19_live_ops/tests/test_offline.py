"""Offline deterministic + owned-process integration tests. NEVER run FF8/control exports.

Every subprocess uses quiet_process. Artifacts are exclusive in a fresh Temp run.
An old evidence run is read-only input for immutable-baseline / collector fixtures.
"""
import argparse
import ast
import ctypes as C
from ctypes import wintypes as W
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import sys
import time
import uuid

OPS=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(OPS));sys.dont_write_bytecode=True
import quiet_process as Q
import mapped_file as M
import winread as R
import snapshot_native as N
import collect_live as V
from forensic_faults import run_cases as forensic_cases

NVIDIA=r'C:\WINDOWS\SysWOW64\DriverStore\FileRepository\nv_dispi.inf_amd64_feedb8c0271ca811\nvldumd.dll'
NT_NVIDIA=r'\Device\HarddiskVolume3\Windows\System32\DriverStore\FileRepository\nv_dispi.inf_amd64_feedb8c0271ca811\nvldumd.dll'
DATA=b'SELFTEST fake disk bytes, not real NVIDIA module\x00\x01'

class Fake:
    source='SELFTEST mapped NT provider, exact file-handle mock'
    def __init__(self,fault=None):self.fault=fault;self.opened=[];self.closed=[];self.handles=[];self.infos=0
    def mapped_path(self,h,base):
        if self.fault=='missing':raise M.ProofError('MAPPED_PATH_FAILED','SELFTEST absent mapping')
        if self.fault=='truncated':raise M.ProofError('MAPPED_PATH_TRUNCATED','SELFTEST truncated result')
        if self.fault=='basename':return NT_NVIDIA.replace('nvldumd.dll','foreign.dll')
        return NT_NVIDIA
    def open_file(self,path):self.opened.append(path);return 123
    def final_path(self,h):
        self.handles.append(h)
        return NT_NVIDIA if self.fault!='final-basename' else NT_NVIDIA.replace('nvldumd.dll','wrong.dll')
    def information(self,h):
        self.handles.append(h);self.infos+=1
        return {'volume_serial':3,'file_index':'1234','size':len(DATA),'write_internal':2 if self.fault=='changed' and self.infos>1 else 1}
    def chunks(self,h):
        self.handles.append(h)
        yield DATA[:10]
        if self.fault=='read':raise M.ProofError('READ_FILE_FAILED','SELFTEST read error')
        yield DATA[10:]
    def close(self,h):self.closed.append(h)

def hash_tree(root):
    return {str(p.relative_to(root)):{'bytes':p.stat().st_size,'sha256':R.sha(p)} for p in sorted(root.rglob('*')) if p.is_file()}
def wait_json(path,seconds=30):
    end=time.monotonic()+seconds
    while time.monotonic()<end:
        try:return json.loads(path.read_text())
        except (FileNotFoundError,json.JSONDecodeError,PermissionError):time.sleep(.05)
    raise RuntimeError('owned fixture readiness timeout: '+str(path))

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--previous-run',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
    a.out.mkdir(exist_ok=False);(a.out/'child-temp').mkdir()
    receipt={'mode':'SELFTEST','status':'FAIL','utc':R.utc(),'checks':[],'children':[],'artifacts':[],'no_live_launch_control_deploy':True}
    def check(ok,name,**extra):
        receipt['checks'].append(dict(name=name,ok=bool(ok),**extra))
        if not ok:raise AssertionError(name)
    try:
        check(not R.ff8(),'zero regional FF8 before offline tests')
        console=R.api('GetConsoleWindow',[],W.HWND)
        check(not console(),'offline test runner itself has no console window')
        old=hash_tree(a.previous_run);R.exclusive_json(a.out/'old-run-before.json',old)
        game=Path(r'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII')
        installed=game/'AF3DN.P';check(installed.stat().st_size==145920 and R.sha(installed)=='3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19','installed rollback before')
        original=json.loads((a.previous_run/'prep-manifest.json').read_text())
        configs=[x for x in original['entries'] if x['role'].startswith('configuration')]
        for x in configs:check(R.sha(x['source'])==x['sha256'],'configuration before '+Path(x['source']).name)
        provenance=json.loads((OPS/'provenance.json').read_text())
        for name,identity in provenance['original_files'].items():
            src=a.previous_run/'ops'/name
            check(src.stat().st_size==identity['bytes'] and R.sha(src)==identity['sha256'],'provenance original '+name)
        for p in OPS.rglob('*.py'):ast.parse(p.read_text());check(True,'syntax '+str(p.relative_to(OPS)))
        kw=Q.hidden_kwargs(capture_output=True,text=True)
        check(kw['creationflags']&0x08000000 and kw['stdin']==-3 and kw['shell'] is False and kw['startupinfo'].wShowWindow==0,'central hidden kwargs')
        for bad in [{'shell':True},{'creationflags':0x10},{'creationflags':0x8},{'stdin':0}]:
            try:Q.hidden_kwargs(**bad);rejected=False
            except ValueError:rejected=True
            check(rejected,'reject console/shell/interactive conflicting kwargs '+str(bad))
        check(Q.powershell_args('x')[1:4]==['-NoLogo','-NoProfile','-NonInteractive'],'PowerShell noninteractive flags')
        for filename in ('winread.py','crash_collect.py','hang_dump.py'):
            tree=ast.parse((OPS/filename).read_text())
            calls=[x for x in ast.walk(tree) if isinstance(x,ast.Call) and isinstance(x.func,ast.Attribute) and isinstance(x.func.value,ast.Name) and x.func.value.id=='subprocess' and x.func.attr in ('run','Popen')]
            check(not calls,'all operational subprocesses centralized '+filename)
        row={'name':'nvldumd.dll','path':NVIDIA,'base':0x65000000,'size':4096}
        f=Fake();positive=M.resolve_module(row,777,f)
        R.exclusive_json(a.out/'mock-nvidia-positive.json',positive)
        check(positive['hash_status']=='VERIFIED' and positive['sha256']==hashlib.sha256(DATA).hexdigest(),'exact NVIDIA incident mock resolution')
        check(positive['path']==positive['reported_path']==NVIDIA and f.opened==['\\\\?\\GLOBALROOT'+NT_NVIDIA],'reported path preserved; ONLY authoritative NT path opened')
        check(set(f.handles)=={123} and f.closed==[123],'final path/meta/hash share same owned handle, exactly closed')
        check('write_internal' not in positive['file_identity'] and 'utc' not in positive,'no volatile per-module timestamps')
        for fault,expected in [('missing','INCONCLUSIVE'),('truncated','INCONCLUSIVE'),('basename','FAIL'),('final-basename','FAIL'),('read','INCONCLUSIVE'),('changed','INCONCLUSIVE')]:
            f=Fake(fault);bad=M.resolve_module(row,777,f);R.exclusive_json(a.out/('mock-'+fault+'.json'),bad)
            check(bad['verdict']==expected and bad['sha256'] is None,'typed refusal '+fault,verdict=bad['verdict'],code=bad['error_code'])
            check(f.closed==([123] if f.opened else []),'file handle released on '+fault)
        for name,badrow in [('reported-basename',dict(row,path=r'C:\absent\other.dll')),('Toolhelp-truncation',dict(row,path='x'*259))]:
            bad=M.resolve_module(badrow,777,Fake());check(bad['sha256'] is None and bad['hash_status']!='VERIFIED','reject '+name)
        partial=[positive,M.resolve_module(row,777,Fake('read')),positive]
        try:N.record_inventory(a.out/'partial-inventory.SELFTEST.json',partial,123,'134359000000000000',mode='SELFTEST');refused=False
        except N.ModuleProofError as e:refused=e.status=='INCONCLUSIVE'
        saved=json.loads((a.out/'partial-inventory.SELFTEST.json').read_text())
        check(refused and len(saved['modules'])==3 and saved['modules'][1]['error_code']=='READ_FILE_FAILED','all inventory rows persisted BEFORE refusing incomplete hash')
        badrows=[positive,M.resolve_module(row,777,Fake('basename')),positive]
        try:N.record_inventory(a.out/'contradiction-inventory.SELFTEST.json',badrows,123,'134359000000000000',mode='SELFTEST');refused=False
        except N.ModuleProofError as e:refused=e.status=='FAIL'
        check(refused,'contradicting mapping inventory FAIL')
        # Exercise native bounded UTF16 buffer logic without opening any process.
        def truncated_call(buffer,cap):return cap
        try:M.NATIVE.text(truncated_call,'SELFTEST');truncated=False
        except M.ProofError as e:truncated=e.code=='SELFTEST_TRUNCATED'
        check(truncated,'native path length retry/cap refuses truncation')
        # Real current-process mapping/file handles, not FF8.
        own=R.Open(0x400|0x10,False,os.getpid());R.require(own,'own process query/read handle')
        count=R.api('GetProcessHandleCount',[W.HANDLE,C.POINTER(W.DWORD)],W.BOOL)
        try:
            before=W.DWORD();R.require(count(own,C.byref(before)),'own handle count before')
            native=R.modules(os.getpid(),own);R.exclusive_json(a.out/'own-native-inventory.json',{'mode':'SELFTEST','pid':os.getpid(),'creation':str(R.creation(own)),'modules':native})
            check(R.inventory_verdict(native)=='VERIFIED','real own-process mapped file inventory',modules=len(native))
            target=next(x for x in native if x['name'].lower()=='kernel32.dll')
            absent=dict(name=target['name'],path=str(a.out/'deliberately-absent'/target['name']),base=target['base'],size=target['size'])
            resolved=M.resolve_module(absent,own);R.exclusive_json(a.out/'real-reported-absent-mapped-valid.json',resolved)
            check(not Path(absent['path']).exists() and resolved['hash_status']=='VERIFIED' and resolved['sha256']==target['sha256'],'real absent reported path + valid authoritative mapping')
            second=R.modules(os.getpid(),own);check(second==native,'two inventories deterministic without volatile timestamps')
            after=W.DWORD();R.require(count(own,C.byref(after)),'own handle count after')
            check(after.value==before.value,'native mapping/file/snapshot handle count unchanged',before=before.value,after=after.value)
        finally:R.Close(own)
        # Actual console check in native and WOW64 PowerShell child fixtures.
        candidates=[('native',Path(os.environ['WINDIR'])/'System32/WindowsPowerShell/v1.0/powershell.exe'),('WOW64',Path(os.environ['WINDIR'])/'SysWOW64/WindowsPowerShell/v1.0/powershell.exe')]
        for label,exe in candidates:
            if not exe.exists():receipt['children'].append({'fixture':label,'status':'UNAVAILABLE_EXPLICIT','path':str(exe)});continue
            ready=a.out/(label+'-ready.json');release=a.out/(label+'-release.flag')
            code="Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class ConsoleProbe { [DllImport(\"kernel32.dll\")] public static extern IntPtr GetConsoleWindow(); }'; $p=[Diagnostics.Process]::GetCurrentProcess(); $v=@{mode='SELFTEST'; pid=$PID; creation=$p.StartTime.ToUniversalTime().ToFileTimeUtc().ToString(); console_window=[ConsoleProbe]::GetConsoleWindow().ToInt64().ToString(); pointer_bytes=[IntPtr]::Size}; $f=[IO.File]::Open($env:PROBE_READY,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None); $w=New-Object IO.StreamWriter($f); $w.Write(($v|ConvertTo-Json -Compress)); $w.Dispose(); $until=[datetime]::UtcNow.AddSeconds(45); while (!(Test-Path $env:PROBE_RELEASE) -and [datetime]::UtcNow -lt $until) { Start-Sleep -Milliseconds 50 }; if (!(Test-Path $env:PROBE_RELEASE)) { exit 42 }; exit 0"
            env=dict(os.environ,PROBE_READY=str(ready),PROBE_RELEASE=str(release),TEMP=str(a.out/'child-temp'),TMP=str(a.out/'child-temp'))
            with (a.out/(label+'.stdout.log')).open('xb') as stdout,(a.out/(label+'.stderr.log')).open('xb') as stderr:
                child=Q.popen(Q.powershell_args(code,exe),stdout=stdout,stderr=stderr,env=env)
            identity=wait_json(ready);h=R.Open(0x100000|0x400|0x10,False,child.pid);R.require(h,'owned PowerShell query/read handle')
            try:
                born=R.creation(h);check(identity['pid']==child.pid and identity['creation']==str(born),'owned child PID/FILETIME '+label)
                check(identity['console_window']=='0','REAL PowerShell GetConsoleWindow==0 '+label,pointer_bytes=identity['pointer_bytes'])
                modules=R.modules(child.pid,h);R.exclusive_json(a.out/(label+'-modules.json'),{'mode':'SELFTEST','pid':child.pid,'creation':str(born),'modules':modules,'inventory_status':R.inventory_verdict(modules)})
                check(R.inventory_verdict(modules)=='VERIFIED','owned child mapped inventory '+label,modules=len(modules))
                wrong_owner=R.modules(os.getpid(),h)
                check(R.inventory_verdict(wrong_owner)=='FAIL' and all(x['sha256'] is None and x['error_code']=='PROCESS_HANDLE_IDENTITY_MISMATCH' for x in wrong_owner),'reject mixed PID/process handle '+label)
                if label=='WOW64':check(identity['pointer_bytes']==4,'real WOW64 fixture is 32-bit')
                with release.open('xb'):pass
                check(child.wait(timeout=20)==0 and R.Wait(h,0)==0,'owned PowerShell exits naturally '+label)
                exitcode=W.DWORD();R.require(R.Exit(h,C.byref(exitcode)),'owned child exit code');check(exitcode.value==0,'real retained-handle child exit zero '+label)
                receipt['children'].append({'fixture':label,'mode':'SELFTEST','pid':child.pid,'creation':str(born),'console_window':'0','exit_code':exitcode.value})
            finally:
                # Release is not kill; ensure failed tests do not leave an infinite fixture.
                if not release.exists():
                    with release.open('xb'):pass
                R.Close(h)
        # Reuse immutable clearly-labelled SYNTHETIC JSON fixture data, not old code.
        # Actual observer + future Python fixture, both launched invisibly and naturally exited.
        observation=a.out/'observer-SELFTEST';spec=a.out/'future-observer-fixture.json'
        with (a.out/'observer.stdout.log').open('xb') as so,(a.out/'observer.stderr.log').open('xb') as se:
            observer=Q.popen([sys.executable,'-B',str(OPS/'observe.py'),'--selftest',str(spec),'--out',str(observation),'--arm-seconds','20'],stdout=so,stderr=se)
        armed=wait_json(observation/'armed.json');check(armed['observer_pid']==observer.pid and armed['observer_console_window']=='0','REAL observer GetConsoleWindow==0')
        fixture_code="import ctypes as c,json,time,sys; k=c.WinDLL('kernel32'); f=k.GetConsoleWindow; f.argtypes=[]; f.restype=c.c_void_p; print(json.dumps({'mode':'SELFTEST','console_window':str(int(f() or 0))}),flush=True); time.sleep(6); sys.exit(37)"
        with (a.out/'observer-target.stdout.log').open('xb') as so,(a.out/'observer-target.stderr.log').open('xb') as se:
            target=Q.popen([sys.executable,'-B','-c',fixture_code],stdout=so,stderr=se)
        th=R.Open(0x100000|0x400|0x10,False,target.pid);R.require(th,'owned observer target')
        try:
            born=R.creation(th);path=R.image(th);identity={'mode':'SELFTEST','pid':target.pid,'creation':str(born),'exe_path':str(path),'exe_sha256':R.sha(path)}
            R.exclusive_json(spec,identity)
            check(target.wait(timeout=25)==37 and observer.wait(timeout=25)==0,'owned observer fixture natural exit')
            ex=wait_json(observation/'exit.json');check(ex['pid']==target.pid and ex['creation']==str(born) and ex['wait_signaled'] and ex['exit_code']==37,'real observer retained FILETIME/exit')
            target_console=json.loads((a.out/'observer-target.stdout.log').read_text());check(target_console['console_window']=='0','owned Python observer target no console')
        finally:R.Close(th)
        # Real hang-dump sub-worker, still ONLY a disposable Python target.
        with (a.out/'dump-target.stdout.log').open('xb') as so,(a.out/'dump-target.stderr.log').open('xb') as se:
            target=Q.popen([sys.executable,'-B','-c','import time,sys; time.sleep(8); sys.exit(39)'],stdout=so,stderr=se)
        th=R.Open(0x100000|0x400|0x10,False,target.pid);R.require(th,'owned dump target')
        try:
            born=R.creation(th);path=R.image(th);request={'mode':'SELFTEST','action':'HANG_DUMP','pid':target.pid,'creation':str(born),'exe_path':str(path),'exe_sha256':R.sha(path)}
            requestfile=a.out/'dump-request.SELFTEST.json';R.exclusive_json(requestfile,request)
            with (a.out/'dump-supervisor.stdout.log').open('xb') as so,(a.out/'dump-supervisor.stderr.log').open('xb') as se:
                supervisor=Q.popen([sys.executable,'-B',str(OPS/'hang_dump.py'),'--selftest','--request',str(requestfile),'--out',str(a.out/'dump-SELFTEST'),'--timeout','20'],stdout=so,stderr=se)
            check(supervisor.wait(timeout=30)==0,'owned external dump selftest finishes')
            dump=wait_json(a.out/'dump-SELFTEST/worker-result.json')
            check(dump['status']=='SELFTEST_CAPTURED' and dump['worker_console_window']=='0' and dump['pid']==target.pid and dump['creation']==str(born),'REAL hidden hang-dump worker GetConsoleWindow==0 and identity')
            check(target.wait(timeout=25)==39,'dump target naturally exited, not killed')
        finally:R.Close(th)
        forensic_cases(a.out/'forensic-faults',check)
        # Reuse immutable clearly-labelled SYNTHETIC JSON fixture data, not old code.
        prior=json.loads((a.previous_run/'prep-parent-revision.json').read_text());packsource=a.previous_run/Path(prior['final_selftest']).parent.name/'collector-pack';pack=a.out/'collector-pack'
        shutil.copytree(packsource,pack)
        mods=json.loads((pack/'modules.SELFTEST.json').read_text());mods['inventory_status']='VERIFIED'
        for x in mods['modules']:x.update(reported_path=x['path'],mapped_path='\\Device\\SELFTEST\\'+x['name'],resolved_path='\\Device\\SELFTEST\\'+x['name'],source='SELFTEST synthetic mapped proof',hash_status='VERIFIED',verdict='VERIFIED',hash_kind='SELFTEST disk hash, not memory')
        (pack/'modules.SELFTEST.json').write_text(json.dumps(mods))
        review=json.loads((pack/'parent_review.json').read_text());review['modules_evidence']['sha256']=R.sha(pack/'modules.SELFTEST.json');(pack/'parent_review.json').write_text(json.dumps(review))
        good=V.evaluate(pack,False);R.exclusive_json(a.out/'collector-positive.SELFTEST.json',good);check(good['status']=='SELFTEST_PASS','collector synthetic positive is ONLY SELFTEST')
        laundering=V.evaluate(pack,True);R.exclusive_json(a.out/'collector-offline-as-live.json',laundering);check(laundering['status']=='FAIL','offline never classified LIVE PASS')
        saved_mods=(pack/'modules.SELFTEST.json').read_bytes();saved_review=(pack/'parent_review.json').read_bytes()
        for label,status,hashstatus,expected in [('partial','INCONCLUSIVE','INCOMPLETE','INCONCLUSIVE'),('wrong','FAIL','REFUSED','FAIL')]:
            bad=json.loads(saved_mods);bad['inventory_status']=status;bad['modules'][-1].update(hash_status=hashstatus,verdict=status,sha256=None)
            (pack/'modules.SELFTEST.json').write_text(json.dumps(bad));review=json.loads(saved_review);review['modules_evidence']['sha256']=R.sha(pack/'modules.SELFTEST.json');(pack/'parent_review.json').write_text(json.dumps(review))
            verdict=V.evaluate(pack,False);R.exclusive_json(a.out/('collector-'+label+'.json'),verdict);check(verdict['status']==expected,'collector missing/refused hash '+label,verdict=verdict['status'])
        (pack/'modules.SELFTEST.json').write_bytes(saved_mods);(pack/'parent_review.json').write_bytes(saved_review)
        after_old=hash_tree(a.previous_run);R.exclusive_json(a.out/'old-run-after.json',after_old);check(old==after_old,'ENTIRE old evidence run unchanged',files=len(old))
        check(installed.stat().st_size==145920 and R.sha(installed)=='3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19','installed rollback unchanged after')
        for x in configs:check(R.sha(x['source'])==x['sha256'],'configuration intact after '+Path(x['source']).name)
        check(not R.ff8(),'zero regional FF8 after offline tests')
        receipt['status']='SELFTEST_PASS_NOT_LIVE'
    except Exception as e:receipt['error']=repr(e)
    finally:
        receipt['finished_utc']=R.utc();receipt['toolkit_sha256']={str(p.relative_to(OPS)):R.sha(p) for p in OPS.rglob('*') if p.is_file() and '__pycache__' not in p.parts}
        receipt['artifacts']=[{'path':str(p.relative_to(a.out)),'bytes':p.stat().st_size,'sha256':R.sha(p)} for p in a.out.rglob('*') if p.is_file()]
        R.exclusive_json(a.out/'test-receipt.json',receipt)
    print(json.dumps({'mode':'SELFTEST','status':receipt['status'],'checks':len(receipt['checks']),'out':str(a.out),'error':receipt.get('error')}))
    return 0 if receipt['status']=='SELFTEST_PASS_NOT_LIVE' else 2
if __name__=='__main__':raise SystemExit(main())
