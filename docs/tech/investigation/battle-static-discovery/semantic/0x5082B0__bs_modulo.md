# Sémantique 0x005082B0 @ 0x005082B0 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : Retourne dans EAX le DWORD précédemment capturé à `0x01D999C4`, après avoir augmenté cette globale de `((ARG32 + 3) mod 2³²) & 0xFFFFFFFC`, avec addition finale modulo 2³².
- Confiance : LIKELY (effets numériques établis ; identité métier seulement probable).
- Nom catalogue : confirme uniquement la proposition numérique provisoire `Numeric_5082B0_AdvanceRounded4ReturnPrevious`, re-dérivée des opcodes et des usages callers ; aucun nom IDA/catalogue consulté.
- Désaccords avec A (0–n, chacun un EA + opcode) : aucun.
- Preuves (6) :
  1. `0x5082B0`, `8B 54 24 04` : chargement DWORD de `[ESP+4]`, sans extension ni preuve d'un type signé. Les octets concaténés donnent bien huit instructions, 27 octets et le SHA-256 natif attendu ; les six fichiers du manifeste correspondent à leurs hashes.
  2. `0x5082B4`, `8B 0D C4 99 D9 01`, puis `0x5082BD`, `8B C1` : snapshot unique de la globale, copié dans EAX entier avant écriture ; aucun rechargement. L'argument est chargé avant ce snapshot.
  3. `0x5082BA`, `83 C2 03`, et `0x5082BF`, `83 E2 FC` : addition 32 bits puis masque imm8 sign-étendu `0xFFFFFFFC`. Les arguments `0xFFFFFFFD..0xFFFFFFFF` donnent zéro, réfutant un arrondi mathématique sans wrap.
  4. `0x5082C2`, `03 CA`, puis `0x5082C4`, `89 0D C4 99 D9 01` : addition au snapshot et écriture DWORD, sans modifier EAX. Avec old=1 et ARG32=1, retour=1 et nouvelle globale=5 : aucune garantie d'adresse retournée alignée. `0x5082CA`, `C3` : retour sans pop d'argument immédiat ; un bloc, aucun CALL.
  5. Preuve indépendante par callers : `0x500FD4`, `6A 54` → CALL `0x500FD6`, nettoyage `0x500FE1`, `83 C4 04`, capture `0x500FE4`, `8B F0`, puis accès `[ESI+0x3C]` à `0x500FED`. À `0x5020CF`, `8B F0` capture également EAX avant l'écrasement AX à `0x5020D1`. Ceci appuie un usage de curseur, pas un prototype métier. Les 1861 xrefs CODE ne comptent pas les callers uniques ; graphe TRUNCATED. DATA=0 concerne la racine, pas les deux références DATA à la globale.
  6. C accepté : `uint32_t` avant les additions et assertions de largeur assurent l'arithmétique unsigned pour les 2³² motifs, sans overflow signé ; snapshot puis mise à jour puis retour concordent. Binding global, RAM ordinaire stable, objets définis et activation ABI privée restent des hypothèses ; aucune certification native ABI, flags, codegen ou runtime.
- Questions ouvertes : initialisation, bornes, identité et concurrence du stockage ; prototype et validation compilée/runtime. Gel seul utilisé, sans nouvelle collecte native. Exception administrative déclarée : lecture de `AGENT.md` hors pack via Context Mode, sans utilisation sémantique ; aucun `ctx_search`.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `bs_modulo` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 8 EA / 27 octets, SHA-256 `7fa4a7eed992d3e243f78dfb9cdf34360ba309c0643a1aa7f9a7a806080b689b`.
- C relu exact : `d0613b68a8ef16701b66dd7dab0cdbb6c85231c442c45270df46427edd4c0d7c` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x5082b0/native-2026-10-10/parent_drain_gate.json`, SHA `59bb6982f8c64d5ede14cc35062698cc8a1739c6c29518c5786643e2d707f445`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_ed9a57f1fffeg74m9PqgOaeQHY` ; V `ses_ed99ce3a2ffe7dX5yi6Vp42FfG`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:26:55.714200+00:00`, readback exact après SAVE, nom/type inchangés ; état debugger `0→0` inchangé pendant cette opération, RUN non présumé. Receipt `tools/_tmp_semantic_triple/0x5082b0/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `3d03b847ae7d160d0455eb3cf76410b0800f25dc7c9440df2ff77896d3b8f202`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: RoundedDWORDincrement((a+3)wrap32)&FFFFFFFC aligns incrementto4, not guarantee returnedaddressalignment; noarraystride.
- polarity: NoJcc/setcc; ADDmodulo32 before32-bitAND signextendedimmFC; globalnew=old+roundedWRAP32, not signedoverflowbeforecast.
- return: Full EAXoldglobal capturedbeforestore. ForargumentsFFFFFFFD..FFFFFFFF increment0, all2^32inputpatterns defined underunsignedcarrier.
- name: bs_modulo/businessidentityNOTCONFIRMED; numericadvance-and-returnold supported by1D999C4snapshot/MOVEAXECX and ADD+AND/globalstore.
- extra: Native1861CODExrefsâ‰ 1861unique callers; DATA0 toroot. NoCALL. Cparentmechanicalfix independent reviewed byteexact; RAM/globalbinding/frame/ABIflags/codegen/runtime conditionsunproved.
