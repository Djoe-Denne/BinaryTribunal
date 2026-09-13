# GetCharacterStat @ 0x496440

- Instr (live): 272
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=10403
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7217
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10470
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GetCharacterStat(int p_lvl, int p_char_id, int p_stat)
- Notes parent: CharacterData stride 0x98 (pas F_CHAR 0x1D0). Occupancy 1+2 absent. GetRandomInt absent. jpt_496476 @ 0x496794 ja UNSIGNED vs 7: STR/VIT/MAG/SPR/SPD/def/def/LCK. JunctionLCK +0x64. STR weapon K_WEAPON stride 12 +8; Laguna DWORD+mask si FLAG bit0 ModelID 8/9/10. Quart: (c+a*lvl/10+lvl/b-(lvl2/d)/2)/4. Lineaire SPD/LCK. Magic 32x2 jl signe. CapTo255 add esp 4. Pas de 66. Pas de Hex-Rays.

## C réconcilié

```c
/* GetCharacterStat @ 0x496440
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_496476.
 * 272 instr, size 0x353, end 0x496793. IDA type int __cdecl(int, int, int).
 * No domain::. CharacterData stride 0x98 @ 0x1CFE0E8. F_CHAR 0x1D0 unused.
 * Occupancy 1+2 unused. GetRandomInt absent. No 66 prefix. No setcc.
 * ja vs 7 is UNSIGNED (0F 87). Magic loops jl SIGNED vs 0x20.
 * p_char_id stack slot is overwritten with spell qty (BYTE zero-ext).
 * var_4 (weapon STR bonus) inited to 0; only case STR writes it.
 * magic_strj is NOT inited; default cases 6/7 leave it as stack leftover.
 * D==0 or B==0 is original idiv UB. CapTo255 add esp 4, signed jle vs 255, no floor 0.
 */

int __cdecl CapTo255(int value);

int __cdecl GetCharacterStat(int p_lvl, int p_char_id, int p_stat)
{
    unsigned char *chd;   /* eax: CharacterData[p_char_id] */
    unsigned char *curve; /* edi: 4-byte K_CHARACTER curve a,b,c,d */
    int savedBase;         /* ebp */
    int juncId;           /* ecx: junction spell id (or p_lvl on default) */
    int magic_strj;       /* [esp+10h] K_MAGIC xxxJunctionValue */
    int weaponBonus;      /* var_4 [esp+14h] */
    int model;            /* esi: ModelID, zero-ext BYTE */
    int wid;
    int i;
    unsigned char *mp;
    int a, b, c, d;
    int growth;
    int juncBonus;

    weaponBonus = 0; /* mov [esp+18h+var_4], 0 */
    chd = (unsigned char *)0x1CFE0E8 + p_char_id * 0x98;
    model = chd[0x08]; /* ModelID */

    /* lea ecx,[edx-1]; cmp ecx,7; ja def_496476 UNSIGNED */
    switch ((unsigned int)(p_stat - 1)) {
    case 0: /* loc_49647D STR p_stat==1 */
        savedBase = chd[0x0A];
        curve = (unsigned char *)0x1CF75F8 + model * 36;
        juncId = chd[0x5D]; /* JunctionSTR */
        magic_strj = *(unsigned char *)(0x1CF4064 + juncId * 60 + 0x18);
        if (*(unsigned char *)0x1CFE97A & 1) { /* SG_ODIN_ANGEL_GILGA_FLAG bit0 */
            i = model - 8;
            if (i == 0)
                wid = *(unsigned int *)0x1CFE760 & 0xFF; /* Laguna DWORD+mask */
            else if (i == 1)
                wid = *(unsigned char *)0x1CFE761; /* Kiros BYTE */
            else if (i == 2)
                wid = *(unsigned char *)0x1CFE762; /* Ward BYTE */
            else
                wid = chd[0x09];
        } else {
            wid = chd[0x09]; /* WeaponID */
        }
        weaponBonus = *(unsigned char *)(0x1CF7400 + wid * 12 + 8); /* strBonus */
        break;
    case 1: /* loc_496505 VIT */
        savedBase = chd[0x0B];
        curve = (unsigned char *)0x1CF75FC + model * 36;
        juncId = chd[0x5E];
        magic_strj = *(unsigned char *)(0x1CF4064 + juncId * 60 + 0x19);
        break;
    case 2: /* loc_496539 MAG */
        savedBase = chd[0x0C];
        curve = (unsigned char *)0x1CF7600 + model * 36;
        juncId = chd[0x5F];
        magic_strj = *(unsigned char *)(0x1CF4064 + juncId * 60 + 0x1A);
        break;
    case 3: /* loc_49656D SPR */
        savedBase = chd[0x0D];
        curve = (unsigned char *)0x1CF7604 + model * 36;
        juncId = chd[0x60];
        magic_strj = *(unsigned char *)(0x1CF4064 + juncId * 60 + 0x1B);
        break;
    case 4: /* loc_49659E SPD */
        savedBase = chd[0x0E];
        curve = (unsigned char *)0x1CF7608 + model * 36;
        juncId = chd[0x61];
        magic_strj = *(unsigned char *)(0x1CF4064 + juncId * 60 + 0x1C);
        break;
    case 7: /* loc_4965CF LCK p_stat==8 */
        savedBase = chd[0x0F];
        curve = (unsigned char *)0x1CF760C + model * 36;
        juncId = chd[0x64]; /* JunctionLCK; EVA +0x62 HIT +0x63 unused here */
        magic_strj = *(unsigned char *)(0x1CF4064 + juncId * 60 + 0x1F);
        break;
    default: /* def_496476 cases 6,7 and ja */
        curve = (unsigned char *)p_lvl;
        savedBase = p_lvl;
        juncId = p_lvl;
        break;
    }

    /* loc_49660C */
    if (p_stat == 5 || p_stat == 8)
        goto loc_4966F5;

    /* quartered: STR/VIT/MAG/SPR and default */
    if (juncId == 0) {
        p_char_id = 0;
        goto loc_496651;
    }
    mp = chd + 0x10; /* Magic.id */
    for (i = 0; i < 32; i++, mp += 2) { /* jl SIGNED */
        if (mp[0] == juncId) { /* al zero-ext vs ecx (full id; default uses p_lvl) */
            /* loc_4966DA amount via char*0x98 + slot*2 + 0x11 */
            p_char_id = mp[1];
            goto loc_496651;
        }
    }
    p_char_id = 0;

loc_496651:
    a = curve[0];
    b = curve[1];
    c = curve[2];
    d = curve[3];
    /* (lvl*lvl)/d then cdq/sub/sar-1: signed /2 */
    growth = ((p_lvl * p_lvl) / d) / 2;
    growth = p_lvl / b - growth;
    growth = (a * p_lvl) / 10 + growth; /* 66666667h sar 2 */
    growth = growth + c;
    growth = growth / 4; /* cdq ; and edx,3 ; sar 2 */
    juncBonus = (p_char_id * magic_strj) / 100; /* 51EB851Fh sar 5 */
    return CapTo255(juncBonus + savedBase + growth + weaponBonus);

loc_4966F5:
    if (juncId != 0) {
        mp = chd + 0x10;
        for (i = 0; i < 32; i++, mp += 2) { /* jl SIGNED */
            if (mp[0] == juncId) {
                p_char_id = mp[1]; /* loc_49677D */
                goto loc_496714;
            }
        }
    }
    p_char_id = 0; /* xor esi,esi */

loc_496714:
    a = curve[0];
    b = curve[1];
    c = curve[2];
    d = curve[3];
    /* two-operand imul esi,magic_strj sits between cdq and idiv ebx */
    juncBonus = (p_char_id * magic_strj) / 100;
    growth = p_lvl / b - p_lvl / d + a * p_lvl;
    return CapTo255(weaponBonus + c + juncBonus + savedBase + growth);
}
```
