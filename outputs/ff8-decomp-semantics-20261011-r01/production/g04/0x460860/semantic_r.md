# 0x460860 — final semantic reconciliation R

## Scope, provenance and verdict

Mission `ff8-decomp-semantics-20261011-r01`, task `task_mv44vzpn_00i7_l31rn6`; **semantic volet only**. This is the final semantic contract, not a C-volet reconciliation or an executable replacement. Only the supplied semantic reconciliation projection was consulted, plus mandatory agent instructions. No peer/other-volet output, historical reconstruction, score, index, IDA rediscovery or live access was used.

Input prefix **I**: `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g04/0x460860/semantic/`.

- A: `ses_ed3e73966ffeQHu7PQrUtpT3Sk`, `openai/gpt-6.1-sol`, `high`; frozen `semantic_a.md`, SHA256 `e01fcd349246d475dfaa1032b3d0c33fe41d917414a255452a23527125d57efe`.
- B: distinct session `ses_ed3e73790ffebv63E45zxfVjTB`, same model/variant; frozen `semantic_b.md`, SHA256 `5a7beb92d6129d48a022eb913b3e311862fd86953747710c66ceec0f0faa356d`.
- Original packet SHA256 `9384e033a8c2529b83d45416bffb9fc86fec628fa40990f5f60610486739861a`; common compaction SHA256 `1ffd99c0ab16a51b4b5c26f906c3ff61d657fd111e6c8720353e656c88add668`.
- Native x86-32 executable SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`.

Both authors and their provenance are present. Packet/compaction/slice/metadata hashes agree where repeated between the reconciliation and native manifests and author statements; no manifest inconsistency was found. These are **supplied hashes**, not independently recomputed file hashes: no permitted raw-file hash primitive was available. Parent retains byte-exact hash validation. The common compaction discloses later discovery-history exposure; A/B report an earlier reader checkpoint, while the parent attests independent deposited sessions. R did not inspect their histories or claim to independently audit that checkpoint.

Read the original packet's provenance, complete chunk hex, CFG/xrefs and counts; its long assembly JSON line is reader-truncated, so the assembly field was consumed completely through all eight verbatim native ASM slices. Both native byte slices and the complete native metadata/native manifest were read. Coverage is one chunk `[0x460860,0x460AEE)`, **654 bytes, 177 instructions, 22 CFG blocks, all three RETs**. There is no call instruction.

**Verdict:** mechanical operation **CERTAIN from native dataflow**, software GTE-style MVMVA interpretation **LIKELY**, exact hardware equivalence and business register/bank names **UNCERTAIN**. No unresolved mechanical A/B conflict remains; no final native promotion or §5.6 sign-off is claimed.

**Recommended domain-neutral name:** `transform_selected_s16_vector3_add_and_saturate`.

The name rests on independent proofs: three three-term row dot products (anchor 3), independently selected post-conversion integer addends (anchor 5), and separate signed-range saturation (anchor 6). A `Gte_` prefix is an optional LIKELY domain annotation, not part of the CERTAIN name.

## Convergence/divergence matrix — adjudicated against native instructions

| Topic | A / B | R decision and native basis |
|---|---|---|
| Mechanical role | Agree on selectable signed matrix/vector transform, optional scale/add, two result banks and flags | Accept only after tracking MOVSX/FILD, x87 stack operands, ADD and signed branches; anchors 1–6, not a consensus proof. |
| Proposed name | A emphasizes transform/saturation; B emphasizes GTE matrix-vector-add | Choose neutral name retaining all three demonstrated stages. GTE encoding/register analogy is LIKELY, exact hardware identity is not proved by labels or these callers. |
| Constant/bias | Both reject inherited contradictory prose and use 2^-12, 2^52+2^31 | Accept supplied byte-validated constant evidence, corroborated by native absolute operands. Reject 2^52+2^51, cast, FISTP, unconditional truncation, and control-word-independent rounding. Anchor 4. |
| Widths and strides | Agree: signed WORD inputs, full DWORD results, 32-byte banks | Confirm from MOVSX and opcode widths/immediates. A bank stride is not a structure-size proof; vector selector3 reads only each DWORD's low WORD. Anchors 1–3, 6. |
| Return | Agree on path-dependent EAX | Confirm every exit separately. No uniform status/Boolean/clamped-result return; no AL/AX-only contract. Anchor 7. |
| ABI/home slot | Agree that entry argument is overwritten and wrappers POP ECX | Confirm actual scratch MOVs and plain RET. The last home-slot value is sign-extended matrix offset 0x0C, not the command. Anchors 3, 7–8. |
| Floating operation order | Both give mathematical row order, warning against reassociation | Retain exact native FMUL/FADDP/FADD/FSTP sequence as the normative numerical operation; mathematical notation is explanatory, not a replacement. Anchors 3–4. |
| Historical-exposure/provenance claims | Both qualify checkpoint versus later discovery exposure | Preserve the qualification. Distinct manifest sessions are evidence of recorded provenance, not an independent history audit or model diversity. No forbidden history read performed. |

### Common-error checks and refinements

Agreement alone was not accepted. In particular, independently checked: signed endpoints; third-channel mask lacking automatic bit31; integer wrap before saturation; early raw writes; signed low-WORD feedback; true binary64 bias; selector3 addend bypass; all return carriers; and argument-home mutation.

Two ordering details require greater precision than a high-level stage summary:

1. Coefficients are **not read row-by-row as one matrix snapshot**. The native read order is offsets `4,2,0,A,8,10,6,E,C`. The first raw result store precedes the last two coefficient reads. All nine reads do precede addend loads. Do not preload a whole matrix or all constants and claim identical access/exception ordering.
2. Third-channel lower saturation writes the bound at `0x460AAB` **before** the final status store at `0x460AB8`; upper saturation writes status at `0x460AD2` **before** the bound at `0x460AD7`. A uniform clamp-then-flag implementation would obscure that native difference. Second-channel failures read status, write their bound, then store ORed status; first-channel failures write status before their bound.

These are contract refinements, not an assertion that either semantic author supplied an incorrect executable C reconstruction.

## Final semantic contract

### Input, storage and ABI

One command DWORD is read from entry `[ESP+4]`. EBX/ESI/EDI are saved/restored, eight local bytes are allocated/released, and each exit uses plain RET. This is **caller-cleaned, cdecl-compatible**, but not proof of a specific original-language prototype. With one explicit argument there is no multi-argument ordering issue to invent. EAX/ECX/EDX are volatile; this function does not promise preserved arithmetic flags.

Selectors are the command bit slices below. Native SAR followed by AND3 gives exactly these nonnegative selectors even if command bit31 is set; no signed-command API follows from SAR. Fixed shift counts are 13, 17, 15 and 5, not variable-shift cases.

| Item | Exact input/storage contract |
|---|---|
| Matrix selector | `m=(command>>17)&3`; base `0x1CA927C + 0x20*m`, nine **signed WORDs** at `0,2,4 / 6,8,A / C,E,10`. Bank stride32, row stride6, accessed span18 bytes. All four selectors are accepted; selector3 is not guarded out. |
| Vector selector | `v=(command>>15)&3`. Selectors0–2 read signed WORDs at `0x1CA8A10+8*v`, offsets0,2,4. Selector3 reads signed **low WORDs** at `0x1CA8A34/38/3C`, stride4; their upper halves are ignored. |
| Scale bit | Bit19 selects multiplication of each vector operand by the binary64 memory value at `0xB69600`, supplied bytes `000000000000303f` = **2^-12**. No other command bit affects scaling/bounds here. |
| Addend selector | `a=(command>>13)&3`; base `0x1CA9290+0x20*a`. Only a=0–2 read DWORDs at offsets0,4,8. a=3 bypasses reads/additions entirely; not a loaded zero vector. |
| Raw result bank | Full DWORDs at `0x1CA8A74/78/7C`; written individually after conversion and overwritten with post-addend results when enabled. |
| Saturated result bank | Full DWORDs at `0x1CA8A34/38/3C`; signed values in [-32768,32767], including sign-extended negative representations. |
| Status | Full DWORD at `0x1CA92F8`; cleared after raw/add stages, then conditionally assigned/ORed. |

These are byte-addressed accesses, not promoted struct declarations or named rotation/light/colour/translation registers. Feedback inputs are read before saturated outputs replace them. The function does not create a transactional snapshot of shared state or establish cross-thread atomicity. No `restrict`/no-alias assumption or additional guards belong in a reconstruction.

The command's caller-owned stack home is repeatedly written as signed-DWORD FILD scratch. Final home contents are the sign-extended WORD from selected matrix base+0x0C, written at `0x4609C2`; the original command was retained long enough in EDI for the scale test. Byte-validated supplied wrapper sequences use POP ECX for cleanup, so their ECX receives that overwritten home DWORD.

### Numerical and access-order semantics

The vector read/FILD sequence loads x,y,z and leaves the x87 stack top ordered z,y,x. Scaling, if selected, uses FXCH/FMUL to process x, then y, then z, restoring that order. Matrix WORDs are sign-extended to DWORD scratch and loaded with signed-DWORD FILD, not unsigned conversion.

For explanatory mathematical dataflow, each row forms `(m_i2*z + m_i1*y) + m_i0*x`, with x/y/z already optionally scaled. **Normative equivalence is the native instruction sequence:** multiplication, paired FADDP additions, bias FADD and binary64 FSTP in the supplied order, including interleaved coefficient loads, home-slot writes and raw-result writes. Do not reassociate, introduce compiler-generated rounding helpers, or replace scaling with an integer SAR.

Each row's conversion is:

- FADD binary64 memory at `0xB693D8`, supplied bytes `0000008000003043`, **2^52+2^31 = 4503601774854144**;
- FSTP qword to the eight-byte local spill;
- read the spill's low DWORD and ADD `0x80000000` modulo 2^32.

The leaf neither establishes nor saves/restores x87 precision/rounding/exception controls. FADD and the binary64 store are environment-sensitive. No universally equivalent ISO-C cast, round/trunc function or exact fixed-point integer conversion is proved across the full unscaled input range. Constants are read at the actual FMUL/FADD sites, not locally initialized magic-number substitutions justified for mutable storage.

Raw1 is written at `0x460982`, raw2 at `0x4609C6`, raw3 at `0x4609F4`. Original vector operands and all x87 temporaries are popped on a normal completed path; the peak is five additional stack entries above the incoming x87 depth. Existing deeper entries are left underneath. Stack overflow/underflow and enabled floating traps are not silently excluded by a guard. This function can change x87 status/exception state; it does not restore the environment.

When addends are selected, DWORD loads occur in order offsets0,4,8 at `0x4609FB/9FD/A02`, with integer additions interleaved, followed by raw stores in channel order at `0x460A09/A0F/A15`. Each ADD wraps modulo 2^32; there is no overflow guard or floating addend stage. Interpret the resulting DWORD bit patterns as signed int32 only for subsequent signed comparisons.

### Saturation, status and native return carrier

Status is first set to zero. Each signed result is compared with -32768 and 32767 using JGE/JLE. Endpoints pass unchanged and do not flag. Raw globals remain the post-conversion, optionally wrapped-addend values regardless of saturation.

| Channel | Lower/upper bound failure effect |
|---|---|
| 1 | Assign status `0x81000000`, then store its bound to `0x1CA8A34`. |
| 2 | Read status, store its bound to `0x1CA8A38`, OR `0x80800000`, store updated status. |
| 3, lower | Read status into EAX, store -32768 to `0x1CA8A3C`, OR `0x00400000`, store updated status amid epilogue. |
| 3, upper | Read status into EAX, OR `0x00400000`, store updated status amid epilogue, then store 32767 to `0x1CA8A3C`. |

In-range channels store their full DWORD unchanged to the saturated bank. A third-channel failure alone sets `0x00400000`, **not** bit31. The lower bound is never changed by another command bit. Observed bit masks do not prove hardware flag names or comprehensive GTE overflow rules.

Full **EAX** is path-dependent on normal return:

- Third post-addend raw result in range: EAX equals that signed result's DWORD bit pattern, also stored at `0x460AE4`, regardless of earlier-channel failures; RET `0x460AED`.
- Third result below/above bounds: EAX equals the final status including `0x00400000`; RET `0x460AC1`/`0x460AE1`.

There is no partial-register result assignment: AL/AX are only the low parts of this full EAX. No uniform success Boolean, status return, clamped third-component return, or deliberate source-level return type is established. Wrapper preservation of EAX does not demonstrate consumer intent.

## Eight exact ASM/xref anchor groups

All paths use prefix I; numeric instruction addresses are authoritative. ASM fields containing labels/comments are not semantic proof.

1. **Selectors/strides:** `0x46086E–0x460898`, `native-asm-001.txt:8–21`; raw base immediates `7c92ca01` and `9092ca01` in `native-bytes-001.txt:2`. Proves three two-bit selectors and 32-byte matrix/addend bank strides.
2. **Signed vectors/scaling:** `0x46089A/A5/B4`, `0x4608C9/D5/E1`, `0x4608F9`, `0x460903/90D/915`; `native-asm-001.txt:22–25`, `native-asm-002.txt:1–24`. FMUL operands corroborated by `native-bytes-001.txt:6`; constant byte check supplied in `common-compaction.md:25–26`.
3. **Transform/name proof:** coefficient load order and stack-index FMUL/FADDP at `0x46091B–0x4609D6`; `native-asm-002.txt:25`, all `native-asm-003/004.txt`, `native-asm-005.txt:1`. Independently proves three row dot products and final home-slot overwrite `0x4609C2`.
4. **Exact conversion:** `0x460958/95E/96A/97C`, `0x4609A0/A6/B2/B6`, `0x4609D8/DE/E2/EA`; `native-asm-003.txt:18–22`, `native-asm-004.txt:2,12–17`, `native-asm-005.txt:2–7`. Native `DC05 D893B600` plus qword-store opcodes corroborate the memory-bias/spill operation; constant byte check supplied in `common-compaction.md:27–28`.
5. **Independent add/name proof and raw stores:** `0x4609EF–0x460A15`, `native-asm-005.txt:8–20`; preceding stores `0x460982/9C6`, `native-asm-004.txt:3,21`. Proves addend bypass versus three wrapped integer additions after conversion, not floating multiply-add.
6. **Signed saturation/status/name proof:** `0x460A1A–0x460AA4`, `native-asm-005.txt:21–25`, all `native-asm-006.txt`, `native-asm-007.txt:1`. Signed branches and exact masks also visible in `native-bytes-001.txt:15–19`; no third-channel bit31 synthesis.
7. **Return and asymmetric final store order:** `0x460AA6–0x460AED`, `native-asm-007.txt:2–25`, `native-asm-008.txt:1–2`, final bytes in `native-bytes-001.txt:19–20` and `native-bytes-002.txt:1`. Three plain RETs, path-dependent full EAX, lower versus upper status/output ordering.
8. **Caller corroboration, not exhaustive consumer proof:** native inbound sites `0x4607D5/E5/F5,0x460805/815/825/835/845/855`, `native-metadata.json:170–224`. Supplied byte-validated PUSH/CALL/POP ECX/RET and immediate selector facts in `common-compaction.md:30–41`; all nine have bit19 set. These facts support reusable command execution, not full hardware identity or a return API.

## CFG coverage and residual limits

All 22 block starts are accounted for: `460860,46089A,4608C9,4608F9,460901,46091B,4609FB,460A1A,460A32,460A44,460A48,460A5A,460A60,460A64,460A7E,460A82,460A9C,460AA2,460AA6,460AC2,460AC6,460AE2`. This includes both input forms, scale/no-scale, addend/no-addend, every signed bound path and all epilogues. `code_targets=[]` agrees with the absence of CALL in all 177 instructions; it is not used to infer absence of external callers.

Residual **UNCERTAIN** items are x87 caller control word/exception masks/stack occupancy; reachable arbitrary commands and bit19-clear numerical range; bank initialization/business names; intended GTE hardware subset and overflow fidelity; and whether any downstream consumer intentionally uses EAX. Supplied wrappers do not answer these questions. No invented clamp mode, accumulator-overflow logic, selector rejection, calls or environmental normalization was added.

No compilation, tests, native differential execution, hash recomputation, IDB/Git/ledger/registry/config changes, live action or delegation was performed. Parent owns final hashes, §5.6 native checks, promotion and integration.
