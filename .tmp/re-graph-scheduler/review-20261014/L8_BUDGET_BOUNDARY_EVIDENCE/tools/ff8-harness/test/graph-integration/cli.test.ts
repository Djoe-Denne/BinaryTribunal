import { describe, expect, spyOn, test } from "bun:test";
import { dirname, join } from "node:path";
import { writeFileSync } from "node:fs";
import * as clientModule from "../../src/client";
import { graphOffline, main } from "../../src/cli";
import { fixturePath, preparation, preparedFixture } from "./fixture-driver";

describe("offline graph CLI is separate from native/legacy runtime setup", () => {
  test("prepare/group/plan/export/explain return real accepted-module exports without a connection", async () => {
    const dir = dirname(fixturePath()), input = join(dir, "preparation.json"), frozen = join(dir, "prepared.json");
    writeFileSync(input, JSON.stringify(preparation())); writeFileSync(frozen, JSON.stringify(preparedFixture()));
    const connection = spyOn(clientModule, "connectPublic").mockImplementation(async () => { throw new Error("forbidden connection"); });
    const output = spyOn(console, "log").mockImplementation(() => {});
    try {
      for (const command of ["prepare", "cluster", "groups", "plan"]) await main(["graph", command, "--input", input]);
      for (const command of ["export", "explain"]) await main(["graph", command, "--input", frozen]);
      expect(connection).toHaveBeenCalledTimes(0); expect(output).toHaveBeenCalledTimes(6);
    } finally { connection.mockRestore(); output.mockRestore(); }
  });
  test("real dispatch/shadow/adoption/historical simulation never fall through to legacy", async () => {
    const connection = spyOn(clientModule, "connectPublic").mockImplementation(async () => { throw new Error("forbidden connection"); });
    try {
      for (const command of ["dispatch", "shadow", "adopt", "simulate"]) await expect(main(["graph", command])).rejects.toThrow("unavailable");
      expect(connection).toHaveBeenCalledTimes(0);
      expect(() => graphOffline(["prepare", "--input", "missing", "--config", "legacy.json"])).toThrow("usage");
    } finally { connection.mockRestore(); }
  });
});
