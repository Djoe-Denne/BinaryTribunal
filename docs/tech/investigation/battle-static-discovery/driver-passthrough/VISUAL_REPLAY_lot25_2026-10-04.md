# Lot 25 — nouveau rendu réel, baseline Lot 21 conservée

## Correction de présentation

La planche `visual-progress-20261004/FF8_visual_progress.png` assemblait des
images Lot 20 existantes. Malgré son étiquette historique, elle ne répondait
pas à la demande d'un nouveau rendu et omettait les corrections déjà obtenues
au Lot 21. Elle ne doit pas servir de témoin de l'avancement actuel.

La bonne baseline est `lot21/battle_v13/visuals/LOT21_composite_pair.png` et le
renderer Lot 21 : UV capturés sans rotation supplémentaire, RHW, composition
ciel/horizon/terrain/acteurs/UI. Les travaux Lot 22–24 portent principalement
sur les états bruts, contrats de capture, preuves et instrumentation ; ils
n'avaient pas été intégrés à une nouvelle politique de rasterisation appliquée.

## Contrôle réellement régénéré

Le renderer Lot 21 inchangé a été relancé sur la frame 7105 de son entrée
historique, dans un **nouveau** répertoire :
`tools/_tmp_af3dn_drop/captures/lot25-render-lot21-control-20261004/`.

- Sept sorties calculées ; zéro warning ; exit 0.
- Composite de contrôle byte-identique au composite historique Lot 21 :
  `a69956822521a3e4beaaf9cbb73483797fe788c8cb53de9f4d6ce86d8a4c0b45`.
- Renderer Lot 21 inchangé :
  `ec4e91c895cdcc04d73b5a7f2f6805f1ea5ef68efc4389049c5772681c6f8421`.

Les anciennes images n'ont pas été utilisées comme entrées de rasterisation.
La comparaison des hashes a eu lieu **après** génération du contrôle.

## Nouveau rendu depuis la capture récente

Entrée : `tools/_tmp_af3dn_drop/captures/lot25-pass2/gfx_passthrough_dump.bin`,
build réel `0x5643`, frame **3556**, SHA-256 :
`35228f93d94801478d45c4ae83ee128e8b0c9b854fc36bd77e3d70f1abd02085`.

Nouveaux modules :

- `lot25_render_input.py` : validation stricte du build et des ST09/ND/TX/TR,
  puis objets géométrie/textures construits depuis les slices validées.
  Aucun réétiquetage en v13, aucune réparation d'indices, offsets et buffers
  originaux conservés. ST09 reste disponible pour la provenance.
- `render_lot25.py` : réutilise les fonctions de rasterisation Lot 21 sans
  modifier `ff8dump.py`, `render_lot17.py` ou `render_lot21.py`.

Commande :

```powershell
python -B tools/af3dn_state/render_lot25.py `
  tools/_tmp_af3dn_drop/captures/lot25-pass2/gfx_passthrough_dump.bin `
  --build 0x5643 --seq 3556 `
  --out tools/_tmp_af3dn_drop/captures/lot25-fresh-raster-20261004-seq3556
```

Le dossier de sortie existant est refusé, pour ne pas écraser une génération.

Résultat : 119 records géométriques ; 116 slot51 texturés (ciel 1, horizon 3,
terrain 6, acteurs 84, UI 22) et 3 slot49 non liés, rendus séparément en
diagnostic diffuse. Cinq nouveaux PNG : composite, alpha opaque diagnostique,
ordre hôte diagnostique, slot49 non lié, A/B alpha sur **la même nouvelle
frame**, sans référence native inventée.

Composite : `LOT25_seq3556_composite.png`, 640×480, SHA-256 :
`6dd41a393ba7b0f0c045f8c99547437869f688cba8a07fbd2e763b83a1d28320`.
Tous ses pixels viennent des vertices/indices/ressources de la capture récente,
pas de PNG historiques. Provenance complète : `manifest.json` voisin.

## Validation du raccordement

- Sweep Python : **292 tests, OK**, exit réel 0 ; log conservé dans le nouveau
  dossier de rendu (`tests.log`).
- Les cinq PNG se décodent et leurs hashes correspondent au manifest ; le
  hash de la capture source est inchangé après rasterisation.
- Aucun diff sur les oracles `ff8dump.py`, `render_lot17.py`, `render_lot21.py`.
- Les trois nouveaux modules passent le parsing Python et ne présentent pas
  d'espaces terminaux. Le `git diff --check` global signale des lignes vides
  finales dans les configs agents préexistantes, hors périmètre et non touchées.

## Ce que cela démontre, et ce que cela ne démontre pas

- Nouveau rendu calculé et codecs récents raccordés au renderer : **oui**.
- Corrections Lot 21 conservées : **oui**, contrôle identique à la baseline.
- Nouvelle amélioration démontrée de fidélité visuelle due aux états Lot 22–24 :
  **non**. Les RS/blend observés restent bruts et ne sont pas appliqués par ce
  modèle ; les approximations alpha et ordre par couches restent déclarées.
- Kinds 8/9 dans cette frame : **0/0**, footers STAGE0_VALID : **0**.
  Le renderer ne fabrique pas de binding hérité pour les slot49.
- Screenshot natif correspondant à cette fenêtre : **absent** ; aucune
  comparaison native same-frame ni score de fidélité ne sont revendiqués.

La suite live a été suspendue sans armement : DLL du jeu restauré byte-exact
depuis l'archive pré-déploiement et sidecar stage0 retiré. Les captures, sources
et images antérieures sont conservées ; aucun nouveau commit/push effectué.
