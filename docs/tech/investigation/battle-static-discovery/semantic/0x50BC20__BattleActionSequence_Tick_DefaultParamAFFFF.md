# Sémantique fn_50BC20 @ 0x50BC20 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : Pilote une transition à quatre phases au BYTE `[argument+0x0D]`, avec préparation opaque, attentes, invocation indirecte et clôture renvoyant 2.
- Confiance : LIKELY ; métier et ABI des helpers inconnus, opérations locales vérifiées sur les données numériques gelées, sans certification native nouvelle.
- Nom catalogue : confirme uniquement la proposition abstraite provisoire `Phase4_InvokeIndirectAndFinalize`, re-dérivée du dispatch et du chemin indirect/final ; nom IDA/catalogue réel exclu du périmètre.
- Désaccords avec A (0–n, chacun un EA + opcode) : Aucun. Les attaques sur les alias, captures, largeurs, polarités et entrées GPR ne réfutent pas A ; ses réserves empêchent justement de promouvoir le C en preuve ABI.
- Preuves (8) :
  1. **Couverture/CFG** : 66/66 EA, 206 octets contigus `[0x50BC20,0x50BCEE)`, un chunk ; concaténation ASM égale au hex et au SHA-256 `7b651d08f5f8022f19afc76ba972bf95df1fad26fa716345bc095d3fe39ac958`. À `0x50BC36`, `77 2E` est **JA unsigned** ; `0x50BC38`, `FF 24 85 F0 BC 50 00`, indexe quatre DWORD séparés à stride 4 vers `0x50BC3F/6B/7E/BE`. Phases 4–255 : retour EAX=0, après les deux lectures initiales.
  2. **Entrée et capture** : `0x50BC21: 8B 74 24 08` après PUSH ESI lit `[ESP_entrée+4]` ; `0x50BC26: 8A 4E 0D` ne remplace que CL ; `0x50BC29: 8B 7E 10` capture EDI avant dispatch. Quatre `C3` restaurent ESI/EDI, sans dépiler l’argument : compatible caller-cleanup, non preuve d’une ABI exclusivement cdecl.
  3. **Phase 0** : `0x50BC3F: E8 0C EB FF FF` appelle `0x50A750` **avant** la relecture `[0x1D99A50]` à `0x50BC44`. `33 C0 / 68 C0 FE 1D 02 / 66 8B 41 06 / 50` construisent `(zext16([p+6]), adresse 0x21DFEC0)` pour `0x50AF20`. `0x50BC5B: 8A 46 0D` relit la phase après l’appel ; INC AL et store incrémentent sa valeur actuelle modulo 256, pas nécessairement l’ancien zéro.
  4. **Phase 1** : `0x50BC6B: A1 C8 99 D9 01`, `85 C0`, `0x50BC72: 7C F2` attendent sur un DWORD **signé négatif**. Sinon `FE C1 / 88 4E 0D` incrémentent le CL capturé à l’entrée, sans appel ni relecture intermédiaires.
  5. **Phase 2** : `TEST AL,AL` met CF=0 ; le `JA` à `0x50BC85` attend donc sur BYTE non nul, comme le JNZ à `0x50BC8E` pour le second BYTE. Après `0x50AFC0`, `0x50BC95/9A/A3/A9` imposent PUSH `0x1D99A78` → store **WORD FFFF** → CALL DWORD `[0x21DFEC0]` → store **EAX complet** `[0x1D96AAC]`. La phase est ensuite relue et incrémentée. L’immédiat op_t all-ones à `0x50BC9A` n’élargit pas le store WORD encodé.
  6. **Phase 3/alias** : `0x50BCC3: 85 C0` teste tout le retour de `0x50AE80`, pas AL. Après `0x50AED0`, `0x50BCCC: A1 9C 6A D9 01` capture le DWORD **avant** `0x50BCD1: C6 47 01 FF`. `0x50BCD5: 24 EF` masque seulement AL ; `0x50BCD8: A3 9C 6A D9 01` réécrit la capture, conservant ses 24 bits hauts même si le store BYTE chevauche cette globale. EDI reste la capture initiale, même si un helper modifie `[argument+0x10]`. Puis DWORD zéro `[0x1D99A64]`, EAX=2, aucun incrément de phase.
  7. **Arbre indépendant** : zéro xref CODE direct et une DATA vers la cible. `0x50A85C: B8 20 BC 50 00`, PUSH EAX, CALL rel32 `0x500DD0` transmettent **l’adresse**, sans appeler `0x50BC20` ; les stores suivants initialisent `+0x0D/+0x10`. Les deux ancêtres CODE vont à `0x50A790` puis `0x502380`, non à la cible. Les cinq rel32 sortants et l’appel indirect concordent avec les octets ; fenêtres et profondeur sont bornées.
  8. **C versus machine** : le C e27d1051 concorde sur les opérations locales, y compris capture finale avant store BYTE et relectures après helpers. Il ne prouve ni prototypes, ni types métier/pointeurs, ni bindings RAM, ni alias/backend. Le MOV CL conserve les 24 bits hauts d’ECX ; le dispatch ne les utilise pas, mais les helpers peuvent les voir. Entre `0x50BC90` et `0x50BCA3`, PUSH et store WORD ne remplacent pas EAX/ECX/EDX laissés par `0x50AFC0`. Réduire ces appels aux seuls paramètres C serait une hypothèse supplémentaire, déjà déclarée ouverte par A.
- Questions ouvertes : Invocateurs réels, cibles et conventions des helpers/callback, transport GPR/flags, préservation ESI/EDI, validité et alias des pointeurs, bindings RAM, C32/backend et conditions d’exécution. Ni corps de helpers ni preuve backend fournis ; aucun runtime, appel IDA ou certificat natif ajouté. Accord A=V limité à cette sémantique numérique abstraite.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `BattleActionSequence_Tick_DefaultParamAFFFF` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 66 EA / 206 octets, SHA-256 `7b651d08f5f8022f19afc76ba972bf95df1fad26fa716345bc095d3fe39ac958`.
- C relu exact : `e27d1051670a2a016bb1036d2d8a36f0083ceb5ca46bb64897084f1813d2dbb8` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x50bc20/native-2026-10-10/parent_drain_gate.json`, SHA `83e516ad8c8f46599af181b17474780af9a64813b70c43e0722237cf248cc8f1`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_ed9e0dd2fffe4hoMk7wS1YtcrI` ; V `ses_ed9cdbd50ffeMIP4Podk7L22TH`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:27.098388+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x50bc20/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `39d22cf661bc2f769ceeaf80302ae77b1c560e69a56da9e8bbf17b095e467d29`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: FourJPT DWORD entries scale4 at50BCF0; callbackslot21DFEC0 is separate DWORD, not extra native argument.
- polarity: JA unsignedphase0..3, signedJL waits negativeDWORD, JA afterTESTAL checks nonzero becauseCF=0. Lastgate fullEAXTEST.
- return: Full EAX0 on waits/out-of-range,2 on final phase; callback fullEAX stored before phase reloaded. Not AL return.
- name: DefaultParamA_FFFF business identity NOT_CONFIRMED; four-phase dispatch and ordered WORD/callback/final captures give numeric role.
- extra: LastDWORD capture1D96A9C precedes BYTE[EDI+1] write; maskONLYAL preserveshigh24. Root0CODE/1DATA; source ECXhigh24/nativeGPR ABI conditional.
