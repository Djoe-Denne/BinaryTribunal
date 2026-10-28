import { readFileSync, writeFileSync, mkdirSync, chmodSync, existsSync, statSync, lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('preintegration-boundary-review-native-inputs-20261016.json'),q=load('preintegration-boundary-review-preparation-request-20261016.json');
const hr=readFileSync(a.destinationRoot+'/.preparation-receipt.json'),h=JSON.parse(hr.toString('utf8'));assert.equal(h.files.length,452);assert.equal(h.totalBytes,8865020);assert.equal(h.fingerprint,'78ffd6bd09efc9c247985ae39947b19a89f00188f9be73b6cac6ead0115eada3');assert.equal(h.taskId,a.task);assert.equal(h.targetSessionId,a.session);
for(const f of q.files){assert.equal(sha(readFileSync(a.destinationRoot+'/'+f.path)),f.sha256);chmodSync(a.destinationRoot+'/'+f.path,0o444);}
const dest=a.destinationRoot+'/'+a.ledger.path;assert(!existsSync(dest));assert(lstatSync(a.rawFixtureSource).isFile()&&!lstatSync(a.rawFixtureSource).isSymbolicLink());
const raw=readFileSync(a.rawFixtureSource);assert.equal(raw.length,8943882);assert.equal(sha(raw),a.ledger.sha256);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,raw,{flag:'wx'});chmodSync(dest,0o444);
assert.equal(sha(readFileSync(dest)),a.ledger.sha256);assert.equal(statSync(dest).mode&0o222,0);assert.equal(statSync(dest).nlink,1);assert.equal(sha(readFileSync(a.rawFixtureSource)),a.ledger.sha256);
const receipt={schemaVersion:'parent-local-large-fixture-v1',at:new Date().toISOString(),missionId:a.missionId,taskId:a.task,targetSessionId:a.session,model:a.model,destinationRoot:a.destinationRoot,
 fixture:{...a.ledger,readOnly:true,regularNonLinkNlink1:true},sourceProvenanceOnlyNotWorkerAccessPermission:a.rawFixtureSource,sourceBeforeAfterExact:true,
 helperReceiptFingerprint:h.fingerprint,helperReceiptFileSha256:sha(hr),helperFiles:452,helperBytes:8865020,separateLocalFixtureFiles:1,separateLocalFixtureBytes:8943882,combinedPayloadFiles:453,combinedPayloadBytes:17808902,
 helperDidNotCoverOrTransferLargeFixtureCapConfigurationUnchangedNoSplitParseReserializeLink:true,
 globalL9StillBlockedReviewFreshNonblindPublicPreambleExposureQualifiedNoRawDbCachePrivateReasoningTransferred:true,
 noNativeExtractionScientificAcceptanceOrWorkerActualAccessProvenByReceipt:true,stage:'ACCESS_ONLY_READ_CONTRACTS_MANIFEST_453_PHYSICAL_PINS_BOTH_RECEIPTS_THEN_HOLD_FOR_STATIC_GO'};
const rb=Buffer.from(JSON.stringify(receipt,null,2)+'\n');writeFileSync(a.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json',rb,{flag:'wx'});chmodSync(a.destinationRoot+'/LARGE_FIXTURE_PARENT_RECEIPT.json',0o444);chmodSync(a.destinationRoot+'/.preparation-receipt.json',0o444);
writeFileSync(a.proofDirectory+'/LARGE_FIXTURE_PARENT_RECEIPT.json',rb,{flag:'wx'});
const out={at:new Date().toISOString(),task:a.task,session:a.session,model:a.model,destinationRoot:a.destinationRoot,proofDirectory:a.proofDirectory,scopeBytes:a.scopeBytes,scopeSha256:a.scopeSha256,manifestSha256:a.manifestSha256,
 helper452_8865020BytesReadonlyExact:true,helperReceiptBytes:hr.length,helperReceiptSha256:sha(hr),helperReceiptFingerprint:h.fingerprint,parentReceiptBytes:rb.length,parentReceiptSha256:sha(rb),
 combined453_17808902BytesSeparateLedgerReadonlyExact:true,noRawDbOpaqueCachePrivateReasoningOrSourceEdits:true,noDependencyJunctionOrInstallNeededForStaticAccess:true,
 stage:receipt.stage};
writeFileSync(phase+'/preintegration-boundary-review-parent-materialization-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out));
