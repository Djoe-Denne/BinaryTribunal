> **RESOLVED 2026-06-15 (static + live debugger, combat en pause).** Tout distillé dans `obsidian-docs/projects/re-ff8/concepts/battle-lifecycle.md` (§ *Root state machine*, *Active Tick Flow*, *Per-Frame Cadence & Action Sequencing*). Readiness **B2 + B3 CLOSED**. IDB annoté (`FFBattleModule`, stubs LOCK/UNLOCK, `BYTE1/BYTE2(TARGET_SLOT_ID)`, `BattleAction_ResolveAndApplyDamage`, `UpdateRateRelated`).
>
> - **Machine à états racine** (live-confirmée : `mode_StateGlobal=3 / mode3_substep=3 / subsub=1 / subsubsub=4` = tick actif) : 4 niveaux, table dans la doc.
> - **Hand-off / sérialisation** : `BYTE1(TARGET_SLOT_ID)` (`0x1D28DFD`) = verrou « action en cours » → gèle `BattleArbitration_SelectNextAction`/resolve **ET** `Status_TickAndExpire`. LOCK `0x4876D0` / UNLOCK `0x4876B0` ; le VM d'IA pose aussi le verrou en cédant à une présentation multi-frame.
> - **Issue committée à la sélection** : `BattleAction_ResolveSpecialActionAndUpdateDamage` (`0x485160`) → `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) calcule **et** commit (`Battle_ApplyDamageOrHeal`) dans la même frame ; la séquence d'anim est cosmétique.
> - **Cadence frame** : pump `FFBattleModule` (`0x47CF60`) piloté par `FFModuleHandler_main_loop` ; par frame HUD/ATB ×4 (3 pré + 1 post, ATB gé­ré par `!IS_BATTLE_PAUSED`) + directeur ×1 (si `!IS_BATTLE_PAUSED`). Unité de temps : `UpdateRateRelated` (`0x4020F0`, `timeGetTime`/QPC vs `dbl_1A78BE8` ≈ 64,5 ms ⇒ ~15 fps, avec frame-skip).
> - **Résiduel (présentation only)** : compte de frames intro/active/hit/outro par séquence — sans effet sur l'issue.

> **Complexité d'investigation : 4/5 (Élevée) — statique.** Le pacing outcome-faithful est déjà modélisé (ATB gelé hors pause). Reste : la machine à sous-états du gros `FFBattleDirector_battleLoop` (0x47CCB0), le hand-off `BattleTaskQueue_Tick/Dispatch` ↔ dispatcher de séquence, et l'unité de frame (source vsync/timer). Contrôle de flux large + couplage présentation ; fiddly mais 100% statique.

## Task: Cross-Frame Action Sequencing & Frame Cadence (static)

### Setup For You

- Pure static (decompile + callgraph). The action sequencer + task queue are presentation-adjacent but pace authoritative damage commits.

### Context

Resolution is **not** instantaneous: a selected action plays over multiple frames (approach → animation → hit/commit → next actor). The wiki models the *what* (pipeline stages) but not the *pacing*. ISO timing (and therefore the cross-actor ATB/RNG interleave) depends on this state machine. Not previously flagged (B2/B3).

### Known Anchors

- `FFBattleDirector_battleLoop` `0x47CCB0` — top driver; active tick gate `mode_StateGlobal==3 / mode3_subsub_step==3 / mode_3_subsubsubstep==4`.
- Per-frame order (from `docs/tech/systems/battle_loop.md`): `BattleUI_InputPollAndMenuState` `0x4A8772` → `BattleATB_TickAndReady` `0x4842B0` → `BattlePendingAction_TransferToExecQueue` `0x4847F0` → `BattleArbitration_SelectNextAction` `0x485460` → `BattleAction_ResolveSpecialActionAndUpdateDamage` `0x485160` → `BattleTaskQueue_Tick` `0x500CC0`.
- `BattleTaskQueue_Tick` `0x500CC0` → `BattleActionSequence_DispatchTick` → `Tick_Generic` / `Tick_GF_Cinematic` / `Tick_Special`.
- AI relays gating: `0x70` (barrier) / `0x71` (actor-ready) poll `sub_508580` (camera-busy reading `dword_1D97704`); see `ai_investigation_live_ai_relay_70_71.md`.
- `task_dispatch` at `0x502380` (battle task dispatcher, opcode `a1+2`, family `0x64..0x77`).

### Discovered So Far (static, 2026-06-14)

- The camera control word `dword_1D97704` is the **busy gate**: `0x8000` full-takeover is set only by `BattleActionSequence_SelectGenericCameraAnimation`, and `sub_508580` reads it for the AI relays — so animation/camera state can stall action progression. (See `battle-camera-architecture`.)
- `BattleArbitration_SelectNextAction` consumes and clears the chosen exec cell **before** resolution/presentation, so the queue is staging, not a "currently-resolving" record — the *currently resolving* action lives in transient globals + the task/sequence state.

### Static Investigation Steps

1. Decompile `FFBattleDirector_battleLoop` `0x47CCB0`: enumerate the substep state machine (`mode3_substep`/`subsub`/`subsubsub`) transitions and exactly which subsystems run per substep (and which gate on `BATTLE_RESULT_CODE==0`).
2. Decompile `BattleTaskQueue_Tick` `0x500CC0` + `BattleActionSequence_DispatchTick`: the per-action phase state machine (intro/active/hit/outro), how it advances, and where it calls back into damage commit vs presentation.
3. Determine the **handoff** between `BattleArbitration_SelectNextAction` (picks actor) and the sequence (plays it): what marks "action in progress" and blocks the next pick until the sequence completes.
4. Pin the **frame cadence**: is the active tick one logical frame per call? Which subsystems are every-frame vs gated. Identify the frame source (vsync/timer) feeding ATB and timers.
5. Confirm how the AI relays `0x70`/`0x71` serialize multi-actor turns against the busy gate (static side of the live relay prompt).

### Expected Output

1. Battle-loop substep state-machine diagram with per-substep subsystem calls.
2. Action-sequence phase state machine + the resolution↔presentation handshake.
3. Frame-cadence model (what advances per frame) for ATB/timers/sequencing.
4. Merge-ready deltas for `battle-lifecycle` + `battle-loop-iso-readiness` (B2/B3).

### PROGRESS 2026-06-14 (static, IDA). Outcome-faithful pacing modelled; frame-time unit still open.

- **Serialization mechanism found:** ATB (and escape) advance only when `!IS_BATTLE_PAUSED` (HUD callback `0x4A84E0` → `BattleATB_TickAndReady`). While an action sequence resolves the battle is paused, so all actors' ATB freeze — that is how turns serialize (no per-actor "in progress" flag needed for the ATB freeze).
- **Action-sequence dispatcher** `BattleActionSequence_DispatchTick` (`0x50A790`): switches on a sequence-state byte (`g_GfSequenceContextSharedB+1`) and picks `Tick_Generic` (`0x50A9A0`) / `Tick_GF_Cinematic` (`0x50B2A0`) / `Tick_Special` (`0x50B830`) (+ subs `sub_50BD00/50BD80/50BEE0/50BDC0/50B0C0/50BC20/50BB00/50B190`), scheduled via `au_re_BdLinkTask`. Sequence words `70`/`15` (Renzokuken / special) take dedicated branches. So an action = a BdLink-scheduled per-phase tick handler.
- **Camera busy gate** (already documented): `dword_1D97704` `0x8000` set by `BattleActionSequence_SelectGenericCameraAnimation`; `sub_508580` reads it for AI relays `0x70`/`0x71` to hold the next actor.
- **Docs updated:** `concepts/battle-lifecycle.md` (Per-Frame Cadence & Action Sequencing).
- **Still open (B2/B3):** the exact substep transitions inside `FFBattleDirector_battleLoop` (0x47CCB0), the `BattleTaskQueue_Tick`/`Dispatch` ↔ sequence-dispatcher hand-off, and the frame-time unit (every-frame vs every-Nth; vsync/timer source). These are timing-faithful concerns, not outcome-faithful.
