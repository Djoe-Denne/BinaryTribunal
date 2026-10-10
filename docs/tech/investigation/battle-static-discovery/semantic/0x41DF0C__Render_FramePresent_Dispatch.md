# Sémantique sub_41DF0C @ 0x41DF0C (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : appelle `0x4098EE` avec `[EBP+8]`, conserve son EAX complet, puis, si le dword à `+0xB88` de l'argument rechargé après cet appel est non nul, recharge l'argument et appelle le pointeur contenu à `[EAX_conservé+0x10]`.
- Confiance : LIKELY — mécanique démontrée ; contrats des appels et signification métier inconnus.
- Nom catalogue : confirme la proposition numérique de A `sub_41DF0C_Call4098EE_ThenIfB88Nonzero_CallReturnedSlot10`, re-dérivée des deux appels et du test ; catalogue exclu. Aucun getter, vtable ou rôle de présentation de frame établi.
- Désaccords avec A (0–n, chacun un EA + opcode) : 0.
- Preuves (3–8) :
  1. Hashes des six entrées conformes ; bytes natifs relus identiques (`314cbeb3…d973`). Décodage indépendant : 19 instructions, 48 octets, trois blocs **11/5/3**, deux chemins normaux ; le **12/5/3** de `graph.json` est bien erroné, comme A le précise.
  2. `0x41DF10: 8B4508`, `0x41DF13: 50`, `0x41DF14: E8D5B9FEFF` : argument stack et cible calculée `0x4098EE`. `0x41DF1C: 8945FC` stocke les 32 bits d'EAX dans `[EBP-4]`.
  3. `0x41DF1F: 8B4D08`, `0x41DF22: 83B9880B000000`, `0x41DF29: 740D` : argument réellement rechargé après l'appel opaque, comparaison **dword**, saut vers `0x41DF38` si zéro. Ce chemin laisse l'EAX direct intact.
  4. `0x41DF2B: 8B5508`, `0x41DF2E: 52`, `0x41DF2F: 8B45FC`, `0x41DF32: FF5010` : second rechargement stack, base conservée relue, appel du **contenu** de `[base+0x10]`, sans préchargement de vtable. Le chemin non nul propage l'EAX indirect ; largeur effectivement définie par les callees inconnue.
  5. `55 8BEC 51` et `8BE5 5D C3` : frame EBP et local de quatre octets, retour sans immédiat. `0x41DF19` et `0x41DF35: 83C404` nettoient chacun quatre octets. Les trois sites natifs `0x409630`, `0x4096BC`, `0x569C6B` confirment push/call/nettoyage ; trois xrefs CODE type 17, zéro DATA enregistré. `0x10600` désigne leurs `get_flags`, non les flags de la fonction racine. Ancêtres d2/d3 non revalidés, aucun constat de douze callers.
  6. C final : offsets `0xB88/4` et `0x10/4`, polarité et deux résultats corrects structurellement. Les rechargements stack natifs ne sont pas explicites en C ; l'interprétation suppose RAM ordinaire, frame privée et ABI normale. Noms numériques, prototypes et casts ne prouvent ni liaison d'adresses, ni équivalence sous tous alias, C ISO, backend ou runtime.
- Questions ouvertes : contrats et largeur définie des deux appels, validité mémoire, sens de `+0xB88` et identité de la base ; contexte d2/d3 orphelin non tranché. Aucune équivalence runtime revendiquée.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `Render_FramePresent_Dispatch` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 19 EA / 48 octets, SHA-256 `314cbeb3174b5d5fb68747b37fe8b672308acff94f2a074dd3364ae38dd1d973`.
- C relu exact : `546e523a8e3ff9738509b58ea696927c9b7d300c3cd97945901de2e24377cc17` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x41df0c/native-2026-10-10/parent_drain_gate.json`, SHA `bd8b54080ec06e0686bbe387811b4f9d5b1709a2512e98a4d4c0ba9e9312775c`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_eda5a5130ffeF39p2kgbTNU8Ee` ; V `ses_eda559a00ffednISNg3MIKAZGr`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:09:55.709586+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x41df0c/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `41175062f2608e29672c950b76dc73a4435eb761f212b091978c922bf33922dc`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: No array stride; object offsets 0xB88=2952 and0x10=16, not vtable identity.
- polarity: DWORD compare zero/JZ skips second indirect call; argument is reloaded after opaque first call.
- return: Full EAX from first call on zero branch, full EAX from indirect call otherwise; native prototype not established.
- name: Catalogue presentation/frame identity NOT_CONFIRMED; numeric call+conditional callback role supported by direct CALL4098EE and CMPDWORD/JZ/FF5010.
- extra: Decoder overlay ambiguity rescued by parent all19 native DB item-size/bytes manual decode; bad probe preserved. Static DB reconstruction, not runtime code match.
