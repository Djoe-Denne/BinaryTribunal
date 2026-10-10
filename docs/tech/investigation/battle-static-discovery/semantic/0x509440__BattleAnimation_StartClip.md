# Sémantique sub_509440 @ 0x509440 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : Prépare les champs d'un état à partir d'un indice WORD signé et d'une valeur indirecte, efface trois WORD d'en-tête puis trois WORD par enregistrement de stride 48, appelle 0x508F90(a0,a1) et restitue son EAX entier.
- Confiance : LIKELY
- Nom catalogue : trop spécifique s'il affirme une identité animation/clip ; confirme seulement la proposition numérique provisoire `sub_509440_InitState_ResetWords_Call508F90`, re-dérivée des stores, de la boucle et de l'appel, sans promotion IDB.
- Désaccords avec A (0–n, chacun un EA + opcode) : Aucun désaccord sémantique constaté.
- Preuves (8) :
  1. Les six entrées du manifeste ont des hashes concordants. Les octets des 49 lignes ASM racine reproduisent les 131 octets et le SHA-256 `ac8c66c1d0e4ab33ac18d3a8d5fb92cf8e8d0f396fcc11593e5ce622708520d7` ; CFG racine complet de six blocs, un chunk.
  2. 0x509445 `MOV BX,[ESP+10h]`, 0x509450 `MOV [EAX],BL`, puis 0x50945A `MOVSX EBX,BX` : le BYTE stocké ne remplace pas l'indice WORD signé. 0x50946A `MOV EBX,[ECX+EBX*4+4]` charge le déplacement ; 0x50946E lit le BYTE à base+déplacement.
  3. 0x509457/460/466 initialisent respectivement BYTE +6=0, WORD +2=1, WORD +4=0. 0x509474 `AND BL,F3h` efface 04h/08h ; 0x50947A `TEST BL,1`, MOV préservant les flags, puis 0x509480 `JZ` : bit0=0 saute la transformation. `SHL CL,1; DEC CL` produit (2*v-1) modulo 256, notamment 0→255.
  4. Ordre observé : W8[a1] avant R32[a0+4], W8[a1+6] avant R32[p0+8], W16[a1+2/+4] avant table, R8[a1+1] avant W8[a1+7], puis 0x509489 `MOV ECX,[ESI]` recharge p2 après les écritures d'état. Captures conservées ; aucune séparation/noalias prouvée.
  5. 0x50948B `XOR EBX,EBX` / 0x50948D `MOV BL,[ECX]` capturent un compteur 0..255 avant les zéros WORD +8/+A/+C. 0x509499 `CMP ESI,EDX` / 0x50949F `JLE` sont signés ; ici sortie seulement pour zéro. Boucle : WORD +18/+16/+14 dans cet ordre, 0x5094AF `ADD ECX,30h` prouve stride 48, puis `DEC ESI; JNZ`, sans reload du compteur. Aucun LEA 3*i / SHL 4 racine.
  6. 0x5094B5/4B6 `PUSH EAX; PUSH EDI` transmettent a1 puis a0 (cdecl droite→gauche) ; 0x5094B7 `CALL 508F90h`, cleanup 8, POP EDI/ESI/EBX et RET. Aucun write EAX après l'appel. Le helper compare les BYTE +6/+7 avec `JB` unsigned et présente des retours locaux EAX=1/0 ; ses effets et prototype restent opaques.
  7. 0x50103E confirme trois slots entrants ; 0x509571/589 et 0x509594/59A transportent le WORD bas EBP et des paires d'adresses. Les cleanups 16 à 0x500EFB/50E42D/512B45 incluent un argument antérieur, non un quatrième argument racine. Graphe `TRUNCATED` : huit arêtes entrantes retenues, pas huit xrefs totales. Les 81 xrefs CODE sont une information du parent, non recomptée dans ce gel.
  8. Le C accepté conserve les largeurs, offsets, captures, ordre et stride observés. Correspondance conditionnelle C32 : RAM ordinaire, objets/adresses valides, aliasing admissible, frame privée et hypothèses ABI/transport GPR/codegen ; pas de certification backend vivant, same-frame ou identité métier. Le prototype opaque du helper n'est pas certifié.
- Questions ouvertes : Contrats/effets transitifs du helper, validité des index et pointeurs, aliasing effectif et identité fonctionnelle. A reste ancrée dans les opcodes ; ces inconnues justifient LIKELY, sans divergence imposant B+R. `AGENT.md` consulté seulement comme exception administrative ; aucune autre source nommée, lecture native supplémentaire ou écriture IDB/git.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `BattleAnimation_StartClip` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 49 EA / 131 octets, SHA-256 `ac8c66c1d0e4ab33ac18d3a8d5fb92cf8e8d0f396fcc11593e5ce622708520d7`.
- C relu exact : `96a7fc1c52eccc596762eed28a2a2c0f1c42afacf26bbc293ab1f741c9e1fb56` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x509440/native-2026-10-10/parent_drain_gate.json`, SHA `e70d955e70a022012dff831e567e54703ad6e5861cf753e2edbe42b705fb6d93`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_ed9a50e44ffee5sA30mHb0tMQH` ; V `ses_ed99c6944ffeBnP04hMg7QXAvW`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:26:59.605538+00:00`, readback exact après SAVE, nom/type inchangés ; état debugger `0→0` inchangé pendant cette opération, RUN non présumé. Receipt `tools/_tmp_semantic_triple/0x509440/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `c86cd347de6edf65c42b5160c8410b832d98715b280b7d8311ab3e8e9558c3f0`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: ADD ECX,0x30 gives48 directly, NOT LEA3i/SHL4 inthisroot. TableDWORDindexstride4, signedWORD index distinctfromstoredlowBYTE.
- polarity: Statebit0 controls(2*v-1) modulo256; signedJLE afterzerextendedBYTEcount/zero valid. ThreeorderedWORDstores per48stride, countdownJNZ no countreload.
- return: FullEAX fromdirectCALL508F90 unchanged byADDESP8/POPs/C3. Root helperreturn opaque, notsourceprototype/metier guarantee.
- name: Animation/clipbusinessidentityNOTCONFIRMED; orderedstate/WORDzeros and directnumericcall proveonly InitState_ResetWords_Call508F90.
- extra: TwoargspushA1thenA0/cleanup8. Native81CODE vs8 retainedincomingedges, graphTRUNCATED, not81verifiedcallers. Captures/reloads andsignedWORD/BYTE distinguished, helper/privateframe/GPRABI/ordinaryRAM validobjects conditional.
