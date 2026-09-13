# BattleTarget_IsEligibleByStatusMask @ 0x48EDA0

- Instr (live): 12
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=30
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleTarget_IsEligibleByStatusMask(int slot_index)
- Notes parent: stride 0xD0 lea/shl. Occupancy non testée. BYTE F6 status_1 mask 0x25 Death|Petrify|Berserk @ +0x80. DWORD F7 status_2 mask 0x02004009 Sleep|Stop|Confuse|Angel Wing @ +0x08 (imm32, pas offset unk_2004009). jnz pas ja/jg. Deux retn 1/0. Pas de setcc. Pas de 66. Pas de flag_data. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleTarget_IsEligibleByStatusMask @ 0x48EDA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 12 instr, size 0x2B. End 0x48EDCB. IDA type int __cdecl(int slot_index).
 * No domain::. No callees. Occupancy unused. No flag_data.
 * Slot stride 0xD0 (lea/shl). BYTE F6 status_1 mask 0x25 @ +0x80.
 * DWORD F7 status_2 mask 0x02004009 @ +0x08 (imm32 LE 09 40 00 02).
 * jnz loc_48EDC8 both tests. Two retn: 1 then 0. No setcc. No 66.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 FF8BattleSlotData_s[11] stride 0xD0 */

int __cdecl BattleTarget_IsEligibleByStatusMask(int slot_index)
{
    unsigned int off; /* lea ecx,[eax+eax*2]; lea eax,[eax+ecx*4]; shl eax,4 */

    off = (unsigned int)slot_index * 0xD0u;

    /* f6 80 90 7b d2 01 25  BYTE test status_1 @ +0x80 (0x1D27B90).
     * Host field is WORD; this insn is BYTE. Mask 0x25 = Death|Petrify|Berserk. */
    if ((BATTLE_SLOT_DATA[off + 0x80] & 0x25) != 0)
        goto loc_48EDC8;

    /* f7 80 18 7b d2 01 09 40 00 02  DWORD test status_2 @ +0x08 (0x1D27B18).
     * No 66 prefix. Imm32 0x02004009 = Sleep|Stop|Confuse|Angel Wing.
     * IDA names "offset unk_2004009" — immediate, not a pointer. */
    if ((*(unsigned int *)(BATTLE_SLOT_DATA + off + 0x08) & 0x02004009u) != 0)
        goto loc_48EDC8;

    /* b8 01 00 00 00 ; c3 */
    return 1;

loc_48EDC8:
    /* 33 c0 ; c3 */
    return 0;
}
```
