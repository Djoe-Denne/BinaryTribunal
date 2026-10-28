# 0x701220 — semantic A

## Authority and coverage

Independent semantic production, not a C production or final promotion. Native packet SHA-256: `5a2d2dd11b9e5f5d5e3ec79fd236f5bbc03a85ec1d9b7065538ef166905b9141`; common compaction SHA-256: `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34` (manifest lines 3–5). Read all manifest lines 1–30, ASM slices 001 lines 1–25 and 002 lines 1–4, byte slice 001 lines 1–3, metadata lines 1–259 and common compaction lines 1–24. Coverage: all 29 instructions, sole block/chunk `[0x701220,0x70126C)`, all 76 code bytes. Bytes agree with the mechanical widths, offsets, direct calls and plain RET described below. Historical labels/comments are not independent proof. No tests, compilation or live validation performed; hashes are supplied manifest values, not independently recomputed.

## Role, name and confidence

Proposed name: **Mat3S16_MakeRotX_Q12**. **LIKELY** for this mathematical name; **CERTAIN** for the local ABI, stores and register flow. In row-major nine-WORD indexing, constructs the coefficient pattern `[[4096,0,0],[0,c,s],[0,-s,c]]` in a 20-byte destination. Here `s` and `c` are low 16 bits of results from 0x56D130 and 0x56D100, respectively. The common frozen context documents these callees as scaled sine and cosine of angle × pi/2048; their bodies/constants are not present in this target projection. Thus Q12/trigonometric interpretation is context-supported, not proved by their names or this target alone. The unchanged first axis and the signed antisymmetric 2×2 block independently support the X-axis matrix interpretation once the callee semantics are accepted. No claim about gameplay, coordinate handedness, active/passive rotation, or row-versus-column vector application.

## Mechanical contract

- PE32 stack ABI consistent with cdecl: entry `[ESP+4]` contains an angle slot whose low WORD is sign-extended to EDI; `[ESP+8]` is destination pointer. High 16 bits of the angle slot are ignored. EBX/ESI/EDI are saved and restored; final plain RET leaves the function's arguments for its caller.
- Destination writes, in exact order: DWORD zero at offsets 0, 4, 8, 12, 16, then WORD 0x1000 at 0, cosine AX at 8, low WORD of negated sine at 14, sine BX at 10, cosine AX at 16. This writes bytes 0–19, not merely an 18-byte matrix: bytes 18–19 remain zero. Numeric coefficient stride is 2 bytes; row stride under this indexing is 6 bytes. No pointer increment/array loop.
- First direct call is 0x56D130 with a pushed sign-extended angle. Its EAX is saved in EBX. Same angle is then pushed for 0x56D100; one `ADD ESP,8` removes both pushed argument slots. At the second call the current argument is at its `[ESP+4]`; the first call's retained slot is below it. There are no invented multi-argument calls or library replacements.
- `NEG EDX` is 32-bit two's-complement negation of the first result, with x86 modulo-2^32 behavior; only DX is stored. This is low-16-bit negation, not saturation. All coefficient stores truncate to WORD without range checks.
- EAX on exit is the **full 32-bit result of 0x56D100**, unchanged after the call. AX is consumed for stores, not assigned; AL is not separately assigned. It is not a destination-pointer return or Boolean. Whether callers intentionally consume that EAX value remains unknown. Flags are not a stable return contract.
- No local global reads/writes, branches, shifts, x87 instructions, guards or error path. External-call side effects (including any x87 exceptions/environment dependence) are not established by this body. Five zero stores precede both calls; coefficient stores follow both. Destination must be writable for 20 bytes on a normally completing execution. No native validation of null, size or alignment. Arbitrary aliasing with callee data/stack can make order observable; no disjointness guarantee is inferred.

## Evidence (independent instruction/xref groups)

Paths below are relative to `inputs/ff8-decomp-semantics-20261011-r01/g02/0x701220.readable/`.

1. **ABI/signed input:** `asm-001.txt:1–7`, 0x701220–0x70122B, saves registers, loads second stack argument into ESI, then MOVSX WORD from first into EDI. `bytes-001.txt:1` includes `0F BF 7C 24 10`, proving WORD sign extension rather than an unsigned/full-DWORD angle load.
2. **20-byte initialization:** `asm-001.txt:8–13`, 0x701230/233/236/239/23C, DWORD zeroes at +0/+4/+8/+0C/+10. This proves construction/reset and the two-byte tail beyond nine WORDs independently of the historical matrix label.
3. **Callee dataflow:** `asm-001.txt:9,14–19`, 0x701232/23F/244/245/247/24E, pushes the same signed angle twice, retains the first EAX in EBX, receives second EAX, then caller-cleans eight bytes. Metadata `254–256` identifies targets 0x56D100/0x56D130; relative CALL bytes in `bytes-001.txt:1–2` map first to 0x56D130, second to 0x56D100. Context `common-compaction.md:10` supplies secondary sine/cosine interpretation.
4. **X-axis invariant / name evidence 1:** `asm-001.txt:21–25`, 0x701253–0x701264, writes 0x1000 at +0 and equal AX coefficients at +8/+10h. Combined with zeroed +2/+4/+6/+0Ch, this fixes the first axis and isolates the lower 2×2 block in the nine-WORD layout.
5. **Antisymmetric block / name evidence 2:** `asm-001.txt:18,20,23–24`, 0x70124C/251/25C/260, copies first result EBX to EDX, negates it, stores DX at +0Eh and BX at +0Ah. The opposite off-diagonal coefficients plus equal diagonal coefficients establish a rotation-form block, rather than inferring it from a name.
6. **Return width and completion:** `asm-001.txt:17–25` and `asm-002.txt:1–4`, 0x701247–0x70126B: no later write to EAX/AX/AL; only stores from AX and restores of EDI/ESI/EBX, followed by RET. Metadata `11–16,258` confirms one block and 29 instructions.
7. **Reuse context, not business proof:** metadata `127–150,217–252` records calls from 0x6ADF60, 0x6C64C0, 0x6E07D0, 0x6E4350 and 0x701310/430/4B0/530/5B0/630. Frozen compaction `13` records overlap with matrix-composition callers. Xrefs prove reuse, not caller argument values, matrix orientation or consumption of EAX.

## Unknowns and source differences

- No observed conflict between slices, metadata and frozen compaction for this target. The historical label already matches the proposed name but was excluded as proof. Inline comments asserting trigonometric constants are secondary annotations; the independent local evidence is CALL targets/dataflow and coefficient layout.
- Exact sine/cosine implementation, rounding, x87 control-word assumptions, exceptional behavior and full EAX range require a separately authorized callee freeze. Do not replace the native calls by ideal real-valued sin/cos or claim rounding-mode independence.
- Caller bodies/types are absent: allocation size, intentional use of tail bytes, EAX consumption, alias restrictions and engine matrix/vector convention remain unproved. A nominal 18-byte object is insufficient for the actual stores.
- No semantic promotion, IDB/Git/registry/ledger/live action, external discovery, peer output access or delegation performed.
