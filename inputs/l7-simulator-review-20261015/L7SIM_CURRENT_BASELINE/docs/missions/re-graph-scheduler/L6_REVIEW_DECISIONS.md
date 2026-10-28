# L6 — revue indépendante et décisions de correction

Mission `re-graph-scheduler-20261013`, 2026-10-13. **L6 non accepté, intégration L8 interdite avant corrections + re-review.**

## Revue sur gel initial

L6-RV, reviewer `l6-review`, task `task_mv6xt1p7_0030_wg3h0k`, Cursor Grok 4.7 High (readback natif vérifié), lecture seule/fresh. Sources et hashes du gel initial : `L6_PARENT_PRELIMINARY.md`. Aucun fichier modifié par le reviewer ; tests non rejoués par lui (mention «25 tests» dans son retour n'est pas un certificat : le parent a reproduit **27**).

- **D1 haute**, `graph-store.ts:416–437` initial : outbox AMBIGUOUS sans receipt, simple déclaration terminale completed+quiescent passe, résultat éligible, validation/publication possibles sans reconnaissance positive d'admission.
- **D2 haute**, `graph-store.ts:371–381` initial : catch d'ancien submit mutait outbox sans CAS état SENDING/génération ; pouvait écraser reconcile concurrent ou un nouvel envoi.
- **D3 moyenne**, publication expirée pendant VALIDATING : après readback/quiescence/release, retour BLOCKED→READY autorisait une nouvelle exécution qui ne pouvait plus commiter à cause de publication ancienne fenced/idempotente.
- **D4 politique/limite**, TTL basé sur séquence de mission : activité des autres familles peut fence un worker vivant. Conforme au contrat v1 `expiresAtEvent`, mais politique heartbeat/horizon à documenter pour L8 ; claims conservés, aucun redispatch sans quiescence.
- Limites signalées : PK globals entre missions (possession canonique volontaire), replay ne vérifie pas toutes divergences projections/tables, migrations CREATE IF NOT EXISTS ne prouvent pas tous cas de colonnes anciennes ; pas de faux G4 global.

Le parent a confronté D1/D2 au code initial ; scénarios critiques retenus. Revue indépendante ne remplace pas L9 finale.

## Décisions parent / contrat de correction L6-FIX

Task réelle `task_mv6yrky3_003c_naffek`, reprise de **l'auteur L6 existant** sur son propre worktree/contexte/Model.Ref Sol high, mêmes quatre fichiers ownership. Reviewer arrêté avant reprise, pas de mutation concurrente du gel pendant la revue. Le gel initial est identifié par hashes, rapports et traces natives ; les sources du worktree sont désormais évolutives sous correction.

1. **D1** : admission/terminal scientifique receipt-bound ; preuve déclarative completed seule interdite en AMBIGUOUS/SENDING sans receipt. Résultat éligible après accepted/readback positif lié exact execution/digest, pas après bulletin/absence/rejet. Tests perte réponse/receipt incorrect/réconciliation positive.
2. **D2** : CAS état SENDING + génération attempts + token/digest du submit d'origine ; callbacks tardifs conservables sans écraser état autoritatif. Tests deux connexions/deferred-submit avec reconcile et nouvel envoi entre send et catch.
3. **D3** : correctif conservateur fail-closed avant READY/reserve si ancienne publication fenced rend retry non commitable ; BLOCKED avec motif/recovery révision requise, preuve/readback anciens conservés. Nouvelle architecture archive/retry nécessite escalade avant migration.
4. **F-parent interop L5→L6** : autoriser A/B d'une fonction à attendre R d'une autre fonction possédée (attentes communes A/B), jamais auteur pair ni R de sa propre fonction ; R attend ses propres A+B, refs uniques/valides/DAG local et publication whole-unit-only. Test réellement généré par `planMission` L5.
5. **BUDGET** : enveloppe Admission complète UTF8 ≤ allocation sidecar unit ≤ plafond plan, aucun clipping ; négatifs Unicode/métadonnées/exact boundary/budgets unitaires différents.
6. **ATTESTATION niveau2** : API own additive, attestation durable/immutable avec autorité parent vérifiée et distincte des auteurs, jamais boolean/actorId libre provenant de sortie worker. Binding mission/unit/fence/plan/snapshot/knowledge/results+digests/evidenceDigest/event/checks ; absence/acteur invalide/stale/refus/replay doivent fail-close. Niveau1 reste explicitement fixture. Si table ajoutée, extension own v4/migration additive v1/v3→v4/reopen/futureversion refus, harness metadata v1 intacte. Aucun schéma L1/central/config modifié. Attestation seule ne prouve jamais vérité scientifique : L8/parent exécutent réellement les contrôles requis.

## Dépendances transférées pour test croisé

Lecture seule, source main intégré `51cbc6e`, destination src du worktree L6 (pas livrables auteur) ; hashes source/destination identiques :

- planner.ts `6ed71229c67f01a08dfd6fffcc23205706f3437a5d2eb490e46ea48694707c89`
- scc.ts `564967d8a694c635f1b876480158dd7c08df0700adf1fbdc4c61e61b7a250879`

Rendu corrigé puis nouvelles empreintes/gates/re-review requis avant commit/merge des modules L6. Aucun PASS scientifique/native ni adoption de production implicite.
