# BS_CameraRelated_battle_reset @ 0x500870

- Instr (live): 32
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=19
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BS_CameraRelated_battle_reset(void)
- Notes parent: 13 calls 0-arg, pas d'add esp. A3/89 DWORD list heads + flags + g_GfSequenceContextCandidateA. BYTE 88: 1D96A90/A88/EB8=0. A2 BYTE 1D98424 = 4-SG_CAMERA_MOVEMENT_SETTING. xor eax,eax => 0. Occupancy/GetRandomInt/0xD0/0x1D0 absents.

## C réconcilié

```c
/* BS_CameraRelated_battle_reset @ 0x500870
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 32 instr, size 0x8E, end 0x5008FE. IDA type int().
 * Slot 0xD0 / F_CHAR 0x1D0 / occupancy / GetRandomInt: unused.
 * ja/jg/setcc/jpt: none. add esp: none (13 zero-arg calls).
 * DWORD 89/A3: flags, list heads, g_GfSequenceContextCandidateA.
 * BYTE 88: byte_1D96A90 / byte_1D96A88 / byte_1D96EB8 = 0.
 * BYTE A2: *(unsigned char *)&dword_1D98424 = 4 - SG_CAMERA_MOVEMENT_SETTING.
 * Return: xor eax,eax => 0. No Hex-Rays. No domain::.
 */

extern int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C */
extern int *list_head;                             /* 0x1D96AA4 */
extern int *battle_tasks_init_dword_1D96A94;      /* 0x1D96A94 */
extern int *battle_tasks_init_dword_1D96A8C;      /* 0x1D96A8C */
extern int *battle_tasks_init_dword_1D96AA0;      /* 0x1D96AA0 */
extern int *battle_tasks_init_dword_1D96AA8;      /* 0x1D96AA8 */
extern int *g_GfSequenceContextCandidateA;         /* 0x1D96AAC */
extern unsigned char SG_CAMERA_MOVEMENT_SETTING;  /* 0x1CFE73E size 1 */
extern unsigned char byte_1D96A90;
extern unsigned char byte_1D96A88;
extern unsigned char byte_1D96EB8;
extern int dword_1D98424; /* named dword, store is BYTE (A2) */

extern int GetSingleton_set_current_shade_color(void);
extern int InitCameraStruct(void);
extern int BattlePresentation_InitBuffersAndProjection(void);
extern unsigned char *BS_SetLocation1(void);
extern int cardgame_sub_506FD0(void);
extern int BS_BattleStageIDFixing(void);
extern int BS_reset_sfx_variables(void);
extern char BS_SetAKAOHeader(void);
extern void *__cdecl BattleTaskQueue_Init(void);
extern void *au_re_BS_Memset(void);
extern void *BS_memsetVars1(void);
extern int *BS_memsetVars2(void);
extern void *BS_memsetVars3(void);

int __cdecl BS_CameraRelated_battle_reset(void)
{
    /* ebx = 0 scratch (push/pop ebx) */
    battle_to_update_flags_dword_1D96A9C = 0;

    GetSingleton_set_current_shade_color();
    InitCameraStruct();
    BattlePresentation_InitBuffersAndProjection();
    BS_SetLocation1();
    cardgame_sub_506FD0();
    BS_BattleStageIDFixing();
    BS_reset_sfx_variables();
    BS_SetAKAOHeader();

    list_head = (int *)BattleTaskQueue_Init();
    battle_tasks_init_dword_1D96A94 = (int *)au_re_BS_Memset();
    battle_tasks_init_dword_1D96A8C = (int *)BS_memsetVars1();
    battle_tasks_init_dword_1D96AA0 = BS_memsetVars2();
    /* call memsetVars3; mov cl, SG_CAMERA_MOVEMENT_SETTING; mov [1D96AA8], eax */
    battle_tasks_init_dword_1D96AA8 = (int *)BS_memsetVars3();

    g_GfSequenceContextCandidateA = 0;
    byte_1D96A90 = 0;
    byte_1D96A88 = 0;
    byte_1D96EB8 = 0;
    *(unsigned char *)&dword_1D98424 =
        (unsigned char)(4 - SG_CAMERA_MOVEMENT_SETTING);

    return 0;
}
```
