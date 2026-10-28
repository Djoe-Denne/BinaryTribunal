# 0x485FF0 — semantic R, reconciled against native evidence

## Provenance and coverage

Scope: semantic volet only, EA 0x485FF0. A and B were supplied frozen by the parent in `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g07/0x485FF0/semantic/`. The manifest identifies distinct native author sessions:

| Author | Session | Model.Ref | Candidate SHA256 |
|---|---|---|---|
| A | `ses_ed3cfc436ffeavf9fkNe8IiDrw` | openai/gpt-6.1-sol, medium | `804e9957bebd40210ac625415550b0cdc83a2f04dfeb215c49381659481c7eba` |
| B | `ses_ed3cee6ceffeqt9e02zmICglU2` | openai/gpt-6.1-sol, medium | `e0e17f424020a2e3cc8580c6cc6a544097fe2b7899d84885105a62442775b58c` |

Original packet SHA256: `cda0002d86ac4ddd92e07c4113dc843be7e9918846d93248d7039944999ac590`; common-compaction SHA256: `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Native executable: 32-bit FF8_EN.exe, SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`.

Read the entire own A/B, common compaction, original packet, native-manifest, both native-asm slices, sole native-bytes slice, and native-metadata. The read renderer truncates original packet line 18; **that truncated display is not used as complete ASM evidence**. All 37 instructions come from the complete 25+12-line ASM slices; all 132 bytes come from the five byte lines and the complete packet chunk hex. CFG/xrefs come from complete metadata and agree with the original packet. No missing tail or guessed JSON fields are used.

The native-manifest's packet/compaction hashes match those in the reconciliation manifest. Its four projection hashes match the corresponding native-prefixed files' recorded hashes. Both candidates quote the same packet/compaction hashes. No recorded provenance inconsistency or missing author was found. This is a manifest cross-check, **not independent raw-file SHA256 recomputation**; no raw-file hashing tool is available in this restricted role. Parent retains hash verification responsibility. Context Mode is not exposed in the tool catalog; the explicitly permitted bounded reads were used.

Coverage: single half-open chunk `[0x485FF0,0x486074)`, 132 bytes, 37 instructions, all 15 metadata CFG blocks. Block starts checked: `485FF0, 485FFF, 486009, 486011, 486018, 486020, 486022, 48602E, 48603C, 486046, 48604E, 486055, 48605D, 48605F, 48606B`. Both loop backedges, all flag/status bypass edges, both stores and the sole RET are accounted for. No other volet, historical output, index or native service was consulted.

## Final role, confidence and name

**Proposed name: `Battle_RebuildSlotMasksWithPartitionedStatusFilter`.**

**CERTAIN mechanical role:** recompute and overwrite two seven-bit slot-membership masks. Both require flag bit 0 set and flag bit 6 clear. The first applies a status-bit-0 veto only to slots 0–2; the second applies that veto only to slots 3–6. These are two differently filtered masks, not two disjoint side-only masks.

**LIKELY domain:** derived battle-slot selection/eligibility state. The authorized layout establishes a battle slot base/stride and party/enemy boundary matching the actual accesses and threshold. **UNCERTAIN downstream purpose:** visibility, targetability, command selection, or other mask use. No supplied mask-reader instruction distinguishes these meanings. Do not promote the existing visibility label, `alive`, `Death`, or a positive `TARGETABLE` interpretation from comments.

At least two independent supports for the name: (1) zeroed shift/conditional-OR accumulators and two WORD stores prove mask rebuilding; (2) the opposed signed threshold branches and actual BYTE status tests prove partition-specific filtering. The `Battle` qualifier relies on supplied layout context, not on the target's old name.

## Final semantic contract

### Inputs and stable-memory result

There are no explicit stack-argument reads or incoming general-register decision inputs. Membership depends on fixed-address global bytes. Under a stable memory image, for `i=0..6` define:

* `F_i = BYTE[0x01D27B8C + 0xD0*i]`;
* `S_i = BYTE[0x01D27B90 + 0xD0*i]`;
* `P_i = ((F_i & 0x01) != 0) && ((F_i & 0x40) == 0)`.

Then:

* `WORD[0x01CFF570] = sum_i ((P_i && (i >= 3 || (S_i & 0x01) == 0)) ? (1u << i) : 0)`;
* `WORD[0x01CFF572] = sum_i ((P_i && (i < 3 || (S_i & 0x01) == 0)) ? (1u << i) : 0)`.

Bits 7–15 are zero in each output; old destination contents are not read or merged. With the supplied slot base `0x01D27B10`, the tested bytes are offsets +0x7C and +0x80. Operand displacement bytes independently establish both absolute bases. Only low bytes are tested even if surrounding documented fields are WORD/DWORD. Bit index 0 means mask value `0x01`, not `0x02`; bit index 6 means `0x40`. HP and all higher flag/status bits are irrelevant to this routine.

### Native order, widths and state effects

1. Save full EBX on the stack; zero full ECX; set full EAX=0x4E0, EDX=1 and only BL=0x40.
2. First pass visits offsets `0x4E0,0x410,0x340,0x270,0x1A0,0xD0,0`, hence slots 6 down to 0. Each iteration first shifts full ECX left by one, then separately reads/tests the flag byte against DL. Only if nonzero does it read the same flag byte again and test BL. A successful flag gate bypasses the status read for offsets >=0x270; otherwise the status BYTE must have bit 0 clear before OR ECX,EDX.
3. Subtract 0xD0 from full EAX with x86 32-bit wrap. Compare with `0xFFFFFF30` and loop using signed JG. After slot 0, EAX wraps to `0xFFFFFF30` (-208), equality ends the loop, and no negative-offset read occurs.
4. Store CX as one WORD to 0x01CFF570, then reset ECX and EAX for the second pass. EDX and BL retain their predicate values.
5. Second pass repeats the same shifts, separate flag reads and signed termination, but signed JL bypasses the status read for offsets <0x270. Slots 3–6 require status bit 0 clear. Store CX as one WORD to 0x01CFF572, restore EBX, and RET.

The pre-test shift establishes final bit i=slot i: each successful OR for slot i subsequently shifts i times. Full ECX never exceeds 0x7F on this trajectory, so the WORD truncation is exact. Shift count is the encoded immediate 1, not a variable or undefined C shift. Threshold comparisons are signed JGE/JL; all accessed offsets are nonnegative so signed/unsigned threshold comparisons happen to agree here, but unsigned loop termination does not preserve behavior.

Do not coalesce the two flag reads into one cached value, pre-read status for all slots, reuse a first-pass snapshot in the second pass, or delay the first store until after the second loop. Each native TEST is a reached BYTE access. Status is read only after both flag gates, and only on its checked partition. Equations above assume stable memory; the ordered procedure governs potentially changing storage. No synchronization or pair-atomic update is supplied. No atomicity claim is inferred merely from WORD store width.

Exactly two persistent global WORD stores occur. Slot source locations and those two destinations are disjoint in the frozen address map; the two destination words are adjacent but nonoverlapping. Additionally PUSH EBX writes temporary stack storage and POP reads it. Thus a literal claim that the function writes only two memory locations would omit the stack save. Ordinary valid, separate stack and mapped readable source/writable destination storage are preconditions, not runtime guards. No allocation, calls, callbacks, slot mutation, extra guards or eight/eleven-slot extension exists.

### ABI, residual registers and floating environment

Stack is balanced; `C3` RET performs no callee argument cleanup. Full incoming EBX is preserved despite BL mutation; ESI, EDI and EBP are untouched. This is a no-explicit-input cdecl-compatible leaf, not proof of a declared zero-argument C prototype or the callers' return contract. No prototype is imposed by this semantic deliverable.

At every normal exit: **EAX=0xFFFFFF30, AX=0xFF30, AL=0x30; ECX=zero-extended second mask; EDX=1; EBX restored.** EAX is deterministic loop residue, neither mask nor Boolean success. AL is always nonzero, regardless of output masks. Caller instruction capture would be needed to decide whether any residue is consumed. Arithmetic flags are clobbered. No x87, SSE, control-word, rounding-mode or floating-environment instruction occurs; the routine does not modify the x87 environment or stack. The only exit follows the second store and restore, with no deliberate result-setting instruction.

## A/B reconciliation and shared-error check

| Issue | A / B | Native adjudication |
|---|---|---|
| Naming | A emphasizes side-specific status-bit-0 filtering; B says partitioned masks | Use partitioned **status filter**, not a claim that masks contain disjoint partitions. Both can contain slots from both sides. Opposed branches at 0x486016/0x486053 prove filter scope; stores prove rebuilding. |
| Bit numbering | A consistently says bit 0; B prose/anchors say “bit 1” while equations use `&1` | Encoded EDX=1 and TEST DL mean **bit index 0**, mask 0x01. B wording is corrected; never reinterpret it as mask 0x02. |
| Access-order detail | A explicitly requires separately reached flag reads and first-store-before-second-pass; B mostly gives stable formulas | Retain A's ordering, independently checked at 0x486001/009, 0x48603E/046 and 0x48602E/035. Stable formulas do not permit caching or reordered stores. |
| ABI wording | A calls void plausible but unproved; B calls void-style appropriate | Neither proves a void prototype. Preserve actual register residues and cdecl compatibility only. No caller body proves discard/use. |
| Memory-write shorthand, shared | Both focus on two output words and no other state writes | Correct to two **global** stores plus temporary PUSH stack save. Save/restore are native, not a label inference. |
| Seven slots, flag 0x40 excludes, opposite status filters, exact EAX residue | A and B agree | Independently re-derived from byte immediates, signed branch opcodes, 66-prefixed stores and final C3; agreement itself is not proof. |

No remaining mechanical CONFLICT was found. Both authors appropriately leave consumer meaning unresolved. Contextual `Death`/`alive` terminology remains unpromoted; there is no HP test or bit-writer evidence here sufficient to strengthen it. Broader logical layout slots 3–7 and GF 8–10 do not alter this routine's hard extent 0–6.

## Exact evidence anchors (7)

Paths are relative to the semantic reconciliation input directory.

1. **Initialize/accumulate:** `0x485FF1–0x485FFF`, `native-asm-001.txt:2–6`; bytes `33 C9 B8 E0 04 00 00 BA 01 00 00 00 B3 40 D1 E1` establish full ECX/EAX/EDX, partial BL and shift by one.
2. **Flag predicates and two reads:** `0x486001/0x486009` with branch sites `0x486007/0x48600F`, and `0x48603E/0x486046` with `0x486044/0x48604C`; `native-asm-001.txt:7–10,23–25`, `native-asm-002.txt:1`. Encoded `84 90 8C 7B D2 01` and `84 98 8C 7B D2 01` are BYTE tests of the same absolute base against DL/BL, followed by JZ/JNZ exclusion edges.
3. **First filter partition:** `0x486011–0x486020`, `native-asm-001.txt:11–15`; bytes `3D 70 02 00 00 7D 08 84 90 90 7B D2 01 75 02 0B CA` prove signed JGE threshold bypass and low-byte status test before OR.
4. **Seven iterations, WORD A store and reset:** `0x486022–0x486037`, `native-asm-001.txt:16–21`; `2D D0 00 00 00 3D 30 FF FF FF 7F D1 66 89 0D 70 F5 CF 01` proves 32-bit decrement, signed JG, WORD 0x01CFF570 replacement before reset. Together with initial 0x4E0 it fixes the seven slots and excludes a negative read.
5. **Complementary filter partition:** `0x48604E–0x48605D`, `native-asm-002.txt:2–6`; `3D 70 02 00 00 7C 08 84 90 90 7B D2 01 75 02 0B CA` proves signed JL bypass for the lower side, with status test only on the upper side.
6. **Second store, ABI and residue:** `0x485FF0` and `0x48605F–0x486073`, `native-asm-001.txt:1`, `native-asm-002.txt:7–12`; repeated signed termination, `66 89 0D 72 F5 CF 01 5B C3`, and entry `53` establish WORD B store, full EBX save/restore, balanced leaf RET and unmodified terminal EAX residue.
7. **Incoming reuse, not consumer meaning:** `native-metadata.json:126–204` records ten type-17 code xrefs at `0x47D6D4,0x48769A,0x489D9E,0x48AE0D,0x48AE3D,0x493A23,0x493C07,0x493F64,0x494042,0x497270`. Site 0x493A23 belongs to 0x493840; common-compaction:49–50 records preceding slot-state writes and the decoded call target. This supports derived-state refresh, not visibility. Owner of 0x493C07 remains null. The three type-1 non-code references 0x489DD4/0x489DFC/0x489F1E are not calls. Complete ASM and `code_targets=[]` establish no outgoing calls.

## Residual risks and lead gate

Consumer-side meaning, meanings of flag bits 0/6 and status bit 0, intentional omission of slot 7, and caller use of EAX/ECX remain **UNCERTAIN**. If stronger business naming or a language prototype is needed, request a parent-frozen capture of mask readers, relevant bit writers and post-call instructions; no additional capture is needed for the bounded mechanical contract above. Threading/asynchronous mutation guarantees are not supplied.

No compilation, execution, live test, independent file-hash recomputation, IDB mutation, promotion or native final §5.6 acceptance was performed. The parent owns final native checks, hashes, integration and any promotion. This file is the complete reconciled semantic contract, not a final RE acceptance receipt.
