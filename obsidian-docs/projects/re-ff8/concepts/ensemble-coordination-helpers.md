---
title: >-
    Helpers de coordination Ensemble — réveils coalescés, préparation mécanique
    épinglée, annulation exacte et guide parent hashé
category: concept
tags: [reverse-engineering, testing, concept]
aliases: [coordination helpers, wake coalescing, preparation binding, coordination guide]
sources:
  - obsidian-docs/_raw/coordination-maintenance-20261014/session-record.md
  - tools/ff8-harness/docs/COORDINATION_FIX_20261014.md
  - tools/ff8-harness/docs/COORDINATION_HELPERS.md
  - docs/missions/re-graph-scheduler/COORDINATION_HELPERS_GO_20261014.md
  - docs/missions/re-graph-scheduler/M1_RETRAIT_CSHARP_BILAN.md
  - .opencode/missions/team_mvnxgnse_0000_39vpc8/reports/181-historique-ensemble-messages-recuperation.md
summary: Maintenance historique Ensemble du 14 octobre et leçons M1 ; la récupération native et le réveil du superviseur vérifiés le 28 octobre complètent ces garanties.
provenance:
  extracted: 0.78
  inferred: 0.19
  ambiguous: 0.03
created: 2026-10-15
updated: 2026-10-28
---

# Helpers de coordination Ensemble (réveils, préparation, guide parent)

> [!important] Portée historique
> Les mécanismes ci-dessous décrivent la maintenance du 14 octobre. Pour le paquet actif vérifié le 28 octobre et l'incident M2, voir [[projects/re-ff8/skills/recuperer-un-resultat-opencode-manquant|récupération avant remplacement]] et [[projects/re-ff8/references/rms-m2-archive-et-reprise-20261028|archive M2]]. Un rapport structuré n'est plus la seule voie possible de récupération : une réponse finale native peut être conservée comme candidat, sans acceptation automatique.

Décisions d'architecture nées de la [[projects/re-ff8/references/ensemble-coordination-maintenance-2026-10-14|maintenance du 2026-10-14]],
implémentées dans le plugin `20261014-coordination-three-0b4e7444042b` et les
scripts harnais [[projects/re-ff8/skills/pre-review-invariant-gate|pré-review]].

## Réveils durables ≠ rapports

- Un seul réveil en attente par équipe (table `team_lead_wake`, index unique sur
  les états vivants). Le token `[Ensemble wake <id>]` est une clé de liaison, pas
  un contenu ; les rapports restent en `team_message` (source unique).
- Un réveil peut être consommé par trois chemins équivalents : comparaison au
  contexte natif livré (`session.context`), récupération complète par le lead
  (`team_results`), ou application de la maintenance. La consommation full-only
  exige qu'aucun rapport du lead ne reste non lu.
- Échec de transport ambigu → état `uncertain` (pas de retransmission aveugle,
  on attend la réconciliation native) ; refus de politique de modèle → `blocked`
  (récupérable) ; jamais « delete + resend ».
- Annulation native = requête API publique d'inbox, par ID exact contenant le
  token, seulement si le réveil correspondant est consommé ; les éléments
  utilisateur/contrôle ne sont jamais touchés ; hashes des rapports mesurés
  avant/après (pas un claim codé en dur).

## Préparation épinglée (mechanical preparation)

- L'entrée est une liste explicite de fichiers avec SHA256 (pas une découverte
  récursive) : budgets 512 fichiers / 8 MiB chacun / 64 MiB total ; chemins
  logiques contrôlés (traversées, NUL/ADS, casse, links/junctions).
- La destination doit être la frontière `inputs/` de la session native
  propriétaire, ré-relue à la frontière de commit (mission/tâche/session
  exactes, via RPC lecture-seul `preparationBinding` + API native, jamais
  `ensemble.db`).
- Reçu : `prepared-not-approved`, `requiresParentApproval:true`,
  `workerAccessVerified:false`, `nativeValidation:false`. Un SHA correct ne prouve
  ni l'accès outil effectif du worker, ni le rôle logique A/B/R déclaré.
- Répétition idempotente : revalide le contenu et la forme ; fichiers
  supplémentaires non approuvés, dossiers inconnus préexistants, reçus altérés
  ou changement de propriétaire → échec sans aucune écriture de correction.
- Une tâche `completed` n'ouvre pas d'inputs implicitement : le binding échoue
  fail-closed. Il faut une nouvelle affectation explicite du parent.

## Guide parent (coordination guide)

- Texte ≤ 8 KiB, hashé, révision CAS ; mutation seulement sous pause opérateur
  et quiescence native réelle (`session.active` natif, pas seulement les
  compteurs persistés) ; injecté uniquement dans le prompt du parent — jamais
  dans les contextes auteurs/reviewers.
- Le guide transporte la politique de travail (couverture antérieure endossée,
  gates, interdits), pas des décisions scientifiques : review fraîche et gates
  parent restent obligatoires.

## Invariants transversaux

- La maintenance native (dry-run/apply) exige pause + quiescence ; `apply`
  re-vérifie le repère de pause individuellement à chaque annulation.
- Le readback natif (`plugin.list`, RPC, `session.active`) prime sur les
  compteurs persistés ; les préférences de modèles sont comparées byte-exact
  avant/après (SHA256).
- Les erreurs de contrôleur sont préservées comme errata (chemin Windows non
  normalisé ; erreur métier attendue masquée par le SDK en `RpcInternalError`)
  — jamais réécrites.

## Leçons M1 (2026-10-20) — auto-dispatch et travail sur checkout chargé

Voir [[projects/re-ff8/references/rms-m1-retrait-csharp-20261020|mission M1]].

- **Auto-dispatch sans `depends_on` posables** : des tâches admises sans
  dépendances de board (pas d'outil de mise à jour a posteriori) sont
  auto-dispatchées immédiatement vers des workers de pool — y compris des
  tâches dont les prérequis ne sont pas faits. Antidotes observés : ordres de
  hold directs aux workers dormants (les messages stockés ne les réveillent
  pas mais sont livrés à leur premier réveil réel), re-dispatch sériel par le
  lead, spawn neuf ancré au checkout réel quand les clones de pool ont une
  base divergente (objets git non partagés, HEAD inconnu du dépôt principal —
  vérifier `git worktree list` et `merge-base` avant de fusionner un clone de
  pool). ^[extracted]
- **Shutdown refusable** : `team_shutdown` (même `force`) peut échouer sur
  « could not preserve » — l'état dormants + hold orders reste la sécurité ;
  vérifier l'inaction par l'état du worktree (status/log), pas par les pings. ^[extracted]
- **Notifications bruitées** : des réveils système sans contenu (`team_results`
  vide) ont été observés. Une boîte vide ne prouve pas l'absence de travail :
  examiner au besoin la réponse native et les fichiers, sans polling ni
  remplacement automatique. La récupération ne vaut pas validation. ^[inferred]
- **Attribution temporelle par préimage** : pour prouver « ce worker n'a ajouté
  que X à un fichier déjà dirty », reconstruire la préimage (fichier courant
  moins les lignes revendiquées) et comparer le SHA-256 au hash pré-calculé
  avant la tâche (M1 : `package.json` − 1 ligne = `33781202…` exact). La
  reconstruction règle ce qu'un diff vs HEAD ne peut pas attribuer. ^[inferred]
- **Compteur porcelain comme preuve de non-emport** : figer
  `git status --porcelain` (comptage + hash de la liste triée) avant le
  travail d'un worker sur un checkout partagé ; tout saut doit s'expliquer
  fichier par fichier (M1 : 505 → 509 → 518 → 501, chaque saut tracé). ^[extracted]
- **Empreinte du diff préexistant par sous-arbre** (`git diff -- <zone> |
  git hash-object --stdin`) : sépare proprement le delta d'un worker du WIP
  utilisateur quand le commit final est supervisé. ^[inferred]
