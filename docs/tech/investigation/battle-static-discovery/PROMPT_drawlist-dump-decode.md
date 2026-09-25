# PROMPT — Draw-list dump & decode (lot 13, LIVE + offline)

> Nouveau chat. Mission : capturer le **contenu mémoire** des draw lists (nodes 24 o +
> vertices GPU 32 o) pendant une session live, décoder la géométrie hors-ligne, et
> **valider par rendu PNG** (rasteriseur software, sans API graphique). Livrable :
> dumps binaires + décodeur + PNG de référence + rapport. C'est le socle de tout
> backend graphique moderne (Étape B/C de la feuille de route ; milestones U29.4/U29.5).

## 0. Établi (ne pas refaire)

- **v6.1 en place et prouvée** (25/09) : `AF3DN.P` drop-in + forwards `dotemu*` vers
  `dotemu_orig.dll` ; wrap du driver natif **au present dispatch (`0x41DF0C`)** ; boot
  natif 100 % (case 0 DDrawAlt, `#checkreg,ret=1,sel=0,b88=1`) ; campagne complète menée
  (9 650 frames, 2× Fireaga en bataille, sortie propre). Rapport :
  `driver-drop-test-af3dn-2026-09-25.md`. Protocole launcher/observateur rodé.
- **Golden trace** : `tools/_tmp_af3dn_drop/gfx_passthrough_v6.1_campaign.csv`
  (99,2 Mo, SHA256 `EB5FDCA3…BC23826`) — pointeurs loggés (ctx, node, arg), PAS le contenu.
- **Backend natif réel = DDrawAlt (case 0, ctor `0x4257D0`)** — le ctor OpenGL `0x4252B0`
  échoue en live sur ce port. Slots natifs DDrawAlt de rendu : `0x43E24A`
  (`RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4`), `RenderDDrawAlt_SetRenderState`
  (`0x440FF0`), `RenderDDrawAlt_SelectRenderTarget` (`0x44235D`), `RenderDDrawAlt_BeginScene`
  (`0x442409`), `RenderDDrawAlt_LeaveScene` (`0x44250E`).
- **Sources de vérité du décodage** (décomp existantes, à lire avant toute implémentation) :
  `decomp/0x4178D7__Gfx_WalkDrawList.md` (le walker : ordre de traversée, guards genptr/
  genstamp, format des appels slots 43–64), `decomp/0x43E24A__RenderDDrawAlt_
  DrawIndexedPrimitive_FVF1C4.md` (le consommateur final : FVF `0x1C4`, 32 o/vertex),
  `driver-abi-spec.md` §6 (draw lists) et §8 (structures byte-exactes : `GfxDrawList` 0xEC
  — +0x18 ctx, +0x34 genptr, +0x58 genstamp, +0x94 head, +0x9C setup, +0xA0 walk ; OT node
  24 o ; OT battle 4386 buckets stride 0x9B88 ; POLY_FT3 32 o / FT4 40 o ; vertex GPU 32 o).
- **Vertices GPU = déjà transformés** : FVF `0x1C4` = XYZRHW (4 floats, screen-space) +
  DIFFUSE + SPECULAR + TEX1 = 32 o → le rendu offline est une **rasterisation 2D directe**
  (pas de matrices).
- Slots mesurés en bataille (profil d'or) : 29 ×845 054, 51 ×494 942, 47 ×237 943,
  39 ×102 159, 49 ×28 626, 44 ×20 034, 45 ×8 236, 63/61 ×200, 64/62 ×50.
- **Slot 20 = copie fnptr natif** (jamais stub) — règle intangible, v6.1 prouvé.

## 1. Préparation (jeu éteint)

1. **DLL v7** : étendre les wrappers 43–64 (priorité **slot 51**, le plus fréquent ; puis
   47/49/45/44) d'un **dump mémoire au vol** :
   - au premier slot d'un frame ciblé : suivre le chaînage des nodes (`next` pointer),
     **borné** (max 4096 nodes, cap anti-boucle par `genstamp`/adresse visitée) ;
   - par node : copier les **24 o** (accès SEH — même guards que `Gfx_WalkDrawList`) ;
   - par node à géométrie : copier les **vertices** (32 o × count, via les pointeurs du
     node, SEH — skip + compteur `fails` si page illisible) ;
   - sortie : **ring buffer RAM** (compte le budget), **flush disque différé au present
     dispatch** (nous y sommes déjà hookés) — **jamais d'IO dans le detour draw**.
2. **Format dump binaire** : en-tête frame (`seq, slot, ctx, gen, stamp, node_count,
   vertex_count, fails`) + nodes bruts + vertices bruts. **Le décodage est hors-ligne** :
   le detour ne fait que du `memcpy` borné.
3. **Déclencheur** : fichier sidecar `gfx_passthrough.dump` présent à côté de la DLL →
   dump des **prochains 16 frames** puis suppression auto du sidecar (re-créer pour
   redéclencher). Manipulable en live par l'observateur.
4. **Décodeur offline** (outil séparé, Python ou C, dans
   `tools/_tmp_af3dn_drop/decode/`) : lit le dump, reconstruit les listes, rasterise
   (triangles : flat fill + wireframe overlay, couleur diffuse, pas de texture en v1) →
   **PNG** par frame. La spec du décodage = **le walker `0x4178D7` transcrit ligne à ligne**.

## 2. Run live (protocole launcher/observateur — inchangé)

- Launcher prêt → signal → observateur armé (durée, exit code) → Play.
- **Menu** : laisser ~10 s de rendu → déclencher le dump (créer le sidecar) → dump menu.
- **Field → bataille** : déclencher à nouveau → **1 Fireaga** (dump pendant l'effet) →
  quelques attaques → ~1 min de bataille → sortie propre.
- L'observateur collecte : durée, exit code, CSV, dumps.

## 3. Critères PASS

1. Dump **menu** : ≥1 frame décodé avec des primitives cohérentes (FT3/FT4, counts et
   bornes plausibles, UV dans [0,1] ou page-_wrapped, positions écran dans la résolution).
2. Dump **bataille** : frames Fireaga distincts du menu (densité de primitives et contenu
   différents).
3. **PNG hors-ligne reconnaissable** (silhouettes/scène conforme à ce que le jeu affichait
   — la validation finale est l'œil de l'opérateur).
4. **0 AV, 0 WER** — le jeu survit à tous les dumps.
5. Perf : aucun stutter perceptible au-delà de ce que le dump autorise (le detour reste
   `memcpy`-borné).

## 4. Échecs attendus → réponses

- **AV dans le detour draw** : lifetime des nodes (réécrits/frame suivant) → le dump au vol
  est obligatoire ; vérifier le cap de chaînage (boucle `next` circulaire).
- **Vertices illisibles** (page libre/summarized) : SEH → skip + `fails++` — compte-les
  (un ratio > 20 % = mauvais pointeur de vertices, re-lire le walker).
- **PNG illisible** : erreur de spec → relire `0x4178D7` (ordre de traversal, offsets
  node→vertices) et `0x43E24A` (interprétation FVF). Ne pas improviser : la source
  = le decomp.
- **Stutter / frame time** : réduire les frames dumpées ou le cap de nodes.
- **0 dump** : vérifier le sidecar (chemin à côté de la DLL, pas du jeu) et que le slot 51
  est bien atteint (le CSV slot 51 doit avancer).

## 5. Livrables

- DLL v7 (`AF3DN.P`) + dumps binaires + décodeur + PNG menu/bataille + rapport PASS/FAIL
  (critères ci-dessus) + hashes + commit code.
- Mise à jour `README.md` passthrough (§ dump) + `driver-abi-spec.md` (§ draw lists :
  format node/vertices confirmé par le live, deltas éventuels vs decomp).

## Interdits

- Pas de debugger attaché pendant les runs ; un seul processus de jeu ; la copie
  hash-bound des campagnes d'evidence intouchée ; pas d'écriture disque dans le detour
  draw ; jamais de slot stubbé sans fnptr natif (leçon slot 20) ; pas de modification de
  l'exe sur disque ; la copie `.bak` (FFNx) reste intouchée.
