import { readFileSync, writeFileSync, readdirSync, statSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
const phase='C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/coordination-three-20261014',sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8'));
const r=load('job-helper-compile-sequence-release-20261017.json'),go=load('job-helper-compile-final-go-20261017.json'),spec=JSON.parse(readFileSync(r.root+'/SPEC.json','utf8'));
assert.equal(r.code,1);assert.equal(r.signal,null);assert.equal(r.error,null);assert(!r.timedOut&&r.collectionNotStarted);assert.equal(r.postPinsDigest,r.pinsDigest);assert.equal(r.guard.digest,r.postGuard.digest);assert.equal(r.residualOwnedProcessObservations.length,0);assert.deepEqual(readdirSync(r.root+'/out'),[]);assert.deepEqual(readdirSync(r.root+'/temp'),[]);
const o=readFileSync(r.root+'/logs/CSC.stdout.log'),e=readFileSync(r.root+'/logs/CSC.stderr.log');assert.equal(o.length,r.stdout.bytes);assert.equal(sha(o),r.stdout.sha256);assert.equal(sha(e),r.stderr.sha256);assert(o.toString('ascii').includes('CS1504'));assert.equal(sha(readFileSync(spec.sourceImage)),go.sourceSha256);
const artifacts:any[]=[];function walk(p:string){for(const name of readdirSync(p)){const path=p+'/'+name,s=lstatSync(path);assert(!s.isSymbolicLink());if(s.isDirectory())walk(path);else{assert(s.isFile()&&s.nlink===1);const b=readFileSync(path);artifacts.push({path:path.slice(r.root.length+1),bytes:b.length,sha256:sha(b)});}}}walk(r.root);
const main=load('l5-budget-main-transfer-before.json');for(const f of [...main.preserved,...main.source])assert.equal(sha(readFileSync('C:/Users/djden/source/repos/retro-eng/re-ff8/'+f.path)),f.sha256);
const result={at:new Date().toISOString(),root:r.root,pid:r.pid,code:r.code,elapsedObservedMs:r.elapsedObservedMs,compilerDiagnostic:'CS1504 source file could not be opened, effective path in diagnostic omits inputs directory despite supplied absolute forward-slash argv file existing',
 rawStdout:r.stdout,rawStderr:r.stderr,rawDiagnosticEncoding:'OEM nonUTF8 retained without transcoding; ASCII CS1504 and path exact, nonASCII replacement in UTF8 preview not original-byte corruption',
 sourceImageSha256:go.sourceSha256,sourceActuallyExists:true,outAndTempEmpty:true,allPostPinsAndParentGuardExactResidualSampleNone:true,
 observedCompilerSourceLookupFailureNotCSharpCodeVerdictOrJobHostQualification:true,
 mechanismOfPathTransformationNotEstablishedDoNotAttributeToHelperCode:true,
 artifacts,totalFiles:artifacts.length,totalBytes:artifacts.reduce((s,f)=>s+f.bytes,0),releaseBeforeCollection:true,
 stage:'FIRST_COMPILATION_HOLD_RETAINED_CS1504_NO_DLL_NO_HELPER_OR_JOB_EXECUTION',
 noSourceFixCleanupOrSilentRetry:true,parentMayProspectivelyAuthorizeOneNewWin32BackslashArgvAttemptUnderFreshRootAndDistinctGo:true};
writeFileSync(phase+'/job-helper-compile-failure-final-verification-20261017.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});writeFileSync(r.root+'/FAILURE_ARTIFACTS.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({stage:result.stage,files:result.totalFiles,bytes:result.totalBytes,sourceExistsAndExact:true,outTempEmpty:true,main275Exact:true}));
