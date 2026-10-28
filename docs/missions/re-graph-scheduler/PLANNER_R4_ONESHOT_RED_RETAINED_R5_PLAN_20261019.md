# R4 : tests verts mais gate rouge conservée ; plan R5 sans relance

Vsource `result_mvfayrfb_008j_0iadqe` acceptée/après parent30pins, taskreviewclose.
Parent selfchecks exécutés :38cas capture (19positifs/17fatals attendus/2footerfails)
et13contrôles parseur verts ; receiptb20a1cbb2a84da01f14f900ccc71de84a55dc87a31e0651130f3a8e16b61d1ce.
Ces selfchecks utilisaient `bun run` pourcapture, pas encore `bun test`.

Adjudication externe exacte51c203bf6df61e1624f883cf97aa81c3353f27d9d2c64566e0ff9353f7ca6817,
32pins/3inventaires revus, unique essai parent :
- TSC candidat exit0/4513ms.
- Baseline puis candidat : chacun139pass/14726assertions/2files/0fail/0skip,
  exit0, durées31459/30306ms.
- **GateROUGE exit2**, receipt88b85430d591236c7d75249e2ece1215c0c2eb93487927e97c907562dcb979c5.
  Parent a conservé tout, release concordante/leaseintact/runnerterminé. Ni
  intégration main, repinS1 ou qualification FULL de l'extraction.

Trois constats offline, sans relancer un producteur :
1. Traces591905245/591905352B,1384lignes chacune, maxligne200224496B. Lecture
   entière en string dépasse la limite V8 ; lecteurs/hashes/compare doivent streamer.
2. Deux footers indépendants absents sous `bun test` : hookprocess.exit testé en
   CLI n'est pas une preuve de finalisation du runner test. Aucunfooter reconstruit.
3. Rawbytesdiff107B. Diagnostic strict trouve107préfixes Error.sourceURL parbranche,
   tous dans Errornodes ; seule leur racine ownedbaseline/candidate diffère.
   Sous cette substitution diagnostique les autres591892191B ont même hash
   3e648341aa4e9fb5279af0300274e79e7aebd8278145eb6cefb9fff4a775b63a.
   **PAS qualification/waiver** et aucune normalisation de chemins autorisée au futur oracle.

PlanR5 demandé au même writer, pascodeGO :10pins165290B/
5dd908775258f039a44d36c7d38aee2c79320e07c34471d6f3dc26858bf680c6, refSolxhigh
revérifié. Direction : parsing/compare bornés streaming ; finalisation privée
idempotente avec hookafterAll dans Bun test et selfchecks correspondants ; deux
branches séquentielles au MÊMEpathname owned, ancienactive tree renommé/archivé
avant freshactivecandidate, aucune perte/lien/cache. Ainsi Error.sourceURL reste
exact sans ignorer metadata. Snapshots/phases/guards/scientifictestbodies inchangés.

Nouvelle décision d'architecture au parent avant toute écritureR5, freshV et nouveaux
selfchecks avant autre oncegate. Pas de retry automatique. Tousrouges/gels/traces
conservés. 2b1heap reste seul acquis runtime borné précédent, aucun natif/full44.
