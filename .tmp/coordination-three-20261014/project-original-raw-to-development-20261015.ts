import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
for(const name of ['l8-integration-r1','l7-interop-r1']){
 const a=JSON.parse(readFileSync(phase+'/'+name+'-admission-post.json','utf8')),input=a.owned+'/inputs/MAIN_e03e063_OFFLINE';
 const receipt=JSON.parse(readFileSync(input+'/.preparation-receipt.json','utf8'));let rawCopied=0,headExact=0;
 if(receipt.targetSessionId!==a.sessionID||receipt.role!=='implementer'||receipt.files.length!==398)throw Error('Owned receipt mismatch');
 for(const p of receipt.files){const bytes=readFileSync(input+'/'+p.path);if(bytes.length!==p.bytes||sha(bytes)!==p.sha256)throw Error('Prepared pin changed');
  if(p.path.startsWith('.tmp/ff8-decomp-semantics-20261011-r01/native/')){
   const to=a.owned+'/'+p.path;if(existsSync(to)){if(sha(readFileSync(to))!==p.sha256)throw Error('Existing raw differs; no overwrite');}else{mkdirSync(dirname(to),{recursive:true});writeFileSync(to,bytes,{flag:'wx'});rawCopied++;}
  }else if(p.path!=='BASELINE_NOTES.json'&&p.path!=='BASELINE_MANIFEST.json'){
   if(!existsSync(a.owned+'/'+p.path)||sha(readFileSync(a.owned+'/'+p.path))!==p.sha256)throw Error('Runtime HEAD differs; no implicit overwrite '+p.path);headExact++;
  }
 }
 const record={name,sessionID:a.sessionID,head:a.head,preparedPinsVerified:398,existingHeadAndRefsExact:headExact,originalRawRuntimeCopied:rawCopied,rawOriginalManifestSha256:'79790bef2ea8c38d64ab8e18c4578e1b8593958aa689da88c2466063c5b177d5',sourcesUntouched:true,inputsNotAuthority:true,noNativeAction:true};
 writeFileSync(phase+'/'+name+'-runtime-readback.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(record));
}
