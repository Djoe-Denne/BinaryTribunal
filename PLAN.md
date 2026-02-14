# FF8 Battle Reverse Engineering — Test Framework Plan

## Situation Assessment

### What exists today

You have a rich, layered research corpus:

- **15 domain documents** reconstructing FF8's battle internals: slot layout (`FF8BattleSlotData_s[11]` at `0x1D27B10`, stride `0xD0`), the pending→exec→arbitration command pipeline, the 7-stage action resolution flow, ATB tick logic, command menu state machines, GF invocation chains, status access patterns, and more.
- **15 prose test plans** that describe *what to test* (breakpoints, memory watches, scenario matrices, pass criteria) but are **not executable**. They're human instructions, not machine instructions.
- **One working tool** (`gf_batch_discovery.py`) that demonstrates a viable pattern: a Python `McpClient` class issuing JSON-RPC calls to `http://127.0.0.1:13337/mcp`, calling tools like `decompile`, `lookup_funcs`, `disasm`, `rename`, etc.
- **A live debugging session** in IDA Pro with a paused battle, process memory accessible, and the MCP server exposing debugger extensions (`dbg_add_bp`, `dbg_read_mem`, `dbg_write_mem`, `dbg_continue`, `dbg_run_to`, `dbg_regs`, `dbg_stacktrace`, etc.).

### What's missing

There is no **executable bridge** between the prose test plans and the MCP debugger. No engine can:

1. Declare "I hypothesize that writing `command_id=0x02` to the pending action buffer and continuing execution will cause `BattleAction_ResolveAndApplyDamage` to be hit with `COMMAND_TYPE_ID=0x02`."
2. Mechanically execute that sequence (write memory → set breakpoint → continue → wait for hit → read globals).
3. Collect structured evidence (before/after snapshots, breakpoint hit records, register dumps).
4. Package it for AI semantic analysis.

The gap is an **executable hypothesis runner** — a deterministic engine that turns structured test definitions into MCP call sequences and produces structured evidence payloads.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Hypothesis Catalog                        │
│  YAML/Python definitions of testable RE hypotheses          │
│  (what to set up, what to do, what to observe, what passes) │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Test Runner Engine                        │
│  Deterministic Python orchestrator                          │
│                                                             │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │MemoryOps│  │Breakpoint│  │ Command  │  │  Evidence   │  │
│  │ R/W snap│  │ Manager  │  │ Injector │  │  Collector  │  │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       └────────────┴─────────────┴───────────────┘          │
│                         │                                   │
│                    McpClient                                │
│              (JSON-RPC over HTTP)                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              IDA Pro MCP Server (:13337)                     │
│  dbg_read_mem / dbg_write_mem / dbg_add_bp / dbg_continue   │
│  dbg_regs / dbg_stacktrace / dbg_run_to / ...               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  FF8 Process    │
                 │  (paused battle)│
                 └─────────────────┘

                       ···

         Evidence JSON is produced per test.
         Fed to AI model for semantic verdict.
```

---

## Component Design

### 1. Hypothesis Definition Schema

Each hypothesis is a self-contained, declarative test case. Defined either in YAML (for catalog-driven execution) or as Python dataclasses (for programmatic composition).

```yaml
# Example: test_pending_action_attack.yaml
id: "PEND_001"
title: "Writing an Attack command to the pending action buffer triggers the resolve pipeline"
domain: "action_resolution"
confidence_target: "high"

# What RE documents support this hypothesis
references:
  - "tech/battle_state_reconstruction.md"
  - "tech/domain_action_resolution_pipeline.md"

# Known addresses and constants
constants:
  BATTLE_PENDING_ACTION_BUFFER: 0x1D28D44
  BATTLE_SLOT_DATA: 0x1D27B10
  SLOT_STRIDE: 0xD0
  HP_OFFSET: 0x18
  RESOLVE_FUNC: 0x48FE20         # BattleAction_ResolveAndApplyDamage
  APPLY_DAMAGE_FUNC: 0x494410    # Battle_ApplyDamageOrHeal
  COMMAND_TYPE_ID_GLOBAL: ...     # address of COMMAND_TYPE_ID transient global

# Phase 1: Setup — capture initial state
setup:
  - action: snapshot_memory
    label: "slot_4_hp_before"
    address: "BATTLE_SLOT_DATA + 4 * SLOT_STRIDE + HP_OFFSET"
    size: 4
    type: u32

  - action: set_breakpoint
    address: "RESOLVE_FUNC"
    label: "bp_resolve"

  - action: set_breakpoint
    address: "APPLY_DAMAGE_FUNC"
    label: "bp_apply_damage"

# Phase 2: Act — inject the stimulus
act:
  - action: write_pending_action
    slot: 0                       # pending action entry index
    fields:
      target_mask: 0x10           # target slot 4 (enemy)
      attacker_slot: 1            # party member 1
      command_id: 0x01            # Attack
      command_arg: 0x00
      active: 0x01

  - action: continue_execution
    timeout_ms: 5000
    stop_on:
      - "bp_resolve"
      - "bp_apply_damage"

# Phase 3: Observe — collect evidence after stimulus
observe:
  - action: check_breakpoint_hit
    label: "bp_resolve"
    expect: hit

  - action: read_registers
    label: "regs_at_resolve"

  - action: read_global
    label: "command_type_at_resolve"
    address: "COMMAND_TYPE_ID_GLOBAL"
    type: u8

  - action: continue_execution
    timeout_ms: 5000
    stop_on:
      - "bp_apply_damage"

  - action: check_breakpoint_hit
    label: "bp_apply_damage"
    expect: hit

  - action: snapshot_memory
    label: "slot_4_hp_after"
    address: "BATTLE_SLOT_DATA + 4 * SLOT_STRIDE + HP_OFFSET"
    size: 4
    type: u32

# Phase 4: Assert — deterministic pass/fail checks
assert:
  - check: breakpoint_was_hit
    label: "bp_resolve"

  - check: breakpoint_was_hit
    label: "bp_apply_damage"

  - check: value_changed
    before: "slot_4_hp_before"
    after: "slot_4_hp_after"

# Phase 5: Cleanup
cleanup:
  - action: delete_breakpoint
    label: "bp_resolve"
  - action: delete_breakpoint
    label: "bp_apply_damage"

# Phase 6: AI verdict prompt (sent only after deterministic execution)
verdict_prompt: |
  You are analyzing evidence from a reverse engineering hypothesis test on FF8's battle system.

  Hypothesis: Writing a pending action with command_id=0x01 (Attack) targeting slot 4
  causes the resolve pipeline (0x48FE20) and damage application (0x494410) to execute,
  and slot 4's HP to change.

  Evidence collected:
  {evidence_json}

  Based on this evidence:
  1. Is the hypothesis confirmed, partially confirmed, or refuted?
  2. What do the register values at the resolve breakpoint tell us about how the
     command was dispatched?
  3. Are there any unexpected observations?
  4. What follow-up hypotheses would you suggest?
```

### 2. McpClient (transport layer)

Reuse and harden the existing pattern from `gf_batch_discovery.py`:

```python
class McpClient:
    """JSON-RPC client for IDA Pro MCP server."""

    def __init__(self, base_url="http://127.0.0.1:13337"):
        self.url = base_url.rstrip("/") + "/mcp"
        self.req_id = 0

    def call(self, method: str, **kwargs) -> Any:
        """Low-level JSON-RPC call."""
        ...

    # —— Convenience wrappers ——

    def read_u8(self, addr: int) -> int: ...
    def read_u16(self, addr: int) -> int: ...
    def read_u32(self, addr: int) -> int: ...
    def read_bytes(self, addr: int, size: int) -> bytes: ...
    def write_bytes(self, addr: int, data: bytes) -> None: ...
    def write_u8(self, addr: int, val: int) -> None: ...
    def write_u16(self, addr: int, val: int) -> None: ...
    def write_u32(self, addr: int, val: int) -> None: ...

    def add_breakpoint(self, addr: int) -> None: ...
    def delete_breakpoint(self, addr: int) -> None: ...
    def list_breakpoints(self) -> list[dict]: ...

    def continue_exec(self) -> None: ...
    def run_to(self, addr: int) -> None: ...
    def step_over(self) -> None: ...
    def step_into(self) -> None: ...

    def get_regs(self) -> dict: ...
    def get_gpregs(self) -> dict: ...
    def stacktrace(self) -> list[dict]: ...

    def decompile(self, addr: int) -> str: ...
```

Key design note: the MCP server's debugger tools are behind `?ext=dbg`. The existing `McpClient` in `gf_batch_discovery.py` posts to `/mcp`. You may need to post to `/mcp?ext=dbg` for debugger operations, or the server may route automatically. **Verify this early.**

### 3. FF8 Battle Primitives (domain layer)

A thin domain-aware layer that encodes your RE knowledge into reusable operations:

```python
class FF8BattleState:
    """Domain primitives for FF8 battle memory manipulation."""

    SLOT_BASE = 0x1D27B10
    SLOT_STRIDE = 0xD0
    PENDING_BASE = 0x1D28D44
    PENDING_STRIDE = 0x08
    EXEC_QUEUE_BYTES = 0x1D288E8
    EXEC_QUEUE_MASKS = 0x1D288EE

    def __init__(self, mcp: McpClient):
        self.mcp = mcp

    # ── Slot access ──
    def slot_addr(self, slot_id: int, offset: int = 0) -> int:
        return self.SLOT_BASE + slot_id * self.SLOT_STRIDE + offset

    def read_hp(self, slot_id: int) -> int:
        return self.mcp.read_u32(self.slot_addr(slot_id, 0x18))

    def write_hp(self, slot_id: int, hp: int) -> None:
        self.mcp.write_u32(self.slot_addr(slot_id, 0x18), hp)

    def read_status1(self, slot_id: int) -> int:
        return self.mcp.read_u32(self.slot_addr(slot_id, 0x80))

    def read_status2(self, slot_id: int) -> int:
        return self.mcp.read_u32(self.slot_addr(slot_id, 0x08))

    def read_atb(self, slot_id: int) -> tuple[int, int]:
        cur = self.mcp.read_u32(self.slot_addr(slot_id, 0x14))
        max_ = self.mcp.read_u32(self.slot_addr(slot_id, 0x10))
        return cur, max_

    def snapshot_slot(self, slot_id: int) -> dict:
        """Full slot snapshot for before/after comparison."""
        base = self.slot_addr(slot_id)
        raw = self.mcp.read_bytes(base, self.SLOT_STRIDE)
        return {
            "slot_id": slot_id,
            "raw_hex": raw.hex(),
            "hp": self.read_hp(slot_id),
            "max_hp": self.mcp.read_u32(self.slot_addr(slot_id, 0x1C)),
            "status1": hex(self.read_status1(slot_id)),
            "status2": hex(self.read_status2(slot_id)),
            "atb_cur": self.read_atb(slot_id)[0],
            "atb_max": self.read_atb(slot_id)[1],
            "crisis_level": self.mcp.read_u8(self.slot_addr(slot_id, 0xCA)),
        }

    # ── Pending action injection ──
    def write_pending_action(self, entry_index: int, target_mask: int,
                              attacker_slot: int, command_id: int,
                              command_arg: int, active: int = 1) -> None:
        base = self.PENDING_BASE + entry_index * self.PENDING_STRIDE
        self.mcp.write_u16(base + 0, target_mask)
        self.mcp.write_u8(base + 2, attacker_slot)
        self.mcp.write_u8(base + 3, command_id)
        self.mcp.write_u8(base + 4, command_arg)
        self.mcp.write_u8(base + 7, active)

    def read_pending_action(self, entry_index: int) -> dict:
        base = self.PENDING_BASE + entry_index * self.PENDING_STRIDE
        return {
            "target_mask": hex(self.mcp.read_u16(base + 0)),
            "attacker_slot": self.mcp.read_u8(base + 2),
            "command_id": hex(self.mcp.read_u8(base + 3)),
            "command_arg": hex(self.mcp.read_u8(base + 4)),
            "active": self.mcp.read_u8(base + 7),
        }

    # ── Phase flags ──
    def read_phase_flags(self) -> dict:
        """Read the battle loop state machine globals."""
        # Addresses to be filled from your IDA analysis
        return {
            "mode_state_global": ...,
            "mode3_substep": ...,
            "mode3_subsub_step": ...,
            "mode_3_subsubsubstep": ...,
        }
```

### 4. Test Runner Engine

The core orchestrator. It reads hypothesis definitions, executes them step by step, and collects evidence:

```python
@dataclass
class Evidence:
    """Accumulated evidence from a test execution."""
    test_id: str
    title: str
    timestamp: str
    snapshots: dict[str, Any]         # label -> value
    breakpoint_hits: dict[str, bool]  # label -> was_hit
    register_dumps: dict[str, dict]   # label -> register dict
    stacktraces: dict[str, list]      # label -> stacktrace
    assertions: list[dict]            # {check, passed, detail}
    raw_log: list[str]                # chronological execution log
    duration_ms: float

class HypothesisRunner:
    """Deterministic test executor for RE hypotheses."""

    def __init__(self, mcp: McpClient, battle: FF8BattleState):
        self.mcp = mcp
        self.battle = battle

    def run(self, hypothesis: HypothesisDefinition) -> Evidence:
        evidence = Evidence(test_id=hypothesis.id, ...)

        # Phase 1: Setup
        for step in hypothesis.setup:
            self._exec_step(step, evidence)

        # Phase 2: Act
        for step in hypothesis.act:
            self._exec_step(step, evidence)

        # Phase 3: Observe
        for step in hypothesis.observe:
            self._exec_step(step, evidence)

        # Phase 4: Assert (deterministic)
        for check in hypothesis.asserts:
            self._eval_assert(check, evidence)

        # Phase 5: Cleanup
        for step in hypothesis.cleanup:
            self._exec_step(step, evidence)

        return evidence

    def _exec_step(self, step, evidence):
        """Dispatch a single step to the appropriate primitive."""
        match step.action:
            case "snapshot_memory":
                val = self.mcp.read_bytes(step.resolved_address, step.size)
                evidence.snapshots[step.label] = self._interpret(val, step.type)
            case "set_breakpoint":
                self.mcp.add_breakpoint(step.resolved_address)
                evidence.breakpoint_hits[step.label] = False  # not yet hit
            case "write_pending_action":
                self.battle.write_pending_action(...)
            case "continue_execution":
                self._continue_and_wait(step, evidence)
            case "check_breakpoint_hit":
                # after continue returned, check if we stopped at this BP
                ...
            case "read_registers":
                evidence.register_dumps[step.label] = self.mcp.get_gpregs()
            ...

    def _continue_and_wait(self, step, evidence):
        """
        Continue execution and wait for a breakpoint hit or timeout.

        CRITICAL DESIGN DECISION: The MCP server's dbg_continue is
        synchronous from IDA's perspective — IDA resumes the process
        and the next MCP call blocks until the debugger suspends again
        (breakpoint hit, exception, or manual break).

        The runner polls dbg_regs or similar to detect suspension state.
        """
        self.mcp.continue_exec()
        # After this returns, the process is stopped again.
        # Check EIP against known breakpoint addresses to determine which hit.
        regs = self.mcp.get_gpregs()
        eip = regs.get("eip") or regs.get("rip")
        for label, addr in self._active_breakpoints.items():
            if eip == addr or eip == addr + 1:  # INT3 stops at BP+1 on x86
                evidence.breakpoint_hits[label] = True
                evidence.raw_log.append(f"BP hit: {label} @ {hex(addr)}")
                break
```

### 5. Evidence Serializer & AI Verdict

After deterministic execution, the evidence is serialized to JSON and optionally sent to an AI model:

```python
def serialize_evidence(evidence: Evidence) -> str:
    """Produce a JSON payload suitable for AI analysis."""
    return json.dumps({
        "test_id": evidence.test_id,
        "title": evidence.title,
        "timestamp": evidence.timestamp,
        "duration_ms": evidence.duration_ms,
        "snapshots": evidence.snapshots,
        "breakpoint_hits": evidence.breakpoint_hits,
        "register_dumps": {k: {r: hex(v) if isinstance(v, int) else v
                                for r, v in d.items()}
                           for k, d in evidence.register_dumps.items()},
        "stacktraces": evidence.stacktraces,
        "assertions": evidence.assertions,
        "deterministic_result": "PASS" if all(a["passed"] for a in evidence.assertions) else "FAIL",
    }, indent=2)


def request_ai_verdict(evidence_json: str, prompt_template: str) -> str:
    """
    Send evidence to an AI model for semantic analysis.
    Uses Anthropic API (or any configured endpoint).
    Returns the AI's textual verdict.
    """
    prompt = prompt_template.replace("{evidence_json}", evidence_json)
    # Call Claude API, return response text
    ...
```

---

## Implementation Phases

### Phase 0 — MCP Transport Validation (1 session)

**Goal**: Confirm that every MCP primitive you need actually works with the live debugging session.

Write a small `mcp_smoke_test.py` that:

1. Reads `BATTLE_SLOT_DATA[0].current_hp` via `dbg_read_mem`.
2. Writes a known value, reads it back, restores original.
3. Sets a breakpoint at `BattleATB_TickAndReady` (`0x4842B0`), continues, verifies it fires.
4. Reads registers at the breakpoint.
5. Reads the stacktrace.
6. Deletes the breakpoint and continues.

This validates the full MCP debugger API surface before building anything on top.

**Key unknowns to resolve**:
- Does `dbg_continue` block until the debugger suspends, or is it fire-and-forget requiring polling?
- What is the exact tool name and parameter schema for `dbg_read_mem` / `dbg_write_mem`? (The AGENT.md says `dbg_read(regions)` / `dbg_write(regions)` — confirm the `regions` format.)
- Does `dbg_add_bp` return confirmation? How do you detect which breakpoint was hit after `dbg_continue`?
- Is `?ext=dbg` needed on the URL, or are dbg tools always available?

### Phase 1 — Core Framework (2-3 sessions)

Build the layered stack:

| Layer | File | Purpose |
|-------|------|---------|
| Transport | `ff8re/mcp_client.py` | Hardened McpClient with typed wrappers |
| Domain | `ff8re/battle_state.py` | FF8BattleState: slot R/W, pending action injection, phase flags |
| Schema | `ff8re/hypothesis.py` | Dataclass/YAML schema for hypothesis definitions |
| Runner | `ff8re/runner.py` | HypothesisRunner: setup→act→observe→assert→cleanup |
| Evidence | `ff8re/evidence.py` | Evidence collection, JSON serialization |
| CLI | `ff8re/__main__.py` | `python -m ff8re run tests/PEND_001.yaml` |

### Phase 2 — Foundational Hypothesis Catalog (3-5 sessions)

Convert existing test plans into executable hypotheses, prioritized by domain dependency:

**Tier 1 — Memory layout validation (no execution needed)**:
- `SLOT_001`: Validate slot array base, stride, and field offsets by reading known live values.
- `SLOT_002`: Validate pending action buffer layout by reading the currently-queued entry.
- `SLOT_003`: Validate phase flag globals match expected active-battle state.

**Tier 2 — Passive observation (breakpoints only, no memory writes)**:
- `ATB_001`: Set BP on `BattleATB_TickAndReady`, continue, confirm it fires repeatedly.
- `ARB_001`: Set BP on `BattleArbitration_SelectNextAction`, observe which slot is selected.
- `PIPE_001`: Set BPs across the 5-stage resolve chain, continue through one full action, confirm stage ordering.

**Tier 3 — Active injection (write memory, observe effects)**:
- `PEND_001`: Inject an Attack command into pending buffer, verify resolve pipeline fires and target HP changes.
- `PEND_002`: Inject a Magic command (e.g., Fire), verify `COMMAND_TYPE_ID` is set to magic type.
- `HP_001`: Write HP to 1 on a party slot, verify `crisis_level` changes on next menu state init.
- `STATUS_001`: Write `STATUS2_STOP` flag onto a slot, verify ATB tick rejects readiness.

**Tier 4 — Complex behavioral hypotheses**:
- `REFLECT_001`: Set up a curative spell targeting a reflected slot, trace through `computeCurativeMagic`.
- `BERSERK_001`: Apply Berserk status, verify auto-command path fires instead of menu.
- `GF_001`: Validate GF invocation chain for a known-good GF (Quezacotl).
- `RNG_001`: Execute same action multiple times, observe damage variance to locate RNG dependency.

### Phase 3 — Reporting & AI Integration (1-2 sessions)

- JSON evidence files written per test run to `evidence/`.
- Markdown summary reports generated per batch.
- Optional AI verdict integration (call Claude API with evidence + hypothesis context).
- Diff-based regression: compare evidence across runs to detect if game state changes alter behavior.

### Phase 4 — Catalog Growth (ongoing)

Each new domain doc or test plan you write gets a companion executable hypothesis. The framework becomes the single source of truth for *tested* vs *hypothesized* knowledge.

---

## Directory Structure

```

├── product/
│   └── battle.md                         # product-level design doc
├── tech/
│   ├── battle_state_reconstruction.md    # domain docs (existing)
│   ├── domain_action_resolution_pipeline.md
│   ├── ...
│   └── test/
│       ├── battle_main_loop_test-plan.md # prose test plans (existing)
│       └── ...
├── evidence/                             # NEW: test run outputs
│   ├── 2026-02-13T19:00:00_SLOT_001.json
│   └── ...
├── tools/
│   └── gf_batch_discovery.py             # existing tool
└── ff8re/                                # NEW: test framework
    ├── __init__.py
    ├── __main__.py                       # CLI entry point
    ├── mcp_client.py                     # transport layer
    ├── battle_state.py                   # FF8 domain primitives
    ├── hypothesis.py                     # schema + loader
    ├── runner.py                         # orchestrator
    ├── evidence.py                       # collection + serialization
    ├── verdict.py                        # AI integration (optional)
    └── tests/                            # hypothesis definitions
        ├── tier1_layout/
        │   ├── SLOT_001.yaml
        │   ├── SLOT_002.yaml
        │   └── SLOT_003.yaml
        ├── tier2_observe/
        │   ├── ATB_001.yaml
        │   ├── ARB_001.yaml
        │   └── PIPE_001.yaml
        ├── tier3_inject/
        │   ├── PEND_001.yaml
        │   ├── PEND_002.yaml
        │   ├── HP_001.yaml
        │   └── STATUS_001.yaml
        └── tier4_behavioral/
            ├── REFLECT_001.yaml
            ├── BERSERK_001.yaml
            ├── GF_001.yaml
            └── RNG_001.yaml
```

---

## Critical Design Decisions to Make Early

### 1. Breakpoint hit detection strategy

The MCP server likely makes `dbg_continue` block until suspension. After it returns, you read `EIP/RIP` to determine *which* breakpoint was hit. But FF8 is 32-bit, so it's `EIP`. Verify:
- Does `dbg_continue` return only after the process suspends?
- Does the register read after continue reflect the breakpoint location?
- On x86, INT3 stops *at* the breakpoint address or *after* it?

### 2. Timeout and deadlock handling

If you set a breakpoint that never fires and call `dbg_continue`, you block forever. Options:
- **Option A**: Use `dbg_run_to` with a known-safe "loop top" address as a fallback target.
- **Option B**: Use the `py_eval` tool to run a timed wait in IDA's Python environment.
- **Option C**: Run MCP calls with HTTP-level timeouts and treat timeout as "breakpoint not hit."

Recommend **Option C** for simplicity, with Option A as a safety net for long-running tests.

### 3. YAML vs Python for hypothesis definitions

- **YAML** is better for catalog-driven batch execution, non-programmer readability, and serialization.
- **Python dataclasses** are better for complex hypotheses that require computed addresses or conditional logic.
- **Recommendation**: Support both. YAML for simple cases, Python for complex ones. The runner accepts either.

### 4. State restoration

Injecting memory changes (HP writes, status flag writes, pending action writes) can corrupt the battle state. Every test must:
- Snapshot before modifying.
- Restore after observing.
- Or accept that the battle state is consumed (single-use test, reload save afterward).

Recommend: **explicit `cleanup` phase per test** + a `--destructive` flag for tests that knowingly corrupt state.

### 5. Synchronization with game loop

FF8's battle loop ticks continuously. After injecting a pending action, the loop must tick at least once for the action to enter the arbitration path. This means:
- `continue_execution` must let the loop run far enough for the action to be picked up.
- Multiple breakpoints at different pipeline stages may need sequential continue/stop cycles.
- The test runner must support **multi-step continue** (continue → hit BP1 → observe → continue → hit BP2 → observe).

This is already reflected in the schema's `observe` phase allowing multiple `continue_execution` + `check_breakpoint_hit` sequences.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `dbg_continue` is fire-and-forget, not blocking | Runner can't detect when process stops | Use polling loop on `dbg_regs` with timeout |
| Breakpoint at function entry clobbers first instruction | Possible crash on resume | MCP server likely handles software BP correctly; test in Phase 0 |
| Pending action injection races with game loop tick | Action consumed before observation starts | Inject while paused, set all observe BPs before continuing |
| INT3 address is off-by-one from expected | Wrong BP detection | Compare EIP against both addr and addr-1 |
| Process crash during test | Lost debugging session | Save IDA snapshot before each test batch; keep savestate ready |
| MCP call latency adds up across many steps | Slow test execution | Batch reads where possible (`read_struct` for full slot) |

---

## Immediate Next Steps

1. **Phase 0**: Write `mcp_smoke_test.py`. Run it. Resolve all transport unknowns.
2. **Codify `McpClient`** with the exact tool names and parameter schemas discovered in Phase 0.
3. **Build `FF8BattleState`** with the addresses already confirmed in your domain docs.
4. **Convert `SLOT_001`** (simplest: just read slots, no execution) as the first end-to-end test.
5. **Iterate**: each successful test unlocks the next tier.

The framework is an investment — but once the runner works, every future hypothesis becomes a YAML file away from being tested. The RE knowledge stops being prose and starts being *proven*.
