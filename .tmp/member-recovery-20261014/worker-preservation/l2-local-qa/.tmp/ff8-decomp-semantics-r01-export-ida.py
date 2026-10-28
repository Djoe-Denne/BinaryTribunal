import json, pathlib, hashlib, datetime
import idaapi, ida_ida, ida_funcs, ida_bytes, ida_lines, idautils, idc

root = pathlib.Path('C:/Users/djden/source/repos/retro-eng/re-ff8')
mission = root / 'docs/missions/ff8-decomp-semantics-2026-10-11-run01'
dest = root / '.tmp/ff8-decomp-semantics-20261011-r01/native'
dest.mkdir(parents=True, exist_ok=True)
manifest = json.loads((mission/'inventory.json').read_text(encoding='utf-8'))
scope = [int(x,16) for x in manifest['scope']]
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
native = {'idb':idc.get_idb_path(),'input':idaapi.get_input_file_path(),'bits':64 if ida_ida.inf_is_64bit() else 32,'input_sha256':idaapi.retrieve_input_file_sha256().hex(),'exported_utc':now}
assert native['bits'] == 32
graph, summaries = {}, []
for ea in scope:
    f = ida_funcs.get_func(ea)
    if not f or f.start_ea != ea:
        summaries.append({'ea':hex(ea),'error':'missing/exact entry mismatch'})
        continue
    chunks = list(idautils.Chunks(ea))
    lines, raw, outgoing = [], [], set()
    for lo, hi in chunks:
        b = ida_bytes.get_bytes(lo,hi-lo)
        raw.append({'start':hex(lo),'end':hex(hi),'hex':b.hex() if b is not None else None})
        for p in idautils.Heads(lo,hi):
            if not ida_bytes.is_code(ida_bytes.get_flags(p)): continue
            lines.append(f'{p:08X}: {ida_lines.tag_remove(idc.generate_disasm_line(p,0) or "")}')
            for target in idautils.CodeRefsFrom(p,False):
                tf = ida_funcs.get_func(target)
                if tf and tf.start_ea != ea: outgoing.add(tf.start_ea)
    xrefs=[]
    for x in idautils.XrefsTo(ea,0):
        cf = ida_funcs.get_func(x.frm)
        xrefs.append({'from':hex(x.frm),'type':x.type,'iscode':bool(x.iscode),'function':hex(cf.start_ea) if cf else None})
    cfg = [{'start':hex(b.start_ea),'end':hex(b.end_ea),'successors':[hex(s.start_ea) for s in b.succs()]} for b in idaapi.FlowChart(f)]
    assembly='\n'.join(lines)
    packet={'ea':f'0x{ea:06X}','name_label_only':idc.get_func_name(ea),'native':native,'chunks':raw,'assembly':assembly,'cfg':cfg,'xrefs_to':xrefs,'code_targets':[hex(t) for t in sorted(outgoing)],'instruction_count':len(lines)}
    data=json.dumps(packet,ensure_ascii=False,indent=2).encode('utf-8')
    p=dest/f'0x{ea:06X}.json'
    p.write_bytes(data)
    graph[ea]={'out':outgoing,'callers':set(int(x['function'],16) for x in xrefs if x['iscode'] and x['function'])}
    summaries.append({'ea':packet['ea'],'label':packet['name_label_only'],'instructions':len(lines),'asm_chars':len(assembly),'blocks':len(cfg),'path':str(p.relative_to(root)).replace('\\','/'),'sha256':hashlib.sha256(data).hexdigest()})

# Greedy bounded groups: direct neighbours first, then shared incoming/outgoing neighbours.
# Bounds limit context volume, not worker concurrency. All graph facts retained separately.
remaining=set(graph)
groups=[]
while remaining:
    seed=min(remaining)
    selected=[seed]; remaining.remove(seed)
    while len(selected)<6 and remaining:
        def score(candidate):
            return sum(100 * int(candidate in graph[a]['out'] or a in graph[candidate]['out']) + 3 * len(graph[a]['callers'] & graph[candidate]['callers']) + len(graph[a]['out'] & graph[candidate]['out']) for a in selected)
        candidate=max(remaining,key=lambda a:(score(a),-a))
        if score(candidate)==0: break
        selected.append(candidate);remaining.remove(candidate)
    groups.append({'id':f'g{len(groups)+1:02d}','eas':[f'0x{x:06X}' for x in selected]})
result={'native':native,'algorithm':'v1 direct=100 shared-code-callers=3 shared-code-targets=1; greedy max6; no zero-score joins','groups':groups,'functions':summaries,'graph':{f'0x{k:06X}':{'out':[f'0x{x:06X}' for x in sorted(v['out'])],'callers':[f'0x{x:06X}' for x in sorted(v['callers'])]} for k,v in graph.items()}}
(mission/'native-groups.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
event={'at_utc':now,'event':'NATIVE_FREEZE_AND_NEIGHBOURHOOD_GROUPS','functions':len(graph),'groups':len(groups),'native':native,'missing':[x for x in summaries if 'error' in x],'artifact':'native-groups.json'}
with (mission/'ledger.jsonl').open('a',encoding='utf-8') as fp: fp.write(json.dumps(event)+'\n')
print(json.dumps({'functions':len(graph),'groups':groups,'missing':event['missing'],'max_asm_chars':max(x.get('asm_chars',0) for x in summaries)}))
