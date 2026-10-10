# Sémantique sub_0045F930 @ 0x45F930 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le mien) : Élever au carré trois WORD signés globaux, sauvegarder leurs carrés DWORD bruts, réécrire les cellules d'entrée en DWORD plafonnés à 32767 et reconstruire les trois contributions conditionnelles d'un masque.
- Confiance : LIKELY — sémantique numérique établie ; identité métier non évaluée.
- Nom catalogue : confirme uniquement la proposition numérique provisoire `Numeric_Square3S16_StoreRaw32_Clamp32767_SetFlags`, redérivée des charges/produits et des banques de stores/masques ; aucun catalogue consulté.
- Désaccords avec A : 0. Nom proposé et confiance identiques à A ; aucune identité ISO/ISA déduite.
- Preuves (8) :
  1. `0x45F930/937/941 : MOVSX WORD`, `0x45F93E/948/94B : IMUL r32,r32` : les trois valeurs sont chargées avant toute écriture. Le domaine signé16 donne des carrés exacts dans `[0,0x40000000]`, sans overflow int32 ; 181² passe, 182² dépasse.
  2. `0x45F95E/964/96A : MOV DWORD` conserve les carrés bruts à `0x01CA8A74/78/7C`. `0x45F98C/9B6/9DA : MOV DWORD` réécrit `0x01CA8A34/38/3C`, stride 4, en écrasant aussi les WORD hauts. Ce ne sont pas seulement trois stores WORD.
  3. `0x45F94E/986/9B1 : CMP ...,7FFFh`, `0x45F96F/992/9BC : 76 JBE` : seuil unsigned ; les MOV intercalés ne modifient pas EFLAGS. CFG recompté : 7 blocs, 8 chemins réalisables en choisissant indépendamment 0 ou 182 pour chaque entrée.
  4. `0x45F971/99A/9C4 : C1 F9/FA/F8 1F` est SAR 31, non SHR ; NOT puis AND 7FFFh donne 32767 sur tous les carrés dépassants accessibles. Aucun carré négatif accessible ne produit la branche théorique zéro.
  5. `0x45F954 : MOV DWORD [...],0`, `0x45F97C : MOV ...,81000000h`, `0x45F9A5 : OR ECX,80800000h`, `0x45F9CE : OR ECX,00400000h` : troisième dépassement seul ⇒ `0x00400000`, sans bit31. Les reloads à `0x45F994/9BE` et l'ordre reset → banque brute → sorties/masques sont réels ; aucune validation des flags d'une ISA externe.
  6. `0x45F9DA : A3 ...`, `0x45F9DF : C3` : EAX complet est le troisième carré plafonné, non BOOL/AL et non preuve de void. Aucun argument entrant lu, CALL, accès frame ou modification ESP ; cdecl zéro argument compatible, non exclusif. 36 instructions/176 octets contigus ; bytes/ASM concordent et SHA-256 natif vérifié.
  7. Graphe recompté : 51 CALL E8 vers l'entrée, 32 callers, profondeur 2 non tronquée dans cette borne (50 nœuds/113 arêtes), aucune sortie CALL. À `0x54588E : PUSH EDX`, puis `0x545893 : CALL 0x45E0B0`, puis `0x545898 : CALL 0x45F930` : PUSH non attribuable à notre feuille ; `0x54589D : LEA EAX,[EBP-34h]` écrase son retour. À `0x61A5D9 : MOV EAX,[ESP+6Ch]`, même constat. Les 45 LEA et 6 MOV immédiatement suivants ne lisent pas EAX ; cela ne prouve pas void ni l'absence d'usages plus lointains. Les cleanup voisins ne prouvent pas une arité de cette feuille.
  8. C accepté confronté à `0x45F930/937/941 : MOVSX WORD` et `0x45F994/9BE : MOV ECX,[...]` : calcul, reloads ordinaires et ordre source concordent sous C32/short16 et conversion mot bas signé. Les lvalues C lisent néanmoins DWORD avant cast ; unsigned→short hors plage reste dépendant de l'implémentation. Ce n'est pas une preuve d'équivalence d'accès, de backend, d'ordonnancement compilé ou de runtime.
- Questions ouvertes : Mapping des externs, observabilité WORD/DWORD et concurrence/MMIO, ABI effective et usages hors fenêtres ; aucune signification métier, équivalence ISO ou exécution native établie. Aucun motif d'escalade sur le périmètre numérique autorisé.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `Gte_SQR` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 36 EA / 176 octets, SHA-256 `affb5edf73e77e77ad2a72b7ec5ff163a2fdccb1d8422fe5a3c08262c0572dfa`.
- C relu exact : `4b77300cbc269a6570fe49ba040ff734c74f31091bde710dd70e8d566c61d83a` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x45f930/native-2026-10-10/parent_drain_gate.json`, SHA `f239e6f3448ae2eda9bb07b86adfe9bb4f50281484de8f4db60a103625afcdf0`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_eda64e0e9ffeF4vHr6aJ28KOp4` ; V `ses_eda5857fdffeUZpEVMzgTIKWwO`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:15.001245+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x45f930/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `78b1235fdbd6aa750b0b8e1632a5b8f14d6c4288d7b59e78556af55a57775ae7`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: Literal three source WORDs, raw-square DWORD bank and rewritten input DWORD bank; no inferred struct stride.
- polarity: Three unsigned JBE against32767 skip clipping; squares of signed16 fit0..2^30. Masks81000000/80800000/00400000 retained.
- return: Full EAX last raw/clamped square,0..32767 on normal return, not flag-mask return.
- name: Gte/SQR identity NOT_CONFIRMED; three signed16 IMUL squares plus clipping/flag banks prove numeric role.

### Erratum de sérialisation Git — C inchangé

La source C byte-exacte est conservée dans le carrier Base64 du [decomp](../decomp/0x45F930__Gte_SQR.md) : 2122 octets, SHA-256 `4b77300cbc269a6570fe49ba040ff734c74f31091bde710dd70e8d566c61d83a`. Le fence C rendu peut être normalisé LF par Git ; la présente correction supersède sa qualification antérieure de byte-exactitude. Source, algorithme, confiance, gate ASM, append/save/readback inchangés. Réparation documentaire ≠ nouvelle clôture ; aucun nouveau push IDB.
