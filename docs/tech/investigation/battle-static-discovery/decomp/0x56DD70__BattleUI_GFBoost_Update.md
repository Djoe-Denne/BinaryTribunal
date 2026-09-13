# BattleUI_GFBoost_Update @ 0x56DD70

- Instr (live): 265
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=18224
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=18310
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=15265
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleUI_GFBoost_Update()
- Notes parent: jpt 7 cases ja unsigned. 0/1 fallthrough 2. Case 4 DX<=0 jmp loc_56DDF4 ecx=5 same-tick (CEFB pas ecrit 5). ESI=[+21h] BYTE. test [+1Eh] bit0. WORD 66 timers/BCI/displayed. Boost jbe 0xFA. shr al,7 = 4A83E0; test 80h = 4A8420. add esp 8/4/10h/2Ch. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. EAX leftover.

## C réconcilié

```c
/* BattleUI_GFBoost_Update @ 0x56DD70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 265 instr, size 0x395, end 0x56E105. cdecl, 0 args. sub esp,8; push ebx,esi,edi; retn C3.
 * EAX leftover from Mem_ReplaceWhileEq (void). Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No domain:: / main:: / presentation::.
 */

extern unsigned char *dword_1D6D490;
extern unsigned short BCI_CURRENT_GF_BOOST;
extern unsigned short unk_209CEF2;
extern unsigned short word_209CEF4;
extern unsigned short word_209CEF6;
extern unsigned char byte_209CEF8;
extern unsigned char byte_209CEF9;
extern unsigned char byte_209CEFA;
extern unsigned char byte_209CEFB;
extern unsigned char byte_209CEFC;
extern unsigned char byte_209CEFD;
extern char byte_209CEFE[10];

int __cdecl sub_4A8420(char);
int __cdecl sub_4A83E0(char);
int LcgRand15_Mul125Add14_Sat_1D6D630(void);
int __cdecl BattleGF_ResolveAndStoreTargetDamage(int);
void __cdecl BattleUI_RegisterWidgetSlot(int slot_index, void *update_callback, void *draw_callback, void *aux_callback);
unsigned int __cdecl BattleUI_DivModDigits_B87CFC(unsigned int value, unsigned char *dst, char fill);
int __cdecl pre_strcpy(char *dst, const char *src);
void __cdecl Mem_ReplaceWhileEq(char *dst, int count, int cmp, char repl);

/* LCG 0..0x7FFF then MSVC signed-div magic 0xC003000D +n sar 13 (not /10000), then %3+1 clamp 1..3. */
static int GFBoost_RollDie(void)
{
    int n;
    int q;
    int d;

    n = LcgRand15_Mul125Add14_Sat_1D6D630();
    q = (int)(((long long)(int)0xC003000D * n) >> 32);
    q += n;
    q >>= 13;
    q += (int)((unsigned int)q >> 31);
    d = q % 3 + 1;
    if (d < 1)
        d = 1;
    else if (d > 3)
        d = 3;
    return d;
}

int __cdecl BattleUI_GFBoost_Update(void)
{
    unsigned char var_8[8];
    int remap_2c;
    int remap_1e;
    unsigned int esi;
    unsigned char bl;
    unsigned short di;
    unsigned short dx;
    unsigned int state;

    byte_209CEFA++; /* BYTE */

    esi = dword_1D6D490[0x21]; /* xor eax,eax; mov al,[ecx+21h]; mov esi,eax */

    remap_2c = sub_4A8420(0);
    *(unsigned int *)var_8 = (unsigned int)remap_2c; /* DWORD store before 4A83E0 */
    remap_1e = sub_4A83E0(0);
    if ((dword_1D6D490[0x1E] & 1) == 0) { /* reload ptr; test BYTE +1Eh,1 */
        remap_1e = 0;
        *(unsigned int *)var_8 = 0;
    }

    {
        unsigned char dly = (unsigned char)(byte_209CEFD - 1);
        byte_209CEFD = dly;
        if ((signed char)dly < 0) /* jns */
            byte_209CEFD = 0;
    }

    state = byte_209CEFB;
    if (state > 6u) /* cmp ecx,6; ja UNSIGNED */
        goto def_56DDF4;

    bl = byte_209CEF9;
    di = word_209CEF6;
    dx = word_209CEF4;

    switch (state) {
    case 0:
    case 1:
        byte_209CEFB = 2;
        /* fall through loc_56DE30 -> loc_56DE37 */
    case 2:
        if (esi == 0)
            goto def_56DDF4;
        di--;
        word_209CEF6 = di;
        if ((short)di <= 0) /* test di,di; jg signed */
            byte_209CEFB = 3;
        byte_209CEFD = 4;
        goto def_56DDF4;

    case 3: {
        int d1 = GFBoost_RollDie();
        int d2 = GFBoost_RollDie();
        byte_209CEF9 = 1;
        byte_209CEFB = 4;
        word_209CEF6 = (unsigned short)(15 * (d1 + d2)); /* lea *3 then *5 */
        goto def_56DDF4;
    }

    case 4:
        if (esi != 0) {
            dx--;
            di--;
            word_209CEF4 = dx;
            word_209CEF6 = di;
            byte_209CEFD = 4;
        }
        if ((short)dx > 0) /* test dx,dx; jg signed */
            goto loc_56DEFB;
        bl = 0;
        byte_209CEF9 = 0;
        /* jmp loc_56DDF4 with ecx=5: same-tick case 5; byte_209CEFB not written */
    case 5: {
        unsigned int boost = *(unsigned int *)&BCI_CURRENT_GF_BOOST; /* DWORD load */
        byte_209CEF9 = 0;
        boost &= 0xFFFF;
        byte_209CEF8 = 0;
        if (boost == 0)
            boost = 0x64;
        BattleGF_ResolveAndStoreTargetDamage(boost); /* push EAX DWORD, not char truncate */
        byte_209CEFB = 6;
        goto def_56DDF4;
    }

    case 6:
        BattleUI_RegisterWidgetSlot(6, 0, 0, 0);
        goto def_56DDF4;

    default:
        goto def_56DDF4;
    }

loc_56DEFB:
    if (byte_209CEF8 == 0)
        goto def_56DDF4;
    if (byte_209CEFD == 0)
        goto def_56DDF4;
    byte_209CEFC = (unsigned char)remap_1e >> 7; /* shr al,7 */
    if ((var_8[0] & 0x80) != 0) { /* test al,80h on 4A8420 BYTE */
        unsigned short ax = BCI_CURRENT_GF_BOOST;
        if (ax == 0)
            ax = 0x4B;
        if (bl != 0) {
            ax++;
            BCI_CURRENT_GF_BOOST = ax;
            if (ax > 0xFAu) { /* cmp 0FAh; jbe UNSIGNED */
                ax = 0xFA;
                BCI_CURRENT_GF_BOOST = ax;
            }
            unk_209CEF2 = ax;
        } else {
            BCI_CURRENT_GF_BOOST = 0x4B; /* WORD; not unk_209CEF2 */
        }
    }
    if ((short)di > 0)
        goto def_56DDF4;
    bl = (unsigned char)(bl == 0); /* setz */
    byte_209CEF9 = bl;
    if (bl != 0) {
        int d1 = GFBoost_RollDie();
        int d2 = GFBoost_RollDie();
        word_209CEF6 = (unsigned short)(15 * (d1 + d2));
    } else {
        int d = GFBoost_RollDie();
        word_209CEF6 = (unsigned short)(15 * d);
    }

def_56DDF4:
    {
        unsigned short cx = BCI_CURRENT_GF_BOOST;
        unsigned short ax = unk_209CEF2;
        if (cx < ax) { /* cmp cx,ax; jnb UNSIGNED skip */
            ax = (unsigned short)(ax - 3); /* add 0FFFDh */
            unk_209CEF2 = ax;
            if (ax < cx) { /* jnb fail -> clamp */
                ax = cx;
                unk_209CEF2 = ax;
            }
        }
        BattleUI_DivModDigits_B87CFC(ax, var_8, 0x60); /* EDX = zero-ext AX */
        pre_strcpy(byte_209CEFE, (char *)&var_8[2]);
        Mem_ReplaceWhileEq(byte_209CEFE, 2, 0x60, 7);
    }
    /* EAX leftover from Mem_ReplaceWhileEq */
}
```
