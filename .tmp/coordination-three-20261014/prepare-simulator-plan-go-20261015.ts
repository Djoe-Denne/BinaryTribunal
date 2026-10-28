import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',sourceRoot=phase+'/L7SIM_PLAN_GO_V1';
if(existsSync(sourceRoot))throw Error('Immutable decision already exists');mkdirSync(sourceRoot);
const b=readFileSync(root+'/docs/missions/re-graph-scheduler/L7_SIMULATOR_CORRECTIVE_PLAN_GO_20261015.md');writeFileSync(sourceRoot+'/DECISION.md',b,{flag:'wx'});
const files=[{path:'DECISION.md',sha256:createHash('sha256').update(b).digest('hex'),kind:'rule'}];
const req={schemaVersion:1,missionId:'team_mv6tmopg_0000_4urn3c',taskId:'task_mv9doihe_0028_o59w3v',cycle:1,role:'implementer',blind:false,sourceRoot,targetSessionId:'ses_ec0f4f005ffeiESudi5ADo2QXH',destinationRoot:'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l7-simulator-fix-max/inputs/L7SIM_PLAN_GO_V1',files};
writeFileSync(phase+'/l7sim-plan-go-request.json',JSON.stringify(req,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({bytes:b.length,files,destination:req.destinationRoot}));
