# L7 namespace/replan — arbitrages A/B ratifiés sous conditions

Même task task_mv9wspa8_0058_bz8uxd, auteur fresh Astra/max
ses_ebf0aef70ffetlgGafSSmiNaPI. Plan/repros reçus,379pins/source494b intacts,
aucun code/test exécuté. **Arbitrages A et B approuvés**, puis lecture/hash/ACK
de cette décision et **message final RED/WRITE/CIBLÉS distinct** avant application.
Pas acceptation du futur code. L8full fini/libéré, pas encore intégré/revu.

## A — archive planDocument réelle, evidence v2 et compatibilité fermée

Parent relit le DTO et planner752–773 : MissionPlan contient des descripteurs
d'unités et TOUS prérequis, pas les WorkUnit complets. Le fingerprint réel est
fingerprint(planContent), hors son seul champ fingerprint. L'archivev1 ne suffit
pas à prouver la fermeture de tout l'univers des prérequis, notamment sans besoin.

**SimPrerequisiteEvidence version2 ajoute planDocument: PlannerResult['plan']**,
copie détachée du VRAI result.plan déjà vérifié par le projecteur. Pas document
reconstruit depuis copies SIM mutables, nouvelle extraction, hash WorkUnit inventé
ou appel planner/clustering dans la boucle. Les valeurs unitFingerprints restent
les digests originaux opaques fournis ; ne pas prétendre les recalculer depuis les
descripteurs amputés. Les jonctions effectivement disponibles doivent être vérifiées.

- Fingerprint exact du planDocument hors fingerprint, égal à son champ et aux
  evidence/source.planFingerprint. Les autres liens source/evidence/binding existants
  restent opposables. Cohérence de l'archive FOURNIE, jamais authenticité native.
- Bijection sans doublons document.units ↔ clés OWN unitFingerprints ↔ unités SIM,
  y compris deferred/non sélectionnées. Owned/context correspondent à leur descripteur
  archivé sans ajout/retrait ; context-only n'est pas une unité et le partage de
  contexte reste légal. Pas simple regex sur les IDs ni namespace déclaré par caller.
- Bijection des prérequis archivés ↔ source.prerequisites ↔ unités SIM, par ID,
  consumer/producteur exacts et champs structurels existants. Producteur nonnull
  dans l'univers, null légal pour branches qui le permettent. Détecter trous,
  doublons, ajouts et renommages cohérents, y compris export sans requirements.
  Recontrôler les projections structurales du document effectivement exposées
  (planId/mission/revision/policy/selection/decisions/G1/G2/budgets), pas seulement
  une liste de noms ; ne pas inventer des champs absents du descripteur.
  Comparer les vues normalisées réelles du projecteur, pas forcer égalité brute
  de tableaux normalisés/bruts ni S=C ; donnée non liable → escalader, pas rerankerL5.
- requirementById/unresolvedById own-only, domaine rattaché aux IDs archivés. À
  namespace ORIGINAL valide, besoin local absent/hash/champ altéré demeure un échec
  **local de satisfaction** : producteur indépendant progresse, pas throw global,
  besoin original jamais substitué. Vrai manuel source-less sans original reste légal.
- Garder les cas unknown CITÉS par une vraie relation sans imposer artificiellement
  exported-unresolved-provenance. Seule la branche genuinelyuncited d'origine utilise
  SimUnresolvedProvenance **v1**, inchangée. External/unresolved stricts, receipt2/
  fixture-only refusé avant satisfaction et gapL5upstream toujours OPEN.

**Anciennes projections exportées evidencev1 explicitement refusées par le nouveau
lecteur** ; gels/archives intacts, aucun backfill/migration ou downgrade vers manuel
si source/evidence présent invalide ou manquant. Nouvelles projections du projecteur
v2 seulement. Vrai manuel source-less garde ses hypothèses historiques ; aucune
prétention de distinguer l'origine native par seul self-hash. v2incomplet/malformé
doit donner diagnostics fail-closed, pas TypeError non qualifié ou fallback caché.
ProjectionVersion2/ressourcesv2 et provenance unresolvedv1 sont des versions DISTINCTES.

Parent inspecte les100 contrôles : pas assertion positive evidence.version1 repérée,
les cas {version1}/{version2} incomplets et archive manquante doivent toujours être
refusés ; conserver notamment le diagnostic provenance absent déjà testé. Si un
vrai conflit apparaît, STOP au lieu de modifier un ancien test ou le nouveau contrat.

## B — invalidation monotone et adoption active figée

ORDRE637–641 et testhistorique120–125 relus : l'actuelle tentative active peut
finir après partition_adoption sous SON snapshot, pas migration silencieuse.
**Adoption bloque toute NOUVELLE admission/génération de ce run**, sans fencing
supplémentaire du travail courant encore éligible. Pré-admission → STALE ; si l'actif
est ensuite stoppé/cancelled, retrytrue ne fournit pas un nouveau plan.

Pour new_dependency/new_scc/invalidate_knowledge sur unité nonCOMMITTED : marqueur
interne monotone de nouveau-plan, fence actif/STALE pré-admission, aucune publication
de génération invalidée. Admission/enqueue/markReady/tryReserve et callbacks ne
peuvent le blanchir ; stop_confirmed traite TOUJOURS les vraies releases, sans
effacer cette exigence. Pas API implicite de remplacement/boolean caller de fraîcheur.

Une adoption ou cause opérationnelle ultérieure ne rétrograde jamais une invalidation
HARD ; une invalidationhard après adoption retire l'éligibilité courante. L'exception
adoption ne réautorise aucun travail déjà fenced/terminal. Traiter les ordres égaux
au tick selon le journal déterministe : commits déjà acquis gardent leur histoire,
pas réécriture rétroactive. Pas incrément fictif de rework/token/attempt à un retry refusé.
Cancel/crash/heartbeat/lease/ambiguous_stop/new_conflict gardent leurs retries légaux
si AUCUNE exigence de nouveauplan n'a été rencontrée. Occupation/claims jusqu'au vrai
done/stop modélisé ; libération permet aux pairs de progresser, pas état seul.

## Ownership et gates précisément autorisables après ACK

1. src/simulator.ts ; 2. nouveau test/simulator/simulator-identity-replan-regressions.test.ts.
3. test/benchmarks/README.md : **seulement la courte note de compatibilité evidencev2/
   oldv1refusé/manual/provenancev1 et coût de validation**, nécessité de version ratifiée.
   README déjà fourni/hash9833a46a…294d0c, pas besoin d'accès horsOWN ni rewrite perf.

Seule interface publique modifiable : **SimPrerequisiteEvidence** avec v2/planDocument.
Les32 autres types/interfaces exportés restent byte-exacts, ressources/projection/
observation/provenance inchangées. Autres100tests/helpers/oracles/L1–L6/L8/Store/
config/inputs379/gels readonly. Aucune mutation de preuves anciennes.

RED nouveau fichier contre source494b exacte, FAIL attendus qualifiés conservés,
puis correctif/typecheck/100anciens+nouveaux et propres probes. Matrice proposée
ratifiée avec variantes IDs légaux horsarchive, prérequis sans besoin, selected/
deferred/contextes, archivev1refus/altérations/observations, niveaux/champs locaux,
hard+adoption dans les deux ordres/générations2+/opérations intercalées/callbacks/
release/attente occupation, positif cancelretry et adoptionactivefinish. Aucun test
ancien affaibli, pas source comme oracle. Preuves OWN/.tmp/l7-namespace-replan-20261015/.

Valider l'archive en O(taille_document+U+P+appartenancescontexte) à la frontière,
pas scans complets/rehash dans la boucle ou observe. Copies détachées/coûts réels
à documenter, pas near-linear universel/100k allégué. Nouveau full/SQLite requiert
toujours gel et **GO/réservation séparés**, même si L8a libéré son créneau.
Freshreview et gates parent avant intégration ; pas Git/install/sous-agent/inbox/
réseau/LLM/dispatch réel/IDA/live/delete. Nouvelle nécessité ou défaut → parent.
