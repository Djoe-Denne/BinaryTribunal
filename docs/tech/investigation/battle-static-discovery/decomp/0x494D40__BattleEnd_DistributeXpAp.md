# BattleEnd_DistributeXpAp @ 0x494D40

- Instr (live): 137
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9138
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5277
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=12521
- A==B: non
- Push IDB: oui
- SetType: FF8SceneOutBattleFlags()
- Notes parent: slot*0xD0 ; F_CHAR 0x1D0 absent (CharacterData 0x98) ; occupancy 1+2 absent (Death/flag_data bit0) ; GetRandomInt absent ; monster ** double deref +0x102 WORD ; ja unsigned / jge signed / jbe unsigned ; DWORD load WORD XP/AP + 66 stores ; cap 60000 ; ENCOUTER_BATTLE_FLAG bit3 → reset_xp_earned ; pas de setcc/jpt ; pas de Hex-Rays

## C réconcilié

```c
/* BattleEnd_DistributeXpAp @ 0x494D40
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 137 instr, size 0x1D1, end 0x494F11. IDA type FF8SceneOutBattleFlags().
 * No domain::. Slot stride 0xD0. CharacterData stride 0x98 (not F_CHAR 0x1D0).
 * GF record stride 0x44. Occupancy values 1+2 unused (ASM contraire: bit tests).
 * GetRandomInt unused. No setcc. No jump table.
 * ja unsigned AX vs 60000; jge signed EAX vs 1; jbe unsigned AX vs 60000; jl/jle signed.
 */

extern unsigned short XP_EARNED[3];                 /* 0x1CFF574 WORD */
extern unsigned short XP_EARNED_EXTRA[3];           /* 0x1CFF57A = XP_EARNED+6 */
extern unsigned short BCI_GF_XP_EARNED[16];         /* 0x1CFF580 */
extern unsigned short BCI_GF_XP_EARNED_EXTRA_[16];  /* 0x1CFF5A0 */
extern unsigned short BCI_GF_AP_EARNED[16];         /* 0x1CFF5C0 */
extern unsigned short ENCOUTER_BATTLE_FLAG;         /* 0x1CFF6E2 WORD; AL byte load */
extern unsigned char  SG_PARTY_BATTLE[4];           /* 0x1CFE74C */
extern unsigned char  SG_ARRAY_CHARA_DATA[];        /* 0x1CFE0E8 CharacterData[8] stride 0x98 */
extern unsigned char  SG_ARRAY_GF_DATA[];           /* 0x1CFDCA8 stride 0x44, HP WORD +0x12 */
extern unsigned char  BATTLE_SLOT_DATA[];           /* 0x1D27B10 stride 0xD0 */

extern int __cdecl GetPartyAverageLevelExact(void); /* 0x48B2E0, 0 args, no add esp */
extern unsigned short *__cdecl reset_xp_earned(void); /* 0x48CFF0, 0 args, no add esp */

int __cdecl BattleEnd_DistributeXpAp(void)
{
    unsigned char gf_ids[16]; /* var_10 @ [esp+18h] */
    unsigned int saved_xp;    /* var_18 */
    unsigned int saved_ap;    /* var_14 */
    unsigned char *slot;      /* edi = &slot.max_hp */
    unsigned char *st;        /* status_1 walker */
    unsigned char *party_st;
    unsigned short *pxp;
    int member;
    int xp;
    int count;
    int bit;
    int i;
    unsigned int mask;
    unsigned char flags;

    /* Enemy slots 3..6: edi = 0x1D27D9C (max_hp+270h), limit dword_1D280DC, add 0D0h, jl signed */
    for (slot = BATTLE_SLOT_DATA + 0x270 + 0x1C;
         (int)slot < (int)(BATTLE_SLOT_DATA + 0x270 + 0x1C + 4 * 0xD0);
         slot += 0xD0)
    {
        unsigned char *info;
        unsigned char *monster;
        unsigned short mon_xp;
        unsigned int max_hp;
        unsigned int cur_hp;
        unsigned int prev;
        unsigned int sum;

        /* test byte [edi+64h],1 => status_1 bit0 Death; jnz skip (no accumulate) */
        if (*(slot + 0x64) & 1)
            continue;

        /* mov eax,[edi-1Ch]; mov eax,[eax] — double deref monster_info_section ** */
        info = *(unsigned char **)(slot - 0x1C);
        monster = *(unsigned char **)info;
        /* 66 cmp word [eax+102h],0 */
        mon_xp = *(unsigned short *)(monster + 0x102);
        max_hp = *(unsigned int *)slot;           /* DWORD max_hp */
        cur_hp = *(unsigned int *)(slot - 4);     /* DWORD current_hp */

        if (mon_xp == 0 || max_hp == cur_hp) {
            xp = 0; /* xor eax,eax ; jmp loc_494DC6 still accumulates */
        } else {
            int avg = GetPartyAverageLevelExact();
            /* xor eax,eax; mov al,[edi+0A0h] BYTE level; imul esi=monXP; lea [eax+eax*4]; cdq/idiv ecx */
            xp = (int)slot[0xA0];
            xp = xp * (int)mon_xp;
            xp = xp * 5;
            xp = xp / avg;
            xp = xp - (int)mon_xp;
            xp = xp * (int)(max_hp - cur_hp);
            xp = xp / (int)max_hp; /* cdq/idiv ebx=max_hp */
            /* test bp,bp after idiv */
            if (mon_xp == 0)
                xp = 0;
            else if (xp < 1) /* cmp eax,1 ; jge signed */
                xp = 1;
            else if ((unsigned short)xp > 0xEA60) /* cmp ax,0EA60h ; jbe unsigned */
                xp = 0xEA60;
        }

        /* mov ecx, dword ptr XP_EARNED ; 66 mov XP_EARNED,0EA60h ; add eax,ecx ; cmp ax ; ja */
        prev = *(unsigned int *)&XP_EARNED[0];
        XP_EARNED[0] = 0xEA60; /* WORD 66 C7 */
        sum = (unsigned int)xp + prev;
        if ((unsigned short)sum <= 0xEA60) /* ja unsigned skips store, keeps 60000 */
            XP_EARNED[0] = (unsigned short)sum; /* 66 A3 */
    }

    /* DWORD load total; 3 party slots status_1 @ 0x1D27B90 .. +270h, jl signed */
    saved_xp = *(unsigned int *)&XP_EARNED[0];
    st = BATTLE_SLOT_DATA + 0x80;
    pxp = &XP_EARNED[0];
    while ((int)st < (int)(BATTLE_SLOT_DATA + 0x80 + 0x270)) {
        if (*st & 5) { /* test byte,5 Death|Petrify */
            *pxp = 0;                         /* 66 C7 01 0000 */
            *(pxp + 3) = 0;                   /* 66 C7 41 06 0000 = XP_EARNED_EXTRA[i] */
        } else {
            *pxp = (unsigned short)saved_xp;  /* 66 89 11 dx */
        }
        st += 0xD0;
        pxp += 1; /* add ecx,2 */
    }

    saved_ap = *(unsigned int *)&BCI_GF_AP_EARNED[0]; /* DWORD 8B 15 */
    BCI_GF_AP_EARNED[0] = 0; /* 66 89 3D DI=0 first WORD only */

    party_st = BATTLE_SLOT_DATA + 0x80;
    for (member = 0; member < 3; member++, party_st += 0xD0) {
        unsigned short junc;
        unsigned short share;
        unsigned char status_lo;
        unsigned int char_off;

        /* test byte [ebp-4],1 = flag_data bit0 ; jz skip. Not occupancy 1+2. */
        if ((*(party_st - 4) & 1) == 0)
            continue;

        /* 66 mov ax,[ebp]; test al,1 ; jz collect; test al,4 ; jnz skip */
        status_lo = *party_st;
        if ((status_lo & 1) && (status_lo & 4))
            continue;

        /* SG_PARTY_BATTLE BYTE; lea ebx,[eax+eax*8]; lea eax,[eax+ebx*2]; 66 mov ax, JunctionedGFs[eax*8] */
        char_off = (unsigned int)SG_PARTY_BATTLE[member] * 0x98u;
        junc = *(unsigned short *)(SG_ARRAY_CHARA_DATA + char_off + 0x58);

        count = 0;
        mask = 1;
        for (bit = 0; bit < 0x10; bit++) { /* cmp ecx,10h ; jl signed */
            if ((unsigned short)(junc & (unsigned short)mask) != 0)
                gf_ids[count++] = (unsigned char)bit; /* [esp+esi+18h]=cl ; inc esi */
            mask <<= 1;
        }
        if (count == 0)
            continue;

        share = (unsigned short)((int)(saved_xp & 0xFFFFu) / count); /* and 0FFFFh; cdq; idiv esi */
        if (count <= 0) /* test esi,esi ; jle signed after xor edx,edx */
            continue;

        for (i = 0; i < count; i++) { /* inc edx; cmp edx,esi ; jl */
            unsigned int gf = gf_ids[i];
            /* ebx=gf*17; 66 cmp SG_ARRAY_GF_DATA.HP[ebx*4],0 => gf*0x44 + 0x12 */
            if (*(unsigned short *)(SG_ARRAY_GF_DATA + gf * 0x44u + 0x12) == 0)
                BCI_GF_XP_EARNED_EXTRA_[gf] = 0; /* 66 C7 04 4D */
            else {
                BCI_GF_XP_EARNED[gf] = share; /* 66 89 04 4D AX */
                BCI_GF_AP_EARNED[gf] = (unsigned short)saved_ap; /* 66 89 1C 4D BX from var_14 */
            }
        }
    }

    /* mov al, byte ptr ENCOUTER_BATTLE_FLAG ; pops ; test al,8 ; jz skip ; call reset ; add esp,18h */
    flags = *(unsigned char *)&ENCOUTER_BATTLE_FLAG;
    if (flags & 8)
        return (int)reset_xp_earned();
    return (int)flags;
}
```
