# QA croisée L7 + runtime16 — nouveau gel, pas intégration main

## Autorité, rôle et ownership

Continuation autonome `AUTONOMY_CONTINUATION_20261016.md`, même mission, même owner
`l7-interop-r1`, tâche ouverte `task_mv71y0s6_004q_ksbii0`, session native
`ses_ec12e19acffe3Ks6U1fc4l9zPK`, Sol Max/build. Ce n'est pas la réouverture des
reviews L7 ou L8 terminées ni une revue indépendante L9. Budget5/politiques4/2,
classification manuelle et dispatch/scaling automatiques désactivés inchangés.

Les deux reviews recevables sont `L7_COPY851_REVIEW_ACCEPTABLE_SCOPED_20261016.md`
et `L8_RUNTIME16_REVIEW_ACCEPTABLE_SCOPED_20261016.md`. Ni leur juxtaposition ni
les PASS auteurs ne prouvent la compatibilité de l'ensemble. Sources L2–L6 déjà
acceptées conservées, runtime16 et SIM851 combinés sans retouche, package.json
du main conservé avec les commandes de maintenance existantes. Les deux anciennes
versions package486B ne doivent pas écraser ce fichier. Aucun conflit code partagé
ignoré : cli/client/domain/engine proviennent explicitement du runtime16.

Un seul nouveau paquet sous les inputs de l'owner, livré par reçu helper piné.
Le ledger8943882B/b5c9 est une projection locale parent distincte du helper8MiB,
en lecture seule, avec un second reçu ; aucun split/parse/résérialisation/lien ou
modification du helper. Les anciens paquets, preuves, caches et DB restent intacts.
La provenance vers des worktrees/anciensrapports n'est pas une permission d'accès.

## Étape initiale : accès et plan statique uniquement

Lire le présent scope, les deux décisions, les contrats approuvés et le manifeste
complets. Hasher tous les payloads physiques, le ledger séparé readonly et les
deux reçus ; ACK rôle/permissions/conditions et accès effectif, puis HOLD. Après
approbation de cet ACK et GO statique distinct du parent :

- Inventaire exact du delta combiné et des tests existants, couverture/dépendances
  §17.1/§17.2/§17.3, G2/G4/shadow versus G6/native ; distinguer couvert/manquant.
- Décrire les vrais chemins publics L2→L3/L4→L5→L6/L8 et L5→SIM : il faut tester
  les interfaces réelles, pas une classe simulée rebaptisée « interop ».
- Proposer quelques contraires croisés propres : besoin/publication, contexte
  gelé, identité/fencing/arrêt/reprise, event-unlock et projection CLI/replay.
  Préserver les règles acquises L5 S/C/N/T et L8 .immediate()/image d'autorité.
- Audit statique des effets des tests envisagés : chemins de DB/TEMP/registry,
  création/fermeture/conservation, hooks de cleanup, vars enfant, appels externes
  et garde FF8_ENSEMBLE_SOURCE. Lister toute suppression potentielle avant GO.
  L'absence d'une variable n'autorise pas à effacer sa valeur, même vide.
- Proposer commande(s), bornes cas/unités/temps/DB/ports et expectations dérivées
  indépendamment avant exécution. Réutiliser les régressions existantes ; éviter
  la régénération d'une grande suite ou une nouvelle review identique.

Sorties nouvelles seulement dans `CROSSQA-20261016/` sous l'OWN de l'owner :
PLAN.md/manifest/inventaire, propositions de tests isolés si nécessaires. Pas de
modification du paquet ou des fichiers centraux. Tests nouveaux proposés dans
ce dossier, pas appliqués au main ni aux sources gelées. Ne pas lancer leurs
imports, TSC, test, build, probe, benchmark, CLI, générateur ou SQLite à ce stade.
Aucune création de DB/port/TEMPruntime. Un plan n'est pas un GO d'exécution.

## Gates ultérieures réservées au parent

Le parent approuve le plan, les effets/limites, les inputs réellement lus et le
créneau ; un GO dynamique distinct précisera les commandes. Les DB neuves doivent
être possédées, fermées/retournées/raw-hashées et conservées ; aucune DB ancienne
(42L7/636L8) n'est un input. Pas de SQL direct, cleanup, Tempglob ou désérialisation
de cache outil. FAIL/drift/refus/ambiguïté : HOLD, sans fix/rerun/bypass spontané.

L'owner L8 reste seul auteur des fichiers centraux s'il faut un correctif ; le
parent arbitre et réouvre un cycle approprié, jamais mutation cachée pendant QA.
L9 frais indépendant et intégration/validation finale parent L10 restent requis
selon périmètre. Aucun dispatch scientifique réel, FF8 live/native, IDB, autre
mission/campagne, G6/G7, git/commit/remote push, installation/configuration globale,
achat/changement de modèle, sous-agent ou recherche dans d'autres sessions.
Pas ctx_search/shared-index/inbox/board/team_results comme corpus de travail.

Conserver les limites déclarées NONBLIND, SimStore standalone, authenticité
d'origine, Proxy, frozen cycleKnowledge, SIM≠L5 packing et fixture-only/native.
Ne pas appeler « vraie interop FF8/Ensemble » une fixture fake-ports. Le bilan
doit séparer implémenté/offline/expérimental/bloqué/native non effectué.
