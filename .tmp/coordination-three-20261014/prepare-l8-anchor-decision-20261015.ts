import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014',sourceRoot=phase+'/L8_CYCLE_ANCHOR_V1';
if(existsSync(sourceRoot))throw Error('Decision immutable');mkdirSync(sourceRoot);
const bytes=readFileSync(root+'/docs/missions/re-graph-scheduler/L8_FROZEN_CYCLE_ANCHOR_GO_20261015.md');writeFileSync(sourceRoot+'/DECISION.md',bytes,{flag:'wx'});
const files=[{path:'DECISION.md',sha256:createHash('sha256').update(bytes).digest('hex'),kind:'rule'}];
const req={schemaVersion:1,missionId:'team_mv6tmopg_0000_4urn3c',taskId:'task_mv6towrm_000c_24005n',cycle:1,role:'implementer',blind:false,sourceRoot,targetSessionId:'ses_ec12fcc43ffeI6xXQ5rSTty2mV',destinationRoot:'C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-re-ff8-re-graph-scheduler#4urn3c-l8-integration-r1/inputs/L8_CYCLE_ANCHOR_V1',files};
writeFileSync(phase+'/l8-anchor-preparation-request.json',JSON.stringify(req,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({destination:req.destinationRoot,files}));
