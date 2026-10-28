# semantic B — g34 / 0x6D9510

- **volet:** B (2+1 independent; no A/C/R/peer/other-volet reads)
- **session:** ses_ecf6d885effeM36HGbyQwbHq6k (pool-189, re-semantic-ensemble)
- **factual source checkpoint:** ses_ed41f7454ffeMmUT62aU0vibC0 before msg_12be25945001z1eTmeIwOzxKcZ
- **gel:** `inputs/ff8-decomp-semantics-20261011-r01/g34/0x6D9510.json`
- **native export:** 2026-10-11T16:38:25.140966+00:00; 32-bit `FF8_EN.exe` sha256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`
- **IDA label in gel (not purpose evidence):** `Mat3S16_MakeRotY_Q12`

This note states observable behavior from the gel bytes/ASM/CFG/xrefs. It is not a C reconstruction and not a reconciliation verdict.

## Role

Single-block cdecl helper that consumes a sign-extended 16-bit angle, calls two nearby trig helpers with that angle, then writes a 3x3 array of 16-bit lanes through an output pointer:

    [  c,    0,  s ]
    [  0, 0x1000, 0 ]
    [ -s,    0,  c ]

`s` is the low 16 bits of the first callee result; `c` is the low 16 bits of the second; `0x1000` is an immediate. Offsets are sequential int16 slots at +0,+2,+4,+6,+8,+0xA,+0xC,+0xE,+0x10 (18 bytes). The unchanged middle diagonal (+8 = 0x1000) is the layout of an XZ-plane rotation with unit Y, i.e. a Y-axis rotation matrix in row-major int16[3][3] (or the transpose if the consumer is column-major). That geometric name is inferred from the stores, not from the IDA label.

## ABI / in / out / effects

- Convention: cdecl; `retn` (0x6D9557), no callee pop of the two incoming args
- On-entry args: arg0 at `[esp+4]`, arg1 at `[esp+8]` (before the two register pushes)
- arg0: 16-bit value loaded with `movsx edi, word ptr [esp+0xC]` at 0x6D9512 (signed extend to 32-bit `edi`)
- arg1: pointer loaded into `ecx` at 0x6D9525 from `[esp+0x18]` after four pushes
- Callee args: the sign-extended angle is `push edi` twice (0x6D9517, 0x6D951D); both calls cleaned with `add esp, 8` at 0x6D9529
- Out memory: 9 x 16-bit stores through `ecx` (see layout below). No other data writes in this function
- Out registers: `eax` at `retn` is still the second callee result (low 16 = `c`); `edx` is 0. Not an explicit `mov` of a return code. Caller use of `eax`/`edx` is not in this gel
- Preserved: `esi`/`edi` (push 0x6D9510/0x6D9511, pop 0x6D9556 / 0x6D9532). No `ebp` frame
- Clobbered: `eax`, `ecx`, `edx`; x87 state depends on the two callees (not dumped here)
- Globals: none addressed
- CFG: one block `0x6D9510`-`0x6D9558`, 24 instructions, no successors

### Store map (row-major int16[3][3] reading)

- `+0`  insn 0x6D9539 `mov [ecx], ax` — `c`
- `+2`  insn 0x6D953C `mov [ecx+2], dx` — 0
- `+4`  insn 0x6D952E `mov [ecx+4], si` — `s` (before `neg`)
- `+6`  insn 0x6D9540 `mov [ecx+6], dx` — 0
- `+8`  insn 0x6D9544 `mov word ptr [ecx+8], 1000h` — `0x1000`
- `+0xA` insn 0x6D954A `mov [ecx+0Ah], dx` — 0
- `+0xC` insn 0x6D9535 `mov [ecx+0Ch], si` — `-s` (after `neg esi` at 0x6D9533)
- `+0xE` insn 0x6D954E `mov [ecx+0Eh], dx` — 0
- `+0x10` insn 0x6D9552 `mov [ecx+10h], ax` — `c`

`edx` is zeroed at 0x6D952C (`xor edx, edx`) before the zero stores. `neg esi` is 32-bit two's complement of the first result, then the low 16 bits are stored; for values whose low 16 bits fit a Q12 sine in [-4096,4096], that is exact `-s` in int16.

## Proposed name

`mat3s16_fill_rot_y_q12`

Independent of the gel label. Encodes: 3x3 int16 fill, Y/XZ rotation pattern, and the `0x1000` unit that matches Q12 (1.0 = 4096).

## Confidence

- cdecl, 2 args, linear 24-insn body, 18-byte int16 object written through arg1: **high** (bytes/ASM in gel)
- first result -> `+4` and negated -> `+0xC`; second result -> `+0` and `+0x10`; `+8 = 0x1000`; other lanes 0: **high**
- object is a 3x3 matrix with unit Y / XZ rotation: **high** for the numeric layout; **medium** for "Y rotation used as a 3D basis transform" until a caller multiply convention is in evidence
- arg0 is an angle whose sine/cosine are the two callee results: **medium-high** from two distinct calls on the same `edi` plus the +/-s/c placement; callee opcodes themselves are not in this gel
- Q12 (1.0 = 4096, angle period 4096): **medium** — `0x1000` is in-function; `*pi/2048` / `*4096.0` / `fsin`/`fcos` exist only as gel comments on the call sites
- EAX is an intentional cosine return: **low** — leftover of the second `call`; no caller dump
- row-major vs column-major consumer: **unresolved** — transpose would flip the sign convention of Ry

## Evidence (ASM / xrefs)

1. **Sign-extended 16-bit arg0.** `0x6D9512` `movsx edi, [esp+8+arg_0]` with encoding `0F BF 7C 24 0C` (gel `assembly` + `chunks[0].hex`). Proves a 16-bit signed source, not a 32-bit load.
2. **Two cdecl calls, same angle, different targets.** `0x6D9517`/`0x6D9518` `push edi` / `call rel32` -> **0x56D130**; `0x6D951D`/`0x6D9520` `push edi` / `call rel32` -> **0x56D100**; `0x6D9529` `add esp, 8`. Rel32 checked against gel hex (`E8 13 3C E9 FF`, `E8 DB 3B E9 FF`). Matches `code_targets` `0x56d100`, `0x56d130`.
3. **First result captured before the second call.** `0x6D951E` `mov esi, eax` immediately after the first return; later `0x6D952E` uses `si` and `0x6D9533` `neg esi`.
4. **Second result kept in `eax`/`ax` for both cosine slots.** `0x6D9539` `[ecx]`, `0x6D9552` `[ecx+10h]` with no intervening write to `eax`.
5. **Unit immediate 0x1000 at the 3x3 center.** `0x6D9544` `mov word ptr [ecx+8], 1000h` encoding `66 C7 41 08 00 10`.
6. **Zero fill of the remaining off-axis lanes.** `xor edx,edx` at `0x6D952C`, then `[ecx+2]`, `[ecx+6]`, `[ecx+0Ah]`, `[ecx+0Eh]`.
7. **Near-call xrefs only (IDA type 17) from six caller functions in the gel:** `0x69EF60` @ `0x69F80D`, `0x69F967`; `0x6CBF90` @ `0x6CC36C`, `0x6CC3E6`, `0x6CC9E9`; `0x6E8C90` @ `0x6E921A`, `0x6E928D`, `0x6E9368`, `0x6E93DD`; `0x6E9AB0` @ `0x6E9ADC`; `0x6EA3E0` @ `0x6EA419`; `0x6EA920` @ `0x6EB1CD`, `0x6EB327`. Shared helper. Caller bodies were not in the projection.
8. **No extra control flow.** `cfg[0]` start `0x6d9510` end `0x6d9558` successors `[]`; hex length 72 bytes = `end-start`.

## Historical / unvalidated material (separated)

Present in the gel `assembly` text as IDA names/comments, **not** verified from callee bytes in this volet:

- Symbol `Mat3S16_MakeRotY_Q12` on the function (`name_label_only`).
- Call at 0x6D9518 named `Fixed_Sin4096_Q12` with comment `fild; *pi/2048 (flt_B6B980=0x3AC90FDB); fsin (D9FE); *4096.0 (flt_B69540); magic-double +0x80000000`.
- Call at 0x6D9520 named `Fixed_Cos4096_Q12` with the matching `fcos (D9FF)` comment.
- Implied angle unit 4096/turn and Q12 output of the callees.

These comments are consistent with the in-function `0x1000` and with treating the first result as s and the second as c, but they are not substitutes for callee gels.

Hex-derived call order vs names: first call target **0x56D130** is the site labeled Sin; second call target **0x56D100** is the site labeled Cos. `code_targets` lists those addresses numerically, not in call order.

## Open questions

1. Confirm callee 0x56D130 / 0x56D100 bodies (fsin vs fcos, return width in EAX, domain of arg0).
2. Caller argument shapes: is arg0 a bare int16 or the low half of a 32-bit slot? Is arg1 a dedicated Mat3S16 or a prefix of a larger object?
3. Row-major vs column-major multiply at the six callers; that chooses Ry vs Ry^T (sign of the off-axis pair).
4. Whether any caller reads EAX as cosine after return.
5. Whether `neg esi` is required to be 32-bit (borrow from high bits) or the callee already returns a value whose high 16 are zero.
6. Relationship of this helper to sibling axis fillers (X/Z), if they exist; not in this projection.

## Uncertainties / gaps vs a full factual pack

- Only one projected file was readable: the native gel JSON above. No callee dumps, no caller disassembly, no struct types, no CONTRACT file, no COMMON_COMPACTION file in `inputs/`.
- Checkpoint inheritance from the factual reader did not include a visible prose synthesis in this session; surrounding docs/code/QMD/GrepAI were permission-denied or absent, as required for this isolated producer.
- xref `type: 17` taken as IDA `fl_CN` (near call) by convention; the gel does not spell the enum.
- `0x1000` proves a 4096 unit in the matrix but does not by itself prove the angle encoder.

## Source inventory

- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x6D9510.json` — used; sole native gel (assembly, hex, cfg, xrefs, code_targets, instruction_count)
- `docs/tech/RE_MULTI_PROVIDER_MISSIONS.md` — used; deliverable fields only
- `AGENTS.md` / `AGENT.md` — skim; campaign/IDA-live rules; no IDA/live used
- `docs/missions/.../CONTRACT.md`, `.tmp/.../native/0x6D9510.json` — denied; not used
- callee/caller JSON, structs, templates, other volets — absent or not read (isolation)
- IDA MCP / shell / index — not used
