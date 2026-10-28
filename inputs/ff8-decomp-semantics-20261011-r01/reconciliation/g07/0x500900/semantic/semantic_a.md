# 0x500900 — independent semantic A

## Scope and provenance

Mission `ff8-decomp-semantics-20261011-r01`, semantic A only; no C, peer output, classifier, review or future verdict consulted. Examined common-compaction.md, readable/manifest.json, metadata.json, all nine ASM slices and both byte slices. Coverage: all 206 instructions, both half-open chunks `[0x500900,0x5009A1)` and `[0x5005A0,0x50081F)`, and all 19 exported CFG blocks. The jump at 0x50099C joins the chunks; the actual return is 0x50081E. No execution, compilation, differential test or live observation performed.

Source prefix below: `inputs/ff8-decomp-semantics-20261011-r01/g07/`; `R` denotes `0x500900.readable/`. Original packet hash (manifest, not independently recomputed): `0c68458ed2dd63fc4969914f650dfd11176145e5b11dda0e4ce2d917cff21590`; common compaction hash: `6925ce258d423a1b3b9e352cad9925a19202940e72df0121a3ac4681ed4f1fff`. Native executable SHA256: `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, 32-bit, export 2026-10-11T16:38:25.140966+00:00. Embedded names/comments are not evidence of purpose.

## Proposed role and confidence

**Proposed name: `BattleFrame_ServiceTasksAndPreparePresentationBuffers`. Overall LIKELY.**

Mechanical role is CERTAIN: service several global-held objects through one repeated helper; retain two low-byte results and conditionally clear one global-held object; call a fixed sequence of other helpers; perform flag-selected buffer/environment work and signed-word parameter calls; finally select packet cursor/end and ordering-buffer base for the current low-byte index.

Battle/presentation interpretation is LIKELY, supported by the frozen surrounding scheduling/TIM documentation and battle-director xrefs, not by the old target label. Two independent naming foundations are (1) six calls to the same object-service helper, with global heads and callback behavior documented in common-compaction:39-40, and (2) explicit double-buffer-like address selection and packet-range preparation at 0x5007A9–0x500819, independently of those calls. The wider rendering/camera interpretation has additional flag-selected helper/address evidence below. The more specific claims “GF input processing”, “battle action execution”, and “texture uploader as the entire role” remain UNCERTAIN and are not included in the name.

## Contract: inputs, outputs, effects

### Inputs

- No explicit caller stack argument is read in either chunk. Apparent zero-explicit-argument entry; unknown helpers may consume globals or implicit state, so this is not proof of every callee prototype.
- DWORD global-held objects at `0x1D96AA4`, `0x1D96A8C`, `0x1D96AA0`, `0x1D96AAC`, `0x1D96AA8`, `0x1D96A94`, read in that order for helper `0x508420`. Only the `0x1D96AAC` call is skipped when its global is zero; the others are called without a local null guard.
- Low BYTE of `0x1D96A9C`: masks `4`, `8`, `0x80` control separate work. Mask 4 is re-read after a helper, not cached for the entire function.
- DWORD `0x1D96A80`, repeatedly read and masked to `0xFF`, supplies the buffer index. Some operations use `i XOR 1`; final packet/ordering-buffer preparation uses `i`. No local restriction to `i in {0,1}` and no write toggling this global exists.
- DWORD handle at `0xB8A3E4`; DWORD ordering-buffer pointer at `0x1D8E04C`; BYTE `0x1D8E03A`; signed WORDs at `0x1D8E038`, `0x1D8E03C`, `0x1D8E03E`; DWORD gate at `0x1CFF834`; DWORD pool pointers at `0xB6D094` and `0xB6D070`.

### Direct writes and return

- Store **AL**, not full EAX, from the third and fifth `0x508420` calls to BYTEs `0x1D96A90` and `0x1D96A88`. Conversely, completion of the optional `0x1D96AAC` object is tested using **full EAX**; only a zero EAX is written back to clear that DWORD. A zero AL with nonzero upper EAX does not clear it.
- With the relevant mask-4 path, BYTE `0x1D8E03A` is left unchanged when zero; unsigned values above `0x10` are reduced by `0x10` using AL arithmetic; values 1–16 cause a call to `0x45C310` with `EAX & 1`, then a BYTE zero store. Upper EAX is eliminated by that AND before argument use.
- After the mask-4 signed-word calls, WORDs `0x1D8E03E` and `0x1D8E03C` are cleared, in that order. WORD `0x1D8E038` is not cleared here.
- Final mask-0x80 selection sets DWORD cursor `0x1D8E054` and DWORD end `0x1D969A8`: pool `*[0xB6D094] + i*0x24000`, length `0x24000`, when set; otherwise pool `*[0xB6D070] + i*0x1C000`, length `0x1C000`.
- Final DWORD `0x1D8E04C` is assigned `0x1D8E058 + i*0x4488`. **EAX at RET contains this same computed address**, not merely AL/AX, not a task-helper result, and not a Boolean. A caller-visible pointer-valued result is mechanically available; whether callers use it or the source declaration was void is unknown.
- No local write to pending action buffers, HP, ATB, inventory, the pause gate, or the frame index appears in the direct instructions. This does **not** prove the many callees have no such effects.

### Calls, order and ABI limits

The head servicing sequence is followed, in order, by `0x502020`, `0x4BB090`, `0x48D0D0`, the sixth `0x508420` call, `0x48D0D0`, `0x506C30`, `0x48D0D0`, `0x504060`, `0x506E30`, `0x5033E0`, `0x502020`, then the tail. The tail always invokes `0x501B60` followed by `0x501230`. Mask 8 adds `0x505D20`, `0x45C9F0(0x1D8E040,1)` and `0x45C320(0x1D8E040)` using caller stack cleanup; surrounding TIM context associates the first with texture-queue flushing, but its body is absent here.

Mask 4 initially invokes `0x4A9160` with stack arguments in logical order `(current ordering-base + 8, 0x1D969C8 + 0x5C*(i XOR 1), handle)`. If mask 4 remains set after that call, it invokes `0x4A9220` with `(handle, 0x1D96980 + 0x14*(i XOR 1), 0x1D969C8 + 0x5C*(i XOR 1), 0x1D969C8 + 0x5C*i)`. These are push-derived argument positions, not invented type/prototype declarations.

The later mask-4 block invokes `0x45B660` on the alternate `0x1D969C8` row, `0x45D610` on `0x1D924DC + i*0x4488`, then two repetitions of `0x56CD00(sign_extend(word[0x1D8E038]))` followed by `0x56CCE0(sign_extend(word[0x1D8E03C])+0xA0, sign_extend(word[0x1D8E03E])+0x6C)`. Each repetition re-reads the WORDs; callee-induced changes between repetitions must not be collapsed. Camera meaning is the frozen documentation interpretation, while the signed conversions/order are mechanical facts.

Only when DWORD `0x1CFF834` is zero, the function calls `0x45D550` with 13 pushed words: logical order `(0x1D8E058+i*0x4488,0x1122,0,1,5,9,0x11,0x1011,0x1019,0x101A,0x101E,0x111E,0xFFFFFFFF)`. This gate does not skip task service, the earlier mask-selected operations, or final buffer preparation. The final word is a bit-pattern; its declared signedness is unknown.

Stack arguments are pushed right-to-left, with caller-side cleanups (including delayed cleanup across intervening calls). Entry stack is balanced at the plain RET. No target instruction uses EBX/ESI/EDI/EBP or x87; callee register preservation and x87 environment behavior cannot be proven without those bodies. Integer address operations use x86 32-bit wraparound; left shifts are logical constant-count operations, not signed C overflow assumptions.

## Eight evidence anchors

1. **Repeated service and return widths:** `R/asm-001.txt:2-25` (0x500905–0x500956), `asm-002.txt:4-7` (0x50096A–0x500976); `bytes-001.txt:1-4` confirms all six E8 destinations `0x508420` and the absolute global addresses. AL stores and full-EAX optional completion test prove distinct output contracts. Frozen common-compaction:40 supplies neighboring callback-at-node+8 context, not a target-purpose label.
2. **Required discontiguous tail:** `R/asm-002.txt:15-17`, `bytes-001.txt:5-7`; 0x50099C E9 displacement resolves to 0x5005A0. `metadata.json:35-49,156-159` confirms the cross-chunk edge and terminal block. Entry-only analysis omits most effects.
3. **Environment-style indexed row work:** `R/asm-002.txt:18-25`, `asm-003.txt:1-25`, `asm-004.txt:1-5` (0x5005AD–0x50062D); bytes at 0x5005C0–0x500620 show `23*i*4 = 0x5C*i` rows at 0x1D969C8 and `5*i*4 = 0x14*i` rows at 0x1D96980. Mask 4 is re-tested after 0x4A9160.
4. **Unsigned byte counter and mask-8 processing:** `R/asm-004.txt:6-25`, `asm-005.txt:1-5` (0x500632–0x50068C); 0x500640 is JBE, hence unsigned AL comparison, followed by wrapping ADD AL,0xF0 or AND EAX,1. 0x500668 gates E8 to 0x505D20. common-compaction:40 refers to TIM:79–89 for historical caller-side flush association.
5. **Signed WORD parameter consumption:** `R/asm-006.txt:3-25` (0x5006E4–0x500744), `bytes-001.txt:17-20`; six MOVSX word loads, two ordered pairs of calls, eight pushed arguments total in this block including prior buffer calls, cleanup 0x20, and two WORD zero stores. No unsigned interpretation of these camera-associated words is justified.
6. **Narrow pause gating, not whole-frame suppression:** `R/asm-007.txt:1-25`, `asm-008.txt:1-3` (0x50074D–0x5007A9), `bytes-002.txt:1-3`; only 0x45D550 is bypassed by nonzero DWORD 0x1CFF834. Final preparation still runs.
7. **Packet and ordering-buffer preparation, full-EAX exit:** `R/asm-008.txt:3-25`, `asm-009.txt:1-6` (0x5007A9–0x50081E), `bytes-002.txt:3-6`; prove 0x24000/0x1C000 packet spans, direct cursor/end stores, and ordering-base/EAX result. Arithmetic yields ordering stride **0x4488**, not 0x8910.
8. **Callers and scheduling context independent of old labels:** `R/metadata.json:161-191` gives four call sites 0x47D63D/0x47D6C5/0x47D707/0x47D811 owned by 0x47CCB0, plus jump 0x47D905 owned by 0x47D900. common-compaction:42 and scheduling reference P:89–107 distinguish the jump/orphan from another direct director call. Caller bodies are not available here, so phase meanings or return use are not inferred.

## Source divergence and open questions

- **Confirmed compaction arithmetic error:** common-compaction.md:41 states `OT1D8E058 stride8910`. The target computes ECX=17*i; EDX=(i+8*ECX)*16+i=2193*i; scaled LEA produces `8*2193*i=17544*i=0x4488*i`. This occurs independently at 0x5006C8–0x5006D7, 0x500767–0x500794, and 0x500803–0x500812. Bytes and ASM agree. Treat 0x8910 as unvalidated surrounding prose, not the implemented row stride. No native-byte/ASM disagreement found in those sequences.
- Task helper completion semantics beyond zero/nonzero EAX, the meanings of the two AL status bytes, and types/lifetimes of the global-held objects are absent. The label “GF sequence candidate” is not proof of GF ownership.
- Exact helper ABIs, hidden global/register inputs, callbacks and indirect side effects require additional frozen callee context. Direct absence of battle-state writes is insufficient to claim total battle-state neutrality.
- The signed WORD calls plausibly consume camera parameters; what 0x1D8E038 represents, why consumption is duplicated, and what coordinate system/units apply remain unknown.
- Mask semantics, buffer allocation capacities, enforced upstream index domain, handle validity and calling phase frequency are unknown. This function performs no local index bound or allocation validation.
- There is no local frame-index toggle. Describe it as selecting/preparing indexed buffers, not flipping ping-pong state.
- Caller use of the final pointer-valued EAX is not provided. Do not promote either a void prototype or a meaningful public return type without caller evidence.

No promotion or supervisor §5.6 validation is performed by this report.
