"""Strict read-only v19 native snapshot, never calls getters or control exports.

Parent anchors: EXE preferred base 0x400000, global getter RVA 0xA04D bytes
a1889da7015d -> global engine RVA 0x1679D88; driver getter RVA 0x98F4 bytes
8b80740a00005dc355. ReadProcessMemory only. Foreign Present source is STOP.
No screenshot of desktop is ever captured; HWND is correlated to target PID.
"""
import argparse
import ctypes as C
from ctypes import wintypes as W
import json
from pathlib import Path
import struct
import pe_contract as PE
import winread as R

EXE=Path(r'C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe')
CAND='163e962d7f9355f61d1449b695119e94a928e616cdae54538fe0d2fa96d3d791'
DOTEMU='539558e4f5cf495735ccc8d5e98a185e3660ceb8d5ddf21eb7558b02fbb21fec'
ANCHORS=[{'source':'parent PE verification, getter 0x40A04D a1889da7015d','fact':'engine global RVA 0x1679D88; no getter call'},
         {'source':'parent PE verification, getter 0x4098F4 8b80740a00005dc355','fact':'driver pointer E+0xA74'},
         {'source':'semantic/0x41619A__Gfx_BindDrawListBackendCallbacks.md:13','fact':'backend/driver access; parent validated'},
         {'source':'driver-abi-spec.md:263-274','fact':'native DDrawAlt boot and Present dispatch'},
         {'source':'decomp/0x45B2E0__IsWindowNOTActive.md','fact':'window HWND E+0x5C; parent validated'}]
class Incomplete(Exception):pass
class Contradiction(Exception):pass
class ModuleProofError(Exception):
    def __init__(self,status,message):super().__init__(message);self.status=status
def require(ok,label):
    if not ok:raise Contradiction(label)

def record_inventory(path,rows,pid,creation,mode='LIVE',enumeration_error=None):
    """Always persist every row before refusing incomplete/contradicting file proof."""
    status='INCONCLUSIVE' if enumeration_error else R.inventory_verdict(rows)
    R.exclusive_json(path,{'mode':mode,'pid':pid,'creation':str(creation),'utc':R.utc(),
                          'modules':rows,'inventory_status':status,'enumeration_error':enumeration_error,
                          'debugger_present':False,'disk_hash_not_memory_hash':True})
    if status!='VERIFIED':raise ModuleProofError(status,'module inventory incomplete/refused; all rows preserved in '+str(path))

def inventory(h,pid,born,path):
    try:rows=R.modules(pid,h)
    except R.ModuleInventoryError as e:
        record_inventory(path,e.rows,pid,born,enumeration_error=str(e));raise
    record_inventory(path,rows,pid,born);return rows

def analyze(read,modules,bound,mode='LIVE'):
    """Pure analysis over an exact-read callable; offline SELFTEST uses memory maps."""
    cfg={'mode':mode,'status':'INCONCLUSIVE','pid':bound['pid'],'creation':str(bound['creation']),
         'utc':R.utc(),'anchors':ANCHORS,'readbacks':{},'getters':{},'reads':[],
         'BD0_interpretation':'nonzero observation only, not ownership','screenshot':{'status':'NOT_CAPTURED','reason':'window-only capture not implemented; parent/user may supply image'}}
    def exact(address,n,label):
        require(0<address<0x100000000 and 0<n<=65536 and address+n<=0x100000000,'PE32 exact-read bounds '+label)
        b=read(address,n)
        cfg['reads'].append({'label':label,'address':address,'requested_bytes':n,'bytes':len(b),'hex':b.hex(),'exact':len(b)==n})
        if len(b)!=n:raise Incomplete('short exact RPM '+label)
        return b
    def dword(label,address):
        b=exact(address,4,label);v=struct.unpack('<I',b)[0];cfg['readbacks'][label]={'address':address,'hex':b.hex(),'value':v};return v
    try:
        selected=[m for m in modules if m['name'].lower()=='ff8_en.exe'];require(len(selected)==1,'one loaded FF8_EN.exe module')
        exe=selected[0];require(exe['sha256']==PE.EXE_SHA and exe['path']==bound['exe_path'],'loaded EXE path/hash identity')
        base=exe['base'];cfg['imagebase']=base
        dos=exact(base,64,'DOS header');require(dos[:2]==b'MZ','loaded MZ')
        nt=struct.unpack_from('<I',dos,60)[0];require(64<=nt<=65536,'live NT header offset bounds')
        fixed=exact(base+nt,24,'NT fixed header');require(fixed[:4]==b'PE\0\0','loaded PE signature')
        machine,count=struct.unpack_from('<HH',fixed,4);optional=struct.unpack_from('<H',fixed,20)[0]
        require(machine==0x14c and 0<count<=96 and 224<=optional<=4096,'live i386/optional bounds')
        length=nt+24+optional+count*40;require(length<=65536,'live PE header cap')
        raw=exact(base,length,'full PE32 headers');cfg['headers']={'address':base,'hex':raw.hex()}
        pe=PE.headers(raw);cfg['pe']=pe
        require(pe['image_size']==exe['size'],'module image size agrees with live PE')
        start=base+pe['text']['rva'];end=start+pe['text']['size'];cfg['loaded_text']={'address':start,'bytes':pe['text']['size']}
        for name,rva,expected in [('global',0xA04D,b'\xa1'+struct.pack('<I',base+0x1679D88)+b'\x5d'),('driver',0x98F4,bytes.fromhex('8b80740a00005dc355'))]:
            require(start<=base+rva and base+rva+len(expected)<=end,'getter lies in native .text '+name)
            actual=exact(base+rva,len(expected),'getter '+name);cfg['getters'][name]={'address':base+rva,'hex':actual.hex()}
            require(actual==expected,'getter byte identity/ASLR '+name)
        engine=dword('engine_global',base+0x1679D88);cfg['engine']=engine;require(engine!=0,'engine pointer null')
        for offset,value in [('0xBA8',0),('0xB88',1),('0xBBC',3)]:
            require(dword(offset,engine+int(offset,16))==value,'native engine value '+offset)
        require(dword('0xBD0',engine+0xBD0)!=0,'BD0 observed null')
        driver=dword('driver',engine+0xA74);cfg['driver']=driver;require(driver!=0,'driver pointer null')
        present=dword('slot4',driver+0x10)
        containing=[m for m in modules if m['base']<=present<m['base']+m['size']]
        cfg['Present_source']={'pointer':present,'modules':containing,'native_text_start':start,'native_text_end':end,'in_native_text':start<=present<end}
        require(start<=present<end,'STOP: Present slot4 outside native FF8_EN.exe .text; BA8 alone is not backend proof')
        cfg['backend']='DDrawAlt';cfg['backend_derivation']='direct engine DWORDs AND slot4 in loaded native EXE .text'
        hwnd=dword('HWND',engine+0x5C);cfg['window']={'hwnd':hwnd,'status':'NOT_CORRELATED_YET'}
        cfg['status']='NATIVE_READBACK_VERIFIED' if mode=='LIVE' else 'SELFTEST_NATIVE_READBACK_VERIFIED'
    except (Incomplete,KeyError,PE.IncompletePE) as e:cfg['status']='INCONCLUSIVE';cfg['error']=str(e)
    except Exception as e:cfg['status']='FAIL';cfg['error']=str(e)
    return cfg

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--bound',type=Path,required=True);ap.add_argument('--out',type=Path,required=True)
    ap.add_argument('--live',action='store_true',required=True)
    a=ap.parse_args();a.out.mkdir(exist_ok=False);h=None
    result={'mode':'LIVE','status':'INCONCLUSIVE','utc':R.utc(),'bound_path':str(a.bound.resolve()),'reads_process_memory_only':True}
    try:
        bound=json.loads(a.bound.read_text());result['bound_sha256']=R.sha(a.bound)
        require(bound['mode']=='LIVE' and bound['status']=='BOUND','LIVE observer bound required')
        pid=bound['pid'];born=int(bound['creation']);result.update(pid=pid,creation=str(born))
        require([x['pid'] for x in R.ff8()]==[pid],'sole regional FF8 must be bound EN process')
        h=R.Open(0x400|0x10,False,pid);R.require(h,'OpenProcess QUERY_INFORMATION|VM_READ')
        require(R.creation(h)==born,'exact FILETIME identity');path=R.image(h)
        require(path.resolve()==EXE.resolve() and str(path)==bound['exe_path'] and R.sha(path)==bound['exe_sha256']==PE.EXE_SHA,'canonical EXE/path/hash')
        debug=W.BOOL();R.require(R.Debugger(h,C.byref(debug)),'CheckRemoteDebuggerPresent');require(not debug.value,'debugger attached')
        result['modules']='modules.json'
        mods=inventory(h,pid,born,a.out/'modules.json')
        for name,digest in [('af3dn.p',CAND),('dotemu_orig.dll',DOTEMU)]:
            selected=[m for m in mods if m['name'].lower()==name];require(len(selected)==1 and selected[0]['sha256']==digest,'loaded module hash '+name)
        proof=PE.static_import_proof(path);R.exclusive_json(a.out/'static-import-proof.json',proof)
        readapi=R.api('ReadProcessMemory',[W.HANDLE,C.c_void_p,C.c_void_p,C.c_size_t,C.POINTER(C.c_size_t)],W.BOOL)
        rpm_calls=[]
        def read(address,n):
            buf=C.create_string_buffer(n);got=C.c_size_t();ok=readapi(h,address,buf,n,C.byref(got))
            rpm_calls.append({'address':address,'requested_bytes':n,'bytes':got.value,'hex':buf.raw[:got.value].hex(),'api_success':bool(ok),'winerror':C.get_last_error() if not ok else 0})
            if not ok or got.value!=n:raise Incomplete(f'RPM exact failed at 0x{address:x}, requested={n}, got={got.value}, winerror={C.get_last_error()}')
            return buf.raw
        cfg=analyze(read,mods,bound)
        cfg['RPM_calls']=rpm_calls
        if 'pe' in cfg and cfg['pe']!=PE.headers(path.read_bytes()):cfg.update(status='FAIL',error='live PE headers differ from hash-bound EXE')
        require(R.creation(h)==born,'post-read retained identity')
        R.require(R.Debugger(h,C.byref(debug)),'post-read debugger check');require(not debug.value,'debugger attached during snapshot')
        after=inventory(h,pid,born,a.out/'modules-after.json')
        require(after==mods,'module inventory changed during snapshot')
        if cfg.get('window',{}).get('hwnd'):
            user=C.WinDLL('user32',use_last_error=True);f=user.GetWindowThreadProcessId;f.argtypes=[W.HWND,C.POINTER(W.DWORD)];f.restype=W.DWORD
            owner=W.DWORD();tid=f(cfg['window']['hwnd'],C.byref(owner))
            cfg['window'].update(pid=owner.value,tid=tid,status='PID_CORRELATED' if tid and owner.value==pid else 'FAIL')
            if not tid or owner.value!=pid:cfg.update(status='FAIL',error='HWND owner PID mismatch; no window screenshot allowed')
        else:cfg.setdefault('window',{}).update(status='INCONCLUSIVE',reason='HWND zero/not yet available; no screenshot captured')
        R.exclusive_json(a.out/'configuration.json',cfg)
        result.update(status=cfg['status'],error=cfg.get('error'),configuration='configuration.json',modules='modules.json',static_import_proof='static-import-proof.json',debugger_present=False)
    except ModuleProofError as e:result.update(status=e.status,error=str(e))
    except (KeyError,json.JSONDecodeError,Incomplete,FileNotFoundError,PE.IncompletePE) as e:result.update(status='INCONCLUSIVE',error=str(e))
    except Exception as e:result.update(status='FAIL',error=str(e))
    finally:
        if h:R.Close(h)
        result['finished_utc']=R.utc();R.exclusive_json(a.out/'snapshot-receipt.json',result)
    print(json.dumps(result));return 0 if result['status']=='NATIVE_READBACK_VERIFIED' else 2
if __name__=='__main__':raise SystemExit(main())
