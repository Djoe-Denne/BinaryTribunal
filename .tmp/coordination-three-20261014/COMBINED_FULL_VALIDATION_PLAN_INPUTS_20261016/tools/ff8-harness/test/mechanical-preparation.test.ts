import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareTransfer, preparationFingerprint, planReviewScope, reviewBaselineFingerprint, type PreparationRequest } from "../src/mechanical-preparation";
const roots: string[] = [];
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
afterEach(async () => { for (const r of roots.splice(0)) await rm(r, {recursive:true,force:true}); });
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "ff8-mechanical-prep-")); roots.push(root);
  const source = join(root,"source"), worker = join(root,"worker"); await mkdir(source); await mkdir(worker);
  await writeFile(join(source,"input.txt"),"exact frozen bytes\r\n");
  const req: PreparationRequest = {schemaVersion:1,missionId:"mission",taskId:"task",cycle:1,role:"reviewer",blind:false,sourceRoot:source,targetSessionId:"ses_worker",destinationRoot:join(worker,"inputs","task-r1"),files:[{path:"input.txt",sha256:sha("exact frozen bytes\r\n"),kind:"native"}]};
  const binding = async () => ({sessionId:"ses_worker",projectId:"project",directory:worker,missionId:"mission",taskId:"task"});
  return {req,binding,root,source,worker};
}
test("mechanical transfer is byte-exact, bounded, receipted and not approved; repeat is idempotent", async () => {
  const f = await fixture(), r = await prepareTransfer(f.req,f.binding);
  expect(await readFile(join(f.req.destinationRoot,"input.txt"),"utf8")).toBe("exact frozen bytes\r\n");
  expect(r).toMatchObject({fingerprint:preparationFingerprint(f.req),requiresParentApproval:true});
  expect(await prepareTransfer(f.req,f.binding)).toEqual(r);
});
test("hash mismatch leaves no destination and never overwrites the source", async () => {
  const f=await fixture();f.req.files[0]!.sha256=sha("wrong");
  await expect(prepareTransfer(f.req,f.binding)).rejects.toThrow("hash mismatch");
  expect(await readdir(f.worker)).toEqual([]);expect(await readFile(join(f.source,"input.txt"),"utf8")).toBe("exact frozen bytes\r\n");
});
test("parent receipt cannot pretend that filesystem preparation verified worker tool access", async () => {
  const f=await fixture();const r=await prepareTransfer(f.req,f.binding);
  expect(r).toMatchObject({workerAccessVerified:false,nativeValidation:false,state:"prepared-not-approved"});
});
test.each(["../input.txt","C:/outside.txt","data:stream","NUL.txt","name.","sub//file",".preparation-receipt.json"])("unsafe logical path %s is rejected before writes",async path=>{
  const f=await fixture();f.req.files[0]!.path=path;await expect(prepareTransfer(f.req,f.binding)).rejects.toThrow();expect(await readdir(f.worker)).toEqual([]);
});
test("case-colliding files and foreign native session identities fail closed",async()=>{
  const f=await fixture();f.req.files.push({...f.req.files[0]!,path:"INPUT.txt"});await expect(prepareTransfer(f.req,f.binding)).rejects.toThrow("case-colliding");
  f.req.files.pop();await expect(prepareTransfer(f.req,async()=>({sessionId:"foreign",projectId:"project",directory:f.worker,missionId:"mission",taskId:"task"}))).rejects.toThrow("native session");
});
test("blind author projection excludes proposals and unapproved source/knowledge",async()=>{
  const f=await fixture();f.req.role="A";f.req.blind=true;
  for(const kind of ["proposal","score","manifest","knowledge","source","test"] as const){f.req.files[0]!.kind=kind;await expect(prepareTransfer(f.req,f.binding)).rejects.toThrow("Blind");}
});
test("a source-directory junction cannot escape a frozen projection",async()=>{
  const f=await fixture();await mkdir(join(f.root,"outside"));await writeFile(join(f.root,"outside","input.txt"),"exact frozen bytes\r\n");
  await symlink(join(f.root,"outside"),join(f.source,"link"),"junction");f.req.files[0]!.path="link/input.txt";
  await expect(prepareTransfer(f.req,f.binding)).rejects.toThrow("Symbolic link");
});
test("owner move/source mutation during transfer cannot publish the staging directory",async()=>{
  const f=await fixture();let calls=0;
  await expect(prepareTransfer(f.req,async()=>{if(++calls===2)await writeFile(join(f.source,"input.txt"),"changed");return f.binding();})).rejects.toThrow("commit boundary");
  expect(await readdir(join(f.worker,"inputs"))).toEqual([]);
});
test("changed existing prepared package is refused, never repaired by overwriting",async()=>{
  const f=await fixture();await prepareTransfer(f.req,f.binding);await writeFile(join(f.req.destinationRoot,"input.txt"),"user changed output");
  await expect(prepareTransfer(f.req,f.binding)).rejects.toThrow("altered");expect(await readFile(join(f.req.destinationRoot,"input.txt"),"utf8")).toBe("user changed output");
});
test("extra unapproved files cannot enter an idempotent blind projection",async()=>{
  const f=await fixture();f.req.role="A";f.req.blind=true;await prepareTransfer(f.req,f.binding);
  await writeFile(join(f.req.destinationRoot,"semantic_b.md"),"unapproved independent proposal");
  await expect(prepareTransfer(f.req,f.binding)).rejects.toThrow("Unexpected prepared");
  expect(await readFile(join(f.req.destinationRoot,"semantic_b.md"),"utf8")).toBe("unapproved independent proposal");
});
test("an existing unknown empty directory is not adopted or overwritten",async()=>{
  const f=await fixture();await mkdir(f.req.destinationRoot,{recursive:true});
  await expect(prepareTransfer(f.req,f.binding)).rejects.toThrow();
  expect(await readdir(f.req.destinationRoot)).toEqual([]);
});
test("idempotent preparation revalidates native task ownership after checking files",async()=>{
  const f=await fixture();await prepareTransfer(f.req,f.binding);let calls=0;
  await expect(prepareTransfer(f.req,async()=>({...await f.binding(),taskId:++calls===2?"foreign-task":"task"}))).rejects.toThrow("native session");
});
test("a receipt cannot silently claim approval, foreign ownership or extra input pins",async()=>{
  const f=await fixture();await prepareTransfer(f.req,f.binding);const p=join(f.req.destinationRoot,".preparation-receipt.json");
  const r=JSON.parse(await readFile(p,"utf8"));r.workerAccessVerified=true;r.targetSessionId="ses_foreign";
  await writeFile(p,JSON.stringify(r));await expect(prepareTransfer(f.req,f.binding)).rejects.toThrow("receipt");
});
test("review delta requires matching parent coverage, preserves regression/fresh-review gates",()=>{
  const previous=[{path:"src/capabilities.ts",sha256:sha("old"),kind:"source" as const}],current=[{...previous[0]!,sha256:sha("new")}];
  expect(planReviewScope(previous,current).mode).toBe("full");
  const decision={priorCoverageSha256:sha("parent endorsed coverage"),baselineFingerprint:reviewBaselineFingerprint(previous),allowedChangedPaths:["src/capabilities.ts"]};
  expect(planReviewScope(previous,current,decision)).toMatchObject({mode:"delta",changed:["src/capabilities.ts"],invariantGateRequired:true,freshReviewerRequired:true,requiresParentApproval:true});
  expect(planReviewScope(previous,[...current,{path:"schema.json",sha256:sha("change"),kind:"rule"}],decision).mode).toBe("full");
  expect(planReviewScope(previous,current,{...decision,baselineFingerprint:sha("wrong")} ).mode).toBe("full");
});
