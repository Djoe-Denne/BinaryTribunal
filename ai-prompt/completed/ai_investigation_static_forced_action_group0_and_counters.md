## Task: Map Forced/Injected Actions — Exec Group 0 + Counters/Cover (static)

### Setup For You

- Pure static (xref + decompile). Live only if a trigger condition cannot be derived.

### Context

`command-action-pipeline` states exec **group 0** is "never filled by transfer, reserved for engine-injected forced actions (counters, scripted events, status-expiry specials)" — but the mechanism was undocumented. This is the single biggest behavioural blind spot for ISO. A 2026-06-14 xref pass narrowed it.

### Known Anchors

- Group 0: head byte `byte_1D28C00` (`0x1D28C00`), link array `stru_1D28864` (`0x1D28864`). Empty sentinel `0xFF`.
- `Battle_EnqueueSpecialAction` / `ODIN_sub_484710` `0x484710` — the group-0 writer.
- `BattleExecQueue_AllocNode` `0x482BD0` — node allocator (group-agnostic).
- `BattleArbitration_SelectNextAction` `0x485460` — scans groups 0→1→2; group 0 is **exempt** from the incapacitation skip.
- `BattleExecQueue_ConsumeCurrentSlot` `0x4845B2`, `Battle_InitActionQueueGroup` `0x48C74C`, `BattleTick_CheckEscapeSuccess` `0x4862AF` (references the group-0 link base).
- Counter/death return edge: `damage --> EnemyAI_DispatchSection` (per `docs/tech/systems/battle_loop.md` mermaid).

### Discovered So Far (static, 2026-06-14)

- **Only `Battle_EnqueueSpecialAction` (`0x484710`) writes group 0.** Signature `(slot_id, action_word a2, group a3)`: if `a3==0` it allocs into group 0 (`stru_1D28864`/`byte_1D28C00`); if `a3!=0` into group 2. The record layout: `+0=attacker slot`, `+1=0xFF`, `+2=0`, `+4=action word (a2)`, `+6/+8/+10=0` (target masks zeroed).
- The IDB annotation marks it as the **Odin Zantetsuken / Gilgamesh / Phoenix** injector (`action_type 7`). So group 0 ≈ **engine specials**, not generic counters.
- Therefore **counterattacks are most likely NOT group-0 injected** — they appear to route back through the AI dispatch (`EnemyAI_DispatchSection`) on the damage/death return edge. This needs confirmation.

### Static Investigation Steps

1. Find the callers of `Battle_EnqueueSpecialAction` `0x484710` (note: a direct `xrefs_to` returned only an adjacent in-function ref — re-check with `callgraph`/`find_regex` on `call 0x484710` / the `ODIN`-named callers and the Odin/Gilgamesh init checks in `battle_init`).
2. Trace the **counterattack** trigger: from `Battle_ApplyDamageOrHeal` / post-damage, find where a counter re-enters action selection (AI dispatch vs a pending/exec write). Identify the "has counter" gate (ability flag / status).
3. Trace **Cover / cover-redirect** and **Return Damage** auto-abilities: where the target gets remapped before damage, and where reflected/returned damage is enqueued.
4. Trace **status-expiry specials** (e.g. Doom → KO) injection point — cross-link `timed-status-expiry` Doom chain.
5. Trace **scripted AI battle-end / forced action** requests (enemy AI op requesting an action or end).
6. For each, record: trigger condition, target/mask source, which queue/path, timing relative to the current actor.

### Expected Output

1. Complete forced/injected-action catalog: trigger → enqueue path → timing.
2. Confirmation that group 0 == engine specials (Odin/Gilgamesh/Phoenix) and the true counter/Cover/return paths.
3. Proposed renames (`Battle_EnqueueSpecialAction` confirm, counter trigger fn).
4. Merge-ready deltas for `command-action-pipeline` + `battle-loop-iso-readiness` (B1).

### RESOLVED 2026-06-14 (static, IDA)

**Two distinct channels, previously conflated. B1 closed.**

1. **Group 0 = engine specials only.** Real writer is `ODIN_sub_484710` @ **`0x484720`** (start; `0x484710` is inside the adjacent `Battle_ClearActionQueueEntry`). Sig `(slot, action_word, group)`: `group==0` → group-0 base `stru_1D28864`/head `0x1D28C00`; `group!=0` → `stru_1D288BC`/head `0x1D28C02`. Annotated Odin Zantetsuken / Gilgamesh / Phoenix.
2. **Counters/death are AI-dispatched, NOT enqueued into group 0.** `EnemyAI_DispatchSection` (`0x4877F0`, = `pre_MonsterAI`) runs per-slot sub-sections; only **3 callers**:
   - `Battle_ApplyDamageOrHeal` (`0x4947F6` survive, `0x4949FF` KO) → both push section **`4`** (verified by disasm: `push 4; push ebp`). The "section=2/3" IDB comments are **stale/wrong**. Branch is via `target_reaction_type` (2=hit / 3=dead) set just before.
   - `EnemyAI_PrepareTurnAction` (`0x48567F`) → **dynamic** section (in `ecx`): turn/counter/death/specials.
3. **Section map** (from `pre_MonsterAI` switch): 0 INIT, 1 TURN, 2 COUNTER, 3 DEATH, 4 ON-HIT (`ai_subsection[4]`), 5 fixed-attack `(246,0x2B)`, 6 basic-attack `(0,4)`, 7 Odin/Gilgamesh (`245`), 8 Angelo (`240`). All 5–8 specials go through `BattlePendingAction_SetupCommand` → normal exec commit (not group 0).
4. **Player Counter/Cover/Return-Damage/Angelo live in section 2 (party branch):** `CHARA_ABILITIES & 4` Counter → `BattlePendingAction_SetupCommand(slot,1,0,1<<last_attacker)`; `com_file_id==4` (Rinoa) → `Angelo_CheckAutoCounter`; `CHARA_ABILITIES & 0x40000` auto-recover (HP-loss thresholds → `EnemyAI_UseCurativeAbility`). Section 3 party → `Angelo_SetupAutoCommand(slot,13,..)`.

**Docs updated:** `concepts/command-action-pipeline.md` (Forced Actions And Reactions), `references/battle-formulas.md` (HP-commit), `concepts/damage-status-pipeline.md` (Counter/Death Reactions).

**Residual:** the exact section-selection logic inside `EnemyAI_PrepareTurnAction` (0x7a7 bytes) and Cover target-redirect timing are not fully reversed.^[ambiguous]
