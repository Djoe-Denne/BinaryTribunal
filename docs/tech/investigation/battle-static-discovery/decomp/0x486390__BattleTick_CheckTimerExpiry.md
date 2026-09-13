# BattleTick_CheckTimerExpiry @ 0x486390

- Instr (live): 24
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=96
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1203
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=107
- A==B: non
- Push IDB: oui
- SetType: char BattleTick_CheckTimerExpiry(void)
- Notes parent: BYTE result/end ; BYTE test `ENCOUTER_BATTLE_FLAG&4` (pas « bit 1 ») ; DWORD `SG_COUNTDOWN` ; WORD scene `0x13D` (66) ; BYTE `TARGET_SLOT_ID+2=1` ; relay `(0x70,0x80,0)` ; phase `0x0A` ; `RESULT=END_TYPE=3` ; `add esp,14h` unique ; succès EAX = `SetTargetableCallback`. C GLM cassé (0x70 omis). Pas de Hex-Rays.

## C réconcilié

```c
/* BattleTick_CheckTimerExpiry @ 0x486390
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 24 instr, size 0x5c. IDA type char().
 * add esp,14h once (12+4+4). No domain::.
 */

extern unsigned char  BATTLE_RESULT_CODE;   /* 0x1CFF6E7 BYTE A0/A2 */
extern unsigned short  ENCOUTER_BATTLE_FLAG; /* 0x1CFF6E2 WORD host; insn tests BYTE */
extern unsigned int    SG_COUNTDOWN;        /* 0x1CFE92C DWORD A1 */
extern unsigned short  COMBAT_SCENE_ID;    /* 0x1CFF6E0 WORD 66-prefix */
extern unsigned int    TARGET_SLOT_ID;     /* 0x1D28DFC DWORD; BYTE at +2 */
extern unsigned char  BATTLE_END_TYPE;     /* 0x1D28E01 BYTE A2 */

extern int __cdecl BattleEvent_ActivateTargetRelay(__int16 a1, unsigned __int8 a2, int a3); /* 0x47E3F0 */
extern int __cdecl BattleState_SetPhaseFlag(int phase); /* 0x47E080 */
extern int __cdecl BattleEvent_SetTargetableCallback(int callback); /* 0x47E200 */
extern int __cdecl Battle_EndSetTransitionTimer(void); /* 0x47DFC0 */

char BattleTick_CheckTimerExpiry(void)
{
    /* a0 e7 f6 cf 01 ; 84 c0 ; 75 52 */
    if (BATTLE_RESULT_CODE)
        return (char)BATTLE_RESULT_CODE;

    /* f6 05 e2 f6 cf 01 04 ; 74 49  -- BYTE test value 4, not bit 1 */
    if (((unsigned char)ENCOUTER_BATTLE_FLAG & 4) == 0)
        return (char)BATTLE_RESULT_CODE;

    /* a1 2c e9 cf 01 ; 85 c0 ; 75 40 */
    if (SG_COUNTDOWN)
        return (char)SG_COUNTDOWN;

    /* 66 81 3d e0 f6 cf 01 3d 01 ; 74 35 */
    if (COMBAT_SCENE_ID == 0x13D)
        return 0;

    /* 6a 00 ; 68 80 00 00 00 ; 6a 70 ; c6 05 fe 8d d2 01 01 */
    *((unsigned char *)&TARGET_SLOT_ID + 2) = 1;
    BattleEvent_ActivateTargetRelay(0x70, 0x80, 0); /* relay 112 */

    /* 6a 0a */
    BattleState_SetPhaseFlag(0x0A);

    /* b0 03 ; 68 c0 df 47 00 ; a2 result ; a2 end_type */
    BATTLE_RESULT_CODE = 3;
    BATTLE_END_TYPE = 3;

    /* e8 SetTargetableCallback ; 83 c4 14 */
    return (char)BattleEvent_SetTargetableCallback((int)Battle_EndSetTransitionTimer);
}
```
