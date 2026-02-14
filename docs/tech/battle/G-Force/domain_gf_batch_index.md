# GF Batch Discovery Index

## Scope

Batch-discovered GF summon chains from static MCP/IDA analysis.

## Results

| GF | Entry | Init | Tick | Family | Confidence |
|---|---|---|---|---|---|
| 006Leviathan | `GF_006Leviathan_InvokeSummonScript` | `GF_006Leviathan_InvokeSummonScript` | `isLeviathanFrame` | `FamilyB` | `high` (100) |
| 090Tonberry | `MAG_090_TONBERRY_SUMMON_CHEFS_KNIFE` | `sub_8DC540` | `n/a` | `Atypical` | `low` (45) |
| 095Siren | `MAG_095_SIREN_SUMMON_SILENT_VOICE` | `sub_8DC540` | `n/a` | `Atypical` | `low` (45) |
| 185Shiva | `GF_185Shiva_InvokeSummonScript` | `GF_185Shiva_InvokeSummonScript` | `au_re_BdlinkTask_5` | `FamilyA` | `high` (90) |
| 187Odin | `GF_187Odin_InvokeSummonScript` | `GF_187Odin_InvokeSummonScript` | `au_re_BdlinkTask_36` | `FamilyA` | `high` (90) |
| 191Doomtrain | `GF_191Doomtrain_InvokeSummonScript` | `GF_191Doomtrain_InvokeSummonScript` | `GF_191Doomtrain_SequenceTick` | `FamilyA` | `high` (90) |
| 199Cactuar | `GF_199Cactuar_InvokeSummonScript` | `GF_199Cactuar_InvokeSummonScript` | `GF_199Cactuar_SequenceTick` | `FamilyA` | `high` (90) |
| 202Bahamut | `GF_202Bahamut_InvokeSummonScript` | `GF_202Bahamut_InvokeSummonScript` | `GF_202Bahamut_SequenceTick` | `FamilyB` | `high` (100) |
| 203Cerberus | `GF_203Cerberus_InvokeSummonScript` | `GF_203Cerberus_InvokeSummonScript` | `GF_203Cerberus_SequenceTick` | `FamilyB` | `high` (100) |
| 204Alexander | `GF_204Alexander_InvokeSummonScript` | `GF_204Alexander_InvokeSummonScript` | `GF_204Alexander_SequenceTick` | `FamilyB` | `high` (100) |
| 205Brothers | `GF_205Brothers_InvokeSummonScript` | `GF_205Brothers_InvokeSummonScript` | `GF_205Brothers_SequenceTick` | `FamilyB` | `high` (100) |
| 206Eden | `GF_206Eden_InvokeSummonScript` | `GF_206Eden_InvokeSummonScript` | `GF_206Eden_SequenceTick` | `FamilyB` | `high` (100) |
| Quezacotl | `GF_Quezacotl_InvokeSummonScript` | `GF_Quezacotl_InvokeSummonScript` | `n/a` | `Atypical` | `low` (45) |

## Review Notes

- High-confidence chains can be auto-annotated.
- Medium/low confidence chains should be spot-checked with runtime breakpoints.

## Runtime Spot-checks

- Active callback pointer check (paused in GF cinematic):
  - `0x21DFEC4` resolved to `0xB25780` (`GF_Ifrit_InvokeSummonScript`).
- Breakpoints armed for sampled counter sites:
  - Ifrit increment: `0xB25DFA`
  - Quezacotl increment: `0x6C51F2`
  - Diablo increment: `0x65459D`
- Result:
  - Ifrit callback path confirmed live.
  - Quezacotl/Diablo increment sites are prepared for direct hit validation on next corresponding invocation.
