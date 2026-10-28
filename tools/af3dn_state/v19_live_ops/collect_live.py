"""Local-only global v19 validation. Never reads/writes a live process.

Inputs must be archived under the run. --live cannot accept SELFTEST/offline
witnesses. Missing proof is INCONCLUSIVE; contradictory proof is FAIL.
No ISO/writer/rendering promotion and no same-frame inference.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from datetime import datetime, timezone
from pe_contract import headers, static_import_proof, IncompletePE

CAND='163e962d7f9355f61d1449b695119e94a928e616cdae54538fe0d2fa96d3d791'
EXE='064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570'
DOTEMU='539558e4f5cf495735ccc8d5e98a185e3660ceb8d5ddf21eb7558b02fbb21fec'
SITE={'Present':(0x1DF0C,bytes.fromhex('558bec518b450850')),
      'ODS':(0x3D99,bytes.fromhex('558bec51e8a8620000')),
      'stage0_bind':(0x1EF5D,bytes.fromhex('ff9098000000')),
      'stage0_unbind':(0x1EF72,bytes.fromhex('ff9098000000'))}
FILES=['01-before.json','02-activate.json','03-generic.json','04-stage0.json','05-battle.json','06-stop.json','07-retained.json']
ACTIONS=['query','activate','query','stage0','query','stop','query']
class Missing(Exception):pass
class Invalid(Exception):pass
def need(ok,label):
    if not ok:raise Invalid(label)
def sha(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def exact_int(value,label):
    need(type(value) is int or isinstance(value,str) and value.isdecimal(),label+' integer, no float')
    return int(value)
def keys(o,names,label):
    need(isinstance(o,dict),label+' object required')
    for name in names:
        if name not in o:raise Missing(label+' missing key '+name)
def evaluate(run,live):
    mode='LIVE' if live else 'SELFTEST';sources=[];checks=[]
    result={'mode':mode,'scope':'v19 constrained resident diagnostic ONLY; NOT writer/ISO/rendering promotion',
            'utc':datetime.now(timezone.utc).isoformat(),'status':'INCONCLUSIVE','sources':sources,'checks':checks,'observations':[]}
    def check(ok,label):need(ok,label);checks.append(label)
    def source(rel):
        p=(run/rel).resolve();need(p.is_relative_to(run.resolve()),'input path escapes run')
        if not p.is_file():raise Missing(str(rel))
        sources.append({'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p)})
        return p
    def js(rel):
        o=json.loads(source(rel).read_text(encoding='utf8'))
        name=str(rel)
        if name=='observation/armed.json':keys(o,['mode','status','armed_filetime'],name)
        if name=='observation/bound.json':keys(o,['mode','status','pid','creation','creation_hex','exe_path','exe_sha256','debugger_present','armed_filetime'],name)
        if name=='observation/exit.json':keys(o,['mode','status','pid','creation','creation_hex','exe_path','exe_sha256','exit_code','exit_code_hex','wait_signaled','observer_failed'],name)
        if name in FILES:
            keys(o,['live','status','action','pid','creation','candidate_sha256','exe_path','exe_sha256','module','scratch_released','temporary_module_reference_released','thread_exit','return','loaded_text_sha256','scratch_writes','control_tid','before','after'],name)
            keys(o['module'],['base','path','name','size'],name+'/module')
            for phase in ('before','after'):
                keys(o[phase],list(SITE),name+'/'+phase)
                for site in SITE:keys(o[phase][site],['address','bytes','patch_bytes','protection'],name+'/'+phase+'/'+site)
            if o['action']=='query':keys(o,['DG19'],name)
        return o
    try:
        armed=js('observation/armed.json');bound=js('observation/bound.json');ex=js('observation/exit.json')
        check(not (run/'observation/failed.json').exists(),'no observer failure witness')
        for o in (armed,bound,ex):check(o.get('mode')==mode,'observer mode '+str(o.get('status')))
        pid=bound['pid'];born=exact_int(bound['creation'],'creation');base=None;module=None
        check(type(pid) is int and pid>0 and born>0,'nonzero PID/FILETIME')
        check(isinstance(bound['creation'],str) and bound['creation_hex']==f'0x{born:016x}','FILETIME string/hex exact')
        check(born>exact_int(armed['armed_filetime'],'armed FILETIME')==exact_int(bound['armed_filetime'],'bound armed FILETIME'),'fresh process after arming')
        check(bound.get('status')=='BOUND' and bound.get('debugger_present') is False,'bound non-debugged')
        check(ex['pid']==pid and exact_int(ex['creation'],'exit FILETIME')==born and ex['creation_hex']==bound['creation_hex'],'exit identity')
        check(ex['exe_path']==bound['exe_path'] and ex['exe_sha256']==bound['exe_sha256']==EXE,'EXE hash agreement')
        check(Path(bound['exe_path']).name.lower()=='ff8_en.exe','EXE name')
        check(ex.get('status')=='EXIT_OBSERVED' and ex.get('wait_signaled') is True and ex.get('observer_failed') is False,'real signaled-process exit')
        check(type(ex['exit_code']) is int and ex['exit_code_hex']==f"0x{ex['exit_code']:08x}" and ex['exit_code']==0,'normal exit code zero')
        logs=[json.loads(x) for x in source('observation/journal.jsonl').read_text().splitlines()]
        if not logs:raise Missing('observer journal empty')
        for log in logs:keys(log,['mode','event'],'journal row')
        check(all(x.get('mode')==mode for x in logs),'observer journal modes')
        check(not any(x.get('event')=='failed' for x in logs),'observer journal no failure')
        debug=[x for x in logs if x.get('event')=='debugger_check']
        if not debug:raise Missing('observer debugger monitoring absent')
        for log in debug:keys(log,['pid','creation','debugger_present'],'journal debugger row')
        check(bool(debug) and all(x.get('debugger_present') is False and x['pid']==pid and exact_int(x['creation'],'journal creation')==born for x in debug),'debugger monitoring present and coherent')
        inventories=[x for x in logs if x.get('event')=='instrumentation_inventory']
        if not inventories:raise Missing('instrumentation inventory absent')
        for log in inventories:keys(log,['processes'],'instrumentation journal row')
        check(bool(inventories),'instrumentation inventory exists; review separately required')
        proof=js('static-import-proof.json')
        computed=static_import_proof(source('archive/installed/FF8_EN.exe'))
        keys(proof,list(computed),'static import proof')
        keys(proof['AF3DN_static_import'],['dll','descriptor_rva','symbols'],'static AF3DN import proof')
        if len(proof['AF3DN_static_import']['symbols'])<len(computed['AF3DN_static_import']['symbols']):raise Missing('static import symbols incomplete')
        check(proof==computed,'exact hash-bound EXE static AF3DN import proof')
        receipts=[js(f) for f in FILES]
        for r,action in zip(receipts,ACTIONS):
            check(r.get('live') is live and r.get('mode','LIVE' if r.get('live') is True else 'OFFLINE')==mode,'controller live/SELFTEST provenance')
            check(r.get('status')=='PASS' and r.get('action')==action,'control action success '+action)
            check(r['pid']==pid and exact_int(r['creation'],'controller FILETIME')==born,'controller process identity')
            check(r['candidate_sha256']==CAND and r['exe_sha256']==EXE and r['exe_path']==bound['exe_path'],'controller binary identities')
            if module is None:module=r['module'];base=module['base']
            check(r['module']==module,'candidate module identity stable')
            check(r.get('scratch_released') is True and r.get('temporary_module_reference_released') is True and r.get('thread_exit')==0,'control scratch/lease/thread cleanup')
            check(r.get('return')==(128 if action=='query' else 1),'control return '+action)
            check(r['loaded_text_sha256']==receipts[0]['loaded_text_sha256'] and len(r['loaded_text_sha256'])==64,'loaded text identities stable')
            check(bool(r.get('scratch_writes')) and type(r.get('control_tid')) is int,'control execution witnesses present')
            for name,(rva,preimage) in SITE.items():
                w0=r['before'][name];w1=r['after'][name];first=receipts[0]['before'][name]
                b0=bytes.fromhex(w0['bytes']);b1=bytes.fromhex(w1['bytes']);orig=bytes.fromhex(first['bytes']);n=len(preimage)
                if min(len(b0),len(b1),len(orig))<n+8:raise Missing('incomplete window '+name)
                check(len(b0)==len(b1)==len(orig)==n+8,'complete window '+name)
                check(w0['patch_bytes']==w1['patch_bytes']==n and w0['address']==w1['address']==first['address'],'window addresses/sizes '+name)
                check(w0['protection']==w1['protection']==0x20,'RX protection '+name)
                check(b0[:4]==b1[:4]==orig[:4] and b0[-4:]==b1[-4:]==orig[-4:],'cross-session neighbor guard '+name)
                patch=b1[4:4+n]
                if action=='activate' and name in ('Present','ODS'):
                    dest=(w1['address']+5+struct.unpack_from('<i',patch,1)[0])&0xffffffff
                    check(patch[0]==0xe9 and patch[5:]==b'\x90'*(n-5) and base+0x1000<=dest<base+0x1000+337920,'generic E9 destination '+name)
                if action=='stage0' and name.startswith('stage0'):
                    dest=(w1['address']+5+struct.unpack_from('<i',patch,1)[0])&0xffffffff
                    check(patch[0]==0xe8 and patch[5]==0x90 and dest==base+0x15a0,'stage0 E8 exact stub '+name)
        check(receipts[0]['before']==receipts[0]['after'],'initial query no site writes')
        for previous,current in zip(receipts,receipts[1:]):
            check(previous['after']==current['before'],'inter-action complete windows unchanged')
        for i in (0,2,4,6):
            check(receipts[i]['before']==receipts[i]['after'],'query no site changes '+str(i))
        exe_base=receipts[0]['before']['Present']['address']-SITE['Present'][0]
        for name,(rva,preimage) in SITE.items():
            w=receipts[0]['before'][name]
            check(w['address']==exe_base+rva and bytes.fromhex(w['bytes'])[4:-4]==preimage,'initial native preimage '+name)
        check(receipts[0]['before']==receipts[5]['after']==receipts[6]['before']==receipts[6]['after'],'complete original windows/protections restored')
        q=[receipts[i]['DG19'] for i in (0,2,4,6)]
        for d in q:
            if len(d)<32:raise Missing('DG19 incomplete DWORD array')
            check(len(d)==32 and all(type(x) is int and 0<=x<=0xffffffff for x in d),'DG19 32 DWORDs')
            check(d[:5]==[0x39314744,128,0x5648,pid,base],'DG19 identities')
            check(d[22:27]==[0]*5 and d[12]==0,'zero proxy/capture/suspension debt')
            check(d[27]>=d[14],'DG19 in-query counter monotonic')
        initial,generic,battle,final=q
        check(initial[5:11]==[0]*6 and initial[11]==0 and initial[29]==0 and initial[31]==0,'initial diagnostic unarmed/no writes')
        check(generic[5]==1 and generic[6]==0 and generic[7]==3 and generic[8:10]==[0,0] and generic[10:12]==[1,1],'generic residency/ownership; stage0 PIN not yet attempted')
        check(battle[5:12]==[1,1,3,3,1,1,1] and battle[31]==1,'stage0/generic active resident')
        check(generic[13]>0 and battle[28]==3 and battle[29]>=2 and battle[30]==1,'quiescence/stage0 lifecycle/patch/PIN witnesses')
        check(generic[27]>initial[27] and battle[27]>generic[27],'Present progresses after activation and in battle')
        check(all(battle[i]>generic[i] for i in (17,18,20,21)),'bind/unbind requests/results progress; unknown site0 not required')
        for earlier,later in zip(q,q[1:]):
            check(all(earlier[i]<=later[i] for i in (14,15,16,17,18,19,20,21,27)),'all aggregate counters nonregressing, including unknown site0')
        check(final[5:12]==[1,1,0,0,0,0,1] and final[28]==5 and final[31]==1,'RESTORED_RETAINED not Detached')
        check(final[29]>=battle[29] and final[30]==1,'stage0 single activation/PIN, patch writes monotonic')
        lc=source('gfx_passthrough_lifecycle.bin').read_bytes()
        if len(lc)<128:raise Missing('LC18 incomplete pair: '+str(len(lc))+' bytes <128')
        check(len(lc)==128,'LC18 exact pair 128 bytes')
        rows=[struct.unpack_from('<16I',lc,o) for o in (0,64)]
        for row in rows:
            check(row[:3]==(0x3831434c,64,pid) and ((row[5]<<32)|row[4])==born and row[6]==base and row[3]!=0,'LC18 header/PID/FILETIME/module/thread')
            check(row[9:11]==(1,0),'LC18 opt-in/nohook')
        attach,detach=rows
        check(attach[7:9]==(1,1) and attach[11:16]==(1,0,0,0,0),'LC18 static-import attach reason=1/reserved=1 and inert')
        check(detach[7:9]==(0,1) and detach[11:15]==(5,1,0,0) and detach[15]>=final[27],'LC18 terminating detach retained-restored; in-flight frame tail allowed')
        result['observations'].append({'name':'LC18 frame tail','query07_frame':final[27],'detach_frame':detach[15],'delta':detach[15]-final[27],
                                       'interpretation':'aggregate in-flight entry may finish after stop; not same-frame rendering, no renewed hook inferred; exact windows still mandatory'})
        review=js('parent_review.json')
        keys(review,['mode','pid','creation','candidate_sha256','controls_serialized','no_concurrent_instrumentation','no_visual_corruption','native_render_after_restore','normal_exit_requested','configuration_native_boot_verified','battle_screenshot','restored_screenshot','modules_evidence','configuration_evidence'],'parent review')
        check(review.get('mode')==mode and review['pid']==pid and exact_int(review['creation'],'review creation')==born and review['candidate_sha256']==CAND,'parent review identity')
        for flag in ('controls_serialized','no_concurrent_instrumentation','no_visual_corruption','native_render_after_restore','normal_exit_requested','configuration_native_boot_verified'):
            check(review.get(flag) is True,'parent observation '+flag)
        for label in ('battle_screenshot','restored_screenshot','modules_evidence','configuration_evidence'):
            evidence=review[label];keys(evidence,['path','sha256'],label);p=source(evidence['path']);check(sha(p)==evidence['sha256'],'review evidence hash '+label)
            if live and label.endswith('screenshot'):
                with p.open('rb') as f:header=f.read(12)
                check(header.startswith(b'\x89PNG\r\n\x1a\n') or header.startswith(b'\xff\xd8\xff') or header[:4]==b'RIFF' and header[8:12]==b'WEBP','screenshot image header '+label)
        mods=js(review['modules_evidence']['path'])
        keys(mods,['mode','pid','creation','modules','inventory_status'],'modules witness')
        if mods['inventory_status']=='INCONCLUSIVE':raise Missing('module file proof incomplete')
        check(mods['inventory_status']=='VERIFIED','module inventory verified')
        for row in mods['modules']:
            keys(row,['name','path','base','size','sha256','reported_path','mapped_path','resolved_path','source','hash_status','hash_kind','verdict'],'module row')
            if row['hash_status']=='INCOMPLETE':raise Missing('incomplete mapped module file proof '+row['name'])
            check(row['hash_status']=='VERIFIED' and row['verdict']=='VERIFIED' and row['sha256'] is not None,'module file hash refusal '+row['name'])
        check(mods.get('mode')==mode and mods['pid']==pid and exact_int(mods['creation'],'modules creation')==born,'modules witness identity')
        for name,hashvalue in [('af3dn.p',CAND),('ff8_en.exe',EXE),('dotemu_orig.dll',DOTEMU)]:
            selected=[m for m in mods['modules'] if m['name'].lower()==name]
            check(len(selected)==1 and selected[0]['sha256']==hashvalue,'loaded module inventory '+name)
            if name=='af3dn.p':check(selected[0]['base']==base and selected[0]['path']==module['path'],'candidate module base/path agreement')
            if name=='ff8_en.exe':check(selected[0]['base']==exe_base and selected[0]['path']==bound['exe_path'],'EXE module base/path agreement')
        cfg=js(review['configuration_evidence']['path'])
        keys(cfg,['mode','pid','creation','engine','driver','imagebase','headers','getters','readbacks'],'backend witness')
        keys(cfg['headers'],['address','hex'],'loaded PE header witness')
        keys(cfg['getters'],['global','driver'],'getter code witnesses')
        keys(cfg['readbacks'],['engine_global','0xBA8','0xB88','0xBBC','0xBD0','driver','slot4'],'direct backend reads')
        check(cfg.get('mode')==mode and cfg['pid']==pid and exact_int(cfg['creation'],'backend creation')==born,'backend witness identity')
        loaded=headers(bytes.fromhex(cfg['headers']['hex']))
        static=headers(source('archive/installed/FF8_EN.exe').read_bytes())
        check(cfg['imagebase']==cfg['headers']['address']==exe_base and loaded==static,'live PE32 headers/sections match hash-bound EXE')
        text=loaded['text'];text_start=exe_base+text['rva'];text_end=text_start+text['size']
        engine=exact_int(cfg['engine'],'engine address')
        def dword(label,address,expected=None):
            row=cfg['readbacks'][label];keys(row,['address','hex','value'],'readback '+label);raw=bytes.fromhex(row['hex'])
            check(row['address']==address and len(raw)==4 and struct.unpack('<I',raw)[0]==row['value'],'exact DWORD readback '+label)
            if expected is not None:check(row['value']==expected,'expected DWORD '+label)
            return row['value']
        check(engine!=0,'engine nonzero')
        dword('engine_global',exe_base+0x1679D88,engine)
        for name,rva,expected in [('global',0xA04D,b'\xa1'+struct.pack('<I',exe_base+0x1679D88)+b'\x5d'),('driver',0x98F4,bytes.fromhex('8b80740a00005dc355'))]:
            row=cfg['getters'][name];keys(row,['address','hex'],'getter '+name)
            check(row['address']==exe_base+rva and bytes.fromhex(row['hex'])==expected and text_start<=row['address']<text_end,'getter bytes/address (ASLR-aware) '+name)
        for offset,value in [('0xBA8',0),('0xB88',1),('0xBBC',3)]:
            dword(offset,engine+int(offset,16),value)
        check(dword('0xBD0',engine+0xBD0)!=0,'BD0 nonzero observation only; no owner inference')
        driver=exact_int(cfg['driver'],'driver pointer');check(driver!=0,'driver nonzero');dword('driver',engine+0xA74,driver)
        present=dword('slot4',driver+0x10)
        check(text_start<=present<text_end,'slot4 Present must be inside loaded FF8_EN.exe .text, not external driver')
        result['observations'].append({'name':'Present source','pointer':present,'module':'FF8_EN.exe','module_path':bound['exe_path'],'section':'.text',
                                       'BD0':cfg['readbacks']['0xBD0']['value'],'BD0_ownership':'not inferred'})
        result['status']='LIVE_DIAGNOSTIC_PASS' if live else 'SELFTEST_PASS'
        result['identity']={'pid':pid,'creation':str(born),'candidate_sha256':CAND,'module_base':base}
    except (Missing,KeyError,IndexError,json.JSONDecodeError,IncompletePE) as e:result['status']='INCONCLUSIVE';result['error']='missing/incomplete proof: '+str(e)
    except Exception as e:result['status']='FAIL';result['error']=str(e)
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--run',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
    g=p.add_mutually_exclusive_group(required=True);g.add_argument('--live',action='store_true');g.add_argument('--selftest',action='store_true')
    a=p.parse_args()
    with a.out.open('x',encoding='utf8') as f:
        r=evaluate(a.run,a.live);json.dump(r,f,indent=2)
    print(json.dumps({'status':r['status'],'checks':len(r['checks']),'error':r.get('error')}))
    return 0 if r['status'] in ('LIVE_DIAGNOSTIC_PASS','SELFTEST_PASS') else 2
if __name__=='__main__':raise SystemExit(main())
