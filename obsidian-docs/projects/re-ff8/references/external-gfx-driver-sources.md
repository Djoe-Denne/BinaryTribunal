---
title: External Graphics Driver Sources (Aali / FFNx cross-reference)
category: references
tags: [ff8, rendering, external-research, driver, ff8-modding]
aliases: [FFNx reference, Aali game driver, external driver sources]
sources:
  - https://github.com/unab0mb/7H_GameDriver
  - https://github.com/julianxhokaxhiu/FFNX
  - docs/tech/investigation/battle-static-discovery/aali-gamedriver-reference.md
  - docs/tech/investigation/battle-static-discovery/ffnx-driver-reference.md
  - docs/tech/investigation/battle-static-discovery/ffnx-ea-crosswalk.md
summary: Cross-reference of the two public implementations of the FF8 graphics driver interface (Aali 7H_GameDriver, FFNx) against the re-ff8 ABI spec — factory contract, driver object layout, named slots, render-state enum, EA crosswalk and build caveats.
provenance:
  extracted: 0.55
  inferred: 0.1
  ambiguous: 0.35
created: 2026-09-22T18:40:00+02:00
updated: 2026-09-25T14:10:00+02:00
---

# External Graphics Driver Sources

> Livrables d'analyse dans le repo : [[docs/tech/investigation/battle-static-discovery/aali-gamedriver-reference.md|aali-gamedriver-reference.md]],
> [[docs/tech/investigation/battle-static-discovery/ffnx-driver-reference.md|ffnx-driver-reference.md]],
> [[docs/tech/investigation/battle-static-discovery/ffnx-ea-crosswalk.md|ffnx-ea-crosswalk.md]].
> Référence contraignante : la spec ABI [[docs/tech/investigation/battle-static-discovery/driver-abi-spec.md|driver-abi-spec]] —
> ground truth = ASM de `FF8_EN.exe` `064d466b…` ; les noms externes sont des **candidats de sémantique**, jamais des preuves.

## Sources et ce qu'elles sont

| Source | Portée | Statut |
| --- | --- | --- |
| **FFNx** (julianxhokaxhiu) | FF7 + **FF8 natif** (Steam 2013) + FF9 : backend DLL complet (Vulkan/D3D11/D3D12/GL), héritier d'Aali | Implémentation publique de référence du chemin type 2 |
| **7H_GameDriver / Aali** (`unab0mb`, GPLv3) | Driver OpenGL complet des ports originaux FF7/**FF8** (Eidos 1.2) | Source historique : `struct ff8_gfx_driver` documentée en C |
| **Crosswalk re-ff8** | 193 EAs FFNx recoupés contre notre registre | 166 EAs nouveaux sémantisés (86 %) |

## Contrat confirmé par deux implémentations indépendantes

- Export factory **`new_dll_graphics_driver(void *game_object)`** : Aali `src/common.c:1861`, FFNx `src/common.cpp:3097` + `misc/FFNx.def:37` — même nom, même proto (cdecl, 1 arg = engine, retour = objet driver). Confirme la spec §1/§2.
- Struct `ff8_gfx_driver` : FFNx `src/ff8.h:946–1011` (66 DWORDs attendus) ; Aali `src/ff8.h:640–705` (table Eidos **0x100**) — **caveat build** : notre binaire DotEmu fait `0x108` (66) et la zone 39–41 diffère ; les offsets externes ne se transposent pas 1:1.
- Slots nommés (recoupés avec notre table) : 0 init / 1 cleanup / 4 flip(present) / 7 setviewport / 8 setbg / 9–14 état inline (clear-color vec4) / 15 inerte / 21–24 Alt-only / 29 = 3ᵉ `setrenderstate` / 33 blendmode / 40–41 pile de scenes / 43–64 familles `setrenderstate_X`/`draw_X` (flat/smooth/textured/paletted × 2D/3D, lines).
- Render states **0–25 = bits `1<<type`** de l'enum `effects` (Aali `common_imports.h:34–62`) : 0 WIREFRAME, 2 LINEARFILTER, 3 PERSPECTIVE, 4 TMAPBLEND, 5/6 WRAP_U/V, 8 COLORKEY, 9 DITHER, 10 ALPHABLEND, 11 ALPHATEST, 12 ANTIALIAS, 13 CULLFACE, **14 NOCULL**, 15 DEPTHTEST, **16 DEPTHMASK**, 18 SPECULAR, 23/24 ALPHAFUNC/ALPHAREF — cross-validé ASM (14=NOCULL, 16=DEPTHMASK) et le mask `0x0385FF7D` dérive bit-à-bit (sans objet : 1,7,17,19–22 = V_TEXTURE/V_UNKNOWN80/V_SHADEMODE/V_LIGHTSTATE/V_FOG/V_TEXADDR/V_UNKNOWN400000).
- Activation FFNx : **usurpation de module** (`eax.dll` FF8 2000/Remastered, `AF3DN.P` Steam 2013) puis écriture directe `current_gfx_driver=2` + `create_gfx_driver=factory` (`src/common.cpp:3706–3712`) — le chemin type 2 natif s'exécute, sans config 36B.

## Provenance live de la copie opérateur

La copie Steam de l'opérateur a **FFNx installé** (`AF3DN.P`, `FFNx.toml` `renderer_backend=4` Direct3D12, `FFNx.pdb` 129 Mo, `shaders/FFNx.*`). La campagne live P0 (driver-provenance.md lots 1–6) a donc analysé le présent de **FFNx via le chemin type 2 natif** — pas le backend vanilla (DDrawAlt/DDraw/GL, non mesuré).

## Crosswalk EAs (mine de sémantisation)

193 EAs FFNx → **166 nouveaux sémantisés** : 161 sites du patch "battle effect layout" (`ff8_opengl.cpp:178–380`), empreintes version identifiant notre binaire **VERSION_FF8_12_US_NV**, 103 sites dans des hôtes déjà couverts (56 dans `GF_Diablo_SummonScript_FrameTick`), **58 hors couverture** — plan de sémantisation zones `0x58Dxxx → 0x6EDxxx` (Gilgamesh VRAM hardcodes, effets runners `sub_62A9C0`/`sub_6328A0`/`sub_6474C0`, global effets `0x2200FB8`, anomalie boundary `0x6C83F5`).

## Slots divergents à trancher au decomp

16, 34, 37, 5, 6 — divergences entre Aali/FFNx et notre binaire, statut « à trancher » (aucune transposée aveuglement).

## Drop-in natif sans factory (lot 12-ter)

Le mécanisme d'**usurpation de module** ci-dessus (FFNx) et le drop test live de 2026-09-25
diffèrent du chemin factory : un drop-in réel de `AF3DN.P` exige des **forwards PE** (dépendance
statique 8 imports `dotemu*` de `FF8_EN.exe`, original exporte 18 noms sans
`new_dll_graphics_driver`) et un **wrap post-init au present dispatch** — la voie launcher-safe
(config 36B / factory type-2) a été documentée (spec §7-1/§7-2) mais n'a pas été le véhicule de
la campagne. Verdict complet : [[projects/re-ff8/references/driver-drop-test-af3dn-2026-09-25]] —
9 650 frames, draw lists 43–64 capturées en mode observation.

## Related

- [[projects/re-ff8/references/driver-drop-test-af3dn-2026-09-25]] — le drop test live lot 12-ter (2026-09-25).
- [[docs/tech/investigation/battle-static-discovery/driver-abi-spec.md|driver-abi-spec]] — la spec ABI (lot 12)
- [[docs/tech/investigation/battle-static-discovery/driver-provenance.md|driver-provenance]] — campagne live P0 (lots 1–6)
- [[projects/re-ff8/concepts/external-battle-renderer-architecture]] — l'architecture cible
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — la matrice driver native
- [[projects/re-ff8/references/decomp-function-catalog]] — index des livrables

## Lot 14 (2026-09-25): native draw slots 43-64 wired


Ctor DDrawAlt 0x4257D0 (decomp committed) wires the draw-list walk fns: obj[0xC0/0xC4/0xC8] = RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4 (0x43E24A, x3) and obj[0xCC] = _VB variant (0x43E356, stride shl 5 = 32 B). Slots 43/44 share setup sub_43DF00; 45/46/47 = sub_43DF2A/43DF54/43DFA6; 52/53 = sub_43DFD0; 57/58/59 = sub_43E5E9; 61/62 = sub_43E220; 63/64 = sub_43E540; 65 = sub_42172A (Alt-only).
Draw-list type -> setup/walk slot binding (driver-abi-spec 6): types 0/8->43/48, 2/10->44/49 (textured 2D), 1/9->52/57 (flat 3D), 3/11->53/58 (textured 3D), 18->61/63 and 19->62/64 (lines), 5/7/13/15 -> setup-only 55, 4/6/12/14/17 -> inline state [ctx+0xB8].
Golden trace (lot 12-ter, 1.98 M lines): slot 29 x845054 (SetRenderState, +0x74), slot 51 x494942 = FVF1C4_VB (real battle workhorse), 47 x237943, 49 x28626, 45 x8236, 44 x20034, lines 63/61 x200 + 64/62 x50, present x9650.
Confidence: HIGH (ctor decomp + golden CSV + spec 6).

