# Lot 21 offline — UV/RHW du fond, composite et alpha STP (2026-10-01)

> Résultat : **PARTIAL explicite**. Le fond complet, la falaise blanche, le terrain et
> les entités sont reconstruits ensemble et les défauts UV du lot 20 sont tranchés.
> L'UI et les effets directs restent conditionnels car le dump ne contient ni l'état
> de blend hôte ni le binding texture hérité des draws slot 49.

## Entrée et garde stricte

- Dump v13 : `tools/_tmp_af3dn_drop/captures/lot20/battle_v13/gfx_passthrough_dump.bin`
  (`sha256=24acea32dc6dc3a25c78460be9d919d3e6ecd9fc64d2aaf630d1cf3bd2264c46`).
- Build `0x5640`, 2 512 records, 16 frames, 16 `TX07`, 192 `TR08`, zéro warning,
  zéro read-fail/index réparé.
- Les 16 `TEXWIN` valent `{0,0,0,0}`. Le rendu garde donc `W=H=256`; aucune
  fenêtre ou correction `/255` n'est réintroduite.
- Frame de comparaison : séquence 7105. La référence opérateur est
  `visuals/20260929172809_1.jpg` du lot 20.

Le renderer reproductible est `tools/_tmp_af3dn_drop/decode/render_lot21.py`.
Il appelle `render_lot17.load_capture`, donc le build lu dans le record pilote le
parseur strict. Le CLI historique `ff8dump.py info` conserve un défaut `0x563E` et
ne doit pas être utilisé sans `expected_build` explicite pour ce dump.

## Verdict UV : association capturée + RHW

Les trois ressources de fond sont sélectionnées par correspondance octet-exacte
`TR08 -> TX07`, sans adresse absolue codée en dur :

| Rect miroir | Suffixe texobj | Records/tris | Contenu isolé |
|---|---:|---:|---|
| `(0,256)` | `05AF00` | 1 / 32 | ciel **et falaise blanche** à sa base |
| `(256,256)` | `059E20` | 6 / 191 | terrain proche |
| `(512,256)` | `058E40` | 4 / 102 | bande de terrain lointain/horizon |

La rotation UV C-A-B supplémentaire est rejetée. Les indices FVF capturés portent
déjà cette association physique. Sur les arêtes partagées, `rot0` conserve presque
toutes les continuités (`4/36`, `9/268`, `11/129` défauts suivant la classe), alors
que `rot1` et `rot2` cassent toutes les arêtes (`36/36`, `268/268`, `129/129`).

Le défaut du replay lot 20 venait du raster affine. Toutes les primitives de fond
ont un RHW variable. Le passage affine -> perspective change 28,52 % des pixels du
ciel, 29,87 % du terrain et 7,36 % de la bande lointaine sur la frame 7105. La
comparaison à la référence opérateur confirme que `RHW + rot0` a le meilleur MAE
des quatre variantes. La planche `LOT21_uv_board.png` rend les trois classes en
`affine/rot0`, `RHW/rot0`, `RHW/rot1`, `RHW/rot2`.

## Slot 49 : pas la falaise

Les trois draws directs `slot=49, texobj=0` contiennent 118 sommets, pas 120 :

| Sommets/indices | Tris | Classification par géométrie et couleur |
|---:|---:|---|
| 96/96 | 32 | quatre ombres au sol (3 personnages + monstre) |
| 6/6 | 2 | petit curseur de ciblage jaune |
| 16/24 | 8 | barres HP/status, alpha diffus 128 |

Leur état texture actif est hérité du device et n'est pas capturé par ND08. Aucun
binding miroir n'est donc inventé. `LOT21_slot49_diagnostic.png` les montre en
diffuse seul; ils sont exclus des deux composites texturés. Les quatre ressources
anciennement « sans match » (`055790`, `055BC0`, `0563E0`, `056A80`) sont des atlas
UI/font RHW=1, pas la falaise.

## Ordre : records hôte, pas OT global

Le dump mesure l'ordre des appels de dessin hôte. L'ASM réfute son équivalence avec
un painter OT global :

- `Gpu_DrawOTag 0x45D080` exécute deux traversées opaque/semi (`0x45D29D-0x45D2C6`).
- `Gpu_EmitPolyFT3 0x4617F0 -> sub_461A30` sélectionne une liste avec
  `Gfx_SelectTexturePageDrawList 0x465CE0` avant d'y réserver la primitive.
- Cette sélection dépend TPage/CLUT/état et utilise des banques strides `0x44C` et
  sous-listes `0x64`.
- `Gfx_SubmitTexturePageLists 0x465930` marche ensuite ces listes fixes par
  passe/page/sous-slot (`Gfx_WalkDrawList` à `0x465B0E`, puis banque alternative
  `0x465C1A`). Il n'existe aucun merge global par profondeur.

`LOT21_host_order.png` conserve cet ordre de soumission et recouvre presque toutes
les entités avec le fond. Le composite utile applique donc une approximation
déclarée : ciel + terrain lointain + terrain proche, puis acteurs, puis UI; l'ordre
capturé est conservé à l'intérieur de chaque couche. Ce choix restaure les grandes
superpositions de cette capture, sans être présenté comme une reconstruction OT.

## Alpha/STP

La frame compte 2 496 triangles à alpha diffus 255 et 382 à alpha diffus 127.
Le renderer teste deux politiques : overwrite opaque et source-over
`src*(127/255) + dst*(128/255)`. Le source-over emploie une règle top-left demi-
ouverte afin qu'une arête partagée ne soit pas blendée deux fois.

Ce rendu alpha127 est une **approximation hôte reproductible**, pas l'affirmation
d'un mode PSX STP universel : l'identité du blend-state par draw n'est pas dans le
dump. `LOT21_blend_comparison.png` conserve l'A/B. Le rendu retenu applique l'alpha
diffus, traite alpha palette zéro comme sentinelle transparente pour les ressources
miroir, et l'ignore pour les atlas UI non appariés. L'UI devient lisible mais reste
moins fidèle que la référence (opacité et label `HELP` parasite).

## Livrables et validation

Sorties sous `tools/_tmp_af3dn_drop/captures/lot21/battle_v13/visuals/` :

- `LOT21_uv_board.png` — planche causale UV/RHW;
- `LOT21_background.png` — ciel + falaise + terrains;
- `LOT21_slot49_diagnostic.png` — ombres/curseur/barres sans binding inventé;
- `LOT21_composite_full.png` et `LOT21_composite_pair.png` — approximation par couches;
- `LOT21_host_order.png` et `LOT21_host_order_pair.png` — témoin ordre hôte;
- `LOT21_composite_opaque.png` et `LOT21_blend_comparison.png` — test alpha;
- `manifest.json` — hashes, sélecteurs, métriques et limitations.

Validation :

```powershell
py -3 -m unittest discover -s tools\_tmp_af3dn_drop\decode -p "test_lot*.py" -v
py -3 -m py_compile tools\_tmp_af3dn_drop\decode\render_lot21.py tools\_tmp_af3dn_drop\decode\test_lot21.py
```

Résultat : **23 tests PASS** (17 lot17 + 6 lot21). Les tests lot21 couvrent le
build strict `0x5640` et les comptes `2512/16/192`, la non-rotation des UV, l'effet
RHW, transparence/alpha127/overwrite, la propriété unique des arêtes partagées,
`MissingEvidence` slot49 et la non-mutation de l'oracle lot17.

L'ingestion Lot21 est vérifiée séparément : les 13 sources suivies ont leur hash
exact, et les neuf PNG du staging sont byte-exact (`mismatch=0`). Le `verify` global
du vault sort en erreur sur des sources historiques `unmanaged` du dépôt evidence,
hors périmètre Lot21; ce résultat n'est donc pas présenté comme un PASS global. Le
smoke QMD a interrogé l'index existant seulement. Aucun `qmd update`, `embed` ou
rebuild n'a été exécuté, et les nouvelles pages ne sont pas déclarées indexées.

## Synchronisation IDB — 2026-10-02

Les résultats du lot ont été synchronisés dans l’IDB par ROOT, sans debugger ni
capture supplémentaire. Dix fonctions portent désormais un bloc idempotent
`[driver-passthrough lot21 2026-10-02]`. Le seul rename est
`0x460CE0 sub_460CE0` → `Gpu_EndPrimitivePass`, avec prototype `void __cdecl()`;
les neuf autres noms et types sont conservés. Les commentaires historiques et
répétables sont préservés, et les hashes des octets des dix fonctions sont
inchangés. Plan et reçu : `IDB_SYNC_lot21_2026-10-02.{json,md,receipt.json}`.

## Verdict PASS du prompt

- PNG complet terrain + ciel + falaise + entités : **PASS visuel structurel**.
- UV par face / RHW / ordre : **tranchés**; `rot0+RHW`, ordre hôte non équivalent OT.
- Parser strict `0x5640`, zéro AV, aucune nouvelle capture live : **PASS**.
- Fidélité immédiate incluant UI/effets directs : **PARTIAL**. Il manque au contrat
  de dump l'état texture actif des slots directs et le blend/depth state par draw.

La suite minimale, si une fidélité UI/effets stricte est requise, est d'étendre une
future version du writer avec l'identité du `SetTexture(stage0)`, les états blend/
depth et leur build-id. Ce lot ne justifie pas une capture live supplémentaire pour
fermer les défauts UV du fond.
