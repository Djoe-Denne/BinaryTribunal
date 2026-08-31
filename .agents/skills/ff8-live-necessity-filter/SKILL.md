---
name: ff8-live-necessity-filter
description: >-
  Filters FF8 ISO live-test contract expectations so operator budget is spent
  only on unproven host coupling and safety proofs. Use before any live
  campaign, constrained live anchor, G10+ promotion session, L-pack, or when
  the user asks to mitigate, waive, prune, reduce, or set aside live
  expectations. This is a necessity filter, not a promotion shortcut: already
  verified offline cases and fail-closed certain unknowns may be set aside
  only with a written waiver. Never waives write-guard, native-helper, EXE/DLL
  hash, byte-exact restore, or same-frame observation requirements.
---

# FF8 Live Necessity Filter

Read this **before** planning or executing a live action on `FF8_EN.exe`.
The filter reduces operator cost. It does not shrink the promotion
contract.

Implementation repo: `C:\Users\djden\source\repos\FinalFantasy_VIII_Reimaginated`

Companion ops skill (how to inject, capture, shutdown):
`obsidian-docs/projects/re-ff8/skills/ff8-live-validation-operations.md`

Worked G22 ledger: [references/g22-2026-08-29.md](references/g22-2026-08-29.md)
Waiver template: [references/waiver-ledger.md](references/waiver-ledger.md)

## Why this exists

Live time is scarce. Agents waste it in two ways:

1. Re-proving a formula already closed offline (same seed, no host I/O).
2. Trying to close a field whose catalog or ownership is already known
   to be missing (a *certain unknown*).

The 2026-08-29 G22 session failed the opposite way too: it treated a
thin live envelope as promotion. This skill forbids both mistakes.

## Hard law — never waivable

A waiver that touches any of these is invalid. Discard it and keep the
live requirement.

| Requirement | Why live still owns it |
| --- | --- |
| Fresh FF8 process, no debugger | A reused or attached process is not a promotional witness |
| EXE + DLL SHA-256 recorded; no merge across hashes | Two binaries are two candidates |
| `validate_contracts` + Win32 build + PE32 before inject | Stale DLL is not evidence |
| Zero `import_legacy` as source of truth; zero native init helpers | Layer law, not a convenience |
| Write-guard / allowlist: no adjacent byte written | Host safety |
| Complete preimage of every range the gate may write | Partial capture cannot prove restore |
| Readback of every successful write | `write_count` alone is not a write |
| Byte-exact restore + process alive + `Detached` | Cleanup is part of the gate |
| Direct observation of any same-frame effect the gate claims | A stamped flag is not observation |
| Collector rejects incomplete / contradictory witnesses | Proof machinery, not scenario flavour |
| One user action at a time; French operator prompts | Session law |

`refused_mask == 0` is a **promotion** criterion, not a constrained-anchor
criterion. Do not waive it for promotion. Do not invent fields to force it
for an anchor.

## Three buckets

Classify every item in the gate brief, `[promotion.Gxx].required`, and
the last independent review. An item has exactly one bucket.

### LIVE-REQUIRED

Unproven coupling with the host, or a safety property that only the
process can show.

Typical members:

- Field → battle handoff on a real process
- Same-frame native side effect (example: G07 tail count, not a Gxx stamp)
- Refuse-while-active / no-write on the **same** ready battle (one invoke, not a second fight)
- Shutdown restore of **every** owned range, not only the hook
- Fail-closed check: named residual bytes were **not** written

A second fresh process for host determinism is **promotion-tier**, not
constrained-anchor. Offline same-seed checks already cover the formula.
Do not add it to a minimal card unless the user is closing
`[promotion.Gxx].satisfied` that day.

If the item is LIVE-REQUIRED, it stays on the live card. Prefer one
process, one inject, one representative fight. Extra battles need a
named host coupling that the first fight cannot show.

### SET-ASIDE-VERIFIED

Already proven offline on the **same** candidate (same source, same
oracle, no host I/O). Live would only re-execute the formula.

Typical members:

- Dirty `BattleState` reset and seed determinism
- Level curve on fixture DAT (`0` / `1` / `100`, typed refuse at `101`)
- Indexed resistance / auto-special formula (Odin Death vs 199/200)
- Collector schema negatives (missing v2 fields → reject)
- Forced preemptive/back extras if the brief's live path is ordinary-only

A SET-ASIDE-VERIFIED waiver needs a named offline test or evidence file
and the candidate hash or commit that produced it. "We believe it works"
is not a waiver.

### SET-ASIDE-CERTAIN-UNKNOWN

The field cannot be derived correctly yet. The unknown is certain or
near-certain (missing catalog, blocked SQ, wrong gate). Live must not
try to close it.

Typical members:

- Junction / story / GF possession still owned by an open SQ
- Draw list, dead timer, crisis catalog without a published table
- Per-enemy DAT selection until the reader exists
- Ordinary start-type roll until the seed table is owned
- Anything that belongs to P2, the next gate, or a later unit

What you set aside is the **positive derivation**. You do **not** set
aside the fail-closed property: those bytes stay unread-as-source and
unwritten, and the refuse bit stays named. That fail-closed check is
LIVE-REQUIRED and cheap.

## Procedure

Do this **before** asking the user to open FF8 or inject.

1. Read the gate brief, `manifests/evidence-policy.toml` for that gate,
   `ownership-matrix.toml`, and the latest review or test pack.
2. List every required, optional, and review item as a row.
3. Assign one bucket per row. If unsure, keep LIVE-REQUIRED.
4. Write the waiver ledger (see template). Every SET-ASIDE row has
   evidence or an SQ id. Empty "why" means the row is still live.
5. Build the **minimal live card**: only LIVE-REQUIRED rows, in the
   order the test pack gives, one user action each.
6. Show the card and the ledger to the user. Do not inject until they
   accept the remaining live actions.
7. After each live action, capture canary + runtime evidence. A failed
   safety check voids the session, not just the scenario.
8. After the card, re-evaluate promotion **only** against the contract.
   Waivers never flip `[promotion.Gxx].satisfied`.

If host coupling changed (new DLL, new owned range, new hook, new
codec), drop every SET-ASIDE-VERIFIED waiver that touched that surface
and reclassify.

## Minimal live card

The card is the only thing the operator executes.

```text
Gate:
Candidate DLL SHA-256:
Process rule: fresh, no debugger
Actions remaining:
  1. <LIVE-REQUIRED action> — expected witness fields
  2. ...
Stop after first red safety check
Promotion tonight: no | only if every required row is green
```

Do not add a "nice to have" scenario to a live card. Put it in the next
offline pack or a later live day.

## What a waiver is allowed to say

Allowed:

- "T22-04 already closed Death 199 vs 200 on this commit; L-pack will
  not restage Odin."
- "Junctions stay SQ-G21-001; live checks `refused_mask` bit + zero
  writes on those bytes."
- "Three start-types stay offline extras; live ordinary is enough for
  the current brief."

Forbidden:

- "Skip restore; the previous session looked clean."
- "Stamp `pumped_g07`; we called the tail from the new gate."
- "Force `refused_mask == 0` by copying native bytes we do not own."
- "Merge yesterday's PID 29808 envelope with today's DLL."
- "Treat constrained-live-anchor as live-promoted."
- "Close the SQ in live by reading undocumented host memory."

## After the session

- Constrained live anchor: LIVE-REQUIRED safety rows green, residuals
  named, `satisfied = false`.
- Live-promoted: every `[promotion.Gxx].required` row green on one
  candidate, including `refused_mask == 0` when the policy asks it.
- Partial card: document which LIVE-REQUIRED rows remain. Do not
  infer them from SET-ASIDE rows.

Ingest evidence with `ff8-evidence-wiki-ingest` only after the ledger
and the captures agree.
