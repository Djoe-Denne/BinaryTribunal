import pathlib,json,hashlib,datetime
r=pathlib.Path.cwd();base=r/'inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g27'
sessions={'C':{'A':'ses_ed3fb725affeSP4CX39Mq2Ie1U','B':'ses_ed3fb6c81ffeV7SfJQSVTFzNyQ'},'semantic':{'A':'ses_ed3fb70f5ffeSQr1yrXUrHqSKU','B':'ses_ed3fb6ea7ffeJJy2Sc7uxpDVdE'}}
for v in ['C','semantic']:
 p=base/v;prefix='c' if v=='C' else 'semantic'
 files=[f'{prefix}_a.md',f'{prefix}_b.md','common-compaction.md','0x50BF90.json']
 artifacts=[{'file':f,'bytes':(p/f).stat().st_size,'sha256':hashlib.sha256((p/f).read_bytes()).hexdigest()} for f in files]
 native=json.loads((p/'0x50BF90.json').read_text(encoding='utf-8'))
 lines=native['assembly'].splitlines()
 for i in range(0,len(lines),25):
  f=f'asm-{i//25+1:02}.txt';(p/f).write_text('\n'.join(lines[i:i+25])+'\n',encoding='utf-8')
  artifacts.append({'file':f,'bytes':(p/f).stat().st_size,'sha256':hashlib.sha256((p/f).read_bytes()).hexdigest()})
 manifest={'ea':'0x50BF90','volet':v,'frozen_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':'discover-g27','checkpoint_exclusive':'msg_12be31170001b3JqulokpGSCsD','authors':sessions[v],'independence':'two disjoint native sessions from identical reader checkpoint; no peer/other-volet reads authorized','artifacts':artifacts,'asm_split':'verbatim native assembly splitlines, no truncation or filtering','parent_receipts':'docs/missions/ff8-decomp-semantics-2026-10-11-run01/production-admissions/'}
 out=p/'manifest.json';assert not out.exists();out.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'volet':v,'manifest':str(out.relative_to(r)),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'asm_lines':len(lines)}))
