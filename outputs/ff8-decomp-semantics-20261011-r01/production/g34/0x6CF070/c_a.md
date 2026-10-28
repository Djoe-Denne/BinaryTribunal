# C-A — 0x6CF070

- **Volet:** C / author A / 2+1
- **Group:** g34
- **EA:** 0x6CF070
- **Chunk:** `[0x6CF070, 0x6CF0BA)` — 0x4A bytes, 25 instructions, 1 basic block, no Jcc, `successors: []`
- **PE32:** `FF8_EN.exe` SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
- **Native export:** 2026-10-11T16:38:25.140966+00:00
- **IDA name (label only, not purpose):** `Mat3S16_MakeRotZ_NegSin_Q12`

Frozen inputs used (no peer/other-volet/historical-candidate files):

| artifact | path | sha256 |
|---|---|---|
| packet | `inputs/ff8-decomp-semantics-20261011-r01/g34/0x6CF070.json` | `a13552cb3feb4cd872faad730483c5e8c9695ce4c9ca62327e0e92533c29671b` |
| compaction | `inputs/ff8-decomp-semantics-20261011-r01/g34/common-compaction.md` | `f25865201fc77a97e108274fe16be8da7e9055939c3ca5acb337f78101be03d3` |
| classify request | `outputs/ff8-decomp-semantics-20261011-r01/classification/g34/0x6CF070.request.json` | `163040ac48c5476185fecf50537a3819e13c9a5748d134d361a02918b4b0a4e5` |
| classify response | `outputs/ff8-decomp-semantics-20261011-r01/classification/g34/0x6CF070.response.json` | `11bbe93b5381207898d0e538d33ae8420f4780a42354c829b99ed35bce3152fe` |

Classification (v1, preserved): complexity **52**, uncertainty **43**, cause `external_calls`. Admission rationale: preserve WORD sign-extension, pre-zero negated WORD store, and helper EAX return.

This reconstruction is instruction-faithful C for **this** body only. Native comments/labels are quoted as metadata, not as a business-role verdict. Helper bodies are not inlined.

## Prototype / ABI

Observed x86-32 cdecl (`retn`, no callee arg pop). ESI and EDI are saved/restored. ECX and EDX are clobbered. No root global load/store.

```c
int32_t __cdecl fun_006CF070(int16_t angle, int16_t *dst);
```

Stack after `push esi; push edi` (packet `assembly` / opcodes):

- `[esp+0x0C]` = original `[esp+4]` at entry = first slot. Consumed with **MOVSX** (`0F BF 74 24 0C` @ 0x6CF072): only the low WORD is read; the high 16 bits of the 4-byte cdecl slot are ignored.
- `[esp+0x18]` after the two helper pushes = original `[esp+8]` at entry = second argument, a pointer (`8B 4C 24 18` @ 0x6CF085).

Return: **EAX is not rewritten after the second helper**. The full 32-bit EAX from `fun_0056D100` is the return register. Only the stores truncate helper results to 16 bits.

`dst` is written with **exactly nine WORD stores** covering `+0 .. +10h` (18 bytes). There is no DWORD zero-fill and **no store at `+12h`**. Residual bytes past `+11h` are not owned by this function.

## Callees

Packet `code_targets`: `0x56D100`, `0x56D130`. Call order in this body is the reverse of that list.

| site | rel32 E8 | target | stack | return used as |
|---|---|---|---|---|
| 0x6CF078 | `E8 B3 E0 E9 FF` | **0x56D130** | one DWORD = sign-extended angle | full EAX copied to EDI (0x6CF07E) |
| 0x6CF080 | `E8 7B E0 E9 FF` | **0x56D100** | one DWORD = same angle (ESI still live) | EAX kept through epilogue |

Both pushes are cleaned with a single `add esp, 8` @ 0x6CF08D (two DWORD args across two cdecl calls, not a 2-arg signature on one call).

Assigned compaction (older frozen neighbour pack, **not** a live re-export of these helpers) records:

- `0x56D130`: FILD signed DWORD, FMUL `float[0xB6B980]`, **FSIN** (`D9 FE`), FMUL `float[0xB69540]`, FADD `double[0xB693D8]`, FSTP local QWORD, EAX = low DWORD + `0x80000000`.
- `0x56D100`: same shape with **FCOS** (`D9 FF`).
- Raw IEEE in that older supplement: `[0xB6B980]=0x3AC90FDB` (~π/2048), `[0xB69540]=0x45800000` (4096.0), `[0xB693D8]=0x4330000080000000` (2^52+2^31).

Current packet IDA comments on the two call sites match that sin-then-cos split, but those comments are labels, not independent proof. Rounding / truncation of the helpers depends on the live x87 control word; they are **not** replaced here by libm, `(int)sin`, or an assumed Q12 saturating cast.

Declarations used by the reconstruction:

```c
int32_t __cdecl fun_0056D130(int32_t a); /* 0x56D130 */
int32_t __cdecl fun_0056D100(int32_t a); /* 0x56D100 */
```

## Reconstruction

```c
#include <stdint.h>

int32_t __cdecl fun_0056D130(int32_t a);
int32_t __cdecl fun_0056D100(int32_t a);

/* 0x6CF070.
   dst must be valid for WORD stores at +0, +2, +4, +6, +8, +0A, +0C, +0E, +10.
   Bytes at +12 / +13 are not written. */
int32_t __cdecl fun_006CF070(int16_t angle, int16_t *dst)
{
    int32_t a = (int32_t)angle;      /* 0x6CF072 MOVSX ESI, WORD slot */
    int32_t s;                       /* EDI: 32-bit 0x56D130 result */
    int32_t c;                       /* EAX: 32-bit 0x56D100 result */
    int32_t neg_s;                   /* EDX: 32-bit two's complement of s */

    s = fun_0056D130(a);             /* 0x6CF078; 0x6CF07E mov edi, eax */
    c = fun_0056D100(a);             /* 0x6CF080 */
    neg_s = -s;                      /* 0x6CF089 / 0x6CF08B NEG EDX before any 16-bit store */

    dst[1] = (int16_t)neg_s;         /* +2  0x6CF090  BEFORE xor edx,edx */
    dst[3] = (int16_t)s;             /* +6  0x6CF096  DI still holds low 16 of s */
    dst[0] = (int16_t)c;             /* +0  0x6CF09B */
    dst[2] = 0;                      /* +4  0x6CF09E  DX after xor */
    dst[4] = (int16_t)c;             /* +8  0x6CF0A2 */
    dst[5] = 0;                      /* +0A 0x6CF0A6 */
    dst[6] = 0;                      /* +0C 0x6CF0AA */
    dst[7] = 0;                      /* +0E 0x6CF0AE */
    dst[8] = 0x1000;                 /* +10 0x6CF0B2  immediate, not a helper result */
    return c;                        /* EAX untouched after 0x56D100 */
}
```

Store order above follows the native order except that the four later zero stores and the second `c` store are listed after `dst[0]` as in the instruction stream (0x6CF09B..0x6CF0B2). `pop edi` @ 0x6CF09A happens after `dst[3]` and before `dst[0]`; later stores do not use DI.

Offset map (cells, not a purpose claim):

| off | insn | value |
|---|---|---|
| +0 | 0x6CF09B `66 89 01` | low 16 of `c` |
| +2 | 0x6CF090 `66 89 51 02` | low 16 of **32-bit** `-s` |
| +4 | 0x6CF09E `66 89 51 04` | 0 |
| +6 | 0x6CF096 `66 89 79 06` | low 16 of `s` |
| +8 | 0x6CF0A2 `66 89 41 08` | low 16 of `c` |
| +0A | 0x6CF0A6 `66 89 51 0A` | 0 |
| +0C | 0x6CF0AA `66 89 51 0C` | 0 |
| +0E | 0x6CF0AE `66 89 51 0E` | 0 |
| +10 | 0x6CF0B2 `66 C7 41 10 00 10` | `0x1000` |

`(int16_t)neg_s` is **not** rewritten as `-(int16_t)s`. Native is `NEG` on the 32-bit copy, then `MOV [ecx+2], DX`.

## Instruction provenance

Packet hex: `56570fbf74240c56e8b3e0e9ff568bf8e87be0e9ff8b4c24188bd7f7da83c4086689510233d2668979065f66890166895104668941086689510a6689510c6689510e66c7411000105ec3`

| EA | bytes | asm | C |
|---|---|---|---|
| 0x6CF070 | `56` | `push esi` | callee-saved |
| 0x6CF071 | `57` | `push edi` | callee-saved |
| 0x6CF072 | `0F BF 74 24 0C` | `movsx esi, word [esp+0xC]` | `a = (int32_t)angle` |
| 0x6CF077 | `56` | `push esi` | arg to 0x56D130 |
| 0x6CF078 | `E8 B3 E0 E9 FF` | `call 0x56D130` | `s = fun_0056D130(a)` |
| 0x6CF07D | `56` | `push esi` | arg to 0x56D100 |
| 0x6CF07E | `8B F8` | `mov edi, eax` | keep `s` |
| 0x6CF080 | `E8 7B E0 E9 FF` | `call 0x56D100` | `c = fun_0056D100(a)` |
| 0x6CF085 | `8B 4C 24 18` | `mov ecx, [esp+0x18]` | `dst` |
| 0x6CF089 | `8B D7` | `mov edx, edi` | copy `s` |
| 0x6CF08B | `F7 DA` | `neg edx` | `neg_s = -s` (32-bit) |
| 0x6CF08D | `83 C4 08` | `add esp, 8` | cdecl clean of two helper args |
| 0x6CF090 | `66 89 51 02` | `mov [ecx+2], dx` | `dst[1] = (int16_t)neg_s` |
| 0x6CF094 | `33 D2` | `xor edx, edx` | zero source for later WORD stores |
| 0x6CF096 | `66 89 79 06` | `mov [ecx+6], di` | `dst[3] = (int16_t)s` |
| 0x6CF09A | `5F` | `pop edi` | restore EDI |
| 0x6CF09B | `66 89 01` | `mov [ecx], ax` | `dst[0] = (int16_t)c` |
| 0x6CF09E | `66 89 51 04` | `mov [ecx+4], dx` | `dst[2] = 0` |
| 0x6CF0A2 | `66 89 41 08` | `mov [ecx+8], ax` | `dst[4] = (int16_t)c` |
| 0x6CF0A6 | `66 89 51 0A` | `mov [ecx+0A], dx` | `dst[5] = 0` |
| 0x6CF0AA | `66 89 51 0C` | `mov [ecx+0C], dx` | `dst[6] = 0` |
| 0x6CF0AE | `66 89 51 0E` | `mov [ecx+0E], dx` | `dst[7] = 0` |
| 0x6CF0B2 | `66 C7 41 10 00 10` | `mov word [ecx+10h], 1000h` | `dst[8] = 0x1000` |
| 0x6CF0B8 | `5E` | `pop esi` | restore ESI |
| 0x6CF0B9 | `C3` | `retn` | return `c` in EAX |

Call-target checks (packet `code_targets`):

- `0x6CF07D + (int32_t)0xFFE9E0B3 = 0x56D130`
- `0x6CF085 + (int32_t)0xFFE9E07B = 0x56D100`

## Callers (xref facts only)

Packet `xrefs_to`, type 17, `iscode: true` (five sites / five functions):

| from | function |
|---|---|
| 0x69EFDD | 0x69EF60 |
| 0x6CEAA5 | 0x6CEA30 |
| 0x6D0D33 | 0x6D0C20 |
| 0x6D3029 | 0x6D2F30 |
| 0x6EA99D | 0x6EA920 |

Shared callers with sibling 0x6D9510 (`0x69EF60`, `0x6EA920`) are graph facts only. They do not identify the destination object or the domain role of the nine WORDs.

## Uncertainties (not guessed away)

- **Helper contracts:** 0x56D130 / 0x56D100 are opaque from this chunk. Older-pack x87 steps explain *how* EAX is produced in that frozen snapshot; they do not prove current-export identity, x87 CW, or a stable int16 range. If a helper EAX has nonzero bits 16..31, `(int16_t)` stores drop them and 32-bit `NEG` can disagree with `-(int16_t)s`.
- **Object type / alignment / size:** nine WORD cells are written; callers may pass a larger object. `+12h/+13h` are not initialized here. No evidence in this chunk for a typed struct name.
- **Aliasing:** `dst` is a caller pointer. This body does not read `dst` before writing. Overlap with the angle stack slot is not demonstrated and not required for the stores.
- **First-arg high word:** MOVSX ignores it. A prototype `int32_t angle` would still be accurate if callers pass a full DWORD; the body would still use only the low 16 bits.
- **Purpose / axis / Q12 algebra:** layout is compatible with a 3×3 of int16 with `0x1000` at `+10h`, but that is **not** a semantic verdict. Literal `0x1000` is an immediate, not a computed 1.0.
- **Return width consumed by callers:** this function leaves full EAX = helper `c`. Whether callers use 32 bits or only AX is not in this chunk.

## Historical / unvalidated (separated; not used as C)

Packet `name_label_only` and call-site comments (`Fixed_Sin4096_Q12`, `Fixed_Cos4096_Q12`, flt addresses, “magic-double +0x80000000”) are IDA metadata. Compaction records historical decomp note headers for this EA as non-authoritative. Those names/prototypes are **not** adopted as the reconstruction identity and are **not** treated as proof of matrix / rotation / GTE purpose.
