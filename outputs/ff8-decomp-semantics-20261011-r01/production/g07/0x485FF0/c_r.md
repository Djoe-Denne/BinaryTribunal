# C reconciliation R — 0x00485FF0

## Provenance and acceptance boundary

Read only the assigned C projection at `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g07/0x485FF0/C/`: `manifest.json`, both candidates, `common-compaction.md`, `0x485FF0.json`, `native-manifest.json`, both native ASM slices, the native bytes slice, and complete `native-metadata.json`. No other output/volet/history/index/native service was consulted.

The parent manifest deposits two different native sessions:

| Role | Session | Effective model recorded by parent | Deposited SHA-256 |
|---|---|---|---|
| A | `ses_ed3cfccacffeti6kbigQVONeNS` | `openai/gpt-6.1-sol`, high | `2809185a521e13e1ee86449e352c05a24b077761949cddfbb90f19655661268c` |
| B | `ses_ed3cfc934ffetejWt5pv4XOjhL` | `opencode-go/gpt-6-luna`, medium | `e974a0af4b41099b58584500d6520cb07367a4d687747038076a64ea5796e1cb` |

Original packet hash: `cda0002d86ac4ddd92e07c4113dc843be7e9918846d93248d7039944999ac590`; compaction hash: `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. These agree between parent and native manifests. The two ASM, bytes, and metadata hashes also agree between those manifests. These are **recorded hashes, not independently recomputed hashes**; the permitted file interface provides rendered text rather than raw-file hashing. Parent must verify deposited bytes and compute this output's hash. No author is missing and no manifest hash inconsistency was observed; session independence is parent-attested, not independently inspected here.

Native source: 32-bit `FF8_EN.exe`, SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, exported `2026-10-11T16:38:25.140966+00:00`. Single complete chunk `[0x00485FF0,0x00486074)`, 132 bytes, 37 instructions, 15 CFG blocks. The original JSON's rendered long assembly line is truncated by the reader: **that truncated string was not used as assembly evidence**. Both complete native ASM slices (25 + 12 lines), all five bytes lines, and all 208 metadata lines were read. The full chunk hex, CFG and xrefs in the packet are available without truncation and agree with the projections.

## Convergences, divergences, common-error check

| Issue | A / B | Native resolution |
|---|---|---|
| Two scans, stride, predicates, memory widths/order | Agree in executable C | Confirmed independently from opcodes: `B8 E0 04 00 00`, `2D D0 00 00 00`, signed `7F`, byte `84`, and WORD `66 89 0D`. Neither agreement nor field labels establish this. |
| Final bit mapping | A: row index equals bit index. B prose line 84: offset 0x4E0 contributes final bit 0, offset 0 final bit 6 | **B prose is wrong; B executable C is correct.** First row's OR initially sets bit 0, but six subsequent shifts move it to bit 6. Last row (offset 0) remains bit 0. Native shift-before-OR plus seven iterations proves final bit `i` corresponds to row `i`. |
| Return signature | A exposes final EAX via `uint32_t`; B uses `void`; both disclaim original return meaning | Native EAX is always `0xFFFFFF30` at RET. No source return type or consumer use is established. Adopt an explicitly labeled EAX-value adapter, not a proven source prototype. Intended return contract remains **UNCERTAIN**. |
| Signed comparisons | A uses sign-bit-biased unsigned comparison; B casts `uint32_t` to `int32_t` | `7D`, `7C`, `7F` are signed JGE/JL/JG. Adopt bias comparisons to avoid implementation-defined out-of-range signed conversion at `0xFFFFFF30`. B is valid only with the stated target's two's-complement conversion behavior. |
| Address form | A uses wrapped absolute integer address expressions; B uses a base byte pointer with array subscripts | Byte displacements encode `0x01D27B8C` and `0x01D27B90`. Adopt absolute wrapped expressions; no speculative C array extent or enclosing struct is required. Actual visited addresses do not wrap. |
| Separate reads | Both preserve two volatile accesses and conditional status access | Confirmed: two distinct TEST instructions read the flag byte; neither may be replaced by one cached `(flags & 0x41)==1` test. Each pass independently rereads memory. |
| Naming and game interpretation | A neutral calculation only; B suggests eligibility, not proven visibility | Use a descriptive eligibility-mask name only. Native predicates are certain; meanings of flag/status bits and downstream visibility/targeting behavior are not established by labels/comments. |

Common-error search: neither C incorrectly widens the status access to its documented WORD field, includes flag 0x40, scans an eighth slot, collapses the two passes, swaps range-specific status checks, or writes DWORD masks. Both candidates leave source return semantics unproved. A is correct on final bit order; the embedded static comment is not evidence for it. A direct recurrence, not the comment, resolves the B discrepancy.

## Complete reconciled C

This is a **fixed-address x86-32 little-endian C model**, not a compiled/validated replacement. `sub_00485FF0_eax_adapter` is an adapter name/signature: its return represents observed exit EAX, not an inferred intentional result. No native arguments are consumed; cdecl is the requested integration convention, compatible with the plain RET, not uniquely distinguishable from every other zero-argument convention here. No callee or helper call is invented.

```c
#include <stdint.h>

#if defined(_MSC_VER)
# define FF8_CDECL __cdecl
#elif defined(__GNUC__) && defined(__i386__)
# define FF8_CDECL __attribute__((cdecl))
#else
# define FF8_CDECL
#endif

/* Compare signed x86 values via unsigned monotonic sign-bit bias. */
#define S32_KEY(v) ((uint32_t)(v) ^ UINT32_C(0x80000000))

uint32_t FF8_CDECL sub_00485FF0_eax_adapter(void)
{
    uint32_t eax, ecx, edx;
    uint8_t bl;

    /* 485FF0: native PUSH EBX; complete EBX restored at exit. */
    ecx = UINT32_C(0);
    eax = UINT32_C(0x4E0);
    edx = UINT32_C(1);
    bl = UINT8_C(0x40);          /* only BL is changed natively */

L_485FFF:
    ecx = (uint32_t)(ecx << 1);
    if ((*(volatile uint8_t *)(uintptr_t)
            (uint32_t)(UINT32_C(0x01D27B8C) + eax)
         & (uint8_t)edx) == 0)
        goto L_486022;

    /* Second independent BYTE read; not a cached flags value. */
    if ((*(volatile uint8_t *)(uintptr_t)
            (uint32_t)(UINT32_C(0x01D27B8C) + eax)
         & bl) != 0)
        goto L_486022;

    if (S32_KEY(eax) >= S32_KEY(UINT32_C(0x270)))
        goto L_486020;

    if ((*(volatile uint8_t *)(uintptr_t)
            (uint32_t)(UINT32_C(0x01D27B90) + eax)
         & (uint8_t)edx) != 0)
        goto L_486022;

L_486020:
    ecx |= edx;
L_486022:
    eax = (uint32_t)(eax - UINT32_C(0xD0));
    if (S32_KEY(eax) > S32_KEY(UINT32_C(0xFFFFFF30)))
        goto L_485FFF;

    /* 48602E: one WORD store, before any second-pass input read. */
    *(volatile uint16_t *)(uintptr_t)UINT32_C(0x01CFF570) = (uint16_t)ecx;
    ecx = UINT32_C(0);
    eax = UINT32_C(0x4E0);

L_48603C:
    ecx = (uint32_t)(ecx << 1);
    if ((*(volatile uint8_t *)(uintptr_t)
            (uint32_t)(UINT32_C(0x01D27B8C) + eax)
         & (uint8_t)edx) == 0)
        goto L_48605F;

    if ((*(volatile uint8_t *)(uintptr_t)
            (uint32_t)(UINT32_C(0x01D27B8C) + eax)
         & bl) != 0)
        goto L_48605F;

    if (S32_KEY(eax) < S32_KEY(UINT32_C(0x270)))
        goto L_48605D;

    if ((*(volatile uint8_t *)(uintptr_t)
            (uint32_t)(UINT32_C(0x01D27B90) + eax)
         & (uint8_t)edx) != 0)
        goto L_48605F;

L_48605D:
    ecx |= edx;
L_48605F:
    eax = (uint32_t)(eax - UINT32_C(0xD0));
    if (S32_KEY(eax) > S32_KEY(UINT32_C(0xFFFFFF30)))
        goto L_48603C;

    *(volatile uint16_t *)(uintptr_t)UINT32_C(0x01CFF572) = (uint16_t)ecx;
    /* 486072 POP EBX; 486073 RET. Adapter exposes native EAX. */
    return eax;
}

#undef S32_KEY
```

## Coverage, widths, aliasing and machine environment

Every metadata block is represented: `485FF0` initialization; `485FFF/486009` ordered tests; `486011/486018/486020` first range/status/acceptance; `486022` decrement/backedge; `48602E` first store/reset; `48603C/486046` second ordered tests; `48604E/486055/48605D` second range/status/acceptance; `48605F` decrement/backedge; `48606B` second store/restore/RET. There are no discontiguous tails, calls, switch tables, or unrepresented CFG exits.

- EAX visits `4E0,410,340,270,1A0,D0,0`, then unsigned subtraction produces `FFFFFF30`. Signed JG against -208 fails at equality; no negative-offset input read occurs. SHL count is exactly 1 on a 32-bit unsigned accumulator; final masks are at most `0x7F`. No signed overflow or unmasked variable shift is introduced.
- Full EDX is set to 1, DL supplies byte-test bit 0, and full EDX supplies OR 1. Native BL alone is set to 0x40; upper EBX bits are irrelevant to tests, then full EBX is restored. No AL/AX assignment occurs. Both output accesses consume CX (low 16 bits), without changing ECX. No status/flags write occurs.
- Input byte address ranges are `0x01D27B8C..0x01D2806C` and conditional `0x01D27B90..0x01D28070`, sampled at D0 strides. Stores are adjacent nonoverlapping WORDs at `0x01CFF570` and `0x01CFF572`; neither aliases the visited inputs. No `restrict`, speculative object extent, packed structure, snapshot, lock, null guard, or validity guard is added. A taken rejection bypasses all later reads for that row. The first output store occurs before the second pass starts.
- Native PUSH/POP EBX has net-zero stack adjustment; no incoming argument load or callee cleanup exists. EBX is preserved, ESI/EDI/EBP untouched, caller ESP restored before RET. Source C ABI handles callee-saved preservation; exact physical prologue and register allocation require compiler inspection. Native exit: EAX=`FFFFFF30`, EDX=1, ECX=second mask. These latter two scratch-register values are recorded facts, not additional C outputs.
- The final CMP is equal: arithmetic flags ZF=1, CF=0, SF=0, OF=0, AF=0, PF=1; MOV/POP/RET do not change them. C does not expose/preserve exact EFLAGS as an ABI output. If scratch registers/EFLAGS are required externally, this C adapter is insufficient without an authorized machine-state wrapper.
- No x87, SSE, floating conversion, or nested call occurs. Native x87 stack/control/status/tag state and MXCSR are untouched; no rounding/precision/environment dependency exists in the native calculation. This is not a claim that an uninspected compiler emits an identical machine sequence.

## Bounded role/contract and proof anchors

Suggested descriptive name: `BuildBattleSlotEligibilityMaskPair`. **High confidence / CERTAIN within the frozen chunk**: two seven-row eligibility bitmasks are overwritten, with opposite range-specific bit-0 status exclusions. **UNCERTAIN**: game-facing meanings of those eligibility masks, flag 0x01/0x40, status bit 0, and original source return type. The battle-slot association uses the authorized common layout; the calculation itself follows bytes without needing that association. This C-only reconciliation does not reconcile independent semantic A/B deliverables.

For stable inputs only, let `f_i` be the byte at `0x01D27B8C + i*0xD0`, `s_i` the byte at `0x01D27B90 + i*0xD0`, for `i=0..6`. Final bit `i` in A is `(f_i&1)!=0 && (f_i&0x40)==0 && (i>=3 || (s_i&1)==0)`; B uses `(i<3 || (s_i&1)==0)`. This formula describes final values under stability, not permission to cache the actual accesses. With mutation between reads/passes the ordered C trace is authoritative. No slot 7 or GF row is accessed.

Seven exact anchors, independent of labels/comments:

1. `485FF3`, `486022/486027/48602C`, and `48605F/486064/486069`: start 0x4E0, stride 0xD0, signed comparison against 0xFFFFFF30 prove seven iterations and terminal EAX. Bytes are `B8 E0040000`, `2D D0000000`, `3D 30FFFFFF`, `7F`.
2. `485FFF/486020` and `48603C/48605D`: `D1 E1` then conditional `0B CA` gives recurrence `m_next=2*m+accepted`. For row `i`, exactly `i` later shifts remain, hence final bit `i` (proof correcting B).
3. `486001/486007/486009/48600F` and `48603E/486044/486046/48604C`: byte TEST `84 90` with DL=1 and `84 98` with BL=0x40 at displacement `8C7BD201`, with JZ/JNZ rejection, prove two separate reads and flag exclusion.
4. `486011/486016/486018/48601E`: `CMP EAX,270; JGE` bypasses byte status test for rows 3..6; rows 0..2 must pass bit-0-clear test at displacement `907BD201`.
5. `48604E/486053/486055/48605B`: `CMP EAX,270; JL` bypasses that test for rows 0..2 instead; rows 3..6 must pass it. This establishes the pair's complementary ranges.
6. `48602E` (`66 89 0D 70F5CF01`) and `48606B` (`66 89 0D 72F5CF01`): exactly two ordered WORD stores to distinct globals, proving output contract independent of semantic names. `485FF0/486072/486073` bytes `53/5B/C3` establish EBX preservation/plain RET.
7. Native metadata incoming code xref `493A23` in `493840` (lines 157–162), corroborated by common-compaction line 50's frozen neighboring call provenance, establishes an actual caller connection. Other recorded call sites include `47D6D4` and `48769A`; no caller ASM/use-of-return or output-consumer contract is supplied. Noncode refs `489DD4/489DFC/489F1E` are not direct calls and prove no business meaning.

## Residual risks and lead checks

All C-level behavioral divergences are resolved against native bytes/ASM/CFG, except intentionally unproved source return/game semantics above. Hash recomputation, exact compiler access widths/register emission, compilation, differential execution, and runtime validation were **not performed**. Integer-to-pointer conversions and WORD stores depend on the native mapped-address x86 implementation; this is not portable hosted C over arbitrary allocations. Volatile preserves separate ordered source accesses, not an additional atomicity/synchronization guarantee or a portable data-race model.

Lead should verify raw hashes; compile/inspect the x86-32 cdecl adapter; compare both outputs using one accepted row at a time (row 6 must produce 0x40, row 0 0x01), boundary rows 2/3, each rejection path, repeated-read and inter-pass mutation traces if relevant. Those are requested checks, not PASS claims. Final native §5.6, IDB/save/readback, integration and promotion remain exclusively the lead's responsibility.
