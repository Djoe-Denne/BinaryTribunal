# Sémantique 0x486DC0 @ 0x486DC0 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le mien) : retourner zéro si le premier appel opaque produit exactement EAX=255, sinon rappeler la seconde cible jusqu’à ce que l’octet à `0x01D27B90 + 208*((EAX & 255) % 3)` ait son bit 0 clair, puis retourner le masque correspondant.
- Confiance : LIKELY — numérique établi ; interprétation native des appels et équivalence des hooks conditionnelles.
- Nom catalogue : non consulté, donc aucune confirmation métier ; confirme seulement la proposition documentaire `numeric_486DC0_FFOrRetryByteBit0ClearMask3`, redérivée du test entier et de la boucle indexée, sans attribution RNG ou métier.
- Désaccords avec A (0–n, chacun un EA + opcode) : aucun. A et V concordent sur rôle numérique, nom documentaire et confiance ; aucune correction factuelle.
- Preuves (8) :
  1. Les octets contigus couvrent les 19 EA de `[0x486DC0,0x486DFE)`, 62 octets, quatre blocs ; SHA-256 brut recalculé : `c66ec4b8841f307492c5b59346181b61803dd7a8183f8bd31608bbae6a82d911`. Les six hashes d’entrée correspondent au manifeste.
  2. `0x486DC0 E8` cible `0x4860A0` ; `0x486DC5 3D FF000000` compare EAX entier, `0x486DCA 75 04` branche sur inégalité. `0x486DCC 66 33 C0` ne remet à zéro qu’AX, mais l’égalité exacte garantit la moitié haute nulle : `0x486DCF C3` retourne zéro, contrairement au cas EAX=`0x000100FF`.
  3. `0x486DD0 E8` cible `0x48F020` ; `0x486DD5 AND EAX,255`, `0x486DDA MOV ECX,3`, `0x486DDF CDQ`, `0x486DE0 IDIV ECX` donnent un reste signé dans 0..2, sans exception de division locale. Aucun RNG, retour AL-only ou uniformité n’est prouvé.
  4. `0x486DE2 MOV ECX,EDX`, les LEA `0x486DE4/0x486DE7` et `0x486DEA SHL EAX,4` donnent ECX=i, EDX=3*i et EAX=208*i. Adresses : `0x01D27B90`, `0x01D27C60`, `0x01D27D30` ; aucun type de structure inféré.
  5. `0x486DED F6 80 907BD201 01` est une seule lecture BYTE, masque 1 ; `0x486DF4 75 DA` revient à `0x486DD0` si SET. Chaque tentative rappelle la cible puis relit la RAM, sans réappeler la première cible. Retry avec EAX=208*i/ECX=i/EDX=3*i ; terminaison non garantie.
  6. `0x486DF6 MOV EAX,1`, `0x486DFB SHL EAX,CL`, `0x486DFD RET` retournent EAX entier 1, 2 ou 4 : ensemble conditionnel des retours normaux `{0,1,2,4}`. CFG : entrée → zéro ou boucle ; boucle → elle-même ou masque ; deux sorties RET.
  7. Les déplacements encodés des 9 CALL et 3 JMP entrants convergent vers la racine, depuis huit racines. `0x4838F7 8B D0`, après CALL à `0x4838F2`, consomme EAX entier. Les autres fenêtres ne prouvent pas tous les usages ni la préparation des arguments ; les voisins des JMP ne sont pas du fallthrough exécuté. La xref DATA anormale n’encode aucune seconde lecture à `0x486DED`.
  8. Aucun PUSH/argument de pile explicite ; frame nul et sorties C3 ne prouvent aucun prototype ou ABI. Le C autorisé conserve les sept GPR hors ESP et l’ordre appels/lecture dans son modèle conditionnel ; flags, ESP, PC et pile physique ne sont pas couverts. Leur irrélevance reste UNPROVEN, comme l’adéquation des hooks, la RAM valide, le stockage privé disjoint et les cadres normalement équilibrés. Aucune preuve de backend compilé/runtime.
- Questions ouvertes : ABI et entrées cachées des deux cibles, identité des octets, pertinence native des hooks, contexte complet des callers, terminaison et distribution. Aucune promotion métier ou native déduite de cette acceptation numérique.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `BattleTarget_GetRandomPartyMask` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 19 EA / 62 octets, SHA-256 `c66ec4b8841f307492c5b59346181b61803dd7a8183f8bd31608bbae6a82d911`.
- C relu exact : `431f10fad968ae3862455eafb14c90ef49613c56134132af9902d9bf0adf9ccc` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x486dc0/native-2026-10-10/parent_drain_gate.json`, SHA `084d4cce6a326b5158ca49a0d9c766e8c95d9b7e40d2397b5c1fc1e5a083e912`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_ed9f34280ffeGxbPnHSqMYMYHs` ; V `ses_ed9eda09bffeTR5AjLjNdCr85O`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:25.357294+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x486dc0/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `247cc881704298381baf3a6833b89406c4ce35d7370b8b805f028fe648f0b453`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: LEA3i then LEA13i then SHL4=208i (0xD0), not232. Three byte addresses1D27B90/1D27C60/1D27D30.
- polarity: EAX==255 exact DWORD comparison; XOR AX safe only on this equality path. AND255/CDQ/signedIDIV3 yields0..2. JNZ retry when BYTEbit1 SET, not CLEAR.
- return: Normal full EAX0 or1<<i={1,2,4}; no termination guarantee, RNG identity or uniformity proof.
- name: Catalogue RandomPartyMask NOT_CONFIRMED; exactFF exit and retry-bytebit/stride208 give numeric provisional role.
- extra: Native incoming12CODE=9CALL+3JMP/8roots, not12calls. CurrentGPR hooks documentary/conditional, flagsESPphysicalstack irrelevant UNPROVEN; no compiledbackend/native interface certificate.
