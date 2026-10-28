# 0x5083C0 — independent semantic B

## Scope, sources, confidence

Authorized inputs only:

- `inputs/ff8-decomp-semantics-20261011-r01/g20/common-compaction.md` (F), factual compaction for g20 / `0x5083C0` only
- `inputs/ff8-decomp-semantics-20261011-r01/g20/0x5083C0.json` (N), frozen native packet

No peer volet, target C, classifier receipt, index, IDA live session, or new surrounding search. Label `sub_5083C0` and the listing name `arg_0` are labels, not purpose. IDA mnemonic comments in N:18 are not evidence.

F cites the frozen export at lines 1-18 and 20-74. This inputs packet has the assembly string at N:18, the code xrefs at N:57-70, and ends at N:73 (`instruction_count` at N:72). Those cited fields match. Chunk N:13-16 is `[0x5083C0,0x5083E8)`, 40 bytes, 19 instructions, 5 CFG blocks. PE `input_sha256` `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, 32-bit, exported `2026-10-11T16:38:25.140966+00:00` (N:7-9; F:5). F:5 records file SHA256 `75c518fbc4f5feb9551513bfe2cdfe267b7f040320872936cd495ffbd04ff4ad` for the `.tmp` export; that digest was not recomputed here.

| Claim | Confidence |
| --- | --- |
| Machine role below: signed bounded strided walk that returns the first visited address whose byte has bit 0 clear, else 0 | HIGH. Complete frozen bytes, no calls, no indirect control |
| Direct callers treat a nonzero return as a writable entry and set that same bit 0 | MEDIUM. Caller instruction bytes are historical snapshots (F:11, F:14-15), not a current re-export; call sites themselves are in the frozen xref list |
| GF / task / callback / allocator-ownership name | Not adopted. Historical prose only (F:22-23, F:26) |

## Role

`0x5083C0` is a leaf scanner. It takes one pointer argument and walks a strided sequence of addresses. The walk starts at the DWORD at argument `+0x8`. Each visited byte is tested with mask `1`. The first address whose bit 0 is clear is returned in `EAX`. If the signed trip limit at argument `+0xE` is less than or equal to zero, or if every visited byte has bit 0 set, `EAX` is 0.

The stride is the sign-extended WORD at argument `+0xC`, reread in the loop body only after a set bit, not in the preheader. The function does not write memory, does not call anything, and does not check the pointer or the limit.

A domain name (task slot, GF callback node, scheduler object) is not established by the target bytes. What the frozen body establishes is the scan. Historical callers are consistent with "hand back an entry whose low bit is clear, after which the caller sets that bit," and they are recorded separately below.

## Proposed name

`FindFirstStridedEntryWithBit0Clear`

The name is the scan, not a recovered struct and not a GF/task API. `sub_5083C0` stays a label.

## Interface

32-bit. No frame pointer. At entry the only stack read is `mov edx, [esp+4]` (`8B 54 24 04` at `0x5083C0`, N:15, N:18). Both pushes happen after that load. The return is `C3` at `0x5083E7`, not `ret imm`, so this function does not pop the argument.

Callee-saved on every path: `ESI`, `EDI` (`push` at `0x5083C4` and `0x5083CE`, `pop` at `0x5083E6` and `0x5083E5`). `EBX` and `EBP` are untouched (F:8). `ECX`, `EDX`, and flags are volatile. `EDX` still holds the argument pointer on return. `EAX` is the result.

`ECX` is the loop counter. It is left as residue, not a second result: 0 if the limit path never enters the loop; otherwise the number of entries whose bit 0 was set before return. Nothing in the frozen body, and nothing quoted from the two direct callers, reads `ECX` after the call.

### Inputs read from the argument pointer

| Offset | Width | When | Use |
| --- | --- | --- | --- |
| `+0x8` | DWORD | After the count load, before the limit test | Start address of the walk, placed in `EAX` |
| `+0xC` | signed WORD | Only inside the loop body, each time bit 0 was set | Stride added to `EAX` |
| `+0xE` | signed WORD | Before any byte at the walked address is read | Trip limit in `ESI` |

No other argument offset is read. There is no constant element size in the instruction stream (F:8).

### Outputs

`EAX` after `pop edi` / `pop esi` / `retn`:

- `0` if the sign-extended limit is `<= 0` (`jle` at `0x5083D1` to `0x5083E3`, then `xor eax, eax`). The DWORD at `+0x8` was loaded but not dereferenced.
- The current walk address if `test byte ptr [eax], 1` is zero (`jz` at `0x5083D6` to `0x5083E5`). `EAX` is not cleared on this path.
- `0` if the signed loop completes `limit` set-bit visits (`jl` at `0x5083E1` falls through to `xor eax, eax`). The address just past the last added stride is discarded.

### Effects

Reads: the argument DWORD, the two signed words, and up to `limit` bytes at the walked addresses when the limit is positive. No writes. No calls (`code_targets` empty, N:71). No null test, no limit clamp, no alignment check. Pointer `add` is a plain 32-bit `ADD` (`0x5083DC`); wrap is not checked. A negative stride walks downward. A zero stride retries the same address until the counter expires, then returns 0, if bit 0 stays set.

## Control flow

CFG ends in N are exclusive (N:20-55). Successors are not annotated taken versus fall-through; the opcodes fix that.

| Block | Addresses | Instructions | Leave |
| --- | --- | --- | --- |
| Preheader | `[0x5083C0,0x5083D3)` | 8 | `jle` taken → `0x5083E3`; else → `0x5083D3` |
| Test | `[0x5083D3,0x5083D8)` | 2 | `jz` taken → `0x5083E5`; else → `0x5083D8` |
| Step | `[0x5083D8,0x5083E3)` | 5 | `jl` taken → `0x5083D3`; else → `0x5083E3` |
| Clear | `[0x5083E3,0x5083E5)` | 1 | fall through → `0x5083E5` |
| Epilogue | `[0x5083E5,0x5083E8)` | 3 | `retn` |

8+2+5+1+3 = 19 (N:72).

The clear-bit return does not pass through `xor eax, eax`. Both the non-positive limit and the exhausted loop do.

Signedness matches the data width on every path that can iterate. `ESI` is `movsx` from an int16, so a positive limit is in `1..32767`. `ECX` starts at 0 and increments once per set bit. `jl` is signed, and that counter never leaves the positive int16 range before the compare fails. A negative int16 limit takes `jle` and returns 0 without a byte load. `test` / `jz` on mask `1` is a bit test, not a signed compare.

## Proofs

1. **Single inbound pointer, loaded before the saves.** `0x5083C0`: `8B 54 24 04`, `mov edx, [esp+4]` (N:15, N:18; F:8). No later instruction reads another stack argument. `0x5083E7` is `C3` (N:18; F:8), so the callee does not remove that argument. Historical direct callers each push one dword and clean 4 bytes (`ADD ESP,4` at `0x508370`; cleanup at `0x5083FB`; F:14-15). That cleanup is snapshot evidence, not frozen caller bytes.

2. **Non-positive signed limit returns 0 without touching the walked byte.** `0x5083C7`: `0F BF 72 0E`, `movsx esi, word ptr [edx+0Eh]`. `0x5083CF`: `85 F6`, `test esi, esi`. `0x5083D1`: `7E 10`, `jle` to `0x5083E3` (next IP `0x5083D3` + `0x10`). `0x5083E3`: `33 C0`, `xor eax, eax` (N:15, N:18, N:21-26, N:44-50). The base load `8B 42 08` at `0x5083CB` is before this branch and is not dereferenced on it.

3. **Bit 0 clear returns the current address.** `0x5083CB` puts `[edx+8]` in `EAX`. `0x5083D3`: `F6 00 01`, `test byte ptr [eax], 1`. `0x5083D6`: `74 0D`, `jz` to `0x5083E5` (next IP `0x5083D8` + `0x0D`). The epilogue does not modify `EAX` (N:18, N:27-34, N:51-55). The base itself is visited first; the stride add has not run yet.

4. **Stride is a loop-body signed WORD, applied only after a set bit.** `0x5083D8`: `0F BF 7A 0C`, `movsx edi, word ptr [edx+0Ch]`, only on the fall-through edge of the bit test (F:8; block `[0x5083D8,0x5083E3)`, N:36-43). `0x5083DC`: `03 C7`, `add eax, edi`. `0x5083DE`: `41`, `inc ecx`. `0x5083DF`: `3B CE`, `cmp ecx, esi`. `0x5083E1`: `7C F0`, `jl` to `0x5083D3` (next IP `0x5083E3` + `(-0x10)`). `EDX` is not written, so each reread is the same descriptor word unless an alias this function does not create changes it.

5. **Exhaustion clears the advanced pointer.** When `jl` is not taken, control falls into `xor eax, eax` and then the same epilogue as the early return (step block N:36-43, clear block N:44-50). A finished walk therefore returns 0, not the past-the-last address sitting in `EAX` before the clear.

6. **Two frozen incoming code calls, no outgoing calls.** N:57-70: code xref type 17 from `0x508367` in `0x508360`, and from `0x5083F6` in `0x5083F0`. N:71: `code_targets` empty. F:14-15 quotes historical calls at those same addresses, each followed by a zero test of `EAX`.

7. **Callers set the bit this function treats as "skip".** Historical `0x508360` moves the return into `ESI`, and on the nonzero arm executes `OR BYTE [ESI], 1` at `0x50837B`, then writes WORD `[ESI+2]=0`, DWORD `[ESI+4]=0`, and DWORD `[ESI+8]` from its second argument (F:14). Historical `0x5083F0` on the nonzero arm executes `OR BYTE [EAX], 1` at `0x508408`, then WORD `[EAX+2]=0`, DWORD `[EAX+4]=` previous DWORD `[descriptor]`, DWORD `[EAX+8]=` its second argument, and DWORD `[descriptor]=EAX` (F:15). The byte `89 46 08` at `0x50837E` is the `[node+8]` store in that first caller, also recorded at `docs/tech/systems/render_pipeline_scheduling_submit.md:127-129` (F:21). These writes are caller effects. They are not performed by `0x5083C0`.

8. **Root bytes were cross-checked.** F:11: the prior numeric listing `tools/_tmp_semantic_triple/0x5083c0/native-2026-10-10/N5083C0_pack/neutral/asm.txt:1-26` concatenates to the same 40 bytes as N:15. Neighbour bytes outside the root chunk were not revalidated (F:11, F:26).

## What the callers add, and what they do not

The two direct callers, on the historical listing, agree on a narrow contract: one descriptor pointer in, `EAX` zero means do not initialize, nonzero `EAX` is an address whose first byte receives `OR ..., 1` and whose `+2` WORD is cleared. They do not agree on a single list algorithm. `0x508360` also reads DWORD `[descriptor+4]` and writes either that old link or DWORD `[descriptor]` plus DWORD `[descriptor+4]` (F:14). `0x5083F0` stores the old DWORD `[descriptor+0]` into the entry's `+4` and then stores the entry at DWORD `[descriptor+0]` (F:15). Descriptor `+8` in the target is the walk base. Entry `+8` in the callers is a stored argument. Those are different objects (F:15).

`0x508360`'s zero arm calls `0x403D99` with immediate `0xB8B96C` and still moves `ESI` back to `EAX` (F:14). That callee is opaque here. The historical OutputDebugString label is not used.

Sites that pass numeric descriptors into `0x508360` or `0x5083F0` (`0x1D96D78`, `0x1D971E0`, `0x1D97768`, `0x1D986A8`, `0x1D986B8`, `0x1D98B18`, `0x1D98B40`, and the immediates beside them) are a truncated depth-2 window (F:18). `0x1D986A8` appears once on each direct caller. None of those immediates are operands of `0x5083C0`. Fan-in 1943 is stated for `0x508360`, with eight sites kept, `runtime_proof=false` (F:18). It is not a caller count for `0x5083C0`.

## Historical prose not used as the verdict

- `docs/tech/gforce/gf_shared_infra.md:39-45` names `0x508360` as task creation and `0x508300` as `BS_Memset`. F:22 marks this as prose. Descriptor initialization and concrete `+0xC` / `+0xE` values are unverified.
- QMD hit `gforce-cinematic-architecture.md:69-71` calls `0x508360` GF callback infrastructure. F:23: knowledge text, not target proof.
- `render_pipeline_scheduling_submit.md:133-142` links `0x500C00` / `0x500CC0` to scheduling. The numeric immediate `0x500CC0` at the `0x500CA3` call of `0x508360` does not name `0x5083C0` (F:21).
- `FF 56 08` at `0x508434` (`call [esi+8]`) and `A8 02` at `0x50843A` (`test al, 2`) are outside this function. The pump body was not part of the frozen target packet (F:21). Bit 1 is not the bit this function tests.
- `CAMPAIGN_DRAIN_FINAL_2026-10-10.md:44` and `:77` are prior campaign status (blocked C reconciliation; 19 instructions / 40 bytes). F:26: not a run01 verdict. That C text was not read for this note.
- `neutral/frame_abi.txt:73-82` model assumptions are excluded (F:11). The ABI above is only the frozen entry/return plus the quoted caller cleanups.

## Open questions

- Bit 0 is an occupancy flag only if the caller `OR` is the inverse of this test. The polarity match is real in the historical listing and is not re-fetched from the current image.
- Who writes argument `+0x8`, `+0xC`, and `+0xE`, and the flag bytes, is not in this function.
- Stride is data. Nothing here shows it equals a struct size, or that entries are non-overlapping.
- Positive limit and a null or unmapped base follow the bytes into `test byte ptr [eax], 1` with no guard.
- Alias between the descriptor words and a visited byte is not ruled out by a write this function does not have; it is also not shown.
- The frozen xref list has two callers. This note did not repeat a whole-image xref query.
- `0x5083F0`'s zero path is only bounded as "skip the nonzero arm" through `JZ 0x508400` (F:15). The bytes at `0x508400` are not specified, so that function's zero-path return is not claimed.
- No concurrency, ownership, or callback type follows from the leaf (F:8).

## Source inventory

| Item | Path | Use |
| --- | --- | --- |
| Frozen packet | `inputs/ff8-decomp-semantics-20261011-r01/g20/0x5083C0.json:1-73` | Bytes, listing, CFG, xrefs, counts |
| Compaction | `inputs/ff8-decomp-semantics-20261011-r01/g20/common-compaction.md:1-26` | Provenance, caller snapshots, evidence tiers |
| Root cross-check | F:11 → `tools/_tmp_semantic_triple/0x5083c0/native-2026-10-10/N5083C0_pack/neutral/asm.txt:1-26` | Same 40 root bytes; file not reopened |
| Caller snapshots | F:14-15 → `asm.txt:28-67` and `:69-86` | Historical numeric callers |
| Truncated outer window | F:18 → `graph.json:35-44`, `asm.txt:88-189` | Not exhaustive, not target operands |
| Docs | F:21-23, F:26 | Tiered; prose not promoted |
