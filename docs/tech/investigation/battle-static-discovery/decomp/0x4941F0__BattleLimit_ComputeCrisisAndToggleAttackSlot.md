# BattleLimit_ComputeCrisisAndToggleAttackSlot @ 0x4941F0

- Instr (live): 118
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1905
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3089
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2302
- A==B: non
- Push IDB: oui
- SetType: char __cdecl(int p_slot_id)
- Notes parent: stride slot 0xD0 / F_CHAR 0x1D0 = ASM. Occupancy 1+2 absente (flag_data bit0 + WORD +0x1B2 bit0, slots 0-2). GetRandomInt AL then AND 0xFF +160. dword_1CFF838 skip keep AL. BATTLE_SEAL 0x20 et status 0x200 → crisis 0. K_CHARACTER[id*0x24+2]. K_MISC +0x10/+0x18. HP movsx F_CHAR pas slot DWORD. 66 seulement word_1CFF1B2. jge/jle/jl SIGNED. Overlay 0x04, ret AL=cmd. Pas de setcc/ja/jg. Pas de struct packée. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleLimit_ComputeCrisisAndToggleAttackSlot @ 0x4941F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 118 instr, size 0x16A, end 0x49435A. IDA type char __cdecl(int).
 * No domain::. Slot stride 0xD0. F_CHAR stride 0x1D0. Occupancy 1+2 unused.
 * GetRandomInt AL only then AND 0xFF. WORD 66: +0x1B2 only. No setcc. No ja/jg.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 stride 0xD0 */
extern unsigned char F_CHAR_DATA[];      /* 0x1CFF000 stride 0x1D0 (not IDA uint8[8]) */
extern unsigned char K_CHARACTER[];      /* 0x1CF75EC stride 0x24 */
extern unsigned char K_MISC[];           /* 0x1CF8B14 size 0x3C */
extern unsigned char BATTLE_SEAL;       /* 0x1CFF6E8 BYTE test 20h */
extern unsigned int dword_1CFF838;      /* 0x1CFF838 DWORD */

extern unsigned char __cdecl Battle_GetRandomInt(void); /* AL only, no add esp */

#define OFF_FLAGDATA  0x7C
#define OFF_COMFILE    0xBB
#define OFF_CRISIS     0xCA
#define OFF_CMD        0x21
#define OFF_CURHP      0x172
#define OFF_MAXHP      0x174
#define OFF_ST2        0x188
#define OFF_ST1W       0x1B2
#define OFF_KCHAR_MULT 2
#define OFF_KMISC_DTH  0x10
#define OFF_KMISC_SLP  0x18

#define BS8(slot, off)  (*(unsigned char  *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))
#define FC8(slot, off)  (*(unsigned char  *)(F_CHAR_DATA + (unsigned int)(slot) * 0x1D0u + (off)))
#define FC16(slot, off) (*(short          *)(F_CHAR_DATA + (unsigned int)(slot) * 0x1D0u + (off)))
#define FC16U(slot, off) (*(unsigned short *)(F_CHAR_DATA + (unsigned int)(slot) * 0x1D0u + (off)))
#define FC32(slot, off) (*(unsigned int   *)(F_CHAR_DATA + (unsigned int)(slot) * 0x1D0u + (off)))

char __cdecl BattleLimit_ComputeCrisisAndToggleAttackSlot(int p_slot_id)
{
    unsigned char crisis;
    unsigned char cmd;
    unsigned char com_id;
    unsigned int mult;
    unsigned int status_word;
    unsigned int status_dword;
    int status_sum;
    int dead;
    int i;
    unsigned int bit;
    int rng;
    int hp_term;
    int max_hp;
    int v;

    /* lea/shl: slot*13*16 = 0xD0 into overwritten arg; slot*29*16 = 0x1D0 into ESI */
    com_id = BS8(p_slot_id, OFF_COMFILE);
    /* lea eax,[eax+eax*8]; mov bl, crisisLevelHPMultiplier[eax*4] @ 0x1CF75EE */
    mult = K_CHARACTER[(unsigned int)com_id * 0x24u + OFF_KCHAR_MULT];

    /* loc_494332 skip: EAX leftover is the DWORD; AL stored as crisis. Not forced 0. */
    if (dword_1CFF838 != 0) {
        crisis = (unsigned char)dword_1CFF838;
        goto loc_494332;
    }
    if ((BATTLE_SEAL & 0x20) != 0) {
        crisis = 0;
        goto loc_494332;
    }
    /* test ah,2 on dword_1CFF188[esi] */
    if ((FC32(p_slot_id, OFF_ST2) & 0x200u) != 0) {
        crisis = 0;
        goto loc_494332;
    }

    /* xor ecx,ecx ; 66 mov cx, word_1CFF1B2[esi] */
    status_word = FC16U(p_slot_id, OFF_ST1W);
    status_sum = 0;
    for (i = 0, bit = 1; i < 8; i++, bit <<= 1) { /* cmp eax,8 ; jl SIGNED */
        if ((status_word & bit) != 0)
            status_sum += K_MISC[OFF_KMISC_DTH + i];
    }

    status_dword = FC32(p_slot_id, OFF_ST2);
    for (i = 0, bit = 1; i < 24; i++, bit <<= 1) { /* cmp eax,18h ; jl SIGNED */
        if ((status_dword & bit) != 0)
            status_sum += K_MISC[OFF_KMISC_SLP + i];
    }

    /* Pointer walk from flag_data / word_1CFF1B2, not occupancy +1/+2, not ESI. */
    dead = 0;
    for (i = 0; i < 3; i++) { /* cmp eax, flag_data+270h ; jl SIGNED */
        if ((BS8(i, OFF_FLAGDATA) & 1) != 0 && (FC8(i, OFF_ST1W) & 1) != 0)
            dead++;
    }

    rng = (int)Battle_GetRandomInt() & 0xFF; /* mov cl,al then and ecx,0FFh */

    hp_term = (int)FC16(p_slot_id, OFF_CURHP); /* movsx QUISTIS_CURRENT_HP */
    hp_term *= (int)mult;                      /* imul eax, ebx (mult still in EBX) */
    max_hp = (int)FC16(p_slot_id, OFF_MAXHP);  /* movsx word_1CFF174 */
    hp_term = hp_term * 10 / max_hp;           /* lea*5; shl 1; cdq; idiv ebx */

    rng += 0xA0; /* +160 */

    /* lea edx,[edi+edi*4+28h] = 5*dead+40; lea ecx,[ebp+edx*4] = sum+20*dead+160; *10 */
    v = (status_sum + 160 + 20 * dead) * 10;
    v = (v - hp_term) / rng; /* cdq; idiv ecx */
    v -= 4;

    if (v < 1) { /* cmp eax,1 ; jge SIGNED loc_494324 */
        crisis = 0;
    } else if (v > 4) { /* cmp eax,4 ; jle SIGNED loc_49432E */
        crisis = 4;
    } else {
        crisis = (unsigned char)v;
    }

loc_494332:
    BS8(p_slot_id, OFF_CRISIS) = crisis;
    cmd = FC8(p_slot_id, OFF_CMD); /* F_CHAR_COMMAND_DATA, flags still from crisis */
    if (crisis != 0) {
        cmd |= 4;
        FC8(p_slot_id, OFF_CMD) = cmd;
        return (char)cmd;
    }
    cmd &= 0xFBu;
    FC8(p_slot_id, OFF_CMD) = cmd;
    return (char)cmd;
}
```
