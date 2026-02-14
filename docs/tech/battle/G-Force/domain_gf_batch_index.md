# GF Batch Discovery Index

## Scope

Batch-discovered GF summon chains from static MCP/IDA analysis.

## Results

| GF | Entry | Init | Tick | Family | Confidence |
|---|---|---|---|---|---|
| 006Leviathan | `GF_006Leviathan_InvokeSummonScript` | `GF_006Leviathan_InvokeSummonScript` | `isLeviathanFrame` | `Atypical` | `medium` (75) |
| 090Tonberry | `MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE` | `BdLinkTask_CreateAndInitContext` | `n/a` | `Atypical` | `low` (55) |
| 095Siren | `GF_095Siren_InvokeSummonScript` | `BdLinkTask_CreateAndInitContext` | `GF_095Siren_SequenceTick` | `Atypical` | `high` (95) |
| 185Shiva | `GF_185Shiva_InvokeSummonScript` | `GF_185Shiva_InvokeSummonScript` | `GF_185Shiva_SequenceTick` | `FamilyA` | `high` (92) |
| 187Odin | `GF_187Odin_InvokeSummonScript` | `GF_187Odin_InvokeSummonScript` | `au_re_BdlinkTask_36` | `FamilyA` | `high` (90) |
| 191Doomtrain | `GF_191Doomtrain_InvokeSummonScript` | `GF_191Doomtrain_InvokeSummonScript` | `GF_191Doomtrain_SequenceTick` | `FamilyA` | `medium` (80) |
| 199Cactuar | `GF_199Cactuar_InvokeSummonScript` | `GF_199Cactuar_InvokeSummonScript` | `GF_199Cactuar_SequenceTick` | `Atypical` | `medium` (75) |
| 200Pandemona | `GF_200Pandemona_InvokeSummonScript` | `GF_200Pandemona_InitSummonContext` | `GF_200Pandemona_SequenceTick` | `FamilyA` | `high` (95) |
| 202Bahamut | `GF_202Bahamut_InvokeSummonScript` | `GF_202Bahamut_InvokeSummonScript` | `GF_202Bahamut_SequenceTick` | `Atypical` | `medium` (72) |
| 203Cerberus | `GF_203Cerberus_InvokeSummonScript` | `GF_203Cerberus_InvokeSummonScript` | `GF_203Cerberus_SequenceTick` | `FamilyB` | `medium` (82) |
| 204Alexander | `GF_204Alexander_InvokeSummonScript` | `GF_204Alexander_InvokeSummonScript` | `GF_204Alexander_SequenceTick` | `Atypical` | `medium` (72) |
| 205Brothers | `GF_205Brothers_InvokeSummonScript` | `GF_205Brothers_InvokeSummonScript` | `GF_205Brothers_SequenceTick` | `Atypical` | `medium` (75) |
| 206Eden | `GF_206Eden_InvokeSummonScript` | `GF_206Eden_InvokeSummonScript` | `GF_206Eden_SequenceTick` | `Atypical` | `medium` (70) |
| 277Carbuncle | `GF_277Carbuncle_InvokeSummonScript` | `GF_277Carbuncle_InitSummonContext` | `GF_277Carbuncle_SequenceTick` | `FamilyA` | `high` (95) |
| Quezacotl | `GF_116Quezacotl_InvokeSummonScript` | `GF_116Quezacotl_InitSummonContext` | `GF_116Quezacotl_SequenceTaskDriver` | `FamilyA` | `high` (96) |

## Review Notes

- Rows for Leviathan, Brothers, Alexander, Bahamut, Tonberry, Eden, and Cactuar were updated from Tier-3 runtime evidence runs on 2026-02-14.
- Rows for Doomtrain, Cerberus, Diablos, and Siren were updated from Tier-3 runtime evidence runs on 2026-02-14 (`GF_DOOMTRAIN_001`, `GF_CERBERUS_001`, `GF_DIABLOS_001`, `GF_SIREN_001`, `GF_SIREN_002`).
- Pandemona (`0x6ed250`) now has complete static chain identification and IDA rename coverage; runtime evidence capture is pending deterministic execution.
- Carbuncle (`0x680c50`) now has complete static chain identification and IDA rename coverage; runtime evidence capture is pending deterministic execution.
- Quezacotl static chain is now expanded end-to-end (entry/init/task-driver/charge/frame-tick) with normalized `GF_116Quezacotl_*` naming and completion-site mapping.
- Odin and Griever are currently flagged unstable in live runtime tests (game enters bad state / crash-prone), pending controlled repro evidence.
- Medium confidence reflects deterministic PASS with one or more key invocation probes (typically entry/tick) still missing in-session.
- Remaining rows retain static-analysis confidence until corresponding evidence runs are completed.
