# BattleAction_ApplyResultAndSpawnPresentation @ 0x506690

- Instr (live): 154
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1794
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1921
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=788
- A==B: non
- Push IDB: oui
- SetType: char __cdecl BattleAction_ApplyResultAndSpawnPresentation(unsigned __int8 *result_event)
- Notes parent: Stride acteur 0x9C (pas 0xD0). BdLinkTask_Register 2 args; add esp,14h = Mask3+Reg2. BYTE [task+0xC]=index /156. WORD 66. Mort 0x40 skip Tick. Flag 0x10000000 consomme flash. Paire +0xC 0xFF skip. EAX leftover. Occupancy/F_CHAR/GF absents.

## C réconcilié

```c
/* BattleAction_ApplyResultAndSpawnPresentation @ 0x506690
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 154 instr, size 0x1C3, end 0x506853. cdecl, retn C3, 1 arg.
 * Saved ebx/esi/edi. EAX at retn is leftover (char proto kept).
 * Actor stride: lea [eax+eax*4]; shl 3; sub ecx,eax; lea 1D972C0[ecx*4] = index*0x9C (156).
 * g_BattlePresentationActors == 0x1D972C0 (LEA disp and sub operand).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * BdLinkTask_Register is 2 args; add esp,14h = delayed Mask(3)+Register(2).
 * BYTE store [task+0xC]=bl (signed /156 magic 0xD20D20D3 sar 7).
 * WORD 66: [edi], [esi+4], [esi+10], test [edx+2Ch],140h.
 * No setcc / jpt / ja/jg. No Hex-Rays. No domain::.
 */

extern unsigned char g_BattlePresentationActors[]; /* 0x1D972C0, stride 0x9C */
extern int dword_1D986A8[];                        /* 0x1D986A8 list_head */
extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C */
extern unsigned char unk_B8B858[];                 /* 0xB8B858 */

unsigned __int8 __cdecl BattleAction_ResolveAndApplyStatusResult(unsigned __int8 *);
void *__cdecl BS_DispatchStageById(int);
int __cdecl BattleStatus_MaskWithSlotStatus2(int, int, int);
int __cdecl BdLinkTask_Register(int list_head, int callback);
int __cdecl au_re_BdLinkTask_4(int, unsigned __int8 *);
int __cdecl BattleScript_SetModeByte_Jpt0B(int, int);
int __cdecl BdPlaySystemSE3D(unsigned int, int, int *);
void __cdecl sub_506620(int, int);
void __cdecl BattleAction_TickScript_IfByte4lt10(int);
unsigned __int16 *__cdecl au_re_BdLinkTask_6(__int16, __int16, __int16, __int16);
int __cdecl au_re_BdLinkTask_5(int, int);
void __cdecl sub_5065B0(unsigned __int8 *);
void __cdecl BattlePresentation_SpawnDamagePopup(unsigned __int8 *);
int __cdecl sub_50A070(int, int, int);
int sub_506860(void); /* callback pushed as offset; type unset in IDA */

char __cdecl BattleAction_ApplyResultAndSpawnPresentation(unsigned __int8 *result_event)
{
    unsigned __int8 *ev;
    unsigned __int8 *actor;
    unsigned __int8 *actor2;
    unsigned __int16 actor_flags;
    unsigned __int16 ev_flags;
    int task;

    ev = result_event;
    actor = g_BattlePresentationActors + (unsigned int)ev[0] * 0x9C;

    BattleAction_ResolveAndApplyStatusResult(ev); /* add esp,4 */

    if (actor[4] == 0x8C)
        BS_DispatchStageById(3); /* add esp,4 */

    actor_flags = *(unsigned __int16 *)actor; /* 66 8B 07 */
    if ((actor_flags & 2) == 0)              /* test al,2 ; jz loc_50684F */
        return 0;
    if (actor_flags & 0x10)                  /* test al,10h ; jnz loc_50684F */
        return 0;

    ev_flags = *(unsigned __int16 *)(ev + 4); /* 66 8B 46 04 */

    if ((ev_flags & 4)
        && (actor[8] & 0x1A) == 0
        && (*(unsigned __int16 *)(*(int *)(actor + 0x74) + 0x2C) & 0x140) == 0)
    {
        /* and eax,0FFFFh ; and al,0FBh. Mask 3 args left on stack. */
        BattleStatus_MaskWithSlotStatus2(
            (int)actor,
            ev_flags & 0xFFFB,
            *(int *)(ev + 8));
        task = BdLinkTask_Register((int)dword_1D986A8, (int)sub_506860);
        /* add esp,14h = 3 leftover + 2 Register. 88 58 0C BYTE. */
        *(unsigned __int8 *)(task + 0xC) = (unsigned __int8)(
            ((int)(actor - g_BattlePresentationActors)) / 0x9C);
    }
    else
    {
        BattleStatus_MaskWithSlotStatus2(
            (int)actor,
            ev_flags, /* and eax,0FFFFh only; bit2 kept */
            *(int *)(ev + 8)); /* add esp,0Ch */
    }

    if (ev[2] & 0x40)
    {
        au_re_BdLinkTask_4((int)actor, unk_B8B858);
        BattleScript_SetModeByte_Jpt0B((int)actor, 7);
        BdPlaySystemSE3D(0xD, 8, (int *)(actor + 0x1C));
        BdPlaySystemSE3D(0xE, 0x10, (int *)(actor + 0x1C)); /* add esp,28h */
    }
    else
    {
        if ((*(unsigned int *)(ev + 8) & 0x10000) == 0)
            sub_506620((int)actor, ev[1]); /* add esp,8 */
        BattleAction_TickScript_IfByte4lt10((int)actor); /* add esp,4 */
    }

    if (battle_to_update_flags_dword_1D96A9C & 0x10000000)
        battle_to_update_flags_dword_1D96A9C &= 0xEFFFFFFFu;
    else if (ev[3] & 2)
        au_re_BdLinkTask_6(0, 1, 0, 0xFF); /* add esp,10h */

    switch (ev[2] & 0x30)
    {
    case 0x10:
        au_re_BdLinkTask_5((int)actor, 0x27);
        break;
    case 0x20:
        au_re_BdLinkTask_5((int)actor, 0x28);
        break;
    case 0x30:
        au_re_BdLinkTask_5((int)actor, 0x26);
        break;
    default:
        break; /* jnz loc_5067F8 */
    }

    sub_5065B0(ev);
    BattlePresentation_SpawnDamagePopup(ev); /* add esp,8 together */

    if (ev[0xC] != 0xFF)
    {
        actor2 = g_BattlePresentationActors + (unsigned int)ev[0xC] * 0x9C;
        sub_50A070(
            (int)actor2,
            *(unsigned __int16 *)(ev + 0x10), /* 66 8B 46 10, EAX 0-ext */
            *(int *)(ev + 0x14));
        sub_506620((int)actor2, ev[0xD]);
        BattleAction_TickScript_IfByte4lt10((int)actor2);
        BattlePresentation_SpawnDamagePopup(ev + 0xC); /* add esp,1Ch */
    }

    return 0; /* loc_50684F; EAX leftover in ASM */
}
```
