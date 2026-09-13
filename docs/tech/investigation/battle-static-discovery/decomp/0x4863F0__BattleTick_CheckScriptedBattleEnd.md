# BattleTick_CheckScriptedBattleEnd @ 0x4863F0

- Instr (live): 21
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=39
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2537
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1870
- A==B: non
- Push IDB: oui
- SetType: char BattleTick_CheckScriptedBattleEnd(void)
- Notes parent: BYTE result (A0/C6) ; BYTE `ATTACKER_SLOT_ID_0+1==1` → ret leftover AL=result (pas `return 1`) ; BYTE pending A0 ; BYTE `TARGET_SLOT_ID+2=1` ; relay `(0x70,0x80,0)` ; phase `0x0A` ; `RESULT=1` `END_TYPE=3` via C6 imm (pas `mov al`) ; `add esp,14h` unique ; succès EAX = `SetTargetableCallback`. C GLM A cassé (ordre + `return 1`). Pas de Hex-Rays.

## C réconcilié

```c
/* BattleTick_CheckScriptedBattleEnd @ 0x4863F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 21 instr, size 0x53. IDA type char().
 * add esp,14h once (12+4+4). No domain::.
 */

extern unsigned char  BATTLE_RESULT_CODE;          /* 0x1CFF6E7 BYTE A0 / C6 */
extern unsigned int    ATTACKER_SLOT_ID_0;        /* 0x1D28DF8 DWORD; BYTE at +1 */
extern unsigned char  BATTLE_SCRIPTED_END_PENDING; /* 0x1D28E2D unsigned __int8 A0 */
extern unsigned int    TARGET_SLOT_ID;             /* 0x1D28DFC DWORD; BYTE at +2 */
extern unsigned char  BATTLE_END_TYPE;            /* 0x1D28E01 BYTE C6 */

extern int __cdecl BattleEvent_ActivateTargetRelay(__int16 a1, unsigned __int8 a2, int a3); /* 0x47E3F0 */
extern int __cdecl BattleState_SetPhaseFlag(int phase); /* 0x47E080 */
extern int __cdecl BattleEvent_SetTargetableCallback(int callback); /* 0x47E200 */
extern int __cdecl Battle_EndSetTransitionTimer(void); /* 0x47DFC0 */

char BattleTick_CheckScriptedBattleEnd(void)
{
    /* a0 e7 f6 cf 01 ; 84 c0 ; 75 49 */
    if (BATTLE_RESULT_CODE)
        return (char)BATTLE_RESULT_CODE;

    /* 80 3d f9 8d d2 01 01 ; 74 40  -- BYTE at ATTACKER_SLOT_ID_0+1; AL leftover = result */
    if (*((unsigned char *)&ATTACKER_SLOT_ID_0 + 1) == 1)
        return (char)BATTLE_RESULT_CODE;

    /* a0 2d 8e d2 01 ; 84 c0 ; 74 37 */
    if (BATTLE_SCRIPTED_END_PENDING == 0)
        return (char)BATTLE_SCRIPTED_END_PENDING;

    /* 6a 00 ; 68 80 00 00 00 ; 6a 70 ; c6 05 fe 8d d2 01 01 */
    *((unsigned char *)&TARGET_SLOT_ID + 2) = 1;
    BattleEvent_ActivateTargetRelay(0x70, 0x80, 0); /* relay 112 */

    /* 6a 0a */
    BattleState_SetPhaseFlag(0x0A);

    /* 68 c0 df 47 00 ; c6 result=1 ; c6 end=3  (immediates, not via AL) */
    BATTLE_RESULT_CODE = 1;
    BATTLE_END_TYPE = 3;

    /* e8 SetTargetableCallback ; 83 c4 14 */
    return (char)BattleEvent_SetTargetableCallback((int)Battle_EndSetTransitionTimer);
}
```
