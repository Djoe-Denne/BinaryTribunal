# Référence externe — FFNX : interposition du driver graphique (FF7/FF8) et transposition FF8

> Analyse du repo FFNX (https://github.com/julianxhokaxhiu/FFNX), clone local
> `C:\Users\djden\AppData\Local\Temp\opencode\ffnx-clone\`, commit
> `b341cf135941ed745f89a5080a7cd95adb54018a` (2026-09-20). Référence contraignante :
> `driver-abi-spec.md` (même dossier). Toutes les citations `src/…` renvoient au repo FFNX.
> FFNX est l'héritier direct du driver `ff7_opengl` d'Aali (README.md:14) et contient un
> support FF8 **natif** (`src/ff8/`, `src/ff8.h`, `src/ff8_opengl.cpp`) : c'est la seule
> implémentation publique complète d'un backend DLL pour le moteur FF8 PC.

## Summary

FFNX prouve, code à l'appui, les trois piliers de notre spec ABI : (1) le moteur FF8 lit
`current_gfx_driver == 2` puis appelle `create_gfx_driver(game_object)` — FFNX écrit
exactement ces deux champs depuis sa DLL (`ffnx_inject_driver`, `src/common.cpp:3706-3712`),
(2) la factory s'appelle **`new_dll_graphics_driver(void* game_object)`** — nom identique à
notre §2 (`src/common.cpp:3097`, exporté dans `misc/FFNx.def:37`), (3) l'objet driver FF8 est
une table de 66 DWORDs avec état inline en +0x24/+0x28..+0x37 — reproduit champ par champ par
`struct ff8_gfx_driver` (`src/ff8.h:946-1011`). En prime, FFNX documente la sémantique des
22 slots draw-list (nos slots 43–64) : flat2D/smooth2D/textured2D/paletted2D ×
setrenderstate/draw × 2D/3D/lines — ce qui nomme les types de liste de notre §6.

## 1. Mécanisme d'activation chez FFNX (comparé à notre §7)

### 1.1 Vecteur d'injection : détournement de DLL native, pas IAT ni hook

FFNX se fait charger par le jeu en usurpant une DLL que le moteur charge déjà :

| Édition FF8 | Nom usurpé | Preuve |
| --- | --- | --- |
| FF8 2000 (retail 1.2) | `eax.dll` (Creative EAX), export `EAXDirectSoundCreate` ordinal 5 | `misc/FFNx.def:24-25`, `CMakeLists.txt:454-460` (rename FFNx.dll → eax.dll), implémentation `src/common.cpp:3674-3704` |
| FF8 Remastered | `eax.dll` (même EAX) | `CMakeLists.txt:646-652`, instructions `docs/how_to_install.md:119-129` |
| FF8 Steam 2013 | `AF3DN.P` | `CMakeLists.txt:540-546` (rename FFNx.dll → AF3DN.P) |

C'est **exactement le vecteur AF3DN.P** que notre campagne live a identifié comme shim DotEmu
(`driver-provenance.md`, spec §9) : FFNX se renomme lui-même en `AF3DN.P` pour la Steam 2013 et
détecte ce cas par `strstr(dllName, "af3dn.p")` (`src/common.cpp:3380-3382`, détection FF7 à
`src/common.cpp:3200`). Le jeu FF8 charge ce fichier de lui-même — pas d'IAT patch, pas de
 CreateRemoteThread.

### 1.2 Séquence de boot FFNX (FF8)

1. `DllMain/DLL_PROCESS_ATTACH` (`src/common.cpp:3112`) : détection de version par empreintes
   `version_check(0x401004)/version_check(0x401404)` (`get_version`, `src/common.cpp:2790-2892` —
   FF8 1.2 US = `0x3885048D`/`0x159618`). Chaque version a son EA d'entrée `ff8_externals.start`
   (`src/common.cpp:3283-3325`, ex. US = `0x55AC07`).
2. `ff8_data()` → `ff8_find_externals()` (`src/ff8_data.cpp:41-1045`) : **tous les EA sont
   résolus par chaînage** `get_relative_call`/`get_absolute_value` depuis `start` (winmain
   +0xDB, create_window +0x114, wndproc absolu +0x34 — `src/ff8_data.cpp:43-45`). Aucun EA
   codé en dur ne survit à un re-link : la méthode est la nôtre (Xrefs/chaînage d'appels).
3. `replace_function(common_externals.create_window, common_create_window)` (`src/common.cpp:3336`)
   : le create_window du moteur est remplacé par un jmp E9 (`src/patch.cpp:95-107`).
4. Dans `common_create_window` (`src/common.cpp:818`), après création de la fenêtre :
   `ff8_init_hooks(game_object)` (`src/common.cpp:1002`, impl `src/ff8_opengl.cpp:2047`),
   puis **`ffnx_inject_driver(game_object)`** (`src/common.cpp:1078`).
5. `ffnx_inject_driver` (`src/common.cpp:3706-3712`) :

```c
VRASS(game_object, current_gfx_driver, 2);            // == notre engine+0xBA8 = 2
VRASS(game_object, create_gfx_driver, new_dll_graphics_driver);  // == notre engine+0xBD0
```

6. La fonction remplacée retourne, le moteur poursuit son boot **natif** : il voit
   `current_gfx_driver == 2`, appelle `create_gfx_driver(game_object)` (la factory de la DLL),
   puis le slot 0 (Init). FFNX ne hook **pas** le call-site d'init : il laisse le chemin type 2
   natif s'exécuter, exactement notre §7-2. L'appel `engine_loop_obj.init(game_object)` qui suit
   (`src/common.cpp:1080-1081`) est celui du moteur (struct `main_obj`,
   `src/common_imports.h:534-545`).

### 1.3 Confrontation avec notre §7

| Notre spec (FF8_EN DotEmu) | FFNX | Verdict |
| --- | --- | --- |
| Config 36B posée avant boot, `Gfx_LoadExternalBackendFactory 0x409805` appelé par le lanceur (§7-1) | Pas de config 36B : la DLL déjà chargée écrit directement `current_gfx_driver=2` + `create_gfx_driver=factory` | **Raccourci équivalent** — FFNX saute LoadLibrary/GetProcAddress car sa factory est liée statiquement dans le process. Le résultat mémoire (`+0xBA8`=2, `+0xBD0`=factory) est identique |
| factory(engine) → objet driver, slot 0 Init immédiat (§1) | identique (`new_dll_graphics_driver` → `ff8_load_driver` → calloc → objet rempli) | **Confirmé** |
| HMODULE en engine+0xBCC, FreeLibrary au shutdown (§1, §7-4) | N/A chez FFNX (DLL non déchargeable proprement ; `unreplace_functions()` au detach, `src/common.cpp:3440`, `src/patch.cpp:132-143`) | FFNX ne prouve pas la voie FreeLibrary — garder notre §7-4 |
| `engine+0xB88` non-nul pour tirer le present (§7-3) | pas d'équivalent direct dans FFNX ; le present FF8 de FFNX passe par `common_flip` (slot 4, voir §2) | ouvert chez FFNX |

Timing : l'injection a lieu **pendant** `create_window` (appelé par winmain,
`src/ff8_data.cpp:44`), donc avant le boot graphics du moteur — cohérent avec notre contrainte
« posée avant boot graphics » (§7). FFNX ne remplace jamais le driver en runtime (cf. §4, pièges).

## 2. Structure du driver graphique FF8 vue par FFNX

### 2.1 L'objet : 66 DWORDs confirmés, avec état inline au même endroit

`struct ff8_gfx_driver` (`src/ff8.h:946-1011`) : les noms de champs (`field_24`, `field_28`,
`field_38`, `field_3C`, … `field_EC`) indiquent les offsets. `field_28` est un
`struct bgra_color` = **4 floats** (`src/common_imports.h:128-134`), donc le struct compte
63 champs dont un de 4 DWORDs = **66 DWORDs = 0x108** — taille identique à notre §3.

Correspondance champ par champ avec notre table des slots (§5) — la colonne FFNX donne le nom
et l'implémentation la plus proche :

| Slot | Off | Nom FFNX (`src/ff8.h`) | Typedef (`src/common_imports.h`) | Implémentation FFNX | Notre spec |
| --- | --- | --- | --- | --- | --- |
| 0 | +0x000 | `init` | `gfx_init(game_obj*)` | `common_init` (`src/common.cpp:1114-1132`), retourne true | Init ✓ |
| 1 | +0x004 | `cleanup` | `gfx_cleanup(game_obj*)` | `common_cleanup` (`src/common.cpp:1136`) | Uninit ✓ |
| 2 | +0x008 | `lock` | `gfx_lock(uint32_t)` | `common_lock` « unused and unnecessary » → return true (`src/common.cpp:1167-1173`) | DirectX_7 — lecture compatible : interface surface DX (lock) |
| 3 | +0x00C | `unlock` | `gfx_unlock(uint32_t)` | `common_unlock` → return true (`src/common.cpp:1175-1181`) | DirectX_8 (idem) |
| 4 | +0x010 | `flip` | `gfx_flip(game_obj*)` | `common_flip` = swap fin de frame + overlay + HUD (`src/common.cpp:1185+`) | **Present ✓** (notre slot 4) |
| 5 | +0x014 | `clear` | `gfx_clear(u32,u32,u32,game_obj*)` | `common_clear` (`src/common.cpp:1441`) | prep buffer — lecture divergente, à trancher au decomp |
| 6 | +0x018 | `clear_all` | `gfx_clear_all(game_obj*)` | `common_clear_all` (`src/common.cpp:1454`) | support frame |
| 7 | +0x01C | `setviewport` | `gfx_setviewport(u32,u32,u32,u32,game_obj*)` | `common_setviewport` (`src/common.cpp:1465`) | viewport ✓ (**engine en dernier arg** — confirme notre §4 slots 5/7/18) |
| 8 | +0x020 | `setbg` | `gfx_setbg(bgra_color*,game_obj*)` | `common_setbg` lit le vec4 et pousse `setBackgroundColor` (`src/common.cpp:1490-1500`) | isGetDrawBuf/clear-color ✓✓ — **c'est notre writer de clear-color** |
| 9 | +0x024 | `field_24` | — | non touché (état inline) | état inline ✓ |
| 10–13 | +0x028..+0x034 | `field_28` (`bgra_color` 4 floats) | — | écrit par le chemin setbg | clear-color vec4 ✓ (FFNX : b,g,r,a floats) |
| 14 | +0x038 | `field_38` | — | non touché | inline (DDraw lit +0x38) ✓ |
| 15 | +0x03C | `field_3C` | — | non touché chez FFNX **FF8** | inerte ✓ (notre slot 15) |
| 16 | +0x040 | `prepare_polygon_set` | `gfx_prepare_polygon_set(polygon_set*)` | `common_prepare_polygon_set` alloue `indexed_primitives` (`src/common.cpp:1504-1510`) | notre slot 16 « audio-adjacent » — **divergence à réconcilier** |
| 17 | +0x044 | `load_group` | `gfx_load_group(u32,matrix_set*,p_hundred*,p_group*,polygon_data*,polygon_set*,game_obj*)` — 7 args | `common_externals.generic_load_group` (`src/ff8_opengl.cpp:2511`) | slot 17 |
| 18 | +0x048 | `setmatrix` | `gfx_setmatrix(u32,matrix*,matrix_set*,game_obj*)` | `common_setmatrix` (`src/common.cpp:1523`) | slot 18 (thunk bufapp) — divergence de lecture |
| 19 | +0x04C | `unload_texture` | `gfx_unload_texture(texture_set*)` | `common_unload_texture` (`src/common.cpp:1556`) | slot 19 |
| 20 | +0x050 | `load_texture` | `gfx_load_texture(texture_set*,tex_header*,texture_format*)` | `common_load_texture` (`src/common.cpp:1882+`) | slot 20 |
| 21 | +0x054 | `field_54` | — | `ff8gl_field_54` no-op tracé (`src/ff8_opengl.cpp:514-517`) | Alt-only 21 — **FF8-only hook, l'engine peut l'appeler** |
| 22 | +0x058 | `field_58` | — | `ff8gl_field_58` no-op (`src/ff8_opengl.cpp:519-522`) | Alt-only 22 |
| 23 | +0x05C | `field_5C` | — | `ff8gl_field_5C` no-op (`src/ff8_opengl.cpp:524-527`) | Alt-only 23 |
| 24 | +0x060 | `field_60` | — | `ff8gl_field_60(palette*,texture_set*)` no-op (`src/ff8_opengl.cpp:529-532`) | Alt-only 24 |
| 25 | +0x064 | `palette_changed` | `gfx_palette_changed(u32,u32,u32,palette*,texture_set*)` | `common_palette_changed` (`src/common.cpp:2095`) | slot 25 |
| 26 | +0x068 | `write_palette` | `gfx_write_palette(u32,u32,void*,u32,palette*,texture_set*)` | `common_write_palette` (`src/common.cpp:2125`) | slot 26 |
| 27 | +0x06C | `blendmode` | `gfx_blendmode(u32,game_obj*)` | `common_blendmode` (`src/common.cpp:2269`) | slot 27 |
| 28 | +0x070 | `light_polygon_set` | `gfx_light_polygon_set(polygon_set*,light*)` | `common_light_polygon_set` | slot 28 |
| 29 | +0x074 | `field_64` | `gfx_field_64(u32 state, u32 option, game_obj*)` | `common_field_64` → `internal_set_renderstate(state,option,…)`, commenté « set a simple render state » (`src/common.cpp:2394-2400`) | **SetRenderState ✓** (types 0–25) |
| 30 | +0x078 | `setrenderstate` | `gfx_setrenderstate(p_hundred*,game_obj*)` | `common_setrenderstate` — applique un **bitmask features/options** (`src/common.cpp:2403-2472`) | CommitRenderState (bits) — lecture compatible |
| 31 | +0x07C | `_setrenderstate` | idem | idem (`src/ff8_opengl.cpp:2525`) | slot 31 |
| 32 | +0x080 | `__setrenderstate` | idem | idem (`src/ff8_opengl.cpp:2526`) | slot 32 |
| 33 | +0x084 | `field_74` | `gfx_field_74(u32,game_obj*)` | `common_field_74` : **`if(unknown > 4) return;`** puis `hundred_array[unknown]`, commenté « one for each blend mode? » (`src/common.cpp:2476-2485`) | **SetBlendMode ✓✓ (valeurs 0–4, notre slot 33)** |
| 34 | +0x088 | `field_78` | `gfx_field_78(polygon_set*,game_obj*)` | `ff8gl_field_78` : rend un polygon_set par groupes + zsort (`src/ff8_opengl.cpp:469-512`) | notre slot 34 = hook NULL — divergence (voir §3.3) |
| 35 | +0x08C | `field__84` | `gfx_field_84(u32,game_obj*)` | `common_field_84` : écrit `field_928` et sélectionne `polygon_set_2EC`/`2F0` (`src/common.cpp:2537-2562`) | swap via SelectTarget — lecture divergente |
| 36 | +0x090 | `field_88` | — | `ff8gl_field_88()` no-op (`src/ff8_opengl.cpp:539-542`) | override → fallback 35 |
| 37 | +0x094 | `draw_deferred` | `gfx_draw_deferred(struc_77*,game_obj*)` | `common_draw_deferred` (`src/common.cpp:2499-2518`) | notre slot 37 = NULL libre — divergence |
| 38 | +0x098 | `field_80` | `gfx_field_80(graphics_object*,game_obj*)` | `common_field_80` → délègue à field_78 (`src/common.cpp:2524-2533`) | slot 38 |
| 39 | +0x09C | `field_84`(=+0x9C) | — | voir slot 35 : sélection d'un preset polygon_set | SelectRenderTarget — lecture compatible (« select ») |
| 40 | +0x0A0 | `begin_scene` | `gfx_begin_scene(u32,game_obj*)` | `common_begin_scene` : **sauve l'état dans une pile de scenes** + `in_scene++` (`src/common.cpp:2567-2581`) | **BeginScene ✓** |
| 41 | +0x0A4 | `end_scene` | `gfx_end_scene(game_obj*)` | `common_end_scene` : restaure l'état empilé + `in_scene--` (`src/common.cpp:2585-2595`) | **LeaveScene ✓** (pas un present) |
| 42 | +0x0A8 | `field_90` | `gfx_field_90(uint32_t)` | `common_field_90` noop glitch (`src/common.cpp:2598-2601`) | slot 42 |
| 43–64 | +0x0AC..+0x100 | 22 champs draw-list (voir §2.2) | `gfx_polysetrenderstate` / `gfx_draw_vertices` | `common_setrenderstate_2D/3D`, `common_draw_2D/3D`, `common_draw_lines` (`src/common.cpp:2662,2690,2734+`) | draw-list setup/walk ✓ (sémantique nommée, §2.2) |
| 65 | +0x104 | `field_EC` | `gfx_field_EC(game_obj*)` | `common_field_EC` noop glitch (`src/common.cpp:2734-2737`) | Alt-only 65 consumer |

Lecture : la table FFNX **confirme** nos slots 0/1/4/7/8/29/33/40/41, l'état inline 9–14, et la
position variable d'`engine` dans les signatures (dernier arg pour setviewport/clear/setbg/
load_group, 2ᵉ arg pour begin_scene/field_64/field_74, 1ᵉ seul pour end_scene/field_EC) —
exactement notre §4 (« la position de engine varie par slot »).

### 2.2 Sémantique des slots 43–64 (nos types de draw-list) — LE gain net

Les 22 champs finaux du struct (`src/ff8.h:988-1010`) nomment chaque slot ; croisés avec notre
§6 (bind `Gfx_BindDrawListBackendCallbacks 0x41619A`, setups/walks par type) :

| Off | Slot | Nom FFNX | Notre type(s) §6 (setup/walk) |
| --- | --- | --- | --- |
| +0xAC | 43 | `setrenderstate_flat2D` | type 0, 8 (setup) |
| +0xB0 | 44 | `setrenderstate_smooth2D` | type 2, 10 (setup) |
| +0xB4 | 45 | `setrenderstate_textured2D` | — |
| +0xB8 | 46 | `setrenderstate_paletted2D` | — |
| +0xBC | 47 | `_setrenderstate_paletted2D` | — |
| +0xC0 | 48 | `draw_flat2D` | type 0, 8 (walk) |
| +0xC4 | 49 | `draw_smooth2D` | type 2, 10 (walk) |
| +0xC8 | 50 | `draw_textured2D` | — |
| +0xCC | 51 | `draw_paletted2D` | — |
| +0xD0 | 52 | `setrenderstate_flat3D` | type 1, 9 (setup) |
| +0xD4 | 53 | `setrenderstate_smooth3D` | type 3, 11 (setup) |
| +0xD8 | 54 | `setrenderstate_textured3D` | — |
| +0xDC | 55 | `setrenderstate_paletted3D` | type 5, 7, 13, 15 (setup, bloc sous-condition) |
| +0xE0 | 56 | `_setrenderstate_paletted3D` | — |
| +0xE4 | 57 | `draw_flat3D` | type 1, 9 (walk) |
| +0xE8 | 58 | `draw_smooth3D` | type 3, 11 (walk) |
| +0xEC | 59 | `draw_textured3D` | — |
| +0xF0 | 60 | `draw_paletted3D` | — |
| +0xF4 | 61 | `setrenderstate_flatlines` | type 18 (setup) |
| +0xF8 | 62 | `setrenderstate_smoothlines` | type 19 (setup) |
| +0xFC | 63 | `draw_flatlines` | (walk 18 absent de notre §6) |
| +0x100 | 64 | `draw_smoothlines` | (walk 19 absent de notre §6) |

Signatures implémentées : `gfx_polysetrenderstate(polygon_set*, indexed_vertices*, game_obj*)`
et `gfx_draw_vertices(polygon_set*, indexed_vertices*, game_obj*)`
(`src/common_imports.h:96-97`, impls `src/common.cpp:2662-2737`). À rapprocher de nos
`list_setup(void* ctx /*list+0x18*/, void* node, void* arg)` : chez FFNX le triplet se lit
(polygon_set, indexed_vertices, game_obj) — hypothèse de typage pour notre §6, à valider au
decomp, mais les deux lectures s'accordent sur 3 pointeurs cdecl.

Bonus : les types 18/19 = **lines flat/smooth** ; les types 0–3 = 2D/3D flat/smooth. Nos types
4/6/12/14/17 (écriture d'état `[ecx+0xB8]`, pas un slot) restent sans nom chez FFNX.

### 2.3 L'enum des render states (bitmask du p_hundred, slots 30–32)

`enum effects` (`src/common_imports.h:35-64`), commenté « Render states supported by the
graphics engine… Named after corresponding Direct3D states ». Croisement avec notre §8 :

| Bit FFNX | Valeur | Notre spec |
| --- | --- | --- |
| `V_NOCULL` | 0x4000 | type 14 = glDisable(GL_CULL_FACE), bit 0x4000 ✓✓ |
| `V_DEPTHMASK` | 0x10000 | RS-16 = ZWRITE/glDepthMask (bit 1<<16) ✓✓ |
| `V_CULLFACE` | 0x2000 | type 13 (mask 0x0385FF7D l'exclut des « sans objet ») |
| `V_ALPHABLEND` | 0x400 | blend (notre slot 33) |
| `V_LINEARFILTER`/`V_PERSPECTIVE`/`V_DITHER`/`V_ALPHATEST`/`V_SHADEMODE`/`V_SPECULAR`/`V_FOG`… | 0x4/0x8/0x200/0x800/0x20000/0x40000/0x100000 | types 0–25 (shadow engine+2692) |

`common_setrenderstate` (`src/common.cpp:2403-2472`) démontre le protocole complet : le driver
reçoit `p_hundred{features, options}` en bitmask, teste chaque bit, et les bits non gérés sont
simplement ignorés (« any bits still set … are features that we do not currently handle »,
`src/common.cpp:2470-2471`) — le pattern exact de tolérance que notre passthrough doit reproduire.

## 3. Conventions et prototypes documentés

### 3.1 Convention d'appel

Tous les callbacks du driver sont **cdecl sans this**, `game_object` explicite dans la liste
d'arguments, position variable (§2.1). FFNX n'utilise ni thiscall ni wrapper : `ff8_load_driver`
remplit directement les fnptrs (`src/ff8_opengl.cpp:2497-2562`). Le driver garde son état dans
des statics de la DLL (`scene_stack`, `frame_counter`, `newRenderer` global…) — conforme à
notre §4 (« aucun champ this n'est réservé »).

### 3.2 La factory

```c
// src/common.cpp:3092-3108
__declspec(dllexport) void *new_dll_graphics_driver(void *game_object)
{
    if(!ff8) ret = ff7_load_driver(game_object);
    else     ret = ff8_load_driver(game_object);
    return ret;
}
```

- Export par nom (`misc/FFNx.def:37`), un seul argument = l'engine, retour = objet driver
  alloué par la **DLL** — identique à notre contrat §2/§3.
- `ff8_load_driver` alloue avec **l'allocateur du moteur** : `external_calloc(1, sizeof(*ret))`
  (`src/ff8_opengl.cpp:2499`), où `external_calloc` = `common_externals.assert_calloc`
  (`src/common.h:299-306`) — résolu pour FF8 par
  `get_relative_call(create_tex_header, 0x15)` (`src/ff8_data.cpp:433`). C'est le `calloc(1,0x108)`
  de notre §3, avec la précision : **l'allocation passe par l'allocateur assert du moteur** (tag
  fichier/ligne), pas par le heap CRT de la DLL.

### 3.3 Divergences explicites (à ne pas transposer aveuglément)

1. **Slot 16** : FFNX = `prepare_polygon_set` (alloc des indexed_primitives) ; notre IDB lit
   « audio-adjacent ». L'un des deux reads est faux — à trancher par decomp du wrapper FF8.
2. **Slot 34 (+0x88)** : notre spec = NULL + hook NULL-guarded ; FFNX l'implémente
   (`field_78`, rendu polygon_set). Compatible : l'engine a un wrapper, le ctor natif pose NULL,
   un driver tiers peut remplir — mais le call-site réel reste à confirmer (notre wrapper
   0x41E7A5 « sans callers »).
3. **Slot 37 (+0x94)** : notre spec = libre/NULL ; FFNX = `draw_deferred` (rendu d'une instance
   différée, `struc_77`). Même statut que (2).
4. **Slots 5/6** : FFNX lit clear/clear_all ; notre IDB lit prep buffer/support frame. Les deux
   sont des hooks de début de frame — la sémantique fine reste ouverte (notre §9).
5. **Layouts engine** : les champs `current_gfx_driver`/`gfx_driver_data`/`create_gfx_driver` du
   struct FFNX `ff8_game_obj` (`src/ff8.h:918-928`) ne portent pas les offsets de notre IDB
   (`+0xBA8`/`+0xBD0`) : le header FFNX lui-même avertit « a lot of names may be wrong »
   (`src/common_imports.h:103-109`). Nos offsets restent ground truth live ; FFNX apporte la
   sémantique des champs, pas leur adresse.

## 4. Données réutilisables pour FF8

### 4.1 EAs croisés FFNX ↔ notre spec (mêmes adresses dans le binaire)

FFNX cible FF8 1.2 retail (base 0x400000) — la build DotEmu partage des EA identiques, preuve
de parenté binaire directe :

| EA | FFNX | Notre spec |
| --- | --- | --- |
| `0x41E070` | `engine_setviewport_sub_41E070` (`src/ff8_data.cpp:216`) | set_viewport 0x41E070 (§1) |
| `0x45D610` | `sub_45D610`, racine de la chaîne rendu (`src/ff8_data.cpp:480`) | Gpu_DrawOTagCurrent 0x45D610 (§6) |
| `0x465CE0` | `ssigpu_tx_select_2_sub_465CE0` (`src/ff8_data.cpp:493`) | Gfx_SelectTexturePageDrawList 0x465CE0 (§6) |

### 4.2 Pièges documentés côté FFNX (transposables)

- **Pile de scenes FF8** : commentaire explicite « scenes are not stacked in FF7; **FF8 relies
  on the ability to stack scenes**, saving and later reverting to a previous render state »
  (`src/common.cpp:2564-2566`). Un driver FF8 doit implémenter save/restore symétriques dans
  begin_scene/end_scene (slot 40/41) — pas un simple flag.
- **Compteur `in_scene`** : le driver incrémente/décrémente `game_object->in_scene`
  (`src/common.cpp:2576,2594`) ; `ff8gl_field_78` et `common_field_84` refusent de travailler
  si `in_scene == 0` (`src/ff8_opengl.cpp:477`, `src/common.cpp:2545`). Notre passthrough doit
  maintenir ce champ (il vit dans l'engine, pas dans le driver).
- **setbg alpha** : FF8 transmet l'alpha du clear-color, FF7 non — `ff8 ? color->a : 0.0f`
  (`src/common.cpp:1498`).
- **Caps D3D simulées** : l'engine lit des globals de caps que le backend réel a posées ;
  FFNX les force (`d3dcaps[0..4]`, `sub_blending_capability`, `src/ff8_opengl.cpp:2117-2122`,
  résolution `src/ff8_data.cpp:706-709`). Un passthrough qui délègue à un backend natif hérite
  de ses caps ; un driver from-scratch doit les poser.
- **Fakes DirectDraw** : FFNX remplace les interfaces stockées dans l'engine (hors driver)
  par des stubs COM-like `__stdcall` — `game_object->dddevice/front_surface/dd2interface =
  &_fake_*` (`src/ff8_opengl.cpp:2051-2055`), tables dans `src/fake_dd.cpp:171-230`, tracées par
  `trace_fake_dx` (`src/cfg.h:98`). L'engine touche ces champs indépendamment du driver DLL.
- **Jamais de remplacement runtime** : FFNX n'installe son driver qu'avant le boot (§1.2) et ne
  réécrit jamais `create_gfx_driver`/le driver ensuite — aligné avec notre verdict lot +4
  (spec §9).
- **Registre Graphics** : `misc/FF8.reg:24-35` documente l'enum du dword `Graphics` :
  bits 0x00F00000/0x0F000000 = options, nibble 0xF0000000 = `CurrentGfxDriver`
  (« If != 0 then directX 5.0 else software ») ; FFNX force `0x00100000` anti-glitch et écrit
  `0x00100021` par défaut (`src/game_cfg.cpp:96,105-118`, hook du read registry
  `replace_call(init_config + 0x16B, ff8_reg_get_graphics)`, `src/game_cfg.cpp:162`). Notre
  CheckRegistry 0x401890 lit bien cette source ; le type 2 n'y figure pas (il est hors registre,
  posé par une DLL — les deux lectures se complètent).

### 4.3 Patterns d'interposition réutilisables (hors driver)

- `replace_function` = jmp E9 5 bytes + journal pour restauration (`src/patch.cpp:95-143`),
  `replace_call` = réécriture rel32 sur E8/E9/FF15 avec `check_is_call` (`src/patch.cpp:39-48,145-170`),
  `get_relative_call`/`get_absolute_value` pour chaîner les EA (`src/patch.cpp:172-194`).
- Hooks par version : table `switch(version)` d'EAs d'entrée (`src/common.cpp:3283-3325`), puis
  100 % de résolution dynamique — le modèle pour notre multi-build si un jour on vise 1.2 retail.
- Tracing du driver : préfixe `dll_gfx:` sur chaque callback (`src/common.cpp:1116-2601`), gated
  par `trace_all` (TOML `misc/FFNx.toml:636-662`) — le pattern « observer Mode A » de notre
  driver-passthrough (log par slot, aucun rendu).

## 5. Recommandations pour `driver-passthrough/` (Mode A)

1. **Ne pas reproduire le vecteur FFNX** (eax.dll/AF3DN.P) : notre voie launcher-safe (§7) est
   plus propre et déjà prouvée live ; FFNX confirme seulement que `+0xBA8=2` + `+0xBD0=factory`
   suffit, config 36B comprise.
2. **Allouer l'objet driver via l'allocateur assert du moteur** si accessible (FFNX :
   `assert_calloc`), sinon documenter l'écart (notre calloc DLL) — à arbitrer au prototype.
3. **Remplir les 66 DWORDs** : fnptrs cdecl, état inline +0x24/+0x28..+0x37 laissé à 0, slots
   non implémentés en **no-op return 0** (jamais NULL) — pattern FFNX ff8gl_field_54/58/5C/60.
4. **Implémenter au minimum** : slot 0 Init (retour 1), slot 1 cleanup, slot 8 setbg (copier le
   vec4), slot 29 field_64 (swallow types 0–25), slot 33 field_74 (swallow 0–4), slot 40/41 avec
   pile de scenes (FF8-specific), slot 4 flip (observe uniquement).
5. **Logger au format `dll_gfx:` par slot** avec gate config — reprendre la sémantique FFNX pour
   nommer les slots dans les logs.
6. **Maintenir `in_scene`** et laisser les caps/`d3dcaps` du backend sous-jacent intacts.

## Réfs (repo FFNX, commit `b341cf1`)

- Activation : `src/common.cpp:1078,3112-3444,3706-3712` ; `src/ff8_data.cpp:41-45` ;
  `misc/FFNx.def:22-40` ; `CMakeLists.txt:454-460,540-546,646-652` ; `docs/how_to_install.md:96-129`
- Structure driver : `src/ff8.h:946-1011` (struct ff8_gfx_driver), `src/ff8.h:750-944`
  (ff8_game_obj), `src/ff7.h:2014-2073` (variante FF7), `src/common_imports.h:67-98` (typedefs),
  `src/common_imports.h:35-64` (enum effects), `src/common_imports.h:534-545` (main_obj)
- Factory/chargement : `src/common.cpp:3092-3108` ; `src/ff8_opengl.cpp:2497-2562` ;
  `src/ff7_opengl.cpp:603-640`
- Callbacks : `src/common.cpp:1114-1510,2095-2737` ; `src/ff8_opengl.cpp:469-542,2047-2149`
- Patch engine : `src/patch.cpp:39-194` ; résolution externals : `src/ff8_data.cpp:41-1045`
- Fake DD : `src/fake_dd.cpp` ; registre : `misc/FF8.reg` ; `src/game_cfg.cpp:83-175`
- Provenance clone : commit `b341cf135941ed745f89a5080a7cd95adb54018a`, 2026-09-20.
