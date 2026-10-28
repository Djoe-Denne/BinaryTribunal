"""Parent-only read-only ASM/xref capture for final certainty checks; no IDB writes."""
from pathlib import Path
import datetime
import hashlib
import json
import struct
import ida_bytes
import ida_funcs
import ida_nalt
import idautils
import idc

root = Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
out = root/'docs/missions/ff8-decomp-semantics-2026-10-11-run01/closure-20261012/native-final'
out.mkdir(parents=True,exist_ok=True)
g = json.loads((root/'docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json').read_bytes())
sha = lambda b: hashlib.sha256(b).hexdigest()
pe = Path(ida_nalt.get_input_file_path()).read_bytes()
assert sha(pe) == '064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
nt = struct.unpack_from('<I',pe,0x3c)[0]
opt = nt+24
assert ida_nalt.get_imagebase() == struct.unpack_from('<I',pe,opt+28)[0] == 0x400000
n = struct.unpack_from('<H',pe,nt+6)[0]
size = struct.unpack_from('<H',pe,nt+20)[0]
sections = [struct.unpack_from('<IIII',pe,opt+size+i*40+8) for i in range(n)]

def disk(ea,n):
    for vs,va,rs,rp in sections:
        if va <= ea-0x400000 and ea-0x400000+n <= va+rs:
            at=rp+ea-0x400000-va
            return pe[at:at+n]
    raise AssertionError('Unbacked PE range')

rows=[]
for group in g['groups']:
    for target in group['eas']:
        if 'ONLY_CAPTURE' in globals() and target not in ONLY_CAPTURE: continue
        candidate=root/('outputs/ff8-decomp-semantics-20261011-r01/production/'+group['id']+'/'+target+'/semantic_r.md')
        if not candidate.exists() and target not in globals().get('EXTRA_EAS',[]): continue
        spec=next(x for x in g['functions'] if x['ea']==target)
        pb=(root/spec['path']).read_bytes()
        assert sha(pb)==spec['sha256'], 'Frozen packet changed'
        packet=json.loads(pb)
        ea=int(target,16)
        checks=[]
        for ch in packet['chunks']:
            lo,hi=int(ch['start'],0),int(ch['end'],0)
            b=bytes.fromhex(ch['hex'])
            checks.append({'lo':hex(lo),'hi':hex(hi),'sha256':sha(b),'match':b==ida_bytes.get_bytes(lo,hi-lo)==disk(lo,hi-lo)})
        asm=[]; callees=[]
        for item in idautils.FuncItems(ea):
            if not ida_bytes.is_code(ida_bytes.get_flags(item)):continue
            text=(idc.generate_disasm_line(item,0) or '').split(';',1)[0].strip()
            asm.append({'ea':hex(item),'hex':ida_bytes.get_bytes(item,idc.get_item_size(item)).hex(),'text':text})
            if idc.print_insn_mnem(item).lower()=='call':
                refs=list(idautils.CodeRefsFrom(item,0))
                callees.append({'site':hex(item),'operand':idc.print_operand(item,0),'operand_type':idc.get_operand_type(item,0),'operand_value':hex(idc.get_operand_value(item,0)),'code_targets':[hex(x) for x in refs]})
        xrefs=[{'from':hex(x.frm),'type':x.type,'code':bool(x.iscode),'function':hex(ida_funcs.get_func(x.frm).start_ea) if ida_funcs.get_func(x.frm) else None} for x in idautils.XrefsTo(ea,0)]
        record={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'ea':target,'group':group['id'],'name':idc.get_func_name(ea),
                'packet_sha256':sha(pb),'candidate':str(candidate.relative_to(root)) if candidate.exists() else None,'candidate_sha256':sha(candidate.read_bytes()) if candidate.exists() else None,
                'pe_sha256':sha(pe),'native_frozen_pe_equal':all(x['match'] for x in checks),'chunks':checks,'asm':asm,'callees':callees,'xrefs_to':xrefs,
                'existing_today_tag':'[semantic-triple 2026-10-12]' in (idc.get_func_cmt(ea,0) or '')}
        with (out/(target+'.json')).open('x',encoding='utf8') as f:json.dump(record,f,indent=2)
        rows.append({'ea':target,'n':len(asm),'native_ok':record['native_frozen_pe_equal'],'calls':len(callees),'xrefs':len(xrefs)})
print(json.dumps(rows))
