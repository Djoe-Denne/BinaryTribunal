import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Service } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/service.js';
import { OpenCode } from '../../tools/ff8-harness/node_modules/@opencode/client/dist/promise/index.js';

const root = 'C:/Users/djden/source/repos/retro-eng/re-ff8';
const phase = root + '/.tmp/member-recovery-20261014';
const home = 'C:/Users/djden/.config/opencode';
const source = 'C:/Users/djden/AppData/Local/Temp/opencode/ensemble-model-admission-20261013';
const teamID = 'team_mv6tmopg_0000_4urn3c';
const affected = ['l2-local-qa', 'l4-last-astra', 'l5-rel-review', 'l3-num-review'];
const sha = (v: string | Buffer) => createHash('sha256').update(v).digest('hex');
const save = (name: string, value: unknown) => writeFileSync(phase + '/' + name, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const replace = (path: string, value: unknown) => { const tmp = path + '.member-recovery-20261014'; writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' }); renameSync(tmp, path); };
const endpoint = await Service.discover();
if (!endpoint) throw new Error('Public native service unavailable');
const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
async function teamState() {
  const r = await fetch('http://127.0.0.1:4747/api/state', { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error('Mission state API unavailable');
  const t = (await r.json()).teams.find((t: {id: string}) => t.id === teamID);
  if (!t || t.name !== 're-graph-scheduler') throw new Error('Mission identity mismatch');
  return t;
}
async function guards() { return client.rpc.call({ rpcID: 'ensemble', method: 'modelAuthorizationStatus', location: { directory: root }, input: {} }); }

if (process.argv[2] === 'install') {
  const gates = JSON.parse(readFileSync(phase + '/release-gates-recheck.json', 'utf8'));
  if (gates.length !== 5 || gates.some((g: {exit: number}) => g.exit !== 0)) throw new Error('Release gates incomplete');
  const team = await teamState(), active = await client.session.active();
  const ids = [team.leadSessionId, ...team.members.map((m: {sessionId: string}) => m.sessionId)];
  if (ids.some(id => active[id])) throw new Error('Mission is no longer quiescent; coordinate before reload');
  for (const id of Object.keys(active)) {
    const forms = await client.session.form.list({ sessionID: id });
    const session = await client.session.get({ sessionID: id });
    const permissions = await client.permission.request.list({ location: { directory: session.location.directory } });
    if (forms.length || permissions.data.length) throw new Error('Pending native approval; do not reload');
  }
  save('mission-before.json', { at: new Date().toISOString(), team, nativeActiveIDs: Object.keys(active) });
  const preserve: unknown[] = [];
  mkdirSync(phase + '/worker-preservation');
  for (const name of affected) {
    const member = team.members.find((m: {name: string}) => m.name === name);
    if (!member) throw new Error('Expected owned member missing');
    const session = await client.session.get({ sessionID: member.sessionId });
    const directory = session.location.directory;
    const git = (args: string[]) => {
      const r = spawnSync('git', args, { cwd: directory, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 });
      if (r.status !== 0) throw new Error('Unable to preserve worker Git state');
      return r.stdout;
    };
    const status = git(['status', '--short']), diff = git(['diff', '--binary', 'HEAD']);
    writeFileSync(phase + '/worker-preservation/' + name + '.diff', diff, { flag: 'wx' });
    writeFileSync(phase + '/worker-preservation/' + name + '.status', status, { flag: 'wx' });
    const untracked = git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
    const output = phase + '/worker-preservation/' + name;
    const hashes: unknown[] = [];
    for (const file of untracked) {
      if (file.startsWith('../') || file.includes('/node_modules/')) throw new Error('Unexpected untracked path; preserve explicitly');
      mkdirSync(output + '/' + file.split('/').slice(0, -1).join('/'), { recursive: true });
      cpSync(directory + '/' + file, output + '/' + file);
      hashes.push({ file, sha256: sha(readFileSync(directory + '/' + file)) });
    }
    preserve.push({ name, sessionID: session.id, directory, model: session.model, nativeTime: session.time, head: git(['rev-parse', 'HEAD']).trim(), diffSha256: sha(diff), status, untracked: hashes });
  }
  save('worker-preservation/manifest.json', preserve);
  const configFile = home + '/opencode.json', prefsFile = home + '/ensemble.json';
  const cfgBytes = readFileSync(configFile), prefBytes = readFileSync(prefsFile);
  const cfg = JSON.parse(cfgBytes.toString()), prefs = JSON.parse(prefBytes.toString());
  const previous = home + '/local-plugins/ensemble/20261013-model-admission-d398ac24bf2e';
  const plugins = cfg.plugins.filter((p: {package: string}) => p.package === previous);
  if (plugins.length !== 1 || sha(readFileSync(previous + '/index.js')) !== 'd398ac24bf2ec68f4f899a01f092d548644367a68c4bb5b5af98cf21bf21d597' || prefs.modelRouting.pausedTeams.includes(teamID)) throw new Error('Installation/pause boundary changed');
  const artifact = readFileSync(source + '/dist/index.js'), hash = sha(artifact);
  const release = home + '/local-plugins/ensemble/20261014-member-recovery-' + hash.slice(0, 12);
  if (existsSync(release)) throw new Error('Never overwrite prior release');
  mkdirSync(release);
  for (const part of ['docs', 'skills']) cpSync(previous + '/' + part, release + '/' + part, { recursive: true });
  cpSync(source + '/docs/member-recovery.md', release + '/docs/member-recovery.md');
  writeFileSync(release + '/index.js', artifact, { flag: 'wx' });
  const pkg = JSON.parse(readFileSync(previous + '/package.json', 'utf8'));
  pkg.version = '0.19.0-local.20261014.member-recovery.' + hash.slice(0, 12);
  writeFileSync(release + '/package.json', JSON.stringify(pkg, null, 2) + '\n', { flag: 'wx' });
  if (sha(readFileSync(configFile)) !== sha(cfgBytes) || sha(readFileSync(prefsFile)) !== sha(prefBytes)) throw new Error('Concurrent configuration writer; not activated');
  writeFileSync(phase + '/deployment-config-before.json', cfgBytes, { flag: 'wx' });
  writeFileSync(phase + '/deployment-preferences-before.json', prefBytes, { flag: 'wx' });
  prefs.modelRouting.pausedTeams.push(teamID); replace(prefsFile, prefs);
  plugins[0].package = release; replace(configFile, cfg);
  save('release.json', { at: new Date().toISOString(), previous, release, artifactSha256: hash, source, teamID, gates, temporaryPause: true,
    authorization: 'User GO fix cause, recover interrupted workers and resume mission 2026-10-14; no model-policy change, no direct ensemble.db access' });
  console.log(JSON.stringify({ release, hash, savedWorkers: affected, temporaryPause: true }));
} else if (process.argv[2] === 'reload') {
  await client.location.reload({ signal: AbortSignal.timeout(120000) });
  const status = await guards(), team = await teamState();
  save('recovered-paused-readback.json', { at: new Date().toISOString(), status, team });
  const s = status.output as {ready?: boolean; pausedTeams?: string[]; admissionPausedTeams?: string[]};
  if (!s.ready || !s.pausedTeams?.includes(teamID) || !s.admissionPausedTeams?.includes(teamID)) throw new Error('Native protection/pause not verified');
  for (const name of affected) {
    const m = team.members.find((m: {name: string}) => m.name === name);
    if (m.status !== (name === 'l3-num-review' ? 'shutdown' : 'ready') || m.executionStatus !== 'idle') throw new Error('Recovery not confirmed for ' + name);
  }
  if (team.capacity.running || team.capacity.starting) throw new Error('Phantom slots still occupied');
  console.log(JSON.stringify({ guardsReady: true, repaired: affected, running: team.capacity.running, starting: team.capacity.starting, stillPaused: true }));
} else if (process.argv[2] === 'resume') {
  const verification = JSON.parse(readFileSync(phase + '/recovered-paused-readback.json', 'utf8'));
  if (verification.team.id !== teamID || !verification.status.output.ready) throw new Error('Recovery verification required');
  const prefsFile = home + '/ensemble.json', prefs = JSON.parse(readFileSync(prefsFile, 'utf8'));
  prefs.modelRouting.pausedTeams = prefs.modelRouting.pausedTeams.filter((id: string) => id !== teamID); replace(prefsFile, prefs);
  const status = await guards();
  const s = status.output as {ready?: boolean; configured?: boolean; pausedTeams: string[]; admissionPausedTeams: string[]};
  if (!s.ready || !s.configured || s.pausedTeams.includes(teamID) || s.admissionPausedTeams.includes(teamID)) throw new Error('Live pause removal failed');
  const before = JSON.parse(readFileSync(phase + '/deployment-preferences-before.json', 'utf8'));
  if (JSON.stringify(before) !== JSON.stringify(prefs)) throw new Error('Operator preferences changed unexpectedly');
  const team = await teamState(), lead = await client.session.get({ sessionID: team.leadSessionId });
  const text = `GO UTILISATEUR DE REPRISE — 2026-10-14, intervention depuis le chat de diagnostic autorisée par l'utilisateur.
Le service natif a changé de processus vers 11:28 UTC ; L2 Local QA, L4 Last Astra et L5 Relation Review étaient inactifs côté natif mais restaient busy/running dans Ensemble. L3 Num Review était terminé à 11:26 et bloqué en shutdown_requested.
Cause corrigée dans le plugin local : récupération non destructive des running/shutdown_requested à partir d'une observation native réussie, bornée et clôturée contre les courses ; ordre de persistance graceful-stop corrigé. 1248 tests PASS, typecheck/lint/build PASS. Aucun accès direct à ensemble.db. Worktrees, diff, fichiers non suivis et historiques préservés. La protection exacte provider/modèle/variante reste active ; pause de maintenance levée et les deux vues relues.
Readback : l2-local-qa, l4-last-astra, l5-rel-review maintenant ready/idle avec leurs tâches in_progress conservées ; l3-num-review shutdown/idle, à ne pas réveiller. L6 RVA Review a déjà rendu son rapport ; ne pas le relancer inutilement.
Reprends la mission en tant que son lead unique. Lis team_status et vérifie l'activité native. Reprends les TROIS sessions interrompues sur leur même rôle, gel, tâche et modèle/variante native existants, sans nouvelle session/auteur ni perte d'indépendance. Pour une livraison refusée uniquement car reported_to_lead reflète une ancienne réponse de progression, le GO autorise team_message force:true à ces trois membres, pas aux reviewers terminés. Aucun achat, modèle désactivé, nouveau fallback, reset Git, suppression de worktree ou promotion implicite.
Ne considère pas une absence d'activité ou un statut repaired comme résultat accepté : les gates/reviews parent restent obligatoires. Respecte la limite de 5 workers de la mission. Journalise la reprise et la cause. Reprends L7 et les lots aval seulement selon leurs dépendances ; confirme les sessions réellement actives plutôt que les seuls compteurs persistés. Les preuves de l'intervention sont .tmp/member-recovery-20261014/ et le contrôle est décrit dans les docs/member-recovery.md du plugin actif.
L'utilisateur demande explicitement la poursuite de la mission, pas seulement un diagnostic.`;
  save('resume-instruction.json', { at: new Date().toISOString(), teamID, leadSessionID: lead.id, nativeModel: lead.model, status, text });
  const acknowledgement = await client.session.prompt({ sessionID: lead.id, text, delivery: 'queue' }, { signal: AbortSignal.timeout(15000) });
  save('resume-acknowledgement.json', { at: new Date().toISOString(), acknowledgement });
  console.log(JSON.stringify({ pauseRemoved: true, preferencesPreserved: true, lead: lead.id, model: lead.model, instructionDelivered: true, acknowledgement }));
} else throw new Error('Expected install, reload or resume');
