import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
const home = 'C:/Users/djden/.config/opencode';
const phase = 'C:/Users/djden/source/repos/retro-eng/re-ff8/.tmp/model-admission-20261013';
const source = 'C:/Users/djden/AppData/Local/Temp/opencode/ensemble-model-admission-20261013';
const team = 'team_mv6tmopg_0000_4urn3c';
const sha = (v: Buffer | string) => createHash('sha256').update(v).digest('hex');
const selectionFile = home + '/ensemble.json', configFile = home + '/opencode.json';
const replace = (path: string, value: unknown) => {
  const staged = path + '.resume-cache-20261013';
  writeFileSync(staged, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' }); renameSync(staged, path);
};
if (process.argv[2] === 'install') {
  const gates = JSON.parse(readFileSync(phase + '/resume-cache-gates.json', 'utf8'));
  if (gates.length !== 4 || gates.some((g: {exit: number}) => g.exit !== 0)) throw new Error('Gates not green');
  const oldConfig = readFileSync(configFile), oldSelection = readFileSync(selectionFile);
  const cfg = JSON.parse(oldConfig.toString()), prefs = JSON.parse(oldSelection.toString());
  const previous = home + '/local-plugins/ensemble/20261013-model-admission-926eca256605';
  const slots = cfg.plugins.filter((x: {package: string}) => x.package === previous);
  if (slots.length !== 1 || prefs.modelRouting.pausedTeams?.includes(team)) throw new Error('Deployment boundary changed or operator re-paused; stop');
  const bytes = readFileSync(source + '/dist/index.js'), hash = sha(bytes);
  const release = home + '/local-plugins/ensemble/20261013-model-admission-' + hash.slice(0, 12);
  const backup = phase + '/resume-cache-deployment';
  if (existsSync(backup) || existsSync(release)) throw new Error('Do not replace prior receipt');
  mkdirSync(backup); mkdirSync(release);
  writeFileSync(backup + '/opencode.before.json', oldConfig, { flag: 'wx' });
  writeFileSync(backup + '/ensemble.before.json', oldSelection, { flag: 'wx' });
  for (const folder of ['docs', 'skills']) cpSync(previous + '/' + folder, release + '/' + folder, { recursive: true });
  cpSync(source + '/docs/model-authorization.md', release + '/docs/model-authorization.md');
  writeFileSync(release + '/index.js', bytes, { flag: 'wx' });
  const pkg = JSON.parse(readFileSync(previous + '/package.json', 'utf8'));
  pkg.version = '0.19.0-local.20261013.resume-cache.' + hash.slice(0, 12);
  writeFileSync(release + '/package.json', JSON.stringify(pkg, null, 2) + '\n', { flag: 'wx' });
  if (sha(readFileSync(configFile)) !== sha(oldConfig) || sha(readFileSync(selectionFile)) !== sha(oldSelection)) throw new Error('Concurrent operator edit; not activated');
  prefs.modelRouting.pausedTeams = [...(prefs.modelRouting.pausedTeams ?? []), team];
  replace(selectionFile, prefs); // Temporary safety pause during reload, not a new campaign stop.
  slots[0].package = release; replace(configFile, cfg);
  const receipt = { at: new Date().toISOString(), previous, release, source, artifactSha256: hash, team, gates, temporaryPause: true,
    purpose: 'Correct stale resident admission configuration; restore already-authorized unpaused state after native readback, no worker launch' };
  writeFileSync(backup + '/release.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({release, artifactSha256: hash, temporaryPause: true}));
} else if (process.argv[2] === 'restore-resume') {
  const backup = phase + '/resume-cache-deployment';
  const verification = JSON.parse(readFileSync(backup + '/paused-native-readback.json', 'utf8'));
  const status = verification.status.output;
  if (!status.ready || !status.pausedTeams.includes(team) || !status.admissionPausedTeams.includes(team)) throw new Error('Native pause/guard readback not verified');
  const current = JSON.parse(readFileSync(selectionFile, 'utf8'));
  current.modelRouting.pausedTeams = (current.modelRouting.pausedTeams ?? []).filter((id: string) => id !== team);
  replace(selectionFile, current);
  console.log(JSON.stringify({team, requestPauseRemoved: true, workersLaunched: 0}));
} else throw new Error('Expected install or restore-resume');
