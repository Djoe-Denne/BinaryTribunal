# 0x45E9D0 — independent C production B (c-b-45e9d0)

Inputs used (only):
- `inputs/ff8-decomp-semantics-20261011-r01/g02/common-compaction.md` (compaction sha256 per manifest: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`)
- `inputs/ff8-decomp-semantics-20261011-r01/g02/0x45E9D0.readable/manifest.json`
  (original packet sha256 `20a01d8e22132e51bd91786c830d7529b9608a3d0cdabc88a1981ffcda06cf5e`)
- `asm-001.txt` … `asm-005.txt` (25+25+25+25+9 = 109 lines = 109 instructions, read in full)
- `bytes-001.txt` (0x45E9D0..0x45EBE8, 0x219 bytes, read in full)
- `metadata.json` (cfg 22 blocks, xrefs_to, `code_targets: []`, `instruction_count: 109`)

Native identity: FF8_EN.exe sha256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, PE32, export 2026-10-11T16:38:25Z.
Native label: `sub_45E9D0` (generic; no name proof available from native).

No compilation, no test and no differential run were performed by this author.

---

## 1. ABI / frame facts (from ASM)

| Fact | Evidence |
|---|---|
| No stack arguments read (no `[esp+N]` above the local frame, no `arg_*`) | all 109 lines; only `var_8` accessed |
| 8-byte local scratch (int32 for `fild`, double for `fstp`) | `0045E9D0 sub esp,8` / `0045EBE5 add esp,8` |
| EBX callee-saved, pushed inside body | `0045EADD push ebx` / `0045EBA4 pop ebx` |
| Plain `retn` (no `retn N`) → caller cleans, cdecl-compatible, 0 args | `0045EBE8 retn` (bytes `…83c408c3`) |
| No calls, no indirect control flow | metadata `code_targets: []`; no `call`/`jmp reg` in ASM |
| EAX/ECX/EDX clobbered; EAX at `retn` is path-dependent leftover | see §4 |
| x87 stack balanced: depth 0 at entry and exit | trace in §3 |

## 2. Globals touched (absolute operands, widths as encoded)

| Address | Access | Width |
|---|---|---|
| 0x1CA8A60 | write | dword |
| 0x1CA8A64 | read, then write | dword |
| 0x1CA8A68 | read (dword); later byte writes +0,+1,+2,+3 | dword / byte |
| 0x1CA8A2B | read | byte |
| 0x1CA8A30 | read as `word ptr` sign-extended | s16 |
| 0x1CA8A34, 0x1CA8A38, 0x1CA8A3C | read as `word ptr` sign-extended; later written as **full dword** | s16 read / dword write |
| 0x1CA8A74, 0x1CA8A78, 0x1CA8A7C | write only (NOT read — no accumulation) | dword |
| 0x1CA92F8 | write 0, then write/RMW | dword |
| flt_B695F8 | `fmul m32` | float |
| CONST_4_503601774854144e15 | `fadd m64` | double |

Constant values: the label name gives 4503601774854144.0 = 2^52 + 2^31 (magic-double). `flt_B695F8` = 1/4096 (0x39800000) per compaction/secondary notes only; its bytes are not in this packet, so the C keeps it as an extern rather than a literal.

## 3. Complete C

```c
#include <stdint.h>

/* Absolute-address accessors: faithful to the encoded operands
 * (word reads of dword-labelled globals and byte writes into dword_1CA8A68
 * are intentional partial accesses, not type puns to be "fixed").           */
#define U8(a)   (*(uint8_t  *)(uintptr_t)(a))
#define S16(a)  (*(int16_t  *)(uintptr_t)(a))
#define U32(a)  (*(uint32_t *)(uintptr_t)(a))
#define S32(a)  (*(int32_t  *)(uintptr_t)(a))

extern const float  flt_B695F8;                  /* 1/4096 per notes (0x39800000) */
extern const double CONST_4_503601774854144e15;  /* 2^52 + 2^31 */

/* x87: fild(int32) -> fmul st,st(1) -> fadd m64 -> fstp m64 -> mov reg,[lo dword].
 * Returns the LOW dword of the stored double, before the caller adds 0x80000000.
 * Exactness depends on the caller's FPU control word (see risks R1/R2).       */
static uint32_t magic_lo(double product)
{
    union { double d; uint32_t u[2]; } v;
    v.d = product + CONST_4_503601774854144e15;  /* fadd ds:CONST_...; fstp [esp+var_8] */
    return v.u[0];                               /* mov reg, dword ptr [esp+var_8]       */
}

void __cdecl sub_45E9D0(void)
{
    int32_t  ir0, ir1, ir2, ir3;
    double   s;            /* x87 st(1): ir0 * flt_B695F8, kept live across all 3 products */
    int32_t  mac1, mac2, mac3;   /* EDX, EAX, ECX after the conversions */
    uint8_t  code;
    uint32_t sat;

    /* 45E9D3..45E9E3: dword FIFO shift (reads both before writes) */
    {
        uint32_t a = U32(0x1CA8A64);     /* eax */
        uint32_t c = U32(0x1CA8A68);     /* ecx */
        U32(0x1CA8A60) = a;
        U32(0x1CA8A64) = c;
    }

    ir0  = (int32_t)S16(0x1CA8A30);      /* 45E9E9 movsx eax */
    ir1  = (int32_t)S16(0x1CA8A34);      /* 45E9F0 movsx ecx */
    code = U8(0x1CA8A2B);                /* 45E9FB mov dl  */
    /* 45EA01 fild ir0 */
    U8(0x1CA8A68 + 3) = code;            /* 45EA09 (after FIFO shift above) */
    ir2  = (int32_t)S16(0x1CA8A38);      /* 45EA0F movsx eax */
    s    = (double)ir0 * (double)flt_B695F8;   /* 45EA16 fmul m32 */
    /* 45EA1C fild ir1 */
    U32(0x1CA92F8) = 0;                  /* 45EA20 */

    /* 45EA2A..45EA48: st0 = ir1 * st1 */
    mac1 = (int32_t)(magic_lo((double)ir1 * s) + 0x80000000u);  /* add edx,80000000h (wrap) */
    U32(0x1CA8A74) = (uint32_t)mac1;

    /* 45EA3E..45EA6F */
    mac2 = (int32_t)(magic_lo((double)ir2 * s) + 0x80000000u);  /* lea eax,[ecx+80000000h] */
    ir3  = (int32_t)S16(0x1CA8A3C);      /* 45EA64 movsx ecx (read after mac2 computed) */
    U32(0x1CA8A78) = (uint32_t)mac2;

    /* 45EA74..45EA96 */
    mac3 = (int32_t)(magic_lo((double)ir3 * s) + 0x80000000u);  /* add ecx,80000000h */
    /* 45EA94 fstp st : discard s (x87 depth back to 0) */
    U32(0x1CA8A7C) = (uint32_t)mac3;

    /* 45EA8E..45EAD2: IR1 signed clamp. NOTE: '=' not '|=' (flags were just zeroed). */
    if (mac1 < (int32_t)0xFFFF8000) {            /* cmp edx,0FFFF8000h ; jge (signed) */
        U32(0x1CA92F8) = 0x81000000u;
        U32(0x1CA8A34) = 0xFFFF8000u;            /* dword store */
    } else if (mac1 > 0x7FFF) {                  /* cmp edx,7FFFh ; jle (signed) */
        U32(0x1CA92F8) = 0x81000000u;
        U32(0x1CA8A34) = 0x00007FFFu;
    } else {
        S32(0x1CA8A34) = mac1;                   /* 45EAD2 full dword of EDX */
    }

    /* 45EAD8..45EB23: IR2 signed clamp (push ebx at 45EADD) */
    if (mac2 < (int32_t)0xFFFF8000) {
        U32(0x1CA8A38) = 0xFFFF8000u;
        U32(0x1CA92F8) = U32(0x1CA92F8) | 0x80800000u;
    } else if (mac2 > 0x7FFF) {
        U32(0x1CA8A38) = 0x00007FFFu;
        U32(0x1CA92F8) = U32(0x1CA92F8) | 0x80800000u;
    } else {
        S32(0x1CA8A38) = mac2;
    }
    /* (native order inside each clamp arm: load flags -> store IR -> OR -> store flags;
     *  equivalent here because the two addresses are distinct.)                       */

    /* 45EB28..45EB74: IR3 signed clamp (no bit 31 added) */
    if (mac3 < (int32_t)0xFFFF8000) {
        U32(0x1CA8A3C) = 0xFFFF8000u;
        U32(0x1CA92F8) = U32(0x1CA92F8) | 0x00400000u;
    } else if (mac3 > 0x7FFF) {
        U32(0x1CA8A3C) = 0x00007FFFu;
        U32(0x1CA92F8) = U32(0x1CA92F8) | 0x00400000u;
    } else {
        S32(0x1CA8A3C) = mac3;
    }

    /* 45EB7A..45EB9E: byte 0 of 1CA8A68 from MAC1 (UNSIGNED compare, jbe) */
    {
        uint32_t d = (uint32_t)mac1;
        if (d > 0xFFu) {
            sat = (mac1 < 0) ? 0xFFFFFFFFu : 0u;  /* sar edx,1Fh */
            U32(0x1CA92F8) = U32(0x1CA92F8) | 0x00200000u;
            d = ~sat;                              /* not edx: neg -> 0x00, pos -> 0xFF.. */
        }
        U8(0x1CA8A68 + 0) = (uint8_t)d;           /* mov byte ptr, dl */
    }
    /* 45EBA4 pop ebx */

    /* 45EB99..45EBC4: byte 1 from MAC2 */
    {
        uint32_t a = (uint32_t)mac2;
        if (a > 0xFFu) {
            sat = (mac2 < 0) ? 0xFFFFFFFFu : 0u;  /* sar eax,1Fh */
            U32(0x1CA92F8) = U32(0x1CA92F8) | 0x00100000u;
            a = ~sat;
        }
        U8(0x1CA8A68 + 1) = (uint8_t)a;           /* mov byte ptr, al */
    }

    /* 45EBBE..45EBDF: byte 2 from MAC3 */
    {
        uint32_t c = (uint32_t)mac3;
        if (c > 0xFFu) {
            sat = (mac3 < 0) ? 0xFFFFFFFFu : 0u;  /* sar ecx,1Fh */
            U32(0x1CA92F8) = U32(0x1CA92F8) | 0x00080000u;
            c = ~sat;
        }
        U8(0x1CA8A68 + 2) = (uint8_t)c;           /* mov byte ptr, cl */
    }
    /* 45EBE5 add esp,8 ; 45EBE8 retn — EAX leftover not modelled (void). */
}
```

### x87 depth trace (all FPU instructions covered)
`45EA01 fild`→1 · `45EA16 fmul m32` (st0=ir0*k) →1 · `45EA1C fild`→2 · `45EA2A fmul st,st1` · `45EA2C fadd m64` · `45EA32 fstp`→1 · `45EA3E fild`→2 · `45EA4E fmul` · `45EA50 fadd` · `45EA56 fstp`→1 · `45EA74 fild`→2 · `45EA78 fmul` · `45EA7A fadd` · `45EA80 fstp`→1 · `45EA94 fstp st`→0. Balanced; product order is `ir_i * (ir0 * k)` with st(1) never rounded to memory.

## 4. Coverage map (22 CFG blocks, 109 lines)

| Block (metadata cfg) | ASM lines | C location |
|---|---|---|
| 45E9D0–45EA9E | asm-001 1–25, asm-002 1–17 | FIFO shift, IR loads, code byte, flags=0, three conversions, MAC stores, first IR1 compare |
| 45EA9E–45EAB4 | asm-002 18–20 | IR1 low clamp arm |
| 45EAB4–45EABC | asm-002 21–22 | IR1 `> 0x7FFF` test |
| 45EABC–45EAD2 | asm-002 23–25 | IR1 high clamp arm |
| 45EAD2–45EAD8 | asm-003 1 | IR1 pass-through dword store |
| 45EAD8–45EAE0 | asm-003 2–4 | IR2 compare + `push ebx` |
| 45EAE0–45EAFE | asm-003 5–9 | IR2 low arm |
| 45EAFE–45EB05 | asm-003 10–11 | IR2 high test |
| 45EB05–45EB23 | asm-003 12–16 | IR2 high arm |
| 45EB23–45EB28 | asm-003 17 | IR2 pass-through |
| 45EB28–45EB30 | asm-003 18–19 | IR3 compare |
| 45EB30–45EB4E | asm-003 20–24 | IR3 low arm |
| 45EB4E–45EB56 | asm-003 25, asm-004 1 | IR3 high test |
| 45EB56–45EB74 | asm-004 2–6 | IR3 high arm |
| 45EB74–45EB7A | asm-004 7 | IR3 pass-through |
| 45EB7A–45EB82 | asm-004 8–9 | byte0 unsigned test |
| 45EB82–45EB99 | asm-004 10–14 | byte0 saturate + flag 0x200000 |
| 45EB99–45EBA7 | asm-004 15–18 | byte0 store, `pop ebx`, byte1 test |
| 45EBA7–45EBBE | asm-004 19–23 | byte1 saturate + flag 0x100000 |
| 45EBBE–45EBCB | asm-004 24–25, asm-005 1 | byte1 store, byte2 test |
| 45EBCB–45EBDF | asm-005 2–6 | byte2 saturate + flag 0x80000 |
| 45EBDF–45EBE9 | asm-005 7–9 | byte2 store, epilogue |

Bytes cross-check (bytes-001): e.g. `81fa0080ffff` @45EA8E = `cmp edx,0FFFF8000h` (imm32 sign-extended, signed jge `7d16`); `81faff000000 76 17` @45EB7A = `cmp edx,0FFh ; jbe` (unsigned); `c705f892ca0100000081` = `mov [1CA92F8],81000000h` (assignment, not OR); `81cb00008080` = `or ebx,80800000h`; `81cb00004000` = `or ebx,400000h`; `8815688aca01` / `a2698aca01` / `880d6a8aca01` = byte stores to 1CA8A68/69/6A; `88156b8aca01` = byte store to 1CA8A6B; `83c408c3` epilogue.

## 5. Semantic notes (hypothesis-level only, not a naming verdict)

ASM facts:
1. MAC_i = round(IR_i × IR0 × flt_B695F8) for i=1..3, stored to 1CA8A74/78/7C **without** reading them first (45EA48, 45EA6F, 45EA96) — this is the documented difference from sibling 0x45EBF0, which adds the previous MACs.
2. IR1..IR3 get signed 16-bit saturation of MAC_i with sticky flags 0x81000000 / 0x80800000 / 0x00400000 in 1CA92F8 (45EA9E, 45EAF0, 45EB40).
3. A 3-dword FIFO at 1CA8A60/64/68 is shifted, and the new entry gets bytes 0..2 = MAC1..3 clamped to 0..255 (flags 0x200000/0x100000/0x80000) and byte 3 = byte at 1CA8A2B.
4. Many direct call xrefs (type 17) in metadata, count not restated here (e.g. 0x56CB50, 0x56CBC0, 0x5D9510, 0x657DF0); the caller set overlaps 0x45EBF0's.

Hypothesis (not proven by native names): PSX-GTE-emulation style "general-purpose interpolation" (GPF-like, sf=1 because ×1/4096) primitive: flag bit layout matches PSX GTE FLAG (bit24/23/22 IR1–3 saturation, bit31 summary only for IR1/IR2, bits 21/20/19 color saturation). Name proofs: (a) global block 1CA8A2C..1CA92F8 shared with `Gte_AVSZ4` (0x45E610 writes 1CA8A2C/1CA8A70 and clears 1CA92F8 — compaction); (b) sibling relationship to 0x45EBF0 (same layout + MAC accumulation = GPL-like). Divergence to keep, not repair: the colour bytes are clamped from MAC_i directly, **not** MAC_i/16 as PSX GPF would do. Confidence for a GTE-GPF name: medium-low; generic label retained in C.

## 6. Risks / uncertainties

- **R1 (FPU precision control):** `fadd m64` + `fstp m64` magic-double conversion is exact round-to-nearest int only if PC ≥ 53 bits. If the process runs with PC=24 (Direct3D default without FPU_PRESERVE), the sum rounds to single precision and the low dword becomes coarse (multiples of 2^29). The C (`double` arithmetic) models PC=53 / RC=nearest. Not verified.
- **R2 (double rounding):** with PC=64, ir·ir0/4096 + 2^52+2^31 can need 65 mantissa bits; rounding to extended then to double may differ from single rounding on rare ties. With k = 2^-12 the product itself is exact.
- **R3 (rounding mode):** result follows FPU RC (nearest-even assumed), not C truncation; the C does not use `(int)` casts for this reason.
- **R4 (range):** MAC wrap: for |product| ≥ 2^31 the `+0x80000000` wraps mod 2^32; reproduced with `uint32_t` arithmetic. With s16 inputs and k=1/4096 the max |product| is 2^18, so wrap is unreachable unless flt_B695F8 differs.
- **R5:** flt_B695F8 value comes from secondary notes, not this packet.
- **R6:** EAX at `retn` = flags value (MAC3>0xFF path) or MAC2/~sar(MAC2) leftover; declared `void`. If any caller consumes EAX, the prototype must change — unverified (callers not in packet).
- **R7:** IR dword stores write the full 32-bit value into 1CA8A34/38/3C (upper word = sign extension or 0xFFFF/0x0000), and the reads use only the low word; modelled exactly with S16 reads / U32 writes.
- **R8:** C relies on non-strict-aliasing absolute-address access (MSVC-style); with GCC/Clang use `-fno-strict-aliasing`. Store order of distinct globals is preserved by source order; flags RMW order inside clamp arms is reordered relative to the IR store (distinct addresses; no observable effect single-threaded).
