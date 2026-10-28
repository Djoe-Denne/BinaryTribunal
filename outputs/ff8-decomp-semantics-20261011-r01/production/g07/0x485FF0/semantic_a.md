# 0x485FF0 — independent semantic A

## Scope / provenance

Semantic A only; no C production, peer outputs, classification, rediscovery or promotion. Read the authorized common-compaction and complete readable manifest, both ASM slices, byte slice and metadata; also the authoritative projected native packet. Coverage: all 37 instructions, all 15 CFG blocks, single half-open chunk `[0x485FF0,0x486074)` (132 bytes). The original JSON assembly display truncates its long line; `asm-001.txt:1–25` and `asm-002.txt:1–12` supply the complete sequence, not a guessed tail.

Input directory: `inputs/ff8-decomp-semantics-20261011-r01/g07/`. Manifest records packet SHA256 `cda0002d86ac4ddd92e07c4113dc843be7e9918846d93248d7039944999ac590` and compaction SHA256 `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Hashes are supplied provenance, not independently recomputed here. Native: 32-bit FF8_EN.exe, SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export 2026-10-11T16:38:25.140966+00:00.

## Role, name, confidence

**Proposed name: `Battle_RebuildSlotMasksWithSideSpecificStatusBit0Filter`.** Mechanical role CERTAIN: rebuild two seven-bit slot-selection masks, both requiring flag bit 0 set and flag bit 6 clear, but suppressing status-bit-0 slots on opposite sides of the slot-3 boundary. Battle-slot interpretation LIKELY, grounded in the authorized layout context, not the old function name. Exact consumer purpose (visibility, target eligibility, command eligibility, etc.) UNCERTAIN: no mask-reader instructions are supplied. Do not promote “alive,” “visible,” “targetable” or “Death” solely from embedded comments.

Two independent naming supports are (i) the shift/OR accumulation and two word stores (proofs 1 and 5), establishing rebuilding slot masks; (ii) the opposed side tests and conditionally executed status reads (proofs 3 and 4), establishing side-specific status-bit filtering. The existing label is not a proof.

## Mechanical input/output contract

- No explicit argument reads: EAX, ECX and EDX are initialized before use; BL is initialized after EBX is saved. All decision inputs come from fixed-address global bytes.
- Authorized layout gives slot base `0x01D27B10`, stride `0xD0`. Byte operands independently encode flag base `0x01D27B8C` (slot +0x7C) and status base `0x01D27B90` (slot +0x80). There are exactly seven traversed slots, in order 6,5,4,3,2,1,0; slot 7 and later are not inspected. Do not extrapolate from the documented logical 11-slot layout.
- For a stable memory image define `F_i` as byte `[0x01D27B8C + 0xD0*i]`, `S_i` as byte `[0x01D27B90 + 0xD0*i]`, and `P_i = ((F_i & 1) != 0) && ((F_i & 0x40) == 0)`.
- Word at `0x01CFF570` is overwritten with bits i=0..6 equal to `P_i && (i >= 3 || (S_i & 1) == 0)`.
- Word at `0x01CFF572` is overwritten with bits i=0..6 equal to `P_i && (i < 3 || (S_i & 1) == 0)`.
- Bits 7..15 of both destination words are zero, not preserved. No slot bytes, adjacent word bits, HP values or other state are written. Reads are BYTE, outputs WORD; status bits 8 and above cannot influence this routine.
- First mask is stored before ECX is reset and the second pass begins; this is not an atomic pair update or a cached snapshot. Each reached flag test is a separate native byte read. Status is read only after flag-bit gates succeed, and only for slots 0..2 in pass A or 3..6 in pass B. If another actor changes memory during execution, the two tests/passes need not see identical values. The equations above describe stable-memory behavior, not an invented synchronization guarantee.
- No calls, allocation, callbacks, x87, SIMD, exceptions intentionally raised, or dynamic guards. Ordinary readable global storage and writable destinations are the memory preconditions; the machine provides no validity checks.

## ABI / signedness / return widths

`PUSH EBX` / `POP EBX` preserve the entire incoming EBX despite temporary BL=0x40. ESI/EDI/EBP are untouched. Stack is balanced and plain `RET` has no argument cleanup. This is compatible with an argument-free cdecl-like leaf, but the packet alone does not prove a declared language prototype.

Loop arithmetic is 32-bit: EAX starts at 0x4E0, decrements by 0xD0, and terminates after the slot-0 iteration with `0xFFFFFF30` (-208). The loop branch is **signed JG**, not unsigned JA; unsigned substitution would be wrong at the wrap after zero. Side branches are signed JGE in pass A and signed JL in pass B against 0x270 (3*0xD0). All offsets encountered for reads are nonnegative, so this side distinction happens to coincide with unsigned comparison on this bounded trajectory. SHL/OR operate on full ECX; only CX is stored. EDX remains 1; DL supplies the bit test and full EDX supplies OR. No return value is explicitly constructed.

Exact exit register facts: **EAX=0xFFFFFF30, AX=0xFF30, AL=0x30**, ECX=zero-extended second mask, EDX=1, EBX restored. Thus AL is nonzero regardless of mask contents, and EAX is neither mask nor Boolean. Calling this a meaningful integer/Boolean return would require caller evidence; a void semantic interface is plausible but not proved. Arithmetic flags are clobbered; no floating-point environment change occurs.

## Evidence anchors (7)

1. `0x485FF1–0x485FFF`, `0x486022–0x48602E`: zero ECX, EAX=0x4E0, pre-decision SHL, decrement 0xD0, signed terminal comparison. Seven iterations place slot i in bit i. Sources `asm-001.txt:2–6,15–19`; bytes slice 1–3.
2. `0x486001/0x486009` and `0x48603E/0x486046`: TEST BYTE against DL=1 / BL=0x40, JZ/JNZ bypass OR. Bit 0 admits; bit 6 excludes, irrespective of any enum spelling. Sources `asm-001.txt:4–10,23–25`, `asm-002.txt:1`; encoded displacement `8C7BD201` in bytes.
3. `0x486011–0x48601E`: CMP 0x270, signed JGE skips status test for slots >=3; remaining slots reject status byte bit 0. Source `asm-001.txt:11–14`; byte displacement `907BD201`.
4. `0x48604E–0x48605D`: signed JL skips status test for slots <3; remaining slots reject status byte bit 0. Source `asm-002.txt:2–6`. This complementary gating is distinct evidence for the proposed side-specific name.
5. `0x48602E` and `0x48606B`: operand-size prefix 66 with stores of CX to encoded absolute addresses `0x01CFF570` / `0x01CFF572`, with ECX reset between passes. Sources `asm-001.txt:19–22`, `asm-002.txt:10`, `bytes-001.txt:2–5`. These prove complete WORD replacements, not byte or DWORD stores.
6. `0x485FF0`, `0x485FFD`, `0x48605F–0x486073`: save EBX, mutate only BL temporarily, final signed termination, restore EBX, plain RET without rewriting EAX. Sources `asm-001.txt:1,5`, `asm-002.txt:7–12`. These prove preservation and exact residual return-register widths.
7. Incoming code xrefs at `0x47D6D4`, `0x48769A`, `0x489D9E`, `0x48AE0D`, `0x48AE3D`, `0x493A23`, `0x493C07`, `0x493F64`, `0x494042`, `0x497270`; metadata `:126–186`. The frozen common-compaction `:49–51` also records a call at 0x493A23 after slot-state writes. This supports reuse from several update paths, not a specific consumer purpose. Three additional type-1/non-code references (`metadata.json:187–204`) must not be counted as calls; the owner of 0x493C07 is unresolved. `code_targets=[]` and the complete leaf instructions corroborate no outgoing calls.

## Business interpretation and unresolved questions

The authorized common-compaction `:28–31` attributes the stride and party/enemy partition to prior layout/ABI material. Given that context, pass A applies the status-bit-0 veto to party slots, while pass B applies it to the four inspected enemy slots. Calling status bit 0 “Death” is consistent with the contextual status nomenclature, but target instructions merely test a bit. Calling flag bit 0 “alive” is stronger than the mechanical evidence and is left unconfirmed. The asymmetric filters may support target enumeration that treats dead members differently; this is a hypothesis, not a result.

Embedded static comments agree with the bit equations but are not independent verification. No mechanical discrepancy was found among complete readable ASM, byte encoding, CFG, and common-compaction NM facts. The broader documented enemy range 3..7 versus this routine's 3..6 is a scope limitation, not license to add a slot. The historical label “visibility” remains unvalidated as consumer semantics.

Open questions for lead-provided additional freeze, if needed for stronger business naming:

1. Which instructions consume the two destination words, and how do they use set/unset bits? Do they establish visibility rather than eligibility or selection?
2. What independent writers establish flag bits 0/0x40 and status bit 0? Is 0x40 a disable/untargetable condition despite enum names?
3. Why exactly seven slots, excluding logical slot 7 and GF slots? Is that intentional subsystem scope?
4. Do any callers consume AL, AX or EAX rather than only the globals? Current incoming-xref metadata cannot prove a void declaration.
5. Is execution guaranteed single-threaded/without asynchronous global mutation? This routine itself supplies no snapshot or synchronization.

No compile, tests, differential execution, live capture, output hashing, IDB write, integration or final §5.6 validation was performed.
