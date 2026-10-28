import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, lstatSync, chmodSync, symlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('l7-l8-combined-crossqa-admission-20261016.json'),q=load('l7-l8-combined-crossqa-preparation-request-20261016.json');
const rb=readFileSync(a.destinationRoot+'/.preparation-receipt.json'),r=JSON.parse(rb.toString('utf8'));
assert.equal(r.taskId,a.task);assert.equal(r.targetSessionId,a.session);assert.equal(r.files.length,423);assert.equal(r.totalBytes,8465094);assert.equal(r.fingerprint,'b37cc25f733761e7cbc6d6895678afc833aa10d6dd944c9df7d1d30af40a9c54');
for(const f of q.files){assert.equal(sha(readFileSync(a.destinationRoot+'/'+f.path)),f.sha256);chmodSync(a.destinationRoot+'/'+f.path,0o444);}
const dest=a.destinationRoot+'/'+a.ledger.path;assert(!existsSync(dest));assert(lstatSync(a.rawFixtureSource).isFile()&&!lstatSync(a.rawFixtureSource).isSymbolicLink());
const raw=readFileSync(a.rawFixtureSource);assert.equal(raw.length,a.ledger.bytes);assert.equal(sha(raw),a.ledger.sha256);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,raw,{flag:'wx'});chmodSync(dest,0o444);
assert.equal(sha(readFileSync(dest)),a.ledger.sha256);assert.equal(statSync(dest).mode&0o222,0);assert.equal(statSync(dest).nlink,1);assert.equal(sha(readFileSync(a.rawFixtureSource)),a.ledger.sha256);
const receipt={schemaVersion:'parent-local-large-fixture-v1',at:new Date().toISOString(),missionId:a.missionId,taskId:a.task,session:a.session,model:a.model,destinationRoot:a.destinationRoot,
 fixture:{...a.ledger,readOnlyAttribute:true,regularNonLinkNlink1:true},sourceProvenanceOnlyNotWorkerAccessPermission:a.rawFixtureSource,sourceBeforeAfterExact:true,
 helperReceiptFingerprint:r.fingerprint,helperReceiptFileBytes:rb.length,helperReceiptFileSha256:sha(rb),helperCoveredFiles:423,helperCoveredBytes:8465094,separateLocalFixtureFiles:1,separateLocalFixtureBytes:8943882,combinedPayloadFiles:424,combinedPayloadBytes:17408976,
 helperDidNotTransferOrCoverLargeFixturePerFileCapConfigurationUnchangedNoSplitParseReserializeLink:true,autonomousParentBoundedCrossQaProjectionNoMainChange:true,noNativeExtractionOrAcceptanceOrWorkerAccessProof:true,stage:'ACCESS_ONLY_AWAIT_REAL_ACK_AND_SEPARATE_STATIC_GO_NO_DYNAMIC'};
const b=Buffer.from(JSON.stringify(receipt,null,2)+'\n');writeFileSync(a.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json',b,{flag:'wx'});chmodSync(a.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json',0o444);chmodSync(a.destinationRoot+'/.preparation-receipt.json',0o444);
const junction=a.destinationRoot+'/tools/ff8-harness/node_modules';assert(!existsSync(junction));symlinkSync(root+'/tools/ff8-harness/node_modules',junction,'junction');assert(!existsSync(a.proofDirectory));
const out={...receipt,parentProjectionReceiptBytes:b.length,parentProjectionReceiptSha256:sha(b),all423HelperFilesReadonlyAndHashExact:true,depsJunctionOnlyNoInstall:true,proofDirectory:a.proofDirectory,proofDirectoryAbsent:true,
 sourceMainPackagePreservedSha256:a.mainPackageSha256,manifestSha256:a.manifestSha256,scopeSha256:a.scopeSha256};
writeFileSync(phase+'/l7-l8-combined-crossqa-parent-materialization-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({task:a.task,session:a.session,helper423Bytes:8465094,helperReceiptFingerprint:r.fingerprint,helperReceiptBytes:rb.length,helperReceiptSha256:sha(rb),parentLedgerReceiptBytes:b.length,parentLedgerReceiptSha256:sha(b),combined424Bytes:17408976,readonly:true,proofAbsent:true,noTestsImportsDbPortsOrMainTransfer:true}));
