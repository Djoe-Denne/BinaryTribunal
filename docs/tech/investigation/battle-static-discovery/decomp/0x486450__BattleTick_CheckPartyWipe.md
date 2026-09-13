# BattleTick_CheckPartyWipe @ 0x486450

- Instr (live): 50
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1291
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1701
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1842
- A==B: non
- Push IDB: oui
- SetType: char __cdecl BattleTick_CheckPartyWipe()
- Notes parent: party 0..2 stride 0xD0 cursor status_1 0x1D27B90 borne 0x1D27E00 jl signed ; occupancy = flag_data+0x7C BYTE bit0 (pas groupes 1+2) ; status_1 BYTE mask 5 Death|Petrify ; BYTE ATTACKER+1==1 abort ; cmp ecx,0xFF ; Phoenix 0 args ; TARGET+2=1 ; relay 0x70 ; phase 10 ; GetMiscText(0) add esp 4 ; wait 8*(speed+1) movzx ax ; RESULT BYTE=1 END=3 avant callback ; add esp 10h/4/18h ; leftover EAX.

## C réconcilié

```c
/* BattleTick_CheckPartyWipe @ 0x486450
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 50 instr, size 0xb0. IDA type char(). No args. Saved EBX only.
 * Unique retn loc_4864FE leftover EAX (no mov eax before retn).
 */

extern unsigned char  BATTLE_RESULT_CODE;               /* 0x1CFF6E7 BYTE a0 / 88 1d */
extern unsigned char  ATTACKER_SLOT_ID_0[];             /* 0x1D28DF8 DWORD host; BYTE +1 @ 0x1D28DF9 a0 */
extern unsigned char  TARGET_SLOT_ID[];               /* 0x1D28DFC DWORD; BYTE +2 @ 0x1D28DFE 88 1d */
extern unsigned char  BATTLE_END_TYPE;                 /* 0x1D28E01 BYTE c6 */
extern unsigned char  SG_BATTLE_MESSAGE_SPEED_SETTING;  /* 0x1CFE739 BYTE 66 0f b6 ax */
extern unsigned char  BATTLE_SLOT_DATA[];               /* 0x1D27B10 stride 0xD0; status_1 +0x80 */

extern int __cdecl Battle_PhoenixAutoReviveCheck(void); /* 0 args, no add esp */
extern int __cdecl BattleEvent_ActivateTargetRelay(__int16 a1, unsigned __int8 a2, int a3);
extern int __cdecl BattleState_SetPhaseFlag(int phase);
extern char *__cdecl BattleText_GetMiscText(int p_text_index);
extern int __cdecl BattleEvent_DisplayMessageAndWait(int, __int16, char, unsigned __int8, char);
extern int __cdecl BattleEvent_SetTargetableCallback(int);
extern int Battle_EndSetTransitionTimer(void); /* 0x47DFC0 */

char BattleTick_CheckPartyWipe(void)
{
    unsigned char *eax; /* cursor = slot+0x80 status_1 */
    int ecx;            /* slot index 0..2 */
    unsigned int wait;
    char *text;

    /* a0 e7 f6 cf 01 ; 84 c0 ; 0f 85 loc_4864FE */
    if (BATTLE_RESULT_CODE != 0)
        return (char)BATTLE_RESULT_CODE;

    /* a0 f9 8d d2 01 ; b3 01 ; 3a c3 ; 0f 84 loc_4864FE
     * BYTE ATTACKER_SLOT_ID_0+1 == 1 aborts. Not occupancy 1+2. */
    if (ATTACKER_SLOT_ID_0[1] == 1)
        return 1;

    /* xor ecx,ecx ; b8 90 7b d2 01  status_1 @ 0x1D27B90 */
    ecx = 0;
    eax = BATTLE_SLOT_DATA + 0x80;

loc_486474:
    /* 84 58 fc  test BYTE [eax-4], bl=1  — flag_data +0x7C bit0 occupancy.
     * Occupancy groups 1+2 (exec queue) are NOT scanned. */
    if ((eax[-4] & 1) != 0) {
        /* f6 00 05  test BYTE [eax], 5  Death|Petrify. Host status_1 is WORD. */
        if ((eax[0] & 5) == 0)
            goto loc_48648D;
    }
    /* 05 d0 00 00 00 ; 41 ; 3d 00 7e d2 01 ; 7c e9 jl SIGNED (not ja/jg) */
    eax += 0xD0;
    ecx++;
    if ((int)eax < (int)(BATTLE_SLOT_DATA + 0x80 + 0x270))
        goto loc_486474;
    /* eb 08 */
    goto loc_486495;

loc_48648D:
    /* 81 f9 ff 00 00 00 ; 75 loc_4864FE — ecx starts 0 so living always aborts */
    if (ecx != 0xFF)
        return (char)(int)eax;

loc_486495:
    /* e8 Phoenix ; 85 c0 ; 75 loc_4864FE */
    if (Battle_PhoenixAutoReviveCheck() != 0)
        return 1;

    /* 50 (eax==0) ; 68 80 ; 6a 70 ; 88 1d fe 8d d2 01  BYTE +2 = bl=1 BEFORE call */
    TARGET_SLOT_ID[2] = 1;
    BattleEvent_ActivateTargetRelay(0x70, 0x80, 0);
    BattleState_SetPhaseFlag(0x0A);
    /* 66 0f b6 05 … movzx ax, speed ; add esp,10h (relay 12 + phase 4)
     * 8d 0c c5 08 00 00 00  lea ecx, [eax*8+8] — uses full EAX after movzx ax */
    wait = 8u * (unsigned int)SG_BATTLE_MESSAGE_SPEED_SETTING + 8u;
    /* 6a 56 ; 68 80 ; 6a 03 ; 51 ; 6a 00 ; call GetMiscText ; add esp,4 */
    text = BattleText_GetMiscText(0);
    BattleEvent_DisplayMessageAndWait((int)text, (__int16)wait, 3, 0x80, 0x56);
    /* 68 47DFC0 ; 88 1d result bl=1 ; c6 05 end_type 03 ; call ; add esp,18h */
    BATTLE_RESULT_CODE = 1;
    BATTLE_END_TYPE = 3;
    return (char)BattleEvent_SetTargetableCallback((int)Battle_EndSetTransitionTimer);
}
```
