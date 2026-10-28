# Semantic A — 0x460860

## Scope, provenance and coverage

- Mission `ff8-decomp-semantics-20261011-r01`; independent semantic A only, task `task_mv44ethq_004t_up1i5o`. No target C produced or consulted; no peer, review or classification output consulted.
- Authority: `inputs/ff8-decomp-semantics-20261011-r01/g04/0x460860.json`, chunk `[0x460860,0x460AEE)`, 654 bytes, 177 instructions. Root provenance/chunk read; complete ASM and bytes consumed through all eight `0x460860.readable/asm-*.txt` and both `bytes-*.txt` slices, plus complete manifest and metadata. The readable projection declares verbatim, unfiltered coverage.
- Original packet SHA256, verbatim from manifest: `9384e033a8c2529b83d45416bffb9fc86fec628fa40990f5f60610486739861a`. Input executable SHA256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; native export `2026-10-11T16:38:25.140966+00:00`, x86-32. Hashes are supplied evidence, not independently recomputed by this author.
- All 22 CFG block starts covered: `460860,46089A,4608C9,4608F9,460901,46091B,4609FB,460A1A,460A32,460A44,460A48,460A5A,460A60,460A64,460A7E,460A82,460A9C,460AA2,460AA6,460AC2,460AC6,460AE2`. All three returns covered. Frozen `code_targets` is empty; no call instruction in the leaf.
- Context used: supplied `common-compaction.md`, especially byte-validated constants/callers, not historical target reconstruction. This inherited reader checkpoint shows no historical target C; compaction line 57 explicitly warns that the later explorer history was exposed. The present analysis does not assert that the full discovery session was clean.

## Proposed identity and confidence

**Proposed name:** `transform_selected_s16_vector3_and_saturate`.

**Role — CERTAIN (mechanical):** decode selectors from one command DWORD; multiply a selected signed-16 three-vector by a selected signed-16 3×3 matrix, optionally scaling the input by 2^-12; convert each sum using the native x87/binary64 bias-bit procedure; optionally add a selected three-DWORD vector with 32-bit wrap; publish three raw DWORD results, three signed-16-range clamped DWORD results, and channel-specific saturation flags.

The name has two independent foundations: the nine coefficient/three-component multiplication dataflow (proof 3), and the separate signed-bound saturation/output stage (proof 6). It does not rely on the existing label.

**Interpretation — LIKELY:** this is a software implementation of a PlayStation-style GTE matrix/vector multiply-add command. The bit19 shift control, two-bit matrix/vector/addend selectors, raw and clamped result banks, and channel flag masks support that interpretation. **UNCERTAIN:** exact emulated-register names, fidelity to every hardware command bit, and whether each selected matrix/addend is specifically rotation, lighting, colour or camera translation. No hardware-equivalence claim or business-specific rename is warranted from this packet alone. `Gte_MVMVA` is explicitly label-only, not a proof.

## Inputs, outputs and ABI

### Explicit input and implicit state

- One DWORD at entry `[ESP+4]`, caller-cleaned convention compatible with cdecl. It is initially copied to EDI, then its stack home is repeatedly overwritten as signed integer scratch for `FILD`. Its final value is sign-extended matrix WORD at selected matrix base+0x0C, written at `0x4609C2`.
- Selector `m=(command>>17)&3`: signed-WORD matrix base `0x1CA927C + 0x20*m`; nine coefficients at offsets `0,2,4,6,8,0xA,0xC,0xE,0x10`, interpreted in consecutive rows. Bank stride is 32 bytes; read span is 18 bytes, not a demonstrated 32-byte structure.
- Selector `v=(command>>15)&3`: values `v=0..2` read signed WORDs at `0x1CA8A10+8*v`, offsets `0,2,4`; `v=3` reads signed low WORDs of DWORD locations `0x1CA8A34/38/3C`. Vector-slot stride is 8 bytes in the first case, 4 bytes in the feedback case.
- Selector `a=(command>>13)&3`: if `a!=3`, three DWORD addends at `0x1CA9290+0x20*a`, offsets `0,4,8`; `a=3` skips the loads and additions entirely. The computed fourth base is not dereferenced. DWORD addition uses native modulo-2^32 arithmetic; no signed-overflow trap or guard is present.
- Bit19 (`0x80000`) scales each loaded x87 vector component by the binary64 constant at `0xB69600`: bytes `000000000000303f`, exactly 2^-12. Other input bits have no observed effect in this leaf. The masked SAR selectors select the same bit fields regardless of the command's sign; this does not imply a signed command API.
- Implicit inputs include current global contents, usable x87 stack space and incoming x87 precision/rounding/exception controls. The leaf neither sets nor saves/restores the FPU control word.

### Numerical operation and ordering

For explanatory real-number dataflow only, row i forms `(m[i,2]*z + m[i,1]*y) + m[i,0]*x`; x/y/z are already scaled if bit19 is set. This identifies the transform, not an interchangeable ISO-C expression: retain the native FILD/FMUL/FADDP sequence and incoming x87 environment for equivalence.

Each row then performs x87 `FADD` of binary64 `0xB693D8`, bytes `0000008000003043`, value **2^52+2^31 = 4503601774854144**, followed by `FSTP` to a local binary64 slot. It extracts that slot's low DWORD and adds `0x80000000` modulo 2^32. This is **not FISTP**, a proven C cast, an unconditional truncation, or a rounding-independent signed conversion. FADD precision and the binary64 store rounding are externally controlled. In particular, do not substitute a rounded-integer expression across all unscaled signed-WORD product ranges without proving the bias/exponent range and control-word assumptions.

The three converted DWORDs are first stored to `0x1CA8A74/78/7C`. Only afterwards are optional addends loaded and integer additions applied; then the same raw globals are re-stored. All coefficient reads finish before these addend loads. These bases are positions in shared storage, not proof of disjoint abstract matrix/addend types. Feedback input at `0x1CA8A34/38/3C` is read before its later replacement; preserve that read-before-write relationship.

The final stage treats each resulting DWORD as signed int32 and clamps it to [-32768,32767], storing **full DWORDs**, not partial WORDs, to `0x1CA8A34/38/3C`. The raw globals remain the unclamped, possibly wrapped results. Status `0x1CA92F8` is cleared before comparisons, so no old status is accumulated. First-channel bound failure assigns `0x81000000`; second-channel bound failure ORs `0x80800000`; third-channel bound failure ORs `0x00400000`. Either sign of a channel's failure uses the same mask. Endpoints are inclusive and do not flag saturation. Third-channel failure alone does not set bit31 in this implementation.

### Return and other effects

- **Native EAX carrier is path-dependent, CERTAIN:** if the third raw result is within signed bounds, return EAX retains that result and stores the same DWORD to `0x1CA8A3C`. If it is outside bounds, EAX becomes the final status DWORD, after OR `0x00400000`, while `0x1CA8A3C` receives the bound. Earlier channels' saturation does not change this selection rule. No AL-only or AX-only return is established; AL/AX are merely low portions of the full EAX value. Do not describe the return uniformly as a success boolean, status, or clamped third component.
- EBX/ESI/EDI are restored; eight local bytes released on all paths; plain `RET` leaves the argument to the caller. EAX/ECX/EDX and arithmetic flags are not preserved.
- Under normal, non-exceptional execution, the leaf removes its three loaded vector entries and arithmetic temporaries, giving no net added x87 stack entries. It can affect x87 status/exception state; neither a clean starting stack nor disabled exceptions is established by the packet.
- Nine supplied byte-validated wrappers push an immediate, call this leaf, `POP ECX`, then return. Thus their cleanup loads this overwritten argument home into ECX, not the original command; their instruction sequence leaves EAX as above. There is only one explicit argument here, so no multi-argument right-to-left ordering should be invented.

## Eight supporting proofs

Paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g04/`.

1. **Command-controlled bank selection:** `0x46086E–0x46088F` SAR/AND extracts three independent two-bit selectors; SHL 5 selects 32-byte banks. `0x460895/898` chooses the vector source, and `0x4609EF/9F9` controls addend omission. Sources: `0x460860.readable/asm-001.txt:8–21`, `asm-005.txt:8–17`, direct addresses corroborated by `bytes-001.txt:1–5,13–14`.
2. **Signed vector and fixed-point scaling:** `MOVSX word` at `0x46089A/A5/B4` or `0x4608C9/D5/E1`, then integer FILD; TEST `0x80000` and three FMULs `0x460903/90D/915`. Sources: `asm-001.txt:22–25`, `asm-002.txt:1–24`; exact 2^-12 constant supplied at `common-compaction.md:25–26`.
3. **Independent transform/name proof:** coefficient loads and x87 stack operands at `0x46091B–0x4609D6` implement the three row products with offsets `[0,2,4]`, `[6,8,A]`, `[C,E,10]`. Three FADDP pairings accumulate each row. Sources: `asm-002.txt:25`, all of `asm-003.txt`, `asm-004.txt`, `asm-005.txt:1`. This is matrix×vector dataflow, independently of any label or caller name.
4. **Native conversion, not a cast:** bias FADD/FSTP/low-DWORD/add sequence at `0x460958/95E/96A/97C`, `0x4609A0/A6/B2/B6`, `0x4609D8/DE/E2/EA`. Sources: `asm-003.txt:18–22`, `asm-004.txt:2,12–17`, `asm-005.txt:2–7`; validated bias bytes/value at `common-compaction.md:27–28`. Historical 2^52+2^51 prose conflicts with the supplied byte evidence and is rejected.
5. **Multiply-add and two result stages:** `0x460982/9C6/9F4` stores pre-add converted rows; `0x4609FB–0x460A15` loads three addends and re-stores wrapped sums. Sources: `asm-004.txt:3,21`, `asm-005.txt:10–20`. Translation/addend belongs after conversion, not inside the floating expression.
6. **Independent saturation/name proof:** `0x460A1A/2B` sets signed -32768/32767 limits; JGE/JLE chains at `0x460A29–0x460AC4` clamp all three channels and update distinct masks after status clear. Sources: `asm-005.txt:21–25`, all of `asm-006.txt`, `asm-007.txt:1–18`. Signed saturation is a separate stage from the transform, supporting the second part of the proposed name without circular inference.
7. **ABI and return counterexample:** input at `0x460866`, repeated writable argument home through `0x4609C2`, and the divergent full-EAX paths ending `0x460AC1/AE1/AED` establish caller cleanup and nonuniform carrier. Sources: `asm-001.txt:1–5`, `asm-004.txt:20`, `asm-007.txt:1–25`, `asm-008.txt:1–2`. No uniform status-return prototype is justified.
8. **Independent neighbourhood support for command dispatch:** frozen code xrefs `0x4607D5/E5/F5,0x460805/815/825/835/845/855`, `metadata.json:170–224`; supplied offline byte verification of nine PUSH/CALL/POP/RET wrappers, `common-compaction.md:30–41`, with different selector immediates and bit19 set in all nine. This reinforces selector-driven operation, but does not prove exhaustive callers or unused unscaled paths.

## Open questions and limits

1. Which upstream writer populates each selected matrix/addend bank, and what are their business identities? The byte-addressed layout is established; typed objects and meanings are not.
2. What x87 control word and stack occupancy apply at actual callers? Rounding/precision/exception equivalence requires that evidence, not generic compiler or platform defaults.
3. Are arbitrary command inputs possible, especially bit19-clear inputs and matrix selector3? The nine known wrappers only witness bit19-set execution. Unscaled large products can change the bias procedure's numerical behaviour; no guards were invented.
4. Is native EAX deliberately consumed anywhere, or incidental? Wrappers do not establish a source-level return contract; downstream consumers are not frozen here. The overwritten argument-home/ECX effect should also be preserved by any ABI-sensitive reconstruction.
5. Which GTE command bits and overflow rules are intended but omitted? Observed clamp/flag masks are certain; complete hardware conformance is not.
6. Hashes and constant/caller offline validation are supplied by the lead's factual packet. No independent hash computation, compilation, test, native differential or live observation performed. A new read of the mission CONTRACT outside `inputs/` was permission-rejected; no retry or alternate access attempted. The explicit current role/output contract suffices for this bounded semantic deliverable.

No promotion, final §5.6, IDB/Git/ledger/registry/configuration/live action or delegation performed.
