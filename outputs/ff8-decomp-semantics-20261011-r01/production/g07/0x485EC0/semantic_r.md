# 0x485EC0 — contrat sémantique final réconcilié R

## Verdict, périmètre et provenance

**Nom mécanique proposé : `BattleSlot_ProcessAndClearTwoStoredIds`. Confiance mécanique : CERTAIN** (deux octets, appel conditionnel, effacement après retour). **Confiance métier (IDs d’objets stashed / refund) : LIKELY.** Nom métier admissible non promu : `BattleItem_RefundStashedItems`.

Rôle : à partir d’un index DWORD non borné, former l’adresse `0x01D27BC8 + (index * 0xD0)` modulo 2^32, puis pour `i ∈ {0,1}` lire l’octet `[adresse+i]`. Si non nul, appeler `0x486B40(id_zero_étendu, 0)` en cdecl et écrire 0 sur le même octet après le retour. Si nul, ni appel ni store explicite. Ce n’est pas un simple enumerateur, ni une preuve autonome d’ajout/retrait de quantité.

Deux supports distincts du nom mécanique, indépendants des labels IDA : (1) LEA/SHL natives + disp32 `C8 7B D2 01` = `0x01D27BC8` = base de slot `0x01D27B10 + 0xB8` (layout gelé K:29–30) ; (2) `TEST AL` / `JZ` puis `AND EAX,0xFF` / `PUSH 0` / `PUSH EAX` / `CALL` / `ADD ESP,8` / `MOV BYTE [EDI+ESI],0` avec `ESI` 0 puis 1. Le mot « BattleSlot » est mécanique+layout ; « Stored/Stashed IDs » et refund restent LIKELY : le corps de `0x486B40` n’est pas dans ce gel.

Entrées exclusivement lues dans `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g07/0x485EC0/semantic/` : manifest, A/B, common-compaction, packet original, native-manifest, native-metadata, native-asm-001, native-bytes-001. Aucun autre volet/output/historique/index/service natif consulté pour un verdict antérieur. Les copies `outputs/.../semantic_{a,b}.md` n’ont pas servi de source d’arbitrage.

- A : session `ses_ed3c43c23ffeGXc23R2jVFnPa8`, tâche `task_mv44rn5e_0085_988urr`, OpenAI `gpt-6.1-sol`, variante **medium** ; SHA256 déclaré `604307c111bc65ac803d3e13df02e9701ae066454524fb1759dfc4d5f9c4daef`.
- B : session distincte `ses_ed3c4392dffebBAiIbKF7vr5E8`, tâche `task_mv44rn5e_0086_5flndn`, même modèle/variante ; SHA256 déclaré `af254406e001e93f3c90e190118dce3e953c45d3afe5630ea30b839dd455a94c`.
- Gel packet : `50a28e8cec513ad24cf73574d698fa89d1877ea254fe333b0b6d761db3c711af` ; compaction : `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Concordance manifest R / native-manifest / déclarations A et B. Slices asm `a6c6d4681f1b79ff6a36f3cb10d7cdaf556f45168baaa2a1ac0e51992b40c886`, bytes `aa8fe56da9eb21af2ffd9f37dd32235bd197f4ad75412611a2047dcad4b1bc2d`, metadata `452ad52a60954aa846842891393d96d72faa450f43dbc53ecb1471d4de61b5ac`, native-manifest `98f34b56b18104b7b5ec197e691c36a6423d7623824285f6f42a45a0b12dd151`.
- Provenance native : x86 32 bits, EXE SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`, IDB déclaré `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`.
- Auteurs distincts et hashes déclarés présents et cohérents entre eux. **Pas de recalcul cryptographique local** : hashing fichier brut hors rôle ; le parent conserve le contrôle natif §5.6. Ce rapport n’atteste pas un hash check exécuté.
- Couverture : chunk unique `[0x485EC0,0x485EFB)`, 59 octets, 23 instructions, cinq blocs CFG, deux successeurs du test zéro et de la boucle, un `RET`. Hex packet = bytes verbatim. Aucune review déposée dans ce jeu R.

Note de provenance A/B : `variant=medium` dans le manifest R, pas high. Indépendance de sessions conservée ; diversité de raisonnement non prouvée par le seul accord de modèle. Les commentaires/labels embarqués du packet (`Refund`, `add`/`remove`, `AdjustCount`, cap 100, etc.) ne sont pas des preuves.

## Réconciliation A/B, y compris erreurs communes

| Sujet | A / B | Décision par preuve native |
|---|---|---|
| Nom mécanique | A `BattleSlot_ProcessAndClearTwoStoredIds` ; B `BattleSlot_ProcessAndClearStashedIds` | **A retenu pour le nom** : le bound 2 est natif (`CMP ESI,2` / `JL`). « Stashed » de B est LIKELY contextuel, pas un opcode. Combinaison descriptive : deux octets stockés, traités puis effacés. |
| Refund / items | Accord LIKELY `BattleItem_RefundStashedItems` ; helper hors gel | Retenu LIKELY, **non promu par accord A=B**. `(id,0)` ne fixe pas la polarité add/remove. Commentaires packet se contredisent (`add` vs `remove_one`) : CONFLICT documentaire ignoré. |
| Stride / base | Accord 0xD0 et `0x01D27BC8` = +0xB8 | Recalcul : `LEA ECX,[EAX+EAX*2]` → 3x ; `LEA EDX,[EAX+ECX*4]` → 13x ; `SHL EDX,4` → 0xD0·x modulo 2^32. `8D BA C8 7B D2 01` → EDI = EDX + `0x01D27BC8`. Pas stride 0x1D0. |
| Contrat helper visible | Accord cdecl `(id8 zéro-étendu, 0)` → `0x486B40` | Rel32 : next-IP `0x485EEB` + `0x00000C55` = `0x486B40`. `6A 00` puis `50` = args (EAX, 0). `ADD ESP,8`. Corps, cap, destination, persistance : **UNCERTAIN**. |
| Effacement | Accord store BYTE 0 après CALL, seulement si l’octet lu était non nul | Retenu. Pas de `TEST EAX` avant le store : un code d’échec hypothetique du helper n’empêche pas l’effacement. Si le helper ne revient pas, pas de store. |
| Ordre / snapshot | Accord : pas de prefetch des deux IDs | Retenu. Le second octet est relu après le premier traitement ; mutation helper du +0xB9 possible et non exclue. |
| EAX / AL / AX | A : AL=0 si 2e octet nul, hauts bits = état antérieur. B : cas zéro-appel `EAX = arg & 0xFFFFFF00` | **B plus exact, compatible avec A.** `MOV AL` ne touche que [7:0]. `AND EAX,0xFF` seulement sur branche non nulle. 2e octet non nul → EAX = résidu du 2e CALL. 2e octet nul → AL=0, [31:8] = EAX d’avant cette lecture. Aucun appel → `EAX = index_entrée & 0xFFFFFF00`. Pas de retour booléen/compteur. Type `void` = usage raisonnable, **UNCERTAIN** comme signature. |
| Signedness boucle | Accord : `JL` signé, ESI 0/1/2 sans ambiguïté | Retenu. IDs via `AND EAX,0xFF`, jamais `MOVSX`. Index d’entrée : arithmétique modulo 2^32, aucune signedness métier. |
| Xrefs | Accord 4 sites code ; B scinde cleanup vs autres | Retenu les quatre : `0x485835`∈`0x485610`, `0x486903`∈`0x4868C0`, `0x486CB7`∈`0x486C70`, `0x493A84`∈`0x493840`. K:57–58 / K:49–51 = contexte d’appel, pas preuve du helper. Aucun consommateur de retour exporté. |
| +0xB9 flag | Accord : hypothèse layout, usage ici = 2e octet ID/sentinelle | Retenu. Accès BYTE stride 1, pas WORD ni booléen natif. |

Erreur commune A=B écartée : l’accord « refund d’items » n’est pas CERTAIN. Erreur commune évitée par les deux auteurs : ne pas promouvoir les labels CAT:36 « queue-clear » / CAT:324 « magic-deduction » (K:62) contre les bytes. Aucun désaccord mécanique non tranché. Polarité du zéro helper, producteurs de +B8/+B9, bornes d’index et consommation de EAX restent **UNCERTAIN**, pas un CONFLICT résiduel entre A et B.

## Contrat d’entrée, stockage et sortie

- Entrée : DWORD `[ESP_entrée+4]` (`8B 44 24 04` @ `0x485EC0`). Index de ligne non validé ; pas de test négatif, pas de plafond. Adresse = `0x01D27BC8 + 0xD0·index` (wrap 32-bit). Interprétation battle-slot : layout K:29–30 + arithmétique, pas le nom IDA.
- Convention cible compatible cdecl : `RET` simple (`C3`), argument non dépilé par la cible. Prologue `PUSH ESI` / `XOR ESI,ESI` / `PUSH EDI` ; épilogue `POP EDI` / `POP ESI`. EBX/EBP non touchés directement. EAX/ECX/EDX/flags volatils. La boucle suppose que `0x486B40` préserve ESI/EDI ; ce n’est pas prouvé ici.
- Helper : deux DWORD empilés droite-à-gauche, nettoyage appelant `ADD ESP,8`. Premier argument = octet lu zéro-étendu 0..255 ; second = littéral 0. Nombre d’appels : 0, 1 ou 2 selon les sentinelles.
- Effets mémoire directs : jusqu’à deux stores BYTE 0 à `slot+0xB8` et `slot+0xB9` (EDI+0 / EDI+1). Pas de store si l’octet lu est 0. Effets de `0x486B40` : **UNCERTAIN** (buffer 32×5 K:31 n’est pas un contrat natif du callee dans cette projection).
- **Résultat sémantique : UNCERTAIN.** Aucune normalisation finale. Cas :
  - 2e octet ≠ 0 : EAX = retour incidental du second `0x486B40` ;
  - 2e octet = 0 et 1er ≠ 0 : AL=0, [31:8] = [31:8] du premier helper ;
  - aucun appel : EAX = `index & 0xFFFFFF00`, AX = `index & 0xFF00`, AL=0.
- Pas d’accès x87/SIMD dans le corps ; environnement helper inconnu.

## Déroulement exhaustif (CFG)

Blocs packet : `485EC0→485ED7` ; `485ED7→{485EDE,485EF2}` ; `485EDE→485EF2` ; `485EF2→{485ED7,485EF8}` ; `485EF8→∅`.

1. `485EC0–485ED1` : charger l’index, sauver ESI/EDI, ESI=0, former EDI = base+0xB8 du slot.
2. `485ED7–485EDC` : `MOV AL,[EDI+ESI]` ; `TEST AL,AL` ; `JZ 485EF2` (rel8 `74 14` depuis `485EDE`+0x14).
3. `485EDE–485EEE` : `AND EAX,0xFF` ; `PUSH 0` ; `PUSH EAX` ; `CALL 0x486B40` ; `ADD ESP,8` ; `MOV BYTE PTR [EDI+ESI],0`.
4. `485EF2–485EF6` : `INC ESI` ; `CMP ESI,2` ; `JL 485ED7` (rel8 `7C DF` : `485EF8-0x21`). Deux itérations si le helper préserve ESI.
5. `485EF8–485EFA` : restaurer EDI/ESI, `RET`.

Hex contrôlé (59 octets) : `8b442404 56 33f6 57 8d0c40 8d1488 c1e204 8dbac87bd201 8a0437 84c0 7414 25ff000000 6a00 50 e8550c0000 83c408 c6043700 46 83fe02 7cdf 5f 5e c3`.

## Preuves ASM/xrefs (retenues)

1. Index/stride/base : `485EC0`, `485EC8`, `485ECB`, `485ECE`, `485ED1` ; bytes `8D BA C8 7B D2 01`.
2. Filtre octet / unsigned : `485ED7`, `485EDA`, `485EDC`, `485EDE`.
3. Appel `(id,0)` et destination : `485EE3–485EEB` ; E8 `55 0C 00 00`.
4. Consommation : `485EEE` `C6 04 37 00`.
5. Deux passes et ABI locale : `485EC5`, `485EF2–485EFA`.
6. Xrefs code packet:56–80, sans usage de retour observé.

## Questions ouvertes (UNCERTAIN — gates parent)

1. Gel borné de `0x486B40` : polarité du second argument 0, quantité, plafond, destination, persistance SG_ITEM.
2. Producteurs de `+0xB8/+0xB9` et conditions d’écriture ; IDs dupliqués acceptés ici.
3. Consommateurs de AL/AX/EAX chez les quatre appelants.
4. Bornes d’index réellement imposées par les appelants ; wrap 32-bit hors zone.
5. Mutation du second octet par le helper entre les deux lectures.

Aucune promotion, §5.6 finale, mutation IDB/Git/registre, compilation, live ou validation expérimentale. Le parent conserve les gates natifs et le hash check d’intégration.
