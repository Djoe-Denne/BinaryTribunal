"""Pure offline PE32/import parsing; never opens or interacts with a process."""
import hashlib
from pathlib import Path
import struct

EXE_SHA='064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
class IncompletePE(ValueError):pass

def require(ok,label):
    if not ok:raise ValueError(label)
def headers(data):
    if len(data)<64:raise IncompletePE('incomplete PE DOS header')
    require(data[:2]==b'MZ','PE DOS magic')
    nt=struct.unpack_from('<I',data,60)[0]
    require(64<=nt<=65536,'PE NT offset bounds')
    if nt+24>len(data):raise IncompletePE('incomplete PE NT fixed header')
    require(data[nt:nt+4]==b'PE\0\0','PE signature')
    machine,nsections=struct.unpack_from('<HH',data,nt+4);optional=struct.unpack_from('<H',data,nt+20)[0]
    require(machine==0x14c and 0<nsections<=96 and optional>=224,'i386 section/optional contract')
    end=nt+24+optional+nsections*40
    if end>len(data):raise IncompletePE('incomplete PE sections')
    require(struct.unpack_from('<H',data,nt+24)[0]==0x10b,'PE32 required')
    image_base=struct.unpack_from('<I',data,nt+24+28)[0]
    image_size=struct.unpack_from('<I',data,nt+24+56)[0]
    header_size=struct.unpack_from('<I',data,nt+24+60)[0]
    count=struct.unpack_from('<I',data,nt+24+92)[0]
    require(count>=2,'PE import directory missing')
    imports=struct.unpack_from('<II',data,nt+24+104)
    sections=[]
    for i in range(nsections):
        p=nt+24+optional+i*40;name=data[p:p+8].split(b'\0')[0].decode('ascii')
        size,rva,raw_size,raw=struct.unpack_from('<4I',data,p+8);flags=struct.unpack_from('<I',data,p+36)[0]
        require(rva+size<=image_size,'PE section exceeds image')
        sections.append({'name':name,'rva':rva,'size':size,'raw_size':raw_size,'raw':raw,'characteristics':flags})
    text=[s for s in sections if s['name']=='.text'];require(len(text)==1 and text[0]['size']>0 and text[0]['characteristics']&0x20000000,'.text unique executable')
    return {'machine':machine,'magic':0x10b,'preferred_base':image_base,'image_size':image_size,'header_size':header_size,'nt_offset':nt,'headers_end':end,'sections':sections,'text':text[0],'imports_rva':imports[0],'imports_size':imports[1]}

def static_import_proof(path):
    path=Path(path);data=path.read_bytes();digest=hashlib.sha256(data).hexdigest()
    require(digest==EXE_SHA,'static EXE hash identity')
    pe=headers(data)
    def raw(rva,n):
        if rva+n<=pe['header_size']:p=rva
        else:
            choices=[s for s in pe['sections'] if s['rva']<=rva and rva+n<=s['rva']+s['raw_size']]
            require(len(choices)==1,'RVA not file-backed');s=choices[0];p=s['raw']+rva-s['rva']
        require(p+n<=len(data),'file RVA bounds');return data[p:p+n]
    def string(rva):
        value=bytearray()
        for i in range(512):
            b=raw(rva+i,1)
            if b==b'\0':return value.decode('ascii')
            value+=b
        raise ValueError('unterminated PE import string')
    require(pe['imports_rva'] and pe['imports_size']>=20,'static import table absent')
    modules=[];terminated=False
    # This exact DotEmu EXE declares 13*20 bytes, followed by the file-backed
    # all-zero terminator at the directory end. Accept only that one extra
    # descriptor, never an unbounded scan; record its position/bytes explicitly.
    for offset in range(0,min(pe['imports_size']+20,4096*20),20):
        original,stamp,chain,name,thunk=struct.unpack('<5I',raw(pe['imports_rva']+offset,20))
        if not any((original,stamp,chain,name,thunk)):terminated=True;break
        require(offset<pe['imports_size'],'nonzero descriptor outside declared import directory')
        dll=string(name);symbols=[];table=original or thunk
        for i in range(65536):
            entry=struct.unpack('<I',raw(table+i*4,4))[0]
            if not entry:break
            symbols.append({'ordinal':entry&0xffff} if entry&0x80000000 else {'name':string(entry+2)})
        else:raise ValueError('unterminated PE import thunk')
        modules.append({'dll':dll,'descriptor_rva':pe['imports_rva']+offset,'symbols':symbols})
    require(terminated,'unterminated static import descriptor table')
    selected=[x for x in modules if x['dll'].lower()=='af3dn.p']
    require(len(selected)==1 and selected[0]['symbols'],'AF3DN.P static import required')
    return {'status':'STATIC_IMPORT_VERIFIED','exe_sha256':digest,'exe_bytes':len(data),
            'preferred_base':pe['preferred_base'],'machine':pe['machine'],'magic':pe['magic'],
            'import_directory_rva':pe['imports_rva'],'import_directory_bytes':pe['imports_size'],
            'terminator_rva':pe['imports_rva']+offset,'terminator_hex':raw(pe['imports_rva']+offset,20).hex(),
            'terminator_at_directory_end':offset==pe['imports_size'],
            'AF3DN_static_import':selected[0],'method':'parse IMAGE_DIRECTORY_ENTRY_IMPORT of exact hash-bound EXE, not LoadLibrary fixture inference'}
