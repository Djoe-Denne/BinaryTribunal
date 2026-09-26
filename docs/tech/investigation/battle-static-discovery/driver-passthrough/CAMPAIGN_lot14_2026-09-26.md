# Lot 14 — Capture texture & PNG (v8→v10.3) — rapport de campagne 2026-09-26

> **Résultat final** : chaîne texture TIM **fermée et prouvée en rendu** — le terrain de bataille
> se décode en **vraie texture** (roche gris-bleu, perspective correcte, effet orange avec sa palette).
> Le lot 14 passe le maillon « pixels » : le backend graphique moderne (Étape B) a sa source de pixels.

## 0. Verdict final (opérateur : « vrai progrès »)

- ✅ **Terrain de bataille texturé fidèlement** (TR08 : pixels 256×256 + palette u32 + sous-palette par `ids[g]`).
- ✅ Géométrie byte-exacte (héritage v7), positions/silhouettes parfaites.
- ⚠️ LUT partiel (certaines palettes miroir restent alpha-stagées) + cadrage caméra à caler — **non bloquant** pour Étape B.

## 1. Exécution

| Fenêtre | Trigger | Dump | SHA256 (16 hex) | STRICT | Records | Tris | CLUT(s) | Mirrors uniques |
|---|---|---|---|---|---|---|---|---|
| menu | 13:50:50 | 16 848 448 B | C28EAF6EBA317617 | PASS | 160 | 864 | 0x0000 | 1/16 |
| field | 13:55:58 | 21 614 640 B | B3DB02016BB2D292 | PASS | 1680 | 61 057 | 0x3D80 | 1/16 |
| world | 13:57:13 | 19 401 024 B | 74A121CABC15CD0B | PASS | 1056 | 26 192 | 0x383C | **16/16 (dynamique)** |
| battle | 13:59:01 | 20 826 756 B | D5B299B66949ABB2 | PASS | 2223 | 42 621 | 0x3980+0x39C0 | 1/16 |
| fireaga (cast) | 14:00:52 | 18 331 328 B | 7E6671FF920B12AD | PASS | 1264 | 17 408 | 0x3B40 | 1/16 |
| fireaga2 | 14:01:54 | 18 330 768 B | 57EB42686679A37F | PASS | 1264 | 17 400 | 0x3B40 | 1/16 |
| fireaga3 (explosion) | 14:03:02 | 22 350 308 B | C9C82ADCFDC1E77C | PASS | 4640 | 57 094 | 0x3FD4 | 1/16 |
| fireaga4 (safety) | 14:04 | 22 350 028 B | 9957E8AA342F89D0 | PASS | 4640 | 57 090 | 0x3FD4 | 1/16 |
| done (clôture) | 14:0x | 19 513 856 B | 01A1A74F1D90E857 | PASS | 1104 | 27 296 | — | — |

Total : 152,6 Mo / 9 fenêtres × 16 frames / **0 resync, 0 implausible, 0 SEH fail, 0 ring drop, build-id `0x5638`→`0x5639` cohérent à 100 %**.

## 2. Verdict critères PASS (prompt §3)

1. **PNG texturé** : ✅ **terrain de bataille en VRAIE texture** (roche gris-bleu fidèle, perspective, dithering PSX — `battle13\FINAL_tim.png`) ; LUT partiel sur certaines palettes (résidu lot 15).
2. **Comparaison côte à côte** : ✅ outil `compare.py` + paires produites pour 6 scènes ; le terrain/silhouettes/HP/menu correspondent ; le cadrage caméra reste à caler (résidu).
3. **Parser strict** : ✅ **0 resync, 0 implausible, build-id cohérent** (160→4640 records/fenêtre, toutes versions v8→v10.3).
4. **0 AV, 0 WER** : ✅ (toutes fenêtres + exits propres, 5 redéploiements hash-bound).
5. **Perf** : ✅ dédup efficace (1 mirror/frame sauf world 16/16 = textures dynamiques ; TR08 11/frame battle), ring jamais saturé.

## 3. Root cause texture (FERMÉE en v10.3 — preuve par le rendu)

1. **Le miroir VRAM n'est PAS la source des palettes TIM** : ses rows palette sont alpha-stagées par `TexStaging_BlitCLUTAlpha` (RGB écrasé par `a<<12`). Les **vraies couleurs** = le CLUT brut du texture objet (`T+0x60`, u32/couleur, byte3 = STP) — capturé par TR08.
2. **La chaîne node→texture fermée** (live + `sub_407EB4`/`sub_421C41`) : `ctx+0x3C ? ctx+0x68 : ctx+0x38` → backend → `*(backend+20)` = v11 → `*(v11+152)` = T ; w/h@T+0x3C/+0x40, entries@+0x5C, clutBuf@+0x60, pixels@+0xD8, palMgr = *(v11+0xA0). Sous-palette par groupe = `raw_clut + 4*entries*ids[g]`.
3. **Deux systèmes texture distincts** : (a) pages texture (SelectTexturePageDrawList → AllocTexturePageSlot → items 0x64 → blits VRAM miroir) = menu/UI/field ; (b) **TIM models** (slot 20 → l'objet T) = bataille/personnages. Les deux capturés (TX07 miroir + TR08 TIM).

## 4. Livrables

- **DLL v10.3** (`AF3DN.P`, 153 600 o, SHA256 `66F65282F0B118FC21BF6B4441910E4FC5C19AE2666ECE1A8DDF8B9AB06309F0`) : TX07 (miroir VRAM + sys CLUT row), TR08 (pixels TIM + CLUT brut u32), ND08 (footer tpage/mode/clut/ids[]/dropped_ids/**texobj=T**), build-id `0x563D` dans chaque record.
- **Décodeur v2+** (`ff8dump.py`/`texture.py`/`selftest.py` PASS, `compare.py`, `render_tim.py` = le rendu TIM final).
- **Docs** : `driver-abi-spec.md` §6.2 (closure texture), `README.md` §9/§10/§11.
- **Captures** : 13 dumps + logs + hashes (hors git, ~250 Mo) ; la chaîne complète menu→field→world→battle→fireaga (cast+explosion).

## 5. Suite (lot 15 proposé)

1. ~~v10 writer : scan item-table + TR08~~ **FAIT (v10.3)** — la chaîne TIM fermée :
   `ctx+0x3C ? ctx+0x68 : ctx+0x38` → backend → `*(backend+20)` = v11 → `*(v11+152)` = T
   (w@+0x3C, h@+0x40, entries@+0x5C, clutBuf@+0x60 u32/couleur, pixels@+0xD8 1 o/texel,
   palMgr = *(v11+0xA0), palCount = *(palMgr+12)) ; footer ND08.texobj = T ; 11/11 texobjs
   résolus, 176/176 TR08 avec CLUT.
2. **Rendu final battle13** : terrain rocheux en VRAIE texture (losanges alignés, perspective
   correcte, dithering PSX) + effet orange (palette TIM). Preuve : `battle13\FINAL_tim.png` /
   `FINAL_side_by_side.png` vs capture opérateur 16:06:22.
3. **Restes lot 15** : LUT partiel (palettes miroir alpha-stagées par BlitCLUTAlpha — les vraies
   couleurs TIM viennent du TR08, mais certaines palettes restent fausses) ; cadrage caméra
   (framing du rendu offline vs la vue in-game) ; ciel/fond non wrappés (chemins non-43–64) ;
   personnages parfois skippés par le filtre alpha<8 (semi-transparence d'attaque).
