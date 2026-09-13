# BattleTimQueue_EnqueueType1 @ 0x505E30

- Instr (live): 18
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=27
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=27
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=59
- A==B: non
- Push IDB: oui
- SetType: unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *)
- Notes parent: Count DWORD store avant jl signe &lt;0x20. BYTE type=1, DWORD TIM a +0xC, stride SHL 4=0x10. Succes EAX=curseur 2 chunks TIM (pas le slot). Fail EAX=0. Occupancy/GetRandomInt/0xD0 absents.

## C réconcilié

```c
/* BattleTimQueue_EnqueueType1 @ 0x505E30
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 18 instr, size 0x33, end 0x505e63. cdecl, 1 arg. No saved regs. retn C3.
 * EAX fail = 0 (33 C0). Success EAX = TIM cursor past 2 chunks (8B 01 / 03 C1).
 * No callees / no add esp. Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Widths: DWORD count 8B/89 0D; BYTE C6 00 01 type; DWORD 89 48 0C TIM ptr.
 * jl signed 7C (NOT ja). Count stored before jl (even overflow). No setcc / jpt / 66.
 */

extern unsigned int dword_1D98420;           /* 0x1D98420 queue count */
extern unsigned char unk_1D98220[];          /* 0x1D98220, 32 x stride 0x10 */

unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *tim)
{
    unsigned int count;
    unsigned char *slot;
    unsigned char *p;

    count = dword_1D98420;
    slot = unk_1D98220 + (count << 4);         /* SHL EAX,4 then ADD unk_1D98220 */
    count++;
    dword_1D98420 = count;                     /* store BEFORE jl */
    if ((int)count < 0x20) {                  /* 7C jl signed vs 20h */
        slot[0] = 1;                          /* BYTE type 1 */
        *(unsigned __int8 **)(slot + 0xC) = tim;
        p = tim + 8;
        p += *(unsigned int *)p;             /* first chunk size at TIM+8 */
        return p + *(unsigned int *)p;         /* EAX = ecx + [ecx] */
    }
    return 0;
}
```
