# Chronicle: GF_IFRIT_001 -- From First Guess to Full Proof

This document traces the complete evolution of our GF Ifrit injection
hypothesis, from the initial naive attempt through every failure, insight,
and design change that led to a fully automated, 7/7 PASS test.

---

## The Goal

Prove that writing specific bytes into FF8's pending action buffer at
`0x1D28D44` triggers the complete GF Ifrit summon sequence -- from command
consumption through cinematic dispatch to per-frame animation ticking --
without any manual player input.

---

## Chapter 1: The Framework Doesn't Exist Yet

### Starting point

We had domain knowledge documents describing FF8's battle memory layout
(slot arrays, pending action buffer, battle loop functions) but no way to
*test* that knowledge automatically. Every hypothesis was verified by
hand: set a breakpoint in IDA, click through the game menus, squint at
memory.

### Decision: build `ff8re`

We designed a five-phase hypothesis runner:

```
setup -> act -> observe -> assert -> cleanup
```

Each phase is declared in YAML. The runner talks to IDA Pro's debugger
through an MCP server (JSON-RPC over HTTP). The key insight was that a
hypothesis should be **self-contained** -- it carries its own constants,
breakpoint definitions, memory reads, and pass/fail criteria.

### First schema (v0.1)

```yaml
id: "GF_IFRIT_001"
setup:
  - action: snapshot_memory
    address: "0x1D28D44"
    size: 8
act:
  - action: continue_execution
observe:
  - action: check_breakpoint_hit
    label: "bp_cinematic"
assert:
  - check: breakpoint_was_hit
    label: "bp_cinematic"
cleanup:
  - action: delete_breakpoint
    label: "bp_cinematic"
```

Problem: the test assumed the user would manually trigger the GF summon.

---

## Chapter 2: "I Don't Want to Click the Menu"

### The user's feedback

> *"As a user, I have to manually enter the command. I would like the order
> to be entered by the execution of the hypothesis."*

This was the pivotal moment. The test needed to **inject** the GF command
into memory, not wait for the player to select it from a menu.

### Tier promotion: tier2_observe -> tier3_inject

The test file was moved from `tests/tier2_observe/` to
`tests/tier3_inject/`. New actions were added to the schema:

- `write_pending_action` -- write command bytes into the pending buffer
- `sync_to_battle_tick` -- pause at a known battle-frame boundary so
  injection happens at a safe point
- `restore_snapshot` -- undo the injection during cleanup

### The synchronization problem

The game could be in any state when the test starts: running, paused, or
stopped at an arbitrary breakpoint. We solved this with `sync_to_battle_tick`:
set a temporary breakpoint at `BattleATB_TickAndReady` (`0x4842B0`),
continue execution, wait for it to fire, then remove it. After sync, the
game is paused at the top of a battle frame -- safe to write memory.

---

## Chapter 3: First Injection -- "Fira"

### What we tried

Our initial guess for the pending action entry:

| Field | Value | Reasoning |
|-------|-------|-----------|
| target_mask | 0x0010 | Physical attack targeting |
| command_id | 0x02 | "GF must be command 2" |
| command_arg | 0x02 | "Ifrit is the 3rd GF, 0-indexed" |
| active | 0x01 | Entry is live |

### What happened

> *"I see the character occupying slot 1 trying to cast the spell 'Fira'.
> But it doesn't complete."*

The game interpreted `command_id=0x02` as **Magic**, not GF. The character
began casting a spell. The `command_arg=0x02` mapped to Fira in the spell
table.

### What we learned

- `command_id=0x02` is Magic
- `command_id` values are NOT what the menu UI shows
- We needed to capture the *real* command bytes from a genuine GF summon

---

## Chapter 4: Second Injection -- Crash

### What we tried

Switched to `command_id=0x03` (guessing it was GF), kept `command_arg=0x02`.

### What happened

> *"Something happens -- the character on the first slot tries to invoke a
> spell as if it was a G-Force. The game crashed directly after."*

### What we learned

- `command_id=0x03` IS the correct GF command type (confirmed!)
- `command_arg=0x02` is NOT Ifrit's ID -- it's an invalid or wrong GF index
- GF IDs are not sequential 0-based indices

---

## Chapter 5: The Breakpoint Capture

### The user's idea

> *"You can put a breakpoint on the process that serves to push a command
> in the queue. And I can then try to summon a G-Force which should put
> the corresponding command in the queue and pass by the breakpoint. Then
> you will have all the pleasure of decomposing the memory."*

### What we did

1. Set a breakpoint on `BattlePendingAction_Write` (`0x484D20`)
2. The user manually triggered a GF Ifrit summon in-game
3. The breakpoint fired
4. We read the raw 8 bytes being written to the pending buffer

### The raw bytes

```
08 80 00 03 42 00 00 01
```

Decoded:

| Offset | Field | Value | Meaning |
|--------|-------|-------|---------|
| +0,+1 | target_mask | 0x8008 | GF targeting flags (little-endian) |
| +2 | attacker_slot | 0x00 | Party member 0 |
| +3 | command_id | 0x03 | GF |
| +4 | command_arg | 0x42 | Ifrit (kernel ability ID = 66 decimal) |
| +5,+6 | padding | 0x00 | Unused |
| +7 | active | 0x01 | Entry is live |

### Critical discoveries

- **`command_arg=0x42`** (66 decimal) -- Ifrit uses a kernel ability ID,
  not a sequential GF index. This is why `0x02` crashed: it's a completely
  different GF or an invalid entry.
- **`target_mask=0x8008`** -- GF targeting is different from physical
  attacks (which use `0x0010`). The `0x8008` value likely encodes
  "target all enemies" with a GF-specific flag.

---

## Chapter 6: The Write Reliability Bug

### The silent failure

After obtaining the correct bytes, injection *still* didn't work.
The pending buffer showed all correct values... except the `active` flag
at offset +7, which stubbornly remained `0x00`.

We tried:
- `idaapi.dbg_write_memory(addr, bytes)` -- returned success, byte stayed 0
- `ida_dbg.write_dbg_memory(addr, bytes)` -- same problem
- `ida_dbg.put_dbg_byte(addr, val)` -- attribute not found

### The fix

**`idc.patch_dbg_byte(addr, val)`** was the only function that reliably
wrote to this memory location. We never fully diagnosed why the other APIs
failed -- possibly a memory protection or caching issue specific to this
region. But `idc.patch_dbg_byte` works, and we moved on.

This was documented as a warning in every relevant file:

> *Use `idc.patch_dbg_byte` for writing. `ida_dbg.write_dbg_memory`
> silently fails on the `active` flag byte at offset +7.*

---

## Chapter 7: The Execution Flow Problem

### First successful injection

With the correct bytes (`08 80 00 03 42 00 00 01`) and the working write
API, the GF Ifrit summon was triggered successfully for the first time
via automated injection. But the test runner couldn't keep up.

### The `continue_execution` problem

The original `continue_execution` action simply resumed the process and
checked if a breakpoint was hit. But FF8's battle loop fires breakpoints
on **every frame**:

- `BattlePendingAction_TransferToExecQueue` fires every frame
- `BattleArbitration_SelectNextAction` fires every frame
- `BattleActionSequence_Tick_GF_Cinematic` fires every frame once a GF
  is active

The runner would stop on the first breakpoint it encountered, which was
almost never the one we cared about. It would report "stopped at
EIP=0x4847f0" over and over, never advancing deep enough to see the Ifrit
chain fire.

> *"IOI didn't resume execution, so you can debug why it has failed."*

### The `wait_until` redesign

The user requested a fundamental change:

> *"All steps must have a 'Waiting Until'. That is to say the program must
> wait until the BP is hit. But we also have to put a timeout in the
> definition of the step."*

New `continue_execution` contract:

```yaml
- action: continue_execution
  timeout_ms: 15000
  wait_until:
    - "bp_pending_transfer"
    - "bp_gf_cinematic"
```

The runner now **loops**: resume, check EIP, if it's not one of the
`wait_until` targets, resume again. It only stops when:

1. EIP matches one of the listed breakpoint addresses, OR
2. The timeout expires

### The follow-up question

> *"How does it work if a wait_until instruction has several defined
> breakpoints? Do we wait for one or do we wait for them all?"*

Answer: **any one**. The runner stops as soon as *any* of the listed
breakpoints is matched. This makes the test robust against execution-order
variations.

> *"Should we continue the process if it is stopped on a breakpoint that
> has not been configured in the steps?"*

Answer: **yes**. If the process stops at an EIP that doesn't match any
`wait_until` target (e.g., some OS callback, a different game function),
the runner automatically resumes. This handles spurious stops from
non-game code.

---

## Chapter 8: Progressive Breakpoint Deletion

### The frame-trap problem

Even with `wait_until`, having too many breakpoints active simultaneously
caused issues. Per-frame breakpoints like `bp_pending_transfer` would fire
on every battle tick, forcing the runner into rapid continue-check loops
before the deeper chain had a chance to execute.

### The solution: delete as you go

The test was restructured to progressively remove breakpoints once they'd
served their purpose:

| Phase | Deletes | Why |
|-------|---------|-----|
| Act (step 2e) | `bp_pending_transfer`, `bp_arbitration` | Already confirmed the command was consumed; stop them from re-catching every frame |
| Observe (step 3a) | `bp_gf_cinematic`, `bp_ifrit_entry` | Served as routing targets; no longer needed |
| Observe (step 3d) | `bp_ifrit_tick` | Confirmed tick is running; let counter increment fire cleanly |
| Cleanup | `bp_ifrit_counter_inc` | Last one standing |

This created a "funnel" effect: start with 6 breakpoints covering the
full pipeline, progressively narrow down to the deepest chain confirmation.

---

## Chapter 9: The Callback Pointer Timing Bug

### The assertion

```yaml
- check: value_equals
  label: "callback_ptr_during"
  fields:
    expected: 0xB25780    # GF_Ifrit_InvokeSummonScript
```

### First placement: read after `bp_gf_cinematic`

The callback pointer at `0x21DFEC4` was read immediately after hitting
`BattleActionSequence_Tick_GF_Cinematic`. Result:

```
value_equals:callback_ptr_during: actual=7159216, expected=11687808 FAIL
```

The value `7159216` (0x6D3E30) was a stale pointer from a previous
dispatch. The cinematic function hadn't yet updated the pointer to Ifrit's
entry when we read it.

### The fix: read after `bp_ifrit_tick`

> *"A simpler and more robust fix would be: move the callback pointer read
> to after bp_ifrit_tick is hit -- at that point Ifrit is guaranteed to be
> active and the pointer is set."*

At `GF_Ifrit_SequenceTick` (`0xB25DF0`), Ifrit is actively executing.
The callback pointer must already point to `0xB25780` for the tick to be
called. Reading here is deterministic.

Result: **PASS** (`actual=11687808 = 0xB25780`)

---

## Chapter 10: The Task List Timing Bug

### The assertion

```yaml
- check: value_not_zero
  label: "ifrit_task_list_head"
```

### First placement: read after `bp_ifrit_entry`

`ifrit_task_list_head` at `0x2796E18` was read right after
`GF_Ifrit_InvokeSummonScript` entry. Result:

```
value_not_zero:ifrit_task_list_head: actual=0 FAIL
```

The task list is populated **inside** the function, not at its entry.
At the first instruction of `GF_Ifrit_InvokeSummonScript`, the scheduling
hasn't happened yet.

### The fix: read after `bp_ifrit_counter_inc`

By the time the counter increment at `0xB25DFA` fires, the full Ifrit
sequence is running: context initialized, tasks scheduled, per-frame tick
active. The task list is guaranteed populated.

Result: **PASS** (`actual=41512488 = 0x2796E28`)

---

## Chapter 11: Dropping the Unreliable Assertion

### The assertion

```yaml
- check: breakpoint_was_hit
  label: "bp_gf_cinematic"
```

### Why it failed

The `wait_until` loop in step 2f listed four breakpoints:

```yaml
wait_until:
  - "bp_gf_cinematic"
  - "bp_ifrit_entry"
  - "bp_ifrit_tick"
  - "bp_ifrit_counter_inc"
```

The game processed multiple frames in quick succession. Sometimes
`bp_ifrit_tick` satisfied the `wait_until` condition before
`bp_gf_cinematic` was matched by the runner. The cinematic function *did*
execute (proven by the callback pointer being set), but the runner's loop
happened to catch a later breakpoint first.

### The decision: remove, don't fix

We had a stronger assertion already: `callback_ptr_during == 0xB25780`.
This value can **only** be set by `BattleActionSequence_Tick_GF_Cinematic`
dispatching to Ifrit. If the callback pointer is correct, the cinematic
ran. The breakpoint-hit check was redundant and timing-dependent.

Asserting on memory state is more reliable than asserting on breakpoint
timing.

---

## Chapter 12: The Final Hypothesis

### Structure

```
7 assertions, organized in 4 stages:

Stage 1 - Injection consumed:
  [PASS] sync_atb breakpoint hit
  [PASS] bp_pending_transfer breakpoint hit

Stage 2 - Cinematic dispatch routed to Ifrit:
  [PASS] callback_ptr_during == 0xB25780

Stage 3 - Ifrit sequence running:
  [PASS] bp_ifrit_tick breakpoint hit
  [PASS] bp_ifrit_counter_inc breakpoint hit

Stage 4 - Ifrit internal state initialized:
  [PASS] ifrit_seq_ctx_ptr != 0
  [PASS] ifrit_task_list_head != 0
```

### Evidence highlights (from the passing run)

| Evidence | Value | Meaning |
|----------|-------|---------|
| `callback_ptr_during` | `0xB25780` | GF_Ifrit_InvokeSummonScript |
| `ifrit_seq_ctx_ptr` | `0x27973F0` | Active sequence context |
| `ifrit_task_list_head` | `0x2796E28` | Scheduled task list |
| EIP at counter inc | `0xB25DFA` | Inside GF_Ifrit_SequenceTick+0xA |
| Stacktrace | `GF_Ifrit_SequenceTick+A` | Confirmed call chain |
| Duration | 33.8s | Full automated run |

### The confirmed command bytes

```
08 80 00 03 42 00 00 01
```

These 8 bytes, written to `0x1D28D44`, are sufficient to trigger the
complete GF Ifrit invocation chain in FF8's battle system.

---

## Summary of Iterations

| Version | What changed | Outcome |
|---------|-------------|---------|
| v0.1 | Passive observation, manual GF trigger | Required player interaction |
| v0.2 | Added `write_pending_action`, `sync_to_battle_tick` | Framework can inject |
| v0.3 | `command_id=0x02`, `command_arg=0x02` | Cast "Fira" (wrong command type) |
| v0.4 | `command_id=0x03`, `command_arg=0x02` | Game crash (wrong GF ID) |
| v0.5 | BP capture: `command_arg=0x42`, `target_mask=0x8008` | Correct values identified |
| v0.6 | Switch to `idc.patch_dbg_byte` | Write reliability fixed |
| v0.7 | Add `wait_until` to `continue_execution` | Execution flow fixed |
| v0.8 | Progressive BP deletion | Frame-trap eliminated |
| v0.9 | Move `callback_ptr_during` read to after `bp_ifrit_tick` | 6/7 PASS (timing fix 1) |
| v0.10 | Move `ifrit_task_list_head` read to after `bp_ifrit_counter_inc` | Still had bp_gf_cinematic FAIL |
| v1.0 | Remove `bp_gf_cinematic` assertion (redundant) | **7/7 PASS** |

---

## Lessons Learned

1. **Don't guess command bytes -- capture them.** Our initial assumptions
   about `command_id` and `command_arg` were wrong. Setting a breakpoint
   on the write function and letting the game tell us the real values was
   the breakthrough.

2. **IDA's debugger API has quirks.** `ida_dbg.write_dbg_memory` silently
   fails on certain memory regions. Always verify writes by reading back.
   `idc.patch_dbg_byte` is the reliable fallback.

3. **Timing matters more than you think.** Reading memory at a function's
   entry point catches the state *before* the function executes. Reading
   one function deeper catches the state *after*. Two of our three FAILs
   were pure timing issues.

4. **Assert on state, not on timing.** A memory value being correct is
   deterministic proof. A breakpoint being "hit" depends on the runner's
   polling loop catching it at the right moment. When both are available,
   prefer the state check.

5. **Progressive breakpoint deletion is essential.** In a game loop that
   fires callbacks every frame, having too many breakpoints active creates
   noise. Delete each breakpoint after it has served its purpose.

6. **The hypothesis format evolved with the problem.** We started with
   bare `continue_execution`, added `wait_until`, added `timeout_ms`,
   added progressive deletion patterns. The YAML schema wasn't designed
   upfront -- it grew from real failures.
