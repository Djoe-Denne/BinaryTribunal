# G-Force (Summon) System

## How GF Invocation Works

1. Player confirms GF command → `BattlePendingAction_Write` writes `command_id=0x03`, `command_arg=kernel_GF_ID` (see `reference/command_id_table.md`).
2. Action enters exec queue → `BattleActionSequence_DispatchTick` routes to `Tick_GF_Cinematic` (`0x50B2A0`).
3. `Tick_GF_Cinematic` is a 10-state state machine:
   - State 1: `BattleGF_LoadCallbackByMagicID` (`0x50AF20`) loads the GF-specific entry function into `GF_CALLBACK_PTR` (`0x21DFEC4`).
   - State 3: Calls the entry function; if GF, initializes boost minigame (`BattleGF_InitBoostMinigame` at `0x56DCE0`).
   - States 4-8: Cinematic runs (GF-specific tick advances per frame).
   - State 9: Cleanup; conditionally triggers damage via `BattleGF_CinematicTriggerDamageFromCtx` if `GF_CINEMATIC_SPECIAL_MODE == 3`.
4. During boost completion: `BattleGF_ResolveAndStoreTargetDamage` (`0x4850A0`) pre-computes damage/status via the standard damage pipeline (see `systems/damage_pipeline.md`).

## GF Entry Function Pattern

Every GF has an **entry function** stored in the cinematic callback table. This function:
- Initializes GF-specific context (models, camera, globals)
- Schedules a **tick function** via `BdLinkTask`
- The tick runs per-frame until it returns `2` (completion)

## GF Families

See `gforce/gf_families.md` for the three structural patterns (FamilyA, FamilyB, SharedInit).

## GF Catalog

See `gforce/gf_catalog.md` for the master table of all GFs with addresses, status, and confidence.

## Shared Infrastructure

See `gforce/gf_shared_infra.md` for `BdLinkTask_CreateAndInitContext`, the shared globals, and `GF_CALLBACK_PTR`.

## Damage vs Support GFs

- **Damage GFs** (Ifrit, Diablos, etc.): `gfPower > 0`, deal HP damage, may apply negative statuses.
- **Support GFs** (Cerberus, Carbuncle): `gfPower = 0`, deal 0 damage, apply beneficial statuses to party. `GF_CINEMATIC_SPECIAL_MODE = 0` means damage is NOT re-triggered after cinematic.

## Special GFs (Non-Junctionable)

| GF | Mechanism | Status |
|----|-----------|--------|
| Odin | Auto-triggers at battle start (RNG check) | Entry `0x6472E0`, crashes on standard injection |
| Gilgamesh | Replaces Odin on disc 3+, uses `Tick_Special` (`0x50B830`) | Zero addresses confirmed |
| Phoenix | Auto-triggers on party wipe + Phoenix Pinion | Zero addresses confirmed |
| Chocobo/Boko | Triggered via item command (0x04), not GF command | Zero addresses confirmed |
| Griever | Boss-only, non-summonable | Entry `0x62B3F0`, special category |
