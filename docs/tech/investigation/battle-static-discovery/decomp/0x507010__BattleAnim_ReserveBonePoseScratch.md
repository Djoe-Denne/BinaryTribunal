# BattleAnim_ReserveBonePoseScratch @ 0x507010

- Instr (live): 13
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=130
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=38
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=54
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleAnim_ReserveBonePoseScratch(void *anim_h3)
- Notes parent: jge signé. WORD 66 A3 occupancy (high word intact). *8 pas 0xD0. off_B6D080 une indirection. Occupancy 1+2 / 0x1D0 / 0x44 absents. EAX leftover.

## C réconcilié

```c
/* BattleAnim_ReserveBonePoseScratch @ 0x507010
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 13 instr, size 0x34, end 0x507044. cdecl, 1 arg. No saved regs. retn C3.
 * No call / add esp. Occupancy slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Widths: DWORD loads 8B; WORD store occupancy 66 A3 (high word of 0x1D98B5C kept);
 * DWORD store cursor 89 15. shl eax,3 = *8 not 0xD0. jge signed (7D), not ja.
 * EAX leftover: early = DWORD [arg-4]; success = (count16<<3). Callers overwrite.
 * No setcc / jpt / GetRandomInt. No domain::.
 */

extern unsigned int dword_1D98B5C; /* 0x1D98B5C WORD watermark (low 16), high word preserved */
extern unsigned int dword_1D98B3C; /* 0x1D98B3C arena cursor after downward bump */
extern unsigned int off_B6D080;    /* 0xB6D080 DWORD, live IDB 0x196B018 arena top */

int __cdecl BattleAnim_ReserveBonePoseScratch(void *anim_h3)
{
    unsigned int count;
    unsigned int cur;
    unsigned int top;

    cur = dword_1D98B5C & 0xFFFFu;                      /* 8B 0D; 81 E1 FFFF0000 */
    count = *(unsigned int *)((char *)anim_h3 - 4);     /* 8B 40 FC */
    if ((int)cur >= (int)count)                         /* 3B C8; 7D 1C signed jge */
        return (int)count;                              /* locret_507043: EAX = [arg-4] */

    top = off_B6D080;                                   /* 8B 15 80 D0 B6 00 */
    *(unsigned short *)&dword_1D98B5C = (unsigned short)count; /* 66 A3: WORD AX */
    dword_1D98B3C = top - ((count & 0xFFFFu) << 3);     /* 25 FFFF0000; C1 E0 03; 2B D0; 89 15 */
    return (int)((count & 0xFFFFu) << 3);               /* leftover EAX = count16 * 8 */
}
```
