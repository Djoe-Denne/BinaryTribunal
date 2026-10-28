import pathlib, json, struct, hashlib, datetime
import idaapi, ida_bytes
root=pathlib.Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
mission=root/'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
g=json.loads((mission/'native-groups.json').read_text(encoding='utf-8'))
pe=pathlib.Path(idaapi.get_input_file_path()).read_bytes()
off=struct.unpack_from('<I',pe,0x3c)[0]
n=struct.unpack_from('<H',pe,off+6)[0]
sz=struct.unpack_from('<H',pe,off+20)[0]
base=struct.unpack_from('<I',pe,off+24+28)[0]
sec=off+24+sz
sections=[]
for i in range(n):
    vs,va,rs,rp=struct.unpack_from('<IIII',pe,sec+40*i+8)
    sections.append((va,max(vs,rs),rp))
def read_native(ea,size):
    rva=ea-base
    for va,span,rp in sections:
        if va<=rva and rva+size<=va+span:
            p=rp+rva-va
            return pe[p:p+size]
    return None
results=[]
for summary in g['functions']:
    if 'path' not in summary: continue
    packet=json.loads((root/summary['path']).read_text(encoding='utf-8'))
    diffs=[]
    for c in packet['chunks']:
        ea=int(c['start'],16); frozen=bytes.fromhex(c['hex']); disk=read_native(ea,len(frozen)); current=ida_bytes.get_bytes(ea,len(frozen))
        if disk is None or disk!=frozen or current!=frozen:
            positions=[ea+i for i,(a,b) in enumerate(zip(frozen,disk or b'')) if a!=b]
            diffs.append({'chunk':c['start'],'size':len(frozen),'pe_mismatch_byte_count':len(positions),'first_pe_mismatches':[hex(x) for x in positions[:20]],'live_idb_changed_since_freeze':current!=frozen,'frozen_sha256':hashlib.sha256(frozen).hexdigest(),'pe_sha256':hashlib.sha256(disk).hexdigest() if disk is not None else None})
    results.append({'ea':packet['ea'],'idb_equals_pe_and_freeze':not diffs,'mismatches':diffs})
proof={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'disk_pe_sha256':hashlib.sha256(pe).hexdigest(),'idb_recorded_input_sha256':g['native']['input_sha256'],'results':results}
(mission/'native-pe-verification.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8')
blocked=[x for x in results if not x['idb_equals_pe_and_freeze']]
with (mission/'ledger.jsonl').open('a',encoding='utf-8') as fp:
    fp.write(json.dumps({'at_utc':proof['at_utc'],'event':'NATIVE_PE_BYTE_GATE','disk_pe_sha256':proof['disk_pe_sha256'],'checked':len(results),'blocked_eas':[x['ea'] for x in blocked],'evidence':'native-pe-verification.json','mutations':'none','policy':'block affected classification/production/promotion; continue unrelated discovery'})+'\n')
print(json.dumps({'checked':len(results),'blocked':blocked,'disk_pe_sha256':proof['disk_pe_sha256']}))
