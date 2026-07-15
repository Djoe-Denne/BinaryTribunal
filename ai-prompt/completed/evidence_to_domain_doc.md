# Agent Prompt: Updating a GF Domain Doc from Evidence

## Purpose

You are an AI agent assisting with reverse engineering Final Fantasy VIII's
battle system. After a hypothesis test (e.g., `GF_IFRIT_001`, `GF_SHIVA_001`)
has been executed by the `ff8re` runner, it produces an evidence JSON file in
`evidence/`. This prompt explains how to read that evidence and rewrite
the corresponding GF domain documentation file to reflect runtime-confirmed
facts instead of static analysis or hypotheses.

---

## Inputs

1. **Evidence JSON** — `evidence/<timestamp>_<TEST_ID>.json`
2. **Original domain doc** — `tech/battle/G-Force/domain_gf_<name>_invocation.md`
3. **Hypothesis YAML** — `ff8re/tests/tier3_inject/<TEST_ID>.yaml` (for reference)

---

## Evidence JSON Structure

The evidence file has these top-level fields:

```json
{
  "test_id":              "GF_IFRIT_001",
  "title":                "Inject GF Ifrit pending action and validate invocation chain",
  "timestamp":            "2026-02-14T09:15:59.538983+00:00",
  "duration_ms":          33883.619,
  "deterministic_result": "PASS",
  "snapshots":            { ... },
  "breakpoint_hits":      { ... },
  "register_dumps":       { ... },
  "stacktraces":          { ... },
  "assertions":           [ ... ],
  "raw_log":              [ ... ]
}
```

Each field maps to a specific section in the domain doc. The mapping is
described below.

---

## Step-by-Step: Evidence Field -> Domain Doc Section

### 1. Rewrite the Scope

**Before** (static analysis):
```markdown
Static reconstruction of 185Shiva summon invocation chain and progression
semantics without requiring manual in-battle invocation.
```

**After** (evidence-based):
```markdown
Deterministic reconstruction of <GF> invocation behavior from evidence file
`evidence/<filename>.json`.
```

Use the evidence file's actual filename from `evidence/`.

### 2. Rewrite High-Level Result

**Source fields:**
- `deterministic_result` -> "PASS" or "FAIL"
- `breakpoint_hits` -> which probes were hit/missed
- `assertions` -> which checks passed/failed

**Template:**
```markdown
## High-Level Result

- Test: `<test_id>`
- Deterministic result: `<PASS|FAIL>`
- Entry candidate: `<entry_function_name>` (`<entry_addr>`) - breakpoint armed but **not hit** / **confirmed hit**
- Tick: `<tick_function_name>` (`<tick_addr>`) - **confirmed hit** / **not hit**
- Counter increment: `<tick_function_name>+0x<offset>` (`<counter_addr>`) - **confirmed hit** / **not hit**
- Family: `<family>` (<explain why, e.g., "entry probe misses while tick/counter probes hit">)
- Confidence: `<level>` (<score>)
```

**How to determine confidence after evidence:**

| Scenario | Confidence | Score |
|---|---|---|
| All assertions PASS, full chain confirmed | high | 95-100 |
| All assertions PASS, entry BP missed (timing) | medium | 70-80 |
| Some assertions FAIL but chain partially confirmed | low | 40-60 |
| Test FAIL, no chain confirmed | very low | 10-30 |

**How to determine family from evidence:**
- If entry BP hit + tick BP hit + counter BP hit -> standard (FamilyA or FamilyB based on tick function name)
- If entry BP NOT hit but tick + counter hit -> `Atypical` (entry probe misses due to timing)
- If only some BPs hit -> document what actually fired

### 3. Create Confirmed Runtime Chain

**Source:** `breakpoint_hits` + `raw_log` (for ordering)

List every step of the chain that was confirmed by breakpoint hits, in the
order they occurred. Include the breakpoint label and address.

**Template:**
```markdown
## Confirmed Runtime Chain (This Session)

1. Pending action injection is written at `<PENDING_BASE>` (entry index 0).
2. Pending transfer path is hit at `<PENDING_TRANSFER>` (`bp_pending_transfer`).
3. GF cinematic dispatcher is hit at `<GF_CINEMATIC_TICK>` (`bp_gf_cinematic`).
4. <GF> sequence tick is hit at `<TICK_ADDR>` (`bp_<name>_tick`).
5. <GF> counter increment executes at `<COUNTER_ADDR>` (`bp_<name>_counter_inc`).
```

Only include steps where `breakpoint_hits.<label>` is `true`.
If a step was NOT hit, omit it from the confirmed chain.

### 4. Update Counter and Completion

**Source:** `breakpoint_hits`, `stacktraces`

```markdown
## Counter and Completion

- Increment site: `<counter_addr>` (`<symbol from stacktrace>`) - confirmed by breakpoint and stacktrace
- Completion site: unresolved in this session / confirmed at `<addr>`
```

Use the stacktrace entry at the counter increment to get the exact symbol name
(e.g., `GF_Ifrit_SequenceTick+A`).

### 5. Update Command Injection

**Source:** `snapshots.injected_pending_readback`

If the test PASSED, change the section header from "(Hypothesized)" to
"(Confirmed)". Copy the exact values from the readback snapshot:

```markdown
## Command Injection (Confirmed)

<GF> invocation can be deterministically triggered via pending action buffer `<PENDING_BASE>`:

- `command_id = <snapshots.injected_pending_readback.command_id>` (GF)
- `command_arg = <snapshots.injected_pending_readback.command_arg>` (<GF> kernel GF ID, <decimal> decimal)
- `target_mask = <snapshots.injected_pending_readback.target_mask>`
- `attacker_slot = <snapshots.injected_pending_readback.attacker_slot>`
- `active = <snapshots.injected_pending_readback.active>`
- Raw bytes: `<reconstruct from fields>`
```

If the test FAILED, keep "(Hypothesized)" and add a note about what went wrong.

### 6. Create Observed Session State

**Source:** `snapshots` (all snapshot values captured during the run)

```markdown
## Observed Session State

- Callback pointer before invocation (`@<GF_CALLBACK_PTR>`): `<snapshots.callback_ptr_before>`
- Callback pointer during <GF> tick (`@<GF_CALLBACK_PTR>`): `<snapshots.callback_ptr_during>`
- <Any GF-specific context pointers and their values>
```

For each snapshot that captured a pointer or state value, list it with its
address, raw value, and interpretation (zero = inactive, non-zero = active).

### 7. Create Breakpoint Outcome Matrix

**Source:** `breakpoint_hits`

List every breakpoint with its address and hit/not-hit status:

```markdown
## Breakpoint Outcome Matrix

- `sync_atb`: hit
- `bp_pending_transfer` (`<addr>`): hit
- `bp_gf_cinematic` (`<addr>`): hit / not hit
- `bp_<name>_entry` (`<addr>`): hit / not hit
- `bp_<name>_tick` (`<addr>`): hit
- `bp_<name>_counter_inc` (`<addr>`): hit
- `bp_arbitration` (`<addr>`): not hit
```

### 8. Update Notes

The notes section should:
- State that the document reflects only what this specific test proves
- Flag anything that remains unconfirmed (e.g., entry function semantics if
  the entry BP was not hit)
- Note any surprising findings (e.g., a BP that was expected to hit but didn't)

---

## Complete Transformation Example

### Input: Evidence JSON (abbreviated)

```json
{
  "test_id": "GF_IFRIT_001",
  "deterministic_result": "PASS",
  "snapshots": {
    "callback_ptr_before": 7159216,
    "callback_ptr_during": 11687808,
    "injected_pending_readback": {
      "command_id": "0x3", "command_arg": "0x42",
      "target_mask": "0x8008", "active": 1
    },
    "ifrit_seq_ctx_ptr": 41514640,
    "ifrit_task_list_head": 41512488
  },
  "breakpoint_hits": {
    "sync_atb": true,
    "bp_gf_cinematic": true,
    "bp_ifrit_entry": false,
    "bp_ifrit_tick": true,
    "bp_ifrit_counter_inc": true,
    "bp_pending_transfer": true,
    "bp_arbitration": false
  },
  "stacktraces": {
    "stacktrace_at_counter_inc": [
      { "addr": "0xb25dfa", "symbol": "GF_Ifrit_SequenceTick+A" }
    ]
  }
}
```

### Output: Domain Doc (after update)

See `tech/battle/G-Force/domain_gf_201ifrit_invocation.md` for the
complete real-world example of an evidence-updated domain doc.

Key transformations applied:
- Scope: "Static reconstruction" -> "Deterministic reconstruction from evidence file"
- High-Level Result: added test ID, PASS result, per-probe hit status
- Added "Confirmed Runtime Chain" section from breakpoint hit order
- Command Injection: "(Hypothesized)" -> "(Confirmed)" with readback values
- Added "Observed Session State" with callback pointer + context pointer values
- Added "Breakpoint Outcome Matrix" with full hit/miss table
- Notes: scoped claims to what this specific test proves

---

## Handling FAIL Results

If `deterministic_result` is "FAIL":

1. **Keep the scope as-is** — do not claim "deterministic reconstruction"
2. **List which assertions passed and which failed** in the High-Level Result
3. **Still document the Confirmed Runtime Chain** — even a partial chain is
   valuable (e.g., pending transfer hit but no GF chain = wrong command_arg)
4. **Keep Command Injection as "(Hypothesized)"** — add a note explaining
   what the evidence suggests went wrong
5. **Add diagnostic information** from registers and stacktraces that might
   reveal what the game actually did with the injected command
6. **Recommend next steps** — e.g., "Use BP capture method to discover the
   correct kernel GF ID"

---

## Handling Exploratory Pointers

If the hypothesis included exploratory pointer reads (unconfirmed addresses
captured for informational purposes):

- If the value is **non-zero** during the GF sequence: document it as a
  "potential context pointer" and note the value. This is evidence that the
  address holds GF-specific state, but more runs are needed to confirm.
- If the value is **zero**: note that this address does not appear to hold
  context data during this GF's execution. It may serve a different purpose.
- In either case, these go in the "Observed Session State" section, clearly
  marked as exploratory/unconfirmed.

---

## Sections to Remove After Evidence

When rewriting a domain doc from evidence, these sections from the static
analysis version are typically replaced or removed:

| Static Section | Action |
|---|---|
| "Call Chain" (theoretical) | Replace with "Confirmed Runtime Chain" (evidence-based) |
| "Numeric Conversions" | Remove (was a working aid, no longer needed) |
| "Hypothesis Test" status | Remove or inline into scope (test has run) |
| "Exploratory Pointers" speculation | Move confirmed findings to "Observed Session State" |
| "Command Injection (Hypothesized)" | Replace with "(Confirmed)" or keep with failure notes |

---

## Checklist

- [ ] Evidence JSON file path referenced in Scope
- [ ] `deterministic_result` reflected in High-Level Result
- [ ] Every breakpoint hit/miss documented in Outcome Matrix
- [ ] Callback pointer value checked: does it equal the expected entry address?
- [ ] Command injection values taken from `injected_pending_readback`, not from YAML
- [ ] Stacktrace symbol used for counter increment confirmation
- [ ] Notes scoped to what THIS test proves (not speculative)
- [ ] Sections from static analysis removed or replaced
- [ ] Exploratory pointer values documented with confirmed/unconfirmed status
