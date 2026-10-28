import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, isAbsolute } from "node:path";
import { canonical } from "../src/validation";
import { runPreReview } from "../src/pre-review";
import { loadL2PreReview } from "../src/l2-pre-review";
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=="--module-root"||!isAbsolute(args[1]!))throw new Error("Usage: bun scripts/pre-review.ts --module-root <explicit-local-L2-module-root>");
const moduleRoot=args[1]!,loaded=await loadL2PreReview(moduleRoot),report=runPreReview(loaded.adapter);
for(const pin of loaded.pins){const actual=createHash("sha256").update(await readFile(join(moduleRoot,pin.path))).digest("hex");if(actual!==pin.sha256)throw new Error("Frozen module/fixture changed during pre-review");}
console.log(JSON.stringify({...report,moduleFingerprint:loaded.moduleFingerprint,pins:loaded.pins,reportFingerprint:createHash("sha256").update(canonical(report)).digest("hex")},null,2));
if(report.verdict!=="PASS")process.exitCode=1;
