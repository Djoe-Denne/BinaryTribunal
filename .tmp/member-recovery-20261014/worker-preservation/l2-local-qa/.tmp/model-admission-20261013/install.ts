import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const home = 'C:/Users/djden/.config/opencode';
const source = 'C:/Users/djden/AppData/Local/Temp/opencode/ensemble-model-admission-20261013';
const phase = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/model-admission-20261013';
const previous = home + '/local-plugins/ensemble/20261012-52e26eee373c';
const teamId = 'team_mv6tmopg_0000_4urn3c';
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const gates = JSON.parse(readFileSync(join(phase, 'release-gates.json'), 'utf8'));
if (gates.length !== 4 || gates.some((x: {exit: number}) => x.exit !== 0)) throw new Error('Release gates are not all green');
if (sha(readFileSync(join(previous, 'index.js'))) !== '52e26eee373ccf2cd583186b8998c2505ec1f8597d9b843a13b950f6577cc734') throw new Error('Installed source changed; re-audit');
const configFile = home + '/opencode.json', selectionFile = home + '/ensemble.json';
const oldConfig = readFileSync(configFile), oldSelection = readFileSync(selectionFile);
const config = JSON.parse(oldConfig.toString('utf8')), selection = JSON.parse(oldSelection.toString('utf8'));
const plugins = config.plugins.filter((x: {package?: string}) => x.package === previous);
if (plugins.length !== 1 || !selection.modelRouting || !Array.isArray(selection.modelRouting.models)) throw new Error('Expected configuration boundary changed');
const artifact = readFileSync(source + '/dist/index.js'), artifactHash = sha(artifact);
const release = home + '/local-plugins/ensemble/20261013-model-admission-' + artifactHash.slice(0, 12);
const backup = join(phase, 'deployment');
if (existsSync(backup) || existsSync(release)) throw new Error('Do not overwrite an existing deployment receipt');
mkdirSync(backup); mkdirSync(release);
writeFileSync(join(backup, 'opencode.before.json'), oldConfig, { flag: 'wx' });
writeFileSync(join(backup, 'ensemble.before.json'), oldSelection, { flag: 'wx' });
for (const dir of ['docs', 'skills']) if (existsSync(join(previous, dir))) cpSync(join(previous, dir), join(release, dir), { recursive: true });
cpSync(source + '/docs/model-authorization.md', release + '/docs/model-authorization.md');
const skillFile = release + '/skills/opencode-ensemble/SKILL.md';
if (existsSync(skillFile)) {
  const text = readFileSync(skillFile, 'utf8');
  const boundary = '\n- Explicit model overrides must still obey the enabled operator provider/model/variant selection and mission policy. Unknown, disabled or zero-weight pairs fail closed. Maintenance pauses require a separate resume GO.\n';
  writeFileSync(skillFile, text.replace('## Profiles, Worktrees, and Models', '## Profiles, Worktrees, and Models\n' + boundary));
}
writeFileSync(release + '/index.js', artifact, { flag: 'wx' });
const pkg = JSON.parse(readFileSync(previous + '/package.json', 'utf8'));
pkg.version = '0.19.0-local.20261013.model-admission.' + artifactHash.slice(0, 12);
writeFileSync(release + '/package.json', JSON.stringify(pkg, null, 2) + '\n', { flag: 'wx' });
selection.modelRouting.pausedTeams = [...new Set([...(selection.modelRouting.pausedTeams ?? []), teamId])];
plugins[0].package = release;
const newSelection = Buffer.from(JSON.stringify(selection, null, 2) + '\n'), newConfig = Buffer.from(JSON.stringify(config, null, 2) + '\n');
// Preserve every preference and every other plugin value; fail if a concurrent writer intervened.
if (sha(readFileSync(configFile)) !== sha(oldConfig) || sha(readFileSync(selectionFile)) !== sha(oldSelection)) throw new Error('Concurrent configuration change; deployment not activated');
function replace(path: string, bytes: Buffer) {
  const staging = path + '.model-admission-20261013';
  writeFileSync(staging, bytes, { flag: 'wx' }); renameSync(staging, path);
}
replace(selectionFile, newSelection); // Pause is persisted before code activation.
replace(configFile, newConfig);
const receipt = { at: new Date().toISOString(), authorization: 'User Activer sans reprise; targeted mission pause and local plugin update/reload, no campaign/provider calls',
  previous, release, source, artifactSha256: artifactHash, pausedTeam: teamId, configBeforeSha256: sha(oldConfig), configAfterSha256: sha(readFileSync(configFile)),
  preferencesBeforeSha256: sha(oldSelection), preferencesAfterSha256: sha(readFileSync(selectionFile)),
  modelEntriesUnchanged: JSON.stringify(JSON.parse(oldSelection.toString()).modelRouting.models) === JSON.stringify(selection.modelRouting.models),
  nonPauseRoutingFieldsUnchanged: Object.keys(JSON.parse(oldSelection.toString()).modelRouting).filter(k => k !== 'pausedTeams').every(k => JSON.stringify(JSON.parse(oldSelection.toString()).modelRouting[k]) === JSON.stringify(selection.modelRouting[k])),
  gates: gates.map((x: {command: string; exit: number}) => ({command: x.command, exit: x.exit})), activatedReadbackPending: true };
if (!receipt.modelEntriesUnchanged || !receipt.nonPauseRoutingFieldsUnchanged || sha(readFileSync(release + '/index.js')) !== artifactHash) throw new Error('Deployment readback mismatch');
writeFileSync(join(backup, 'release.json'), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({release, artifactHash, pausedTeam: teamId, modelEntriesUnchanged: true, nativeReloadPending: true}));
