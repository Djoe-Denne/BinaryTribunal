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
   records, register dumps, stacktraces, structured hit traces, and
   sampled time-series windows -- into a JSON file.
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

# Validate YAML statically without connecting to a live battle
python -m ff8re validate ff8re/tests/

# Run a suite with before_each hooks
python -m ff8re run ff8re/tests/suites/GF_BETWEEN_HOOKS_001.suite.yaml

# Replay only failed-or-missing suite scenarios from prior evidence
python -m ff8re run --replay --evidence-dir evidence ff8re/tests/suites/GF_BETWEEN_HOOKS_001.suite.yaml

# Keep breakpoints after cleanup (for manual IDA debugging)
python -m ff8re run --keep-breakpoints ff8re/tests/tier3_inject/GF_IFRIT_001.yaml

# Run with custom MCP URL
python -m ff8re --mcp-url http://localhost:13337 smoke

# Override constants for all loaded hypotheses
python -m ff8re run ff8re/tests/tier2_observe/STATUS_WRITER_001.yaml --param WATCH_SLOT=4
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
| `snapshot_all_slots`    | Snapshot all 11 live battle slots                      |
| `set_breakpoint`        | Arm a software breakpoint                              |
| `delete_breakpoint`     | Remove a breakpoint                                    |
| `set_watchpoint`        | Arm a write watchpoint (hardware BP, 1/2/4 bytes)      |
| `delete_watchpoint`     | Remove a write watchpoint                              |
| `write_pending_action`  | Inject a command into the pending action buffer        |
| `write_memory`          | Write a value to an arbitrary address                  |
| `write_slot_status_bits`| Set or clear `status_2` bits on a live slot            |
| `wait`                  | Sleep for `timeout_ms` milliseconds                    |
| `continue_execution`    | Resume until one `wait_until` BP/WP is hit or timeout  |
| `trace_breakpoint_hits` | Repeatedly resume, capture `on_hit`, append `hit_trace`|
| `manual_checkpoint`     | Prompt the operator for an in-game manual action       |
| `sample_memory`         | Periodically capture one or more memory regions        |
| `check_breakpoint_hit`  | Log whether a labeled BP/WP was hit (can auto-delete)  |
| `read_registers`        | Capture GP register state                              |
| `read_stacktrace`       | Capture the call stack                                 |
| `read_stack_args`       | Capture x86 stack arguments at the current stop        |
| `read_global`           | Read a typed value from an address                     |
| `read_pending_action`   | Read and decode a pending action entry                 |
| `read_phase_flags`      | Read battle loop state machine globals (live)          |
| `read_action_globals`   | Read transient action-resolution globals (live)        |
| `read_exec_queue`       | Read structured exec queue bytes + target masks        |
| `read_result_globals`   | Read live result/cleanup globals                       |
| `read_elemental_globals`| Read live elemental/damage metadata globals            |
| `read_rng_state`        | Read candidate live RNG globals when named in the IDB  |
| `sync_to_battle_tick`   | Pause at a battle-tick boundary (handles any game state)|
| `restore_snapshot`      | Write a previously-captured snapshot back to memory     |
| `set_enemy_hp_all_10000`| FF8 action: force live enemy current+max HP (u16 cap)  |

### Available assertions

| Check                     | Description                                          |
|---------------------------|------------------------------------------------------|
| `breakpoint_was_hit`      | Assert a labeled breakpoint/watchpoint was reached   |
| `breakpoint_not_hit`      | Assert a labeled breakpoint/watchpoint was NOT reached |
| `hit_count_at_least`      | Assert a label fired at least `min_val` times        |
| `value_equals`            | Assert a snapshot equals an expected value            |
| `value_changed`           | Assert two snapshots (before/after) differ           |
| `value_in_range`          | Assert a snapshot falls within [min_val, max_val]    |
| `value_not_zero`          | Assert a snapshot is non-zero                        |
| `bits_set`                | Assert all bits in `fields.mask` are set             |
| `bits_clear`              | Assert all bits in `fields.mask` are clear           |
| `value_delta_in_range`    | Assert `(after - before)` falls within a range       |
| `any_of`                  | Pass if at least one sub-check in `checks` passes    |
| `all_of`                  | Pass if all sub-checks in `checks` pass              |
| `slot_field_equals`       | FF8: assert one field in a slot snapshot             |
| `slot_status_any_added`   | FF8: assert one decoded status was added             |
| `slot_killed_if_alive`    | FF8: assert a slot died if it started alive          |
| `slot_hp_decreased_if_alive` | FF8: assert HP dropped if the slot started alive |
| `slot_status_bits_set`    | FF8: assert `status_1`/`status_2` bits were set      |
| `slot_status_bits_cleared`| FF8: assert `status_1`/`status_2` bits were cleared  |
| `pending_bytes_equal`     | FF8: compare pending-entry bytes with ignored offsets|

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

## Validation

Use `validate` to catch schema issues before a live debugging session:

```bash
python -m ff8re validate ff8re/tests/
python -m ff8re validate ff8re/tests/tier2_observe/STATUS_WRITER_001.yaml --param WATCH_SLOT=4
```

Validation checks:

- unknown actions or assertions
- invalid address expressions
- missing `wait_until` / `timeout_ms` contracts on execution-control actions
- malformed watchpoint sizes
- malformed region addresses in `sample_memory`

## Matrix expansion

You can derive multiple concrete hypotheses from one YAML using `params:` and
`matrix:`. `params:` are merged into `constants:` first, then each `matrix`
row produces one expanded hypothesis with an `__suffix`.

```yaml
id: "STATUS_WRITER"
title: "Capture status writer PCs"

constants:
  STATUS2_OFFSET: 0x08

params:
  SLOT_STRIDE: 0xD0

matrix:
  - case: "enemy_slot3"
    WATCH_SLOT: 3
  - case: "enemy_slot4"
    WATCH_SLOT: 4
```

This expands to `STATUS_WRITER__enemy_slot3` and `STATUS_WRITER__enemy_slot4`.

## Injection-driven live scenarios (no manual play)

Command-pipeline live scenarios drive the game by **injecting** a command instead
of asking the player to act during a fragile manual checkpoint. This removes the
human as a point of failure and avoids reacquiring on background (enemy) activity.

The pattern mirrors the tier-3 injection tests:

```yaml
setup:
  - action: sync_to_battle_tick      # pause at a tick boundary (consistent state)
    address: "ATB_TICK"
  - action: set_breakpoint
    label: "bp_pending_transfer"
    address: "PENDING_TRANSFER"
act:
  - action: write_pending_action     # write the command bytes into pending slot 0
    slot: 0
    fields:
      target_mask: "TARGET_MASK"     # fields accept named constants now
      attacker_slot: "ATTACKER_SLOT"
      command_id: "CMD_ID"
      command_arg: "CMD_ARG"
      active: 1
  - action: continue_execution       # let the game consume the injection
    timeout_ms: 15000
    wait_until: ["bp_pending_transfer"]
```

`write_pending_action`, `write_slot_status_bits`, and `write_memory` now resolve
their scalar field values (`command_id`, `mask`, `value`, …) through the same
named-constant/arithmetic evaluator as `address`. Combined with the matrix
(whose per-row keys become constants), this lets one YAML cover a whole command
family: each `matrix` row sets `CMD_ID`/`CMD_ARG`/`TARGET_MASK` for its case.

Because injection writes the pending bytes directly (bypassing
`BattlePendingAction_Write`), the write function is **not** hit — assert on the
**transfer** (`bp_pending_transfer`) instead. `command_id` values are in
`docs/tech/reference/command_id_table.md`.

Some scenarios inject state that is not yet fully reverse-engineered (Doom bit,
Angel Wing bit, status-spell ids, target affinity). Those use clearly-marked
**placeholder constants** (commented `TBD`/`placeholder`) with relaxed `any_of`
asserts so the run still produces evidence; tune the constants from the captured
writer/globals evidence.

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

When running suites, `before_each` hooks are logged to console but are not
persisted as standalone evidence JSON files.

### Replay mode for suites

Use `--replay` with `--evidence-dir` to rerun only scenarios that previously:

- produced `deterministic_result: FAIL`, or
- have no prior evidence JSON (for aborted or missing runs).

Example:

```bash
python -m ff8re run --replay --evidence-dir evidence ff8re/tests/suites/GF_BETWEEN_HOOKS_001.suite.yaml
```

## Hypothesis catalog

Tests are organized by tier (increasing risk/complexity):

```
tests/
  tier1_layout/       # Pure memory reads, no execution control
    SLOT_001.yaml     # Validate slot array layout and HP fields
  tier2_observe/      # Breakpoints only, no memory writes
    PENDING_BYTES_ATTACK_001.yaml
    STATUS_WRITER_001.yaml
  tier3_inject/       # Write memory, observe effects
    GF_IFRIT_001.yaml # Inject GF Ifrit command, validate invocation chain
  tier4_behavioral/   # Complex multi-step behavioral tests
    ESCAPE_COMMIT_001.yaml
    live_followups/
      BATTLE_FRAME_OWNERSHIP_PAUSED_001.yaml
      BATTLE_FRAME_OWNERSHIP_ACTIVE_001.yaml
      RUNTIME_CALLBACK_MIX_MATRIX_001.yaml
      RUNTIME_CALLBACK_MENU_OPEN_001.yaml
      TAKEOVER_AUTHORITATIVE_COUPLING_001.yaml
      BATTLE_NATIVE_CLEANUP_HANDOFF_001.yaml  # Destructive: ends the current battle
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

### Manual checkpoints and live windows

For live FF8 scenarios, prefer **breakpoint-driven reacquire** over forcing a
raw suspend in the middle of rendering or task work. The runner is the single
owner of the pause/resume state and prints, at every step, whether the game is
`EN PAUSE` (runner in control) or `RELANCE` (running freely), plus the exact
in-game action to perform.

`manual_checkpoint` with `fields.resume_execution: true` has **two flavours**,
chosen automatically by whether the step declares `wait_until`:

**Observation checkpoint** (`wait_until` is set) — single keystroke, auto-capture:

1. **ETAPE UNIQUE** — press Enter. The runner resumes the game with the
   breakpoints **left armed**.
2. Perform the in-game action described under `ACTION A FAIRE DANS LE JEU`.
3. The runner reacquires control **automatically** the instant the action trips
   one of the `wait_until` breakpoints, and stays paused for the observe phase.
   You do **not** wait for the animation to finish and you do **not** press Enter
   again. Console prints `JEU EN PAUSE` once the action is captured.

This is essential: the breakpoints must stay armed *during* the action,
otherwise a one-shot action (a single attack confirm) resolves without tripping
anything and is missed.

**Resync checkpoint** (no `wait_until`, only `address` / `sync_address`) —
two keystrokes, used for `before_each` setup windows:

1. **ETAPE 1/2** — press Enter. The runner disables armed breakpoints and resumes
   so you can freely set up the battle (start an encounter, position, etc.).
2. **ETAPE 2/2** — press Enter when ready. The runner realigns to the tick
   boundary, then **resumes the game** so it is not left frozen. Console prints
   `JEU RELANCE`.

Because the game can be left running between steps, `_detect_stop` only reports a
hit when the process is genuinely suspended; a freshly-resumed game can never
falsely "match" the breakpoint it last stopped on.

### Forcing enemy HP in live suites

Live suites that require the player to attack (e.g. `LIVE_FOLLOWUPS_TODO_001`)
reseed enemy HP in `before_each` so a manual hit does not end the fight before
the scenario captures evidence:

```yaml
before_each:
  - action: manual_checkpoint        # prepare battle (resync)
    label: "prepare_next_live_case"
    address: "0x4842B0"
    fields:
      resume_execution: true
  - action: sync_to_battle_tick      # pause for a consistent write
    label: "reseed_sync"
    address: "0x4842B0"
  - action: set_enemy_hp_all_10000   # force current + max HP (u16, capped 0xFFFF)
    label: "reseed_enemy_hp"
    fields:
      hp: 65535
```

Do **not** reseed in suites whose terminal cases require killing the enemy
(e.g. the `victory` case in `LIVE_FOLLOWUPS_EXIT_TERMINAL_001`).

- `sample_memory` with `fields.resume_execution: true` should provide
  `fields.sync_address` so the runner lets the game run for `interval_ms`, then
  reacquires control on a safe breakpoint before reading memory.

Examples:

```yaml
before_each:
  - action: manual_checkpoint
    label: "prepare_next_live_case"
    address: "0x4842B0"
    timeout_ms: 15000
    fields:
      resume_execution: true
```

```yaml
act:
  - action: manual_checkpoint
    label: "trigger_attack_case"
    timeout_ms: 15000
    wait_until:
      - "bp_pending_write"
      - "bp_pending_transfer"
    fields:
      resume_execution: true

observe:
  - action: sample_memory
    label: "window"
    timeout_ms: 1200
    interval_ms: 200
    fields:
      resume_execution: true
      sync_address: "ATB_TICK"
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

## Breakpoint hit counts + auto-delete

Evidence now tracks:

- `breakpoint_hit_counts[label]`: number of times a breakpoint was matched
- `last_breakpoint_hit`: last label matched by the runner
- `hit_trace[]`: ordered stop history with optional `on_hit` captures
- `samples[label][]`: time-series samples collected by `sample_memory`

To avoid per-frame "frame-traps", `check_breakpoint_hit` supports optional fields:

```yaml
- action: check_breakpoint_hit
  label: "bp_gf_cinematic"
  expect: hit
  fields:
    delete_if_hit: true
    min_hits: 1
```

## Watchpoint notes

- Watchpoints are implemented through IDA Python (`py_eval`) and hardware debug
  registers. In practice this means a maximum of **4 simultaneous watchpoints**.
- Valid sizes are `1`, `2`, or `4` bytes, and the watched address should be
  aligned to the size.
- Watchpoint hits are attributed by reading the latest debug event and using
  `bpt.hea` as the watched data address. The captured EIP/RIP is therefore the
  **writer PC**, not the watched address.
