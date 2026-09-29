# PROMPT — Lot 18 : terrain & UI précédents des frames battle + convivialité (post-lot 17)

> Suite directe du lot 17 ré Ticulouse (commits `580e0ad`, `38081fb`).
> Le lot 17 a fermé le rendu FIDÈLE des **entités** (monstre ocre/vert-turquoise,
> Zell/Squall/Irvine) via (1) le bug raster AB↔C corrigé, (2) le bindings palettes
> miroir mesurés par correspondance 256 couleurs BGRA↔PSX555, (3) la préservation
> bit-exact des UV f32. Ce que le lot 18 vise = la COMPOSiTion complète : terrain,
> UI, ciel, blending STP, perspective.

## 0. Établi (NE PAS refaire)

- La chaîne complète DAT→TIM→VRAM→TPage→UV est fermée (commit c9ad02d) —
  CLOSURE_tim-vram-tpage.md + 3 decomp.
- Le replay des entités battle13 est FIDÈLE (preuve : `lot17_v3_cache\battle13_vs_reference.png`).
- Le raster v3 (lot17_texture_window.py) est l'oracle : latch 24 bits, origine/clamp W/H,
  erreur `MissingEvidence` explicite pour le packet absent ; CLUT/bandes 2×512 B stride 0x800 ;
  conventions PC BGRA validées.
- Décodeur BUILD_ID paramétrable (`expected_build` 0x563D v10.3 / 0x563E v11).
- Protocole live rodé (purge, trigger, F12 en rafale, collecte, hash).
- Le miroir TX07 contient les tpages ciel 16-17 (déjà exploitables pour le fond).
- La capture battle13 ne contient **ni les UV u8 ni le packet fenêtre** : W=128 fausse
  piste installée à battle13, W=256 est le candidat cohérent (voir CAMPAIGN §1).

## 1. Travail lot 18 (offline d'abord)

1. **Terrain stats slot 51** : les records « terrain rocheux » vs UI vs autres — la
   séparation exacte est documentée dans la campagne (audit en tri de classes). Compléter
   la classification par mapping texobj↔rôle (terrain/UI/effet/entité) pour TOUTES les
   frames de battle13.
2. **Composé complet battlefield13** : raster composer terrain + UI + entités avec le
   painter order (existant), la modulation DIFFUSE correcte, la perspective RHW (déjà
  imotoéchaines lot 17),sans application de blend STP ni depth dans la v1.
3. **Texture window W/H packet** : à définitivement tracer depuis une fenêtre live
   (lecture seule RPM) OU à prouver via primitive packet statique. Si le packet battle13
   est actif, W=128 vs 256 disputent le candidat fidèle. Sonde :
   `*(u32*)(pkt+4) @0x45BC65`.
4. **Ciel composé** : tpages 16-17 du miroir (texture nuages identifiée planche lot 15),
   aucune capture nécessaire.
5. **Blend STP half-transparency** : juge les cases (compte rendu CAPA 382/8192 entrées
   STP=0x7F) — constituer le rendu blend v2 (50 %) hors IDB, comparaison vs réf.

## 2. Phase 2 (selon le verdict)

- Si les 256 couleurs sont cohérentes : composite PNG complet + rapport rapport.
- Si les vielles/lames persistent sur une famille précise : le diagnostic ciblé
  `sub_507400/W` avant tout codage.

## 2. Critères PASS lot 18

- **PNG battle13 AU COMPLET** : terrain + UI bars + entités, comparaison côte à côte,
  référence = `battle13\refs\ref_battle13.jpg`
- Terrain mapping par texobj (H1/H2 fermée pour tous les objets de la frame)
- Fenêtre packet ferme (ou explicitement UNPROVEN avec le protocole de sonde live)
- Selftest PASS, test_lot17.py PASS, 0 AV, 0 WER
- Ingest obsidian (avec --evidence explicites)

## Interdits

Pass debugger, un seul process, pas d'écriture disque au detour, mode texte fopen
proscrit, build-id dans chaque record, **zéro offset inventé** — IDB lecture seule et
sans écriture discutable (seuls set_func_cmt parent-push(es) dédiés le cas échéant).
Observations factuelles avant sur-interprétations (leçon lot 15 §6).
