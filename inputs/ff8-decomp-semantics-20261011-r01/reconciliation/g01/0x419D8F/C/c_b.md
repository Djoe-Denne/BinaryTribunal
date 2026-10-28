# 0x419D8F — C production B (independent author, run01, g01)

Role: C author B, 2+1. Revision: **rev2** (coverage correction after lead message; C body unchanged from rev1).
No compilation, test, IDA query or byte-match was executed by this author.

## Inputs consumed (cited hashes are those recorded in the manifest, not recomputed here)

| Input | Hash cited |
|---|---|
| `inputs/ff8-decomp-semantics-20261011-r01/g01/0x419D8F.json` (original packet, authority) | `bf1ee669cd27c5fdeba32939d67727ddcef4bbb63153d0703d2e8de20d6d326a` (manifest `original_sha256`) |
| `inputs/.../g01/common-compaction.md` | `b1085a3007d76c5a2d8ca488b7247262aa52f66061b8d1aa1ead0ba16c9e41e3` (manifest `compaction_sha256`) |
| `common-compaction.readable/manifest.json` (source = common-compaction.md, 9495 bytes, 10 contiguous UTF-16 slices, literal `\n` not decoded) | source_sha256 `b1085a3007d76c5a2d8ca488b7247262aa52f66061b8d1aa1ead0ba16c9e41e3` |
| `part-001.txt` [0,1000) | `2b82ac6fdf7e07390403a53263e936fdb08a5152dd53e6a06747ec1743b9b6dd` |
| `part-002.txt` [1000,2000) | `de58f0a66ffe61ccfb8b253389c6ab474ead8de0fd7d7d76591140a3a137caab` |
| `part-003.txt` [2000,3000) | `a72968dfae5a22ecccf82e168242656f0c0c63db03f68ee5576cc4ee30197543` |
| `part-004.txt` [3000,4000) | `0080a93c2365a17c9fa0c051dc93a35018125430ef5012b3b41429f565d7bd83` |
| `part-005.txt` [4000,5000) | `67c0d25619e3f6bdde633ec89d077ee694fc65c034a16c05d45ccb2a10ff503f` |
| `part-006.txt` [5000,6000) | `51bb5fdfb3aaa70b057a174bc9765c98f6842c2606f516758ca968e5e60b5e63` |
| `part-007.txt` [6000,7000) | `b72bf1f7b75f80324c6e550516b7a23a36c14c933668a3cf2f7fd6e372be53f4` |
| `part-008.txt` [7000,8000) | `80a43fa352b2ad29fd4aa73ac00277e498ea88763d14b058603936804a9ced51` |
| `part-009.txt` [8000,9000) | `fc8a6939e589aa2aaeca6f16418d17438805c9029674f6fe6f206b9343d65835` |
| `part-010.txt` [9000,9465) | `c31b45e98422b3987d54ee2254660dd8d9cd0cef4740108c1483f376d94a5a9e` |
| `0x419D8F.readable/asm-001.txt` (lines 1–25) | `198df8e38a741d26db945f1b2695b0dce215268499f3bdcd20b1171dc9693efa` |
| `0x419D8F.readable/asm-002.txt` (lines 1–9) | `6f9c4637ad8d1c7553d9aee7893bd0053241fd536f32721bf31d1d7adbcdbb03` |
| `0x419D8F.readable/bytes-001.txt` (3 lines, 90 bytes) | `13fa7444a2c1982eb8e76309a154671eafe6d4cfc67dc5dd87a1391d55b14070` |
| `0x419D8F.readable/metadata.json` | `0ee190661d5186b8501e9fb7427ef5782b98c74a072bedabde616fed2f5daaf1` |

Common-compaction coverage (correction rev2): rev1 had read only the first 2000 characters of the single-line
`common-compaction.md`. Rev2 read the authorized projection in full: manifest + part-001…part-010 (each one
physical line, all read completely, 9×1000 + 465 = 9465 UTF-16 units per manifest). The manifest/lead state
that concatenation is byte-equal to the source (SHA256 b1085a30…); this author did **not** recompute hashes
or re-concatenate (no shell). No other input opened (no A, semantic, R or historical file).

Cross-check of compaction vs this C (all compaction sections reviewed):
- CURRENT NATIVE FACTS (part-002/003): frame, EBP+8/+0xC/+0x10 args, `[ebp-8]=0`, guards on arg2 then arg3,
  no arg1 guard, DWORD `[desc+0x64]→[tex+0x2C]` before calls, push orders, two `add esp,0Ch`, no test of the
  first result, full EAX return, plain RET, 4 CFG blocks, **no global/static operand and no indirect call** —
  all identical to my independent decoding. **Confirmed, no change to the C.**
- XREF INVENTORY (part-003/004): two code callers 0x407797/0x414AD1, targets 0x419410/0x419CBE — consistent.
- CALLER NEIGHBOURHOOD (part-004/005, historical captures, not current export): both callers push 3 DWORDs in
  order (arg1 pushed last) and consume full EAX (0x4076B6 tests it for zero at 4077A2; both store it at
  `[ptr+0x14]`). Consistent with `int32_t` return and 3-arg cdecl. Historical type string
  `int __cdecl(int*,int,int)` noted only as annotation; not adopted as proof (my `void *` for arg1/arg2 and
  `int32_t` for arg3 are equal-width 32-bit choices; ABI identical).
- FIRST CALLEE 0x419410 (part-005/006, parent-validated historical): EBP+8/+0xC/+0x10 args, full-EAX return,
  plain RET → consistent with my `__cdecl` 3×32-bit extern declaration. Context warning applied: I no longer
  describe the first callee as a "texture lookup/cache search" (see semantic note).
- SECOND CALLEE 0x419CBE (part-007): body not available; comment "cache resolve +0x18 refcount; slot +0x50 …"
  is an annotation only. My declaration of 0x419CBE remains limited to "3×DWORD cdecl, EAX result" (proven
  only from caller side: 3 pushes + `add esp,0Ch` at 419DDC + full-EAX store at 419DDF). Callee-side
  ABI is **unproven** (e.g. it cannot be excluded from this corpus that it ignores args or returns only AL;
  the wrapper reads full EAX regardless, so the C wrapper is bit-faithful either way).
- STRUCTURES/GLOBALS (part-007/008): no struct definitions; only offsets +0x64/+0x2C established — matches my
  raw-offset C. No global in the wrapper — matches.
- KNOWLEDGE/SEARCH PROVENANCE (part-008/009): explorer history included incidental previews of historical
  target C/verdicts. This author's C was produced from ASM/bytes decoding and does not use them.

## Coverage

- Chunk: one chunk `[0x419D8F, 0x419DE9)`, 90 bytes (bytes-001 lines 1–3: 32+32+26 bytes).
- Instructions: 34/34 (asm-001 25 lines + asm-002 9 lines = manifest `assembly_lines: 34`).
- CFG blocks: 4/4 (`0x419D8F–0x419DA2`, `0x419DA2–0x419DA8`, `0x419DA8–0x419DE2`, `0x419DE2–0x419DE9`).

## Byte-level checks performed by hand (decoding, not execution)

| EA | Bytes | Decoding | Consequence |
|---|---|---|---|
| 419D8F | `55 8B EC 83 EC 08` | push ebp / mov ebp,esp / sub esp,8 | 2 DWORD locals, EBP frame |
| 419D95 | `C7 45 F8 00000000` | mov dword [ebp-8],0 | result local = 0 |
| 419D9C | `83 7D 0C 00` | cmp dword [ebp+0Ch],0 | full 32-bit compare of arg2 |
| 419DA0 | `74 40` | jz → 0x419DA2+0x40 = **0x419DE2** | |
| 419DA2 | `83 7D 10 00` | cmp dword [ebp+10h],0 | full 32-bit compare of arg3 |
| 419DA6 | `74 3A` | jz → 0x419DA8+0x3A = **0x419DE2** | |
| 419DA8 | `8B 45 0C` | eax = arg2 (`tex`) | |
| 419DAB | `8B 4D 08` | ecx = arg1 (`desc`) | |
| 419DAE | `8B 51 64` | edx = dword [ecx+0x64] | 32-bit load, disp8 0x64 |
| 419DB1 | `89 50 2C` | dword [eax+0x2C] = edx | 32-bit store, disp8 0x2C |
| 419DB4–419DBF | `8B 45 10 50 8B 4D 0C 51 8B 55 08 52` | push arg3, push arg2, push arg1 | cdecl right-to-left: callee(arg1,arg2,arg3) |
| 419DC0 | `E8 4BF6FFFF` | call 0x419DC5 + 0xFFFFF64B = **0x419410** | matches `code_targets[0]` |
| 419DC5 | `83 C4 0C` | add esp,12 | caller cleanup, 3 DWORD args |
| 419DC8 | `89 45 FC` | dword [ebp-4] = eax | full EAX kept |
| 419DCB–419DD6 | `8B 45 FC 50 8B 4D 0C 51 8B 55 08 52` | push [ebp-4], push arg2, push arg1 | callee(arg1,arg2,r1) |
| 419DD7 | `E8 E2FEFFFF` | call 0x419DDC + 0xFFFFFEE2 = **0x419CBE** | matches `code_targets[1]` |
| 419DDC | `83 C4 0C` | add esp,12 | caller cleanup |
| 419DDF | `89 45 F8` | dword [ebp-8] = eax | |
| 419DE2 | `8B 45 F8` | eax = dword [ebp-8] | full 32-bit return |
| 419DE5 | `8B E5 5D C3` | mov esp,ebp / pop ebp / ret | plain `ret`, **cdecl** (no callee pop) |

No register other than EBP is saved; EAX/ECX/EDX are clobbered (caller-saved under cdecl). No flags,
partial registers (AL/AX), shifts, arithmetic, x87 or SSE are used. No sign/unsigned distinction arises:
the only comparisons are `== 0` (`jz`) on full DWORDs.

## C reconstruction

```c
#include <stdint.h>

/*
 * Callees: only what the ASM proves.
 *  - both are called with 3 DWORD stack arguments and caller cleanup (add esp,0Ch) => __cdecl, 3 x 32-bit
 *  - both return a value in full EAX that is stored as a DWORD.
 * Parameter and return types beyond "32-bit" are NOT proven here; IDA label names
 * (Texture_FindTexture / Texture_UploadRefcountOrReuse) are labels, not evidence.
 */
extern int32_t __cdecl sub_419410(void *desc, void *tex, int32_t upload_key); /* IDA label: Texture_FindTexture */
extern int32_t __cdecl sub_419CBE(void *desc, void *tex, int32_t found);      /* IDA label: Texture_UploadRefcountOrReuse */

/* 0x419D8F, IDA label TextureRelated2 (label only). __cdecl, 3 DWORD args at [ebp+8],[ebp+0Ch],[ebp+10h]. */
int32_t __cdecl sub_419D8F(void *desc /* [ebp+8] */,
                           void *tex  /* [ebp+0Ch] */,
                           int32_t upload_key /* [ebp+10h] */)
{
    int32_t result;   /* [ebp-8] */
    int32_t found;    /* [ebp-4] */

    result = 0;                                           /* 419D95 */

    if (tex != 0 && upload_key != 0) {                    /* 419D9C/419DA0, 419DA2/419DA6: both jz -> 419DE2 */
        /* 419DA8..419DB1: copy DWORD desc+0x64 -> tex+0x2C, before any call.
         * desc itself is NOT null-checked (dereferenced unconditionally on this path). */
        *(uint32_t *)((uint8_t *)tex + 0x2C) =
            *(uint32_t *)((uint8_t *)desc + 0x64);

        found  = sub_419410(desc, tex, upload_key);       /* 419DB4..419DC8 */
        result = sub_419CBE(desc, tex, found);            /* 419DCB..419DDF */
    }

    return result;                                        /* 419DE2: mov eax,[ebp-8] */
}
```

### Fidelity notes / deliberate choices

1. **Evaluation order**: guard on `tex` (arg2) first, then `upload_key` (arg3); short-circuit `&&` matches
   the two consecutive `jz` to the same target. Arg1 (`desc`) is never tested.
2. **Field copy order**: the load `[desc+0x64]` and store `[tex+0x2C]` occur before the first call; kept
   before the call in C. Width DWORD (opcode 8B/89 without 66 prefix). Whether the field is signed, a
   pointer or a handle is unknown → `uint32_t` raw copy (bit-exact either way).
3. **Aliasing**: if `desc+0x64` and `tex+0x2C` overlap (e.g. `tex == desc + 0x38`), the single load-then-store
   still matches C semantics; no reordering concern because there is one load and one store.
4. **Argument re-reads**: the ASM reloads `[ebp+0Ch]`/`[ebp+8]` from the stack slots for each push; since the
   function never writes its own argument slots, passing the C parameters is equivalent.
5. **Local `found` round-trip** (store `[ebp-4]` then reload) is unoptimized-compiler behaviour and is
   semantically a plain temporary.
6. **Pointer vs integer types**: `desc`/`tex` are typed `void *` because they are dereferenced (+0x64 / +0x2C);
   `upload_key` is only compared with 0 and forwarded → typed `int32_t` (could equally be a pointer; not provable
   here). Returns of both callees are typed `int32_t` as raw 32-bit EAX values; 0 is the "skip" return value.
7. No library calls, extra guards or callee semantics were invented. A test against 0 on `found` does **not**
   exist: the result of 0x419410 is forwarded unconditionally to 0x419CBE.

## Compact semantic note (non-authoritative, for the semantic lane/reconciler)

- Contract proven by ASM: returns 0 without side effects when arg2 or arg3 is 0; otherwise copies DWORD
  `arg1+0x64` → `arg2+0x2C`, calls `0x419410(arg1,arg2,arg3)`, then `0x419CBE(arg1,arg2,that_result)` and returns
  its EAX.
- Callers (xrefs, type 17 = near call): `0x407797` in function `0x4076B6`, `0x414AD1` in function `0x414A40`.
- Caller-side consumption (historical captures, compaction part-004/005): result tested for zero in 0x4076B6
  (4077A2/4077A6) and stored at `[ptr+0x14]` in both callers — consistent with "0 = nothing produced".
- Name hint only: labels `TextureRelated2`, `Texture_FindTexture`, `Texture_UploadRefcountOrReuse` and the
  argument labels `desc/tex/upload_key` are IDB labels/comments, **not proofs**. Per the compaction's context
  warning (part-006/007), the validated record of 0x419410 shows format-payload selection (callback walker,
  20-byte scratch) and does **not** prove a loaded-texture-cache search; rev1 phrase "texture lookup" withdrawn.
  The refcount/upload description of 0x419CBE is an unvalidated annotation (no callee ASM in corpus).
  Confidence on any texture/cache/refcount semantics: low pending the semantic lane.

## Uncertainties

- 0x419410: callee-side ABI consistent per parent-validated historical record (3 args at EBP+8/+0xC/+0x10,
  full EAX, plain RET); not a fresh current export. Exact parameter types/return meaning unproven.
- 0x419CBE (and underlying 0x424DF2): no body in corpus; ABI proven only from the caller side of this wrapper.
- Meaning/types/signedness of fields `+0x64` (arg1) and `+0x2C` (arg2), pointee sizes, lifetimes unknown.
- Absence of globals/indirect calls holds for the wrapper only, not for callee effects.
- Whether callees could return values with other meanings — unknown and irrelevant to bit-exactness.
- rev1 compaction truncation resolved in rev2 (full projection read; hashes cited, not recomputed by me).

## Validations NOT executed (requests for lead / separately authorized role)

- Compile with a 32-bit MSVC-compatible compiler (`/Od` likely needed to reproduce the `[ebp-4]` round-trip and
  zero-init of `[ebp-8]`) and byte-diff against the 90-byte chunk.
- Hash of this output file (to be computed by the parent).
