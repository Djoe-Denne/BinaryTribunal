# Pack commentaires IDB — battle models lot 14 (2026-09-25)

> **Statut : PRÊT À APPLIQUER — non appliqué.** `ida-pro-mcp` n'était pas branché
> dans la session de découverte (catalog code-mode : qmd/serena/browser/1MCP
> seulement). Le push IDB reste réservé au parent — appliquer ce pack à la
> prochaine session avec l'IDA branché.
>
> Procédure (règles projet) :
> 1. Pour chaque EA ci-dessous : lire le commentaire de fonction courant
>    (`get_func_cmt`) — **si le tag de campagne est déjà présent → skip**.
> 2. Append via `set_func_cmt` (jamais `set_comments`), tag
>    `[battle-models-discovery 2026-09-25]` en tête du bloc ajouté.
> 3. **Pas de rename, pas de `SetType`, pas de `patch`/`patch_asm`.**
> 4. `idc.save_database(idc.get_idb_path())` après chaque push réussi.
>
> Fiabilités : **HIGH** = preuve registre `c0m-registry.json` (proof_notes,
> disque hashé) + probe byte-exact 200/200 + decomp commitée ;
> **MEDIUM** = conflit de nommage non tranché (lot sémantique à suivre).

## HIGH

| EA | Commentaire à appender |
| --- | --- |
| `0x507080` | `[battle-models-discovery 2026-09-25] (HIGH) BattleModel_DispatchLoaderByActorId: routes actor_id -> 0x5077B0 bodies (D0C*, 7 sections TIM H6) / 0x5079B0 Edea body (D7C016, 10 sections) / 0x507120 monsters (c0m, 11 sections) / 0x507BF0 weapons (D0W*, 8 sections TIM H7) / 0x507E20 Zell-Kiros inline (5 sections, H1=mesh) / 0x507F80 derived C0M127 (2-section overlay). sub ebx,0x1000 hidden by Hex-Rays. Preuves: c0m-registry.json proof_notes + probe tools/battle-model-probe 200/200 sha256.` |
| `0x507120` | `[battle-models-discovery 2026-09-25] (HIGH) BattleModel_LoadMonster: copie H1-H9, H11+H2 -> 0x507400 (TIM pages+TPage patch), H7/H8 publiés au domaine. Preuves: c0m registry (loader monster) + probe byte-exact (11/11 sections).` |
| `0x5077B0` | `[battle-models-discovery 2026-09-25] (HIGH) bodies loader: D0C* 7 sections (s1 skel, s2 geo, s3 anim, s4 dynTex blink, s5 camera, s6 textures, s7 extra-anim bind corps+arme), TIM via H6.` |
| `0x5079B0` | `[battle-models-discovery 2026-09-25] (HIGH) Edea body loader: D7C016, 10 sections (corps + AnimSeq/Sounds/Bank splicés en 6/7/8).` |
| `0x507BF0` | `[battle-models-discovery 2026-09-25] (HIGH) weapons loader: D0W* 8 sections (s4 AnimSeq VM pour l'entité composite, TIM H7); Zell/Kiros (d1w/d9w) 5 sections sans skel/anim -> inline 0x507E20.` |
| `0x507E20` | `[battle-models-discovery 2026-09-25] (HIGH) Zell/Kiros inline loader: fichiers 5 sections, H1 = mesh, inliné dans le record type-1 du corps.` |
| `0x507F80` | `[battle-models-discovery 2026-09-25] (HIGH) derived loader C0M127: monster_id 143 réutilise le record live type-3 de l'actor 142, slotte les 127 H1/H2 en info/AI (overlay 2 sections).` |
| `0x507400` | `[battle-models-discovery 2026-09-25] (HIGH) BattleModel_AllocateTexturePagesAndPatchTPage: H11 (TIM container u32 count+offsets, magic 0x10) + H2 remap TPage (0x507550). Preuves: c0m registry + probe (TIMs 8bpp CLUT 256, mot CLUT 16 bits complet — pas d'aliasing low-byte, piège c0m121).` |
| `0x508C90` | `[battle-models-discovery 2026-09-25] (HIGH) BattleSkeleton_BuildHierarchicalFK: s1 squelette (header 16 o + bones 48 o, parent 0xFFFF=root, tail +10..+47 runtime, non-nulle chez certains monstres).` |
| `0x507010` | `[battle-models-discovery 2026-09-25] (HIGH) BattleAnim_ReserveBonePoseScratch: scratch pose par frame (c0m monstres; absents des fichiers 5-section Zell/Kiros).` |
| `0x508F90` | `[battle-models-discovery 2026-09-25] (HIGH) Battle_ReadAnimation: s3 bitstream LSB-first continu — 3x positions {3,6,9,16} signées deltas cumulés, 1 bit mode, 3x rotations/bone {3,6,8,12} delta cumulé, scale (raw+1024)/1024 absolu si mode. Preuves: c0m registry (3103 anims, 0 mismatch) + probe byte-exact.` |
| `0x507550` | `[battle-models-discovery 2026-09-25] (HIGH) BattleMesh_RemapPrimitiveTPageBits: s2 mesh TPage patchés contre H11 (VRAM) avant RenderGeometry.` |
| `0x50C780` | `[battle-models-discovery 2026-09-25] (HIGH) BattleModel_ApplyH4UvSlot: s4 UV-slot table (37/143 présents, 16-324 o) consommée par opcodes 0x80/0x9B/0x9F/0xBD/0xBE depuis 0x504BB0. Sisters: 0x50C860/0x50C950.` |
| `0x50C860` | `[battle-models-discovery 2026-09-25] (HIGH) BattleModel_ScrollH4SlotV (sister de 0x50C780, s4 UV slots).` |
| `0x50C950` | `[battle-models-discovery 2026-09-25] (HIGH) BattleModel_AdvanceH4Frame (sister de 0x50C780, s4 UV slots).` |
| `0x504BB0` | `[battle-models-discovery 2026-09-25] (HIGH) Effect script VM: opcodes 0x80/0x9B/0x9F/0xBD/0xBE consomment la s4 (UV dynamiques) via 0x50C780/sisters — preuve registre c0m (proof_notes).` |
| `0x48BBD0` | `[battle-models-discovery 2026-09-25] (HIGH) setMonsterInfoFromDatInfoSection: H7 (380 o constants par monstre). Preuves: c0m registry + layout s7 (probe).` |
| `0x4877F0` | `[battle-models-discovery 2026-09-25] (HIGH) EnemyAI_DispatchSection: H8 (AI, sous-section header) -> VM 0x487DF0. Preuves: c0m registry + probe (c0m127 overlay = info+AI seulement).` |
| `0x505F00` | `[battle-models-discovery 2026-09-25] (HIGH) Camera collection H6 consumer (null-guard only).` |
| `0x506190` | `[battle-models-discovery 2026-09-25] (HIGH) Camera collection H6 consumer (read record +0x2C).` |
| `0x5064F0` | `[battle-models-discovery 2026-09-25] (HIGH) Camera H6 tracks 22/23 (133/143 fichiers; c0m101 seul à avoir 2 banks; max attesté 22 keys/seg).` |
| `0x501C60` | `[battle-models-discovery 2026-09-25] (HIGH) BS_SetAKAOHeader: reset global AKAO (pas de consumer C0M direct; H9/H10 consommés via bank latch).` |

## MEDIUM (conflits de nommage — lot sémantique à suivre)

| EA | Commentaire à appender |
| --- | --- |
| `0x5093F0` | `[battle-models-discovery 2026-09-25] (MEDIUM) Battle__ReadBoneScale: registre c0m le cite pour le scale-per-frame s3 (raw+1024 absolu), mais la decomp commitée de 0x508F90 étiquette l'adresse voisine au_re_bitReader — arbitrage en lot sémantique avant promotion.` |
| `0x505E30` | `[battle-models-discovery 2026-09-25] (MEDIUM naming, HIGH address) Le registre c0m cite GetTextureEOF ici; le catalog actuel nomme la fonction BattleTimQueue_EnqueueType1 (renommée après génération du registre) — nommage registre = historique.` |

## Déjà couvert par des pushes antérieurs (vérifier tag → skip)

`0x5099D0` RenderGeometry, `0x50F900` ParseVertices, `0x50FDF0` ParsePolygons,
`0x4617F0` Gpu_EmitPolyFT3, `0x461A90` Gpu_EmitPolyFT4, `0x45C7A0`
OtNode24_PoolAllocLink, `0x4178D7` Gfx_WalkDrawList, `0x43E24A`
RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4, `0x43E356` _VB, `0x4257D0`
RenderBackend_Construct_DDrawAlt, `0x41DF0C` Render_FramePresent_Dispatch,
`0x460860` Gte_MVMVA, `0x45E5C0/0x45E610` Gte_AVSZ3/4, `0x45EE10` Gte_NCLIP.

Ces fonctions ont été sémantisées par les lots antérieurs (livrables `decomp/`
commités) ; le présent pack n'ajoute pas de commentaire si leur tag de campagne
d'origine est déjà présent.
