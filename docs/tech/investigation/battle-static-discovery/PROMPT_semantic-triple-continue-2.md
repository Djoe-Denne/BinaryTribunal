# Prompt de reprise sémantique pipeline graphique — file d'attente v2 (cartographie complète)

**Coller ce document dans un nouveau chat.**

Lire d'abord, dans cet ordre :

1. [`HANDOFF_semantic-triple-review.md`](HANDOFF_semantic-triple-review.md) — règles inviolables, pipeline §5 (modes 1+V / 1+P / 2+1, vérifications §5.6), pièges §8, cadence 5 par 5.
2. [`PROMPT_semantic-triple-continue.md`](PROMPT_semantic-triple-continue.md) (v1) — préambule outillage, contrats A/V/B/R, file courante.

**Ce prompt prend le relais de la v1** : tout le préambule de la v1 (changement d'outillage, contrats, règles transverses, exclusions) reste applicable **tel quel**, seule la **file d'attente** change — elle s'élargit à la cartographie quasi exhaustive du pipeline graphique ci-dessous (fan-out callers/callees prof. 2 depuis les ~34 fonctions connues, croisement ledger `semantic-certainty.md` + 437 `decomp/` committés, vendor filtré).

**Périmètre inchangé : PIPELINE GRAPHIQUE SEULEMENT** (décision 2026-09-15). Inclus : cœur OT/paquets GPU, draw-list/TIM/TPage/CLUT, render state interne, parsers mesh ISO, émission primitives, blit/staging texture, swirl/transition overlay, GTE (support transform), soumission battle/menus, chemin render battle (acteurs/mesh), mag FX. **Exclus** : vendor PC (`RenderGL_*`, `RenderDDraw*`, `GfxDriver_*`, backend constructors, `gl*`/`wgl*`/DDraw IAT), CRT, non-graphique (battle logic, AI, GF gameplay, son, `0x47CE10`/`0x47CEF0`/`0x47CF60`).

## Rappel outillage (v1 §« Changement d'outillage » — inchangé)

- **MCP `glm-decompile` n'existe plus** (gateway morte). Pas de `c_a.c`/`c_b.c`/`c_c.c`/`c_reconciled.c` : le fonctionnel s'extrait **directement depuis l'ASM** (ground truth).
- Sous-agents : `Task` avec `model fireworks/accounts/fireworks/models/glm-5p3-flash` (A/V/B), réconciliateur R = `glm-5p3` si escalade 2+1.
- MCP **`ida-pro-mcp`** (HTTP JSON-RPC `http://127.0.0.1:13337/mcp`, IDB `D:\Modding\ff8\retro-exe\FF8_EN.exe`) ; fallback `tools/_tmp_wave_review/glm_triple/ida_rpc.py` (IDAPython, `chr(10)`). GrepAI, QMD CLI (`-c ff8-wiki`).
- Packs via `tools/_tmp_semantic_triple/pack_semantic.py <EA>`. **Piège v1 toujours valable** : `hexrays.c` du pack peut être stub erreur, `asm.asm` parfois tronqué → l'analyste re-récupère toujours via MCP IDA.
- Ground truth = ASM. Jamais de rename IDA, pas d'invention de library calls, args cdecl poussés droite→gauche, `ja`/`jb` unsigned vs `jg`/`jl` signed.

## État au 2026-09-15 22:00

| Métrique | Valeur |
|---|---|
| Ledger | CERTAIN 25, LIKELY 283 |
| Fonctions pipeline identifiées (vendor exclu) | **~170** |
| Déjà couvertes (CERTAIN + LIKELY + file v1) | **~55** |
| **Vierges (cibles)** | **~115** (dont ~25 prio haute) |
| Familles clones à agréger | GF render (~20), emit menus (~8), mag FX (~10) |

**Ne pas retoucher** : les 19+ CERTAIN et la file v1 restante de `PROMPT_semantic-triple-continue.md` (`0x41E650`, `0x438599`, `0x43B50C`, `0x463FC0`, `0x464DB0`, `0x464F70`, `0x465CE0`, `0x4675C0`, `0x4677D0`, `0x507550`, `0x5099D0`, `0x50F900`, `0x50FDF0`, `0x56D5F0`, `0x6DA980`, `0x7040B0`, `Ot_EmitPrim_Code24_*` ×6, `0x5079B0`, `0x507E20`).

Mode par fonction : pack → HANDOFF §5.2 (≤80 instr + CERTAIN nom confirmé → 1+P possible ; défaut 1+V ; >200 instr ou A menteur → 2+1). Tailles ci-dessous = approx IDA, à confirmer au pack.

## FILE D'ATTENTE PRIORISÉE (lots de 5, en série, jamais N+1 avant commit de N)

### Lot 1 — hubs OT / draw-list (centralité max, tous H)

| EA | Nom pressenti | Rôle | Preuve |
|---|---|---|---|
| `0x45C870` | `OT_InsertPrimitive` | Insertion triée prim dans OT | 100+ callers (field/world/battle/menus/ParsePolygons) |
| `0x45D080` | `Gpu_DrawOTag` | Flush frame : BeginScene → update VRAM → dispatch OTag → LeaveScene | seul caller = `Gpu_DrawOTagCurrent` (CERTAIN) |
| `0x416D82` | `Gfx_CreateDrawList` | Constructeur draw list (memset desc, Mat4 identity, bind callbacks) | 60+ callers (TPage, menus, swirl, transitions) |
| `0x417464` | `Gfx_AllocDrawListBatch` | Alloc batch primitives | 33 callers chemin critique submit |
| `0x460F30` | `Gpu_EmitPolyF3` | Émetteur F3 → vertex buffer (coords PS1→float + dispatch `funcs_461842`) | écriture effective vertex buffers |

### Lot 2 — émission + scène

| EA | Nom pressenti | Rôle | Preuve |
|---|---|---|---|
| `0x461800` | `Gpu_EmitPolyFT3` | Émetteur FT3 texturé (+couleurs `dword_1CA9EB0`) | diff vs F3 |
| `0x461A90` | `Gpu_EmitPolyFT4` | Émetteur FT4 | diff vs F3 |
| `0x460C20` | `sub_460C20` | SceneBegin (BeginScene + SelectRenderTarget, vtable) | callee `Gpu_DrawOTag` |
| `0x460CE0` | `sub_460CE0` | SceneEnd (LeaveScene + SetBlendMode + RT) | callee `Gpu_DrawOTag` |
| `0x460C90` | `sub_460C90` | Commit render states + walk draw list + invalidate stamps | cœur `0x461100` |

### Lot 3 — texture / VRAM

| EA | Nom pressenti | Rôle | Preuve |
|---|---|---|---|
| `0x45BD30` | `copyblockToVRAM` | Écriture bloc VRAM PS1 | battle TimQueue, field, world, credits |
| `0x419410` | `Texture_FindTexture` | Sélecteur cache bits &1 MatchPaletteStrict / &2 FormatCallback / &4 MatchEngineFormat sur `*desc`, liste `upload_key+0x330` | amorcé par `TextureRelated2` CERTAIN |
| `0x419CBE` | `Texture_UploadRefcountOrReuse` | Refcount `node+0x18`, handle `node+0x1C`, upload `BufApp+0x50` | idem |
| `0x464421` | `Gfx_InitTexturePageDrawLists` | Init réseau TPage → 19 draw lists (`0x416D82`+`0x40702F`) | débloque famille `0x464xxx` |
| `0x49D3F0` | `sub_49D3F0` | Frame render menu : viewport + `Gfx_SubmitDisplayLists` + ftol | chemin menus |

### Lot 4 — chemin render battle (acteurs)

| EA | Nom pressenti | Rôle | Preuve |
|---|---|---|---|
| `0x5027D0` | `sub_5027D0` | Dispatch draw acteurs par task queue → `0x502AB0` | gros bloc vierge avant `RenderGeometry` |
| `0x502AB0` | `sub_502AB0` | Draw acteur : bone matrix + H4 UV + weapon + `RenderGeometry` | idem |
| `0x502D40` | `BattleActor_DrawBodyAndWeapon` | Corps principal draw | 7 self-calls, callee `0x5088A0` — **attention** partage nom IDA avec thunk `0x502E20` |
| `0x5099C0` | `sub_5099C0` | Setup commun des 4 hubs battle render | petit, levier élevé |
| `0x45B570` | `sub_45B570` | Pré-traitement géométrie par frame | callee unique de `RenderGeometry` |

### Lot 5 — dispatch / variantes H→M

| EA | Nom pressenti | Rôle | Preuve |
|---|---|---|---|
| `0x45D310` | `Gpu_DrawOTagWithDispatchTable` | Dispatch OTag par table (variante `0x45D080`) | — |
| `0x461100` | `sub_461100` | Wrapper `0x460C90` + SelectRenderTarget | — |
| `0x406DD0` | `Gfx_CreatePsxPrimitiveObject` | Bind primitives PSX → draw lists/émetteurs | point d'entrée dispatch indirect |
| `0x464BD0` | `World_loadTextureVRAM_updateAnim` | Update VRAM/frame | **appelé par `Gpu_DrawOTag`** |
| `0x49D6F0` | `sub_49D6F0` | Émet sprites menu (batch `0x417464`) | 12 callers |

## CARTOGRAPHIE DE RÉSERVE (cibles suivantes, par sous-domaine)

Après les lots 1–5, puiser ici par priorité H puis M. Tableau : `EA | Nom IDA | Rôle | Prio`.

### A. Cœur OT / flush GPU (suite)

| EA | Nom IDA | Rôle | Prio |
|---|---|---|---|
| `0x45D050` | `sub_45D050` | Helper OTag (head/len) | M |
| `0x45CEE0` | `sub_45CEE0` | Pré-flush via `0x45D050` | B |
| `0x45D620`/`0x45D6B0` | `sub_45D620`/`sub_45D6B0` | Wrappers `copyblockToVRAM` | B |
| `0x460B20` | `sub_460B20` | Helper dispatch table | B |

### B. VRAM copy ops (suite)

| EA | Nom IDA | Rôle | Prio |
|---|---|---|---|
| `0x45BDD0` | `moveVramRectToVram` | Move rect VRAM→VRAM | M |
| `0x45BE70` | `readbackVramRectToRam` | Readback VRAM→RAM (swirl capture) | M |

### C. Émission primitives + draw-list core (suite)

| EA | Nom IDA | Rôle | Prio |
|---|---|---|---|
| `0x461E00` | `sub_461E00` | Variante émetteur (sprite/quad, `+0x50` writeback) | M |
| `0x462030` | `sub_462030` | Variante émetteur FT4 large | M |
| `0x4610C0` | `sub_4610C0` | Select TPage draw list + alloc batch (F3) | M |
| `0x461A30` | `sub_461A30` | Idem FT3/FT4 + sprintf debug | M |
| `0x462AD0` | `sub_462AD0` | Alloc batch + helpers (`0x462DF0`, `0x4628D0`, `0x461100`) | M |
| `0x461000`/`0x461220`/`0x461460` | helpers | Sous-helpers émetteurs (vertex alloc/color) | M/B |
| `0x448040` | `Gfx_CreateDrawList_Type1FromDesc` | Factory draw list type 1 | M |
| `0x41786A` | `Gfx_InvalidateDrawListStamp` | Invalide stamp gen | M (25 callers) |
| `0x417FA6` | `Gfx_GetNested_Plus10_14` | Getter imbriqué | B |
| `0x4098EE` | `GetBufApp_0xA74` | Getter BufApp engine | B |

### D. Texture / TPage / CLUT / staging (suite)

| EA | Nom IDA | Rôle | Prio |
|---|---|---|---|
| `0x465430`/`0x4653B0` | `isUpdateVRAMOrSomething` | Update VRAM world + staging rows | M |
| `0x465720` | `sub_465720` | Upload CLUT world (BlitCLUTAlpha + `0x4203B2`/`0x420476`) | M |
| `0x467160` | `Gfx_Psx2Lookup_OrPoolAlloc_B7E018` | Pool alloc lookup PSX→PC | M |
| `0x464160` | `sub_464160` | Describe pixel format CLUT | B |
| `0x4653A0` | `sub_4653A0` | Pool lookup | B |
| `0x466090`/`0x4660D0`/`0x466190` | subs TPage | Helpers TPage (`setIndexedColours_VRAMGPU`) | B |
| `0x425DD4`/`0x424DF2` | subs | Helpers find/upload texture | B |
| `0x4188E2` | `Graphics_FillBitfieldLayout` | Layout bitfield pixel format | B |

### E. Soumission battle/menus + textures menu (suite)

| EA | Nom IDA | Rôle | Prio |
|---|---|---|---|
| `0x49B300` | `sub_49B300` | Alloc batch + emit sprite | M |
| `0x4981B0`/`0x4B3710` | subs | Invalidate stamps batch (post-submit) | M/B |
| `0x49D590` | `sub_49D590` | Variante submit viewport | M |
| `0x49BCD0`/`0x49C030`/`0x49C310`/`0x49CE80`/`0x49CFE0`/`0x49D140`/`0x49D2A0` | famille emit | Famille sprites/quad menus — **agrégée, traiter 2 représentants + diff** | M |
| `0x49B5A0` | `sub_49B5A0` | Alloc batch menu | B |
| `0x497050` | `MenuTextures_load_fonts_katano_kcmenu` | Chargement fontes katano | M |
| `0x4978B0` | `katano_kcmenu_sub_4978B0` | Parse textures katano (0x662, archive + draw lists) | M |
| `0x497F20` | `sub_497F20` | LoadMenuFiles → draw lists | M |
| `0x499A80`/`0x499C20` | subs | Create draw list viewport/archive | M/B |

### F. Chemin render battle (suite)

| EA | Nom IDA | Rôle | Prio |
|---|---|---|---|
| `0x501050` | `BS_RenderRelated`(dup IDA) | Orchestrateur render battle (anim + FK + `RenderGeometry`) | H/M |
| `0x50F1D0` | `WitchRelated` | Draw sorcières/monstres : FK + RenderGeometry | M |
| `0x509B30` | `BattleGeom_SetCurrentBoneMatrix` | Set bone matrix courant | M (7 callers) |
| `0x45DD60`/`0x45D7F0` | `Thunk_45DD60`/`Camera_SetPackedS16PairAndRefreshFloatCache` | Caméra packed S16 + cache float | M |
| `0x56FE10` | `BdLinkCallback_56FE10` | Callback draw battle : cam + FK + RenderGeometry + OT emit (0x781) | M |
| `0x62C820` | `sub_62C820` | Render FK battle + RenderGeometry + scratch | M |
| `0x595E40`/`0x595C80`/`0x596220`/`0x5968D0`/`0x5977D0` + famille `sub_5B*/5C*/5D*/5E*` | famille GF render | ~20 clones render GF cinématiques (FK + RenderGeometry + OT emit Code24) — **agrégée, diff 2 représentants** | M |
| `0x5108A0` | `ParsePolygons_GfMagic` | Clone ParsePolygons magie GF (0x9a2) — **dépasse seuil SKIP_CHUNK, prévoir découpage** | M |
| `0x510680` | `Poly_BackfaceTest2D` | Backface test 2D (callee ParsePolygons) | M |
| `0x509B50` | `BS_CopyGeometry` | Copie géométrie → scratch (tous les loaders) | M |
| `0x508480` | `BattleFile_CharacterLoad` | Loader fichier acteur (I/O) | B |
| `0x507740`/`0x512AC0`/`0x508170` | subs | Helpers loaders/geom | B |

### G. GTE (support transform)

| EA | Nom IDA | Rôle | Prio |
|---|---|---|---|
| `0x45E5C0`/`0x45E610` | `Gte_AVSZ3`/`Gte_AVSZ4` | Average-Z PS1 (ordering OT) — decomp ok, sémantique vierge | M |
| `0x45EE10` | `Gte_NCLIP` | Normal clip — decomp committé, sémantique vierge | M |
| `0x45F930`/`0x460860`/`0x45DCA0`/`0x45E670` | `Gte_SQR`/`Gte_MVMVA`/`Gte_LZCS`/`Gte_Cross3Float_SatS16` | Ops GTE émulées | M |
| `0x45D7C0`/`0x45D7A0`/`0x45DFE0`/`0x45E3D0` | `GteState_Set/Get*` | État GTE `1CA8A10`/`1CA8A2C` | M |
| `0x45E270`/`0x45FE10`/`0x45F270` | `SetsomeDword`/`camRelated_0`/`sub_45F270` | Helpers GTE/caméra | B |

### H. Transitions/swirl

| EA | Nom IDA | Rôle | Prio |
|---|---|---|---|
| `0x559240` | `sub_559240` | Transition world→battle : wmset + overlay + `Gpu_DrawOTagCurrent` | M |
| `0x559B80`+Phase2/`0x55A0E0` | `NormalTransition_Phase1/2`/`BossTransition_Phase` | Phases transition (submit + SetRenderState) | M |
| `0x5596D0` | `BattleTransition_InitScanlinesNormal` | Init scanlines (draw lists) | B |
| `0x559190` | `sub_559190` | Helper transition | B |

Swirl `0x56D1D0`–`0x56D5F0` : déjà LIKELY/UNCERTAIN (v1) — ne pas retoucher sauf re-review demandé.

### I. Mag FX

| EA | Nom IDA | Rôle | Prio |
|---|---|---|---|
| `0x6CBF90` | `sub_6CBF90` | Gros bloc render mag FX (0x12ee) | M |
| `0x6A7A20` | `MagFx_RenderComposedFK_Alloc4C` | Render FK mag fx | M |
| `0x69E420`/`0x69E5E0`/`0x69E700`/`0x6A12B0`/`0x6A5950`…`0x6A5DB0` | famille clones | Clones render mag (0x11d/0x156/0x1bc) — **agrégée** | B |

`0x6DA980` `MagFx_IndexPackedNodeTree` : déjà LIKELY — ne pas retoucher.

## Pièges spécifiques à cette file

1. **Émetteurs `Gpu_EmitPoly*` sans callers statiques** : dispatch indirect via `funcs_461842` / bind `0x406DD0` → vérifier **data xrefs** avant décomp (sinon sémantique incomplète).
2. **`0x502E20`/`0x502D40` partagent le nom IDA** (thunk vs corps) — vérifier EA exact au pack.
3. **`0x5108A0` `ParsePolygons_GfMagic` (0x9a2)** dépasse probablement le seuil SKIP_CHUNK → découpage en blocs avant analyse.
4. **Familles clones** (GF render ~20, emit menus ~8, mag FX ~10) : traiter 1–2 représentants en sémantique complète, valider le reste par diff ASM seulement. Rapport `EA | mode | confiance | nom | A==V`.
5. Pièges v1 inchangés : `hexrays.c` stub erreur, `asm.asm` tronqué, hangs GLM possibles (budget `high` au retry), jamais `qmd update`/`embed` (CLI uniquement).

## Rappel règles transverses (HANDOFF + v1, inchangées)

- Lots de **5, en série**, jamais N+1 avant commit de N ; rapport `EA | mode | confiance | nom | A==V`.
- Push IDB **append only** (`set_func_cmt`, jamais `set_comments`), tag `[semantic-triple 2026-09-15]`, pas de rename, pas de SetType, `idc.save_database(idc.get_idb_path())` après chaque push.
- Git : uniquement `semantic/<EA>__<Name>.md` (+ `decomp/` si produit, + ledger `semantic-certainty.md` si classe change). Jamais `tools/_tmp_*`, `.cursor/mcp.json`, `glm-mcp-function-budget.md`, `nul`, HANDOFF, PROMPT v1/v2, obsidian-docs.
- Vérifications §5.6 par le parent avant tout commit : callees cités existent, callers cités existent (DATA vs code), stride développé en nombre, polarité `setcc`/`ja`/`jb` cohérente, valeur retour (AL/AX/EAX) compatible usage, verdict nom justifié par ≥2 preuves.
- Échec §5.6 bloquant → escalade 2+1 ou `UNCERTAIN`. Jamais de push IDB en échec.

## Checklist démarrage

1. `GetDynamicTools` → namespace `ida-pro-mcp` (si KO : HTTP `ida_rpc.py`). IDA ouvert sur l'IDB.
2. Confirmer l'état de la file v1 (si non épuisée, finir v1 d'abord — elle a priorité).
3. `pack_semantic.py <EA>` pour chaque EA du lot courant, tailles confirmées au pack.
4. Lots 1→5 ci-dessus, puis réserve par priorité H→M→B.
