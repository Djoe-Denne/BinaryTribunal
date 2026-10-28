"""Explicit v19 control for a named, already-running PE32 process.

Never launches FF8, loads a DLL, deploys a file, or calls native init helpers.
Default target is an isolated offline_live_host.exe under Temp/opencode.
--live permits FF8_EN.exe only; use only after accepting the live card.
The candidate must already be loaded. A temporary FROM_ADDRESS reference
protects each cdecl call; it is released after the call. The DLL's own PIN
establishes residence. A timeout retains scratch memory for the live thread.
"""
import argparse
import ctypes as C
from ctypes import wintypes as W
import hashlib
import json
import os
from pathlib import Path
import struct

from gate_lot25_v18_lifecycle import PE32

CANDIDATE_SHA='163e962d7f9355f61d1449b695119e94a928e616cdae54538fe0d2fa96d3d791'
EXE_SHA='064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
SITES={'Present':(0x1DF0C,8),'ODS':(0x3D99,9),'stage0_bind':(0x1EF5D,6),'stage0_unbind':(0x1EF72,6)}
PREIMAGES={'Present':bytes.fromhex('55 8B EC 51 8B 45 08 50'),
           'ODS':bytes.fromhex('55 8B EC 51 E8 A8 62 00 00'),
           'stage0_bind':bytes.fromhex('FF 90 98 00 00 00'),
           'stage0_unbind':bytes.fromhex('FF 90 98 00 00 00')}
K=C.WinDLL('kernel32',use_last_error=True)


def api(name,args,result):
    f=getattr(K,name);f.argtypes=args;f.restype=result;return f


Open=api('OpenProcess',[W.DWORD,W.BOOL,W.DWORD],W.HANDLE)
Close=api('CloseHandle',[W.HANDLE],W.BOOL)
Read=api('ReadProcessMemory',[W.HANDLE,C.c_void_p,C.c_void_p,C.c_size_t,C.POINTER(C.c_size_t)],W.BOOL)
Write=api('WriteProcessMemory',[W.HANDLE,C.c_void_p,C.c_void_p,C.c_size_t,C.POINTER(C.c_size_t)],W.BOOL)
Alloc=api('VirtualAllocEx',[W.HANDLE,C.c_void_p,C.c_size_t,W.DWORD,W.DWORD],C.c_void_p)
Free=api('VirtualFreeEx',[W.HANDLE,C.c_void_p,C.c_size_t,W.DWORD],W.BOOL)
Protect=api('VirtualProtectEx',[W.HANDLE,C.c_void_p,C.c_size_t,W.DWORD,C.POINTER(W.DWORD)],W.BOOL)
Flush=api('FlushInstructionCache',[W.HANDLE,C.c_void_p,C.c_size_t],W.BOOL)
Thread=api('CreateRemoteThread',[W.HANDLE,C.c_void_p,C.c_size_t,C.c_void_p,C.c_void_p,W.DWORD,C.POINTER(W.DWORD)],W.HANDLE)
Wait=api('WaitForSingleObject',[W.HANDLE,W.DWORD],W.DWORD)
Exit=api('GetExitCodeThread',[W.HANDLE,C.POINTER(W.DWORD)],W.BOOL)
Times=api('GetProcessTimes',[W.HANDLE,C.POINTER(W.FILETIME),C.POINTER(W.FILETIME),C.POINTER(W.FILETIME),C.POINTER(W.FILETIME)],W.BOOL)
Image=api('QueryFullProcessImageNameW',[W.HANDLE,W.DWORD,W.LPWSTR,C.POINTER(W.DWORD)],W.BOOL)
Debugger=api('CheckRemoteDebuggerPresent',[W.HANDLE,C.POINTER(W.BOOL)],W.BOOL)


class Module(C.Structure):
    _fields_=[('size',W.DWORD),('id',W.DWORD),('pid',W.DWORD),('global_refs',W.DWORD),
              ('process_refs',W.DWORD),('base',C.c_void_p),('image_size',W.DWORD),
              ('handle',W.HMODULE),('name',W.WCHAR*256),('path',W.WCHAR*260)]


class Memory(C.Structure):
    _fields_=[('base',C.c_void_p),('allocation',C.c_void_p),('allocation_protect',W.DWORD),
              ('region_size',C.c_size_t),('state',W.DWORD),('protect',W.DWORD),('type',W.DWORD)]


QueryMemory=api('VirtualQueryEx',[W.HANDLE,C.c_void_p,C.POINTER(Memory),C.c_size_t],C.c_size_t)


Snapshot=api('CreateToolhelp32Snapshot',[W.DWORD,W.DWORD],W.HANDLE)
First=api('Module32FirstW',[W.HANDLE,C.POINTER(Module)],W.BOOL)
Next=api('Module32NextW',[W.HANDLE,C.POINTER(Module)],W.BOOL)


def require(ok,label):
    if not ok:raise RuntimeError(f'{label}; winerror={C.get_last_error()}')


def sha(path):
    with Path(path).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()


def modules(pid):
    h=Snapshot(0x18,pid);require(h not in (None,C.c_void_p(-1).value),'module snapshot')
    result=[]
    try:
        m=Module();m.size=C.sizeof(m);more=First(h,C.byref(m));require(more,'module first')
        while more:
            result.append(dict(base=int(m.base),size=m.image_size,path=m.path,name=m.name))
            more=Next(h,C.byref(m))
        require(C.get_last_error()==18,'module enumeration completion')
    finally:Close(h)
    return result


def control(pid,candidate,action,creation,live=False):
    require(sha(candidate)==CANDIDATE_SHA,'candidate file hash')
    pe=PE32(candidate.read_bytes());exports=pe.exports()
    h=Open(0x2|0x8|0x10|0x20|0x400|0x100000,False,pid);require(h,'OpenProcess')
    scratch=thread=None;joined=False;started=False
    result=dict(pid=pid,action=action,live=live,candidate_sha256=CANDIDATE_SHA,scratch_writes=[],status='FAIL')

    def read(address,n):
        buf=C.create_string_buffer(n);got=C.c_size_t()
        require(Read(h,address,buf,n,C.byref(got)) and got.value==n,'exact remote read')
        return buf.raw

    def write(address,data):
        require(scratch is not None and scratch<=address and address+len(data)<=scratch+8192,'scratch write allowlist')
        got=C.c_size_t();buf=C.create_string_buffer(data)
        require(Write(h,address,buf,len(data),C.byref(got)) and got.value==len(data),'exact scratch write')
        require(read(address,len(data))==data,'scratch write readback')
        result['scratch_writes'].append(dict(address=address,bytes=len(data)))

    def string(address):
        data=bytearray()
        for i in range(512):
            v=read(address+i,1)
            if v==b'\0':return data.decode('ascii')
            data+=v
        raise RuntimeError('unterminated remote string')

    def resolve(module,name,depth=0):
        require(depth<5,'forwarder depth')
        item=next((m for m in mods if m['name'].lower()==module.lower()),None);require(item,'remote API module '+module)
        base=item['base'];nt=struct.unpack('<I',read(base+0x3C,4))[0]
        require(read(base+nt,4)==b'PE\0\0' and read(base+nt+24,2)==b'\x0b\x01','remote PE32 API module')
        erva,esize=struct.unpack('<II',read(base+nt+24+96,8));fields=struct.unpack('<IIHHIIIIIII',read(base+erva,40))
        count,names,functions,name_table,ords=fields[6:11];require(names<65536,'remote export count')
        nbuf=read(base+name_table,names*4);obuf=read(base+ords,names*2);fbuf=read(base+functions,count*4)
        for i in range(names):
            if string(base+struct.unpack_from('<I',nbuf,4*i)[0])!=name:continue
            ordinal=struct.unpack_from('<H',obuf,2*i)[0];require(ordinal<count,'remote ordinal')
            rva=struct.unpack_from('<I',fbuf,4*ordinal)[0]
            if erva<=rva<erva+esize:
                mod,forward=string(base+rva).rsplit('.',1)
                return resolve(mod+'.dll',forward,depth+1)
            require(rva<item['size'],'API export in module');return base+rva
        raise RuntimeError('remote export missing '+module+'!'+name)

    try:
        times=[W.FILETIME() for _ in range(4)];require(Times(h,*[C.byref(t) for t in times]),'process identity')
        born=(times[0].dwHighDateTime<<32)|times[0].dwLowDateTime
        require(born==creation,'PID creation-time mismatch');result['creation']=born
        image=C.create_unicode_buffer(32768);size=W.DWORD(len(image));require(Image(h,0,image,C.byref(size)),'image path')
        path=Path(image.value);result['exe_path']=str(path);result['exe_sha256']=sha(path)
        if live:
            require(path.name.lower()=='ff8_en.exe' and result['exe_sha256']==EXE_SHA,'live EXE identity')
        else:
            require(path.name.lower()=='offline_live_host.exe' and path.resolve().is_relative_to((Path(os.environ['LOCALAPPDATA'])/'Temp/opencode').resolve()),'isolated fixture identity')
        debug=W.BOOL();require(Debugger(h,C.byref(debug)) and not debug.value,'fresh non-debugged target')
        mods=modules(pid);exe=next(m for m in mods if Path(m['path']).resolve()==path.resolve())
        exe_nt=struct.unpack('<I',read(exe['base']+0x3C,4))[0]
        require(read(exe['base']+exe_nt+24,2)==b'\x0b\x01','target is PE32')
        candidate_modules=[m for m in mods if m['name'].lower() in ('af3dn.p','test_candidate.dll')]
        require(len(candidate_modules)==1,'unique already-loaded candidate')
        module=candidate_modules[0];base=module['base'];result['module']=module
        require(sha(Path(module['path']))==CANDIDATE_SHA,'loaded module disk identity')
        # Bind the immutable text section in memory to file bytes with ASLR fixups.
        text=next(s for s in pe.sections if s['name']=='.text');expect=bytearray(pe.data[text['raw']:text['raw']+text['raw_size']])
        nt=struct.unpack_from('<I',pe.data,0x3C)[0];rr,rs=struct.unpack_from('<II',pe.data,nt+24+96+5*8)
        offset=0;delta=base-pe.image_base
        while offset<rs:
            page,n=pe.at('<II',rr+offset);require(n>=8 and offset+n<=rs,'relocation block')
            for at in range(8,n,2):
                entry=pe.at('<H',rr+offset+at)[0];kind=entry>>12;target=page+(entry&4095)
                if text['va']<=target<text['va']+len(expect) and kind:
                    require(kind==3 and target+4<=text['va']+len(expect),'text HIGHLOW relocation')
                    index=target-text['va'];value=struct.unpack_from('<I',expect,index)[0]
                    struct.pack_into('<I',expect,index,(value+delta)&0xFFFFFFFF)
            offset+=n
        require(read(base+text['va'],len(expect))==expect,'loaded text hash/readback identity')
        result['loaded_text_sha256']=hashlib.sha256(expect).hexdigest()

        def windows():
            rows={}
            for name,(rva,n) in SITES.items():
                address=exe['base']+rva;memory=Memory()
                require(QueryMemory(h,address,C.byref(memory),C.sizeof(memory))==C.sizeof(memory),'site page query')
                rows[name]=dict(address=address,bytes=read(address-4,n+8).hex(),patch_bytes=n,protection=memory.protect)
            return rows

        result['before']=windows()
        target_name={'activate':'Passthrough_InstallBootHook','stage0':'Passthrough_InstallStage0Hooks',
                     'stop':'Passthrough_StopDiagnostic','query':'Passthrough_QueryDiagnostic'}[action]
        getmod=resolve('kernel32.dll','GetModuleHandleExA');free=resolve('kernel32.dll','FreeLibrary')
        target=base+exports[target_name]
        scratch=Alloc(h,None,8192,0x3000,4);require(scratch and scratch+8192<=0x100000000,'PE32 scratch allocation')
        data=scratch+4096;args=[0] if action=='activate' else ([data+32,128] if action=='query' else [])
        u32=lambda value:struct.pack('<I',value)
        code=bytearray(b'\x55\x8b\xec\x53\x56\x57')
        code+=b'\x68'+u32(data)+b'\x68'+u32(target)+b'\x6a\x04\xb8'+u32(getmod)+b'\xff\xd0\x85\xc0\x0f\x84'
        fail_jump=len(code);code+=b'\0'*4
        code+=b'\x81\x3d'+u32(data)+u32(base)+b'\x0f\x85';wrong_jump=len(code);code+=b'\0'*4
        for arg in reversed(args):code+=b'\x68'+u32(arg)
        code+=b'\xb8'+u32(target)+b'\xff\xd0'
        if args:code+=b'\x83\xc4'+bytes([4*len(args)])
        code+=b'\xa3'+u32(data+4)+b'\xe9';release_jump=len(code);code+=b'\0'*4
        wrong=len(code);code+=b'\xc7\x05'+u32(data+8)+u32(2)
        release=len(code);code+=b'\xff\x35'+u32(data)+b'\xb8'+u32(free)+b'\xff\xd0\xa3'+u32(data+12)+b'\xe9';done_jump=len(code);code+=b'\0'*4
        fail=len(code);code+=b'\xc7\x05'+u32(data+8)+u32(1)
        done=len(code);code+=b'\xa1'+u32(data+8)+b'\x5f\x5e\x5b\xc9\xc2\x04\x00'
        for pos,dest in [(fail_jump,fail),(wrong_jump,wrong),(release_jump,release),(done_jump,done)]:struct.pack_into('<i',code,pos,dest-pos-4)
        write(scratch,bytes(code));write(data,bytes(160));old=W.DWORD()
        require(Protect(h,scratch,4096,0x20,C.byref(old)) and Flush(h,scratch,len(code)),'scratch RX/cache')
        tid=W.DWORD();thread=Thread(h,None,0,scratch,None,0,C.byref(tid));require(thread,'control thread');started=True
        result['control_tid']=tid.value;result['scratch']=scratch
        require(Wait(thread,10000)==0,'control timeout: scratch retained until thread/process completion')
        joined=True;exitcode=W.DWORD();require(Exit(thread,C.byref(exitcode)),'thread exit query')
        row=struct.unpack('<4I',read(data,16));result['thread_exit']=exitcode.value;result['return']=row[1]
        result['temporary_module_reference_released']=row[3]==1
        require(exitcode.value==0 and row[0]==base and row[2]==0 and row[3]==1,'module lease/control execution')
        if action=='query':
            require(row[1]==128,'DG19 query refused')
            result['DG19']=list(struct.unpack('<32I',read(data+32,128)))
            require(result['DG19'][:3]==[0x39314744,128,0x5648] and result['DG19'][3:5]==[pid,base],'DG19 identity')
            require(result['DG19'][22:27]==[0]*5,'diagnostic captured or published a proxy')
        result['after']=windows()
        for name in SITES:
            before=bytes.fromhex(result['before'][name]['bytes']);after=bytes.fromhex(result['after'][name]['bytes'])
            require(before[:4]==after[:4] and before[-4:]==after[-4:],'adjacent-byte guard '+name)
            require(result['after'][name]['protection']==result['before'][name]['protection']==0x20,'site RX protection '+name)
            n=SITES[name][1];patch=after[4:4+n];address=result['after'][name]['address']
            if action=='stop':require(patch==PREIMAGES[name],'restore preimage '+name)
            elif action=='activate' and name in ('Present','ODS'):
                require(patch[0]==0xE9 and patch[5:]==b'\x90'*(n-5),'generic E9 shape '+name)
                destination=(address+5+struct.unpack_from('<i',patch,1)[0])&0xFFFFFFFF
                require(base+text['va']<=destination<base+text['va']+text['size'],'generic E9 destination '+name)
            elif action=='stage0' and name.startswith('stage0'):
                require(patch[0]==0xE8 and patch[5]==0x90,'stage0 E8 shape')
                require((address+5+struct.unpack_from('<i',patch,1)[0])&0xFFFFFFFF==base+exports['Passthrough_Stage0Stub'],'stage0 stub destination')
        require(row[1]==(128 if action=='query' else 1),'control operation refused')
        result['status']='PASS'
    except Exception as e:
        result['error']=str(e)
    finally:
        if scratch:
            result['scratch_released']=bool(Free(h,scratch,0,0x8000)) if joined or not started else False
            if not result['scratch_released']:
                result['status']='FAIL'
                result.setdefault('error','scratch retained; do not reuse this session without resolving its live thread/allocation')
        if thread:Close(thread)
        Close(h)
    return result


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--pid',type=int,required=True);ap.add_argument('--creation',type=int,required=True)
    ap.add_argument('--candidate',type=Path,required=True);ap.add_argument('--action',choices=('query','activate','stage0','stop'),required=True)
    ap.add_argument('--out',type=Path,required=True);ap.add_argument('--live',action='store_true')
    a=ap.parse_args()
    # Reserve the receipt before doing anything to the target.
    with a.out.open('x',encoding='utf-8') as f:
        result=control(a.pid,a.candidate,a.action,a.creation,a.live);json.dump(result,f,indent=2)
    print(json.dumps(result));return 0 if result['status']=='PASS' else 2


if __name__=='__main__':raise SystemExit(main())
