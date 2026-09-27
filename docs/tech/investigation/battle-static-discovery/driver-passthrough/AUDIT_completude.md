# AUDIT — complétude géométrique & palette battle13 (lot 16, offline 2026-09-27)

> Source : dump v10.3 `battle13.bin` (STRICT PASS, 0x563D), frame 8 (seq 2976).
> Réf opérateur : `battle13\refs\ref_battle13.jpg` (800×600).
> Question lot : où vit la géométrie des 3 persos + du corps du monstre, et pourquoi les
> couleurs sortent « en négatif » / fausses ?

## 1. Verdict géométrie : H1 CONFIRMÉE — tout est dans les records slot-51 VB

Coverage map flat-color (chaque slot une couleur, `LOT16_cov_all.png`) + rendu ciblé
(`LOT16_persos_monstre.png`, `LOT16_entities_with_ids.png`) :

- **Monstre** : 21 records slot-51 v≥60 (texobj 04BE60/04CE70), bbox (62..328, 228..396) —
  ailes/corps/queue complets, texturés turquoise
- **Perso 1 (gauche, Zell)** : 13 records (texobj 04DE70), x≈322-340, y≈122-188
- **Perso 2 (milieu, Squall)** : 17 records (texobj 04EEC0), x≈357-403, y≈144-217
- **Perso 3 (droite, Irvine)** : 13 records (texobj 04FEE0), x≈456-501, y≈144-218
- slot-49 restent : curseur ciblage (12v) + HP bars (2 records) + OVale 96v = fragment
  d'effet au sol — PAS les entités
- Les fonts/UI : 043E10/045870/046730/046BC0 (textes, HP dorés, Start bar)

Toutes les entités bataille sont donc déjà capturées depuis le lot 14 ; le lot 15 avait
cherché les persos du mauvais côté (slots directs au lieu du VB batch).

## 2. Bibliothèque de textures extraites (contrôle opérateur)

`tools\_tmp_af3dn_drop\captures\lot16_texture_library\` :
- `tex_<id>_pal00_<pc>.png` / `tex_<id>_avg_<pc>.png` — 11 texobj uniques × 2 rendus
- `ALLPAL_04BE60/04CE70/04DE70/04EEC0/04FEE0.png` — TOUTES les palettes (p00-p31) de
  chaque texture entité
- `TEXOBJ_MAP` (validation opérateur 27/09) :

| texobj | contenu | entité |
|---|---|---|
| 043E10 / 045870 | fontes (pal5 = HP barre DORÉE ✓ réf) | UI |
| 046730 / 046BC0 | UI francaises (Miss, Chiffres, Start) | UI |
| 049E20 / 04AE40 | rochers | décors |
| **04BE60 / 04CE70** | écailles organiques bleu-cyan (seuls p00/p02 remplis) | **monstre** |
| **04DE70** | short/muscles/visages blonds | **Zell** (gauche) |
| **04EEC0** | pantalon brun ceinture-banches p00, p02 = doré | **Squall** (milieu) |
| **04FEE0** | visages/uniforme, p00/p02/p04 bleus | **Irvine** (droite) |

## 3. Verdict couleurs : PAS un négatif — décalage & couche de modulation manquante

Constats (opérateur + vérifications croisées) :

1. **Pantalon brun correct / ceinture bleue sur p00** (04EEC0) : pas une inversion
   globale — **certaines entrées exactes, d'autres décalées**. p00 et p02 ne partagent
   que 21/256 couleurs (palettes radicalement différentes ; p02 = version dorée surblown).
2. **Seuls les ids 0/2/4 sont référencés** par les groupes (`ids[]` footer, 1290 groupes) ;
   p05+ noires = capacité non utilisée (le `pal_count=32` n'est pas un usage).
3. **Le doré corps du monstre n'existe dans AUCUNE palette TL08** (balayage exhaustif
   battle11-14, 88 palettes entités + fonts ; seuls hits = fontes pal5 = HP bars, et
   04EEC0 p02 = Squall doré).
4. L'unpack 4bpp est réfuté (nz structure en nibble ; pixels = 1 o/texel 8bpp confirmé).
5. `bytes3 = 0x7F` (STP half-transp) sur 510/8192 entrées : les entités utilisent le
   blending PSX half-transparency.

**Conclusion** : la couleur finale = **couche de modulation D3D manquante** (texture ×
facteur de teinte — state D3D TEXOP/MODULATE ou couleur de lumiène ambiante non capturée).
La texture turquoise × un modulate doré chaud ≈ rendu doré de la réf ; le « décalage »
0910 l'où la ceinture bleue ≈ sous-modulation partielle. C'est un champ à CAPTURER (v12 :
state D3D du draw = stage colorop/arg/modulate + light ambient), non dérivable du dump
actuel. (RÈGLE : zéro offset inventé — capture de l'état réel, pas d'inférence.)

## 4. Proches tickets lot 16 → v12

- v12 footer additionnel (slots 51/60 en priorité + directs) : `u32 pal_idx` (déjà EA-prouvé
  0x43e10f-112) **+ capture de l'état blend modulate du draw** (à EA-citer en IDB avant codage :
  SetTexture/set-render-state sur les objets listés de `sub_41EF7A` → dériver le champ exact).
- Décodeur v3 : modulation `texel × modulate` (déjà diffuse fait) + le NOUVEAU champ une
  fois capturé.
- Démonstration dorée possible offline : re-réssyer `tex × gold-modulate` (0xD56A00, alpha
  50 %) pour valider l'hypothèse visuellement (preuve à produire comme LOL test A/B).

## 5. Tests opérateur (plans)

- Vérifier visuellement l'hypothèse modulate doré sur le monstre (rendu candidat × 0xD56A00)
- Si convaincant → v12 capture le champ exact ; sinon → diagnostic IDB (colorop)

## 6. Revue opérateur 27/09 (suite) — le « négatif » = palette système VRAM

Contrôle opérateur sur la bibliothèque + grilles : **BGR confirmé par l'opérateur** pour les
entités ; monstre cuivré (inversion) « esthétique mais pas la réf » ; couleurs jamais justes
dans les rendus TIM-layout.

**Découverte palette système (offline, balayage miroir complet)** : les palettes du
monstre vivent dans la bande CLUT **système du miroir VRAM** — région cid 0x1DA0-0x1E02
(13 hits ≥45 % or au pic 87 %). Rendu avec 0x1DA0/0x1DFF/0x1E00/0x1E02 :

- Couleurs CORRECTES enfin : corps beige-tan-or (opérateur : « 0x1DA0 le plus proche des
  couleurs »), tailles/impacts cohérents
- **MAIS le mapping UV est faux** (motif quadris rayés répétés sur chaque fragment ;
  fragments isolés = fins lames/frondes, pas des surfaces du corps)
- Pattern d'indices raw = (3k+2, 3k+1, 3k) triangles inversés consécutifs — structure
  PSX FT3 par 3 verts, pas le quad-strip (2,1,0,3,1,2) du lot 13

**État des deux problèmes et pistes fermeables** :
1. **Palette** : la source juste = les bandes CLUT système du miroir VRAM (région
   0x1DA0-0x1E02 pour le monstre) — le writer TR08 capture un CLUT d'objet TIM qui n'est
   pas la palette active. Alternatives : (i) re-évaluer les bandes système comme source
   pour chaque groupe ids[g]×base : plusieurs strides testés sans fermer ; (ii) IDB :
   trouver où les bandes système sont écrites pour les entités battle (chaîne
   sub_407EB4/BlitCLUTAlpha) ; (iii) capture v12 du buffer palette réellement bindé.
2. **UV mapping** : fragments en lame + quadris = la géométrie lue ne se combine pas en
   surfaces closes ; suspects : (a) les records contiennent des tris isolés PSX FT3
   (熵 fragment = un tri ; 96 verts = 32 tris = 32 fragments « lames »), il faudrait
   assembler via les données de LISTE ENGINE si disponibles ; (b) les UV encodent
   un tiling/atlas spécifique ; (c) ordre index inversé (3k+2,3k+1,3k) vs tris direct.

## 7. Livrables visuels de session (hors git)

- `LOT16_cov_all.png`, `LOT16_cov_51.png`, `LOT16_cov_49.png` — coverage maps par slot
- `LOT16_tr08_thumbs.png`, `lot16_texture_library\` (22 PNG + ALLPAL ×5 + CHECK ×4)
- `LOT16_monster_palette_grid.png` (288 vignettes), `LOT16_monster_isolated.png`
- `LOT16_perm_all.png` (6 permutations canaux), `LOT16_mirpal_all.png` (4 palettes miroir)
- `LOT16_group_pair2.png` (v2 fix + réf), `LOT16_vflip_pair.png` (v-flip + réf)
- `LOT16_stride_all.png` (3 strides base 0x1DA0)
- `LOT16_entities_with_ids.png` (composite avec ids[] réels)
- `LOT16_monster_A_notint.png`, `_B_gold.png`, `_C_inverted.png` (modulation tests)

## 8. Ordre des canaux et fausse piste swizzle (27/09, contrôle opérateur)

- **BGR confirmé par l'opérateur** pour les catégories entités (canari : la texture
  `04BE60` re-rendue en BGR devient un atlas monstre cohérent : membrane d'aile, tête
  cornue, plastron écailleux, corps beige, écailles turquoise). La conséquence immédiate :
  **la bibliothèque et les ALLPAL ont été ré-émises en BGR** ; le canari précédent
  « RGB pour le TR08 terrain » reste valable pour la famille terrain/UI (gris neutres) —
  les femmes TIM entités sont stockées BGR. Implémentation décodeur : swap R/B selon
  familles ou uniformément en BGR avec la palette des bandes système.
- **Fausse piste éliminée (recherche opérateur, 27/09)** : pas de swizzle 8×8/16×16
  pour les textures battle. Types battle = **TIM PSX standard LINÉAIRE** uploadé VRAM,
  portant **TPage + CLUT + UV 8 bits par face** ; mieux : largeur TIM exprimée **en mots
  16 bits** (8bpp = 128 mots pour 256 texels). Le swizzle ne concerne que les FMV (MDEC,
  DCT 8×8). La routine PC identifiée `sub_507400` = allocation VRAM + patch
  TPage/CLUT. Fermeture IDB déléguée (CLOSURE_tim-vram-tpage.md attendue).
- Troubles persistants après le BGR : mapping UV déformé (fragments en lames, motif
  quadris) ; verdict en attente de la closure IDB (a/b/c du paiement TPage).
- Confirmation de test rapide opérateur : le monstre cuivré par inversion RGB (§
  LOT16_monster_C_inverted) = artefact de test, **pas** la mécanique moteur (retrait).

## 10. Post-recherche opérateur (27/09 soir) : UV 2013, PAI C-A-B, BGR à deux niveaux

Recherches opérateur (FFNx PR #852 Myst6re 2025, FF8UltimateEditor, docs battle model) :

1. **UV table PC 2013** : `mapping[n] = n/256` avec `0→1/256` et `255→254/256` (clamp internaute
   bizarre). FFNx corrige en `n/255`. → Le décodeur doit offrir AMBEDDE modes (`EXACT 2013`)
   vs `CORRECTED`.
2. **Ordre UV par triangle battle = C, A, B physiquement** (faces rangées C A B, pas A B C) —
   l'association naïve UV0→vertex0 fausse les faces.
3. **BGR à deux niveaux** : TIM CLUT PSX 16 bits = `STP | B5 | G5 | R5` (bits bas = R) ;
   conversion PC buffer 32 bits = **BGRA**. Les deux « BGR » coexistent — distinguer.

4. **Constat live (essais LOT17)** : les UV-rotations (6 permutations) + palettes système
   0x1DA0/0x1E00 ne sortent quu toujours le même monstre bleu ou or selon le canal-swap —
   la lecture **champ-fort = R** (convention BGR555 utilisée) donne corps beige-tan/or,
   la lecture **PSX standard r=bits0-4** donne le bleu. Famille cuivré notée correcte pour
   la présence de « piel », l'attribution exacte des sous-bandes reste ouverte.

5. **Arbitrage de fin de lot** : es mêmes palettes système/offline sans closure IDB = le
   mapping UV reste le problème central (la proper id g CLUT relation peut être plus
   précise). Tous les essais offline de rotation/linearisations sont conservés en preuve
   (LOT17_*). Le travail IDB artisanal (sub_507400 / writer des bandes CLUT système /
   relation ids[g] → base) = le lot 17.

## 11. State de la session lot 16 (fin)

- **Committés** : `be9890f`, `d72e959`, `8ba42b6` (lot 15+16 : closures LUT/caméra/ciel,
  walk-direct, textures extraite⊐, audit completude + revues)
- **Décodeur** : `ff8dump.py` BUILD_ID 0x563E + selftest PASS
- **Texture library** : `lot16_texture_library\` complet (BGR)
- **Pas fermé** : mapping UV entités, table ids[g] → bande CLUT système exacte,
  vert/turquoise battle + la couche finale modulate. Lot 17 = pure IDB puis v12.
- La demande utilisateur reste prioritaire en session : ne PAS spawn de v12 sans une
  liste d'EA validée (règle « zéro offset inventé »).
