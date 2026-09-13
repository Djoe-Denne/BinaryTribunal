# setMonsterInfoFromDatInfoSection @ 0x48BBD0

- Instr (live): 243
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6680
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3971
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8240
- A==B: non
- Push IDB: oui
- SetType: int __cdecl setMonsterInfoFromDatInfoSection(unsigned int p_slot_id, int p_level_code, unsigned __int8 p_com_id)
- Notes parent: stride 0xD0 (pas F_CHAR 0x1D0). Occupancy 1+2 absente ici. DAT=**[+0x00]. BMI_SCAN (slot-3)*71 BYTE 0. GetRandomInt AL+AND 0xFF; idiv 100 +1. jg/jle signes level; ja UNSIGNED mental 18h. jpt_48BDEB 14 DWORD + byte_48BF7C[25]. flag DWORD 0x11 puis OR 2000/8000/10000/20. HP DWORD /20 magic. elem 8 WORD *10 (66). mental 40 BYTE; Darkness +0x96=FF si Zombie. set_zero 8 stosd. BMI slot*71 6x0x0A. add esp 4 et 8. EAX leftover ATB. Pas de Hex-Rays.

## C réconcilié

```c
/* setMonsterInfoFromDatInfoSection @ 0x48BBD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_48BDEB, not Hex-Rays.
 * 243 instr, size 0x372. IDA type int __cdecl(unsigned int, int, unsigned __int8).
 * No domain::. Slot stride 0xD0 (lea*3/+*4/shl4). No F_CHAR 0x1D0.
 * No occupancy walk (1+2 is inside average-level callees, not this body).
 * GetRandomInt = AL then and eax,0FFh; signed idiv 100; rem+1.
 * ja UNSIGNED vs 18h on mental switch; jg/jle SIGNED on level_code.
 * 66 prefix: status_1 WORD, movzx dx, elem_def WORD, BMI+4 WORD.
 * DAT H7 via edi=[*monster_info_section]; offsets, no packed struct.
 */

extern unsigned char BATTLE_SLOT_DATA[];        /* 0x1D27B10 */
extern unsigned char BMI_SCAN_BUFFER[];        /* 0x1D28F28 */
extern unsigned char BMI_MONSTER_STAT_PERCENT[]; /* 0x1D28E83 */

int GetPartyAverageLevelWithRandomness(void);
int __cdecl GetPartyAverageLevelExact(void);
int GetPartyAverageLevelConstrainedTeam(void);
unsigned char __cdecl Battle_GetRandomInt(void);
int GetPartyAverageLevelCapped65PlusRandom(void);
int __cdecl GetPartyAverageLevelWithOffset(int);
int __cdecl Battle_InitATB_MaxAndReset(int p_slot_id);
int __cdecl Battle_InitATB_RandomFromSpeed(int p_slot_id);

int __cdecl setMonsterInfoFromDatInfoSection(unsigned int p_slot_id, int p_level_code, unsigned char p_com_id)
{
    unsigned char *sl;     /* esi = slot * 0xD0 */
    unsigned char *dat;    /* edi = *[monster_info_section] */
    unsigned char innate;  /* DAT[+0xF7], saved over stack level_code BYTE */
    int lvl;
    int hp0, hp1, hp2, hp3, hp;
    int i;
    unsigned int flags;
    unsigned char *ai;
    unsigned int ai_hdr;
    unsigned int ai_p;
    unsigned int ai_off;
    unsigned char *bmi;
    unsigned int *pz;

    sl = BATTLE_SLOT_DATA + p_slot_id * 0xD0;
    dat = *(unsigned char **)(*(unsigned char **)(sl + 0x00));

    /* BYTE 0 at BMI_SCAN_BUFFER[(slot-3)*71] — before the jg (ebx=0) */
    BMI_SCAN_BUFFER[((int)p_slot_id - 3) * 71] = 0;

    /* level_code: signed jg/jle (7F/7E), not ja */
    if (p_level_code <= 100) {
        lvl = p_level_code;
    } else if (p_level_code == 255) {
        lvl = GetPartyAverageLevelWithRandomness();
    } else if (p_level_code == 254) {
        lvl = GetPartyAverageLevelExact();
    } else if (p_level_code == 253) {
        lvl = GetPartyAverageLevelConstrainedTeam();
    } else if (p_level_code == 252) {
        /* and eax,0FFh; ecx=100; cdq; idiv ecx; eax=edx; inc */
        lvl = (int)(((unsigned int)Battle_GetRandomInt() & 0xFFu) % 100u) + 1;
    } else if (p_level_code == 251) {
        lvl = GetPartyAverageLevelCapped65PlusRandom();
    } else if (p_level_code > 200 && p_level_code <= 250) {
        lvl = GetPartyAverageLevelWithRandomness() + p_level_code - 200;
    } else if (p_level_code > 100 && p_level_code <= 200) {
        lvl = GetPartyAverageLevelWithOffset(p_level_code); /* add esp,4 */
    } else {
        lvl = (int)p_slot_id; /* loc_48BCA0 */
    }
    if (lvl > 100)
        lvl = 100;
    sl[0xBC] = (unsigned char)lvl; /* level BYTE */

    flags = 0x11; /* DWORD flag_data|immunity at +0x7C */
    innate = dat[0xF7];
    if (innate & 0x10)
        flags |= 0x2000; /* or dh,20h */
    if (innate & 0x08)
        flags |= 0x8000; /* or ah,80h */
    if (dat[0xFE] & 0x40)
        flags |= 0x10000; /* or ecx,10000h */
    /* edx=ai_section; ecx=[edx]; eax=[ecx+4]+ecx; ecx=[eax+0Ch]; [ecx+eax]!=0 */
    ai = *(unsigned char **)(sl + 0x04);
    ai_hdr = *(unsigned int *)ai;
    ai_p = *(unsigned int *)(ai_hdr + 4) + ai_hdr;
    ai_off = *(unsigned int *)(ai_p + 0x0C);
    if (*(unsigned char *)(ai_off + ai_p) != 0)
        flags |= 0x20;
    *(unsigned int *)(sl + 0x7C) = flags;

    sl[0xBB] = p_com_id; /* com_file_id BYTE */

    hp0 = dat[0x18];
    hp1 = dat[0x19];
    hp2 = dat[0x1A];
    hp3 = dat[0x1B];
    lvl = sl[0xBC]; /* cl reload BYTE level */
    /* (hp0*lvl*lvl)/20 via imul 66666667h sar 3 + sign shr 1Fh
     * + lvl*(hp0+100*hp2) + 10*(hp1+100*hp3) */
    hp = (hp0 * lvl * lvl) / 20
       + lvl * (hp0 + 100 * hp2)
       + 10 * (hp1 + 100 * hp3);
    *(unsigned int *)(sl + 0x18) = (unsigned int)hp; /* current_hp DWORD */
    *(unsigned int *)(sl + 0x1C) = (unsigned int)hp; /* max_hp DWORD */

    sl[0xC4] = 0; /* hit_percent BYTE */
    sl[0xC2] = 0; /* luck BYTE */
    *(unsigned short *)(sl + 0x80) = 0; /* status_1 WORD (66) */
    *(unsigned int *)(sl + 0x08) = 0;   /* status_2 DWORD */
    sl[0xC6] = 0x64; /* hit_element_percent BYTE */

    /* elem_def WORD[8] at +0x44: DAT[+0x160+i]*10, jl signed */
    for (i = 0; i < 8; i++)
        *(unsigned short *)(sl + 0x44 + i * 2) = (unsigned short)(dat[0x160 + i] * 10);

    /* mental_res 40 BYTES at +0x90. Gate: cmp ecx,18h; ja def UNSIGNED.
     * byte_48BF7C[25]={0,0,0,0,0,0,0,13,1,2,3,4,5,13,13,6,13,13,7,13,8,9,10,11,12}
     * jpt_48BDEB[14] @ 0x48BF44 → loc_48BDF2..loc_48BE6B, def_48BDEB */
    for (i = 0; i < 40; i++) {
        unsigned char v;
        if ((unsigned int)i > 0x18u) {
            v = 100; /* ecx 25..39 */
        } else {
            switch (i) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6:
                v = dat[0x168 + i]; /* loc_48BDF2 */
                break;
            case 8:  v = dat[0x16F]; break; /* loc_48BDFD */
            case 9:  v = dat[0x170]; break;
            case 10: v = dat[0x171]; break;
            case 11: v = dat[0x172]; break;
            case 12: v = dat[0x173]; break;
            case 15: v = dat[0x174]; break;
            case 18: v = dat[0x175]; break;
            case 20: v = dat[0x176]; break;
            case 21: v = dat[0x177]; break;
            case 22: v = dat[0x178]; break;
            case 23: v = dat[0x179]; break;
            case 24: v = dat[0x17A]; break;
            default:
                v = 100; /* 7,13,14,16,17,19 */
                break;
            }
        }
        sl[0x90 + i] = v;
    }

    /* innate from saved DAT[+0xF7]; jz; no setcc */
    if (innate & 0x01) {
        sl[0x80] |= 0x40;  /* BYTE or status_1 Zombie */
        sl[0x96] = 0xFF;   /* mental_res.Darkness, not Death[0] */
    }
    if (innate & 0x02)
        *(unsigned int *)(sl + 0x08) |= 0x2000; /* or ch,20h Float */
    if (innate & 0x20)
        *(unsigned int *)(sl + 0x08) |= 0x80;   /* or cl,80h Reflect */
    if (innate & 0x80)
        *(unsigned int *)(sl + 0x08) |= 0x20;   /* DWORD or Protect */
    if (innate & 0x40)
        *(unsigned int *)(sl + 0x08) |= 0x40;   /* or al,40h Shell */

    sl[0x8A] = 0; /* number_turn */
    sl[0x89] = 0; /* last_attacker_attack_type */
    sl[0x88] = 0; /* last_attacker_slot_id */
    sl[0xC7] = 0; /* target_reaction_type */
    sl[0xC8] = 0; /* attack_sequence_id */

    /* slot*71: DWORD 0x0A0A0A0A then WORD 0x0A0A (66) */
    bmi = BMI_MONSTER_STAT_PERCENT + p_slot_id * 71;
    *(unsigned int *)bmi = 0x0A0A0A0Au;
    *(unsigned short *)(bmi + 4) = 0x0A0A;

    /* set_zero +0x24: ecx=8; xor eax,eax; rep stosd */
    pz = (unsigned int *)(sl + 0x24);
    for (i = 0; i < 8; i++)
        pz[i] = 0;

    Battle_InitATB_MaxAndReset((int)p_slot_id);
    return Battle_InitATB_RandomFromSpeed((int)p_slot_id); /* add esp,8; leftover EAX */
}
```
