"""Read-only Win32 primitives. No debugger, VM writes, injection or termination APIs."""
import ctypes as C
from ctypes import wintypes as W
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import quiet_process as Q
from mapped_file import resolve_module, inventory_verdict
from datetime import datetime, timezone

K=C.WinDLL('kernel32',use_last_error=True)
def api(name,args,result):
    f=getattr(K,name);f.argtypes=args;f.restype=result;return f
Open=api('OpenProcess',[W.DWORD,W.BOOL,W.DWORD],W.HANDLE)
Close=api('CloseHandle',[W.HANDLE],W.BOOL)
Times=api('GetProcessTimes',[W.HANDLE]+[C.POINTER(W.FILETIME)]*4,W.BOOL)
Clock=api('GetSystemTimePreciseAsFileTime',[C.POINTER(W.FILETIME)],None)
Image=api('QueryFullProcessImageNameW',[W.HANDLE,W.DWORD,W.LPWSTR,C.POINTER(W.DWORD)],W.BOOL)
Wait=api('WaitForSingleObject',[W.HANDLE,W.DWORD],W.DWORD)
Exit=api('GetExitCodeProcess',[W.HANDLE,C.POINTER(W.DWORD)],W.BOOL)
Debugger=api('CheckRemoteDebuggerPresent',[W.HANDLE,C.POINTER(W.BOOL)],W.BOOL)
Snapshot=api('CreateToolhelp32Snapshot',[W.DWORD,W.DWORD],W.HANDLE)

class Process(C.Structure):
    _fields_=[('size',W.DWORD),('usage',W.DWORD),('pid',W.DWORD),('heap',C.c_size_t),
              ('module',W.DWORD),('threads',W.DWORD),('parent',W.DWORD),
              ('priority',W.LONG),('flags',W.DWORD),('name',W.WCHAR*260)]
First=api('Process32FirstW',[W.HANDLE,C.POINTER(Process)],W.BOOL)
Next=api('Process32NextW',[W.HANDLE,C.POINTER(Process)],W.BOOL)

class Module(C.Structure):
    _fields_=[('size',W.DWORD),('id',W.DWORD),('pid',W.DWORD),('global_refs',W.DWORD),
              ('process_refs',W.DWORD),('base',C.c_void_p),('image_size',W.DWORD),
              ('handle',W.HMODULE),('name',W.WCHAR*256),('path',W.WCHAR*260)]
MFirst=api('Module32FirstW',[W.HANDLE,C.POINTER(Module)],W.BOOL)
MNext=api('Module32NextW',[W.HANDLE,C.POINTER(Module)],W.BOOL)
GetPid=api('GetProcessId',[W.HANDLE],W.DWORD)
class ModuleInventoryError(RuntimeError):
    def __init__(self,message,rows=None):
        super().__init__(message);self.verdict='INCONCLUSIVE'
        self.rows=[dict(x,reported_path=x.get('path'),mapped_path=None,resolved_path=None,
                        source='Toolhelp enumeration incomplete',hash_status='INCOMPLETE',verdict='INCONCLUSIVE',
                        sha256=None,error_code='ENUMERATION_INCOMPLETE',error=message) for x in (rows or [])]

def modules(pid,process_handle=None):
    rows=[];owned=None;h=None;open_error=0
    if process_handle is None:
        owned=Open(0x400|0x10,False,pid);process_handle=owned
        if not owned:open_error=C.get_last_error()
    try:
        h=Snapshot(0x18,pid)
        if h in (None,C.c_void_p(-1).value):raise ModuleInventoryError(f'module snapshot; winerror={C.get_last_error()}')
        m=Module();m.size=C.sizeof(m);more=MFirst(h,C.byref(m));require(more,'module first')
        while more:
            rows.append({'name':m.name,'path':m.path,'base':int(m.base or 0),'size':m.image_size})
            more=MNext(h,C.byref(m))
        require(C.get_last_error()==18,'module enumeration completion')
        if not process_handle:
            return [dict(x,reported_path=x['path'],mapped_path=None,resolved_path=None,source='OpenProcess QUERY_INFORMATION|VM_READ',hash_status='INCOMPLETE',verdict='INCONCLUSIVE',sha256=None,error_code='PROCESS_HANDLE_FAILED',error=f'winerror={open_error}') for x in rows]
        actual=GetPid(process_handle)
        if actual!=pid:
            return [dict(x,reported_path=x['path'],mapped_path=None,resolved_path=None,source='GetProcessId',hash_status='REFUSED' if actual else 'INCOMPLETE',verdict='FAIL' if actual else 'INCONCLUSIVE',sha256=None,error_code='PROCESS_HANDLE_IDENTITY_MISMATCH',error=f'expected PID={pid}, handle PID={actual}') for x in rows]
        return [resolve_module(x,process_handle) for x in rows]
    except Exception as e:raise ModuleInventoryError(str(e),rows) from e
    finally:
        if h not in (None,C.c_void_p(-1).value):Close(h)
        if owned:Close(owned)

def require(ok,label):
    if not ok:raise RuntimeError(f'{label}; winerror={C.get_last_error()}')
def utc():return datetime.now(timezone.utc).isoformat()
def as_int(t):return (t.dwHighDateTime<<32)|t.dwLowDateTime
def clock():
    t=W.FILETIME();Clock(C.byref(t));return as_int(t)
def creation(h):
    ts=[W.FILETIME() for _ in range(4)]
    require(Times(h,*[C.byref(t) for t in ts]),'GetProcessTimes')
    return as_int(ts[0])
def image(h):
    buf=C.create_unicode_buffer(32768);n=W.DWORD(len(buf))
    require(Image(h,0,buf,C.byref(n)),'QueryFullProcessImageNameW');return Path(buf.value)
def sha(p):
    with Path(p).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def processes():
    h=Snapshot(2,0);require(h not in (None,C.c_void_p(-1).value),'process snapshot')
    rows=[]
    try:
        p=Process();p.size=C.sizeof(p);more=First(h,C.byref(p));require(more,'process first')
        while more:
            rows.append({'pid':p.pid,'parent_pid':p.parent,'name':p.name})
            more=Next(h,C.byref(p))
        require(C.get_last_error()==18,'process enumeration completion')
    finally:Close(h)
    return rows
def is_ff8_game(name):
    # Regional game binaries, not FF8_Launcher.exe (nor Chocobo or Steam).
    n=name.lower()
    return n in ('ff8.exe','ff8_en.exe','ff8_fr.exe','ff8_de.exe','ff8_it.exe','ff8_es.exe','ff8_jp.exe','ff8_ja.exe','ff8_us.exe','ff8_uk.exe','ff8_j.exe') or bool(re.fullmatch(r'ff8_[a-z]{2}\.exe',n))
def ff8():return [p for p in processes() if is_ff8_game(p['name'])]
def debugged(pid):
    # Separate read-only QUERY_INFORMATION handle; retained identity handle stays LIMITED.
    h=Open(0x400,False,pid);require(h,'OpenProcess debugger read-only query')
    try:
        b=W.BOOL();require(Debugger(h,C.byref(b)),'CheckRemoteDebuggerPresent');return bool(b.value)
    finally:Close(h)
def instrumentation():
    code="@(Get-CimInstance Win32_Process | Where-Object { $_.Name -match '^(ida.*|windbg.*|cdb|ntsd|x32dbg|x64dbg|procdump.*|python.*|powershell|pwsh|rundll32|WerFault|frida.*|cheatengine.*|cheat engine.*|gdb.*|lldb.*|.*injector.*|processhacker.*|systeminformer.*|ollydbg.*|dnspy.*|hxd.*)\\.exe$' } | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,CommandLine) | ConvertTo-Json -Compress"
    r=Q.run(Q.powershell_args(code),capture_output=True,text=True,timeout=15,check=True)
    value=json.loads(r.stdout) if r.stdout.strip() else []
    return value if isinstance(value,list) else [value]
def exclusive_json(path,value):
    with Path(path).open('x',encoding='utf8') as f:
        json.dump(value,f,indent=2);f.flush();os.fsync(f.fileno())
def journal(path,value):
    # Caller reserves journal exclusively first; each event is append-only.
    with Path(path).open('a',encoding='utf8') as f:
        f.write(json.dumps(value)+'\n');f.flush();os.fsync(f.fileno())
