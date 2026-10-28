# 0x50BF90 — independent semantic A

## Scope and confidence

- Owned target: `0x50BF90` only; semantic A, not C or reconciliation.
- Inputs: `inputs/ff8-decomp-semantics-20261011-r01/g27/0x50BF90.json` (N) and `common-compaction.md` (K). No peer output, historical target C, classification or rediscovery used.
- N:13–18 supplies one 256-byte chunk `[0x50BF90,0x50C090)` and its assembly; N:19–130 supplies all 15 CFG blocks; N:140 reports 81 instructions. This analysis covers entry, both nested loops, all conditional flag paths, tail and return. Native labels and comments are not purpose evidence.
- **CERTAIN**: the mechanical pointer latching, table-address arithmetic, record traversal, low-word bit aggregation, byte flag handling and conditional tail writes described below.
- **LIKELY**: this is preparation of shared presentation/battle-sequence state from a descriptor with grouped event records. K:35–36 supplies secondary surrounding context linking the numeric table to presentation actors. Those neighboring claims were not re-exported in this session.
- **UNCERTAIN**: precise business identity of each record byte, mask and global; descriptor's complete type; valid capacities; intended return contract; ownership/reentrancy/alias policy.
- No native conflict identified within this target. Documentary contradictions noted in K:37 concern surrounding dispatch interpretation and writers, not a contradiction resolved here.

## Proposed name and role

**Proposed name:** `BattleSequence_LatchDescriptorAndCollectRecordMasks` (**LIKELY**, not promoted).

The independently supported core is `LatchDescriptorAndCollectRecordMasks`: one instruction cluster captures descriptor-derived pointers and an indexed table address (proofs 1–2), while a separate loop cluster builds two 16-bit masks from record bytes (proofs 3–5). Neither support depends on the old function name. `BattleSequence` is a context-qualified interpretation from K:20,35–36, not something proved by an IDA label or a lone xref. A strict context-neutral alternative is `LatchDescriptorAndCollectRecordMasks`.

Mechanically, the function takes one descriptor address, publishes several values into fixed memory locations, enumerates groups and their pointed-to records, accumulates a low-16-bit mask plus a secondary low-16-bit category mask, captures selected byte flags, and publishes first-group summary bytes. It performs no calls, allocation, I/O or dispatch itself. Calling this GF-only, damage application, target selection, or event execution is unsupported.

## Inputs and traversal layout

One 32-bit stack argument is loaded into ESI at `50BF95`. With S denoting entry ESP, the argument is `[S+4]`. The function later overwrites that argument home slot with its outer counter; it does not thereby change the ESI descriptor address. The captured caller in K:20 pushes one value, calls at `50A799`, then performs `add esp,4`; the target's `retn` at `50C08F` has no immediate pop count. This supports a caller-cleaned single-argument ABI, not an inferred named C structure or meaningful result type.

Relevant descriptor-relative accesses:

| Offset | Width | Mechanically established use |
|---|---|---|
| `+0` | byte | Initial index/identity byte; zero-extended for table arithmetic, saved for the final identity-byte publication |
| `+8` | dword | Initially latched pointed-to data; also first-group record pointer, re-read in the tail |
| `+0xC` | dword | Independently captured and published pointer/value; not dereferenced here |
| `+0x10` | byte | First group's inner count; re-read and published in the tail |
| `+0x11` | byte | Zero-extended, incremented to give initial outer count `1..256` |

The first group count address is `ESI+0x10`; successive group count addresses differ by **0x14 (20)**. For a nonempty group, its record pointer is the dword eight bytes before that group's count byte. Inner records advance by **0x18 (24)**. Do not confuse the group stride with the record stride or assert that the entire descriptor is exactly 20 bytes. A record contributes byte `+0` to one mask, byte `+3` to conditional category handling, and byte `+2` to a combined flag predicate. Other record fields are not decoded here.

No index, record-count, pointer, capacity or slot-range validation occurs. All pointer additions and register arithmetic are x86 32-bit modular operations. These facts do not establish that every possible input is valid.

## Outputs and side effects

Fixed numeric addresses below come from bytes, not label meaning. Stores listed as word or byte affect only that width, even where the native identifier includes `dword`.

| Address | Width | Effect |
|---|---|---|
| `0x1D99A50` | dword | Descriptor address published before subsequent input reads |
| `0x1D99A60` | dword | Captured initial dword `[ESI+8]` |
| `0x1D99A40` | dword | `0x1D972C0 + 0x9C * zero_extend(byte[ESI])` |
| `0x1D99A74` | dword | Captured dword `[ESI+0xC]` |
| `0x1D99A5C` | word | Cleared at entry, then assigned BP's aggregate mask after outer traversal |
| `0x1D99A90` | word | Cleared at entry, then OR-accumulates category bits from qualifying records |
| `0x1D99A6D` | byte | Cleared at entry; OR with `2` when a record's byte `+2` has both bits `0x30` set |
| `0x1D99A84` | byte | Last qualifying record's byte `+3` shifted right by six; **not cleared** if none qualifies |
| `0x1D99A5A` | byte | Always assigned the tail re-read byte `[ESI+0x10]` |
| `0x1D99A48` | byte | Assigned first byte through the tail re-read pointer `[ESI+8]` only if tail count is nonzero; otherwise preserved |
| `0x1D99A56` | byte | Assigned final CL; in ordinary nonaliasing use, original descriptor byte `+0` |

Primary mask behavior is exactly low16 of `1u32 << (record_byte0 & 31)` ORed into BP. Thus indices `16..31` contribute no low-word bit, and bytes `32..255` wrap the shift count modulo 32; no range guard implies a valid business slot. Secondary-mask handling is enabled by `(record_byte3 & 8) != 0`; it extracts `record_byte3 >> 6` (0..3), records that byte, and ORs its one-hot bit into a word. The combined byte-2 predicate is `(record_byte2 & 0x30) == 0x30`, not either bit individually.

Input storage is read, not deliberately rewritten through ESI, but fixed stores can overlap input/storage if caller aliasing is allowed. The stack argument home is deliberately modified, and scratch storage is partly initialized. Preserve native access order: for example `[ESI+8]` is read before `[ESI]` and published only after that byte read; `[ESI+0xC]` is read before the actor-address publication; `[ESI+0x11]` is read before the `0x1D99A74` store. The tail re-reads its count and pointer rather than using cached globals. Consequently an arbitrary aliasing contract cannot equate every tail value to an earlier snapshot.

## Signedness, partial registers and return

- `50BFF0` is signed `jle` after comparing the zero-extended byte-plus-one counter to zero. Given those register definitions its initial `1..256` value cannot take that edge; the edge still belongs to the native CFG. There is no signed-byte sign extension.
- `50C001` is signed `jle` after testing a zero-extended byte count, so in this context it skips exactly zero. `50C051` and `50C063` are `jnz` after decrement, not signed range tests. `50C044` is `jnz` after comparing the masked byte to `0x30`; the flag write is on equality. `50C078` skips the first-byte write only when the tail count is zero.
- Mask assembly uses a **32-bit** shift and then **16-bit** OR operands BP/AX. Category extraction is an **8-bit logical** `shr al,6`. All these widths matter.
- `50BFB9` initializes only byte `[S-4]`; `50C053` reloads **dword** `[S-4]` into ECX after a nonempty group. Its upper three bytes are not initialized by the shown byte store. Only CL feeds the final global-byte store; no full-ECX semantic identity should be invented. Empty groups leave CL alone. Under ordinary nonaliasing inputs, the restoration makes final CL the initial descriptor byte whether groups are empty or nonempty.
- EAX's final AL is the tail count when that count is zero, otherwise the first byte through the tail-reloaded pointer. There is no final MOVZX or explicit result construction. On the ordinary terminating loop path EAX reached zero at the final outer decrement, so upper 24 bits remain zero through these AL-only tail loads; AX then contains the same zero-extended byte. This is a register fact, **not evidence of a boolean/success return contract**. The captured immediate caller overwrites EAX before using it (K:20). No meaningful return type is established; do not infer one from the native name or turn an incidental AL into a status result.
- ESI/EBP are saved/restored; EBX/EDI have paired conditional saves/restores around traversal. Target contains no call or hidden callee effects. Stack cleanup returns to entry ESP before the return instruction, leaving caller argument cleanup to the caller.

## Eight exact evidence groups

All target instruction provenance is N:18, with corresponding raw bytes N:15. Xref provenance is N:131–137. K references are frozen context, not direct inspections of its historical source files.

1. **Descriptor/pointer latching:** `50BF95 mov esi,[esp+10h+arg_0]`; `50BF9B` writes ESI to `0x1D99A50`; `50BFA8` loads `[esi+8]`, `50BFAB` loads `[esi]`, `50BFAD` writes the captured EAX to `0x1D99A60`; `50BFDA/50BFE7` load/publish `[esi+0Ch]`. These independently establish preparation of shared descriptor-derived state.
2. **Indexed table selection:** `50BFB2/50BFB4` isolate the unsigned byte; `50BFCB lea edx,[eax+eax*4]`, `50BFCE shl edx,3`, `50BFD1 sub edx,eax`, `50BFD3 lea eax,1D972C0h[edx*4]`, `50BFDD` publishes it. Algebra is `(5*8-1)*4 = 156 = 0x9C`, not logical-slot stride `0xD0` or a label-derived slot type.
3. **Two-level traversal:** `50BFE2/50BFE4/50BFED` form the unsigned outer count plus one; `50BFF4` positions the first count byte; `50BFFB/50BFFD/50C001` skip zero inner counts; `50C003` loads `[ebx-8]`; `50C04D` adds `0x18`; `50C05B` adds `0x14`. This is evidence for grouped records separate from pointer latching.
4. **Primary mask:** `50C008 mov cl,[edx]`, `50C00A mov eax,1`, `50C00F shl eax,cl`, `50C011 or bp,ax`; `50C066` stores BP as a word to `0x1D99A5C`. Establishes low-word aggregation, not proof that records are actual battle targets.
5. **Category mask and retained category:** `50C014/50C017/50C019` gate on mask `0x08` (bit 3) of byte `+3`; `50C020 shr al,6`; `50C027` writes byte `0x1D99A84`; `50C032/50C034` shift one and OR a word at `0x1D99A90`. Initial zeroing at `50BFBD` applies to the mask, not the retained category byte.
6. **Combined flag:** `50BFC4` clears byte `0x1D99A6D`; `50C03B/50C03E/50C041/50C044` load byte `+2`, mask and compare `0x30`, skip on inequality; `50C046` ORs byte `2` on equality. This proves the exact predicate and width without naming the effect.
7. **Tail snapshots and partial identity:** `50C053` reloads a dword local previously initialized only by `50BFB9`'s byte store; `50C06E/50C073` re-read/publish first count; `50C078` guards `50C07A/50C07D/50C07F`'s pointer re-read and first-byte publication; `50C085` writes CL. Establishes stale-state/conditional-write behavior and the partial-register hazards.
8. **Integration/ABI, not purpose by label:** N:131–137 has sole captured incoming code xref `0x50A799` in `0x50A790`; K:20's captured caller window has one push, caller cleanup and immediate EAX overwrite. `50C08C add esp,8` and `50C08F retn` agree. N:139 has no code targets and the complete target has no call. The xref anchors integration but does not establish an exhaustive graph or a business result.

## Open questions and source limits

1. Need validated readers/writers to identify byte `+0`, record bytes `+0/+2/+3`, and both masks: actor/target IDs and event categories are plausible, not certain.
2. Need exact descriptor/group types, allocated extents and valid counts, including why outer count is byte `+0x11` plus one. The target alone permits 256 groups and never enforces reported seven actors.
3. Need a contractual alias policy and storage ownership before simplifying read order, scratch/argument writes or late re-reads. Global state makes reentrancy unsafe to assume.
4. Need readers of retained globals `0x1D99A84` and `0x1D99A48` to explain intentional persistence when no qualifying record / zero first count occurs.
5. Need validated call-site return use beyond the one captured caller before naming a return result. No new caller freeze was requested or inspected; current caller does not use EAX.
6. K:34's surrounding native-window graph is truncated. K:35–38 explicitly separates documentary field-purpose claims, contradictory route interpretations and historical status from present acceptance. None supplies a target verdict, exact writer provenance, or current validated structure binding.

No §5.6, promotion, IDB change or integration performed. Remaining business uncertainty does not negate the mechanically exact mask/traversal effects.
