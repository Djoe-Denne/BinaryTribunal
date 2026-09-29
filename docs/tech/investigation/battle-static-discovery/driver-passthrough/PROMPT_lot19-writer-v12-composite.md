# PROMPT — Lot 19 : writer v12 + spécification depth/z-order battle + composite final

> Suite directe du lot 18 (`CAMPAIGN_lot18_2026-09-29.md`, commit `f5befeb`).
> Le lot 18 a livré : la classification 12 classes complet, le chemin miroir byte-exact
> (entités x=1280..1792 @y=0, terrain @(256,256)+(512,256)), et la preuve **mesurée**
> que les RHW terrain/entités partagent le même range (3.7e-5..1.0e-4) → aucun test
> offline ne discrimine la profondeur. Le z-order réel = la logique battle (OT PSX).
> Le lot 19 = la capture enrichie (v12) + l'épinglage IDB du z-order, puis le composite.

## 0. Établi (NE PAS refaire)

- Chaîne DAT→TIM→VRAM→TPage→UV fermée (`c9ad02d`, CLOSURE_tim-vram-tpage.md +
  decomp 0x507400/0x509E00/0x45BC60). Raster v3 = oracle (lot17_texture_window.py) :
  `MissingEvidence` explicite, CLUT/bandes 2×512 B stride 0x800, PC BGRA validé.
- Replay entités battle13 FIDÈLE (`lot17_v3_cache\battle13_vs_reference.png`).
- `ids[]` footer = index locaux du cache PC (contre-exemples mesurés : DE70 id0→row225,
  EEC0 id0→row226, FEE0 id0→row228, BE60 id0→row231, CE70 id0→row232).
- Painter spans réels de la frame 2976 (mesurés, commit f5befeb) :
  UI 1-41, persos 43-89, monstre 91-116, terrain 118-126, effets 128-156.
- Le miroir TX07 porte : clamp/latch, bandes système, tpages ciel 16-17, terrain
  (256,256)/(512,256), battle strip x≥1280.
- BUILD_ID paramétrable (`expected_build` 0x563D/0x563E). Protocole live rodé
  (purge → trigger → F12 rafale pendant la fenêtre → collecte → hash).
- Captures lot 14-15 valides (STRICT PASS). Aucune sonde live lancée à ce jour pour
  W_window/packet fenêtre.

## 1. Writer v12 — extensions (build-id `0x563F`)

Trois champs ADD au footer ND08 existant (tpage|mode|clut|id_count|ids|dropped_ids|texobj),
chaînes EA à valider au login :

1. **`u32 window_word`** : le word fenêtre consommé @0x45BC65 (le packet TPage
   actif à T_draw) — SEH-guard, 0 si fail (style page_probe). Ferme le discriminant
   W=128 vs 256 définitivement.
2. **`u32 clut_sys_id`** : la référence CLUT système active au T_draw
   (formule `sub_45B920` : `0x1B47818 + 2048*(clut>>6) + 32*(clut&0x3F)`).

3. *(optionnel, si le composite en a besoin)* **`u32 zot`** : le z/dépth battle-logic
   du record (peut-être l'entier OT z-sort) — à éprouver via IDB d'abord.

Gate : `ff8-dump-writer-verify` après build (exports inchangés 14/14, fopen binaire,
build-id dans chaque record, gardes). Une seule fenêtre live : boot → bataille → PAUSE
→ trigger 16 frames → F12 rafale PENDANT la fenêtre → collecte + sonde.

## 2. Décodeur v4 — ordre des actions (offline dès la capture v12)

1. **Fenêtre W/H par record** depuis `window_word` fermé (on arbitre 128 vs 256 par
   la DONNÉE, plus jamais deviné).
2. Palettes = bindings miroir mesurés (chaîne lot 17), BGR/PC BGRA conservé.
3. **Z-order composite** : painter = la logique battle — trier les records par
   (zot si capté, sinon span painter ordinaire) et composer terrain → entités → UI
   dans le RHW-z know-order.
4. **Blend STP** : les records dont la palette a des entrées byte3=0x7F (half-transp
   PSX) blend 50 % avec le fond dessiné (compte rendu lot 15 : 382 tris alpha).
5. Le composite final = **PNG battle13 AU COMPLET**, comparaison côte à côte réf.

## 3. IDB (lecture seule, push parent-dedicated)

- Épingler la chaîne **OT-emitters** et le z-sort : où les primitives battle sont
  triées z (le champ battle-logic du draw-list), EA-citer avant de coder (zot).
- Compléter/commenter les 5 ancres push si besoin (tag `[semantic-triple YYYY-MM-DD lot19]`).

## 3. Critères PASS lot 19

1. **PNG battle13 AU COMPLET** (terrain + UI + entités + [ciel si composé]) — côte
   à côte `battle13\refs\ref_battle13.jpg`, fidélité de reconnaissance immédiate.
2. `window_word`/`W_window` : FERMÉ par la donnée (128 ou 256 tranché).
3. Reader v4 : BGR/selftest PASS, test_lot17 PASS, 0 AV, 0 WER, parser strict.
4. Ingest obsidian (`--evidence`/vault explicites).

## Interdits

Pas de debugger, un seul process, pas d'écriture disque au detour, mode texte fopen
proscrit, build-id dans chaque record, **zéro offset inventé** — chaque champ nouveau
de footer = EA pré-cité par la closure (c9ad02d) ou validé en IDB AVANT codage.
IDB propre du parent.
