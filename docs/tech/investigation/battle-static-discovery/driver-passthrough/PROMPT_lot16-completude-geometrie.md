# PROMPT — Lot 16 : audit de complétude géométrique & rendu fidèle battle (v11 → v12)

> Suite directe du lot 15 (`CAMPAIGN_lot15_2026-09-26.md`, commits `be9890f`/`d72e959`).
> Le lot 15 a fermé LUT/caméra/ciel et l'architecture du bind walk-direct, et découvert que
> le miroir TX07 contient TOUTES les textures battle (persos tpages 10-15, ciel 16-17,
> effets 27-30). **Restant** : les persos et le corps du monstre ne sont PAS rendus —
> la complétude de la géométrie capturée elle-même est en question.

## 0. Établi (NE PAS refaire)

- Chaîne texture VB batch fermée et rendue (lot 14 : terrain ✓) ; LUT RGB pinée (canari orange) ;
  UV post-bias, ne jamais re-appliquer ; TR08 = pixels+CLUT brut par texobj ; footer ND08
  (tpage/mode/clut/ids/texobj) — mais pour les slots directs 48/49/50, tpage/mode/clut =
  champs par défaut NON peuplés (texinfo direct ne les remplit pas).
- Slot 48/49/50 = impl réel `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` @0x43E24A (ctor
  +0xC0/+0xC4/+0xC8) : aucun bind, héritage device. `sub_43E0E2` = slot 55 (piège).
- Live rodé : v11 déployée (`292D40CD…`, build `0x563E`), protocolo purge/trigger/F12-rafale.
- Décoder : `ff8dump.py` BUILD_ID `0x563E` (selftest PASS) ; battle13 = v10.3 `0x563D`
  (parse : monkey-patch `ff8dump.BUILD_ID = 0x563D` avant parse).

## 1. Question centrale (à trancher offline AVANT tout codage)

Où vit la géométrie des **3 personnages debout** et du **corps du monstre** dans la frame
battle13 (réf : `battle13\refs\ref_battle13.jpg`) ? Hypothèses :

- **H1** : dans des records slot-51 (VB batch) déjà capturés, mal identifiés/texture mapping erroné
- **H2** : dans les records slot-49 (96v/9v/20v) mais sous-échantillonnés (indices/sous-maillages)
- **H3** : géométrie NON capturée — chemin non wrappé (comme le ciel) ou slots non déclenchés
- **H4** : dans un autre slot (44/45/46… setup avec géométrie jamais lue)

## 2. Travail offline (audit de complétude — zéro capture)

1. **Flat-color coverage map** : frame 8 battle13, chaque record kind2 rasterisé en UNE
   couleur unique (hash slot/record), positions écran réelles → voir quelle zone couvre
   chaque slot/groupe. Planche : par slot, puis zoom slot-49/51.
2. **Comparaison réf** : superposer (side-by-side) la coverage map à la réf → quels records
   couvrent le monstre (bas centre-gauche, doré) et les 3 persos (haut centre, debout) ?
   Les zones de la réf sans AUCUN record = géométrie manquante (H3).
3. **Analyse vcount/icount** : distribution par record (49/51) — batches « perso-sized »
   (~100-200 tris) présents ? Le monstre 96v couvre-t-il tout le corps ou un fragment ?
4. **Verdict H1/H2/H3/H4** documenté (AUDIT_completude.md) avec preuves visuelles.

## 3. Phase 2 (selon verdict)

- H1/H2 → v12 : footer + `u32 pal_idx = *(*(node+0x2C)+0x80)` (EA 0x43e10f-112, guard ≠ -1)
  + rendu décodeur final (palettes miroir/pages correctes) → PNG fidèle complet.
- H3 → diagnostic IDB du chemin des corps (comme le ciel) avant toute capture.
- Ciel : rendable offline depuis le miroir (tpages 16-17) — bonus démo.

## 4. Critères PASS

1. AUDIT_completude.md : verdict H1-H4 avec planches de preuve
2. Si H1/H2 : PNG battle13 fidèle (terrain + persos + monstre texturés) côte à côte réf
3. Parser strict maintenu ; 0 AV ; pas de capture live si le offline suffit

## Interdits

Pas de debugger, un seul process de jeu, pas d'écriture disque au detour, mode texte fopen
proscrit, build-id dans chaque record, **zéro offset inventé** — sonde live avant de coder
une chaîne non prouvée. Ne pas sur-interpréter les rendus : observations factuelles d'abord
(leçon lot 15 §6).
