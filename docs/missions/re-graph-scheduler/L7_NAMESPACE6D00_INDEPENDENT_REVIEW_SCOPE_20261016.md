# L7 namespace6d00 — prochaine review fraîche, admission après gel conforme

Review **fresh indépendante NONBLIND Sol/max**, jamais reprendre un auteur ou un
ancien reviewer completed. Source6d00cf29…9716f et nouveautest74f052d4…23327,README
5ed73b73…79e9e forment un candidat NON accepté. Le full1061PASS1SKIP et les hashes
ne sont pas une review. Parent attend encore collecte/conformité finale avant
toute création/admission payante de cette review.

## Entrée/contrat à lire intégralement

Paquet figé fourni explicitement, nativeModel/task/rôle/accès réels puis ACKlecture/
hash et GOreview distinct. Dépendances L1–L6 acceptées/read-only, L5 courant985.
Planarbitrages et correctionmanuelv2 sont exigences parent, pas verdicts sur code.
Comparer toute la source au contrat, pas seulement le diff2guardlignes depuis9c87.
Les3paths source+nouveautest+README sont le livrable à reviewer ; les100anciens
contrôles et32autres déclarations publiques doivent rester byte-exacts.

## Attaques de fermeture archive, sans inventer authenticité

- Evidencev2 archive le VRAI PlannerResult.plan : fingerprint exact du document
  hors son seul champfingerprint ; liens aux autres fingerprints/source/evidence.
  Descripteurs MissionPlan≠WorkUnit complets, unitFingerprints originaux opaques :
  aucune recomposition prétendue de digests depuis des structures amputées.
- Bijections sans doublons document.units ↔ clésOWN unitFingerprints ↔ unitésSIM,
  et prérequis document ↔ source ↔ unitésSIM. Renommage cohérent consommateur/
  producteur/relation/prérequis horsarchive (même IDsyntaxvalide), retrait/ajout/
  trous, absence totale de requirements, selected/deferred/context-only/partage
  légal de contexte, producer=null des branches légales. Vues normalisées réelles,
  pas égalité brute d'ordres ni S=C. Recontrôler les autres vues exposées G1/G2/
  decisions/budgets/policy/revision/selection et index own-only/domaines.
- `source !== undefined` FOURNIE → archivev2 obligatoire ; null/malformé/ancienne
  evidencev1/manquante échouent par diagnostics qualifiés, pas TypeError/fallback.
  Exportv1 reste refusé sans backfill. `projectionVersion2` et resourcesv2 ne sont
  PAS marqueurs d'origine : vrai manuel source-lessv1/v2 reste légal. Suppression
  TOTALE d'origine est indistinguable via les DTO/self-hashes actuels : **limite
  ratifiée**, pas nouvel oracle négatif ni défaut d'authenticité natif à inventer.
- À namespaceORIGINAL correct, requirementlocal absent/hash/champ changé bloque
  seulement son consommateur, laisse producteur indépendant progresser ; original
  connu jamais supprimé/remplacé pour satisfaire. Un vrai manuel sans original
  garde ses hypothèses. Unknown vraimentcité≠genuinelyuncited/provenancev1, external/
  receipt stricts et fixture-onlyniveau2 refusé AVANT satisfaction. Gap L5upstream
  resteOPEN, ne pas le déclarer réparé par leSIM.
- Altérations source/archives/index, prototypes/inheritedkeys/copies/clones/
  projections/observations et callerimmutabilité : ni champdeclared ni selfhash
  n'est autorité. Vérification frontière O(document+U+P+contextes), pas rehash/scans
  complets dans boucle/observe. Qualifier coûts et limites, pas near-linear100k
  universel ou promotion native sur booleans.

## Attaques invalidation monotone, adoption et vrais releases

- new_dependency/new_scc/invalidate_knowledge : obligation nouveauplan HARD demeure
  avantadmission/READY/actif/attente, générations2+, causesopérationnelles ultérieures,
  callbacks, enqueue/markReady/tryReserve/stop_confirmed retrytrue. Ni stop effectif
  ni rollback/pause/replay/changement de politique ne certifie la fraîcheur du plan.
- Adoption interdit FUTURES admissions de ce run, permet à l'actuelle génération
  encore éligible de finir sous son snapshot ; pas migration silencieuse. HARD
  domine adoption/opération dans tous ordres et àticks égaux. Pas restauration
  d'une tentative déjà fenced/terminal, pas réécriture rétroactive de commits acquis.
- Stop/done réels doivent TOUJOURS libérer les vraies occupations/claims ; l'unité
  ne doit pas publier des résultats invalidés. Pairs bloqués par occupation peuvent
  progresser après vraie release, pas fuite ni réutilisation anticipée. Retry refusé
  n'incrémente pas fictivement attempt/rework/budget. Cancel/crash/lease/heartbeat/
  ambiguous_stop/new_conflict sans obligation de nouveauplan gardent retries légaux.
- Contrôler continuité, copies/reprise et déterminisme du journal/heap plutôt que
  réciter les tests auteur. États/privateflags ne doivent pas être blanchis lors
  d'une continuation/observation ou contournés par concurrence de callbacks.

## Validation indépendante bornée et livrable

Après accès effectif et GO : typecheck, **100anciens+31nouveaux ciblés** (septfichiers
simulator/benchmarks explicitement listés par parent) puis propres petites probes
mémoire via APIspubliques ; entrées fixture/helpers permis, pas leur logique comme
oracle. Attentes de ticks/IDs/rôle doivent être redérivées du contrat. Ancien RED
10PASS19FAIL comprenait un oracleinjustifié, nouveaufixtureoptinmalversionné était
setup : qualification fournie, pas19preuves ni premiers121PASS=100anciens.

Pas full/SQLite/100k/benchmark lourd, sourcewrite/testwrite/Git/config/install/
sous-agent/inbox/autressessions/LLM/IDA/live/dispatchréel. Seulement proofdir neuf
parent donné et scripts/logs de probes propres ; mémoireSIM ne vaut pas hostproof.
ProfilPlan refuseécriture/outils → rapport public avec repros inline, pas bypass.
Cheminsabsolusarchivés sont provenance sans droit d'accès. Ledger9MB nontransféré,
aucune extraction/rawreconstruction ; contextefrozenRAW est PARTIAL/quarantaine.

ACCEPTABLE ou BLOCK scoped avec3–8preuves path:line, contre-exemples/contraires
complets minimaux, commandes/codes/vrais comptes/proofpins/limites. Consolider dès
BLOCKcertain, pas campagne sansborne, fauxoracle ou codefixdeconfort. Parent seul
accepte/intègre après verdict recevable/gatescroisées ; pascodecorrecteurpluscher
ni sourcefix implicite. Rien ne clôtureL7global,post-L8QA,L9L10 ou science/native.
