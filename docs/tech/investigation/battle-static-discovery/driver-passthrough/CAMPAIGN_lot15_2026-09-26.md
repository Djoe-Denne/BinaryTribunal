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

## 4. Phase live — exécutée 26-27/09 (étapes 1-2) + pivot v11

1. **Étape 1 PASS** : v10.3 déployée (hash `66F65282…` ✓), boot watcher-armé pid 23184,
   trigger 16 frames en pause, dump `captures/lot15/battle_probe/gfx_passthrough_dump.bin`
   (38 852 064 B, SHA256 `9993D34BD8BF2DE629B3C30A125225A6D2139F9698FED23C7F3F60F0795300D6`),
   STRICT PASS (0 resync, build 0x563D, 2384 records). Screenshot F12 manqué (fenêtre trop
   courte vs dance GO/ARMED — à refaire en rafale à l'étape 3).
2. **Étape 2 (sonde)** : v1 UNPROVEN (`*(node+0x38)` = petits entiers) → **correction
   d'étiquetage IDB** : la chaîne part de `ctx` (arg_0), le node est `arg_4` (voir
   CLOSURE §10). Sonde v2 : gate `*(ctx+0x30)=1` ✓, `W=ctx+0x90` ✓, `*(W+0x14)=0`
   post-hoc → **transitoire** (preuve croisée : `texinfo+0x10` écrasé par le rendu pause,
   même texinfo statique `0x1A5228CC` sur deux sessions à ctx différents).
3. **Verdict** : la valeur à T_draw est inobservable post-hoc — la capture in-detour v11
   EST la sonde. Design final (CLOSURE §10) : footer ND08 + `u32 texobj_wd` + `u32 T_wd`
   (chaîne `*(ctx+0x38) → +0x14 → +152`, tous EA-prouvés, même espace de valeurs que les
   clés TR08), build-id `0x563E`. Étape 3 soumise à l'opérateur.

## 5. �tape 3 live (27/09) � v11 d�ploy�e, hypoth�se r�fut�e proprement, architecture ferm�e

- v11 (`292D40CD�A1978`, build `0x563E`) : gate PASS (exports 14/14, fopen binaire, gardes,
  branche v�rifi�e au disasm ; harnais d�vi�, layout inchang�). Capture `battle_v11` :
  STRICT PASS 0x563E, 2 576 records, 16 frames, hash `A2082F5E�7065C`.
- **R�sultat** : 48/48 records slot 49 texobj=0 � T_draw � la cha�ne matdesc est vide au
  draw. COMBIN� � l'IDB : l'impl r�el des slot 48/49/50 = `RenderDDrawAlt_
  DrawIndexedPrimitive_FVF1C4` @0x43E24A (ctor +0xC0/+0xC4/+0xC8) � **aucun bind, aucun
  acc�s matdesc** (sub_43E0E2 = slot 55, �tiquette ant�rieure d�cal�e). `matdesc+0x14`
  est structurellement mort c�t� Alt pour les ctx directs ; les draws directs h�ritent de
  l'�tat device (CLOSURE_walkdirect-bind.md).
- **R�futations offline** (sans nouvelle capture) : h�ritage painter-order (dernier T VB)
  ? monstre var=0, r�fut� ; footer tpage/mode/clut des directs = champs par d�faut
  (texinfo direct ne les peuple pas).
- **D�COUVERTE CL� (planche VRAM `LOT15_vram_pages.png`)** : le miroir TX07 contient TOUT
  � tpages 10-12 visages persos, 13 monstre, 14-15 atlas sprites, **16-17 ciel nuageux**,
  18-20 rochers, 27-29 effets, 30 flammes. Les textures manquantes sont CAPTUR�ES ; il ne
  manque que le mapping (tpage, clut) par record slot-49 � **r�soluble offline** (recherche
  born�e 32 pages � palettes miroir, scoring coh�rence), sans nouvelle fen�tre live.

### �tat crit�res PASS lot 15
1. Persos+monstre textur�s : architecture ferm�e, mapping offline restant (v12 d�codeur).
2. Ciel : ferm� (chemin non-wrapp� EA `0x4623A0`) + texture ciel pr�sente au miroir (16-17).
3. Parser strict : ? v11 0x563E, 0 resync.
4. 0 AV / 0 WER : ? (2 sessions live, exits propres).
