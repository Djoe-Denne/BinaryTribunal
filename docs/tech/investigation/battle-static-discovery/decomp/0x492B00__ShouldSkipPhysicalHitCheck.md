# ShouldSkipPhysicalHitCheck @ 0x492B00

- Instr (live): 12
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=37
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=19
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=38
- A==B: non
- Push IDB: oui
- SetType: bool __cdecl ShouldSkipPhysicalHitCheck(int attacker_slot_id, int target_slot_id)
- Notes parent: slot*0xD0 ; occupancy absente (masque 9 = Sleep|Stop, pas Haste) ; status_2 BYTE +0x08 ; HIT_ATTACK_HITPERCENT BYTE vs 0xFF (80 3D, pas 66) ; attacker jamais chargé ; jnz/jz auto-hit EAX=1 sinon xor eax,eax ; pas de callee

## C réconcilié

```c
/* ShouldSkipPhysicalHitCheck @ 0x492B00
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 12 instr, size 0x28. IDA type bool __cdecl(int, int).
 * attacker_slot_id [esp+4] never loaded. target at [esp+8].
 */

extern unsigned char HIT_ATTACK_HITPERCENT; /* 0x1D2A238 BYTE */
extern unsigned char BATTLE_SLOT_DATA[];    /* 0x1D27B10, slot stride 0xD0 */

bool __cdecl ShouldSkipPhysicalHitCheck(int attacker_slot_id, int target_slot_id)
{
    int slot_off;

    (void)attacker_slot_id;

    /* lea ecx,[eax+eax*2]; lea edx,[eax+ecx*4]; shl edx,4 → slot*0xD0 */
    slot_off = target_slot_id * 0xD0;

    /* F6 82 ... 09 : test BYTE status_2 +0x08, imm 9 = Sleep(1)|Stop(8). Occupancy absent. */
    if (BATTLE_SLOT_DATA[slot_off + 0x08] & 9)
        return 1; /* jnz loc_492B22 */

    /* 80 3D 38 A2 D2 01 FF : cmp BYTE HIT_ATTACK_HITPERCENT, 0xFF. No 66. */
    if (HIT_ATTACK_HITPERCENT == 0xFF)
        return 1; /* jz loc_492B22 */

    return 0; /* xor eax,eax ; ret */
}
```
