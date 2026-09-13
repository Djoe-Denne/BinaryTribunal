# RelatedToShotIrvineLimit @ 0x48D1A0

- Instr (live): 22
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=190
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=43
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=49
- A==B: non
- Push IDB: oui
- SetType: char __cdecl RelatedToShotIrvineLimit(void)
- Notes parent: stride ASM 0xD0 (pas F_CHAR 0x1D0). Occupancy absente. SHOT_INDEX BYTE A1+AND 0xFF. K_SHOT stride 0x18 TargetInfo BYTE +0x0A. crisis BYTE +0xCA. Timer BYTE [K_MISC+0x37+crisis] (IDA duel_timer_crisis_4[edx], pas shot_timer[crisis-1]). flag=((~ti)&0xFF)>>4&1. add esp,8. EAX leftover callee. Pas de GetRandomInt, setcc, jcc, 66. Pas de Hex-Rays.

## C réconcilié

```c
/* RelatedToShotIrvineLimit @ 0x48D1A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 22 instr, size 0x4d. IDA type char(). No domain::.
 * Slot stride 0xD0 (lea*3 / lea*4 / shl4). No F_CHAR 0x1D0.
 * Occupancy not tested (no flag_data 1+2, no com_file_id).
 * SHOT_INDEX BYTE @ 0x1D28E24: A1 dword load then AND 0xFF.
 * K_SHOT @ 0x1CF8640, 8*0x18; TargetInfo BYTE +0x0A (disp 0x1CF864A, opcode 8A).
 * AI_CURRENT_EXECUTING_SLOT BYTE @ 0x1D27B0F.
 * crisis_level BYTE slot+0xCA (disp 0x1D27BDA, opcode 8A).
 * Timer BYTE [0x1CF8B4B + crisis] = K_MISC+0x37 (IDA duel_timer_crisis_4[edx]).
 * not cl; and ecx,0FFh; shr 4; and 1. No setcc, no jcc, no 66.
 * add esp,8. Return EAX leftover from callee. No GetRandomInt.
 */

extern unsigned char SHOT_INDEX;                /* 0x1D28E24 */
extern unsigned char K_SHOT[];                  /* 0x1CF8640 */
extern unsigned char AI_CURRENT_EXECUTING_SLOT; /* 0x1D27B0F */
extern unsigned char BATTLE_SLOT_DATA[];        /* 0x1D27B10 */
extern unsigned char K_MISC[];                  /* 0x1CF8B14 */

char __cdecl RelatedToUpdateShotIrvineLimit(__int16, __int16);

char __cdecl RelatedToShotIrvineLimit(void)
{
    unsigned int shot_index;   /* eax after AND 0xFF */
    unsigned char target_info; /* cl */
    unsigned int slot;         /* al */
    unsigned int flag;         /* ecx */
    unsigned char crisis;      /* dl */
    unsigned char timer;       /* al */

    shot_index = *(unsigned int *)&SHOT_INDEX & 0xFFu;
    /* lea eax,[eax+eax*2]; mov cl, [eax*8+0x1CF864A] */
    target_info = K_SHOT[shot_index * 0x18 + 0x0A];
    slot = (unsigned int)AI_CURRENT_EXECUTING_SLOT;

    /* not cl; and ecx,0FFh; shr ecx,4; and ecx,1 */
    flag = (((~(unsigned int)target_info) & 0xFFu) >> 4) & 1u;

    /* lea edx,[eax+eax*2]; lea eax,[eax+edx*4]; shl eax,4 → slot*0xD0 */
    crisis = BATTLE_SLOT_DATA[slot * 0xD0 + 0xCA];
    /* mov al, [edx+0x1CF8B4B] */
    timer = K_MISC[0x37 + crisis];

    return RelatedToUpdateShotIrvineLimit((__int16)flag, (__int16)timer);
}
```
