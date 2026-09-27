# Lot 15 â€” LUT complet, camÃ©ra, ciel & modÃ¨les battle (v10.3 â†’ v11) â€” rapport 2026-09-26

> ExÃ©cution du `PROMPT_lot15-lut-camera-ciel-modeles.md`. Phase **offline d'abord** (Â§2 du prompt)
> livrÃ©e et commitÃ©e ; phase **live** (Â§3) prÃ©parÃ©e (sonde + protocole), dÃ©clenchÃ©e aprÃ¨s ce commit.

## 1. Verdict phase offline

| # | Diagnostic lot 14 | Verdict | Preuve |
|---|---|---|---|
| 1 | LUT rÃ©siduel (ordre canaux) | **FERMÃ‰ â€” l'ordre actuel `bytes 0,1,2 = R,G,B` est correct** | Canari couleur : effet battle13 ORANGE en (a) RGB vs BLEU en (b) BGR ; rÃ©f = curseur jaune + lot 14 Â« effet orange Â». `battle13/LOT15_effect_AB.png`. La mÃ©trique terrain mean|d| (b BGR 79.0 < a RGB 83.5) est un artefact de framing â€” ne pas l'utiliser. |
| 2 | Cadrage camÃ©ra | **FERMÃ‰ â€” artefact de comparaison** | Coords screen-space finales (bbox 0..640) ; jeu = 640Ã—480 upscalÃ© Ã—1,25 â†’ 800Ã—600. La fenÃªtre armÃ©e = 16 frames strictement identiques (pause) â€” la rÃ©f opÃ©rateur est un AUTRE moment. Protocole : F12 pendant la fenÃªtre armÃ©e + comparaison en 800Ã—600. `battle13/LOT15_upscale_pair.png`. |
| 3 | Ciel/fond absent | **FERMÃ‰ â€” chemin non-wrappÃ© documentÃ© (hypothÃ¨se (c))** | Le fond est composÃ© dans la VRAM Ã©mulÃ©e `0x1B47818` (GP0 0x02 fill `0x4623A0` gardes 640Ã—480, 0x80 MoveImage, sprites 0x64â€“0x7F) â†’ RT1 â†’ prÃ©sentÃ© SANS aucun slot 43â€“64 ; les passes dispatch convergent vers `Gfx_WalkDrawList` (`0x460D26`, `0x460CB6`) donc un poly ciel serait capturÃ©. Clear battle = {0,0,0,1} noir. `CLOSURE_sky-path.md`. |
| 4 | Persos/monstres (`texobj=0` slot 49) | **FERMÃ‰ statiquement â€” sonde live avant codage** | ChaÃ®ne : `node â†’ W=*(node+0x38) â†’ D=*(W+0x14) â†’ M=*(D+0xA0) â†’ E=&(*[M+0x40])[idx*0x48] â†’ texobj=*(E+0x38)` (crÃ©Ã© `call [vt+0x50]` @0x422056, stockÃ© @0x422065). `*(texinfo+0x10)` hors jeu. UNPROVEN live : E+0x38 vs E+0x3C runtime. `CLOSURE_walkdirect-texture-chain.md`. |

## 2. Livrables offline

- **DÃ©codeur** : `render_tim.py` (verdict LUT pinnÃ© en commentaire), `lot15_ab.py` (harnais A/B),
  `_probe_lot15_walkdirect.py` (sonde live, Ã  exÃ©cuter in-battle avant tout codage v11).
- **Rendus battle13** : `LOT15_final_rgb.png` (canonique 640Ã—480, 2833 tris), `LOT15_final_rgb_blend.png`
  (blend 50 % sur 382 tris `8 â‰¤ alpha < 250`), `LOT15_final_rgb_up800.png` (+ `LOT15_upscale_pair.png`,
  `LOT15_blend_pair.png`).
- **Closures IDB** : `CLOSURE_sky-path.md` + `CLOSURE_walkdirect-texture-chain.md` +
  6 decomp (`0x4623A0`, `0x461100`, `0x43E0E2`, `0x407EB4`, `0x4221E6`, `0x421C41`).
- **Spec** : `driver-abi-spec.md` Â§6.3 (Aâ€“D), `README.md` Â§12.

## 3. CritÃ¨res PASS lot 15 â€” Ã©tat

1. **PNG bataille fidÃ¨le (persos+monstre texturÃ©s)** : â³ requiert v11 (footer texobj walk-direct)
   + captures live â€” la chaÃ®ne est fermÃ©e statiquement, la sonde doit confirmer E+0x38/E+0x3C.
2. **Ciel rendu OU fermÃ© documentÃ© avec EA d'entrÃ©e** : âœ… fermÃ© (chemin non-wrappÃ©, EA `0x4623A0`
   & famille ; piste capture future = dump buffer `0x1B47818`).
3. **Parser strict** : âœ… battle13/battle14 (0x563D) 0 resync ; LUT inchangÃ©e.
4. **0 AV / 0 WER** : âœ… phase offline (aucun run).

## 4. Phase live â€” exÃ©cutÃ©e 26-27/09 (Ã©tapes 1-2) + pivot v11

1. **Ã‰tape 1 PASS** : v10.3 dÃ©ployÃ©e (hash `66F65282â€¦` âœ“), boot watcher-armÃ© pid 23184,
   trigger 16 frames en pause, dump `captures/lot15/battle_probe/gfx_passthrough_dump.bin`
   (38 852 064 B, SHA256 `9993D34BD8BF2DE629B3C30A125225A6D2139F9698FED23C7F3F60F0795300D6`),
   STRICT PASS (0 resync, build 0x563D, 2384 records). Screenshot F12 manquÃ© (fenÃªtre trop
   courte vs dance GO/ARMED â€” Ã  refaire en rafale Ã  l'Ã©tape 3).
2. **Ã‰tape 2 (sonde)** : v1 UNPROVEN (`*(node+0x38)` = petits entiers) â†’ **correction
   d'Ã©tiquetage IDB** : la chaÃ®ne part de `ctx` (arg_0), le node est `arg_4` (voir
   CLOSURE Â§10). Sonde v2 : gate `*(ctx+0x30)=1` âœ“, `W=ctx+0x90` âœ“, `*(W+0x14)=0`
   post-hoc â†’ **transitoire** (preuve croisÃ©e : `texinfo+0x10` Ã©crasÃ© par le rendu pause,
   mÃªme texinfo statique `0x1A5228CC` sur deux sessions Ã  ctx diffÃ©rents).
3. **Verdict** : la valeur Ã  T_draw est inobservable post-hoc â€” la capture in-detour v11
   EST la sonde. Design final (CLOSURE Â§10) : footer ND08 + `u32 texobj_wd` + `u32 T_wd`
   (chaÃ®ne `*(ctx+0x38) â†’ +0x14 â†’ +152`, tous EA-prouvÃ©s, mÃªme espace de valeurs que les
   clÃ©s TR08), build-id `0x563E`. Ã‰tape 3 soumise Ã  l'opÃ©rateur.

## 5. Étape 3 live (27/09) — v11 déployée, hypothèse réfutée proprement, architecture fermée

- v11 (`292D40CD…A1978`, build `0x563E`) : gate PASS (exports 14/14, fopen binaire, gardes,
  branche vérifiée au disasm ; harnais dévié, layout inchangé). Capture `battle_v11` :
  STRICT PASS 0x563E, 2 576 records, 16 frames, hash `A2082F5E…7065C`.
- **Résultat** : 48/48 records slot 49 texobj=0 à T_draw — la chaîne matdesc est vide au
  draw. COMBINÉ à l'IDB : l'impl réel des slot 48/49/50 = `RenderDDrawAlt_
  DrawIndexedPrimitive_FVF1C4` @0x43E24A (ctor +0xC0/+0xC4/+0xC8) — **aucun bind, aucun
  accès matdesc** (sub_43E0E2 = slot 55, étiquette antérieure décalée). `matdesc+0x14`
  est structurellement mort côté Alt pour les ctx directs ; les draws directs héritent de
  l'état device (CLOSURE_walkdirect-bind.md).
- **Réfutations offline** (sans nouvelle capture) : héritage painter-order (dernier T VB)
  ? monstre var=0, réfuté ; footer tpage/mode/clut des directs = champs par défaut
  (texinfo direct ne les peuple pas).
- **DÉCOUVERTE CLÉ (planche VRAM `LOT15_vram_pages.png`)** : le miroir TX07 contient TOUT
  — tpages 10-12 visages persos, 13 monstre, 14-15 atlas sprites, **16-17 ciel nuageux**,
  18-20 rochers, 27-29 effets, 30 flammes. Les textures manquantes sont CAPTURÉES ; il ne
  manque que le mapping (tpage, clut) par record slot-49 — **résoluble offline** (recherche
  bornée 32 pages × palettes miroir, scoring cohérence), sans nouvelle fenêtre live.

### État critères PASS lot 15
1. Persos+monstre texturés : architecture fermée, mapping offline restant (v12 décodeur).
2. Ciel : fermé (chemin non-wrappé EA `0x4623A0`) + texture ciel présente au miroir (16-17).
3. Parser strict : ? v11 0x563E, 0 resync.
4. 0 AV / 0 WER : ? (2 sessions live, exits propres).

## 6. Revue visuelle finale (27/09, honnête — remplace les lectures optimistes)

Composite `battle13/LOT15_composite.png` (terrain + records slot-49) vs réf opérateur :

| Élément | Verdict factuel |
| --- | --- |
| Terrain | ? texturé, angles quasi superposables (moments proches) |
| Monstre | ?? FRAGMENT seul : 1 grande ovale dorée plate bas-gauche (position ˜ 1 partie du monstre) + 3 petits ovales centraux **sans correspondance** dans la réf ; le corps détaillé de la réf (écailles, ailes nervurées) est absent du rendu |
| « Barres de HP » | ? interprétation retirée : 2 bandes rayées multicolores à une position évoquant les HP bars, mais contenu = bruit (recherche auto par variance, pas la vraie palette) |
| « Curseur » | ? interprétation retirée : petit losange multicolore sans correspondance claire |
| 3 personnages | ? absents du rendu, nulle part |

**Leçons** : (1) la recherche auto (tpage, clut) par variance/« doré » trouve des palettes
plausibles mais NON identifiables — sans `ids` par groupe ni ancre visuelle fiable, le
scoring seul ne prouve rien ; (2) la complétude de la GÉOMÉTRIE capturée est en question
(le corps du monstre et les persos n'apparaissent pas — soit absents des records, soit non
identifiés parmi les 108 VB/frame) ; (3) prochain lot = AUDIT DE COMPLÉTUDE offline
(inventaire exhaustif des triangles de la frame vs réf) AVANT tout nouveau codage writer.
