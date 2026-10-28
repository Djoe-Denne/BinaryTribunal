import { test } from "bun:test";
import { existsSync, writeFileSync } from "node:fs";
import { raiseUnicode, raiseParameter, raiseMap, raiseForEach } from "./helper";
test("native emitter synthetic readonly CRLF Unicode imported helper", async () => {
  const observations = [];
  for (const [label, action] of [["unicode", raiseUnicode], ["parameter", raiseParameter], ["array-map", raiseMap], ["array-forEach", raiseForEach]]) {
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

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjozLAogICJzb3VyY2VzIjogWyIvcHJvYmUudGVzdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gUGFyZW50IHN5bnRoZXRpYyBlbWl0dGVyIGNhcGFiaWxpdHkgcHJvYmU7IG5vIHNjaWVuY2UvY2FuZGlkYXRlIGltcG9ydHMuXG5pbXBvcnQge3Rlc3R9IGZyb20gXCJidW46dGVzdFwiO1xuaW1wb3J0IHtleGlzdHNTeW5jLHdyaXRlRmlsZVN5bmN9IGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQge3JhaXNlVW5pY29kZSxyYWlzZVBhcmFtZXRlcixyYWlzZU1hcCxyYWlzZUZvckVhY2h9IGZyb20gXCIuL2hlbHBlclwiO1xudGVzdChcIm5hdGl2ZSBlbWl0dGVyIHN5bnRoZXRpYyByZWFkb25seSBDUkxGIFVuaWNvZGUgaW1wb3J0ZWQgaGVscGVyXCIsYXN5bmMoKT0+e1xuICBjb25zdCBvYnNlcnZhdGlvbnM9W107XG4gIGZvcihjb25zdCBbbGFiZWwsYWN0aW9uXW9mIFtbXCJ1bmljb2RlXCIscmFpc2VVbmljb2RlXSxbXCJwYXJhbWV0ZXJcIixyYWlzZVBhcmFtZXRlcl0sW1wiYXJyYXktbWFwXCIscmFpc2VNYXBdLFtcImFycmF5LWZvckVhY2hcIixyYWlzZUZvckVhY2hdXWFzIGNvbnN0KXtcbiAgICB0cnl7YWN0aW9uKCk7dGhyb3cgbmV3IEVycm9yKFwidW5yZWFjaGFibGVcIik7fWNhdGNoKGVycm9yKXtcbiAgICAgIGlmKCEoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikpdGhyb3cgZXJyb3I7XG4gICAgICBjb25zdCBvd249KCk9PlJlZmxlY3Qub3duS2V5cyhlcnJvcikubWFwKGtleT0+KHtrZXk6U3RyaW5nKGtleSksZGVzY3JpcHRvcjpPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGVycm9yLGtleSl9KSk7XG4gICAgICBjb25zdCBiZWZvcmU9b3duKCksc3RhY2s9ZXJyb3Iuc3RhY2ssYWZ0ZXI9b3duKCk7b2JzZXJ2YXRpb25zLnB1c2goe2xhYmVsLGJlZm9yZSxzdGFjayxhZnRlcn0pO1xuICAgIH1cbiAgfVxuICB3cml0ZUZpbGVTeW5jKHByb2Nlc3MuZW52LlBBUkVOVF9FTUlUVEVSX09CU0VSVkFUSU9OISxKU09OLnN0cmluZ2lmeSh7b2JzZXJ2YXRpb25zfSxudWxsLDIpK1wiXFxuXCIse2ZsYWc6XCJ3eFwifSk7XG4gIGNvbnN0IHN0YXJ0PURhdGUubm93KCk7d2hpbGUoIWV4aXN0c1N5bmMocHJvY2Vzcy5lbnYuUEFSRU5UX0VNSVRURVJfUkVMRUFTRSEpKXtcbiAgICBpZihEYXRlLm5vdygpLXN0YXJ0PjE1MDAwKXRocm93IG5ldyBFcnJvcihcInBhcmVudCBkaWQgbm90IHJlbGVhc2UgZW1pdHRlciBwcm9iZVwiKTtcbiAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlPT5zZXRUaW1lb3V0KHJlc29sdmUsMjApKTtcbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiQUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLLGtFQUFpRSxZQUFTO0FBQUEsRUFDN0UsTUFBTSxlQUFhLENBQUM7QUFBQSxFQUNwQixZQUFXLE9BQU0sV0FBVSxDQUFDLENBQUMsV0FBVSxZQUFZLEdBQUUsQ0FBQyxhQUFZLGNBQWMsR0FBRSxDQUFDLGFBQVksUUFBUSxHQUFFLENBQUMsaUJBQWdCLFlBQVksQ0FBQyxHQUFVO0FBQUEsSUFDL0ksSUFBRztBQUFBLE1BQUMsT0FBTztBQUFBLE1BQUUsTUFBTSxJQUFJLE1BQU0sYUFBYTtBQUFBLE1BQUcsT0FBTSxPQUFNO0FBQUEsTUFDdkQsSUFBRyxFQUFFLGlCQUFpQjtBQUFBLFFBQU8sTUFBTTtBQUFBLE1BQ25DLE1BQU0sTUFBSSxNQUFJLFFBQVEsUUFBUSxLQUFLLEVBQUUsSUFBSSxVQUFNLEVBQUMsS0FBSSxPQUFPLEdBQUcsR0FBRSxZQUFXLE9BQU8seUJBQXlCLE9BQU0sR0FBRyxFQUFDLEVBQUU7QUFBQSxNQUN2SCxNQUFNLFNBQU8sSUFBSSxHQUFFLFFBQU0sTUFBTSxPQUFNLFFBQU0sSUFBSTtBQUFBLE1BQUUsYUFBYSxLQUFLLEVBQUMsT0FBTSxRQUFPLE9BQU0sTUFBSyxDQUFDO0FBQUE7QUFBQSxFQUVqRztBQUFBLEVBQ0EsY0FBYyxRQUFRLElBQUksNEJBQTRCLEtBQUssVUFBVSxFQUFDLGFBQVksR0FBRSxNQUFLLENBQUMsSUFBRTtBQUFBLEdBQUssRUFBQyxNQUFLLEtBQUksQ0FBQztBQUFBLEVBQzVHLE1BQU0sUUFBTSxLQUFLLElBQUk7QUFBQSxFQUFFLE9BQU0sQ0FBQyxXQUFXLFFBQVEsSUFBSSxzQkFBdUIsR0FBRTtBQUFBLElBQzVFLElBQUcsS0FBSyxJQUFJLElBQUUsUUFBTTtBQUFBLE1BQU0sTUFBTSxJQUFJLE1BQU0sc0NBQXNDO0FBQUEsSUFDaEYsTUFBTSxJQUFJLFFBQWMsYUFBUyxXQUFXLFNBQVEsRUFBRSxDQUFDO0FBQUEsRUFDekQ7QUFBQSxDQUNEIiwgIm5hbWVzIjogW10KfQ==
//# sourceURL=C:\Users\djden\AppData\Local\Temp\opencode\NATIVE-EMITTER-INSPECTOR-R2-1792435548942\probe.test.ts
