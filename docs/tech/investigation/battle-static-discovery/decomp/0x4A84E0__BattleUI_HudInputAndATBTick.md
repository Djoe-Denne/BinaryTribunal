# BattleUI_HudInputAndATBTick @ 0x4A84E0

- Instr (live): 258
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8086
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6475
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4159
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleUI_HudInputAndATBTick()
- Notes parent: HUD = AddBase(0)+0x390. Occupancy/F_CHAR/GetRandomInt/jpt/ja absents. WORD 66 sur +10..1A +1C +1E +24. setle axes. jl SIGNED look0. ATB si !DirectorReady. Render si g_BattleUI_HudDrawEnv DWORD != 0. Enqueue 40h/41h/50h sans namespace. Retour EAX=compteur+1 (wrap store 0).

## C réconcilié

```c
/* BattleUI_HudInputAndATBTick @ 0x4A84E0
 * Ground truth = live ASM (asm_clean.asm) + dump_bytes, not Hex-Rays.
 * 258 instr, size 0x389, end 0x4A8869. IDA type int __cdecl().
 * Occupancy 1+2 unused. F_CHAR 0x1D0 unused. slot*0xD0 unused. GF Exists 0x44 unused.
 * GetRandomInt absent. No jpt_. No ja/jg (jz/jnz/jl/jle/jns only). setle used.
 * HUD blob = AddBase_1A78C88(0)+0x390 in dword_1D6D490. Offsets, not a packed struct.
 * WORD 66: +10/+12/+14/+16/+18/+1A/+1C/+1E ANDs/+24, analog OR. BYTE +26/+27/+1E/+1F.
 * Delayed cdecl add esp,28h = 10 dwords. Enqueue names without presentation::.
 * ATB only if !pre_isBattle_DirectorReady. Render if g_BattleUI_HudDrawEnv != 0.
 * Return EAX = dword_1D74EA8+1 (may be 4 while global wraps to 0).
 */

extern unsigned int dword_1D6D490;
extern unsigned int dword_1D96DB8;
extern unsigned char byte_1D6D634;
extern unsigned int dword_1D74E9C;
extern int BATTLE_ESCAPE_HOLD_FRAMES;
extern unsigned char BATTLE_ESCAPE_INPUT_ACTIVE;
extern unsigned short word_1D74E9A;
extern unsigned char byte_1D2B2F0;
extern unsigned char byte_1D2B2F1;
extern void *g_BattleUI_HudDrawEnv;
extern unsigned int dword_1D74EA8;

extern char *__cdecl AddBase_1A78C88(int);
extern int sub_4A8C50(void);
extern int sub_49E9C0(void);
extern int __cdecl BattleUI_GetWord_1D2B110_Off1E(char, char);
extern short __cdecl Input_RemapLow12_SG_CONFIG_L2(short);
extern int __cdecl sub_49ED80(char, char);
extern int __cdecl BattleUI_GetWord_1D2B110_Off2C(char, char);
extern int InputKeyboardResetCombination(void);
extern int sub_501C90(void);
extern int __cdecl set_dword_1D2BA24_sub_49F520(int);
extern int sub_4865C0(void);
extern int __cdecl pre_isBattle_DirectorReady(void);
extern int __cdecl BattleUI_LookupSlotVia_1D2B1D2(char, int, char);
extern unsigned int __cdecl Fixed_Atan2I32_Fpatan(int, int);
extern unsigned char *__cdecl BattleUI_ClampWidgetSlotsDown(int);
extern int __cdecl BattleUI_EnqueueCommand(int, short, char, int);
extern int sub_4AD400(void);
extern unsigned short *BattleUI_WidgetUpdatePass(void);
extern char BattleATB_TickAndReady(void);
extern int sub_4B19A0(void);
extern int __cdecl BattleUI_RenderHud(void);
extern void __cdecl nullsub_17(int);

int __cdecl BattleUI_HudInputAndATBTick(void)
{
    unsigned char *hud;
    int look0;
    int dx;
    int dy;
    int dist2;
    unsigned int angle;
    unsigned int sector_old;
    unsigned int sector_new;
    unsigned int a;
    unsigned char mode;
    unsigned char cnt;
    unsigned short face_bit;
    int pulse;

    hud = (unsigned char *)(AddBase_1A78C88(0) + 0x390);
    dword_1D6D490 = (unsigned int)hud;
    sub_4A8C50();
    sub_49E9C0();

    *(unsigned short *)(hud + 0x10) =
        (unsigned short)Input_RemapLow12_SG_CONFIG_L2(
            (short)BattleUI_GetWord_1D2B110_Off1E(0, 0));
    *(unsigned short *)(hud + 0x12) =
        (unsigned short)Input_RemapLow12_SG_CONFIG_L2((short)sub_49ED80(0, 0));
    *(unsigned short *)(hud + 0x14) =
        (unsigned short)Input_RemapLow12_SG_CONFIG_L2(
            (short)BattleUI_GetWord_1D2B110_Off2C(0, 0));
    *(unsigned short *)(hud + 0x18) = *(unsigned short *)(hud + 0x10);
    *(unsigned short *)(hud + 0x16) = *(unsigned short *)(hud + 0x12);
    *(unsigned short *)(hud + 0x1A) = *(unsigned short *)(hud + 0x14);

    if (InputKeyboardResetCombination() != 0) {
        *(unsigned short *)(hud + 0x1E) &= 0xFFF9;
        sub_501C90();
        dword_1D96DB8 &= 0x7FFFFFFF;
        set_dword_1D2BA24_sub_49F520(0);
        sub_4865C0();
        byte_1D6D634 = 2;
        dword_1D74E9C = 0;
    } else {
        byte_1D6D634 = 0;
    }

    if (pre_isBattle_DirectorReady() == 0) {
        if ((hud[0x10] & 3) == 3) {
            BATTLE_ESCAPE_HOLD_FRAMES++;
            BATTLE_ESCAPE_INPUT_ACTIVE = 1;
        } else {
            BATTLE_ESCAPE_HOLD_FRAMES = 0;
            BATTLE_ESCAPE_INPUT_ACTIVE = 0;
        }
    }

    if (hud[0x11] & 0xF0) {
        hud = (unsigned char *)dword_1D6D490;
        hud[0x26] = 0;
        goto loc_4A8700;
    }

    look0 = BattleUI_LookupSlotVia_1D2B1D2(0, 2, 0);
    if (look0 < 0) {
        hud = (unsigned char *)dword_1D6D490;
        hud[0x26] = 0;
        hud[0x27] = 0;
        goto loc_4A8700;
    }

    dx = look0 - 0x80;
    dy = BattleUI_LookupSlotVia_1D2B1D2(0, 3, 0) - 0x80;
    dist2 = dx * dx + dy * dy;
    if (dist2 <= (int)(unsigned short)word_1D74E9A) {
        hud = (unsigned char *)dword_1D6D490;
        hud[0x26] = 0;
        goto loc_4A8700;
    }

    if (dx == 0) {
        angle = (dy <= 0) ? 0xC00u : 0x400u;
    } else if (dy == 0) {
        angle = (dx <= 0) ? 0x800u : 0u;
    } else {
        angle = Fixed_Atan2I32_Fpatan(dx, dy);
    }
    angle &= 0xFFFu;

    hud = (unsigned char *)dword_1D6D490;
    sector_old = ((unsigned int)*(unsigned short *)(hud + 0x24) + 0x200u) >> 10;
    sector_old &= 3u;
    sector_new = ((angle + 0x200u) >> 10) & 3u;
    mode = hud[0x26];
    if (mode == 0) {
        hud[0x27] = byte_1D2B2F0;
        hud[0x26] = 7;
        *(unsigned short *)(hud + 0x24) = (unsigned short)angle;
        goto loc_4A8700;
    }

    cnt = (unsigned char)(hud[0x27] - 1);
    hud[0x27] = cnt;
    if ((signed char)cnt >= 0) {
        hud[0x26] = 1;
    } else {
        hud[0x27] = byte_1D2B2F1;
        hud[0x26] = 3;
    }
    if (((sector_new ^ sector_old) & 1u) != 0)
        hud[0x26] = 8;

loc_4A8700:
    mode = hud[0x26];
    if ((mode & 0xF7u) != 0) {
        a = ((unsigned int)*(unsigned short *)(hud + 0x24) + 0x600u) & 0xFFFu;
        a = 0xFFFu - a;
        /* cdq; and edx,3FFh; add; sar 10 — a is 0..0xFFF so towards-zero == >>10 */
        face_bit = (unsigned short)((1u << ((a >> 10) + 12)) & 0xF000u);
        if (mode & 4)
            *(unsigned short *)(hud + 0x14) |= face_bit;
        if (mode & 2)
            *(unsigned short *)(hud + 0x12) |= face_bit;
        *(unsigned short *)(hud + 0x10) |= face_bit;
    }

    if (hud[0x1F] & 1) {
        BattleUI_ClampWidgetSlotsDown(7);
        BattleUI_EnqueueCommand(0, 0x40, 0x80, 0);
        hud = (unsigned char *)dword_1D6D490;
        *(unsigned short *)(hud + 0x1E) &= 0xFEFF;
    }
    if (hud[0x1F] & 2) {
        BattleUI_ClampWidgetSlotsDown(7);
        BattleUI_EnqueueCommand(0, 0x41, 0x80, 0);
        hud = (unsigned char *)dword_1D6D490;
        *(unsigned short *)(hud + 0x1E) &= 0xFDFF;
    }

    if (pre_isBattle_DirectorReady() == 0) {
        sub_4AD400();
        hud = (unsigned char *)dword_1D6D490;
        *(unsigned short *)(hud + 0x1C) = 0;
        if (hud[0x1E] & 0x40)
            BattleUI_WidgetUpdatePass();
        BattleATB_TickAndReady();
    }

    hud = (unsigned char *)dword_1D6D490;
    if (hud[0x1E] & 8) {
        BattleUI_EnqueueCommand(0, 0x50, 0x80, 0);
        hud = (unsigned char *)dword_1D6D490;
        *(unsigned short *)(hud + 0x1E) &= 0xFFF7;
    }
    if (hud[0x1F] & 4) {
        sub_4B19A0();
        BattleUI_ClampWidgetSlotsDown(7);
        hud = (unsigned char *)dword_1D6D490;
        *(unsigned short *)(hud + 0x1E) &= 0xFBFF;
    }

    if (g_BattleUI_HudDrawEnv != 0)
        BattleUI_RenderHud();

    nullsub_17(0);
    pulse = (int)dword_1D74EA8 + 1;
    dword_1D74EA8 = (unsigned int)pulse;
    if (pulse > 3)
        dword_1D74EA8 = 0;
    return pulse;
}
```
