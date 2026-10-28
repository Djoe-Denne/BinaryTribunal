// Same parent gate mechanics, distinct immutable receipt names and accepted QA delta.
const fs=require('fs'),crypto=require('crypto'),base='C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/mission-v2-20261018-continuous',sha=x=>crypto.createHash('sha256').update(x).digest('hex'),src=base+'/l8-factoring-typefix-gate.cjs',dst=base+'/l8-factoring-guardfix-gate.cjs';if(fs.existsSync(dst))throw Error('Gate already prepared');let text=fs.readFileSync(src,'utf8');const originalSha256=sha(text);
const edits=[
 ['after fresh type-only acceptance','after fresh guard-order QA acceptance',1],
 ["stem='l8-factoring-typefix-gate'","stem='l8-factoring-guardfix-gate'",1],
 ['l8-factoring-qa-typefix-parent-adjudication.json','l8-qa-guard-order-parent-adjudication.json',1],
 ['l8-factoring-qa-typefix-parent-proof.json','l8-qa-guard-order-parent-proof.json',2],
 ['l8-factoring-typecheck-receipt.json','l8-factoring-typefix-gate-receipt.json',1],
 ['ACCEPTABLE_TYPE_ONLY_DELTA','ACCEPTABLE_GUARD_ORDER_QA_FIX',1],
 ['!proof.emitted.beforeAfterByteIdentical','!proof.exactGuardOrderDelta',1],
 ['9115f2f60041018c47411db41630abf22e3342734290b81d1fcb578060895e5f','1f451b4eeb51d49d3530fb0a0c6d5f1701f9fbedf21d8b9ebc0d5a67e8e0a33c',1],
 ['L8-FACTORING-TYPEFIX-','L8-FACTORING-GUARDFIX-',1],
 ["gate:'l8-factoring-typefix-gate.cjs'","gate:'l8-factoring-guardfix-gate.cjs'",1]
];for(const [a,z,n]of edits){if(text.split(a).length!==n+1)throw Error('Unexpected template occurrence '+a);text=text.replaceAll(a,z);}fs.writeFileSync(dst,text,{flag:'wx'});fs.writeFileSync(base+'/l8-guardfix-gate-preparation.json',JSON.stringify({at:new Date().toISOString(),template:src,templateSha256:originalSha256,output:dst,outputSha256:sha(text),edits,mechanicsUnchanged:true,gateLaunched:false,requiresAcceptedFreshGuardDelta:true},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({script:dst,sha256:sha(text),controlledReplacements:edits.length,gateLaunched:false}));
