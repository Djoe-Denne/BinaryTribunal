"""Fault-injected module evidence, REAL dumps of owned Python fixtures only.

No production fault switch. Mock scope is local to worker calls in this hidden
SELFTEST runner. Authorization/identity/debugger gates use real read-only APIs.
"""
import copy
import ctypes as C
from ctypes import wintypes as W
import json
from pathlib import Path
import sys
import time
from unittest import mock
import hang_dump as H
import quiet_process as Q
import winread as R

def wait_ready(path):
    end=time.monotonic()+10
    while time.monotonic()<end:
        try:return json.loads(path.read_text())
        except (FileNotFoundError,json.JSONDecodeError):time.sleep(.05)
    raise RuntimeError('owned forensic fixture readiness timeout')

def run_cases(folder,check):
    folder.mkdir(exist_ok=False);children=[];handles=[]
    try:
        for label in ('target','other'):
            with (folder/(label+'.stdout.log')).open('xb') as so,(folder/(label+'.stderr.log')).open('xb') as se:
                child=Q.popen([sys.executable,'-B','-c',"import ctypes as c,json,time,sys; f=c.WinDLL('kernel32').GetConsoleWindow; f.argtypes=[]; f.restype=c.c_void_p; print(json.dumps({'mode':'SELFTEST','console_window':str(int(f() or 0))}),flush=True); time.sleep(12); sys.exit(39)"],stdout=so,stderr=se)
            children.append(child);ready=wait_ready(folder/(label+'.stdout.log'))
            check(ready['console_window']=='0','forensic owned target console zero '+label)
            h=R.Open(0x100000|0x400|0x10,False,child.pid);R.require(h,'owned forensic fixture handle');handles.append(h)
        target=children[0];h=handles[0];born=R.creation(h);path=R.image(h)
        spec={'mode':'SELFTEST','action':'HANG_DUMP','pid':target.pid,'creation':str(born),'exe_path':str(path),'exe_sha256':R.sha(path)}
        rows=R.modules(target.pid,h);check(R.inventory_verdict(rows)=='VERIFIED','forensic fixture real baseline inventory')
        incomplete=copy.deepcopy(rows);incomplete[0].update(hash_status='INCOMPLETE',verdict='INCONCLUSIVE',sha256=None,error_code='SELFTEST_HASH_MISSING',error='synthetic module disk read failure')
        contradiction=copy.deepcopy(rows);contradiction[0].update(hash_status='REFUSED',verdict='FAIL',sha256=None,error_code='SELFTEST_BASENAME_MISMATCH',error='synthetic contradicting mapped basename')
        scenarios=[('module-hash-incomplete',{'return_value':incomplete},'INCONCLUSIVE'),
                   ('module-enum-partial',{'side_effect':R.ModuleInventoryError('SELFTEST partial enum',rows[:2])},'INCONCLUSIVE'),
                   ('module-contradiction',{'return_value':contradiction},'FAIL')]
        for label,kwargs,expected in scenarios:
            out=folder/label;out.mkdir(exist_ok=False);request=folder/(label+'-request.json');R.exclusive_json(request,spec)
            with mock.patch.object(H.R,'modules',**kwargs):rc=H.worker(request,out,True)
            receipt=json.loads((out/'worker-result.json').read_text());dump=out/'hang.dmp'
            check(rc==2 and receipt['status']==receipt['module_proof_status']==expected,'forensic nonpromotion verdict '+label,verdict=receipt['status'],rc=rc)
            check(receipt['identity_verified'] and receipt['dump_capture_complete'] is True and receipt['header_MDMP'] is True and dump.stat().st_size==receipt['bytes'] and R.sha(dump)==receipt['sha256'],'REAL forensic dump produced/hash-bound despite '+label,bytes=receipt['bytes'],sha256=receipt['sha256'])
            check(receipt['pid']==target.pid and receipt['creation']==str(born) and receipt['worker_console_window']=='0' and receipt['diagnostic_or_promotional_PASS'] is False,'forensic retained identity/hidden/no PASS '+label)
            if label=='module-enum-partial':check(len(receipt['modules'])==2 and 'module_inventory_error' in receipt,'partial enum rows/error retained')
        # MUST failures must occur before module enumeration and file creation.
        negative=[('auth',dict(spec,action='NOT_AUTHORIZED')),
                  ('PID-FILETIME',dict(spec,pid=children[1].pid)),
                  ('exe',dict(spec,exe_sha256='0'*64))]
        for label,bad in negative:
            out=folder/('reject-'+label);out.mkdir(exist_ok=False);request=folder/('reject-'+label+'-request.json');R.exclusive_json(request,bad)
            with mock.patch.object(H.R,'modules',side_effect=AssertionError('inventory reached before MUST gate')) as inventory:rc=H.worker(request,out,True)
            receipt=json.loads((out/'worker-result.json').read_text())
            check(rc==2 and receipt['status']=='FAIL' and not receipt['identity_verified'] and not receipt['dump_attempted'] and not receipt['dump_capture_complete'] and not (out/'hang.dmp').exists() and inventory.call_count==0,'MUST rejects/no dump '+label)
        # API failure preserves a partial file and explicit incomplete/error proof.
        out=folder/'api-failed-partial';out.mkdir(exist_ok=False);request=folder/'api-failed-request.json';R.exclusive_json(request,spec)
        write=R.api('WriteFile',[W.HANDLE,C.c_void_p,W.DWORD,C.POINTER(W.DWORD),C.c_void_p],W.BOOL)
        class FailedDump:
            def __call__(self,process,pid,file,kind,exception,user,callback):
                payload=b'SELFTEST partial dump; API failed';buf=C.create_string_buffer(payload);n=W.DWORD()
                R.require(write(file,buf,len(payload),C.byref(n),None) and n.value==len(payload),'owned partial dump write')
                C.set_last_error(5);return False
        class FakeDbghelp:MiniDumpWriteDump=FailedDump()
        original=C.WinDLL
        def library(name,*args,**kwargs):return FakeDbghelp() if name.lower()=='dbghelp.dll' else original(name,*args,**kwargs)
        with mock.patch.object(H.R,'modules',return_value=rows),mock.patch.object(H.C,'WinDLL',side_effect=library):rc=H.worker(request,out,True)
        receipt=json.loads((out/'worker-result.json').read_text())
        check(rc==2 and receipt['status']=='FAIL' and receipt['dump_capture_complete'] is False and receipt['dump_attempted'] and 'dump_error' in receipt,'API failure explicit incomplete capture')
        check(receipt['partial_dump']['retained'] and receipt['partial_dump']['bytes']==(out/'hang.dmp').stat().st_size and receipt['partial_dump']['sha256']==R.sha(out/'hang.dmp'),'partial dump preserved and hash-bound')
        for child,handle in zip(children,handles):
            check(child.wait(timeout=20)==39 and R.Wait(handle,0)==0,'forensic fixture natural exit, no kill '+str(child.pid))
    finally:
        for h in handles:R.Close(h)
        # Each owned fixture has a finite natural lifetime; no timeout kill.
