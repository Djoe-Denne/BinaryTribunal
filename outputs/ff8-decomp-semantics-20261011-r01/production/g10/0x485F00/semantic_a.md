# Semantic A — 0x485F00

Mission: ff8-decomp-semantics-20261011-r01; group g10; task task_mv44rug8_009n_5xcdzd. Independent semantic A, openai/gpt-6.1-sol / high per admission contract. Sources: authorized `inputs/ff8-decomp-semantics-20261011-r01/g10/0x485F00.json` and `common-compaction.md` only, plus common instructions. No other production, review, verdict or target C inspected; no promotion performed.

## Role and confidence

**CERTAIN mechanically:** submits a pointer to an indexed 20-byte record to one helper, then, if a shared DWORD pointer is nonzero after that call, submits it to another helper with four additional parameters and clears that shared pointer.

**LIKELY interpretation:** a battle-event submission wrapper with optional pending message consumption. Event/message meaning is contextual, not proved by helper names. Actual queue ownership, presentation and waiting behavior require helper bodies.

**Proposed name:** `BattleEvent_SubmitIndexedPayloadAndConsumePendingPointer` (**LIKELY**). Independent support: record-address submission at 0x485F00–0x485F16, and conditional pointer dispatch/reset at 0x485F1B–0x485F49. This avoids claiming actual rendering, synchronous waiting or copying. The existing name is not evidence.

## Inputs, outputs and effects

- One 32-bit stack argument at entry ESP+4; bare RET and caller-side helper cleanup are consistent with a cdecl-like wrapper. No signedness or bounds check establishes whether its logical type is signed. Address calculation is `0x1D280C4 + 20*index` modulo 2^32; pointer lifetime, capacity and valid index range are unknown.
- First helper (0x47E3F0) receives stack arguments in logical order `(0x68, 0x80, indexed_address)`. These are DWORD pushes; constants do not prove byte-width prototypes. Common context establishes this helper forwards to 0x500DF0, not its business contract.
- The shared DWORD at 0x1D28DDC is read **after** the first call. Its nonzero value is the first argument to 0x47E220; remaining logical arguments are `(computed_value, 3, 0x80, 0x56)`. The native target does not itself dereference that pointer.
- The byte at 0x1CFE739 is read only on the nonzero-pointer path. Critically, MOVZX writes **DX**, not EDX: DX becomes the unsigned byte value, but EDX[31:16] survives. The full EDX feeds `8*EDX + 8` modulo 2^32. Thus the commonly inferred `8*(speed+1)` is only valid with an independently proved zero upper half. The prior helper can clobber EDX; its high half is not established by this gel.
- Direct global mutation: 0x1D28DDC is set to zero after the second helper returns. No clear is executed on the zero-pointer branch. A helper's change to the shared pointer would also be overwritten by that final clear. Both helpers may have additional opaque effects.
- No defined semantic return is established. Zero-pointer branch returns EAX=0 from the global load. Nonzero branch leaves EAX from 0x47E220 unchanged; clearing the pointer does not set EAX. There is no final AL/AX narrowing or normalization. A void-like API is plausible, not proved by caller use.

## Instruction/xref evidence

Primary source `inputs/ff8-decomp-semantics-20261011-r01/g10/0x485F00.json`: raw bytes lines 11–17, complete assembly line 18, CFG lines 19–39, incoming xrefs lines 41–108. Export metadata lines 4–10: 32-bit FF8_EN.exe, SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, exported 2026-10-11T16:38:25.140966+00:00. Single chunk [0x485F00,0x485F54), 22 instructions, three blocks.

1. **Record stride:** 0x485F00 loads entry ESP+4; 0x485F04 computes index*5; 0x485F07 scales by four and adds 0x1D280C4. Establishes 20-byte stride independently of a historical payload name.
2. **Unconditional dispatch:** 0x485F0E/0F/14 push address, 0x80, 0x68; 0x485F16 calls 0x47E3F0; 0x485F20 cleans 12 bytes. Common compaction line 15 separately records that helper's three-DWORD forwarding sequence.
3. **Post-dispatch pending-state gate:** 0x485F1B reads 0x1D28DDC; 0x485F23 tests EAX and 0x485F25 branches directly to RET if zero. CFG corroborates this conditional second block, not an unconditional second dispatch.
4. **Partial-register hazard:** 0x485F27 bytes `66 0F B6 15 39 E7 CF 01` encode byte-to-DX zero extension; 0x485F36 uses full EDX in the scaled LEA. No instruction in this function zeroes its upper half. Common compaction line 16 explicitly preserves this distinction.
5. **Optional dispatch and consumption:** pushes at 0x485F2F/31/3D/3F/40 followed by CALL 0x47E220 at 0x485F41; cleanup 20 bytes at 0x485F46; DWORD clear at 0x485F49. Two separate calls, no tailcall, pointer reset after rather than before the second call.
6. **Return width and integration limits:** 0x485F53 is bare RET. EAX is loaded from the global or inherited from the second call, not normalized. Eleven incoming CALL xrefs include 0x4833DB, 0x4841FC and 0x4881EF; they establish reuse only, since caller argument preparation and return-use instructions are absent.

## Uncertainties and source separation

- Historical assertions in common compaction lines 35–42 (task 0x68 sequencing, payload capacity, downstream handlers) are explicitly unvalidated here. They do not establish this target's meaning or ABI.
- No mechanical disagreement between supplied assembly and bytes was found. There is a material limit to conventional timing interpretation: DX-only zero extension is incompatible with silently treating EDX as a freshly zero-extended speed byte.
- Needed to close business meaning: frozen bodies/contracts for 0x47E220 and 0x500DF0, writers of 0x1D28DDC, provenance of byte 0x1CFE739, and caller return-use evidence. Needed to simplify arithmetic: proof of EDX[31:16] on return from the first helper. Needed for safety: record capacity, index constraints and pointer ownership/copy semantics.
- CERTAIN is reserved for local mechanics; message/payload names remain LIKELY, timing units and helper behavior UNCERTAIN. No lead §5.6 or IDB change is claimed.
