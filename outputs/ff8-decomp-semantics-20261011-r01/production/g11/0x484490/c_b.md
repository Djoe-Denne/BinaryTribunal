# c_b.md — C production, volet B, g11 target 0x484490

Source session: ses_ecfad2db0ffekAAdxUzcYPS1hS (task task_mv44sdfd_00af_ae7on0, 2+1 volet **B**)
Model per assignment text: opencode-go/gpt-6-luna, variant `medium` (lead-side pinning; this session cannot locally verify Model.Ref)
No peer reads, no other-volet reads, no IDB/Git/ledger/live mutations, no delegation, no tests executed.

## 0. Frozen sources actually consumed (inventory)

1. Native packet `.tmp/ff8-decomp-semantics-20261011-r01/native/0x484490.json` — target of this volet; read earlier in this session's explorer context before identity handoff; contains `name_label_only`, chunk hex, assembly, cfg, xrefs_to, code_targets, instruction_count.
2. Mission graph `docs/missions/ff8-decomp-semantics-2026-10-11-run01/native-groups.json` — read earlier; graph node for `0x484490` and function record (15 instr, 939 asm_chars, 1 block).
3. Mission contract `docs/missions/ff8-decomp-semantics-2026-10-11-run01/CONTRACT.md` — read earlier; role boundaries only.
4. Group-sibling packet `0x4844D0.json` — read earlier in the same explorer context (same group g11). Not the volet-B target; used here only to confirm that its own byte decode uses the *same* slot base and same `13*slot<<4` stride arithmetic (cross-consistency within g11). No reconstruction of it is included here.

Restriction note: after identity handoff, native packet re-reads were rejected by the environment (`permission.rejected`), and the GrepAI/QMD/Serena namespaces are absent from the enforced Code Mode catalog. Indexed project knowledge was therefore **not consulted** for this volet; reconciliation must treat external corroboration as absent, not silently assumed (see U-06).

---

## 1. Chunk bounds and byte budget

- Chunk start `0x484490`, chunk end exclusive `0x4844C6`; span = 0x36 = **54 bytes**.
- Chunk hex has **108 hex chars = 54 bytes** — exact, no padding.
- Independent re-decode in this session consumed all 54 bytes; last instruction byte at `0x4844C5` (`C3 retn`), so end-exclusive `0x4844C6` matches. 15/15 instructions placed.

## 2. Byte-exact listing (re-verified this session against packet hex)

```
00484490: 8B 44 24 04           mov eax, [esp+4]
00484494: 8D 0C 40              lea ecx, [eax+eax*2]
00484497: 8D 04 88              lea eax, [eax+ecx*4]
0048449A: 8B 0D 38 E7 CF 01     mov ecx, ds:0x01CFE738
004844A0: C1 E0 04              shl eax, 4
004844A3: 81 E1 FF 00 00 00     and ecx, 0xFF
004844A9: 05 10 7B D2 01        add eax, 0x01D27B10
004844AE: 41                    inc ecx
004844AF: 8D 0C 89              lea ecx, [ecx+ecx*4]
004844B2: 8D 0C 89              lea ecx, [ecx+ecx*4]
004844B5: 8D 14 89              lea edx, [ecx+ecx*4]
004844B8: C1 E2 05              shl edx, 5
004844BB: 89 50 10              mov [eax+0x10], edx
004844BE: C7 40 14 00 00 00 00  mov dword ptr [eax+0x14], 0
004844C5: C3                    retn
```

## 3. C reconstruction — primary, register-order faithful

```c
#include <stdint.h>

/*
 * x86-32, callee: 1 dword arg at [esp+4] (post return address), plain `retn`
 * (C3, no ret imm16) => caller cleans the argument slot (cdecl-style stack
 * contract at ISA level; no name decoration or thunking is implied).
 *
 * All address arithmetic is 32-bit modular: uint32_t locals mirror EAX/ECX/
 * EDX; pointer conversions are for store legality only (target is 32-bit).
 * Instruction interleaving below preserves the packet's byte order; there
 * are no dependencies that could be reordered away.
 */
void *Battle_InitATB_MaxAndReset(uint32_t slot)
{
    uint32_t eax = slot;                        /* mov eax,[esp+4]                 */
    uint32_t ecx = eax + (eax << 1);            /* lea ecx,[eax+eax*2]  = 3*slot   */
    eax = eax + (ecx << 2);                     /* lea eax,[eax+ecx*4]  = 13*slot  */
    ecx = *(volatile uint32_t *)0x01CFE738u;    /* mov ecx,ds:0x01CFE738           */
    eax = eax << 4;                             /* shl eax,4            = 208*slot */
    ecx = ecx & 0xFF;                           /* and ecx,0xFF                    */
    eax = eax + 0x01D27B10u;                    /* add eax,0x01D27B10              */
    ecx = ecx + 1u;                             /* inc ecx                         */
    ecx = ecx + (ecx << 2);                     /* lea ecx,[ecx+ecx*4]  = x*5      */
    ecx = ecx + (ecx << 2);                     /* lea ecx,[ecx+ecx*4]  = x*25     */
    uint32_t edx = ecx + (ecx << 2);            /* lea edx,[ecx+ecx*4]  = x*125    */
    edx = edx << 5;                             /* shl edx,5            = x*4000   */

    *(volatile uint32_t *)(eax + 0x10) = edx;   /* mov [eax+0x10], edx             */
    *(volatile uint32_t *)(eax + 0x14) = 0;     /* mov dword [eax+0x14], 0         */

    return (void *)(uintptr_t)eax;              /* retn; EAX residue leaves        */
}
```

## 4. C reconstruction — derived readable form (equivalent, not a different claim)

```c
void *Battle_InitATB_MaxAndReset(uint32_t slot)
{
    volatile uint32_t *rec = (volatile uint32_t *)(uintptr_t)(0x01D27B10u + 208u * slot);
    uint32_t s = (*(volatile uint32_t *)0x01CFE738u) & 0xFFu;

    rec[4] = (s + 1u) * 4000u;   /* +0x10 : (s+1)*4000 == (s+1)*125 << 5 */
    rec[5] = 0u;                 /* +0x14 : current value forced to 0    */
    return (void *)rec;          /* EAX residue = rec base               */
}
```

Equivalence derivations kept explicit:
- `lea ecx,[eax+eax*2]` then `lea eax,[eax+ecx*4]`: `eax_out = s + 4*(3s) = 13s`.
- `shl eax,4`: `13s << 4 = 208s = 0xD0 * s` (0xD0 = 208; this is *slot stride* only if the array base is exact — see U-01).
- `inc ecx` after `& 0xFF`: `s' = (speed_setting & 0xFF) + 1`.
- `lea` chain `*5`, `*5`, then `lea edx,*5` → `s' * 125`; `shl edx,5` → `s' * 4000`.
- `(s+1)*4000 ≤ 256*4000 = 1,024,000 < 2^31`: no 32-bit overflow at any intermediate step for any masked input.

## 5. ABI / calling convention / stack budget

- One dword stack argument at `[esp+4]`; no further stack words touched by the callee (no prologue, no locals, no pushes/pops).
- Terminator is a bare `C3 retn` (no `ret imm16`) ⇒ the argument slot is left to the caller to clean (cdecl-style contract, as observed at ISA level only).
- Clobbered by callee: `eax`, `ecx`, `edx` (all redefined inside), flags (`shl`, `and`, `inc`, `add` all write flags; no flag value is ever read afterwards). Callee-saved registers touched: **none** (no `ebx/esi/edi/ebp` traffic, no frame pointer).
- Stack budget: 4 bytes argument (caller-pushed) + 4 bytes return address; zero additional stack usage.

## 6. Structure fields touched (stores at fixed offsets, relative to `eax`)

| offset | size | value written | annotation reading (label only, not proof) |
|--------|------|---------------|--------------------------------------------|
| +0x10  | 4 bytes (dword store, opcode 89 50 10) | `4000*(s'+1)` with `s' = speed&0xFF` | "MAX_ATB" |
| +0x14  | 4 bytes (dword store, opcode C7 40 14) | `0` | "CUR_ATB" |

- Packet `name_label_only` is `domain::Battle_InitATB_MaxAndReset`; labels and offset meanings are non-conclusive annotations and are carried verbatim, not endorsed.
- Base for both stores is the single computed `eax = 0x01D27B10 + 208*slot`; no other global address appears.

## 7. Types / signedness / overflow / shifts / AL-AX-EAX

- All arithmetic paths are 32-bit (`eax/ecx/edx`, dword immediates, dword stores). No 8-bit (`al/bl/...`) or 16-bit (`ax/...`) operand occurs anywhere in the chunk — no `mov al`, no `movzx`, no `imul r16`. The only byte-width byte in the data is the immediate `0xFF` of the mask, not an operand size.
- Signedness: no signed comparisons, no `sar`, no `imul`/`idiv` in this target. Every operation is unsigned-invariant (`lea`, `and`, `shl`, `add`, `inc`, `mov`, `retn`); the choice of unsigned types in C is behavior-preserving, not an interpretation.
- Overflow/wrap domain: with `s' ≤ 0x100`, `s'*4000 ≤ 1,024,000` — no wrap. Address term `0x01D27B10 + 208*slot` is 32-bit modular; for slot ≤ 255 it stays ≪ 2^32; for arbitrary dword slot values a wrap would occur silently and there is **no bounds check in the chunk** (recorded as U-02).
- Shifts: `shl eax,4` on `13*slot` discards nothing for slot ≤ 255 (13*255=3315, ×16 = 53,040); `shl edx,5` on `125*(s+1) ≤ 32,000` likewise. Shift counts are immediate (4, 5) — no variable-shift path, no CL involvement.
- Flags: written but never read before overwrite; no conditional branches exist in the chunk (single basic block, `cfg.successors: []`).

## 8. Callers / leaf claim / no invented callees

- Graph node `0x484490`: `out: []` — leaf. Corroborated byte-wise: no `E8` opcode and no `FF /2`-shaped opcode byte appears at any instruction start in the 54 bytes (the `FF` byte that occurs is immediate data inside `and ecx, 0xFF`).
- `xrefs_to` in the packet: from `0x48b713` (function `0x48b5f0`) and from `0x48bf2f` (function `0x48bbd0`), `iscode: true`, xref `type: 17`. The interpretation of type 17 as a near-call code reference is conventional but is **interpretive** here (see U-07); the caller fact itself rests on the graph + xref agreement, which are ground-truth mission artifacts.
- No callees and no library calls exist in the chunk; none are invented.

## 9. Uncertainty flags (open, not repaired)

- **U-01 stride contradiction.** Byte math gives `208*slot` (`13s << 4`); the packet's inline annotation asserts "slots stride 0x1B0" (= 432). 13<<4 = 208 ≠ 432 = 27<<4; the two cannot both hold for the same slot datum. The reconstruction keeps the byte-derived 208 and flags the annotation as untrusted rather than "fixing" either side. Needs independent structure evidence (e.g. other packets storing the same field family).
- **U-02 argument width & domain.** `[esp+4]` is only consumed by address arithmetic; the chunk gives no evidence of the caller's operand width when pushing (full dword vs widened byte), and no domain check. Reconstruction types it `uint32_t` as the conservative read.
- **U-03 return-value semantics.** `EAX` leaves holding the computed base pointer; whether any caller consumes it as a return value is decided at call sites not included in this packet. The packet annotation asserts "returns &BATTLE_SLOT_DATA[slot] ... not a status" — carried as annotation, not proof.
- **U-04 label provenance.** `BATTLE_SLOT_DATA`, `SG_BATTLE_SPEED_SETTING`, `MAX_ATB`, `CUR_ATB` and the function name are annotation/label artifacts, marked non-conclusive by the packet itself.
- **U-05 absolute addresses.** `0x01D27B10` and `0x01CFE738` are absolute VAs from the bytes; their identities beyond labels are unproven here.
- **U-06 corroboration unavailable.** GrepAI/QMD indexed knowledge and any file reads outside the frozen set were unavailable/rejected in this session's enforced harness; no external semantic corroboration exists for this volet. This is an environment fact, reported per policy, not bypassed.
- **U-07 xref type semantics.** `type: 17` mapping to "near call" is interpretive; the graph/caller agreement carries the weight of the caller claim.

## 10. Explicit non-claims

- No game-level semantic verdict (what ATB means; what the speed setting ranges over).
- No reconstruction of `0x4844D0` (volet-B target is `0x484490` only).
- No §5.6-style ASM validation, no compile, no test, no integration — not authorized for this role and none was attempted.
- No files written other than this deliverable at `outputs/ff8-decomp-semantics-20261011-r01/production/g11/0x484490/c_b.md`.

## 11. Provenance table

| Fact | Source artifact | Evidence |
|------|-----------------|----------|
| 15 instructions / 54 bytes / 1 block | `native/0x484490.json` function record + `native-groups.json` fn record | `instruction_count: 15`; hex 108 chars; span 0x36 |
| full instruction sequence | `native/0x484490.json` `assembly` | re-verified byte-for-byte, addresses match |
| leaf, no callees | graph `out: []` + byte scan | no E8 / FF-/2 opcode bytes |
| callers `0x48B5F0`, `0x48BBD0` | graph node + packet `xrefs_to` | `0x48b713`, `0x48bf2f`, iscode, type 17 |
| speed global `ds:0x01CFE738`, masked 0xFF | bytes `8B 0D 38 E7 CF 01` / `81 E1 FF 00 00 00` | 0x484449A / 0x4844A3 |
| slot stride 208 (0xD0) | `lea/lea/shl` chain | 0x484494–0x4844A0 |
| slots base `0x01D27B10` | `add eax, imm32` | 0x4844A9, imm = 0x01D27B10 |
| MAX store `+0x10` = `4000*(s'+1)` | `lea*5 *5 *5` + `shl 5` + `mov [eax+10h],edx` | 0x4844AE–0x4844BB |
| CUR store `+0x14` = 0 | `mov dword [eax+14h],0` | 0x4844BE |
| caller-cleaned stack | bare `C3 retn`, no ret imm16 | 0x4844C5 |
| annotation "stride 0x1B0" (contested) | packet inline annotation | text only; contradicted by byte math (U-01) |
