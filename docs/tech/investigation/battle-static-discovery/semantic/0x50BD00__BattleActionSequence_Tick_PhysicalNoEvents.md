# Sémantique sub_50BD00 @ 0x50BD00 (review V)

- Verdict : ACCEPTE
- Rôle (1 phrase, le mien) : Dispatch sur le BYTE `entrée+0x0D`, conditionnant deux appels numériques, une modification de DWORD et des transitions BYTE, avec retour EAX entier dépendant du chemin.
- Confiance : LIKELY — qualification structurelle seulement ; les opérations locales sont établies, pas le domaine ni l'ABI native complète.
- Nom catalogue : confirme uniquement la proposition numérique provisoire `sub_50BD00_StepByte0D`, re-dérivée du dispatch et de l'initialisation du pointeur transmis ; aucun nom métier/catalogue évalué ou validé.
- Désaccords avec A (0–n, chacun un EA + opcode) : 0. L'écart C/ASM déjà signalé par A reste réel : `0x50BD08: 8A 46 0D` précède `0x50BD0B: 8B 7E 10`, contrairement au C. Sa tolérance exige mémoire ordinaire stable, sans MMIO ni observations concurrentes ; aucune équivalence inconditionnelle n'est accordée.
- Preuves (8) :
  1. **Couverture indépendante** : les 48 enregistrements numériques couvrent sans trou `[0x50BD00,0x50BD7F)`, exactement 127 octets ; concaténation, SHA-256 natif `f4a33b347c24fb502248cf9cee28a641b774dfb263c5ccbd270e9c6d923f3cd4` et listing concordent. Les 154 enregistrements racine/support concordent avec leurs octets du listing ; les trois corps `0x50AE00`, `0x508540`, `0x505C00` sont complets.
  2. **Contre-exemple au retour booléen** : `0x50BD05: 33 C0`, `0x50BD08: 8A 46 0D`, puis `0x50BD0E: 83 E8 00`, `0x50BD13/16: 48` et les branches distinguent 0/1/2. Pour 3…255, `0x50BD17: 75 63` rejoint directement `0x50BD7C: 5F; 5E; C3`, laissant EAX=1…253. Les sorties `0x50BD27/70: B8 02 00 00 00` et `0x50BD7A: 33 C0` rendent respectivement 2 et 0 : EAX n'est pas booléen.
  3. **Prédicat réellement re-dérivé** : `0x50BD19/2E: E8` ciblent `0x50AE00`, puis `0x50BD1E/33: 85 C0` testent tout EAX. Le wrapper pousse `0x40`, `0x1A`, puis `[0x1D99A40]`. Dans le corps complet `0x508540`, `F6 00 08`, `85 D1` et `85 C8` conduisent à EAX=0 si `[p]&8`, `[p+8]&0x1A`, ou si `[p+5]==0` et `WORD [[p+0x74]+0x2C]&0x40` ; sinon EAX=1. `0x508562: 33 C0; 66 8B 42 2C` zéro-étend le WORD ; ce n'est pas un résultat AL-only.
  4. **Transitions et capture** : `0x50BD0B: 8B 7E 10` capture EDI avant les appels. État 0 : prédicat non nul → 0 ; sinon `0x50BD37: FE 46 0D`, puis chemin commun. État 1 : chemin commun. État 2 : prédicat non nul → 0 ; sinon `0x50BD22: C6 47 01 FF` et retour 2. `0x50BD77: FE 46 0D` incrémente le BYTE courant après helper, modulo 256, pas un snapshot ni un entier C non borné.
  5. **Ordre et arguments** : `0x50BD3A/3F` chargent les deux globals ; `0x50BD45–4E` lisent/modifient/écrivent le DWORD `+8`, avec `81 E1 FF FF 7F FF` effaçant exactement `0x00800000`, avant `0x50BD53: 8A 4A 02`. `33 C9; 51; 50; E8` donne les arguments de pile de `0x505C00` : premier pointeur, puis BYTE zéro-étendu. Aucun stride ni bibliothèque inventés.
  6. **Contre-exemple au pointeur stable** : après `0x50BD58: E8`, `0x50BD5D: A1 50 9A D9 01` recharge le global avant `0x50BD62: 83 C4 08`. `0x50BD65: 80 78 02 0A` compare son BYTE `+2` à `0x0A` : égal → incrément courant puis 0 ; différent → `0x50BD6B: C6 47 01 FF` via EDI initial et 2. Les aliases et changements par helper ne sont pas exclus.
  7. **Preuve indépendante du rôle de pointeur transmis** : graphe racine 0 CODE / 1 DATA ; `0x50A7D7: B8 00 BD 50 00`, `0x50A861: 50` et `0x50A862: E8` transmettent l'adresse à `0x500DD0`, puis `0x50A86A: C6 40 0D 00` et `0x50A86E: 89 70 10` initialisent les deux offsets. Cela étaye le dispatch numérique, pas l'identité d'un exécuteur ni une invocation effective. Frontières entrantes/sortantes **TRUNCATED** ; pas de callee métier emprunté à A.
  8. **Limites C/ABI** : `0x50BD00/07: 56/57` et les sorties `5F; 5E; C3` établissent sauvegardes locales et absence de nettoyage de l'argument entrant, pas une certification native des helpers. EAX/ECX/EDX intermédiaires aux appels peuvent être observables. Les PUSH écrivent physiquement la pile : aucune assertion « aucune écriture RAM ». Le C de hash `413b70bc…` conserve contrôle, largeur, masque et reload, mais ordre initial, adresses `int`, débordement signé `v_0+8`, bindings, aliasing et backend laissent SourceC32/RAMC32/privateframe conditionnels.
- Questions ouvertes : ABI et préservation effectives aux frontières `0x506C10`/`0x505BC0`, éventuels registres cachés, exécuteur derrière `0x500DD0`, objets/aliases/mapping et modèle mémoire C32. Aucun résultat runtime, nom métier ou droit de promotion IDB déduit. Aucun approfondissement natif nécessaire : pas d'ambiguïté numérique restante dans la racine.

## Gate parent — drain 2026-10-10

- Mode : canon 1+V ; A=V sur le rôle numérique, nom provisoire et LIKELY.
- Nom fichier/catalogue : `BattleActionSequence_Tick_PhysicalNoEvents` conservé, **pas une confirmation métier** ; aucune modification IDA du nom/type.
- Source native originale : 48 EA / 127 octets, SHA-256 `f4a33b347c24fb502248cf9cee28a641b774dfb263c5ccbd270e9c6d923f3cd4`.
- C relu exact : `413b70bc1cad0aef4b41590f7054776d1bf9a59dc78379ca5ef02c8a02624c43` ; payload de fence identique aux octets du fichier accepté.
- Gate §5.6 : parent native bytes/xrefs/callees, stride, polarité/signedness, EAX et deux preuves nominales numériques. Receipt `tools/_tmp_semantic_triple/0x50bd00/native-2026-10-10/parent_drain_gate.json`, SHA `ac8c1f659b99cdea3f303eaabc594beafa8716ca2d8b5e06a3e07f02e4568855`.
- Domaine : **numérique statique LIKELY** ; C32/RAM ordinaire, objets/bindings/frame/ABI/hook/codegen selon leurs hypothèses. Aucun backend compilé, effet live/same-frame ou promotion ISO.
- A `ses_ed9e22906ffeKQvJztP82Y7Liy` ; V `ses_ed9d581d5ffejJLBec9H2HRSEj`, native Sol `variant=high`. Sources C historiques API indépendance UNVALIDATED ; exceptions administratives conservées, pas de certificat whole-context blind.
- IDB : append unique `set_func_cmt`, SAVE natif `True` à `2026-10-10T15:10:27.476200+00:00`, readback exact après SAVE, nom/type/RUN inchangés. Receipt `tools/_tmp_semantic_triple/0x50bd00/native-2026-10-10/parent_IDB_append_save_readback.json` ; commentaire SHA-256 `26d8b6846be3743d38cfc5103e0544b3ff25f8b4b63fcebd44b6fa439c2ea20b`. Aucun commit/effet runtime présumé.

### Vérification parent

- stride: OffsetsD/10 and globalfields2/8, no arraystride inferred.
- polarity: Byte states0/1/2 vsothers; fullEAXpredicate. PostCALL globalpointer reload before BYTE2==0A, not stable pointer guess.
- return: Full EAX0/2 or s-2 for initial3..255={1..253}; not bool or only{0,2}.
- name: PhysicalNoEvents business identity NOT_CONFIRMED; Byte0Ddispatch and mask800000 clear+orderedcalls give numeric role.
- extra: Root0CODE/1DATA. InitialCload10-beforeD inverseorder tolerated only stable ordinaryRAM/noMMIO/concurrency; preservationofGPR/privateframe/backend unproved.

### Erratum de sérialisation Git — C inchangé

La source C byte-exacte est conservée dans le carrier Base64 du [decomp](../decomp/0x50BD00__BattleActionSequence_Tick_PhysicalNoEvents.md) : 1257 octets, SHA-256 `413b70bc1cad0aef4b41590f7054776d1bf9a59dc78379ca5ef02c8a02624c43`. Le fence C rendu peut être normalisé LF par Git ; la présente correction supersède sa qualification antérieure de byte-exactitude. Source, algorithme, confiance, gate ASM, append/save/readback inchangés. Réparation documentaire ≠ nouvelle clôture ; aucun nouveau push IDB.
