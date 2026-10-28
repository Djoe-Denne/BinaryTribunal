# 0x485EC0 — independent C production B

## Provenance and coverage

- Target: `0x485EC0`, all 23 decoded instructions, complete half-open range `[0x485EC0,0x485EFB)`; chunk length `0x3B` = 59 bytes. No native instruction omitted.
- Frozen image: 32-bit `FF8_EN.exe`, SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`.
- Input packet SHA-256 (manifest): `50a28e8cec513ad24cf73574d698fa89d1877ea254fe333b0b6d761db3c711af`. Projection manifest identifies complete verbatim assembly/bytes/metadata; original packet is authoritative.
- Evidence read: `inputs/ff8-decomp-semantics-20261011-r01/g07/0x485EC0.json`, corresponding `.../0x485EC0.readable/{manifest.json,asm-001.txt,bytes-001.txt,metadata.json}`, and `inputs/ff8-decomp-semantics-20261011-r01/g07/common-compaction.md`. No other target output or session material consulted.

## C rendering

The listing models the real call site through an explicit **analysis/native-call adapter interface**. That interface is not a declaration or prototype for native `0x486B40`; it records the call target, chronological DWORD pushes, and caller cleanup. The adapter must execute/represent the target and inherit its memory/register/flags effects opaquely; no callee implementation or behavioral assumption is supplied here. The adapter implementation/context is an explicit integration dependency, not part of this function.

```c
#include <stdint.h>

/* Analysis harness interface only; NOT a C prototype for native 0x486B40.
 * push_dwords is ordered by instruction execution (first PUSH, then second).
 * Adapter executes the native call in its machine/address-space context,
 * leaves inherited memory/register/flags effects opaque to this source,
 * updates the listed live GPR snapshots (these are not callee return values),
 * and applies the caller's stated ADD ESP cleanup amount. Its implementation
 * is not supplied.
 */
extern void native_call_adapter_32(
    uint32_t target_va,
    const uint32_t push_dwords_in_instruction_order[2],
    uint32_t caller_cleanup_bytes,
    uint32_t *eax_register,
    uint32_t *esi_register,
    uint32_t *edi_register);

/* Descriptive local name, not an IDB-proven symbol. 32-bit x86 stack input:
 * entry [ESP+4] is the one dword read at 00485EC0. Caller cleanup is visible
 * here (RET, not RET n); no return value is established by this body.
 */
void __cdecl process_and_clear_slot_stash(uint32_t p_slot_id)
{
    uint32_t eax = p_slot_id;                 /* MOV EAX,[entry ESP+4] */

    /* LEA ECX,[EAX+EAX*2]; LEA EDX,[EAX+ECX*4]; SHL EDX,4.
     * Each operation is 32-bit modulo 2^32, including the shift.
     */
    uint32_t ecx = (uint32_t)(eax + (uint32_t)(eax * UINT32_C(2)));
    uint32_t edx = (uint32_t)(eax + (uint32_t)(ecx * UINT32_C(4)));
    edx = (uint32_t)(edx << 4);

    /* Encoded LEA displacement 0x01D27BC8; slot base 0x01D27B10 plus
     * field offset 0xB8 as recorded in the frozen common facts. Address
     * calculation is an x86 32-bit effective-address wrap, not a bounds check.
     */
    uint32_t edi = (uint32_t)(UINT32_C(0x01D27BC8) + edx);

    /* ESI is saved/restored by the native function. The signed JL condition
     * is modeled explicitly; starting at zero it visits exactly indices 0,1.
     */
    uint32_t esi = 0;
    do {
        uint32_t effective_address = (uint32_t)(edi + esi);
        volatile uint8_t *byte_address =
            (volatile uint8_t *)(uintptr_t)effective_address;
        uint8_t al = *byte_address;             /* MOV AL,[EDI+ESI], byte read */
        eax = (uint32_t)((eax & UINT32_C(0xFFFFFF00)) | (uint32_t)al);

        if (al != 0) {                         /* TEST AL,AL; JZ skips call+clear */
            eax &= UINT32_C(0x000000FF);       /* AND EAX,FFh: zero-extend id */

            /* Native sequence at 00485EE3..00485EEB. PUSH chronology is
             * 0 then EAX (final callee stack arguments: EAX, 0). Adapter
             * returns at call-site state after modeling opaque callee effects
             * and caller ADD ESP,8. This does not assert a callee signature.
             */
            const uint32_t pushed_dwords[2] = { UINT32_C(0), eax };
            native_call_adapter_32(UINT32_C(0x00486B40),
                                   pushed_dwords,
                                   UINT32_C(8),
                                   &eax, &esi, &edi);

            effective_address = (uint32_t)(edi + esi);
            byte_address = (volatile uint8_t *)(uintptr_t)effective_address;
            *byte_address = 0;                 /* MOV byte ptr [EDI+ESI],0 */
        }

        ++esi;                                 /* INC ESI */
    } while ((int32_t)esi < 2);               /* CMP ESI,2; signed JL */
}
```

The C control-flow above reflects the tested-byte path, two iterations, byte clear only after nonzero, and argument/address widths. The adapter represents the actual call-site operation and stack cleanup; all callee-inherited effects on memory, registers, and flags remain opaque. It updates EAX/ESI/EDI snapshots because those are subsequently consumed by the caller instructions; other inherited machine effects remain outside the rendering. In particular, the later `MOV AL` overwrites only EAX's low byte and preserves whatever upper 24 bits remain until a nonzero byte takes `AND EAX,FFh`. If the final iteration takes the call path, final EAX is an opaque callee residue; no source-level return contract is claimed.

## Semantic assessment and exact evidence

Best bounded description: **for a slot-derived address, inspect two adjacent bytes; for each nonzero byte, pass its zero-extended value and a zero dword to native `0x486B40`, then clear that byte.** Confidence high for those mechanics; low for any inventory/refund interpretation. “process/clear slot stash” is a descriptive working name, not recovered original name.

Instruction evidence (addresses are native VAs):

1. `00485EC0` `mov eax,[esp+4]`: reads one stack dword; it does not validate the slot argument.
2. `00485EC8–00485ECE` `lea ecx,[eax+eax*2]`; `lea edx,[eax+ecx*4]`; `shl edx,4`: 32-bit effective-address arithmetic equivalent modulo 2^32 to `slot * 0xD0`; `00485ED1` uses the resulting EDX in the field address.
3. `00485ED7` `mov al,[edi+esi]`; `00485EDA–00485EDC` `test al,al` / `jz 00485EF2`: byte-width test; zero skips the call and clear.
4. `00485EDE` `and eax,0FFh`: zero-extends the tested byte into the full EAX value before it is pushed.
5. `00485EE3–00485EEB`: pushes immediate zero then EAX, calls rel32 target `0x00486B40`, and caller adds 8 to ESP. The 2 dword values/order and caller stack reclamation are direct instruction facts; callee prototype/effect are not.
6. `00485EEE` `mov byte ptr [edi+esi],0`: the nonzero branch clears exactly one byte, after the call.
7. `00485EF2–00485EF6` `inc esi; cmp esi,2; jl 00485ED7`: signed loop test; initial `xor esi,esi` at `00485EC5` yields two visits, indexes 0 and 1.
8. `00485EF8–00485EFA` pops EDI then ESI and executes plain `retn`; the function has no explicit return-value assignment and no callee-pop immediate.

Independent contextual support for the bounded “cleanup/process” naming (not proof of refund semantics): packet xrefs identify a call at `0x486903` inside `0x4868C0` and a call at `0x493A84` inside `0x493840`; common frozen facts describe these neighboring functions as battle-end cleanup/transition and battle-status apply/sync respectively. Separate callers are `0x485835` in `0x485610` and `0x486CB7` in `0x486C70`. These establish lifecycle/context links, not what `0x486B40` does.

## Uncertainties / non-claims

- `name_label_only` and embedded comments in the packet are annotations, not proof. In particular, “RefundStashedItems”, `magic_to_blow_away`, and the annotation calling `0x486B40` an adjust/refund helper are not elevated to verified semantics. Common-compaction historical note says address-catalog label `0x486B40` conflicts with frozen call bytes/arguments; no external callee body was read.
- No bounds guard is present in this body. Do not infer valid slot range or behavior on an invalid `p_slot_id`; 32-bit LEA/shift wrapping is intentional in the rendering.
- `0x486B40` semantics, register clobbers/preservation, flags, memory effects, and exact calling-convention identity beyond the observed stack argument/caller cleanup are unknown. The caller relies on its own ESI/EDI across the call; the adapter must carry those actual opaque register effects rather than assume values. EAX after call may persist as part of final machine register state, but has no proved meaning here.
- No proved return type/value for `0x485EC0`; no ABI type beyond the dword stack read and plain RET is asserted. The likely cdecl notation is conventional, not a claim that the packet supplies full ABI metadata.
- No compilation, review, integration, dynamic run, or differential test was performed.
