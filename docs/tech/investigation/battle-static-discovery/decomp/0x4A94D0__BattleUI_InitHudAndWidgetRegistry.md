# BattleUI_InitHudAndWidgetRegistry @ 0x4A94D0

- Instr (live): 172
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5321
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3628
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4693
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleUI_InitHudAndWidgetRegistry()
- Notes parent: ebx=0. edi sauve dword_1D6D490 apres 3 appels, restore avant ret. Widget +3D8 stride 0x14 (pas 0xD0/0x1D0). WORD 66: +4/+6/+1C/+1E et +3AE &=FFFD puis FFF7. return1 ignore 2 args, EAX=1. EAX leftover=sub_49FAD0(0x1000). Occupancy/GetRandomInt/ja/jg/jpt absents. cmp 4A9675 mort. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleUI_InitHudAndWidgetRegistry @ 0x4A94D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 172 instr, size 0x2A5, end 0x4A9775. IDA type int __cdecl().
 * No domain::. ebx=0 whole body. Occupancy 1+2 unused. GetRandomInt unused.
 * No ja/jg, no setcc, no jpt. Dead cmp dword_1D6D618 vs unk_1D6D698 (no jcc).
 * WORD 66: word_1D74E9A, hud+4/+6/+1C/+1E, base+0x3AE &= 0xFFFD then 0xFFF7.
 * return1 is mov eax,1; ret — two pushed args ignored, EAX=1 to dword_1D6D61C.
 * EAX leftover at retn = sub_49FAD0(0x1000). dword_1D6D490 restored from edi.
 */

extern int __cdecl set_dword_1D2BA24_sub_49F520(int);
extern int *sub_49A910(void);
extern int __cdecl sub_49E6D0(int);
extern char *__cdecl AddBase_1A78C88(int);
extern int __cdecl sub_49EF00(char);
extern void __cdecl Table4x24_Clear_1D6BBB8(int);
extern char *__cdecl BattleUI_PlaceWidget_3D8(int x, int y, int id, int flags);
extern void sub_4AB420(void);
extern void sub_4BAFF0(void);
extern void sub_4BA060(void);
extern void sub_4AD670(void);
extern void sub_4BCBE0(void);
extern void sub_4B1B00(void);
extern void sub_4AB100(void);
extern void nullsub_18(void);
extern void sub_4B1E90(void);
extern void sub_4BB010(void);
extern int __cdecl BattleMenu_SetWord_1D2B120_and_1D2B1E4(int, int, short);
extern void *sub_4A3220(void);
extern int __cdecl return1(int tick, int ctx);
extern char __cdecl sub_49FAD0(int);
extern int __cdecl BattleUI_HudInputAndATBTick(void);

extern unsigned char SG_CONFIG_FLAGS_SETTING;
extern unsigned int SG_GAME_TIME;
extern unsigned int dword_1D6D490;
extern unsigned char byte_1D6D634;
extern unsigned int dword_1D6D4A0;
extern void *g_BattleUI_HudDrawEnv;
extern unsigned short word_1D74E9A;
extern unsigned int dword_1D6D630;
extern unsigned int dword_1D6D4A4;
extern unsigned int dword_1D6D628;
extern unsigned int dword_1D6D620;
extern unsigned int dword_1D6D494;
extern unsigned int dword_1D6D618;
extern unsigned int dword_1D6D498;
extern unsigned char byte_1D76A78;
extern int BATTLE_ESCAPE_HOLD_FRAMES;
extern unsigned char BATTLE_ESCAPE_INPUT_ACTIVE;
extern unsigned int dword_1D6D61C;
extern unsigned int dword_1D6D62C;
extern unsigned char byte_1D6D624;
extern unsigned char unk_F00118;
extern unsigned char unk_F00100;
extern unsigned char unk_1D6D698;
extern unsigned char unk_1D71298;

int __cdecl BattleUI_InitHudAndWidgetRegistry(void)
{
    unsigned int saved_1D6D490;
    unsigned char *hud;
    unsigned char *widget;
    unsigned char *base;
    unsigned char keep;
    int ret;

    set_dword_1D2BA24_sub_49F520(0);
    sub_49A910();
    sub_49E6D0(0);

    saved_1D6D490 = dword_1D6D490;

    byte_1D6D634 = 0;
    dword_1D6D4A0 = 0;
    g_BattleUI_HudDrawEnv = 0;

    hud = (unsigned char *)AddBase_1A78C88(0) + 0x390;
    dword_1D6D490 = (unsigned int)hud;

    word_1D74E9A = (unsigned short)sub_49EF00(0);

    hud = (unsigned char *)dword_1D6D490;
    hud[0x22] = 0;
    *(unsigned short *)(hud + 0x04) = 0;
    *(unsigned short *)(hud + 0x06) = 0;

    widget = (unsigned char *)AddBase_1A78C88(0) + 0x3D8;
    base = (unsigned char *)AddBase_1A78C88(0);

    keep = widget[0x10] & 0x0F;
    *(unsigned int *)(widget + 0x08) = (unsigned int)&unk_F00118;
    *(unsigned int *)(widget + 0x04) = (unsigned int)&unk_F00118;
    *(unsigned int *)widget = 0x00100018;
    widget[0x10] = keep;
    widget[0x13] = 0;

    keep = widget[0x24] & 0x0F;
    widget += 0x14;
    *(unsigned int *)(widget + 0x08) = (unsigned int)&unk_F00100;
    *(unsigned int *)(widget + 0x04) = (unsigned int)&unk_F00100;
    *(unsigned int *)widget = 0x00100018;
    widget[0x10] = keep;
    widget[0x13] = 0;

    hud = base + 0x390;
    *(unsigned int *)dword_1D6D490 = 0x74101000;

    *(unsigned short *)(hud + 0x1C) = 0;
    hud[0x2E] = 0;
    hud[0x2D] = 4;

    if (SG_CONFIG_FLAGS_SETTING & 0x10)
        hud[0x20] = (unsigned char)((hud[0x20] & 0xF1) | 1);
    else
        hud[0x20] &= 0xF0;

    *(unsigned int *)(hud + 0x04) = 0;
    *(unsigned int *)(hud + 0x10) = 0;
    hud[0x20] = (unsigned char)(hud[0x20] & 0x0F);
    *(unsigned int *)(hud + 0x14) = 0;
    *(unsigned int *)(hud + 0x18) = 0;
    *(unsigned short *)(hud + 0x1E) = 0;

    dword_1D6D630 = SG_GAME_TIME & 0x7FFF;
    dword_1D6D4A4 = 0;
    dword_1D6D628 = 0;
    Table4x24_Clear_1D6BBB8(-1);
    dword_1D6D620 = 1;
    dword_1D6D494 = 0;

    BattleUI_PlaceWidget_3D8(0x80, 0x80, 0, 0);
    BattleUI_PlaceWidget_3D8(0x80, 0x80, 0, 2);

    {
        unsigned char *p = (unsigned char *)AddBase_1A78C88(0) + 0x3E8;
        *p = (unsigned char)((*p & 0xF0) ^ 1);
    }
    {
        unsigned char *p = (unsigned char *)AddBase_1A78C88(0) + 0x3FC;
        *p = (unsigned char)((*p & 0xF0) ^ 1);
    }
    {
        unsigned short *p = (unsigned short *)(AddBase_1A78C88(0) + 0x3AE);
        *p &= 0xFFFD;
    }

    hud = (unsigned char *)dword_1D6D490;
    dword_1D6D618 = (unsigned int)&unk_1D71298;
    dword_1D6D498 = (unsigned int)&unk_1D6D698;
    hud[0x22] = 0;

    *(unsigned char *)(AddBase_1A78C88(0) + 0x3BD) = 0xFF;
    byte_1D76A78 = 0;

    sub_4AB420();
    sub_4BAFF0();
    sub_4BA060();
    sub_4AD670();
    sub_4BCBE0();
    sub_4B1B00();

    BATTLE_ESCAPE_HOLD_FRAMES = 0;
    BATTLE_ESCAPE_INPUT_ACTIVE = 0;

    sub_4AB100();
    nullsub_18();
    sub_4B1E90();
    sub_4BB010();

    BattleMenu_SetWord_1D2B120_and_1D2B1E4(0, 0, 0x5000);
    BattleMenu_SetWord_1D2B120_and_1D2B1E4(0, 1, (short)0xA000);
    BattleMenu_SetWord_1D2B120_and_1D2B1E4(0, 2, 0x00F0);
    BattleMenu_SetWord_1D2B120_and_1D2B1E4(0, 3, 0x000F);

    dword_1D6D61C = (unsigned int)return1(
        (int)BattleUI_HudInputAndATBTick,
        (int)sub_4A3220());

    {
        unsigned short *p = (unsigned short *)(AddBase_1A78C88(0) + 0x3AE);
        *p &= 0xFFF7;
    }

    dword_1D6D618 = (unsigned int)&unk_1D6D698;
    dword_1D6D498 = (unsigned int)&unk_1D71298;
    *(unsigned int *)dword_1D6D490 = 0x64808080;

    ret = (int)sub_49FAD0(0x1000);

    dword_1D6D490 = saved_1D6D490;
    dword_1D6D62C = 0;
    byte_1D6D624 = 0;

    return ret;
}
```
