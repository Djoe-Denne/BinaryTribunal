# C B — 0x6D9510

Independent volet B. Frozen facts only. No test or compile was run.

## Identity

| Field | Value |
| --- | --- |
| EA | `0x6D9510` – `0x6D9557` inclusive; chunk end exclusive `0x6D9558` |
| Image | PE32 `FF8_EN.exe`, SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966Z` |
| Packet | `inputs/ff8-decomp-semantics-20261011-r01/g34/0x6D9510.json` SHA256 `3c06412608243cd17487d3a2e7ef0fb77aa138e7b43322fb1713cd30b5207974` |
| Compaction | `inputs/ff8-decomp-semantics-20261011-r01/g34/common-compaction.md` SHA256 `f25865201fc77a97e108274fe16be8da7e9055939c3ca5acb337f78101be03d3` |
| Size | 72 bytes (`0x48`), 24 instructions, one CFG block, successors empty |
| Symbol used below | `sub_6D9510` (address only) |

Packet label `Mat3S16_MakeRotY_Q12` and the call-site comment names are historical metadata. They are not used as the C name. See Historical.

## Instruction coverage (24/24)

Bytes checked against `0x6D9510.readable/bytes-001.txt:1-3` and the packet chunk hex. Relative `E8` targets recomputed from those bytes.

| EA | asm-001 | Bytes | Effect |
| --- | --- | --- | --- |
| `0x6D9510` | :1 | `56` | `push esi` |
| `0x6D9511` | :2 | `57` | `push edi` |
| `0x6D9512` | :3 | `0F BF 7C 24 0C` | `movsx edi, word ptr [esp+0Ch]` — low word of entry arg0 |
| `0x6D9517` | :4 | `57` | `push edi` — dword argument to first helper |
| `0x6D9518` | :5 | `E8 13 3C E9 FF` | `call 0x56D130` (next `0x6D951D` + rel32 `0xFFE93C13`) |
| `0x6D951D` | :6 | `57` | `push edi` — same sign-extended angle |
| `0x6D951E` | :7 | `8B F0` | `mov esi, eax` — full 32-bit first return |
| `0x6D9520` | :8 | `E8 DB 3B E9 FF` | `call 0x56D100` (next `0x6D9525` + rel32 `0xFFE93BDB`) |
| `0x6D9525` | :9 | `8B 4C 24 18` | `mov ecx, [esp+18h]` — entry arg1 pointer, captured before the cleanup |
| `0x6D9529` | :10 | `83 C4 08` | `add esp, 8` — pops the two helper arguments |
| `0x6D952C` | :11 | `33 D2` | `xor edx, edx` — word-zero source |
| `0x6D952E` | :12 | `66 89 71 04` | `mov [ecx+4], si` — low 16 of first return, before `neg` |
| `0x6D9532` | :13 | `5F` | `pop edi` |
| `0x6D9533` | :14 | `F7 DE` | `neg esi` — 32-bit two's complement |
| `0x6D9535` | :15 | `66 89 71 0C` | `mov [ecx+0Ch], si` — low 16 after `neg` |
| `0x6D9539` | :16 | `66 89 01` | `mov [ecx], ax` — low 16 of second return |
| `0x6D953C` | :17 | `66 89 51 02` | `mov [ecx+2], dx` |
| `0x6D9540` | :18 | `66 89 51 06` | `mov [ecx+6], dx` |
| `0x6D9544` | :19 | `66 C7 41 08 00 10` | `mov word ptr [ecx+8], 1000h` |
| `0x6D954A` | :20 | `66 89 51 0A` | `mov [ecx+0Ah], dx` |
| `0x6D954E` | :21 | `66 89 51 0E` | `mov [ecx+0Eh], dx` |
| `0x6D9552` | :22 | `66 89 41 10` | `mov [ecx+10h], ax` — low 16 of second return again |
| `0x6D9556` | :23 | `5E` | `pop esi` |
| `0x6D9557` | :24 | `C3` | `retn` — incoming arguments left on the stack |

`xor` and `neg` write flags. No later instruction reads flags. No `Jcc`. This root loads and stores no globals (`common-compaction.md:8`).

## Contract

CERTAIN from this root alone:

- 32-bit caller-cleanup. `retn` does not pop arguments. Two incoming stack slots: word at entry `[esp+4]`, pointer dword at entry `[esp+8]`.
- Only that low word is read (`movsx`). The upper 16 bits of the first stack slot are ignored.
- The sign-extended value is passed, unchanged, as a full dword to `0x56D130` and then to `0x56D100`.
- `ECX` receives the destination pointer. Nine separate word stores cover offsets `+0,+2,+4,+6,+8,+0Ah,+0Ch,+0Eh,+10h` (18 bytes, `0x00` through `0x11`). Offset `+12h` is not written. There is no dword zero-fill.
- Return value is the full 32-bit `EAX` left by `0x56D100`. The destination pointer is not copied into `EAX`. Nothing after `0x6D9520` writes `EAX`.
- `ESI` and `EDI` are saved and restored. On the `retn`, `ECX` still holds the destination pointer and `EDX` is 0. Those two leftovers are caller-saved on this ABI; the C return is only `EAX`.
- `EDI` is restored at `0x6D9532`, between the `+4` store and `neg`. That pop does not change `EAX`, `ECX`, `EDX`, or `ESI`.

## C

`low16` is a notation for the 16-bit store. It is not a call in the image. Unary minus on `int32_t` is not used: x86 `NEG` wraps, including `0x80000000`.

```c
#include <stdint.h>

extern int32_t sub_56D130(int32_t angle_sx); /* 0x6D9518 */
extern int32_t sub_56D100(int32_t angle_sx); /* 0x6D9520 */

static int16_t low16(uint32_t bits)
{
    return (int16_t)(uint16_t)bits;
}

int32_t sub_6D9510(int16_t angle, int16_t *dest)
{
    int32_t angle_sx;
    int32_t sin_full; /* name records call order only; see Helpers */
    int32_t cos_full;
    int32_t neg_sin;

    angle_sx = (int32_t)angle;                 /* 0x6D9512 movsx edi */
    sin_full = sub_56D130(angle_sx);           /* 0x6D9518, then 0x6D951E mov esi, eax */
    cos_full = sub_56D100(angle_sx);           /* 0x6D9520; eax kept */

    dest[2] = low16((uint32_t)sin_full);       /* 0x6D952E [ecx+4], si before neg */
    neg_sin = (int32_t)(0u - (uint32_t)sin_full); /* 0x6D9533 neg esi */
    dest[6] = low16((uint32_t)neg_sin);        /* 0x6D9535 [ecx+0Ch] */
    dest[0] = low16((uint32_t)cos_full);       /* 0x6D9539 [ecx] */
    dest[1] = 0;                               /* 0x6D953C [ecx+2] */
    dest[3] = 0;                               /* 0x6D9540 [ecx+6] */
    dest[4] = (int16_t)0x1000;                 /* 0x6D9544 immediate word */
    dest[5] = 0;                               /* 0x6D954A [ecx+0Ah] */
    dest[7] = 0;                               /* 0x6D954E [ecx+0Eh] */
    dest[8] = low16((uint32_t)cos_full);       /* 0x6D9552 [ecx+10h] */
    return cos_full;
}
```

Memory image of the nine words, row-major only as a layout of those offsets:

| index | offset | bits |
| --- | --- | --- |
| 0 | `+0x00` | low 16 of second helper (`0x56D100`) |
| 1 | `+0x02` | `0` |
| 2 | `+0x04` | low 16 of first helper (`0x56D130`) |
| 3 | `+0x06` | `0` |
| 4 | `+0x08` | `0x1000` |
| 5 | `+0x0A` | `0` |
| 6 | `+0x0C` | low 16 of the 32-bit negation of the first helper |
| 7 | `+0x0E` | `0` |
| 8 | `+0x10` | low 16 of second helper |

## Helpers (older frozen packet, not this export)

`common-compaction.md:14-15` and `:18`. Directly inspected 2026-10-10 neighbour pack, not re-exported live in the 2026-10-11 packet. Older byte SHA256: `0x56D100` `dc51b188b7ba9c66bef7b4635ce6777b461363c771a20c67319d9c0c59c59767`; `0x56D130` `e3fbedf53fc1e960ea14b765ccfe9e6e30d6039b15af152d6dd0d466f943962a`.

Each helper is 11 instructions, no calls, no x87 control-word write shown. Shape: `FILD` signed dword, `FMUL` float `[0xB6B980]`, then `FCOS` (`D9 FF`) at `0x56D100` or `FSIN` (`D9 FE`) at `0x56D130`, `FMUL` float `[0xB69540]`, `FADD` double `[0xB693D8]`, `FSTP` qword local, `MOV EAX` low dword, `ADD EAX, 80000000h`, `RET`. Raw constants there: `[0xB6B980]` `db 0F C9 3A` = IEEE float `0.0015339808305725455`; `[0xB69540]` `00 00 80 45` = float `4096`; `[0xB693D8]` `00 00 00 80 00 00 30 43` = double `4503601774854144` (`2^52+2^31`). Rounding follows the surrounding x87 environment.

That is why the C locals are labeled sin-then-cos in call order. It is not a second proof of an axis name.

## Callers

Packet `xrefs_to`, 13 code sites, type 17, six functions. Matches `common-compaction.md:21`.

| Caller | Sites |
| --- | --- |
| `0x69EF60` | `0x69F80D`, `0x69F967` |
| `0x6CBF90` | `0x6CC36C`, `0x6CC3E6`, `0x6CC9E9` |
| `0x6E8C90` | `0x6E921A`, `0x6E928D`, `0x6E9368`, `0x6E93DD` |
| `0x6E9AB0` | `0x6E9ADC` |
| `0x6EA3E0` | `0x6EA419` |
| `0x6EA920` | `0x6EB1CD`, `0x6EB327` |

Outgoing targets of this root: `0x56D130`, `0x56D100`. No call to `0x56C270` and no call to the other owned EAs.

## Confidence

| Claim | Tag | Why |
| --- | --- | --- |
| Prototype, nine word stores, 32-bit `neg` then low-16 store, return full second-helper `EAX`, caller-cleanup `retn`, no root global | CERTAIN | Bytes and `asm-001.txt:1-24`; `common-compaction.md:8` |
| First call `0x56D130`, second `0x56D100`, same sign-extended dword | CERTAIN | `E8` rel32 above |
| First helper is sine-shaped and second is cosine-shaped, scale 4096, magic-double int conversion | LIKELY | Older pack `common-compaction.md:14-15`, not the current export |
| Nine words are one Q12 3×3 whose middle diagonal is 1.0 in that scale | LIKELY | `0x1000 == 4096` and the older `*4096` factor; this root does not declare a struct |
| Which axis, row versus column vectors, or a business role | UNCERTAIN | `common-compaction.md:24` leaves axis convention and role unresolved |

## Historical, unvalidated

Separated from the C above. Not promoted.

- Packet `name_label_only`: `Mat3S16_MakeRotY_Q12`.
- Assembly comments name the callees `Fixed_Sin4096_Q12` and `Fixed_Cos4096_Q12` and describe `fild`, `pi/2048`, `fsin`/`fcos`, `*4096`, magic-double. The comment text is packet metadata. The numeric targets do not depend on it.
- Historical note header `docs/tech/investigation/battle-static-discovery/decomp/0x6D9510__Mat3S16_MakeRotY_Q12.md:10-11` (`common-compaction.md:31`). Discovery recorded it as historical only.
- QMD exact searches for `0x6D9510` found nothing; `Mat3S16` hits were historical catalogues (`common-compaction.md:24`).

## Uncertainties

- Helper bodies and IEEE constants are from the 2026-10-10 pack. This volet did not re-export them from the 2026-10-11 image.
- x87 rounding and control word are environmental. No `libm` or C cast is substituted for the magic-double sequence.
- Whether a caller relies on x87 stack or flags after the return is not decided here.
- Alias between `dest` and other objects is open. This root does not reread the incoming slots after the sign-extend and the pointer load.
- High half of a helper return can be nonzero. The word stores keep the low 16 bits of the 32-bit values, including after wrapping `neg`.
- Bytes at `dest+0x12` and later are outside this function's writes.

## Provenance

- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x6D9510.json:18` assembly; `:19-24` CFG; xrefs and `code_targets`; `instruction_count` 24. Line map also `common-compaction.md:29`.
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x6D9510.readable/asm-001.txt:1-24`
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x6D9510.readable/bytes-001.txt:1-3`
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x6D9510.readable/manifest.json` packet SHA256 and compaction SHA256
- `inputs/ff8-decomp-semantics-20261011-r01/g34/common-compaction.md:8` root ABI; `:14-15` helpers and constants; `:21` xrefs; `:24` limits; `:29` hashes
