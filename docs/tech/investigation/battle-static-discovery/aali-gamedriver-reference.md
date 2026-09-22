# Analyse de référence externe — 7H_GameDriver (driver OpenGL d'Aali)

> Livrable d'analyse croisée pour la spec ABI `driver-abi-spec.md` (lot 12).
> Source analysée : **https://github.com/unab0mb/7H_GameDriver** (fork 7th Heaven du driver
> `ff7_opengl` d'Aali — « Complete OpenGL replacement of the Direct3D renderer used in the
> original ports of Final Fantasy VII and Final Fantasy VIII for the PC », GPLv3, `README.md`).
> Clone local : `C:\Users\djden\AppData\Local\Temp\opencode\aali-clone` (`git clone --depth 1`, 2026-09-22).
> Référence contraignante en face : `docs/tech/investigation/battle-static-discovery/driver-abi-spec.md`
> (ci-après « spec §n »), ground truth = ASM live de `FF8_EN.exe` (DotEmu, `064d466b…`).
> Portée : Aali cible les **exécutables Eidos/Squaresoft FF8 1.2** (`ff8.exe`, 12 versions,
> `common.h:41–53`) — pas le binaire DotEmu. Les écarts structurels sont traités en §9.

## 1. Summary

1. Aali **documente intégralement le contrat du driver FF8 en C** : struct `ff8_gfx_driver`
   (`src/ff8.h:640–705`) + prototypes `gfx_*` (`src/common_imports.h:65–95`). C'est la
   meilleure sémantique de référence jamais publiée pour notre objet driver 66 DWORDs.
2. L'export factory s'appelle exactement **`new_dll_graphics_driver(void *game_object)`**
   (`src/common.c:1861`, `__declspec(dllexport)`, cdecl, 1 arg = engine, retour = objet driver)
   — confirmant byte-pour-byte le nom d'export attendu par notre spec §2.
3. Correspondance **slot par slot quasi parfaite** avec la spec §3/§5/§6 : état inline 9–14
   (clear-color vec4), slot 15 inerte, slots 21–24 sans implémentation (no-ops), et surtout la
   famille 43–63 = paires `setrenderstate_X` / `draw_X` qui **nomme** nos slots setup/walk.
4. Divergence réelle : la table du binaire Eidos 1.2 fait **0x100 (64 DWORDs)** ; notre
   `FF8_EN.exe` fait **0x108 (66 DWORDs)** et diffère dans la zone 39–41 (SelectTarget/
   BeginScene/LeaveScene vs end_scene/field_90/setrenderstate_flat2D). Voir §9.
5. Pièges et patterns (heap discipline, DllMain vide, fake DirectDraw pour les movies,
   palette writes non annoncés, deferred z-sort) directement transposables au passthrough Mode A.

## 2. Le contrat du driver FF8 vu par Aali (chargement / factory) — vs spec §1/§7

- **Export unique** : `__declspec(dllexport) void *new_dll_graphics_driver(void *game_object)`
  (`src/common.c:1861–2184`). Signature identique à notre factory : cdecl, 1 arg `engine`,
  retour = pointeur d'objet driver alloué par la DLL (`external_calloc(1, sizeof(*ret))` dans
  `ff8_load_driver`, `src/ff8_opengl.c:386`). La DLL ne touche à **aucun** champ du game object
  pour se stocker elle-même : elle garde son état en globales de la DLL — même conclusion que
  la spec §4 (« le driver DLL garde son propre objet dans un static de la DLL »).
- **Champs moteur liés au driver** dans `struct ff8_game_obj` (`src/ff8.h:444–638`) :
  `struct gfx_driver *gfx_driver`, `current_gfx_driver`, `gfx_driver_data`,
  **`void *create_gfx_driver`** (`src/ff8.h:557, 612, 619, 622`) — la famille de champs où notre
  binaire range factory (`engine+0xBD0`), flag (`+0xBC8`), HMODULE (`+0xBCC`) et objet driver
  (`+0xA74`). Aali ne décrit pas le mécanisme LoadLibrary (il vit côté lanceur 7th Heaven,
  absent du repo) ; mais il **consomme** le contrat : le jeu appelle la factory puis les slots.
- **Le DLL path est natif au jeu FF8, pas un patch** : dans `ff8_load_driver`
  (`src/ff8_opengl.c:288–449`) les seuls patchs binaires sont périphériques (movies
  `movie_hack1/2`, reload textures, DirectInput, d3dcaps forcé à true
  `src/ff8_opengl.c:319–325`) — le driver object est simplement retourné au moteur. Contraste
  avec FF7 (`src/ff7_opengl.c:54–230`) où tout passe par `replace_function` massif. Appui
  direct à la spec §1 (« le chemin type 2 natif est un point d'extension ouvert »).
- **DllMain volontairement vide** : `BOOL APIENTRY DllMain(...) { return TRUE; }`
  (`src/common.c:2186–2189`) — tout le travail est fait dans slot 0 (init), appelé par le
  moteur. Conforme à la contrainte spec §7.4 (FreeLibrary propre au shutdown).
- **Init lourde dans slot 0** : Aali crée la fenêtre/GL, charge les shaders, détecte les
  capabilities (`src/common.c:1861–2184`) — l'init slot 0 est l'endroit légitime pour tout
  setup, y compris créer sa propre fenêtre (`DestroyWindow`/`CreateWindowEx` du hwnd du jeu,
  `src/common.c:2002–2021`) et **écrire en retour** dans le game object
  (`VRASS(game_object, hwnd, hwnd)`, `src/common.c:2020`).
- **Shutdown** : `common_cleanup` (slot 1) désinstalle les patchs (`unreplace_functions()`,
  `src/common.c:313–322`) — « we need to make sure the game doesn't crash after we're gone ».
  Pattern identique à notre exigence de restauration byte-exacte avant FreeLibrary.
- **Config** : fichier `.cfg` lu par le driver lui-même (`read_cfg()`, `src/cfg.h:28–97`,
  `src/cfg.c`), indépendant de la config 36B du moteur. La 36B (`GfxExternalBackendConfig36`,
  spec §2) n'a pas d'équivalent chez Aali : son lanceur pose directement le chemin DLL ;
  le champ `reserved[6]` passthrough n'est pas documenté chez lui (non utilisé).

## 3. Table des slots — correspondance Aali ↔ spec §3/§5

`struct ff8_gfx_driver` (`src/ff8.h:640–705`) = **64 DWORDs (0x100)**, dernier champ
`field_EC` à +0xFC. Nommage Aali = sémantique réelle des slots, à confronter à nos EA :

| Slot | Off | Aali (`ff8.h`) | Notre spec §5 | Verdict |
| --- | --- | --- | --- | --- |
| 0 | +0x000 | `init` | Init (call [eax] @0x409572) | ✅ |
| 1 | +0x004 | `cleanup` | Uninit @0x4096F2 | ✅ |
| 2 | +0x008 | `lock` | « DirectX_7 » | ⚠ nommage divergent (§9.2) |
| 3 | +0x00C | `unlock` | « DirectX_8 » | ⚠ idem |
| 4 | +0x010 | `flip` | Present, gate `engine+0xB88` | ✅ (present = flip) |
| 5 | +0x014 | `clear(bool,bool,bool,engine)` | isGetDrawBuf2 | ✅ |
| 6 | +0x018 | `clear_all` | support frame | ✅ |
| 7 | +0x01C | `setviewport(x,y,w,h,engine)` | viewport @0x41E070 | ✅ |
| 8 | +0x020 | `setbg(bgra_color*, engine)` | isGetDrawBuf (clear-color) | ✅ |
| 9 | +0x024 | `uint field_24` (jamais écrit) | état inline | ✅ |
| 10–13 | +0x028–0x34 | `struct bgra_color field_28` (4 floats) | clear-color vec4 +0x28–0x34 | ✅ byte-exact |
| 14 | +0x038 | `uint field_38` | état inline (DDraw lit +0x24/+0x38) | ✅ |
| 15 | +0x03C | `uint field_3C` — **jamais assigné** (`ff8_opengl.c`) | inerte, NULL | ✅ |
| 16 | +0x040 | `prepare_polygon_set` | partagé GL/DD (0x43B1EF) | ✅ |
| 17 | +0x044 | `load_group` | partagé (0x43B21E) | ✅ |
| 18 | +0x048 | `setmatrix(unknown, matrix, matrix_set, engine)` | Thunk Off72 @0x41E628 | ✅ |
| 19 | +0x04C | `unload_texture` | fn 0x419E89 | ✅ |
| 20 | +0x050 | `load_texture(texture_set*, tex_header*, tex_format*)` | — | ✅ |
| 21–24 | +0x054–0x60 | `field_54/58/5C/60` = **stubs no-op trace** (`ff8_opengl.c:83–106`) | Alt-only 21–24 | ✅ (no-op obligatoire, spec §4) |
| 25 | +0x064 | `palette_changed` | — | ✅ |
| 26 | +0x068 | `write_palette` | — | ✅ |
| 27 | +0x06C | `blendmode(uint, engine)` → `struct blend_mode*` | — | ✅ |
| 28 | +0x070 | `light_polygon_set` | — | ✅ |
| 29 | +0x074 | `field_64(state, option, engine)` → `internal_set_renderstate` | **Gfx_SetRenderState, RS types 0–25** | ✅✅ |
| 30 | +0x078 | `setrenderstate(p_hundred*, engine)` (masques de bits) | CommitRenderState `1<<type` | ✅ |
| 31/32 | +0x07C/+0x80 | `_setrenderstate` / `__setrenderstate` = même fn | — | ✅ (3 slots identiques) |
| 33 | +0x084 | `field_74(uint, engine)` → preset `hundred_array[0..4]` | **SetBlendMode 0–4** | ✅✅ |
| 34 | +0x088 | `field_78(polygon_set, engine)` | NULL, hook optionnel | ✅ (« in FF8 this function doesn't do any rendering », `common.c:1363–1370`) |
| 35 | +0x08C | `draw_deferred(struc_77*, engine)` | fn 0x41E7D8 (commit/swap) | ✅ (deferred du jeu) |
| 36 | +0x090 | `field_80(graphics_object, engine)` (wrapper field_78) | override → fallback 35 | ⚠ sémantique à trancher |
| 37 | +0x094 | `field_84(uint, engine)` (sélection des 2 polygon sets 2D `polygon_set_2EC/2F0`, `common.c:1415–1440`) | — | ✅ |
| 38 | +0x098 | `begin_scene(uint, engine)` | fn @0x41E924 | ✅ |
| 39 | +0x09C | `end_scene` | **GfxDriver_SelectRenderTarget @0x41E947** | ❌ divergence (§9.2) |
| 40 | +0x0A0 | `field_90(uint)` (noop) | **GfxDriver_BeginScene @0x41E972** | ❌ divergence |
| 41 | +0x0A4 | `setrenderstate_flat2D` | **GfxDriver_LeaveScene @0x41E99D** | ❌ divergence |
| 42 | +0x0A8 | `setrenderstate_smooth2D` | — | ✅ (famille 2D) |
| 43 | +0x0AC | `setrenderstate_textured2D` | **setup liste type 0/8** | ✅✅ (§4) |
| 44 | +0x0B0 | `setrenderstate_paletted2D` | setup type 2/10 | ✅✅ |
| 45 | +0x0B4 | `_setrenderstate_paletted2D` (même fn) | — | ✅ |
| 46/47 | +0x0B8/+0xBC | `draw_flat2D` / `draw_smooth2D` | — | ✅ |
| 48 | +0x0C0 | `draw_textured2D` | **walk type 0/8** | ✅✅ |
| 49 | +0x0C4 | `draw_paletted2D` | walk type 2/10 | ✅✅ |
| 50/51 | +0x0C8/+0xCC | `setrenderstate_flat3D` / `_smooth3D` | — | ✅ |
| 52 | +0x0D0 | `setrenderstate_textured3D` | **setup type 1/9** | ✅✅ |
| 53 | +0x0D4 | `setrenderstate_paletted3D` | setup type 3/11 | ✅✅ |
| 54 | +0x0D8 | `_setrenderstate_paletted3D` (même fn) | — | ✅ |
| 55 | +0x0DC | `draw_flat3D` | **setup type 5/7/13/15 (sans walk)** | ✅✅ |
| 56 | +0x0E0 | `draw_smooth3D` | — | ✅ |
| 57 | +0x0E4 | `draw_textured3D` | **walk type 1/9** | ✅✅ |
| 58 | +0x0E8 | `draw_paletted3D` | walk type 3/11 | ✅✅ |
| 59/60 | +0x0EC/+0xF0 | `setrenderstate_flatlines` / `_smoothlines` | — | ✅ |
| 61 | +0x0F4 | `draw_flatlines` | **setup type 18** | ✅✅ |
| 62 | +0x0F8 | `draw_smoothlines` | **setup type 19** | ✅✅ |
| 63 | +0x0FC | `field_EC` (noop, `common.c:1612–1615`) | **walk type 18** | ✅ |
| 64 | +0x100 | **absent** (struct finit à 0x100) | walk type 19 | ❌ 1 DWORD de plus |
| 65 | +0x104 | **absent** | Alt-only, consumer `sub_4097A0` | ❌ 1 DWORD de plus |

Sources slots Aali : remplissage intégral dans `ff8_load_driver` (`src/ff8_opengl.c:386–448`)
et `ff7_load_driver` (`src/ff7_opengl.c:180–230`, struct jumelle `ff7_gfx_driver`
`src/ff7.h:1365–1424` — **identique** aux 64 premiers slots, preuve que la table est un
contrat commun FF7/FF8).

Cross-validations fortes avec la spec §8 :

- **RS types 0–25** : enum `effects` (`src/common_imports.h:34–62`) compte **exactement 26
  valeurs** (V_WIREFRAME=0 … V_ALPHAREF=25). `V_NOCULL = 14` (bit 0x4000) →
  `glDisable(GL_CULL_FACE)` (`common.c:1215–1223`) = notre « Type 14 =
  glDisable(GL_CULL_FACE) bit 0x4000 ». `V_DEPTHMASK = 16` → `glDepthMask`
  (`common.c:1233–1237`) = notre « RS-16 = ZWRITE/glDepthMask ». Trois coïncidences
  indépendantes : le mapping RS est le même dans les deux binaires.
- **Blend 0–4** : `blend_modes[5]` + `common_blendmode` (`common.c:1124–1156`) —
  BLEND_AVG=0, BLEND_ADD=1, BLEND_SUB=2, BLEND_25P=3, BLEND_NONE=4 ; et « blend mode 4
  requested » = `unexpected` pour FF7 mais **valide pour FF8** (`common.c:1148–1150`) —
  cohérent avec nos 9 call-sites utilisant 0/1/2/4 (spec §8).
- **Scènes empilées** : « FF8 relies on the ability to stack scenes » — pile de 8 états
  sauvegardés/restaurés par begin_scene/end_scene (`common.c:90–92, 1445–1473`) — utile
  pour comprendre le couple BeginScene/LeaveScene de nos slots 40/41.

## 4. Chaîne draw-list : types de listes = classes de primitives (vs spec §6)

La spec §6 dit que `Gfx_BindDrawListBackendCallbacks 0x41619A` copie des fnptrs du driver
vers `list+0x9C` (setup) / `list+0xA0` (walk). Le code d'Aali **donne le nom des deux
colonnes** : ce sont les paires `gfx_polysetrenderstate` / `gfx_draw_vertices`
(`src/common_imports.h:93–94`), prototypes
`(polygon_set*, indexed_vertices*, game_obj*)` — soit, transposé à nos signatures
`setup(ctx, node, arg)` / `walk(ctx, node, arg)`, le couple état-primitive → draw :

| Type(s) de liste (spec §6) | Slot setup = Aali | Slot walk = Aali | Classe de primitive |
| --- | --- | --- | --- |
| 0, 8 | 43 `setrenderstate_textured2D` | 48 `draw_textured2D` | 2D texturé |
| 2, 10 | 44 `setrenderstate_paletted2D` | 49 `draw_paletted2D` | 2D paletté |
| 1, 9 | 52 `setrenderstate_textured3D` | 57 `draw_textured3D` | 3D texturé |
| 3, 11 | 53 `setrenderstate_paletted3D` | 58 `draw_paletted3D` | 3D paletté |
| 5, 7, 13, 15 | 55 `draw_flat3D` (setup seul) | — | 3D flat (couleur par vertex, sans texture) |
| 18 | 61 `draw_flatlines` | 63 `field_EC` (noop) | lignes flat |
| 19 | 62 `draw_smoothlines` | 64 (hors struct Eidos) | lignes smooth |

- Le chemin « paletted » illustre le découpage par palette : `generic_draw_paletted`
  (`common.c:1491–1537`) regroupe les vertices en runs de même index de palette
  (`palettes` = 1 octet par shape, `ff8_indexed_vertices.palettes`, `ff8.h:167`), change la
  palette (`common_palette_changed`) puis redessine par run — **le pattern exact de
  capture/replay multi-palette** pour notre passthrough.
- Le 2D vs 3D se joue sur le `vertextype` : `TLVERTEX=3` (transformé, w+RHW) vs `LVERTEX=2`
  (`src/gl.h:32–34`) ; `gl_draw_indexed_primitive` adapte la matrice de projection D3D
  uniquement si `vertextype != TLVERTEX` (`gl/gl.c:241–245`) — équivalent de notre
  distinction FVF Alt `0x1C4` (XYZRHW) vs GL stride 32 (spec §8).
- `ff8_graphics_object` porte **lui-même** une paire de fnptrs `func_90` (polysetrenderstate)
  / `func_94` (draw_vertices) (`src/ff8.h:210–211`) : le bind setup/walk n'est pas qu'une
  table driver→liste, c'est un motif récurrent du moteur (objets graphiques portent leurs
  deux callbacks backend). À chercher dans notre `GfxDrawList` (champs +0x9C/+0xA0) et dans
  les structures `p_hundred`/groupes.

## 5. Structures render FF8 traitées par Aali (comparables à nos GfxDrawList/OT)

Toutes dans `src/ff8.h` / `src/common_imports.h` :

- **Vertex GPU 32 bytes** : `struct nvertex` (`common_imports.h:246–274`) =
  `point3d` (12) + `w` (4) + `color` u32 BGRA (4) + `specular` (4) + `u,v` (8) = **32 bytes**,
  exactement notre « vertex GPU 32 o » et le FVF Alt `0x1C4`
  XYZRHW|DIFFUSE|SPECULAR|TEX1 (spec §8). Le même buffer sert aux deux backends :
  GL consomme stride 32 avec `glVertexPointer(3 ou 4)` (`gl/gl.c:256–259`).
- **`ff8_indexed_vertices`** (`ff8.h:155–169`) : `count`, `vertexcount`, `vertices`,
  `indexcount`, `indices (word*)`, `palettes (byte*)`, `graphics_object*` — l'unité de
  soumission (analogie : nos nodes OT 24 o + buckets 4386).
- **`ff8_graphics_object`** (`ff8.h:171–215`) : `polytype`, `hundred_data`, `matrix_set`,
  `polygon_set`, `u_offset/v_offset`, `vertices_per_shape`, `indices_per_shape`,
  `vertex_offset`, `index_offset`, `indexed_vertices`, paires `func_90/func_94`, matrice
  inline + flag `use_matrix_pointer`.
- **`ff8_polygon_set`** (`ff8.h:217–240`) : `numgroups`, `hundred_data` (global ou par
  groupe via `per_group_hundreds`), `matrix_set`, `execute_buffers` (IDirect3DExecuteBuffer**,
  legacy D3D5), `indexed_primitives` par groupe — et `field_2C` = « groupe actif » gate que
  le driver respecte (`common.c:1546`).
- **`p_hundred`** (`common_imports.h:373–400`) : bloc d'état matériau par groupe —
  `texture_set`, `shademode`, `lightstate_ambient`, `srcblend/destblend`, `alpharef`,
  `blend_mode`, `zsort`, `vertex_alpha`. `common_setrenderstate` (`common.c:1278–1348`)
  décode `field_C` (features) / `field_8` (options) en masques de bits — c'est le vrai
  « render state block » du moteur (analogue de notre shadow `*(engine+2692)[type]`).
- **TEX** : `ff8_tex_header` (`ff8.h:242–299`) — `version==2` (ou 100 = framebuffer
  synthétique, `FB_TEX_VERSION`, `common.h:97`), `color_key`, `palettes`,
  `palette_entries`, `bpp`, `tex_format` (masks/shifts/max), `use_palette_colorkey`,
  `palette_colorkey`, `reference_alpha`, `blend_mode`, `palette_index`, `image_data`.
  Lecture : `ff8_load_tex_file` (`ff8_opengl.c:131–184`).
- **`ff8_texture_set`** (`ff8.h:301–359`) : **union D3D/GL** en tête (`d3d.ddsurface1/
  d3d2texture1/…` vs `ogl.external/gl_set/width/height`) puis `refcount`, `texturehandle`,
  `texture_format`, `tex_header`, `palette_index`, `palette`. Le driver remplace les
  interfaces D3D par ses propres données dans la même union — pattern clé pour cohabiter
  avec le moteur sans réécrire ses structures.
- **Pages texture PSX / VRAM** : `texture_page` (`ff8.h:361–387`) avec **10 graphics
  objects préfabriqués = (tri|quad) × (noblend|avg|add|sub|mode3)** — soit les 5 modes de
  blend PSX × 2 géométries, pointés par `struc_51.psx_texture_pages` (8 pages, `ff8.h:395–399`).
  C'est l'équivalent fonctionnel de notre `Gfx_SelectTexturePageDrawList 0x465CE0` (chaîne
  spec §6) : la sélection texture-page + blend-mode se fait **avant** la liste, en choisissant
  un objet graphique préfabriqué.
- **Packets PSX GPU** : `ssigpu_packet52` (`ff8.h:75–105`) — packet 52 bytes
  (command, bgr×3, clut, texture, coords), et `psxvram_rect`, `wm_polygon_source` — la
  couche source PSX en amont de nos POLY_FT3 32 o / FT4 40 o.
- **Blend modes PSX** : table `blend_modes[5]` documentée « identical to Direct3D driver »
  avec les paramètres src/dest (`common.c:1124–1130`) — table de référence prête pour un
  backend de passthrough qui doit re-exprimer les 5 modes.
- **Matrices** : `matrix_set` (`common_imports.h:322–335`) world/view/projection + copies
  D3D ; `common_setmatrix` case 0/1/2 (`common.c:600–621`) ; la transformation viewport D3D
  est émulée par `d3dviewport_matrix` (`gl/gl.c:37–42, common.c:563–570`) — piège connu :
  le `d3dviewport_matrix._22 = 1.0f` forcé en MODE_BATTLE FF7 (pas FF8).

## 6. Conventions d'appel — vs spec §4

- **Tous les callbacks `__cdecl`, pas de this** : les typedefs `gfx_*`
  (`common_imports.h:65–95`) n'ont jamais de paramètre « objet driver » ; le premier ou
  deuxième paramètre est l'état moteur (`game_obj*`, `polygon_set*`…). Conforme à notre
  spec §4 (« pas de this explicite, retransmission de la pile telle quelle »).
- **Position de `engine` variable par slot** : `gfx_init(game_obj*)` (dernier/unique),
  `gfx_setviewport(uint,uint,uint,uint,game_obj*)` (dernier), `gfx_clear(bool,bool,bool,game_obj*)`
  (dernier), `gfx_polysetrenderstate(polygon_set*, indexed_vertices*, game_obj*)` (dernier)…
  Aali ne montre pas d'engine en arg0/arg2 ; seule exception de forme : `gfx_lock(uint)` /
  `gfx_field_90(uint)` sans engine. Notre spec observe engine en arg0/2e/dernier selon le
  slot (DotEmu) — Aali confirme la variabilité et le fait que la DLL ne peut pas compter sur
  une convention unique.
- **Accès au game object sans this** : `common_externals.get_game_object()` (fnptr capturé du
  moteur, `common.h:164`, résolu par scan `ff8_data.h:159`) — Aali récupère le game object
  **à tout moment** via une fonction du moteur plutôt que de le cacher dans un slot. Pour
  notre DLL : conserver le `engine` passé à la factory en static + vérifier qu'il ne bouge
  pas (notre lot +4 : `engine+0xA74` stable, spec §9).
- **Threading** : aucun thread de rendu côté driver ; `common_flip` (present) tourne sur le
  thread du main loop, fait le swap (`SwapBuffers`), la limiteur de framerate, un pump de
  messages ponctuel (FF7) et un `gl_error()` par frame (`common.c:342–511`). Le present est
  donc **frame-locked au main loop** — appui pour notre présent via slot 4 gate `engine+0xB88`
  (spec §1/§9 : l'ordre per-frame reste à trancher côté AF3DN.P, mais côté driver il n'y a
  pas de thread séparé à modéliser).
- **Version fingerprinting** : `get_version()` lit 2 DWORDs fixes (`0x401004`/`0x401404`,
  `common.c:1762–1856`) et supporte 16 variantes FF7/FF8. Notre contrainte hash EXE/DLL
  (waivers interdits) est la version robuste du même besoin : la table des offsets étant
  codée en dur par version (`externals_102_*.h` pour FF7, scan runtime pour FF8).

## 7. Pièges documentés par Aali (directement utiles au passthrough)

1. **Palettes non annoncées (FF8)** : « we can't trust it to notify us » — FF8 modifie les
   palettes sans appeler `palette_changed`/`write_palette` de façon fiable ; le driver garde
   `old_palette_data` et compare au load (`common.c:925–940`) + buffer circulaire de 64
   textures pour éviter les reloads inutiles (`ff8_opengl.c:186–258`). Un passthrough qui
   capture des textures palettées doit re-snapshotter, pas faire confiance aux notifications.
2. **Heap discipline** : deux familles d'alloc (`common.h:211–239`) — `external_*` = heap du
   moteur (`assert_malloc/assert_free` capturés, jamais appeler `free` du CRT sur de la
   mémoire du jeu) vs `driver_*` = heap CRT de la DLL. Règle : toute structure conservée
   entre slots doit être allouée du bon côté. Nos slots no-op (return 0, spec §4) évitent le
   pire, mais au moindre objet retourné au moteur la règle s'applique.
3. **Rien dans DllMain** (§2) ; tout dans slot 0 ; cleanup slot 1 doit rendre le jeu
   exécutable sans le driver (`unreplace_functions`, `common.c:313–322`).
4. **Slots inutilisés ≠ NULL obligatoirement** : Aali met des **stubs trace** dans
   field_54/58/5C/60 et field_90, et laisse field_24/field_3C à NULL/0 — les deux
   coexistent ; notre spec est plus stricte (no-op obligatoire si l'engine peut appeler).
5. **Le moteur lit des champs du driver object en état inline** : le clear-color est écrit
   par setbg (slot 8) dans `field_28` (+0x28..+0x34) du driver object et relu par le moteur
   (spec §3 : « clear-color vec4 écrit par isGetDrawBuf »). Un objet driver alloué zéro puis
   rempli ne suffit pas : les champs 9–14 doivent être maintenus comme état vivant.
6. **Fake DirectDraw pour les movies** : le lecteur vidéo FF8 blitte dans des surfaces DD ;
   Aali pose des interfaces factices (`fake_dd.c`) et surcharge
   `game_object->dddevice/front_surface/dd2interface/d3d2device` dans le init
   (`ff8_opengl.c:304–308`), en réinjectant les frames comme texture fullscreen
   (`fake_ddsurface_unlock` → `gl_draw_movie_quad_bgra`, `fake_dd.c:308–326`). Pour notre
   passthrough : le chemin movie/cinématique contourne potentiellement la draw-list et passe
   par les interfaces DD stockées dans le game object — à instrumenter séparément.
7. **Blend mode 4 = FF8 only** (`common.c:1148–1150`) ; case 3 (25%) existe bien côté GL
   (`gl/gl.c:305–307`) — cohérent avec notre « case 3 implémenté sans wrapper » (spec §8).
8. **Effets spéciaux dépendants du mode** : corrections de rendu hard-codées par mode de jeu
   (swirl battle FF8, cerberus lines, fade swirl : `gl/special_case.c:68–218`). Un observer
   Mode A verra ces draws **tels quels** dans la capture : ne pas les interpréter comme des
   bugs du replay.
9. **Framebuffer textures** : le jeu relit le backbuffer comme texture (version TEX
   synthétique 100, `make_framebuffer_tex`, `common.c:1617–1639`) — dans un replay offline,
   ces nodes dépendent du contenu de la frame précédente (ordre d'évaluation obligatoire).

## 8. Patterns réutilisables pour le passthrough (capture/replay, present)

- **Deferred z-sort = capture/replay de draw calls** (`gl/deferred.c`) : `gl_defer_draw`
  capture (vertices copiés + indices + `driver_state` complet) par couche de Z, et
  `gl_draw_deferred` rejoue à la fin de frame (`common_flip`) dans l'ordre Z décroissant.
  Conditions de non-capture bien documentées : depthtest off, fb_texture, blend non-standard
  hors MENU/BATTLE, overflow queue 1024 (`deferred.c:36–118`). C'est le modèle minimal d'un
  **replayer** : copier les buffers (les pointeurs du moteur ne survivent pas à la frame),
  copier l'état, rejouer hors du contexte d'appel.
- **Sauvegarde/restauration d'état complet** : `struct driver_state` + `gl_save_state/
  gl_load_state` (`gl.h:42–61`, `gl/gl.c:135–162`) — sérialiser l'état backend pour rejouer
  un node plus tard, y compris texture_set/blend/viewport/matrices.
- **Present** : slot 4 → `SwapBuffers` sur le DC capturé à l'init, plus flush des deferred
  AVANT le swap (`gl_draw_deferred` en tête de `common_flip`, `common.c:358`) — l'ordre
  « flush interne puis present » est le contrat implicite du flip.
- **Chargement de plugins secondaires** : option `load_library` → `LoadLibraryA` après
  l'env complet (`common.c:2176–2181`) — une DLL passthrough peut elle-même charger ses
  hooks/recorders une fois l'environnement stable.
- **Statistiques par frame** remises à zéro au flip (`stats`, `common.c:459–463`) — modèle
  pour nos compteurs capture (vertices, draws, reloads).
- **Interposition de loaders** : `replace_function(common_externals.load_tex_file, …)` /
  `destroy_tex_header` (`ff8_opengl.c:312–313`) — pour tracer les TEX à la source plutôt
  qu'au draw. Notre mode observer peut brancher ici sans toucher aux 66 slots.

## 9. Divergences structurelles Eidos 1.2 ↔ FF8_EN.exe (DotEmu) — lecture prudente

1. **Taille d'objet** : struct Aali = 0x100 (64 DWORDs, dernier slot 63 `field_EC`).
   Notre cible = 0x108 (66 DWORDs, slots 63/64 = walk des listes 18/19, slot 65 Alt-only
   appelé par `sub_4097A0`, spec §3/§5). Le binaire DotEmu a **deux DWORDs de plus** ;
   tout slot >63 est hors du contrat documenté par Aali — à traiter comme extension
   DotEmu (ou Eidos tardive) sans équivalent public.
2. **Zone 39–41** : chez Aali `end_scene` (+0x9C) / `field_90` (+0xA0) /
   `setrenderstate_flat2D` (+0xA4) ; chez nous `SelectRenderTarget` / `BeginScene` /
   `LeaveScene` (spec §5, wrappers 0x41E947/0x41E972/0x41E99D). Deux lectures possibles :
   (a) le binaire DotEmu a inséré/déplacé des slots dans cette zone ; (b) les wrappers
   engine observés en live remplissent des rôles que les noms d'Aali placent ailleurs
   (le couple begin/end scene existe bien chez lui, en 38/39). Dans les deux cas :
   **ne pas réutiliser la table d'Aali telle quelle** sur `FF8_EN.exe` — nos EA live restent
   le ground truth ; Aali sert à nommer, pas à localiser.
3. **Slots 2/3** : Aali les appelle `lock`/`unlock` (no-ops « unused and unnecessary »,
   `common.c:324–338`) ; notre spec les nomme `DirectX_7`/`DirectX_8` (EA partagés 2/3).
   La lecture « lock/unlock » (surface lock/unlock, 1 arg uint) est plausible et compatible
   avec nos EA ; à trancher par decomp du wrapper `0x41DEB0` si un backend réel doit les
   implémenter.
4. **Compatibilité des binaires** : Aali supporte FF8 1.2 US/FR/DE/SP/IT/JP + NV/Eidos
   (`common.h:41–53`, `common.c:1789–1853`) — aucun fingerprint DotEmu. Son driver ne
   peut pas être chargé sur notre cible sans portage (versions/offsets/table) ; en revanche
   **son code est le meilleur commentaire des slots ≤63 et de la chaîne TEX/palette**.

## Réfs (chemins dans le clone `…\Temp\opencode\aali-clone`)

- `src/ff8.h` — `ff8_gfx_driver` (640–705), `ff8_game_obj` (444–638, `create_gfx_driver`
  622), `ff8_indexed_vertices` (155–169), `ff8_graphics_object` (171–215),
  `ff8_polygon_set` (217–240), `ff8_tex_header` (242–299), `ff8_texture_set` (301–359),
  `texture_page` (361–387), `ssigpu_packet52` (75–105), `ff8_externals` (710–815).
- `src/common_imports.h` — typedefs `gfx_*` (65–95), enum `effects` RS 0–25 (34–62),
  `nvertex` (246–274), `p_hundred` (373–400), `indexed_primitive` (308–320),
  `matrix_set` (322–335), `blend_mode` (477–488).
- `src/common.c` — export `new_dll_graphics_driver` (1861–2184), `DllMain` (2186–2189),
  `common_init` (274–309), `common_cleanup` (313–322), `common_flip`/present (342–511),
  setviewport/setbg (549–579), load/unload texture (624–662, 846–1006),
  palette_changed/write_palette (1009–1121), blend_modes (1124–1156),
  internal_set_renderstate (1159–1267), setrenderstate (1278–1348), field_74 (1352–1361),
  field_78 (1366–1370), draw_deferred (1375–1398), field_84 (1415–1440),
  begin/end_scene (1445–1473), generic_draw[_paletted] (1482–1537), draws 2D/3D/lines
  (1540–1615), make_framebuffer_tex (1618–1639), get_version (1762–1856), load_library (2176–2181).
- `src/ff8_opengl.c` — `ff8_load_driver` (288–449 : patchs, fake DD 304–308, remplissage
  slots 386–448), stubs field_54/58/5C/60 (83–106), texture_reload_hack (186–258),
  `ff8gl_field_78` (38–81).
- `src/ff7.h` — `ff7_gfx_driver` (1365–1424, table jumelle), `dll_gfx_externals` (1144–1182).
- `src/ff7_opengl.c` — `ff7_load_driver` par contraste (54–230).
- `src/gl/gl.c` — `gl_draw_indexed_primitive` (172–268), save/load state (135–162),
  `gl_set_blend_func` (283–316), flip indirect (475–534).
- `src/gl/deferred.c` — capture/replay z-sort (36–276).
- `src/gl/special_case.c` — effets spéciaux FF8 (68–218).
- `src/fake_dd.c` / `src/fake_dd.h` — interfaces DirectDraw factices (movies).
- `src/ff8_data.h` — scan runtime des externals FF8 (82–295).
- `src/cfg.h` / `misc/7H_GameDriver.cfg` — config driver.
- `src/common.h` — `common_externals` (153–209), heap discipline (211–239), `FB_TEX_VERSION` (97).
- Repo : https://github.com/unab0mb/7H_GameDriver (README : « ff7_opengl … Source by Aali »).
