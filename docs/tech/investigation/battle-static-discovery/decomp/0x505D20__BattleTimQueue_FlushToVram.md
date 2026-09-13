# BattleTimQueue_FlushToVram @ 0x505D20

- Instr (live): 67
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=327
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=857
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=123
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleTimQueue_FlushToVram(void)
- Notes parent: jle signed count. ja unsigned after movsx type. jpt 4 cases @ 0x505DE0. Stride 0x10 pas 0xD0. Case 1 img=[esi]+[edi]+8 (pas +16). Case 3 sar 10h puis and FFFFh. add esp 8/10h/8/0Ch. Leftover EAX=count. Occupancy 1+2 absent. Pas de 66/setcc.

## C réconcilié

```c
/* BattleTimQueue_FlushToVram @ 0x505D20
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 67 instr, size 0xC0, end 0x505DE0. cdecl, 0 args, retn C3.
 * Count dword_1D98420 signed; test/jle early zeros count; leftover EAX = that count.
 * esi = unk_1D9822C; slot stride 0x10; type movsx BYTE [esi-0Ch]; cmp 3; ja unsigned.
 * jpt_505D40 @ 0x505DE0 (4 DWORD): 505D47/505D58/505D84/505D95.
 * Case 0: copyblockToVRAM(esi-8, *[esi]) add esp,8.
 * Case 1: edi=[esi]+8; two copyblockToVRAM(edi+4, edi+0Ch) then
 *   ( *[esi] + *[edi] + 8 ) +4 / +0Ch; one add esp,10h.
 * Case 2: readbackVramRectToRam(esi-8, *[esi]) add esp,8.
 * Case 3: moveVramRectToVram(esi-8, u16([esi]), u16(sar [esi],10h)) add esp,0Ch.
 * Tail always: reload count, esi+=10h, inc ebx, jl signed.
 * Flush end: count=0; leftover EAX = last reload.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No 66. No setcc. No domain::.
 */

extern int dword_1D98420;             /* 0x1D98420 DWORD signed count */
extern unsigned char unk_1D9822C[];   /* 0x1D9822C slot0 payload; type at 0x1D98220 */

extern int __cdecl copyblockToVRAM(__int16 *rect, char *pixels);
extern int __cdecl readbackVramRectToRam(__int16 *rect, char *dst);
extern int __cdecl moveVramRectToVram(__int16 *rect, int xy_low, int xy_high);

int __cdecl BattleTimQueue_FlushToVram(void)
{
    int count;
    int i;
    unsigned char *slot;
    unsigned char *edi;
    unsigned char *img;
    unsigned int packed;
    int type;

    count = dword_1D98420;
    if (count <= 0) { /* test eax,eax; jle loc_505DD4 */
        dword_1D98420 = 0;
        return count;
    }

    slot = unk_1D9822C; /* esi */
    i = 0;               /* ebx */
    do {
        type = (signed char)slot[-0x0C]; /* 0F BE 46 F4 */
        if ((unsigned int)type <= 3) {   /* cmp eax,3; ja def */
            switch (type) {
            case 0: /* loc_505D47 */
                copyblockToVRAM((__int16 *)(slot - 8), *(char **)slot);
                break;
            case 1: /* loc_505D58 */
                edi = *(unsigned char **)slot + 8;
                copyblockToVRAM((__int16 *)(edi + 4), (char *)(edi + 0x0C));
                img = *(unsigned char **)slot + *(unsigned int *)edi + 8;
                copyblockToVRAM((__int16 *)(img + 4), (char *)(img + 0x0C));
                break;
            case 2: /* loc_505D84 */
                readbackVramRectToRam((__int16 *)(slot - 8), *(char **)slot);
                break;
            case 3: /* loc_505D95 */
                packed = *(unsigned int *)slot;
                moveVramRectToVram(
                    (__int16 *)(slot - 8),
                    packed & 0xFFFF,
                    ((int)packed >> 16) & 0xFFFF); /* sar 10h; and 0FFFFh */
                break;
            }
        }

        count = dword_1D98420; /* def_505D40 */
        slot += 0x10;
        i++;
    } while (i < count); /* jl loc_505D37 signed */

    dword_1D98420 = 0;
    return count; /* leftover EAX = last reload */
}
```
