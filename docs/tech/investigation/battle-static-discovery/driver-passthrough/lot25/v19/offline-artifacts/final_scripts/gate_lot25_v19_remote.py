"""Prove the external live-control route against an isolated host, offline."""
import argparse
import json
import os
from pathlib import Path
import queue
import shutil
import subprocess
import threading
from gate_lot25_v18_extra import config_for
import gate_lot25_v18_lifecycle as base
from control_lot25_v19 import control, CANDIDATE_SHA

HERE=Path(__file__).resolve().parent


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out',type=Path,required=True);ap.add_argument('--artifact-dir',type=Path,required=True)
    a=ap.parse_args();out=a.out.resolve();b=a.artifact_dir.resolve()
    assert out.is_relative_to((Path(os.environ['LOCALAPPDATA'])/'Temp/opencode').resolve())
    out.mkdir(parents=True,exist_ok=False)
    cfg=config_for(b/'gfx_driver_passthrough.dll',b/'gfx_driver_passthrough.map',b/'gfx_driver_passthrough.c',0x5648)
    assert cfg['dll_sha256']==CANDIDATE_SHA
    for name in ('harness_lot25_v18_lifecycle.c','harness_lot25_v18_extra.c','harness_lot25_v19_lifecycle.c','harness_lot25_v19_remote.c'):
        shutil.copy2(HERE/name,out/name)
    header=['#define CANDIDATE_BUILD_ID 0x5648u',f'#define CANDIDATE_DLL_SHA256 "{CANDIDATE_SHA}"',f'#define CANDIDATE_MAP_SHA256 "{cfg["map_sha256"]}"']
    header += [f'#define RVA_{name} 0x{value["rva"]:X}u' for name,value in sorted(cfg['symbols'].items())]
    (out/'lot25_v18_config.h').write_text('\n'.join(header)+'\n')
    cmd=f'call "{base.find_vcvars(None)}" x86 && cl /nologo /W4 /O2 /MT harness_lot25_v19_remote.c /Fe:offline_live_host.exe /link /INCREMENTAL:NO /OPT:NOREF /MACHINE:X86 /BASE:0x500000 /DYNAMICBASE:NO'
    built=base.run_logged('cmd.exe /d /s /c "'+cmd+'"',out,'compile',120);assert built['returncode']==0
    shutil.copy2(b/'gfx_driver_passthrough.dll',out/'test_candidate.dll')
    (out/'gfx_passthrough.stage0').write_text('offline opt-in only\n')
    p=subprocess.Popen([str(out/'offline_live_host.exe'),str(out/'test_candidate.dll')],cwd=out,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
    q=queue.Queue();rows=[]
    def drain():
        for line in p.stdout:
            rows.append(line)
            if line.startswith('{'):q.put(json.loads(line))
    worker=threading.Thread(target=drain,daemon=True);worker.start()
    def wait_event(name):
        for _ in range(100):
            event=q.get(timeout=15)
            if event.get('event')==name:return event
        raise RuntimeError('fixture event missing '+name)
    calls=[];normal=False
    try:
        ready=wait_event('ready');assert ready['pid']==p.pid
        creation=(ready['creation_hi']<<32)|ready['creation_lo']
        negatives=[]
        for label,born,live in [('wrong-creation',creation+1,False),('wrong-live-exe',creation,True)]:
            record=control(p.pid,b/'gfx_driver_passthrough.dll','query',born,live)
            base.write_json(out/f'negative-{label}.json',record)
            assert record['status']=='FAIL' and not record['scratch_writes'] and 'control_tid' not in record
            negatives.append(record)
        for action in ('query','activate','query','stage0','query','stop','query'):
            record=control(p.pid,b/'gfx_driver_passthrough.dll',action,creation)
            base.write_json(out/f'{len(calls):02d}-{action}.json',record);calls.append(record)
            assert record['status']=='PASS',record
            assert record['scratch_released'],record
            if action=='activate':
                p.stdin.write('p\n');p.stdin.flush();assert wait_event('frame')['fails']==0
        assert calls[2]['DG19'][14:16]==[1,1]
        assert calls[4]['DG19'][8:10]==[3,1]
        assert calls[6]['DG19'][7:11]==[0,0,0,0]
        assert calls[0]['before']==calls[6]['after']
        p.stdin.write('q\n');p.stdin.flush();assert p.wait(timeout=15)==0;worker.join(timeout=2);normal=True
        assert not [e for e in [json.loads(l) for l in rows if l.startswith('{')] if e.get('event')=='check' and not e['ok']]
        life=(out/'gfx_passthrough_lifecycle.bin').read_bytes();assert len(life)==128 and life[:4]==b'LC18'
        base.write_json(out/'receipt.json',dict(status='PASS',pid=p.pid,creation=creation,dll_sha256=CANDIDATE_SHA,control_calls=len(calls),
                        all_scratch_released=True,game_launched=False,deployed=False,host_sha256=base.sha_file(out/'offline_live_host.exe'),
                        calls=calls,identity_refusals=negatives,inventory=base.inventory(out)))
        print(json.dumps(dict(status='PASS',control_calls=len(calls),pid=p.pid,dll_sha256=CANDIDATE_SHA)))
    finally:
        if not normal and p.poll() is None:
            p.kill();p.wait(timeout=15) # this gate owns ONLY this synthetic fixture
        (out/'host.stdout.log').write_text(''.join(rows),encoding='utf-8')


if __name__=='__main__':main()
