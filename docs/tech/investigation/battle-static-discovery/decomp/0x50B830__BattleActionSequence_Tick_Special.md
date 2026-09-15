# BattleActionSequence_Tick_Special @ 0x50B830

- Instr (live): 195
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=12 (effort_used=low)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=20 (effort_used=low)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=26 (effort_used=low)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_Special(int)
- Notes parent: ja UNSIGNED substep>7. jpt 8 cases @ 0x50BAE0. Fallthrough 0->1 same tick; case1 return 0. Fallthrough 3->4->5->6->7. Return 2 only case7. ebp=seq; arg0 slot=[ebp+10h] payload. AX WORD [SharedB+4] jb/jbe UNSIGNED skip 7..0Ah. FILE_RESULT jl SIGNED. Walk 3x0x9C jl vs &word_1D97494. Occupancy 1+2 absente (BYTE 2 / 4). add esp 8/8/20h/4/0Ch/10h/0Ch/14h. or ah,10h = |0x1000.

## C réconcilié

```c
/* BattleActionSequence_Tick_Special @ 0x50B830
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_50B853 @ 0x50BAE0.
 * 195 instr, size 0x2AF, end 0x50BADF. cdecl 1 arg, retn C3.
 * ja UNSIGNED substep>7. jpt 8 cases. Fallthrough 0->1 (same tick); 1 returns 0.
 * Fallthrough 3->4->5->6->7. Return 2 only case7.
 * Occupancy 1+2 ABSENT (BYTE value 2 / value 4 only). Stride 0x9C PRESENT.
 * Slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / bone 0x30 ABSENT.
 * ebp stays sequence; arg0 slot overwritten with [ebp+10h] payload (case7).
 */

extern unsigned char byte_1D99A56;
extern unsigned char *g_GfSequenceContextSharedB;
extern unsigned int battle_to_update_flags_dword_1D96A9C;
extern unsigned int dword_1D97704;
extern unsigned int dword_1D99A6C;
extern unsigned char g_BattlePresentationActors[];
extern unsigned short word_1D97494;
extern int BATTLE_PRESENTATION_FILE_RESULT;
extern unsigned int dword_1D973F8;
extern unsigned int dword_1D973FC;
extern unsigned char byte_1D97459;
extern unsigned int dword_1D97360;
extern int (__cdecl *g_GfActiveCallbackPtr)(int);
extern int (__cdecl *g_BattleActionCallbackPtr_C8)(int);
extern unsigned char byte_1D96DC4;
extern unsigned char byte_1D99A78;
extern int g_GfSequenceContextCandidateA;
extern unsigned int dword_1D99A64;

extern int __cdecl BattleActor_FindFlag2_Match(int, unsigned short);
extern int sub_501190(void);
extern int sub_50A750(void);
extern unsigned char *BattleActionSequence_SetupContext(void);
extern int __cdecl BattleScript_SetModeByte_Jpt0B(int, int);
extern int __cdecl BdPlaySy(unsigned int, int, unsigned int);
extern int __cdecl BattleGF_LoadCallbackByMagicID(int magicID, int (__cdecl **)(int));
extern int InitializeSound_CAL_sfx_stop_all2(void);
extern int BattleActionSequence_WaitBusy(void);
extern int __cdecl BattleModel_DispatchLoaderByActorId(int actor_id, unsigned char p_task_byte_0F, int p_task_dword_10);
extern int au_re_BdlinkTask_0(void);
extern int __cdecl sub_50B810(int);
extern int __cdecl BattleAction_ClassFromScriptBits(int actor);
extern void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId);
extern int *BattleActionSequence_ReleaseCamera(void);

int __cdecl BattleActionSequence_Tick_Special(int a1)
{
    unsigned char *seq = (unsigned char *)a1;
    unsigned char *payload = *(unsigned char **)(seq + 0x10);
    unsigned char *actor;
    unsigned int flags;
    unsigned int mask;
    unsigned short ax;
    int i;
    int anim;
    int (__cdecl *cb)(int);

    byte_1D99A56 = 0xFF;

    /* cmp eax,7 / ja def_50B853 : UNSIGNED */
    if ((unsigned int)seq[0x0D] > 7)
        return 0;

    switch (seq[0x0D])
    {
    case 0: /* loc_50B85A */
        if (BattleActor_FindFlag2_Match(0x1A, 0x40) != 0)
            return 0;
        if (sub_501190() != 0)
            return 0;
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 1: /* loc_50B87E */
        ax = *(unsigned short *)(g_GfSequenceContextSharedB + 4);
        /* jb/jbe UNSIGNED: call unless 7 <= AX <= 0x0A */
        if (ax < 7u || ax > 0x0Au)
            sub_50A750();

        flags = battle_to_update_flags_dword_1D96A9C;
        *((unsigned char *)&dword_1D97704 + 1) |= 0x80;
        flags |= 0x10u; /* or al,10h then DWORD store */
        battle_to_update_flags_dword_1D96A9C = flags;

        BattleActionSequence_SetupContext();
        *(unsigned char *)&dword_1D99A6C = 0;
        i = 0;
        actor = g_BattlePresentationActors;
        while ((int)actor < (int)&word_1D97494) /* jl SIGNED; 3 x stride 0x9C */
        {
            if (*actor & 2) /* BYTE value 2 only */
            {
                BattleScript_SetModeByte_Jpt0B((int)actor, 0x0B);
                *(unsigned char *)&dword_1D99A6C =
                    (unsigned char)(*(unsigned char *)&dword_1D99A6C | (unsigned char)(1u << i));
            }
            actor += 0x9C;
            i++;
        }

        BdPlaySy(0x18u, 0, 0x80u);
        BdPlaySy(0x19u, 0, 0x80u);
        BattleGF_LoadCallbackByMagicID(
            *(unsigned short *)(g_GfSequenceContextSharedB + 6),
            (int (__cdecl **)(int))&g_GfActiveCallbackPtr);
        /* add esp,20h = 12+12+8 */
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        return 0;

    case 2: /* loc_50B934 */
        if (BATTLE_PRESENTATION_FILE_RESULT < 0) /* jl SIGNED */
            return 0;

        mask = dword_1D99A6C & 0xFFu;
        i = 0;
        actor = g_BattlePresentationActors;
        while ((int)actor < (int)&word_1D97494)
        {
            if (mask & (1u << i))
            {
                if ((*actor & 4) == 0)
                    return 0;
            }
            actor += 0x9C;
            i++;
        }

        InitializeSound_CAL_sfx_stop_all2();
        if ((*(unsigned char *)&dword_1D99A6C & 4) != 0)
        {
            *(unsigned short *)&dword_1D973F8 =
                (unsigned short)(*(unsigned short *)&dword_1D973F8 & 0xFFFD);
            byte_1D97459 = 0;
        }

        cb = g_GfActiveCallbackPtr;
        g_BattleActionCallbackPtr_C8 = cb;
        byte_1D96DC4 = 1;
        g_GfSequenceContextCandidateA = cb((int)&byte_1D99A78);
        /* add esp,4 */
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        return 0;

    case 3: /* loc_50B9B9 */
        if (BattleActionSequence_WaitBusy() != 0)
            return 0;
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 4: /* loc_50B9C9 */
        if ((*(unsigned char *)&dword_1D99A6C & 4) != 0)
            BattleModel_DispatchLoaderByActorId(
                dword_1D973FC & 0xFF, 2, 0);
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 5: /* loc_50B9EE */
        if (au_re_BdlinkTask_0() != 0)
            return 0;
        if ((*(unsigned char *)&dword_1D99A6C & 4) != 0)
        {
            sub_50B810((int)&dword_1D973F8);
            /* and eax,0FFh / or ah,10h */
            BattleModel_DispatchLoaderByActorId(
                (dword_1D973FC & 0xFF) | 0x1000, 2, 0);
            /* add esp,10h */
        }
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 6: /* loc_50BA2B */
        if (au_re_BdlinkTask_0() != 0)
            return 0;
        if ((*(unsigned char *)&dword_1D99A6C & 2) != 0)
        {
            /* and ecx,0FFh / or ch,10h */
            BattleModel_DispatchLoaderByActorId(
                (dword_1D97360 & 0xFF) | 0x1000, 1, 0);
        }
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 7: /* loc_50BA60 */
        if (au_re_BdlinkTask_0() != 0)
            return 0;

        i = 0;
        actor = g_BattlePresentationActors;
        while ((int)actor < (int)&word_1D97494)
        {
            if (((unsigned char)(1u << i) & *(unsigned char *)&dword_1D99A6C) != 0)
            {
                *actor |= 2;
                anim = BattleAction_ClassFromScriptBits((int)actor);
                anim = (int)((unsigned int)anim | 0x1000u); /* or ah,10h */
                BattlePresentation_StartActorAnimation((int)actor, anim);
                BattleScript_SetModeByte_Jpt0B((int)actor, 0x0C);
                /* add esp,14h */
            }
            actor += 0x9C;
            i++;
        }

        BattleActionSequence_ReleaseCamera();
        flags = battle_to_update_flags_dword_1D96A9C;
        flags = (flags & 0xFFFFFF00u) | (unsigned char)(flags & 0xEFu); /* and al,0EFh */
        battle_to_update_flags_dword_1D96A9C = flags;
        dword_1D99A64 = 0;
        payload[1] = 0xFF; /* saved [ebp+10h], not seq */
        return 2;
    }

    return 0;
}
```
