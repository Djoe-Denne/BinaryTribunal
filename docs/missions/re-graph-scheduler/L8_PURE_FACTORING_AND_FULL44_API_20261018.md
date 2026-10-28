# Source frontier — factoring L8 et API full44 pure fixée

## L8 : vrai manque de closure, résolution parent offline

Plan S1 `result_mvdyeet2_000x_jjdkfg` : ACK38pins/1059038B exacts, aucun source
écrit. `graph-transport` dépend de lineage et de ses lectures FS/schema et du
producteur semantic-index ; le planning complet privé de graph-pipeline passe
par graph-store/schema FS/store. Parent a relu ces sites : le manque est réel.
Pas d'import interdit ou faux adaptateur autorisé pour débloquer artificiellement.

S1 `task_mvdy6khz_000q_0ee18w` reste in_progress/HOLD dépendance, son auteur idle ;
pas tâche clôturée sur plan. Extraction distincte `task_mvdyjxje_0014_wq2jrc`,
owner `l8-pure-factoring-author-r1`, session `ses_eb07372fbffe42rT1uV7312rSx`,
scores85/85 → Sol xhigh natif vérifié, politiquev2. Paquet37pins/1052093B,
manifest `41014734c8ba12555458fd5d0213f05fded7c03609cd96be1c4ed1c0415c9c99`.

Décision et paths proposés dans le lot scratch :
`L8_PURE_FACTORING_PARENT_DECISION.md`, `L8_PURE_FACTORING_SCOPE.md`.
Nouveaux codecs purs, anciennes fonctions déplacées une seule fois et reexports/
wrappers compatibles ; pas algorithme/numeric fix/check receipt affaibli.
Plan exact des chemins/imports avant GO source, outputs isolés, V fresh + QA
indépendante, intégration parent puis typecheck/tests ciblés et repin S1.
Pas d'autorisation de modifier les fichiers centraux directement par le worker.

Correction explicite : `readLocalProposalReceipt` est un lookup WeakMap mémoire,
pas une lecture filesystem. L'autorité de cette registry privée reste intacte ;
aucune registration arbitraire ou capacité JSON ne doit apparaître au factoring.

## Full44 : API data-only commune R1, GO source

Plan auteur `result_mvdyffua_0010_omiamb`, ACK9pins/150960B exacts. Parent fixe
les dix escalades dans `FULL44_Q1_API_FIXED_R1.md` du lot scratch et autorise
seulement GenericTargetPlan.cs + DESIGN + MANIFEST isolés, sans exécution worker.

API C#4 et layout canonique communs fixés : argv/env/pins/réservation/roots data,
allowlist explicite, copies défensives, intent SHA256 dérivé sans self-reference.
Env encodeur trie l'input ; argument vide valide ; limites codec UTF16 distinctes
du coût contrôle encodé. Sous-cap8192 proposé NON adopté. TryBuild reçoit les
byte[][] de contrôles supplémentaires, les copie/lie par longueur+SHA et vérifie
canonical bytes + longueurs réelles <=32768. Liste complète du host et autorité
de launch ne sont pas prouvées par ces données. Source pins distincts par label,
digest répété permis ; pin d'image explicite cohérent requis, sans hash OS prétendu.
Q1 5/20/30/55 reste seul, pas temps125s/broker/native/full44.

QA0 plan `result_mvdycjb9_000s_92mec8` n'est pas livraison acceptée. GO des trois
outputs data seulement après corrections écrites
`FULL44_Q1_QA0_PLAN_ADJUDICATION.md`. La fausse piste SHA384 provenait d'une
lecture de «SHA» suivi du digest commençant par384 : l'algorithme réel est SHA256
sur bytes raw INPUT_MANIFEST.json, hex64
`384734b29766a3bc5c99c0e15ba668c4eba6594adb4485265070fa2d6e26c557`.
Parent9pins/150730B exacts ; aucun drift/problème provider ou utilisateur.
Framing/broker/MaxChunk runtime ne deviennent pas des tests exécutables du DTO.
API seule remise à QA1 après receiptQA0, jamais implémentation auteur ; source
test indépendante puis V fresh composé avant gate compile/run parent distincte.

Rien de neuf n'est exécuté/intégré/accepté-source à ce checkpoint. Les 32+107 tests
verts concernent le transport antérieur. Aucun besoin de GO utilisateur de routine,
aucune hausse/config/fallback ; run01/live/FF8/G5–G7 et full44 restent fermés.

## Progression suivante — extraction GO et QA0 R2 reçue

Plan factoring `result_mvdyt1rs_001d_gaw6dg` : parent adopte l'option stricte,
avec extension explicite des seuls candidats `eventlog.ts` et `planner.ts`.
Mapping4nouveaux+7modifiés sous outputs/src, jamais edit principal. GO source
dans `L8_PURE_FACTORING_SOURCE_GO_R1.md` ; une seule classe d'erreur réexportée,
validations déplacées sans producer import, bodies/algos legacy inchangés hors
imports/schema resolution déclarés. Pas nouvelle source acceptée ou exécutée.

QA factoring fresh `l8-pure-factoring-qa-r1`, tâche
`task_mvdyy9ti_001i_4pvgrf`, session `ses_eb0676043ffejja34WI3uTkl4j`, grille60/60
Flashmax natif vérifié. Paquet36pins1085644B, manifest51e1b2c8…04d79d6, sans
implémentation auteur. ACK/plan puis GO pour source test indépendante heap-only.

QA0 full44 R1 a révélé un défaut de donnée : ENV-A16 longueur24 déclarée pour
un bloc de25unités. R1 conservée dans full44-qa0-r1-frozen. R2 candidate
`result_mvdz0kuj_001j_29s7xe` acceptée **partielle DATA_ONLY** après parent3hashs/
9pins exacts et19longueurs littérales vérifiées ; seul entier24→25 et tag de
provenance dans la table encoder, aucune chaîne attendue modifiée. Chronologie
API et dispositions image suffixe.exe/cwd syntaxique documentées sans autorité OS.
Receipt `full44-qa0-r2-parent-adjudication.json` ; tâcheQA0 clôturée, owner arrêté.

QA1 C# source distincte prête : tâche `task_mvdz6yfe_001n_m472ji`, paquet15pins/
215401B, manifest `473432b406b4110ca671dfadcd1fc1cdd6f2b8413d7b32a0a5860aa3f1afc403`.
API seule et oraclesQA0 fournis, sans implémentation. Golden indépendant parent
DATA_ONLY record862B, SHA256
`c404dcf72229ed1a11ce51da433ae5889b8d64059bd3927c63ab6b70f66b39cf` ; encodage
de la recette fixée, pas validation produit. Attente du prochain slot utile,
limite3workers respectée. Source QA puis V fresh composé avant compile/run parent.

## Source factoring reçue — pas encore acceptée

Candidate `result_mvdz9i4e_001o_fza545` :11sources+DESIGN+MANIFEST,13pins/577393B
figés dans `l8-pure-factoring-r1-frozen`. Manifest SHA256
`3d12815b003188c1804877bd2e6d5de22d01622e82bbff9313118c713cc770d6`.
Audit parent indépendant AST/data seulement :93déclarations déplacées et112
définitions historiques rehashées/comparées, seuls3deltas schema/import déclarés ;
closurevaleur16nodes, externals node:util/node:path seulement, aucun producer/DB
interdit. Les263guards du dépôt principal restent exacts, aucun nouveau target
déjà déployé. Convention SHA des déclarations incluant LF terminal vérifiée ;
aucun faux mismatch de hash présenté comme défaut produit.

Receipt `l8-pure-factoring-main-guards-r1.json`, audit
`l8-pure-factoring/PARENT_DELIVERY_AUDIT_R1.json`. Pas checker/compile/test/import
produit. Auteur et task conservés pour fixes éventuels ; Vfresh composé attend la
QA indépendante. S1 toujoursHOLD, aucune acceptation source ou intégration.

Slot libéré recyclé immédiatement vers `full44-q1-qa1-r1`, task
`task_mvdz6yfe_001n_m472ji`, session `ses_eb0610c23ffe205Q2CEZ9KUgZ3`, grille60/65
Flashmax natif vérifié. ACK/plan avant GO source C# ; implémentation auteur absente
du paquet QA1. Aucun run/full44/native/G5–G7 ou widening permis par ces receipts.
