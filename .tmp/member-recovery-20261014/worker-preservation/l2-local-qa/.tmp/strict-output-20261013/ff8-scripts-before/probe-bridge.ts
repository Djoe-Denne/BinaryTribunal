import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { ExecutionClient, connectPublic } from "../src/client";
import { hash } from "../src/validation";

/** Prepare an isolated location, never installing/replacing the global plugin. */
export function prepareCanary(pluginWorktree: string, model: string, operatorToken?: string) {
  const plugin = realpathSync(pluginWorktree);
  const root = mkdtempSync(join(process.env.LOCALAPPDATA ?? "C:/Users/djden/AppData/Local", "Temp/opencode/ff8-bridge-canary-"));
  mkdirSync(join(root, ".opencode"), { recursive: true });
  const wrapper = join(plugin, ".tmp", "external-bridge-canary", randomBytes(8).toString("hex")); mkdirSync(wrapper, { recursive: true });
  const source = join(wrapper, "wrapper.ts"), entry = join(wrapper, "index.js");
  writeFileSync(join(wrapper, "package.json"), JSON.stringify({ name: "ensemble-isolated-canary", version: "0.0.0", type: "module", main: "./index.js", module: "./index.js", exports: { ".": "./index.js" } }));
  writeFileSync(source, `import { Plugin } from "@opencode/plugin";
import { setupEnsemble } from ${JSON.stringify(join(plugin, "src/v2-setup.ts").replaceAll("\\", "/"))};
import { join } from "node:path";
import { writeFileSync, appendFileSync } from "node:fs";
export default Plugin.define({id:"ensemble-isolated-canary",async setup(ctx){
 const directory=ctx.location.directory;
 writeFileSync(join(directory,"public-hook-capabilities.json"),JSON.stringify({permissionHook:typeof ctx.permission?.hook,toolHook:typeof ctx.tool?.hook,sessionHook:typeof ctx.session?.hook,directory}));
 const trace=(kind,data)=>appendFileSync(join(directory,"public-hook-trace.jsonl"),JSON.stringify({kind,...data})+"\\n");
 const owned=async id=>{try{return id&&(await ctx.session.get({sessionID:id})).location.directory===directory}catch{return false}};
 await ctx.permission?.hook?.("evaluate",async e=>{if(!e.sessionID){trace("permission-shape",{keys:Object.keys(e)});return}if(await owned(e.sessionID))trace("permission",{keys:Object.keys(e),sessionID:e.sessionID,agent:e.agent,action:e.action,resources:e.resources,effect:e.effect,source:e.source})});
 await ctx.tool?.hook?.("execute.after",async e=>{if(!e.sessionID){trace("tool-shape",{keys:Object.keys(e)});return}if(await owned(e.sessionID))trace("tool-after",{keys:Object.keys(e),sessionID:e.sessionID,agent:e.agent,messageID:e.messageID,id:e.id,tool:e.tool,status:e.status})});
 const handle=await setupEnsemble(ctx,{dbPath:join(directory,"canary-ensemble.db"),dashboardPort:0});return ()=>handle.dispose();}});
`);
  // Snapshot all generic implementation sources. A fresh bundle path avoids the
  // host reusing a previously imported development module from another probe.
  const build = spawnSync("bun", ["build", source, "--outfile", entry, "--target", "node", ...["@opencode/plugin", "@opencode/plugin/*", "@opencode-ai/plugin", "@opencode-ai/plugin/*", "@opencode-ai/sdk", "@opencode-ai/sdk/*", "effect", "effect/*", "bun:sqlite", "node:sqlite"].flatMap(name => ["--external", name])], { cwd: plugin, encoding: "utf8" });
  if (build.status !== 0) throw new Error(`isolated generic bridge bundle failed: ${build.stderr}`);
  const token = operatorToken ?? randomBytes(32).toString("hex"); if (!token.trim()) throw new Error("empty operator token refused");
  writeFileSync(join(root, ".opencode", "ensemble-execution.json"), JSON.stringify({ version: 1, principals: [{ id: "canary", tokenSha256: hash(token), directories: [root], profiles: ["explore"], models: [model], teamNamePrefix: "external-" }] }, null, 2));
  writeFileSync(join(root, ".opencode", "ensemble.json"), JSON.stringify({ dashboardPort: 0, timeoutMs: 300000, stallThresholdMs: 0, classification: { mode: "off" } }));
  writeFileSync(join(root, "opencode.json"), JSON.stringify({ "$schema": "https://opencode.ai/config.json", plugins: ["-ensemble", { package: wrapper }] }, null, 2));
  return { root, token, plugin, entry, bundleSha256: hash(readFileSync(entry)) };
}

if (import.meta.main) {
  const plugin = process.argv[2]; if (!plugin) throw new Error("usage: bun scripts/probe-bridge.ts <Ensemble worktree> [provider/model#variant]");
  const model = process.argv[3] ?? "zai-coding-plan/glm-5.3-flash#high"; // Explicitly labelled probe fixture, NOT a production selection.
  const fixture = prepareCanary(resolve(plugin), model);
  const client = new ExecutionClient({ transport: await connectPublic(fixture.root), statePath: join(fixture.root, "client.db"), directory: fixture.root, principalId: "canary", token: () => fixture.token, controllerId: "probe-controller", teamName: "external-probe", leaseMs: 300000, maxRunning: 1 });
  try {
    const capabilities = await client.capabilities(); await client.ensure("probe-v1"); const snapshot = await client.snapshot("probe-v1");
    const proof = { schemaVersion: 1, kind: "native-rpc-probe", root: fixture.root, time: new Date().toISOString(), capabilities, teamId: snapshot.teamId, leadSessionId: snapshot.leadSessionId, revision: snapshot.revision };
    writeFileSync(join(fixture.root, "probe-proof.json"), JSON.stringify(proof, null, 2)); console.log(JSON.stringify(proof, null, 2));
  } finally { client.close(); }
}
