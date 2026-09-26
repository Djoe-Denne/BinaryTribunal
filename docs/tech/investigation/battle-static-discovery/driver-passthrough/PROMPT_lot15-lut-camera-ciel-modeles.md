# PROMPT — Lot 15 : LUT complet, caméra, ciel & modèles battle (v10.3 → v11)

> Suite directe du lot 14 (`CAMPAIGN_lot14_2026-09-26.md`, commits `791c053`/`63f8078`/`6303e8b`).
> Le lot 14 a fermé le maillon « pixels » : **le terrain de bataille se décode en vraie texture**
> (TR08 : pixels TIM 256×256 + CLUT brut u32 + sous-palette par `ids[g]`), l'infrastructure de
> capture est rodée (13 fenêtres STRICT PASS, 5 builds hash-bound). Lot 15 = finir la fidélité
> (LUT résiduel, cadrage caméra, ciel) et ouvrir le **chemin des modèles battle** (persos/monstres).

## 0. Établi (NE PAS refaire)

- **v10.3 déployée et prouvée** (`66F65282…`, build-id `0x563D`) : ND07/ND08 (footer `tpage/mode/clut/ids[]/dropped_ids/texobj`), TX07 (miroir VRAM 1 Mo/frame + sys CLUT row), TR08 (pixels TIM + CLUT brut u32/couleur). Leçon : build-id u32 dans CHAQUE record ; `fopen "ab"` BINAIRE (jamais texte — bug CRLF lot 13) ; purge `.bin/.log` avant CHAQUE trigger (CSV exclu : lazy-open par le DLL).
- **Chaîne TIM fermée et prouvée live** (sonde ReadProcessMemory avant codage — le bon réflexe) :
  `backend = ctx+0x3C ? ctx+0x68 : ctx+0x38` → `v11 = *(backend+20)` → `T = *(v11+152)` ;
  w@T+0x3C, h@T+0x40, entries@T+0x5C, clutBuf@T+0x60 (u32/couleur, byte3 = STP),
  pixels@T+0xD8 (1 o/texel), palMgr = *(v11+0xA0), palCount = *(palMgr+12).
  Sous-palette du groupe g = `raw_clut + 4*entries*ids[g]` (formule `sub_421C41`).
- **Rendu final lot 14** : terrain rocheux gris-bleu fidèle (losanges, perspective, dithering) +
  effet orange. Preuves : `battle13\FINAL_tim.png`, `FINAL_side_by_side.png`.
- **13 dumps** (menu/field/world/battle/battle9-14/fireaga×4/done) + manifest SHA256 complet.
- **Décodeur** : `ff8dump.py` (ND07/ND08/TX07/TR08, strict par défaut, BUILD_ID=0x563D),
  `texture.py` (VramMirror, read_clut, read_clut_sys_row, sample_page, fill_triangle_textured),
  `compare.py` (side-by-side), `render_tim.py` (le rendu TIM final), selftest PASS.
- **Le UV dumpés sont post-bias** (`sub_409C6E` applique le bias au vol : U@+0x18/V@+0x1C stride 32) — ne JAMAIS re-appliquer un bias au décodeur.
- **Deux systèmes texture** : (a) pages (menu/UI/field : SelectTexturePageDrawList 0x465CE0 → AllocTexturePageSlot 0x464F70 → items 0x64) ; (b) TIM modèles (slot 20 → objet T). VRAM miroir = `dword_1CB602C` (= base statique 0x1B47818), 1024×512 u16, pitch 0x800 ; `vramOff = ((page_y+y)<<10) + page_x + (x>>(2-mode))`.

## 1. Diagnostics portés par le lot 14 (à fermer, pas à redécouvrir)

1. **LUT résiduel** : les rows palette du MIROIR sont alpha-stagées (`TexStaging_BlitCLUTAlpha`
   écrase le RGB par `a<<12`) — ne JAMAIS échantillonner une palette dans le miroir : toujours
   passer par le `raw_clut` des TR08 (u32, byte3 = STP/alpha).
   - **Ordre des canaux à trancher** : le u32 brut a été rendu en lecture `bytes 0,1,2 = R,G,B` —
     VALIDER contre la référence opérateur (ciel bleu = test canari ; si le ciel ressort orange,
     inverser R/B). Un seul rendu A/B suffit.
2. **Cadrage caméra** : le rendu offline = 640×480 ; la référence opérateur = 800×600 (Steam).
   Vérifier si le jeu rend en 640×480 upscalé (ratio 1,25) ou si les coordonnées screen-space
   des vertices = déjà l'espace final (bbox 0..640 mesurée = OUI). Le « problème de caméra »
   perçu = probablement le RÉENCADREMENT du side-by-side (resize NEAREST 800→640) — tester un
   rendu upscalé 800×600 pour la comparaison.
3. **Ciel/fond absent** (noir en haut du rendu) : le fond = PAS dans les records kind-2 wrappés.
   Hypothèses à trancher IDB : (a) un chemin de rendu non-43–64 (la chaîne 0x45D610 a plusieurs
   dispatch tables — `g_SoftwarePrimDispatch` vs `g_TexturePageDirtyDispatch`) ; (b) un clear-color
   (slot 8) + gradient non wrappé ; (c) un rendu de fond via les PAGES texture (chemin a) jamais
   tracé. Fermer en IDB AVANT toute capture (règle du lot : zéro offset inventé).
4. **Personnages/monstres absents** : les records slot 49 (vcount=96 = le monstre !) ont
   `texobj=0` — la chaîne `ctx+0x38 → backend+20 → v11+152` RATE pour le walk direct :
   la sonde live montre `ctx+0x38 = le wrapper render` (pas un backend à +20=0).
   **La chaîne texture du walk direct est DIFFÉRENTE du VB batch** — à fermer en IDB/live
   (le node du walk direct = plus riche : `texinfo = *(node+0x2C)` = 0x1A5228CC avec
   `+0x10 = wrapper` / `+0x18 = second ptr` — le SECOND pointeur (`texinfo+0x18` = 0x09018DA0)
   n'a JAMAIS été exploré : suspect n°1).

## 2. Travail offline d'abord (zéro capture nécessaire)

1. **Test LUT A/B** : re-rendre `battle13` avec (a) RGB = bytes 0/1/2 et (b) RGB = bytes 2/1/0 ;
   comparer les deux side-by-side avec la référence ; retenir le bon, le pinner dans `texture.py`.
2. **Test upscale 800×600** : rendu upscalé (PIL resize) pour le side-by-side — si le cadrage
   coïncide, fermer le « problème caméra » comme artefact de comparaison.
3. **Test semi-transparence** : 382 tris/frame ont `alpha=127` — un blend v2 (50 %) au lieu du
   opaque améliorerait le rendu des effets. Optionnel : pondérer par le DIFFUSE alpha par tri.
4. **Fermer le ciel en IDB** (decomp du dispatch non-43–64 ou du clear/gradient).
5. **Fermer la chaîne texture du walk direct** : explorer `texinfo+0x18` (le second pointeur,
   jamais suivi) + la structure du node étendu (le node du walk direct = ≥ 0x30 o ; la copie
   ND07 = 24 o — ÉTENDRE la copie à 0x40 dans le footer si nécessaire pour le décodage offline).

## 3. Run live (seulement si le offline le justifie — protocole rodé)

- v11 : ND07 copie étendue + (si le ciel = un chemin wrappé inconnu) le nouveau slot wrappé.
- Scénarios : bataille idle (pause = contexte parfait, frames stables) ; Fireaga si LUT à calibrer
  sur les effets ; field/world si le ciel = un chemin pages.
- Purge `.bin/.log` avant chaque trigger ; hash du DLL déployé après copie ; capture d'écran F12
  à chaque trigger ; collector par scène.

## 4. Critères PASS

1. **PNG bataille fidèle** : terrain + personnages + monstre texturés, LUT juste (ciel bleu),
   blend semi-transparent correct pour les effets — comparaison côte à côte convaincante.
2. **Ciel rendu** (ou fermé comme chemin non-wrappé documenté avec son EA d'entrée).
3. Parser strict : 0 resync, build-id cohérent.
4. 0 AV, 0 WER, ring jamais saturé.

## 5. Livrables

- DLL v11 (si capture) + dumps + décodeur v3 + PNG fidèles par scène + paires de comparaison.
- Mise à jour `README.md` passthrough + `driver-abi-spec.md` §6.2/§6.3 + rapport campagne.
- Ingest evidence + wiki-scribe (la page wiki `BattleTextures.md` existe — la mettre à jour).

## Interdits

- Pas de debugger attaché pendant les runs ; un seul process de jeu ; pas d'écriture disque dans
  le detour draw ; jamais de slot stubbé sans fnptr natif ; pas de modification de l'exe sur disque ;
  la copie `.bak` (FFNx) intouchée ; **mode texte fopen proscrit** ; build-id u32 dans chaque record ;
  **zéro offset inventé** — sonde ReadProcessMemory live AVANT de coder une chaîne non prouvée.
