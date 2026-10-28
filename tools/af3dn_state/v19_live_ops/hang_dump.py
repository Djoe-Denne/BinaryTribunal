"""Parent-requested external MiniDumpWriteDump, NO debugger/attach/kill/injection.

No PSS claimed: direct external capture is best-effort, not an atomic snapshot
or a first-chance exception capture. Supervisor timeout leaves worker AND target
untouched; worker identity is recorded and must be resolved before handoff.
"""
import argparse
import ctypes as C
from ctypes import wintypes as W
import json
from pathlib import Path
import subprocess
import quiet_process as Q
import sys
import winread as R

EXE_SHA='064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
EXE=Path(r'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe')

def worker(request,out,selftest):
    h=file=None;mode='SELFTEST' if selftest else 'LIVE'
    receipt={'mode':mode,'status':'FAIL','utc':R.utc(),'method':'external MiniDumpWriteDump MiniDumpWithFullMemory; no PSS/debugger/first-chance claim',
             'identity_verified':False,'dump_attempted':False,'dump_capture_complete':False,'dump_file_created':False,
             'module_proof_status':'NOT_ACQUIRED','diagnostic_or_promotional_PASS':False}
    console=R.api('GetConsoleWindow',[],W.HWND);receipt['worker_console_window']=str(int(console() or 0))
    try:
        spec=json.loads(request.read_text());pid=int(spec['pid']);born=int(spec['creation'])
        R.require(spec.get('mode')==mode and spec.get('action')=='HANG_DUMP','explicit parent request identity/action')
        if not selftest:
            R.require(spec.get('parent_authorized') is True and spec.get('card_stopped') is True and spec.get('reason')=='hang','parent hang request/card-stop not authorized')
            R.require([x['pid'] for x in R.ff8()]==[pid],'hang target must be the sole FF8')
        h=R.Open(0x100000|0x400|0x10,False,pid);R.require(h,'read-only capture target handle')
        R.require(R.creation(h)==born and R.Wait(h,0)==258,'capture target creation/alive')
        path=R.image(h);digest=R.sha(path)
        R.require(str(path)==spec['exe_path'] and digest==spec['exe_sha256'],'capture EXE identity')
        if selftest:
            R.require(not R.ff8() and path.resolve()==Path(sys.executable).resolve(),'isolated Python SELFTEST only; no FF8')
        else:R.require(path.resolve()==EXE.resolve() and digest==EXE_SHA,'live EXE path/hash')
        R.require(not R.debugged(pid),'capture target debugger absent')
        receipt.update(pid=pid,creation=str(born),creation_hex=f'0x{born:016x}',exe_path=str(path),exe_sha256=digest,
                       identity_verified=True,debugger_present=False)
        # Forensics is NOT the strict snapshot/promotion gate. Preserve incomplete
        # module proof, but do not lose an explicitly authorized crash/hang dump.
        try:
            receipt['modules']=R.modules(pid,h)
            receipt['module_proof_status']=R.inventory_verdict(receipt['modules'])
        except R.ModuleInventoryError as e:
            receipt.update(modules=e.rows,module_proof_status='INCONCLUSIVE',module_inventory_error=repr(e))
        except Exception as e:
            receipt.update(modules=getattr(e,'rows',[]),module_proof_status='INCONCLUSIVE',module_inventory_error=repr(e))
        receipt['dump_attempted']=True
        create=R.api('CreateFileW',[W.LPCWSTR,W.DWORD,W.DWORD,C.c_void_p,W.DWORD,W.DWORD,W.HANDLE],W.HANDLE)
        file=create(str(out/'hang.dmp'),0x40000000,0,None,1,0x80,None) # CREATE_NEW, share none
        R.require(file not in (None,C.c_void_p(-1).value),'exclusive dump file')
        receipt['dump_file_created']=True
        dbg=C.WinDLL('Dbghelp.dll',use_last_error=True)
        dump=dbg.MiniDumpWriteDump
        dump.argtypes=[W.HANDLE,W.DWORD,W.HANDLE,W.DWORD,C.c_void_p,C.c_void_p,C.c_void_p];dump.restype=W.BOOL
        R.require(dump(h,pid,file,2,None,None,None),'MiniDumpWriteDump')
        R.Close(file);file=None
        R.require(R.creation(h)==born,'capture retained-handle identity')
        data=(out/'hang.dmp').open('rb')
        with data:header=data.read(32)
        R.require(len(header)==32 and header[:4]==b'MDMP','minidump header')
        state=R.Wait(h,0);code=W.DWORD();R.require(R.Exit(h,C.byref(code)),'capture exit-state query')
        status=('SELFTEST_CAPTURED' if selftest else 'DUMP_CAPTURED') if receipt['module_proof_status']=='VERIFIED' else receipt['module_proof_status']
        receipt.update(status=status,dump_capture_complete=True,header_MDMP=True,header_hex=header.hex(),bytes=(out/'hang.dmp').stat().st_size,
                       sha256=R.sha(out/'hang.dmp'),target_wait_signaled=state==0,
                       target_exit_code=code.value if state==0 else None,target_active=state==258,
                       consistency='best-effort external; no atomic/suspended/PSS guarantee')
    except Exception as e:
        receipt.update(status='FAIL',error=repr(e))
        if receipt['dump_attempted']:receipt['dump_error']=repr(e)
    finally:
        if file not in (None,C.c_void_p(-1).value):R.Close(file)
        if h:R.Close(h)
        if receipt['dump_file_created'] and not receipt['dump_capture_complete']:
            try:
                partial=out/'hang.dmp'
                receipt['partial_dump']={'path':str(partial),'bytes':partial.stat().st_size,'sha256':R.sha(partial),'capture_complete':False,'retained':True}
            except Exception as e:receipt['partial_dump_evidence_error']=repr(e)
        receipt['finished_utc']=R.utc();R.exclusive_json(out/'worker-result.json',receipt)
    return 0 if receipt['status'] in ('SELFTEST_CAPTURED','DUMP_CAPTURED') else 2

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--request',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
    g=p.add_mutually_exclusive_group(required=True);g.add_argument('--live',action='store_true');g.add_argument('--selftest',action='store_true')
    p.add_argument('--timeout',type=float,default=30);p.add_argument('--worker',action='store_true')
    a=p.parse_args()
    if a.worker:return worker(a.request,a.out,a.selftest)
    # Reserve exclusively; never touch a pre-existing output/dump.
    a.out.mkdir(exist_ok=False)
    spec=json.loads(a.request.read_text());mode='SELFTEST' if a.selftest else 'LIVE'
    R.require(spec.get('mode')==mode and spec.get('action')=='HANG_DUMP','request mode/action')
    child=Q.popen([sys.executable,'-B',str(Path(__file__).resolve()),'--worker','--request',str(a.request.resolve()),'--out',str(a.out.resolve()),'--selftest' if a.selftest else '--live'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    wh=R.Open(0x100000|0x1000,False,child.pid);R.require(wh,'capture worker retained identity')
    try:
        request_record={'mode':mode,'utc':R.utc(),'request_path':str(a.request.resolve()),'request_sha256':R.sha(a.request),
                        'target_pid':spec['pid'],'target_creation':spec['creation'],'worker_pid':child.pid,'worker_creation':str(R.creation(wh)),
                        'timeout_seconds':a.timeout,'timeout_policy':'do not kill worker or target; preserve partial file; parent resolves worker'}
        R.exclusive_json(a.out/'capture-started.json',request_record)
        try:
            rc=child.wait(timeout=a.timeout)
            result=dict(request_record,status='WORKER_FINISHED',worker_exit_code=rc,result='worker-result.json')
        except subprocess.TimeoutExpired:
            result=dict(request_record,status='CAPTURE_IN_PROGRESS_TIMEOUT',worker_exit_code=None,
                        warning='worker may still write hang.dmp; not a complete capture; do not retry/overwrite/kill automatically')
        R.exclusive_json(a.out/'supervisor.json',result)
        print(json.dumps(result));return 0 if result['status']=='WORKER_FINISHED' and result['worker_exit_code']==0 else 2
    finally:R.Close(wh)
if __name__=='__main__':raise SystemExit(main())
