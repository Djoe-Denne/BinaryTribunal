# C A — 0x486E00

- **volet:** C A (2+1 author A)
- **ea:** `0x486E00`
- **span:** `[0x486E00, 0x486E47)` (71 bytes, `instruction_count`: 22)
- **arch:** x86-32
- **pack:** `inputs/ff8-decomp-semantics-20261011-r01/g10/0x486E00.json`
- **native.input_sha256:** `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
- **native.exported_utc:** `2026-10-11T16:38:25.140966+00:00`
- **label (not purpose evidence):** `domain::BattleTarget_GetRandomMonsterMask`

IDA names, comments, and the pack `name_label_only` field are labels only. They are not used as proof of purpose. Opcode, hex, CFG, and xrefs below are the reconstruction source.

## Prototype

```c
unsigned int __cdecl sub_486E00(void);
```

- **args:** none (no pushes, no ECX/EDX in-params on entry, no `retn imm16`).
- **convention:** indistinguishable `__cdecl` / 0-arg `__stdcall`; no callee stack cleanup. Scratch: EAX, ECX, EDX (not preserved).
- **return:** EAX. Early path writes **AX only** (`66 B8 08 00`). Success path writes full EAX.

## Declarations used by the body

Callee ABIs are not in this pack; only the callsites are. Both calls are immediate `E8 rel32` with nothing pushed.

```c
/* callsite 0x486E00; target pack code_targets[0] */
int __cdecl sub_4860D0(void);

/* callsite 0x486E11; target pack code_targets[1] */
int __cdecl sub_48F020(void);

/* disp32 of TEST r/m8 at 0x486E36: F6 82 90 7B D2 01 01 */
extern unsigned char byte_1D27B90[];
```

## C

```c
unsigned int __cdecl sub_486E00(void)
{
  unsigned int v0; /* EAX after 0x486E00 */
  int slot;       /* ECX; low 8 bits used as SHL count */
  int scale;      /* EAX temp for *13 */
  int byte_off;   /* EDX = slot * 208 */

  v0 = (unsigned int)sub_4860D0();          /* 0x486E00 */
  if ( v0 == 0xFFu )                        /* 0x486E05 cmp eax, 0FFh; 0x486E0A jnz */
  {
    /* 0x486E0C mov ax, 8. 16-bit write.
       Incoming EAX is 0x000000FF on this edge, so EAX becomes 0x00000008. */
    return 8;
  }

  for ( ;; )
  {
    slot = sub_48F020() & 0xFF;             /* 0x486E11 call; 0x486E16 and eax, 0FFh; 0x486E1B mov ecx, eax */
    slot &= 0x80000003;                     /* 0x486E1D and ecx, 80000003h  (MSVC signed n%4) */
    if ( slot < 0 )                         /* 0x486E23 jns loc_486E2A */
    {
      slot = ((slot - 1) | 0xFFFFFFFC) + 1; /* 0x486E25 dec; 0x486E26 or ecx, -4; 0x486E29 inc */
    }
    slot += 3;                              /* 0x486E2A add ecx, 3 */

    scale = slot + slot * 2;                /* 0x486E2D lea eax, [ecx+ecx*2]  -> 3*slot */
    byte_off = slot + scale * 4;            /* 0x486E30 lea edx, [ecx+eax*4]  -> 13*slot */
    byte_off <<= 4;                         /* 0x486E33 shl edx, 4           -> 208*slot */

    /* 0x486E36 test byte ptr [edx+0x01D27B90], 1
       0x486E3D jnz loc_486E11 */
    if ( (byte_1D27B90[byte_off] & 1) != 0 )
      continue;

    return 1u << (unsigned char)slot;       /* 0x486E3F mov eax, 1; 0x486E44 shl eax, cl; 0x486E46 retn */
  }
}
```

Equivalent after the `and eax, 0xFF` (value in `0..255`, SF=0 on the `and ecx, 80000003h` result): `slot = (n & 3) + 3`, then `return 1u << slot` if `(byte_1D27B90[208 * slot] & 1) == 0`, else retry from `sub_48F020`. The `slot < 0` block is opcode-real and CFG-covered; it is not taken for any value produced by the preceding 8-bit mask.

## Instruction provenance

Chunk hex (`chunks[0].hex`):

`e8cbf2ffff3dff000000750566b80800c3e80a82000025ff0000008bc881e10300008079054983c9fc4183c1038d04498d1481c1e204f682907bd2010175d2b801000000d3e0c3`

| EA | Bytes | Instruction | C mapping |
|---|---|---|---|
| `0x486E00` | `E8 CB F2 FF FF` | `call sub_4860D0` | `rel32` = `-0xD35`; `0x486E05 + (-0xD35)` = `0x4860D0`. No args. EAX = return. |
| `0x486E05` | `3D FF 00 00 00` | `cmp eax, 0FFh` | 32-bit compare, not `cmp al`. |
| `0x486E0A` | `75 05` | `jnz loc_486E11` | ZF=0 → loop head; ZF=1 → `v0 == 255`. |
| `0x486E0C` | `66 B8 08 00` | `mov ax, 8` | Writes AX only. |
| `0x486E10` | `C3` | `retn` | Early return. |
| `0x486E11` | `E8 0A 82 00 00` | `call sub_48F020` | `rel32` = `+0x820A`; `0x486E16 + 0x820A` = `0x48F020`. Loop re-entry. |
| `0x486E16` | `25 FF 00 00 00` | `and eax, 0FFh` | Clears EAX[31:8]. Result `0..255`. |
| `0x486E1B` | `8B C8` | `mov ecx, eax` | Slot candidate in ECX. |
| `0x486E1D` | `81 E1 03 00 00 80` | `and ecx, 80000003h` | MSVC signed `% 4` remainder mask. |
| `0x486E23` | `79 05` | `jns loc_486E2A` | SF=0 → skip adjust. |
| `0x486E25` | `49` | `dec ecx` | Negative-remainder adjust. |
| `0x486E26` | `83 C9 FC` | `or ecx, 0FFFFFFFCh` | OR `-4`. |
| `0x486E29` | `41` | `inc ecx` | End of signed `% 4` fixup. |
| `0x486E2A` | `83 C1 03` | `add ecx, 3` | ECX ∈ {3,4,5,6} when the 8-bit mask holds. |
| `0x486E2D` | `8D 04 49` | `lea eax, [ecx+ecx*2]` | EAX = 3*ECX. Does not change ECX. |
| `0x486E30` | `8D 14 81` | `lea edx, [ecx+eax*4]` | EDX = ECX+12*ECX = 13*ECX. |
| `0x486E33` | `C1 E2 04` | `shl edx, 4` | EDX = 208*ECX (`0xD0 * slot`). |
| `0x486E36` | `F6 82 90 7B D2 01 01` | `test byte ptr [edx+0x01D27B90], 1` | ZF ← bit0 of that byte. |
| `0x486E3D` | `75 D2` | `jnz loc_486E11` | Bit0 set → retry (disp `-0x2E` → `0x486E11`). |
| `0x486E3F` | `B8 01 00 00 00` | `mov eax, 1` | Full 32-bit write. |
| `0x486E44` | `D3 E0` | `shl eax, cl` | Count = `cl`; x86 masks with 31. `cl` is still the slot (3..6). |
| `0x486E46` | `C3` | `retn` | Success return. |

## CFG coverage (pack `cfg`)

| Block | Pack successors | C |
|---|---|---|
| `0x486e00`–`0x486e0c` | `0x486e0c`, `0x486e11` | `if (v0 == 255)` vs fall to loop |
| `0x486e0c`–`0x486e11` | none | `return 8` |
| `0x486e11`–`0x486e25` | `0x486e25`, `0x486e2a` | signed-mod `jns` |
| `0x486e25`–`0x486e2a` | `0x486e2a` | negative `%4` fixup |
| `0x486e2a`–`0x486e3f` | `0x486e11`, `0x486e3f` | scale + `test` + retry/accept |
| `0x486e3f`–`0x486e47` | none | `return 1u << slot` |

All six pack blocks are represented. No other branches exist in the hex.

## Widths, signedness, shifts

- `cmp eax, 0FFh`: 32-bit. High 24 bits of the first callee return can fail the equality if nonzero.
- `mov ax, 8`: 16-bit. Not `mov eax, 8` / `movzx`.
- `and eax, 0FFh`: zero-extends the low 8 bits into EAX.
- `and ecx, 80000003h` + `jns`/`dec`/`or`/`inc`: signed power-of-two remainder (`n % 4` in MSVC). Operand is already `0..255`, so SF=0 and the fixup is not taken.
- Address scale: `lea`/`shl` are unsigned index arithmetic; product is `slot * 208` as 32-bit.
- `test ..., 1`: 8-bit memory, immediate 1; only bit 0.
- `shl eax, cl`: 32-bit SHL. Count is `cl` (slot 3..6); result bits 3..6 of EAX. Other EAX bits 0.
- Possible success EAX values under the 8-bit-mask path: `8`, `16`, `32`, `64` (`1<<3` .. `1<<6`).
- Early EAX: `8` given first callee EAX `== 0xFF`.

## Effects and returns

- **In:** none from this frame.
- **Calls:** `sub_4860D0` once; `sub_48F020` once per loop iteration, including retries.
- **Load:** one byte at `0x01D27B90 + 208 * slot` per iteration; tested with `& 1`. No store in this function.
- **Out:** EAX as above. ECX = accepted slot (3..6) or last rejected slot if one only looks at a retry edge; EDX = `208 * slot` of the last test. No stack writes.
- **Control:** if `sub_4860D0() != 0xFF` and every sampled `byte_1D27B90[208*((n&3)+3)]` has bit0 set, the loop does not terminate. This function does not re-consult `sub_4860D0` inside the loop.

## ABI / globals / xrefs (pack)

### Callees (`code_targets`)

- `0x4860D0` from `0x486E00`
- `0x48F020` from `0x486E11` (also the retry target)

Callee bodies, argument memory, and side effects are **not** in this pack.

### Data

- Absolute byte `0x01D27B90` plus index `208 * ECX`. The pack listing names this `BATTLE_SLOT_DATA.status_1` (label only). Stride `208` (`0xD0`) is opcode-evident. Base/field split (`array_base + field_off == 0x01D27B90`) is **not** fixed by this function alone.

### Incoming xrefs (`xrefs_to`)

IDA `type` 17 = near call (`fl_CN`), 19 = near jump (`fl_JN`). Not used in the body; listed for ABI context only.

| from | type | in function |
|---|---|---|
| `0x48389F` | 19 jump | `0x483880` |
| `0x4838FB` | 17 call | `0x4838C0` |
| `0x4839D8` | 17 call | `0x483940` |
| `0x483A90` | 17 call | `0x483940` |
| `0x483B5B` | 17 call | `0x483940` |
| `0x483BCF` | 17 call | `0x483940` |
| `0x483D44` | 19 jump | `0x483D20` |
| `0x483E38` | 17 call | `0x483D60` |
| `0x483E96` | 17 call | `0x483D60` |
| `0x483ED8` | 17 call | `0x483EB0` |
| `0x4855F7` | 19 jump | `0x4855F0` |
| `0x4858C2` | 17 call | `0x485610` |
| `0x485C68` | 17 call | `0x485610` |
| `0x48E896` | 17 call | `0x48E830` |

Jump xrefs mean some callers may tail-transfer; they do not change this function's `retn`.

## Limits / uncertainties

1. **Callee contracts unknown.** `sub_4860D0` is only observed as `EAX == 0xFF` vs not. `sub_48F020` is only observed through `EAX & 0xFF`. Side effects (RNG cursor, etc.) are not in this hex.
2. **Dead signed-mod edge.** `0x486E25`–`0x486E29` is reachable only if `ECX` has bit 31 set after `and ecx, 80000003h`. That cannot happen after `and eax, 0FFh`. Still emitted for 1:1 coverage.
3. **`mov ax, 8` high word.** Correct EAX=8 on the `cmp`-true edge because that edge requires EAX=`0xFF`. If the first callee could set ZF with a different EAX, this would not hold; the `cmp eax, 0FFh` forbids that.
4. **Bit0 meaning, array base, slot taxonomy.** Not opcode-proven here. Index values 3..6 and stride 208 are opcode-proven.
5. **Non-termination.** No iteration cap. Liveness of bit0 vs the first callee's `0xFF` condition may differ; this pack does not include `sub_4860D0`.
6. **Return type.** Success path is 32-bit EAX. Callers that read AX vs EAX are not in this pack.
7. **Assembler comments in `assembly` are not validated.** See next section.

## Historical pack comments (unvalidated; not used as C proof)

Separated from the reconstruction. Source: IDA text in pack field `assembly` / `name_label_only`.

- Name `domain::BattleTarget_GetRandomMonsterMask`.
- Callee names `domain::EnemyAI_CountAliveMonsters`, `domain::Battle_GetRandomInt`.
- Comment on `0x486E00`: find-first monster slots 3–6, `status_1&5==0`, else `0xFF`; “EAX leftover index, not a counter”.
- Comment on `0x486E0C`: “empty -> 8 (= 1<<3), not 0” — the `8` is opcode-true; the “empty” story is not.
- Comment on `0x48F020`: battle RNG list + lane cursor; “no CRT RNG”.
- Comment on `0x486E1D`: “MSVC signed %4 … slot=(rng&3)+3 → 3–6” — the pattern and range match the opcodes after the 8-bit mask; the “slot” business meaning is a label.
- Comment on `0x486E36`: `BATTLE_SLOT_DATA.status_1` bit names (Death=1, Poison=2, …).
- Comment on `0x486E3D`: live capture 2026-08-09 / Meteor `0x48E830` / RNG cursor story.

## Source inventory

| Path | Use |
|---|---|
| `inputs/ff8-decomp-semantics-20261011-r01/g10/0x486E00.json` | Frozen pack: hex, assembly, CFG, xrefs, code_targets, native hash |
| `docs/tech/RE_MULTI_PROVIDER_MISSIONS.md` §Livrables | C completeness checklist (blocks, widths, wrap/shift, AX/EAX, args, effects, limits) |

Not read: other volets (`c_b`, semantic, review, R), other EA packs as evidence, live IDA, ledger, QMD/GrepAI, repo C.
