# BattleTick_CheckAllEnemiesDead @ 0x486500

- Instr (live): 47
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=314
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1946
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=241
- A==B: non
- Push IDB: oui
- SetType: char BattleTick_CheckAllEnemiesDead(void)
- Notes parent: BYTE result A0/C6=4 ; BYTE latch `ATTACKER_SLOT_ID_0+1==1` leftover AL=result ; scan slots 3..6 stride `0xD0` `status_1` BYTE `&5` (Death|Petrify) **pas occupancy 1+2 / flag_data** ; borne `END` 0x1D28140 **jl signé** (pas ja/jg) ; living `ecx!=0xFF` leftover EAX=curseur ; `TARGET+2=1` ; relay `0x70` + phase `0x0A` `add esp,10h` ; XP 0 args ; flag BYTE `&2` → relay `0x6D`/`END=1` else `0x73`/`END=0` `add esp,0Ch` + `pop ecx` ; succès EAX=SetTargetableCallback. GLM A/B/C leftover living faux. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleTick_CheckAllEnemiesDead @ 0x486500
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 47 instr, size 0xb5. IDA type char().
 * add esp,10h (relay 12 + phase 4); add esp,0Ch per 2nd relay; pop ecx per callback.
 * No occupancy BYTE / flag_data; enemy slots 3..6 (groupes 1+2) via status_1.
 * No domain::.
 */

extern unsigned char  BATTLE_RESULT_CODE;   /* 0x1CFF6E7 BYTE A0 / C6 */
extern unsigned int    ATTACKER_SLOT_ID_0; /* 0x1D28DF8 DWORD; BYTE at +1 latch */
extern unsigned char   BATTLE_SLOT_DATA[];  /* 0x1D27B10 stride 0xD0; status_1 +0x80 */
extern unsigned char   END_MONSTER_DATA_IN_BATTLE; /* 0x1D28140 slot[7].status_1 */
extern unsigned int    TARGET_SLOT_ID;     /* 0x1D28DFC DWORD; BYTE at +2 */
extern unsigned short  ENCOUTER_BATTLE_FLAG; /* 0x1CFF6E2 WORD host; insn A0 BYTE */
extern unsigned char  BATTLE_END_TYPE;     /* 0x1D28E01 BYTE C6 */

extern int __cdecl BattleEvent_ActivateTargetRelay(__int16 a1, unsigned __int8 a2, int a3); /* 0x47E3F0 */
extern int __cdecl BattleState_SetPhaseFlag(int phase); /* 0x47E080 */
extern int __cdecl BattleEnd_DistributeXpAp(void); /* 0x494D40 ; 0 args */
extern int __cdecl BattleEvent_SetTargetableCallback(int callback); /* 0x47E200 */
extern int __cdecl Battle_EndSetTransitionTimer(void); /* 0x47DFC0 */

char BattleTick_CheckAllEnemiesDead(void)
{
    unsigned char *status1; /* eax cursor */
    int slot;               /* ecx, starts 3 */

    /* a0 e7 f6 cf 01 ; 84 c0 ; 0f 85 a7 00 00 00 */
    if (BATTLE_RESULT_CODE)
        return (char)BATTLE_RESULT_CODE;

    /* 80 3d f9 8d d2 01 01 ; 0f 84 9a 00 00 00 — AL leftover = result (0) */
    if (*((unsigned char *)&ATTACKER_SLOT_ID_0 + 1) == 1)
        return (char)BATTLE_RESULT_CODE;

    /* b9 03 00 00 00 ; b8 00 7e d2 01  — slot[3].status_1 = base+0x2F0 */
    slot = 3;
    status1 = BATTLE_SLOT_DATA + 3 * 0xD0 + 0x80;

    for (;;) {
        /* f6 00 05 ; 74 0f — BYTE Death|Petrify ; jz = neither set */
        if ((*status1 & 5) == 0) {
            /* loc_486538: 81 f9 ff 00 00 00 ; 75 74
             * leftover EAX = status_1 cursor, not 0 / not *status1 */
            if (slot != 0xFF)
                return (char)(int)status1;
            break;
        }
        /* 05 d0 00 00 00 ; 41 ; 3d 40 81 d2 01 ; 7c ee — jl SIGNED, not ja/jg */
        status1 += 0xD0;
        slot++;
        if ((int)status1 < (int)&END_MONSTER_DATA_IN_BATTLE)
            continue;
        break;
    }

    /* 6a 00 ; 68 80 00 00 00 ; 6a 70 ; c6 05 fe 8d d2 01 01 */
    *((unsigned char *)&TARGET_SLOT_ID + 2) = 1;
    BattleEvent_ActivateTargetRelay(0x70, 0x80, 0); /* relay 112 */

    /* 6a 0a ; e8 SetPhaseFlag ; 83 c4 10 */
    BattleState_SetPhaseFlag(0x0A);

    /* c6 05 e7 f6 cf 01 04 */
    BATTLE_RESULT_CODE = 4;
    BattleEnd_DistributeXpAp();

    /* a0 e2 f6 cf 01 ; 6a 00 ; a8 02 ; 68 80 00 00 00 ; 75 1d */
    if ((unsigned char)ENCOUTER_BATTLE_FLAG & 2) {
        /* loc_486598: 6a 6d ; add esp,0Ch ; c6 end=1 ; pop ecx */
        BattleEvent_ActivateTargetRelay(0x6D, 0x80, 0);
        BATTLE_END_TYPE = 1;
    } else {
        /* 6a 73 ; add esp,0Ch ; c6 end=0 ; pop ecx */
        BattleEvent_ActivateTargetRelay(0x73, 0x80, 0);
        BATTLE_END_TYPE = 0;
    }

    return (char)BattleEvent_SetTargetableCallback((int)Battle_EndSetTransitionTimer);
}
```
