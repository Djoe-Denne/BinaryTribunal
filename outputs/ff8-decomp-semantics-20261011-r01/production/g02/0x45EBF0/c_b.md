# 0x45EBF0 — independent C author B (2+1) — `sub_45EBF0`

Role: independent C author B. Covers this EA only. I worked from the frozen inputs and did not use A's work, earlier C, the ledger, IDA or a results index.

## Inputs cited (frozen)

| Input | Hash / size |
|---|---|
| `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45EBF0.json` (original packet, per manifest) | sha256 `dd7611f37d54d96d1f3d3fdcb221a43aac2e371f1006d9733df00a1273427c4e` |
| `inputs/.../g02/common-compaction.md` | sha256 `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34` (per manifest) |
| `0x45EBF0.readable/asm-001..005.txt` | 25+25+25+25+16 = **116 lines** = manifest `assembly_lines` 116 = native `instruction_count` 116 |
| `0x45EBF0.readable/bytes-001.txt` | 1 chunk `0x45EBF0..0x45EE0D` (541 bytes, 17 hex lines) |
| `0x45EBF0.readable/metadata.json` | CFG 22 blocks, xrefs_to, identical to native `0x45EBF0.json` (`code_targets: []`) |

Native identity: FF8_EN.exe PE32 sha256 `064d466b…9570`, exported 2026-10-11T16:38:25Z.

## Coverage

- **All 116 instructions are covered.** Every instruction maps to a statement or comment in the C below, tagged with its address.
- **All 22 CFG blocks are covered:** `45EBF0, 45ECD7, 45ECED, 45ECF1, 45ED03, 45ED08, 45ED11, 45ED2F, 45ED33, 45ED4D, 45ED53, 45ED5B, 45ED79, 45ED7D, 45ED97, 45ED9D, 45EDA5, 45EDBC, 45EDCB, 45EDE2, 45EDEF, 45EE03`. The C has one `if`/`else` arm per block.
- **Single chunk.** It ends at `retn` (`C3`) at 0x45EE0C. There are no other chunks or tail jumps.
- **Byte cross-checks against `bytes-001.txt`:**
  - `d80df895b600` = `fmul dword ptr [0x00B695F8]`, the float32 `flt_B695F8`.
  - `dc05d893b600` = `fadd qword ptr [0x00B693D8]`, the double `CONST_4_503601774854144e15` = 2^52 + 2^31.
  - `dd5c2404` / `db442404` = stack slot `[esp+4]` after `push esi`. This is the same slot as `[esp+0]` before the push. The IDA names `[esp+8+var_8]` and `[esp+0Ch+var_8]` both refer to this one 8-byte temporary.
  - `8d841000000080` = `lea eax,[eax+edx+80000000h]`. The `8d9411…` and `8d8c0e…` forms are the same `lea`, giving MAC2 and MAC3.

## ABI and frame (exact)

- **Arguments:** none. No `[esp+N]` above the return address is read. Plain `retn` (C3), no immediate, so the function is caller-clean, cdecl-compatible `void(void)`.
- **Frame:** `sub esp,8` → `push esi` (0x45EC45) → `push ebx` (0x45ED0E) → `pop ebx` (0x45EDA2) → `pop esi` (0x45EDC8) → `add esp,8` → `retn`. The stack is balanced on every path, because all pushes and pops are on straight-line code shared by every path.
- **Callee-saved registers:** ESI and EBX are saved and restored. EDI and EBP are not touched.
- **Calls:** none. There are no `call` instructions and `code_targets` is empty.
- **EFLAGS:** the `cmp` at 0x45EC7B feeds the `jge` at 0x45ECD5. Nothing between them writes EFLAGS (only mov, lea, x87, a store, and `mov esi,7FFFh`). `push`/`pop ebx` between `cmp` and `jcc` (0x45ED0E, 0x45EDA2), `pop esi` (0x45EDC8) and the byte `mov` (0x45EDE8) do not touch flags either.
- **Return value (EAX):** not a documented result. The value left in EAX depends on the path:
  - If `MAC3 <= 0xFF` (unsigned), the `jbe` at 0x45EDED is taken. EAX is then MAC2, or `~(MAC2 sar 31)` if MAC2 was out of range.
  - Otherwise EAX = the new value of `dword_1CA92F8`, loaded at 0x45EDEF.

  The C returns this value as `uint32_t` only so it can be compared exactly against the binary. The real interface should be treated as `void` unless a caller is shown to read EAX.
- **ECX/EDX at exit:** ECX ends as the byte-clamp source for byte 2, and EDX as MAC2 or a flags value. Both are volatile under cdecl and are not modelled.

## Globals touched (from operands only; widths as accessed)

| Address | Access | Width |
|---|---|---|
| `1CA8A30` | read as `word` (low half), sign-extended | s16 |
| `1CA8A34`, `1CA8A38`, `1CA8A3C` | read as `word` (s16) at the start; **written as full dword** in the clamp section | s16 read / 32-bit write |
| `1CA8A2B` | read | byte |
| `1CA8A60`, `1CA8A64` | written dword (FIFO shift); `1CA8A64`, `1CA8A68` read dword | 32 |
| `1CA8A68` +0/+1/+2/+3 | written as bytes | 8 ×4 |
| `1CA8A74`, `1CA8A78`, `1CA8A7C` | read old value, written new value | 32 |
| `1CA92F8` | written 0, then OR-updated by read/modify/write | 32 |
| `B695F8` | read, float32. Value 1/4096 per compaction/prior note; the constant bytes are not in my inputs. | f32 |
| `B693D8` | read, double. Name gives 4.503601774854144e15 = 2^52 + 2^31. | f64 |

**Aliasing:** all addresses are distinct, so the store order affects no reads inside the function. The order is preserved anyway.
- `1CA8A64` is written with the *old* `1CA8A68`, which was loaded at 0x45EBF8, before the `A68` byte stores.
- `1CA8A34/38/3C` are read at 0x45EC10, 0x45EC2F and 0x45EC9C, before their dword writes at 0x45ECE1 and later.

## Arithmetic notes (exact)

- **Scale:** `s = (double)IR0 * (double)flt_B695F8`, computed once (0x45EC21 to 0x45EC36) and kept in ST(1).
- **Products:** for i = 1..3, `ST0 = (double)IRi * s` (`fild` + `fmul st,st(1)`).
- **Magic-double conversion:** `fadd 2^52+2^31` → `fstp qword [tmp]` → read the low dword → add `0x80000000` (folded into the `lea`).
  - This yields `rint(product)` in the **current x87 rounding mode** as an int32 (mod 2^32).
  - The products are exact: |IR0·IRi| ≤ 2^30, then scaled by 2^-12.
- **MAC update:** `MACi_new = MACi_old + low32 + 0x80000000`, with 32-bit wrap (lea, no flags, no saturation). This adds the old MAC1/2/3.
- **IR clamp:** signed `jge/jle` against `0xFFFF8000` (−32768) and `0x7FFF`. The clamped or unclamped *32-bit* value is stored as a full dword.
- **Flags:** `0x81000000` (IR1, a plain store over the 0 written earlier), `|= 0x80800000` (IR2), `|= 0x00400000` (IR3, no bit 31). The colour bits are `|= 0x200000`, `0x100000` and `0x80000`.
- **Colour clamp:** **unsigned** `jbe` against `0xFF`, applied to the raw MAC (not the clamped IR, and no shift).
  - Out of range: `sar 31; not` gives `0x00000000` if MAC < 0 and `0xFFFFFFFF` if MAC > 255 (signed). The low byte stored is `0x00` or `0xFF`.
  - In range: the low byte is the MAC value (0..255).

## C

```c
#include <stdint.h>
#include <string.h>

/* Globals named by address; widths as accessed in native ASM. */
extern uint32_t dword_1CA8A30;          /* read only as s16 (low word) */
extern uint32_t dword_1CA8A34;          /* read s16 low word; written dword */
extern uint32_t dword_1CA8A38;          /* read s16 low word; written dword */
extern uint32_t dword_1CA8A3C;          /* read s16 low word; written dword */
extern uint8_t  byte_1CA8A2B;
extern uint32_t dword_1CA8A60;
extern uint32_t dword_1CA8A64;
extern uint32_t dword_1CA8A68;          /* bytes +0..+3 written individually */
extern uint32_t dword_1CA8A74;
extern uint32_t dword_1CA8A78;
extern uint32_t dword_1CA8A7C;
extern uint32_t dword_1CA92F8;
extern const float  flt_B695F8;                    /* 0x00B695F8 (1/4096 per note) */
extern const double CONST_4_503601774854144e15;    /* 0x00B693D8 = 2^52 + 2^31   */

/* fadd magic ; fstp qword [esp+4] ; mov reg, dword [esp+4]  -> low dword.
 * Assumes the x87 precision-control is 53-bit (see Risks). */
static uint32_t magic_low32(double product)
{
    double d = product + CONST_4_503601774854144e15;   /* fadd m64 */
    uint64_t bits;
    memcpy(&bits, &d, sizeof bits);                    /* fstp m64 (temp) */
    return (uint32_t)bits;                             /* mov r32,[esp+4] (low dword) */
}

static uint32_t sat_byte_src(uint32_t v)   /* sar r,1Fh ; not r */
{
    uint32_t sar31 = ((int32_t)v < 0) ? 0xFFFFFFFFu : 0u;
    return ~sar31;
}

/* Returns the EAX left at retn (NOT an established result; see ABI). */
uint32_t sub_45EBF0(void)
{
    uint8_t *const rgb = (uint8_t *)&dword_1CA8A68;    /* little-endian bytes */
    uint32_t eax, ecx, edx, esi, ebx;
    int32_t  ir0, ir1, ir2, ir3;
    uint32_t old_mac1, old_mac2, old_mac3;
    double   s;                                        /* x87 ST(1) */
    uint8_t  dl;

    /* 45EBF0 sub esp,8 (temp slot) */
    eax = dword_1CA8A64;                               /* 45EBF3 */
    ecx = dword_1CA8A68;                               /* 45EBF8 */
    dword_1CA8A60 = eax;                               /* 45EBFE */
    dword_1CA8A64 = ecx;                               /* 45EC03 */
    ir0 = (int32_t)(int16_t)(uint16_t)dword_1CA8A30;   /* 45EC09 movsx word */
    ir1 = (int32_t)(int16_t)(uint16_t)dword_1CA8A34;   /* 45EC10 movsx word */
    /* 45EC17 tmp = ir0 */
    dl = byte_1CA8A2B;                                 /* 45EC1B */
    /* 45EC21 fild tmp ; 45EC25 tmp = ir1 */
    rgb[3] = dl;                                       /* 45EC29 byte A68+3 */
    ir2 = (int32_t)(int16_t)(uint16_t)dword_1CA8A38;   /* 45EC2F movsx word */
    s = (double)ir0 * (double)flt_B695F8;              /* 45EC21 fild, 45EC36 fmul m32 */
    /* 45EC3C fild tmp(ir1) */
    old_mac1 = dword_1CA8A74;                          /* 45EC40 */
    /* 45EC45 push esi */
    old_mac3 = dword_1CA8A7C;                          /* 45EC46 esi */
    dword_1CA92F8 = 0;                                 /* 45EC4C */

    /* 45EC56 fmul st,st1 ; 45EC58 fadd ; 45EC5E fstp ; 45EC62 mov edx */
    edx = magic_low32((double)ir1 * s);
    /* 45EC66 tmp = ir2 ; 45EC6A fild */
    old_mac2 = dword_1CA8A78;                          /* 45EC6E ecx */
    eax = old_mac1 + edx + 0x80000000u;                /* 45EC74 lea (wrap) */
    /* 45EC7B cmp eax,0FFFF8000h  (flags kept until 45ECD5) */
    dword_1CA8A74 = eax;                               /* 45EC80 */

    /* 45EC85 fmul ; 45EC87 fadd ; 45EC8D fstp ; 45EC91 mov edx */
    edx = magic_low32((double)ir2 * s);
    edx = old_mac2 + edx + 0x80000000u;                /* 45EC95 lea (wrap) */
    ir3 = (int32_t)(int16_t)(uint16_t)dword_1CA8A3C;   /* 45EC9C movsx word */
    /* 45ECA3 tmp = ir3 */
    dword_1CA8A78 = edx;                               /* 45ECA7 */

    /* 45ECAD fild ; 45ECB1 fmul ; 45ECB3 fadd ; 45ECB9 fstp ; 45ECBD mov ecx */
    ecx = magic_low32((double)ir3 * s);
    /* 45ECC1 fstp st (pop s) */
    ecx = old_mac3 + ecx + 0x80000000u;                /* 45ECC3 lea (wrap) */
    esi = 0x7FFFu;                                     /* 45ECCA */
    dword_1CA8A7C = ecx;                               /* 45ECCF */

    /* ---- IR1 clamp (signed), flags from 45EC7B ---- */
    if ((int32_t)eax < (int32_t)0xFFFF8000) {          /* 45ECD5 jge not taken */
        dword_1CA92F8 = 0x81000000u;                   /* 45ECD7 (store, not OR) */
        dword_1CA8A34 = 0xFFFF8000u;                   /* 45ECE1 */
    } else if ((int32_t)eax > (int32_t)esi) {          /* 45ECED cmp ; 45ECEF jle not taken */
        dword_1CA92F8 = 0x81000000u;                   /* 45ECF1 */
        dword_1CA8A34 = esi;                           /* 45ECFB */
    } else {
        dword_1CA8A34 = eax;                           /* 45ED03 */
    }

    /* ---- IR2 clamp (signed) ---- 45ED08 cmp ; 45ED0E push ebx */
    if ((int32_t)edx < (int32_t)0xFFFF8000) {          /* 45ED0F jge not taken */
        ebx = dword_1CA92F8;                           /* 45ED11 */
        dword_1CA8A38 = 0xFFFF8000u;                   /* 45ED17 */
        ebx |= 0x80800000u;                            /* 45ED21 */
        dword_1CA92F8 = ebx;                           /* 45ED27 */
    } else if ((int32_t)edx > (int32_t)esi) {          /* 45ED2F ; 45ED31 jle not taken */
        ebx = dword_1CA92F8;                           /* 45ED33 */
        dword_1CA8A38 = esi;                           /* 45ED39 */
        ebx |= 0x80800000u;                            /* 45ED3F */
        dword_1CA92F8 = ebx;                           /* 45ED45 */
    } else {
        dword_1CA8A38 = edx;                           /* 45ED4D */
    }

    /* ---- IR3 clamp (signed) ---- 45ED53 */
    if ((int32_t)ecx < (int32_t)0xFFFF8000) {          /* 45ED59 jge not taken */
        esi = dword_1CA92F8;                           /* 45ED5B (esi clobbered) */
        dword_1CA8A3C = 0xFFFF8000u;                   /* 45ED61 */
        esi |= 0x00400000u;                            /* 45ED6B */
        dword_1CA92F8 = esi;                           /* 45ED71 */
    } else if ((int32_t)ecx > (int32_t)esi) {          /* 45ED79 ; 45ED7B jle not taken */
        ebx = dword_1CA92F8;                           /* 45ED7D */
        dword_1CA8A3C = esi;                           /* 45ED83 */
        ebx |= 0x00400000u;                            /* 45ED89 */
        dword_1CA92F8 = ebx;                           /* 45ED8F */
    } else {
        dword_1CA8A3C = ecx;                           /* 45ED97 */
    }

    /* ---- colour byte 0 from MAC1 (unsigned) ---- 45ED9D cmp ; 45EDA2 pop ebx */
    if (eax > 0xFFu) {                                 /* 45EDA3 jbe not taken */
        esi = dword_1CA92F8;                           /* 45EDA5 */
        esi |= 0x00200000u;                            /* 45EDAE */
        eax = sat_byte_src(eax);                       /* 45EDAB sar ; 45EDB4 not */
        dword_1CA92F8 = esi;                           /* 45EDB6 */
    }
    rgb[0] = (uint8_t)eax;                             /* 45EDBC AL */

    /* ---- colour byte 1 from MAC2 ---- */
    eax = edx;                                         /* 45EDC1 */
    /* 45EDC3 cmp ; 45EDC8 pop esi */
    if (eax > 0xFFu) {                                 /* 45EDC9 jbe not taken */
        edx = dword_1CA92F8;                           /* 45EDCB */
        edx |= 0x00100000u;                            /* 45EDD4 */
        eax = sat_byte_src(eax);                       /* 45EDD1 sar ; 45EDDA not */
        dword_1CA92F8 = edx;                           /* 45EDDC */
    }

    /* ---- colour byte 2 from MAC3 ---- 45EDE2 cmp ecx,0FFh */
    rgb[1] = (uint8_t)eax;                             /* 45EDE8 AL (after cmp, flags kept) */
    if (ecx > 0xFFu) {                                 /* 45EDED jbe not taken */
        eax = dword_1CA92F8;                           /* 45EDEF */
        ecx = sat_byte_src(ecx);                       /* 45EDF4 sar ; 45EDFC not */
        eax |= 0x00080000u;                            /* 45EDF7 */
        dword_1CA92F8 = eax;                           /* 45EDFE */
    }
    rgb[2] = (uint8_t)ecx;                             /* 45EE03 CL */

    /* 45EE09 add esp,8 ; 45EE0C retn */
    return eax;                                        /* path-dependent leftover */
}
```

Ordering notes for the C:
- Inside each saturated arm, the ASM order of the flag RMW, `sar` and `not` is interleaved. That order is shown in the comments. Flags and values are separate registers, so this has no effect on the result.
- The `rgb[1]` store comes after the `cmp ecx` at 0x45EDE2 in the ASM. The C evaluates `ecx > 0xFF` after the store, which is the same thing because the store does not change ECX.

## Semantic summary (hypotheses are marked)

**Native-proven contract**
- Leaf procedure with no arguments that works only on globals. It:
  1. shifts a 3-entry dword FIFO (`A60 ← A64 ← A68`);
  2. computes `MACi += rint(IR0·IRi / 4096)` for i = 1..3, with 32-bit wrap;
  3. saturates each MACi into IRi (signed 16-bit range, stored as dword) and sets flag bits;
  4. writes saturated low bytes of MAC1..3 plus the code byte `A2B` into the new FIFO entry `A68`, setting more flag bits.

**Proposed name:** `Gte_GPL_sf1_lm0`, confidence **medium**.
- The behaviour matches a PS1-GTE-style "general purpose interpolation with base" emulation: MAC accumulates IR0·IR with 12-bit scaling, lm = 0 (lower clamp −0x8000), and results go to the RGB FIFO.
- The binary only carries the label `sub_45EBF0`. The name is a hypothesis.

**ASM / xref proofs**
1. 0x45EC40, 0x45EC74: `eax = [1CA8A74]` (old MAC1), then `lea eax,[eax+edx+80000000h]`. The new MAC1 = old MAC1 + converted product. The same pattern recurs for MAC2 (0x45EC6E, 0x45EC95) and MAC3 (0x45EC46, 0x45ECC3). So this routine accumulates; it does not overwrite.
2. 0x45EC21 to 0x45EC36, 0x45EC56, 0x45EC85, 0x45ECB1: a single scale `IR0 × flt_B695F8` multiplied by each of IR1..IR3. These are three products sharing IR0, i.e. interpolation by an IR0 factor.
3. 0x45ECD5 to 0x45ED97: signed clamps to [−0x8000, 0x7FFF] written back into `A34/38/3C`, the same addresses that IR1..IR3 were read from.
4. 0x45EBF3 to 0x45EC29 and 0x45EDBC / 0x45EDE8 / 0x45EE03: three-stage dword FIFO push. The new entry's bytes 0..2 come from MAC1..3 saturated to [0, 0xFF], and byte 3 from `byte_1CA8A2B`.
5. Xrefs (metadata/native): callers often call `0x45E9D0` and then this function:
   - in 0x657DF0: 0x657e0f → 9D0, 0x657e24 → BF0, 0x657e42 → 9D0, 0x657e56 → BF0;
   - in 0x6593E0: three pairs;
   - in 0x659510: four pairs.

   This is consistent with a set-then-accumulate pair.

**Name proofs (≥2)**
- **N1:** the flag constants follow PS1 GTE FLAG bit positions exactly:
  - IR1 sat = bit 24 + summary bit 31 (`0x81000000`);
  - IR2 = bit 23 + bit 31 (`0x80800000`);
  - IR3 = bit 22 **without** bit 31 (`0x00400000`), matching the hardware quirk that bit 22 is excluded from the error summary;
  - colour R/G/B sat = bits 21/20/19 (`0x200000/0x100000/0x80000`).

  The bit layout comes from the operands. Mapping it to the GTE is outside knowledge, not taken from the inputs.
- **N2:** the old-MAC accumulation (proof 1) separates GPL from its sibling 0x45E9D0. According to the common compaction, 0x45E9D0 has the same structure but does not add the previous MACs, i.e. it is GPF.
- **N3:** group context. The common compaction places this function in g02 with `Gte_AVSZ4` and shows overlapping callers with 0x45E9D0. This is supporting context only.

**Divergences from hardware GPL (recorded, NOT "fixed")**
- **Rounding:** products are rounded with `rint` through the magic-double, not truncated with `>>12`.
- **Colour source:** colours come from the raw MAC low byte, not MAC/16.
- **IR2 flag order:** the store of 0xFFFF8000 / 0x7FFF to A38 happens before the flag OR (harmless).

These are implementation facts of this binary. Whether they are intentional is unknown.

**Unknowns**
- Whether any caller reads the EAX leftover.
- The real x87 control word at the call sites.
- The exact value of `flt_B695F8`: 1/4096 comes from the compaction note, not from bytes I read.
- Upper bits of `A34/38/3C`: they are written as full 32-bit values, so values outside ±32767 never appear after a clamp, but negative in-range values store sign-extended dwords. Consumers reading them as words are unaffected.

## Risks / validations not performed

- **R1 (x87 precision):** the C models the conversion in IEEE double, which is exact under precision-control = 53 bits.
  - Under PC = 64, the extended-precision `fadd` followed by `fstp m64` rounds twice and can differ by 1 on rare products whose fraction is 2047/4096 or similar.
  - Under PC = 24 (Direct3D single-precision mode), the magic trick would not work at all.
  - The control word is not in the inputs, so the parent must decide the target environment.
- **R2 (rounding mode):** default round-to-nearest-even is assumed. A different RC changes the `rint` results.
- **R3:** byte views of `dword_1CA8A68` assume little-endian layout (x86).
- **Not performed:** compilation, byte-diff against the binary, differential or runtime tests. The compile/diff harness and the PC = 53 vs 64 question are requests to the lead or reviewer, not results.

No other files, IDB, Git, ledger, registry, config or live state were touched.
