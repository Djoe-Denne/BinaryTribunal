"""Launch-neutral observer. LIVE is opt-in; --selftest watches only a tokenized Python fixture.

Retains identity handle until process exit; no game launch, debugger, injection,
memory writes, suspension or kill. A safety failure never stops/kills the target.
"""
import argparse
import ctypes as C
from ctypes import wintypes as W
import json
from pathlib import Path
import time
import winread as R

EXE=Path(r'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe')
EXE_SHA='064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'

def observe(out, live, fixture_spec=None, arm_seconds=600):
    out.mkdir(exist_ok=False)
    log=out/'journal.jsonl'
    with log.open('x',encoding='utf8'):pass
    h=None;bound=None;failed=False;mode='LIVE' if live else 'SELFTEST'
    def event(kind,**kw):R.journal(log,dict(mode=mode,event=kind,utc=R.utc(),**kw))
    def fail(error):
        nonlocal failed
        event('failed',error=str(error))
        if not failed:R.exclusive_json(out/'failed.json',dict(mode=mode,status='FAIL',utc=R.utc(),error=str(error),identity=bound))
        failed=True
    try:
        R.require(not R.ff8(),'FF8 must be absent at arming, including SELFTEST')
        armed=R.clock()
        console=R.api('GetConsoleWindow',[],W.HWND)
        R.exclusive_json(out/'armed.json',dict(mode=mode,status='ARMED',utc=R.utc(),observer_pid=__import__('os').getpid(),armed_filetime=str(armed),armed_filetime_hex=f'0x{armed:016x}',observer_console_window=str(int(console() or 0))))
        event('armed',armed_filetime=str(armed))
        deadline=time.monotonic()+arm_seconds
        while h is None:
            if live:
                candidates=R.ff8();R.require(len(candidates)<=1,'multiple FF8 processes')
                pid=candidates[0]['pid'] if candidates else None
            else:
                # Only an explicitly supplied future fixture PID, not any arbitrary Python.
                if fixture_spec.exists():
                    spec=json.loads(fixture_spec.read_text());R.require(spec.get('mode')=='SELFTEST','fixture spec not SELFTEST')
                    pid=int(spec['pid'])
                else:pid=None
            if pid:
                h=R.Open(0x100000|0x1000,False,pid);R.require(h,'retain LIMITED|SYNCHRONIZE handle')
                born=R.creation(h);path=R.image(h);digest=R.sha(path)
                R.require(born>armed,'creation not strictly after arming')
                if live:
                    R.require(path.resolve()==EXE.resolve() and digest==EXE_SHA,'EXE path/hash identity')
                else:
                    R.require(str(born)==spec['creation'] and path.resolve()==Path(spec['exe_path']).resolve() and digest==spec['exe_sha256'],'SELFTEST fixture identity')
                R.require(not R.debugged(pid),'debugger attached')
                bound=dict(mode=mode,status='BOUND',utc=R.utc(),pid=pid,creation=str(born),creation_hex=f'0x{born:016x}',
                           exe_path=str(path),exe_sha256=digest,handle_rights='SYNCHRONIZE|PROCESS_QUERY_LIMITED_INFORMATION',
                           debugger_query_rights='separate PROCESS_QUERY_INFORMATION read-only',debugger_present=False,
                           armed_filetime=str(armed),observer_pid=__import__('os').getpid())
                R.exclusive_json(out/'bound.json',bound);event('bound',identity=bound)
                break
            R.require(time.monotonic()<deadline,'arming timeout; no future process bound')
            time.sleep(.05)
        last_inventory=0
        while True:
            state=R.Wait(h,100);R.require(state in (0,258),'process wait failed')
            if state==0:break
            if not failed:
                try:
                    if live:R.require([x['pid'] for x in R.ff8()]==[bound['pid']],'FF8 process concurrency')
                    # Handle is still live at this point; a race with natural exit is not a debugger.
                    try:dbg=R.debugged(bound['pid'])
                    except Exception:
                        if R.Wait(h,0)==0:break
                        raise
                    R.require(not dbg,'debugger attached')
                    event('debugger_check',pid=bound['pid'],creation=bound['creation'],debugger_present=dbg)
                    if time.monotonic()-last_inventory>=2:
                        event('instrumentation_inventory',processes=R.instrumentation(),interpretation='inventory only; offline IDA is not an attached debugger; parent review required')
                        last_inventory=time.monotonic()
                except Exception as e:
                    if R.Wait(h,0)==0:break
                    fail(e)
        code=W.DWORD();R.require(R.Exit(h,C.byref(code)),'GetExitCodeProcess after signaled handle')
        R.require(R.creation(h)==int(bound['creation']),'retained handle identity changed')
        result=dict(mode=mode,status='EXIT_OBSERVED',utc=R.utc(),pid=bound['pid'],creation=bound['creation'],creation_hex=bound['creation_hex'],
                    exe_path=bound['exe_path'],exe_sha256=bound['exe_sha256'],exit_code=code.value,exit_code_hex=f'0x{code.value:08x}',
                    wait_signaled=True,method='retained handle WaitForSingleObject then GetExitCodeProcess',observer_failed=failed,
                    lifetime_seconds=(R.clock()-int(bound['creation']))/10000000)
        # Even 259 is a genuine exit only after the handle is signaled.
        R.exclusive_json(out/'exit.json',result);event('exit',identity=result)
        return 2 if failed else 0
    except Exception as e:
        fail(e)
        # If binding partially failed, do not pretend this is a complete exit witness.
        return 2
    finally:
        if h:R.Close(h)

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out',type=Path,required=True)
    group=ap.add_mutually_exclusive_group(required=True);group.add_argument('--live',action='store_true');group.add_argument('--selftest',type=Path)
    ap.add_argument('--arm-seconds',type=float,default=600)
    a=ap.parse_args();return observe(a.out,a.live,a.selftest,a.arm_seconds)
if __name__=='__main__':raise SystemExit(main())
