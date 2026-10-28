# Semantic B — 0x486E00

Contract: run01, g10, independent B, openai/gpt-6.1-sol medium. Sources limited to the authorized input `g10/0x486E00.json` and `g10/common-compaction.md`. No sibling production consulted. Complete 22-instruction chunk [0x486E00,0x486E47) considered; labels and embedded historical comments are not proof.

## Role and confidence

**CERTAIN mechanical role:** conditionally returns the bit mask for one randomly sampled index in 3..6 whose record byte at offset 0x80 has bit 0 clear; repeatedly samples when that bit is set. If helper 0x4860D0 returns exactly EAX=0xFF, it instead returns AX=8 without sampling.

**LIKELY business interpretation:** random non-dead monster target mask. The authorized ABI mapping associates the D0h-stride records with battle slots and offset 80h with status1; interpretation of bit 0 as death and of indices 3..6 as monsters remains contextual rather than established by this chunk alone.

Proposed conservative name: `BattleSlot_SelectRandomStatusBit0ClearMask_3To6`. Supported independently by candidate arithmetic and record-bit rejection plus one-hot result formation, not by the old name. `BattleTarget_GetRandomLivingMonsterMask` is a possible business name only after helper/status contracts are validated.

## Inputs, output and effects

- No explicit stack arguments or incoming-register values consumed before calls. Implicit inputs: helper 4860D0 result, helper 48F020 results, and byte records at VA 01D27B90 + D0h*index.
- Reads only bit 0 of that byte. Does not check occupancy, HP, other status bits, or slot 7 locally.
- Every candidate attempt invokes 48F020, including rejected attempts. Its RNG state effects are inferred from context, not demonstrated by this target's opcodes. Other helper effects are unknown. No direct memory writes.
- Accepted indices return full EAX = 8, 16, 32, or 64; AX and AL contain the same mask. Sentinel branch writes only AX=8. Since it follows equality of full EAX with 000000FFh, preserved upper EAX is zero, so this branch also returns full EAX=8. Do not generalize partial AX writes to arbitrary incoming EAX.
- Bare RET, no callee argument cleanup. EAX/ECX/EDX used as scratch; no explicit nonvolatile-register modifications. Helper ABI not frozen.
- No local bound on retries. If precheck allows entry while all four tested bits are set, nontermination is possible. Even with eligible slots, termination depends on helper outputs eventually selecting one.

## Instruction evidence

All instruction references are to input `0x486E00.json:18`; raw bytes at :11–17 corroborate widths; CFG :19–60 and xrefs :62–147 provide structure.

1. 486E00 CALL 4860D0; 486E05 CMP EAX,FFh; 486E0A JNZ distinguish a full-width exact sentinel, not AL or a count predicate. 486E0C MOV AX,8 and 486E10 RET form the fallback.
2. 486E11 CALL 48F020 and 486E16 AND EAX,FFh ensure the candidate input is unsigned 0..255 regardless of the helper's upper bits.
3. 486E1B..29 retain a signed-remainder compiler sequence, but AND ECX,80000003h cannot set the sign bit after the preceding zeroing of upper bits. JNS always takes the non-correction path. Thus residue is 0..3, not a signed negative remainder.
4. 486E2A ADD ECX,3 limits candidate indices to 3..6. 486E2D/30 LEAs give 3*index then 13*index; 486E33 SHL EDX,4 gives 208 (D0h) bytes per record.
5. 486E36 TEST byte [01D27B90+EDX],1 and 486E3D JNZ 486E11 reject exactly status byte bit 0 and consume another sample on retry. ABI context at compaction :29–30 maps base 01D27B10 plus 80h consistently.
6. 486E3F MOV EAX,1; 486E44 SHL EAX,CL; 486E46 RET establish one-hot output. CL lies in 3..6, so x86 shift-count masking causes no ambiguity.
7. Frozen incoming xrefs include CALL site 48E896 within 48E830 (:142–145), but do not expose caller argument/result usage. Type19 sites 48389F,483D44,4855F7 are not assumed to be CALLs.

## Limits and open questions

- Freeze native bodies of 4860D0 and 48F020 to establish sentinel meaning, RNG distribution/state effects and nonvolatile-register contracts. Embedded comments assert these contracts but are not independent evidence.
- Confirm status bit 0 and slot-category mapping from validated native surrounding evidence. ABI declarations and historical prose support interpretation but are not fresh native validation.
- What guarantees compatibility between the precheck and retry eligibility? A precheck excluding petrification while this loop rejects only bit 0 would matter; no such helper logic is established here.
- Is fallback mask 8 deliberately meaningful when no eligible monster exists, or a historical policy? Mechanically it is not zero/failure.
- Result width expected by actual callers remains unverified, although both observed paths establish full EAX masks. No source conflict in the target bytes; confidence limits are missing helper and caller contracts.

No promotion, IDB mutation, final §5.6 validation, or live action performed.
