# 0x460860 — independent semantic B

## Scope and provenance

Only the authorized g04 projection was used after the inherited pre-knowledge reader checkpoint. No peer C, semantic output, review, classification, historical target reconstruction, IDB or live access. The historical-exposure warning in `common-compaction.md:57` describes the later explorer history, not a reconstruction consulted here. Existing labels are not evidence.

Input prefix **I** = `inputs/ff8-decomp-semantics-20261011-r01/g04/`.
Authoritative packet: `I/0x460860.json`; supplied SHA256 **9384e033a8c2529b83d45416bffb9fc86fec628fa40990f5f60610486739861a** (`I/0x460860.readable/manifest.json:3–4`). Compaction hash **1ffd99c0ab16a51b4b5c26f906c3ff61d657fd111e6c8720353e656c88add668** (`manifest.json:5`). Native executable hash **064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570**, 32-bit, export 2026-10-11T16:38:25.140966+00:00 (`metadata.json:4–10`). Hashes are supplied provenance, not independently recomputed by this author.

Read all eight ASM slices (177 instructions), both bytes slices (654 bytes), full metadata and manifest, and common compaction. The root reader truncates its one-line ASM at line 18; the complete verbatim slices supply that entire field without truncation. The single chunk is `[0x460860,0x460AEE)`, with 22 CFG blocks and three return paths. No compilation, tests or native differential execution performed. No C reconstruction is part of this semantic-only deliverable.

## Conclusion and confidence

- **Proposed name: `Gte_ExecuteMatrixVectorAdd` — LIKELY.** The `Gte_` identity is an interpretation of the command encoding and register-like global effects, not established by the old name. If domain-neutral naming is required, use **`ExecuteSelectedMatrixVectorAddS16` — CERTAIN** for the observable operation.
- **Mechanical role — CERTAIN:** decode matrix/vector/addend selectors from one command DWORD; perform three signed 3-term matrix/vector dot products through x87; optionally scale vector operands by 2^-12; convert each product result through a biased binary64 bit-extraction sequence; optionally add a selected three-DWORD addend; write raw DWORD results and signed-16-range saturated DWORD results, updating per-component status bits.
- **Business interpretation — LIKELY:** software implementation of a GTE-style selectable matrix/vector multiply-add command, producing accumulator-like raw values and IR-like saturated values. Exact hardware equivalence, named matrix banks and caller-level rendering purpose remain **UNCERTAIN**.
- No mechanical source conflict remains for the supplied constants. Historical constant prose conflicts with the byte-validated compaction and is rejected, not blended into the result.

## Inputs, outputs, ABI and numerical semantics

**Command and ABI.** One DWORD at entry ESP+4 is read at 0x460866. Plain RET and restored EBX/ESI/EDI establish caller-cleaned, cdecl-compatible stack behavior; no multivariate argument order can be inferred from a single parameter. Authorized caller context shows PUSH immediate / CALL / POP ECX / RET; the popped ECX is the overwritten argument home, not necessarily the pushed command. The input home slot is repeatedly overwritten as signed-DWORD FILD scratch, ending with the signed WORD from selected matrix offset 0x0C at 0x4609C2. EAX/ECX/EDX are volatile. No prototype or intentional source-level return type is established.

**Selectors and storage.** Despite SAR instructions, masking by 3 yields unsigned selector values 0..3 from command bits 13–14 (addend), 15–16 (vector), and 17–18 (matrix). Bit 19 gates scaling; other command bits are not examined here.

| Storage | Exact mechanically supported layout |
|---|---|
| Matrix input | `0x1CA927C + matrix_selector*0x20`; nine signed WORDs at offsets 0,2,4 / 6,8,0xA / 0xC,0xE,0x10. Row stride 6 bytes, bank stride 32 bytes, read span 18 bytes; no full struct size inferred. Selector 3 still accesses a fourth bank, not a rejected command. |
| Vector input, selectors 0..2 | `0x1CA8A10 + vector_selector*8`; signed WORDs at offsets 0,2,4. Slot stride 8 bytes, read span 6 bytes. |
| Vector input, selector 3 | signed low WORDs at `0x1CA8A34`, `0x1CA8A38`, `0x1CA8A3C`, stride 4 bytes. Upper halves are not input operands. |
| Optional addend | `0x1CA9290 + addend_selector*0x20`; DWORDs at offsets 0,4,8, loaded only for selectors 0..2. Selector 3 bypasses reads, not a zero-vector load. |
| Raw results | full DWORDs at `0x1CA8A74/78/7C`; initially written after each conversion, then overwritten after addends when enabled. |
| Saturated results | full DWORD stores at `0x1CA8A34/38/3C`, each in [-32768,32767]; negatives are sign-extended DWORD values, not zero-extended 16-bit outputs. |
| Status | full DWORD at `0x1CA92F8`, cleared after raw results/addends, then conditionally updated. |

**Arithmetic/order.** Let x,y,z denote the selected signed vector WORDs after optional exact power-of-two scaling. For each row, the native x87 operation sequence forms `(m_i2*z + m_i1*y) + m_i0*x`, in that addition order. This mathematical notation is not permission to reassociate operations or replace them with integer shifts. Signed WORD coefficients are widened to signed DWORDs before FILD. All three vector operands are loaded before result writes, so vector selector 3 uses the old saturated globals, not newly saturated components.

The constant at 0xB69600 is binary64 **2^-12**, bytes `000000000000303f`; the conversion bias at 0xB693D8 is **2^52+2^31 = 4503601774854144**, bytes `0000008000003043` (`common-compaction.md:25–28`). Each row adds the bias, stores/pops a qword, extracts that stored binary64 value's low DWORD and adds 0x80000000 modulo 2^32. This is not FISTP and not a demonstrated C cast/truncation. Incoming x87 rounding/precision and exception state can affect evaluation/conversion; no FLDCW/FNSTCW establishes a local mode. Under appropriate precision/rounding and magnitude conditions it implements a rounded integer extraction, but the full input range and all FPU environments are not proven equivalent to a generic round function.

Addend additions are 32-bit ADD with wrap; no overflow test is performed. Treat the resulting bit patterns as signed DWORDs for subsequent JGE/JLE comparisons. They are added **after** biased conversion, not folded into the floating-point dot product. All coefficients are read before addend loads; status reset and saturation follow those loads. There are no calls, guards or out-of-range selector rejection.

**Saturation/status.** After status=0, an out-of-range first component assigns 0x81000000; an out-of-range second component ORs 0x80800000; an out-of-range third component ORs 0x00400000. Endpoints -32768 and 32767 pass unchanged. No command-dependent lower-bound change exists here. In particular, third-component saturation does **not** independently set bit 31. Raw globals retain the pre-saturation DWORD values even when saturated globals are clamped.

**Return carrier.** Full EAX, not AL or AX, is mechanically defined on every normal return. If the third raw post-addend DWORD is in signed range, EAX retains that third result at 0x460AED, even if components 1/2 saturated. If component 3 is out of range, EAX contains updated status at 0x460AC1 or 0x460AE1. No Boolean, uniform status return, uniform clamped-vector return or intentional API result is established. AL/AX are merely low subregister portions of that path-dependent DWORD. x87 temporaries and the three input values are popped on the normal path, preserving entry stack depth; x87 environment/status flags are not restored. Floating exceptions/traps are outside the normal-path guarantee.

## Seven independent ASM/xref evidence groups

1. **Command/bank selection:** 0x46086E–887 extracts the three two-bit fields, and 0x460881/884 use SHL 5 for two bank strides; 0x46088A/88F select absolute bases. `I/0x460860.readable/asm-001.txt:8–19`; addresses resolved by raw immediates in `bytes-001.txt:1–2` and compaction :17. Supports command-selected operation rather than a fixed camera transform.
2. **Signed vector inputs and shift-mode bit:** 0x46089A/A5/B4 and 0x4608C9/D5/E1 use MOVSX WORD for both input forms; TEST 0x80000 and three FMULs at 0x460903/90D/915 scale each operand. `asm-001.txt:20–25`, `asm-002.txt:1–24`; `common-compaction.md:20–21,25–26`. Establishes actual signed inputs and optional 12-bit fixed-point scaling.
3. **Name proof A — three matrix rows:** the x87 stack references and WORD offsets at 0x46091B–956, 0x460962–99E and 0x4609AA–9D6 implement three independent 3-term row dot products, not a componentwise multiply. `asm-002.txt:25`, `asm-003.txt:1–25`, `asm-004.txt:1–25`, `asm-005.txt:1`. This directly proves the matrix/vector portion of the proposed name, independently of any label or caller.
4. **Exact conversion, not cast:** FADD/FSTP-qword/MOV-low-DWORD/ADD 0x80000000 at 0x460958/95E/96A/97C, 0x4609A0/A6/B2/B6 and 0x4609D8/DE/E2/EA. `asm-003.txt:18–22`, `asm-004.txt:12–17`, `asm-005.txt:2–7`; `common-compaction.md:27–28`. Raw bytes contradict the historical 2^52+2^51 bias interpretation.
5. **Name proof B — independently selected addend:** CMP selector,3 at 0x4609EF and JZ 0x4609F9 bypass three DWORD reads; otherwise 0x4609FB–A07 performs three integer ADDs, with result stores 0x460A09/A0F/A15. `asm-005.txt:8–20`. Proves the optional selected add portion independently of the multiplication evidence.
6. **Saturation, status and mixed return:** signed JGE/JLE branches at 0x460A30/A46/A62/A80/AA4/AC4, component stores/status masks through 0x460AE4, three plain RETs. `asm-005.txt:21–25`, `asm-006.txt:1–25`, `asm-007.txt:1–25`, `asm-008.txt:1–2`. Establishes the signed-16 limits and path-dependent full EAX; does not prove named hardware flag identities.
7. **Caller corroboration:** nine code xrefs, sites 0x4607D5/E5/F5, 0x460805/815/825/835/845/855 (`metadata.json:170–224`). Byte-validated wrapper facts in `common-compaction.md:30–41` show differing immediate selector combinations, all with bit19 set; 0x460830/840 both push 0x480012. This independently supports reusable command execution, not a unique hardcoded model/camera operation. Hardware/GTE business identity remains LIKELY rather than proved by those immediates alone.

## Coverage and remaining questions

All 22 starts in `metadata.json:11–169` covered: 460860, 46089A, 4608C9, 4608F9, 460901, 46091B, 4609FB, 460A1A, 460A32, 460A44, 460A48, 460A5A, 460A60, 460A64, 460A7E, 460A82, 460A9C, 460AA2, 460AA6, 460AC2, 460AC6, 460AE2. Coverage includes both vector forms, both scaling paths, addend skip/use, every saturation branch and all three exits.

Open questions for the lead, not reasons to invent behavior:

- What upstream code establishes x87 precision/rounding and exception masks? Without it, exact rounding and out-of-range bit-extraction behavior remain environment-dependent.
- Do any callers use full EAX as a contractual return, or is it only incidental to a side-effect API? Known wrappers preserve EAX, but their consumers are not supplied.
- Which bank identities and named register meanings are validated independently of labels? Fourth-matrix-bank initialization and complete storage declarations are absent.
- Is this intended to emulate a hardware MVMVA subset, and what guarantees exist about supported command bits and operand magnitudes? No LM-bit handling, 44-bit accumulator-overflow handling or full hardware-equivalence assertion is justified by this function.
- A future source-level reconstruction must preserve the argument-home overwrite, binary64 spill conversion and memory-write ordering when observable; ordinary algebraic C with casts would not establish native equivalence.

No promotion, final §5.6, global type assignment, integration or runtime validation performed.
