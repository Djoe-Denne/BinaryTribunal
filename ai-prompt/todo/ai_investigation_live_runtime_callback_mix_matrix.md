> **RÉSOLU 2026-07-12 (statique + live).** La vraie table `0x1D29638`, l’invocation indirecte `0x4825C8`, les fenêtres idle/Attack/Fira/Ifrit/menu et deux complétions concrètes ont été capturées. Les callbacks fichiers sont de la readiness d’assets de présentation ; BdLink n’a modifié aucun état autoritaire échantillonné entre entrée/sortie. HUD/input/ATB et les callbacks action/différés restent les responsabilités autoritaires.

## Task: Capture Runtime Callback Mix Behind Battle File Callback Pump

### Setup For You

- Keep debugger attached in active tick and prepare three scenarios: idle command loop, spell-heavy loop, GF-heavy loop.
- Use `binaryTribunal` callback-table snapshots before/after each frame window.
- Use `ff8re` to trigger controlled command families where possible.
- Ask the user for manual spell/GF actions when exact menu sequencing is required.

### Context

Static analysis confirms callback infrastructure exists post-hook, but the exact live callback set active per combat context is still unclosed.

### Known Anchors

- `domain::Battle_RunFileLoadingCallbacks` thunk at `0x48D0C0`.
- Worker `battle_run_battle_file_callback_2_sub_482590` at `0x482590`.
- Actual indirect callback invocation at `0x4825C8` (reached only when an active slot was found).
- Callback pointer table `battle_file_callback_2[16]` at `0x1D29638`.
- `Battle_FileCallbacks_Reset` at `0x482560` is a reset routine, not the callback pump.
- `LoadBattleFile` callback infrastructure and callback slots metadata.
- Post-hook tail in `main::FFBattleDirector_battleLoop` (`0x47CCB0`).
- BdLink bridge path around `BdLink_GF_battle_input_and_texture_upload`.

### Investigation Steps

1. Identify callback table base, slot count, active flags, and countdown fields.
2. Sample callback table across three contexts: idle, spell-heavy, GF-heavy.
3. Record callback pointer identity, activation lifetime, and completion condition.
4. Determine which callbacks are mandatory for simulation correctness vs presentation-only.
5. Detect any callbacks that persist across multiple battle phases unexpectedly.

### Runtime Evidence Plan

- Frame-window snapshots every N ticks while context remains stable.
- Break on callback dispatcher and log current slot/pointer and completion writes.
- Correlate callback activity with visible command families and phase flags.

### Expected Output

1. Runtime callback mix matrix by context (idle/spell/GF).
2. Per-callback classification: domain-critical vs replaceable presentation.
3. Lifetime and completion behavior per callback slot.
4. Proposed IDA renames for high-value unknown callbacks.
5. Merge-ready hook-boundary/callback docs updates.
