import { test } from "bun:test";
import { existsSync, writeFileSync } from "node:fs";
import { raiseUnicode, raiseParameter } from "./helper";
test("native emitter synthetic readonly CRLF Unicode imported helper", async () => {
  const observations = [];
  for (const [label, action] of [["unicode", raiseUnicode], ["parameter", raiseParameter]]) {
    try {
      action();
      throw new Error("unreachable");
    } catch (error) {
      if (!(error instanceof Error))
        throw error;
      const own = () => Reflect.ownKeys(error).map((key) => ({ key: String(key), descriptor: Object.getOwnPropertyDescriptor(error, key) }));
      const before = own(), stack = error.stack, after = own();
      observations.push({ label, before, stack, after });
    }
  }
  writeFileSync(process.env.PARENT_EMITTER_OBSERVATION, JSON.stringify({ observations }, null, 2) + `
`, { flag: "wx" });
  const start = Date.now();
  while (!existsSync(process.env.PARENT_EMITTER_RELEASE)) {
    if (Date.now() - start > 15000)
      throw new Error("parent did not release emitter probe");
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
});

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjozLAogICJzb3VyY2VzIjogWyIvcHJvYmUudGVzdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gUGFyZW50IHN5bnRoZXRpYyBlbWl0dGVyIGNhcGFiaWxpdHkgcHJvYmU7IG5vIHNjaWVuY2UvY2FuZGlkYXRlIGltcG9ydHMuXG5pbXBvcnQge3Rlc3R9IGZyb20gXCJidW46dGVzdFwiO1xuaW1wb3J0IHtleGlzdHNTeW5jLHdyaXRlRmlsZVN5bmN9IGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQge3JhaXNlVW5pY29kZSxyYWlzZVBhcmFtZXRlcn0gZnJvbSBcIi4vaGVscGVyXCI7XG50ZXN0KFwibmF0aXZlIGVtaXR0ZXIgc3ludGhldGljIHJlYWRvbmx5IENSTEYgVW5pY29kZSBpbXBvcnRlZCBoZWxwZXJcIixhc3luYygpPT57XG4gIGNvbnN0IG9ic2VydmF0aW9ucz1bXTtcbiAgZm9yKGNvbnN0IFtsYWJlbCxhY3Rpb25db2YgW1tcInVuaWNvZGVcIixyYWlzZVVuaWNvZGVdLFtcInBhcmFtZXRlclwiLHJhaXNlUGFyYW1ldGVyXV1hcyBjb25zdCl7XG4gICAgdHJ5e2FjdGlvbigpO3Rocm93IG5ldyBFcnJvcihcInVucmVhY2hhYmxlXCIpO31jYXRjaChlcnJvcil7XG4gICAgICBpZighKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpKXRocm93IGVycm9yO1xuICAgICAgY29uc3Qgb3duPSgpPT5SZWZsZWN0Lm93bktleXMoZXJyb3IpLm1hcChrZXk9Pih7a2V5OlN0cmluZyhrZXkpLGRlc2NyaXB0b3I6T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihlcnJvcixrZXkpfSkpO1xuICAgICAgY29uc3QgYmVmb3JlPW93bigpLHN0YWNrPWVycm9yLnN0YWNrLGFmdGVyPW93bigpO29ic2VydmF0aW9ucy5wdXNoKHtsYWJlbCxiZWZvcmUsc3RhY2ssYWZ0ZXJ9KTtcbiAgICB9XG4gIH1cbiAgd3JpdGVGaWxlU3luYyhwcm9jZXNzLmVudi5QQVJFTlRfRU1JVFRFUl9PQlNFUlZBVElPTiEsSlNPTi5zdHJpbmdpZnkoe29ic2VydmF0aW9uc30sbnVsbCwyKStcIlxcblwiLHtmbGFnOlwid3hcIn0pO1xuICBjb25zdCBzdGFydD1EYXRlLm5vdygpO3doaWxlKCFleGlzdHNTeW5jKHByb2Nlc3MuZW52LlBBUkVOVF9FTUlUVEVSX1JFTEVBU0UhKSl7XG4gICAgaWYoRGF0ZS5ub3coKS1zdGFydD4xNTAwMCl0aHJvdyBuZXcgRXJyb3IoXCJwYXJlbnQgZGlkIG5vdCByZWxlYXNlIGVtaXR0ZXIgcHJvYmVcIik7XG4gICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4ocmVzb2x2ZT0+c2V0VGltZW91dChyZXNvbHZlLDIwKSk7XG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIkFBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyxrRUFBaUUsWUFBUztBQUFBLEVBQzdFLE1BQU0sZUFBYSxDQUFDO0FBQUEsRUFDcEIsWUFBVyxPQUFNLFdBQVUsQ0FBQyxDQUFDLFdBQVUsWUFBWSxHQUFFLENBQUMsYUFBWSxjQUFjLENBQUMsR0FBVTtBQUFBLElBQ3pGLElBQUc7QUFBQSxNQUFDLE9BQU87QUFBQSxNQUFFLE1BQU0sSUFBSSxNQUFNLGFBQWE7QUFBQSxNQUFHLE9BQU0sT0FBTTtBQUFBLE1BQ3ZELElBQUcsRUFBRSxpQkFBaUI7QUFBQSxRQUFPLE1BQU07QUFBQSxNQUNuQyxNQUFNLE1BQUksTUFBSSxRQUFRLFFBQVEsS0FBSyxFQUFFLElBQUksVUFBTSxFQUFDLEtBQUksT0FBTyxHQUFHLEdBQUUsWUFBVyxPQUFPLHlCQUF5QixPQUFNLEdBQUcsRUFBQyxFQUFFO0FBQUEsTUFDdkgsTUFBTSxTQUFPLElBQUksR0FBRSxRQUFNLE1BQU0sT0FBTSxRQUFNLElBQUk7QUFBQSxNQUFFLGFBQWEsS0FBSyxFQUFDLE9BQU0sUUFBTyxPQUFNLE1BQUssQ0FBQztBQUFBO0FBQUEsRUFFakc7QUFBQSxFQUNBLGNBQWMsUUFBUSxJQUFJLDRCQUE0QixLQUFLLFVBQVUsRUFBQyxhQUFZLEdBQUUsTUFBSyxDQUFDLElBQUU7QUFBQSxHQUFLLEVBQUMsTUFBSyxLQUFJLENBQUM7QUFBQSxFQUM1RyxNQUFNLFFBQU0sS0FBSyxJQUFJO0FBQUEsRUFBRSxPQUFNLENBQUMsV0FBVyxRQUFRLElBQUksc0JBQXVCLEdBQUU7QUFBQSxJQUM1RSxJQUFHLEtBQUssSUFBSSxJQUFFLFFBQU07QUFBQSxNQUFNLE1BQU0sSUFBSSxNQUFNLHNDQUFzQztBQUFBLElBQ2hGLE1BQU0sSUFBSSxRQUFjLGFBQVMsV0FBVyxTQUFRLEVBQUUsQ0FBQztBQUFBLEVBQ3pEO0FBQUEsQ0FDRCIsICJuYW1lcyI6IFtdCn0=
//# sourceURL=C:\Users\djden\AppData\Local\Temp\opencode\NATIVE-EMITTER-INSPECTOR-1792430522218\probe.test.ts
