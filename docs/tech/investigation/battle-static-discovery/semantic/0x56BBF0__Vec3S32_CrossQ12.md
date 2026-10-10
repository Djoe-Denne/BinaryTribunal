# Sémantique sub_56BBF0 @ 0x56BBF0 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le tien) : Sur six DWORD chargés depuis deux triplets, écrit trois différences cycliques de produits bas 32 bits, soustraites modulo 2³² puis décalées par SAR 12, et retourne la troisième sur EAX entier.
- Confiance : LIKELY — comportement numérique établi ; domaine et nom catalogue exclus.
- Nom catalogue : confirme uniquement la proposition numérique provisoire `sub_56BBF0_3xDiffMulLo32_SAR12`, re-dérivée des familles MOV/store et IMUL/SUB/SAR ; aucun nom catalogue consulté.
- Désaccords avec A (0–n, chacun un EA + opcode) : 0.
- Preuves (8) :
  1. `[0x56BBF0,0x56BC4A)` : concaténation des 37 instructions = 90 octets, SHA256 `e01b35718a3a2fd6ea5d2864fff4cb1bba8f524c167a8908323f5525a5dce300`. CFG unique, aucun CALL/branche ; `0x56BC49 C3` termine seul.
  2. `0x56BBF0 8B4C2408`, `0x56BBF4 8B442404`, `0x56BC1A 8B5C241C` : pointeurs DWORD p1/p0/p2 aux offsets d'entrée +8/+4/+12, compte tenu des quatre PUSH. `0x56BC0A 895C2414` écrase exactement le home p0, un DWORD ; aucun SUB ESP. POP EBX/EBP/ESI/EDI rétablissent leurs valeurs.
  3. MOV DWORD à `0x56BBFA/FD`, `0x56BC01/05/14/16` : ordre p1[1],p0[1],p1[2],p0[2],p1[0],p0[0]. Tous précèdent `0x56BC21 892B` ; aucune relecture source après ce store. Aliases de données ordinaires permis, pas de restrict implicite.
  4. IMUL `0F AF` à `0x56BC0E/11/25/28/2D/32`, SUB à `0x56BC18/35/37` : re-dérivation symbolique des différences p0[1]·p1[2]−p0[2]·p1[1], p0[2]·p1[0]−p0[0]·p1[2], p0[0]·p1[1]−p0[1]·p1[0]. Chaque produit puis différence est réduit à 32 bits AVANT le décalage.
  5. `0x56BC1E/39 C1FD0C`, `0x56BC3C C1F80C` : SAR 12 signé, plancher négatif, pas division tronquée vers zéro ; résultats dans [-524288,524287].
  6. Stores `0x56BC21 892B`, `0x56BC40 896B04`, `0x56BC44 894308` : v6 écrit avant les calculs v7/v8, puis v7/v8 écrits dans cet ordre. De `0x56BC3C` à `0x56BC49`, EAX reste v8 complet : ni BOOL, ni retour étroit/void.
  7. 30 fenêtres/xrefs vérifiés, 18 racines, profondeur 1. À `0x8EBA27/28/29` PUSH EAX/EAX/ECX puis CALL `0x8EBA2A` : p2=p1=M32[0x2797624]+0xF0, p0=base+0xE0 ; 18 sites présentent ce motif. `0x8EBA40 CALL 0x56BD20` précède `0x8EBA48 ADD ESP,0x14` : nettoyage groupé, pas preuve d'un appel à cinq arguments. Les trois entrées sont établies aussi par la cible.
  8. C autorisé SHA256 `13cfc1cdd1f4c923b0ea09f405d79011396c780365ce6e513629ed4157bacb88` : snapshots, produits/différence uint32, stores ordonnés et return v8 conformes. Helper : s32 reconstruit en int64 puis plancher explicite borné, sans shift C négatif ; assertions de largeur nécessaires. Ce helper n'est pas un CALL natif.
- Questions ouvertes : Équivalence C conditionnelle à RAM ordinaire C32, objets/extents/alignement valides, ABI/mappings fidèles et activation physique privée, sans alias source/destination avec ses slots. Ce dernier point est distinct du recouvrement entre données ordinaires et particulièrement nécessaire au store `0x56BC0A`, antérieur aux deux derniers loads. Validité des adresses, compilation/backend, ISO et exécution native non prouvés ; fenêtres callers ≠ CFG/chemins dynamiques complets. Aucun désaccord de fond avec les réserves de A.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `Vec3S32_CrossQ12` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 37 EA / 90 octets, SHA-256 `e01b35718a3a2fd6ea5d2864fff4cb1bba8f524c167a8908323f5525a5dce300`.
- C relu exact : `13cfc1cdd1f4c923b0ea09f405d79011396c780365ce6e513629ed4157bacb88` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x56bbf0/native-2026-10-10/parent_drain_gate.json`, SHA `b9c4297f61918796d936cb250d9ba28d5e8bbb458dd68ad233a4bd77c9150d3f`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_eda3acf16ffewNCy8iMxNcSLwY` ; V `ses_eda304c7effeNaLO5LIlPKsbd4`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T14:59:47.836299+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x56bbf0/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `1913f35dd39e481e173be5a4d29808d2678e02ae4cce8ef0333f35628c19c586`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: DWORDtriplet offsets0/4/8, no extra LEA/scale. Allsixsource loads precede firstdestinationstore.
- polarity: NoJcc/setcc. SixIMULlow32 and threeSUBmodulo32 BEFORE signedSAR12, not overflowingC int nor truncatingdivide.
- return: Full EAXthirdSAR12 result keptthroughPOPs/stores/C3, range[-524288,524287]; ordinaryframe/source/destinationaliases scoped.
- name: Numeric Vec3S32_CrossQ12 compatible with cyclicsixproducts/threeSUB andthreeSAR12+tripletstores; no runtime/business/type promotion.
- extra: Native30CODECALL/18roots;8EBA2A is realxref. Caller ADDESP14hex groups3arguments ofroot+2nextcall. Nativeinput home-slotspill at56BC0A requiresprivateactivationdisjointness; no source/dst blanketnonalias claim.
