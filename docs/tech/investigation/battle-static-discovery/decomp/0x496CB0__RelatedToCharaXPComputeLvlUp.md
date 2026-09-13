# RelatedToCharaXPComputeLvlUp @ 0x496CB0

- Instr (live): 194
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3494
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5555
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4571
- A==B: non
- Push IDB: oui
- SetType: int __cdecl(int p_target_slot_id, unsigned __int16 a2)
- Notes parent: CharacterData 0x98 AND F_CHAR 0x1D0 ; occupancy 1+2 absent (0xFF) ; GetRandomInt absent ; K_CHARACTER +6/+7 ; L100 index char_id*36 not ModelID ; jl/jle signed ; BYTE 0x80 HP+30 WORD ; AH 1/2/4/8 stats 0..3 ; DWORD XP + F_CHAR+178 ; pas de setcc/jpt ; pas de Hex-Rays

## C réconcilié

```c
/* RelatedToCharaXPComputeLvlUp @ 0x496CB0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 194 instr, size 0x277, end 0x496F27.
 * IDA type int __cdecl(int p_target_slot_id, unsigned __int16 a2). C ident without '?'.
 * No domain::. CharacterData stride 0x98 AND F_CHAR stride 0x1D0 (both used).
 * Occupancy flag_data 1+2 unused (empty = SG_PARTY_BATTLE==0xFF). GetRandomInt unused.
 * BATTLE_SLOT_DATA 0xD0 unused. GF Exists 0x44 unused. No setcc. No jump table.
 * jl/jle signed. No ja/jg.
 */

extern unsigned char SG_PARTY_BATTLE[];     /* 0x1CFE74C BYTE[slot] */
extern unsigned char SG_ARRAY_CHARA_DATA[]; /* 0x1CFE0E8 CharacterData[8] stride 0x98 */
extern unsigned char F_CHAR_DATA[];         /* 0x1CFF000 stride 0x1D0 */
extern unsigned char K_CHARACTER[];         /* 0x1CF75EC FF8KernelCharacter stride 0x24; expModifier WORD +6 */

extern __int16 __cdecl capTo9999(int);                              /* 0x495950 add esp 4 */
extern int __cdecl increaseCharaStatBy1(int p_target_slot_id, int a2); /* 0x495F90 add esp 8 */

/* cdq; and edx,0FFh; add; sar 8. Operands in this func are >= 0 so == /256. */
static int div256_toward0(int x)
{
    return (x + ((x >> 31) & 0xFF)) >> 8;
}

int __cdecl RelatedToCharaXPComputeLvlUp(int p_target_slot_id, unsigned __int16 a2)
{
    unsigned char *chara;
    unsigned char *fchar;
    unsigned char *kchar;
    int char_id;
    int model_id;
    int exp_high;
    int exp_low;
    int high_acc;
    int low10;
    int low_acc;
    int new_level;
    int level;
    int xp;
    int thresh;
    int gained;
    unsigned int abilities;

    char_id = (unsigned char)SG_PARTY_BATTLE[p_target_slot_id];
    if (char_id == 0xFF)
        return 0;

    chara = SG_ARRAY_CHARA_DATA + char_id * 0x98;
    fchar = F_CHAR_DATA + p_target_slot_id * 0x1D0;

    /* loop1 loc_496D28: level from current Experience vs thresh(L)= (high*L*L)/256 + L*(low*10) */
    model_id = (unsigned char)chara[8];
    kchar = K_CHARACTER + model_id * 36;
    exp_high = (unsigned char)kchar[7]; /* HIBYTE expModifier */
    exp_low = (unsigned char)kchar[6];  /* LOBYTE expModifier */
    low10 = exp_low * 10;
    high_acc = exp_high;
    low_acc = low10;
    new_level = 1;
    xp = *(int *)(chara + 4);
    while (1) {
        thresh = div256_toward0(high_acc * new_level) + low_acc;
        if (xp < thresh) /* jl signed */
            break;
        new_level++;
        high_acc += exp_high;
        low_acc += low10;
        if (new_level < 100) /* jl signed vs 64h */
            continue;
        break;
    }

    /* add WORD xp (and 0xFFFF); store DWORD to CharacterData+4 and F_CHAR+0x178 */
    xp += (int)(a2 & 0xFFFFu);
    *(int *)(chara + 4) = xp;
    *(int *)(fchar + 0x178) = xp;

    /* loop2 loc_496DBF: re-read ModelID modifiers; ebp=1; compare NEW xp */
    model_id = (unsigned char)chara[8];
    kchar = K_CHARACTER + model_id * 36;
    exp_high = (unsigned char)kchar[7];
    exp_low = (unsigned char)kchar[6];
    low10 = exp_low * 10;
    high_acc = exp_high;
    low_acc = low10;
    level = 1;
    while (1) {
        thresh = div256_toward0(high_acc * level) + low_acc;
        if (xp < thresh) /* jl signed */
            break;
        high_acc += exp_high;
        level++;
        low_acc += low10;
        if (level < 100)
            continue;
        break;
    }

    /* loc_496DFE: if ebp >= 100, clamp XP to thresh(99) using char_id*36 NOT ModelID */
    if (level >= 100) {
        int hc;
        int lc;

        kchar = K_CHARACTER + char_id * 36;
        hc = (unsigned char)kchar[7];
        lc = (unsigned char)kchar[6];
        level = 100;
        xp = div256_toward0(hc * 9801) + lc * 990;
        *(int *)(chara + 4) = xp;
        *(int *)(fchar + 0x178) = xp;
    }

    /* loc_496E57: skip bonuses if old level == 100 (jz) or gained <= 0 (jle signed) */
    if (new_level != 100) {
        gained = level - new_level;
        if (gained > 0) {
            do {
                /* test BYTE [fchar+190h],80h : HP Bonus MaxHP WORD += 30 */
                if (fchar[0x190] & 0x80) {
                    unsigned char cid = SG_PARTY_BATTLE[p_target_slot_id];
                    unsigned char *rec = SG_ARRAY_CHARA_DATA + cid * 0x98;
                    unsigned int hp = *(unsigned short *)(rec + 2);

                    hp += 0x1E;
                    *(unsigned short *)(rec + 2) = (unsigned short)capTo9999((int)hp);
                }
                abilities = *(unsigned int *)(fchar + 0x190);
                if (abilities & 0x100) /* test ah,1 */
                    increaseCharaStatBy1(p_target_slot_id, 0);
                abilities = *(unsigned int *)(fchar + 0x190);
                if (abilities & 0x200) /* test ah,2 */
                    increaseCharaStatBy1(p_target_slot_id, 1);
                abilities = *(unsigned int *)(fchar + 0x190);
                if (abilities & 0x400) /* test ah,4 */
                    increaseCharaStatBy1(p_target_slot_id, 2);
                abilities = *(unsigned int *)(fchar + 0x190);
                if (abilities & 0x800) /* test ah,8 */
                    increaseCharaStatBy1(p_target_slot_id, 3);
                gained--;
            } while (gained != 0);
        }
    }

    return level;
}
```
