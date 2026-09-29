# Lot 19 — writer v12, capture live, arbitrage W_window (2026-09-29)

> Exécution du `PROMPT_lot19-writer-v12-composite.md` (commit `4faa4b0`).
> Fermeture definitive de l'arbitrage W=128 vs 256, ouvert depuis le lot 17.

## 1. Writer v12 (build `0x563F`)

Footer ND08 (kind2) : **9 × u32 always-present (36 o)** —
`tpage|mode|clut|id_count|ids|dropped_ids|texobj|window_word|clut_sys_id|ot_z`.

| Champ | Source EA | Note |
|---|---|---|
| `window_word` | `*(ctx+0x28) & 0xFFFFFF` (packet tpage-ish de ParsePolygons @0x50fe20) | SEH, 0 si fail |
| `clut_sys_id` | `clut & 0x7FFF` (clut WORD @ctx+0x448, layout `sub_45B920` @0x45B94A) | bit 15 = flag (voir §3) |
| `ot_z` | z-sort ParsePolygons (`zmin>>ot_shift`, zbias=(i0>>12)-8 @0x50fe9c) | **0 = non branché** (les verts projetés PSX sont consumés avant le draw D3D — pas dans le detour) |

Gate writer-verify : exports 14/14 ✓, fopen `ab` ✓, `563Fh` ×3 stores (ND/TX/TR) ✓,
0 résidu 0x563E ✓, footer +3 u32 vérifié au disasm (compil vectorisé : `[esi+3Ch]/[esi+40h]`
appends, `add esi,44h`) ✓.

**SHA256 v12 : `F85C8E35D26452DB4C91DEFC648130453894FC07FB6ECBC19EB050127B9E5401`** (146 432 o).
Déployée hash après copie = MATCH ✓.

## 2. Capture live (battle_v12)

`tools\_tmp_af3dn_drop\captures\lot19\battle_v12\gfx_passthrough_dump.bin` —
39 101 748 o, SHA256 `71C7FDDB5B01F1295745C73E4EDA805901AA840C9018D5AF2EA9A0F08C4338C3`.

- STRICT : build `0x563F` cohérent, **0 warning, 0 fail, 0 drop, 0 resync**
- 16 frames × 166 records, 16 TX07, 192 TR08
- Screenshot F12 inclus (screenshot_*)

## 3. Verdicts (la donnée tranchée)

1. **`window_word = 0x000000` partout** (toutes familles, 16 frames) → le packet
   fenêtre n'est pas actif à T_draw → **W_effectif = 256** (fallback LUT historique).
   L'hypothèse W=128 (CLOSURE « attendu 128 ») est **réfutée par la donnée**.
   Fermeture complète de l'arbitrage ouvert au lot 17.
2. **`clut_sys_id`** = les vraies bandes système du combat courant :
   `0x0008` (terrain/UI band), `0x63E0`, `0x0000`, **`0x3E58`** (= 0xBE58 & 0x7FFF —
   le bit 15 du WORD ctx+0x448 porte un flag ≠ band). Le mapping record→bande
   système est désormais capturé nativement, plus de déduction.
3. **Nouveaux texobj** (autre combat que battle13) : 056A80/0563E0/055BC0/055790/
   05EDD0 — chaque record porte sa référence palette exacte.
4. `ot_z = 0` (attendu, non branché — voir §4).

## 4. Restant (lot 20)

- **z-sort réel** : ParsePolygons (0x50FDF0, decomp committée) insère via
  `OT_InsertPrimitive(ot_base + (zmin>>ot_shift), pkt, z0+zb...)` avec
  `zmin = MIN(z16 verts projetés)` et `zbias=(i0>>12)-8`. Le detour D3D ne voit
  PAS ces verts projetés → il faudrait capturer le z16 PAR VERTEX dans
  ParseVertices (ou le zmin au moment de l'insertion OT) — v13 ou sonde.
- **Composite final** : le z-order du jeu = OT PSX → le painter order des records
  D3D dumpés n'est PAS le z-order. Sans ot_z, le composite reste 2 couches
  (terrain base + entités overlay non-blk, approximation acceptable).
- **Blend STP** : toujours à tester (382 tris alpha battle13).

## 6. Réserves opérateur sur le replay plein-cadre (29/09 — à corriger lot 20)

Le composite `LOT19_replay.png` (ciel+terrain, entités absentes) a les défauts suivants
validés par l'opérateur :

1. **Ciel triangulaire** : les nuages apparaissent en triangles/losanges mal alignés
   (discontinuités UV aux arêtes de triangles) — signature d'un mauvais layout UV sur
   les tris du ciel (probablement les records texobj 05AF00 (0,256) = la texture ciel
   plaquée avec un layout erroné, comme les lames des entités au lot 16).
2. **Terrain idem** : les losanges du sable sont visibles/désalignés vs la réf (même
   classe de défaut UV, famille terrain).
3. **La montagne manquante** : la réf montre une **falaise gris-blanc entre le ciel et
   le terrain** — absente du DEC (zone noire) : c'est probablement une des 4 textures
   « dynamiques » sans match miroir (055790/055BC0/0563E0/056A80), celle de la falaise.

Le renderer lot17 (Buel + 3 persos, `lot17renderer\battle13_exact_candidate_W256_H256.png`)
reste **correct et validé** — ces réserves touchent le **composite plein écran** (le ciel
et le terrain), pas le chemin entités.

**Hypothèse unificatrice** : les tris du ciel/terrain/montagne utilisent les UV u8
d'origine + un packet window que le dump f32 ne capture pas — le replay f32 « passe
au travers » du window mapping, d'où les discontinuités sur les grandes surfaces
plaquées (les entités, elles, ont des UV petits/intérieurs qui survivent au passage).
La v13 devrait capturer **le window_word réellement consommé** (pas au ctx+0x28 mais
l'adresse exacte du packet @0x45BC65) et le u8 source par primitive si possible.

## 7. Livrables

- `gfx_driver_passthrough.c` v12 (0x563F) + DLL buildée gate PASS + déployée live hash-MATCH
- `ff8dump.py` : `SUPPORTED_REPLAY_BUILDS` +0x563F, parse `window_word|clut_sys_id|ot_z`
- Capture `battle_v12` (STRICT PASS 0x563F, 16 frames × 166 records, screenshots rafale)
- Verdicts : window_word absent (W=256), clut_sys_id mesuré par record
- **Replay Buel fidèle via renderer lot17 généralisé** :
  `battle_v12\lot17renderer\battle13_exact_candidate_W256_H256.png` — le chemin marche
  pour tout combat v12 sans réglage manuel (§6 : réserves sur le composite plein-cadre,
  pas sur le chemin entités)
