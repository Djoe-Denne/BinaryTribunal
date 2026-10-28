import { readFileSync, writeFileSync, existsSync, statSync, realpathSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import ts from '../../tools/ff8-harness/node_modules/typescript/lib/typescript.js';
const root='C:/Users/djden/source/repos/retro-eng/re-ff8',phase=root+'/.tmp/coordination-three-20261014';
const load=(n:string)=>JSON.parse(readFileSync(phase+'/'+n,'utf8')),sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const a=load('combined-full-validation-plan-admission-20261016.json'),q=load('combined-full-validation-plan-preparation-request-20261016.json'),discovery=load('combined-compile-tool-binary-discovery-20261016.json'),config=load('combined-compile-tool-config-presence-20261016.json'),flags=load('combined-compile-safe-build-flag-qualification-20261016.json');
assert(config.globalBunfig.every((p:any)=>!p.exists));assert.equal(Object.keys(process.env).filter(k=>k.toUpperCase()==='NODE_OPTIONS').length,0);assert.equal(Object.keys(process.env).filter(k=>k.toUpperCase()==='FF8_ENSEMBLE_SOURCE').length,0);assert.equal(flags.exit,0);
const pin=(path:string)=>{const bytes=readFileSync(path);return {path,realpath:realpathSync(path),bytes:bytes.length,sha256:sha(bytes),nlink:statSync(path).nlink};};
const executables=discovery.paths.map((p:any)=>({...pin(p.path),name:p.name,version:discovery.versions[p.name==='bun.exe'?'bun':'node']}));
const dependenciesRoot=root+'/tools/ff8-harness/node_modules',lock=readFileSync(a.destinationRoot+'/tools/ff8-harness/bun.lock','utf8');
const packages=['@opencode/client','typescript','@types/bun','bun-types','@types/node','undici-types'].map(name=>{const path=dependenciesRoot+'/'+name+'/package.json';assert(existsSync(path),name);const pkg=JSON.parse(readFileSync(path,'utf8'));assert(lock.includes(name+'@'+pkg.version),name+' installed/lock mismatch');return {name,version:pkg.version,metadata:pin(path),declaredTypes:pkg.types??pkg.typings??null};});
assert.equal(packages.find(p=>p.name==='@opencode/client')!.version,'2.0.26');assert.equal(packages.find(p=>p.name==='@types/bun')!.version,'1.4.0');
const required=['typescript/bin/tsc','typescript/lib/tsc.js','typescript/lib/_tsc.js','typescript/lib/typescript.js'].map(n=>pin(dependenciesRoot+'/'+n));
const optional=['@opencode/client/dist/promise/index.d.ts','@opencode/client/dist/promise/index.js','@opencode/client/dist/promise/service.d.ts','@opencode/client/dist/promise/service.js','bun-types/index.d.ts'].filter(n=>existsSync(dependenciesRoot+'/'+n)).map(n=>pin(dependenciesRoot+'/'+n));
const project=q.files.filter((f:any)=>f.path.startsWith('tools/ff8-harness/')&&f.path.endsWith('.ts'));assert.equal(project.length,92);const macros:any[]=[],external=new Set<string>();
for(const f of project){const text=readFileSync(a.destinationRoot+'/'+f.path,'utf8'),ast=ts.createSourceFile(f.path,text,ts.ScriptTarget.Latest,true);const visit=(n:ts.Node)=>{if(ts.isImportDeclaration(n)||ts.isExportDeclaration(n)){const spec=n.moduleSpecifier;if(spec&&ts.isStringLiteral(spec)&&!spec.text.startsWith('.')&&!spec.text.startsWith('node:')&&!spec.text.startsWith('bun:'))external.add(spec.text);for(const attr of n.attributes?.elements??[]){if(ts.isStringLiteral(attr.value)&&attr.value.text==='macro')macros.push({path:f.path,value:attr.value.text});}}ts.forEachChild(n,visit);};visit(ast);}
assert.equal(macros.length,0);assert(!q.files.some((f:any)=>/(^|\/)\.?bunfig\.toml$|(^|\/)\.env(?:\.|$)/.test(f.path)));
const srcConfig=JSON.parse(readFileSync(a.destinationRoot+'/tools/ff8-harness/tsconfig.json','utf8'));assert.equal(srcConfig.compilerOptions.noEmit,true);assert(!srcConfig.compilerOptions.plugins&&!srcConfig.compilerOptions.incremental&&!srcConfig.compilerOptions.composite);
const out={at:new Date().toISOString(),purpose:'PARTIAL_TYPECHECK_BUILD_ONLY_TOOLCHAIN_QUALIFICATION_NOT_FULL_TESTS',executables,dependenciesRoot,dependenciesRealpath:realpathSync(dependenciesRoot),packages,requiredEntryPins:required,optionalTypeSdkPins:optional,
 sourcePackageAndLockUnchanged:true,globalBunfigAbsentAtKnownHomePaths:config.globalBunfig,nodeOptionsStrictlyAbsent:true,projectBunfigAndDotenvNotPresentInPinnedImagePayload:true,
 buildSafetyFlagsParserHelpQualified:['--no-install','--no-macros','--no-env-file'],projectMacroImportAttributes:macros,externalStaticImportSpecifiers:[...external].sort(),
 typecheckRoute:'direct pinned node.exe + existing TypeScript/bin/tsc --noEmit, not bun run/package wrapper',typecheckNoConfiguredPluginsIncrementalCompositeOrEmission:true,
 sdkIsExternalAtBuildAndNoProviderRuntimeOrProjectModulesExecutedByQualification:true,
 noInstallAutoInstallGlobalConfigChangePythonTestWorkerOrRuntimeInvocation:true,
 limitations:['pins version metadata/entrypoints and executables, not every vendor or OS byte','JS process.env/known config paths only, not universal raw Win32 environment audit','full test child-tree containment remains B03 and is NOT resolved by this partial route'],
 stage:'TOOL_METADATA_QUALIFIED_FOR_PROSPECTIVE_PARTIAL_TSC_BUILD_GATE_NO_IMAGE_OR_COMPILATION_CREATED'};
writeFileSync(phase+'/combined-compile-toolchain-qualified-20261016.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({at:out.at,executables:executables.map((x:any)=>({name:x.name,version:x.version,sha256:x.sha256})),packages:packages.map(p=>({name:p.name,version:p.version})),externalStaticImports:out.externalStaticImportSpecifiers,macroCount:0,noProductOrCompilationInvoked:true,stage:out.stage}));
