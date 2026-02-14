# GF Batch Discovery Index

## Scope

Batch-discovered GF summon chains from static MCP/IDA analysis.

## Results

| GF | Entry | Init | Tick | Family | Confidence |
|---|---|---|---|---|---|
| 006Leviathan | `GF_006Leviathan_InvokeSummonScript` | `GF_006Leviathan_InvokeSummonScript` | `isLeviathanFrame` | `Atypical` | `medium` (75) |
| 090Tonberry | `MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE` | `sub_8DC540` | `n/a` | `Atypical` | `low` (55) |
| 095Siren | `MAG_095_SIREN_SUMMON_SILENT_VOICE` | `sub_8DC540` | `n/a` | `Atypical` | `medium` (76) |
| 185Shiva | `GF_185Shiva_InvokeSummonScript` | `GF_185Shiva_InvokeSummonScript` | `au_re_BdlinkTask_5` | `FamilyA` | `high` (90) |
| 187Odin | `GF_187Odin_InvokeSummonScript` | `GF_187Odin_InvokeSummonScript` | `au_re_BdlinkTask_36` | `FamilyA` | `high` (90) |
| 191Doomtrain | `GF_191Doomtrain_InvokeSummonScript` | `GF_191Doomtrain_InvokeSummonScript` | `GF_191Doomtrain_SequenceTick` | `FamilyA` | `medium` (80) |
| 199Cactuar | `GF_199Cactuar_InvokeSummonScript` | `GF_199Cactuar_InvokeSummonScript` | `GF_199Cactuar_SequenceTick` | `Atypical` | `medium` (75) |
| 202Bahamut | `GF_202Bahamut_InvokeSummonScript` | `GF_202Bahamut_InvokeSummonScript` | `GF_202Bahamut_SequenceTick` | `Atypical` | `medium` (72) |
| 203Cerberus | `GF_203Cerberus_InvokeSummonScript` | `GF_203Cerberus_InvokeSummonScript` | `GF_203Cerberus_SequenceTick` | `FamilyB` | `medium` (82) |
| 204Alexander | `GF_204Alexander_InvokeSummonScript` | `GF_204Alexander_InvokeSummonScript` | `GF_204Alexander_SequenceTick` | `Atypical` | `medium` (72) |
| 205Brothers | `GF_205Brothers_InvokeSummonScript` | `GF_205Brothers_InvokeSummonScript` | `GF_205Brothers_SequenceTick` | `Atypical` | `medium` (75) |
| 206Eden | `GF_206Eden_InvokeSummonScript` | `GF_206Eden_InvokeSummonScript` | `GF_206Eden_SequenceTick` | `Atypical` | `medium` (70) |
| Quezacotl | `GF_Quezacotl_InvokeSummonScript` | `GF_Quezacotl_InvokeSummonScript` | `n/a` | `Atypical` | `low` (45) |

## Review Notes

- Rows for Leviathan, Brothers, Alexander, Bahamut, Tonberry, Eden, and Cactuar were updated from Tier-3 runtime evidence runs on 2026-02-14.
- Rows for Doomtrain, Cerberus, Diablos, and Siren were updated from Tier-3 runtime evidence runs on 2026-02-14 (`GF_DOOMTRAIN_001`, `GF_CERBERUS_001`, `GF_DIABLOS_001`, `GF_SIREN_001`).
- Odin and Griever are currently flagged unstable in live runtime tests (game enters bad state / crash-prone), pending controlled repro evidence.
- Medium confidence reflects deterministic PASS with one or more key invocation probes (typically entry/tick) still missing in-session.
- Remaining rows retain static-analysis confidence until corresponding evidence runs are completed.
