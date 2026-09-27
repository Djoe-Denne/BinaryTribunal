---
title: "[LOT 15] AF3DN.P v10.3→v11 — LUT closes camera, sky-path unwrapped, walk-direct device-inherit bind (2026-09-27)"
category: references
tags: [ff8, rendering, reverse-engineering, reference]
aliases: [lot 15 af3dn, v11 passthrough, LUT complet, closure sky path, walk-direct bind, miroir tpages]
sources:
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CAMPAIGN_lot15_2026-09-26.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CLOSURE_sky-path.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CLOSURE_walkdirect-bind.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CLOSURE_walkdirect-texture-chain.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/CLOSURE_walkdirect-cookie-chain.md
  - docs/tech/investigation/battle-static-discovery/driver-abi-spec.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/README.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/PROMPT_lot15-lut-camera-ciel-modeles.md
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/gfx_driver_passthrough.c
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/AF3DN.P
  - docs/tech/investigation/battle-static-discovery/driver-passthrough/gfx_driver_passthrough.dll
  - tools/_tmp_af3dn_drop/captures/lot15/battle_probe/gfx_passthrough_dump.bin
  - tools/_tmp_af3dn_drop/captures/lot15/battle_probe/gfx_passthrough_dump.log
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/gfx_passthrough_dump.bin
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/gfx_passthrough_dump.log
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/ref_20260927100336_1.jpg
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT15_effect_AB.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT15_upscale_pair.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT15_final_rgb.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT15_final_rgb_blend.png
  - tools/_tmp_af3dn_drop/captures/lot14/battle13/LOT15_composite.png
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/LOT15_vram_pages.png
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/LOT15_paintercorr.png
  - tools/_tmp_af3dn_drop/captures/lot15/battle_v11/LOT15_mirror_render.png
summary: >-
  Lot 15 : v10.3 ferme LUT (R,G,B), camera (x1.25) et ciel (non-wrappe,
  EA 0x4623A0) ; v11 (0x563E) refute le bind walk-direct (48/48 texobj=0,
  heritage device @0x43E24A) ; miroir TX07 contient tout, reste mapping.
provenance:
  extracted: 0.93
  inferred: 0.05
  ambiguous: 0.02
created: 2026-09-27T11:30:00+02:00
updated: 2026-09-27T11:30:00+02:00
---

# [LOT 15] AF3DN.P v10.3→v11 — LUT closes camera, sky-path unwrapped, walk-direct device-inherit bind (2026-09-27)

> Distilled mirror for the vault. Primary sources: `CAMPAIGN_lot15_2026-09-26.md`
> (§5 step-3 live and §6 honest visual review), `CLOSURE_sky-path.md`,
> `CLOSURE_walkdirect-texture-chain.md`, `CLOSURE_walkdirect-cookie-chain.md`,
> `CLOSURE_walkdirect-bind.md`, `driver-abi-spec.md` §6.3, `README.md` §12.
> This page cites the EA and the deliverable, does not duplicate them —
> deliverables remain in the implementation repo (see the catalog page for
> hash-bound copies: [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot15]]).

## 1. Verdicts ^[extracted]

| Diagnostic lot 14 residual | Verdict | Proof |
|---|---|---|
| LUT residual (channel order) | **CLOSED** — `bytes 0,1,2 = R,G,B` correct (u32 LE = `STP<<24 │ B<<16 │ G<<8 │ R`) | canari couleur: effet battle13 ORANGE en (a) RGB vs BLEU en (b) BGR; réf = curseur jaune + « effet orange » lot 14. `lot14/battle13/LOT15_effect_AB.png`. La métrique terrain mean\|d\| (b BGR 79.0 < a RGB 83.5) est un artefact de framing — ne pas l'utiliser. |
| Cadrage caméra | **CLOSED** — artefact de comparaison | coords FVF déjà screen-space final (bbox 0..640); jeu rend 640×480 upscalé ×1.25 → 800×600 (Steam). La fenêtre armée = 16 frames strictement identiques (pause); la réf opérateur était un AUTRE moment. Protocole: screenshot F12 PENDANT la fenêtre armée + comparaison en 800×600. `lot14/battle13/LOT15_upscale_pair.png`. |
| Ciel / fond absent des slots 43–64 | **CLOSED** — chemin NON-wrappé (hypothèse (c), EA `0x4623A0`) | fond composé dans la VRAM émulée `0x1B47818` (GP0 `0x02` fill `0x4623A0` gardes 640×480, `0x80` MoveImage, sprites `0x64–0x7F`) → RT1 → présenté SANS AUCUN slot 43–64; les passes dispatch convergent vers `Gfx_WalkDrawList` (`0x460D26`, `0x460CB6`) donc un poly ciel passerait par les records. Clear battle = vec4 {0,0,0,1} NOIR (`0x47CF8D..0x47CFA5`). |
| Persos/monstre `texobj=0` slot 49 | **Fermé statiquement puis réfuté live proprement** (arch. + impl réel) | chaîne statique `node → W=*(node+0x38) → D=*(W+0x14) → M=*(D+0xA0) → E=&(*[M+0x40])[idx*0x48] → texobj=*(E+0x38)` est fermée IDB, mais le bind réel des slot 48/49/50 = `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` **`0x43E24A`** hérite de l'état device (§3). |

## 2. Cadres live ^[extracted]

| étape | build (déployé) | pid | dump | SHA256 | verdict parser |
|---|---|---|---|---|---|
| 1 — probe battle | **v10.3 `0x563D`, DLL `66F65282…06309F0`** | 23184 | `lot15/battle_probe/gfx_passthrough_dump.bin` (38 852 064 o) | `9993D34BD8BF2DE629B3C30A125225A6D2139F9698FED23C7F3F60F0795300D6` | STRICT PASS 0x563D, 2 384 records, 16 frames, 0 resync |
| 3 — v11 in-detour | **v11 `0x563E`, DLL `292D40CD…2B3260`→`A1978`** | — | `lot15/battle_v11/gfx_passthrough_dump.bin` (38 973 876 o) | `A2082F5E4AE41C15DD26AE70F1147A006EDA9392B48BE43482ADAA095867065C` | STRICT PASS 0x563E, 2 576 records, 16 frames, 0 resync |

- **Gate v11 PASS** : exports 14/14, `fopen` mode binaire, gardes sentinelles
  vérifiées au disasm ; harnais dévié, layout du dump inchangé.
- **Étape 2 (sonde)** : v1 UNPROVEN → correction d'étiquetage IDB (chaîne part
  de `ctx`, node = `arg_4`, « CLOSURE §10 ») ; sonde v2 : gate `*(ctx+0x30)=1` ✓,
  `W=ctx+0x90` ✓, mais `*(W+0x14)` lu POST-hoc = 0 — **transitoire** (l'upload
  pause écrase `texinfo+0x10`, le texinfo static `0x1A5228CC` identique sur
  sessions différentes). Verdict : la valeur à T_draw est **inobservable
  post-hoc** ; la capture in-detour v11 EST la sonde (design final : footer
  ND08 + `u32 texobj_wd` + `u32 T_wd` au même espace de valeurs que TR08).

## 3. Verdict live v11 — bind des draws walk-direct ^[extracted]

- **48/48 records slot 49 `texobj=0` à T_draw** ; la chaîne matdesc est vide au
  draw. Le champ `*(matdesc+0x14)` est **structurellement mort** côté Alt pour
  les ctx directs (Q1 : aucun writer prouvé dans le chemin DDrawAlt, scan
  bytes `C7 4x 14` / `89 4x/5x 14` sur 0x401000..0x447000 sans site matdesc).
- **Impl réel des slots 48/49/50 = `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4`
  @0x43E24A** (3 copies aux slots driver +0xC0/+0xC4/+0xC8) : aucun bind, aucun
  accès matdesc ; `sub_43E0E2` = **slot 55** (étiquette antérieure décalée).
- **Les draws directs héritent de l'état device** posé au setup par la chaîne
  slot-25 (`sub_4365FF` → `sub_41ED69` → `sub_42022C` upload / `sub_41EF3C`
  `call [device+0x98]` SetTexture) s'exécutant au setup des nœuds précédents
  (slot 47 `0x43DFA6` / 46 `0x43DF54` via `sub_407EB4(idx, matdesc)`).
- **Réfutations offline** (sans nouvelle capture) : héritage painter-order
  (dernier T VB du setup, var=0 côté monstre) réfuté ; footer
  tpage/mode/clut des directs = champs par défaut (le texinfo direct ne les
  peuple pas).
- **Recommandation capture v12** (CLOSURE_walkdirect-bind §5) : au détour
  `DrawIndexedPrimitive` (`0x43E308/0x43E4ED/0x43E59B`), capturer le texobj
  device = dernier arg de `[deviceVT+0x98]` (hook SetTexture, pas le champ
  matdesc) + `*(*(node+0x2C)+0x14)` (unique clé texture-side lue, gate
  UV-bias `0x43E290`).

## 4. DÉCOUVERTE CLÉ — planche VRAM miroir ^[extracted]

`LOT15_vram_pages.png` (miroir TX07) : **TOUTES les textures manquantes sont
capturées** — tpages 10-12 visages persos, 13 monstre, 14-15 atlas sprites,
**16-17 ciel nuageux**, 18-20 rochers, 27-29 effets, 30 flammes. Il ne manque
que le **mapping (tpage, clut) par record slot-49**, « résoluble offline »
(recherche bornée 32 pages × palettes miroir, scoring cohérence) — MAIS cf. §5 :
le scoring seul ne prouve rien sans `ids` par groupe ni ancre visuelle.

## 5. Revue visuelle finale (§6, honnête) ^[extracted]

Composite `lot14/battle13/LOT15_composite.png` (terrain + records slot-49) vs
réf opérateur `ref_20260927100336_1.jpg` :

| élément | verdict factuel |
|---|---|
| Terrain | ✓ texturé, angles quasi superposables (moments proches) |
| Monstre | fragment seul : 1 grande ovale dorée plate bas-gauche + 3 petits ovales centraux **sans correspondance** dans la réf ; le corps détaillé (écailles, ailes nervurées) est absent du rendu |
| Barres de HP | interprétation **retirée** : 2 bandes multicolores à une position évoquant les HP, mais contenu = bruit (recherche auto par variance, pas la vraie palette) |
| Curseur | interprétation **retirée** : losange multicolore sans correspondance claire |
| 3 personnages | **absents du rendu**, nulle part |

**Leçons** : (1) la recherche auto (tpage, clut) par variance/« doré » trouve
des palettes plausibles mais NON identifiables — sans `ids` par groupe ni ancre
visuelle fiable, le scoring seul ne prouve rien ; (2) la complétude de la
GÉOMÉTRIE capturée est en question (corps du monstre + persos absents ou non
identifiés parmi les ~108 VB/frame) ; (3) **prochain lot = AUDIT DE
COMPLÉTUDE offline** (inventaire exhaustif des triangles de la frame vs réf)
AVANT tout nouveau codage writer.

## 6. Statut critères PASS lot 15 ^[extracted]

1. **Persos + monstre texturés** : architecture fermée, mapping offline restant (v12 décodeur).
2. **Ciel** : FERMÉ (chemin non-wrappé EA `0x4623A0`) + texture ciel présente au miroir (tpages 16-17).
3. **Parser strict** : ✓ v11 `0x563E`, 0 resync.
4. **0 AV / 0 WER** : ✓ (2 sessions live, exits propres).

## 7. Ce que ce lot ne fait pas / reste pour v12

- **Audit de complétude géométrie** : inventaire exhaustif des triangles par
  frame vs réf avant tout codage (comment un record slot-49 manque-t-il de
  corps de monstre/persos lors des 108 VB/frame ?).
- **Mapping tpage/clut par record slot-49** : résoluble offline mais exige des
  anchorsrq plus fiables que le scoring.
- **Blit final RT1→RT0** (CLOSURE_sky-path §5) : l'EA exacte n'est pas isolée —
  angle mort principal pour l'export du fond noir de capture.
- Le present réel passe par slot 4 → AF3DN.P `0x5F7B1BF0` (§9 abi-spec), inchangé.

## Related

- [[projects/re-ff8/references/af3dn-captures-evidence-catalog-lot15]] — les
  preuves binaires hash-bound de ce lot.
- [[projects/re-ff8/references/driver-drop-test-af3dn-v10-2026-09-26]] — le lot
  14 dont ce lot ferme les résidus (LUT/cadrage/ciel/texobj=0).
- [[projects/re-ff8/concepts/battle-backend-roadmap]] — la planche de suivi
  proposition par proposition.
- [[projects/re-ff8/references/battle-render-pipeline-entrypoints]] — la chaîne
  frame consommée par les captures hash-bound.
- [[projects/re-ff8/references/battle-model-tools-and-format]] — le pont
  asset→runtime ; s2 geometry vs 108 VB/frame (audit complétude v12).
