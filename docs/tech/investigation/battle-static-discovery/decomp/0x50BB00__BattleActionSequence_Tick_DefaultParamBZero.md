# BattleActionSequence_Tick_DefaultParamBZero @ 0x50BB00

- Instr (live): 84
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1157 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1816 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=250 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_DefaultParamBZero(int)
- Notes parent: ja UNSIGNED phase>3. jpt 4 cases @ 0x50BC10. Fallthrough 0->1->2->3. Case1 FindFlag2(0x1A,0x40) ou sub_50ADE0. Case2 [SharedB+2]==0 → ApplyEventGroup0 sinon StartActorAnimation; AND [actor+8] 0xFF7FFFFF. Case3 WORD [+74h]+2Ch test 0xC0; test bl,2 sur [actor+0] (pas occupancy); camera BYTE; AND EAX 0xFF7F (pas 66); EAX=2. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 / bone 0x30 / stride 0x9C absents.

## C réconcilié

```c
/* BattleActionSequence_Tick_DefaultParamBZero @ 0x50BB00
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_50BB17 @ 0x50BC10.
 * 84 instr, size 0x10D, end 0x50BC0D. cdecl, 1 arg, retn C3. Saved ESI EDI.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / bone 0x30 / stride 0x9C absent.
 * ja UNSIGNED phase>3. Fallthrough 0->1->2->3 same tick. Return 2 only case3 done.
 */

extern unsigned char *g_GfSequenceContextSharedB; /* 0x1D99A50 */
extern unsigned int dword_1D99A5C;                /* 0x1D99A5C */
extern unsigned int dword_1D99A84;                /* 0x1D99A84; BYTE +1 @ 0x1D99A85 */
extern int dword_1D99A40;                         /* 0x1D99A40 actor */
extern unsigned int g_BattleCameraFlags;          /* 0x1D97718; this fn reads LOW BYTE */

extern char __cdecl sub_505F00(unsigned char *, int);
extern int __cdecl BattleActor_FindFlag2_Match(int, unsigned short);
extern int sub_50ADE0(void);
extern unsigned char *BattleActionSequence_SetupContext(void);
extern void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId);
extern int __cdecl BattleAction_ApplyEventGroup0(void);
extern void __cdecl BattleActionSequence_SelectGenericCameraAnimation(unsigned char *, char);
extern int *BattleActionSequence_ReleaseCamera(void);

int __cdecl BattleActionSequence_Tick_DefaultParamBZero(int node)
{
    unsigned char *seq = (unsigned char *)node;
    unsigned char *payload = *(unsigned char **)(seq + 0x10);
    unsigned char phase = seq[0x0D];
    unsigned char *actor;
    unsigned char *ctx;
    unsigned char *animPtr;
    unsigned short w;

    /* cmp eax,3 / ja def_50BB17 : UNSIGNED */
    if ((unsigned int)phase > 3)
        return 0;

    switch (phase)
    {
    case 0: /* loc_50BB1E */
        *((unsigned char *)&dword_1D99A84 + 1) =
            (unsigned char)sub_505F00(g_GfSequenceContextSharedB, dword_1D99A5C & 0xFFFF);
        /* 8A 46 0D; add esp,8; FE C0; 88 46 0D */
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 1: /* loc_50BB45 */
        if (*((unsigned char *)&dword_1D99A84 + 1) != 0)
        {
            if (BattleActor_FindFlag2_Match(0x1A, 0x40) != 0)
                return 0; /* jnz def_50BB17 */
        }
        else
        {
            if (sub_50ADE0() != 0)
                return 0; /* jnz def_50BB17 */
        }
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1); /* loc_50BB71 FE 46 0D */
        /* fall through */

    case 2: /* loc_50BB74 */
        BattleActionSequence_SetupContext(); /* 0 stack args, no add esp */
        actor = (unsigned char *)dword_1D99A40;
        ctx = g_GfSequenceContextSharedB;
        *(unsigned int *)(actor + 8) &= 0xFF7FFFFF; /* clear bit 0x800000 */
        if (ctx[2] != 0)
        {
            BattlePresentation_StartActorAnimation((int)actor, ctx[2] & 0xFF);
        }
        else
        {
            BattleAction_ApplyEventGroup0(); /* ParamBZero-no-anim; 0 args */
        }
        BattleActionSequence_SelectGenericCameraAnimation(
            ctx, (char)*((unsigned char *)&dword_1D99A84 + 1));
        /* add esp,8 after SelectGenericCamera only (StartActorAnimation cleaned its own 8) */
        seq[0x0D] = (unsigned char)(seq[0x0D] + 1);
        /* fall through */

    case 3: /* loc_50BBCA */
        actor = (unsigned char *)dword_1D99A40;
        animPtr = *(unsigned char **)(actor + 0x74);
        w = *(unsigned short *)(animPtr + 0x2C); /* 66 8B 41 2C */
        if ((w & 0xC0) == 0) /* test al,0C0h */
        {
            if ((actor[0] & 2) != 0) /* test bl,2 on [actor+0]; NOT occupancy 1+2 */
                return 0;
        }
        if ((unsigned char)g_BattleCameraFlags != 0) /* 8A 15 moffs8 */
            return 0;
        /* 25 7F FF 00 00 AND EAX,0FF7Fh (no 66); 66 89 41 2C store AX */
        *(unsigned short *)(animPtr + 0x2C) = (unsigned short)(w & 0xFF7F);
        BattleActionSequence_ReleaseCamera();
        payload[1] = 0xFF; /* C6 47 01 FF */
        return 2;

    default: /* def_50BB17 */
        return 0;
    }
}
```
