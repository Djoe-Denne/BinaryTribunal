# PROMPT — Texture capture & PNG fidèle (lot 14, v8, LIVE + offline)

> Nouveau lot. Mission : capturer les **textures** (pages + CLUTs) référencées par les draw lists
> pendant une session live, et produire des **PNG pixel-fidèles** (sampling + palette) — le dernier
> maillon avant le backend graphique moderne (Étape B ; la géométrie est déjà prouvée byte-exact).
> Livrable : dumps binaires (géométrie + textures) + décodeur v2 + PNG texturés menu/bataille/Fireaga
> + rapport PASS/FAIL + hashes + commit code.

## 0. Établi (ne pas refaire)

- **v7.1 en place et prouvé** (STRICT PASS 0 resync, 25/09 20:09) : capture par node (slots 43–64,
  arg_1 = node), ring RAM 64 Mo, **flush binaire `fopen "ab"`** (le mode texte `"a"` = cause racine
  du bug CRLF du lot 13 — NE JAMAIS revenir en mode texte), sidecar `gfx_passthrough.dump`
  armé 16 frames, gardes SEH + caps, CSV v6.1 intact, slot 20 fnptr natif intact.
  Déployé : `F7A9B39B…E4F`. Décodeur : `tools/_tmp_af3dn_drop/decode/` (`--strict` = défaut pour
  les dumps futurs), selftest 28/28, rasteriseur software painter-order.
- **Closure géométrie fermée** (README passthrough §8.3) : 48/49/50 = walk direct `0x43E24A`
  (vcount@+0x0C, verts@+0x14, icount@+0x18, idx@+0x20, FVF 0x1C4) ; 51/60 = VB batch `0x43E356`/
  `0x43E692` (remaining@+0x08, verts@+0x14, idx@+0x20, ids u8/groupe @+0x28, geom=+0x2C,
  vcount=*(geom+0x3C)×rem, icount=*(geom+0x40)×rem) ; 57/58/59 direct FVF 0x1E2 ; 63/64 linelist ;
  setups 43–47/52–56/61–62 = node jamais lu. Curseurs natifs locaux, pas de writeback du node.
- **Ancres texture connues** (à fermer, pas à inventer) : le consumer direct `0x43E24A` lit
  `texinfo = *(node+0x2C)` puis `page = *(texinfo+0x10)` (flag `*(page+0x14)`) et le bias UV
  `[texinfo+0x28/0x2C] × [arg_8+0xBF8/0xBFC]` ; la chaîne frame passe par
  `Gfx_SelectTexturePageDrawList 0x465CE0` (abi-spec §6). Pour le **VB batch (51/60)**, le chemin
  texture (via `geom = *(node+0x2C)`) est à fermer en IDB — probablement le même descripteur.
- **UV déjà dans les vertices** : FVF 0x1C4 = X@0, Y@4, Z@8, RHW@12, DIFFUSE@16, SPECULAR@20,
  **U@24, V@28** (floats, mapping direct). Les PNG v7 montrent la géométrie ; il manque les pixels.
- Protocole launcher/observateur rodé (`ff8_watch4.ps1`/`ff8_watch5.ps1`) ; leçon lot 13 :
  **purger `.bin`/`.log` du répertoire jeu avant chaque trigger** (les appends croisés corrompent
  les en-têtes au CRLF, cf. `captures\mixed_append.bin`).
- Slots mesurés en bataille (profil d'or) : 51, 47, 49, 45, 44, 63/61, 64/62 (+ RS 29, scene 39).

## 1. Préparation (jeu éteint)

1. **Closure texture obligatoire d'abord (IDB, zéro offset inventé)** :
   - chemin complet `node+0x2C → geom → texinfo → page` pour les deux paths (direct 48–50/57–59/63–64
     ET VB batch 51/60) — avec pour ground truth : disasm live `0x43E356`/`0x43E692`, decomp
     `0x43E24A`, et `0x465CE0` (Gfx_SelectTexturePageDrawList, IDB) ;
   - déterminer : layout de la page (largeur/hauteur/depth 4bpp/8bpp/16bpp ?), adresse des pixels
     (VRA du D3D surface object ? pointer direct ?), CLUT (adresse + format, ≤256 entrées),
     et le mapping UV→pixels (page-wrapped ? tile ?) ;
   - livrable : table de closure `slot → EA → chemin de déréférencement page/CLUT` écrite dans le
     contrat du `.c` — si un chemin reste ambigu : capture node-only + escalade, jamais d'invention.
2. **DLL v8** : étendre DumpNode d'un **payload texture** :
   - record auto-descriptif `TX07` (magic, page_addr, w, h, depth, clut_addr, clut_count,
     build-id u32 du writer, pixels[], clut[]) — émis UNE fois par page **dédupliquée par
     adresse** (table des pages déjà copiées pour le frame courant), AVANT ou APRÈS le record
     node qui la référence (ordre documenté) ;
   - copie SEH bornée (page ≤ 128×256×8bpp = 32 Ko ; cap 64 pages/frame) ;
   - **build-id u32 dans CHAQUE record** (ND07 et TX07) — leçon « déployé ≠ cru déployé » ;
   - flush binaire inchangé (`"ab"`) ; sidecar inchangé ; purge `.bin`/`.log` par trigger (script collector).
3. **Décodeur v2** :
   - lit ND07 + TX07 ; mappe page_addr/CLUT → node ; sampling **point** (PSX-style) + palette CLUT
     (4bpp → 16 sous-palettes par tile si applicable, 8bpp → 256 entrées, 16bpp direct) ;
     UV wrap selon la closure ; blending v1 = opaque (alpha/blend en v3 si closure simple) ;
   - `info` : stats textures (pages uniques, dédup ratio, bpp counts) ; `render` : PNG texturés ;
   - selftest étendu (texture synthétique 4bpp + CLUT → pixel checks programmatiques).

## 2. Run live (protocole rodé — launcher/observateur/exit)

- Purge `.bin`/`.log` du répertoire jeu → launcher prêt → observateur armé → Play.
- **Menu** ~10 s → sidecar → dump menu. **Bataille** → sidecar → baseline.
- **Fireaga** : signal au cast → dump pendant l'effet. Quelques attaques → ~1 min → **sortie propre**.
- Déploiement : **hasher le DLL déployé après copie** (leçon drift) + observateur logge le module.

## 3. Critères PASS

1. PNG menu **texturé** : éléments identifiables avec leurs textures (vs fill plat v7) — l'œil
   de l'opérateur reste la validation finale.
2. PNG bataille/Fireaga texturés : silhouettes + textures conformes à ce que le jeu affichait.
3. Parser strict : 0 resync, 0 implausible, build-id cohérent dans tous les records.
4. 0 AV, 0 WER.
5. Perf : dédup efficace (pages uniques/frame raisonnable), ring jamais saturé, pas de stutter.

## 4. Échecs attendus → réponses

- **Pages illisibles** (VRAM/page objets summarizés) : SEH → skip + fails ; ratio > 20 % = mauvais
  chemin de closure → re-lire `0x465CE0`/`0x43E24A`/`0x43E356` en IDB. Ne pas improviser.
- **Textures fausses couleurs / moirées** : layout bpp/CLUT/tile faux → relire la closure (les UV
  sont déjà corrects — la preuve v7 : `uv` plausibles dans info). Point sampling d'abord, pas de filtrage.
- **Ring plein** (frames texturées denses) : dédup par adresse + cap 64 pages/frame + drops visibles
  au `.log` (dégradation silencieuse prévue, comme lot 13).
- **Textures dynamiques** (réécrites par frame) : capture au vol obligatoire — même leçon que la
  géométrie ; la dédup par adresse capture l'état au premier hit du frame (documenter le biais).
- **0 dump texture** : vérifier le sidecar (chemin à côté de la DLL) et que les records `TX07`
  avancent (le `.log` du flush doit compter les pages).
- **PNG illisible** : la source = le decomp/l'IDB (walker `0x4178D7`, consumer `0x43E24A`,
  select `0x465CE0`, VB `0x43E356`). Ne pas improviser.

## 5. Livrables

- DLL v8 (`AF3DN.P`) + dumps binaires (ND07 + TX07) + décodeur v2 + PNG texturés menu/bataille/Fireaga
  + rapport PASS/FAIL (critères ci-dessus) + hashes + commit code.
- Mise à jour `README.md` passthrough (§9 textures) + `driver-abi-spec.md` (§6.2 : contrats texture
  confirmés par le live, deltas éventuels vs IDB) + build-id documenté.
- Ingest evidence + wiki-scribe en clôture (comme lot 13).

## Interdits

- Pas de debugger attaché pendant les runs ; un seul processus de jeu ; la copie hash-bound des
  campagnes d'evidence intouchée ; pas d'écriture disque dans le detour draw ; jamais de slot stubbé
  sans fnptr natif ; pas de modification de l'exe sur disque ; la copie `.bak` (FFNx) reste intouchée ;
  **mode texte fopen proscrit** (bug lot 13) ; le build-id doit être présent dans chaque record.
