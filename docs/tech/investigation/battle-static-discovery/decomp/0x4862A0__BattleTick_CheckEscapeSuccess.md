# BattleTick_CheckEscapeSuccess @ 0x4862A0

- Instr (live): 69
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1580
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1174
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1464
- A==B: non
- Push IDB: oui
- SetType: char BattleTick_CheckEscapeSuccess(void)
- Notes parent: GetRandomInt absent ; groupe 0 only 11 cells stride 0x18 / link 4 ; triple 0xFF/0xFF/WORD 3 **jz abort** (wiki idle inversé) ; `jl` signé pas ja/jg ; party 0..2 flag_data bit0 stride 0xD0 ; add esp 4/10h/4/24h ; BYTE result/escape/target+2/end_type ; leftover EAX. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleTick_CheckEscapeSuccess @ 0x4862A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 69 instr, size 0xec. IDA type char(). No args. GetRandomInt absent.
 * Two retn: party-fail at 0x486312; common epilogue loc_486389.
 * EAX leftover (no mov eax before retn): result-code / cell ptr / escape-state /
 * IsEligible / SetTargetableCallback.
 */

extern unsigned char  BATTLE_RESULT_CODE;              /* 0x1CFF6E7 BYTE a0/c6 */
extern unsigned char  BATTLE_ESCAPE_STATE;             /* 0x1D28DE8 BYTE a0 */
extern unsigned char  SG_BATTLE_MESSAGE_SPEED_SETTING; /* 0x1CFE739 BYTE 66 0f b6 */
extern unsigned char  TARGET_SLOT_ID[];                /* 0x1D28DFC DWORD agg; store BYTE +2 */
extern unsigned char  BATTLE_END_TYPE;                 /* 0x1D28E01 BYTE c6 */
extern unsigned char  stru_1D28864[];                  /* 0x1D28864 group-0 links, stride 4 */
extern unsigned char  RELATED_TO_AI_SECTION_TO_LOAD[]; /* 0x1D288EC cells, stride 0x18 */
extern unsigned char  word_1D289F4[];                  /* 0x1D289F4 exclusive end */
extern unsigned char  BATTLE_SLOT_DATA[];              /* 0x1D27B10; flag_data +0x7C */

extern unsigned int __cdecl BattleTarget_IsEligibleByStatus(int slot_index);
extern int __cdecl BattleEvent_ActivateTargetRelay(__int16 a1, unsigned __int8 a2, int a3);
extern int __cdecl BattleState_SetPhaseFlag(int phase);
extern char *__cdecl BattleText_GetMiscText(int p_text_index);
extern int __cdecl BattleEvent_DisplayMessageAndWait(int, __int16, char, unsigned __int8, char);
extern int BattleEnd_DistributeXpAp(void); /* IDA: FF8SceneOutBattleFlags() — 0 args */
extern int __cdecl BattleEvent_SetTargetableCallback(int);
extern int Battle_EndSetTransitionTimer(void); /* 0x47DFC0 */

char BattleTick_CheckEscapeSuccess(void)
{
    unsigned char *ecx; /* group-0 link BYTE*, stride 4 */
    unsigned char *eax; /* cell field @ 0x1D288EC, stride 0x18 */
    unsigned char *esi; /* flag_data BYTE*, stride 0xD0 */
    int edi;            /* party slot 0..2 */
    unsigned int wait;
    char *text;

    /* a0 e7 f6 cf 01 ; 84 c0 ; 0f 85 loc_486389 */
    if (BATTLE_RESULT_CODE != 0)
        return (char)BATTLE_RESULT_CODE;

    /* Gate 2: GROUP 0 only, 11 cells. Occupancy 1+2 not scanned.
     * 38 11 / 38 50 fd / 66 83 38 03 / 0f 84 loc_486389
     * add eax,18h ; add ecx,4 ; cmp eax, word_1D289F4 ; 7c jl SIGNED */
    ecx = stru_1D28864;
    eax = RELATED_TO_AI_SECTION_TO_LOAD;
    do {
        if (*ecx == 0xFF && eax[-3] == 0xFF
            && *(unsigned short *)eax == 3)
            return (char)BATTLE_RESULT_CODE; /* still 0; ASM EAX = cell ptr */
        eax += 0x18;
        ecx += 4;
    } while ((int)eax < (int)(unsigned char *)word_1D289F4);

    /* a0 e8 8d d2 01 ; 3c 01 ; 0f 85 loc_486389 */
    if (BATTLE_ESCAPE_STATE != 1)
        return (char)BATTLE_ESCAPE_STATE;

    /* Party 0..2: esi = flag_data 0x1D27B8C ; test BYTE [esi],1 ; esi+=0xD0
     * end flag_data+0x270 @ 0x1D27DFC ; jl signed. Present = bit0, not occ. 1+2. */
    edi = 0;
    esi = BATTLE_SLOT_DATA + 0x7C;
    do {
        if (*esi & 1) {
            /* push edi ; call ; add esp,4 ; test eax,eax ; jnz loc_486313 */
            if (BattleTarget_IsEligibleByStatus(edi) != 0)
                goto loc_486313;
        }
        esi += 0xD0;
        edi++;
    } while ((int)esi < (int)(BATTLE_SLOT_DATA + 0x7C + 0x270));
    /* pop edi ; pop esi ; retn — EAX leftover IsEligible (0) or AL=1 if none present */
    return 0;

loc_486313:
    /* c6 05 fe 8d d2 01 01  BEFORE first relay call */
    TARGET_SLOT_ID[2] = 1;
    BattleEvent_ActivateTargetRelay(0x70, 0x80, 0); /* push 0, 80h, 70h */
    BattleState_SetPhaseFlag(0x0A);
    /* 66 0f b6 05 … movzx ax, speed BYTE ; add esp,10h (relay 12 + phase 4)
     * lea ecx, [eax*8+8] */
    wait = 8u * (unsigned int)SG_BATTLE_MESSAGE_SPEED_SETTING + 8u;
    /* 5 pushes then add esp,4 cleans index=1 only ; EAX = text */
    text = BattleText_GetMiscText(1);
    BattleEvent_DisplayMessageAndWait((int)text, (__int16)wait, 3, 0x80, 0x56);
    BattleEvent_ActivateTargetRelay(0x74, 0x80, 0); /* push 0, 80h, 74h */
    /* c6 05 e7 f6 cf 01 02 */
    BATTLE_RESULT_CODE = 2;
    BattleEnd_DistributeXpAp(); /* 0 args */
    /* push 0x47DFC0 ; c6 05 01 8e d2 01 02 ; call SetTargetableCallback ; add esp,24h */
    BATTLE_END_TYPE = 2;
    return (char)BattleEvent_SetTargetableCallback((int)Battle_EndSetTransitionTimer);
}
```
