# ff8re -- FF8 Battle Reverse Engineering Hypothesis Runner

Executable test framework that turns reverse-engineering hypotheses into
deterministic MCP debugger call sequences and produces structured evidence.

## What it does

The gap between "we think the pending action buffer is at `0x1D28D44`" and
"we have machine-verified proof" is a single YAML file.  This framework:

1. Reads a **hypothesis definition** (YAML or Python dataclass) describing
   what to set up, what stimulus to inject, what to observe, and what
   constitutes a pass.
2. Executes it against a **live FF8 process** via the IDA Pro MCP server
   (JSON-RPC over HTTP at `127.0.0.1:13337`).
3. Collects **structured evidence** -- memory snapshots, breakpoint hit
   records, register dumps, stacktraces -- into a JSON file.
4. Reports deterministic **PASS / FAIL** per assertion.

## Architecture

```
Hypothesis YAML       -->  HypothesisRunner  -->  Evidence JSON
(what to test)              |                      (what happened)
                            |
                     McpClient (transport)
                            |
                     IDA Pro MCP Server
                            |
                     FF8 Process (paused battle)
```

### Layer stack

| Layer       | File              | Purpose                                           |
|-------------|-------------------|---------------------------------------------------|
| Transport   | `mcp_client.py`   | Dual-endpoint McpClient (`/mcp` + `/mcp?ext=dbg`) |
| Domain      | `battle_state.py` | FF8 battle memory primitives (slots, pending, ATB) |
| Schema      | `hypothesis.py`   | Hypothesis dataclasses, YAML loader, address eval  |
| Runner      | `runner.py`       | 5-phase orchestrator: setup/act/observe/assert/cleanup |
| Evidence    | `evidence.py`     | Evidence collection and JSON serialization         |
| Smoke test  | `smoke.py`        | Phase 0 MCP transport validation                   |
| CLI         | `__main__.py`     | `python -m ff8re` entry point                      |

## Prerequisites

- Python 3.10+ (uses `match/case`)
- [PyYAML](https://pypi.org/project/PyYAML/) (`pip install pyyaml`)
- IDA Pro with the MCP server plugin running on `http://127.0.0.1:13337`
- FF8 process attached in IDA's debugger, paused in an active battle

## Quick start

```bash
# Install dependency
pip install -r requirements.txt

# Run from the  directory (the parent of ff8re/)
cd RE

# Phase 0: verify MCP transport works
python -m ff8re smoke

# Run a single hypothesis
python -m ff8re run ff8re/tests/tier1_layout/SLOT_001.yaml

# Run all tier 1 tests
python -m ff8re run ff8re/tests/tier1_layout/

# Run a suite with before_each hooks
python -m ff8re run ff8re/tests/suites/GF_BETWEEN_HOOKS_001.suite.yaml

# Keep breakpoints after cleanup (for manual IDA debugging)
python -m ff8re run --keep-breakpoints ff8re/tests/tier3_inject/GF_IFRIT_001.yaml

# Run with custom MCP URL
python -m ff8re --mcp-url http://localhost:13337 smoke
```

Evidence JSON files are written to `evidence/` by default.

## Writing a hypothesis

Each hypothesis is a YAML file with five phases:

```yaml
id: "MY_TEST_001"
title: "Description of what we're testing"
domain: "battle_state"

constants:
  SOME_ADDRESS: 0x1D27B10
  SOME_OFFSET: 0x18

setup:
  - action: snapshot_memory
    label: "hp_before"
    address: "SOME_ADDRESS + SOME_OFFSET"
    size: 2
    type: u16
  - action: set_breakpoint
    address: "0x4842B0"
    label: "bp_atb"

act:
  - action: continue_execution
    timeout_ms: 5000
    wait_until:
      - "bp_atb"

observe:
  - action: check_breakpoint_hit
    label: "bp_atb"
    expect: hit
  - action: read_registers
    label: "regs_at_bp"

assert:
  - check: breakpoint_was_hit
    label: "bp_atb"
  - check: value_in_range
    label: "hp_before"
    min_val: 1
    max_val: 9999

cleanup:
  - action: delete_breakpoint
    label: "bp_atb"
```

### Available actions

| Action                  | Description                                           |
|-------------------------|-------------------------------------------------------|
| `snapshot_memory`       | Read memory at an address, store with a label          |
| `snapshot_slot`         | Full battle slot snapshot (all fields)                 |
| `set_breakpoint`        | Arm a software breakpoint                              |
| `delete_breakpoint`     | Remove a breakpoint                                    |
| `write_pending_action`  | Inject a command into the pending action buffer        |
| `write_memory`          | Write a value to an arbitrary address                  |
| `wait`                  | Sleep for `timeout_ms` milliseconds                    |
| `continue_execution`    | Resume until one `wait_until` BP is hit or timeout     |
| `check_breakpoint_hit`  | Log whether a labeled BP was hit                       |
| `read_registers`        | Capture GP register state                              |
| `read_stacktrace`       | Capture the call stack                                 |
| `read_global`           | Read a typed value from an address                     |
| `read_pending_action`   | Read and decode a pending action entry                 |
| `read_phase_flags`      | Read battle loop state machine globals                 |
| `read_action_globals`   | Read transient action-resolution globals               |
| `sync_to_battle_tick`   | Pause at a battle-tick boundary (handles any game state)|
| `restore_snapshot`      | Write a previously-captured snapshot back to memory     |
| `set_enemy_hp_all_10000`| FF8 action: set live enemy slot HP to 10,000           |

### Available assertions

| Check                | Description                                          |
|----------------------|------------------------------------------------------|
| `breakpoint_was_hit` | Assert a labeled breakpoint was reached              |
| `breakpoint_not_hit` | Assert a labeled breakpoint was NOT reached          |
| `value_equals`       | Assert a snapshot equals an expected value            |
| `value_changed`      | Assert two snapshots (before/after) differ           |
| `value_in_range`     | Assert a snapshot falls within [min_val, max_val]    |
| `value_not_zero`     | Assert a snapshot is non-zero                        |
| `any_of`             | Pass if at least one sub-check in `checks` passes    |

### Address expressions

The `address` field supports arithmetic over named constants:

```yaml
constants:
  BATTLE_SLOT_DATA: 0x1D27B10
  SLOT_STRIDE: 0xD0
  HP_OFFSET: 0x18

setup:
  - action: snapshot_memory
    address: "BATTLE_SLOT_DATA + 4 * SLOT_STRIDE + HP_OFFSET"
    # resolves to 0x1D27B10 + 4*0xD0 + 0x18 = 0x1D27E68
```

### continue_execution contract

Every `continue_execution` step must define both:

- `timeout_ms`: maximum wait budget for the step
- `wait_until`: list of breakpoint labels to wait for

Example:

```yaml
- action: continue_execution
  timeout_ms: 15000
  wait_until:
    - "bp_pending_transfer"
    - "bp_gf_cinematic"
```

The runner will keep continuing execution until one of those breakpoints is
actually hit, or until `timeout_ms` elapses.

## Running a suite

You can run an ordered suite file (`*.suite.yaml`) that lists hypotheses and
actions to run before each hypothesis.

Example:

```yaml
id: "GF_BETWEEN_HOOKS_001"
title: "GF hypotheses with reseed + wait"

hypotheses:
  - "ff8re/tests/tier3_inject/GF_QUEZACOTL_001.yaml"
  - "ff8re/tests/tier3_inject/GF_SHIVA_001.yaml"
  - "ff8re/tests/tier3_inject/GF_IFRIT_001.yaml"

before_each:
  - action: set_enemy_hp_all_10000
    label: "reseed_enemy_hp"
  - action: wait
    label: "cooldown_between_hypotheses"
    timeout_ms: 2000
    fields:
      resume_execution: true
```

The `before_each` actions run before each hypothesis.
Set `fields.resume_execution: true` on `wait` to force debugger resume during
the wait window (useful to let combat state settle before next injection).

## Hypothesis catalog

Tests are organized by tier (increasing risk/complexity):

```
tests/
  tier1_layout/       # Pure memory reads, no execution control
    SLOT_001.yaml     # Validate slot array layout and HP fields
  tier2_observe/      # Breakpoints only, no memory writes
  tier3_inject/       # Write memory, observe effects
    GF_IFRIT_001.yaml # Inject GF Ifrit command, validate invocation chain
  tier4_behavioral/   # Complex multi-step behavioral tests
```

### Sync: handling any game state

Tests that need execution control should start with `sync_to_battle_tick`.
This action handles all three ways you might hand the game to the runner:

1. **Game running** -- the sync BP fires on the next battle frame tick
2. **Game paused** -- continue runs until the sync BP fires
3. **Game at a BP** -- continue runs until the sync BP fires

After the sync step, the game is paused at a known safe injection point.

```yaml
setup:
  - action: sync_to_battle_tick
    label: "sync"
    address: "0x4842B0"          # BattleATB_TickAndReady
    timeout_ms: 15000
  # Now paused at the start of a battle tick — safe to inject commands
```

## Key addresses (from domain docs)

| Symbol                         | Address      | Notes                          |
|--------------------------------|-------------|--------------------------------|
| `BATTLE_SLOT_DATA`             | `0x1D27B10` | FF8BattleSlotData_s[11], stride 0xD0 |
| `BATTLE_PENDING_ACTION_BUFFER` | `0x1D28D44` | battle_pending_action_entry[3]  |
| `BATTLE_EXEC_QUEUE_BYTES`      | `0x1D288E8` | Execution queue byte array      |
| `BattleATB_TickAndReady`       | `0x4842B0`  | ATB increment function          |
| `BattlePendingAction_Write`    | `0x484D20`  | Writes pending action entry     |
| `BattleAction_ResolveAndApplyDamage` | `0x48FE20` | Main resolve entry        |
| `Battle_ApplyDamageOrHeal`     | `0x494410`  | HP modification function        |
| `BattleActionSequence_Tick_GF_Cinematic` | `0x50B2A0` | GF cinematic dispatcher |
| `GF_Ifrit_InvokeSummonScript`  | `0xB25780`  | Ifrit entry function            |
| `GF_Ifrit_SequenceTick`        | `0xB25DF0`  | Ifrit per-frame tick            |

## Confirmed command_id values (pending action)

| command_id | Command | Evidence |
|------------|---------|----------|
| 0x01 | Attack | BP capture: player Attack confirm |
| 0x02 | Magic | Injection: cmd_id=0x02 cast "Fira" |
| 0x03 | GF | BP capture: player GF Ifrit confirm |

## GF kernel IDs (command_arg for GF commands)

GF `command_arg` uses kernel ability IDs, **NOT** sequential 0-based GF indices:

| command_arg | GF | Evidence |
|-------------|-----|----------|
| 0x42 (66) | Ifrit | BP capture at `BattlePendingAction_Write` during Ifrit summon |

## Direct GF injection via curl

Inject GF Ifrit into pending action entry 0 while game is running in battle:

```bash
curl -X POST http://127.0.0.1:13337/mcp ^
  -H "Content-Type: application/json" ^
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"py_eval\",\"arguments\":{\"code\":\"import idc\\nimport ida_dbg\\nbase = 0x1D28D44\\nfor off, val in enumerate([0x08, 0x80, 0x00, 0x03, 0x42, 0x00, 0x00, 0x01]):\\n    idc.patch_dbg_byte(base + off, val)\\nida_dbg.invalidate_dbgmem_contents(base, 8)\\nprint('GF Ifrit injected')\"}}}"
```

Raw bytes breakdown: `08 80 00 03 42 00 00 01`

| Byte(s) | Field | Value | Meaning |
|---------|-------|-------|---------|
| `08 80` | target_mask | 0x8008 | GF targeting flags (little-endian) |
| `00` | attacker_slot | 0 | Party member 0 |
| `03` | command_id | 0x03 | GF |
| `42` | command_arg | 0x42 | Ifrit |
| `00 00` | padding | 0 | Unused |
| `01` | active | 1 | Entry is live |

**Important**: Use `idc.patch_dbg_byte` for writing. `ida_dbg.write_dbg_memory` silently fails on the `active` flag byte at offset +7.

## MCP server notes

- Standard IDB tools (decompile, lookup, etc.) use `/mcp`
- Debugger tools (`dbg_read`, `dbg_write`, `dbg_add_bp`, `dbg_continue`, etc.) use `/mcp?ext=dbg`
- The `McpClient` handles routing automatically based on tool name prefix
- `dbg_continue` blocks until the process suspends (breakpoint hit, exception, or manual break)
- After continue returns, EIP is compared against active breakpoint addresses to detect which fired
- For direct Python execution in IDA: use `py_eval` tool via `/mcp` endpoint

## Keep breakpoints after run

Use `--keep-breakpoints` with the `run` subcommand to skip breakpoint deletion
during cleanup:

```bash
python -m ff8re run --keep-breakpoints ff8re/tests/tier3_inject/GF_IFRIT_001.yaml
```

This preserves breakpoints created by the hypothesis so you can inspect and
continue manually in IDA after the script ends.
