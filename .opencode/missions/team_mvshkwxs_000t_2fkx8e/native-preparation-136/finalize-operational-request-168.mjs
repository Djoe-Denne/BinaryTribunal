// Parent DATA finalization only; execute immediately before the separate stage.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const path=root+'/operational-preparation-168/request.json';
if(existsSync(path))throw Error('Final request already exists; preserve, no retry');
const r=JSON.parse(readFileSync(root+'/operational-preparation-168/request-template.json','utf8'));
if(existsSync(r.scope.ownNamespace)||existsSync(r.scope.outputDirectory))throw Error('Operational namespace already exists');
const observation=root+'/evidence/native-process-refresh-168.json',b=readFileSync(observation),v=JSON.parse(b);
if(Date.now()-Date.parse(v.observedAtUtc)>180000||v.pid!==31584||v.binarySha256!=='9ecb888ec3b28a393782269f531d1528ea21ff940f694752717e48a77b90527e')throw Error('Fresh identity required before stage');
r.pins.processObservation={path:observation,byteLength:b.length,sha256:createHash('sha256').update(b).digest('hex')};
r.scope.expiresAt=Date.now()+270000;
const bytes=Buffer.from(JSON.stringify(r,null,2)+'\n');writeFileSync(path,bytes,{flag:'wx'});
if(!readFileSync(path).equals(bytes))throw Error('Exact final request readback differs');
console.log(JSON.stringify({path,byteLength:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),expiresAt:r.scope.expiresAt,stageCalled:false}));
