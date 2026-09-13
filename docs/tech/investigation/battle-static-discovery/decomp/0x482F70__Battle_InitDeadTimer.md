# Battle_InitDeadTimer @ 0x482F70

- Instr (live): 3
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=28
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non (même sémantique ; casts/commentaires)
- Push IDB: oui
- SetType: `__int16 Battle_InitDeadTimer(void)` (TYPE_AFTER `__int16()`)
- Notes parent: octets `66 0F B6 05 23 8B CF 01` = movzx AX depuis BYTE `K_MISC.dead_timer` @ 0x1CF8B23 ; `66 A3 E4 8D D2 01` = store WORD `BATTLE_DEAD_TIMER` @ 0x1D28DE4 ; `C3` EAX high inchangé, AX = byte zero-étendu. Kernel +0x0F, fixture 200. Réconciliation Grok 4.6 Extra High.

## C réconcilié

```c
/* Battle_InitDeadTimer @ 0x482F70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 3 instr, size 15. IDA type __int16(). No args, no callees.
 * BYTE load 66 0F B6 ; WORD store 66 A3.
 */

extern unsigned char  K_MISC_dead_timer; /* 0x1CF8B23 = K_MISC 0x1CF8B14 + 0x0F */
extern unsigned short BATTLE_DEAD_TIMER; /* 0x1D28DE4 */

__int16 Battle_InitDeadTimer(void)
{
    /* 482f70  66 0F B6 05 23 8B CF 01  movzx ax, byte ptr [0x1CF8B23] */
    /* 482f78  66 A3 E4 8D D2 01        mov word ptr [0x1D28DE4], ax */
    BATTLE_DEAD_TIMER = (unsigned short)K_MISC_dead_timer;
    /* 482f7e  C3  retn — AX leftover = zero-extended byte; EAX high word unchanged */
    return (__int16)(unsigned short)K_MISC_dead_timer;
}
```
