# BattleUI_RenderHud @ 0x4A8870

- Instr (live): 256
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7778
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6437
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10474
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleUI_RenderHud()
- Notes parent: emit widgets ssi BYTE+22!=0 && BYTE+21==0 (jz/jnz vers loc_4A8970). 2x AddBase(0) +0x3D8/+0x3EC stride 0x14. Paquets stride 0x18 IMM32 0x01000000 (pas deref). jbe unsigned / jns jge jl signed. WORD +4/+6, BYTE +22=1. WriteGp0 4 args. Occupancy/GetRandomInt/jpt_ absents. EAX leftover HudDrawEnv/WriteGp0.

## C réconcilié

```c
/* BattleUI_RenderHud @ 0x4A8870
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 256 instr, size 0x39A, end 0x4A8C0A. IDA type int __cdecl(). No domain::.
 * Occupancy 1+2 unused. GetRandomInt absent. No jpt_.
 * Widget stride 0x14 @ AddBase(0)+0x3D8 / +0x3EC. OT packet stride 0x18.
 * WORD +4/+6 (prefix 66). BYTE +1E/+21/+22/+10/+12. DWORD E3/E4 and packets.
 * 0x01000000 / 0xB30000 / 0xD80000 / 0xE00000 are IMM32, not pointer derefs.
 * jbe unsigned clamp; jge/jns/jl signed. cmp @ 4A88E1 dead (no jcc).
 */

extern char *__cdecl AddBase_1A78C88(int a);                 /* 0x403E00, add esp 4 */
extern void __cdecl nullsub_12(void *list, void *packet);    /* 0x49D6E0 stub, 2 args add esp 8 */
extern char *__cdecl BattleUI_PlaceWidget_3D8(int a, int b, int c, int d); /* 0x4A8F10, add esp 10h */
extern int __cdecl sub_49B190(int a);                        /* 0x49B190, add esp 4 */
extern int __cdecl BattleUI_WidgetDrawPass(int list, int cursor); /* 0x4B9DB0 */
extern unsigned int *__cdecl BattleUI_EmitDrawEnvPackets(int list, unsigned int *cursor, short x, int y); /* 0x4A76F0 */
extern void __cdecl nullsub_14(void);                        /* 0x4A3240, 0 arg */
extern int __cdecl BattleUI_WriteGp0Codes_E1E5(int list, int cursor, int x, int y); /* ASM 4 args, add esp 10h */

extern unsigned int dword_1D6D490;   /* HUD/drawenv pointer */
extern unsigned int dword_1D6D618;
extern unsigned int dword_1D6D498;
extern unsigned char unk_1D6D698[];
extern unsigned char unk_1D71298[];
extern unsigned char unk_1D7129C[];
extern unsigned char unk_1D712A4[];
extern unsigned char unk_1D712B4[];
extern unsigned char unk_1D712BC[];
extern unsigned char unk_1D712CC[];
extern unsigned int dword_1D712C4[2];
extern void *g_BattleUI_HudDrawEnv;  /* 0x1D6D4AC */

int __cdecl BattleUI_RenderHud(void)
{
    unsigned char *p;
    unsigned int hud_x;
    unsigned int hud_y;
    unsigned char *edi;
    unsigned char *esi;
    int cnt;
    unsigned int *pkt;
    unsigned char f10;
    unsigned char f12;
    unsigned char *list;
    unsigned int xy;
    unsigned int x0;
    unsigned int y0;
    unsigned int wh;
    int w;
    int h;
    unsigned int packed;
    unsigned int *ot;
    unsigned int bar_x;
    unsigned int bar_v;
    unsigned int bar_param;
    int bar_ebp;
    int result;

    p = (unsigned char *)dword_1D6D490;
    hud_y = *(unsigned short *)(p + 6); /* xor ebx; mov bx — WORD */
    hud_x = *(unsigned short *)(p + 4); /* xor ebp; mov bp — WORD */

    /* GP0 E3 TL=(x,y): ((y&0x3FF)|0xFFF8C000)<<10 | (x&0x3FF) → 0xE3000000|y<<10|x */
    *(unsigned int *)(p + 8) =
        (((hud_y & 0x3FFu) | 0xFFF8C000u) << 10) | (hud_x & 0x3FFu);
    /* GP0 E4 BR=(x+0x13F, y+0xD7) in 320x216 (0x140 x 0xD8) */
    *(unsigned int *)(p + 0xC) =
        ((((hud_y + 0xD7) << 10) & 0xFFC00u) | ((hud_x + 0x13F) & 0x3FFu))
        | 0xE4000000u;

    /* var_10=hud_x, var_C=hud_y. cmp dword_1D6D618 vs unk_1D6D698 discarded. */
    dword_1D6D618 = (unsigned int)unk_1D71298;
    dword_1D6D498 = (unsigned int)unk_1D6D698;

    edi = (unsigned char *)AddBase_1A78C88(0) + 0x3D8;
    p = (unsigned char *)dword_1D6D490;

    /* jz +22==0 → loc_4A8970; jnz +21!=0 → loc_4A8970; emit only if +22!=0 && +21==0 */
    if (p[0x22] != 0 && p[0x21] == 0) {
        esi = unk_1D712CC;
        cnt = 2;
        do {
            if ((edi[0x10] & 0xF0) != 0) {
                pkt = (unsigned int *)(esi - 8);
                pkt[0] = 0x05000000;
                pkt[1] = 0x01000000; /* IMM32; IDA name VIT_0_STATUS_MASK? is 0x1000000 */
                pkt[2] = 0x80000000;
                pkt[3] = *(unsigned int *)(edi + 8);
                pkt[4] = *(unsigned int *)(edi + 4);
                pkt[5] = *(unsigned int *)edi;
                nullsub_12(unk_1D71298, pkt);
                esi += 0x18;
            }
            edi += 0x14;
        } while (--cnt != 0);
    } else {
        edi += 0x24;
        cnt = 2;
        do {
            f10 = *edi;
            edi -= 0x14;
            edi[0x14] = (unsigned char)(f10 & 0x0F);
        } while (--cnt != 0);
    }

    edi = (unsigned char *)AddBase_1A78C88(0) + 0x3EC;
    esi = unk_1D712CC;
    cnt = 2;
    do {
        f12 = edi[0x12];
        f10 = edi[0x10]; /* loaded before the jz */
        if (f12 == 0) {
            edi[0x10] = (unsigned char)(f10 & 0x0F);
        } else {
            list = ((f10 & 0x0F) != 0) ? unk_1D712B4 : unk_1D7129C;
            xy = *(unsigned int *)edi;
            x0 = xy & 0xFFFF;
            y0 = xy >> 16;
            wh = *(unsigned int *)(edi + 0xC);
            w = (int)(short)(wh & 0xFFFF); /* shl16+sar16 */
            h = (int)(short)(wh >> 16);    /* sar16 */
            if (w < 0)
                w = 0; /* jns */
            if (h < 0)
                h = 0; /* jge signed */
            if ((unsigned int)w > (unsigned int)(0x140 - x0))
                w = (int)(0x140 - x0); /* jbe unsigned */
            if ((unsigned int)h > (unsigned int)(0xD8 - y0))
                h = (int)(0xD8 - y0); /* jbe unsigned */
            packed = ((unsigned int)(h + (int)hud_y) << 16)
                   | ((unsigned int)(w + (int)hud_x) & 0xFFFF);
            pkt = (unsigned int *)(esi - 8);
            pkt[0] = 0x05000000;
            pkt[1] = 0x01000000;
            pkt[2] = 0x80000000;
            pkt[3] = packed;
            pkt[4] = *(unsigned int *)(edi + 8);
            pkt[5] = xy;
            nullsub_12(list, pkt);
            *(unsigned int *)(edi + 4) = packed;
            edi[0x10] = (unsigned char)((f10 & 0x0F) | 0x10);
            esi += 0x18;
        }
        edi -= 0x14;
    } while (--cnt != 0);

    p = (unsigned char *)dword_1D6D490;
    if ((p[0x1E] & 0x40) == 0)
        BattleUI_PlaceWidget_3D8(0, 0, 0, -1);
    sub_49B190(1);

    p = (unsigned char *)dword_1D6D490;
    if (p[0x21] != 0) {
        ot = dword_1D712C4;
        bar_x = (*(unsigned short *)(p + 4) + 0xDAu) & 0xFFFF; /* fresh WORD +4, not var_10 */
        bar_v = 0;
        bar_param = 0xAB;
        bar_ebp = 0xB30000;
        do {
            ot[0] = 0x05000000;
            ot[1] = 0x01000000;
            ot[2] = 0x80000000;
            ot[3] = (bar_param << 16) | bar_x;
            ot[4] = (bar_v & 0xFFFF) | 0xD80000;
            ot[5] = 0x80060;
            nullsub_12(unk_1D71298, ot);
            bar_v += 0x60;
            ot += 6;

            ot[0] = 0x05000000;
            ot[1] = 0x01000000;
            ot[2] = 0x80000000;
            ot[3] = bar_x | (unsigned int)bar_ebp;
            ot[4] = (bar_v & 0xFFFF) | 0xD80000;
            ot[5] = 0x70060;
            nullsub_12(unk_1D71298, ot);
            bar_ebp += 0xF0000;
            ot += 6;
            bar_v += 0x60;
            bar_param += 0x0F;
        } while (bar_ebp < 0xE00000); /* jl signed; 3 tours then == */
    }

    BattleUI_WidgetDrawPass((int)unk_1D712A4, (int)dword_1D712C4);
    BattleUI_EmitDrawEnvPackets((int)unk_1D712A4, dword_1D712C4, (short)hud_x, (int)hud_y);
    BattleUI_EmitDrawEnvPackets((int)unk_1D71298, dword_1D712C4, (short)hud_x, (int)hud_y);

    p = (unsigned char *)dword_1D6D490;
    p[0x22] = 1; /* BYTE */

    if (g_BattleUI_HudDrawEnv == 0)
        result = 0;
    else {
        nullsub_14();
        result = BattleUI_WriteGp0Codes_E1E5((int)unk_1D712BC, (int)dword_1D712C4,
                                             (int)hud_x, (int)hud_y);
    }
    return result;
}
```
