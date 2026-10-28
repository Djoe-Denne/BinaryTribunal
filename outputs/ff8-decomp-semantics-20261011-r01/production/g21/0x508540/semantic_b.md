# 0x508540 — semantic B

- **EA:** `0x508540`
- **Group:** g21 (`0x508540`, `0x50AE00`, `0x50AE20`)
- **Volet:** B (independent; no A/C/R or peer reads)
- **Producer:** pool-234 (`re-semantic-ensemble`)
- **Task:** `task_mv44sk76_00ci_c5merx`
- **Factual source (fork):** `ses_ed41fba20ffexCPkkuwhhXozTE` (discover-g21 / `task_mv424nwq_000n_sk2y4p`)
- **Parent gate:** `CLASSIFICATION_ACCEPTED_NATIVE` 2026-10-11T17:58:04.539308+00:00 (mission ledger; cited from spawn context, not re-opened)
- **Primary evidence packet:** `.tmp/ff8-decomp-semantics-20261011-r01/native/0x508540.json`
- **This writer profile:** production-path writes only; native/docs/other-volet reads are denied. Behavior below is the frozen-packet compaction from the factual reader on that same JSON, not a live IDB/Git/ledger pass.

IDA / native *labels* are **not** evidence of purpose. No target-C reconstruction (C volets are separate). No game-lore name is asserted beyond what the predicate and its in-group wrappers mechanically show.

---

## 1. Proposed identifier

| Field | Value |
| --- | --- |
| **Proposed name** | `obj_nested_flag_mask_pred` |
| **Name confidence** | **LOW–MEDIUM** (mechanical; domain noun not proven) |
| **Kind** | Pure predicate / query (no writes observed in the compaction) |
| **Rejected as proof** | Any IDA `sub_*` / auto-comment string in the packet |

**Rationale (mechanical only):** the body is a fail-closed conjunction of object-field tests, then a nested-object flag test parameterized by a caller-supplied mask. In-group wrappers `0x50AE00` / `0x50AE20` only specialize that mask (`0x40` vs `0x140`) and the object source (one object vs a 7-element table). That supports a *flag-mask predicate* name, not a domain feature name.

**Alternate names (not selected):** `entity_slot_ready_pred`, `menu_entry_flag_test` — those need structure identities that the packet does not prove.

---

## 2. Verdict / confidence

| Axis | Level | Notes |
| --- | --- | --- |
| **Control-flow shape** | **HIGH** | Leaf; sequential guards; boolean exit |
| **Arity / predicate-ness** | **HIGH** | Three incoming args; wrappers pass an immediate mask as one of them |
| **Return meaning** | **HIGH** as boolean 0 / nonzero; **MEDIUM** as encoded `0`/`1` only |
| **Arg0 = object base** | **HIGH** | Byte/dword loads at `+0x00`, `+0x05`, `+0x08`, `+0x74` |
| **One arg = bit mask** | **HIGH** | Wrapper immediates `0x40` and `0x140` |
| **Arg1 (non-mask) role** | **UNCERTAIN** | Present in the 3-arg ABI; not identified as index vs unused vs extra qualifier |
| **Nested field `+0x74 → +0x2C`** | **HIGH** as a pointer hop then a dword used with the mask; **MEDIUM** as `(*p+0x2C) & mask` vs other combine |
| **Domain / FF8 feature name** | **UNCERTAIN** | Not claimed |
| **Side effects** | **HIGH** none observed (leaf, no stores in compaction) |

**Overall semantic confidence:** **MEDIUM** for “fail-closed 3-arg boolean: valid object + nested dword satisfies caller mask.” **LOW** for any named gameplay system.

---

## 3. ABI (validated vs uncertain)

### Validated

- **Entry:** `0x508540`.
- **Form:** three-argument boolean predicate used as a *callee* (not a thunk).
- **Leaf:** no outbound calls recorded in the g21 compaction for this EA.
- **Object-shaped operand:** one argument is a pointer/base used for:
  - `base+0x00`
  - `base+0x05` (byte-width access in the compaction)
  - `base+0x08`
  - `base+0x74` loaded as a pointer, then `*(ptr+0x2C)`
- **Mask-shaped operand:** one argument is a bit mask. Proven by same-group wrappers:
  - `0x50AE00` → this EA with mask **`0x40`** (single call)
  - `0x50AE20` → this EA with mask **`0x140`** (`0x40 | 0x100`) in a 7-iteration loop
- **Return:** used as a boolean by those wrappers and by listed xrefs (success vs fail-closed zero).

### Uncertain

- Exact MSVC decoration (`__cdecl` vs `__stdcall` vs `__thiscall`). Packet/compaction did not freeze decoration as a proven ABI tag; x86 stack/register use was not re-listed in this writer session.
- Which of the three slots is mask vs object vs the remaining qualifier (wrapper evidence makes *mask* and *object* the two identified roles; the third is open).
- Whether a true result is strictly `1` or any nonzero.
- Width of `+0x00` / `+0x08` / `+0x2C` as dword vs smaller, beyond “field tests / dword-like mask source”.

---

## 4. Behavior (prose; not C)

Fail-closed conjunction:

1. **Admit `base`.** Tests on `base+0x00`, `base+0x05`, `base+0x08` (any failure → false).
2. **Admit nested object.** Load `p = *(base+0x74)`; reject if the hop is not usable.
3. **Mask test.** Combine `*(p+0x2C)` with the caller mask (wrappers use `0x40` or `0x140`). True iff the combine succeeds; else false.

No stores, no callees, no loops inside `0x508540` itself (looping is only in wrapper `0x50AE20`).

This is a **query**. It does not mutate the 7×0x9C table or the two bitmask dwords; those belong to the wrappers / callers.

---

## 5. Structures / globals (this EA vs wrappers)

### Object at arg-base (this EA) — layout *touches*, not a typed struct name

| Off | Use in `0x508540` | Status |
| --- | --- | --- |
| `+0x00` | Guard | validated as tested |
| `+0x05` | Guard (byte-sized in compaction) | validated as tested |
| `+0x08` | Guard | validated as tested |
| `+0x74` | Pointer to nested object | validated |
| nested `+0x2C` | Value combined with caller mask | validated as the flag dword *source* |

No struct tag, sizeof of *this* object, or field names are proven. Native names are not used as purpose.

### In-group wrappers (context for the mask argument only; not this deliverable’s EA)

Documented here because they are the only in-set callers that *bind* the mask immediate. They are not a second semantic volet.

**`0x50AE00`** — one call of `0x508540` with mask `0x40`.

**`0x50AE20`** — iterates **7** records, stride **`0x9C`**, half-open span **`0x1D972C0` … `0x1D97704`** (`7 * 0x9C = 0x444`; `0x1D972C0 + 0x444 = 0x1D97704`). Per-iteration mask immediate into `0x508540` is **`0x140`**. A slot-enable bitmask is taken from **`dword_1D99A90`** and **`dword_1D99A5C`** (how the two dwords are combined, and whether the loop is any-true vs all-true vs first-hit, was **not** frozen as a closed claim in the compaction → **UNCERTAIN**).

Those two BSS dwords and the `0x1D972C0` table are **not** loaded by `0x508540` itself.

---

## 6. Xrefs (callers of `0x508540`)

Recorded callers (all **outside** the 98-EA mission set):

| Site | In mission 98-EA set? |
| --- | --- |
| `0x502F30` | no |
| `0x5044B0` | no |
| `0x508580` | no |
| `0x50ADE0` | no |
| `0x50BD00` | no |
| `0x50BD80` | no |

Plus in-group uses: `0x50AE00`, `0x50AE20` (g21; not in the 98-EA list as *targets* of this volet except as wrappers).

**Uncertainty:** xref *kind* (code xref vs data) was flagged in discovery and is not re-proven here. Treat the list as packet-exported call sites, not a full static CG.

No outbound xrefs from `0x508540` (leaf).

---

## 7. What this function is *not* (bound)

- Not an initializer, copier, or destructor (no stores / no block moves in compaction).
- Not the 7-element iterator (`0x50AE20`) and not the single-mask thunk (`0x50AE00`).
- Not identified as a named menu/battle/GF/magic API. Offset coincidence with other FF8 structs is **not** used.
- Native label text is not a purpose proof.

---

## 8. Historical / unvalidated (quarantine)

Anything from public FF8 decomp names, Qhimm, prior ledgers, or Hex-Rays nicknames is **out of evidence**. Not consulted for this volet (peer/history/other-volet reads forbidden). If a later gate imports them, they remain unvalidated until matched to this packet’s instructions.

---

## 9. Uncertainties (explicit)

1. Third argument’s role (not object, not mask).
2. Exact boolean combine at `*(p+0x2C)` vs mask (`AND != 0`, equality, bit-clear, extra use of arg1).
3. Signedness / width of the return.
4. Calling convention decoration.
5. Whether `+0x00` is a vptr, a used-flag, or a nested pointer — only “guarded field” is proven.
6. Aggregation mode of `0x50AE20` (context only).
7. Combine of `dword_1D99A90` / `dword_1D99A5C` (context only).
8. This writer could not re-open the JSON (protected read). Instruction bytes / `path:line` inside the packet are those of the factual compaction, not a second independent disassembly dump in this session.
9. Packet `sha256` was not recomputed here.

---

## 10. Source inventory

| Source | Role | Used? |
| --- | --- | --- |
| `.tmp/ff8-decomp-semantics-20261011-r01/native/0x508540.json` | primary frozen native | yes, via inherited factual compaction of this EA |
| same tree `0x50AE00.json`, `0x50AE20.json` | in-group wrapper mask/object binding | yes, as *call-site context only* |
| `docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json` | ownership g21 | yes (spawn/group claim) |
| `docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md` | mission contract | cited; not re-read (protected) |
| discover-g21 compaction (`task_mv424nwq_000n_sk2y4p`) | offsets, wrappers, xrefs, leaf/predicate shape | yes |
| `semantic_a.md` / `c_*.md` / other EAs’ production | other volets | **not read** |
| IDB / Git / ledger / live process / GrepAI-this-session | protected | **not used** |
| Public decomp / historical names | unvalidated | **not used** |

---

## 11. Producer notes for independent R / C forks

- Reconcile against the **frozen JSON listing**, not this name string.
- If ASM shows the mask combine is not `AND`, drop the name fragment `flag_mask` and keep only “fail-closed nested-field predicate.”
- Do not fold `0x50AE00` / `0x50AE20` into this EA’s identity; they are callers/wrappers.
- Do not promote `0x1D972C0` or `dword_1D99A*` into this function’s footprint.
