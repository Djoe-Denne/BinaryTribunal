"""Independent byte/log/identity audit of an already-run isolated v19 batch.

Does not load any DLL or mutate the game/IDB. --evidence is the preserved
controller workspace; output files are created exclusively, never replaced.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess
import sys

from capstone import Cs, CS_ARCH_X86, CS_MODE_32
from capstone.x86 import X86_OP_IMM, X86_OP_MEM
from gate_lot25_v18_lifecycle import PE32

REPO = Path(__file__).resolve().parents[2]
V19 = REPO/'docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v19'


def sha(path):
    with Path(path).open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--evidence',type=Path,required=True)
    a=ap.parse_args();w=a.evidence.resolve()
    b=Path(json.loads((w/'candidate_selection.json').read_text())['attempt'])
    dll=b/'gfx_driver_passthrough.dll';raw=dll.read_bytes();pe=PE32(raw)
    checks=[]

    def check(label,condition):
        checks.append(dict(name=label,ok=bool(condition)))
        if not condition:raise AssertionError(label)

    build=json.loads((b/'receipt.json').read_text())
    check('build_exit_zero',build['exit']==0)
    for name in ('gfx_driver_passthrough.c','gfx_driver_passthrough.h','gfx_lifetime_v19.h','gfx_stage0_v19.h'):
        check('source_bound_'+name,sha(V19/name)==sha(b/name)==build['hashes'][name])
    check('dll_bound',sha(dll)==build['hashes'][dll.name])
    exports=pe.exports();old=PE32((V19.parent/'v18/gfx_driver_passthrough.dll').read_bytes()).exports()
    check('exports_exact_additive',set(exports)==set(old)|{'Passthrough_StopDiagnostic','Passthrough_QueryDiagnostic'})
    for name,rva in exports.items():
        if name.startswith('dotemu'):
            check('forward_'+name,pe.cstr(rva)=='dotemu_orig.'+name)

    symbols={};own={}
    for line in (b/'gfx_driver_passthrough.map').read_text().splitlines():
        m=re.match(r'^\s*[0-9a-fA-F]{4}:[0-9a-fA-F]{8}\s+(\S+)\s+([0-9a-fA-F]{8,16})(.*)',line)
        if not m:continue
        name=m[1].removeprefix('_').split('@')[0];va=int(m[2],16)
        if not pe.image_base<va<pe.image_base+pe.image_size:continue
        symbols[name]=va
        if ' f ' in m[3] and 'gfx_driver_passthrough.obj' in m[3]:own[name]=va
    md=Cs(CS_ARCH_X86,CS_MODE_32);md.detail=True
    all_starts=sorted({v for v in symbols.values() if any(
        s['va']<=v-pe.image_base<s['va']+s['size'] and s['characteristics']&0x20000000
        for s in pe.sections)})
    asm={}
    for name,va in own.items():
        end=next(v for v in all_starts if v>va)
        start=pe.offset(va-pe.image_base,end-va)
        asm[name]=list(md.disasm(raw[start:start+end-va],va))
    stub=asm['Passthrough_Stage0Stub']
    check('single_ret12',[i.op_str for i in stub if i.mnemonic=='ret']==['0xc'])
    check('native_vtable_call_98',sum(i.mnemonic=='call' and i.op_str=='dword ptr [eax + 0x98]' for i in stub)==1)
    stable=symbols['g_stage0StableRet'];owned=symbols['g_stage0_ret']
    refs=[op.mem.disp for i in stub for op in i.operands if op.type==X86_OP_MEM and not op.mem.base and not op.mem.index]
    check('immutable_site_identity_refs',refs.count(stable)==2 and refs.count(stable+4)==2 and owned not in refs and owned+4 not in refs)
    check('known_site_return_plus_one',sum(i.mnemonic=='inc' and i.op_str=='dword ptr [esp + 0x20]' for i in stub)==1)
    check('capture_and_proxy_helpers_not_linked',all(n not in own for n in ('GFXPT_FillProxy','GFXPT_DumpNode','GFXPT_DumpOpen','GFXPT_DumpArm')))

    # Imported IAT identities are derived from this PE, not guessed RVAs.
    nt=struct.unpack_from('<I',raw,0x3C)[0];imports={}
    imp_rva=struct.unpack_from('<I',raw,nt+24+104)[0]
    for at in range(imp_rva,imp_rva+4096,20):
        original,stamp,chain,name_rva,first=pe.at('<5I',at)
        if not any((original,stamp,chain,name_rva,first)):break
        for k in range(4096):
            item=pe.at('<I',(original or first)+4*k)[0]
            if not item:break
            imports[pe.image_base+first+4*k]=('#ordinal_'+str(item&0xFFFF) if item&0x80000000 else pe.cstr(item+2))
    by_va={v:n for n,v in own.items()};calls={}
    for name,ins in asm.items():
        direct=[]
        for i in ins:
            if i.mnemonic not in ('call','jmp') or not i.operands:continue
            op=i.operands[0]
            if op.type==X86_OP_IMM and op.imm in by_va:direct.append(by_va[op.imm])
            elif op.type==X86_OP_MEM and not op.mem.base and not op.mem.index:
                direct.append(imports.get(op.mem.disp,'indirect-memory'))
            elif i.mnemonic=='call':direct.append(i.op_str)
        calls[name]=direct
    reachable=set();pending=['DllMain']
    while pending:
        name=pending.pop()
        if name in reachable:continue
        reachable.add(name);pending.extend(n for n in calls.get(name,[]) if n in calls)
    check('DllMain_no_patch_or_PIN_reachable',not reachable.intersection({'GFXPT_EnsureResident','GFXPT_Stage0Activate','GFXPT_PlaceHook','GFXPT_PlaceHookRetained','GFXPT_Stage0Write','Passthrough_InstallBootHook','GFXPT_LogOpen'}))
    check('DllMain_no_forbidden_imports',not {c for n in reachable for c in calls.get(n,[])}.intersection({'GetModuleHandleExA','VirtualProtect','CreateThread','LoadLibraryA','SuspendThread'}))
    with (w/'final_candidate.asm.txt').open('x',encoding='utf-8') as f:
        for name,ins in asm.items():
            f.write('\n'+name+'\n')
            for i in ins:f.write(f'{i.address:08X} {i.bytes.hex():30s} {i.mnemonic} {i.op_str}\n')

    profiles={};total=0
    for label,count in [('v19-native-final',20),('v19-extra-final',6)]:
        receipt=json.loads((w/label/'receipt.json').read_text());subtotal=0
        check(label+'_count',len(receipt['cases'])==count and receipt['status']=='PASS')
        for case in receipt['cases']:
            directory=w/label/case['case']
            events=[json.loads(l) for l in (directory/'run.stdout.log').read_text().splitlines() if l.startswith('{')]
            rows=[e for e in events if e.get('event')=='check'];sums=[e for e in events if e.get('event')=='summary'];ids=[e for e in events if e.get('event')=='identity']
            check(label+'_'+case['case']+'_raw_checks',len(sums)==1 and len(rows)==sums[0]['checks'] and all(e['ok'] for e in rows) and sums[0]['fails']==0)
            check(label+'_'+case['case']+'_identity',len(ids)==1 and ids[0]['pid']==case['execution']['pid'] and ids[0]['dll_sha256']==sha(dll) and ids[0]['build']==0x5648)
            check(label+'_'+case['case']+'_copy',sha(directory/'test_candidate.dll')==sha(dll))
            check(label+'_'+case['case']+'_exit',case['execution']['returncode']==0)
            subtotal+=len(rows)
        profiles[label]=dict(processes=count,checks=subtotal);total+=subtotal
    red=json.loads((w/'v18-extra-1/receipt.json').read_text())
    check('v18_red_cases_preserved',{c['case'] for c in red['cases'] if c['status']=='FAIL'}==set('JNQR'))
    check('v18_slot1_production_wrapper_pass',next(c for c in red['cases'] if c['case']=='M')['status']=='PASS')
    frozen=json.loads((w/'frozen_hashes.json').read_text())
    check('all_frozen_185',len(frozen)==185 and all(sha(Path(p))==h for p,h in frozen.items()))
    game=Path('C:/Program Files (x86)/Steam/steamapps/common/FINAL FANTASY VIII')
    check('installed_rollback_unchanged',sha(game/'AF3DN.P')=='3da7883fb9815615f309e17e7a3b8fb6f496d091739839240a7d457ba7ba9d19')
    check('game_EXE_identity',sha(game/'FF8_EN.exe')=='064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570')
    check('game_sidecars_absent',all(not (game/n).exists() for n in ('gfx_passthrough.stage0','gfx_passthrough.dump')))
    head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()
    status=subprocess.check_output(['git','status','--porcelain=v1','-uall'],cwd=REPO,text=True)
    check('HEAD_unchanged',head==(w/'initial_head.txt').read_text().strip())
    check('preexisting_status_rows_preserved',set((w/'initial_git_status.txt').read_text().splitlines())<=set(status.splitlines()))
    tests=json.loads((w/'python_tests_receipt.json').read_text())
    check('historical_303_no_skips',tests['tests']==303 and tests['exit']==0 and not tests['skips'])
    import test_lot25_v18_contract as contract_test
    try:contract_test.contract.parse_strict(contract_test.capture(0x5648),build=0x5648)
    except contract_test.contract.ContractError as error:check('diagnostic_not_accepted_as_dump','unsupported build' in str(error))
    else:check('diagnostic_not_accepted_as_dump',False)
    result=dict(status='PASS',verdict='READY_FOR_CONTROLLED_DIAGNOSTIC_LIVE_ONLY',dll_sha256=sha(dll),dll_size=len(raw),build='0x5648',
                artifact_dir=str(b),profiles=profiles,native_checks=total,frozen_files=len(frozen),exports=exports,
                DllMain_reachable=sorted(reachable),calls=calls,checks=checks,head=head,
                deployed=False,game_launched=False,writer_verdict='NOT_A_CAPTURE_WRITER; full-writer live gate remains required',
                live_crash_cause='UNPROVEN',full_capture_qualification=False)
    with (w/'independent_validation.json').open('x',encoding='utf-8') as f:json.dump(result,f,indent=2)
    print(json.dumps({k:result[k] for k in ('status','verdict','dll_sha256','dll_size','native_checks','profiles','frozen_files')},indent=2))


if __name__=='__main__':
    main()
