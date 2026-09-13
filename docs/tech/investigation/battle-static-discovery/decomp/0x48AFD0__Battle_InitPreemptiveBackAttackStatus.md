# Battle_InitPreemptiveBackAttackStatus @ 0x48AFD0

- Instr (live): 116
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3938
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2920
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2812
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_InitPreemptiveBackAttackStatus(void)
- Notes parent: bits 80/20/40 => type 0/1/2. Scan 3..6 Status1 Death bit0 + DAT[[eax]][0xFE] bit0 (pas occupancy 1+2). jl vs adresse 0x1D280C0. setnl+inc. ja UNSIGNED jpt 48B0AE/C0/100/112. OR DWORD 0x800000. F_CHAR 0x1D0 case 2 only. RareItem and 1. Pas de Hex-Rays.

## C réconcilié

```c
/* Battle_InitPreemptiveBackAttackStatus @ 0x48AFD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 116 instr, size 0x171. End 0x48B141. jpt_48B0A7 @ 0x48B144.
 * IDA leftover type int *(). No args. cdecl. No domain::.
 * Slot stride 0xD0. F_CHAR stride 0x1D0 only on case 2 ecx.
 * Occupancy 1+2 NOT used: Status1 Death bit0 then DAT+0xFE.
 * No 66 prefix. setnl bl + inc ebx. jge/jl SIGNED. switch ja UNSIGNED.
 * add esp 8 / 4 / 8 / 8 / 8 / 8. OR imm 0x00800000 (not 0x80000000).
 */

extern unsigned char ENCOUTER_BATTLE_FLAG;     /* 0x1CFF6E2 BYTE load */
extern unsigned char RARE_ITEM_ABILITY_IN_IT; /* 0x1CFF6D8 BYTE, and al,1 */
extern unsigned char BACK_PREEMTIVE_INFO;      /* 0x1D28E08 BYTE store */
extern unsigned char BATTLE_SLOT_DATA[];      /* 0x1D27B10 */
extern unsigned char ATTACK_HIT_COUNT;         /* 0x1D280C0 address sentinel slot7 */
extern unsigned short word_1D280C8;            /* 0x1D280C8 status_2 slot7 exclusive */
extern unsigned int dword_1CFF188[];           /* 0x1CFF188 F_CHAR, +0x1D0 */

int __cdecl Battle_CheckPreemptiveImmunity(unsigned char p_flag_mask, int p_if_all_set);
unsigned char __cdecl Battle_GetRandomInt(void);
int __cdecl Battle_CheckAnyEnemyAlwaysBackAttack(void);
int __cdecl Battle_MapPreemptiveResultToType(int p_v5);
void __cdecl Battle_SetATBForPreemptiveGroup(int p_0_to_3);

int __cdecl Battle_InitPreemptiveBackAttackStatus(void)
{
    unsigned char enc;
    unsigned char type;
    unsigned char *slot;
    unsigned char *st2;
    unsigned int *fch;
    unsigned char *mi;
    unsigned char *dat;
    unsigned int status;
    int base;
    int score;
    unsigned char rare;
    unsigned char v5;

    enc = ENCOUTER_BATTLE_FLAG; /* A0 */

    if (enc & 0x80) { /* A8 80 ; JZ loc_48AFE0 */
        type = 0; /* 33 C0 */
    } else if (enc & 0x20) { /* loc_48AFE0 A8 20 */
        type = 1; /* B8 01 */
    } else if (enc & 0x40) { /* loc_48AFEE A8 40 */
        type = 2; /* B8 02 */
    } else {
        /* loc_48AFFC: enemy slots 3..6, eax = monster_info @ 0x1D27D80 */
        slot = BATTLE_SLOT_DATA + 0x270;
        for (;;) { /* loc_48B004 */
            if ((slot[0x80] & 1) == 0) { /* F6 80 80 00 00 00 01 ; JNZ loc_48B01A */
                mi = *(unsigned char **)slot;     /* 8B 08 */
                dat = *(unsigned char **)mi;      /* 8B 11 */
                if ((dat[0xFE] & 1) == 0) {       /* F6 82 FE 00 00 00 01 ; JZ loc_48B05C */
                    base = 0; /* 33 FF */
                    goto loc_48B02B;
                }
            }
            /* loc_48B01A */
            slot += 0xD0; /* 05 D0 00 00 00 */
            if ((int)slot >= (int)&ATTACK_HIT_COUNT) { /* 3D C0 80 D2 01 ; 7C DE jl */
                base = 0x14; /* BF 14 00 00 00 */
                break;
            }
        }

loc_48B02B:
        score = Battle_CheckPreemptiveImmunity(2u, -20); /* 6A EC ; 6A 02 ; add esp,8 */
        score += base; /* 03 F7 */
        score += (int)(Battle_GetRandomInt() & 0xFFu); /* 25 FF 00 00 00 */

        rare = (unsigned char)(RARE_ITEM_ABILITY_IN_IT & 1u); /* A0 ; 24 01 */
        if (rare != 0) /* 74 03 */
            score -= 0x14; /* 83 EE 14 */

        /* loc_48B053: 83 FE 14 ; 7D 08 jge SIGNED */
        if (score < 0x14)
            v5 = 0; /* 32 DB */
        else {
            /* 81 FE EC 00 00 00 ; 0F 9D C3 setnl bl ; 43 inc ebx */
            v5 = (unsigned char)((score >= 0xEC) ? 2 : 1);
        }

        /* loc_48B06A: 84 C0 ; rare still in AL */
        if (rare != 0 && v5 == 2)
            v5 = 1; /* B3 01 */

        if (Battle_CheckAnyEnemyAlwaysBackAttack() != 0 && v5 == 0)
            v5 = 1; /* 85 C0 ; 84 DB ; B3 01 */

        type = (unsigned char)Battle_MapPreemptiveResultToType((int)(signed char)v5);
        /* 0F BE C3 ; 50 ; add esp,4 ; pop edi/esi/ebx */
    }

    BACK_PREEMTIVE_INFO = type; /* loc_48B093 A2 ; BYTE */

    /* 25 FF 00 00 00 ; 48 ; 83 F8 03 ; 0F 87 ja UNSIGNED def_48B0A7
     * jpt_48B0A7: 48B0AE, 48B0C0, 48B100, 48B112 (type 1..4) */
    switch ((unsigned int)type) {
    case 1: /* loc_48B0AE */
        Battle_SetATBForPreemptiveGroup(1);
        Battle_SetATBForPreemptiveGroup(2); /* add esp,8 */
        break;

    case 2: /* loc_48B0C0 */
        Battle_SetATBForPreemptiveGroup(1);
        Battle_SetATBForPreemptiveGroup(2); /* add esp,8 */
        fch = dword_1CFF188; /* B9 88 F1 CF 01 */
        st2 = BATTLE_SLOT_DATA + 8; /* B8 18 7B D2 01 status_2 */
        do { /* loc_48B0DB */
            if ((st2[0x78] & 1) == 0) { /* F6 40 78 01 ; JNZ loc_48B0ED */
                status = *(unsigned int *)st2;
                status |= 0x00800000u; /* 81 CA 00 00 80 00 */
                *(unsigned int *)st2 = status; /* 89 10 */
                *fch = status; /* 89 11 */
            }
            /* loc_48B0ED */
            st2 += 0xD0; /* 05 D0 00 00 00 */
            fch = (unsigned int *)((unsigned char *)fch + 0x1D0); /* 81 C1 D0 01 00 00 */
        } while ((int)st2 < (int)(BATTLE_SLOT_DATA + 8 + 0x270)); /* 3D 88 7D D2 01 ; 7C DC */
        break;

    case 3: /* loc_48B100 */
        Battle_SetATBForPreemptiveGroup(0);
        Battle_SetATBForPreemptiveGroup(3); /* add esp,8 */
        break;

    case 4: /* loc_48B112 */
        Battle_SetATBForPreemptiveGroup(0);
        Battle_SetATBForPreemptiveGroup(3); /* add esp,8 */
        st2 = BATTLE_SLOT_DATA + 8 + 0x270; /* B8 88 7D D2 01 */
        do { /* loc_48B128 */
            if ((st2[0x78] & 1) == 0)
                *(unsigned int *)st2 |= 0x00800000u; /* 81 08 00 00 80 00 ; no F_CHAR */
            /* loc_48B134 */
            st2 += 0xD0;
        } while ((int)st2 < (int)&word_1D280C8); /* 3D C8 80 D2 01 ; 7C E8 */
        break;

    default: /* def_48B0A7 @ 0x48B140 type 0 */
        break;
    }

    /* EAX leftover: cases 1..4 = SetATB; default = (type & 0xFF) - 1 */
    return (int)type;
}
```
