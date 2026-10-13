# Fiabilisation des entrées et admissions — 2026-10-12

Périmètre : traiter les workers déjà bloqués, dans la session lead existante,
sans nouvel agent d'appui. Plafond conservé à **5 exécutions**. Aucune modification
de score, catalogue, politique de routage, source native, checkpoint ou décision
de contexte. Les nouvelles admissions automatiques restent suspendues
(`autoScale=false`, `autoDispatch=false`). Les reprises concernent uniquement
les tâches et sessions déjà possédées.

## Preuves et résultats

- `baseline.json` : état initial actualisé des 26 workers bloqués, dernières
  communications, profils natifs effectifs, lectures/erreurs, contexte et modèle.
  **26/26** références natives concordent avec `model_routing.selected` enregistré
  à l'admission ; **26/26** contextes et jeux d'entrée initiaux passent les
  contrôles d'intégrité. Cela ne prouve pas la suffisance scientifique du gel.
- `routing-*.json` : références d'admission extraites d'une sauvegarde SQLite
  obtenue en lecture seule. La base vivante n'est jamais modifiée directement.
  Les décisions et poids enregistrés sont conservés. La révision 10 du snapshot
  courant n'est pas inventée comme révision historique d'une admission : lorsque
  le record historique n'encode pas ce numéro, cette limite reste explicite.
- `handoff-pool-*.json` : un handoff autonome par worker, avec modèle attendu et
  observé, tâche/rôle/session, contexte et révision, source et frontière exclusive
  le cas échéant, chemins absolus des fichiers vérifiés, hashes et sortie unique.
- `batch-01-outcome.json` : premier lot de cinq terminé sans nouvelle intervention
  après remise du handoff ; lectures réussies, tâches persistées complètes et
  dépôts byte-exact rapprochés des écritures natives. La réconciliation sémantique
  `0x495D80` a également terminé. Il ne s'agit pas d'une validation RE finale.
- `all-handoffs-readback.json`, puis `post-interruption-readback.json` : distinguent
  les reprises effectivement observées, les productions terminées et les wakes
  encore en attente du budget de cinq. Un message envoyé/stocké ne vaut jamais
  reprise vérifiée. Lire le dernier snapshot horodaté pour l'état, non ce résumé.

Les 82 décisions `pending` préexistantes restent inchangées : 50 décisions de
contexte à valider, 29 `REPAIR_HOLD`, la gate R `0x47E3F0` et les deux gates R
`0x502380`. La disponibilité d'une sortie dans `outputs/` ne lève aucune gate R.
Les quarantaines antérieures et l'exception VM `0x487DF0` restent applicables.

## Causes corrigées

1. **Chemins manquants et faux diagnostics d'absence** : les profils autorisent
   `read inputs/*`, pas le `CONTRACT.md` de mission ni les gels sous `.tmp/`.
   Un refus de listing de `inputs` ne signifie pas que les fichiers précis de
   la projection sont absents. Les handoffs donnent chaque chemin réel et le
   contrat utile directement, sans élargir les permissions.
2. **Consignes de modèle périmées** : les mentions textuelles « Sol high »,
   « Astra high » ou « Pool25 » ne sont pas des overrides. Comparaison native
   provider+ID+variante à la sélection persistée, jamais à une politique recalculée.
3. **Confusion entre source factuelle partagée et contamination A/B** : le contrat
   run01, « Contexte et classification », point 5, autorise explicitement les
   forks indépendants du même explorateur factuel. Cela ne permet aucun héritage
   d'une production sœur ou du lead. Les champs de provenance ne sont pas effacés
   pour satisfaire artificiellement le défaut fresh du guide général.
4. **Session bloquée ayant terminé son tour** : un message peut être stocké sans
   réveiller la session. Pour `pool-202`, le premier envoi l'a signalé ; une
   réactivation explicite de la même tâche a suivi, sans renvoyer les entrées.
   Les reprises suivantes utilisent ce mécanisme sous le plafond partagé.

## Exceptions traitées

- `0x50B2A0` : après reprise et lecture complète, l'auteur B a confirmé une
  seconde table réellement absente. Capture superviseur statique des 40 octets
  `[0x50B7E8,0x50B810)`, racine gelée == IDB == PE et table IDB == PE. Extension
  commune remise aux quatre auteurs, sans interrompre ceux déjà productifs :
  `inputs/ff8-decomp-semantics-20261011-r01/g17/0x50B2A0.supplemental-v1/`.
  Manifeste SHA256 `d0abc9ed75a59c179a143a880ca67583e5c19883fcb40d86acca8bbff5072222`.
  Voir `50B2A0-supplemental-freeze.json` et `supplement-handoff-pool-*.json`.
  La lecture effective du supplément est suivie séparément de la première reprise.
- `0x50B830` : capture superviseur **statique**, sans mutation IDB ni exécution
  du jeu, des 32 octets `[0x50BAE0,0x50BB00)`. Racine gelée == IDB == PE,
  table IDB == PE. Supplément commun aux quatre auteurs dans
  `inputs/ff8-decomp-semantics-20261011-r01/g17/0x50B830.supplemental-v1/`.
  Manifeste SHA256 `ddf0c47e293841fdd067f43f05b0f582c733984a96d5a3317883a75f157a8e3a`.
  Voir `50B830-supplemental-freeze.json`. Aucun ancien gel n'est remplacé.
- `0x506690`, C R : candidats A/B rapprochés des écritures natives et des
  admissions, sessions indépendantes vérifiées, puis copies canoniques gelées
  avec le même contexte natif dans
  `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g17/0x506690/C/`.
  Manifeste SHA256 `db0841dadb54fcd2ad1f321de108591e103afe94edd46c6cc067e580dcf38661`.
  Voir `506690-c-r-freeze.json`. Les anciennes lectures de répertoires factuels
  restent tracées ; elles ne deviennent pas une autorisation de lecture élargie.
- Une erreur transport `WebSocket closed with code 1012` observée chez
  `pool-228` pendant l'interruption est distincte des entrées et permissions.
  La session encore productive n'a pas été interrompue ni remplacée.

## Admission / reprise : contrat opérationnel à conserver

1. Actualiser tâche, propriétaire, dernière communication et activité native.
   Ne rien renvoyer si une correction équivalente est déjà remise/en attente,
   si le worker travaille ou si le dépôt existe déjà.
2. Vérifier le `Model.Ref` complet contre la décision persistée au départ ou
   l'override explicite applicable. Archiver la preuve et la révision historique
   lorsqu'elle est disponible. Ne jamais substituer celle de la politique courante.
3. Respecter strictement contexte/révision/source/frontière approuvés. Vérifier
   la projection native retenue, pas l'égalité d'IDs de messages clonés. Pas de
   remplacement fresh silencieux, de nouvelle compaction ou de changement source.
4. Vérifier fichiers précis, hashes/taille/version/provenance. Distinguer mauvais
   chemin, listing refusé, lecture précise refusée, outil absent et fichier absent.
   Pour R, exiger une projection canonique autorisée avec A/B gelés ; `outputs/`
   seul ne suffit pas. Un supplément natif manque tant que sa capture et son gel
   n'ont pas effectivement réussi.
5. Remettre un handoff autonome : identité, modèle attendu/observé, contexte,
   chemins absolus, version/hashes, invariants du rôle et destination unique.
   Les petits fichiers connus peuvent être lus précisément ; les grandes
   métadonnées sont bornées par tranches. Aucune permission de contournement.
6. Vérifier ensuite l'état persistant **et** l'activité native / les lectures
   réussies. Une wake en file n'est pas une reprise. Un dépôt n'est pas une
   validation scientifique. Aucun push IDB, commit ou changement de ledger RE.

Les scripts `.tmp/ff8-r01-hardening-20261012.mjs` et
`.tmp/ff8-r01-hardening-routing-20261012.py` sont des aides locales de contrôle,
pas un nouvel ordonnanceur. Ils ne créent aucun agent et ne modifient pas la
configuration globale. Les admissions automatiques ne sont pas réactivées par
ce document ; aucune hausse du plafond n'est proposée.
