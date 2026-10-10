# Sémantique sub_500FD0 @ 0x500FD0 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : Prépare l'objet adressé par le résultat de 0x5082B0(0x54), entrelace quatre traitements numériques espacés de 44 octets avec une branche spéciale au quatrième indice et des mises à jour conditionnelles, puis restitue l'EAX entier de 0x5082D0(0x54).
- Confiance : LIKELY — comportement numérique étayé, identité métier et interfaces natives inconnues.
- Nom catalogue : confirme uniquement le maintien du repère numérique sub_500FD0 ; nom métier non évalué dans ce périmètre, aucun renommage proposé.
- Désaccords avec A (0–n, chacun un EA + opcode) : 0. Les attaques sur alias, largeur, polarité, ordre et arités ne réfutent pas A. Accord redérivé depuis les octets/ASM et le graphe, non depuis un nom.
- Preuves (8) :
  1. **Captures/alias** — 0x500FDB/0x500FE6, `mov` DWORD : captures de [0x1D969A8] puis [0x1D98B3C] avant les stores 0x500FED–0x50100B. WORD +0x3C/+0x3E=0, +0x40=0x140, +0x42=0xD8 ; DWORD +0x2C=seconde capture, +0x48=0xFFFFFFFF, +0x38=première. Le C conserve l'ordre même avec recouvrement ordinaire.
  2. **Contrôle/adressage** — 0x500FEB `xor edi,edi` ; SIB BF/57 puis `shl eax,2` à 0x501017–0x50101D : 5*i, 11*i, 44*i, pas ESP. Même pas à 0x5010D3–0x5010D9 ; 0x50113B–0x50113F `inc/cmp/jl` signé impose exactement i=0..3. Les étapes sont entrelacées par indice.
  3. **Polarités/arguments** — 0x50100E/0x501015 `test byte,4; jnz` saute la paire 0x508F90/0x509440. 0x501036/0x501038 `test eax,eax; jz` examine les 32 bits. Les pushes droite→gauche donnent (0x1D989A4+44*i,0x1D989B0+44*i), puis ces mêmes références et 0.
  4. **Quatrième indice/largeurs** — 0x501046/0x501049 `cmp edi,3; jz`. Sinon 0x5095B0(référence indexée,0x1D97778). À i=3, 0x501070 `66 C1 F8 03` est SAR AX,3 signé, non SAR EAX ; stores WORD +4,+0,+2. À 0x501095–0x5010A0, trois captures DWORD précèdent tous les stores +0x1C/+0x20/+0x24.
  5. **Phase fraîche** — Après 0x5010B5, 0x5010BA relit le BYTE global ; `test al,1; jnz` exclut l'addition si bit 0 présent. 0x5010C6 `movsx eax,word` charge le WORD signé ; 0x5010CD `add dword [0x1D96DA4],eax` utilise la destination actuelle modulo 2^32, pas la capture antérieure. Le C respecte cette distinction conditionnellement.
  6. **Masque/alias** — 0x5010DC capture un BYTE ; 0x5010E2–0x5010E8 exige simultanément bits 0 et 1. Les lectures DWORD/WORD 0x5010EA/0x5010F0 précèdent les stores +0x44/+0x4C 0x5010F7/0x5010FA ; 0x5099C0 suit, sans argument préparé. Le C conserve captures et largeur basse WORD.
  7. **Pile/contexte** — 0x501085/0x501090/0x5010B5 reçoivent respectivement (p,p+8), (0x1D97778,p+8), (0x1D98A28,p+8) ; 0x5010BF `add esp,0x18` nettoie trois paires, pas un appel à six arguments. Après 0x5099C0, lectures 0x501103/109/110/118 ordonnées : contexte, tableFC+8*i, tableF8+8*i, base. 0x50111F forme base+4*tableF8 modulo 2^32 ; 0x5099D0(référence indexée,p+0x28,adresse,tableFC,contexte) puis 0x501136 remplace le contexte par EAX, alias possibles inclus.
  8. **Retour/couverture/graphe** — 0x501145/147 `push 0x54; call 0x5082D0`, puis nettoyage et POP non-EAX jusqu'au `C3` 0x501153 : EAX entier inchangé ; 0x54 n'est pas un retour constant. Aucun argument entrant lu ne prouve pas une signature native sans arguments. Concordance intégrale des 112 instructions/388 octets, 13 blocs, un chunk, 10 CALL relatifs/9 cibles ; SHA-256 natif 678036726310b981aedcd92ee5b7e1f62b032bfc62cadd9ddac87050ee630874. Les 164 callers numériques n'ont pas d'ASM de préparation/consommation ; aucune sémantique supplémentaire n'en est inférée.
- Questions ouvertes : Le C 43e60a77… laisse l'ordre des quatre lectures d'arguments non spécifié : égalité des valeurs seulement sous RAM ordinaire stable, lectures sans effets et effets opaques entre appels, jamais équivalence forte de toute trace mémoire. Les porteurs unsigned C32 ne prouvent ni prototypes natifs ni bindings. Cadre privé protégé, extents, validité/type effectif/alias des objets, conversions/adresses, WORD signé/SAR, backend et runtime restent des prémisses ou inconnues. ACCEPTE porte sur A, pas sur une promotion native ou une certification du C.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `BS_RenderRelated` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 112 EA / 388 octets, SHA-256 `678036726310b981aedcd92ee5b7e1f62b032bfc62cadd9ddac87050ee630874`.
- C relu exact : `43e60a77a235cb0811bbbd02544546dda73e0d041a816372187ce51abc4b6e96` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x500fd0/native-2026-10-10/parent_drain_gate.json`, SHA `3ef04d0d74a11101dc71e63de135a847c32e807c76b83b71f8e2107ee3796fa4`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_eda29f5e5ffetDduouISu09VfR` ; V `ses_eda209c21ffeR1QUdANrS3Z3R7`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:25.816230+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x500fd0/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `b09c0707de32ca4450e30b92a416558728a6169b6df736ac6eac7ab04442151c`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: LEA5i then LEA11i then scale4 gives44 (0x2C) for local banks. Distinct callee geometry stride48 not conflated.
- polarity: WORD SAR3 signed; signed MOVSX and final JL loop; mask/control branches preserve source BYTE/WORDwidths.
- return: Root propagates last opaque callee full EAX after PUSH0x54/CALL5082D0/ADDESP4/POPs;0x54 is the argument, not inferred root constant.
- name: BS_RenderRelated business identity NOT_CONFIRMED; per-entry banks and ordered chain10nativecalls give numeric role.
- extra: Stable ordinary RAM required for C's unspecified read order; no strong every-read trace or backend/ISO certificate.
