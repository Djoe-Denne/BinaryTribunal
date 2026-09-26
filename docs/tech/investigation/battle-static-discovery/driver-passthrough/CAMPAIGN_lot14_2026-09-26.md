# Lot 14 — Capture texture & PNG (v8/v9) — rapport de campagne 2026-09-26

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

1. **PNG menu texturé** : ❌ → structure OK (rectangles menu/pointeur/HP identifiés par l'opérateur et par vision), pixels = bruit (mapping tpage/clut incorrect — voir §3).
2. **Comparaison côte à côte** : ⚠️ partiel — outil `compare.py` livré et fonctionnel (5 scènes pairées), référence opérateur 800×600 (Steam F12) appariée ; le contenu décodé ne est pas fidèle (critère 2 non atteint).
3. **Parser strict** : ✅ **0 resync, 0 implausible, build-id cohérent** (160→4640 records/fenêtre).
4. **0 AV, 0 WER** : ✅ (9 fenêtres + exit propre).
5. **Perf** : ✅ dédup efficace (1 mirror/frame sauf world 16/16 = textures dynamiques capturées), ring jamais saturé.

## 3. Root cause du FAIL texture (fermée, IDB)

1. **Le CLUT n'est PAS à l'offset miroir supposé** : deux layouts concurrents (A: `mirror[clut<<5]` mots ; B: `2048*(clut>>6)+32*(clut&0x3F)` octets — `sub_45B920`). Le layout A donne une palette plausible en field ; le row sys capturé (v9) = layout B et ressort vide (menu). Le consommateur réel de `dword_1CA89A8` reste à fermer pour trancher (probe IDB manquante).
2. **Le node ne porte pas son tpage/clut** : `texinfo = *(node+0x2C)` = l'objet GfxDrawList236 ; ses champs `+0x14/+0x20` (lus par le footer v9) appartiennent à l'objet texture, PAS au slot-record 0x64 (où vivent `x@+4, y@+8, w@+0xC, h@+0x10, mode@+0x14`). Le backmap list→item exige un scan de la table `unk_1CB6040 + idx*0x44C` (items +0x24..+0x38 = les 6 listes) — faisable dans le DLL (3072 comparaisons sans déréférencement = sûr, ~50 µs).
3. **Deux systèmes texture distincts** : (a) pages texture (SelectTexturePageDrawList → AllocTexturePageSlot → items 0x64 → blits VRAM miroir) = menu/UI/field ; (b) **TIM models** (slot 20 `load_texture 0x420917` → D3D CreateSurface depuis desc `*(a3+128)`) = bataille/personnages. Le système (b) ne passe PAS par le miroir : ses pixels = buffers TIM/D3D — capture v10 requise (wrap du caller slot 20 ou lecture COM — décision architecture).

## 4. Livrables

- **DLL v9** (`AF3DN.P`, 153 088 o, SHA256 `012F8AACC881744A3EEC291D4932D6E0A5EAD0FFDB65AEBBFCB0B4F8CCFA33C6`) : ND08 footer (tpage/mode/clut/ids[]/dropped_ids) + TX07 sys_clut_row[2048] + build-id `0x5639`.
- **Décodeur v2** (`ff8dump.py`/`texture.py`/`selftest.py` 60 checks PASS, `compare.py` side-by-side, `picktpage` annulé).
- **Docs** : `driver-abi-spec.md` §6.2 (closure texture complète), `README.md` §9 (v8) + §10 (v9).
- **Captures** : 9 dumps + logs + hashes (hors git, 152,6 Mo).

## 5. Suite (lot 15 proposé)

1. **v10 writer** : scan item-table au DumpNode (backmap texinfo→item : tpage/x/y/w/h/mode/clut réels) + capture TIM buffer au caller slot 20 (0x419EA5) ou lecture sysmem du D3D texture. Zéro nouveau detour draw : le scan est passif.
2. **Probe IDB** : consommateurs de `dword_1CA89A8` (trancher layout A/B) + layout `sub_4070E2` (objet texture TIM).
3. **Décodeur** : sampling par node exact + rendu multi-pages.
