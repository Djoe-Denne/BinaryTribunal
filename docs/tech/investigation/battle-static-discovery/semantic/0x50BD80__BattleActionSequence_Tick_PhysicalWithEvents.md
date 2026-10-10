# Sémantique sub_50BD80 @ 0x50BD80 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : branche sur le BYTE +0x0D d'une adresse argument, avec premier appel conditionnel, second appel commun aux branches actives et store BYTE 0xFF via EDI, sous réserve des effets opaques des appels.
- Confiance : LIKELY ; rôle numérique conditionnel uniquement, aucune certification métier, C/native, backend ou runtime.
- Nom catalogue : non consulté ; confirme uniquement la proposition numérique conditionnelle de A, re-dérivée des branches et des deux destinations CALL, pas un nom métier.
- Désaccords avec A (0–n, chacun un EA + opcode) : 0 sur rôle, nom numérique et confiance. Les restrictions d'équivalence C et de préservation GPR de A sont nécessaires, non facultatives.
- Preuves (8) :
  1. Couverture indépendante : 27 EA contigus, 59 octets sur [0x50BD80,0x50BDBB), SHA256 `da0f110cde2538f1ae831394a32bb852bdcedbdad13f8814e27569c0e0adec91`. Les longueurs et octets op_t reconstituent exactement le buffer ; 7 blocs et 7 arcs : 0→1/3, 1→2/6, 3→4/5, 5→6. Un seul chunk.
  2. 0x50BD80 `56`, 0x50BD81 `8B742408`, 0x50BD87 `57` : DWORD [ESP_entrée+4], deux sauvegardes, pas de frame EBP ni allocation. 0x50BD96/97/98 `5F/5E/C3`, 0x50BDA2/A5/A6 `5F/5E/C3`, 0x50BDB3/B9/BA `5F/5E/C3` : restauration et retours sans nettoyage d'argument. Aucun push d'argument aux CALL ; ni prototype source ni entrées GPR prouvés. Les sauvegardes écrivent la pile : « sans écriture RAM » doit ici désigner les stores de données hors pile privée.
  3. 0x50BD85 `33C0`, 0x50BD88 `8A460D`, 0x50BD8E `83E800`, 0x50BD91 `7406`, 0x50BD93 `48`, 0x50BD94 `7414` : s unsigned 0…255, branches s=0 et s=1 ; s≥2 retourne EAX=s−1 (1…254), sans CALL ni store de données hors pile. Vérification arithmétique des 254 sélecteurs, pas de test signé ni booléanisation.
  4. 0x50BD99 `E882F0FFFF` : destination relative recalculée 0x50AE20. 0x50BD9E `85C0`, 0x50BDA0 `7405` : test EAX complet ; EAX=0x100 prend aussi la sortie 0x50BDA3 `33C0`, donc retourne 0. Seul EAX=0 rejoint l'incrément.
  5. 0x50BDA7 `FE460D` : RMW du BYTE courant à [ESI+0x0D] après le premier appel, modulo 256 ; ni s_initial+1 ni constante 1. Sans revérification, chute sur 0x50BDAA, également atteint directement pour s=1. ESI désigne le GPR réellement laissé par le callee.
  6. 0x50BD8B `8B7E10` précapture EDI ; 0x50BDAA `E8C1E8FFFF` vise indépendamment 0x50A670 ; 0x50BDAF `C64701FF` store après cet appel, 0x50BDB4 `B802000000` impose EAX=2. Aucun reload +0x10. La destination est précapturée seulement si les helpers préservent EDI ; sinon [EDI_courant+1]. Un alias entre cible+1 et le BYTE à +0x0D reste possible, le dernier store gagne si les accès aboutissent.
  7. Racine : 0 CODE, 1 DATA à 0x50A7CD dans 0x50A790. Lecture native op_t/bytes exclusivement numérique : `B880BD5000`, taille 5, destination registre 0 et immédiat 0x50BD80 ; sélection d'adresse, pas CALL ni preuve de table. 0x50A7CB `740A` vise 0x50A7D7. Graphe borné profondeur 3/32 nœuds/128 arêtes, effectivement 32 nœuds/41 arêtes, TRUNCATED avec 151 entrées écartées : aucune garantie tous chemins ou usage indirect.
  8. C autorisé SHA256 `e958b22a54e72e7b8a5b273c93e93c79efc2f5cdff6f4c54200aa9eff0734312` : branches, retours, RMW post-appel et cache conformes sous hypothèses, mais lit +0x10 avant +0x0D, ordre natif inverse (0x50BD88/8B). Les variables C préservent implicitement les adresses à travers les helpers, contrairement au flux GPR non garanti. C32 little-endian, BYTE 8 bits, objets/alignement/aliasing/casts définis, étendues suffisantes, RAM stable entre les deux lectures, frame privée, bindings, préservation GPR et retour normal ne sont pas établis par ces instructions.
- Questions ouvertes : effets et contrats des deux helpers ; adresses valides, alias et accès typés C ; préservation ESI/EDI et pile ; bindings/entrées cachées ; emploi futur de l'adresse sélectionnée. A résiste aux attaques numériques, mais cela n'autorise aucune promotion métier ni certification d'exécution.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `BattleActionSequence_Tick_PhysicalWithEvents` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 27 EA / 59 octets, SHA-256 `da0f110cde2538f1ae831394a32bb852bdcedbdad13f8814e27569c0e0adec91`.
- C relu exact : `e958b22a54e72e7b8a5b273c93e93c79efc2f5cdff6f4c54200aa9eff0734312` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x50bd80/native-2026-10-10/parent_drain_gate.json`, SHA `c76a00ba837ce810f62450b7063602c0ac3be45cb42f2b295f606b7430d8b809`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_ed9e2290affev5K4MFwFofc6KW` ; V `ses_ed9dc893dffemcSKwaHRTClQQD`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:27.870367+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x50bd80/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `278224b4f0e3b5309cb0312a48ae2a871160b574a2765939ed4c955aa8eea1b7`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: OffsetsD/10 and EDI+1, no structstride invented.
- polarity: State0 tests wholeEAXhelper; zero increments CURRENTBYTE aftercall. State1 enterscommoncall; othersskipcalls.
- return: Full EAXs-1 for initial2..255={1..254};0iffirsthelpernonzero;2 aftercommoncall/store. No bool prototype.
- name: PhysicalWithEvents business identity NOT_CONFIRMED; Byte0Dselection plus2CALLandBYTEFFstore prove numeric role.
- extra: Root0CODE/1DATA. NativeEDI current afterhelpers: capturedaddress only ifpreserved. Cinitialloadordering stableRAMconditional; no every-access trace/native backend certificate.

### Erratum de sérialisation Git — C inchangé

La source C byte-exacte est conservée dans le carrier Base64 du [decomp](../decomp/0x50BD80__BattleActionSequence_Tick_PhysicalWithEvents.md) : 1556 octets, SHA-256 `e958b22a54e72e7b8a5b273c93e93c79efc2f5cdff6f4c54200aa9eff0734312`. Le fence C rendu peut être normalisé LF par Git ; la présente correction supersède sa qualification antérieure de byte-exactitude. Source, algorithme, confiance, gate ASM, append/save/readback inchangés. Réparation documentaire ≠ nouvelle clôture ; aucun nouveau push IDB.
