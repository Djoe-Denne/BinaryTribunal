---
title: Use FF8RE Hypothesis Runner
category: skills
tags: [ff8, reverse-engineering, testing, skill]
aliases: [ff8re, hypothesis runner, binaryTribunal FF8 wrapper]
sources: [ff8re/README.md, ff8re/__main__.py, ff8re/actions.py, ff8re/assertions.py, ff8re/battle_state.py, ff8re/status_effects.py, ff8re/smoke.py, ff8re/hypothesis.py, ff8re/runner.py, ff8re/evidence.py, ff8re/mcp_client.py]
summary: Skill page for using `ff8re` to turn FF8 battle hypotheses into deterministic IDA MCP debugger runs with structured evidence.
provenance:
  extracted: 0.86
  inferred: 0.1
  ambiguous: 0.04
created: 2026-06-02T16:50:00+02:00
updated: 2026-06-02T17:04:00+02:00
---

# Use FF8RE Hypothesis Runner

`ff8re` is the FF8-specific wrapper around the generic `binaryTribunal` hypothesis engine. It turns YAML hypotheses into deterministic debugger call sequences against a live FF8 process through the IDA Pro MCP server.

## Architecture

- Hypothesis YAML defines what to set up, what to inject, what to observe, what should pass, and how to clean up.
- `HypothesisRunner` executes the five phases and writes structured evidence JSON.
- `McpClient` is the transport layer to the IDA MCP server.
- `FF8BattleState` encodes battle memory primitives for slots, pending actions, phase flags, action globals, ATB, and HP/status reads.
- `actions.py` registers FF8-specific runner actions such as `snapshot_slot`, `write_pending_action`, `read_pending_action`, `read_phase_flags`, `read_action_globals`, `sync_to_battle_tick`, and `set_enemy_hp_all_10000`.
- `assertions.py` registers FF8-specific checks for slot fields, added statuses, enemy death, and HP decreases.
- `__main__.py` wires FF8 plugin setup into `binaryTribunal`, adds `smoke`, and delegates `run` to the generic engine.

## Five-Phase Contract

Hypotheses use:

```text
setup -> act -> observe -> assert -> cleanup
```

This same phase contract links [[projects/re-ff8/skills/battle-re-verification]], [[projects/re-ff8/skills/gf-hypothesis-authoring]], and [[projects/re-ff8/references/gf-runtime-test-matrix]].

## FF8 Domain Primitives

- Slot base is `0x1D27B10`, stride `0xD0`, count 11.
- Pending action base is `0x1D28D44`, stride 8, count 3.
- Confirmed pending `command_id` values are Attack `0x01`, Magic `0x02`, and GF `0x03`.
- The runner can snapshot slots, write pending actions, decode pending entries, read all pending entries, and restore pending-buffer snapshots.
- `write_pending_action` includes the known warning that the active flag at offset `+7` may require byte patching through `idc.patch_dbg_byte`.

## Status Decoding

`status_effects.py` decodes the 32-bit `status_2` and low 16 bits of `status_1` into named effects. It includes common statuses such as Sleep, Haste, Slow, Stop, Regen, Protect, Shell, Reflect, Aura, Double, Triple, Death, Poison, Petrify, Silence, Berserk, Zombie, Has Magic, and Summon GF.

## Evidence Model

Evidence JSON records deterministic result, snapshots, breakpoint hits, register dumps, stacktraces, assertions, duration, and raw logs. The local `ff8re/evidence.py`, `ff8re/runner.py`, `ff8re/hypothesis.py`, and `ff8re/mcp_client.py` files are compatibility re-exports to canonical `binaryTribunal` modules.

## Related

- [[projects/re-ff8/skills/battle-re-verification]]
- [[projects/re-ff8/references/gf-runtime-test-matrix]]
- [[projects/re-ff8/concepts/battle-state-model]]
