# ParseBattleCharacter @ 0x495530

- Instr (live): 269
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6438
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7486
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=9486
- A==B: non
- Push IDB: oui
- SetType: int __cdecl ParseBattleCharacter(int p_char_id, int p_slot_id)
- Notes parent: CharacterData 152 vs F_CHAR 0x1D0. Slot 0xD0 / occupancy 1+2 / GetRandomInt absents. JFlag table +5/+6/+7. +0x14 WORD DX=0. jpt_4957CA + byte_4958F0, ja unsigned 0x0D. Commands[0..2] seulement. GF 16 x 0x44, jl vs 0x1CFE0FA. Attack neg/sbb 1|0x0C. EAX leftover. Pas de struct packée. Pas de Hex-Rays.

## C réconcilié

```c
/* ParseBattleCharacter @ 0x495530
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 269 instr, size 0x3A8, end 0x4958D8 = jpt_4957CA. IDA type int __cdecl(int,int).
 * No domain::. CharacterData stride 152 (0x98). F_CHAR stride 0x1D0. Slot 0xD0 unused.
 * Occupancy 1+2 unused. GetRandomInt unused. No setcc opcode (Attack id = neg/sbb).
 * ja UNSIGNED vs 0x0D (77). jb/jnb UNSIGNED vs 0x14/0x27. jl/jge SIGNED (7C/7D).
 * WORD 66: HP, MentalStatus, JunctionedGFs, GF HP cmp, shr bits, +0x14 DX=0, movzx cx, cmp 0FFh.
 * jpt_4957CA + byte_4958F0. Commands[0..2] only (3 iters). JFlag at K_JUNCTION_ABILITY +5.
 */

extern unsigned char SG_ARRAY_CHARA_DATA[]; /* 0x1CFE0E8 CharacterData[8] stride 152 */
extern unsigned char F_CHAR_DATA[];          /* 0x1CFF000 stride 0x1D0 */
extern unsigned char SG_ARRAY_GF_DATA[];    /* 0x1CFDCA8 stride 0x44; HP WORD at +0x12 */
extern unsigned char K_JUNCTION_ABILITY[];   /* 0x1CF7F28 stride 8; JFlag +5,+6,+7 */
extern unsigned char K_BATTLE_COMMAND[];      /* 0x1CF3F2C stride 8; abilityDataID +4, unknownFlags +5, target +6 */
extern unsigned char K_BATTLE_COMMAND_ABILITY[]; /* 0x1CF7E68 stride 16; AttackFlags +6 */
extern unsigned char K_CHARACTER[];            /* 0x1CF75EC stride 36; limitBreakID +4 */
extern unsigned char K_GF_JUNCTIONABLE[];    /* 0x1CF4DC0 stride 0x84; ebp starts at +8 */
extern unsigned char RARE_ITEM_ABILITY_IN_IT; /* 0x1CFF6D8 BYTE */
extern unsigned char BATTLE_SEAL;             /* 0x1CFF6E8 BYTE */

extern int __cdecl getCharaXP_sub_496240(int experience, int p_char_id);
extern int __cdecl getCharaXP_sub_4961D0(int experience, int p_char_id);
extern int __cdecl getWeaponID(int p_char_id);
extern int __cdecl sub_4962C0(int p_char_id, int index);

int __cdecl ParseBattleCharacter(int p_char_id, int p_slot_id)
{
    unsigned char *src; /* edi = SG_ARRAY_CHARA_DATA + char_id*152 */
    unsigned char *dst; /* esi = F_CHAR_DATA + slot*0x1D0 */
    unsigned int xp;
    unsigned int jflag;
    unsigned int ab;
    unsigned char rare;
    unsigned char *p;
    int n;
    unsigned short gf_bits;
    unsigned char *gf_hp;
    unsigned char *kj;
    unsigned char *rec;
    unsigned int gf_idx;
    unsigned char seal;
    unsigned char *cmd;
    unsigned char *crec;
    unsigned int id;
    unsigned short abil;
    unsigned int attack_id;
    unsigned int rel;
    unsigned int lim;
    int i;
    unsigned int flag;
    unsigned char *scan;

    /* lea eax,[ebx+ebx*8]; lea edi,[ebx+eax*2]; shl edi,3 */
    src = &SG_ARRAY_CHARA_DATA[p_char_id * 152];
    /* lea ecx,[esi*8]; sub ecx,esi; lea esi,[esi+ecx*4]; shl esi,4; add F_CHAR_DATA */
    dst = &F_CHAR_DATA[p_slot_id * 0x1D0];

    dst[0x1C3] = src[8]; /* ModelID — stored BEFORE the 0xFF test */
    if (p_char_id == 0xFF) {
        dst[0x1C3] = 0xFF;
        return 0; /* EAX leftover (eax still char_id*9). pops edi,esi,ebx; no ebp */
    }

    *(unsigned short *)&dst[0x172] = *(unsigned short *)&src[0]; /* CurrentHP 66 */
    xp = *(unsigned int *)&src[4]; /* Experience */
    *(unsigned int *)&dst[0x178] = xp;
    *(unsigned int *)&dst[0x17C] = getCharaXP_sub_496240((int)xp, p_char_id);
    dst[0x1B8] = (unsigned char)getCharaXP_sub_4961D0((int)xp, p_char_id); /* AL level */
    dst[0x1B9] = src[0x5B]; /* AltModel */
    dst[0x1BA] = (unsigned char)getWeaponID(p_char_id); /* AL */
    *(unsigned short *)&dst[0x1B2] = *(unsigned short *)&src[0x96]; /* MentalStatus 66 */
    *(unsigned int *)&dst[0x188] = 0; /* xor edx,edx; add esp,14h already done */

    /* JFlag DWORD +0x190: OR of 24-bit JFlag for Abilitie[0..3] in [0x3A,0x4E) SIGNED */
    jflag = 0;
    for (i = 0; i < 4; i++) {
        ab = src[0x54 + i];
        if ((int)ab >= 0x3A && (int)ab < 0x4E) {
            jflag |= (unsigned int)K_JUNCTION_ABILITY[ab * 8 + 5]
                   | ((unsigned int)K_JUNCTION_ABILITY[ab * 8 + 6] << 8)
                   | ((unsigned int)K_JUNCTION_ABILITY[ab * 8 + 7] << 16);
        }
    }
    *(unsigned int *)&dst[0x190] = jflag;

    rare = RARE_ITEM_ABILITY_IN_IT;
    for (i = 0; i < 4; i++) {
        ab = src[0x54 + i];
        if ((int)ab >= 0x4E && (int)ab < 0x53)
            rare |= K_JUNCTION_ABILITY[ab * 8 + 5]; /* JFlag low byte only */
    }
    RARE_ITEM_ABILITY_IN_IT = rare;

    /* dl==0 (xor edx) through these fills */
    p = dst + 0x85;
    n = 0x20;
    do {
        p[-3] = 0;
        p[-2] = 0;
        p[-1] = 0;
        p[0] = 0;
        p[1] = 0;
        p += 5;
    } while (--n);
    p = dst + 0x125;
    n = 0x10;
    do {
        p[-3] = 0;
        p[-2] = 0;
        p[-1] = 0;
        p[0] = 0;
        p[1] = 0;
        p += 5;
    } while (--n);
    p = dst + 0x21;
    n = 4;
    do {
        p[-3] = 0;
        p[-2] = 0;
        p[-1] = 0;
        p[0] = 0;
        p += 4;
    } while (--n);

    gf_bits = *(unsigned short *)&src[0x58]; /* JunctionedGFs; ecx high was 0 */
    dst[0x1C] = 0;
    dst[0x1D] = 0;
    *(unsigned short *)&dst[0x14] = 0; /* 66 DX=0, NOT JunctionedGFs (timer) */
    rec = dst + 0x126;
    gf_hp = SG_ARRAY_GF_DATA + 0x12; /* 0x1CFDCBA */
    kj = K_GF_JUNCTIONABLE + 8; /* 0x1CF4DC8 */
    gf_idx = 0;
    do {
        if (gf_bits & 1) {
            rec[-4] = (unsigned char)(gf_idx + 0x40);
            rec[-3] = 1;
            rec[0] = 0;
            if (*(unsigned short *)gf_hp == 0)
                rec[0] = 2;
            rec[-1] = kj[1];
            rec[-2] = kj[0];
            rec += 5;
        }
        gf_bits >>= 1; /* shr WORD scratch */
        gf_hp += 0x44;
        gf_idx++;
        kj += 0x84;
    } while ((int)gf_hp < 0x1CFE0FA); /* jl vs Magic.id+2; 16 rows */

    seal = BATTLE_SEAL;
    cmd = src + 0x50; /* Commands[0] */
    crec = dst + 0x25; /* first copied record at +0x22 */
    /* ebp=1-&Commands[0]; after inc edi, ecx=2,3,4 → 3 iters, not 4 */
    n = 0;
    while (1) {
        unsigned int c = cmd[0];
        if (c < 0x14u || c >= 0x27u)
            goto loc_4957F5; /* jb / jnb UNSIGNED — leave zeros */
        id = K_JUNCTION_ABILITY[c * 8 + 5]; /* JFlag low → battle cmd id */
        crec[-3] = (unsigned char)id;
        id = crec[-3];
        crec[-2] = K_BATTLE_COMMAND[id * 8 + 5];
        crec[0] = 0;
        crec[-1] = K_BATTLE_COMMAND[id * 8 + 6];
        if ((unsigned char)id == 0x0D)
            crec[0] |= 8;
        abil = (unsigned short)K_BATTLE_COMMAND[id * 8 + 4]; /* movzx cx */
        if (abil != 0xFF) {
            if (K_BATTLE_COMMAND_ABILITY[((unsigned int)abil << 4) + 6] & 0x80)
                crec[0] |= 1;
        }
        /* cmp ecx,0Dh; ja def_4957CA UNSIGNED. byte_4958F0[14]={0,5,1,2,3,5,4,5,5,5,5,5,5,3}
         * jpt: 0→4957F5, 1→4957D1, 2→4957D8, 3→4957E6, 4→4957DF, 5→def_4957CA */
        if (id > 0x0Du)
            goto def_4957CA;
        switch (id) {
        case 0:
            goto loc_4957F5;
        case 2:
            if (seal & 2)
                goto loc_4957F2;
            goto loc_4957F5;
        case 3:
            if (seal & 4)
                goto loc_4957F2;
            goto loc_4957F5;
        case 6:
            if (seal & 8)
                goto loc_4957F2;
            goto loc_4957F5;
        case 4:
        case 13:
            if (seal & 1)
                goto loc_4957F2;
            goto loc_4957F5;
        default:
        def_4957CA:
            if (seal & 0x10)
                goto loc_4957F2;
            goto loc_4957F5;
        }
    loc_4957F2:
        crec[0] |= 2;
    loc_4957F5:
        cmd++;
        crec += 4;
        n++;
        if (n + 1 >= 4) /* lea ecx,[edi+ebp] == n+1 after first inc; jl vs 4 */
            break;
    }

    /* Attack at +0x1E: al=JFlag&1; neg; sbb; and 0Bh; inc → 0x0C or 1 */
    attack_id = (jflag & 1) ? 0x0Cu : 1u;
    dst[0x1E] = (unsigned char)attack_id;
    dst[0x1F] = K_BATTLE_COMMAND[(attack_id & 0xFF) * 8 + 5];
    dst[0x21] = 0;
    dst[0x20] = K_BATTLE_COMMAND[(unsigned int)dst[0x1E] * 8 + 6];

    rel = dst[0x1C3];
    lim = K_CHARACTER[rel * 36 + 4]; /* lea edx,[eax+eax*8]; [edx*4+limitBreakID] */
    dst[0x2E] = (unsigned char)lim;
    dst[0x30] = K_BATTLE_COMMAND[(lim & 0xFF) * 8 + 6];
    dst[0x2F] = K_BATTLE_COMMAND[(unsigned int)dst[0x2E] * 8 + 5];
    dst[0x31] = 0;

    for (i = 0; i < 9; i++)
        dst[0x1C7 + i] = (unsigned char)sub_4962C0(p_char_id, i);

    flag = (jflag & 0x20000u) ? 1u : 0u;
    scan = dst + 0x1E; /* ebp still Attack record */
    i = 0;
    while (i < 4) {
        if (scan[0] == 6)
            goto loc_4958C1;
        i++;
        scan += 4;
    }
    dst[0x1C6] = (unsigned char)flag;
    return 0; /* EAX leftover (scan count) */

loc_4958C1:
    if ((BATTLE_SEAL & 8) == 0)
        flag |= 2;
    dst[0x1C6] = (unsigned char)flag;
    return 0; /* EAX leftover */
}
```
