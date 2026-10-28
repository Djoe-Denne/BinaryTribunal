import { MISSION_GRAPH_LINEAGE_JS } from "./mission-graph-js-lineage"
import { MISSION_GRAPH_PROVIDERS_JS } from "./mission-graph-js-providers"
import { MISSION_GRAPH_MODELS_HTML, MISSION_GRAPH_MODELS_JS } from "./mission-graph-js-models"

const CLIENT = String.raw`
'use strict';
const $ = id => document.getElementById(id);
const state = { snapshot: null, team: new URLSearchParams(location.search).get('team'), selected: 'mission', pinned: false, showStopped: false, expandedInactive: new Set(), busy: false, timer: null, stopped: false };
const roleColors = new Map();
function roleColor(role) {
  const palette = ['#83b4ec', '#c7a1ed', '#72c7be', '#e6b778', '#e99bba', '#abc998'];
  if (!roleColors.has(role)) roleColors.set(role, palette[roleColors.size % palette.length]);
  return roleColors.get(role);
}
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
function mission() { return state.snapshot && state.snapshot.missions.find(item => item.id === state.team); }
function badge(text, kind) { return el('span', 'badge ' + (kind || ''), text); }
function short(text) { return (text || '').trim().split(/\r?\n/)[0].slice(0, 100); }
${MISSION_GRAPH_LINEAGE_JS}
${MISSION_GRAPH_PROVIDERS_JS}
${MISSION_GRAPH_MODELS_JS}
function choose(key, pin) {
  if (state.pinned && !pin) return;
  const changed = state.selected !== key;
  state.pinned = pin ? !(state.pinned && !changed) : false;
  state.selected = key;
  renderDetails(changed);
  document.querySelectorAll('[data-key]').forEach(node => node.classList.toggle('selected', node.dataset.key === key));
  if (state.pinned) {
    const selected = Array.from(document.querySelectorAll('[data-key]')).find(node => node.dataset.key === key);
    const folded = selected && selected.closest('details');
    if (folded) folded.open = true;
  }
  drawForkEdge();
}
function node(key, name, subtitle, kind) {
  const button = el('button', 'node ' + (kind || ''));
  button.type = 'button';
  button.dataset.key = key;
  button.classList.toggle('selected', state.selected === key);
  button.append(el('strong', 'node-name', name), el('span', 'node-subtitle', subtitle));
  button.addEventListener('mouseenter', () => choose(key, false));
  button.addEventListener('focus', () => choose(key, false));
  button.addEventListener('click', () => choose(key, true));
  return button;
}
function agentNode(agent, lead) {
  const button = node(lead ? 'lead' : 'agent:' + agent.name, lead ? 'Superviseur' : agent.name, agent.role, agent.state);
  const row = el('span', 'node-status');
  if (!lead) row.append(badge(agent.stateLabel, agent.state));
  if (agent.current.length) row.append(el('span', 'task-count', agent.current.length + ' en cours'));
  if (agent.queue.length) row.append(el('span', 'task-count', agent.queue.length + ' en attente'));
  button.append(row);
  const summary = agent.current.length ? agent.current[0].title : (agent.retired ? 'Session arrêtée' : (agent.prompt ? short(agent.prompt) : 'Aucune tâche réclamée'));
  button.append(el('span', 'node-task', summary));
  button.dataset.session = agent.sessionId || '';
  button.dataset.label = (lead ? 'Superviseur' : agent.name) + ', ' + agent.role + ', ' + agent.stateLabel + ', ' + agent.current.length + ' tâches en cours, ' + agent.queue.length + ' en attente';
  paintForkBadge(button);
  return button;
}
function taskList(parent, heading, tasks, empty) {
  parent.append(el('h3', '', heading + ' · ' + tasks.length));
  if (!tasks.length) { parent.append(el('p', 'muted', empty)); return; }
  tasks.forEach(task => {
    const item = el('article', 'task');
    const contextHeld = task.context && ['pending','error'].includes(task.context.state);
    const status = task.status === 'in_progress' ? 'En cours' : task.status === 'blocked' ? 'Bloquée' : task.status === 'pending' ? (contextHeld ? 'Contexte en attente' : task.ready ? 'Prête à admettre' : 'Dépendance en attente') : task.status;
    const meta = el('div', 'task-meta');
    meta.append(badge(status, task.waitingOn.length || task.status === 'blocked' ? 'retrying' : ''), el('span', '', 'Priorité ' + task.priority));
    item.append(meta, el('div', 'task-content', task.content || task.title));
    if (task.context && task.context.state !== 'legacy') {
      const context = task.context, decision = context.decision;
      const labels = {fresh:'Nouvelle session indépendante',fork:'Fork natif',checkpoint:'Fork au checkpoint',compact_fork:'Compaction puis fork',pending:'Décision en attente'};
      const label = decision ? labels[decision.mode] : 'Décision requise';
      item.append(el('p', 'task-context', 'Contexte planifié : ' + label + ' · révision ' + context.revision));
      if (decision && decision.worktree !== undefined) item.append(el('p', 'muted', decision.worktree ? 'Répertoire : worktree isolé' : 'Répertoire : mission partagé, périmètre du profil conservé'));
      if (decision && decision.from) item.append(el('code', 'task-id', 'Source : ' + decision.from + (decision.messageID ? ' · avant ' + decision.messageID : '')));
      if (decision) item.append(el('p', 'muted', decision.reason));
      if (context.error) item.append(el('p', 'retry-note', context.error));
    }
    if (task.assignee) item.append(el('p', 'muted', 'Attribuée à ' + task.assignee));
    if (task.status === 'blocked' && !task.waitingOn.length) item.append(el('p', 'muted', 'Motif du blocage non exposé par la source.'));
    if (task.waitingOn.length) {
      const list = el('ul', 'dependencies');
      task.waitingOn.forEach(dep => list.append(el('li', '', dep.title + (dep.missing ? ' · tâche absente du snapshot' : ''))));
      item.append(el('h4', '', 'Attend'), list);
    }
    item.append(el('code', 'task-id', task.id));
    parent.append(item);
  });
}
function renderDetails(reset) {
  const m = mission();
  const body = $('detail-body');
  const scroll = reset ? 0 : body.scrollTop;
  body.replaceChildren();
  $('pin').textContent = state.pinned ? 'Détacher' : 'Épingler';
  $('pin').setAttribute('aria-pressed', String(state.pinned));
  $('detail-mode').textContent = state.pinned ? 'DÉTAIL ÉPINGLÉ' : 'DÉTAIL AU SURVOL';
  if (!m) { $('detail-title').textContent = 'Mission'; body.append(el('p', 'muted', 'Les détails apparaîtront ici.')); return; }
  const a = state.selected === 'lead' ? m.lead : m.agents.find(agent => 'agent:' + agent.name === state.selected);
  if (a) {
    $('detail-title').textContent = a.name === 'lead' ? 'Superviseur' : a.name;
    body.append(el('p', 'role-title', a.role), badge(a.stateLabel, a.state));
    if (a.profile) body.append(el('p', 'muted', 'Profil OpenCode : ' + a.profile));
    if (a.model) body.append(el('p', 'muted model', 'Modèle : ' + a.model));
    if (a.retryMessage) body.append(el('p', 'retry-note', a.retryMessage));
    appendLineage(body, a);
    taskList(body, 'Tâches réclamées en cours', a.current, 'Aucune tâche du tableau actuellement réclamée.');
    taskList(body, 'Tâches attribuées en attente', a.queue, 'Aucune tâche en attente attribuée à cet agent.');
    if (a.queue.length) body.append(el('p', 'muted footnote', 'Tri par priorité. L’ordre réel d’exécution n’est pas exposé.'));
    if (a.prompt) {
      body.append(el('h3', '', 'Consigne de lancement'), el('p', 'muted', 'Contexte initial de cet agent, distinct de ses tâches réclamées.'), el('div', 'launch-brief', a.prompt));
    }
    if (a.sessionId) body.append(el('code', 'task-id', a.sessionId));
  } else if (state.selected === 'queue') {
    $('detail-title').textContent = 'File commune';
    body.append(el('p', 'muted', 'Les tâches de cette file ne sont attribuées à aucun agent.'));
    taskList(body, 'Sans attribution', m.shared, 'Toutes les tâches ouvertes sont attribuées.');
    taskList(body, 'Attributions sans agent visible', m.unrepresented, 'Aucune attribution orpheline.');
    body.append(el('p', 'muted footnote', 'Chaque contexte planifié impose une nouvelle session : fresh ou fork de la source indiquée. Une décision en attente ou en erreur bloque l’admission sans modifier les dépendances.'));
  } else if (state.selected.startsWith('role:')) {
    const role = state.selected.slice(5);
    $('detail-title').textContent = role;
    const agents = m.agents.filter(a => a.role === role);
    body.append(el('p', 'muted', agents.length + ' agents dans ce rôle ou profil.'));
    agents.forEach(a => { const b = el('button', 'agent-link', a.name + ' · ' + a.stateLabel); b.addEventListener('click', () => choose('agent:' + a.name, true)); body.append(b); });
    body.append(el('p', 'muted footnote', 'La source fournit une file commune à la mission. Aucune file spécialisée n’est déduite du nom des agents.'));
  } else {
    $('detail-title').textContent = m.name;
    body.append(el('p', 'role-title', m.project), badge(m.status === 'active' ? 'Mission active' : m.status));
    body.append(el('h3', '', 'Capacité des workers'));
    if (m.capacity) {
      const c = m.capacity;
      body.append(el('p', '', c.running + ' en exécution · ' + c.starting + ' en démarrage · plafond ' + (c.limit || 'illimité')),
        el('p', '', (c.available === null ? 'Places illimitées' : c.available + ' places libres') + ' · ' + c.waiting + ' réveils en attente'),
        el('p', 'muted', 'Plafond piloté par le superviseur. Les sessions inactives et le superviseur ne consomment pas de place. Une baisse laisse finir les exécutions engagées.'));
    } else body.append(el('p', 'muted', 'Capacité non exposée par cette source ou cet instantané.'));
    body.append(el('h3', '', 'État du tableau'), el('p', '', m.counts.completed + ' tâches terminées sur ' + m.counts.total), el('p', '', m.counts.running + ' tâches en cours'), el('p', '', m.counts.ready + ' en attente sans dépendance bloquante'), el('p', '', m.counts.blocked + ' tâches bloquées'));
    body.append(el('h3', '', 'Lire le graphe'), el('p', 'muted', 'Survolez un agent pour consulter son travail. Cliquez pour épingler les détails. Échap détache la fiche.'), el('p', 'muted', 'Les agents sont regroupés par rôle explicite, ou à défaut par profil OpenCode. Les liens indiquent l’appartenance à la mission.'));
    body.append(el('p', 'muted footnote', 'Les états d’agent et les états de tâche restent distincts. Une tâche terminée ne constitue pas, à elle seule, la clôture d’un objectif de la mission.'));
  }
  body.scrollTop = scroll;
}
function drawEdges() {
  const graph = $('graph'); const svg = $('edges'); const rect = graph.getBoundingClientRect();
  const content = $('graph-content'); const padding = getComputedStyle(graph);
  const width = Math.max(graph.clientWidth, content.offsetWidth + parseFloat(padding.paddingLeft) + parseFloat(padding.paddingRight));
  svg.replaceChildren(); svg.setAttribute('width', String(width)); svg.setAttribute('height', String(graph.clientHeight));
  const find = key => Array.from(graph.querySelectorAll('[data-key]')).find(n => n.dataset.key === key);
  function connect(from, to, color) {
    const a = find(from), b = find(to); if (!a || !b) return;
    const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
    const sx = x.left + x.width / 2 - rect.left + graph.scrollLeft, sy = x.bottom - rect.top + graph.scrollTop;
    const ex = y.left + y.width / 2 - rect.left + graph.scrollLeft, ey = y.top - rect.top + graph.scrollTop;
    const mid = sy + Math.max(12, (ey - sy) / 2);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M' + sx + ',' + sy + ' V' + mid + ' H' + ex + ' V' + ey);
    path.dataset.from = from; path.dataset.to = to;
    if (color) path.style.stroke = color;
    svg.append(path);
  }
  connect('mission', 'lead'); connect('mission', 'queue');
  graph.querySelectorAll('.role-heading').forEach(n => connect('lead', n.dataset.key, roleColor(n.dataset.role)));
  drawForkEdge();
}
function render() {
  renderProviderButton();
  renderModelButton();
  const m = mission(); const focusKey = document.activeElement && document.activeElement.dataset.key;
  const graph = $('graph'); const content = $('graph-content'); content.replaceChildren();
  $('summary').replaceChildren();
  if (!m) { content.append(el('div', 'empty', 'Aucune mission disponible dans ce snapshot.')); $('edges').replaceChildren(); drawForkEdge(); renderDetails(true); return; }
  const stopped = m.agents.filter(a => a.retired).length;
  $('stopped-count').textContent = 'Inclure les agents arrêtés (' + stopped + ')';
  $('summary').append(el('span', '', m.agents.filter(a => !a.retired).length + ' agents présents'), el('span', '', m.counts.running + ' tâches en cours'), el('span', '', m.counts.completed + ' / ' + m.counts.total + ' tâches terminées'));
  if (m.counts.blocked) $('summary').append(badge(m.counts.blocked + ' tâches bloquées', 'retrying'));
  if (m.capacity) {
    const c = m.capacity;
    const label = el('span', 'capacity-summary', 'Capacité ' + (c.running + c.starting) + ' / ' + (c.limit || '∞') + ' · ' + c.starting + ' démarrage(s) · ' + (c.available === null ? 'illimitée' : c.available + ' libre(s)'));
    label.setAttribute('aria-label', 'Capacité des workers : ' + label.textContent);
    $('summary').append(label);
  }
  const root = node('mission', m.name, m.project, 'mission-root');
  root.append(badge(m.status === 'active' ? 'Mission active' : m.status));
  const rootRow = el('div', 'root-row'); rootRow.append(root); content.append(rootRow);
  const middle = el('div', 'middle-row'); middle.append(agentNode(m.lead, true));
  const queue = node('queue', 'File commune', m.shared.length + ' tâches sans attribution', 'queue-node');
  if (m.unrepresented.length) queue.append(badge(m.unrepresented.length + ' attributions sans agent', 'retrying'));
  else queue.append(el('span', 'node-task', 'Consulter les tâches et leurs dépendances'));
  middle.append(queue); content.append(middle);
  const groups = new Map();
  m.agents.filter(a => !a.retired || state.showStopped || (state.pinned && state.selected === 'agent:' + a.name)).forEach(a => {
    if (!groups.has(a.role)) groups.set(a.role, []); groups.get(a.role).push(a);
  });
  content.style.minWidth = (Math.max(1, groups.size) * 300 + Math.max(0, groups.size - 1) * 28) + 'px';
  const lanes = el('div', 'role-lanes');
  lanes.setAttribute('aria-label', 'Branches parallèles du même superviseur');
  const entries = Array.from(groups, ([role, agents]) => {
    const inactive = agents.filter(a => a.state === 'idle' || a.retired);
    const visible = agents.filter(a => a.state !== 'idle' && !a.retired);
    const key = m.id + ':' + role;
    if (inactive.some(a => state.pinned && state.selected === 'agent:' + a.name)) state.expandedInactive.add(key);
    return { role, agents, inactive, visible, key, expanded: state.expandedInactive.has(key) };
  });
  const sizeLanes = () => {
    lanes.style.gridTemplateColumns = entries.map(entry => 'minmax(300px, ' + Math.min(6, Math.max(1, Math.ceil(Math.sqrt((entry.visible.length + (state.expandedInactive.has(entry.key) ? entry.inactive.length : 0)) / 3)))) + 'fr)').join(' ');
  };
  sizeLanes();
  if (!groups.size) content.append(el('div', 'empty', m.agents.length ? 'Les agents sont arrêtés. Incluez-les pour consulter leurs détails.' : 'Les agents apparaîtront ici dès leur lancement.'));
  entries.forEach(({ agents, role, inactive, visible, key, expanded }) => {
    const group = el('section', 'role-group');
    group.style.setProperty('--role-accent', roleColor(role));
    const heading = el('button', 'role-heading');
    const label = el('span', 'role-label');
    label.append(el('span', 'role-kind', agents.every(a => a.role === a.profile) ? 'Profil OpenCode' : 'Rôle'), el('strong', 'role-name', role));
    heading.append(label, el('span', 'role-count', agents.length + (agents.length === 1 ? ' agent' : ' agents')));
    heading.setAttribute('aria-label', 'Groupe ' + role + ', ' + agents.length + ' agents, rattaché au superviseur');
    heading.dataset.key = 'role:' + role;
    heading.dataset.role = role;
    heading.classList.toggle('selected', state.selected === heading.dataset.key);
    heading.addEventListener('mouseenter', () => choose(heading.dataset.key, false));
    heading.addEventListener('focus', () => choose(heading.dataset.key, false));
    heading.addEventListener('click', () => choose(heading.dataset.key, true));
    group.append(heading);
    const statuses = new Map();
    agents.forEach(a => statuses.set(a.stateLabel, (statuses.get(a.stateLabel) || 0) + 1));
    const summary = el('div', 'role-summary');
    statuses.forEach((count, label) => summary.append(el('span', '', label + ' : ' + count)));
    group.append(summary);
    if (visible.length) {
      const grid = el('div', 'agent-grid'); visible.forEach(a => grid.append(agentNode(a, false))); group.append(grid);
    }
    if (inactive.length) {
      const folded = el('details', 'inactive-agents'); folded.open = expanded;
      const toggle = el('summary', 'inactive-toggle');
      const idleCount = inactive.filter(a => !a.retired).length;
      const stoppedCount = inactive.length - idleCount;
      const label = [idleCount ? idleCount + ' disponible' + (idleCount > 1 ? 's' : '') : '', stoppedCount ? stoppedCount + ' arrêté' + (stoppedCount > 1 ? 's' : '') : ''].filter(Boolean).join(' · ');
      toggle.append(el('span', '', label), el('span', 'inactive-hint', 'Consulter'));
      folded.append(toggle);
      const grid = el('div', 'agent-grid'); inactive.forEach(a => grid.append(agentNode(a, false))); folded.append(grid);
      folded.addEventListener('toggle', () => {
        if (folded.open) state.expandedInactive.add(key);
        else {
          state.expandedInactive.delete(key);
          if (inactive.some(a => state.pinned && state.selected === 'agent:' + a.name)) {
            state.pinned = false; state.selected = 'role:' + role; renderDetails(true);
          }
        }
        sizeLanes(); drawEdges();
      });
      group.append(folded);
    }
    lanes.append(group);
  });
  if (groups.size) content.append(lanes);
  graph.classList.toggle('dense', m.agents.length > 16);
  renderDetails(false);
  if (focusKey) { const target = Array.from(graph.querySelectorAll('[data-key]')).find(n => n.dataset.key === focusKey); if (target) target.focus({ preventScroll: true }); }
  drawEdges();
  loadLineage();
}
function updatePicker() {
  const select = $('mission-select');
  const signature = state.snapshot.missions.map(m => m.id + m.name + m.status).join('|');
  if (select.dataset.signature !== signature) {
    select.replaceChildren();
    state.snapshot.missions.forEach(m => { const option = el('option', '', m.project + ' / ' + m.name + (m.status === 'active' ? '' : ' · ' + m.status)); option.value = m.id; select.append(option); });
    select.dataset.signature = signature;
  }
  select.value = state.team || '';
}
async function refresh() {
  if (state.busy || state.stopped) return;
  state.busy = true;
  try {
    const response = await fetch('/api/snapshot', { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(6000) });
    const snapshot = await response.json();
    if (!response.ok) throw new Error(snapshot.error || 'Source indisponible');
    state.snapshot = snapshot;
    if (!snapshot.missions.some(m => m.id === state.team)) { state.team = snapshot.missions[0] && snapshot.missions[0].id; state.selected = 'mission'; state.pinned = false; }
    updatePicker(); render();
    $('connection').dataset.state = snapshot.frozen ? 'frozen' : 'connected';
    $('connection').textContent = (snapshot.frozen ? 'Instantané enregistré · ' : 'Suivi en direct · actualisé à ') + new Date(snapshot.observedAt).toLocaleTimeString('fr-FR');
    $('error').hidden = true;
  } catch (error) {
    $('connection').dataset.state = 'disconnected';
    $('connection').textContent = state.snapshot ? 'Déconnecté · dernier état à ' + new Date(state.snapshot.observedAt).toLocaleTimeString('fr-FR') : 'Connexion indisponible';
    $('error').hidden = false;
    $('error').textContent = 'La source ne répond pas : ' + error.message + '. ' + (state.snapshot ? 'Le dernier état reste affiché.' : 'Vérifiez que le dashboard Ensemble est actif.');
  } finally {
    state.busy = false;
    if (!state.stopped && !(state.snapshot && state.snapshot.frozen)) state.timer = setTimeout(refresh, document.hidden ? 15000 : 5000);
  }
}
$('mission-select').addEventListener('change', event => {
  state.team = event.target.value; state.selected = 'mission'; state.pinned = false;
  history.replaceState(null, '', '?' + new URLSearchParams({ team: state.team })); render();
});
$('show-stopped').addEventListener('change', event => { state.showStopped = event.target.checked; render(); });
$('pin').addEventListener('click', () => { state.pinned = !state.pinned; renderDetails(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { state.pinned = false; renderDetails(false); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !state.busy && !(state.snapshot && state.snapshot.frozen)) { clearTimeout(state.timer); refresh(); } });
window.addEventListener('pagehide', () => { state.stopped = true; clearTimeout(state.timer); });
new ResizeObserver(drawEdges).observe($('graph'));
refresh();
`;

/** Self-contained graph UI; all snapshot text is inserted with textContent. */
export const MISSION_GRAPH_HTML = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ensemble · Mission</title>
<style>
.provider-add-row select{flex:1;min-width:0;background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:8px 10px;color:var(--text)}
:root{color-scheme:dark;--bg:#101318;--panel:#171c24;--border:#303945;--text:#e8edf4;--muted:#9aa8ba;--blue:#83b4ec;--green:#85cba0;--amber:#e4bf76;--red:#ed9393}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}button,select,input{font:inherit}button{color:inherit;cursor:pointer}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--blue);outline-offset:4px}header{padding:19px 26px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:16px}.brand{font-size:11px;letter-spacing:.16em;color:var(--muted)}h1{font-size:20px;margin:2px 0 0;font-weight:600}#connection{font-size:12px;color:var(--muted)}#connection[data-state=connected]{color:var(--green)}#connection[data-state=disconnected]{color:var(--amber)}.toolbar{display:flex;gap:20px;padding:16px 26px;align-items:center;flex-wrap:wrap}.mission-picker{display:flex;align-items:center;gap:12px;flex:1;min-width:240px}.mission-picker label{color:var(--muted);font-size:12px}select{color:var(--text);background:var(--panel);border:1px solid var(--border);border-radius:5px;padding:8px 12px;min-width:0;max-width:680px;width:100%}.check{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:12px}input{accent-color:var(--blue)}#summary{display:flex;gap:20px;align-items:center;flex-wrap:wrap;padding:0 26px 15px;color:var(--muted);font-size:12px}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 350px;border-top:1px solid var(--border)}#graph{position:relative;min-height:450px;padding:24px 22px 50px;isolation:isolate}#edges{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:visible}#edges path{fill:none;stroke:#465368;stroke-width:1.5}#graph-content{display:flex;flex-direction:column;gap:32px}.root-row{display:flex;justify-content:center}.node{border:1px solid var(--border);border-radius:6px;background:var(--panel);padding:12px 14px;display:flex;flex-direction:column;text-align:left;gap:4px;min-width:0;position:relative;width:100%;border-left:3px solid #69778b}.node:hover,.node.selected{border-color:var(--blue);background:#1b2634}.node.active{border-left-color:var(--blue)}.node.idle{border-left-color:var(--green)}.node.retrying,.node.stopping{border-left-color:var(--amber)}.node.error{border-left-color:var(--red)}.node.stopped{opacity:.66}.node-name{font-size:13px;overflow-wrap:anywhere;font-weight:600}.node-subtitle{font-size:11px;color:var(--muted);overflow-wrap:anywhere}.node-task{font-size:11px;color:var(--muted);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;width:100%;margin-top:3px}.node-status{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.task-count{font-size:10px;color:var(--muted)}.mission-root{max-width:540px;border-left-color:var(--blue)}.mission-root .node-name{font-size:15px}.mission-root .badge{align-self:flex-start;margin-top:5px}.middle-row{display:grid;grid-template-columns:repeat(2,minmax(0,300px));justify-content:center;gap:40px}.badge{font-size:10px;display:inline-flex;align-items:center;gap:5px;max-width:100%;color:var(--muted);background:#242d39;border-radius:3px;padding:2px 6px;overflow-wrap:anywhere}.badge.active{color:var(--blue)}.badge.idle{color:var(--green)}.badge.retrying,.badge.stopping{color:var(--amber)}.badge.error{color:var(--red)}.badge.active:before,.badge.idle:before,.badge.retrying:before,.badge.error:before{content:"";width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}.role-group{border:1px solid var(--border);border-radius:7px;padding:14px;background:var(--bg)}.role-heading{display:block;margin:-27px auto 16px;padding:3px 12px;background:var(--bg);color:var(--muted);border:1px solid var(--border);border-radius:4px;font-size:11px}.role-heading:hover,.role-heading.selected{color:var(--blue);border-color:var(--blue)}.agent-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}.dense .agent-grid{grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:9px}.dense .agent-grid .node{padding:9px 10px;gap:3px}.dense .agent-grid .node-subtitle{display:none}.dense .agent-grid .node-task{max-width:100%;font-size:10px}.inspector{border-left:1px solid var(--border);background:#131820;position:sticky;top:0;max-height:100vh;align-self:start;display:flex;flex-direction:column;min-height:450px}.inspector-head{padding:20px;border-bottom:1px solid var(--border)}.inspector-top{display:flex;justify-content:space-between;align-items:center;gap:10px}#detail-mode{font-size:9px;letter-spacing:.12em;color:var(--muted)}#pin{border:1px solid var(--border);background:transparent;padding:3px 8px;border-radius:4px;font-size:11px}#detail-title{font-size:16px;line-height:1.4;margin:14px 0 0;overflow-wrap:anywhere}#detail-body{padding:0 20px 26px;overflow:auto;font-size:12px;overflow-wrap:anywhere;flex:1}#detail-body h3{font-size:12px;margin:23px 0 9px}h4{font-size:11px;margin:12px 0 4px}.muted{color:var(--muted)}.role-title{font-size:13px}.task{border:1px solid var(--border);border-radius:5px;padding:12px;margin-bottom:10px;background:var(--panel)}.task-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:10px;color:var(--muted);margin-bottom:10px}.task-content,.launch-brief{white-space:pre-wrap;overflow-wrap:anywhere}.launch-brief{border-left:2px solid var(--border);padding-left:12px;max-height:280px;overflow:auto;color:#c1cede;font-size:11px}.task-id{display:block;font-size:9px;color:var(--muted);margin-top:10px;overflow-wrap:anywhere}.dependencies{padding-left:18px;color:var(--amber);font-size:11px}.footnote{font-size:10px;line-height:1.6}.retry-note{border-left:2px solid var(--amber);padding:8px;color:var(--amber)}.agent-link{display:block;background:var(--panel);border:1px solid var(--border);padding:8px 10px;border-radius:4px;margin-bottom:6px;text-align:left;width:100%;font-size:12px}.empty{padding:50px 20px;text-align:center;color:var(--muted)}#error{margin:0 26px 16px;padding:12px 14px;border:1px solid #69563b;border-radius:5px;background:#282219;color:var(--amber);font-size:12px}.hint{padding:0 26px 14px;font-size:11px;color:var(--muted);margin:0}
@media(min-width:1800px){.workspace{grid-template-columns:minmax(0,1fr) 400px}.dense .agent-grid{grid-template-columns:repeat(auto-fill,minmax(170px,1fr))}}
@media(max-width:950px){.workspace{grid-template-columns:minmax(0,1fr) 300px}#graph{padding:24px 14px}.middle-row{gap:18px}.dense .agent-grid,.agent-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}}
@media(max-width:700px){header{padding:16px;align-items:flex-start;flex-direction:column;gap:6px}.toolbar{padding:12px 16px;gap:10px}#summary{padding:0 16px 12px;gap:12px}.workspace{display:flex;flex-direction:column}.inspector{position:relative;width:100%;border-left:0;border-top:1px solid var(--border);max-height:none;min-height:200px}#detail-body{max-height:65vh}.middle-row{gap:12px}.node-name{font-size:12px}.hint{padding-left:16px}.role-group{padding:10px}.dense .agent-grid,.agent-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mission-picker{min-width:100%}}
#graph{overflow:auto}#graph-content{gap:40px}#edges path{stroke-width:1.75}.role-lanes{display:grid;align-items:start;gap:28px}.role-lanes .role-group{padding:0;min-width:0;border-top:3px solid var(--role-accent);background:#141a23;overflow:hidden}.role-lanes .role-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;width:100%;margin:0;padding:14px 16px;text-align:left;border:0;border-bottom:1px solid var(--border);border-radius:0;background:#1b2330;color:var(--text)}.role-lanes .role-heading:hover,.role-lanes .role-heading.selected{background:#232d3d;border-bottom-color:var(--role-accent)}.role-label{display:flex;flex-direction:column;gap:3px;min-width:0}.role-kind{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}.role-name{font-size:17px;line-height:1.3;letter-spacing:.06em;text-transform:uppercase;color:var(--role-accent);overflow-wrap:anywhere}.role-count{flex-shrink:0;font-size:12px;font-weight:600;border:1px solid var(--border);padding:3px 8px;border-radius:4px;background:var(--bg)}.role-summary{display:flex;flex-wrap:wrap;gap:6px 12px;padding:10px 12px 0;color:var(--muted);font-size:10px}.role-lanes .agent-grid{grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px;padding:12px}.role-lanes .role-heading:focus-visible{outline-offset:-4px}
.inactive-agents{margin-top:12px;border-top:1px dashed var(--border)}.inactive-toggle{display:flex;align-items:center;gap:8px;padding:11px 12px;cursor:pointer;font-size:11px;color:var(--muted);list-style:none}.inactive-toggle::-webkit-details-marker{display:none}.inactive-toggle:before{content:'▸';font-size:13px;color:var(--role-accent)}.inactive-agents[open]>.inactive-toggle:before{content:'▾'}.inactive-toggle:hover{color:var(--text);background:#1b2330}.inactive-toggle:focus-visible{outline:2px solid var(--blue);outline-offset:-3px}.inactive-hint{margin-left:auto;font-size:10px}.inactive-agents .node.idle{opacity:.82}.inactive-agents .agent-grid{padding-top:0}
.badge.fork-badge{color:var(--amber);border:1px dashed #7c6948;background:#29261f}.lineage-detail{border-bottom:1px solid var(--border);padding-bottom:14px;margin-bottom:18px}.lineage-detail p{margin:9px 0 4px}.lineage-detail .task-id{margin-top:4px}.origin-link{background:none;border:0;border-bottom:1px dashed var(--amber);padding:0;color:var(--amber);text-align:left;overflow-wrap:anywhere}.origin-link:hover{border-bottom-style:solid}.fork-source{outline:2px dashed var(--amber);outline-offset:-3px}#lineage-edges{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:visible}#lineage-edges .fork-edge{fill:none;stroke:var(--amber);stroke-width:2;stroke-dasharray:6 5}.fork-edge-label{fill:var(--amber);font:10px system-ui;paint-order:stroke;stroke:var(--bg);stroke-width:4px;stroke-linejoin:round}.fork-legend{display:inline-flex;gap:6px;align-items:center;margin-left:12px}.fork-legend:before{content:'→';border-top:1px dashed var(--amber);width:22px;line-height:0;color:var(--amber);text-align:right}
</style></head><body>
<style>
.provider-settings,.provider-dialog button{background:#202a38;border:1px solid var(--border);border-radius:5px;padding:8px 12px;font-size:12px}.provider-settings:hover,.provider-dialog button:hover{border-color:var(--blue)}.provider-dialog button:disabled{opacity:.4;cursor:default}.provider-dialog{width:min(620px,calc(100vw - 32px));max-height:88vh;overflow:auto;background:var(--panel);color:var(--text);border:1px solid #52647b;border-radius:8px;padding:24px;box-shadow:0 20px 80px #0008}.provider-dialog::backdrop{background:#0009}.provider-dialog h2{font-size:19px;margin:0 0 4px}.provider-dialog p{font-size:12px;color:var(--muted)}.provider-dialog-head{display:flex;justify-content:space-between;align-items:start;gap:16px}.provider-dialog-head span{font-size:10px;color:var(--muted);white-space:nowrap}.provider-order{list-style:none;padding:0;display:grid;gap:8px;margin:22px 0;max-height:38vh;overflow:auto}.provider-row{display:flex;align-items:center;gap:12px;background:var(--bg);padding:10px;border:1px solid var(--border);border-radius:5px}.provider-position{color:var(--blue);font-size:12px;font-weight:700;width:18px}.provider-name{flex:1;min-width:0;overflow-wrap:anywhere;font-size:12px}.provider-actions{display:flex;gap:5px}.provider-actions button{padding:3px 9px}.provider-empty{font-size:13px;color:var(--muted);padding:20px;border:1px dashed var(--border)}.provider-add-row{display:flex;gap:8px}.provider-add-row input{flex:1;min-width:0;background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:8px 10px;color:var(--text)}.provider-dialog label{font-size:12px;display:block;margin-bottom:7px}.provider-dialog-footer{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px}.provider-dialog #provider-save{border-color:#5883b3;background:#213c59}.provider-dialog #provider-notice{min-height:36px;color:var(--green)}.provider-dialog #provider-notice[data-error=true]{color:var(--red)}
</style>
<header><div><div class="brand">ENSEMBLE</div><h1>Mission · vue instantanée</h1></div><div id="connection" role="status">Connexion à la source…</div></header>
<div class="toolbar"><div class="mission-picker"><label for="mission-select">Mission</label><select id="mission-select" aria-label="Choisir une mission"><option>Chargement…</option></select></div><button id="provider-settings" class="provider-settings" disabled>Préférences providers</button><button id="model-settings" class="provider-settings" disabled>Modèles & raisonnement</button><label class="check"><input id="show-stopped" type="checkbox"><span id="stopped-count">Inclure les agents arrêtés</span></label></div>
<div id="summary"></div><div id="error" role="alert" hidden></div><p class="hint">Survoler pour consulter · Cliquer pour épingler · Échap pour détacher <span class="fork-legend">Filiation au survol d’un fork</span></p>
<main class="workspace"><section id="graph" aria-label="Graphe de la mission"><svg id="edges" aria-hidden="true"></svg><svg id="lineage-edges" aria-hidden="true"></svg><div id="graph-content"><div class="empty">Lecture du snapshot…</div></div></section><aside class="inspector" aria-label="Détails de la sélection"><div class="inspector-head"><div class="inspector-top"><span id="detail-mode">DÉTAIL AU SURVOL</span><button id="pin" aria-pressed="false">Épingler</button></div><h2 id="detail-title">Mission</h2></div><div id="detail-body"><p class="muted">Les détails apparaîtront ici.</p></div></aside></main>
${MISSION_GRAPH_MODELS_HTML}
<dialog id="provider-dialog" class="provider-dialog" aria-labelledby="provider-title"><form id="provider-form"><div class="provider-dialog-head"><div><h2 id="provider-title">Priorité des providers</h2><p id="provider-mission"></p></div><span id="provider-revision"></span></div><p>Mode classique : qualité → ordre des connexions → coût. Mode pondéré : cet ordre fournit les poids hérités, affinables dans « Modèles & raisonnement ».</p><ol id="provider-order" class="provider-order" aria-label="Providers par priorité décroissante"></ol><label for="provider-input">Ajouter une connexion OpenCode V2</label><div class="provider-add-row"><select id="provider-input" aria-label="Connexions avec des modèles activés"><option value="">Chargement…</option></select><button id="provider-add" type="button">Ajouter</button></div><p>La liste vient de la configuration effective d’OpenCode V2 pour ce projet. Seules les connexions ayant des modèles activés sont proposées. Un modèle explicitement imposé reste une dérogation.</p><p id="provider-notice" role="status" aria-live="polite"></p><button id="provider-reload" type="button" hidden>Actualiser depuis OpenCode</button><div class="provider-dialog-footer"><button id="provider-reset" type="button">Routage automatique</button><button id="provider-close" type="button">Fermer</button><button id="provider-save" type="submit">Enregistrer</button></div></form></dialog>
<script>${CLIENT}</script></body></html>`
