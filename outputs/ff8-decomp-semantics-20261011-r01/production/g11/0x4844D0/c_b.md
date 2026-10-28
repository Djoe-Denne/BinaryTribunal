# 0x4844D0 — C production B (independent author, run01, g11)

Role: C author B, 2+1. Revision: **rev1**.
No compilation, test, IDA query, byte-match or hash recomputation was executed by this author.
No peer C/semantic/R volet was opened.

## Inputs consumed (hashes are those recorded in the projection manifest, not recomputed here)

| Input | Hash cited |
|---|
| `inputs/ff8-decomp-semantics-20261011-r01/g11/0x4844D0.json` (original packet, authority) | `d4e390e27d66fd2a6d03b2ab8b991697661b06c37962631950b8d673a88ebb42` (readable `manifest.json` `original_sha256`) |
| `inputs/ff8-decomp-semantics-20261011-r01/g11/common-compaction.md` (full, 51 lines) | `336f6164d77dddc2cf8c93937f9ee6a6374f22f70b50ee44530aec71e07e85fb` (readable `manifest.json` `compaction_sha256`) |
| `0x4844D0.readable/manifest.json` | (read; cites the file hashes below) |
| `0x4844D0.readable/asm-001.txt` (lines 1–25) | `90a05a163248c0900c0b55857e59a27653ba3385f3747c7ee18c27cadcb70d65` |
| `0x4844D0.readable/asm-002.txt` (lines 1–10) | `1bff05fd36b62ae1f489d12249c3e45f8a62707387c79c3464c2e55cf68291c8` |
| `0x4844D0.readable/bytes-001.txt` (4 lines, 104 bytes) | `0b714e2795b55e45c67028658b06df73e6c321b910bca922c58f95a0aa4ab26b` |
| `0x4844D0.readable/metadata.json` | `f6132dadd5faa61828b799b161232c49aac1540eb55b2a03a741fd2c1eeaf790` |

Also opened (same g11 projection, not used as a second C source): `inputs/ff8-decomp-semantics-20261011-r01/g11/0x484490.json`. Its LEA/shift form is the same 13*16 stride already present in this EA; no 0x484490 body is reconstructed here.

Packet `assembly` in `0x4844D0.json` is one truncated line. Instruction coverage uses the authorized splitlines (`asm-001` + `asm-002`, manifest `assembly_lines: 35`, `projection: complete verbatim assembly splitlines and complete chunk bytes`). Tail `mov dword [ecx+14h],0` / `retn` is in `asm-002` and in `bytes-001` line 4 (`c7411400000000c3`), matching compaction [G11.2].

IDA mnemonics and comments in the assembly dump are **labels/annotations, not conclusions**. Ignored as non-credible for this EA (compaction U2): the `and eax,7Fh` “weapon+70*lines…” note and the `mov al,[ecx+0C1h]` odd/even “att%2” branch (no such branch exists in the bytes).

## Coverage

- Chunk: one chunk `[0x4844D0, 0x484538)`, 104 bytes (`bytes-001`: 32+32+32+8).
- Instructions: 35/35 (`asm-001` 25 lines + `asm-002` 10 lines = manifest `assembly_lines: 35`; packet `instruction_count: 35`).
- CFG blocks: 5/5 from `metadata.json` / packet `cfg`:
  - `[0x4844D0, 0x484523)` → `0x484523`, `0x484529`
  - `[0x484523, 0x484529)` → `0x484529`
  - `[0x484529, 0x484530)` → `0x484530`, `0x484537`
  - `[0x484530, 0x484537)` → `0x484537`
  - `[0x484537, 0x484538)` → (ret, no successors)

## Byte-level checks performed by hand (decoding, not execution)

Bytes concatenated from `bytes-001.txt` (hex, no spaces in source):

`56 e8 4a ab 00 00 83 e0 7f 40 8b d0 8b 44 24 08 8d 0c 40 8d 0c 88 33 c0 c1 e1 04 81 c1 10 7b d2 01 8a 81 c1 00 00 00 c1 e8 02 8d 74 10 dd 8b 51 10 b8 1f 85 eb 51 f7 ea c1 fa 05 8b c2 c1 e8 1f 03 d0 0f af f2 89 71 14 8b 51 10 8b 41 14 3b d0 5e 7d 06 8b 41 10 89 41 14 8b 41 14 85 c0 7d 07 c7 41 14 00 00 00 00 c3`

| EA | Bytes | Decoding | Consequence |
|---|---|---|---|
| 4844D0 | `56` | push esi | ESI callee-saved; after this, original arg0 is `[esp+8]` |
| 4844D1 | `E8 4A AB 00 00` | call rel32; next=4844D6; +0xAB4A = **0x48F020** | matches `code_targets[0]`; no args pushed; EAX consumed next |
| 4844D6 | `83 E0 7F` | and eax, 0x7F | low 7 bits only; result 0..127 if other bits discarded |
| 4844D9 | `40` | inc eax | then 1..128 (0x7F+1=0x80); no later use of INC flags |
| 4844DA | `8B D0` | mov edx, eax | EDX = masked+inc RNG |
| 4844DC | `8B 44 24 08` | mov eax, [esp+8] | 32-bit stack arg0 (entry `[esp+4]`); IDA name `p_attacker_slot_id` is a label |
| 4844E0 | `8D 0C 40` | lea ecx, [eax+eax*2] | ecx = 3×eax (mod 2^32) |
| 4844E3 | `8D 0C 88` | lea ecx, [eax+ecx*4] | ecx = eax+12×eax = 13×eax |
| 4844E6 | `33 C0` | xor eax, eax | EAX=0 before byte load (zero-extends AL) |
| 4844E8 | `C1 E1 04` | shl ecx, 4 | ecx = 13×slot×16 = **208×slot** (stride 0xD0, wrap mod 2^32) |
| 4844EB | `81 C1 10 7B D2 01` | add ecx, 0x01D27B10 | packet mnemonic `BATTLE_SLOT_DATA`; ECX = base + slot×0xD0 |
| 4844F1 | `8A 81 C1 00 00 00` | mov al, [ecx+0xC1] | 8-bit load, disp32; EAX = 0..255 |
| 4844F7 | `C1 E8 02` | shr eax, 2 | **logical** shift; EAX = byte/4 ∈ 0..63 |
| 4844FA | `8D 74 10 DD` | lea esi, [eax+edx-0x23] | ESI = (byte>>2) + (rng&0x7F)+1 − 35; 32-bit wrap |
| 4844FE | `8B 51 10` | mov edx, [ecx+0x10] | 32-bit load; dividend for the following IMUL |
| 484501 | `B8 1F 85 EB 51` | mov eax, 0x51EB851F | signed-`/100` magic |
| 484506 | `F7 EA` | imul edx | signed 64-bit EDX:EAX = magic × `[base+0x10]` |
| 484508 | `C1 FA 05` | sar edx, 5 | **arithmetic** shift of the high dword |
| 48450B | `8B C2` | mov eax, edx | |
| 48450D | `C1 E8 1F` | shr eax, 0x1F | sign bit of the SAR result |
| 484510 | `03 D0` | add edx, eax | EDX = signed towards-zero `[base+0x10] / 100` (MSVC idiv-100 lowering) |
| 484512 | `0F AF F2` | imul esi, edx | signed; **low 32 bits** of ESI×EDX → ESI |
| 484515 | `89 71 14` | mov [ecx+0x14], esi | store 32-bit product |
| 484518 | `8B 51 10` | mov edx, [ecx+0x10] | reload max |
| 48451B | `8B 41 14` | mov eax, [ecx+0x14] | reload cur |
| 48451E | `3B D0` | cmp edx, eax | signed compare max vs cur |
| 484520 | `5E` | pop esi | restore caller ESI; **does not change flags** |
| 484521 | `7D 06` | jge +6 → **0x484529** | taken iff max ≥ cur (SF=OF); fallthrough 0x484523 |
| 484523 | `8B 41 10` | mov eax, [ecx+0x10] | high-clamp |
| 484526 | `89 41 14` | mov [ecx+0x14], eax | cur := max |
| 484529 | `8B 41 14` | mov eax, [ecx+0x14] | EAX := stored cur after high clamp |
| 48452C | `85 C0` | test eax, eax | signed sign/zero of EAX |
| 48452E | `7D 07` | jge +7 → **0x484537** | taken iff EAX ≥ 0; fallthrough 0x484530 |
| 484530 | `C7 41 14 00 00 00 00` | mov dword [ecx+0x14], 0 | memory zero clamp; **EAX not written** |
| 484537 | `C3` | retn | cdecl (no imm16); return is full EAX from 484529 |

Call rel32 check: `0x4844D6 + 0x0000AB4A = 0x48F020`.
High-clamp disp: `0x484523 + 0x06 = 0x484529`.
Zero-clamp disp: `0x484530 + 0x07 = 0x484537`.

No EBP frame, no stack locals, no x87/SSE, no 66-prefix 16-bit ops. AL is used only as the 8-bit load into a zeroed EAX. AX is never an isolated 16-bit quantity. Return is full EAX. ESI is the only preserved GPR. EAX/ECX/EDX are clobbered (incoming ECX is not an argument).

## C reconstruction

```c
#include <stdint.h>

/*
 * Callee: only what this body proves.
 *  - no stack args, EAX consumed via `and eax,7Fh` then `inc` → treat as __cdecl / 0-arg
 *  - width beyond “low 7 bits of EAX” is not proven here
 * IDA/doc name Battle_GetRandomInt / domain__Battle_GetRandomInt is a label, not evidence.
 */
extern int32_t __cdecl sub_48F020(void);

/* Immediate from `add ecx, 0x01D27B10`. Packet mnemonic: BATTLE_SLOT_DATA. */
enum { kBattleSlotData = 0x01D27B10 };

/*
 * 0x4844D0. IDA label domain::Battle_InitATB_RandomFromSpeed (label only).
 * __cdecl, 1 DWORD at entry [esp+4] (read as [esp+8] after push esi).
 * Returns full EAX = dword [slot+0x14] after the signed high clamp, *before*
 * the in-memory zero clamp (so the return may be negative while memory is 0).
 */
int32_t __cdecl sub_4844D0(int32_t slot_id /* entry [esp+4]; IDA: p_attacker_slot_id */)
{
    uint8_t *base;   /* ecx */
    int32_t rnd;     /* eax then edx: (sub_48F020() & 0x7F) + 1 */
    int32_t factor;  /* esi */
    int32_t max_atb; /* edx / [base+0x10] */
    int32_t cur_atb; /* eax / [base+0x14] */
    int32_t quot;    /* edx after magic /100 */
    int64_t prod;
    uint32_t idx;

    rnd = sub_48F020();                 /* 4844D1 */
    rnd = (rnd & 0x7F) + 1;             /* 4844D6, 4844D9; 4844DA mov edx,eax */

    idx = (uint32_t)slot_id;            /* 4844DC */
    idx = idx * 3u;                     /* 4844E0 lea ecx,[eax+eax*2] */
    idx = (uint32_t)slot_id + idx * 4u; /* 4844E3 lea ecx,[eax+ecx*4] → 13*slot */
    idx = idx << 4;                     /* 4844E8 shl ecx,4 → 208*slot */
    base = (uint8_t *)(kBattleSlotData + idx); /* 4844EB */

    /* 4844E6 xor eax,eax; 4844F1 mov al,[ecx+0xC1]; 4844F7 shr eax,2 (logical);
     * 4844FA lea esi,[eax+edx-23h] */
    factor = (int32_t)((uint32_t)base[0xC1] >> 2) + rnd - 35;

    max_atb = *(int32_t *)(base + 0x10); /* 4844FE */

    /* 484501..484510: signed towards-zero divide by 100 (magic 0x51EB851F).
     * Equivalent on MSVC to `(int32_t)max_atb / 100` for all int32 dividends. */
    prod = (int64_t)max_atb * (int32_t)0x51EB851F; /* 484506 imul edx */
    quot = (int32_t)(prod >> 32);                  /* high dword → edx */
    quot >>= 5;                                    /* 484508 sar edx,5 (arithmetic) */
    quot += (int32_t)((uint32_t)quot >> 31);       /* 48450B..484510 */

    factor = (int32_t)((int64_t)factor * (int64_t)quot); /* 484512 imul esi,edx; low 32 */

    *(int32_t *)(base + 0x14) = factor; /* 484515 */

    max_atb = *(int32_t *)(base + 0x10); /* 484518 */
    cur_atb = *(int32_t *)(base + 0x14); /* 48451B */
    /* 484520 pop esi — restore caller ESI; flags from 48451E cmp remain */
    if (max_atb < cur_atb) {            /* 48451E cmp edx,eax; 484521 jge (signed) */
        cur_atb = *(int32_t *)(base + 0x10);      /* 484523 */
        *(int32_t *)(base + 0x14) = cur_atb;      /* 484526 */
    }

    cur_atb = *(int32_t *)(base + 0x14); /* 484529 */
    if (cur_atb < 0) {                   /* 48452C test eax,eax; 48452E jge (signed) */
        *(int32_t *)(base + 0x14) = 0;   /* 484530; EAX left as cur_atb */
    }
    return cur_atb;                      /* 484537 retn */
}
```

### Fidelity notes / deliberate choices

1. **Calling convention**: plain `retn` (`C3`) ⇒ caller cleanup ⇒ `__cdecl`. One DWORD stack argument. Incoming ECX is never read ⇒ not thiscall.
2. **Argument order / timing**: RNG is called **before** the stack argument is loaded (`[esp+8]` after `push esi`). C keeps that order. The argument slot is never written by this function, so a C parameter is equivalent to the stack reload.
3. **Stride**: two LEAs + `shl 4` are `slot * 208` with 32-bit wrap (`uint32_t` index), **not** 0x1B0. Compaction U1: the 0x1B0 phrase lives on the sibling packet’s annotation, not in these opcodes.
4. **Byte `base[0xC1]`**: `xor eax,eax` then `mov al` then **logical** `shr eax,2` ⇒ zero-extended unsigned byte / 4. Not an arithmetic shift, not a signed 8-bit `/4`.
5. **Factor**: `lea esi,[eax+edx-35]` is 32-bit two’s-complement add; a small byte/4 plus `rnd` in 1..128 minus 35 can be **negative** (minimum 0+1-35 = -34 if byte>>2 is 0 and rnd is 1).
6. **`[base+0x10]` / `[base+0x14]`**: both are 32-bit. IMUL/`sar`/`jge`/`test`+`jge` are **signed**. Typed `int32_t`. Whether the game only stores non-negative values there is a semantic question, not an opcode fact.
7. **Divide-by-100**: reconstructed as the six-instruction magic, not as a hardware `idiv`. `int64_t` holds `imul`’s 64-bit product so the high dword matches EDX. `quot >>= 5` must be arithmetic (MSVC `int32_t` right shift). Signed overflow of the later `imul esi,edx` is defined in C via the `int64_t` multiply then truncate to 32 bits (matches `0F AF` low-dword result).
8. **High clamp** is signed `max < cur` (`jge` on `cmp edx,eax` with edx=`[base+0x10]`, eax=`[base+0x14]`). Reloads `[base+0x10]` for the store rather than reusing the previous `edx` copy; C does the same reload.
9. **Zero clamp vs return**: `mov eax,[ecx+14h]` then `test`/`jge` then optional `mov dword [ecx+14h],0` with **no** `xor eax,eax`. If cur < 0, memory becomes 0 and EAX (the C return) stays negative. The packet comment at 484529 states this; it matches the bytes. Do not write `return 0` on that path.
10. **Callee 0x48F020**: no packet in this run (compaction [G11.3]). Declared 0-arg `__cdecl` returning `int32_t` because this site pushes nothing and uses EAX with `and 7Fh`. Whether the callee returns AL-only or a wider value is unproven here; only bits 0–6 survive the mask.
11. **No extra guards**: no NULL check on `base`, no slot-id range check, no test of the RNG return before the mask.
12. **Annotation contamination** (U2) is not represented in the C: there is no odd/even branch and no weapon-table lookup.

## Compact semantic note (non-authoritative, for the semantic lane/reconciler)

- Proven by this body: take a 32-bit slot index, form `0x01D27B10 + index*208`, draw `sub_48F020()`, set `[slot+0x14] = signed_div100([slot+0x10]) * ((uint8_t)[slot+0xC1]>>2 + (eax&0x7F)+1 - 35)`, clamp stored `[slot+0x14]` into the signed range `[0, [slot+0x10]]`, return the post-high-clamp value (possibly negative).
- Near-call xrefs (type 17): `0x48B740` in `0x48B5F0`, `0x48BF35` in `0x48BBD0` (packet `xrefs_to`). Callers have **no** native packets in this run; Initiative/preemptive/back selection is compaction-doc only (U3).
- Name hint only: `Battle_InitATB_RandomFromSpeed`, `p_attacker_slot_id`, `BATTLE_SLOT_DATA`, “spd” at +0xC1, “max_atb” at +0x10, “cur_atb” at +0x14. Offsets/base/stride agree with compaction [G11.4] docs, but those names are not opcode proofs.
- Sibling rewrite `initialize_atb_random` (compaction [G11.5]) is **not** ground truth; noted divergence is void vs EAX-pre-zero-clamp, not adopted here.

## Uncertainties

- 0x48F020 callee-side ABI, return width, and RNG table/lane behaviour: docs in compaction [G11.4], not a current native packet (U5/U6 context). This C only encodes the call site.
- Signedness of `[slot+0x10]` as a *domain* quantity (ATB max) vs the signed operations actually used. Opcodes are signed; domain non-negativity is unproven here.
- Identity of `[slot+0xC1]` beyond “one byte, `>>2`”. “spd” is a doc/label (U4: which writer fills it before this call is not in these packets).
- `slot_id` range (0..10 vs any int32). Out-of-range just wraps the address math.
- Whether callers consume EAX (they may ignore the negative-return quirk). No caller bytes in this corpus.
- `quot >>= 5` in C is arithmetic only on implementations where signed `>>` is SAR (MSVC/GCC on x86). The opcode is SAR.

## Validations NOT executed (requests for lead / separately authorized role)

- Compile as 32-bit MSVC (`/Od` to keep the `[base+0x10]` / `[base+0x14]` reloads and the ESI save) and byte-diff against the 104-byte chunk.
- Hash of this output file (parent).
- Native packet / IDA of 0x48F020 and of callers 0x48B5F0 / 0x48BBD0.
