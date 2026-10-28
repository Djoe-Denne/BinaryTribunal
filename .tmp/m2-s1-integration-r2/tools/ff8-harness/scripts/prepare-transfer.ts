import { readFile } from "node:fs/promises";
import { Service } from "@opencode/client/service";
import { OpenCode } from "@opencode/client";
import { prepareTransfer, type PreparationRequest } from "../src/mechanical-preparation";

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--request") throw new Error("Usage: bun scripts/prepare-transfer.ts --request <explicit-pinned-request.json>");
const req = JSON.parse(await readFile(args[1]!, "utf8")) as PreparationRequest;
const endpoint = await Service.discover(); if (!endpoint) throw new Error("Public native service unavailable; no filesystem ownership fallback");
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
const receipt = await prepareTransfer(req, async sessionId => {
  const session = await client.session.get({ sessionID: sessionId });
  const response=await client.rpc.call({rpcID:"ensemble",method:"preparationBinding",location:{directory:session.location.directory},input:{sessionID:sessionId,taskID:req.taskId}});
  const binding=response.output as {teamId?:string;teamName?:string;taskId?:string;sessionId?:string};
  if(binding.sessionId!==sessionId||binding.taskId!==req.taskId||(binding.teamId!==req.missionId&&binding.teamName!==req.missionId))throw new Error("Public task/mission ownership binding mismatch");
  return { sessionId: session.id, projectId: session.projectID, directory: session.location.directory,missionId:req.missionId,taskId:req.taskId };
});
console.log(JSON.stringify(receipt, null, 2));
