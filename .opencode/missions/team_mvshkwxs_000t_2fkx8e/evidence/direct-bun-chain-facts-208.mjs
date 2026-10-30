// Closed stdlib-only probe of the native launcher -> Bun -> Bun path.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const env = { SystemRoot: 'C:/Windows', WINDIR: 'C:/Windows', ComSpec: 'C:/Windows/System32/cmd.exe', OS: 'Windows_NT', PATH: 'C:/Users/djden/.bun/bin;C:/Windows/System32', TEMP: 'C:/Users/djden/AppData/Local/Temp/opencode', TMP: 'C:/Users/djden/AppData/Local/Temp/opencode' };
const child = spawnSync('C:/Users/djden/.bun/bin/bun.exe', ['run', join(dirname(fileURLToPath(import.meta.url)), 'direct-bun-runtime-facts-207.mjs')], { env, windowsHide: true, encoding: 'utf8', timeout: 5000, maxBuffer: 16384 });
const facts = child.status === 0 ? JSON.parse(child.stdout) : null;
const matched = process.execArgv.length === 0 && facts?.execArgv?.length === 0 && child.status === 0 && !child.error && child.stderr === '';
console.log(JSON.stringify({ version: 'rms-native-bun-chain-208-v1', matched, parentPid: process.pid, parentExecArgv: process.execArgv, childPid: child.pid, childExit: child.status, childFacts: facts, hostStarted: false, applicationImported: false, databaseOpened: false }));
if (!matched) process.exitCode = 1;
