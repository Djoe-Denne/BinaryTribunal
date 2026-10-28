/** Accessible model/effort policy editor; benchmark values remain read-only. */
export const MISSION_GRAPH_MODELS_HTML = `
<style>
#model-dialog{width:min(840px,calc(100vw - 32px))}.model-controls{display:flex;gap:16px;flex-wrap:wrap;margin:18px 0}.model-controls input{width:80px}.model-controls input,.model-row input[type=number]{background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--text);padding:7px}.model-list{display:grid;gap:10px;max-height:44vh;overflow:auto}.model-row{display:flex;gap:14px;align-items:center;flex-wrap:wrap;background:var(--bg);padding:12px;border:1px solid var(--border);border-radius:5px}.model-description{flex:1;min-width:190px;font-size:12px}.model-description small{display:block;color:var(--muted);margin-top:6px}.model-row label{margin:0;display:flex;gap:6px;align-items:center}.model-row input[type=number]{width:64px}#model-notice{min-height:30px;color:var(--green)}#model-notice[data-error=true]{color:var(--red)}
</style>
<style>
.model-group{padding:12px;border:1px solid var(--border);border-radius:6px}.model-group>legend{font-size:13px;padding:0 6px}.model-group .model-row{margin:8px 0;border:0;padding:8px}.model-row[data-unscored=true]{color:var(--muted)}.model-costs{font-size:11px;line-height:1.6;display:block;color:var(--muted)}
</style>
<dialog id="model-dialog" class="provider-dialog" aria-labelledby="model-title"><form id="model-form">
<div class="provider-dialog-head"><div><h2 id="model-title">Modèles & raisonnement</h2><p id="model-mission"></p></div><span id="model-revision"></span></div>
<p>La préférence répartit les départs entre candidats capables ou très proches. L’écart autorisé diminue avec la difficulté et le risque. Les modèles en réserve interviennent quand le groupe ordinaire ne suffit plus.</p>
<div class="model-controls"><label>Mode <select id="model-mode"><option value="legacy">Ordre providers puis coût</option><option value="balanced">Préférence bornée · répartition pondérée</option></select></label><label>Écart maximal d’intelligence <input id="model-gap" type="number" min="0" max="10" step="any" required></label></div>
<label>Base de coût pour départager les candidats <select id="model-cost-mode"><option value="legacy">Valeur historique du catalogue</option><option value="benchmark">Coût de benchmark (USD/tâche)</option><option value="effective">Coût effectif vérifié (USD/tâche)</option><option value="amortized">Coût amorti estimé sur base AA (USD/tâche)</option></select></label>
<p>Choisissez les raisonnements autorisés pour chaque modèle et connexion. Les niveaux non évalués sont visibles mais non sélectionnables pour le routage automatique. En mode pondéré, poids 0 = aucun départ automatique.</p>
<p>Un coût de benchmark n’est pas votre facture. Cursor peut subventionner l’accès ; les abonnements Go/ZAI ont leurs propres limites. Un coût effectif inconnu reste inconnu : aucune remise ni aucun quota ne sont déduits automatiquement.</p>
<p>Le coût amorti estimé répartit un prix d’abonnement confirmé sur un montant de crédits confirmé, à utilisation complète. Il ne mesure ni les crédits restants ni la facture réelle d’une tâche.</p>
<label>Filtrer les modèles ou connexions <input id="model-filter" type="search" placeholder="Grok, GLM, cursor, opencode-go…"></label>
<div id="model-list" class="model-list" aria-label="Modèles et variantes de raisonnement"></div>
<p id="model-notice" role="status" aria-live="polite"></p>
<div class="provider-dialog-footer"><button id="model-reload" type="button">Actualiser depuis OpenCode</button><button id="model-inherit" type="button">Rétablir l’héritage du catalogue</button><button id="model-close" type="button">Fermer</button><button id="model-save" type="submit">Enregistrer</button></div>
</form></dialog>`

/** Browser-only draft state: no writes on open, refresh, mode change or close. */
export const MISSION_GRAPH_MODELS_JS = String.raw`
const modelEditor = { team: null, revision: 0, rows: [], nativeVariants: [], retained: [], editable: false, busy: false, stale: false, base: '' };
function modelNotice(message, error) { $('model-notice').textContent = message; $('model-notice').dataset.error = error ? 'true' : 'false'; }
function modelDraft() {
  return { mode: $('model-mode').value, costMode: $('model-cost-mode').value, maxIntelligenceGap: Number($('model-gap').value), models: [...modelEditor.retained, ...modelEditor.rows.map(row => ({ id: row.id, reasoningEffort: row.reasoningEffort, preference: row.preference, enabled: row.enabled, reserve: row.reserve }))] };
}
function groupModelVariants(rows, nativeVariants) {
  const groups = new Map();
  rows.forEach(row => {
    if (!groups.has(row.id)) groups.set(row.id, { id: row.id, rows: [] });
    groups.get(row.id).rows.push({ ...row, evaluated: true });
  });
  nativeVariants.forEach(row => {
    if (!groups.has(row.id)) groups.set(row.id, { id: row.id, rows: [] });
    const group = groups.get(row.id);
    if (!group.rows.some(item => item.reasoningEffort === row.reasoningEffort)) group.rows.push({ id: row.id, reasoningEffort: row.reasoningEffort, evaluated: false });
  });
  const order = effort => {
    const text = effort.toLowerCase();
    if (text === 'default' || text === 'none') return 0;
    if (text.includes('low')) return 1;
    if (text.includes('medium')) return 2;
    if (text.includes('extra high') || text.includes('xhigh')) return 4;
    if (text.includes('high')) return 3;
    if (text.includes('max')) return 5;
    return 6;
  };
  return [...groups.values()].map(group => ({...group, rows: group.rows.sort((a,b) => order(a.reasoningEffort) - order(b.reasoningEffort) || a.reasoningEffort.localeCompare(b.reasoningEffort))}));
}
function modelCostLabels(row) {
  const usd = value => value === undefined ? 'inconnu' : value.toLocaleString('fr-FR', {maximumFractionDigits:4}) + ' USD/tâche';
  const access = {subsidized:'accès subventionné',subscription:'abonnement',api:'API',unknown:'accès non confirmé'};
  return 'Benchmark : ' + usd(row.benchmarkCostPerTask) + ' · Effectif vérifié : ' + usd(row.effectiveCostPerTask) + ' · Amorti estimé (AA) : ' + usd(row.amortizedCostPerTask) + ' · Historique : ' + usd(row.averageCostPerTask) + ' · ' + (access[row.accessMode] || 'accès non confirmé');
}
function renderModelButton() {
  const m = mission(); $('model-settings').disabled = !m;
  $('model-settings').textContent = 'Modèles & raisonnement' + (m && m.modelPolicy && m.modelPolicy.policy.mode === 'balanced' ? ' · pondéré' : '');
}
function lockModelEditor() {
  const locked = !modelEditor.editable || modelEditor.busy;
  $('model-form').querySelectorAll('input,select').forEach(input => { input.disabled = locked || input.dataset.unscored === 'true'; });
  $('model-close').disabled = modelEditor.busy; $('model-reload').disabled = modelEditor.busy;
  $('model-inherit').disabled = locked || modelEditor.stale;
  $('model-save').disabled = locked || modelEditor.stale || JSON.stringify(modelDraft()) === modelEditor.base;
  $('model-save').textContent = modelEditor.busy ? 'Enregistrement…' : 'Enregistrer';
}
function renderModelRows() {
  const list = $('model-list'); list.replaceChildren();
  const filter = $('model-filter').value.toLowerCase().trim();
  groupModelVariants(modelEditor.rows, modelEditor.nativeVariants).filter(group => group.id.toLowerCase().includes(filter)).forEach(group => {
    const section = el('fieldset', 'model-group'); section.append(el('legend', '', group.id + ' · ' + group.rows.filter(row => row.enabled && row.preference > 0).length + ' raisonnement(s) autorisé(s)'));
    group.rows.forEach(entry => {
    const row = modelEditor.rows.find(row => row.id === entry.id && row.reasoningEffort === entry.reasoningEffort);
    const item = el('div', 'model-row');
    if (!row) {
      item.dataset.unscored = 'true'; item.setAttribute('data-unscored','true');
      const label = el('label'); const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.disabled = true; checkbox.dataset.unscored = 'true';
      checkbox.setAttribute('aria-label', 'Non évalué ' + entry.id + ' ' + entry.reasoningEffort);
      label.append(checkbox, el('span', '', entry.reasoningEffort + ' · Non évalué : score ou coût comparable manquant'));
      item.append(label); section.append(item); return;
    }
    const description = el('div', 'model-description'); description.append(el('code', '', row.reasoningEffort), el('small', '', 'Intelligence : ' + row.intelligenceScore), el('span', 'model-costs', modelCostLabels(row))); item.append(description);
    [['enabled','Autoriser','checkbox'],['preference','Poids','number'],['reserve','Réserve','checkbox']].forEach(([key, title, type]) => {
      const label = el('label', '', title); const input = el('input'); input.type = type;
      input.setAttribute('aria-label', title + ' ' + row.id + ' ' + row.reasoningEffort);
      if (type === 'number') { input.min = '0'; input.max = '100'; input.step = '1'; input.required = true; input.value = row[key]; }
      else input.checked = row[key];
      input.addEventListener('input', () => { row[key] = type === 'number' ? Number(input.value) : input.checked; modelNotice('Modification locale : enregistrez pour appliquer aux prochains départs.'); lockModelEditor(); });
      label.append(input); item.append(label);
    });
    section.append(item);
    });
    list.append(section);
  });
  if (!modelEditor.rows.length) list.append(el('p', '', 'Aucune variante native activée et évaluée dans le catalogue de ce projet.'));
  lockModelEditor();
}
function openModelPolicy() {
  const m = mission(); if (!m) return;
  const view = m.modelPolicy;
  modelEditor.team = m.id; modelEditor.revision = view ? view.revision : 0;
  modelEditor.rows = view ? view.catalogue.map(row => ({ ...row })) : [];
  modelEditor.nativeVariants = view && view.nativeVariants ? view.nativeVariants : [];
  modelEditor.retained = view ? view.policy.models.filter(entry => !modelEditor.rows.some(row => row.id === entry.id && (row.reasoningEffort || 'default') === (entry.reasoningEffort || 'default'))) : [];
  modelEditor.editable = !!view && view.inventoryAvailable && !state.snapshot.frozen && m.status === 'active';
  modelEditor.busy = false; modelEditor.stale = false;
  $('model-filter').value = '';
  $('model-mission').textContent = m.name;
  $('model-revision').textContent = view ? 'SQLite · révision ' + view.revision + (view.inherited ? ' · héritée' : '') : 'Source ancienne';
  $('model-mode').value = view ? view.policy.mode : 'legacy'; $('model-gap').value = view ? view.policy.maxIntelligenceGap : 2;
  $('model-cost-mode').value = view ? view.costMode || view.policy.costMode || 'legacy' : 'legacy';
  modelEditor.base = JSON.stringify(modelDraft()); $('model-reload').hidden = !!state.snapshot.frozen;
  modelNotice(state.snapshot.frozen ? 'Instantané : lecture seule.' : !view ? 'Mettez à jour la source Ensemble pour modifier cette politique.' : !view.inventoryAvailable ? 'Inventaire natif indisponible : édition désactivée.' : m.status !== 'active' ? 'Mission archivée : lecture seule.' : 'Politique propre à cette mission. Les variantes absentes nécessitent une évaluation via ensemble-model-catalogue.');
  renderModelRows(); if (!$('model-dialog').open) $('model-dialog').showModal();
}
async function saveModelEditor(policy) {
  if (!modelEditor.editable || modelEditor.busy || modelEditor.stale) return;
  modelEditor.busy = true; lockModelEditor();
  try {
    const response = await fetch('/api/model-policy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId: modelEditor.team, revision: modelEditor.revision, policy }), signal: AbortSignal.timeout(7000) });
    const result = await response.json();
    if (!response.ok) { if (response.status === 409) modelEditor.stale = true; throw new Error(result.error || 'Enregistrement impossible'); }
    const m = state.snapshot.missions.find(item => item.id === modelEditor.team);
    if (m) m.modelPolicy = result.policy;
    openModelPolicy(); modelNotice('Politique enregistrée. Appliquée aux prochains départs, sans changer les exécutions en cours.'); render();
  } catch (error) { modelNotice(error.message + (modelEditor.stale ? ' Actualisez avant de réessayer.' : ''), true); }
  finally { modelEditor.busy = false; lockModelEditor(); }
}
$('model-settings').addEventListener('click', openModelPolicy);
$('model-close').addEventListener('click', () => $('model-dialog').close());
$('model-dialog').addEventListener('cancel', event => { if (modelEditor.busy) event.preventDefault(); });
['model-mode','model-gap','model-cost-mode'].forEach(id => $(id).addEventListener('input', lockModelEditor));
$('model-filter').addEventListener('input', renderModelRows);
$('model-form').addEventListener('submit', event => { event.preventDefault(); if ($('model-form').reportValidity()) void saveModelEditor(modelDraft()); });
$('model-inherit').addEventListener('click', () => { void saveModelEditor(null); });
$('model-reload').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/snapshot', { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    const snapshot = await response.json(); if (!response.ok) throw new Error(snapshot.error || 'Source indisponible');
    state.snapshot = snapshot; render(); openModelPolicy();
  } catch (error) { modelNotice(error.message, true); }
});
`;
