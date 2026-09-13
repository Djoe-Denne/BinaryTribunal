# BattleLimitRenzokuken_SetFinisherAndComputeTargetMask @ 0x48F270

- Instr (live): 23
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: uint16_t __cdecl BattleLimitRenzokuken_SetFinisherAndComputeTargetMask(int finisher_idx, uint16_t caller_mask)
- Notes parent: BYTE `byte_1D28E2E[0]=AL` puis lea idx*24 ; `targetInfo` +0x0A @ 0x1CF7596 ; deux cdecl + add esp 8 ; `mov si,ax` puis `or esi,eax` ; `test esi,8000h` jnz garde AX sinon caller_mask WORD `[esp+10h]` ; occupancy / 0xD0 / 0x1D0 absents ; GetRandomInt N/A ; wiki 12o rejeté (ASM 24).

## C réconcilié

```c
/* BattleLimitRenzokuken_SetFinisherAndComputeTargetMask @ 0x48F270
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 23 instr, size 0x47. IDA type uint16_t __cdecl(int, uint16_t). No domain::.
 * Kernel row stride 24 (lea eax+eax*2 then [edi*8]). targetInfo BYTE +0x0A @ 0x1CF7596.
 * Occupancy unused. Slot 0xD0 / F_CHAR 0x1D0 unused. GetRandomInt unused.
 * No setcc. No ja/jg (jnz only).
 */

extern unsigned char byte_1D28E2E[2];        /* 0x1D28E2E, selected finisher idx in [0] */
extern unsigned char K_RENZOKUKEN_FINISHER[]; /* 0x1CF758C, FF8KernelRenzokukenFinisher size 24 */

unsigned __int16 __cdecl BattleTarget_ComputeMaskFromDefaultTarget(unsigned __int8 target_info);
unsigned __int16 __cdecl BattleTarget_GetMaskFromInfoField(unsigned __int8 target_info);

uint16_t __cdecl BattleLimitRenzokuken_SetFinisherAndComputeTargetMask(int finisher_idx, uint16_t caller_mask)
{
    unsigned char target_info;
    unsigned int combined;
    uint16_t ax;

    /* A2 2E 8E D2 01 : BYTE store AL. EAX still full finisher_idx for the lea. */
    byte_1D28E2E[0] = (unsigned char)finisher_idx;

    /* lea edi,[eax+eax*2]; mov al, [edi*8+0x1CF7596] ; same BYTE reloaded into CL later */
    target_info = K_RENZOKUKEN_FINISHER[(unsigned int)finisher_idx * 24u + 0x0A];

    /* mov si, ax : low 16 of first callee. High ESI leftover is not in C; 0x8000 test is bit 15. */
    combined = (unsigned int)BattleTarget_ComputeMaskFromDefaultTarget(target_info);
    combined |= (unsigned int)BattleTarget_GetMaskFromInfoField(target_info);
    /* add esp, 8 */

    ax = (uint16_t)combined; /* 66 8B C6 */
    if (combined & 0x8000u) /* F7 C6 00 80 00 00 ; jnz loc_48F2B4 */
        return ax;
    return caller_mask; /* 66 8B 44 24 10 after push esi/edi */
}
```
