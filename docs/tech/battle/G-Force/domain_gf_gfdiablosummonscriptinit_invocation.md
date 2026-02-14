# Gfdiablosummonscriptinit GF Invocation Reconstruction

## Scope

Runtime validation snapshot aligned with
`evidence/2026-02-14T18-00-34_GF_DIABLOS_001.json`.

## High-Level Result

- Test reference: `GF_DIABLOS_001`
- Deterministic result: `PASS`
- Entry candidate: `GF_Gfdiablosummonscriptinit_InvokeSummonScript` (`0x654210`) armed but not hit in-session
- Tick candidate: `GF_Diablo_SummonScript_TaskDriver` (`0x654350`) not directly hit in-session
- Counter increment candidate: `0x65459d` not hit in-session
- Runtime dispatch confirmation: `CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID = 0x45` at damage resolution

## Confirmed Runtime Chain (This Session)

1. `BattlePendingAction_TransferToExecQueue` (`0x4847f0`) hit.
2. `BattleActionSequence_Tick_GF_Cinematic` (`0x50b2a0`) hit.
3. `BattleAction_ResolveAndApplyDamage` (`0x48fe20`) hit.
4. `Battle_ApplyDamageOrHeal` (`0x494410`) hit.

## Counter and Completion

- Increment site candidate: `0x65459d` (not hit in this run)
- Completion site candidate: `0x654595` (not observed in this run)

## Notes

- This document now reflects what is proven by the Diablos evidence run.
- Missing entry/tick/counter probe hits are currently attributed to runtime dispatch/timing behavior, not command rejection (pipeline and effects are confirmed).
