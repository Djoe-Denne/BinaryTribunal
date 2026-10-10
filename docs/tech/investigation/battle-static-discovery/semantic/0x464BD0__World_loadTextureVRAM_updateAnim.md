# Sémantique candidate 0x464BD0 — propagation P3 (MAINTIEN)

- Nature : propagation mécanique déterministe du verdict R réconcilié et du contexte parent post-freeze ; **aucun nouveau vote, aucune nouvelle analyse**. Protocole réel : 1 primaire + V + contrôles obligatoires C-B/SemB + contrôle R non aveugle ; pas l'escalade de routine 2+1.
- Sources : `P3_R/semantic_r.md` (`37c2821f…`), `P3_R/control_adjudication_r.md` (`3f0b1cd7…`), `P3_R/adjudication.json` (`5a8230a9…`), `parent_postfreeze_context.json` (`2dc5ec92…`).
- Verdict R : **MAINTIEN** du C final et des gels ; aucun C corrigé produit.
- Confiance : **LIKELY numérique**, métier **unknown** ; aucune confiance CERTAIN métier.
- Titre catalogue natif post-freeze **préservé** : `World_loadTextureVRAM_updateAnim` (World, **pas** Battle). Lecture métier World/Texture/VRAM **non certifiée / trop large** sans fausseté établie. Nom numérique proposé : `Parcourir96x1100_8x100_EffacerBitPuis32x1136`, justifié par deux preuves indépendantes : strides/bornes (`0x464D04 ADD ESI,1100`, bornes 96/32/8 signées) et porte suivie du NOT/AND/store tardif (`0x464CE8/0x464CEA/0x464CEC`). **Pas de rename IDB** ; §5.6 réservé au parent.
- Destination après gate parent : `0x464BD0__World_loadTextureVRAM_updateAnim.md` (decomp + sémantique) ; écriture réservée au parent.

## Rôle — invariants numériques (maintenus)

1. **Primaire 96 × 1100, groupes 3 × 32, sous-adresses 8 × 100** : `A = 0x1CB6040 + (32*g + j)*1100`, `g = 0..2`, `j = 0..31` ; `S = A + 4 + 100*k`, `k = 0..7`, `b = 1<<k` (SHL x86 `0x464CF5`, compte masqué 1&31). Bornes JL signées : `0x320`/EDI (`0x464CF7`), 32/EBX (`0x464D0A`), adresse finale `0x1CCFCC0` (`0x464D18`/`0x464D22`) ; delta `105600/1100 = 96` bases.
2. **Porte → skip sans clear** : si `[A+0x324] & b == 0` (`0x464BF1 TEST`, `0x464BF7 JZ` → `0x464CF2`), les appels **et** l'effacement sont sautés ; aucun clear hors porte.
3. **Appels opaques répétés → relectures** : aucun cache de prédicats. `[A+0x32C]` retesté (`0x464C39`, `0x464C70`) ; lectures `[esi+edi+0x48]` à `0x464C5F` puis `0x464C8F` avec CALL possible entre les deux (`0x464C7F`) ; les zéros `A+0x330`/`A+0x43C` sont écrits après le CALL `0x464C49` (`0x464C53`, `0x464C59`, dans cet ordre).
4. **Clear tardif sur relecture fraîche de A+0x32C** : `0x464CE0 MOV` → `0x464CE8 NOT ECX` → `0x464CEA AND EAX,ECX` → `0x464CEC MOV [A+0x32C]`, après tous les appels ; read-modify-write DWORD non atomique, sans LOCK ; les autres bits sont préservés relativement à **cette** lecture finale, pas au snapshot d'entrée.
5. **Normalisation signée ≤ 0 → store 1, pas EAX=1** : `0x464C2F JG` / `0x464CD8 JG` portent sur les relectures mémoire `[ESI]` (`0x464C28` / `0x464CD1`), **avant** cleanup, pas sur un retour callee ; valeur nulle **ou négative** → `w32(A,1)` ; le store n'assigne pas EAX.
6. **Secondaire 32 × 1136 conditionnel** : si `[0x1CCFD90] != 0`, `T = 0x1CAD228 + 1136*i`, `i = 0..31` (`0x464D33`, `0x464D8E`, borne `0x464D97`). Deux portes non-zéro `[T+0x464]` (`0x464D38`, via `esi-4`) puis `[T+0x468]` (`0x464D3F`) autorisent une alternative : `[T+0x24]==0` → `0x464F70(L14, T, 0, 0, 256, 256, 2, i, 0, DWORD[T+0x46C])` (`0x464D71`), sinon `0x4653B0(T, i, 0)` (`0x464D85`).
   - **L14 = `0x1CCF874` conditionnel au cadre privé intact** : contenu rechargé du slot privé (`0x464BE6 MOV [ESP+0x14],ESI` → `0x464D51 MOV ECX,[ESP+0x14]`), égal à la dernière base primaire **seulement si** le cadre privé n'est pas altéré ; ce n'est **ni** le curseur avancé `0x1CCFCC0` **ni** l'adresse du slot. Réserve déjà consignée en C-review ; clarification R-only, pas de faute matérielle nouvelle.
   - **Dernier argument = contenu DWORD `[T+0x46C]`** (`0x464D4E MOV EDX,[ESI+4]`, soit `T+0x468+4`), pas une adresse. Pas d'écriture directe de données secondaires ; effets indirects opaques.

## Sortie EAX (32 bits, 5 classes normales)

- Porte globale `[0x1CCFD90] == 0` → EAX = 0 (`0x464D28`).
- Dernière itération : première porte nulle → EAX = 0 (`0x464D38`) ; première non nulle et seconde nulle → EAX = DWORD lu `[T+0x464]` (`0x464D38`) ; deux portes actives → EAX complet laissé par le callee sélectionné, **deux alternatives** `0x464D71` (`0x464F70`) / `0x464D85` (`0x4653B0`).
- Pas de réduction AL/AX, pas de BOOL, compteur ou type métier ; le caller `0x45D288` n'a pas de consommation immédiate d'EAX. Le `LEA 0x464D67` résiduel est suivi du CALL `0x464D71` (dernière définition opaque) et n'ajoute pas de sixième classe RET.

## ABI

- Aucun argument entrant lu ni registre entrant utilisé comme donnée sémantique ; ESP, registres entrants et PC de retour restent mécaniques ; 8 octets de locaux + 4 sauvegardes = profondeur de corps **24** ; RET sans dépilage d'arguments.
- **7 appels vers 4 cibles** (`0x464F70` ×3 : `0x464C23/0x464CBD/0x464D71` ; `0x4653B0` ×2 : `0x464C49/0x464D85` ; `0x465720` : `0x464C7F` ; `0x464DB0` : `0x464CCC`) ; cdecl : 10 args → cleanup **40 octets** ou 3 args → cleanup **12 octets** (`0x464C2A/C4E/C84/CC2/CD3/D76/D8A`) ; `0x464CC2 ADD ESP,40` **sépare les groupes** avant `0x464CCC` ; relectures `[ESI]` placées avant cleanup (`0x464C28`, `0x464CD1`).
- `0x464D18 CMP` signé suivi de `0x464D1E MOV` **préservant les flags** avant `0x464D22 JL` ; shifts comptés masqués &31.

## Contrôles et adjudication R

- Nouveauté matérielle B contre **BOTH** (C final ET C-review, puis A ET V confrontés séparément) : **0 identifiée**. Fautes C final sous contrat : 0 ; fautes code/SemB B : 0. **Pas de preuve d'absence exhaustive d'erreurs** ; couverture structurelle seulement, pas d'énumération exhaustive de chemins.
- Deux clarifications **R-only** qualifiées, sans crédit B ni nouvelle faute : **R01** — borne du cadre privé pour la dernière base `0x1CCF874`, déjà consignée en C-review (domaine, pas défaut) ; **R02** — mention « adresse LEA » résiduelle : `0x464D67 LEA` suivi du `0x464D71 CALL`, pas une sixième source RET (la présenter comme erreur de code serait une fausse alarme).
- Différence C-B = représentation (pile CPU/mémoire explicite vs abstraction C32/pile abstraite), déjà connue/bornée en C-review ; extension de domaine, pas faute matérielle du C final.

## Intégrité, aveuglement, preuves externes

- Intégrité : **8/8** fichiers gelés vérifiés contre le manifest de gel ; fence C vérifiée byte-exacte `b68e7c53ab224fabbd2ec2a69291ccf8db48a96820e3163851127d2debe13b6b` (receipt) ; natif 155 instructions / 465 octets, SHA `1b3684f0cf9b0b2ad705759a997ff01b96f297a366fbe4b1440950e941a8fd65` ; sorties UTF-8, **0 octet NUL**.
- Aveuglement : isolation numérique observée **qualifiée** — exceptions administratives AGENT génériques/héritées + fragment involontaire C-B Context Mode générique (`--compile-timeout`) déclarés ; **pas de certificat strict de contexte total**.
- QMD : requêtes exactes EA/nom **vides**, service **disponible** ; aucune preuve métier par QMD ; GrepAI depuis retro-eng : docs WorldMap texture animation liées mais aucune preuve EA/rôle, non promu ; **aucune convergence de connaissance inventée**.
- Sonde parente : SHA natif réel `b3b11e70ebc10d53006a1b970c69dc5b6146020525185c096ccf9624bf01efc9` ; **pas** de §5.6 final gate ; push/commit IDB en attente (`parent_final_gate_pending = true`).

## Domaine et limites

- RAM ordinaire, accès valides supposés (non prouvés), exécution séquentielle, retours normaux, ABI normale préservant EBX/EBP/ESI/EDI/ESP et cadre privé (hors instructions racine) ; les externes opaques peuvent muter la mémoire ordinaire — relectures et ordre préservés.
- Helpers mémoire du C (`r32`/`w32`/`s32`) = **abstractions externes**, **distinctes des callees natifs** (`sub_464F70`/`sub_4653B0`/`sub_465720`/`sub_464DB0`, prototypes descriptifs observés, pas des prototypes IDA ni des types de retour métier établis) ; pas d'équivalence ISO/compilé/natif/runtime.
- Questions ouvertes : métier, nom catalogue et types ; effets/préconditions opaques et conformité ABI complète ; exceptions/non-retours ; backend mémoire valide, endian, mapping/alignement, types effectifs, bindings EAX ; concurrence/réentrance et sûreté des accès. Statique borné uniquement.


## Gate parent natif 2026-10-10 — clôture numérique bornée

Append IDB réel `set_func_cmt`, tag `[semantic-triple 2026-10-10]` unique1,
préfixe historique préservé (commentaire non-répétable auparavant vide), save
attendu `D:/Modding/ff8/retro-exe/FF8_EN.exe - 9.3.i64` true ; readback exact
SHA `5928092b91ca7cb0a56e5679bb38c9bc6fa9d74d541082476da4342c7ec572b0`.

Les mentions candidate/pending sont historiques, supersédées par ce gate. §5.6 parent PASS : source155insns465bytes SHA1b3684f0cf9b0b2ad705759a997ff01b96f297a366fbe4b1440950e941a8fd65. Sept CALL/quatre callees 464F70/4653B0/465720/464DB0 existent en natif, RETcalleeC3, groupes cdecl10DWORD/40bytes ou3DWORD/12bytes nettoyés, separation464CC2 confirmée. Caller45D288 CODEtype17 unique, no immédiatEAXconsumer. Strides1100/100/1136,96primaires groupes3x32 et8positions,32secondaires. SignedJL/JG, MOV464D1E préserveflagsCMP, SHL1&31. Gatefermée skipcalls ETclear ; lateclearvaluefresh aprèscalls, reloads/ordre des stores vérifiés. Lastprimary1CCF874 commecontenuL14 privé validframe, pasadvanced1CCFCC0 niadressecadre ; dernierargactualDWORDT+46C. EAX32 cinqclasses : globalgate0, lastfirstgate0, firstnonzero/second0→readT+464, bothactive→callee464F70 ou4653B0 fullEAX ; noBOOL/AL-only/count, prologue/RET C3 compatible. Huit gels inchangés, C fence exact SHAb68e7c53ab224fabbd2ec2a69291ccf8db48a96820e3163851127d2debe13b6b. 0défautmatériel inéditB contre BOTH C-review/Cfinal etA/V, représentationpile/domaine déjà bornée ; deuxclarificationsR-only nonattribuéesB. ConfianceLIKELYnumérique, métierWorld/texture/VRAM noncertifié sansfaussetéétablie ; propositiondescriptive justifiéeparstrides/bornes etlateNOTANDstore, aucunrename. Callbacks/modelbackend/types/allcalleeABI/flags/privateframe/concurrency/ISO/compilation/native/runtime equivalence nonvalidés. Isolationnumériqueobservée avecexceptionsadministratives/fragmentContextModegénérique, pascertificatcontexteaveugleabsolu. Probesparent b3b11e70ebc10d53006a1b970c69dc5b6146020525185c096ccf9624bf01efc9 et c6a1db52ed1d3003ab20e06a444985a9815f55040fd374c9a4bd49024cb0758f.
