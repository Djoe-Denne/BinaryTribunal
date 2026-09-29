# Lot 18 offline — composite battlefield complet, essais et limites (2026-09-29)

> Source : PROMPT_lot18-composite-battlefield.md (commit f7dec10). Exécution offline
> (aucun run live, IDB lecture seule). Preuves : `captures/lot14/battle13/LOT18_*.png`.

## 1. Résultat factuel

- **Classification complète des 12 classes texobj** de la frame 2976 :
  terrain 049E20/04AE40, entités 04BE60/04CE70 (monstre) + 04DE70/04EEC0/04FEE0 (persos),
  UI 043E10/045870/046730/046BC0, slot 49 kind2 (3 records, texobj=0).
- **Chemin exact miroir confirmé** (rapprochements full-image byte-exact) :
  entités x=1280..1792 @y=0 (strip battle), terrain @ (256,256) et (512,256).
- Les 4 textures fontes/UI n'ont PAS de match full-image dans le miroir (dynamiques
  ré-récrites à chaque frame, hors battle strip).
- **Composite v1** (painter order droit, CLUT TIM par classe) : terrain fidèle ✓ mais
  **les entités furent recouvertes par le terrain** (painter psx = terrain en dernier
  à positions 118-126).
- **Depth tests essayés** : rhw (1/rhw vs rhw), z@+8 FVF, painter reversed — aucun
  ne donne le composite correct ; les RHW terrain et entités PARTAGENT le même range
  (3.7e-5..1.0e-4), le test ne discrimine pas.
- **Hyper-thèse restante** : le painter PSX réel passe par le **z-sort du jeu**
  (l'Ordre du draw-list = back-to-front le jeu), soit l'ordre records inversé —
  validé visuellement partiel : panneaux noirs (UI CLUT mapping erroné) mais les
  entités ré-apparaissent avec du détail.
- **Combiné merge LOT14 terrain + LOT17 entities en 2 couches alpha-keyed** :
  `LOT18_final_merge3.png` (terrain rendered base puis entités) — résultat =
  entités SANS terrain sous-jacent (le composite v1 avait ses pixels écrasés).
  
## 2. Le composé fidèle требует les fermetures suivantes (lot 19)

1. **W_window + packet fenêtre** : la capture 0x563D ne porte ni les UV u8 ni le
   packet. Une capture v12 enrichie (footer + `u32 window_word`) ferme ce point au prochain lot,
   et placerait le décodeur v4 en position « fidèle par construction ».
2. **Depth/painter-order battle FF8** : la sortie du jeu réel = **z-sort par la logique battle**
   (l'OT PSX) — le painter order des records n'est PAS le z-order. La profondeur
   CORRECTE serait : (a) un indicateur battle-logic z-sort (champ du record){
   _z-buf PSX n'existe pas dans les draws D3D) ; (b) un IDB : la chaîne OT-emitters 
   (OT-sorted sys toutes les primitive) à épingler.
3. Le blend STP half-transparency reste à juger (lé compte rendu lot 15 : 510/8192
   entrées STP=0x7F sur la palette entités).
4. Le panorama réellement composé (terrain + UI sans devine) nécessite la **bobine
   palette UI exacte** (l'alternance UI CLUT acteurs vs TIM CLUT directes).

## 3. Preuves stockées (captures/lot14/battle13/)

- `LOT18_composite.png` (v1 painter order), `LOT18_composite_pair.png`
- `LOT18_composite_z.png` + `_pair.png` (3 depth tests essayés)
- `LOT18_final_merge2.png` + `_pair.png` et `LOT18_final_merge3.png` + `_pair.png`
- `LOT18_composite_back.png` + `LOT18_composite_pairB.png` (painter reversed)
- Scripts : composite2.py, composite3.py, composite_z.py, final_merge.py, final_merge2.py (dans temp-dir opencode)

## 4. Position de l'orchestrateur (fin de session)

- **01/02 Astra-built oracle (raster v3) est PROVEN** pour les entités (lot 17,
  commit 580e0ad) — l'honnêteté documentée sur le composite est៓eepered.
- **Le composite complet nécessite la depth/blend layer v12** (lot 19) :
  footer v12 (pal_idx + clut_sys_id) + D3D states + painter order reversed test
  (already proven painter span pour les entités/terrain/UI, commit 580e0ad).
- Les scripts de ce lot sont dans le temp-dir : composite2.py/composite3.py,
  composite_z.py, final_merge.py — **tous hors git, aucune pollution repo**, IDB
  intacte (aucun write, lecture seule).
