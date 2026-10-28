"""Native offline-only closure probes; failures are retained as red evidence.

Usage: python tools/af3dn_state/gate_lot25_v18_extra.py --out <new Temp/opencode dir>
Accepts an explicitly selected PE32 candidate/build; never deploys or opens FF8.
The historical v18 controller and all original evidence remain immutable.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import struct
import sys

import gate_lot25_v18_lifecycle as base

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[1]
V18=REPO/'docs/tech/investigation/battle-static-discovery/driver-passthrough/lot25/v18'
TEMP=Path(os.environ['LOCALAPPDATA'])/'Temp/opencode'


def config_for(dll:Path,map_file:Path,source:Path,build:int)->dict:
    raw=dll.read_bytes();mp=map_file.read_bytes();src=source.read_bytes()
    pe=base.PE32(raw)
    text=mp.decode('utf-8','replace')
    base.require(int(re.search(r'Preferred load address is\s+([0-9a-fA-F]+)',text)[1],16)==pe.image_base,'MAP base')
    base.require(int(re.search(r'Timestamp is\s+([0-9a-fA-F]+)',text)[1],16)==pe.timestamp,'MAP timestamp')
    defines=re.findall(r'^\s*#define\s+GFXPT_BUILD_ID\s+\(?\s*(0x[0-9a-fA-F]+)',src.decode('utf-8','replace'),re.M)
    base.require(len(defines)==1 and int(defines[0],16)==build,'source/build mismatch')
    required={**base.SYMBOL_SIZES,'GFXPT_PlaceHook':1,'g_nativeAlive':4}
    symbols={}
    for line in text.splitlines():
        m=re.match(r'^\s*[0-9A-Fa-f]{4}:[0-9A-Fa-f]{8}\s+(\S+)\s+([0-9A-Fa-f]{8,16})\s',line)
        if not m:continue
        name=m[1].removeprefix('_')
        if name not in required:continue
        rva=int(m[2],16)-pe.image_base
        section=pe.section(rva,required[name]);code=name in base.CODE_SYMBOLS or name=='GFXPT_PlaceHook'
        base.require(bool(section['characteristics']&(0x20000000 if code else 0x80000000)),f'wrong section: {name}')
        base.require(name not in symbols or symbols[name]['rva']==rva,f'ambiguous {name}')
        symbols[name]=dict(rva=rva,size=required[name],section=section['name'],map_line=line.strip())
    base.require(set(symbols)==set(required),f'missing symbols {set(required)-set(symbols)}')
    exports=pe.exports()
    for name in base.EXPORTS:base.require(exports.get(name)==symbols[name]['rva'],f'export mismatch {name}')
    if build == 0x5648:
        base.require({'Passthrough_StopDiagnostic','Passthrough_QueryDiagnostic'} <= set(exports),'v19 exports')
    return dict(build=build,dll_sha256=base.sha_file(dll),map_sha256=base.sha_file(map_file),
                source_sha256=base.sha_file(source),symbols=symbols,exports=exports,pe_timestamp=pe.timestamp)


def read_lifecycle(directory:Path,identity:dict,denied:bool)->dict:
    path=directory/'gfx_passthrough_lifecycle.bin'
    data=path.read_bytes() if path.exists() else b''
    if denied:
        base.require(len(data)!=128,'denied witness unexpectedly complete')
        # Exercise the production v18 collector's rejection, not just a local size check.
        try:base.check_lifecycle(directory,'D',identity,[{'module':0,'frame_seq':0}])
        except base.GateFailure as error:return dict(status='REJECTED_AS_REQUIRED',bytes=len(data),reason=str(error))
        raise base.GateFailure('collector accepted denied lifecycle evidence')
    base.require(len(data)==128,f'LC18 length {len(data)} != 128')
    records=[dict(zip(base.LC_FIELDS,struct.unpack_from('<16I',data,off))) for off in (0,64)]
    for record in records:
        base.require(record['magic']==base.LC_MAGIC and record['size']==64,'LC18 header')
        base.require(all(record[k]==identity[k] for k in ('pid','tid','creation_lo','creation_hi')),'LC18 identity')
        base.require(record['module']!=0 and (record['creation_lo'] or record['creation_hi']),'LC18 null identity')
    base.require(records[0]['reason']==1 and records[1]['reason']==0,'LC18 attach/detach')
    return dict(status='VALID',records=records)


def main()->int:
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out',type=Path,required=True)
    ap.add_argument('--candidate',type=Path,default=V18/'gfx_driver_passthrough.dll')
    ap.add_argument('--map',type=Path,default=V18/'gfx_driver_passthrough.map')
    ap.add_argument('--source',type=Path,default=V18/'gfx_driver_passthrough.c')
    ap.add_argument('--build',type=lambda v:int(v,0),default=0x5646)
    ap.add_argument('--cases',default=None)
    ap.add_argument('--profile',choices=('v18-extra','v19-lifecycle'),default='v18-extra')
    a=ap.parse_args();out=a.out.resolve()
    base.require(out.is_relative_to(TEMP.resolve()),'work must be inside approved Temp/opencode')
    allowed='ABCDEFGHIJKMUVWXYZ12' if a.profile=='v19-lifecycle' else 'JKLMNOPQR'
    a.cases=a.cases or allowed
    base.require(bool(a.cases) and set(a.cases)<=set(allowed) and len(set(a.cases))==len(a.cases),'invalid cases')
    base.require(a.profile!='v19-lifecycle' or a.build==0x5648,'v19 profile requires 0x5648')
    out.mkdir(parents=True,exist_ok=False)
    cfg=config_for(a.candidate,a.map,a.source,a.build);base.write_json(out/'candidate_config.json',cfg)
    harness='harness_lot25_v19_lifecycle.c' if a.profile=='v19-lifecycle' else 'harness_lot25_v18_extra.c'
    for name in sorted({'harness_lot25_v18_lifecycle.c','harness_lot25_v18_extra.c',harness}):
        shutil.copy2(HERE/name,out/name)
    header=[f'#define CANDIDATE_BUILD_ID 0x{a.build:X}u',
            f'#define CANDIDATE_DLL_SHA256 "{cfg["dll_sha256"]}"',
            f'#define CANDIDATE_MAP_SHA256 "{cfg["map_sha256"]}"']
    header += [f'#define RVA_{n} 0x{v["rva"]:X}u' for n,v in sorted(cfg['symbols'].items())]
    (out/'lot25_v18_config.h').write_text('\n'.join(header)+'\n',encoding='ascii')
    vc=base.find_vcvars(None)
    cmd=(f'call "{vc}" x86 && cl /nologo /W4 /O2 /MT {harness} '
         '/Fe:offline_extra.exe /Fo:offline_extra.obj /link /INCREMENTAL:NO /OPT:NOREF '
         '/MACHINE:X86 /SUBSYSTEM:CONSOLE /BASE:0x500000 /DYNAMICBASE:NO /MAP:offline_extra.map')
    built=base.run_logged('cmd.exe /d /s /c "'+cmd+'"',out,'compile',120)
    base.require(built['returncode']==0,'harness build failed (retained logs)')
    cases=[]
    for case in a.cases:
        directory=out/case;directory.mkdir()
        shutil.copy2(out/'offline_extra.exe',directory/'offline_extra.exe')
        shutil.copy2(a.candidate,directory/'test_candidate.dll')
        base.require(base.sha_file(directory/'test_candidate.dll')==cfg['dll_sha256'],'copy hash')
        (directory/'gfx_passthrough.stage0').write_text('persistent opt-in\n',encoding='ascii')
        result=base.run_logged([str(directory/'offline_extra.exe'),case,str(directory/'test_candidate.dll')],directory,'run',25)
        events=[];errors=[]
        for line in (directory/'run.stdout.log').read_text(encoding='utf-8',errors='replace').splitlines():
            if line.startswith('{'):
                try:events.append(json.loads(line))
                except json.JSONDecodeError:errors.append('invalid JSON event')
        identities=[e for e in events if e.get('event')=='identity']
        sums=[e for e in events if e.get('event')=='summary']
        failures=[e for e in events if e.get('event')=='check' and not e['ok']]
        life={}
        try:
            base.require(len(identities)==1 and len(sums)==1,'missing unique identity/summary')
            base.require(identities[0]['pid']==result['pid'],'controller PID mismatch')
            base.require(identities[0]['build']==a.build and identities[0]['dll_sha256']==cfg['dll_sha256'],'candidate identity mismatch')
            life=read_lifecycle(directory,identities[0],case=='L' and a.profile=='v18-extra')
        except base.GateFailure as error:errors.append(str(error))
        ok=result['returncode']==0 and len(sums)==1 and sums[0]['fails']==0 and not errors
        row=dict(case=case,status='PASS' if ok else 'FAIL',execution=result,summary=sums[0] if sums else None,
                 failures=failures,errors=errors,lifecycle=life,events=events)
        base.write_json(directory/'result.json',row)
        cases.append(row)
        print(json.dumps(dict(case=case,status=row['status'],exit=result['returncode'],
                              failed_checks=[x['name'] for x in failures],errors=errors)),flush=True)
    report=dict(status='PASS' if all(c['status']=='PASS' for c in cases) else 'FAIL',
                build=a.build,profile=a.profile,candidate=cfg,host_image_base=0x500000,cases=cases,
                game_launched=False,deployed=False,capture_armed_in_game=False,
                note='Only isolated synthetic processes; no waiver for a red case.',inventory=base.inventory(out))
    base.write_json(out/'receipt.json',report)
    return 0 if report['status']=='PASS' else 2


if __name__=='__main__':
    raise SystemExit(main())
