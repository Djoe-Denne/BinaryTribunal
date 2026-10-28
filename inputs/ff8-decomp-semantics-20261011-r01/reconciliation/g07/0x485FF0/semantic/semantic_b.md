# 0x485FF0 — independent semantic B

## Scope and provenance

Read only the assigned g07 common compaction and complete readable projection (manifest, asm-001/002, bytes-001, metadata). Coverage: all 37 instructions, all 132 bytes of [0x485FF0,0x486074), both loops and every CFG block. Manifest original-packet SHA256: `cda0002d86ac4ddd92e07c4113dc843be7e9918846d93248d7039944999ac590`; common-compaction SHA256: `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Manifest hashes are recorded, not independently recomputed. Native provenance: 32-bit FF8_EN.exe, SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, exported 2026-10-11T16:38:25.140966+00:00. Existing names and embedded static comments are not purpose evidence. No other author/C/review output consulted.

## Role, confidence and proposed name

**Proposed name: `Battle_RebuildPartitionedSlotMasks`.**

**CERTAIN mechanical role:** overwrite two seven-bit slot membership masks from global slot bytes, sharing two flag predicates but applying a status-bit exclusion to opposite sides of the slot-3 boundary.

**LIKELY domain interpretation:** battle-slot eligibility masks partitioned by party/enemy side. The supplied layout identifies party slots 0–2 and enemies beginning at 3 (common-compaction:28–30), consistent with the native threshold 3*0xD0. Exact downstream use as targeting, visibility, or other selection remains **UNCERTAIN**. The routine itself proves neither rendering visibility nor a positive interpretation of flag 0x40; that bit excludes membership. No CONFLICT in the bytes versus instruction mechanics.

Independent name proofs: (1) two shift/conditional-OR accumulation loops followed by separate word stores prove rebuilding masks; (2) opposite signed threshold branches at 0x486016/0x486053 prove partition-specific filtering, independently of those stores. The supplied slot layout supports the `Battle` qualifier, not the historical function label.

## Inputs, outputs and effects

- No explicit stack arguments are accessed; no incoming register value affects membership. Reads globals only. No calls, allocation, callbacks or slot-data writes.
- Define slot k in 0..6, flag byte F(k) at `0x1D27B8C + k*0xD0`, status low byte S(k) at `0x1D27B90 + k*0xD0`. These absolute addresses are decoded from bytes, not inferred from labels. Common compaction places these at slot offsets +0x7C and +0x80 respectively.
- Word at `0x1CFF570`: bit k is set exactly when `(F(k)&1)!=0`, `(F(k)&0x40)==0`, and either k>=3 or `(S(k)&1)==0`.
- Word at `0x1CFF572`: bit k is set exactly when the same flag conditions hold and either k<3 or `(S(k)&1)==0`.
- Visits k=6 down to 0 twice; shifting before appending ensures final bit k corresponds to slot k. Bits 7–15 of both stored words are zero. These are replacement stores, not merges with old masks. Only these two adjacent two-byte globals are written; neighboring bytes remain unchanged.
- Read widths are BYTE even though the contextual layout describes wider flags/status fields. No high flag/status bits are tested. No HP field is read. Calling flag bit 1 “alive” is stronger than the local mechanics alone establish; status bit 1 meaning Death comes from supplied contextual documentation/comments, not from the TEST opcode.
- Stride is 0xD0. Offset sequence is 0x4E0,0x410,0x340,0x270,0x1A0,0xD0,0; final subtraction reaches -0xD0. Loop comparisons use signed JG against `0xFFFFFF30` (-208); threshold branches are signed JGE/JL. No unsigned reinterpretation is needed or valid for these termination branches. There is no access at the terminal negative offset and no visit to slot 7 or GF slots.
- Preserves full EBX through PUSH/POP, despite setting only BL=0x40; ESI/EDI/EBP are untouched. Clobbers EAX/ECX/EDX and flags. EDX=1, ECX=second mask on exit. Stack balanced, plain RET without callee argument cleanup; a no-argument void-style contract is appropriate but specific calling convention is not proved by this alone.
- **Return-register distinction:** no deliberate result-setting instruction. Nevertheless every normal path leaves EAX=`0xFFFFFF30`, AX=`0xFF30`, AL=`0x30`. Neither mask is returned in EAX/AX/AL. This deterministic loop residue must not be misdeclared as Boolean success; whether any caller relies on it is unproved without caller instructions. Outputs are the global words, with a incidental second-mask value in ECX.

## Exact evidence anchors (7)

Paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g07/0x485FF0.readable/`.

1. `asm-001.txt:2–6`, 0x485FF1–0x485FFF: XOR ECX, MOV EAX,0x4E0, MOV EDX,1, MOV BL,0x40, SHL ECX,1 establish a fresh bit accumulator and fixed predicates. `bytes-001.txt:1` corroborates immediates/opcodes.
2. `asm-001.txt:7–10`, 0x486001/0x486009 with JZ/JNZ: BYTE tests at flag base require bit 1 set and bit 0x40 clear before membership can be added. `bytes-001.txt:1–2` encodes base 0x1D27B8C.
3. `asm-001.txt:11–15`, 0x486011–0x486020: CMP EAX,0x270; signed JGE skips BYTE status bit-1 exclusion for upper partition; lower partition must pass it before OR ECX,EDX. `bytes-001.txt:2` encodes status base 0x1D27B90.
4. `asm-001.txt:16–19`, 0x486022–0x48602E: SUB EAX,0xD0; CMP EAX,0xFFFFFF30; signed JG; MOV [0x1CFF570],CX. Together with initial offset this proves seven slots and a WORD overwrite. `bytes-001.txt:2–3` supplies store width prefix 66 and destination.
5. `asm-001.txt:20–25` plus `asm-002.txt:1–6`, 0x486035–0x48605D: fresh accumulator and repeat flag gates; signed JL at 0x486053 skips status exclusion for the lower partition, reversing which side checks status bit 1.
6. `asm-002.txt:7–12`, 0x48605F–0x486073: second identical signed loop termination; WORD [0x1CFF572]=CX; POP EBX; RET. `bytes-001.txt:4–5` corroborates destination and terminal instructions, proving EAX residue rather than a mask return.
7. `metadata.json:126–204` lists ten code xref sites, including 0x493A23 in 0x493840 and 0x47D6D4 in 0x47CCB0; three separate non-code references are at 0x489DD4/0x489DFC/0x489F1E. Common-compaction:49–50 supplies the neighboring status/flag-write sequence preceding 0x493A23. This supports a refreshed derived-slot-state role but does not prove consumers' purpose. Owner of code site 0x493C07 is null in the freeze; it is not assigned an invented caller.

## Limits and open questions

1. Which instructions consume 0x1CFF570/572, and are their uses targeting, rendering, AI, or mixed? Output read-xrefs/consumer bodies are absent from this projection.
2. What precisely does flag 0x40 encode? Historical labels suggesting targetable must not invert the mechanically proven exclusion. Does bit 1 mean occupied/active rather than HP-alive? No local HP check exists.
3. Does any caller use the EAX loop residue or ECX mask? Target xrefs alone cannot establish a high-level return ABI.
4. Why seven slots instead of all enemy slots in the supplied layout? This is a hard native extent, not permission to extend the loop to eight or eleven.

No promotion, §5.6, IDB/live validation, or externally validated business conclusion is claimed. No additional context is necessary for the mechanical contract; consumer-side meaning remains deliberately unresolved.
