# Sémantique copyblockToVRAM @ 0x0045BD30

**C9-V-R-SOL — 2026-10-09. §5.6 parent OK ; commentaire IDB ajouté, sauvegardé et relu exactement.**

- Mode : **1+V** ; C dual-gen Flash/Sol puis R Sol contre ASM.
- Push IDB : oui — append `[semantic-triple 2026-10-09]` via set_func_cmt, save true ; aucun rename/SetType/patch.

- Verdict V : **ACCEPTE** `semantic_a_sol.md` ; A == V sur rôle, nom et confiance.
- Rôle : copie un rectangle brut à éléments de deux octets depuis une source compacte vers le buffer CPU `0x01B47818`, puis transmet ses bornes inclusives à `0x00464850`, qui marque des tables associées.
- Confiance : **LIKELY** pour l'identité logique ; mécanisme local certain. VRAM/cache demeure une interprétation non confirmée, pas une preuve par le nom.
- Nom catalogue : **trop large** ; proposition documentaire `Buffer16_CopyPackedRectAndNotify`. Aucun rename. Le nom existant ne démontre pas un transfert GPU.

## Contrat observable

Deux arguments cdecl : descripteur de huit octets et source. Le descripteur contient quatre mots LE **signés** `(x,y,width,height)`. Destination initiale `0x01B47818 + 2*(1024*y+x)` modulo 32 bits ; avance source `2*width`, avance destination **2048 octets** par ligne. Copie groupée par dwords puis reste byte, sans conversion de format ni call bibliothèque.

Le helper reçoit `(x,y,x+width-1,y+height-1)`, même si hauteur zéro. Retour normal **EAX=1**, pas seulement AL ; résultat du helper ignoré. Ni clipping, test de pointeur, limites de buffer ou positivité des dimensions dans la cible. Hauteur zéro évite toute lecture source ; largeur zéro ne supprime pas le countdown de lignes. Négatifs sign-étendus deviennent des compteurs énormes, pas des entrées sûres.

## Preuves natives réobtenues

1. Freshness live : `[0x45BD30,0x45BDCE)`, **158 bytes, 57 instructions, un chunk, cinq blocs** ; SHA256 `9aea64af6568d62d39bde9e97e467f8b879d9705085c00f164c866c54ea06a86`, identique au parent.
2. `0x45BD3A/3E/41/45 MOVSX word` : champs signés offsets `2/0/4/6`. `0x45BD4F SHL 10`, `0x45BD52 ADD`, `0x45BD61 LEA base+EAX*2` : géométrie numérique, aucune inférence depuis un label.
3. `0x45BD54 LEA EDX,[EBX+EBX]`, `0x45BD86 ADD EBX,EDX`, `0x45BD8B ADD EAX,0x800` : source compacte, destination au pas fixe distinct.
4. `0x45BD7F SHR 2 / 0x45BD82 REP MOVSD`, `0x45BD88 AND 3 / 0x45BD90 REP MOVSB` : granularité réelle et chevauchements non équivalents à une simple boucle byte. Aucun `CLD` local.
5. `0x45BD57/6C TEST/JZ`, `0x45BD96/9B DEC/JNZ` : non-zéro, pas `height>0`. `0x45BD73/97 MOV [esp+0x24],ECX` réutilise le slot arg_0, pas la mémoire du descripteur.
6. `0x45BDAE/B2 LEA ...-1`, pushes `0x45BDB6..B9`, `0x45BDBA CALL 0x464850`, `0x45BDBF ADD ESP,0x10` : quatre bornes inclusives cdecl ; bloc commun également atteint hauteur zéro. `0x45BDC2 MOV EAX,1`, `0x45BDCD RET` sans immédiat ; `0x45BDCA ADD ESP,0x10` libère les locaux.
7. Callers **code** live : `0x45D6DF` dans `0x45D6B0`, words largeur/hauteur `0x100/1` à `0x45D6D1/D8` ; `0x472AF6` dans `0x472AC0`, words `(0x200,0xF0,0x100,0x10)` à `0x472ADA..AEF`. `0x45D662` dans `0x45D620` confirme la source/descripteur et le cleanup **différé** à `0x45D696 ADD ESP,8`, pas forcément immédiat.
8. Helper `0x464850` relu : cible réelle `0x467550` à `0x46486D`, cinq arguments nettoyés à `0x464874 ADD ESP,0x14`, rôle inconnu ; `0x4648F4 MOV [ECX],0xFFFFFFFF` répété trois fois avec stride `0x8980` ; `0x464922/92F MOV ECX,0x100 / REP STOSD` conditionnel. Comparaisons de zones signées (`0x464938 JLE`, `0x464954 JG`). Preuve d'effet sur les tables, pas d'une API graphique.

## Limites et traçabilité

Identité/capacité du buffer et des tables, rôle du sous-helper, garantie DF=0 et contrats des autres callers restent ouverts. Aucun transfert GPU direct ni format TIM/8bpp établi. Le C réconcilié modélise x86 32 bits, mémoire ordinaire accessible et DF=0 ; pas MMIO, atomicité/fautes dword ou alias avec slots de pile internes. **Non compilé/non exécuté en natif ; pas un remplacement de Hex-Rays natif.**

V a réobtenu opcodes/bytes/CFG et xrefs ; R a confronté les deux C à l'ASM, pas voté. Corrections Flash : granularité dword sous overlap, overflow signé du countdown, arithmétique d'adresses et assertions de nom/type excessives. L'indépendance déclarée de B Sol concerne sa reconstruction initiale sans Flash/Hex-Rays/wiki ; cette instance V/R est explicitement non aveugle.

Pack : `tools/_tmp_semantic_triple/0x45bd30/` ; livrables `semantic_v_sol.md`, `c_reconciled_sol.c`, `c_reconcile_notes_sol.md`. C exact embarqué dans [la reconstruction](../decomp/0x45BD30__copyblockToVRAM.md).

## Gate parent

Parent a relu les 57 instructions natives, le callee et sous-callee cités, les callers et leurs cleanups différés, les strides numériques, polarités/signedness et EAX complet ; deux ancrages indépendants justifient le nom trop large. CFG live exactement égal aux cinq blocs/successeurs/prédécesseurs du pack ; hash live final inchangé, octets PE disque/live égaux. C réconcilié et limites de modèle inspectés. Préimage commentaire UTF-8 SHA-256 `6d23d4cab718ab00f43d6a1970f1a62e7c7378c8b5d447c34fe7683bdfefb852`, postimage relue `ef017c48d3e49fd5255bc116eecc75d4e95a2c084cbb5e0c4b145dfb35c0556f`, tag une fois, sauvegarde true. Worker read-only ; seul le parent a ajouté le commentaire, sans type/rename/patch/debugger.
