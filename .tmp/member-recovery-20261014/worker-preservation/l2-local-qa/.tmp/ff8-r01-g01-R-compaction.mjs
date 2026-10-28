import fs from 'node:fs';
import crypto from 'node:crypto';
const base='inputs/ff8-decomp-semantics-20261011-r01';
for(const volet of ['C','semantic']){
 const dst=base+'/reconciliation/g01/0x419D8F/'+volet;
 const manifest=JSON.parse(fs.readFileSync(dst+'/manifest.json','utf8'));
 for(const f of manifest.files){
  const bytes=fs.readFileSync(dst+'/'+f.file);
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==f.sha256)throw Error('Frozen hash mismatch '+f.file);
 }
 const src=base+'/g01/common-compaction.readable';
 const pm=JSON.parse(fs.readFileSync(src+'/manifest.json','utf8'));
 const joined=Buffer.from(pm.slices.map(x=>fs.readFileSync(src+'/'+x.file,'utf8')).join(''),'utf8');
 if(!joined.equals(fs.readFileSync(dst+'/common-compaction.md')))throw Error('Compaction mismatch');
 const target=dst+'/common-compaction.readable';fs.mkdirSync(target,{recursive:true});
 for(const f of ['manifest.json',...pm.slices.map(x=>x.file)]){
  const b=fs.readFileSync(src+'/'+f),p=target+'/'+f;
  if(fs.existsSync(p)&&!fs.readFileSync(p).equals(b))throw Error('Projection changed');
  if(!fs.existsSync(p))fs.writeFileSync(p,b);
 }
 console.log(JSON.stringify({volet,path:dst,manifest_hashes_verified:manifest.files.length,compaction_parts:pm.slices.length,byte_exact:true,authors:manifest.authors}));
}
