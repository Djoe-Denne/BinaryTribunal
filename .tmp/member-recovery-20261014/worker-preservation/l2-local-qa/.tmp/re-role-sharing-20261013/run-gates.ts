import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const plugin = 'C:/Users/djden/AppData/Local/Temp/opencode/ensemble-mission-graph-20261011';
const name = process.argv[2];
const attempt = process.argv[3];
if (!['ff8', 'ensemble'].includes(name) || !/^[a-z0-9-]+$/.test(attempt ?? '')) throw new Error('Expected ff8|ensemble and a unique run label');
const out = join(root, '.tmp/re-role-sharing-20261013/gates', `${name}-${attempt}`);
mkdirSync(join(root, '.tmp/re-role-sharing-20261013/gates'), { recursive: true });
mkdirSync(out, { recursive: false });
const cwd = name === 'ff8' ? join(root, 'tools/ff8-harness') : plugin;
const commands = [ ['run', 'typecheck'], ['test'], ['run', 'build'], ...(name === 'ensemble' ? [['run', 'lint']] : []) ];
const results = [];
for (const [index, args] of commands.entries()) {
  const start = Date.now();
  const r = spawnSync('bun', args, { cwd, encoding: 'utf8', timeout: 240000, maxBuffer: 32 * 1024 * 1024 });
  const text = (r.stdout ?? '') + '\n' + (r.stderr ?? '');
  const logfile = join(out, `${index}-${args.join('-')}.log`);
  writeFileSync(logfile, text, { flag: 'wx' });
  const summary = text.replace(/\x1b\[[0-9;]*m/g, '').split(/\r?\n/).filter(s => /(^\s*\d+ (pass|fail)|Ran \d+ tests|error TS|^error:|^Checked |^Bundled |✖|\(fail\)|expect\(received\)|^Expected:|^Received:)/.test(s));
  const result = { command: ['bun', ...args].join(' '), cwd, exit: r.status, error: r.error?.message, ms: Date.now() - start, logfile, summary };
  results.push(result);
  console.log(JSON.stringify(result));
  if (r.status !== 0) { process.exitCode = 1; break; }
}
writeFileSync(join(out, 'results.json'), JSON.stringify({ at: new Date().toISOString(), name, results }, null, 2) + '\n', { flag: 'wx' });
