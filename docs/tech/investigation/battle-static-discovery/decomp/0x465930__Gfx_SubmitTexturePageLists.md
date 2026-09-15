# Gfx_SubmitTexturePageLists @ 0x465930

- Instr (live): 300
- Palier: low
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7748
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8812
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=3593
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl Gfx_SubmitTexturePageLists(void)
- Notes parent: Walk uses global VALUES not &global. Pass 0/1/2 sub/dec/jz; jle/jl SIGNED. Slot stride 0x44C (not +44h), item 0x64, count [slot-0x324]. Second bank 0x470 if dword_1CCFD90, setnz RS(2,p!=0), no NULL check. Clear 0x44C batches 0x20; clear 0x470 is flat. Occupancy 1+2 / TIM 0x10 / TEST AL,2 / OT 07/24 absents. EAX leftover cursor.

## C réconcilié

```c
/* Gfx_SubmitTexturePageLists @ 0x465930
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 300 instr, size 0x37F (895), end exclusive 0x465CAF. cdecl, 0 args, retn C3, no EBP frame.
 * ESI = FFGetBufferAddress() until the final SelectRT (buffer pushed, then xor esi,esi).
 * EAX at retn is leftover clear-loop cursor, not a documented draw-list result.
 * Pass ids: three DWORD reads unk_B7DB48, +4, signed jle vs &byte_B7DB50.
 * Tpage bank: stride 0x44C, count at [slot-0x324] SIGNED jle, items 0x64, bitmask *slot,
 * two lists at +0x24 + (ebx+pass*2)*4, flag +0x58. Batches of 0x20, signed jl vs &dword_1CCFFE4.
 * Second bank if dword_1CCFD90: stride 0x470, flag +0x464, lists +0x24+ebp*8, NO null check,
 * setnz RS(2, ebp!=0). Exactly 0x20 slots x 2 ebp. Clear 0x470 has NO 0x20 batch.
 * jcc: jz/jnz, jl/jle SIGNED (7C/0F8C/0F8E). setnz 0F95. NO ja/jg, NO jpt.
 * Occupancy 1+2 / 0xD0 / 0x1D0 / GF Exists +44h / TEST AL,2 / OT 07/24 / TIM 0x10: ABSENT.
 * add 44Ch is slot stride, not +44h. gfx_driver slots 33/39/29/30 are not occupancy.
 */

typedef unsigned int _DWORD;

extern int __cdecl FFGetBufferAddress(void);
extern int __cdecl GfxDriver_SetBlendMode(int mode, int buffer);
extern int __cdecl GfxDriver_SelectRenderTarget(int target, int buffer);
extern void __cdecl Gfx_SetRenderState(int type, int value, int buffer);
extern void __cdecl Gfx_WalkDrawList(_DWORD *list, int buffer);
extern int __cdecl Gfx_InvalidateDrawListStamp(int list);

extern unsigned int dword_1CB6030;
extern unsigned int dword_1CB6034;
extern unsigned int dword_1CCFD44;
extern unsigned int dword_1CCFD48;
extern unsigned int dword_1CCFD4C;
extern unsigned int unk_B7DB48;
extern unsigned char byte_B7DB50;
extern unsigned int dword_1CB6364;
extern unsigned int unk_1CB6368;
extern unsigned int dword_1CCFFE4;
extern unsigned int dword_1CCFFE8;
extern unsigned int dword_1CCFD84;
extern unsigned int dword_1CCFD90;
extern unsigned int unk_1CAD228;
extern unsigned int unk_1CAD690;
extern unsigned int dword_1CB6490;

_DWORD *__cdecl Gfx_SubmitTexturePageLists(void)
{
    int buffer;
    unsigned int *pass;
    unsigned int passId;
    unsigned int *slot;
    unsigned int *item;
    unsigned int *clr;
    unsigned int *bank;
    _DWORD *list;
    _DWORD **listSlot;
    int itemIdx;
    int listIdx;
    int n;
    int count;
    int p;

    buffer = FFGetBufferAddress();

    GfxDriver_SetBlendMode(1, buffer);
    GfxDriver_SelectRenderTarget(1, buffer);
    Gfx_SetRenderState(0xE, 1, buffer);
    Gfx_SetRenderState(0x10, 1, buffer);
    Gfx_WalkDrawList((_DWORD *)dword_1CB6030, buffer);
    Gfx_WalkDrawList((_DWORD *)dword_1CB6034, buffer);
    Gfx_InvalidateDrawListStamp((int)dword_1CB6030);
    Gfx_InvalidateDrawListStamp((int)dword_1CB6034);

    GfxDriver_SetBlendMode(4, buffer);
    GfxDriver_SelectRenderTarget(0, buffer);
    Gfx_SetRenderState(0xE, 1, buffer);
    Gfx_WalkDrawList((_DWORD *)dword_1CCFD44, buffer);
    Gfx_InvalidateDrawListStamp((int)dword_1CCFD44);
    Gfx_WalkDrawList((_DWORD *)dword_1CCFD48, buffer);
    Gfx_InvalidateDrawListStamp((int)dword_1CCFD48);
    Gfx_WalkDrawList((_DWORD *)dword_1CCFD4C, buffer);
    Gfx_InvalidateDrawListStamp((int)dword_1CCFD4C);

    Gfx_SetRenderState(2, 0, buffer);
    Gfx_SetRenderState(0x10, 0, buffer);

    pass = &unk_B7DB48;
    do
    {
        passId = *pass;

        if (passId == 0)
        {
            GfxDriver_SelectRenderTarget(0, buffer);
            Gfx_SetRenderState(0xE, 1, buffer);
            Gfx_SetRenderState(2, 0, buffer);
        }
        else if (passId == 1)
        {
            GfxDriver_SelectRenderTarget(0, buffer);
            Gfx_SetRenderState(0xE, 1, buffer);
            Gfx_SetRenderState(2, 1, buffer);
        }
        else if (passId == 2)
        {
            GfxDriver_SelectRenderTarget(1, buffer);
            Gfx_SetRenderState(0xE, 1, buffer);
            Gfx_SetRenderState(2, 0, buffer);
        }

        slot = &dword_1CB6364;
        do
        {
            n = 0x20;
            do
            {
                if (*slot != 0)
                {
                    count = *(int *)((char *)slot - 0x324);
                    item = (unsigned int *)((char *)slot - 0x320);
                    if (count > 0)
                    {
                        for (itemIdx = 0; itemIdx < count; itemIdx++)
                        {
                            if (*slot & (1u << itemIdx))
                            {
                                if (passId == 2 || dword_1CCFD84 == 0)
                                    Gfx_SetRenderState(0xB, 0, buffer);
                                else
                                {
                                    Gfx_SetRenderState(0x19, 0x70, buffer);
                                    Gfx_SetRenderState(0x18, 5, buffer);
                                    Gfx_SetRenderState(0xB, 1, buffer);
                                }
                                for (listIdx = 0; listIdx < 2; listIdx++)
                                {
                                    if (item[0x58 / 4] != 0)
                                    {
                                        listSlot = (_DWORD **)((char *)item + 0x24
                                            + (listIdx + (int)passId * 2) * 4);
                                        list = *listSlot;
                                        if (list != 0)
                                        {
                                            Gfx_WalkDrawList(list, buffer);
                                            Gfx_InvalidateDrawListStamp((int)*listSlot);
                                        }
                                    }
                                }
                            }
                            item = (unsigned int *)((char *)item + 0x64);
                        }
                    }
                }
                slot = (unsigned int *)((char *)slot + 0x44C);
            } while (--n != 0);
        } while ((int)slot < (int)&dword_1CCFFE4);

        pass++;
    } while ((int)pass <= (int)&byte_B7DB50);

    if (dword_1CCFD90 != 0)
    {
        GfxDriver_SetBlendMode(0, buffer);
        GfxDriver_SelectRenderTarget(1, buffer);
        Gfx_SetRenderState(0xE, 1, buffer);

        for (p = 0; p < 2; p++)
        {
            bank = &unk_1CAD228;
            n = 0x20;
            do
            {
                if (bank[0x464 / 4] != 0)
                {
                    if (dword_1CCFD84 != 0)
                    {
                        Gfx_SetRenderState(0x19, 0x70, buffer);
                        Gfx_SetRenderState(0x18, 5, buffer);
                        Gfx_SetRenderState(0xB, 1, buffer);
                    }
                    Gfx_SetRenderState(2, (p != 0), buffer);
                    Gfx_SetRenderState(0xE, 1, buffer);
                    listSlot = (_DWORD **)((char *)bank + 0x24 + p * 8);
                    listIdx = 2;
                    do
                    {
                        Gfx_WalkDrawList(*listSlot, buffer);
                        Gfx_InvalidateDrawListStamp((int)*listSlot);
                        listSlot++;
                    } while (--listIdx != 0);
                }
                bank = (unsigned int *)((char *)bank + 0x470);
            } while (--n != 0);
        }
    }

    GfxDriver_SetBlendMode(4, buffer);
    GfxDriver_SelectRenderTarget(0, buffer);

    clr = &unk_1CB6368;
    do
    {
        n = 0x20;
        do
        {
            clr[-1] = 0;
            clr[0] = 0;
            clr = (unsigned int *)((char *)clr + 0x44C);
        } while (--n != 0);
    } while ((int)clr < (int)&dword_1CCFFE8);

    if (dword_1CCFD90 != 0)
    {
        clr = &unk_1CAD690;
        do
        {
            clr[-1] = 0;
            clr[0] = 0;
            clr = (unsigned int *)((char *)clr + 0x470);
        } while ((int)clr < (int)&dword_1CB6490);
    }

    return (_DWORD *)clr;
}
```
