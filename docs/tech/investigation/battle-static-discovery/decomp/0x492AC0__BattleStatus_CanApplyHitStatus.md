# BattleStatus_CanApplyHitStatus @ 0x492AC0

- Instr (live): 14
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: BOOL __cdecl BattleStatus_CanApplyHitStatus(int p_target_slot_id)
- Notes parent: stride 0xD0 lea/shl, pas F_CHAR 0x1D0, occupancy 1+2 absente (pas flag_data dh&0x10); BYTE status_1+0x80 Petrify 4; DWORD status_2+0x08 0x180800; HIT_STATUS_2 DWORD 0x04000000 bypass; EAX 1=gate (caller jnz skip) sinon 0; pas setcc/ja/jg/jpt_/GetRandomInt/66.

## C réconcilié

```c
/* BattleStatus_CanApplyHitStatus @ 0x492AC0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 14 instr, size 0x37. End 0x492AF7. IDA type BOOL __cdecl(int).
 * No domain::. Slot stride 0xD0 from BATTLE_SLOT_DATA @ 0x1D27B10. No F_CHAR 0x1D0.
 * Occupancy 1+2 unused (no flag_data +0x7C / dh&0x10). No GetRandomInt.
 * No setcc. No ja/jg. No jpt_. No 66 WORD.
 * Widths: HIT_STATUS_2 DWORD F7 05 imm 0x04000000; status_1 BYTE F6 +0x80 bit 4
 * Petrify; status_2 DWORD F7 +0x08 mask 0x180800.
 * EAX leftover: 1 if gate trips (Petrify | invuln) and bypass clear; else 0.
 * Caller 0x492649 add esp,4; test eax,eax; jnz skip.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 stride 0xD0 */
extern unsigned int   HIT_STATUS_2;     /* 0x1D2A234 DWORD */

int __cdecl BattleStatus_CanApplyHitStatus(int p_target_slot_id)
{
    unsigned int off;

    /* test HIT_STATUS_2, 4000000h ; jnz loc_492AF4 */
    if ((HIT_STATUS_2 & 0x04000000u) != 0)
        return 0;

    /* lea ecx,[eax+eax*2]; lea eax,[eax+ecx*4]; shl eax,4 => slot*0xD0 */
    off = (unsigned int)p_target_slot_id * 0xD0u;

    /* test byte ptr status_1[eax], 4 ; jnz loc_492AEE */
    if ((BATTLE_SLOT_DATA[off + 0x80] & 4) != 0)
        return 1;

    /* test status_2[eax], 180800h ; jz loc_492AF4 else loc_492AEE */
    if ((*(unsigned int *)(BATTLE_SLOT_DATA + off + 0x08) & 0x180800u) != 0)
        return 1;

    return 0;
}
```
