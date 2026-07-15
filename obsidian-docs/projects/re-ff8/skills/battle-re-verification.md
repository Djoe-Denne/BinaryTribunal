---
title: Battle Reverse Engineering Verification
category: skills
tags: [ff8, reverse-engineering, testing, skill]
aliases: [FF8 battle test plans, GF injection protocol]
sources: [docs/tech/test/test_command_pipeline.md, docs/tech/test/test_damage_pipeline.md, docs/tech/test/test_status_pipeline.md, docs/tech/test/test_atb_system.md, docs/tech/test/test_command_menu.md, docs/tech/test/test_gf_injection.md, docs/tech/gforce/CHRONICLE_GF_IFRIT.md, ff8re/README.md, ff8re/actions.py, ff8re/assertions.py, ff8re/battle_state.py, ai-prompt/ai_investigation.md]
summary: Repeatable breakpoint, memory watch, injection, runner, and evidence workflows for validating FF8 battle hypotheses.
provenance:
  extracted: 0.82
  inferred: 0.14
  ambiguous: 0.04
created: 2026-06-02T16:37:00+02:00
updated: 2026-06-02T16:50:00+02:00
---

# Battle Reverse Engineering Verification

The project validates battle hypotheses with targeted breakpoints, memory snapshots, action injection, runtime assertions, and cleanup. Tests specify exact functions, watched globals, scenarios, and expected observations.

## Verification Pattern

The Ifrit chronicle describes a five-phase runner:

```text
setup -> act -> observe -> assert -> cleanup
```

Each test carries its own constants, breakpoints, memory reads, and pass/fail criteria. This turns manual debugger observation into repeatable evidence. ^[inferred]

The `ff8re` runner implements this as executable YAML against a live FF8 process through IDA MCP, with evidence JSON recording snapshots, breakpoint hits, registers, stacktraces, assertions, and raw logs.

## GF Injection Protocol

- Sync to a battle tick boundary by breaking at `BattleATB_TickAndReady` (`0x4842B0`).
- Patch the 8-byte pending entry at `0x1D28D44` one byte at a time.
- Verify bytes by reading memory back.
- Continue execution and observe pending transfer, cinematic dispatch, damage/status effects, and completion.
- Use `idc.patch_dbg_byte` for byte writes; the source warns not to rely on debugger bulk memory write APIs for this buffer.

Canonical Ifrit bytes:

```text
08 80 00 03 42 00 00 01
```

These decode as target mask `0x8008`, attacker slot 0, GF command `0x03`, Ifrit kernel GF ID `0x42`, padding, and active flag.

## Test Plan Coverage

- Command pipeline tests validate input to pending action, pending to exec transfer, arbitration, and resolve entry.
- Damage pipeline tests validate metadata resolve, raw delta computation, HP application, and damage event output.
- Status pipeline tests validate payload population, gating, resolution, commit/sync, timer expiry, and special status writes.
- ATB tests validate per-frame increments, Haste/Slow effects, readiness transitions, and UI mirror writes.
- Command menu tests validate command availability, status restrictions, target flow, and limit-break crisis checks.
- GF injection tests validate all junctionable GF command args and runtime behavior where evidence exists.

## Evidence Lessons

- `command_id = 0x02` is Magic, not GF; using it with `command_arg = 0x02` produced Fira behavior.
- `command_id = 0x03` is GF, but `command_arg` must be a kernel GF ID such as Ifrit `0x42`, not a zero-based GF index.
- Breakpoint capture at `BattlePendingAction_Write` is the reliable way to decompose command bytes from authentic in-game actions.
- Per-frame breakpoints should be deleted once useful; ATB and pending-transfer probes can trap every frame if left armed.
- Assertions should prefer durable memory effects and decoded state over fragile breakpoint timing when possible. ^[inferred]

## Related

- [[projects/re-ff8/concepts/ff8re-hypothesis-runner]]
- [[projects/re-ff8/references/gf-runtime-test-matrix]]
- [[projects/re-ff8/concepts/command-action-pipeline]]
- [[projects/re-ff8/concepts/gforce-catalog-and-families]]
- [[projects/re-ff8/references/battle-slot-and-command-layouts]]
