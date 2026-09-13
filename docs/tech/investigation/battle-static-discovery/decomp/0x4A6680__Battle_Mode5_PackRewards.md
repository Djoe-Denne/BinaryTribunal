# Battle_Mode5_PackRewards @ 0x4A6680

- Instr (live): 476
- Palier: low
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=22733
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=21343
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=21315
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_Mode5_PackRewards(void)
- Notes parent: F_CHAR 0x1D0 USED (word_1CFF1B2). GFSG 0x44 / K_GF 0x84 USED. CharacterData 0x98 / slot 0xD0 / occupancy 1+2 / GetRandomInt / jpt_ absents. jl/jle SIGNED; jnb UNSIGNED bar vs 1. return1(sub_4A6660, &unk_1D6D48C). Borne GF 0x1CF561E. add esp 0C8h = epilogue. EAX leftover sub_495EF0. AnimationState=4 hors corps. Pas de Hex-Rays.

## C réconcilié

```c
/* Battle_Mode5_PackRewards @ 0x4A6680
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 476 instr, size 0x626, end 0x4A6CA6. IDA type int().
 * F_CHAR stride 0x1D0 USED (word_1CFF1B2 + ebp). GFSG stride 0x44 USED.
 * K_GF stride 0x84 USED. CharacterData 0x98 unused. Battle slot 0xD0 unused.
 * Occupancy 1+2 unused. GetRandomInt absent. No jpt_/setcc. No ja/jg.
 * jl/jle SIGNED; jnb UNSIGNED only on XP bar vs 1.
 * add esp,0C8h is THIS epilogue, not a callee. EAX leftover = sub_495EF0.
 * AnimationState=4 is written by the caller @ 0x47CDAB, not here.
 */

extern char *__cdecl AddBase_1A78C88(int);
extern int   __cdecl ReturnWroteListAddress(int dst, short a, short b, short w, short h);
extern int   __cdecl BS_Debug_memset(int dst, short a, short b, short w, short h);
extern int   __cdecl getCharaXP(int slot, int level);
extern char *__cdecl BattleText_GetCharacterName(int slot);
extern int   __cdecl return1(void *cb, void *ctx);
extern int   __cdecl sub_49FAD0(int);
extern char *__cdecl BattleText_GetMiscText(int p_text_index);
extern int   __cdecl Thunk_4A0D10_Push0_AndFFFF(int);
extern int   __cdecl sub_496F30(int arg_0, unsigned short arg_4);
extern int   __cdecl sub_4ACB70(int gf_index, unsigned char *out_records, int flag);
extern int   __cdecl sub_497010(int gf_index, unsigned short ap);
extern short __cdecl sub_495EF0(void);
extern int   __cdecl sub_4A6660(void);

extern unsigned int   off_B86D30;
extern unsigned int   dword_1D6BC80;
extern unsigned int   dword_1D6BC84;
extern unsigned int   dword_1D6BC64;
extern unsigned int   dword_1CDBFD8;
extern unsigned char  byte_1D6BC78;
extern unsigned char  byte_1D6BC88;
extern unsigned char  ITEM_RELATED[];
extern unsigned char  BATTLE_CARD_DROP[];
extern unsigned short XP_EARNED[];
extern unsigned short XP_EARNED_EXTRA[];
extern unsigned char  word_1CFF1B2[];
extern unsigned short BCI_GF_AP_EARNED[];
extern unsigned char  SG_ARRAY_GF_DATA[];
extern unsigned char  K_GF_JUNCTIONABLE[];
extern unsigned int   unk_1D6D48C;

int __cdecl Battle_Mode5_PackRewards(void)
{
    unsigned char recBuf[0xB0];
    unsigned char *w;
    unsigned char *dst1;
    unsigned char *dst2;
    unsigned int *hdr;
    unsigned char *d;
    int i, j, n, packedCount;
    unsigned char *p;
    unsigned char *ch;
    unsigned char *row;
    unsigned short *xp;
    unsigned char *gfSave;
    unsigned short *apArr;
    unsigned char *kfAbility;
    unsigned char *rec;
    unsigned int base;

    w = (unsigned char *)AddBase_1A78C88(0);
    base = off_B86D30;
    dst1 = (unsigned char *)(base + 0x40000);
    dst2 = (unsigned char *)(base + 0x44000);
    dword_1D6BC80 = (unsigned int)dst1;
    dword_1D6BC84 = (unsigned int)dst2;
    ReturnWroteListAddress((int)dst1, 0, 0, 0x180, 0xE0);
    ReturnWroteListAddress((int)dst2, 0x200, 0, 0x180, 0xE0);
    BS_Debug_memset((int)(dst2 + 0x14), 0, 0, 0x180, 0xE0);
    BS_Debug_memset((int)(dst1 + 0x14), 0x200, 0, 0x180, 0xE0);

    hdr = &dword_1D6BC80;
    while ((int)hdr < (int)&byte_1D6BC88) {
        d = (unsigned char *)*hdr;
        hdr++;
        d[0x2C] = 1;
        d[0x2D] = 0;
        d[0x2E] = 0;
        d[0x2F] = 0;
        *(unsigned short *)(d + 0x0A) += 8;
        *(unsigned short *)(d + 0x0E) = 0xE0;
    }

    dst2 = (unsigned char *)dword_1D6BC84;
    dword_1D6BC64 = (unsigned int)dst2;
    dword_1CDBFD8 = (unsigned int)(dst2 + 0x14);
    *(unsigned int *)(dst2 + 0x78) = (unsigned int)(dst2 + 0x7C);
    byte_1D6BC78 = 0;
    byte_1D6BC88 = 0;

    *(unsigned short *)(w + 0x20) = 0;
    *(unsigned short *)(w + 0x22) = 0;
    *(unsigned short *)(w + 0x28) = 0;
    *(unsigned short *)(w + 0x26) = 0;
    *(unsigned short *)(w + 0x2A) = 0;
    for (i = 0; i < 0x20; i++) {
        *(unsigned short *)(w + 0x60 + i * 4) = 0;
        w[0x62 + i * 4] = 0;
    }

    packedCount = 0;
    p = ITEM_RELATED;
    for (i = 0; i < 0x18; i++, p += 2) {
        unsigned char id;
        unsigned char qty;
        id = p[0];
        if (id == 0)
            break;
        qty = p[1];
        if (qty == 0)
            continue;
        for (j = 0; j < 0x20; j++) {
            unsigned short cur = *(unsigned short *)(w + 0x60 + j * 4);
            if (cur == 0) {
                packedCount++;
                *(unsigned short *)(w + 0x60 + j * 4) = id;
                w[0x62 + j * 4] = qty;
                break;
            }
            if (cur == (unsigned short)id) {
                w[0x62 + j * 4] = (unsigned char)(w[0x62 + j * 4] + qty);
                break;
            }
        }
    }

    p = BATTLE_CARD_DROP;
    for (i = 0; i < 8; i++, p++) {
        unsigned int cid;
        cid = p[0];
        if (cid == 0xFF)
            break;
        cid |= 0x100;
        for (j = 0; j < 0x20; j++) {
            unsigned short cur = *(unsigned short *)(w + 0x60 + j * 4);
            if (cur == 0) {
                *(unsigned short *)(w + 0x60 + j * 4) = (unsigned short)cid;
                w[0x62 + j * 4] = 1;
                packedCount++;
                break;
            }
            if (cur == (unsigned short)cid) {
                w[0x62 + j * 4]++;
                break;
            }
        }
    }

    *(unsigned int *)(w + 0x50) = (unsigned int)(w + 0x60);
    w[0x3E] = (unsigned char)packedCount;
    w[0x3F] = (unsigned char)packedCount;
    *(unsigned short *)(w + 0x44) = 0;
    *(unsigned int *)(w + 0x48) = 0;
    *(unsigned int *)(w + 0x4C) = 0;
    w[0x40] = 1;
    *(unsigned short *)(w + 0x46) = 0x20;
    *(unsigned short *)(w + 0x2C) = 0;
    *(unsigned short *)(w + 0x2E) = 0;
    w[0x38] = 0;
    *(unsigned short *)(w + 0x275) = 0;
    w[0x277] = 0;

    xp = XP_EARNED;
    ch = word_1CFF1B2;
    row = w + 0x240;
    for (i = 0; (int)xp < (int)XP_EARNED_EXTRA; i++, xp++, row += 4, ch += 0x1D0) {
        unsigned int level;
        unsigned short status;

        w[0x27C + i] = 0;
        if (ch[0x11] == 0xFF) {
            *(unsigned int *)(row - 0x1EC) = 0;
            *(unsigned int *)(row + 0x0C) = 0;
            w[0x280] |= (unsigned char)(1 << i);
            continue;
        }

        status = *(unsigned short *)ch;
        level = ch[6];
        w[0x278 + i] = 7;
        if ((status >> 8) & 1)
            w[0x278 + i] = 2;
        if (status & 1)
            w[0x278 + i] = 1;

        if ((int)level >= 100) {
            *(unsigned int *)row = 0;
            *(unsigned int *)(row - 0x18) = 0;
            *(unsigned int *)(row + 0x0C) = 0;
            *(unsigned int *)(row - 0x0C) = (unsigned int)getCharaXP(i, (int)level);
        } else {
            unsigned int prevXp;
            unsigned int curXp;
            unsigned int earned;
            unsigned int bar;

            prevXp = (unsigned int)getCharaXP(i, (int)level - 1);
            curXp = (unsigned int)getCharaXP(i, (int)level);
            earned = (unsigned int)xp[3] + (unsigned int)xp[0];
            *(unsigned int *)row = earned;
            *(unsigned int *)(row - 0x18) = *(unsigned int *)(ch - 0x36);
            if (earned == 0) {
                w[0x27C + i] = 0x41;
                w[0x280] |= (unsigned char)(1 << i);
            }
            bar = (curXp - prevXp) >> 7;
            if (bar < 1)
                bar = 1;
            *(unsigned int *)(row + 0x0C) = bar;
        }

        *(unsigned int *)(row - 0x1EC) = (unsigned int)BattleText_GetCharacterName(i);
        *(unsigned int *)(row - 0x0C) = *(unsigned int *)(ch - 0x3A);
        w[0x272 + i] = (unsigned char)level;
    }

    *(unsigned int *)(w + 0x1C) = (unsigned int)return1((void *)sub_4A6660, &unk_1D6D48C);
    w[0x41] = 6;
    *(unsigned int *)(w + 0x30) = 0;
    *(unsigned int *)(w + 0x34) = 0;
    w[0x26E] = 0;
    sub_49FAD0(0x1000);
    w[0x27B] = (unsigned char)(Thunk_4A0D10_Push0_AndFFFF((int)BattleText_GetMiscText(0x30)) + 0x14);
    *(unsigned short *)(w + 0x258) = 0;
    *(unsigned short *)(w + 0x25A) = 0;
    w[0x42] = 0;

    gfSave = SG_ARRAY_GF_DATA + 0x14;
    apArr = BCI_GF_AP_EARNED;
    kfAbility = K_GF_JUNCTIONABLE + 0x1E;
    for (i = 0; (int)kfAbility < 0x1CF561E; i++, kfAbility += 0x84, gfSave += 0x44, apArr++) {
        unsigned char curAb;
        unsigned short ap;
        unsigned int xpSum;
        int lvl0, lvl1, found, matched;
        unsigned int chosen;

        w[0x25C + i] = 0xFF;
        if ((gfSave[-3] & 1) == 0)
            continue;

        xpSum = (unsigned int)*(unsigned short *)((unsigned char *)apArr - 0x20)
              + (unsigned int)*(unsigned short *)((unsigned char *)apArr - 0x40);
        lvl0 = sub_496F30(i, 0);
        lvl1 = sub_496F30(i, (unsigned short)xpSum);
        if (lvl0 != lvl1) {
            *(unsigned short *)(w + 0x258) |= (unsigned short)(1 << i);
            *(unsigned short *)(w + 0x25A) |= (unsigned short)(1 << i);
        }

        curAb = gfSave[0x2C];
        n = sub_4ACB70(i, recBuf, 1);
        ap = apArr[0];
        found = 0;
        if (ap != 0 && n > 0) {
            rec = recBuf + 2;
            for (j = n; j > 0; j--, rec += 8) {
                if (rec[-2] == curAb && rec[0] == 1) {
                    found = 1;
                    w[0x42] = (unsigned char)ap;
                }
            }
        }
        if (found == 0)
            continue;
        if (sub_497010(i, ap) == 0)
            continue;
        if (n <= 0)
            continue;

        matched = 0;
        rec = recBuf + 2;
        for (j = n; j > 0; j--, rec += 8) {
            if (rec[-2] == curAb && rec[0] == 1) {
                unsigned int id32;
                unsigned int bit;
                unsigned int *dw;

                w[0x25C + i] = curAb;
                id32 = curAb;
                /* cdq; and edx,1Fh; add; sar 5  (signed /32; BYTE 0..255 == >>5) */
                dw = (unsigned int *)(gfSave + ((id32 >> 5) * 4));
                bit = 1u << (curAb & 0x1F);
                *dw |= bit;
                *(unsigned short *)(w + 0x25A) |= (unsigned short)(1 << i);
                matched = 1;
            }
        }
        if (matched == 0)
            continue;

        n = sub_4ACB70(i, recBuf, 1);
        chosen = 0;
        {
            unsigned char *k;
            int kidx;
            k = kfAbility;
            for (kidx = 0; kidx < 0x15; kidx++, k += 4) {
                unsigned int kb;
                int ridx;
                kb = k[0];
                if (n > 0) {
                    rec = recBuf + 2;
                    for (ridx = 0; ridx < n; ridx++, rec += 8) {
                        if ((unsigned int)rec[-2] == kb && rec[0] == 1) {
                            chosen = kb;
                            if (kb != 0)
                                goto loc_4A6C1B;
                            break;
                        }
                    }
                }
            }
        }
loc_4A6C1B:
        gfSave[0x2C] = (unsigned char)chosen;
    }

    w[0x27F] = (unsigned char)Thunk_4A0D10_Push0_AndFFFF((int)BattleText_GetMiscText(0x31));
    {
        unsigned short bits = *(unsigned short *)(w + 0x25A);
        unsigned char cnt = 0;
        for (i = 0; i < 0x10; i++) {
            if (bits & (unsigned short)(1 << i))
                cnt++;
        }
        w[0x26C] = cnt;
    }

    return sub_495EF0();
}
```
