# Lot 17 offline — fenêtres UV, palettes et replay battle13

Date : 2026-09-27. Source statique : fermeture `c9ad02d` et ses trois decomp.
Exécution exclusivement offline. Aucun changement de capture, de writer, de DLL ou d'IDB.

## Résultat

Le replay des entités retrouve les ailes ocre et le corps vert-turquoise du monstre,
ainsi que les vêtements des trois personnages. Les stries et permutations du rendu
précédent sont fortement réduites. Le candidat 256×256 conserve un placement cohérent
des textures ; le candidat 128×256 reste visiblement mal placé. Cela ne constitue pas
une mesure du packet fenêtre actif.

- [Rendu contre référence](../../../../../tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/battle13_vs_reference.png)
- [Candidats 256 / 128](../../../../../tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/battle13_window_candidates.png)
- [EXACT UV / CORRECTED indisponible / référence](../../../../../tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/battle13_comparison.png)
- [Comparaison contrôlée u8](../../../../../tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/synthetic_u8_comparison.png)
- [Manifest avec paramètres et SHA-256](../../../../../tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache/manifest.json)

**Limite de l'objectif :** deux rendus fidèles EXACT / CORRECTED de battle13 ne sont
pas possibles avec cette capture : elle ne contient que les UV float finaux, ni les
UV u8 d'origine ni le packet fenêtre. Le panneau CORRECTED l'indique explicitement.
Les deux conversions sont implémentées et comparées sur un triangle u8 synthétique
distinct, sans inverser arbitrairement la LUT des sommets capturés.

## Changements exécutables

- [ff8dump.py](../../../../../tools/_tmp_af3dn_drop/decode/ff8dump.py) : paramètre
  `expected_build` explicite pour `0x563D` (v10.3) et `0x563E` (v11), transmis aux
  ancres ND/TX/TR, au footer, aux statistiques et à la garde stricte. Le défaut reste
  `0x563E` ; aucune mutation globale de `BUILD_ID`. Le nouveau loader refuse les
  warnings, les builds mélangés, les lectures échouées et les indices réparés.
- [lot17_texture_window.py](../../../../../tools/_tmp_af3dn_drop/decode/lot17_texture_window.py) :
  latch 24 bits, origine et clamp W/H ; conversion u8 séparée du passthrough f32 ;
  CLUT et bandes en deux segments de 512 octets au stride 2048 ; résolution des
  palettes PC ; rasterisation avec association barycentrique correcte et RHW.
- [render_lot17.py](../../../../../tools/_tmp_af3dn_drop/decode/render_lot17.py) :
  replay reproductible depuis TX07, rapprochement exact TR08↔TX07, candidats
  clairement étiquetés, manifest et vérification sur toutes les frames.
- [test_lot17.py](../../../../../tools/_tmp_af3dn_drop/decode/test_lot17.py) :
  17 tests, dont intégration battle13 quand la capture locale est disponible.

Le fichier historique `texture.py` et son canari champ-fort-rouge restent inchangés.
La sortie principale conserve la convention **PC BGRA validée pour la bibliothèque**,
en distinguant ce format 32 bits du mot PSX `STP | B5 | G5 | R5`. La variante
`--palette-policy actor-slots` garde la lecture littérale initiale comme diagnostic.

## Preuves sur la capture

Capture : `tools/_tmp_af3dn_drop/captures/lot14/battle13/battle13.bin`.

```text
SHA-256 : e7f134e56785047a168730bd76af25afcf33b86b49b4d4ab389af45b730fa36d
Build   : 0x563D
ND      : 2512 records
TX07    : 16 miroirs
TR08    : 176 ressources
Warnings: 0, aucun indice réparé
```

Le slot 51 contient 1712 records / 121280 sommets. Tous ses UV sont finis, sur une
grille 1/256, dans `[0,1]` ; aucun UV supérieur à 1 n'est observé. Les seuls modèles
d'entités de la frame 2976 ont `U∈[1/256,127/256]`, `V∈[1/256,254/256]`.
Les statistiques globales du slot 51 comprennent aussi UI et autres objets : elles
ne doivent pas être confondues avec celles des modèles.

Le rendu présenté traite 77 records et 2241 triangles. Les UV sélectionnés sont
préservés **bit à bit**, y compris après sérialisation float32 :

```text
UV avant = UV après SHA-256
6b098ff861f69f7ad475f24bf5ad5f5a29658c021ffece81263f6d34f381241e
```

Le RHW capturé varie de `5.803156818728894e-05` à `9.619084448786452e-05` ; le
replay principal l'utilise pour l'interpolation perspective des UV. La commande
`--no-perspective` conserve une variante affine explicitement diagnostique.

### Images d'indices retrouvées octet pour octet

Chaque image TR08 256×256 ci-dessous est égale au rectangle TX07 indiqué, sur ses
65536 octets. Le raster échantillonne ensuite **le miroir**, et non le buffer TR08.
Ce rapprochement établit l'origine des pixels ; il ne capture pas le packet actif.

| Ressource / entité d'après l'audit | X en octets dans TX07 | Y |
|---|---:|---:|
| `0x0904DE70` / Zell | 1280 | 0 |
| `0x0904EEC0` / Squall | 1408 | 0 |
| `0x0904FEE0` / Irvine | 1536 | 0 |
| `0x0904BE60` / monstre A | 1664 | 0 |
| `0x0904CE70` / monstre B | 1792 | 0 |

Vérification complète : **80 rapprochements d'images sur 16 frames**, zéro échec.

### Correction nécessaire au raccourci `ids={0,2,4} → g={0,1,2}`

La loi de staging `y=0xE0+2g` et les deux rangées par bande restent valides. En
revanche, l'octet `ids[]` exporté dans un footer de batch est un **index local de
palette du cache PC**. Il ne peut pas être assimilé directement à `2g` pour tous
les objets de cette capture. La chaîne de cache était déjà documentée dans
[la campagne lot 14](CAMPAIGN_lot14_2026-09-26.md) :
`raw_clut + 4*entries*ids[primitive]`.

Contre-exemple mesuré : l'ID local 0 sélectionne la rangée 225 pour `DE70`, 226
pour `EEC0`, 228 pour `FEE0`, 231 pour `BE60`, et 232 pour `CE70`. Ces palettes
sont différentes. La lecture littérale de toutes ces primitives dans la bande
`g=0` produit les rendus bleu-gris incorrects conservés dans `lot17_v3/`.

Le nouveau chemin recherche une correspondance de **toutes les 256 couleurs à
5 bits par canal**, après conversion explicite BGRA32↔PSX555. Une correspondance
absente, multiple ou une palette vide n'est jamais choisie arbitrairement.

| Texobj | ID local 0 → rangée | ID local 2 → rangée | ID local 4 → rangée |
|---|---:|---:|---:|
| `0x0904DE70` | 225 | 236 | 224 |
| `0x0904EEC0` | 226 | 237 | 227 |
| `0x0904FEE0` | 228 | 229 | 238 |
| `0x0904BE60` | 231 | 230 | non utilisé |
| `0x0904CE70` | 232 | 233 | non utilisé |

La rangée ainsi retrouvée fournit l'indice de bande `g=(y-224)//2` et la moitié
`(y-224)%2`, puis le lecteur utilise les vrais octets TX07. Cet inverse d'adressage
ne prétend pas identifier un pointeur d'acteur vivant.

**208 rapprochements de palettes sur 16 frames**, 13 bindings distincts, zéro
échec. Les couleurs du miroir développées par `floor(c5*255/31)` diffèrent d'au
plus 1/255 par canal des couleurs PC BGRA capturées. L'alpha/STP n'est pas fermé
par cette égalité des canaux quantifiés.

### Deux erreurs du précédent replay évitées

Dans `render_tim.py`, le poids de l'arête AB était multiplié par l'UV du sommet A
alors qu'il correspond au sommet C. Le raster v3 vérifie que chaque poids vaut
1 à son propre sommet, sans appliquer une seconde permutation C-A-B aux FVF.

Le footer porte un ID par primitive : un triangle consomme un ID, un quad
consomme un ID pour ses deux triangles. Le lecteur valide les groupes d'indices
capturés, sans distribution proportionnelle des IDs sur tout le draw.

## EXACT / CORRECTED et inconnues

- **u8 + packet connu** : EXACT applique `u8/W`, `v8/H`, sans offset UV ;
  latch nul : `clamp(i,1,254)/256`.
- **u8 + packet absent des données** : erreur explicite `MissingEvidence`.
- **f32 final** : EXACT conserve les valeurs ; CORRECTED est indisponible, sans
  inverse de LUT ni récupération supposée des valeurs 0/255 perdues.
- **CORRECTED synthétique** : convention expérimentale `/255`, puis facteur
  `256/W` et `256/H` si une fenêtre est active. Ce choix est explicité dans le
  manifest ; aucune conformité à un commit FFNx particulier n'est revendiquée.

| Point du brief | État après exécution |
|---|---|
| W_window effectif | **UNPROVEN** : packet absent. W=128 n'est pas codé en dur ; W=256 donne le candidat visuellement cohérent. |
| cid historiques `0x1DA0…0x1E02` | **UNPROVEN** comme ancien encodage. Lecture littérale CLUT : aucune égalité avec les demi-bandes examinées. Le replay utilise désormais les bindings cache↔miroir mesurés. |
| Writers du bias | **UNPROVEN** ; pas de bias supplémentaire appliqué aux floats déjà finaux. |
| Backend actif | **UNPROVEN** ; aucun accès au processus. |

Le raster déclare ses hypothèses : point sampling, wrap, centres de pixels entiers,
modulation diffuse, ordre painter et interpolation RHW. Il ne reconstitue pas la
profondeur, le blend STP complet, l'UI ou le terrain. La référence montre une pose
et un habillage différents ; aucun score pixel global n'est présenté comme preuve.

## Reproduire depuis la racine du dépôt

```powershell
python tools/_tmp_af3dn_drop/decode/render_lot17.py tools/_tmp_af3dn_drop/captures/lot14/battle13/battle13.bin --out tools/_tmp_af3dn_drop/captures/lot14/battle13/lot17_v3_cache --seq 2976 --verify-all-frames --reference tools/_tmp_af3dn_drop/captures/lot14/battle13/refs/ref_battle13.jpg
python -m unittest discover -s tools/_tmp_af3dn_drop/decode -p test_lot17.py -v
```

Validation réalisée : **17 tests lot17 PASS**, selftest historique **PASS**, contrôle
du diff sans erreur de whitespace, inspection des PNG et contrôles inter-frames
ci-dessus. Le dump et les fichiers de configuration préexistants sont préservés.
Les images, manifests et fixtures synthétiques restent hors git, sous `captures/`.

La comparaison CORRECTED fidèle de battle13 demeure une limite des données fournies,
et non une validation obtenue par un rescale des floats. Aucune sonde live n'a été lancée.
