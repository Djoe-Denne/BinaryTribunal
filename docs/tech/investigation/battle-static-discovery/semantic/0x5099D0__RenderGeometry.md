# Sémantique fn_5099D0 @ 0x5099D0 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : Après une porte globale, traite les flux sélectionnés par masque, adresse des éléments espacés de 48 octets depuis des indices signés, transfère quatre WORD et chaîne un résultat DWORD opaque.
- Confiance : LIKELY — mécanisme numérique établi, rôle métier inconnu.
- Nom catalogue : confirme la proposition provisoire `fn_5099D0_MaskedStreams_Stride48`, pas un nom catalogue consulté ; re-dérivation indépendante par sélection/flux et calcul d'adresse, sans nom métier ni renommage.
- Désaccords avec A : 0 ; aucun fait réfuté par les octets, le suivi ESP ou le graphe autorisés.
- Preuves :
  1. `0x5099D0–0x5099F6`, `MOV/TEST/JNZ/CALL/RET` : global `0xB8B9F8` mis à 1 avant `0x45B570`, seulement s'il était nul ; EAX nul entraîne le retour intégral de `a4`, sans accès `a0/ctx`.
  2. `0x509A0D–0x509A37`, `MOV/PUSH/CALL/TEST/JLE` : BYTE `ctx+1E/+1D/+1C` zéro-étendus, arguments effectifs `(ctx[1C],ctx[1D],ctx[1E])` ; compte DWORD capturé avant `0x45DDA0`, appelé même si ce compte signé est non positif.
  3. `0x509A3D–0x509A76` et `0x509B17/1D`, `ADD/SHL/TEST/MOVSX/JLE/JL` : table avancée de 4, base rechargée ; masque `1u << (i & 31)`, aucune borne 32 ; compte externe signé et compte/indices internes WORD signés.
  4. `0x509A1D/7E/85/88/8D`, `ADD/LEA/SHL/LEA/CALL` : `8D1449`, `C1E204`, `8D4C1A10` donnent exactement `a0[0]+0x20+48*index` modulo 2^32, transmis à `0x509B30`.
  5. `0x509A62–0x509AA6`, `MOV/ADD/LEA/PUSH/CALL` : seconde cellule initialisée depuis `ctx+4`, flux avancé avant le premier appel, puis `0x50F900(ctx,&flux,&seconde)` et rechargement du flux ; nettoyage 16 = 4 différés + 12, non quatre arguments.
  6. `0x509AAC–0x509AF9`, `ADD/AND/MOV` : alignement `(flux+3)&~3u`, quatre lectures WORD entrelacées avec les écritures `ctx+8/+A/+C/+E`, donc alias admissible ; saut de 4 sans lecture avant écriture `ctx+0`, même si le compte interne est non positif.
  7. `0x509AF8–0x509B2E`, `PUSH/CALL/MOV/POP/RET` : `0x50FDF0(ctx,a2,a3,a4)`, tout EAX conservé dans le home de `a4` puis retourné ; cinq arguments source, home de ctx recyclé, 12 octets privés et quatre registres sauvés, deux RET sans immédiat.
  8. Octets reconstruits : SHA256 `6e646da93c9c68b4e07622bde5ea7b428a26593466f6bbbcd9c95b6abc0cc5e8`, 118 instructions/351 octets, un chunk, 10 blocs/15 arêtes ; graphe et CALL concordent : `45B570/45DDA0/509B30/50F900/50FDF0`. Les six hashes d'entrée concordent ; le C n'apporte aucune preuve métier.
- Questions ouvertes : bindings, prototypes et effets opaques, identités et étendues accessibles inconnus. Accord conditionné à RAM ordinaire, accès valides et frame privé sauf deux cellules exposées non échappantes ; aucune validation ISO C compilée/runtime ni promotion IDB. Vérification native live §5.6 réservée au parent.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `RenderGeometry` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 118 EA / 351 octets, SHA-256 `6e646da93c9c68b4e07622bde5ea7b428a26593466f6bbbcd9c95b6abc0cc5e8`.
- C relu exact : `9308f355bcc2278bfa2a5e3c94a2659c83a63cfa14adfecc646c248097130f1f` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x5099d0/native-2026-10-10/parent_drain_gate.json`, SHA `77ad3ea8e16140f2e450b1412ed5e51ebd2fe99b2045cfc1c388125dfebecebb`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_eda598bf7ffeFN35rBdvSyRFV0` ; V `ses_eda4e9007ffeOxAuiXIDVXlVwm`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:24.969163+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x5099d0/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `7d66ab9f291e0e0c4436ce4f51abda7546808ff7351cb440cd14939e98c8570c`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: LEA i+i*2=3i then SHL4=48i (0x30). MOVSX WORD indices, not232/464.
- polarity: Global gate and mask selection; signed JLE/JL loops. Variable SHL count is native modulo32, C32 constraints explicit.
- return: Early path propagates opaque/helper EAX; normal final MOV EAX,[ESP+0x30] restores first incomingDWORD. Full-EAX usage, not AL-only.
- name: RenderGeometry identity NOT_CONFIRMED; selected streams/stride48 and four WORD transfers+opaque DWORD chain give numeric role.
- extra: Two exposed local cells and ordinary stable RAM/source ordering are C-domain conditions, not full trace/native codegen proof.
