# 0x4868C0 — independent semantic B

## Boundary and coverage

Role: semantic B only, run01/g07, task `task_mv44rnxh_008c_4868qs`. Read the common factual compaction, original native packet, readable manifest, all four ASM slices (90 instructions), the complete byte slice, and metadata. Subsequently read the entire separately authorized dispatch-table JSON supplement and independently decoded its raw hex below. No other author's output, classifier, target C, review, or new discovery was consulted. No execution/compile/test/differential validation was performed.

Authoritative source: `inputs/ff8-decomp-semantics-20261011-r01/g07/0x4868C0.json` (below **N**), chunk `[0x4868C0,0x4869F4)`, 32-bit FF8_EN.exe SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export 2026-10-11T16:38:25.140966+00:00. Manifest records original packet SHA256 `bb4e83a4a9db291ee331f1ee5a7cc16c766b37c54fd76ea9a4c44bfdf0721f28` and common-compaction SHA256 `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`; these are supplied provenance, not independently recomputed hashes.

**A1–A4** denote `inputs/ff8-decomp-semantics-20261011-r01/g07/0x4868C0.readable/asm-001.txt` through `asm-004.txt`; **B** denotes `bytes-001.txt` in that directory; **M** its `metadata.json`; **K** denotes `inputs/ff8-decomp-semantics-20261011-r01/g07/common-compaction.md`. N:15 contains the complete authoritative bytes; N:18 the assembly string. Embedded semantic labels and static/LIVE comments are not evidence of purpose.

**T** denotes the subsequently authorized `inputs/ff8-decomp-semantics-20261011-r01/g07/supplemental-0x4868C0/dispatch-table.json`, read in full (35 lines). T:2–11 records capture `2026-10-11T18:56:05.486171+00:00`, VA `0x4869F4`, size 20, PE offset `0x869F4`, the same PE SHA256 as N, and parent-attested `idb_table_equals_pe=true` / `idb_target_equals_frozen=true`. Supplied raw-byte SHA256: `eb34ae32d9265a121193b5677eba16a6adea53fb9a98b09446dc2695b138c722`. Hash and native equality attestations were not independently recomputed by this worker. The binary companion was not separately read; the complete 20 bytes were consumed from T:6 hex. Original compaction and Classify payloads are unchanged; this is separate supplemental evidence, not retrospective enrichment of the classifier input.

## Role, name, and confidence

**Proposed name:** `BattleEnd_CommitPartyAndItemsAndSelectMode` — **LIKELY**.

Interpretation: a battle-exit commit/transition step. It copies selected party HP/status into persistent character records, reconciles the battle item table into saved inventory, then dispatches on a result byte to update counters/mode before common finalization calls. This is narrower than a blanket battle reset: the body does not clear all battle buffers or the source item table.

Independent name support: (1) the party-to-save transfer and item-to-inventory writes are distinct data-flow evidence of a commit operation (proofs 1–4); (2) a separate result-driven tail changes counters and the shared mode word (proofs 5–6). The sole frozen caller is in the battle director context (proof 8). The old name is not used as evidence. Mechanical transfers and, after T, exact numeric result-to-case mapping are **CERTAIN**; the battle-exit interpretation is **LIKELY**, using the authorized layout/ABI context in K:28–31. Numeric result business meanings remain unproved. No mechanically observed contradiction requires overall CONFLICT.

## Inputs / outputs / effects

### Mechanical contract (CERTAIN within the frozen body)

- No explicit caller stack arguments are read. Four callee-saved registers EBX/EBP/ESI/EDI are saved and restored; the function ends with plain `RET`. A no-explicit-argument, cdecl-compatible interface is supported; an exact source-language prototype is not established by the packet.
- Iterate exactly three records, slot stride `0xD0`, status-word bases `0x1D27B90 + i*0xD0`. Skip a record when its byte at status-base `+0x3B` (slot `+0xBB`) equals `0xFF`.
- For each non-skipped record: zero-extend party byte at `0x1CFE74C+i`; compute destination `0x1CFE0E8 + byte*0x98` without validating that byte. Read the WORD at status-base `-0x68` (slot `+0x18`); clear bit `0x20` in the source status WORD; write the read WORD at destination `+0`, then the modified status WORD at destination `+0x96`.
- Call `0x485EC0(i)` with one pushed DWORD and caller cleanup. Only after that call, reload the status WORD and store it at `0x1CFF1B2 + i*0x1D0`. Thus the saved-status write before the call and the character-record-status write after the call need not observe identical values if a callee changes the source. K:53–54 supports the callee's two-byte stash-return behavior; its prose label alone does not prove it.
- Iterate 32 source item rows starting at `0x1D28E78`, stride 5, exclusive end `0x1D28F18`. Ignore rows whose unsigned byte ID is zero. Search 198 destination pairs starting at `0x1CFE79C`, stride 2, first for a matching ID; if absent, search again for the first zero ID. For a match, overwrite quantity only; for a new entry, write ID then quantity. If neither match nor free pair exists, make no destination write for that source row. Source rows are not cleared. Zero quantities are written; quantities are not added or clamped; repeated source IDs can overwrite earlier quantities.
- Zero-extend byte `0x1CFF6E7`, decrement EAX modulo 2^32, then unsigned compare to 4. Values 1–5 reach indirect dispatch; 0 and 6–255 reach the common tail without a local case-specific counter/mode write. Table address is `0x4869F4`, immediately beyond the original frozen chunk, now supplied separately by T. Destinations listed in CFG alone are not an ordered table.
- Case blocks present: `0x486991` increments WORD `0x1CFE93A` and writes mode WORD `0x1CD8FC6=5`; `0x4869A3` increments DWORD `0x1CFE934` and sets that mode WORD to 100 if byte `0x1D287DD` has bit `0x10`, otherwise 5; `0x4869CC` increments WORD `0x1CFE938` then falls through to `0x4869D3`, which writes mode WORD 100. `0x4869D3` is also a direct dispatch destination. T plus the guard proves the following numeric mapping, without assigning result business names:

| Input byte | EAX index after DEC | Table entry VA | Raw little-endian bytes | Destination and local effects |
|---|---:|---|---|---|
| 1 | 0 | `0x4869F4` | `CC 69 48 00` | `0x4869CC`: WORD counter `0x1CFE938`++, mode=100 |
| 2 | 1 | `0x4869F8` | `91 69 48 00` | `0x486991`: WORD counter `0x1CFE93A`++, mode=5 |
| 3 | 2 | `0x4869FC` | `CC 69 48 00` | `0x4869CC`: WORD counter `0x1CFE938`++, mode=100 |
| 4 | 3 | `0x486A00` | `A3 69 48 00` | `0x4869A3`: DWORD counter `0x1CFE934`++, mode=100 if scene bit `0x10` set, else 5 |
| 5 | 4 | `0x486A04` | `D3 69 48 00` | `0x4869D3`: mode=100, no case-local counter increment |
| 0 or 6–255 | `0xFFFFFFFF` or 5–254 | no table read | — | `0x4869DC`: common tail only |

This independently decoded order agrees with T:12–32 entries; the conclusion comes from T:6 raw bytes and original A3:11–16 guard/JMP, not from comments or the entries' assertions.
- All local exit paths converge at `0x4869DC`: call `0x46B440`, store zero to WORD `0x1CDBFE0`, call `0x4A92F0`, restore registers, return. Both calls have no explicit pushed arguments here. Their full external effects are not frozen.

### Business interpretation (LIKELY / bounded)

K:28–31 identifies slot `+0x18` as HP, `+0x80` as status1, the `0x1D0` rows as character battle records, source rows as battle item entries, and the 198 pairs as saved inventory. Accordingly this routine persists surviving/represented party battle data and accumulated item-table quantities on exit. The guard proves only `slot+0xBB != 0xFF`, not that HP is positive or a particular party member is alive. Clearing status bit `0x20` is mechanically certain; calling it removal of Berserk uses layout context, not the mnemonic or old function name.

Counter labels suggest escape/victory/other-result bookkeeping; mode and animation-state labels suggest leaving the battle state. These exact business categories, sound-stop and vibration-init helper purposes, and July LIVE claims remain historical hypotheses requiring bounded callee/caller or other authorized evidence. T proves numeric result=4 enters `0x4869A3` and selects mode 5 or 100 according to scene bit `0x10`; it does not prove that result 4 means victory, nor that mode 5 always follows it. The embedded LIVE comment is consistent with one bit-clear observation, not a universal contract.

## Eight exact evidence anchors

1. **Selection and persistent transfer:** A1:6–21, `0x4868D2 CMP [ESI+3B],BL`, `0x4868D5 JZ`, `0x4868DA MOV AL,[0x1CFE74C+EDI]`, LEAs at `0x4868E0/E3/EF`, WORD writes `0x4868F6/FC`. Bytes B:1–3 establish stride `8*(1+2*9)=0x98` and WORD destination width. Independent evidence for the proposed **CommitParty** name component.
2. **Status mutation, call, ordered second commit:** A1:17,22–25 and A2:1–5: `0x4868EA AND WORD [ESI],FFDF`, E8 at `0x486903` decodes to `0x485EC0`, `0x486908 MOV DX,[ESI]`, `0x48690E MOV [EBP],DX`, pointer increments `D0/1D0`, signed `JL` at `0x486925`. Establishes three records and the before/after-callee distinction.
3. **Item matching:** A2:6–21, `0x48692C MOVSX EBX,BYTE [EDI+1]`, `0x486930 XOR EDX,EDX`, `0x486932 MOV DL,[EDI]`, ID compare `0x486943`, signed loop bound `0x48694B/51` at `0xC6`, stride 2. B:4–5 gives destination base `0x1CFE79C`.
4. **Item insertion/overwrite/exhaustion:** A2:22–25 and A3:1–10, `0x48696B JMP 0x486972` on exhausted free search, `0x48696D MOV [EAX],DL`, `0x48696F MOV [EAX+1],BL`, `0x486972 ADD EDI,5`, signed bound `0x486975/7B`. B:6 gives exclusive source end `0x1D28F18`. Independent evidence for the **CommitItems** name component, not a generic inventory-add operation.
5. **Result-driven dispatch and numeric mapping:** A3:11–16, `0x48697D XOR EAX,EAX`, `0x48697F MOV AL,[0x1CFF6E7]`, `0x486984 DEC EAX`, `0x486985 CMP EAX,4`, unsigned `JA`, `0x48698A JMP DWORD [0x4869F4+EAX*4]` (B:7). T:6 raw hex `cc69480091694800cc694800a3694800d3694800` decodes as five little-endian DWORDs `4869CC,486991,4869CC,4869A3,4869D3`; combining index=`byte-1` with the guard proves the numeric mapping above. Independent evidence of result selection for **SelectMode**, without inferred result business categories.
6. **Counters and mode:** A3:17–25/A4:1–7, B:7–9: WORD `INC` at `0x486991/CC`; DWORD `INC EBX` plus store at `0x4869B2/B7`; `AND DL,10h`, `NEG DL`, `SBB EDX,EDX`, `AND EDX,5Fh`, `ADD EDX,5`, `MOV mode,DX`. Carry from byte NEG maps bit-clear to 5 and bit-set to 100 irrespective of prior EDX high bits. Numeric transition writes prove more than old result labels.
7. **Common finalization and return:** A4:8–15/B:9–10, E8 targets `0x46B440` at `0x4869DC`, `0x4A92F0` at `0x4869EA`; WORD zero at `0x4869E1`; POPs and `RET` at `0x4869EF–F3`. No EAX adjustment after the final call, no local Boolean construction.
8. **Frozen call-site provenance:** N:192–198 / M:184–190 identifies code xref `0x47D4AF`, type 17, containing function `0x47CCB0`. K:38–42 locates that function in the surrounding battle-director context. Caller instruction text is not supplied here, so no caller return use is inferred.

## Width, signedness, and ABI cautions

- Slot/character/status writes are WORD, not DWORD. Status bit clear preserves the other 15 bits. Counters at `0x1CFE938/93A` wrap at 16 bits; the counter at `0x1CFE934` wraps at 32 bits. No saturation guards are present.
- Item quantity is sign-extended into EBX, but only BL is copied, preserving all original eight bits, including 0x80–0xFF. It is not a signed quantity comparison. IDs and party/result bytes are zero-extended through prior XOR; pointer/counter loop tests use signed `JL`; result range test uses unsigned `JA`.
- CX/DX writes are partial-register operations. Address arithmetic for save selection is completed before CX is overwritten with HP. `NEG DL` sets carry from the masked low byte; `SBB EDX,EDX` then defines all 32 bits. This is not a signed branch on scene flags.
- **Return AL/AX/EAX:** no proven semantic return. EAX (and hence AX/AL) reaches RET from the final helper `0x4A92F0` without a local overwrite. Its ABI/return type is absent. Do not advertise a Boolean, mode, item count, or result-code return; `void` would be an interface convention, not a recovered machine-level guarantee. EBX/EBP/ESI/EDI are restored; caller-saved ECX/EDX and flags are not promised outputs. No x87 instructions occur locally; transitive helper effects are unknown.

## Open questions / source limitations

1. **Resolved by separately authorized T:** the five DWORDs at `[0x4869F4,0x486A08)` now prove numeric result→destination mapping. The original packet still stops before the first entry; original CFG/comments alone remain insufficient. No table was invented and no out-of-bound rediscovery performed. This resolution does not establish the business meanings of numeric results/counters/modes.
2. Bounded native definitions/context for `0x46B440` and `0x4A92F0` are needed to establish helper purpose, transitive writes, incoming-register dependencies, and final EAX meaning. Actual caller instructions would establish whether return bits are ignored.
3. K reports conflicting historical item/magic labels and hypothetical trailing slot-field names (K:61–63). This analysis uses numeric data flow and the bounded ABI/layout facts instead; it does not resolve those wider historical inconsistencies.
4. No guard checks the party byte's range; table destination validity depends on external invariants. Full source/destination aliasing guarantees and persisted-record type identity are not proved by this body alone. No global queue/latch/source-table clearing should be claimed from this function.

Deliverable is a bounded independent semantic analysis, not promotion, reconciliation, or the supervisor's §5.6 validation.
