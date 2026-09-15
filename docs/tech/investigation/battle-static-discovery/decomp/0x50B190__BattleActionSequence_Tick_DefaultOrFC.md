# BattleActionSequence_Tick_DefaultOrFC @ 0x50B190

- Instr (live): 76
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=118
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=66
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=159
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_DefaultOrFC(int)
- Notes parent: ja unsigned phase>4, jpt 5 cases 0..4 @ 0x50B284. Case0 fallthrough case1 (double +1 same tick). jl SIGNED FILE_RESULT. ja UNSIGNED byte_1D96A90. WORD 66 SharedB+6 et CameraID=FFFF. AND AL,0EFh (pas bits 8..31). Case4 return 2, phase non incremente. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. SetupContext 0 arg stack. Callback push offset byte_1D99A78. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_Tick_DefaultOrFC @ 0x50B190
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_50B1A8, not Hex-Rays.
 * 76 instr, size 0xF3, end 0x50B283. cdecl, 1 arg. Saved ESI+EDI. retn C3.
 * BYTE [node+0Dh] phase, DWORD [node+10h] task. cmp eax,4 / ja UNSIGNED.
 * jpt_50B1A8 @ 0x50B284: 50B1AF,50B1C2,50B1E9,50B205,50B253 (cases 0..4).
 * Case0 fallthrough into case1. Case1 fallthrough into def_50B1A8 (xor eax,eax).
 * jl 7C SIGNED FILE_RESULT. ja 77 UNSIGNED byte_1D96A90. WORD 66 SharedB+6 / CameraID.
 * AND AL,0EFh (24 EF) low byte only. OR ECX,10h full DWORD. Case4 B8 02 return 2.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No setcc. No domain::.
 */

int __cdecl BattleActor_FindFlag2_Match(int, unsigned short); /* 0x508580; add esp,8 */
int __cdecl BattleGF_LoadCallbackByMagicID(int magicID, int (__cdecl **out_cb)(int)); /* 0x50AF20; add esp,8 */
int sub_50A750(void); /* 0x50A750; 0 args */
int BattleActionSequence_SetupContext(void); /* 0x50AFC0; 0 stack args at this site */
short *__cdecl Camera_ZeroS16_Or800_IfPast_1D97494(short *); /* 0x502070 */
int __cdecl BattleActionSequence_WaitBusy(void); /* 0x50AE80 */
int *BattleActionSequence_ReleaseCamera(void); /* 0x50AED0 */

extern unsigned char *g_GfSequenceContextSharedB; /* 0x1D99A50 */
extern int (__cdecl *g_GfActiveCallbackPtr)(int); /* 0x21DFEC4 */
extern int BATTLE_PRESENTATION_FILE_RESULT; /* 0x1D999C8 */
extern unsigned char byte_1D96A90; /* 0x1D96A90 */
extern int dword_1D99A40; /* 0x1D99A40; value used as pointer */
extern unsigned char byte_1D99A78; /* 0x1D99A78; ctx blob start */
extern unsigned int CameraID_Maybe; /* 0x1D97728; this site stores WORD */
extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C */
extern int *g_GfSequenceContextCandidateA; /* 0x1D96AAC */
extern unsigned int dword_1D99A64; /* 0x1D99A64 */

int __cdecl BattleActionSequence_Tick_DefaultOrFC(int node)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned char cl;
    unsigned char al;
    unsigned int eax;
    unsigned int ecx;

    esi = (unsigned char *)node;
    cl = esi[0x0D];
    edi = *(unsigned char **)(esi + 0x10);
    eax = cl;
    if (eax > 4u) /* 83 F8 04 / 77 ja UNSIGNED */
        goto def_50B1A8;

    switch (eax) {
    case 0: /* loc_50B1AF */
        if (BattleActor_FindFlag2_Match(0x1A, 0x40) != 0) /* push 40h; push 1Ah; add esp,8 */
            goto def_50B1A8;
        ++esi[0x0D]; /* FE 46 0D; CL unchanged */
        /* fall through loc_50B1C2 */
    case 1: /* loc_50B1C2 */
        BattleGF_LoadCallbackByMagicID(
            *(unsigned short *)(g_GfSequenceContextSharedB + 6), /* 33 C0; 66 8B 41 06 */
            &g_GfActiveCallbackPtr);
        al = esi[0x0D]; /* reload after call */
        ++al;
        esi[0x0D] = al;
        goto def_50B1A8;

    case 2: /* loc_50B1E9 */
        if ((int)BATTLE_PRESENTATION_FILE_RESULT < 0) /* test eax,eax / jl SIGNED */
            goto def_50B1A8;
        if (byte_1D96A90 > 0u) /* A0; test al,al / ja UNSIGNED */
            goto def_50B1A8;
        ++cl;
        esi[0x0D] = cl; /* inc cl then store; not a memory reload */
        return 0;

    case 3: /* loc_50B205 */
        sub_50A750();
        BattleActionSequence_SetupContext(); /* bare call; no mov ecx */
        Camera_ZeroS16_Or800_IfPast_1D97494((short *)dword_1D99A40);
        *(unsigned short *)&CameraID_Maybe = 0xFFFFu; /* 66 C7 WORD */
        eax = (unsigned int)g_GfActiveCallbackPtr((int)&byte_1D99A78); /* push offset */
        ecx = battle_to_update_flags_dword_1D96A9C;
        g_GfSequenceContextCandidateA = (int *)eax; /* A3 DWORD */
        al = esi[0x0D];
        /* add esp,8 : Camera + callback */
        ecx |= 0x10u; /* 83 C9 10 full DWORD */
        ++al;
        esi[0x0D] = al;
        battle_to_update_flags_dword_1D96A9C = ecx;
        return 0;

    case 4: /* loc_50B253 */
        if (BattleActionSequence_WaitBusy() != 0)
            goto def_50B1A8;
        BattleActionSequence_ReleaseCamera();
        eax = battle_to_update_flags_dword_1D96A9C;
        edi[1] = 0xFFu; /* C6 BYTE [edi+1] */
        eax = (eax & 0xFFFFFF00u) | ((unsigned char)eax & 0xEFu); /* 24 EF AL only */
        battle_to_update_flags_dword_1D96A9C = eax;
        dword_1D99A64 = 0;
        return 2; /* B8 02; phase not incremented */
    }

def_50B1A8:
    return 0; /* 5F 33 C0 5E C3 */
}
```
