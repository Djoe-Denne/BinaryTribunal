# 0x45EBF0 — independent semantic B

## Authority and coverage

Role: semantic B, 2+1, target **0x45EBF0 only**. No other author, classifier, review or future target C was consulted. Analysis uses the authorized common compaction and complete readable native projection; native packet remains authoritative. No promotion or final §5.6 is performed.

Manifest original SHA-256: `dd7611f37d54d96d1f3d3fdcb221a43aac2e371f1006d9733df00a1273427c4e`; common-compaction SHA-256: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`. These are manifest-reported identities, not independently recomputed hashes.

Complete coverage: `asm-001.txt` through `asm-004.txt`, 25 lines each; `asm-005.txt`, 16 lines: **116/116 instructions**. `bytes-001.txt`: all 17 slices, the single contiguous chunk `[0x45EBF0,0x45EE0D)` (**541 bytes**). `metadata.json`: all 958 lines, including all 22 CFG blocks, every exported incoming xref, native identity and empty code-target list. Manifest and common compaction read in full. No compilation or execution was performed.

All input paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g02/`; ASM/bytes/metadata references are within `0x45EBF0.readable/`.

## Role, confidence and proposed name

**Proposed conservative name:** `AccumulateScaledS16Triplet_ClampIR_PushRGB`.

- **CERTAIN mechanical role:** shift a three-DWORD packed FIFO, retain a source tag in the newest entry's top byte, compute three x87-converted scaled signed-16 products, add each to its previous 32-bit accumulator with wrap, store raw accumulators, write three signed-range-clamped DWORD outputs and three independently byte-clamped packed components, and publish range flags.
- **LIKELY interpretation/name:** a software geometry/color-register operation, with the three signed outputs called IR and the packed components RGB. Independently supported by the accumulator/read-modify-write operations (proofs 2–3) and the FIFO/tag/component writes plus two distinct clamp ranges (proofs 1, 4–6). The name is descriptive, not inherited from an old label.
- **UNCERTAIN business identity:** an exact named hardware GTE opcode, lighting stage, blend mode or gameplay purpose. No such identity is promoted. `sub_45EBF0` and comments are not evidence.
- **UNCERTAIN unconditional Q12 numerical contract:** common compaction documents the scale as 1/4096, but this projection does not contain the bytes of either floating constant or the caller's x87 control state. Exact instruction-level floating behavior is established; universally replacing it by an integer shift or a fixed rounding helper is not.

## Inputs, outputs and effects

### ABI and state

No explicit stack argument or incoming general register is consumed as data. Plain `retn`, no outgoing calls: compatible with a zero-argument cdecl-like state operation, though a source-language prototype is not proved by caller bodies. Eight local bytes are allocated; ESI and EBX are preserved by balanced pushes/pops; EBP/EDI are untouched. EAX/ECX/EDX are scratch and EFLAGS are changed. The final `add esp,8` determines exit arithmetic flags, not the last range test.

Global inputs:

- DWORD FIFO entries at `0x1CA8A64`, `0x1CA8A68`; byte tag at `0x1CA8A2B`.
- Signed low WORDs at `0x1CA8A30`, `0x1CA8A34`, `0x1CA8A38`, `0x1CA8A3C`; high WORDs are ignored when reading.
- Old DWORD accumulators at `0x1CA8A74`, `0x1CA8A78`, `0x1CA8A7C`.
- m32 floating constant at `0xB695F8`, m64 floating constant at `0xB693D8`, and current x87 environment.

Output stores:

1. Old FIFO64 → FIFO60; old FIFO68 → FIFO64. Copy tag → FIFO68 byte 3 before component byte writes.
2. Clear `0x1CA92F8`; write new raw DWORD accumulators at 74,78,7C, in that order.
3. Write full DWORDs at 34,38,3C containing signed-range-clamped accumulator values (not merely low WORD writes).
4. Write FIFO68 bytes 0,1,2 from independently byte-clamped **raw** accumulator values; byte 3 remains the copied tag.
5. Update the shared flag DWORD at 92F8 during the clamp branches.

Addresses are fixed, not traversed arrays: FIFO, signed-input and accumulator address spacing is 4 bytes; packed component spacing is 1 byte. There is no loop or matrix/vector memory stride here. State is read and overwritten in sequence, especially the 34/38/3C inputs which become outputs; moving those stores ahead of their corresponding reads would be incorrect. Shared mutable state makes this non-reentrant without external exclusion.

### Arithmetic and floating environment

Let `s = sext16([30])`, and `v1,v2,v3 = sext16([34],[38],[3C])`. Let `F` be the binary32 memory operand and `K` the binary64 memory operand, without using their labels as value proofs. The routine forms the shared x87 factor `s*F`, then for each `vi` executes `fild`, `fmul st,st(1)`, `fadd K`, and **`fstp m64`**, not `fistp`. It reads the low DWORD of that stored floating representation and forms:

`ti = old_acc_i + low32(stored_binary64(x87(vi * (s*F) + K))) + 0x80000000 (mod 2^32)`.

Each intermediate x87 operation follows the current control word/precision/rounding and exception behavior; the binary64 store is a further rounding boundary. For the documented `F=1/4096` and intended magic-double bias `K=2^52+2^31`, under a suitable conventional environment this is rounded scaled signed-product accumulation. The native operation is not truncation, signed `sar 12`, unsigned `shr 12`, or a saturating 32-bit add. LEA wraps modulo 2^32 and sets no integer flags. The initial first-channel CMP is intentionally carried through intervening MOV/LEA/x87 instructions to its later JGE.

Three FILDs for components plus the initial FILD for the factor, three result FSTPs plus final factor pop give net zero x87 stack change on normal completion. No control-word/status save, clear or normalization occurs. Preconditions for uncomplicated completion include enough free x87 stack slots (maximum two additional live values) and an environment in which these operations do not trap. Floating status/exception flags may change. Do not promise exception-free behavior or restore a caller environment the native code never restores.

### Clamps and flags

Signed JGE/JLE comparisons against `-32768` and `32767` produce signed-32 outputs clamped to that range. Out-of-range channel 1 sets `0x81000000`; channel 2 ORs `0x80800000`; channel 3 ORs **`0x00400000` only**. In-range branches leave the cleared/previously accumulated status unchanged. These masks are not interchangeable: third-channel range failure alone does not set bit 31.

Byte stages compare each **raw** `ti` to 255 with unsigned JBE. Negative signed values therefore take the out-of-range branch. `sar reg,31; not reg` yields full DWORD `0x00000000` for negative values, `0xFFFFFFFF` for positive values above 255; its low byte becomes 0 or 255. Values unsigned ≤255 are written unchanged. Per-byte failure masks are `0x00200000`, `0x00100000`, `0x00080000`, with no extra summary-bit synthesis. No division by 16 occurs before packing.

### AL/AX/EAX and return

No defined boolean or numeric source-language return is established. AL is used for FIFO bytes 0 and 1; CL for byte 2. These byte **memory stores do not narrow or replace EAX**. No AX return construction exists.

Exact normal-exit EAX residue: if unsigned `t3 <= 255`, EAX is the second-channel byte-stage full DWORD (t2 if unsigned t2≤255; otherwise 0 for signed-negative t2 or `0xFFFFFFFF` for positive t2>255). If unsigned `t3 > 255`, EAX is the final flag DWORD including `0x00080000`. Thus neither “returns RGB”, “returns the third accumulator”, nor a uniform “returns flags” is correct for all paths. Whether callers observe this residue remains unknown.

## Eight native evidence anchors

1. **FIFO/tag (name evidence):** 45EBF3–45EC03 read old 64/68 then store 60/64; 45EC1B/45EC29 copy tag to newest byte+3 (`asm-001:2–12`). Packed three-component output follows in proof 6.
2. **Signed scaled products (name evidence):** MOVSX WORDs at 45EC09/10/2F and 45EC9C, FILD and shared FMUL at 45EC36/56/85/B1 (`asm-001:6–25`, `asm-002:5–16`). This is three signed products, not unsigned input or matrix traversal.
3. **Accumulator addition (independent name evidence):** old values read at 45EC40/46/6E; LEAs at 45EC74/95/C3 add old values and conversion-low32+bias, followed by DWORD stores (`asm-001:16–18`, `asm-002:1–21`). This distinguishes accumulation from replacement.
4. **Signed output clamps and asymmetry:** CMP/JGE/JLE and stores at 45EC7B–45ED97; masks 81000000,80800000,00400000 (`asm-002:3–25`, entire `asm-003`, `asm-004:1–12`). Bytes confirm branch opcodes 7D/7E (`bytes-001:8–13`); explanatory JLE comments are not used to redefine signed ≤.
5. **Raw-to-byte unsigned clamp:** 45ED9D/EDA3, 45EDC3/C9 and 45EDE2/ED use unsigned JBE (opcode 76), and arithmetic sign shift + NOT (`asm-004:13–25`, `asm-005:1–13`; `bytes-001:14–17`). Saturated signed outputs are not reloaded.
6. **Packed stores and flags:** 45EDBC,45EDE8,45EE03 write AL/AL/CL to consecutive bytes; masks at 45EDAE/EDD4/EDF7 (`asm-004:18–23`, `asm-005:3–14`). Together with proof 1 this supports RGB FIFO terminology, separately from accumulator arithmetic.
7. **Float widths and return:** bytes D8 0D at EC36, DC 05 at EC58/87/B3, DD 5C at EC5E/8D/B9 establish m32 multiply/m64 add/m64 floating stores; final EAX replacement only on the third failure path (`bytes-001:3–7,17`; `asm-005:6–16`). This prevents substituting FISTP or treating AL as the return width.
8. **Caller provenance / leaf:** calls from 56CB7D in 56CB50, 56CBED in 56CBC0, 5D9585 in 5D9510, and 657E24/657E56 in 657DF0 (`metadata:174–204`); empty code targets at `metadata:956`. These establish reuse, not the unprovided callers' argument/return usage or business meaning.

## Divergences, limitations and open questions

- No native operand contradiction with the common compaction was found. Its “1/4096” and IR/RGB/MAC terminology remain contextual corroboration; native constant bytes and a hardware register/opcode map are absent. The raw floating conversion formulation above is the bounded exact contract.
- What are the frozen exact bytes of F/K and the established caller x87 control/exception state? Needed to promote a unique rounding formula or Q12 suffix.
- Do callers consume EAX, and what do wrappers at 56CB50/56CBC0 establish about the API? The xrefs alone do not answer this.
- What validated global-register mapping proves an exact GTE opcode? Accumulation plus RGB clamps is insufficient to select one by historical name.
- Are global accesses externally serialized? No locks or error guards occur here; none are invented.

Output hash can be computed by the parent. No tests, external searches, live activity or IDB/Git/ledger/registry changes were performed in this semantic role.
