import fs from 'node:fs';
import crypto from 'node:crypto';
const base='inputs/ff8-decomp-semantics-20261011-r01/g01';
const source=base+'/common-compaction.md';
const raw=fs.readFileSync(source),text=raw.toString('utf8');
const dir=base+'/common-compaction.readable';
fs.mkdirSync(dir,{recursive:true});
const slices=[];
for(let start=0;start<text.length;start+=1000){
 const content=text.slice(start,start+1000),file=`part-${String(slices.length+1).padStart(3,'0')}.txt`;
 const dest=dir+'/'+file;
 if(fs.existsSync(dest)&&fs.readFileSync(dest,'utf8')!==content)throw Error('Existing projection differs');
 if(!fs.existsSync(dest))fs.writeFileSync(dest,content,'utf8');
 slices.push({file,start_utf16:start,length_utf16:content.length,sha256:crypto.createHash('sha256').update(content).digest('hex')});
}
const restored=Buffer.from(slices.map(x=>fs.readFileSync(dir+'/'+x.file,'utf8')).join(''),'utf8');
if(!raw.equals(restored))throw Error('Projection not byte-exact');
const manifest={source,source_sha256:crypto.createHash('sha256').update(raw).digest('hex'),bytes:raw.length,transformation:'Exact contiguous UTF-16 slices <=1000 chars; concatenate in order reproduces original bytes. Literal backslash-n NOT decoded. No enrichment.',slices};
const mf=dir+'/manifest.json',payload=JSON.stringify(manifest,null,2)+'\n';
if(fs.existsSync(mf)&&fs.readFileSync(mf,'utf8')!==payload)throw Error('Manifest changed');
if(!fs.existsSync(mf))fs.writeFileSync(mf,payload);
console.log(JSON.stringify({projection:dir,parts:slices.length,source_sha256:manifest.source_sha256,byte_exact:true}));
