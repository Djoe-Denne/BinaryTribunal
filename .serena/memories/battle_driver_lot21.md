# Driver battle — lot 21 offline (2026-10-01, consolidé 2026-10-02)

## Statut et sources
Verdict PARTIAL : ciel, falaise blanche, terrain et entités reconstruits ensemble; UI/blend et effets directs encore non fidèles. Ne pas annoncer PASS global.
- Rapport canonique : docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot21_2026-10-01.md
- Wiki : obsidian-docs/projects/re-ff8/references/driver-replay-fond-uv-composite-lot21-2026-10-01.md
- Code : tools/_tmp_af3dn_drop/decode/render_lot21.py et test_lot21.py. L'oracle render_lot17.py est conservé.
- Preuves : tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/manifest.json et PNG comparatifs; source dump lot20/battle_v13/gfx_passthrough_dump.bin.

## Conclusions fermées
- Dump strict v13 build 0x5640 : 16 frames, 2 512 records, 16 TX07, 192 TR08. TEXWIN={0,0,0,0} sur les 16 frames : W_effectif=256, ne pas rouvrir hypothèse fenêtre.
- UV : conserver association sommet/UV capturée, rot0. Les indices ont déjà l'association C-A-B; une rotation supplémentaire casse les continuités. Le replay générique du fond omettait RHW; la perspective est nécessaire. Pas de swizzle battle.
- Bindings mesurés : offset logique 05AF00, rect miroir(0,256)=ciel ET falaise blanche; 059E20,(256,256)=terrain proche; 058E40,(512,256)=terrain lointain/horizon. Ne pas attribuer la falaise à 058E40.
- Slot49 texobj=0 : 96 verts d'ombres, 6 de curseur, 16 de barres HP/status (118/frame); ce n'est pas la falaise. Les quatre textures sans match évoquées par le prompt sont UI/font. Binding hérité slot49 absent : MissingEvidence, aucun binding inventé.
- Ordre ND08 = soumissions hôte rebucketées TPage/CLUT/état, pas OT global PSX. ASM read-only : 0x45D080 deux passes, 0x4617F0 -> sélection 0x465CE0, soumission 0x465930, walk 0x4178D7 préserve seulement l'ordre intra-liste. Fond->acteurs->UI est une candidate explicite, jamais une restitution OT prouvée. Un replay fidèle hôte requerrait aussi ses états depth/blend/cibles.

## Candidats et limites
- FVF diffuse alpha127/255 source-over testé; ce n'est pas une preuve du mode STP/ABR réel. Palette alpha nonzero n'implique pas un état de blend. Politique atlas UI candidate seulement.
- Raster top-left : une arête partagée appartient à un seul triangle, évite double blend alpha127; test permanent.
- Restent absents : identité OT globale, état blend hôte, binding hérité slot49. UI pâle/masks/barres HP non fidèles. Aucune capture live/debugger requise ou exécutée pour ce lot.

## Validation consignée
23/23 tests PASS (17 lot17 +6 lot21), py_compile et diff-check PASS; ingestion ciblée 13/13 hashes exacts et 9 PNG byte-exact. SHA256 renderer ec4e91c895cdcc04d73b5a7f2f6805f1ea5ef68efc4389049c5772681c6f8421 vérifié contre manifest le 2026-10-02. Le verify global du vault échoue sur delta historique unmanaged-source hors lot21; ne pas le présenter PASS. QMD smoke seulement sur index existant, aucune fraîcheur des nouvelles pages affirmée.

## Synchronisation IDB autorisée le 2026-10-02
L'opérateur a ensuite explicitement demandé d'intégrer les découvertes à l'IDB avec les nomenclatures habituelles. ROOT a appliqué et sauvegardé D:/Modding/ff8/retro-exe/FF8_EN.exe - 9.3.i64 (input MD5 be8b278becf6757bb811acd45d717d9c).
- 10 compléments non-répétables tagués [driver-passthrough lot21 2026-10-02] : 45D080,4617F0,461A30,465CE0,465930,4178D7,460CE0,45BC60,41619A,41E752.
- Seul rename : sub_460CE0 -> Gpu_EndPrimitivePass, nom déjà certifié semantic-triple CERTAIN 1+P; signature corrigée void __cdecl(void), callers ignorent EAX.
- Commentaires historiques et répétables préservés; neuf autres noms/types conservés; octets du code inchangés. Aucun debugger ni capture live. save_database(None,0)=true.
- Plan figé : docs/tech/investigation/battle-static-discovery/driver-passthrough/IDB_SYNC_lot21_2026-10-02.json, SHA23785c100c7d35e946b467cc61e619a3dd66722b00c4dc0a518b2f20070f686a.
- Receipt d'application/sauvegarde : même dossier IDB_SYNC_lot21_2026-10-02.receipt.json; rapport IDB_SYNC_lot21_2026-10-02.md.
- Backup avant modification : D:/Modding/ff8/retro-exe/FF8_EN.exe - 9.3.i64.lot21-before-20261002-182318.bak; préimages complètes et script d'application dans tools/_tmp_ida_lot21_sync/2026-10-02/.
Les observations offline restent à portée de capture et PARTIAL; les objets texobj/runtime ne sont jamais promus en adresses statiques. Le travail initial du 2026-10-01 était read-only; ne pas confondre cet état historique avec la synchronisation du 2026-10-02.

