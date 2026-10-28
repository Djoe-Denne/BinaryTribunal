# 0x460860 — independent C author B (run01, g04)

## Provenance / inputs

- Root packet (authoritative): `inputs/ff8-decomp-semantics-20261011-r01/g04/0x460860.json`,
  SHA256 `9384e033a8c2529b83d45416bffb9fc86fec628fa40990f5f60610486739861a`
  (cited from `0x460860.readable/manifest.json:4`; **not recomputed by me**, no shell available).
- Compaction: `inputs/.../g04/common-compaction.md`, SHA256 `1ffd99c0ab16a51b4b5c26f906c3ff61d657fd111e6c8720353e656c88add668` (manifest:5, not recomputed).
- Readable projection fully read: `asm-001..008.txt` (177 lines, 0x460860..0x460AED),
  `bytes-001/002.txt` (654 bytes, [0x460860,0x460AEE)), `metadata.json` (22 CFG blocks, 9 xrefs, `code_targets=[]`).
- Native input: FF8_EN.exe SHA256 `064d466b…6589570`, 32-bit, exported 2026-10-11T16:38:25Z.
- Byte spot-checks done by me against `bytes-001.txt`: `DC05 D893B600` = FADD m64 [0xB693D8];
  `DC0D 0096B600` = FMUL m64 [0xB69600]; `DB442418` = FILD **m32int** [esp+18h]; `DD5C240C` = FSTP m64 [esp+0Ch];
  `BE 0080FFFF` = MOV ESI,0xFFFF8000; `C705 F892CA01 00000081` = MOV [0x1CA92F8],0x81000000;
  `81CA 00008080` = OR EDX,0x80800000; `0D 00004000` = OR EAX,0x00400000; `81C2 00000080` = ADD EDX,0x80000000;
  `057C92CA01` = ADD EAX,0x01CA927C; `81C6 9092CA01` = ADD ESI,0x01CA9290.
- Constants (bytes hash-validated in compaction:26–27, not re-read by me):
  `[0xB69600]` = `000000000000303F` = 2^-12; `[0xB693D8]` = `0000008000003043` = 2^52 + 2^31 = 4503601774854144.0.
- History exposure statement: in this session I never saw a historical target C
  (the inherited checkpoint only contains the contract/group lookup and the first ~3.5 KB of the packet;
  GrepAI/QMD were never run in this session). No peer/other-volet output, ledger, IDB or classification score read.

## ABI / frame (native facts)

| Item | Fact | Evidence |
|---|---|---|
| Convention | cdecl-like: 1 DWORD on stack, plain `RET` (C3), caller cleans | 0x460AC1/0x460AE1/0x460AED `C3`; wrappers `PUSH imm32; CALL; POP ECX; RET` (compaction:31) |
| Frame | `SUB ESP,8` (one qword local at [esp+0Ch]), push EBX/ESI/EDI, no EBP | 0x460860–0x460865 |
| Preserved | EBX, ESI, EDI restored on all 3 exits | 0x460AB5–ABD, 0x460ACB–ADD, 0x460AE2–AE9 |
| Clobbered | EAX, ECX, EDX, x87 (stack balanced: 3 vector loads popped by 3× `FSTP ST` at 0x4609E6/E8/F2) | — |
| Arg slot | **Used as FILD scratch and overwritten.** Last write 0x4609C2 = sign-extended WORD at matrix+0x0C. Wrappers' `POP ECX` therefore leave ECX = that value (scratch, not a contract). | 0x4608A1…0x4609C2 |
| EAX at return | Path-dependent: in-range 3rd result → EAX = 3rd MAC DWORD (0x460AE4); 3rd result out of range → EAX = new status DWORD (`[0x1CA92F8] | 0x400000`). Whether any caller consumes it: **unknown** (wrappers just RET). | 0x460AA6–AC1, 0x460AC6–AE1, 0x460AE2–AED |

## Storage layout used (instruction-derived; neutral names)

| Address | Access | Width / sign | Evidence |
|---|---|---|---|
| 0x1CA927C + mx*0x20, +0x00..+0x10 | 9 reads | s16 (MOVSX word) | 0x46091B–0x46099A; base imm 0x46088A |
| 0x1CA9290 + cv*0x20 (= 0x1CA927C + cv*0x20 + 0x14), +0,+4,+8 | 3 reads only if cv≠3 | 32-bit (MOV) | 0x46088F, 0x4609FB/FD/A02 |
| 0x1CA8A10 + v*8, +0,+2,+4 (v∈0..2) | 3 reads | s16 | 0x4608C9/D5/E1 |
| 0x1CA8A34 / 38 / 3C | low-WORD s16 reads (v==3); later full 32-bit stores | s16 read, 32-bit write | 0x46089A/A5/B4; 0x460A3C…0x460AE4 |
| 0x1CA8A74 / 78 / 7C | 32-bit stores (twice when cv≠3) | 32-bit | 0x460982/9C6/9F4; 0x460A09/0F/15 |
| 0x1CA92F8 | cleared, then MOV/OR | 32-bit | 0x460A1F, 0x460A32/48, 0x460A64–76, 0x460A82–94, 0x460AA6–B8, 0x460AC6–D2 |

Note: 0x1CA92F8 = 0x1CA927C + 3*0x20 + 0x1C, i.e. inside the 4th 0x20 bank at the position of "dword +8 of the +0x14 triple". cv==3 bypasses those loads, so no read of 0x1CA92F8 occurs through that path. Offset +0x12 of a bank is never touched. A bank-size-0x20 struct is a convenient view, not a proven typedef.

## C reconstruction (complete, every block)

```c
#include <stdint.h>

/* Absolute-address access, little-endian x86-32 image.  Names are neutral (address-based). */
#define ABS_S16P(a)  ((const int16_t *)(uintptr_t)(a))
#define ABS_S32P(a)  ((const int32_t *)(uintptr_t)(a))
#define ABS_U32(a)   (*(uint32_t *)(uintptr_t)(a))

#define G_VEC_BASE      0x01CA8A10u  /* 3 x {s16,s16,s16,pad}, stride 8                     */
#define G_A34           0x01CA8A34u  /* 3 x DWORD, stride 4: s16 low-word read, 32-bit write */
#define G_A74           0x01CA8A74u  /* 3 x DWORD, stride 4: 32-bit results                  */
#define G_STATUS        0x01CA92F8u  /* DWORD status                                         */
#define G_BANK_M_BASE   0x01CA927Cu  /* bank stride 0x20: 9 x s16 at +0x00..+0x11             */
#define G_BANK_T_BASE   0x01CA9290u  /* = G_BANK_M_BASE + 0x14: 3 x s32                      */

/* Low 16 bits of a DWORD, sign-extended (MOVSX r32, word ptr).  uint16->int16 is
   implementation-defined before C23; two's complement wrap on every x86 compiler. */
#define LOW_S16(u32)  ((int32_t)(int16_t)(uint16_t)(u32))

/* Native: FADD qword[0xB693D8]; FSTP qword[esp+0Ch]; MOV r32,[esp+0Ch]; ADD r32,80000000h.
   This is a bit-level extraction of the low mantissa DWORD, NOT a C cast / FISTP.        */
typedef union { double d; uint32_t w[2]; } dbl_bits_t;   /* w[0] = low DWORD (LE) */

static const double K_B693D8 = 4503601774854144.0;  /* bytes 00 00 00 80 00 00 30 43 = 2^52+2^31 */
static const double K_B69600 = 0.000244140625;      /* bytes 00 00 00 00 00 00 30 3F = 2^-12     */

/* cdecl, one 32-bit stack argument, caller pops (wrappers: PUSH imm; CALL; POP ECX; RET).
   Return value models native EAX only (path-dependent, see notes); consumption unknown. */
uint32_t sub_460860(uint32_t cmd)
{
    /* 0x460866–0x46088F.  Native uses SAR; masking with 3 makes SAR == SHR here. */
    const uint32_t cv = (cmd >> 13) & 3u;                 /* ECX                          */
    const uint32_t mx = (cmd >> 17) & 3u;                 /* EAX before scaling           */
    const uint32_t v  = (cmd >> 15) & 3u;                 /* EDX                          */
    const int16_t *M  = ABS_S16P(G_BANK_M_BASE + mx * 0x20u);   /* EAX = mx*32 + 0x1CA927C */
    const int32_t *T  = ABS_S32P(G_BANK_T_BASE + cv * 0x20u);   /* ESI = cv*32 + 0x1CA9290,
                                                                  computed always, deref only if cv!=3 */
    double x, y, z;                /* x87 ST2, ST1, ST0 after the three FILDs */
    double s;
    dbl_bits_t cvt;
    uint32_t mac0, mac1, mac2;     /* EDX, EDI, EAX */

    /* 0x460895 CMP EDX,3 / JNZ 0x4608C9 */
    if (v == 3u) {
        /* 0x46089A–0x4608C7: three s16 low words, read order A34, A38, A3C */
        x = (double)LOW_S16(ABS_U32(G_A34 + 0u));
        y = (double)LOW_S16(ABS_U32(G_A34 + 4u));
        z = (double)LOW_S16(ABS_U32(G_A34 + 8u));
    } else {
        /* 0x4608C9–0x4608F5: s16 at 0x1CA8A10 + v*8 + {0,2,4} */
        const int16_t *V = ABS_S16P(G_VEC_BASE + v * 8u);
        x = (double)V[0];
        y = (double)V[1];
        z = (double)V[2];
    }

    /* 0x4608F9 TEST EDI,80000h / JZ 0x46091B; 0x460901–0x460915: scale x, y, z (in this order) */
    if (cmd & 0x00080000u) {
        x = x * K_B69600;
        y = y * K_B69600;
        z = z * K_B69600;
    }

    /* Row 0 (0x46091B–0x460982): reads M[2], M[1], M[0];  ((m2*z) + (m1*y)) + (m0*x) */
    s = ((double)M[2] * z + (double)M[1] * y) + (double)M[0] * x;
    cvt.d = s + K_B693D8;                                 /* 0x460958 FADD, 0x46095E FSTP m64 */
    mac0 = cvt.w[0] + 0x80000000u;                        /* 0x46096A MOV, 0x46097C ADD (wrap) */
    ABS_U32(G_A74 + 0u) = mac0;                           /* 0x460982 */

    /* Row 1 (0x46093E…0x4609C6): reads M[5], M[4], M[3];  ((m5*z) + (m4*y)) + (m3*x) */
    s = ((double)M[5] * z + (double)M[4] * y) + (double)M[3] * x;
    cvt.d = s + K_B693D8;                                 /* 0x4609A0, 0x4609A6 */
    mac1 = cvt.w[0] + 0x80000000u;                        /* 0x4609B2, 0x4609B6 */
    ABS_U32(G_A74 + 4u) = mac1;                           /* 0x4609C6 */

    /* Row 2 (0x460952…0x4609F4): reads M[8], M[7], M[6];  ((m8*z) + (m7*y)) + (m6*x) */
    s = ((double)M[8] * z + (double)M[7] * y) + (double)M[6] * x;
    cvt.d = s + K_B693D8;                                 /* 0x4609D8, 0x4609DE */
    mac2 = cvt.w[0] + 0x80000000u;                        /* 0x4609E2, 0x4609EA */
    /* 0x4609E6/E8/F2: FSTP ST x3 discards z, y, x */
    ABS_U32(G_A74 + 8u) = mac2;                           /* 0x4609F4 */

    /* 0x4609EF CMP ECX,3 / 0x4609F9 JZ 0x460A1A; 0x4609FB–0x460A15: 32-bit wrapping adds */
    if (cv != 3u) {
        mac0 += (uint32_t)T[0];
        mac1 += (uint32_t)T[1];
        mac2 += (uint32_t)T[2];
        ABS_U32(G_A74 + 0u) = mac0;                       /* 0x460A09 */
        ABS_U32(G_A74 + 4u) = mac1;                       /* 0x460A0F */
        ABS_U32(G_A74 + 8u) = mac2;                       /* 0x460A15 */
    }

    /* 0x460A1A–0x460A30: ESI=-32768, status=0, ECX=32767; all compares SIGNED (JGE/JLE) */
    ABS_U32(G_STATUS) = 0u;                               /* 0x460A1F */

    /* Result 0 */
    if ((int32_t)mac0 < -32768) {                         /* 0x460A29/30 */
        ABS_U32(G_STATUS) = 0x81000000u;                  /* 0x460A32: MOV (not OR)  */
        ABS_U32(G_A34 + 0u) = 0xFFFF8000u;                /* 0x460A3C: full DWORD -32768 */
    } else if ((int32_t)mac0 > 32767) {                   /* 0x460A44/46 */
        ABS_U32(G_STATUS) = 0x81000000u;                  /* 0x460A48: MOV */
        ABS_U32(G_A34 + 0u) = 0x00007FFFu;                /* 0x460A52 */
    } else {
        ABS_U32(G_A34 + 0u) = mac0;                       /* 0x460A5A */
    }

    /* Result 1 */
    if ((int32_t)mac1 < -32768) {                         /* 0x460A60/62 */
        uint32_t st = ABS_U32(G_STATUS);                  /* 0x460A64 */
        ABS_U32(G_A34 + 4u) = 0xFFFF8000u;                /* 0x460A6A */
        ABS_U32(G_STATUS) = st | 0x80800000u;             /* 0x460A70/76 */
    } else if ((int32_t)mac1 > 32767) {                   /* 0x460A7E/80 */
        uint32_t st = ABS_U32(G_STATUS);                  /* 0x460A82 */
        ABS_U32(G_A34 + 4u) = 0x00007FFFu;                /* 0x460A88 */
        ABS_U32(G_STATUS) = st | 0x80800000u;             /* 0x460A8E/94 */
    } else {
        ABS_U32(G_A34 + 4u) = mac1;                       /* 0x460A9C */
    }

    /* Result 2 — three return paths; return value = native EAX */
    if ((int32_t)mac2 < -32768) {                         /* 0x460AA2/A4 */
        uint32_t eax = ABS_U32(G_STATUS);                 /* 0x460AA6 */
        ABS_U32(G_A34 + 8u) = 0xFFFF8000u;                /* 0x460AAB */
        eax |= 0x00400000u;                               /* 0x460AB1 */
        ABS_U32(G_STATUS) = eax;                          /* 0x460AB8 */
        return eax;                                       /* 0x460AC1 */
    }
    if ((int32_t)mac2 > 32767) {                          /* 0x460AC2/C4 */
        uint32_t eax = ABS_U32(G_STATUS) | 0x00400000u;   /* 0x460AC6/CC */
        ABS_U32(G_STATUS) = eax;                          /* 0x460AD2 (before A3C store) */
        ABS_U32(G_A34 + 8u) = 0x00007FFFu;                /* 0x460AD7 */
        return eax;                                       /* 0x460AE1 */
    }
    ABS_U32(G_A34 + 8u) = mac2;                           /* 0x460AE4 */
    return mac2;                                          /* 0x460AED */
}
```

### Fidelity notes (C ↔ ASM)

1. **Block coverage**: all 22 CFG blocks of `metadata.json` map to: entry/selector (0x460860), v==3 (0x46089A), v<3 (0x4608C9), sf test (0x4608F9), sf scale (0x460901), 3 rows + cv test (0x46091B), translation add (0x4609FB), status clear + r0 test (0x460A1A), r0 low/high/in (0x460A32/0x460A44+0x460A48/0x460A5A), r1 test/low/high/in (0x460A60/0x460A64/0x460A7E+0x460A82/0x460A9C), r2 test + 3 exits (0x460AA2/0x460AA6/0x460AC2+0x460AC6/0x460AE2).
2. **Read order / aliasing**: native reads M in order 2,1,0,5,4,8,3,7,6 (interleaved with the row-0 store at 0x460982 and row-1 store at 0x4609C6). The matrix range [0x1CA927C,0x1CA92FC) and vector ranges cannot overlap 0x1CA8A74..7F, so the source order shown is observably equivalent; it is not volatile-exact. The read of 0x1CA8A34..3C (v==3) occurs before any of their stores. Store order of the r2 out-of-range paths is preserved exactly (low: A3C then status; high: status then A3C).
3. **Operand order of x87 ops**: FMUL ST,ST(i) and FADDP ST(1),ST are commutative in IEEE; association order ((a+b)+c) is preserved as in native.
4. **Exactness**: FILD m32 of a sign-extended s16 is exact; ×2^-12 is exact; each product |m·v| ≤ 2^30 and each 3-term sum ≤ 3·2^30 (multiples of 2^-12 when sf=1, ≤ 32 significant bits) is exact in a 53-bit significand, hence also in 64-bit extended. **The only rounding is at FADD K (and FSTP m64).**
5. **x87 precision / rounding (uncertainty)**: the C model rounds `s + K` once to double. Native rounds FADD at the current PC (unknown; MSVC runtimes typically set 53-bit, not proven here) and again at FSTP m64. If PC were 64-bit extended, double rounding (first to 2^-11 grid, then to integer) can differ from single rounding in tie-adjacent cases with sf=1 (e.g. sum = 1.5−2^-12). Rounding mode RC is inherited from the caller environment in both native and C (default nearest-even assumed by nobody here). C must be compiled with FLT_EVAL_METHOD==0 (SSE2) or x87 PC53 to match the PC53 case.
6. **Bit-trick range behaviour**: for s ∈ [−2^31, 2^32+2^31) the result equals round(s) mod 2^32. For s < −2^31 (reachable only with sf=0: minimum 3·(−32768·32767)), `s+K` falls below 2^52, ULP becomes 0.5 and the low DWORD encodes 2·s (half-integer rounded) + offset; the union model reproduces this bit-exactly, a `(int32_t)lrint()` simplification would NOT. Not "repaired".
7. **Translation add** is a 32-bit wrapping integer add (uint32 in C avoids signed-overflow UB) performed after the conversion, applied to all 3 results, and the A74..7C slots are rewritten.
8. **Saturation** compares are signed (JGE/JLE) against full DWORDs 0xFFFF8000/0x00007FFF; saturated values are stored as full DWORDs (not 16-bit). Status: result0 uses MOV 0x81000000 (status was just zeroed, so equivalent to OR, but MOV is kept), results 1/2 use read-OR-write with 0x80800000 / 0x00400000. No bit tested by lm (bit 10) or any other field — the function ignores all other bits of `cmd` except 13–19.
9. **Partial registers**: no AL/AX/8-/16-bit register writes; all 16-bit reads are MOVSX into 32-bit. Low-WORD reads of the A34..3C DWORDs model `word ptr dword_1CA8A3x` exactly (LE low half).
10. **Arg slot side effect**: the incoming argument slot is overwritten (final = (int32)M[6]); invisible at C level for cdecl semantics, only observable as wrappers' ECX after POP ECX. Not modelled in code.
11. **Prototype**: `uint32_t sub_460860(uint32_t)` is a register model, not a recovered source prototype; if callers ignore EAX, `void` is equally consistent with the native evidence. Signedness of `cmd` is irrelevant (masked fields, bit test).

## Semantic proposal

- **Role**: software emulation of a fixed-point "multiply 3-vector by selectable 3×3 s16 matrix, optionally add selectable 32-bit translation, store 32-bit results, then saturate to s16 into a second set of DWORD slots with sticky status bits" — structurally a port of the PlayStation GTE **MVMVA** command operating on a global GTE register-file emulation.
- **Name**: `Gte_MVMVA` (proposed independently; matches the existing label, but the label is NOT used as evidence).
- **Confidence**: role 0.85; register identities (below) 0.7.

### ASM / xref proofs

1. Field extraction 0x46086E–0x460887: cv = bits13–14, v = bits15–16, mx = bits17–18; 0x4608F9 tests bit19 — exactly the MVMVA sf/mx/v/cv field positions. (External knowledge: PSX GTE command encoding, not in the frozen gel.)
2. Nine wrappers (xrefs 0x4607D5…0x460855, compaction:31–40) pass immediates 0x4C6012, 0x4A2012, 0x4AA012, 0x4B2012, 0x4BE012, 0x49E012, 0x480012 (×2), 0x486012: all equal `0x0400012 | sf | fields` — low 6 bits 0x12 and bit 22 set = the 25-bit COP2 MVMVA command word; lm bit10 = 0 in all.
3. Saturation 0x460A1A–0x460AE4: clamp to [−0x8000, 0x7FFF]; status bits 24 (+31), 23 (+31), 22 (without 31) for results 0/1/2 — matches GTE FLAG IR1/IR2/IR3 saturation bits, including the hardware rule that bit 22 is not part of the bit-31 error summary.
4. v==3 (0x46089A–B4) sources the same DWORD slots A34/38/3C that receive the saturated outputs → consistent with V=3 meaning "IR vector".
5. cv==3 (0x4609EF/F9) skips the translation add → consistent with CV=3 "no vector".
6. sf=1 multiplies by 2^-12 (0x460903/90D/915) → consistent with the sf ">>12" fraction shift.
7. Bank layout 9×s16 at +0 and 3×s32 at +0x14 with stride 0x20 from base 0x1CA927C (0x46088A/88F) → consistent with GTE control-register layout (RT+TR, LLM+BK, LCM+FC).

**Two independent name proofs**: (A) command encoding — proofs 1+2 (immediate constants in callers and field decoding in callee); (B) FLAG semantics — proof 3 (specific bit pattern incl. bit-22 summary exclusion). Both rely on external PSX GTE documentation knowledge, not on any label or historical doc.

**Tentative register identities** (inference, 0.7): 0x1CA8A10+v*8 = V0/V1/V2; 0x1CA8A34/38/3C = IR1/IR2/IR3 (stored as 32-bit); 0x1CA8A74/78/7C = MAC1/MAC2/MAC3; 0x1CA92F8 = FLAG; banks 0..3 at 0x1CA927C = rotation / light / color / (4th: unused-mx3 garbage area whose +0x1C overlays FLAG).

### Observed divergences from PSX hardware (facts, not fixes)

- sf applied as ×2^-12 to the vector *before* multiply with round-to-nearest (via the K trick), instead of (Σ)>>12 floor.
- Translation added unscaled *after* conversion (hardware adds TR<<12 before the shift) — equivalent only for sf=1, modulo rounding; differs for sf=0.
- No lm handling (lower bound always −0x8000); no MAC overflow flags (bits 25–30); IR written as 32-bit; cv=2 hardware quirk and mx=3 garbage matrix not specially handled (mx=3 just reads bank 3 at 0x1CA92DC).

### Explicit unknowns

- Upstream callers of the nine wrappers, and whether EAX/ECX after return are consumed.
- FPU control word (PC/RC) at call time.
- Runtime contents / other writers of the globals; whether 0x1CA8A10 slots have a 4th word used elsewhere.
- Indirect calls to 0x460860 beyond the 9 inbound xrefs.

## Validations NOT performed

- No compilation, no unit test, no native differential / emulation, no hash recomputation (hashes cited from manifest/compaction). These are requests for the lead / separately authorized role, not PASS claims.
