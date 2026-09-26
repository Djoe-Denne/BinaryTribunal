# Lot 15 — LUT complet, caméra, ciel & modèles battle (v10.3 → v11) — rapport 2026-09-26

> Exécution du `PROMPT_lot15-lut-camera-ciel-modeles.md`. Phase **offline d'abord** (§2 du prompt)
> livrée et commitée ; phase **live** (§3) préparée (sonde + protocole), déclenchée après ce commit.

## 1. Verdict phase offline

| # | Diagnostic lot 14 | Verdict | Preuve |
|---|---|---|---|
| 1 | LUT résiduel (ordre canaux) | **FERMÉ — l'ordre actuel `bytes 0,1,2 = R,G,B` est correct** | Canari couleur : effet battle13 ORANGE en (a) RGB vs BLEU en (b) BGR ; réf = curseur jaune + lot 14 « effet orange ». `battle13/LOT15_effect_AB.png`. La métrique terrain mean|d| (b BGR 79.0 < a RGB 83.5) est un artefact de framing — ne pas l'utiliser. |
| 2 | Cadrage caméra | **FERMÉ — artefact de comparaison** | Coords screen-space finales (bbox 0..640) ; jeu = 640×480 upscalé ×1,25 → 800×600. La fenêtre armée = 16 frames strictement identiques (pause) — la réf opérateur est un AUTRE moment. Protocole : F12 pendant la fenêtre armée + comparaison en 800×600. `battle13/LOT15_upscale_pair.png`. |
| 3 | Ciel/fond absent | **FERMÉ — chemin non-wrappé documenté (hypothèse (c))** | Le fond est composé dans la VRAM émulée `0x1B47818` (GP0 0x02 fill `0x4623A0` gardes 640×480, 0x80 MoveImage, sprites 0x64–0x7F) → RT1 → présenté SANS aucun slot 43–64 ; les passes dispatch convergent vers `Gfx_WalkDrawList` (`0x460D26`, `0x460CB6`) donc un poly ciel serait capturé. Clear battle = {0,0,0,1} noir. `CLOSURE_sky-path.md`. |
| 4 | Persos/monstres (`texobj=0` slot 49) | **FERMÉ statiquement — sonde live avant codage** | Chaîne : `node → W=*(node+0x38) → D=*(W+0x14) → M=*(D+0xA0) → E=&(*[M+0x40])[idx*0x48] → texobj=*(E+0x38)` (créé `call [vt+0x50]` @0x422056, stocké @0x422065). `*(texinfo+0x10)` hors jeu. UNPROVEN live : E+0x38 vs E+0x3C runtime. `CLOSURE_walkdirect-texture-chain.md`. |

## 2. Livrables offline

- **Décodeur** : `render_tim.py` (verdict LUT pinné en commentaire), `lot15_ab.py` (harnais A/B),
  `_probe_lot15_walkdirect.py` (sonde live, à exécuter in-battle avant tout codage v11).
- **Rendus battle13** : `LOT15_final_rgb.png` (canonique 640×480, 2833 tris), `LOT15_final_rgb_blend.png`
  (blend 50 % sur 382 tris `8 ≤ alpha < 250`), `LOT15_final_rgb_up800.png` (+ `LOT15_upscale_pair.png`,
  `LOT15_blend_pair.png`).
- **Closures IDB** : `CLOSURE_sky-path.md` + `CLOSURE_walkdirect-texture-chain.md` +
  6 decomp (`0x4623A0`, `0x461100`, `0x43E0E2`, `0x407EB4`, `0x4221E6`, `0x421C41`).
- **Spec** : `driver-abi-spec.md` §6.3 (A–D), `README.md` §12.

## 3. Critères PASS lot 15 — état

1. **PNG bataille fidèle (persos+monstre texturés)** : ⏳ requiert v11 (footer texobj walk-direct)
   + captures live — la chaîne est fermée statiquement, la sonde doit confirmer E+0x38/E+0x3C.
2. **Ciel rendu OU fermé documenté avec EA d'entrée** : ✅ fermé (chemin non-wrappé, EA `0x4623A0`
   & famille ; piste capture future = dump buffer `0x1B47818`).
3. **Parser strict** : ✅ battle13/battle14 (0x563D) 0 resync ; LUT inchangée.
4. **0 AV / 0 WER** : ✅ phase offline (aucun run).

## 4. Phase live — protocole (à venir)

1. Déployer v10.3, boot, entrer en bataille, **pause**, trigger dump (16 frames).
2. Exécuter `_probe_lot15_walkdirect.py <dump.bin>` **pendant** la bataille → verdict E+0x38/E+0x3C.
3. Si sonde OK : v11 = footer ND08 + `u32 texobj_wd` (valeur candidate, SEH-guard, 0 si fail),
   build-id `0x563E` ; gate `ff8-dump-writer-verify` ; captures bataille idle (+ fireaga pour le
   blend, field/world si piste ciel-pages) ; screenshot F12 PENDANT les fenêtres armées.
4. Décodeur v3 : mapping `slot49.texobj_wd ↔ TR08` + rendu persos/monstre.
5. Rapport PASS/FAIL + ingest evidence + wiki `BattleTextures.md`.
