# GO QA1 R2 — offsets/inventaire + envvide positif, pas affaiblissement

Owner/task existants full44-q1-qa1-r1/task_mvdz6yfe_001n_m472ji. R1 readonly
full44-qa1-r1-frozen intacte. Troisoutputs QA seulement, aucunsourceauteur vu,
pascompile/run/validator/produit/DB/OS/git/teamtools/claim/complete.

Source V CORRIGEchar/nativebound/envvide/allocations : conserver les négatifs
existants argv(controls/surrogate/129args/cmd32767) et positifenvvide. Ne pas les
adapter au mauvais code source. Sourcecorrectif R3 indépendant ne t'est pas livré.

FixQA :
1. Baseline lengthfields : argv0@366, premierpinlabel@445 ;362/441 sont counters.
2. LongpathASCII259 fixturecoordonnée : trois lengthfields@278/613/939. Offsets
   suivants changent ; pas 362/441 ni constantesbaseline réutilisées ici.
   Record1603/control1659 restent les bons totaux, pas changementgolden/layout.
3. Pinsecondp2/empty : prefixlength@537,chars@541,pas533/537. Totaux944/947
   inchangés. Corriger assertions T12-pg.ao/.plo,p2.lo/.c0,zb.lo/.c0 et docs.
4. InventaireR1 développé statiquement parV =621, T01..12:
   46+7+51+20+18+20+54+19+63+61+42+220. PAS336. Recalculer après le positif
   ajouté ci-dessous ; distinguer sourcecount et exécution. Ne pas fixer le
   compteur runtime pour le faire égaler une phrase documentaire.
5. Ajouter positifTryBuild emptyenv+emptyallowlist depuis GoldenInput : block
   EXACT2NUL,listsvides,record838/control894 (baseline862moins14envbyteset10
   allowednamebytes,payloads56inchangés),success/None. C'estdata-only incomplet
   inventairehost, pas permissionrun. Oracle indépendantciblé, pas fakehashgolden
   inchangé quand la fixture a changé. PrimitiveT05-a01 est conservée.

Pas nouveau testheavy64MiB/GC/performance/clock pourprétendrepreuvealloc : le
bornage est audité statiquement dans sourceR3, les petitsnégatifs ne le prouvent
pas. Aucune instrumentation produit uniquementpourQA. API_R1/R2/R3 etP8props
inchangés. Garder les autresassertions/oracles etcrypto.NETstandard/Consolecap.

QA_PLAN/MANIFESTcorrigés hashes/tailles/rehash15pins+supplément. RetourNATIFR2
avec inventairestatique justifié, delta/limites. VdeltaFRESHcomposé ensuitesource+
QA avant compile/run parent. Aucune assertion nouvelle déclarée exécutée.
