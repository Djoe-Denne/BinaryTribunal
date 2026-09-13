# BattleTarget_SelectByStatusOrStat @ 0x486E70

- Instr (live): 393
- Palier: low (budget) / GLM: high + max_tokens=65536 (consigne >=200)
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=10764
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=10678
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=12231
- A==B: non
- Push IDB: oui
- SetType: __int16 __cdecl BattleTarget_SelectByStatusOrStat(int p_unknown_bool, int p_target, int p_comparator, int p_status)
- Notes parent: jpt_486E93 + byte_487364 live (0 / 1-9+16-42+46-47 / 200-201 / 203-204 / 205-220 / 221-236 ; ja unsigned vs 0xEC) ; case 0 fallthrough Death ; stride 0xD0 ; occupancy 1+2 absente ; GetRandomInt AL ; WORD elem jnb/jbe ; BYTE stats jge/jle ; cmp 3 invert ; p1=0 random (peut boucler) / !=0 OR|0x8000.

## C réconcilié

```c
/* BattleTarget_SelectByStatusOrStat @ 0x486E70
 * Ground truth = live ASM (asm_clean.asm) + jpt_dump.txt, not Hex-Rays.
 * 393 instr, size 0x4D5. cdecl. AX = WORD target mask.
 * Opcode 0x26: p_unknown_bool 0=random-one / !=0 all-bits|0x8000;
 * p_target 200 party / 201 enemy / else com_file_id;
 * p_comparator 3 inverts IS_MALE; p_status per jpt_486E93.
 * No occupancy BYTE (1+2). Slot stride 0xD0. GetRandomInt AL only.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* @ 0x1D27B10, stride 0xD0, 7 slots walked */
extern unsigned char IS_MALE[7];        /* @ 0x1D2A214 candidate flags, BYTE */
extern int dword_1D2A20C;                /* range start (SetStatusStatSlotRange) */
extern int dword_1D2A210;                /* range end exclusive */

extern void EnemyAI_SetStatusStatSlotRange(int p_target); /* add esp=4; 200→[0,3) 201→[3,7) else [0,7) */
extern void EnemyAI_InvertStatusMatchFlags(void);
extern void EnemyAI_ClearDeadOrInactiveCandidates(void);
extern void EnemyAI_ClearInactiveDeathCandidates(void);
extern unsigned char Battle_GetRandomInt(void); /* AL only; sites and eax,0FFh */

#define SLOT_U8(s, o)  (*(unsigned char  *)&BATTLE_SLOT_DATA[(s) * 0xD0 + (o)])
#define SLOT_U16(s, o) (*(unsigned short *)&BATTLE_SLOT_DATA[(s) * 0xD0 + (o)])
#define SLOT_U32(s, o) (*(unsigned int   *)&BATTLE_SLOT_DATA[(s) * 0xD0 + (o)])

#define OFF_STATUS2     0x08
#define OFF_CURRENT_HP  0x18
#define OFF_ELEM_DEF    0x44
#define OFF_FLAG_DATA   0x7C
#define OFF_STATUS1     0x80
#define OFF_COM_FILE_ID 0xBB
#define OFF_STR         0xBD

__int16 __cdecl BattleTarget_SelectByStatusOrStat(int p_unknown_bool, int p_target, int p_comparator, int p_status)
{
    int death_status = 0; /* [esp+10h]; ebx stays 0 */
    int i;
    int best;
    unsigned short best_w;
    int off;

    /* cmp esi,0ECh; ja def_486E93 UNSIGNED. Index byte_487364[esi]; jmp jpt_486E93[eax*4].
     * Live cases only: 0 / 1-9,16-42,46,47 / 200,201 / 203,204 / 205-220 / 221-236.
     * 10-15,43-45,48-199,202 and >236: default (no fill). */
    switch (p_status) {

    case 0: /* loc_486EEE: death_status=1, FALL THROUGH with esi=0 → status_1 bit0 Death */
        death_status = 1;
        /* fall through */

    case 1: case 2: case 3: case 4: case 5: case 6: case 7: case 8: case 9:
    case 16: case 17: case 18: case 19: case 20: case 21: case 22: case 23:
    case 24: case 25: case 26: case 27: case 28: case 29: case 30: case 31:
    case 32: case 33: case 34: case 35: case 36: case 37: case 38: case 39:
    case 40: case 41: case 42: case 46: case 47: /* loc_486EF6 */
        for (i = 0; i < 7; i++) { /* jl vs word_1D280C8 = status_2 + 7*0xD0 */
            if (p_status < 16) /* jge signed: [status_2+0x78] = status_1 WORD */
                IS_MALE[i] = (unsigned char)((SLOT_U16(i, OFF_STATUS1) >> p_status) & 1);
            else
                IS_MALE[i] = (unsigned char)((SLOT_U32(i, OFF_STATUS2) >> (p_status - 16)) & 1);
        }
        break;

    case 200: case 201: /* loc_486E9A: flag_data bit8 (test dh,1 on DWORD load) */
        for (i = 0; i < 7; i++) /* jl vs BATTLE_SLOT7_FLAG_DATA */
            IS_MALE[i] = (unsigned char)((SLOT_U16(i, OFF_FLAG_DATA) & 0x100) != 0);
        if (p_status == 200) { /* 0xC8: invert → female; 201 keeps male */
            for (i = 0; i < 7; i++)
                IS_MALE[i] = (unsigned char)((~IS_MALE[i]) & 1);
        }
        break;

    case 203: case 204: /* loc_487127: current_hp DWORD signed min/max */
        EnemyAI_SetStatusStatSlotRange(p_target);
        if (p_status == 203) { /* 0xCB MAX; ebp/esi init 0 */
            best = 0;
            for (i = dword_1D2A20C; i < dword_1D2A210; i++) {
                int hp;
                if (SLOT_U16(i, OFF_STATUS1) & 1) /* [current_hp+0x68] = status_1 Death */
                    continue;
                hp = (int)SLOT_U32(i, OFF_CURRENT_HP);
                if (best < hp) /* cmp esi,ecx; jge skip */
                    best = hp;
            }
        } else { /* 204 MIN; also skip hp==0 (cmp ecx,ebx jz) */
            best = 0x7FFFFFFF;
            for (i = dword_1D2A20C; i < dword_1D2A210; i++) {
                int hp;
                if (SLOT_U16(i, OFF_STATUS1) & 1)
                    continue;
                hp = (int)SLOT_U32(i, OFF_CURRENT_HP);
                if (best > hp && hp != 0) /* jle skip; jz hp==0 */
                    best = hp;
            }
        }
        for (i = 0; i < 7; i++) /* match ALL 7; sentinel dword_1D280D8 */
            IS_MALE[i] = (unsigned char)((int)SLOT_U32(i, OFF_CURRENT_HP) == best);
        break;

    case 205: case 206: case 207: case 208: case 209: case 210:
    case 211: case 212: case 213: case 214: case 215: case 216:
    case 217: case 218: case 219: case 220: /* loc_486F4D: BYTE stats from str */
        EnemyAI_SetStatusStatSlotRange(p_target);
        if (p_status < 213) { /* 0xD5 signed jge: MAX; esi -= 205 */
            best = 0;
            off = p_status - 205;
        } else { /* MIN; esi -= 213; ebp = 0xFF */
            best = 0xFF;
            off = p_status - 213;
        }
        for (i = dword_1D2A20C; i < dword_1D2A210; i++) {
            int v;
            if (SLOT_U16(i, OFF_STATUS1) & 1) /* [str+off + (-61-off)] = status_1 */
                continue;
            v = SLOT_U8(i, OFF_STR + off); /* xor eax,eax; mov al,[edx] */
            if (p_status < 213) {
                if (best < v) /* signed jge skip */
                    best = v;
            } else {
                if (best > v) /* signed jle skip */
                    best = v;
            }
        }
        for (i = 0; i < 7; i++)
            IS_MALE[i] = (unsigned char)(SLOT_U8(i, OFF_STR + off) == best);
        break;

    case 221: case 222: case 223: case 224: case 225: case 226:
    case 227: case 228: case 229: case 230: case 231: case 232:
    case 233: case 234: case 235: case 236: /* loc_48702D: elem_def WORD */
        EnemyAI_SetStatusStatSlotRange(p_target);
        if (p_status < 229) { /* 0xE5 signed jge: MAX; ebp = esi-0xDD */
            best_w = 0;
            off = p_status - 221;
        } else { /* MIN; edi = 0xFFFF; ebp = esi-0xE5 */
            best_w = 0xFFFF;
            off = p_status - 229;
        }
        for (i = dword_1D2A20C; i < dword_1D2A210; i++) {
            unsigned short v;
            if (SLOT_U16(i, OFF_STATUS1) & 1)
                continue;
            v = SLOT_U16(i, OFF_ELEM_DEF + off * 2);
            if (p_status < 229) {
                if (best_w < v) /* cmp di,ax; jnb skip — UNSIGNED */
                    best_w = v;
            } else {
                if (best_w > v) /* jbe skip — UNSIGNED */
                    best_w = v;
            }
        }
        for (i = 0; i < 7; i++) /* cmp di,[ecx] WORD */
            IS_MALE[i] = (unsigned char)(SLOT_U16(i, OFF_ELEM_DEF + off * 2) == best_w);
        break;

    default: /* def_486E93: 10-15,43-45,48-199,202, >236 — no candidate fill */
        break;
    }

    /* def_486E93 shared tail */
    if (p_comparator == 3)
        EnemyAI_InvertStatusMatchFlags();
    if (death_status == 0)
        EnemyAI_ClearDeadOrInactiveCandidates();
    else
        EnemyAI_ClearInactiveDeathCandidates();

    if (p_unknown_bool != 0) { /* loc_4872AE: OR bits, esi starts 0x8000 */
        unsigned int mask = 0x8000;
        if (p_target == 200) { /* sub 0xC8 jz: party 0..2 */
            for (i = 0; i < 3; i++)
                if (IS_MALE[i])
                    mask |= 1u << i;
        } else if (p_target == 201) { /* dec jz: enemy 3..6 */
            for (i = 3; i < 7; i++)
                if (IS_MALE[i])
                    mask |= 1u << i;
        } else { /* com_file_id BYTE vs p_target, then IS_MALE */
            for (i = 0; i < 7; i++)
                if ((int)SLOT_U8(i, OFF_COM_FILE_ID) == p_target && IS_MALE[i])
                    mask |= 1u << i;
        }
        return (__int16)mask; /* mov ax, si */
    }

    /* p_unknown_bool == 0: random one; loops may never exit */
    if (p_target == 200) { /* loc_487285: cdq/idiv 3 */
        int slot;
        do {
            slot = (Battle_GetRandomInt() & 0xFF) % 3;
        } while (IS_MALE[slot] == 0);
        return (__int16)(1 << slot);
    }
    if (p_target == 201) { /* loc_487252: MSVC signed %4 then +3, slots 3-6 */
        int slot;
        do {
            slot = (Battle_GetRandomInt() & 0xFF) % 4;
        } while (IS_MALE[3 + slot] == 0); /* (IS_MALE+3)[ecx] then ecx+=3 */
        return (__int16)(1 << (3 + slot));
    }
    /* loc_487214: cdq/idiv 7; IS_MALE then com_file_id == p_target */
    for (;;) {
        int slot = (Battle_GetRandomInt() & 0xFF) % 7;
        if (IS_MALE[slot] != 0 && (int)SLOT_U8(slot, OFF_COM_FILE_ID) == p_target)
            return (__int16)(1 << slot);
    }
}
```
