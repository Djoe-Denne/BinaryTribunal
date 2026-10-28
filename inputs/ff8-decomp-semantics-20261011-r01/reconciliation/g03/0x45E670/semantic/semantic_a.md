# 0x45E670 — independent semantic A

## Boundary and coverage

- Mission `ff8-decomp-semantics-20261011-r01`, semantic A only. No target C, other author, classifier, review or verdict consulted.
- Authority: frozen native packet SHA-256 `06476e1094d6963e3532e19496a495b87b348503b4e79216e537b193aa571774`. Read its complete verbatim projection under `inputs/ff8-decomp-semantics-20261011-r01/g03/0x45E670.readable/`: manifest lines 1–40, asm-001 lines 1–25, asm-002 lines 1–25, asm-003 lines 1–25, asm-004 lines 1–17, bytes-001 lines 1–14, metadata lines 1–188. All 92 instructions, 426 bytes in the single half-open chunk `[0x45E670,0x45E81A)`, and all 15 CFG blocks covered.
- Common compaction read completely (lines 1–56), declared SHA-256 `9959dc7995e01db21518f4c15252096543ca53ec042a342d705dce6badf71572`. Manifest hashes are supplied provenance, not independently recomputed here.
- No external discovery, compile, test, IDB change or promotion performed. References below are relative to that readable directory unless explicitly marked `common-compaction.md`.

## Role, proposed name and confidence

**Proposed name:** `Cross3Float_Scale4096_ClampS16Globals`.

**CERTAIN:** mechanically implements the three ordered product differences of `D × (4096 I)`, converts each through a binary64 bias/low-word extraction sequence, stores three raw 32-bit words, then writes three signed-16-range clamped values back into the input register globals while recording component clamp bits.

**LIKELY:** an emulated geometry-register cross-product/outer-product operation. Shared register addresses and neighbourhood in the supplied compaction corroborate this interpretation, but neither the old function name nor historical C/prose is evidence for the proposed name. The name's independent supports are the cyclic product-difference instruction groups (proof 2) and explicit signed bounds/stores (proof 5), with scale 4096 proved separately by proof 1.

**UNCERTAIN:** caller-level purpose, intended source ABI return type, hardware GTE instruction identity/conformance, and unconditional equivalence to a mathematical rounded cross product for every FP environment or exceptional operand. No conflicting native instruction sources identified.

## Inputs, arithmetic and outputs — mechanical contract

There are no stack-argument reads or incoming GPR data dependencies. The routine reserves eight scratch bytes and returns with plain `RET`, restoring ESP. This is compatible with a zero-argument cdecl routine, but a specific source calling-convention spelling is not uniquely proved by this leaf. No outgoing calls or pushed arguments exist. EAX/ECX/EDX are scratch; EBX/ESI/EDI/EBP are untouched.

| Input | Width and interpretation |
|---|---|
| `0x1CA8A34`, `0x1CA8A38`, `0x1CA8A3C` | Low word read and sign-extended to 32 bits; old high words ignored. Let these be `I1,I2,I3`. All three are loaded before any result writes. |
| `0x1CA923C`, `0x1CA9244`, `0x1CA924C` | Binary32 memory operands, respectively `D1,D2,D3`; each reloaded twice, not snapshotted once. Meaning of camera-labelled names is not assumed. |
| `0xB693D8` | Binary64 operand added to each difference; value `2^52 + 2^31` is supplied secondary byte-validation context, not bytes included in this function chunk. |
| x87 control/status/tag/stack state | Ambient precision control, rounding control, exception masks and available stack entries affect execution; routine does not initialize or change the control word. |

Integer SHL operations are 32-bit with count 12. Given the initial signed-16 inputs, `4096 Ii` lies in `[-134217728,134213632]`; no input shift loses meaningful signed bits. FILD interprets the staged dword as signed, not unsigned.

Track the x87 stack, with `J1,J2,J3` the FILD values of `4096 I1,I2,I3`. The product differences before biasing are, in execution order:

1. `D2*J3 - D3*J2`;
2. `D3*J1 - D1*J3`;
3. `D1*J2 - D2*J1`.

Each expression denotes the actual separately executed FMUL and FSUBP operations, subject to ambient x87 arithmetic precision/rounding, not a reassociated real-number formula or fused operation. For each difference, FADD reads the binary64 bias, FSTP writes a **binary64** scratch representation, MOV extracts its low 32-bit word, and ADD `0x80000000` wraps modulo `2^32`. Call the resulting words `R1,R2,R3`. This is a representation trick, not FISTP and not an unconditional C float-to-int cast. Under suitable finite range and FP settings it realizes integer rounding; the exact bit-level sequence remains the contract outside those conditions.

The raw words are written in order to `0x1CA8A74`, `0x1CA8A78`, `0x1CA8A7C` (stride **4**, three dword stores). They are then interpreted as signed 32-bit values for bounds checks against `-32768` and `32767`. For each component, equality is in range. A value below the minimum becomes dword `0xFFFF8000`; above the maximum becomes dword `0x00007FFF`; otherwise the original raw dword is copied. Stores are dword-sized even though the range is S16. They overwrite `0x1CA8A34/38/3C`, also stride **4**, not packed stride 2. Raw results are retained separately; later clamp decisions do not recompute them.

`0x1CA92F8` is first cleared, then records clamp events:

- component 1 outside bounds: set `0x81000000`;
- component 2 outside bounds: OR `0x80800000`;
- component 3 outside bounds: OR `0x00400000`.

Thus final bits are the union of those event masks. In particular component 3 alone produces `0x00400000`, **not** a top-bit summary. No sign-dependent flag distinction is made. These literal encodings must not be replaced by assumed hardware GTE flag rules.

### Return width and residual register value

No AL-only or AX-only write exists. All arithmetic/mask writes in EAX are full 32-bit writes. At each normal return:

- If component 2 or component 3 was clamped, EAX equals the final flag word.
- Otherwise EAX remains `R1`, including when component 1 was clamped; that first clamp changes memory with MOV-immediate but leaves EAX unmodified.

AL and AX are consequently only the low 8/16-bit views of this path-dependent EAX. It is incorrect to assert a uniform status, Boolean, saturated first component, or final FLAG return. A source `void` declaration is plausible, but caller return use is not present in the gel and cannot prove it. ECX and EDX retain `R2,R3`; epilogue ADD ESP changes EFLAGS.

### x87 environment and side effects

Bytes `D9 05` identify the three input loads as m32-real; `DC 05` identifies the bias FADD as m64-real; `DD 5C 24 00` identifies scratch FSTP as m64-real (`bytes-001.txt:3–6`). There are three FILD pushes plus six FLD pushes, balanced by three FSUBP pops, three scratch FSTP pops and three FSTP ST pops. On normal execution, initial stack depth is restored and older entries survive below the temporaries. Maximum additional occupancy is five entries. Stack tags/top, condition/status bits and sticky exception indicators can change; one cannot promise an unchanged whole FPU environment. Masked/unmasked invalid, denormal, overflow, underflow, precision or stack exceptions may affect completion/results. No control-word save/change/restore is present. No FP scaling down by 4096 is performed after the cross-product differences.

Observable normal global write order: clear flag; raw component 1; raw component 2; raw component 3; clamp/store component 1; clamp/store component 2; clamp/store component 3. Second/third clamp branches load FLAG, store their clamped component, OR EAX and store FLAG. Global scratch-register usage is not reentrant/thread-safe absent caller-side synchronization. No allocation, I/O, RGB FIFO writes, pointer parameters, loop or indirect control transfer appears.

## Eight independent instruction/xref evidence groups

1. **Signed inputs and exact scale:** `0x45E673/67A/681` MOVSX word, `0x45E688/69D/6A8` SHL 12, `0x45E699/6A4/6AF` FILD dword (`asm-001.txt:2–14`). Establishes signed low-word input and scale without naming assumptions.
2. **Cross-product orientation:** `0x45E6B3–6C3`, `0x45E6CF–6E8`, `0x45E6FF–71B` load/multiply/subtract in the cyclic order above (`asm-001.txt:15–25`, `asm-002.txt:1–15`). Stack indexing proves `D × J`, not `J × D`, and supplies the first name proof.
3. **Representation conversion, not integer instruction conversion:** FADD/FSTP/low-dword ADD at `0x45E6C5/6CB/6DF/6E3`, `0x45E6EF/6F5/6F9/70F`, `0x45E71D/723/727/72D` (`asm-001.txt:20–21`, `asm-002.txt:1–20`, `bytes-001.txt:3–7`). No FISTP or post-result SAR.
4. **Separate raw outputs:** dword stores `0x45E6EA`, `0x45E715`, `0x45E73A` to `0x1CA8A74/78/7C` (`asm-002.txt:4,14,23`). Their earlier placement proves raw output preservation before clamping and numeric stride 4.
5. **Signed saturation:** comparisons/JGE/JLE at `0x45E733/740/758/75D`, `0x45E77A/780/79D/7A3`, `0x45E7C6/7CC/7EB/7F1`, with extreme or raw stores (`asm-002.txt:21–25`, `asm-003.txt:1–25`, `asm-004.txt:1–17`). Byte opcodes `7D/7E` confirm signed conditions. Independent second name proof; correct JLE condition is ZF=1 **or SF!=OF**, notwithstanding common informal unsigned confusion.
6. **Literal per-component flags:** clear at `0x45E68F`; first MOV-mask `0x45E742/75F`; second OR-mask `0x45E791/7B4`; third OR-mask `0x45E7DD/802` (`asm-001.txt:7`, `asm-002.txt:25`, `asm-003.txt:5,13,20`, `asm-004.txt:3,11`). Component-3-only top bit remains clear.
7. **Return/leaf/coverage:** three ADD ESP,8 / RET pairs at `0x45E7E7/7EA`, `0x45E80C/80F`, `0x45E816/819`; EAX loads only on second/third clamping branches (`asm-003.txt:11,18`, `asm-004.txt:1–17`). All terminal CFG blocks match, and metadata `code_targets=[]` (`metadata.json:86–117,186–187`).
8. **Real callers but no caller-use proof:** frozen metadata lists 11 near-call sites in nine functions, including two each in `0x402620` (`0x4026D4/277E`) and `0x619B70` (`0x61A05A/A7A6`), plus `0x549E3C`, `0x668293`, `0x671741`, `0x676121`, `0x6B722A`, `0x6C91BA`, `0x7041EA` (`metadata.json:118–184`). This establishes reuse, not source signature or business purpose.

## Source discrepancies, hypotheses and open questions

- `common-compaction.md:39` describes consumed `0x1CA923C/9244/924C` as the last float of each 0xC-stride row. Its own listed rows contradict that: they are respectively the **last, middle, first** entries of rows starting `0x1CA9234/9240/924C`. Native input addresses come directly from instruction bytes; row/axis semantics remain secondary. Inputs have address stride **8**, unlike either the suggested row stride 12 or dword output stride 4.
- The compaction warns of historical bias prose `2^52+2^51` versus byte-validated `2^52+2^31` (`:40,48`). Use the latter only as supplied secondary constant context; exact constant bytes at VA `0xB693D8` are not among this target's bytes. No historical C was opened or adopted; the compaction's reference to its existence is not a proof.
- What x87 precision/rounding/masks and available stack state are guaranteed by callers? What ranges, NaNs/infinities/denormals can the float globals contain? These determine how far one may simplify the bias conversion without changing observable behaviour.
- Do callers consume EAX/AL/AX or only the memory register outputs? Caller-site code is not projected; source return type remains unknown.
- Are the three float globals constrained to a matrix diagonal or some other geometry data? The label `Cam` and neighbourhood are hypotheses, not direct evidence of a camera update.
- Is exact GTE hardware behaviour intended, especially the missing top-bit summary for third-component-only saturation? Literal software flags are certain, hardware equivalence is not asserted.
- Output hash not computed; supervisor may compute it. This is a semantic deliverable only, not §5.6 or final promotion.
