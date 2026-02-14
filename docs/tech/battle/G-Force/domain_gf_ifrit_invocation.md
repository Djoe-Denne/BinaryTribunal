# Ifrit GF Invocation Reconstruction

## Scope

Reconstruct the third observed GF invocation (Ifrit), identify its active summon chain, and map the progression counter used by the sequence tick.

Rendering backend internals are intentionally excluded.

## High-Level Result

The third invocation is Ifrit:

- callback pointer at `0x21DFEC4` resolved to `MAG_201_IFRIT_SUMMON_HELL_FIRE` (`0xB25780`)
- Ifrit uses an entry/init/tick pattern consistent with the previous GF investigations
- sequence progression counter increments in `GF_Ifrit_SequenceTick`

## Runtime Evidence (Live Paused Battle)

Captured while paused at `BattleActionSequence_Tick_GF_Cinematic+1` (`EIP=0x50B2A1`):

- `0x21DFEC4` (`35520196`) = `0xB25780` (`11687808`)
- `0x1D96AAC` (`31025836`) = `0x02796E18`
- `0x1D99A50` (`31038032`) active GF sequence state block

## Confirmed Call Chain

1. `BattleActionSequence_Tick_GF_Cinematic` (`0x50B2A0`) drives GF cinematic dispatch.
2. Active callback from `0x21DFEC4` is `GF_Ifrit_InvokeSummonScript` (`0xB25780`).
3. Entry calls:
   - `GF_Ifrit_InitSummonContext` (`0xB257E0`)
   - `GF_Ifrit_SetInitialFrameLimit` (`0xB302A0`)
   - `GF_Ifrit_EnableSequenceState` (`0xB2F8D0`)
4. Entry schedules `GF_Ifrit_SequenceTick` (`0xB25DF0`) through `BdLinkTask`.

## Progression Counter and Completion Signal

- Counter increment (confirmed):
  - `0xB25DFA`: `inc word ptr [gfIfrit_sequenceCtxPtr + 0x32]`
- Completion return in tick function:
  - `0xB26004`: returns `((~stateWord >> 14) & 2)` completion flag

This is the same semantic shape as previous GF runs: per-tick sequence counter + completion bit/return path.

## IDA DB Updates Applied

### Function renames

- `0xB25780` -> `GF_Ifrit_InvokeSummonScript`
- `0xB257E0` -> `GF_Ifrit_InitSummonContext`
- `0xB25DF0` -> `GF_Ifrit_SequenceTick`
- `0xB302A0` -> `GF_Ifrit_SetInitialFrameLimit`
- `0xB2F8D0` -> `GF_Ifrit_EnableSequenceState`

### Global renames

- `dword_27973EC` -> `gfIfrit_sequenceCtxPtr`
- `dword_27973B8` -> `gfIfrit_runtimeSlotPtr`
- `dword_27973BC` -> `gfIfrit_renderCtxPtr`
- `dword_27973C0` -> `gfIfrit_sequenceStatePtr`
- `dword_2796E18` -> `gfIfrit_taskListHead`
- `dword_2796E4C` -> `gfIfrit_magicResourcePtr0`
- `dword_2796E48` -> `gfIfrit_magicResourcePtr1`

### Local renames

- In `GF_Ifrit_SequenceTick`:
  - `v0` -> `seqCtx`
  - `v1` -> `stateWord`

### Comments added

- `0xB25DFA`: sequence counter increment
- `0xB257CE`: sequence tick scheduling point
- `0xB26004`: completion return semantics
- `0xB302A5`: initial frame limit assignment (`563`)

## Command Injection (Confirmed via Breakpoint Capture)

### Pending Action Entry for GF Ifrit

Captured by breakpoint at `BattlePendingAction_Write` (`0x484D20`) during a real player-initiated GF Ifrit summon:

```
BattlePendingAction_Write(entry_index=0, attacker_slot=0, command_id=3, command_arg=0x42, target_mask=0x8008)
```

Raw pending entry bytes: `08 80 00 03 42 00 00 01`

| Offset | Field | Value | Notes |
|--------|-------|-------|-------|
| +0,+1 | target_mask | 0x8008 | GF targeting flags (LE: 08 80) |
| +2 | attacker_slot | 0x00 | Party member 0 (Squall) |
| +3 | command_id | 0x03 | GF command type (confirmed: Attack=0x01, Magic=0x02, GF=0x03) |
| +4 | command_arg | 0x42 | Ifrit kernel GF ID (66 decimal, NOT sequential index) |
| +5,+6 | padding | 0x00 | Unused |
| +7 | active | 0x01 | Entry is live |

### Direct Injection via MCP (curl)

```
curl -X POST http://127.0.0.1:13337/mcp -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"py_eval\",\"arguments\":{\"code\":\"import idc\\nimport ida_dbg\\nbase = 0x1D28D44\\nfor off, val in enumerate([0x08, 0x80, 0x00, 0x03, 0x42, 0x00, 0x00, 0x01]):\\n    idc.patch_dbg_byte(base + off, val)\\nida_dbg.invalidate_dbgmem_contents(base, 8)\\nprint('GF Ifrit injected')\"}}}"
```

**Important**: Use `idc.patch_dbg_byte` (not `ida_dbg.write_dbg_memory`) for writing to the pending buffer. The latter silently fails on the `active` flag byte at offset +7.

### Validation History

1. **command_id=0x02, command_arg=0x02**: Game cast "Fira" — proved 0x02 = Magic, not GF
2. **command_id=0x03, command_arg=0x02**: Game crashed — command_id=0x03 is GF but 0x02 is invalid GF index
3. **Breakpoint capture**: Real GF Ifrit summon revealed command_arg=0x42 and target_mask=0x8008
4. **command_id=0x03, command_arg=0x42, target_mask=0x8008**: Successfully triggered full Ifrit summon sequence

## Numeric Conversions (via `int_convert`)

- `0xB25780` -> `11687808`
- `0xB257E0` -> `11687904`
- `0xB25DF0` -> `11689456`
- `0xB302A0` -> `11731616`
- `0xB2F8D0` -> `11729104`
- `0xB25DFA` -> `11689466`
- `0xB26004` -> `11689988`
- `0x21DFEC4` -> `35520196`
- `0x1D96AAC` -> `31025836`
- `0x1D99A50` -> `31038032`
