# 0x701220 — final semantic reconciliation R

## Scope, provenance and coverage

Semantic 2+1 only; this is a final semantic contract, not a C-production deliverable or native promotion. Read only the supplied semantic projection and common instructions. Both deposited authors are present and distinct:

| Author | Native session | Model.Ref | Candidate SHA-256 (parent-declared) |
|---|---|---|---|
| A | `ses_ed3e1687dffe1HzP1LkSTC0QiF` | `openai/gpt-6.1-sol`, medium | `de2a79a3fd389f7bb1b17d6aec6e98245a19482dc1298be519dcdb89a10ca5f7` |
| B | `ses_ed3e16582ffec1M9XgzFW4TYMx` | `openai/gpt-6.1-sol`, medium | `1097be8a327bb4009f2397f27b6a66b9a29591cc4f77ffae88d878673c16a8f0` |

Native packet declared SHA-256 `5a2d2dd11b9e5f5d5e3ec79fd236f5bbc03a85ec1d9b7065538ef166905b9141`; common compaction `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`. These values agree across the reconciliation manifest, native manifest and authors' source declarations. Slice hashes also agree between the two manifests. Raw file hashing is unavailable in this restricted tool catalog; byte lengths/hashes were not independently recomputed. Parent retains that check; no hash discrepancy was observed in the supplied declarations.

Complete reads: reconciliation manifest 1–77; A 1–37; B 1–49; common compaction 1–24; native packet 1–267; native manifest 1–30; native metadata 1–259; ASM 001 1–25 and 002 1–4; byte slice 1–3. Coverage: **29/29 instructions, 76/76 bytes, sole chunk/block `[0x701220,0x70126C)`**, no CFG successors. Packet hex and byte slice agree; opcodes independently support the contract below. Historical labels, types and inline comments were excluded as local proof.

## Verdict, role and proposed name

**CERTAIN:** captured signed-low-WORD argument, ordered accesses, two native call targets, 20-byte destination write footprint, coefficient bit pattern, and full second-call EAX residue on normal ABI-conforming completion.

**LIKELY:** `Mat3S16_MakeRotX_Q12` — construct a first-axis-invariant 3×3 fixed-point rotation-form coefficient block, stored as nine consecutive 16-bit fields within a directly written 20-byte area. With row-major indexing and the secondary-context identification of the callees, the usual result is:

```text
[[0x1000, 0,      0],
 [0,      c,      s],
 [0,     -s,      c]]
```

Here `s = low16(EAX from 0x56D130)` and `c = low16(EAX from 0x56D100)`; `-s` denotes modular 16-bit negation, not saturation. Local instructions prove the coefficient pattern and literal unit 4096, not that these arbitrary call results mathematically satisfy a trigonometric identity. The common compaction identifies sine/cosine Q12 and angle units of pi/2048 only as secondary context. Consequently the trigonometric/Q12 name is not promoted to CERTAIN.

Two independent native supports for the proposed mathematical role: (1) invariant first coordinate, equal diagonal coefficients in the remaining plane, and a literal 4096 unit; (2) matching but opposite off-diagonal coefficient bit patterns derived from a single saved result. The call pair supplies additional context, not proof from callee names. No gameplay, camera, animation, handedness or vector-multiplication convention is established.

## Normative mechanical contract

Let `S` be ESP at entry. On ordinary PE32 cdecl-compatible execution, the first argument slot is `[S+4]`, the destination pointer slot is `[S+8]`. No claim is made about the original source declaration being `short` versus a wider angle type. Only the low 16 input bits matter.

The following sequence preserves every local instruction, including stack-access interleaving that a matrix-only summary omits. `M32`/`M16` are native little-endian accesses, not aligned/alias-restricted portable-C lvalues; address and unsigned arithmetic use 32-bit x86 wrap.

| Instructions | Ordered operation |
|---|---|
| 0x701220–0x701222 | PUSH EBX; PUSH ESI; load ESI from current `[ESP+0x10]`, i.e. entry `[S+8]`. |
| 0x701226–0x70122B | EAX := 0; ECX := ESI; PUSH EDI; EDI := sign-extend M16(current ESP+0x10), i.e. entry `[S+4]`. |
| 0x701230–0x70123C | M32(ECX) := 0; **PUSH EDI**; M32(ECX+4) := 0; M32(ECX+8) := 0; M32(ECX+12) := 0; M32(ECX+16) := 0. |
| 0x70123F | CALL 0x56D130 with the already pushed EDI; the CALL itself pushes its return address. |
| 0x701244–0x701247 | **PUSH EDI**, then EBX := first-call EAX, then CALL 0x56D100. |
| 0x70124C–0x701251 | EDX := EBX; ESP := ESP+8 (discard both argument slots); EDX := 0-EDX modulo 2^32. |
| 0x701253–0x701264 | M16(ESI) := 0x1000; M16(ESI+8) := AX; M16(ESI+14) := DX; M16(ESI+10) := BX; M16(ESI+16) := AX. |
| 0x701268–0x70126B | POP EDI; POP ESI; POP EBX; plain near RET. |

Both input values are captured before the first output store; the destination is captured before the angle. No later angle reload exists. Each callee is passed one pushed signed 32-bit value. The first call's argument remains below the second call's current argument until the single `ADD ESP,8`; this is not evidence of a two-argument signature for either callee. Callee preservation of EDI/ESI/EBX is the normal ABI assumption underlying the matrix-level interpretation.

Direct output writes occur as five DWORD zero stores followed, after both calls, by five WORD coefficient stores in the exact offset order **0, 8, 14, 10, 16**. No memset/library substitution, bounds/null/alignment guard, branch, loop, saturation or shift is present. Nine coefficient fields have stride 2 bytes; inferred three-field row stride is 6 bytes. The write footprint is **20 bytes**, not 18. Bytes +18/+19 are zeroed and not subsequently written by this function's explicit destination stores; their final values are not guaranteed against arbitrary callee writes or destructive stack aliasing.

The `NEG` source is the full first-call result. Its wrap is modulo 2^32, then DX truncates to low 16; unsigned negation is required in a faithful arithmetic model, avoiding signed-overflow UB. All coefficient stores are raw bit truncations. There is no separately assigned AL or AX: AX is a store source, and EAX remains the **entire 32-bit second-call result** through RET. This is not a pointer return or a Boolean, and source-level return intent/caller consumption remain UNCERTAIN. No defined flags return is claimed.

No explicit global-memory or x87 instruction exists in this body. The direct effects include destination and stack writes, both calls, and volatile-register/flags changes; do not reinterpret this as purity of the callees. No x87 reset, control-word change or restoration is implemented locally. Any faithful replacement must retain the native callees/environment behavior, not substitute ideal sin/cos, change rounding mode, or invent exception suppression.

Required for routine normal completion: destination stores must be writable, calls must return compatibly, and output/stack interactions must not corrupt call arguments, return addresses or saved state. No `restrict` or proven disjointness is supplied. Aliasing with externally accessed callee data can make zero-before-call ordering observable. Destructive aliasing with the live stack can alter the pushed angle or saved registers; the ordered machine contract above, not the final-matrix shorthand, governs such cases. Partial writes/faults have no rollback.

## Seven exact evidence anchors

All paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g02/0x701220/semantic/`.

1. **ABI/input:** `native-asm-001.txt:1–7`, 0x701220–0x70122B. `8B 74 24 10` loads the pointer after two pushes; `0F BF 7C 24 10` reads a signed WORD after the third push. This excludes unsigned WORD or full-DWORD angle reads.
2. **Footprint/access order:** `native-asm-001.txt:8–13`, 0x701230–0x70123C. Bytes `89 01 57 89 41 04 89 41 08 89 41 0C 89 41 10` prove five DWORD stores and the intervening PUSH. The final store spans +16 through +19.
3. **Calls/dataflow/cleanup:** `native-asm-001.txt:14–19`, 0x70123F–0x70124E; CALL encodings `E8 EC BE E6 FF` and `E8 B4 BE E6 FF` resolve to 0x56D130 and 0x56D100. `57 8B D8` proves second PUSH precedes saving first EAX; `83 C4 08` caller-cleans both slots. `native-metadata.json:254–257` agrees on targets.
4. **Opposite coefficients, name support:** `native-asm-001.txt:18,20,23–24`, 0x70124C/251/25C/260. `8B D3 F7 DA` (with the intervening cleanup) copies and negates full EBX; `66 89 56 0E`/`66 89 5E 0A` store DX/BX at opposite 2×2 positions.
5. **Invariant axis/equal diagonal, name support:** `native-asm-001.txt:21–25`, 0x701253–0x701264. `66 C7 06 00 10` stores 4096; `66 89 46 08` and `66 89 46 10` store the same AX at +8/+16. Earlier zero stores supply the invariant-axis zero fields.
6. **Return/CFG completeness:** `native-asm-002.txt:1–4`, 0x701268–0x70126B, bytes `5F 5E 5B C3`; neither these nor the post-call instructions write EAX. `native-metadata.json:11–17,258` supplies the sole block and 29-instruction count; complete chunk bytes terminate at 0x70126C.
7. **Reuse, not domain proof:** `native-metadata.json:217–252` records call sites 0x701336, 0x701479, 0x7014F9, 0x701547, 0x7015D6 and 0x701647 in six respective caller functions. These exact xrefs support reuse, not angle units, caller allocation size or return use. Caller ASM was not supplied/read.

## Convergences, divergences and common-error checks

| Issue | A / B | ASM-based reconciliation |
|---|---|---|
| Input width, calls, 20-byte footprint, ordered coefficient stores, full EAX residue | Agree | Independently upheld by opcode widths, rel32 targets and complete post-call sequence; agreement itself was not used as proof. |
| Argument capture order | B explicit; A less explicit | Pointer before signed angle, both before destination writes; fixed by 0x701222 and 0x70122B. |
| Zero/store/call summary | Both omit stack interleaving in their high-level effect sequence | Refined: first angle PUSH lies between zero stores; second PUSH precedes saving EAX. Matters for destructive stack aliasing; normative table includes it. |
| Tail bytes “remain zero” | Both state zero tail, while separately warning about calls/aliasing | Narrowed to zeroed and not rewritten by this body's destination stores. Unconditional final-zero promise lacks callee/alias evidence. |
| Q12 rotation name, source return intent, vector convention | Both retain limited confidence | LIKELY name; UNCERTAIN callee numerical/environment contract and source return intent. Raw target bytes do not prove mathematical sine/cosine or orientation. |

No unresolved local opcode/CFG conflict was found. No averaging or voting was performed. The only substantive corrections are precision of the ordered stack effects and the conditional nature of final-buffer claims under external writes/aliasing.

## Residual uncertainty and validation boundary

UNCERTAIN: callee bodies/constants, exact rounding/precision, x87 status/control and exceptional/global effects; actual caller buffer allocation and ownership/padding meaning; caller consumption of EAX; application convention and domain use. Angle period 4096 is context-supported, not a local proven periodicity guarantee. Resolving these requires a separately authorized complementary native callee/caller capture from the lead, not rediscovery or a stronger invented verdict. These gaps do not prevent the local semantic contract above.

No compilation, execution, native §5.6 control, IDB/Git/ledger/registry/config/live mutation, API access, peer consultation or delegation occurred. Parent owns file hashing, final §5.6/native checks and any promotion. Final disposition: **semantic reconciliation complete; local mechanics CERTAIN, mathematical name LIKELY, listed residuals UNCERTAIN**.
