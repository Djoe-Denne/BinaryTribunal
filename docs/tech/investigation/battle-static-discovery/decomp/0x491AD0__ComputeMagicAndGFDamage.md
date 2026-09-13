# ComputeMagicAndGFDamage @ 0x491AD0

- Instr (live): 412
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=14061
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=18427
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=20586
- A==B: non
- Push IDB: oui
- SetType: int __cdecl ComputeMagicAndGFDamage(int p_attacker_slot_id, int p_target_slot_id, int p_AttackPower, int p_gf_magic_type_damage)
- Notes parent: stride slot 0xD0; occupancy 1+2 / F_CHAR 0x1D0 absents (ASM contraire: flag_data DWORD +0x7C bits 0x4000/0x10000). +0x44 = elem_def WORD[8]. GetRandomInt AL then AND 0xFF, %33+0xF0. Switch UNSIGNED ja 17, byte_492078, jpt 9 dwords. setcc absent. ja vs jg: ja switch. 66: elem_def, status_1 attacker, cmp cmd 0x49. Pas de Hex-Rays. Pas de struct packee.

## C reconcilie

```c
/* ComputeMagicAndGFDamage @ 0x491AD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_491C28 (9 dwords) + byte_492078.
 * 412 instr, size 0x584, end 0x492054. IDA type int __cdecl(int,int,int,int). No domain::.
 * Slot stride 0xD0. Occupancy 1+2 unused. F_CHAR 0x1D0 unused.
 * GetRandomInt AL only then AND 0xFF. Switch bound UNSIGNED ja. WORD ops use 66.
 * No packed struct: live offsets on BATTLE_SLOT_DATA[slot*0xD0].
 */

extern unsigned char COMMAND_TYPE_ID;                         /* 0x1D27AD9 BYTE */
extern unsigned char ATTACK_FLAG;                             /* 0x1D28E0E BYTE */
extern unsigned char HIT_TYPE_2;                              /* 0x1D27ADE BYTE */
extern unsigned char byte_1D27ADD;                            /* 0x1D27ADD BYTE */
extern unsigned char BACK_PREEMTIVE_INFO_3;                  /* 0x1D28E0B BYTE */
extern unsigned char byte_1D28DCC[];                          /* 0x1D28DCC reflect queue, stride 3 */
extern unsigned short CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID; /* 0x1D27AF4 WORD (66 cmp) */
extern unsigned int HIT_STATUS_2;                            /* 0x1D2A234 DWORD */
extern unsigned int HIT_ELEMENT;                               /* 0x1D2A244 BYTE, DWORD load, test AL */
extern unsigned int HIT_ATTACK_HITPERCENT;                    /* 0x1D2A238 BYTE, DWORD load, AND 0xFF */
extern unsigned char HIT_ATTACK_ENABLER;                      /* 0x1D2A239 BYTE */
extern unsigned int GF_LEVEL;                                 /* 0x1D2A240 BYTE, DWORD load, AND 0xFF */
extern unsigned char GF_LEVEL_MOD;                           /* 0x1D2A243 BYTE */
extern unsigned char GF_POWER_MOD;                             /* 0x1D2A242 BYTE */
extern unsigned char GF_BOOST;                                 /* 0x1D2A23A BYTE */
extern unsigned int GF_SUMMON_MAG_BONUS;                      /* 0x1D2A23C WORD-sized, DWORD load, AND 0xFF */
extern unsigned char RELATED_TO_ATTACKER_SLOT_ID;             /* 0x1D27ADF BYTE */
extern int LINKED_TO_DRAIN;                                   /* 0x1D27AEC DWORD */
extern unsigned char ATTACK_TYPE_PHY_OR_MAG;                  /* 0x1D27AE2 BYTE */
extern unsigned int dword_1CFF6EC;                            /* 0x1CFF6EC DWORD */
extern unsigned char BATTLE_SLOT_DATA[];                      /* 0x1D27B10, stride 0xD0 */

extern unsigned char __cdecl Battle_GetRandomInt(void); /* AL only, no add esp */
extern int __cdecl Battle_GetElementFlagged(unsigned short p_element, unsigned char *p_list); /* add esp,8 */
extern char __cdecl BattleStatus_ApplyHitStatus_NoDrain(int, int, int); /* add esp,0Ch */

/* Live offsets (FF8BattleSlotData_s). Do not pack. */
#define OFF_STATUS2  0x08
#define OFF_CURHP    0x18
#define OFF_MAXHP    0x1C
#define OFF_ELEMDEF  0x44
#define OFF_FLAGDATA 0x7C
#define OFF_STATUS1  0x80
#define OFF_DRAINRES 0xA7
#define OFF_LEVEL    0xBC
#define OFF_MAG      0xBF
#define OFF_SPR      0xC0

#define BS8(slot, off)  (*(unsigned char  *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))
#define BS16(slot, off) (*(unsigned short *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))
#define BS32(slot, off) (*(unsigned int   *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))

static int sdiv16(int v) { return (v + ((v >> 31) & 0xF)) >> 4; }   /* cdq; and edx,0Fh; sar 4 */
static int sdiv8(int v)  { return (v + ((v >> 31) & 7)) >> 3; }     /* cdq; and edx,7; sar 3 */
static int sdiv4(int v)  { return (v + ((v >> 31) & 3)) >> 2; }     /* cdq; and edx,3; sar 2 */
static int sdiv256(int v){ return (v + ((v >> 31) & 0xFF)) >> 8; }  /* cdq; and edx,0FFh; sar 8 */

int __cdecl ComputeMagicAndGFDamage(int p_attacker_slot_id, int p_target_slot_id,
                                    int p_AttackPower, int p_gf_magic_type_damage)
{
    unsigned char cmd;
    unsigned char elem_list[4]; /* p_list_of_indice_element_flagged */
    int attacker, target, power, spr, damage, type;
    unsigned int bypass;

    cmd = COMMAND_TYPE_ID;

    /* Reflect: COMMAND!=0xF7 AND ATTACK_FLAG&0x10 AND status_2 BYTE & 0x80 */
    if (cmd != 0xF7 && (ATTACK_FLAG & 0x10) != 0) {
        target = p_target_slot_id;
        if ((BS8(target, OFF_STATUS2) & 0x80) != 0) {
            unsigned char q = BACK_PREEMTIVE_INFO_3;
            byte_1D28DCC[q * 3 + 0] = cmd;
            byte_1D28DCC[q * 3 + 1] = (unsigned char)CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID;
            byte_1D28DCC[q * 3 + 2] = (unsigned char)target;
            BACK_PREEMTIVE_INFO_3 = (unsigned char)(q + 1);
            BS32(target, OFF_FLAGDATA) |= 0x4000u; /* or ah,40h */
            byte_1D27ADD |= 0x31u;
            HIT_TYPE_2 |= 4u;
            return 0;
        }
    }

    /* loc_491B69 / loc_491B6D */
    target = p_target_slot_id;
    /* var_C = target * 0xD0 */
    BS32(target, OFF_FLAGDATA) &= ~0x4000u; /* and dh,0BFh */

    bypass = HIT_STATUS_2 & 0x04000000u;
    if (bypass == 0 && (BS8(target, OFF_STATUS1) & 4) != 0) {
        HIT_TYPE_2 |= 4u;
        return 0;
    }
    if (bypass == 0) {
        unsigned int st2 = BS32(target, OFF_STATUS2);
        if ((st2 & 0x200800u) != 0
            || (BS8(target, OFF_STATUS1) & 1) != 0
            || ((HIT_ELEMENT & 8u) != 0 && (st2 & 0x2000u) != 0)) {
            HIT_TYPE_2 |= 4u;
            return 0;
        }
    }

    spr = (int)BS8(target, OFF_SPR);
    if ((BS32(target, OFF_STATUS2) & 0x01000000u) != 0) /* A9 00 00 00 01 immediate */
        spr = 0;

    attacker = p_attacker_slot_id;
    power = p_AttackPower;
    type = p_gf_magic_type_damage;

    /* cmp eax,11h; ja def_491C28 (UNSIGNED). byte_492078 then jpt_491C28[9]. */
    if ((unsigned int)type > 17u) {
        damage = 0; /* def_491C28 */
        goto loc_491CCF;
    }
    switch (type) {
    case 10: { /* loc_491C2F: jpt[6] MAGIC_DAMAGE accuracy */
        int lvl = (int)BS8(target, OFF_LEVEL);
        int pct = (int)(HIT_ATTACK_HITPERCENT & 0xFFu);
        int rem;
        rem = lvl % pct; /* signed idiv; remainder EDX */
        if (rem != 0) {
            HIT_TYPE_2 |= 4u;
            return 0;
        }
        /* jz loc_491C62 */
    }
        /* fall through */
    case 6: /* loc_491C60: xor edi,edi then magic */
        if (type == 6)
            spr = 0;
        /* fall through */
    case 0: { /* loc_491C62 ordinary magic */
        int spread, mag, v;
        spread = (int)(((unsigned int)Battle_GetRandomInt() & 0xFFu) % 33u) + 0xF0;
        mag = (int)BS8(attacker, OFF_MAG);
        v = (mag + power) * (265 - spr);
        v = sdiv4(v);
        v *= power;
        v = sdiv256(v);
        v *= spread;
        damage = sdiv256(v);
        if (attacker >= 3) /* jl SIGNED 7C */
            damage >>= 1;
        goto loc_491CCB;
    }

    case 1: /* loc_491D4B percent current HP */
        if ((BS32(target, OFF_FLAGDATA) & 0x10000u) != 0) {
            damage = 0;
            HIT_TYPE_2 |= 4u;
            goto loc_491CCF;
        }
        damage = sdiv16((int)BS32(target, OFF_CURHP) * power);
        goto loc_491CCF;

    case 5: /* loc_491D83 xor edi then GF */
        spr = 0;
        /* fall through */
    case 2: { /* loc_491D85 GF formula */
        int spread, v;
        spread = (int)(((unsigned int)Battle_GetRandomInt() & 0xFFu) % 33u) + 0xF0;
        v = (int)(GF_LEVEL & 0xFFu) * (int)GF_LEVEL_MOD;
        v = v / 10; /* imul 66666667h; sar edx,2; sign adj */
        v = (int)GF_POWER_MOD + power + v;
        v *= (265 - spr);
        v = sdiv8(v);
        v *= power;
        v = sdiv256(v);
        v *= (int)GF_BOOST;
        v = v / 100; /* imul 51EB851Fh; sar 5; sign adj */
        v *= (int)(GF_SUMMON_MAG_BONUS & 0xFFu) + 100;
        v = v / 100;
        v *= spread;
        damage = sdiv256(v);
        if ((HIT_TYPE_2 & 4u) == 0 && CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID == 0x49)
            HIT_TYPE_2 |= 0x10u; /* WORD cmp 66 83 3D ... 49h */
        goto loc_491CCB;
    }

    case 4: /* loc_491E6E GF percent max HP */
        if ((BS32(target, OFF_FLAGDATA) & 0x10000u) != 0) {
            damage = 0;
            HIT_TYPE_2 |= 4u;
            goto loc_491CCF;
        }
        {
            int numer = (int)BS32(target, OFF_MAXHP) * (int)(GF_LEVEL & 0xFFu);
            int denom = (int)GF_POWER_MOD - (int)GF_LEVEL_MOD + 100;
            damage = numer / denom; /* signed idiv */
        }
        goto loc_491CCF;

    case 17: /* loc_491EC5 */
        /* mul 0x10624DD3; shr edx,6 == unsigned /1000 */
        damage = (int)(dword_1CFF6EC / 1000u) * power;
        goto loc_491CCF;

    default: /* jpt[8] types 3,7-9,11-16 */
        damage = 0;
        goto loc_491CCF;
    }

loc_491CCB:
    /* mov ecx, var_C — ecx restored after formula clobber; C keeps target */
loc_491CCF:
    if ((ATTACK_FLAG & 3u) == 1u && damage != 0 && (BS8(target, OFF_STATUS2) & 0x40) != 0) {
        byte_1D27ADD |= 0x20u;
        damage >>= 1;
    }
    if ((BS32(target, OFF_STATUS2) & 0x80000u) != 0)
        damage >>= 1;

    if ((HIT_ELEMENT & 0xFFu) != 0) {
        int elem;
        Battle_GetElementFlagged((unsigned short)(HIT_ELEMENT & 0xFFu), elem_list);
        elem = (int)(elem_list[0] & 0xFFu);
        if ((BS8(target, OFF_STATUS1) & 0x40) != 0 && elem == 7)
            elem = 0x2BC; /* 700; jmp loc_491EFB */
        else
            elem = (int)BS16(target, OFF_ELEMDEF + elem * 2); /* 66 8B WORD */
        {
            int t = (0x384 - elem) * damage;
            damage = t / 100; /* 51EB851Fh /100 signed */
        }
    }

    HIT_STATUS_2 &= 0xFBFFFFFFu;
    if ((HIT_STATUS_2 & 0x8000u) != 0) {
        int amt = (int)HIT_ATTACK_ENABLER - (int)BS8(target, OFF_DRAINRES);
        RELATED_TO_ATTACKER_SLOT_ID = (unsigned char)attacker;
        if (amt <= 0) { /* jle SIGNED 7E */
            LINKED_TO_DRAIN = 0;
            ATTACK_TYPE_PHY_OR_MAG |= 1u;
        } else {
            int att_z = (int)(BS16(attacker, OFF_STATUS1) & 0x40); /* 66 8B / 66 25 */
            int tgt_z = (int)(BS8(target, OFF_STATUS1) & 0x40);
            amt = amt * damage / 100;
            if ((att_z != 0) != (tgt_z != 0))
                amt = -amt;
            amt = -amt; /* unconditional neg */
            if (amt < 0) { /* jns skip */
                ATTACK_TYPE_PHY_OR_MAG |= 1u;
                amt = ~amt + 1; /* not / inc */
            }
            if (amt > 0x270F) /* jle SIGNED */
                amt = 0x270F;
            LINKED_TO_DRAIN = amt;
        }
        HIT_STATUS_2 &= 0xFFFF7FFFu; /* and ah,7Fh */
    }

    /* loc_491FED */
    if ((BS32(target, OFF_STATUS2) & 0x400000u) != 0) {
        (void)BS32(attacker, OFF_FLAGDATA); /* 0x492002 dead DWORD load */
    }
    {
        char hit = BattleStatus_ApplyHitStatus_NoDrain(attacker, target, 1);
        if (hit == 0) {
            if (power == 0)
                HIT_TYPE_2 |= 4u;
        } else {
            if (power == 0)
                byte_1D27ADD |= 1u;
        }
    }

    if (damage < 0) { /* jge SIGNED 7D */
        HIT_TYPE_2 |= 1u;
        damage = ~damage + 1;
    }
    return damage;
}
```
