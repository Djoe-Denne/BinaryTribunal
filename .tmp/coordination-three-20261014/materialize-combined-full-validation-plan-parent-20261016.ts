import { readFileSync, writeFileSync, mkdirSync, chmodSync, existsSync, statSync, lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('combined-full-validation-plan-admission-20261016.json'),q=load('combined-full-validation-plan-preparation-request-20261016.json');
const hb=readFileSync(a.destinationRoot+'/.preparation-receipt.json'),h=JSON.parse(hb.toString('utf8'));assert.equal(h.files.length,435);assert.equal(h.totalBytes,8681300);assert.equal(h.fingerprint,'fa0d99cf14d25e964d27111b41b86bff317a2e29b79faf3c1f86773802d75b95');assert.equal(h.taskId,a.task);assert.equal(h.targetSessionId,a.session);assert.equal(h.cycle,1);
for(const f of q.files){assert.equal(sha(readFileSync(a.destinationRoot+'/'+f.path)),f.sha256);chmodSync(a.destinationRoot+'/'+f.path,0o444);}
const path=a.destinationRoot+'/'+a.ledger.path;assert(!existsSync(path));assert(lstatSync(a.rawFixtureSource).isFile()&&!lstatSync(a.rawFixtureSource).isSymbolicLink());
const raw=readFileSync(a.rawFixtureSource);assert.equal(raw.length,8943882);assert.equal(sha(raw),a.ledger.sha256);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,raw,{flag:'wx'});chmodSync(path,0o444);
assert.equal(sha(readFileSync(path)),a.ledger.sha256);assert.equal(statSync(path).mode&0o222,0);assert.equal(statSync(path).nlink,1);assert.equal(sha(readFileSync(a.rawFixtureSource)),a.ledger.sha256);
const receipt={schemaVersion:'parent-local-large-fixture-v1',at:new Date().toISOString(),missionId:a.missionId,taskId:a.task,targetSessionId:a.session,cycle:a.cycle,model:a.model,destinationRoot:a.destinationRoot,
 fixture:{...a.ledger,readOnly:true,regularNonLinkNlink1:true},sourceProvenanceOnlyNotWorkerPermission:a.rawFixtureSource,sourceBeforeAfterExact:true,
 helperReceiptFingerprint:h.fingerprint,helperReceiptFileSha256:sha(hb),helperFiles:435,helperBytes:8681300,separateLocalFixtureFiles:1,separateLocalFixtureBytes:8943882,combinedPayloadFiles:436,combinedPayloadBytes:17625182,
 helperDoesNotTransferOrCoverLargeFixtureCapConfigurationUnchangedNoSplitParseReserializeLink:true,
 sameOpenL8TaskAndCycleStaticPlanOnlyNoSourceFixFullTscBuildRuntimeOrNativePermissionByProjection:true,
 stage:'ACCESS_ONLY_ALL436_PINS_CONTRACTS_DECISIONS_MANIFEST_BOTH_RECEIPTS_ACK_THEN_HOLD_BEFORE_STATIC_GO'};
const rb=Buffer.from(JSON.stringify(receipt,null,2)+'\n');writeFileSync(a.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json',rb,{flag:'wx'});chmodSync(a.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json',0o444);chmodSync(a.destinationRoot+'/.preparation-receipt.json',0o444);assert(!existsSync(a.outputDirectory));
const out={at:new Date().toISOString(),task:a.task,session:a.session,model:a.model,cycle:a.cycle,destinationRoot:a.destinationRoot,outputDirectory:a.outputDirectory,scopeBytes:a.scopeBytes,scopeSha256:a.scopeSha256,manifestSha256:a.manifestSha256,
 helper435_8681300BytesReadonlyExact:true,helperReceiptBytes:hb.length,helperReceiptSha256:sha(hb),helperReceiptFingerprint:h.fingerprint,parentReceiptBytes:rb.length,parentReceiptSha256:sha(rb),combined436_17625182BytesExactSeparateLedgerReadonly:true,
 outputDirectoryAbsentNoDependencyJunctionImageRuntimeDbCacheOrProductExecution:true,stage:receipt.stage};
writeFileSync(phase+'/combined-full-validation-plan-parent-materialization-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out));
