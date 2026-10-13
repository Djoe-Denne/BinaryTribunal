# GO_ACTIVATION — mission `re-graph-scheduler-20261013`

## Politique courante — avenant utilisateur 2026-10-13 (supersède les routes précédentes)

**Dernier steering utilisateur : budget Z AI bientôt épuisé.** Ordre persisté **revision 3 : Cursor > OpenAI > Z AI**. Plus de nouvelle admission Z AI dans la continuation ; préférer Cursor Grok 4.7/4.6 et OpenAI Sol. `openai/gpt-6-astra` actif confirmé au catalogue (low/medium/high/xhigh/max), admissible **en dernier recours**. Les deux sessions Z AI déjà actives peuvent terminer ; limite atteinte → préserver leur travail et basculer vers une route autorisée, sans supposer leur arrêt ni dupliquer les writers.

**État constaté après steering** : quota Z AI effectivement épuisé (provider.quota / HTTP429 / code1310, preuves natives dans `QUOTA_HANDOFF_20261013.json`). Sessions L2/L7-r2 arrêtées et sources préservées ; continuations L2/L7-r3 sur OpenAI Sol high, Model.Ref/location vérifiés, transferts hashés et plans approuvés. Plafond partagé Ensemble **5 workers** désormais persisté et appliqué ; cinq sessions actives au dernier contrôle, aucune sur Z AI.

**L6-FIX** : autorisation parent limitée aux mêmes quatre fichiers own pour défauts admission/CAS/publication fenced/interop, enveloppe Admission complète ≤ allocation unitaire et attestation parent durable niveau2. API/table own additive v4 si nécessaire (migration additive/reopen, metadata harness v1 intacte), aucun schéma L1/central/config/IDB modifié. Nouvelle re-review obligatoire avant intégration ; détails `L6_REVIEW_DECISIONS.md`.

- GLM : **Flash uniquement**, variante **max** obligatoire ; pas de GLM highspeed ni de GLM non-Flash.
- Cursor : **Grok 4.7 ou 4.6 uniquement** ; aucune route Sol/Composer/Opus sur Cursor.
- OpenAI : `openai/gpt-6.1-sol` confirmé au catalogue ciblé (variantes low/medium/high/xhigh/max). Astra reste dernier recours, non admis par défaut.
- Catalogue : les anciennes affirmations d'absence d'OpenAI/Sol étaient erronées (page par défaut limitée à 20 résultats). Rechercher désormais par provider/modèle, puis vérifier `total`/`next`.
- Ordre providers persisté revision 2 : `zai-coding-plan > cursor > openai > unlisted` ; les choix explicites du lead priment. Classification désactivée explicitement (`mode: off`) : scores manuels du lead, aucun classifieur automatique.
- Changement demandé pour les sessions existantes : L2/L7 → `zai-coding-plan/glm-5.3-flash#max` ; L3 → `cursor/grok-4.7#Grok 4.7 High` ; L5/L6 → `openai/gpt-6.1-sol#high`. Messages et demandes de reprise délivrés ; accusé de livraison ≠ preuve de Model.Ref natif. Aucune validation de variante proclamée sur un simple accusé.
- Diagnostic à ce changement : cinq sessions idle, zéro worker running, tâches L2/L3/L5/L6/L7 in_progress ; ne pas compter ces sessions comme parallélisme utile.

### Relance corrigée et autorisation de replis (supersède les limites/readbacks précédents)

- Erreur lead démontrée par le code du plugin installé : `team_message` n'interprète pas `#variant` ; `parseModelId` garde tout le suffixe dans `modelID`, et cette mise à jour remet `model_variant` à NULL. Ses accusés précédents ne prouvaient donc aucune variante native valide.
- Les cinq anciennes sessions ont été arrêtées par le lead (aucune implémentation produite selon status git ; anciens worktrees et gels préservés). Les mêmes tâches ont été réclamées par cinq sessions fresh `*-r2`, avec paramètres `model` et `variant` **séparés** à `team_spawn`.
- Modèles natifs effectivement relus sur chaque session via client public authentifié OpenCode : Flash max Z AI pour L2/L7, Cursor Grok 4.7 High pour L3, OpenAI GPT-6.1 Sol high pour L5/L6. Preuve : `RESTART_RECEIPT_20261013.json`. Cette méthode résout le manque de readback déclaré précédemment ; aucune lecture d'`ensemble.db`.
- Autorisation utilisateur : toute limite atteinte sur un modèle permet de passer à un autre modèle autorisé. Conserver la provenance et les tentatives, ne pas dupliquer une exécution encore active ; ne pas confondre auth/entrée/schéma/mauvais identifiant avec quota. Aucun GLM non-Flash, aucun GLM hors max, aucun Cursor hors Grok 4.7/4.6 ; Sol sur OpenAI autorisé ; Astra dernier recours.

**Statut** : GO développement (2026-10-13, utilisateur : « commité et pushed. clean state, go »).
**Portée du GO** : mission de développement re-graph-scheduler UNIQUEMENT. Ce GO ne lance aucune campagne scientifique autonome, aucun live, aucun writer DLL, aucune migration run01/battle-static-discovery, aucune publication IDB.

## 1. Contrat d'activation (ORDRE_MISSION §2.4)

| Item | Valeur enregistrée |
|---|---|
| missionId | `re-graph-scheduler-20261013` |
| Périmètre fichiers — écriture | `docs/missions/re-graph-scheduler/**` ; `tools/ff8-harness/**` en extension modulaire (ajouts `schemas/`, `test/fixtures/graph/`, nouveaux modules `src/graph*.ts`, `src/planner*.ts`, `src/eventlog*.ts`…) ; nouveaux sous-dossiers `tools/` sur ADR justifiée. Fichiers centraux `engine.ts`, `domain.ts`, `adapter.ts`, `client.ts`, `cli.ts` + câblage CLI : propriétaire unique L8, sérialisé. Registres `tools/battle_static_*.py`, `battle_indirect_registry.py` : extension non destructive uniquement. |
| Périmètre fichiers — interdit | Configs globales (`.cursor/mcp.json`, `.codex/config.toml`, `opencode.jsonc`, `.opencode/agents/**`, …), `obsidian-docs/**`, campagne `docs/tech/investigation/battle-static-discovery/**` (lecture seule), run01 `docs/missions/ff8-decomp-semantics-2026-10-11-run01/**` (lecture seule = fixtures), `.tmp/**` (lecture des gels autorisée, jamais écriture), `ensemble.db` (jamais d'accès direct). |
| Artefact binaire | IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64` — module FF8_EN.exe, PE32, machine 0x014C, image base 0x400000, sha256 d'entrée `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`. IDA READONLY strict : aucun rename/commentaire/typage/patch/save. Périmètre borné d'extraction : corpus battle (98 fns run01 + graphe ledger + registres). `py_eval`/exports IDAPython bornés : lead uniquement. |
| Références / hashes | Git : `de326bc` (ORDRE_MISSION, utilisateur) → `aaa3358` (baseline harnais, lead, 64 fichiers) → `5406c9a` (baseline corpus run01 + mission docs, lead, 572 fichiers). Plugin Ensemble : `20261012-52e26eee373c`. |
| Worktrees / manifests | Baseline committée avant toute admission → les worktrees depuis HEAD contiennent harnais + run01 + mission docs. Tout fichier futur non-committé utile à un worker fera l'objet d'un manifeste de transfert explicite hashé (aucun transfert implicite). Writers : worktree isolé ; readers : sans worktree. |
| Profils / modèles / variantes | Profils natifs built-in (`build`, `plan`, `explore`). Modèle explicite par défaut : `opencode-go/glm-5.3-flash` (politique utilisateur), variante par défaut (aucun `#high` requis pour du développement). Relecture `Model.Ref {providerID,id,variant}` native OBLIGATOIRE à chaque spawn (team_status), enregistrée au journal. Replis uniquement sur indisponibilité avérée, même rôle/inputs, UNE seule tentative de remplacement : `zai-coding-plan/glm-5.3-flash` puis `fireworks-ai/accounts/fireworks/models/glm-5p3-flash`. Aucun modèle payant, aucun changement silencieux. Classification jev des tâches : helperModel = `opencode-go/glm-5.3-flash` (override lead ; protocole frozen, scores [0,1], fallbacks 0). |
| Limites | ≤ 5 workers dev parallèles (ajustable selon dépendances/chemin critique, jamais pour remplir une liste). Une seule équipe. Pas de second scheduler scientifique ni de gestionnaire de sessions parallèle : Ensemble possède sessions/capacité ; le runtime FF8 passe par le pont public uniquement ; les tâches fines restent dans le planificateur, la file native ne porte que les admissions utiles. |
| Budget / retries | Quotas configurés uniquement (aucun achat, aucun provider nouveau). Retries bornés : max 1 remplacement par worker/rôle. Arrêt : L10 validé ∥ échec irrécupérable après remplacement ∥ arrêt utilisateur ∥ budget épuisé (déclaré au rapport, jamais silencieux). |
| Mode | Fixtures d'abord (L1–L7 hors ligne, sans LLM ni IDA) ; IDA readonly borné (L2) ; workers jamais `py_eval` ; publication admissible = niveaux 1 (store fixture) + 2 (connaissance locale approuvée par validation lead). Niveau 3 (publication IDB) HORS mission (gate séparée). |
| Git | Lead seul committe. Workers : jamais (écriture worktree uniquement). Intégration : `team_merge` + review diff + commit lead. Pas de push remote par le lead (l'utilisateur pousse). Messages : `mission(re-graph-scheduler): <résumé>`. Jamais de `--no-verify`. |
| Critères d'arrêt | Cf. Budget/retries + rapport final L10 (gates G2–G4 ; G5 shadow / G6 native / G7 adoption = GO séparés). |

## 2. Préflight L0 (2026-10-13)

**Frontières** : campagne battle-static-discovery = **DRAINED/STOP_DISPATCH** (drain utilisateur 2026-10-10, 0 worker actif) → aucune collision ; run01 = 54 worktrees historiques préservés (sessions mortes, aucun nettoyage) ; aucune équipe Ensemble préexistante ; IDA vivant (IDB 9.3 chargé, py_eval OK).

**L0-A — capital graphe/corpus** :
- Réutilisations top-5 : ① `battle-graph-ledger.json` (graphe typé direct/tail/callback_candidate/indirect + tables MagicList, BFS depuis 10 familles de roots, déterministe, tracked) ; ② `magic-registry.json` (empreintes par chunk + relocation-aware → identités de nœuds stables/détection de dérive) ; ③ `battle-indirect-registry.json` (493 sites indirects typés + EXPECTED_COUNTS = gates de non-régression) ; ④ `run01/native-groups.json` (98 fns/36 groupes, graphe out/callers, 98 gels packets CFG/ASM/xrefs) ; ⑤ `semantic-certainty.md` (CERTAIN 23 / LIKELY 298 / UNCERTAIN 3 / CONFLICT 5 / SKIP_* 169) + `decomp/` 573 + `semantic/` 85.
- Limites à conserver comme telles : `callback_candidate` = heuristique push-imm (hypothèse, jamais appel confirmé) ; tolérance silencieuse des tails → empreintes possiblement partielles (statut de couverture à créer) ; 4 divergences disque/IDB quarantaine non expliquées (`0x465720`, `0x495960`, `0x48D200`, `0x48FE20` — hash d'entrée concordant ≠ octets locaux concordants) ; self-arêtes supprimées dans run01 → récursion perdue pour SCC (re-extraction nécessaire) ; groupement glouton 100/3/1 cap6 non promu (`.tmp`) → baseline à versionner ; `EXPECTED_IDB_PATH` des registres pointe l'ancien nom d'IDB (même hash binaire).

**L0-B — harnais/pont/stockage** :
- PRÉSENT : CAS atomique par mission + fencing monotone + heartbeat ; outbox/intentions durables ; idempotence (executionId) ; publication CAS + readback byte-equal ; strict output json_schema (2000 chars/ligne, `contentLines`/`utf8-lines-lf`) ; re-policy 15 opérations IDA readonly + rôles A/B/R + bulletin R opt-in pull-only ; CLI init/status/tick/run/pause/stop/resume/recover/diagnose ; tests étendus (engine 61, re-policy 18, store/adapter/client…).
- ABSENT (à construire) : tables graphe/partition/events/unit-leases ; SCC ; file événementielle globale ; leases PAR unité ; planner G1/G2/G3 (freeze = easy-first SANS fermeture sur prérequis) ; WorkUnit multifonction (Intent.identity = 1 fonction/intent).
- Points d'extension : tables own dans `Store` (CREATE TABLE IF NOT EXISTS, même DB own, refus schéma étranger conservé) ; modules purs `src/graph.ts`/`planner.ts`/`eventlog.ts` accrochés aux stages `group`/`freeze` ; gates A+B→R et validation→commit PAR unité à conserver, barrières inter-unités `tick`/`finished()` à relâcher ; `CycleRecord.groups` immuable à préserver.

## 3. Équipe + tableau (IDs natifs réels)

Team : `re-graph-scheduler` (lead = cette session). Scheduling : auto_dispatch=false, auto_scale=false (dispatch manuel lead). Classification : jev (helperModel `opencode-go/glm-5.3-flash`, protocole frozen).

| Lot | Task ID | Dépend de | Priorité |
|---|---|---|---|
| L1 Contrat commun + ADR | `task_mv6tmoq6_0001_xbavfg` | — | high |
| L2 Graphe natif + capacités | `task_mv6towp7_0006_hb6tr0` | L1 | high |
| L3 Clustering structurel / groupes | `task_mv6towpp_0007_tknxf8` | L1 | high |
| L4 Sémantique multivue / lineage | `task_mv6towq2_0008_m3s5ul` | L1 | medium |
| L5 Planning algorithmique | `task_mv6towqd_0009_ngf09c` | L1 | high |
| L6 Persistance / reprise | `task_mv6towqs_000a_vf0m47` | L1 | high |
| L7 QA / simulateur / benchmarks | `task_mv6towra_000b_756q9i` | L1 | high |
| L8 Intégration harnais/pont/CLI | `task_mv6towrm_000c_24005n` | L2, L3, L5, L6 | high |
| L9 Review indépendante + sûreté | `task_mv6towry_000d_c1nxby` | L8 | high |
| L10 Intégration/validation finale | `task_mv6towsa_000e_w4cpxc` | L7, L8, L9 | high |

## 4. Admissions

- Dispatch L1 en cours à la rédaction (voir MISSION_JOURNAL.md pour le détail et les readbacks `Model.Ref`).
- L2–L7 seront dispatchées après validation lead du contrat L1 (merge + commit baseline du contrat) — jamais avant.

## 5. Avenant utilisateur 2026-10-13 (priorité maximale) — classification + sélection des modèles

Directive utilisateur explicite, priorité maximale, reçue après le préflight : **la classification des tâches et la sélection des modèles relèvent de la propre intelligence du lead** ; **Astra = dernier recours** ; Grok, Sol, GLM Flash sont des très bons modèles (pool préféré, dans la limite du catalogue réellement disponible).

- Catalogue vérifié 2026-10-13 (dispatch Ensemble) : `opencode-go/grok-4.7` (low/medium/high/xhigh), `opencode-go/glm-5.3-flash` (low/high/max), `opencode-go/glm-5.3` (low/high/max), `opencode-go/gpt-6-luna` — actifs. **Sol et Astra absents du catalogue spawn** (disponibles uniquement côté pont public harnais FF8, hors dispatch de cette équipe).
- Implémentation : chaque `team_tasks_add` futur porte les scores `complexity`/`risk` du lead (classification `not_required`, zéro appel classifieur) ; chaque `team_spawn` porte un `model` explicite choisi par le lead (+ ses propres `complexity`/`risk`, surcharge des scores stockés). Les scores jev déjà stockés (complexity=1, risk 0.41–1.0) restent **consultatifs uniquement** et ne gouvernent aucun dispatch. Le protocole jev frozen de la mission n'est pas modifié (aucun besoin opérationnel : dispatch manuel + modèle explicite partout). Aucun appel LLM jamais introduit dans extraction/clustering/planning/simulation.
- Choix d'ouverture (jugement lead) : **L1 contrat → `opencode-go/grok-4.7` variant `high`** — lot fondateur dont les erreurs se propagent à L2–L7 ; précision de conception prioritaire sur le coût. Remplacement autorisé (1 tentative max) : `opencode-go/glm-5.3` high → `opencode-go/glm-5.3-flash` high. Astra jamais pour cette équipe (dernier recours, hors catalogue spawn).
- Plan indicatif (jugement lead, affiné à chaque dispatch, readback au journal) : L3/L5/L6/L8 (algorithmique critique, leases/fencing, intégration centrale) → grok-4.7 high ; L2/L7 (adaptateurs, volume QA) → glm-5.3-flash high ; L4 (index lexical, encodeur optionnel) → glm-5.3 high ou glm-5.3-flash high ; L9 (review adversariale) → grok-4.7 xhigh ; L10 → lead seul. Ce plan est indicatif, jamais un routage automatique.

**Avenant 2 (2026-10-13, priorité maximale) — GLM max + connexion OpenCode Go prioritaire** :

- **GLM en variante `max` uniquement** (y compris `glm-5.3-flash` ; la variante `high` est proscrite pour GLM). Toute admission GLM future (L4, remplacements) porte `variant: "max"`.
- **Connexion OpenCode Go en priorité** : `provider_order` persisté en mission (revision 1, `opencode-go > autres`) ; les replis hors `opencode-go` n'interviennent que sur indisponibilité avérée de la connexion.
- Appliqué à l'instant : workers GLM en cours (`l2-graph`, `l7-qa`) mis à jour in-place vers `opencode-go/glm-5.3-flash#max` (effectif à leur prochain tour, sans interruption de travail). Grok-4.7 `high` inchangé (la directive porte sur GLM uniquement).
