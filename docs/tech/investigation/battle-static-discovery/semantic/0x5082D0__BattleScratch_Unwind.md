# Sémantique numeric_5082d0 @ 0x5082D0 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : Décrémente le DWORD [0x01D999C4] de `r = ((argument DWORD + 3) mod 2^32) & 0xFFFFFFFC`, avec soustraction modulo 2^32, et retourne ce déplacement dans EAX entier.
- Confiance : LIKELY
- Nom catalogue : confirme uniquement la proposition numérique provisoire `numeric_5082d0_SubtractAlignedDWORD` ; nom IDA/catalogue non consulté, aucun rôle métier validé.
- Désaccords avec A : aucun ; l'erratum ABI indiqué par A est confirmé indépendamment par les octets.
- Preuves (8) :
  1. Les six fichiers du manifeste concordent avec leurs SHA-256. Les octets de la cible reconstruits depuis les sept lignes concordent avec les 24 octets et le hash natif `fbce427d906752dfa143502bdf56bbeba117ebf240c26b38597fa88b77e0018d`. Un chunk [0x5082D0,0x5082E8), un bloc, aucun CALL ni Jcc.
  2. `0x5082D0: 8B442404` charge le DWORD [ESP+4] dans EAX ; `0x5082DA: 83C003` réalise ADD EAX,3 sur 32 bits. `0x5082DD: 24FC` ne modifie qu'AL, conservant les 24 bits supérieurs du résultat de l'ADD : masque équivalent `0xFFFFFFFC`, jamais `0x000000FC`. Exemple discriminant : argument 0x123456FD donne EAX=0x12345700 ; 0xFFFFFFFD..0xFFFFFFFF donnent zéro par wrap.
  3. `0x5082D4: 8B0DC499D901` lit le DWORD ; `0x5082DF: 2BC8` soustrait EAX à ECX, pas l'inverse ; `0x5082E1: 890DC499D901` stocke ECX DWORD. `0x5082E7: C3` retourne sans réécrire EAX ni dépiler l'argument : retour plein EAX=r, ni nouveau global ni booléen.
  4. Preuve indépendante dans l'arbre : `0x5082B0` lit le même DWORD, `0x5082BF: 83E2FC` aligne EDX, `0x5082C2: 03CA` ajoute ce déplacement et `0x5082C4` stocke le même DWORD. L'inversion concerne seulement cet état modulaire, à arguments égaux et sans store intermédiaire ; `0x5082BD: 8BC1` fait retourner l'ancien DWORD, pas r.
  5. Caller `0x500FD0` : `0x501145: 6A54`, `0x501147: E884710000`, puis `0x50114C: 83C404` et POP EDI/ESI/EBP/EBX, RET à 0x501153. Sur exécution architecturale normale, EAX=0x54 découle du calcul de ce callee et de l'absence de réécriture après CALL, non du seul PUSH ni d'une hypothèse opaque sur le retour.
  6. À `0x501205` et `0x501220`, les calls avec argument 0x0C sont suivis respectivement de `0x50120D/0x501228: 8BC6` (MOV EAX,ESI). Le retour de ces callers n'est donc pas le déplacement de la cible. L'inventaire racine compte 1873 références CODE, 0 DATA, pas 1873 callers uniques : 1600 fonctions englobantes et 10 références hors fonction ; 32 références échantillonnées, 12 nœuds/profondeur 3, graphe TRUNCATED.
  7. Erratum vérifié : `0x509B02: E8E9620000` désigne `0x509B07 + 0x62E9 = 0x50FDF0`, et non 0x519DF0 annoncé dans une phrase ABI. `0x509B0B: 83C410` puis `0x509B0E: 89442430` transportent EAX dans [ESP+0x30] ; cible non développée, aucune valeur/projection de son retour inventée.
  8. Le C accepté réalise +3, masque et soustraction en unsigned32, puis retourne r : cohérent avec les effets numériques. Cette correspondance suppose le binding du DWORD natif à l'extern, RAM ordinaire stable, objets valides/accessibles, frame privée et transport sûr ; elle ne certifie ni prototype/ABI natif, ni codegen/backend, EFLAGS ou runtime. Les flags finaux proviennent du SUB.
- Questions ouvertes : rôle métier et nom catalogue réels hors périmètre ; graphe incomplet ; binding et hypothèses mémoire/transport non testés en exécution. Aucune promotion IDB ou validation backend n'est autorisée par ce verdict.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `BattleScratch_Unwind` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 7 EA / 24 octets, SHA-256 `fbce427d906752dfa143502bdf56bbeba117ebf240c26b38597fa88b77e0018d`.
- C relu exact : `0beac65635b463618125bb5792f9bd0f459bc05a70b20dc0793034a0d6337ece` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x5082d0/native-2026-10-10/parent_drain_gate.json`, SHA `6b8f30c33bc45118fc5bf8e6ef6f5571ff35787db7fa5602ba033adeddad52f5`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_ed9a54674ffedN36ayqVvbgHuG` ; V `ses_ed99ca98dffeBq5H1RLMWgD2gw`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:26:58.385825+00:00`, readback exact après SAVE, nom/type inchangés ; état debugger `0→0` inchangé pendant cette opération, RUN non présumé. Receipt `tools/_tmp_semantic_triple/0x5082d0/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `a40628e90d7e839eac2745a551b1a7cfbd65ad25731e347757a1030e48fdc386`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: RoundedDWORDincrement((a+3)wrap32)&FFFFFFFC; AL-onlyANDFC preservesupper24bits equivalentfullFFFFFFFC. Noarraystride.
- polarity: NoJcc/setcc; SUB ECX,EAX yieldsglobalold-minusrounded modulo32; unsignedcarrier avoidsC signedoverflow.
- return: FullEAXrounded, not old/newglobal orAL-only; C3 noargcleanup. OnARG54 return54 followscalleecomputation, not inference PUSH54orlibraryname.
- name: Unwind businessidentityNOTCONFIRMED; numericSubtractAlignedDWORD supported by low32rounded arithmetic and SUB/globalstore/fullEAXreturn.
- extra: Native1873CODE/0DATA vs retainedgraphTRUNCATED; actualcontexttarget50FDF0 not519DF0 erratum preserved. ParentcorrectedC independentlyreviewed, explicitRAM/binding/privateframe/ABIflags/codegen limitations.
