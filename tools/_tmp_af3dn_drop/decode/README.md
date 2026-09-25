# FF8 draw-list dump decoder (lot 13, `ND07`)

Décodage **offline** des dumps draw-list battle FF8 (slots 43–64, capturés par node par la DLL
v7) + rasteriseur **software** → PNG. Zéro API graphique : fill de triangles sur framebuffer RGB
bytearray, PIL sert uniquement de conteneur/encodeur PNG. Dépendances : stdlib + Pillow.

## Usage

```powershell
python selftest.py                        # chaîne complète sur dump synthétique -> SELFTEST PASS
python ff8dump.py info <dump.bin>         # stats par frame + globales (--json dispo)
python ff8dump.py render <dump.bin> --out frames [--frames N] [--width 640 --height 480]
                                          #   [--wire] [--scale 1] [--packet-layout packed|psxq]
```

`render` écrit `frame_<seq:06d>.png` (une image par `seq`) dans `--out`. Une frame = tous les
enregistrements de même `seq`, dans l'ordre du fichier ; cet ordre est l'ordre de draw exact
(painter's algorithm, pas de z-buffer) car les slots 43–64 sont appelés par node via
`Gfx_WalkDrawList` (next à node+0).

## Format du dump (contrat v7, little-endian, pas d'en-tête global)

```
Par node capturé:
u32 magic 'ND07' (0x3730444E)   u32 slot (43..64)   u32 seq    u32 ctx
u32 node_addr                   u32 geom_kind       u32 fails  u32 payload_size
u8  node[24]                                        payload:
  kind 0: (rien)
  kind 1: u32 prim (3=FT3, 4=FT4) ; u8 packet[40]
  kind 2: u32 vcount ; u32 icount ; u16 idx[icount] ; u16 pad[icount&1] ; u8 fvf[vcount*32]
```

`payload_size` compte **tous les octets qui suivent ce champ** : `node[24]` + payload
(record total = 32 + `payload_size`). Le bloc `idx` est paddé à 4 octets
(`u16 pad[icount&1]`, zéros) avant le blob FVF.

Vertex FVF `0x1C4` = XYZRHW|DIFFUSE|SPECULAR|TEX1, 32 octets, déjà en screen-space
(`0x43E24A__RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4.md`) :
f32 X@0, Y@4, Z@8, RHW@12 ; u32 DIFFUSE (ARGB)@16 ; u32 SPECULAR@20 ; f32 U@24, V@28.
OT node 24 o ; POLY_FT3 32 o / FT4 40 o (`driver-abi-spec.md` §8).

Parser : magic inconnu ou fichier tronqué → erreur propre avec offset, exit code ≠ 0.
Slots hors 43–64 et payload avec octets supplémentaires → warning (non bloquant).

## Rendu v1

- kind 2 : TRIANGLELIST — via indices si `icount>0` (`icount/3` tris), sinon `vcount/3` tris
  directs. Fill plat, couleur = DIFFUSE du 1er vertex du triangle ; `alpha < 8` → triangle
  ignoré (seuil alpha-test D3D).
- kind 1 : **LOW-CONFIDENCE** — fallback 2D, paires (x,y) int16 LE lues dans le packet,
  fill jaune fixe (`255,200,0`, layout couleur du packet non tranché), sortie CLI flaggée
  `LOW-CONFIDENCE`. Deux lectures du layout (l'énoncé du contrat mélange les deux) :
  - `--packet-layout packed` (défaut) : paires contiguës 4 octets — tri1 @8,12,16 ;
    FT4 tri2 @12,16,20 (lecture littérale « x1y1@12, x2y2@16 »).
  - `--packet-layout psxq` : layout Psy-Q POLY_FT3/FT4 (u/v intercalés, stride 8) —
    tri1 @8,16,24 ; FT4 tri2 @16,24,32 (le « +24 » du contrat correspond à x2y2@0x18).
- Clip Sutherland–Hodgman au viewport, arrondi half-up, `--scale` multiplie les coordonnées
  (augmenter aussi `--width/--height` pour un PNG plus grand). `--wire` = Bresenham blanc
  par-dessus le fill.

## Limites v1

- Pas de texture : U/V reportés dans `info` (bbox/plage), jamais échantillonnés. SPECULAR ignoré.
- Fill plat (1er vertex), pas de Gouraud ; fill rule inclusive → léger sur-dessin possible sur
  arêtes partagées.
- kind 1 non certifié (layout PSX packet non confirmé par decomp) → sortie flaggée LOW-CONFIDENCE.
- La résolution du dump n'est pas portée dans le format ; viewport = `--width/--height` (640×480).

## Fichiers

- `ff8dump.py` — parseur + stats (`info`) + orchestration du rendu (`render`), CLI.
- `raster.py` — rasteriseur software (framebuffer RGB, clip, fill half-space, Bresenham).
- `selftest.py` — dump synthétique (2 records kind 2 : triangle rouge direct + quad bleu
  indexé), exécute info+render, vérifie les pixels via PIL, `SELFTEST PASS/FAIL`.
- `selftest_out/` — sorties du selftest (dump, PNGs), conservées pour inspection.
