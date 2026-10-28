"""Module-base authoritative mapped NT path -> exact opened file -> SAME-handle SHA.

No reported-path rewrite, basename search, global WOW64 redirection change,
memory-hash claim, missing-hash bypass, or process memory writes. File handles
belong to this resolver. The read-only process handle always belongs to caller.
"""
import ctypes as C
from ctypes import wintypes as W
import hashlib
import ntpath

class ProofError(Exception):
    def __init__(self,code,message,verdict='INCONCLUSIVE'):
        super().__init__(message);self.code=code;self.verdict=verdict

class FileInfo(C.Structure):
    _fields_=[('attributes',W.DWORD),('creation',W.FILETIME),('access',W.FILETIME),('write',W.FILETIME),
              ('volume',W.DWORD),('size_hi',W.DWORD),('size_lo',W.DWORD),('links',W.DWORD),('index_hi',W.DWORD),('index_lo',W.DWORD)]

class WinMappedFiles:
    def __init__(self):
        self.k=C.WinDLL('kernel32',use_last_error=True)
        def bind(lib,name,args,result):
            f=getattr(lib,name);f.argtypes=args;f.restype=result;return f
        try:
            self.mapped=bind(self.k,'K32GetMappedFileNameW',[W.HANDLE,C.c_void_p,W.LPWSTR,W.DWORD],W.DWORD)
            self.source='K32GetMappedFileNameW(module_base)'
        except AttributeError:
            self.psapi=C.WinDLL('psapi',use_last_error=True)
            self.mapped=bind(self.psapi,'GetMappedFileNameW',[W.HANDLE,C.c_void_p,W.LPWSTR,W.DWORD],W.DWORD)
            self.source='psapi.GetMappedFileNameW(module_base)'
        self.create=bind(self.k,'CreateFileW',[W.LPCWSTR,W.DWORD,W.DWORD,C.c_void_p,W.DWORD,W.DWORD,W.HANDLE],W.HANDLE)
        self.final=bind(self.k,'GetFinalPathNameByHandleW',[W.HANDLE,W.LPWSTR,W.DWORD,W.DWORD],W.DWORD)
        self.read=bind(self.k,'ReadFile',[W.HANDLE,C.c_void_p,W.DWORD,C.POINTER(W.DWORD),C.c_void_p],W.BOOL)
        self.info=bind(self.k,'GetFileInformationByHandle',[W.HANDLE,C.POINTER(FileInfo)],W.BOOL)
        self.close_api=bind(self.k,'CloseHandle',[W.HANDLE],W.BOOL)
    def text(self,call,label):
        for cap in (512,1024,2048,4096,8192,16384,32768):
            buf=C.create_unicode_buffer(cap);n=call(buf,cap)
            if not n:raise ProofError(label+'_FAILED',f'{label}; winerror={C.get_last_error()}')
            if n>=cap-1:continue # refuse ambiguously truncated results, grow first
            value=buf.value
            if len(value.encode('utf-16-le'))//2!=n:raise ProofError(label+'_LENGTH','returned UTF-16 length/terminator mismatch')
            return value
        raise ProofError(label+'_TRUNCATED','path exceeds bounded complete UTF-16 buffer')
    def mapped_path(self,h,base):return self.text(lambda b,n:self.mapped(h,base,b,n),'MAPPED_PATH')
    def open_file(self,path):
        # GENERIC_READ; share read/write/delete; OPEN_EXISTING; SEQUENTIAL_SCAN.
        h=self.create(path,0x80000000,7,None,3,0x08000000,None)
        if h in (None,C.c_void_p(-1).value):raise ProofError('OPEN_EXACT_FILE_FAILED',f'{path}; winerror={C.get_last_error()}')
        return h
    def final_path(self,h):return self.text(lambda b,n:self.final(h,b,n,2),'FINAL_NT_PATH') # VOLUME_NAME_NT
    def information(self,h):
        x=FileInfo()
        if not self.info(h,C.byref(x)):raise ProofError('FILE_INFO_FAILED',f'GetFileInformationByHandle; winerror={C.get_last_error()}')
        return {'volume_serial':x.volume,'file_index':str((x.index_hi<<32)|x.index_lo),
                'size':(x.size_hi<<32)|x.size_lo,'write_internal':(x.write.dwHighDateTime<<32)|x.write.dwLowDateTime}
    def chunks(self,h):
        b=C.create_string_buffer(1024*1024)
        while True:
            n=W.DWORD()
            if not self.read(h,b,len(b),C.byref(n),None):raise ProofError('READ_FILE_FAILED',f'ReadFile; winerror={C.get_last_error()}')
            if n.value>len(b):raise ProofError('READ_COUNT_INVALID','ReadFile count beyond buffer','FAIL')
            if not n.value:return
            yield b.raw[:n.value]
    def close(self,h):
        if not self.close_api(h):raise ProofError('CLOSE_FILE_FAILED',f'CloseHandle; winerror={C.get_last_error()}')

NATIVE=WinMappedFiles()

def resolve_module(row,process_handle,backend=None):
    backend=backend or NATIVE
    out=dict(row,reported_path=row['path'],mapped_path=None,resolved_path=None,
             source=backend.source,hash_status='INCOMPLETE',verdict='INCONCLUSIVE',sha256=None,
             hash_kind='disk file SHA256 via same opened handle; NOT loaded-memory hash')
    h=None
    try:
        name=row['name'];reported=row['path']
        if not name or not row['base']:raise ProofError('MODULE_ID_INVALID','missing module name/base','FAIL')
        if len(name)>=255 or len(reported)>=259:raise ProofError('TOOLHELP_TRUNCATED','Toolhelp fixed buffer may be truncated')
        if ntpath.basename(reported).casefold()!=name.casefold():raise ProofError('REPORTED_BASENAME_MISMATCH','reported path/name disagree','FAIL')
        mapped=backend.mapped_path(process_handle,row['base']);out['mapped_path']=mapped
        if not mapped.startswith('\\Device\\'):raise ProofError('NT_NAMESPACE_UNSUPPORTED','mapped path is not a complete Device NT path')
        if len(mapped)>=32767:raise ProofError('MAPPED_PATH_TRUNCATED','mapped path at UTF-16 bound')
        if ntpath.basename(mapped).casefold()!=name.casefold():raise ProofError('MAPPED_BASENAME_MISMATCH','mapped path/name disagree','FAIL')
        exact='\\\\?\\GLOBALROOT'+mapped;out['opened_path']=exact
        h=backend.open_file(exact)
        final=backend.final_path(h);out['resolved_path']=final
        if len(final)>=32767:raise ProofError('FINAL_PATH_TRUNCATED','resolved path at UTF-16 bound')
        if not final.startswith('\\Device\\'):raise ProofError('FINAL_NAMESPACE_UNSUPPORTED','final opened path is not a complete NT path')
        if ntpath.basename(final).casefold()!=name.casefold():raise ProofError('FINAL_BASENAME_MISMATCH','opened file/name disagree','FAIL')
        before=backend.information(h);hashobj=hashlib.sha256();count=0
        for data in backend.chunks(h):
            hashobj.update(data);count+=len(data)
            if count>before['size']:raise ProofError('FILE_CHANGED_DURING_READ','file grew beyond preimage size while hashing')
        after=backend.information(h)
        if before!=after or count!=before['size']:raise ProofError('FILE_CHANGED_DURING_READ','same-handle file identity/size/write changed')
        if backend.mapped_path(process_handle,row['base'])!=mapped:raise ProofError('MAPPING_CHANGED','module mapping changed during hash')
        out.update(hash_status='VERIFIED',verdict='VERIFIED',sha256=hashobj.hexdigest(),bytes=count,
                   file_identity={k:v for k,v in before.items() if k!='write_internal'})
    except ProofError as e:out.update(hash_status='REFUSED' if e.verdict=='FAIL' else 'INCOMPLETE',verdict=e.verdict,error_code=e.code,error=str(e),sha256=None)
    except Exception as e:out.update(hash_status='INCOMPLETE',verdict='INCONCLUSIVE',error_code='UNEXPECTED_RESOLUTION_ERROR',error=repr(e),sha256=None)
    finally:
        if h is not None:
            try:backend.close(h)
            except Exception as e:out.update(hash_status='INCOMPLETE',verdict='INCONCLUSIVE',error_code='CLOSE_FILE_FAILED',error=repr(e),sha256=None)
    return out

def inventory_verdict(rows):
    if not rows:return 'INCONCLUSIVE'
    if any(x.get('verdict')=='FAIL' for x in rows):return 'FAIL'
    if any(x.get('hash_status')!='VERIFIED' or not x.get('sha256') for x in rows):return 'INCONCLUSIVE'
    return 'VERIFIED'
