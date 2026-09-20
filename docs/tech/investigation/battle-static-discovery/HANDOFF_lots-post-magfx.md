# HANDOFF — Lots post-mag FX : contrats renderer (12, 8, 9, 10, 11)

> Prompt de reprise. Coller tel quel dans un **nouveau chat**. Critère unique : produire les
> **contrats figés rejouables** (draw packets, identités ressources, transforms caméra, ABI driver)
> nécessaires à une **DLL injectable isofonctionnelle** avec artefacts graphiques acceptables,
> dans le processus primaire FF8 (`FF8_EN.exe` `064d466b…`, base 0x400000).
> Réutiliser le pipeline §5 de [[HANDOFF_gfx-pipeline-decomp]] (pack, 1+V/2+1, check parent,
> push IDB append-only, livrable decomp/, commit par fonction). Fonctions >600 instr → méthode
> **chunk-iso** (C reconstruit en commentaire fonction), le reste → triple GLM.

## 0. État vérifié au 2026-09-20 (sonde IDB + docs)

- Couverture triple/chunk-iso fermée : Gfx_/Gpu_/GTE, swirl, TexStaging, ParseVertices,
  ParsePolygons + ParsePolygons_GfMagic (chunk-iso, C en commentaires 13,7/14,4 Ko),
  les 14+ grosses cross-fonctions >600 instr (corpus chunk-iso).
- **Mag FX : les 64 de la file courante = DONNÉES** (campagne triple en cours, ne pas replanifier).
- Re-check fin de campagne (3 fonctions >600 instr sans marque chunk) :
  `0x4BB9E0` BattleCommandMenu_MainState (904), `0x54A7F0` World_Encounter_CheckAndTrigger (888,
  hors périmètre battle), `0x6A1660` (couvert par la campagne triple de toute façon).
- Références transverses : [[projects/re-ff8/references/battle-render-pipeline-entrypoints]],
  [[projects/re-ff8/references/decomp-function-catalog]], [[projects/re-ff8/references/battle-address-catalog]],
  [[projects/re-ff8/references/chunk-iso-function-catalog]], semantic-certainty.md (ledger),
  [[projects/re-ff8/concepts/external-battle-renderer-architecture]].

---

## Lot 12 — Driver graphique externe « type 2 » (STRATÉGIQUE, non-decomp)

**Cible G** : U29.7 (backend provenance), U29.8 (generic graphics adapter), U30.5.
**Objectif** : le jeu supporte nativement un driver DLL externe — c'est la voie d'injection officielle.

Faits fermés statiquement (source : battle-render-pipeline-entrypoints.md) :
- `Gfx_LoadExternalBackendFactory` `0x409805` : `LoadLibraryA` + `GetProcAddress("new_dll_graphics_driver")`
  → `engine[756]`. **Zéro caller statique** = corps DLL hors image, point d'extension laissé ouvert.
- `Gfx_InitializeSelectedBackend` `0x40942E` : backend par `*(engine+2984)` — 0 DDrawAlt, 1 DDraw,
  **2 DLL factory**, 3 OpenGL. Objet driver 66 DWORDs `calloc(1,0x108)` depuis `GetBufApp_0xA74`
  (`*(engine+2676)`). Ctors : GL `0x4252B0` / DD `0x425540` / Alt `0x4257D0` (pas les stores internes
  `0x42537C/0x42560C/0x4258EF`).
- Contrat vtable : 52 pointeurs GL/DDraw, 57 Alt (slots Alt-only 21/24). Slots notables :
  9–14 inline state (clear-color vec4 `+0x28–0x34`), 29 SetRenderState types 0–25 (shadow
  `*(engine+2692)`), 30 CommitRenderState (bits `1<<type`), 33 blend 0–4 (case 3 sans wrapper),
  35/36 optional override, 39 SelectRenderTarget `0x41E947`, 40 BeginScene `0x41E972`,
  41 LeaveScene `0x41E99D`, 22 Release/eviction. Types sans objet : 1, 7, 17, 19–22.
  Alloc mask `0x0385FF7D`.
- Chaîne draw : `Gpu_DrawOTagCurrent 0x45D610` → `Gfx_SelectTexturePageDrawList 0x465CE0` →
  `Gfx_SubmitDisplayLists 0x4980C0` → `Gfx_SubmitTexturePageLists 0x465930` →
  `Gfx_WalkDrawList 0x4178D7` (setup `+156` / walk `+160` mappés types 0–19 → slots 43–64 par
  `Gfx_BindDrawListBackendCallbacks 0x41619A`, unique writer, type 16 mort ; RS-16 ≠ list-16).
  Viewport : `Gfx_SubmitViewportLists 0x499EA0`. Present : `Render_FramePresent_Dispatch 0x41DF0C`
  (slot 4, appelé par l'engine loop, jamais par FFBattleModule).
- Structures : `GfxDrawList` 0xEC (`+24` ctx, `+52` gen, `+88` stamp, `+148` head), OT node 24 o,
  OT battle 4386 buckets (`0x4488`, 2 buffers stride `0x9B88`), POLY_FT3 32 / FT4 40 o,
  vertex GPU 32 o. Alt FVF `0x1C4` XYZRHW|DIFFUSE|SPECULAR|TEX1 / TRIANGLELIST ; GL stride 32.
- Ouvert (live, pas decomp) : quelle voie possède le present réel — imports DirectDraw/OpenGL vs
  modules chargés d3d9.dll/d3dx9_29/NVIDIA (question ouverte n°1 du doc renderer). Tracer
  DirectDraw Flip/Blt, SwapBuffers, D3D9 Present/EndScene + module créateur.

**Livrables** : (a) spec ABI `new_dll_graphics_driver` (proto, ordre slots, conventions) ;
(b) driver pass-through prototype (observer Mode A : log/replay des draw lists) ;
(c) note backend provenance live. Réf : [[projects/re-ff8/references/legacy-ff8-render-pass-d3d12]],
[[projects/re-ff8/skills/implementing-wicked-ff8-bridge]].

---

## Lot 8 — Textures/VRAM : cache, formats, upload (G27 U27.5)

Fonctions non couvertes (sonde IDB, 1/12 taguée, ~4,5 Ko) :
- `TextureRelated` `0x41AC34` (617 o), `Texture_FindTexture` `0x419410` (582),
  `Texture_FormatCallback` `0x419656` (456), `Texture_WriteCacheFile` `0x41A875` (444),
  `Texture_TextureData` `0x41A6C6` (431), `Texture_MatchFormatFallback` `0x4199BB` (424)
  + petites sœurs du cluster 0x4194xx–0x41ACxx.
- `Gfx_InitTexturePageDrawLists` `0x464220` (1057 o) — init des lists texture-page.
Déjà fermés (réutiliser, ne pas refaire) : `Gfx_SubmitTexturePageLists 0x465930` (blend preset +
targets + states + walk + invalidate), `Gfx_SelectTexturePageDrawList 0x465CE0`,
`TexStaging_BlitRows` / `TexStaging_BlitCLUTAlpha` (tagués), VRAM writers `0x465455`/`0x4657D3`
(IDB = PE, `engine+0xBA8`).
**Contrat de finition** : identité d'une ressource texture (clé cache, format, tpage/clut),
cycle upload → cache → invalidation → release, rejouable côté host.
Pièges : les 4 tables 256-DWORD OT GPU (`g_SoftwarePrimDispatch 0xB7DC18`, Dirty `0xB7D708`,
Opaque `0xB7CF08`, Semi `0xB7D308`) ; `0x45D1FB` = bi-table Dirty OR Software.

---

## Lot 9 — Passes widget HUD (G24 U24.5 / U24.7)

Noyau non couvert (~1,5 Ko) :
- `BattleUI_WidgetDrawPass` `0x4B9DB0` (598 o), `BattleUI_WidgetUpdatePass` `0x4B9C80` (221),
  `BattleUI_LookupSlotVia_1D2B1D2` `0x49F0A0`, `BattleUI_ApplyDrawEnvClipOrSubmit` `0x49D500`,
  `BattleUI_UnionRect_1D766E8` `0x4B9B00`.
Registre fermé (contexte, ne pas refaire) : `g_BattleUI_WidgetSlots 0x1D76628` (9 × 0x14) ;
`BattleUI_RegisterWidgetSlot 0x4B9AD0` écrit `+00` update, `+08` draw, `+0xC` aux, `+10..12`
state — **jamais `+04`** ; helpers `0x4B9C00/0x4B9C40/0x4B9B90` ; `0x1D766F0` = flags QWORD
(bit 0x20), pas un 10e callback ; slots 2 (17 calls) et 6 (9 calls, GF Boost update `0x56DD70` /
draw `0x56E130`) multiplexés ; 32 registrar calls slots 1–8, slot 0 sans producteur statique.
Racines nommées (E3a) : `BattleUI_PlaceWidget_3D8`, `BattleUI_EmitDrawEnvPackets`,
`BattleUI_WriteGp0Codes_E1E5`. Adjacent : `MenuSprite_DrawCallback 0x4A0C00–0x4A0C7B`
(table `0x1D2B550`, 8×64 o) ; queue `sub_4A0C80` non référencée.
Déjà couverts : `BattleUI_HudInputAndATBTick 0x4A84E0` (decomp/), `BattleUI_RenderHud` (NCOMP
TemporaryG06NcompAdapter). Submenus BSS fnptrs `0x1D768D0/0x1D768D4/0x1D768D8`.
**Contrat** : primitives HUD → draw env packets, sémantique update/draw par slot, rejouable
indépendamment du backend.

---

## Lot 10 — Reste BdLink (G25 U25.1–U25.7)

> **STATUT 2026-09-20 : noyau + épars nommés FERMÉS.** 6/6 cibles explicites livrées (decomp/,
> commits 76f4592..20fd69f) : `0x56FE10` (2+1, LIKELY, fly-path + trail + aim caméra),
> `0x6804B0` (1+P CERTAIN, spawn interp caméra terrain), `0x63E960` (1+P CERTAIN, spawn cam
> script GF + miroir X 24FBE78), jumeaux `0x65F250`/`0x65E4B0` (1+P CERTAIN, register+bind entry),
> `0x659960` (1+P CERTAIN, tick packet stream GF Diablo). Contrat queue consigné au census
> (battle-static-call-graph.md § BdLink). Reste : la longue traîne `au_re_BdLinkTask_N`
> (≈140 callbacks par-sort), à couvrir par familles si U25.7 doit être supprimé.

Le plus gros non couvert : **`BdLinkCallback_56FE10` `0x56FE10` (1921 o)**.
Épars : `BdLinkTask_Register_680520 0x6804B0`, `0x63E960`, `0x65F250/0x65E4B0` (jumeaux),
`0x659960` + callbacks dispersés 0x5xxxxx–0x66xxxx restants (census : battle-static-call-graph).
Déjà livrés (decomp/, ne pas refaire) : `BdLinkTask_Register 0x508360`, `BdLinkTask_Pump 0x508420`,
`au_re_BdLinkTask 0x500DD0/0x506C10/0x5085D0`, `BdLinkTask_Spawn 0x508630`,
`BdLink_GF_battle_input_and_texture_upload 0x500900`, `BS_RenderRelated 0x500FD0`,
callbacks `0x5857D0/0x5A5890/0x5A6D20/0x5FFFE0/0x606DB0`, `0x664CD0`, `0x8DC540`.
Racine dispatcher : `BattleTaskQueue_DispatchIds1to14`.
**Contrat** : ordre tâches/callbacks, busy/completion, condition de drain — c'est la queue NCOMP
que G07 maintient (pompe file-callbacks + BdLink/camera/upload par tick) ; sa fermeture conditionne
la suppression de l'unité présentation native scellée (U25.7).

---

## Lot 11 — CAM : recovery des layouts globaux (G26 U26.6/U26.7)

Code mince déjà nommé : `Camera_SetPackedS16PairAndRefreshFloatCache 0x45D7F0` (857 o),
`Camera_SetPackedSlots_8to12 0x45DE50`, `_15_16_17 0x45DD60`, `Camera_SetSlots5to7_FromIndexed19_1B
0x64DE40`, `Camera_SetPackedSlots_024_Val_13_Zero 0x64DE00`, `Camera_XformBone_MVMVA_GetWord3
0x6F0CC0`, `BattleCamera_DispatchVmOpcode 0x509810`, `BattleCamera_BindResourceSections 0x509970`,
`BattleCamera_ResetDefaultView`, takeover stubs `0xB60650/0xB53970/0xB3A270/0xB2BC60`.
**Le vrai travail est data, pas code** : layouts CAM globaux `.x` + `mag*` (trou borné Vague D) ;
CAM C0M max 22 vs engine 32 ; H6 **est** la base de collection (pas `res+u16[res+4]`).
Flux prouvé (staging battle_camera) : `BdLink_GF_battle_input_and_texture_upload` appelle
`updateBattleCamera` et `BattleCamera_BuildViewAndConsumeDeltas` chaque frame, puis
`Call_Bs_parseCamera2` / `Call_Bs_ParseCamera` (projection).
Réfs : [[projects/re-ff8/concepts/battle-camera-architecture]],
`_staging/investigations/battle_camera.md`.
**Contrat** : par frame — view/proj, conventions de coordonnées, flags pause — consommable
directement par le host renderer.

---

## Ordre et finition

- Ordre : **12 → 8 → 9**, puis 10 / 11 (lots légers, en fin de campagne mag FX).
- Un lot est « fini » quand son contrat est : figé, prouvé contre l'ASM/IDB, rejouable par le
  bridge, et consigné (livrables decomp/ + page référence à jour + commit).
- Ne jamais committer `tools/_tmp_*` ; push IDB append-only + `save_database` par fonction.
