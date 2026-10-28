# re-ff8 — directives locales de campagne

Lire `AGENT.md` et les protocoles applicables avant travail RE. L'ASM natif est
la source de vérité ; aucune promotion sur la seule prose d'un worker.

## Pool battle-static-discovery — avenant utilisateur 2026-10-10

- **12 agents de campagne au total : 1 superviseur + au plus 11 workers**.
  Le chat racine extérieur n'est pas un treizième agent de campagne.
- Le superviseur seul délègue. Les feuilles ne créent aucun sous-agent.
- Appliquer `docs/tech/investigation/battle-static-discovery/POLICY_campaign-pool-2026-10-10.md`
  et sa file JSON ; cette règle supersède les anciens plafonds 3/5 et la cadence
  par batch. Recycler immédiatement tout slot libéré si une tâche est READY et
  autorisée. Ne pas remplir artificiellement les slots ni sauter les dépendances.
- Tous les appels worker portent un override explicite : Flash high pour pack/C
  primaire, Sol high pour reviews/sémantique/contrôles/R. Un échec Flash technique,
  refus ou résultat incomplet inutilisable autorise **une seule** tentative de
  remplacement Sol high, même rôle/inputs, nouvelle session possédée et provenance
  conservée. Pas de fallback solo. Un défaut C de review suit le protocole de fix.
- Les slots sont recyclés, **pas les contextes aveugles** : A, V, B et auteurs C
  indépendants sont disjoints. Pas de reprise d'une session enfant étrangère.
- Vérifier le `Model.Ref` natif de chaque session créée avant d'étendre le pool :
  ID sans suffixe `#high`, champ `variant=high`. Une chaîne d'override ne prouve
  pas que le harness l'a interprétée ; jamais accepter `variant=default`
  silencieusement ni changer de harness sans autorisation en cas d'incompatibilité.
- Migration explicitement autorisée le 2026-10-10 : délégation par
  `functions.subagent` natif seulement, aucune nouvelle équipe Ensemble.
  Les six anciennes sessions Ensemble failed/idle sont historiques, sans slot
  occupé ; leurs receipts restent conservés. Override `provider/model#high`
  à l'appel, readback API `Model.Ref={providerID,id,variant:high}` obligatoire,
  ID sans suffixe, y compris pour le superviseur. Le canary ne vaut pas clôture RE.
  Setup validé reste `awaiting_background_GO`, dispatch interdit avant la
  CONTINUATION background explicite du parent ; aucun changement global/config.
- §5.6, écritures IDB, sauvegarde/readback et commits restent réservés au
  superviseur et sérialisés. Les workers ne modifient ni IDB, ni git, ni registre.
- Ce setup ne lance aucune campagne. Activation seulement sur GO long du parent.
  Aucun suspend/veille/réarmement/action d'alimentation n'est autorisé.
- L'adaptatif est limité aux six EA du pilote. Après bilan, pas d'extension
  adaptative automatique ; la suite éventuelle conserve le canon enregistré.

## Steering explicite utilisation continue — 2026-10-10

- `.tmp/campaign-utilization-steering-2026-10-10.json` : cible soutenue **12
  agents actifs utiles = 1 superviseur + 11 workers**, non plafond seulement.
- Frontière de toute la campagne du PLAN, rendu puis battle loop, réserveREADY≥4,
  recharge immédiate callback/échec. Anti-doublon EA/famille/fichier, réutiliser
  les C existants, sinon dual-generation/réconciliation canon hors pilote.
- Adaptatif exclusivement P1–P6. Sessions failed/dormantes/slotsréservés jamais
  actifs ; seules exceptions sous-effectif : épuisement réel ou surcharge
  simultanée ZAI ET OpenAI prouvée. Autre obstacle précis doit être déclaré,
  pas transformé en excuse autorisée. Un provider saturé n'arrête pas l'autre.
- IDA absent temporairement : continuer offline utile sur gels, pas de push/
  promotion sans native. Harness/high/indépendance/gates parent seuls inchangés.
  Aucun power/veille/réarmement/configglobal/Ensemble nouveau.

<!-- ensemble-project-setup:begin -->
## Futures missions RE et live — Ensemble (accord utilisateur 2026-10-10)

- Cette intégration ne démarre aucune mission et ne migre pas la campagne
  ci-dessus : son harness natif, ses modèles/high, ses gates, sa file et son
  pool restent inchangés. Une mission future distincte nécessite un GO explicite
  et un périmètre sans collision avec les travaux en cours.
- Lire [le guide de mission](docs/tech/RE_MULTI_PROVIDER_MISSIONS.md) et charger
  `opencode-ensemble` avant coordination. Pas de taille d'équipe permanente :
  le superviseur choisit une concurrence utile selon dépendances et quotas.
- Conserver `orchestrator` comme plan de contrôle. S'il est déjà la session
  principale/superviseur, ne pas créer un second orchestrator pour la même
  mission. Seul le lead délègue et possède l'intégration/validation finale.
- Les quatre profils `re-decompile-ensemble`, `re-semantic-ensemble`,
  `re-review-ensemble`, `re-reconcile-ensemble` sont dédiés aux sessions Ensemble.
  Ils ne remplacent pas les profils natifs de la campagne historique.
- Découvrir modèles et variantes à la volée ; sélectionner explicitement et
  vérifier le `Model.Ref` effectif. `classify_x86` est un signal non calibré :
  choix motivé du superviseur, jamais dispense des contrôles ASM ou de sûreté.
- Futur RE : 2+1 aveugle par défaut, packs gelés et sessions fresh indépendantes,
  puis réconciliation contre l'ASM. Alternatives seulement explicitement
  autorisées dans le contrat de mission ; aucune modification du pilote actuel.
- Workers : livrables disjoints, aucune délégation, écriture IDB/git/registre ou
  action live. Superviseur : §5.6, IDB/save/readback et intégration sérialisés.
- Distinguer auth, erreur d'entrée, panne et quota avant repli ; budget/replis
  préautorisés, pas d'achat/fallback payant implicite. Un refus n'est pas une
  preuve de saturation globale. Live : GO séparé, gates et bail exclusif.
<!-- ensemble-project-setup:end -->

## QA des futures missions — amendement 2026-10-22

- Convenir de `verification` via `/ensemble-mission config`, puis approbation
  par `start` : light, proportionate par défaut, ou reinforced, avec commandes
  et critères fermés. Un ordre explicite plus exigeant prime sur le défaut :
  M2 RMS applique son §7.1 reinforced et sa condition d'arrêt §8.
- Pas de pipeline QA universel : réutiliser les preuves valides et revalider
  selon l'impact, sans les rendre accessibles aux auteurs aveugles. Les contrôles
  ASM, permissions, 2+1 et gates scientifiques applicables restent obligatoires ;
  signaler les conflits. La QA logicielle RMS statique n'est pas une campagne RE
  par EA ou live. Les campagnes historiques ne sont pas modifiées rétroactivement.
- Toute extension importante d'exigences/harness demande arbitrage ; arrêter
  lorsque les critères convenus sont satisfaits et l'acceptation finale rendue.
