# Sémantique sub_500DD0 (identifiant numérique) @ 0x500DD0 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : appelle directement `0x508360(0x01D96D78, DWORD_entrée)`, écrit zéro dans l’octet à `EAX_retour+13`, puis retourne ce même EAX complet.
- Confiance : LIKELY — mécanique locale établie ; identité métier et contrat transitif non établis.
- Nom catalogue : confirme uniquement la proposition numérique `sub_500DD0_Call508360_Bind01D96D78_ClearByte0D` ; aucun verdict sur un nom métier non fourni dans le périmètre autorisé.
- Désaccords avec A : 0.
- Preuves (6) :
  1. `0x500DD0: 8B442404` lit un DWORD `[esp+4]` ; `0x500DD4: 50` puis `0x500DD5: 68786DD901` empilent entrée puis immédiat, donc arguments droite→gauche. Aucun chargement du contenu de `0x01D96D78`.
  2. `0x500DDA: E881750000` donne indépendamment la cible `0x500DDF+0x7581=0x508360` ; pas d’appel de la valeur d’entrée.
  3. `0x500DDF: 83C408`, `0x500DE2: C6400D00`, `0x500DE6: C3` nettoient huit octets, effectuent un store BYTE sans garde NULL et retournent sans modifier EAX. Racine complète : sept instructions, 23 octets, un bloc.
  4. Caller indépendant : `0x5085D5: E8F687FFFF` appelle la racine ; `0x5085E2: 894810` utilise le retour entier comme adresse ; `0x5085E5: 83C404` nettoie l’argument avec retard. Graphe recompté : 11 xrefs CODE, cinq callers, aucun DATA recensé ; fenêtres non assimilées à des traces.
  5. `0x50837E: 894608` stocke l’entrée à `[esi+8]`. Sur branche nulle, `0x5083A9: E8EBB9EFFF` appelle `0x403D99`, puis `0x5083B1: 8BC6` restitue zéro si retour normal conforme à l’ABI : la racine tente alors le store à `0x0000000D`. Aucune bibliothèque inventée.
  6. Six fichiers gelés conformes au manifeste ; SHA-256 des 23 octets recalculé : `23247984be526e3e36c9492b6a022aabc2ca074decc3fc78e8d3b9fac328b228`. Le C `e67f4135…` n’établit ni étendue `[4]`, ni prototype natif, ni équivalence compilée.
- Questions ouvertes : effets/GPR du backend opaque, retour normal, validité des objets et de l’adresse écrite. C32, conversions PTR↔int, absence de débordement signé, RAM ordinaire stable, pile privée et ABI/codegen restent des conditions non prouvées. Aucun accès IDA supplémentaire ni runtime ; analyse exclusivement gelée.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `au_re_BdLinkTask` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 7 EA / 23 octets, SHA-256 `23247984be526e3e36c9492b6a022aabc2ca074decc3fc78e8d3b9fac328b228`.
- C relu exact : `e67f41355b0cfb1548b2c6be0a1c4f18e4a1505cf913ab4f8a2058802e359662` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x500dd0/native-2026-10-10/parent_drain_gate.json`, SHA `691cbf99d5c70296670d9e9126c3cb667cdc77ca1530b576aea879215117fce7`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_ed9c60af3ffeZzmeYNPzjw9WOp` ; V `ses_ed9b74679ffekr79cZA41T2h0S`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:15:10.817933+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x500dd0/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `d8f91f592feed6597086aee8816431123bf85832e42a8f266e03e7e4e73a4283`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: Immediate1D96D78 is an address argument, not dereferenced data; BYTEoffsetD=13, no arraystride.
- polarity: NoJcc/setcc/rootNULLguard; BYTE[EAXret+13]=0 afterdirectCALL508360. Backendzeroonnormalfailurewouldstore0xD.
- return: Full EAX from helper unchanged byADDESP8/BYTEstore/C3; not callback invocation by root.
- name: BdLink business identity NOT_CONFIRMED; directnumericcall/immediatebinding plus singleBYTEclear give provisionalnumeric role.
- extra: Twoargs pushed rightâ†’left ARGthenADDR, cleanup8; 11CODE xrefs=5callerroots, DATA0. PTR32â†”int and signed address+13 depend explicitC32/domain/privateframe/ordinaryRAM assumptions, not native ABI/backend certificate.
