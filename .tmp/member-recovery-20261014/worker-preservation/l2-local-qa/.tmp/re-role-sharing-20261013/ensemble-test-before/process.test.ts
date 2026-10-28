import { describe, expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import type { CommandResult } from "../src/process"

interface ProbeResult {
  result: CommandResult
  launches: { windowsHide?: boolean; cwd?: string; stdio?: string[] }[]
}

function probe(invocation: string): ProbeResult {
  // Observe the options at the Node boundary in an isolated process. Force the
  // probe's actual children hidden so a regression test cannot steal focus.
  const script = `
    import childProcess from "node:child_process"
    import { syncBuiltinESMExports } from "node:module"
    const launches = []
    const original = childProcess.spawn
    childProcess.spawn = (command, args, options) => {
      launches.push(options)
      return original(command, args, { ...options, windowsHide: true })
    }
    syncBuiltinESMExports()
    const { runCommand } = await import(${JSON.stringify(new URL("../src/process.ts", import.meta.url).href)})
    const result = await ${invocation}
    console.log(JSON.stringify({ result, launches }))
  `
  return JSON.parse(execFileSync("node", ["--input-type=module", "-e", script], {
    encoding: "utf8",
    windowsHide: true,
    // Exercise the plugin's own defaults, independently of MCP preload shims.
    env: { ...process.env, NODE_OPTIONS: "" },
  })) as ProbeResult
}

describe("runCommand", () => {
  test("hides child consoles while preserving cwd, literal arguments and captured output", () => {
    const cwd = process.cwd()
    const argument = 'path with spaces & a "quoted" value'
    const code = 'process.stdout.write(JSON.stringify({ cwd: process.cwd(), argument: process.argv[1] }))'
    const { result, launches } = probe(
      `runCommand([process.execPath, "-e", ${JSON.stringify(code)}, ${JSON.stringify(argument)}], { cwd: ${JSON.stringify(cwd)} })`,
    )

    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBe("")
    expect(JSON.parse(result.stdout)).toEqual({ cwd, argument })
    expect(launches).toEqual([{
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }])
  })

  test("hides failed commands without losing exit codes or either output stream", () => {
    const code = 'process.stdout.write("partial output"); process.stderr.write("command failed"); process.exitCode = 7'
    const { result, launches } = probe(`runCommand([process.execPath, "-e", ${JSON.stringify(code)}])`)

    expect(result).toEqual({ exitCode: 7, stdout: "partial output", stderr: "command failed" })
    expect(launches[0]?.windowsHide).toBe(true)
  })

  test("returns launch errors from hidden subprocesses", () => {
    const { result, launches } = probe('runCommand(["ensemble-command-that-does-not-exist-491ac8"])')

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toContain("ENOENT")
    expect(launches[0]?.windowsHide).toBe(true)
  })

  test("rejects an empty command without starting a process", () => {
    const { result, launches } = probe("runCommand([])")

    expect(result).toEqual({ exitCode: 1, stdout: "", stderr: "No command provided" })
    expect(launches).toEqual([])
  })
})
