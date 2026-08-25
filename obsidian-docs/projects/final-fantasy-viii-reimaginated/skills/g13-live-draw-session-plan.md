---
title: G13 Live Draw Session Plan
category: skills
tags: [ff8, battle-system, testing, reverse-engineering, skill]
aliases: [G13 Draw live plan, Draw Cast Stock session]
sources:
  - projects/re-ff8/references/g11-g20-static-readiness-ledger.md
  - projects/re-ff8/references/g11-g20-static-open-questions.md
  - projects/re-ff8/concepts/draw-magic-and-render-bridge.md
  - projects/re-ff8/concepts/command-action-pipeline.md
  - projects/re-ff8/skills/ff8-live-validation-operations.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-offline-draft-2026-08-19.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g12-item-live-promotion-2026-08-25.md
  - C:/Users/djden/source/repos/retro-eng/re-ff8/ai-prompt/todo/g13-live-draw-observe-session-new-chat.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-observe-fire-plus-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-observe-fire-plus-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-observe-review-and-phase-b-design-2026-08-25.md
  - C:/Users/djden/source/repos/retro-eng/re-ff8/ai-prompt/todo/g13-live-draw-phase-b-new-chat.md
  - C:/Users/djden/source/repos/retro-eng/re-ff8/ai-prompt/todo/g13-live-draw-direct-replacement-new-chat.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-confirm-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-confirm-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-b1-arm-authorized-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-b1-observe-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-b1-armed-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-stock-replacement-retry3-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-stock-replacement-retry3-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-cast-replacement-retry3-2026-08-25.md
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/battle-iso/p0-g13-draw-cast-replacement-retry3-live-2026-08-25.json
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/evidence/g13-draw-live-promotion-2026-08-25.md
  - projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation.md
summary: >-
  G13 is live-promoted. PID 22956 produced official Cast and Stock
  collector-PASS envelopes. Presentation remains G14. No global pending
  0x06 enum. SQ-G13-002 remains static-closed-with-cap.
provenance:
  extracted: 0.84
  inferred: 0.12
  ambiguous: 0.04
created: 2026-08-18T15:09:16+02:00
updated: 2026-08-25T21:45:00+02:00
status: live-promoted
---

# G13 Live Draw Session Plan

> [!important] Politique active — direct validated replacement v3
> L'observation native est facultative. Le modèle ne l'ajoute que pour
> résoudre une incertitude nommée : identité binaire non épinglée, contrat
> caller/arguments incomplet, divergence au seam ou variante non couverte.
> Sinon, scénario 2 arme directement et valide caller, menu row, record,
> source, mask et bornes avant toute suppression.
>
> Plan live par défaut : **un Cast remplacé puis un Stock remplacé**, avec
> deux enveloppes séparées. Les variantes de quantité restent couvertes
> offline et ne deviennent live que si une divergence demande diagnostic.

> [!failure] Premier remplacement direct diagnostiqué — PID 49568
> L'appel Cast exact a été intercepté, puis le préflight a inversé les bytes
> `aux_5` mode et `aux_6` source du record QueueOrStore. Résultat : fail-stop,
> écran noir avec pointeur, aucune preuve de remplacement. Diagnostic
> `674f98fe…a7ba6d0`. Le décodage est corrigé dans la DLL
> `6ac01d56…6c0841b`; build, contrats et 35/35 CTest passent. Nouveau PID
> obligatoire ; `[promotion.G13].satisfied` reste faux.

> [!success] G13 live-promoted — Stock then Cast on PID 22956
> DLL `f47c0481…b8924ada`. Stock `08 00 02 06 02 0a 03 01`, `aux_5=10`,
> stock `0→9`, HP `1710`. Cast `08 00 02 06 02 09 03 01`, `aux_5=9`,
> HP `1710→1155`, stock `9→9`. Collector `PASS` on both envelopes.
> `restore_flags=0x17f` and missing shutdown are not G13 required gates.
> Compiled page:
> [[projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation]].
> `[promotion.G13].satisfied` is true (2026-08-25).

> [!warning] Out of the G11 test campaign
> Do not run this process as G11 evidence. G11 is live-promoted. G12 is
> `live-promoted-semantic` (2026-08-25). SQ-G13-001 has three PID-bound Cast
> dumps (`0x06` on 42248, 46956, 31700). Do not encode that byte as a global enum.

> [!success] Phase A observe PASS — unpromoted
> PID 42248, DLL `ea8e1c0d…dc053f04`, suite `d2aefe3c…768934af`.
> Packed pending `08 00 02 06 02 09 03 01`. Menu row `dword_1D768D8+2 = 0x06`.
> `aux_5=9` Cast, `aux_6=3`, spell id `2` (Fire Plus), `arm_authorized=0`.
> Writer retained. Runtime ended `Detached` with frame / QueueOrStore /
> PendingWrite preimages restored. `[promotion.G13].satisfied` is false.

> [!success] Session 5 is not a prerequisite
> SQ-G13-002 is [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G13-002 — Draw source death|static-closed-with-cap]].
> Do not kill the source and do not run the archived race plan.

> [!success] Historical v2 discriminator review accepted — 2026-08-25
> Independent review of the PID 42248 envelope accepts the packed pending
> as a **PID-bound** discriminator. Under v2, Phase B confirmation was a
> second **shape-identical** QueueOrStore record on a **new** process
> (layout, `command_id=0x06`, `aux_5∈{9,10}`, caller `0x000AF064`,
> independent menu row), not a replay of `08 00 02 06 02 09 03 01`.
> Design note: `FinalFantasy_VIII_Reimaginated/evidence/g13-draw-observe-review-and-phase-b-design-2026-08-25.md`.
> `[promotion.G13].satisfied` stays false. Do not encode
> `kDrawCommandId = 0x06` in `core/`.

> [!success] Phase B0 confirm PASS — unpromoted
> PID 46956, DLL `9edd7784…b22a1c64`, suite `d2aefe3c…768934af`.
> Packed shape `08 00 02 06 02 09 03` + hook-time ready 1; witness ready
> was overlaid from empty attacker slot 2. Independent pending **slot 6**
> later read `08 00 02 06 02 09 03 00`. Menu row `dword_1D768D8+2 = 0x06`.
> `aux_5=9` Cast, caller `0x000AF064`, `arm_authorized=0`. Writer retained.
> Runtime ended `Detached` with frame / QueueOrStore / PendingWrite
> restored. Envelope `06a9d423…5cbd72de`. Scenario 2 was not started on
> this PID. `[promotion.G13].satisfied` is false.

> [!note] Historique v2 — observe, then arm
> L'ancien contrat imposait B0 avant armement et a authentifié la forme.
> `BattlePendingAction_TransferToExecQueue` switches on stored
> pending `command_id`, not resolver `COMMAND_TYPE_ID`. Resolver Draw
> remains 6. PID 31700 proved the gate historique. Ces faits restent des
> preuves utiles, mais ne sont plus un préalable opérationnel en v3.

## Objective

La calibration historique et l'autorisation sont closes. Les deux
remplacements officiels Cast et Stock sont collector-PASS et G13 est promu.
Source death after GetText reste exclu. La présentation Draw est G14.

> [!success] Phase B1 arm authorized — unpromoted
> PID 31700, DLL `474c4194…257b6c2e`. Observe hex `08 00 02 06 02 09 03 01`,
> menu `+2=0x06`, caller `0x000AF064`, `arm_authorized` 0 then 1.
> Envelope observe `bc00a037…296813ac`; armed `c50c442f…cf890c3b`.
> Shutdown was invoked; the process was gone before a restored canary.
> `[promotion.G13].satisfied` is false.

## Setup

- G11 live-promoted and G12 semantically promoted; one caster with free Magic stock capacity.
- Suite facultative scenario `draw-observe-pending` :
  `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\suite-G13-observe.bin`
  (64 bytes, flags `0x2000`, reserved protocol/scenario `3,1`).
- Suite directe `g13-draw-direct-v3`, scenario
  `FF8ISO_G13_DRAW_LIVE_PENDING`, reserved protocol/scenario `3,2` :
  `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated\suite-G13-live.bin`.
- Monster with a known drawable offensive spell and stable tier/resistance.
- Capture baseline `D0`: raw monster draw table/tier, caster/monster stats,
  `K_MAGIC` row, battle Magic stock, RNG, queues, current action and latches.
- Arm a raw pending watch on the unique `PendingCmd_QueueOrStore` path.

## Phase 1 — observation facultative

Sauter cette phase quand la preuve statique épinglée suffit. Si une
incertitude concrète est nommée, l'opérateur ouvre Draw, choisit le sort
déclaré puis Cast ; le runtime capture les huit octets et la source menu sans
supprimer le writer.

Assertions si cette phase est choisie :

- attacker, target mask and spell id match UI selection;
- `aux_5=9`, `aux_6=source monster slot`;
- raw pending `command_id` is reported, never inferred from UI state or
  resolver `COMMAND_TYPE_ID`;
- no replacement write or queue transfer occurred before validation.

Si le byte contredit la carte candidate ou ne remonte pas à la menu row,
stopper sans ownership. Sinon, conserver l'observation comme diagnostic ;
elle ne devient pas une condition cachée de scénario 2.

## Phase B — armement direct et validation au seam

Sur un FF8 neuf et idle, scénario 2 peut armer immédiatement. La suppression
n'a lieu que lorsque l'appel live matche exactement le contrat Cast ou Stock.
Tout mismatch reste natif et fail-closed.

Le D0 doit capturer Draw table/tier, caster/source stats,
`K_MAGIC`, battle Magic stock, RNG, queues and latches (Phase A D0 left
those witness fields empty). Aucun Cast ou Stock natif préalable n'est requis.

No `TemporaryG13NcompAdapter`. Presentation remains G14.

## Phase 2 — représentants live et matrice offline

| Case | Required result |
| --- | --- |
| resisted/zero | one quantity RNG; zero result with no stock mutation |
| Cast success | quantity `1..9`, second Cast scale RNG, Magic profile handoff, no stock remove |
| Stock success | quantity `1..9`, add exactly that amount, cap at 100 |
| full stock | add attempts fail at cap without id/quantity corruption |
| absent table id | monster amount fallback one |
| high result | clamp quantity to nine |

Le live par défaut n'exécute que les lignes Cast success et Stock success.
Les autres lignes sont déjà couvertes offline ; le modèle ne les promeut en
live que pour diagnostiquer un écart observé. Chaque cas exécuté enregistre
les RNG bytes dans l'ordre.

## Pass criteria — Phase A (closed 2026-08-25)

- eight pending bytes and menu-row byte captured from the native writer;
- `aux_5=9`, `aux_6` = source slot, spell/mask/attacker match UI;
- `arm_authorized = 0`; writer retained; no replacement transfer;
- no Magic / EQUAL / SG / HP writes from the replacement;
- observed `command_id` bound to this PID only.

## Pass criteria — Phase B directe

- scénario 2 arme sans dépendre d'une observation native antérieure ;
- chaque appel supprimé matche le contrat exact au seam ;
- Cast and Stock share queue routing but not stock semantics;
- Cast never removes caster stock; Stock mutates only battle-local Magic stock;
- semantic result quantity, event and presentation agree;
- zero native Draw fallback, forbidden writes or unattributed RNG draws;
- byte-exact per-case restore and final hook cleanup;
- `[promotion.G13].satisfied` is true on 2026-08-25.

## Operator actions

Deux actions par défaut : Draw → Cast remplacé, puis après nouvel armement
Draw → Stock remplacé. Confirmer le résultat visible et la récupération de
la caméra/acteur quand demandé.

## Exclusion

GF Draw ids `>=0x40` remain outside this session. Source death after GetText
is closed statically; see the archived
[[projects/final-fantasy-viii-reimaginated/skills/g13-live-source-death-session-plan|session 5 plan]].

## Related

- [[projects/final-fantasy-viii-reimaginated/skills/g11-g14-live-session-campaign-index]]
- [[projects/final-fantasy-viii-reimaginated/references/p0-g13-draw-validation]]
- [[projects/final-fantasy-viii-reimaginated/skills/g13-live-source-death-session-plan]]
- [[projects/re-ff8/concepts/command-action-pipeline#Draw pending writer (static 2026-08-18)]]
- [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G13-001 — command_id pending Draw authentique]]
- [[projects/re-ff8/references/g11-g20-static-open-questions#SQ-G13-002 — Draw source death]]
- `ai-prompt/todo/g13-live-draw-phase-b-new-chat.md`
- `ai-prompt/todo/g13-live-draw-direct-replacement-new-chat.md`
