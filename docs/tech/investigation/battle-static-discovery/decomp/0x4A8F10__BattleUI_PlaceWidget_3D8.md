# BattleUI_PlaceWidget_3D8 @ 0x4A8F10

- Instr (live): 95
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=138
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=933
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=931
- A==B: non
- Push IDB: oui
- SetType: char *__cdecl BattleUI_PlaceWidget_3D8(int x, int y, int id, int flags)
- Notes parent: HUD root AddBase(0)+0x3D8. jge signé flags<0 clear BYTE+12/+26 WORD+0C/+0E/+20/+22 (+11/+25 intacts). Biais bit2:-8,-8 else (cl&5)==0:x-0x17. bit1 rec0 sel=0 sinon rec1 sel=1 EAX+0x14. id==0 stores XY=0 call esi/edi. EAX leftover sub_4A8130 hors clear. Occupancy/GetRandomInt/0xD0/0x1D0 absents.

## C réconcilié

```c
/* BattleUI_PlaceWidget_3D8 @ 0x4A8F10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 95 instr, size 0xE9, end 0x4A8FF9. IDA type char *__cdecl(int, int, int, int).
 * Slot 0xD0 / F_CHAR 0x1D0 / occupancy / GetRandomInt: unused.
 * jge signed (flags >= 0). ja/jg/setcc/jpt: none.
 * WORD 66: +0C/+0E/+20/+22. BYTE: +11/+12/+25/+26. +11/+25 not cleared.
 * add esp: 4 after AddBase_1A78C88; 14h after each sub_4A8130.
 */

extern char *__cdecl AddBase_1A78C88(int);
extern int __cdecl sub_4A8130(int, int, int, int, int);

char *__cdecl BattleUI_PlaceWidget_3D8(int x, int y, int id, int flags)
{
    char *widget;
    int x_adj;
    int y_adj;

    widget = AddBase_1A78C88(0) + 0x3D8;

    if (flags < 0) {
        widget[0x12] = 0;
        *(short *)(widget + 0x0C) = 0;
        *(short *)(widget + 0x0E) = 0;
        widget[0x26] = 0;
        *(short *)(widget + 0x20) = 0;
        *(short *)(widget + 0x22) = 0;
        return widget;
    }

    if (flags & 4) {
        x_adj = x - 8;
        y_adj = y - 8;
    } else if ((flags & 5) == 0) {
        x_adj = x - 0x17;
        y_adj = y;
    } else {
        x_adj = x;
        y_adj = y;
    }

    if (flags & 2) {
        if (id != 0) {
            *(short *)(widget + 0x0C) = (short)x_adj;
            *(short *)(widget + 0x0E) = (short)y_adj;
        } else {
            *(short *)(widget + 0x0C) = 0;
            *(short *)(widget + 0x0E) = 0;
        }
        widget[0x12] = (char)id;
        widget[0x11] = (char)(flags & 5);
        return (char *)sub_4A8130(x_adj, y_adj, id, 0, (int)widget);
    }

    if (id != 0) {
        *(short *)(widget + 0x20) = (short)x_adj;
        *(short *)(widget + 0x22) = (short)y_adj;
    } else {
        *(short *)(widget + 0x20) = 0;
        *(short *)(widget + 0x22) = 0;
    }
    widget[0x26] = (char)id;
    widget[0x25] = (char)(flags & 5);
    return (char *)sub_4A8130(x_adj, y_adj, id, 1, (int)(widget + 0x14));
}
```
