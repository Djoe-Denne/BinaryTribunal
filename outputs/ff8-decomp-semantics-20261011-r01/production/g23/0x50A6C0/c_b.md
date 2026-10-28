# C production — volet B — g23 / 0x50A6C0 (FF8_EN.exe)

- Mission: ff8-decomp-semantics-20261011-r01, run01. Role: independent B producer (pool-145, `re-decompile-ensemble`), forked from frozen explorer session (g23 discovery excerpt). Task `task_mv44sr3o_00di_jxt3m8`.
- Owned frozen packet: `.tmp/ff8-decomp-semantics-20261011-r01/native/0x50A6C0.json`
- Provenance (frozen export fields): idb `D:\Modding\ff8\retro-exe\FF8_EN.exe - 9.3.i64`; input `C:\Program Files (x86)\Steam\steamapps\common\FINAL FANTASY VIII\FF8_EN.exe`; bits 32; `input_sha256 064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; `exported_utc 2026-10-11T16:38:25.140966+00:00`.
- Evidence discipline: facts below come only from the owned packet `0x50A6C0.json`, the same-group sibling packet `0x50A690.json`, CONTRACT.md, native-groups.json (g23 = 0x50A690, 0x50A6C0, 0x50E510) and the mission task board. No reads of: the A volet, the semantic volet, any ledger, any prior C of this target, any other session, the IDB. Native labels are identifiers, not evidence of purpose.

## 1. Frozen ground truth (verbatim)

Chunk: `start 0x50a6c0`, `end 0x50a6cd` (exclusive), 13 bytes, `instruction_count 5`.
Hex: `a1609ad90150e8c5bfffff59c3`

```
0050A6C0: mov     eax, result_event
0050A6C5: push    eax; result_event
0050A6C6: call    BattleAction_ApplyResultAndSpawnPresentation; <frozen IDA annotation, see §6>
0050A6CB: pop     ecx
0050A6CC: retn; Return Near from Procedure
```

Frozen xrefs_to: `[{"from":"0x504e43","type":17,"iscode":true,"function":"0x504bb0"}]` — exactly one code xref (near call) in the packet.
Frozen code_targets: `["0x506690"]`.

## 2. Encoding verification (byte → instruction)

| Addr | Bytes | Encoding | Check |
|---|---|---|---|
| 0x50A6C0 | `A1 60 9A D9 01` | `mov eax, moffs32` | moffs little-endian = `0x01D99A60`; frozen label `result_event` |
| 0x50A6C5 | `50` | `push eax` | arg slot built at `[esp]` |
| 0x50A6C6 | `E8 C5 BF FF FF` | `call rel32` | rel = `0xFFFFBFC5` = −0x403B; next instr `0x50A6CB` − `0x403B` = `0x506690` ✓ matches frozen `code_targets` |
| 0x50A6CB | `59` | `pop ecx` | discards the 4-byte argument (caller-side cleanup); `pop` writes no flags |
| 0x50A6CC | `C3` | `retn` | near return, no stack operand → wrapper expects no arguments from its own caller |

## 3. ABI / registers / stack / flags

- Signature: `void sub_50A6C0(void)` — no value is read from `[esp+4]`/`[esp+8]` at entry; the only stack slot at entry is the return address. `C3` (no operand) confirms no stdcall-style cleanup, so callers of this wrapper pass nothing.
- Frameless: no `push ebp`/`sub esp` prologue, no locals. Net ESP delta across the body is 0 (the `push`/`pop` pair is transient; the `pop` simultaneously performs the argument cleanup for the callee call → __cdecl-compatible call at this site).
- EAX: loaded from global `result_event` (dword at `0x1D99A60`) and pushed as the callee argument. After the call, EAX is whatever `0x506690` left there; the wrapper returns without touching it → EAX passthrough to the wrapper's caller.
- ECX: clobbered by `pop ecx`; on return ECX holds the discarded argument value (the pre-call `result_event`).
- EFLAGS: `mov`/`push`/`pop`/`retn` write no flags; the wrapper itself preserves inbound EFLAGS into the callee call. EFLAGS on wrapper return = whatever the callee left.
- Callee prototype reconstructed from this single frozen call site: one 32-bit stack argument, caller-cleaned. Argument passed **by value** (the global's current dword), not by address.
- Volatile-state summary on return: EAX = callee EAX; ECX = modified (old `result_event` value); EDX/other volatiles = as left by callee; callee-saved registers untouched by the wrapper itself.

## 4. C deliverable

```c
#include <stdint.h>

/* 0x1D99A60 — frozen label "result_event" (identifier only, not purpose evidence).
   Dword global; sibling 0x50A690 manipulates it pointer-like (add eax,18h; mov cl,[eax]),
   but its pointee type/width is unresolved from owned evidence (§5). */
extern uint32_t result_event;

/* 0x506690 — frozen call-line label "BattleAction_ApplyResultAndSpawnPresentation"
   (identifier only; EA owned by group g17). Prototype reconstructed from THIS call
   site only: one 32-bit stack argument, caller-cleaned (__cdecl-compatible).
   Return type unresolved from owned evidence (§5); declared void here — the wrapper
   never consumes EAX, so the declaration choice does not alter wrapper behavior. */
extern void BattleAction_ApplyResultAndSpawnPresentation(uint32_t result_event_cur);

/* 0x50A6C0 .. 0x50A6CC, 13 bytes. Frameless, no arguments, void. */
void sub_50A6C0(void)
{
    BattleAction_ApplyResultAndSpawnPresentation(result_event);
}
```

Recompilation fidelity notes (wrapper body):
- Canonical MSVC output for the body above is exactly `A1 <moffs32>` / `50` / `E8 rel32` / `59` (or `83 C4 04` / `C3`-shaped cleanup). The frozen encoding uses `59` (`pop ecx`) rather than `add esp,4`; both are valid caller cleanup of one 4-byte arg — the `pop ecx` form is what the freeze shows, and ECX-clobber-vs-not is visible only to the callee boundary contract, which is g17's to fix. Flagged in §5 rather than "repaired" by assumption.
- EAX passthrough is preserved for any declaration of the callee, since the wrapper emits no instruction after the cleanup before `retn`.

## 5. Uncertainties (explicitly not repaired by intuition)

1. Callee return value: whether `0x506690` meaningfully returns EAX/AL is unresolved — its packet is g17-owned and was deliberately not read from this session (post-handoff read permissions denied; size/flood risk without sandbox). Frozen sibling-side annotation prose hints at internal EAX use but is prior-work prose, not ground truth (§6). If reconciliation shows a used return, the wrapper stays byte-identical; only the callee declaration type changes.
2. Wrapper EAX consumption by its only frozen caller (`0x504e43` in `0x504bb0`, group g18): not verified (g18 packet not read). If that caller consumes EAX, the effective wrapper signature is non-void with passthrough semantics — behavior identical, declaration would change.
3. Type of global `result_event` (`0x1D99A60`): dword established by the `A1` moffs32 load; pointee type/element stride only suggested by sibling 0x50A690 (`add eax,18h` then byte deref `mov cl,[eax]`; also reads a byte into `byte_1D99A48` after the call). Not needed for this wrapper's bytes; unresolved here.
4. `name_label_only` field of `0x50A6C0.json`: present in the packet schema but its value was never captured in the frozen explorer excerpt, and post-handoff file read is denied. Neutral name `sub_50A6C0` used; reconciliation should read the field from the packet.
5. Cleanup encoding `pop ecx` vs `add esp,4`: frozen shows `59`; treating `pop ecx` as deliberate (ECX scratch) rather than an optimizer coin-flip is an assumption — recorded, not acted on.
6. Signedness/width of the callee's internal use of the argument (byte deref etc.) is g17's scope; this volet makes no claim beyond "one dword stack argument".

## 6. Historical, unvalidated conclusions — separated

- The frozen annotation on the call line ("Presentation/domain seam: applies result/status first via 0x493D80, then restores animations/spawns reactions and finally creates damage popups via 0x5068B0. Popup creation itself does not mutate HP.") is prior-RE prose embedded in the export. Reproduced here only to identify the frozen label; **not treated as evidence** and not validated by this volet.
- Structural contrast with same-group sibling `0x50A690` (fully owned packet): the sibling advances `result_event` by `0x18` **before** the same callee call, re-reads the global **after** the call (allowing callee-side mutation of the cursor), and copies the byte at the cursor into `byte_1D99A48`. `0x50A6C0` does neither advance nor post-copy. This is an instruction-level factual contrast only; no semantic verdict is drawn about queue/consumption behavior.
- Any name-derived purpose inference (including the label `BattleAction_ApplyResultAndSpawnPresentation`) is excluded from the evidence base.

## 7. Compliance

- Writes: this file only (`outputs/ff8-decomp-semantics-20261011-r01/production/g23/0x50A6C0/c_b.md`). No IDB, Git, ledger, registry, live, or delegation.
- Reads: CONTRACT.md, native-groups.json (g23 slice), mission task board, owned packets `0x50A6C0.json`/`0x50A690.json` (via frozen explorer excerpt; direct re-read denied post-handoff and not needed), team board listing. No A-volet, no semantic volet, no ledger, no prior C of the target, no peer sessions, no IDB.
- Uncarried obligations: none of the validations above were executed; they are hand-off questions for reconciliation, not claims.
