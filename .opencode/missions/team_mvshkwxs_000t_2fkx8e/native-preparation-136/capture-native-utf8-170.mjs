// Read-only CLI GET capture as raw bytes: avoid PowerShell OEM text decoding.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8/.opencode/missions/team_mvshkwxs_000t_2fkx8e';
const cli='C:/Users/djden/AppData/Roaming/ai.opencode.desktop/cli/2.2.1-x64/opencode-cli.exe';
const id='ses_rms168_53a8e323ef544e7c8a6db75e5bda50c8';
for(const [name,route] of [['native-session-utf8-170.json','/api/session/'+id],['native-messages-utf8-170.json','/api/session/'+id+'/message?limit=8&order=desc']]){
  const path=root+'/operational-preparation-168/'+name;if(existsSync(path))throw Error('Capture exists; no overwrite');
  const b=execFileSync(cli,['api','get',route],{timeout:10000,maxBuffer:2000000});
  JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));writeFileSync(path,b,{flag:'wx'});
  if(!readFileSync(path).equals(b))throw Error('Raw CLI byte readback differs');
  console.log(JSON.stringify({name,byteLength:b.length,sha256:createHash('sha256').update(b).digest('hex'),rawCliStdoutBytes:true}));
}
