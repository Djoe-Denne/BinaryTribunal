import {readFile} from "node:fs/promises";
import {planReviewScope,type PreparationFile} from "../src/mechanical-preparation";
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=="--request")throw new Error("Usage: bun scripts/plan-review.ts --request <parent-review-scope-request.json>");
const bytes=await readFile(args[1]!);if(bytes.length>1024*1024)throw new Error("Review scope request exceeds metadata budget");
const req=JSON.parse(bytes.toString("utf8")) as {previous:PreparationFile[];current:PreparationFile[];decision?:{priorCoverageSha256:string;baselineFingerprint:string;allowedChangedPaths:string[]}};
if(Object.keys(req).some(k=>!["previous","current","decision"].includes(k)))throw new Error("Unknown review scope request field");
console.log(JSON.stringify(planReviewScope(req.previous,req.current,req.decision),null,2));
