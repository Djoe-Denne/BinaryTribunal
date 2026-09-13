# Camera_ClearTakeover_Set1E_1000 @ 0x5095F0

- Instr (live): 4
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: oui
- Push IDB: oui
- SetType: void Camera_ClearTakeover_Set1E_1000(void)
- Notes parent: 3 stores WORD 66. AND 7FFFh on dword_1D97704. MOV flags+0=0 (BYTE2 intact). word_1D9771E=1000h. Pas de callee/occupancy/0xD0/0x1D0/0x44. EAX leftover.

## C réconcilié

```c
/* Camera_ClearTakeover_Set1E_1000 @ 0x5095F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 4 instr, size 0x1C, end 0x50960C. IDA type void().
 * cdecl, 0 args, no saved regs, no locals, no callees, no add esp.
 * VOID: leftover EAX (no mov eax before retn).
 * 66 81 25: AND WORD [dword_1D97704], 0x7FFF — clear bit 15 only.
 * 66 C7 05 g_BattleCameraFlags: MOV WORD +0 = 0; BYTE2 @ 0x1D9771A untouched.
 * 66 C7 05 word_1D9771E: MOV WORD = 0x1000 (Q12 identity).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned int dword_1D97704;      /* 0x1D97704; this site WORD AND only */
extern unsigned int g_BattleCameraFlags; /* 0x1D97718; this site WORD MOV +0 only */
extern unsigned short word_1D9771E;    /* 0x1D9771E WORD 66 C7 */

void Camera_ClearTakeover_Set1E_1000(void)
{
    *(unsigned short *)&dword_1D97704 &= 0x7FFFu;
    *(unsigned short *)&g_BattleCameraFlags = 0;
    word_1D9771E = 0x1000;
}
```
