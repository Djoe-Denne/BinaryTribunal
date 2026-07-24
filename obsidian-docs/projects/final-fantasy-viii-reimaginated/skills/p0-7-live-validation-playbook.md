---
title: >-
  P0.7 G05 Strict Live Validation Playbook
category: skills
tags: [ff8, battle-system, testing, skill]
aliases: [P0.7 G05 live playbook, G05 scenario validation]
sources:
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tests/in-process/G05.suite.toml
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tools/make_suite_payload.py
  - C:/Users/djden/source/repos/FinalFantasy_VIII_Reimaginated/tools/capture_runtime_evidence.py
  - projects/re-ff8/skills/ff8-live-validation-operations.md
summary: >-
  Hash-bound procedure for validating every no-write P0.7 G05 Director
  scenario and the post-engagement fail-stop without turning on G06 or FF8
  writes.
provenance:
  extracted: 0.89
  inferred: 0.08
  ambiguous: 0.03
created: 2026-07-23T11:25:00+02:00
updated: 2026-07-23T11:25:00+02:00
---

# P0.7 G05 Strict Live Validation Playbook

> [!important] Scope
> This playbook validates only the P0.7 G05 Director scenarios. It does not
> grant G06, BattleUI/ATB ownership, an FF8 write allowlist,
> `Battle_ActiveTickEntry` or P1.

## Preconditions

1. Run `validate_contracts`, the Win32 build, CTest, PE32 verification and
   record the DLL SHA-256.
2. Validate the exact DLL with `app_injector validate`.
3. Start a fresh supported `FF8_EN.exe` in Open World/menu; capture the native
   preimage canary and confirm no debugger is attached.
4. Generate the bootstrap payload with frame, UI/Switch and Director seams,
   inject it, then reach the native `03/03/01/04` guard normally.

Never use `&&` under PowerShell. Check `$LASTEXITCODE` after each command.
IDA is needed only for an unknown ABI and must detach before injection.

## Scenario matrix

Each positive scenario runs on a fresh FF8 process using a `G05` v2 payload:

| Scenario | Replacement ticks | Required witness |
| --- | ---: | --- |
| `idle-no-status` | 1 | exact 13-step trace |
| `idle-with-status` | 1 | exact 14-step trace |
| `paused` | 1 | zero-step replacement trace |
| `action-in-progress` | 1 | 11-step trace without arbitration/status |
| `result-latched` | 1 | pending → reset → arbitration order |
| `rng-cursors` | 1 | CRT seed, lane/cursor and post-increment witness |
| `end-check-stubs` | 1 | no G23 result or handoff |
| `multi-tick-handback` | 2 | two suppressions then explicit native handback |

For every run, collect the runtime export after the replacement ticks and,
for handback cases, again after the next Director pass-through. The evidence
must contain the executable/DLL hashes, address map, protocol/scenario,
canaries, phase/latches/RNG/trace, call audit, memory hash/diff, cleanup and
preimage status.

## Fault case

Generate `idle-no-status` with `--g05-controlled-fault`. The runtime must
execute after engagement, become `Faulted`, report `DirectorAction=FailStop`,
show zero FF8 writes and record no fallback native Director call. This is
negative evidence: the collector must produce `FAIL` even if a CLI assertion
requests `pass`. Restart FF8 before another campaign.

## G03 regression

For the final hash, execute the G03 Open World → active battle → Open World →
shutdown smoke and the field-only G03 fault. The earlier P0.6 three-cycle
proof remains cited only while bootstrap, detours, shutdown, canaries,
lifecycle and allocation behavior were not changed. Any change to those
surfaces requires the full three-cycle rerun.

## Verdict

Promote G05 only if every positive scenario has a non-`Faulted` runtime, exact
witness, zero memory diff, zero write violation, zero forbidden call, explicit
handback where required and byte-exact cleanup. A collector `PASS` is not
sufficient if the runtime evidence is negative.

## Recorded final campaign

The procedure passed on
`8dfefeb99b2427b59b90cc594233d8ff1b325c34600057ffd335e2b6c3379178`:
all eight positive scenarios were `PASS`, and the controlled fault was
intentionally `FAIL` because the runtime reached `Faulted` with `FailStop`,
zero FF8 diff/write/forbidden call and no native handback.

## Related

- [[projects/final-fantasy-viii-reimaginated/references/p0-7-offline-validation]]
- [[projects/re-ff8/skills/ff8-live-validation-operations]]
- [[projects/re-ff8/references/battle-iso-migration-milestones]]
