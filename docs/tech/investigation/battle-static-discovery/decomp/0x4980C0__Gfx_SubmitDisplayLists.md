# Gfx_SubmitDisplayLists @ 0x4980C0

- Instr (live): 78
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=38
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=16
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=17
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Gfx_SubmitDisplayLists(void)
- Notes parent: 3 walks C4/C8/D0 incond. ; RS(2,0) puis extra C0+48/4C et BC+48/4C/50/54 DWORD jz ; RS(2,1) ; add esp 24h/8/0Ch ; EAX leftover SetRenderState ; occupancy/0xD0/0x1D0 absents ; pas d unlink ; shared field/battle/menu/world

## C réconcilié

```c
/* Gfx_SubmitDisplayLists @ 0x4980C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 78 instr, size 0xE1, end 0x4981A1. IDA type int().
 * cdecl 0 args. Saved ESI = buffer from FFGetBufferAddress. No sub esp. retn C3.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No domain::. DWORD loads only. No 66 / setcc / ja/jg (jz only).
 * add esp 24h = 3*Walk(8) + SetRenderState 0xC; optional walks add esp 8; last RS add esp 0Ch.
 * EAX leftover from last Gfx_SetRenderState. No unlink. dword_1D2B0CC unused.
 */

extern int dword_1D2B0BC; /* object pointer; lists at +0x48/+0x4C/+0x50/+0x54 */
extern int dword_1D2B0C0; /* object pointer; lists at +0x48/+0x4C */
extern int dword_1D2B0C4; /* list, walked unconditionally */
extern int dword_1D2B0C8;
extern int dword_1D2B0D0;

int __cdecl FFGetBufferAddress(void);
int *__cdecl sub_4B3550(void);
int __cdecl sub_4B36D0(void);
int __cdecl sub_4B3690(void);
int __cdecl Gfx_WalkDrawList(int list, int buffer);
void __cdecl Gfx_SetRenderState(unsigned int type, int value, int buffer);

int __cdecl Gfx_SubmitDisplayLists(void)
{
    int buffer;
    int list;

    buffer = FFGetBufferAddress(); /* ESI */
    sub_4B3550(); /* EAX discarded */
    sub_4B36D0(); /* EAX discarded */

    Gfx_WalkDrawList(dword_1D2B0C4, buffer);
    Gfx_WalkDrawList(dword_1D2B0C8, buffer);
    Gfx_WalkDrawList(dword_1D2B0D0, buffer);

    Gfx_SetRenderState(2, 0, buffer);
    /* mov eax,dword_1D2B0C0 ; add esp,24h ; mov eax,[eax+48h] */

    list = *(int *)(dword_1D2B0C0 + 0x48);
    if (list != 0)
        Gfx_WalkDrawList(list, buffer); /* loc_49811B if null */

    list = *(int *)(dword_1D2B0C0 + 0x4C);
    if (list != 0)
        Gfx_WalkDrawList(list, buffer); /* loc_498132 if null */

    list = *(int *)(dword_1D2B0BC + 0x48);
    if (list != 0)
        Gfx_WalkDrawList(list, buffer); /* loc_498149 if null */

    list = *(int *)(dword_1D2B0BC + 0x4C);
    if (list != 0)
        Gfx_WalkDrawList(list, buffer); /* loc_49815F if null */

    list = *(int *)(dword_1D2B0BC + 0x50);
    if (list != 0)
        Gfx_WalkDrawList(list, buffer); /* loc_498176 if null */

    list = *(int *)(dword_1D2B0BC + 0x54);
    if (list != 0)
        Gfx_WalkDrawList(list, buffer); /* loc_49818D if null */

    sub_4B3690();
    Gfx_SetRenderState(2, 1, buffer);
    /* EAX leftover from Gfx_SetRenderState; pop esi; retn */
}
```
