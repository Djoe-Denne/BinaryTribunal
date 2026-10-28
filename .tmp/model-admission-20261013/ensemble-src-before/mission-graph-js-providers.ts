/** Provider preference editor embedded in the mission graph; saves only on explicit submission. */
export const MISSION_GRAPH_PROVIDERS_JS = String.raw`
const providerEditor = { team: null, revision: 0, order: [], base: [], providers: [], editable: false, busy: false };
function providerNotice(text, error) {
  $('provider-notice').textContent = text;
  $('provider-notice').dataset.error = error ? 'true' : 'false';
}
function renderProviderButton() {
  const m = mission();
  $('provider-settings').disabled = !m;
  const count = m && m.routingPolicy ? m.routingPolicy.providerOrder.filter(id => m.routingPolicy.providers.includes(id)).length : 0;
  $('provider-settings').textContent = 'Préférences providers' + (count ? ' · ' + count : '');
}
function renderProviderOrder(focusIndex) {
  const list = $('provider-order'); list.replaceChildren();
  providerEditor.order.forEach((id, index) => {
    const row = el('li', 'provider-row');
    row.append(el('span', 'provider-position', index + 1), el('code', 'provider-name', id));
    const actions = el('div', 'provider-actions');
    [[-1, '↑', 'Monter'], [1, '↓', 'Descendre'], [0, '×', 'Retirer']].forEach(([delta, label, verb]) => {
      const button = el('button', 'provider-move', label); button.type = 'button';
      button.setAttribute('aria-label', verb + ' ' + id); button.title = verb;
      button.disabled = !providerEditor.editable || providerEditor.busy || (delta === -1 && index === 0) || (delta === 1 && index === providerEditor.order.length - 1);
      button.addEventListener('click', () => {
        if (delta === 0) providerEditor.order.splice(index, 1);
        else { const other = index + delta; [providerEditor.order[index], providerEditor.order[other]] = [providerEditor.order[other], providerEditor.order[index]]; }
        providerNotice('Modification locale : cliquez sur Enregistrer pour appliquer cet ordre.');
        renderProviderOrder(Math.max(0, index + delta));
      });
      actions.append(button);
    });
    row.append(actions); list.append(row);
  });
  if (!providerEditor.order.length) list.append(el('li', 'provider-empty', 'Aucune préférence : routage automatique existant.'));
  const locked = !providerEditor.editable || providerEditor.busy;
  const selected = $('provider-input').value;
  const choices = providerEditor.providers.filter(id => !providerEditor.order.includes(id));
  $('provider-input').replaceChildren();
  const placeholder = el('option', '', choices.length ? 'Choisir une connexion OpenCode V2…' : 'Aucune autre connexion activée');
  placeholder.value = ''; $('provider-input').append(placeholder);
  choices.forEach(id => { const option = el('option', '', id); option.value = id; $('provider-input').append(option); });
  $('provider-input').value = choices.includes(selected) ? selected : '';
  $('provider-add').disabled = locked || !choices.length; $('provider-input').disabled = locked || !choices.length;
  $('provider-close').disabled = providerEditor.busy; $('provider-reload').disabled = providerEditor.busy;
  $('provider-reset').disabled = locked || !providerEditor.order.length;
  $('provider-save').disabled = locked || JSON.stringify(providerEditor.order) === JSON.stringify(providerEditor.base);
  $('provider-save').textContent = providerEditor.busy ? 'Enregistrement…' : 'Enregistrer';
  if (typeof focusIndex === 'number') { const row = list.children[focusIndex]; const button = row && row.querySelector('button:not(:disabled)'); if (button) button.focus(); }
}
function openProviderPolicy() {
  const m = mission(); if (!m) return;
  const policy = m.routingPolicy;
  providerEditor.team = m.id; providerEditor.revision = policy ? policy.revision : 0;
  providerEditor.providers = policy && policy.inventoryAvailable ? policy.providers.slice() : [];
  providerEditor.order = policy ? policy.providerOrder.filter(id => providerEditor.providers.includes(id)) : []; providerEditor.base = providerEditor.order.slice();
  providerEditor.editable = !!policy && policy.inventoryAvailable && !state.snapshot.frozen && m.status === 'active'; providerEditor.busy = false;
  $('provider-mission').textContent = m.name;
  $('provider-revision').textContent = policy ? 'SQLite · révision ' + policy.revision : 'Source ancienne';
  $('provider-input').value = ''; $('provider-reload').hidden = state.snapshot.frozen;
  providerNotice(state.snapshot.frozen ? 'Instantané enregistré : préférences en lecture seule.' : !policy ? 'Cette source ne publie pas encore les préférences. Elles seront éditables après activation de la nouvelle version d’Ensemble.' : !policy.inventoryAvailable ? 'Inventaire OpenCode V2 indisponible. Actualisez pour réessayer.' : m.status !== 'active' ? 'Mission archivée : préférences en lecture seule.' : !providerEditor.providers.length ? 'Aucune connexion OpenCode V2 ne possède de modèle activé pour ce projet.' : 'Connexions issues d’OpenCode V2, avec au moins un modèle activé. L’ordre est conservé pour cette mission.');
  renderProviderOrder();
  if (!$('provider-dialog').open) $('provider-dialog').showModal();
}
function addProvider() {
  const id = $('provider-input').value.trim();
  if (!providerEditor.providers.includes(id)) { providerNotice('Choisissez une connexion OpenCode V2 ayant des modèles activés.', true); return; }
  if (providerEditor.order.includes(id)) { providerNotice('Cette connexion est déjà dans la liste.', true); return; }
  if (providerEditor.order.length >= 64) { providerNotice('La liste est limitée à 64 connexions.', true); return; }
  providerEditor.order.push(id); $('provider-input').value = '';
  providerNotice('Modification locale : cliquez sur Enregistrer pour appliquer cet ordre.'); renderProviderOrder();
}
$('provider-settings').addEventListener('click', openProviderPolicy);
$('provider-close').addEventListener('click', () => $('provider-dialog').close());
$('provider-dialog').addEventListener('cancel', event => { if (providerEditor.busy) event.preventDefault(); });
$('provider-add').addEventListener('click', addProvider);
$('provider-input').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); addProvider(); } });
$('provider-reset').addEventListener('click', () => { providerEditor.order = []; providerNotice('Le routage automatique sera rétabli à l’enregistrement.'); renderProviderOrder(); });
$('provider-reload').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/snapshot', { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    const snapshot = await response.json(); if (!response.ok) throw new Error(snapshot.error || 'Source indisponible');
    state.snapshot = snapshot; render(); openProviderPolicy();
  } catch (error) { providerNotice(error.message, true); }
});
$('provider-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!providerEditor.editable || providerEditor.busy) return;
  providerEditor.busy = true; renderProviderOrder();
  const input = { teamId: providerEditor.team, providerOrder: providerEditor.order.slice(), revision: providerEditor.revision };
  try {
    const response = await fetch('/api/provider-policy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(7000) });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409) { $('provider-reload').hidden = false; throw new Error('La mission a été modifiée ailleurs. Rechargez la préférence avant de l’éditer à nouveau.'); }
      throw new Error(result.error || 'Enregistrement impossible');
    }
    providerEditor.revision = result.policy.revision; providerEditor.base = result.policy.providerOrder.slice();
    const m = state.snapshot.missions.find(m => m.id === input.teamId);
    if (m && m.routingPolicy) Object.assign(m.routingPolicy, result.policy);
    $('provider-revision').textContent = 'SQLite · révision ' + result.policy.revision;
    providerNotice('Préférence enregistrée localement pour cette mission. Appliquée aux prochains départs.');
    render();
  } catch (error) { providerNotice(error.message, true); }
  finally { providerEditor.busy = false; renderProviderOrder(); }
});
`;
