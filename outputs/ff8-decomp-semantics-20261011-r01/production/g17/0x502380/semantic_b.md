# Semantic B — g17 / 0x502380

Task: `task_mv44sepz_00b5_aygi83`. Independent semantic production, including common supplemental-v1. No peer production, reconstructed C, review, IDB, live, or external index consulted in this production. No promotion or parent §5.6 performed.

## Sources and provenance

Paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g17/`:

- `0x502380.readable/manifest.json:3–7`: original packet SHA256 `1955590faeb8479a4a74ef892a9aff80681522f6abb4285ebd55f725551fff09`; common-compaction SHA256 `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`; complete 243-instruction projection. Read all `asm-001.txt` through `asm-010.txt`, both byte files, and `metadata.json`.
- `common-compaction.md:12–26,38`: frozen factual context; its historical names/comments and purpose claims are not independent evidence.
- `0x502380.supplemental-v1/manifest.json:2–26`, `table.json:3–98`, `provenance.json:2–30`, `dispatch.txt:1–10`: neutral table addendum version 1. Manifest SHA256 supplied by lead: `0c2eb97f4f4383e93d478b3faf532024b03cea2fea4aaff0315424b8997cc861`. Raw 72-byte table SHA256: `c0e337fcad03168079cbd7575dc3582d1631773094eaba3ff071cbf08e327bf0`. This differs intentionally from the serialized `table.json` file hash `61ca1118a8789ad29c5a57af70859f5c391a8b65266385da5415a1bb27d35a9c`.
- Parent provenance reports original 680-byte body == IDB == PE, and added table == IDB == PE; PE SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, static capture `2026-10-12T16:38:11.584995+00:00`. These authentication checks are parent evidence, not independently rerun here.

Admission note: this session declares GPT-6 Astra; historical task text names Sol high. Requested actual admission selection/variant from lead; no native Model.Ref readback was supplied in the resumed message. Continued only after lead's explicit same-task GO. Do not treat this document as a model/variant attestation.

## Proposed role, name, confidence

**Proposed name: `BattlePresentation_DispatchCommand` — LIKELY.** More conservative mechanical name: `DispatchCommand_66_77` — CERTAIN for the selector family and dispatch mechanism.

Mechanically this is a single-record opcode dispatcher. It routes a WORD selector to immediate indexed-record operations, helper delegation, or callback-node creation. Some arms touch three fixed-stride records. It returns a full-register result, most commonly 15 or 8; two arms forward another routine's EAX.

The presentation interpretation is LIKELY, supported independently by (1) repeated operations on indexed 0x9C records and the animation/state-helper interface described in the frozen context, and (2) deferred callback creation with retention of the command pointer, distinct from those immediate operations. The switch and these effects support the name without using the existing function name as evidence. The precise meanings of animation IDs, flag classes, callback jobs and result codes remain UNCERTAIN. The body does not itself demonstrate queue insertion internals or consumption of the next queue entry.

## Input, output, effects and ABI

- One explicit stack argument: record pointer loaded at `502382` from entry ESP+4 (after two pushes). Saves/restores EBX, ESI, EDI; plain RET. Caller-cleanup-compatible, but no authenticated C prototype supplied.
- Record layout is opcode-dependent, not a universally proved struct: WORD +2 selector; signed WORD +8 index; DWORD +4 nested pointer only in 0x75; signed WORD +0A helper argument in 0x6F; BYTE +0A shift count and BYTE +0B clear/set choice in 0x76/0x77. Delegated helpers receive the original pointer and may access additional fields.
- Indexed address is `0x1D972C0 + 0x9C * sign_extend_16(record[+8])` in 32-bit arithmetic. The arithmetic is 4*(8*(5*i)-i). No index validation occurs. Negative indices are not converted to unsigned bytes or rejected.
- Local direct stores: actor WORD +0 OR 0x10 on the gated 0x69 path; actor DWORD +8 bit 0x01000000 set/cleared on fallback paths in 0x6C/0x6D; returned-node DWORD +0x10 receives the original pointer; selected returned-node BYTE +0x0D becomes zero. No blanket node+0x0D initialization for 0x71/0x73. No explicit null checks after node creation. Additional effects belong to callees and remain incompletely bounded.
- For 0x75, nested pointer +0x0C supplies a DWORD, nested +0x82 a WORD. `MOV AX,[nested+82h]` preserves EAX upper 16 bits from the sign-extended actor index before `PUSH EAX`. Thus the passed DWORD is `(sign_extended_index & 0xFFFF0000) | nested_word`, not universally a zero-extended WORD.
- Return constants are **EAX=8** for node-producing paths and **EAX=15** for locally completed/default paths. Opcodes 0x68 and 0x70 forward the raw EAX left by their helper. No AL/AX-only return or Boolean contract is established. These integers' scheduler meanings cannot be authenticated without the caller's consumption logic.
- Helper calls can mutate aliased storage. In particular 0x6A reloads the signed index after its first call; replacing this with a cached index changes possible behavior. In 0x76/0x77 the old actor DWORD +8 is captured before the mask helper, whereas record BYTE +0B is read afterward.

## Exhaustive dispatch coverage, derived from native bytes

`dispatch.txt:5–10` encodes MOV CX,[ESI+2], MOVSX EAX,CX, ADD EAX,-102, CMP EAX,17, **JA** default, then JMP [0x502628+4*EAX]. The subtraction operates in 32 bits. Unsigned `index <= 17` admits only selectors **0x66..0x77**. Negative signed WORDs, 0x64/0x65 and all other values take default; this is not a signed upper-bound-only check.

Each four-byte group in `table.json:8` decodes little-endian to the following destination. The duplicate final pair is real. The table is outside the original code chunk and is now supplied, not inferred from CFG or case comments. Arguments below are in callee argument order, not PUSH order. `A(i)` denotes the 0x9C-stride address, `i` the signed WORD +8, and `p` the original record pointer.

| Index | Selector | Slot | Destination | Mechanical action and result |
|---:|---:|---:|---:|---|
| 0 | 0x66 | 502628 | 5023A1 | Call 500DD0 with callback 502670; node+10=p, node+0D=0; EAX=8. |
| 1 | 0x67 | 50262C | 5023BE | Call 5027D0(p); discard helper result; EAX=15. |
| 2 | 0x68 | 502630 | 5023D0 | Call 50A790(p); forward EAX. |
| 3 | 0x69 | 502634 | 5023DD | If WORD A(i)+0 bit 2 clear, default result 15; otherwise set its bit 0x10, create callback 502ED0 via 500DD0, write node+10=p and node+0D=0; EAX=8. |
| 4 | 0x6A | 502638 | 502422 | Call 509CD0(A(i),0); reload i; call 505C00(A(i),3); EAX=15. |
| 5 | 0x6B | 50263C | 50261F | Direct default epilogue; EAX=15, no dispatched operation. |
| 6 | 0x6C | 502640 | 5024CF | Three records: bit 2 of BYTE A(j)+0 set => 503190(j,0x18,1); else OR DWORD A(j)+8 with 0x01000000; EAX=15. |
| 7 | 0x6D | 502644 | 50250A | Same three records: bit 2 set => 503190(j,0x18,0); else AND DWORD A(j)+8 with 0xFEFFFFFF; EAX=15. |
| 8 | 0x6E | 502648 | 502464 | Call 503190(i,0x17,1); EAX=15. |
| 9 | 0x6F | 50264C | 502498 | Call 505C00(A(i),sign_extend_16(p+0A)); EAX=15. |
| 10 | 0x70 | 502650 | 5024C2 | Call 5085D0(p); forward EAX. |
| 11 | 0x71 | 502654 | 502562 | Call 500DD0 with callback 502F30; node+10=p; no local +0D write; EAX=8. |
| 12 | 0x72 | 502658 | 50247E | Call 503190(i,0x17,0); EAX=15. |
| 13 | 0x73 | 50265C | 502569 | Call 500DD0 with callback 503040; node+10=p; no local +0D write; EAX=8. |
| 14 | 0x74 | 502660 | 502545 | Call 500DD0 with callback 502F90; node+10=p, node+0D=0; EAX=8. |
| 15 | 0x75 | 502664 | 502582 | Call 50A070(A(i),partial-register DWORD described above, nested DWORD +0C), then 509C80(A(i)); EAX=15. |
| 16 | 0x76 | 502668 | 5025BC | Produce mask via 509BA0(1 << (BYTE p+0A & 31),0); clear or set that mask in captured actor DWORD +8 according to BYTE p+0B; call 509CD0(A(i),updated value), then 509C80(A(i)); EAX=15. |
| 17 | 0x77 | 50266C | 5025BC | Same as previous, except mask helper arguments are (0,1 << (BYTE p+0A & 31)); EAX=15. |
| — | all others | — | 50261F | EAX=15, no helper call or actor/node write on this path. |

For 0x76/0x77, `CMP CX,76h` at 5025C8 still uses the original selector WORD. With `m` the full EAX result of 509BA0 and `old` the captured DWORD +8, the supplied updated value is `(old & ~m)` when the later BYTE +0B is zero, otherwise `(old & ~m) | m`. The bit number uses hardware 5-bit count masking, so BYTE 32 selects bit 0, not an invalid shift. This does not prove a particular status-bit taxonomy for the helper's translated mask.

## Eight independent evidence groups

1. **Dispatch/normalization:** supplemental `dispatch.txt:5–10`, `table.json:8–98`; instructions 502387–50239A. Guard and table jointly establish the exhaustive selector mapping above; neither historical case labels nor naming supplies that mapping.
2. **Deferred work:** `asm-001.txt:11–20`, `asm-002.txt:19–25`, `asm-003.txt:1–5`, `asm-007.txt:14–25`, `asm-008.txt:1–9`; 5023A6/50240A/50254A/50256E call the same factory and retain the input pointer in the returned object. Raw callback literals are visible in `bytes-001.txt:2,5,15–16`. This independently supports a deferred-command role.
3. **Indexed-record immediate work:** `asm-003.txt:6–23`, `asm-004.txt:25`, `asm-005.txt:1–10`; 502422–50245B and 502498–5024B9 establish 0x9C arithmetic, signed indices/argument, two helper interfaces, and EAX=15. The second index load after a call is explicit.
4. **Three-record paired flags:** `asm-005.txt:22–25`, `asm-006.txt:1–25`, `asm-007.txt:1–13`; 5024CF–502544. Pointer starts at 1D972C8, increments 0x9C, and signed-JL compares against 1D9749C: exactly three ordinary loop iterations. `bytes-001.txt:12` gives OR immediate bytes `00 00 00 01` = 0x01000000, independent of the symbolic mask annotation.
5. **Nested input and partial register:** `asm-008.txt:10–25`, 502582–5025B3; also `bytes-001.txt:17–18`. The nested input, saved index arithmetic, MOV AX and full PUSH EAX establish input widths and prohibit a blanket zero-extension of the second helper argument.
6. **Bit-mask transformation:** `asm-009.txt:5–25`, `asm-010.txt:1–13`; 5025BC–50261C. Selector 0x76/0x77 chooses which helper argument carries a hardware-masked shifted bit; full helper EAX is complemented/combined with an old DWORD; a later byte controls clear versus set.
7. **Return/ABI split:** `asm-001.txt:16–20`, `asm-002.txt:4–10`, `asm-005.txt:15–21`, `asm-010.txt:14–18`; EAX immediates, pass-through paths, preserved registers and RET are concrete. `metadata.json:259–265` records one incoming code xref 500D29 within 500CC0, but supplies no caller body proving how that result is interpreted.
8. **Contextual presentation association:** `common-compaction.md:19,25–26` supplies independently frozen surrounding helper observations: 505C00 tests record +8, creates a callback node when +8C is nonnull, or calls 505BC0; 509C80 checks unsigned BYTE +4 < 0x10 and updates/compares state through +74. Together with the target's direct calls at 502453/5024B1/5025AB/502617 these support an actor/presentation control interpretation, not specific unproved animation or domain semantics.

## Source disagreements and remaining questions

- **CONFLICT with historical prose, resolved mechanically:** `asm-001.txt:1` says family 0x64..0x77. Native normalization and unsigned guard cover 0x66..0x77 only. 0x6B is an explicit table entry to default, not an absent selector. No native table/CFG conflict observed.
- The original common compaction says the raw table is missing (`common-compaction.md:38`). This is an outdated availability limit superseded only for the 72 bytes in supplemental-v1; other missing-neighbor limits remain.
- Callback labels asserting camera, escape, readiness, music, and comments interpreting 8 as a particular wait state are unvalidated historical semantics here. They do not establish those effects. Is 500DD0 infallible, and what do its callbacks do? What ownership/lifetime applies to retained p?
- What does caller 500CC0 do with 8, 15 and delegated results? Are 50A790 and 5085D0 defined full-EAX-return interfaces on every path? Is presentation-only behavior accurate for all callees? These require additional frozen caller/callee evidence.
- What are the actor flag and translated mask meanings? How are signed indices constrained upstream? Do aliasing or callbacks mutate the input/global array during calls? No local protection establishes those invariants.
- The three-record loops prove their own range, not a universal actor-array capacity. Validity, total sizes, alignment and lifetime of the input/nested/node pointers remain caller/runtime preconditions.

**Final confidence:** CERTAIN for the local mechanics, table normalization and all 18 mappings plus default; LIKELY for the presentation-command dispatcher role/name; UNCERTAIN for callback purposes, result-code meanings and transitive effects. Complete supplied body/table coverage is not a semantic promotion.
