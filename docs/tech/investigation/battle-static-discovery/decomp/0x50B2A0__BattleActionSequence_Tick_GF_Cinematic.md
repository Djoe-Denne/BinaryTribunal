# BattleActionSequence_Tick_GF_Cinematic @ 0x50B2A0

- Instr (live): 400
- Palier: low
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=8189 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=15219 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=15740 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_GF_Cinematic(int)
- Notes parent: ja UNSIGNED substep>9. jpt 10 cases @ 0x50B7E8. Fallthrough 0->1; 3->4->5->6->7. def_50B2BD=0x50B741. jl SIGNED FILE_RESULT + bound word_1D97494. jbe UNSIGNED clamp byte_1D96DC4. jnb UNSIGNED partner. TEST 2 only (occupancy 1+2 absent). Stride 0x9C present. 0xD0/0x1D0/0x44 absents. AND WORD 1D973F8 vs OR BYTE. Camera [ [actor+84]+2Ch ]. Case9 return 2, [esi+1]=0xFF, and al,0EFh. SetupContext 0-arg; add esp,10h = StartAnim+StartTrack.

## C réconcilié

```c
/* BattleActionSequence_Tick_GF_Cinematic @ 0x50B2A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_50B2BD @ 0x50B7E8.
 * 400 instr, size 0x546, end 0x50B7E6. cdecl, 1 arg, retn C3.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * Presentation stride 0x9C present (add esi,9Ch + lea/shl/sub/shl = *156).
 * ja UNSIGNED substep>9. jl SIGNED FILE_RESULT and party-loop bound.
 * jbe UNSIGNED clamp byte_1D96DC4. jnb UNSIGNED partner slot.
 */

extern unsigned int dword_1D97704;
extern unsigned int battle_to_update_flags_dword_1D96A9C;
extern unsigned int dword_1D99A40;
extern unsigned char *g_GfSequenceContextSharedB;
extern unsigned char byte_1D99A4E;
extern unsigned char byte_1D99A47;
extern unsigned char byte_1D99A81;
extern unsigned char byte_1D99B95;
extern unsigned char byte_1D28DF7;
extern unsigned char byte_1D96A90;
extern unsigned char byte_1D96DC4;
extern unsigned char byte_1D99A78;
extern unsigned int dword_1D99A70;
extern unsigned char byte_1D972C4[];
extern unsigned short word_1D99A44;
extern unsigned short word_1D97494;
extern int BATTLE_PRESENTATION_FILE_RESULT;
extern unsigned int g_BattleCameraFlags;
extern unsigned int dword_1D973F8;
extern unsigned int off_B6D084;
extern unsigned int dword_B8B9A8;
extern unsigned int dword_1D99A64;
extern unsigned char g_BattlePresentationActors[];
extern int (__cdecl *g_GfActiveCallbackPtr)(int);
extern int (__cdecl *g_BattleActionCallbackPtr_C8)(int);
extern int g_GfSequenceContextCandidateA;

extern int __cdecl BattleActor_FindFlag2_Match(int, unsigned short);
extern int sub_501190(void);
extern int BattleActionSequence_SetupContext(void);
extern void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId);
extern unsigned int BS_GetRandomCamera_Probably(void);
extern void __cdecl BattleCamera_StartTrack(unsigned short *, int);
extern int __cdecl BattleScript_SetModeByte_Jpt0B(int, int);
extern int __cdecl BattleGF_LoadCallbackByMagicID(int magicID, int (__cdecl **)(int));
extern int InitializeSound_CAL_sfx_stop_all2(void);
extern void __cdecl BS_CopyGeometry(unsigned char *, unsigned char *, unsigned int);
extern int __cdecl pre_computeGFBoost(char, int); /* IDA: pre_computeGFBoost? */
extern int BattleActionSequence_WaitBusy(void);
extern int __cdecl BattleModel_DispatchLoaderByActorId(int actor_id, unsigned char p_task_byte_0F, int p_task_dword_10);
extern int au_re_BdlinkTask_0(void);
extern int __cdecl sub_50B810(int);
extern int __cdecl BattleAction_ClassFromScriptBits(int actor);
extern void __cdecl BattleAction_TickScript_IfByte4lt10(int actor);
extern int *BattleActionSequence_ReleaseCamera(void);
extern int __cdecl BdPlaySy(unsigned int, int, unsigned int);
extern int BattleAction_ApplyEventGroup0(void);

int __cdecl BattleActionSequence_Tick_GF_Cinematic(int a1)
{
    unsigned char *seq = (unsigned char *)a1;
    unsigned char *payload = *(unsigned char **)(seq + 0x10); /* esi at entry */
    unsigned char substep = seq[0x0D]; /* BL */
    unsigned char *actor;
    unsigned char *p;
    unsigned char *camObj;
    unsigned int slot;
    unsigned int partner;
    unsigned int off;
    int idx;
    int anim;
    unsigned char variant;
    unsigned char b95;

    /* cmp eax,9 / ja def_50B2BD : UNSIGNED */
    if ((unsigned int)substep > 9)
        return 0;

    switch (substep)
    {
    case 0: /* loc_50B2C4 */
        if (BattleActor_FindFlag2_Match(0x1A, 0x40) != 0)
            return 0;
        if (sub_501190() != 0)
            return 0;
        seq[0x0D] = (unsigned char)(substep + 1);
        /* fall through */

    case 1: /* loc_50B2E8 */
        *((unsigned char *)&dword_1D97704 + 1) |= 0x80; /* camera bit 0x8000 */
        battle_to_update_flags_dword_1D96A9C |= 0x10;
        BattleActionSequence_SetupContext(); /* 0 stack args; add esp,10h is StartAnim+StartTrack */

        actor = (unsigned char *)dword_1D99A40;
        *(unsigned int *)(actor + 8) &= 0xFF7FFFFF;
        BattlePresentation_StartActorAnimation((int)actor, g_GfSequenceContextSharedB[2]);

        variant = (unsigned char)((BS_GetRandomCamera_Probably() % 3u) | 0x10);
        byte_1D99A4E = variant;
        actor = (unsigned char *)dword_1D99A40;
        camObj = *(unsigned char **)(actor + 0x84);
        BattleCamera_StartTrack(*(unsigned short **)(camObj + 0x2C), variant);

        byte_1D99A47 = 0;
        slot = 0;
        for (p = g_BattlePresentationActors;
             (int)p < (int)&word_1D97494; /* jl SIGNED, stride 0x9C, 3 slots */
             p += 0x9C, ++slot)
        {
            if (p != (unsigned char *)dword_1D99A40 && (*p & 2)) /* TEST r/m8,2 */
            {
                BattleScript_SetModeByte_Jpt0B((int)p, 0x0B);
                byte_1D99A47 |= (unsigned char)(1u << slot);
            }
        }

        BattleGF_LoadCallbackByMagicID(
            *(unsigned short *)(g_GfSequenceContextSharedB + 6),
            (int (__cdecl **)(int))&g_GfActiveCallbackPtr);
        word_1D99A44 = 0; /* 66 C7 WORD */
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        return 0;

    case 2: /* loc_50B3CC */
        if (BATTLE_PRESENTATION_FILE_RESULT < 0) /* test eax,eax / jl SIGNED */
            return 0;
        if ((unsigned char)g_BattleCameraFlags != 0) /* mov al, byte ptr */
            return 0;

        actor = (unsigned char *)dword_1D99A40;
        *(unsigned char *)(*(unsigned int *)(actor + 0x74) + 0x2C) |= 0x10;
        /* magic 0xD20D20D3 imul = signed /156 */
        idx = (int)(actor - g_BattlePresentationActors) / 156;
        byte_1D96DC4 = (unsigned char)idx;
        if ((unsigned char)idx > 1) /* cmp dl,1 / jbe UNSIGNED */
            byte_1D96DC4 = 1;
        seq[0x0D] = (unsigned char)(substep + 1); /* inc bl */
        return 0;

    case 3: /* loc_50B429 */
        if (byte_1D96A90 != 0)
            return 0;
        actor = (unsigned char *)dword_1D99A40;
        if ((*actor & 4) == 0) /* TEST r/m8,4 — not occupancy 1+2 */
            return 0;

        InitializeSound_CAL_sfx_stop_all2();
        actor = (unsigned char *)dword_1D99A40;
        *(unsigned short *)actor = (unsigned short)((*(unsigned short *)actor & 0xFFFD) | 8);
        actor[0x61] = 0;
        b95 = byte_1D99B95;
        *(unsigned short *)(*(unsigned int *)(actor + 0x74) + 0x2C) &= 0xFFDF;
        if (b95 != 2 && (byte_1D99A47 & 4))
        {
            BS_CopyGeometry(
                (unsigned char *)(off_B6D084 + ((unsigned int)b95 << 16)),
                (unsigned char *)(off_B6D084 + 0x20000),
                0x10000);
            *(unsigned short *)&dword_1D973F8 &= 0xFFFD; /* AND WORD */
        }

        g_BattleActionCallbackPtr_C8 = g_GfActiveCallbackPtr;
        g_GfSequenceContextCandidateA = g_GfActiveCallbackPtr((int)&byte_1D99A78);
        if (g_GfSequenceContextSharedB[1] == 0xFE)
            pre_computeGFBoost((char)byte_1D28DF7,
                               *(unsigned short *)(g_GfSequenceContextSharedB + 4));
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 4: /* loc_50B4E9 */
        if (BattleActionSequence_WaitBusy() != 0)
            return 0;
        b95 = byte_1D99B95;
        if (b95 != 2 && (byte_1D99A47 & 4))
        {
            BS_CopyGeometry(
                (unsigned char *)(off_B6D084 + 0x20000),
                (unsigned char *)(off_B6D084 + ((unsigned int)b95 << 16)),
                0x10000);
            *(unsigned char *)&dword_1D973F8 |= 2; /* OR BYTE */
        }
        actor = (unsigned char *)dword_1D99A40;
        idx = (int)(actor - g_BattlePresentationActors) / 156;
        BattleModel_DispatchLoaderByActorId(actor[4], (unsigned char)idx, 0);
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 5: /* loc_50B56B */
        if (au_re_BdlinkTask_0() != 0)
            return 0;
        actor = (unsigned char *)dword_1D99A40;
        idx = (int)(actor - g_BattlePresentationActors) / 156;
        /* push eax==0 after Bdlink success; or ch,10h */
        BattleModel_DispatchLoaderByActorId(actor[4] | 0x1000, (unsigned char)idx, 0);
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 6: /* loc_50B5B4 */
        if (au_re_BdlinkTask_0() != 0)
            return 0;
        sub_50B810((int)dword_1D99A40);
        actor = (unsigned char *)dword_1D99A40;
        idx = (int)(actor - g_BattlePresentationActors) / 156;
        if ((unsigned char)idx < 2) /* cmp dl,2 / jnb UNSIGNED */
            variant = (unsigned char)(idx + 1);
        else
            variant = (unsigned char)(idx - 1);
        *(unsigned char *)&dword_1D99A70 = variant; /* BYTE store */
        partner = dword_1D99A70 & 0xFF;
        off = partner * 0x9C;
        if (g_BattlePresentationActors[off] & 2)
        {
            BattleModel_DispatchLoaderByActorId(
                (unsigned char)byte_1D972C4[off] | 0x1000,
                (unsigned char)partner,
                0);
        }
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 7: /* loc_50B63A */
        if (au_re_BdlinkTask_0() != 0)
            return 0;
        partner = dword_1D99A70 & 0xFF;
        off = partner * 0x9C;
        p = g_BattlePresentationActors + off;
        if (*p & 2)
        {
            p[2] |= 4;
            anim = BattleAction_ClassFromScriptBits((int)p);
            anim |= 0x1000; /* or ah,10h */
            BattlePresentation_StartActorAnimation(
                (int)(g_BattlePresentationActors + off), anim);
        }

        actor = (unsigned char *)dword_1D99A40;
        for (p = g_BattlePresentationActors;
             (int)p < (int)&word_1D97494;
             p += 0x9C)
        {
            if (p == actor)
                continue;
            if ((p[0] & 2) == 0) /* test al,2 after mov ax,[esi] */
                continue;
            *(unsigned short *)p = (unsigned short)(*(unsigned short *)p & 0xFFFB);
            if (byte_1D99A81 != 2)
                BattleScript_SetModeByte_Jpt0B((int)p, 0x0C);
            else
                *(unsigned int *)(p + 0x2C) = dword_B8B9A8;
        }

        *(unsigned short *)actor = (unsigned short)((*(unsigned short *)actor & 0xFFF3) | 2);
        actor[2] |= 4;
        if (byte_1D99A81 == 2)
        {
            *(unsigned short *)(*(unsigned int *)(actor + 0x74) + 0x28) = 0;
            BattlePresentation_StartActorAnimation((int)actor, 1);
            BattleAction_TickScript_IfByte4lt10((int)dword_1D99A40);
            seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
            return 0; /* loc_50B747 own epilogue */
        }

        BattlePresentation_StartActorAnimation((int)actor, 0x14);
        camObj = *(unsigned char **)((unsigned char *)dword_1D99A40 + 0x84);
        BattleCamera_StartTrack(
            *(unsigned short **)(camObj + 0x2C),
            (unsigned char)(byte_1D99A4E + 3));
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        return 0; /* falls into def_50B2BD */

    case 8: /* loc_50B774 */
        if ((unsigned char)g_BattleCameraFlags != 0)
            return 0;
        BattleActionSequence_ReleaseCamera();
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        return 0;

    case 9: /* loc_50B790 */
        if (byte_1D99A81 == 3)
        {
            BdPlaySy(0x87, 0, 0x80);
            BdPlaySy(0x88, 0, 0x80);
            BattleAction_ApplyEventGroup0();
        }
        payload[1] = 0xFF; /* esi still [a1+10h] */
        battle_to_update_flags_dword_1D96A9C &= ~0x10u; /* and al,0EFh; DWORD store EAX */
        dword_1D99A64 = 0;
        return 2;

    default: /* def_50B2BD @ 0x50B741 */
        return 0;
    }
}
```
