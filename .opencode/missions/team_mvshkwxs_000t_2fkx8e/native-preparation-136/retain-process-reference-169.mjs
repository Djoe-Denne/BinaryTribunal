// Retain fixed historical reference; fresh observation stays separate parent proof.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {canonical} from 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/rms-native-address-bridge-160/tools/ff8-harness/src/validation.ts';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e',dir=root+'/operational-preparation-168';
const previous=JSON.parse(readFileSync(dir+'/stage-invocation-canonical-169.json','utf8')).result;
if(previous.status!=='HOLD_BEFORE_STAGE'||previous.stageAttempted||previous.outputCreated||previous.failure!=='HOLD: retained current155 binary observation')throw Error('Unexpected prior outcome');
const r=JSON.parse(readFileSync(dir+'/request-canonical-169.json','utf8')),template=JSON.parse(readFileSync(dir+'/request-template.json','utf8'));
const historical=JSON.parse(readFileSync(template.pins.processObservation.path,'utf8')),fresh=JSON.parse(readFileSync(root+'/evidence/native-process-refresh-168.json','utf8'));
if(historical.pid!==fresh.pid||historical.binarySha256!==fresh.binarySha256||historical.creationTimeUnixMs!==fresh.creationTimeUnixMs)throw Error('Historical/fresh service mismatch');
if(existsSync(r.scope.ownNamespace)||existsSync(r.scope.outputDirectory)||r.scope.expiresAt-Date.now()<r.scope.minRemainingMs)throw Error('No resource adoption or deadline extension');
r.pins.processObservation=template.pins.processObservation;
const path=dir+'/request-retained-identity-169.json';if(existsSync(path))throw Error('Request exists');
writeFileSync(path,canonical(r),{flag:'wx'});
console.log(JSON.stringify({path,expiresAtUnchanged:r.scope.expiresAt,remainingWallMs:r.scope.expiresAt-Date.now(),historicalIdentityRetained:true,freshObservationSeparate:true}));
