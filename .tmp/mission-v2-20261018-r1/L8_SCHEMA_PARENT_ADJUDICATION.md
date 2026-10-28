# L8 schémas — CORRIGE documentaire, lot en HOLD

**CORRIGE_DOCUMENTATION / HOLD_FOUR_FILE_LOT / ONE_CYCLE_CONSUMED.**
Pas d'acceptance ou d'intégration du lot. Aucun deuxième fix automatique.
Les corrections de validation R1/R1bis/R2 sont conformes dans le périmètre
statique revu ; aucun autre défaut de validation identifié. Cela ne certifie
ni toutes les instances ni l'exécution du pipeline/validateur/autorité réelle.

## Évidence et indépendance

Première source : l8-schema-source-r1, tâche task_mvdm2br3_001c_n06f51,
GLMmax natif vérifié ; première review fresh Sol/xhigh task_mvdn0v6f_002e_dz6iwd
rend CORRIGE R1/R1bis/R2. Les4sorties initiales restent byte-identiques à leurs
pins, conservées dans l8-schema-source/outputs. Pas de réécriture de l'histoire.

Delta unique : l8-schema-delta-r1 / ses_eb190d82fffe4qaTVvJufnMT7F,
task_mvdnf0ro_002n_nxb4ya,GLMmax natif vérifié. Correction mécanique parent
entièrement spécifiée, pas de fallback provider/modèle. Incident EPERM de copie
read-only sur nouvelle sortie résolu par l'auteur dans ses fichiers possédés,
pas de modification d'origine ; hashes finaux recoupés par parent.

V delta fresh : l8-schema-delta-review-r1 / ses_eb1775e30ffe9GO3hZFzwbbRUg,
task_mvdoerw1_002v_ah2gg4,Sol/xhigh natif vérifié, distinct des2auteurs et de V1,
aucun fork ; voit delta/originaux/dispositions volontairement. Verdict terminal
CORRIGE documentaire/HOLD,7preuves publiques. Aucune réparation en review.

Parent a directement vérifié les clauses lifecycle/provenance du code, comparé
les arbres en données et relu DESIGN:294-295. Rehash final indépendant32/32,
899999B,manifeste2d66d5975be6c955e35b55b99c4b1d6c6e025fce43ba48fb0a4e945170079a7f.
4sorties delta identiques aux copies review ;4originaux initiaux inchangés.
15origines du premier paquet (dont code/schémas centraux référencés) re-hashées,
aucune dérive observée. Pas de produit, validateur ou instance test exécuté.

## Défaut résiduel D1 — confirmé, non réparé

`l8-schema-delta-r1/outputs/DESIGN.md:294-295` dit :
« les 8 champs de provenance sont des string plain ».

Contre-preuves : lineage.ts:954 énumère7champs string, puis:955 accepte siteRva
null ; semantic-index.ts:64 donne string|null. Les deux nœuds JSON de provenance
contraintes et sitesedges conservent correctement type=[string,null]. La phrase
est donc un mapping documentaire faux qui pourrait faire rejeter null par un
futur encodeur ; ce n'est PAS une régression du schéma candidat actuel.

Formulation correcte conceptuelle (NON appliquée aux candidats) :
**sept champs string ; siteRva string|null ; aucune longueur de transport.**
Ce rapport identifie le correctif à demander, il ne corrige pas DESIGN ni ne
change son hash/manifest. Le cycle1/1 consommé impose HOLD du lot4fichiers.

## Corrections de validation constatées, six ancrages

1. Deux historiques adopted redeviennent boolean sans enumfalse :
   $.proposalEvidence.source.previous.partition.adopted et
   $.proposalEvidence.source.previous.authoritative.partition.adopted.
   lineage.ts:496-502,991-997,1064-1080 autorise le lifecycle historique ;:1037
   concerne le result courant. Les2courants restent enumfalse. Pas de migration.
2. Dix stringsinput seulement ont perdu leurs20min/maxLength : endpoints des
   contraintes/edges et trois hashes de provenance aux deux emplacements.
   lineage.ts:952-955,1041-1045,1053-1058 sépare forme string et readiness/membership ;
   semantic-index.ts:646-656,945-955,1215-1219 conserve les sources négatives.
3. Comparaison indépendante parent et V : exactement37changements,22keywords
   retirés sur12nœuds +15descriptions autorisées ; zéro ajout/autre validation.
4. Wrapperv3,partitionsv1,groupsv1 intacts hors resserrementcourant autorisé ;
   aucun nouveau kernel/context dans groupes, aucune référence/combinator/pattern,
   nullable/optional et KnownInteger/LosslessMetric distincts préservés.
5. Schéma adoption byte-identique12396B/c6c60ab6…dae0e ;14champs,actorHOSTstring
   non-authentifiant,inventoryUNKNOWN,proofs/explicitintention inchangés. Pas de
   quiescence ou autorité déduite d'une forme JSON/d'un digest.
6. MANIFEST delta distingue16+2refs historiques de la seulepreuve auteur actuelle
   9/9,292510B,manifeste98ddf0ba63893f43010b5b525879c638e006c56a9b21865ca20d8f6eca8a8adb.
   Trois hashes non-self exacts, marqueur self-reference explicite, pas faux selfhash.

## Gel delta conservé (non accepté comme lot)

`l8-schema-delta-r1/outputs/`,exactement4fichiers :
- l8-prepared-graph-v3.schema.json,104742B,
  fd4cdd41fa6b60ac39f8d40134fb5d593e37b172c04ec2750190f2e6f2fc47b9.
- l8-partition-adoption-v1.schema.json,12396B,
  c6c60ab6c00f4720d58b893ac806e0e9603ee1eaeab8c49d6343eec0f36dae0e.
- DESIGN.md,20833B,
  27115fdf14aaa3aa39b1b4679a54eae5b6cda488734d1d2bd3009b3f5bc2b0bf.
- MANIFEST.json,11073B,
  0e8f76bfd728728920fa987fe7d5d4ad27624e15d0c62d30410356f18090ecd7.

## Arrêt et frontières

Tranche de relais terminée avec ce HOLD, mission historique non close. Toute
reprise exige une autorisation distincte bornant la correction documentaire,
le nouveau manifeste/gel et sa vérification avant acceptation/intégration.
Pas de seconde correction, nouvel auteur, reviewer ou budget admis automatiquement.

L8 central ownership non arbitré ; aucune modification/câblage des schémas ou
loaders existants. Aucun C3-C5/G5/G6/G7/full44,L9/L10,000c/000d promu ou clos.
Pas de compiler/validateur/import produit/run/test/Job/processus/DB/natifFF8,
IDA/live,power,Git commit/merge/push,registre ou configuration globale modifié.
Budget cross-process NOT_PROVEN ; last-close case6 NOT_ESTABLISHED ; DriverLoss
forcé jamais PASS. Livrables et reçus conservés dans ce scratch non intégré.
