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
