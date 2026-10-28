# R5-R2 : vrais faults Bun vérifiés ; anciens trous R4 confirmés

DeltaV `result_mvfed4bs_009a_z4n1vp` acceptable statique, 31pins parent revérifiés.
Reviewtask close après adjudication, reviewer arrêté. Aucune gate produit R5 lancée.

## Observations parent du candidat exact

- Streaming : 56 contrôles synthétiques exécutés verts : grammaire/UTF8/fragments/
  shapes/caps/deadline, comparaison des fenêtres précoces et tardives/shortreads/
  queues. Le selfcheck global reste **rouge conservé** : il attendait à tort que
  scanTrace accepte l'ancien R4 incomplet.
- Offline R4 : chacun a 692 BEGIN pour dernier ID701. Neuf IDs manquent :
  471,475,479,483,487,491,495,499,503. Premier refus ligne941 ; aucun footer.
  Le supplément indépendant attend ces refus et confirme hashes intacts,
  RAWcompare jusqu'aux EOF : 565 fenêtres, 564 différentes, 591905245 octets
  alignés et107 nonappariés. **R4 reste rouge, pas de footer reconstruit.**
- Capture exacte sous `bun test`, 5 cas verts : normal footerafterAll ; postseal
  retour et exception originaux avec action unique, append injecté en échec,
  fichiers trace/footer propres strictement inchangés et exitCode remis0 → Bun1
  via erreur HOST dédiée. Accessor et prototype DATA actuellement refusés fatalement,
  sans effet getter et sans altérer le retour producteur.

## Prochaine incompatibilité de domaine, pas waiver

Le test scientifique pinné planner.test.ts505–530 couvre 3IDs*3tables ByEdge
contenant Object.create({[id]:"inherited-invalid-declaration",...}). Les tables
héritées doivent être traitées comme absentes par le produit ; on ne retire pas
ce test pour faire vert. L'encodeur refuse ces prototypes personnalisés : correspondance
statique avec les neuf appels manquants, à couvrir fidèlement au prochain candidat.

Plan R5-R3 demandé au même auteur, **PLAN ONLY**, packet12pins213355B/
0b89b4af263fc30855ec53c71ae9b694eeadce8ab9f639b310cd440b8ff892ce ; Model.Ref
Solxhigh revérifié. Proposition bornée : nouveau kind object:prototype et référence
explicite vers prototype DATA sérialisé ; un seul niveau personnalisé se terminant
sur Object.prototype/null. Pas flatten/normalisation, pas classes/getters/proxies/
fonctions/natifs déguisés. Gate/Reader/comparateur invariants, shape parser fermée.
Arbitrage sourceGO séparé après plan, puis freshV et tests exacts.

Tous gels/rouges/logs conservés. Q2b1 seul acquis heap antérieur distinct ; aucune
intégration main/S1, aucune permission native/full44 ni commit/push/cleanup/config.
