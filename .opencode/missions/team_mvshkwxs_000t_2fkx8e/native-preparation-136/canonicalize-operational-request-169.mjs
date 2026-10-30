// Correct only wire encoding of refused local entry; preserve original expiry.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {canonical} from 'C:/Users/djden/.local/share/opencode/worktree/68ae5f/rms-native-address-bridge-160/tools/ff8-harness/src/validation.ts';
const dir='C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e/operational-preparation-168';
const failed=JSON.parse(readFileSync(dir+'/stage-invocation.json','utf8'));
if(failed.status!=='HOLD_LOCAL_ENTRY'||failed.failure!=='HOLD: runner request must be exact canonical JSON')throw Error('Unexpected prior outcome');
const r=JSON.parse(readFileSync(dir+'/request.json','utf8')),out=dir+'/request-canonical-169.json';
if(existsSync(out)||existsSync(r.scope.ownNamespace)||existsSync(r.scope.outputDirectory))throw Error('Existing state; no adoption');
if(r.scope.expiresAt-Date.now()<r.scope.minRemainingMs)throw Error('Original margin exhausted; no extension or stage');
const bytes=Buffer.from(canonical(r));
if(!isDeepStrictEqual(JSON.parse(bytes),r))throw Error('Canonicalization changed values');
writeFileSync(out,bytes,{flag:'wx'});
console.log(JSON.stringify({path:out,byteLength:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),expiresAtUnchanged:r.scope.expiresAt,remainingWallMs:r.scope.expiresAt-Date.now(),stageCalled:false}));
