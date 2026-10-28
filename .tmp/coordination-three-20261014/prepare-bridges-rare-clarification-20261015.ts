import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',sourceRoot=phase+'/BRIDGES_RARE_ARBITRATION_V1';
if(existsSync(sourceRoot))throw Error('Arbitration projection immutable');mkdirSync(sourceRoot);
const entries=[['DECISION.md',root+'/docs/missions/re-graph-scheduler/L1_BRIDGES_RARE_INCOMPATIBILITY_20261015.md','rule'],['PARENT_REPRO.json',phase+'/bridges-rare-parent-arbitration.json','manifest'],['DERIVED_REFERENCE.json',phase+'/bridges-rare-derived-synthetic.json','test']];
const files=entries.map(([path,from,kind])=>{const bytes=readFileSync(from!);writeFileSync(sourceRoot+'/'+path,bytes,{flag:'wx'});return{path,sha256:createHash('sha256').update(bytes).digest('hex'),kind};});
const req={schemaVersion:1,missionId:'team_mv6tmopg_0000_4urn3c',taskId:'task_mv71y0s6_004q_ksbii0',cycle:1,role:'implementer',blind:false,sourceRoot,targetSessionId:'ses_ec12e19acffe3Ks6U1fc4l9zPK',destinationRoot:'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l7-interop-r1/inputs/BRIDGES_RARE_V1',files};
writeFileSync(phase+'/bridges-rare-clarification-preparation-request.json',JSON.stringify(req,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({destination:req.destinationRoot,files}));
