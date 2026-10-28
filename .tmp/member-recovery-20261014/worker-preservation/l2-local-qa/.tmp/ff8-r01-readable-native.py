import pathlib,json,hashlib
r=pathlib.Path.cwd();root=r/'inputs/ff8-decomp-semantics-20261011-r01';made=[]
for g in root.glob('g[0-9][0-9]'):
 for src in g.glob('0x*.json'):
  n=json.loads(src.read_text(encoding='utf-8'));dst=g/(src.stem+'.readable')
  if dst.exists():continue
  dst.mkdir();files=[]
  def save(name,text):
   raw=text.encode('utf-8');(dst/name).write_bytes(raw);files.append({'file':name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
  lines=n['assembly'].splitlines()
  for i in range(0,len(lines),25):save(f'asm-{i//25+1:03}.txt','\n'.join(lines[i:i+25])+'\n')
  byte_lines=[]
  for c in n['chunks']:
   b=bytes.fromhex(c['hex']);ea=int(c['start'],16)
   byte_lines.extend(f'0x{ea+i:08X}: {b[i:i+32].hex()}' for i in range(0,len(b),32))
  for i in range(0,len(byte_lines),20):save(f'bytes-{i//20+1:03}.txt','\n'.join(byte_lines[i:i+20])+'\n')
  metadata={k:v for k,v in n.items() if k not in ('assembly','chunks')}
  save('metadata.json',json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
  manifest={'ea':n['ea'],'original_packet':str(src.relative_to(r)).replace('\\','/'),'original_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'compaction_sha256':hashlib.sha256((g/'common-compaction.md').read_bytes()).hexdigest(),'projection':'complete verbatim assembly splitlines and complete chunk bytes; no correction/filter/truncation','assembly_lines':len(lines),'files':files}
  (dst/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');made.append(n['ea'])
print(json.dumps({'readable_projections_created':len(made),'native_mutations':False}))
