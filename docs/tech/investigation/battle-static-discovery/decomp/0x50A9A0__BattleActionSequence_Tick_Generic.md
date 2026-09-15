# BattleActionSequence_Tick_Generic @ 0x50A9A0

- Instr (live): 297
- Palier: low
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=11149 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=10919 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6746 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_Generic(int)
- Notes parent: ja UNSIGNED substep>7. jpt 8 cases @ 0x50ADC0. Fallthrough 0->1->2; case4 inc cl + jz WORD 1D99A90==0 -> case5. loc_50AD59 cmp byte_1D99A81,1 reuses loc_50AC7A jnz. Case3 flag 0x20000000 MEMORY; case4/5 edx. Case6 and al,0EFh reload mem. Stride 0x9C present. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 / bone 0x30 absents. jl SIGNED FILE_RESULT / CameraID WORD / timeout 384h. jb UNSIGNED [ebx+4]>=0x10. Return 2 only case7. C4 call add esp,4; case2 add esp,18h.

## C réconcilié

```c
/* BattleActionSequence_Tick_Generic @ 0x50A9A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_50A9C9 @ 0x50ADC0.
 * 297 instr, size 0x41F, end 0x50ADBF. cdecl, 1 arg, retn C3.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / bone 0x30 absent.
 * Presentation stride 0x9C present (lea/shl/sub/shl).
 */

extern unsigned char *g_GfSequenceContextSharedB;
extern unsigned int dword_1D99A5C;
extern unsigned int dword_1D99A84;
extern unsigned char byte_1D99A78;
extern unsigned char byte_1D99A79;
extern unsigned char byte_1D99A80;
extern unsigned char byte_1D99A81;
extern unsigned char byte_1D99AAA;
extern unsigned char byte_1D28DF7;
extern unsigned int dword_1D99A40;
extern unsigned int battle_to_update_flags_dword_1D96A9C;
extern unsigned char byte_1D96A90;
extern int BATTLE_PRESENTATION_FILE_RESULT;
extern unsigned int g_BattleCameraFlags;
extern unsigned int CameraID_Maybe;
extern unsigned int dword_1D99A90;
extern unsigned short word_1D99A8E;
extern unsigned char g_BattlePresentationActors[];
extern int (__cdecl *g_GfActiveCallbackPtr)(int);
extern int g_GfSequenceContextCandidateA;
extern unsigned int dword_1D99A64;

extern char __cdecl sub_505F00(unsigned char *, int);
extern int __cdecl BattleActor_FindFlag2_Match(int, unsigned short);
extern int sub_50ADE0(void);
extern int BattleActionSequence_SetupContext(void);
extern void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId);
extern void __cdecl BattleActionSequence_SelectGenericCameraAnimation(unsigned char *, char);
extern int __cdecl BattleGF_LoadCallbackByMagicID(int magicID, int (__cdecl **)(int));
extern int __cdecl au_re_BdLinkTask_0(int callback);
extern int __cdecl pre_computeGFBoost(char, int); /* IDA: pre_computeGFBoost? */
extern int BattleActionSequence_WaitBusy(void);
extern int InitializeSound_CAL_sfx_stop_all2(void);
extern int *BattleActionSequence_ReleaseCamera(void);
extern int __cdecl sub_50B080(int);

int __cdecl BattleActionSequence_Tick_Generic(int a1)
{
    unsigned char *seq = (unsigned char *)a1;
    unsigned char *payload = *(unsigned char **)(seq + 0x10);
    unsigned char substep = seq[0x0D];
    unsigned char *actor;
    unsigned int flags;
    unsigned char *ctx;
    unsigned char *pres = g_BattlePresentationActors;
    unsigned int srcOff;
    unsigned int dstOff;
    int node;

    /* cmp eax,7 / ja def_50A9C9 : UNSIGNED */
    if ((unsigned int)substep > 7)
        return 0;

    flags = battle_to_update_flags_dword_1D96A9C; /* edx */
    actor = (unsigned char *)dword_1D99A40;      /* ebx */

    switch (substep)
    {
    case 0: /* loc_50A9D0 */
        *((unsigned char *)&dword_1D99A84 + 1) =
            (unsigned char)sub_505F00(g_GfSequenceContextSharedB, dword_1D99A5C & 0xFFFF);
        seq[0x0D] = (unsigned char)(substep + 1);
        /* fall through */

    case 1: /* loc_50A9F7 */
        if (*((unsigned char *)&dword_1D99A84 + 1) != 0)
        {
            if (BattleActor_FindFlag2_Match(0x1A, 0x40) != 0)
                return 0; /* jnz def_50A9C9 */
        }
        else
        {
            if (sub_50ADE0() != 0)
                return 0;
        }
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 2: /* loc_50AA26 */
        battle_to_update_flags_dword_1D96A9C |= 0x10;
        BattleActionSequence_SetupContext(); /* 0 stack args */
        ctx = g_GfSequenceContextSharedB;
        if ((ctx[1] == 0x0B && *(unsigned short *)(ctx + 4) == 0xFFFB) || ctx[1] == 0x0E)
            byte_1D99A80 = 0;
        actor = (unsigned char *)dword_1D99A40;
        *(unsigned int *)(actor + 8) &= 0xFF7FFFFF;
        BattlePresentation_StartActorAnimation((int)actor, ctx[2]);
        BattleActionSequence_SelectGenericCameraAnimation(
            ctx, (char)*((unsigned char *)&dword_1D99A84 + 1));
        BattleGF_LoadCallbackByMagicID(
            *(unsigned short *)(ctx + 6),
            (int (__cdecl **)(int))&g_GfActiveCallbackPtr);
        /* add esp,18h = 8+8+8; SetupContext not in that 18h */
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        return 0;

    case 3: /* loc_50AAAA */
        /* jbe UNSIGNED on byte_1D96A90; flag test is MEMORY not edx */
        if (byte_1D96A90 != 0
            && (battle_to_update_flags_dword_1D96A9C & 0x20000000) == 0)
            return 0;
        if (BATTLE_PRESENTATION_FILE_RESULT < 0) /* jl SIGNED */
            return 0;
        if ((unsigned char)g_BattleCameraFlags != 0)
            return 0;
        if (*(unsigned int *)(actor + 0x8C) == 0)
        {
            *(unsigned char *)(*(unsigned int *)(actor + 0x74) + 0x2C) |= 0x10;
            seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
            return 0;
        }
        node = au_re_BdLinkTask_0((int)sub_50B080);
        *(unsigned short *)(node + 0x10) = 0x10;
        *(unsigned int *)(node + 0x0C) = dword_1D99A40;
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        return 0;

    case 4: /* loc_50AB2B */
        /* test edx, 20000000h — entry flags, not a memory reload */
        if (byte_1D96A90 != 0 && (flags & 0x20000000) == 0)
            return 0;
        if ((*(unsigned char *)(*(unsigned int *)(actor + 0x74) + 0x2C) & 0x20) == 0)
            return 0;
        seq[0x0D] = (unsigned char)(substep + 1); /* inc cl (entry substep) */
        if (*(unsigned short *)&dword_1D99A90 != 0)
        {
            srcOff = (dword_1D99A84 & 0xFF) * 0x9C;
            dstOff = (unsigned int)byte_1D99AAA * 0x9C;
            *(unsigned short *)(pres + dstOff + 0x1C) =
                *(unsigned short *)(pres + srcOff + 0x14);
            *(unsigned short *)(pres + dstOff + 0x20) =
                *(unsigned short *)(pres + srcOff + 0x18);
            /* last dest is SOURCE (eax), not ecx */
            *(unsigned short *)(pres + srcOff + 0x20) =
                (unsigned short)(*(unsigned short *)(pres + srcOff + 0x18) + 0x320);
            BattlePresentation_StartActorAnimation((int)(pres + dstOff), 0x1B);
            return 0;
        }
        /* WORD dword_1D99A90 == 0 -> jz loc_50ABCC */
        /* fall through */

    case 5: /* loc_50ABCC */
        *(unsigned short *)(*(unsigned int *)(actor + 0x74) + 0x2C) &= 0xFFDF;
        if (flags & 0x20000000)
        {
            flags &= 0xDFFFFFFF;
            battle_to_update_flags_dword_1D96A9C = flags; /* store before CameraID */
            if (*(short *)&CameraID_Maybe >= 0) /* jl SIGNED on WORD */
                *((unsigned char *)&g_BattleCameraFlags + 1) |= 0x80;
        }
        ctx = g_GfSequenceContextSharedB;
        if (ctx[1] == 2 || ctx[1] == 6)
        {
            /* cmp byte [ebx+4],10h / jb UNSIGNED */
            if (actor[4] >= 0x10u)
            {
                flags |= 0x20;
                battle_to_update_flags_dword_1D96A9C = flags;
            }
        }
        g_GfSequenceContextCandidateA = g_GfActiveCallbackPtr((int)&byte_1D99A78);
        ctx = g_GfSequenceContextSharedB; /* reload after C4 */
        if (ctx[1] == 0xFE)
            pre_computeGFBoost((char)byte_1D28DF7, *(unsigned short *)(ctx + 4));
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        word_1D99A8E = 0;
        return 0;

    case 6: /* loc_50AC66 */
        ctx = g_GfSequenceContextSharedB;
        if (*(unsigned short *)(ctx + 4) == 0xFFFE)
        {
            if (g_GfSequenceContextCandidateA != 0)
                return 0;
            seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
            return 0;
        }
        if (ctx[1] == 0x0B || ctx[1] == 0x0E)
        {
            /* loc_50AD59: cmp byte_1D99A81,1 ; jmp loc_50AC7A (jnz uses those flags) */
            if (byte_1D99A81 != 1)
                return 0;
            seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
            return 0;
        }
        if (BattleActionSequence_WaitBusy() != 0)
        {
            if (g_GfSequenceContextCandidateA != 0)
                return 0;
            word_1D99A8E = (unsigned short)(word_1D99A8E + 1);
            if ((short)word_1D99A8E < 0x384) /* 900; jl SIGNED; store before jl */
                return 0;
            InitializeSound_CAL_sfx_stop_all2();
            return 0; /* stay in state 6, no substep inc */
        }
        BattleActionSequence_ReleaseCamera();
        if ((byte_1D99A79 & 2) == 0)
        {
            /* mov eax,[1D96A9C]; and al,0EFh; store — reload MEMORY */
            battle_to_update_flags_dword_1D96A9C =
                battle_to_update_flags_dword_1D96A9C & 0xFFFFFFEF;
        }
        if (*(unsigned short *)&dword_1D99A90 == 0)
        {
            seq[0x0D] = (unsigned char)(seq[0x0D] + 1); /* loc_50AC7C */
            return 0;
        }
        dstOff = (unsigned int)byte_1D99AAA * 0x9C;
        srcOff = (dword_1D99A84 & 0xFF) * 0x9C;
        *(unsigned short *)(pres + dstOff + 0x1C) =
            *(unsigned short *)(pres + dstOff + 0x14);
        *(unsigned short *)(pres + dstOff + 0x20) =
            *(unsigned short *)(pres + dstOff + 0x18);
        *(unsigned short *)(pres + srcOff + 0x20) =
            *(unsigned short *)(pres + srcOff + 0x18);
        *(unsigned char *)(*(unsigned int *)(pres + dstOff + 0x74) + 0x2D) |= 2;
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        return 0;

    case 7: /* loc_50AD65 */
        flags = battle_to_update_flags_dword_1D96A9C;
        flags &= 0xFFFFFFDF;
        battle_to_update_flags_dword_1D96A9C = flags;
        actor = (unsigned char *)dword_1D99A40;
        if (*(unsigned int *)(actor + 0x8C) == 0)
        {
            *(unsigned char *)(*(unsigned int *)(actor + 0x74) + 0x2D) |= 2;
        }
        else
        {
            node = au_re_BdLinkTask_0((int)sub_50B080);
            *(unsigned int *)(node + 0x0C) = dword_1D99A40;
            *(unsigned short *)(node + 0x10) = 0x200;
        }
        payload[1] = 0xFF;
        dword_1D99A64 = 0;
        return 2;

    default: /* def_50A9C9 @ 0x50AC7F */
        return 0;
    }
}
```
