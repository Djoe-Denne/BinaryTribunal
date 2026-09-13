# BattleTarget_IsEligibleByStatus @ 0x4877B0

- Instr (live): 15
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl BattleTarget_IsEligibleByStatus(int slot_index)
- Notes parent: stride 0xD0 lea/shl ; BYTE f6 status_1 mask 5 Death|Petrify @ +0x80 ; DWORD f7 status_2 mask 0x4009 Sleep|Stop|Confuse @ +0x08 (pas Angel Wing) ; DWORD flag_data +0x7C `(~x>>14)&1` bit14 ; aucun setcc ; deux retn 0/1 ; callers Escape poll + CheckEscapeSuccess.

## C réconcilié

```c
/* BattleTarget_IsEligibleByStatus @ 0x4877B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 15 instr, size 0x34. cdecl, arg slot_index at [esp+4]. No callees.
 * Two retn: 0x4877e0 success bit, loc_4877E1 xor eax,eax.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 FF8BattleSlotData_s[11] stride 0xD0 */

unsigned int __cdecl BattleTarget_IsEligibleByStatus(int slot_index)
{
    unsigned int off; /* lea/shl: (slot+slot*2)*4+slot)<<4 = slot*0xD0 */

    off = (unsigned int)slot_index * 0xD0u;

    /* f6 80 90 7b d2 01 05  BYTE test status_1 @ +0x80 (0x1D27B90).
     * Host Status1Flag_e is WORD; this insn is BYTE. Mask 5 = Death|Petrify. */
    if ((BATTLE_SLOT_DATA[off + 0x80] & 5) != 0)
        goto loc_4877E1;

    /* f7 80 18 7b d2 01 09 40 00 00  DWORD test status_2 @ +0x08 (0x1D27B18).
     * No 66 prefix. Mask 0x4009 = Sleep|Stop|Confuse. Not Angel Wing. */
    if ((*(unsigned int *)(BATTLE_SLOT_DATA + off + 0x08) & 0x4009u) != 0)
        goto loc_4877E1;

    /* 8b 80 8c 7b d2 01  DWORD flag_data @ +0x7C (0x1D27B8C)
     * f7 d0 ; c1 e8 0e ; 83 e0 01 ; c3
     * (~flag_data >> 14) & 1  — bit14 set → 0, clear → 1. No setcc. */
    return (~*(unsigned int *)(BATTLE_SLOT_DATA + off + 0x7C) >> 14) & 1u;

loc_4877E1:
    /* 33 c0 ; c3 */
    return 0;
}
```
