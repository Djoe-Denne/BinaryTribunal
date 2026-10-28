/** Browser-only provenance inspection; native metadata stays behind the read-only viewer. */
export const MISSION_GRAPH_LINEAGE_JS = `
const lineageCache = new Map();
let lineageLoading = false;
function lineageOf(agent) {
  if (state.snapshot && state.snapshot.frozen) return { kind: 'unavailable', reason: 'snapshot-not-recorded' };
  return lineageCache.get(agent.sessionId)?.value;
}
function sessionAgent(id) {
  const m = mission();
  return m && [m.lead, ...m.agents].find(a => a.sessionId === id);
}
function paintForkBadge(button) {
  button.querySelector('.fork-badge')?.remove();
  button.setAttribute('aria-label', button.dataset.label);
  const agent = sessionAgent(button.dataset.session);
  const origin = agent && lineageOf(agent);
  if (!origin || origin.kind !== 'fork') return;
  const marker = badge('Fork', 'fork-badge');
  marker.title = 'Origine : ' + origin.sourceName;
  button.querySelector('.node-status').append(marker);
  button.setAttribute('aria-label', button.dataset.label + ', fork de ' + origin.sourceName);
}
function updateLineageUI() {
  document.querySelectorAll('.node[data-session]').forEach(paintForkBadge);
  renderDetails(false);
  drawForkEdge();
}
async function loadLineage() {
  if (lineageLoading || state.stopped || !mission() || state.snapshot.frozen) return;
  lineageLoading = true;
  const attempted = new Set();
  try {
    while (!state.stopped && mission() && !state.snapshot.frozen) {
      const m = mission();
      const ids = [...new Set([m.lead, ...m.agents].map(a => a.sessionId).filter(Boolean))]
        .filter(id => !attempted.has(id) && (!lineageCache.has(id) || lineageCache.get(id).expires <= Date.now())).slice(0, 8);
      if (!ids.length) break;
      ids.forEach(id => attempted.add(id));
      let entries;
      try {
        const params = new URLSearchParams(); ids.forEach(id => params.append('session', id));
        const response = await fetch('/api/lineage?' + params, { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error('Provenance unavailable');
        entries = (await response.json()).lineage || {};
      } catch {
        entries = {};
      }
      ids.forEach(id => {
        const value = entries[id] || { kind: 'unavailable', reason: 'native-unavailable' };
        lineageCache.set(id, { value, expires: Date.now() + (value.kind === 'unavailable' ? 60000 : 600000) });
      });
      updateLineageUI();
    }
  } finally {
    lineageLoading = false;
  }
}
function revealOrigin(id) {
  const agent = sessionAgent(id);
  if (!agent) return;
  if (agent.retired) { state.showStopped = true; $('show-stopped').checked = true; }
  state.expandedInactive.add(mission().id + ':' + agent.role);
  state.selected = agent === mission().lead ? 'lead' : 'agent:' + agent.name;
  state.pinned = true;
  render();
  const target = Array.from(document.querySelectorAll('.node[data-session]')).find(n => n.dataset.session === id);
  if (target) { target.scrollIntoView({ block: 'nearest', inline: 'nearest' }); target.focus({ preventScroll: true }); }
}
function appendLineage(parent, agent) {
  const origin = lineageOf(agent);
  const section = el('section', 'lineage-detail');
  section.append(el('h3', '', 'Origine de la session'));
  if (!origin) section.append(el('p', 'muted', agent.sessionId ? 'Lecture de la filiation…' : 'Session native non renseignée.'));
  else if (origin.kind === 'unforked') section.append(el('p', 'muted', 'Aucun fork natif déclaré.'));
  else if (origin.kind === 'unavailable') section.append(el('p', 'muted', origin.reason === 'snapshot-not-recorded'
    ? 'Filiation non enregistrée dans cet instantané.' : 'Filiation native indisponible pour le moment.'));
  else {
    section.append(badge('Fork natif', 'fork-badge'));
    const source = sessionAgent(origin.sourceSessionId);
    const description = el('p', '', 'Origine : ');
    if (source) {
      const link = el('button', 'origin-link', origin.sourceName);
      link.type = 'button'; link.title = 'Afficher la session d’origine';
      link.addEventListener('click', () => revealOrigin(origin.sourceSessionId));
      description.append(link);
    } else description.append(el('strong', '', origin.sourceName));
    section.append(description, el('code', 'task-id', origin.sourceSessionId));
    section.append(el('p', '', origin.boundary.type === 'before' ? 'Reprise : avant le message' : 'Reprise : jusqu’au message inclus'), el('code', 'task-id', origin.boundary.messageId));
    if (!source) section.append(el('p', 'muted footnote', 'La session d’origine est hors de la mission affichée.'));
    else section.append(el('p', 'muted footnote', 'Le lien pointillé indique la filiation. Une origine repliée reste repérée dans son groupe.'));
  }
  parent.append(section);
}
function drawForkEdge() {
  const svg = $('lineage-edges');
  const graph = $('graph');
  svg.replaceChildren();
  svg.setAttribute('width', $('edges').getAttribute('width') || String(graph.clientWidth));
  svg.setAttribute('height', String(graph.clientHeight));
  document.querySelectorAll('.fork-source').forEach(n => n.classList.remove('fork-source'));
  const m = mission();
  if (!m) return;
  const agent = state.selected === 'lead' ? m.lead : m.agents.find(a => 'agent:' + a.name === state.selected);
  const origin = agent && lineageOf(agent);
  if (!origin || origin.kind !== 'fork') return;
  const nodes = Array.from(document.querySelectorAll('.node[data-session]'));
  const child = nodes.find(n => n.dataset.session === agent.sessionId);
  if (!child || child.closest('details:not([open])')) return;
  const sourceNode = nodes.find(n => n.dataset.session === origin.sourceSessionId);
  const folded = sourceNode && sourceNode.closest('details:not([open])');
  const sourceAgent = sessionAgent(origin.sourceSessionId);
  const hiddenRole = sourceAgent && Array.from(document.querySelectorAll('.role-heading')).find(n => n.dataset.role === sourceAgent.role);
  const source = folded ? folded.querySelector('summary') : sourceNode || hiddenRole;
  if (!source || source === child) return;
  source.classList.add('fork-source');
  const rect = graph.getBoundingClientRect();
  const box = node => {
    const b = node.getBoundingClientRect();
    return { left: b.left - rect.left + graph.scrollLeft, right: b.right - rect.left + graph.scrollLeft, y: b.top + b.height / 2 - rect.top + graph.scrollTop };
  };
  const a = box(source), b = box(child);
  const separated = a.right <= b.left || b.right <= a.left;
  const rightward = a.right <= b.left;
  const sx = separated && !rightward ? a.left : a.right;
  const ex = separated && rightward ? b.left : b.right;
  const bend = separated ? (sx + ex) / 2 : Math.min(graph.scrollWidth - 6, Math.max(sx, ex) + 24);
  const make = (tag, attrs, text) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
    if (text) element.textContent = text;
    return element;
  };
  const marker = make('marker', { id: 'fork-arrow', viewBox: '0 0 6 6', refX: 6, refY: 3, markerWidth: 6, markerHeight: 6, orient: 'auto' });
  marker.append(make('path', { d: 'M0,0 L6,3 L0,6 Z', fill: '#e4bf76' }));
  const defs = make('defs', {}); defs.append(marker); svg.append(defs);
  const path = make('path', { class: 'fork-edge', d: 'M' + sx + ',' + a.y + ' C' + bend + ',' + a.y + ' ' + bend + ',' + b.y + ' ' + ex + ',' + b.y, 'marker-end': 'url(#fork-arrow)' });
  path.dataset.source = origin.sourceSessionId; path.dataset.child = agent.sessionId;
  path.dataset.folded = String(Boolean(folded || !sourceNode));
  svg.append(path, make('circle', { cx: sx, cy: a.y, r: 3, fill: '#e4bf76' }));
  svg.append(make('text', { x: Math.max(70, Math.min(graph.scrollWidth - 70, bend)), y: (a.y + b.y) / 2 - 9, class: 'fork-edge-label', 'text-anchor': 'middle' }, folded || !sourceNode ? 'Fork · origine repliée' : 'Fork'));
}
`;
