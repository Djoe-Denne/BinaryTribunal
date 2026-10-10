# Sémantique numérique 0x56D020 @ 0x56D020 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le mien) : Assemble neuf WORD dans une frame privée depuis deux retours scalaires du même argument, appelle une chaîne mettant à jour 20 octets au second argument, puis retourne ce second argument sur 32 bits.
- Confiance : LIKELY
- Nom catalogue : confirme uniquement la proposition numérique `Num32_Build9Words_Update20_ReturnArg1`, re-dérivée des stores et de la chaîne de copie/retour ; `Arg1` désigne l'indice zéro-based 1, donc le second argument. Aucun catalogue consulté.
- Désaccords avec A (0–n, chacun un EA + opcode) : 0 ; aucune différence factuelle constatée.
- Preuves (7) :
  1. `0x56D020 SUB ESP,0x20`, sauvegardes ESI/EDI, `0x56D025 MOV EDI,[ESP+0x2C]` et `0x56D048 MOV ESI,[ESP+0x38]` : 32 octets locaux, a=[S+4], p=[S+8]. Ni quatre arguments ni argument tronqué.
  2. `0x56D029/02F PUSH EDI`, CALL `0x56D02A→0x56D100`, `0x56D032→0x56D130` : même a ; `0x56D030 MOV ESI,EAX` conserve G0. Les corps numériques contiennent FILD DWORD signé, FCOS/FSIN et FSTP QWORD (`0x56D103/133`, `0x56D10D/13D`, `0x56D11B/14B`), pas des appels de bibliothèque supposés.
  3. `0x56D037/03C/043/04C` et `0x56D059..06F` écrivent exactement neuf WORD : `[lo16(G0),0,lo16(G1),0,0x1000,0,lo16(−G1),0,lo16(G0)]`. `0x56D041 NEG EAX` précède la troncature WORD. T=S−0x20 : 18 octets initialisés, non 20.
  4. `0x56D057 PUSH ESI`, `0x56D058 PUSH EAX`, `0x56D074 CALL 0x56C270` : (T,p) cdecl. `0x56D079 ADD ESP,0x10` retire les quatre DWORD cumulés des trois appels ; `0x56D07C MOV EAX,ESI`, restauration EDI/ESI, RET C3 : retour complet p, pas AL/char/void.
  5. `0x56C283 CALL 0x56C090` reçoit (T,p,temp). `0x56C11E MOV EDX,3`, `0x56C137/15D ADD ...,6`, `0x56C196/1BF/1DE MOV WORD`, `0x56C1E6 JNZ` : neuf WORD produits. `0x56C1F8..215` puis `0x56C294..2AA` copient cinq DWORD ; dernière paire d'octets physiques +18/+19 non explicitement initialisée dans le résultat interne, opaque, ni zéro ni stable entre appels. Ne pas la confondre avec T+18/+19, non lus ici.
  6. Dix CALL numériques, neuf callers. `0x50A3F7 PUSH ESI`, `0x50A3F8 PUSH 0x800`, `0x50A3FD CALL`, `0x50A402 ADD ESP,8`, POP ESI/RET confirment indépendamment deux arguments et EAX non tronqué ; idem chemin `0x50A3E6`. Six fenêtres tronquées : aucune preuve de CFG/allocation globale revendiquée.
  7. Le C respecte valeurs, trois appels et retour ; ses stores locaux réordonnés sont compatibles seulement avec une frame privée sans observation externe. RAM ordinaire valide, p lisible sur 18 octets et inscriptible sur 20, bindings/backend et ABI des helpers requis. Ce n'est pas une preuve ISO C, de frame compilée ni de runtime natif, et les deux octets résiduels ne sont pas modélisés.
- Questions ouvertes : x87/CW effectif, valeur des octets résiduels, allocation réelle de p et bindings/backend ; domaine/catalogue hors périmètre. Provenance du modèle : cette revue est exécutée par `openai/gpt-6.1-sol`, pas par le profil GLM prescrit ; conformité de harness à arbitrer par le parent, indépendamment du verdict sémantique.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `Mat3S16_MulByRotY_Q12` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 31 EA / 100 octets, SHA-256 `ba67697e856fbc862d2e99c01b408e1caefcd575d7abdbfef79726803946bd23`.
- C relu exact : `d2b7f979283a54d4919cec0afa70dadcf31f4f57669aab037cc872fd4d4b2192` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x56d020/native-2026-10-10/parent_drain_gate.json`, SHA `2714f287b0bc7369d80b8b8aca8f89db8b7bff79590c700f3315caffb348a8e8`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_eda474b70ffeYNPonvjCHzFaGi` ; V `ses_eda41b88fffekF2ASbwAuijgji`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:24.594454+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x56d020/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `b09d8d0bd4ec6da308f228c1e45e004acfe80c7d90db1f07af502dce207bb109`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: Nine WORD cells in private32-byte allocation; stack arg positions developed after pushes.20-byte helper update not sizeof18 claim.
- polarity: No root Jcc/setcc; NEG fullEAX then WORD store wraps16;4096 cell retained.
- return: MOV EAX,ESI at56D07C after last helper; current ESI is second argument under verified normal preserving/private-frame contract. Full32 carrier, not source prototype.
- name: Mat3/RotY/Q12 business identity NOT_CONFIRMED; two same-argument scalar calls and nine WORD/frame+update/return give numeric role.
- extra: ADD ESP,16 at56D079 cleans two earlier scalar args plus two final args; not four args of final callee. GPR/helper/backend/private-frame and20-byte support are conditional, not runtime/ISO evidence.

### Erratum de sérialisation Git — C inchangé

La source C byte-exacte est conservée dans le carrier Base64 du [decomp](../decomp/0x56D020__Mat3S16_MulByRotY_Q12.md) : 685 octets, SHA-256 `d2b7f979283a54d4919cec0afa70dadcf31f4f57669aab037cc872fd4d4b2192`. Le fence C rendu peut être normalisé LF par Git ; la présente correction supersède sa qualification antérieure de byte-exactitude. Source, algorithme, confiance, gate ASM, append/save/readback inchangés. Réparation documentaire ≠ nouvelle clôture ; aucun nouveau push IDB.
