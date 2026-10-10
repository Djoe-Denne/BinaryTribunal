# Sémantique sub_50a790 @ 0x50A790 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : Choisit une adresse à partir des champs de S, après l'appel 0x50bf90 avec DWORD[P+4] et relecture du global, passe cette adresse à 0x500dd0, écrit BYTE[R+0x0D]=0 puis DWORD[R+0x10]=P et rend EAX=8.
- Confiance : LIKELY — comportement numérique racine exhaustif ; contexte borné et contrat C conditionnel.
- Nom catalogue : confirme uniquement `sub_50a790`, provisoire numérique ; aucun nom métier évalué ou promu. Dérivation indépendante : dispatch LUT/JPT à 0x50a7b9/BF et passage de l'adresse puis initialisation à 0x50a861–871.
- Désaccords avec A (0–n, chacun un EA + opcode) : 0. Les attaques sur polarité, alias, appels, retour et domaine C ne réfutent pas A, qui les qualifie déjà. Le fichier `analysis.json` cité par A n'a pas été lu ; ses chiffres sont reproduits indépendamment depuis les sources autorisées.
- Preuves (8) :
  1. **Intégrité/couverture** : six hashes manifestés conformes ; concaténation des 63 instructions = 232 octets, SHA256 `908d89fd2bb77e65cf66d630e71cc787b02d5a1e13562407e63ab8406d8d257b`. Les opcodes terminaux et neuf destinations JPT reproduisent les 22 blocs et 22 chemins CFG complets ; aucune EA omise.
  2. **ABI observable, pas prototype** : 0x50a790/791 `PUSH ESI; MOV ESI,[ESP+8]` prend P à ESP_entrée+4 ; 0x50a795/798/799 charge et pousse DWORD[P+4]. Caller 0x5023d0/D1/D6 : `PUSH ESI; CALL; ADD ESP,4`, sans réécriture EAX avant RET. La racine ne réserve aucun local ; métadonnées frame_local_bytes=4, saved=0, arg_bytes=0 ne prouvent ni types ni étendue d'objet.
  3. **Deux époques EAX** : 0x50a79e `MOV EAX,[0x1d99a50]` remplace entièrement le retour de 0x50bf90. 0x50bf9b publie son argument, mais son milieu manque : S final n'est pas assimilé à DWORD[P+4]. Après 0x50a862, EAX est R, sans relecture de S ni preuve R=S.
  4. **Unsigned/tables** : 0x50a7a3/A8 `XOR ECX,ECX; MOV CL,[EAX+1]`, puis `CMP ECX,0xFE; JA` : 255 évite réellement la LUT. Les 255 octets et neuf DWORD little-endian donnent indices 0:0 ; 1:28 ; 2:38/244/254 ; 3:236/245 ; 4:237/238 ; 5:241 ; 6:247 ; 7:252 ; 8:243 autres. Strides 1/4, non stride d'objet.
  5. **Branches spécifiques** : 0x50a7c6/CB teste BYTE[S+0x10] (nonzero→0x50bd80, zéro→0x50bd00). 0x50a7e5/EB compare WORD[S+4] à 0x46/0x0F : égalité→0x50a7f8 BYTE[S+2]=0x0B, puis OR DWORD[0x1d96a9c] avec 0x40000000, adresse 0x50a9a0 ; sinon 0x50b2a0. Indices 3/4/5/6/7 sélectionnent 0x50b830/0x50bee0/0x50bdc0/0x50b0c0/0x50b190.
  6. **Défaut et alias** : 0x50a82e `OR [0x1d96a9c],0x10000000` précède les lectures, même si ces emplacements aliasent. 0x50a838/840/84e : WORD[S+4]=0xFFFF→0x50bc20 ; sinon WORD[S+6]=0→0x50bb00 ; sinon BYTE[S+2] nonzero→0x50a9a0, zéro→0x50b190. Aucun déplacement de l'OR après les tests autorisé.
  7. **Adresses stockées, retour** : seules CALL racine : 0x50a799→0x50bf90 et 0x50a862→0x500dd0. Ce dernier pousse arg2 puis arg1=0x1d96d78 vers 0x508360 ; 0x50837e stocke l'adresse sélectionnée à R+8, sans appel de celle-ci dans le contexte capturé. 0x50a86a/86e impose les stores BYTE puis DWORD ; 0x50a871 `MOV EAX,8`, `POP ESI; RET C3` rend le registre complet. Aucun garde nul ; retour nul du descendant conditionné à sa frontière ABI.
  8. **C fa39dd9c… non universel** : branches concordantes, sous conditions uniquement. Avec int32, le C `P+4` déborde pour les encodages 0x7FFFFFFC–0x7FFFFFFF, tandis que l'adresse machine est modulo 2^32 ; `R+0x10` a aussi un domaine signé restreint. Largeurs 8/16/32, endian, conversions entier/pointeur/fonction, liaison des globals/adresses, effective types, alignement, validité/étendue mémoire, alias stables en RAM ordinaire et ABI normale sont des conditions, pas des preuves de prototypes. Le store AL à 0x50c07f ne prouve pas `char` ; les onze prototypes callbacks ne sont pas démontrés.
- Questions ouvertes : milieu absent de 0x50bf90 ; frontières 0x5083c0/0x403d99 ; ABI des adresses stockées et domaine/backend du C. Aucun nom métier, ascendance complète, certificat C standard sur 4 Go, compilation ou comportement runtime/ISO revendiqué. Aucune requête native supplémentaire ni source hors manifeste scientifique.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `BattleActionSequence_DispatchTick` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 63 EA / 232 octets, SHA-256 `908d89fd2bb77e65cf66d630e71cc787b02d5a1e13562407e63ab8406d8d257b`.
- C relu exact : `fa39dd9c0472d98389a59ba6aeb62726d5a72bee52a52dc8d5fad6d03d392cc5` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x50a790/native-2026-10-10/parent_drain_gate.json`, SHA `5ff5f6a8d56ff9826531c8c3673b87138a3147bdd0080f08a639fa4c3b41f225`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_eda2e1d63ffeJbezcXZFidvOi9` ; V `ses_eda20504cffe6L7uRytE80e7bQ`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:26.260582+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x50a790/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `cbeec4e1bf98172009c023c7d28f46865fd11a767c6f0b69cf2b6b26a826c918`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: JPT DWORD entries scale4; no business struct stride implied by offsetsD/10.
- polarity: JA unsigned selector guard; BYTE checks only branch to alternative stored addresses, not invocation of selected callback.
- return: Common final writes BYTEphase0 and savedDWORD then MOV EAX,8/C3. Numeric source shows8, not pointer-return assumption.
- name: DispatchTick business identity NOT_CONFIRMED; selector table/address choice and callback-address transportâ†’initialization prove numeric role.
- extra: C32 signed address-overflow/domain restrictions remain explicit. OneCODEcaller502380 is true root;5023D0 is internal site, not another function.
