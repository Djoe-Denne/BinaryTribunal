# Spec ABI — Driver graphique externe `new_dll_graphics_driver` (lot 12)

> Contrat figé pour une DLL backend « type 2 » injectable dans `FF8_EN.exe` (`064d466b…`, base `0x400000`).
> Ground truth = ASM/IDB live (sondes 2026-09-20). Fonctions d'init déjà couvertes par triples
> `[glm-triple 2026-09-15]` : `Gfx_LoadExternalBackendFactory 0x409805`,
> `Gfx_InitializeSelectedBackend 0x40942E` (livrables decomp existants — ne pas refaire).
> Cible : U29.7 / U29.8 / U30.5. Mode visé du prototype : **observer Mode A** (voir `driver-passthrough/`).

## 1. Cycle de vie du backend sélectionné

```text
boot graphics (CheckRegistry 0x401890)
  -> Gfx_InitializeSelectedBackend(engine)           call @0x401905  (2e call-site non analysé @0x409778)
       switch *(engine+2984)   (= engine+0xBA8)      // 0=DDrawAlt 1=DDraw 2=DLL factory 3=OpenGL, ja unsigned
       case 2:  factory = *(engine+0xBD0)            // posé par Gfx_LoadExternalBackendFactory
                if factory: *(engine+0xA74) = factory(engine)   // call [ebp-8] @0x40951D, cdecl, 1 arg
       if *(engine+0xA74):  driver = *(engine+0xA74)  // GetBufApp_0xA74 = mov eax,[eax+0xA74] @0x4098EE
                            ret = call [driver+0](engine)        // slot 0 = Init, appelé immédiatement
       if ret:  ... sub_418C6E / set_viewport 0x41E070 / isGetDrawBuf({0,0,0,1.0f}) /
                sub_41DF96 / Render_FramePresent_Dispatch / sub_41DF96, puis sub_408E90(engine)
shutdown (fonction 0x409670, cleanup) :
       driver = GetBufApp_0xA74(engine); call [driver+4](...)    // slot 1 = Uninit @0x4096F2
       puis FreeLibrary(*(engine+0xBCC))                          // @0x40971A, si type 2
```

- **`Gfx_LoadExternalBackendFactory` (0x409805) a zéro caller statique** (vérifié 2026-09-20 : `XrefsTo`
  vide, y compris zones non analysées) : le chemin type 2 natif est un point d'extension ouvert.
  Le lanceur du prototype doit donc poser lui-même la config avant le boot graphics (§7).
- La factory est stockée en `engine+0xBD0` (index `engine[756]`), le flag de chargement `engine+0xBC8` = 1,
  le `HMODULE` en `engine+0xBCC`.

## 2. Config d'activation (36 bytes, `GfxExternalBackendConfig36`)

```c
struct GfxExternalBackendConfig36 {   // cdecl, poussée droite->gauche : (config, engine)
    DWORD backend_type;    // +0x00 : DOIT valoir 2
    char* dll_name;        // +0x04 : chemin LoadLibraryA
    char* factory_export;  // +0x08 : nom d'export, attendu "new_dll_graphics_driver"
    DWORD reserved[6];     // +0x0C..+0x23 : 6 DWORDs copiés tels quels vers engine+0xBB0 (passthrough config)
};  // taille totale 0x24 = 36 bytes (qmemcpy engine+0xBB0 <- config, 0x24)
```

Effets de `Gfx_LoadExternalBackendFactory(config, engine)` (0x409805, preuve = triple en tête IDB) :
`*(engine+0xBA8) = config->backend_type` ; `qmemcpy(engine+0xBB0, config, 0x24)` ; si type==2 :
`LoadLibraryA(config->dll_name)` puis `GetProcAddress(hModule, config->factory_export)` →
`engine[754]=1`, `engine[755]=hModule`, `engine[756]=factory`. Retour : 1 si OK ou type != 2, 0 sinon
(engine nul, LoadLibrary ou GetProcAddress en échec — la copie config a déjà eu lieu dans ce cas).

## 3. Objet driver : 66 DWORDs (0x108), alloué par la DLL

`calloc(1, 0x108)` pour les backends natifs (ctors GL `0x4252B0` / DD `0x425540` / Alt `0x4257D0`).
La DLL factory retourne un objet équivalent. **Ce n'est pas une vtable pure** :

| Offsets | Slots | Nature |
| --- | --- | --- |
| +0x000..+0x020 | 0–8 | fnptrs (Init/Uninit/DirectX_7/8/Present/isGetDrawBuf2/… ) |
| +0x024..+0x038 | 9–14 | **état inline** : clear-color vec4 écrit par `isGetDrawBuf` ; DDraw lit aussi +0x24/+0x38 ; slot 15 (+0x3C) inerte |
| +0x040..+0x104 | 16–65 | fnptrs ; slots 34 (+0x88), 36 (+0x90), 15 restent NULL dans les ctors natifs |

- Slots **Alt-only** : 21 (+0x54), 22 (+0x58), 23 (+0x5C), 24 (+0x60) et 65 (+0x104). GL/DD ne les remplissent pas.
- Slots 34/36 : hooks optionnels NULL-guarded (wrapper 0x41E7A5 sans callers ; 36 = override qui retombe sur 35).

## 4. Convention d'appel des slots

- Tout callback : `__cdecl`, **pas de this explicite** — les wrappers engine font
  `driver = *(engine+0xA74)` (via `GetBufApp_0xA74 0x4098EE`) puis `call [driver+off](args...)` :
  les wrappers sont des **forwarders transparents** (mêmes args, même ordre, poussés droite→gauche,
  cleanup `add esp,N`). La position de `engine` varie par slot — arg0 (ex. present 0x41DF32,
  LeaveScene 0x41E9B3), 2e (slots 27/28/30–33/35/39/40) ou dernier (slots 5/7/18) ; le driver DLL
  retransmet la pile telle quelle.
- Le driver DLL garde son propre objet dans un static de la DLL (aucun champ « this » n'est réservé ;
  slots 15/34/36 libres inutilisables de façon fiable pour du stockage).
- Slots sans implémentation native (ex. Alt-only sous proxy GL) → **no-op obligatoire** (return 0), jamais NULL
  si l'engine peut les appeler (le slot 65 est appelé par `sub_4097A0` via GetBufApp @0x4097A8).

## 5. Table des slots (offsets, EA par backend, wrapper engine)

Signatures : `int __cdecl fn(engine, ...)` sauf mention. Slots 43–64 : voir §6.

| Slot | Off | GL | DDraw | Alt | Wrapper engine (EA) | Rôle |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | +0x000 | 0x437B3D | 0x43ABDC | 0x40C40C | call [eax] @0x409572 (dans 0x40942E) | Init(engine) |
| 1 | +0x004 | 0x437B1D | 0x43A57B | 0x40DB27 | call [edx+4] @0x4096F2 (fn 0x409670) | Uninit/shutdown |
| 2 | +0x008 | 0x437BD1 | 0x40DEDC | 0x40DEDC | call [edx+8] @0x41DED4 (fn 0x41DEB0) | DirectX_7 (2/3 partagent) |
| 3 | +0x00C | 0x437C06 | 0x40E157 | 0x40E157 | fn 0x41DEB0 | DirectX_8 |
| 4 | +0x010 | 0x439CF3 | 0x43C761 | 0x40B50E | Render_FramePresent_Dispatch 0x41DF0C | Present, gated `*(engine+0xB88) != 0` |
| 5 | +0x014 | 0x437D0B | 0x43ADE3 | 0x426900 | isGetDrawBuf2 @0x41DFC2 | prep buffer |
| 6 | +0x018 | 0x437CF4 | 0x43B136 | 0x426ACD | sub_41DF96 | support frame |
| 7 | +0x01C | 0x437C10 | 0x43B14D | 0x426AE4 | gfx_driver_set_viewport_sub_41E070 | viewport |
| 8 | +0x020 | 0x437D95 | 0x43B1AC | 0x426C31 | isGetDrawBuf @0x41E170 | clear-color + inline state writer |
| 9–14 | +0x24..+0x38 | — état inline, pas des fnptrs (voir §4) | | | isGetDrawBuf | clear-color vec4 +0x28–0x34 |
| 15 | +0x3C | NULL | NULL | NULL | — | inerte |
| 16 | +0x40 | 0x43B1EF | 0x43B1EF | 0x41ECBE | — | audio-adjacent (partagé) |
| 17 | +0x44 | 0x43B21E | 0x43B21E | 0x41ED04 | — | |
| 18 | +0x48 | 0x439018 | 0x43B274 | 0x41296A | Thunk_BufApp_Off72 @0x41E628 | |
| 19 | +0x4C | 0x437DCB | 0x43B314 | 0x420097 | fn 0x419E89 @0x419EA5 | |
| 20 | +0x50 | 0x4381F8 | 0x43B319 | 0x420917 | — | |
| 21 | +0x54 | — | — | 0x420143 | fn 0x41B06B @0x41B15D | Alt-only |
| 22 | +0x58 | — | — | 0x4203B2 | fn 0x419F38 @0x419F38 | Alt-only (Release/eviction famille) |
| 23 | +0x5C | — | — | 0x420476 | fn 0x419F80 @0x419F80 | Alt-only |
| 24 | +0x60 | — | — | 0x436864 | fn 0x417D84 @0x417E1A | Alt-only |
| 25 | +0x64 | 0x438E62 | 0x43BCC0 | 0x4365FF | fn 0x407EB4 @0x4082C2 ; fn 0x41EA06 @0x41EA18 | |
| 26 | +0x68 | 0x438F2D | 0x43BCCA | 0x4367A8 | fn 0x41E9C4 @0x41E9D6 | |
| 27 | +0x6C | 0x438525 | 0x43B4FA | 0x4427CF | fn 0x4187F7 @0x4187FF | |
| 28 | +0x70 | 0x43BD50 | 0x43BD50 | 0x4307C3 | fn 0x41EA71 @0x41EA83 | |
| 29 | +0x74 | 0x438599 | 0x43B50C | 0x440FF0 | Gfx_SetRenderState @0x41E658 | RS types 0–25, shadow `*(engine+2692)[type]` |
| 30 | +0x78 | 0x438682 | 0x43B57F | 0x41F99A | fn 0x41E77D @0x41E785 | CommitRenderState, bits `1<<type` |
| 31 | +0x7C | 0x4385BF | 0x43B532 | 0x441560 | fns @0x41E69F/0x41E6D3/0x41E707 | |
| 32 | +0x80 | 0x4385D4 | 0x43B547 | 0x441581 | fn 0x41E727 @0x41E72F | |
| 33 | +0x84 | 0x43864C | 0x43B55C | 0x44162E | GfxDriver_SetBlendMode @0x41E75A | blend 0–4 (case 3 sans wrapper site) |
| 34 | +0x88 | NULL | NULL | NULL | GfxDriver_Slot34_EmptyHook @0x41E7AD | hook optionnel, NULL-guarded |
| 35 | +0x8C | 0x439367 | 0x43BD7D | 0x4422FD | fn 0x41E7D8 @0x41E7E0 | (swap buffers via SelectTarget) |
| 36 | +0x90 | 0x439C2D | 0x43C693 | 0x4425C4 | fn 0x41E803 @0x41E80B | override → fallback slot 35 |
| 37 | +0x94 | NULL | NULL | NULL | — | libre |
| 38 | +0x98 | 0x438CC9 | 0x43BAD8 | 0x44233F | fn @0x41E924 | |
| 39 | +0x9C | 0x438CE7 | 0x43BAF6 | 0x44235D | GfxDriver_SelectRenderTarget 0x41E947 | SelectTarget (pas end-scene) |
| 40 | +0xA0 | 0x438D7F | 0x43BB88 | 0x442409 | GfxDriver_BeginScene 0x41E972 | BeginScene |
| 41 | +0xA4 | 0x438E44 | 0x43BC46 | 0x44250E | GfxDriver_LeaveScene 0x41E99D | Leave (flag-clear/unlock/EndScene Alt) |
| 42 | +0xA8 | 0x439000 | 0x43BD65 | 0x43F96E | — | |
| 43–64 | +0xAC..+0x100 | 0x4370A6…0x437866 | 0x43CB55…0x43DEC6 | 0x43DF00…0x43E540 | via GfxDrawList +0x9C/+0xA0 | draw-list setup/walk (§6) |
| 65 | +0x104 | — | — | 0x42172A | fn 0x4097A0 @0x4097A8 | Alt-only, consumer engine-level |

Sources des tables : écritures immédiates extraites des ctors 0x4252B0 / 0x425540 / 0x4257D0
(sonde py_eval 2026-09-20 : 52 / 52 / 57 fnptrs) ; wrappers : scan `XrefsTo(GetBufApp_0xA74)` +
premier `call dword ptr [reg+off]` suivant (même date).

## 6. Chaîne draw-list : types → slots setup/walk

Unique écrivain de `list+156` (+0x9C, setup) et `list+160` (+0xA0, walk) :
`Gfx_BindDrawListBackendCallbacks 0x41619A` (seul caller `Gfx_CreateDrawList`). Dispatch `jpt_4162FF`,
cases 0–19 (≥20 garbage ; case 16 → stub mort 0x41669B — **RS-16 glDepthMask existe, list-16 est mort**).
Le type de liste est lu dans `list` (champ type) au moment du bind ; le bind copie **des fnptrs du driver** :

| Type(s) | Setup (list+156) | Walk (list+160) | Bloc |
| --- | --- | --- | --- |
| 0, 8 | driver+0xAC (slot 43) | driver+0xC0 (slot 48) | 0x416358 / 0x416306 |
| 2, 10 | driver+0xB0 (slot 44) | driver+0xC4 (slot 49) | 0x416381 / 0x41632F |
| 1, 9 | driver+0xD0 (slot 52) | driver+0xE4 (slot 57) | 0x4164FF / 0x4164AD |
| 3, 11 | driver+0xD4 (slot 53) | driver+0xE8 (slot 58) | 0x416528 / 0x4164D6 |
| 18 | driver+0xF4 (slot 61) | driver+0xFC (slot 63) | 0x416651 |
| 19 | driver+0xF8 (slot 62) | driver+0x100 (slot 64) | 0x416677 |
| 5, 7, 13, 15 | driver+0xDC (slot 55, bloc à sous-condition 0x416551) | — (setup seul) | condition interne |
| 4, 6, 12, 14, 17 | écriture d'état `[ecx+0xB8]` (pas un fnptr slot), bloc à sous-condition 0x4163AA | — | condition interne |
| 16 | stub mort 0x41669B | — | type 16 mort |
| 17 | setup conditionnel | — | bloc 0x4163AA |

Signatures (prouvé par `Gfx_WalkDrawList 0x4178D7`) :

```c
int __cdecl list_setup(void* ctx /*list+0x18*/, void* node /*list+0x94*/, void* arg);
int __cdecl list_walk (void* ctx, void* node, void* arg);   // par node ; next = *(void**)node
```

Guards du walk : génération `cmp list->+0x58, *(list->+0x34)` (+88 vs +52 ctx) ; `list->+0x94 != 0` ;
`list->+0x9C != 0` sinon skip total. Backend object résolu du ctx : `var = ctx->+0x38`, override si
`ctx->+0x3C != 0` → `ctx->+0x68`.

Chaîne frame (référence fermée, battle-render-pipeline-entrypoints.md) :
`Gpu_DrawOTagCurrent 0x45D610 → Gfx_SelectTexturePageDrawList 0x465CE0 → Gfx_SubmitDisplayLists 0x4980C0
→ Gfx_SubmitTexturePageLists 0x465930 → Gfx_WalkDrawList 0x4178D7` ; viewport `0x499EA0` ;
present `0x41DF0C` (engine loop, jamais FFBattleModule).

## 7. Activation du type 2 (contrainte lanceur)

1. La factory n'est jamais appelée nativement → le lanceur appelle lui-même
   `((int(__cdecl*)(cfg, void*))0x409805)(&cfg36, engine)` (ou écrit `engine+0xBA8=2` + `engine+0xBD0`).
2. Le boot natif appelle ensuite `0x40942E` (call @0x401905 dans CheckRegistry 0x401890 ; second call-site
   code non analysé @0x409778) → case 2 → `factory(engine)` → slot 0 Init.
3. `engine+0xB88` doit être non-nul pour que le present (slot 4) tire.
4. Shutdown : fn 0x409670 appelle slot 1 puis `FreeLibrary(*(engine+0xBCC))` — la DLL doit rester
   chargeable/déchargeable proprement (pas de travail dans DllMain).

## 8. Contrats notables à respecter (déjà fermés, rappels)

- RS slot 29 : types 0–25, **pas de table d'enum** ; GL/DD = shadow `*(engine+2692)[type]` seule
  (`Gfx_ShadowSetRenderState` 0x438599 / `_DDraw` 0x43B50C) ; Alt écrit D3D immédiat. Type 14 =
  `glDisable(GL_CULL_FACE)` bit 0x4000 ; RS-16 = ZWRITE/glDepthMask (existe). Types sans objet :
  1, 7, 17, 19–22 (mask 0x0385FF7D).
- Commit slot 30 : bits `1<<type` (GPU). Type 14 commit via bit 0x4000.
- Blend slot 33 : valeurs 0–4 ; neuf call-sites utilisent 0/1/2/4 ; case 3 implémenté (=GL 1) sans wrapper.
- Slots 39/40/41 : SelectTarget écrit `engine+2664` et swappe via slot 35 (Alt gate `engine+2300`) ;
  BeginScene `wglMakeCurrent` puis SelectTarget ; LeaveScene = flag-clear/unlock/EndScene, **pas** present.
- FVF Alt `0x1C4` XYZRHW|DIFFUSE|SPECULAR|TEX1, 32 bytes, TRIANGLELIST ; GL stride 32 (xyz 3 floats, no specular).
- Structures byte-exactes : `GfxDrawList` 0xEC (+0x18 ctx, +0x34 genptr, +0x58 genstamp, +0x94 head,
  +0x9C setup, +0xA0 walk) ; OT node 24 o ; OT battle 4386 buckets (0x4488, stride 0x9B88) ;
  POLY_FT3 32 / FT4 40 o ; vertex GPU 32 o.

## 9. Ouverts (live, hors decomp)

- Voie du present réel : **tranchée au niveau module par la session P0 2026-09-21** (`driver-provenance.md`)
  : le present passe par slot 4 vers **AF3DN.P (shim DotEmu)** `0x5F7B1BF0`, qui installe sa factory
  en `engine+0xBD0` — la table statique des ctors n'est pas celle du runtime. Reste ouvert :
  l'ordre per-frame natif/D3D9 (nécessite un bp dans AF3DN.P ou un hook vtable d3d9 — campagne suivante).
- Sémantique fine des blocs à sous-condition du bind (types 4/6/12/14/17 et 5/7/13/15) : mécanisme figé,
  branches internes à dériver si un driver réel doit les implémenter au-delà du passthrough.

## Réfs

- `decomp/0x409805__*.md`, `decomp/0x40942E__*.md` (triples existants)
- `driver-provenance.md` (note backend provenance, livrable c)
- `driver-passthrough/` (prototype Mode A, livrable b)
- obsidian : [[projects/re-ff8/references/battle-render-pipeline-entrypoints]],
  [[projects/re-ff8/concepts/external-battle-renderer-architecture]]
