# Independent semantic A — 0x4868C0

## Scope, sources and confidence

- Mission: ff8-decomp-semantics-20261011-r01; semantic A only; independent 2+1 production. No C/review/classification/peer outputs consulted.
- Authoritative input `inputs/ff8-decomp-semantics-20261011-r01/g07/0x4868C0.json` (manifest SHA256 `bb4e83a4a9db291ee331f1ee5a7cc16c766b37c54fd76ea9a4c44bfdf0721f28`). FF8_EN.exe SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, 32-bit, native export 2026-10-11T16:38:25.140966+00:00.
- Read complete projection: `0x4868C0.readable/{manifest.json,asm-001.txt,asm-002.txt,asm-003.txt,asm-004.txt,bytes-001.txt,metadata.json}` beneath that same g07 input directory. All 90 instructions and all bytes of the sole half-open chunk `[0x4868C0,0x4869F4)` covered. Original packet metadata/bytes also read; its long ASM JSON line is displayed truncated, but all verbatim split ASM lines were read in full.
- Common context: `inputs/ff8-decomp-semantics-20261011-r01/g07/common-compaction.md`, SHA256 declared by manifest `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Surrounding documentation facts below are attributed to that frozen compaction, not newly inspected sources. Hashes are supplied provenance, not newly recomputed.
- Supplemental native source, separately authorized after initial delivery: `inputs/ff8-decomp-semantics-20261011-r01/g07/supplemental-0x4868C0/dispatch-table.json:1-35`, captured UTC `2026-10-11T18:56:05.486171+00:00`; complete 20-byte hex table at VA `0x4869F4`, PE offset `0x869F4`, declared SHA256 `eb34ae32d9265a121193b5677eba16a6adea53fb9a98b09446dc2695b138c722`. Parent receipt states `idb_table_equals_pe=true`, `idb_target_equals_frozen=true`, and the same authenticated PE SHA256 as above. Entire JSON read; decoding below uses its raw hex, not case labels or its convenience `entries` fields. No independent recapture/hash computation claimed. Original common compaction and classifier payloads remain unchanged.
- **CERTAIN:** instruction-level transfers, widths, loops, calls, numeric result-to-destination mapping and mode-write alternatives described below. **LIKELY:** business interpretation as end-of-battle persistence and mode handback. **UNCERTAIN:** business meaning of individual result codes and full effects/return contracts of external callees. No observed opcode/ASM contradiction in the supplied target chunk or supplemental table.

## Proposed role and name

**Proposed name: `Battle_CommitPartyAndItemsAndSelectPostBattleMode` — LIKELY.**

Synchronizes present party-slot data to persistent character records, invokes per-slot stash cleanup before merging battle item quantities into persistent inventory, then selects a global mode/counter update from a battle-result dispatch and runs common finalization helpers. “Present” here means only the mechanical slot-byte test against `0xFF`, not an alive/dead test. It is not a wholesale battle-buffer reset, and the inventory operation is quantity replacement, not quantity addition.

Two independent name foundations: (i) party HP/status writes into character/save records, with different source/destination strides; (ii) battle-local item records merged into the persistent item-pair array. A third foundation is the result-controlled global-mode/counter branch followed by common finalization. The preexisting IDA function name and embedded historical comments are not evidence for this name. The supplied selector table now proves numeric destinations, but does not independently establish victory/escape/game-over business names.

## Contract and ordered effects

### Inputs / ABI

- No explicit stack argument is loaded and no incoming register is consumed as application data before initialization (saved callee-preserved registers excepted). Observed ABI shape is a no-explicit-argument, plain-`ret`, cdecl-compatible global-state procedure; exact source-language declaration is not proved.
- Reads slot rows at base `0x1D27B10`, party-index bytes at `0x1CFE74C`, local item rows at `0x1D28E78`, inventory pairs at `0x1CFE79C`, result byte `0x1CFF6E7`, and on one dispatch block encounter flag byte `0x1D287DD` and counters.
- Assumes these fixed memory regions and called helpers are valid. No supplied range guard constrains the party-index byte before computing its save-record address. No invented guard is implied.

### Phase 1: three party slots

For logical indices 0, 1, 2, inspect byte `slot+0xBB`. If equal to `0xFF`, skip all writes and the helper for that slot. Otherwise:

1. Zero-extend `party[index]` and compute `0x1CFE0E8 + 0x98 * party[index]`.
2. Read WORD `slot+0x18` (HP according to frozen layout); clear only bit `0x20` in WORD `slot+0x80`; store the previously read HP WORD at save-record `+0` and current status WORD at save-record `+0x96`. The layout associates `0x20` with Berserk; the mechanically certain operation is `status & 0xFFDF`.
3. Push the logical slot index and call `0x485EC0`, then clean up four stack bytes. Frozen neighbor facts establish this helper visits two stash bytes at `slot+0xB8/+0xB9`, invokes `0x486B40(id,0)` for nonzero entries and clears them. The refund/inventory meaning remains contextual; target code establishes ordering before phase 2.
4. Re-read WORD status **after** that helper, and store it at `0x1CFF1B2 + 0x1D0 * logical_index` (F_CHAR_DATA `+0x1B2` according to frozen ABI). Do not collapse the pre-helper and post-helper status reads or confuse this destination with the HP field.

Slot addresses advance by `0xD0`, F_CHAR destinations by `0x1D0`; all three logical indices advance even if skipped. Only the first three slots are traversed here.

### Phase 2: merge 32 local item records

- Traverse `[0x1D28E78,0x1D28F18)` in steps of 5, exactly 32 rows; only row bytes `+0` (id) and `+1` (quantity) are read by this phase.
- For id zero, skip the row, although quantity has already been read. Nonzero id is zero-extended into EDX.
- Search all 198 persistent two-byte records starting at `0x1CFE79C` for the first equal id. If found, overwrite its quantity byte with the local quantity byte; do not add, clamp, clear the id, or remove a zero-quantity match.
- If no match exists, search the same 198 records for the first id byte equal to zero. Write its id byte and then quantity byte. If none is empty, make no persistent write for that row.
- Local rows are not cleared. Other bytes of a local five-byte row are untouched by these instructions. Duplicate local ids are processed in order and later matching rows overwrite earlier quantities. Existing duplicate persistent ids are not consolidated.

### Phase 3: result-controlled mode/counter alternatives

Zero-extend BYTE `0x1CFF6E7`, subtract one with 32-bit wrap, compare unsigned with 4. Values outside original-byte range 1..5 go directly to common tail; this includes byte zero, whose decremented EAX is `0xFFFFFFFF`. For 1..5, jump through five DWORD selectors at `0x4869F4` (outside the original supplied chunk, now provided separately). The original CFG identifies destinations; the supplemental raw table establishes their order. Independent little-endian decode of `cc694800 91694800 cc694800 a3694800 d3694800`, together with `index = zero_extended_result - 1` and the unsigned guard, yields:

| Result BYTE | EAX index | Selector address / raw bytes | Destination | Direct branch effect before common tail |
|---|---:|---|---|---|
| 1 | 0 | `0x4869F4: CC 69 48 00` | `0x4869CC` | increment WORD `0x1CFE938`, then mode WORD = 100 |
| 2 | 1 | `0x4869F8: 91 69 48 00` | `0x486991` | increment WORD `0x1CFE93A`, mode WORD = 5 |
| 3 | 2 | `0x4869FC: CC 69 48 00` | `0x4869CC` | same branch as result 1 |
| 4 | 3 | `0x486A00: A3 69 48 00` | `0x4869A3` | increment DWORD `0x1CFE934`, mode WORD = 100 if encounter flag bit `0x10` set, else 5 |
| 5 | 4 | `0x486A04: D3 69 48 00` | `0x4869D3` | mode WORD = 100, without incrementing `0x1CFE938` |
| 0 or 6..255 | outside 0..4 | no table read | `0x4869DC` | no direct counter/mode write |

The four decoded branch blocks operate as follows:

- Block `0x486991`: increment WORD `0x1CFE93A` modulo 65536; write WORD `0x1CD8FC6 = 5`.
- Block `0x4869A3`: increment DWORD `0x1CFE934` modulo 2^32; write WORD `0x1CD8FC6 = 100` if byte `0x1D287DD` has bit `0x10`, otherwise 5. `AND DL,0x10; NEG DL; SBB EDX,EDX; AND EDX,0x5F; ADD EDX,5` implements the conditional value exactly.
- Block `0x4869CC`: increment WORD `0x1CFE938` modulo 65536, then fall through to `0x4869D3`.
- Block `0x4869D3`: write WORD `0x1CD8FC6 = 100`; entry directly here does not increment the preceding WORD counter.
- Out-of-range default: no direct counter or mode write in this phase.

All branch alternatives reach `0x4869DC`: call `0x46B440`, write WORD `0x1CDBFE0 = 0`, call `0x4A92F0`, restore registers, return. The names suggesting sound stop and vibration initialization are contextual hypotheses, not contracts derived from target instructions. These calls may have additional effects not frozen here.

## Widths, signedness and return

- `XOR EAX,EAX; MOV AL,[party]` and the analogous result-byte load prove zero extension, not signed char arithmetic. Save-row stride derives from `9*x`, then `x+2*(9*x)`, then scale 8: `19*8 = 0x98`.
- Party status and HP transfers use CX/DX and WORD stores; upper halves are not written to the destinations. Slot-byte comparison uses BL set to `0xFF`, not an EBX-wide sentinel comparison.
- Quantity uses `MOVSX EBX,BYTE [EDI+1]` (signed values -128..127), but only BL is stored. No signed quantity calculation follows: the persisted eight bits are unchanged, including values >=128.
- Slot-address and item-pointer termination use signed `JL`; persistent item scan counts also use signed `JL` against 198. Their initialized, bounded trajectories yield the counts above. Dispatch bounds use unsigned `JA`, not signed `JG`.
- Only the victory-like counter block has a DWORD increment; the other two increments are WORD operations. WORD global mode and animation stores must not be widened to DWORD. DL negation is eight-bit; SBB replaces the entire EDX with 0 or `0xFFFFFFFF` from the resulting carry flag.
- EBX/EBP/ESI/EDI are saved/restored. EAX/ECX/EDX and flags may be clobbered. No x87 instruction or explicit floating-point environment operation occurs in this chunk; external helper behavior is unknown.
- **No independent AL, AX or EAX return value is assigned by this routine.** Final call `0x4A92F0` is followed only by pops and `ret`, leaving its EAX/AX/AL observable at this return under ordinary ABI behavior. Earlier result-byte EAX is not a returned battle outcome. Return width/type/meaning are UNCERTAIN; a semantic “void-like effects procedure” is appropriate without inventing a typed helper return.

## Eight exact evidence groups

All paths below are beneath `inputs/ff8-decomp-semantics-20261011-r01/g07/`; `R` means `0x4868C0.readable/`. VAs disambiguate instructions within the authoritative packet's ASM line 18 and chunk bytes line 15.

1. **Party loop/ABI:** `R/asm-001.txt:1-10` (`0x4868C0..0x4868D5`) saves four registers and tests BYTE slot `+0xBB`; `R/asm-002.txt:1-5` (`0x486912..0x486925`) steps source `0xD0`, destination `0x1D0`, and signed-compares against `0x1D27E00`. Establishes exactly three logical-slot opportunities, not seven or eleven.
2. **Independent name proof: character persistence:** `R/asm-001.txt:11-21` (`0x4868D7..0x4868FC`) zero-extends party byte, computes save stride `0x98`, copies HP WORD and masked status WORD; `:23-25` (`0x486908..0x48690E`) copies post-helper status to `0x1CFF1B2 + index*0x1D0`. Frozen contextual identifications: `common-compaction.md:29-31,57`.
3. **Cleanup ordering:** `R/asm-001.txt:12,22-25`, push slot at `0x4868D9`, E8 at `0x486903` byte-decodes to `0x485EC0`, subsequent status reload and `ADD ESP,4`. Neighbor mechanical stash behavior is frozen at `common-compaction.md:53-54`. No claim that all pending/command buffers are reset.
4. **Independent name proof: inventory commit:** `R/asm-002.txt:6-25` and `R/asm-003.txt:1-10` (`0x486927..0x48697B`) prove signed-byte quantity load, zero-extended id comparison, first-match/first-empty scans of 198 pairs, byte writes at `0x48696D/0x48696F`, and 32 five-byte rows. Persistent/local table identities are supplied by `common-compaction.md:31,58`.
5. **Result dispatch and independently resolved mapping:** `R/asm-003.txt:11-16` (`0x48697D..0x48698A`), bytes `33 C0 A0 ... 48 83 F8 04 77 52 FF 24 85 F4 69 48 00`, prove byte zero-extension, unsigned default and table address `0x4869F4`. Original packet `:13-15` ends exactly at that address; CFG successors `R/metadata.json:140-148` alone do not establish selector order. Separately supplied `supplemental-0x4868C0/dispatch-table.json:2-11` provides all 20 raw bytes and native equality provenance; little-endian DWORD decoding proves ordered destinations `4869CC,486991,4869CC,4869A3,4869D3` for result bytes 1,2,3,4,5. No semantic result labels are inferred from the table.
6. **Mode/counter computation:** `R/asm-003.txt:17-25`, `R/asm-004.txt:1-7` (`0x486991..0x4869D3`) with bytes in `R/bytes-001.txt:7-9` prove counter widths, bit `0x10` carry-derived mode 5/100, and counter-increment versus direct mode-only entry. Embedded case-number comments are not selector evidence.
7. **Common finalization/return:** `R/asm-004.txt:8-15` (`0x4869DC..0x4869F3`), bytes in `R/bytes-001.txt:9-10`, prove calls to `0x46B440` then `0x4A92F0` around a WORD zero store, followed by saved-register restoration and plain RET; no explicit final return-value construction.
8. **Caller context:** original packet `:192-203`, reproduced at `R/metadata.json:184-195`, records one direct code xref at `0x47D4AF` owned by `0x47CCB0`, and the three decoded callees. This supports the frozen battle-director context but provides neither caller return consumption nor complete runtime invocation conditions.

## Open questions / limits

1. **Resolved numeric gap:** parent supplied all five DWORD selectors at `[0x4869F4,0x486A08)` with IDB/PE/frozen-target equality receipt. Result-to-index-to-destination mapping is now CERTAIN as tabulated above. Result business meanings remain UNCERTAIN; switch comments and historical LIVE prose are not substituted for independent business evidence. Overall proposed role/name remains LIKELY.
2. Complete contracts for `0x46B440`/`0x4A92F0`, and caller instructions around `0x47D4AF`, would be needed to prove helper effects and any consumed AL/AX/EAX return. No prototype invented.
3. Exact business labels for result modes 5/100 and counters require independently validated enum/context facts. Frozen label-based escape/victory/unused names alone do not settle these meanings.
4. Slot presence test does not validate the separate party byte; malformed index behavior is unguarded in target code. Full inventory is silently skipped for unmatched rows. External helpers may affect more state than this chunk shows.
5. Historical initial comment claims a particular live handback and lack of global buffer reset; this production does not reproduce that test. Locally, no global local-item clear or general command-buffer reset appears, but helper side effects are not excluded.

No compilation, test, differential execution, IDB promotion, live action, or final supervisor validation performed. This is an independent semantic deliverable, not §5.6 closure.
