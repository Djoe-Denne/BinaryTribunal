# BattleActionSequence_DispatchTick @ 0x50A790

- Instr (live): 63
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=771
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=382
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_DispatchTick(int)
- Notes parent: ja unsigned route>0FEh. jpt 9 entrees + byte_50A89C. Case 28 fallthrough default. Case 252 direct DefaultOrFC. WORD 66 +4/+6. BYTE +1/+2/+10h/+0Dh. Return 8. Occupancy 1+2 absente.

## C réconcilié

```c
/* BattleActionSequence_DispatchTick @ 0x50A790
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 63 instr, size 0xE8, end 0x50A878. cdecl, 1 arg. no ebp; push esi; retn C3.
 * IDA type int __cdecl(int). Return EAX = 8 (B8 08 00 00 00).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / bone 0x30 absent.
 * ja 0F87 UNSIGNED (route > 0xFE → 255 skips byte_50A89C). jz/jnz equality. No jg/jl. No setcc.
 * Widths: BYTE latch+1/+2/+10h, node+0Dh (C6); WORD 66 latch+4/+6; DWORD task, [task+4],
 * latch ptr, flags, node+10h (89 70 10).
 * jpt_50A7BF @ 0x50A878 (9 dwords) + byte_50A89C @ 0x50A89C (255 bytes, cases 0..254):
 *   idx0={0} idx1={28} idx2={38,244,254} idx3={236,245} idx4={237,238}
 *   idx5={241} idx6={247} idx7={252} idx8=remaining. Case 28 falls into default.
 * add esp,4 after Prepare (delayed) and after BdLinkTask. No domain::.
 */

char __cdecl BattleActionSequence_PreparePayloadContext(int payload); /* 0x50BF90; add esp,4; EAX discarded */
int __cdecl au_re_BdLinkTask(int callback); /* 0x500DD0; add esp,4; EAX = node */

int __cdecl BattleActionSequence_Tick_PhysicalWithEvents(int); /* 0x50BD80 */
int __cdecl BattleActionSequence_Tick_PhysicalNoEvents(int);   /* 0x50BD00 */
int __cdecl BattleActionSequence_Tick_GF_Cinematic(int);       /* 0x50B2A0 */
int __cdecl BattleActionSequence_Tick_Generic(int);            /* 0x50A9A0 */
int __cdecl BattleActionSequence_Tick_Special(int);            /* 0x50B830 */
int __cdecl BattleActionSequence_Tick_F7(int);                 /* 0x50B0C0 */
int __cdecl BattleActionSequence_Tick_F1(int);                 /* 0x50BDC0 */
int __cdecl BattleActionSequence_Tick_EDEE(int);               /* 0x50BEE0 */
int __cdecl BattleActionSequence_Tick_DefaultParamBZero(int);  /* 0x50BB00 */
int __cdecl BattleActionSequence_Tick_DefaultOrFC(int);        /* 0x50B190 */
int __cdecl BattleActionSequence_Tick_DefaultParamAFFFF(int);  /* 0x50BC20 */

extern unsigned char *g_GfSequenceContextSharedB; /* 0x1D99A50 */
extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C */

int __cdecl BattleActionSequence_DispatchTick(int task)
{
    unsigned char *latch;
    unsigned int route;
    unsigned short cmd_arg;
    int tick;
    int node;

    BattleActionSequence_PreparePayloadContext(*(int *)(task + 4));
    latch = g_GfSequenceContextSharedB; /* A1; xor ecx; 83C404 delayed */
    route = latch[1]; /* 8A 48 01 zero-extend */

    if (route > 0xFEu) /* cmp ecx,0FEh; ja def_50A7BF */
        goto def_50A7BF;

    /* equivalent to dl=byte_50A89C[ecx]; jmp jpt_50A7BF[edx*4] */
    switch (route) {
    case 0: /* loc_50A7C6 / jpt[0] */
        if (latch[0x10] != 0) /* 8A 48 10 84 C9 74 0A */
            tick = (int)BattleActionSequence_Tick_PhysicalWithEvents;
        else
            tick = (int)BattleActionSequence_Tick_PhysicalNoEvents;
        goto loc_50A861;

    case 38: /* loc_50A7E1 / jpt[2] */
    case 244:
    case 254:
        cmd_arg = *(unsigned short *)(latch + 4); /* 66 8B 48 04 */
        if (cmd_arg == 0x46 || cmd_arg == 0x0F) /* 66 83 F9; jz */
            goto loc_50A7F8;
        tick = (int)BattleActionSequence_Tick_GF_Cinematic;
        goto loc_50A861;

    case 236: /* loc_50A812 / jpt[3] */
    case 245:
        tick = (int)BattleActionSequence_Tick_Special;
        goto loc_50A861;

    case 247: /* loc_50A819 / jpt[6] */
        tick = (int)BattleActionSequence_Tick_F7;
        goto loc_50A861;

    case 241: /* loc_50A820 / jpt[5] */
        tick = (int)BattleActionSequence_Tick_F1;
        goto loc_50A861;

    case 237: /* loc_50A827 / jpt[4] */
    case 238:
        tick = (int)BattleActionSequence_Tick_EDEE;
        goto loc_50A861;

    case 28: /* loc_50A82E / jpt[1] */
        battle_to_update_flags_dword_1D96A9C |= 0x10000000u; /* 81 0D ... 10 00 00 00 */
        /* fall through into def_50A7BF */

    default:
    def_50A7BF:
        if (*(unsigned short *)(latch + 4) == 0xFFFFu) { /* 66 81 78 04 FF FF */
            tick = (int)BattleActionSequence_Tick_DefaultParamAFFFF;
            goto loc_50A861;
        }
        if (*(unsigned short *)(latch + 6) == 0) { /* 66 83 78 06 00; jnz loc_50A84E */
            tick = (int)BattleActionSequence_Tick_DefaultParamBZero;
            goto loc_50A861;
        }
        /* loc_50A84E */
        if (latch[2] != 0) /* 8A 48 02 84 C9 75 B6 → loc_50A80B */
            goto loc_50A80B;
        tick = (int)BattleActionSequence_Tick_DefaultOrFC;
        goto loc_50A861;

    case 252: /* loc_50A855 / jpt[7]: no WORD/BYTE predicates */
        tick = (int)BattleActionSequence_Tick_DefaultOrFC;
        goto loc_50A861;
    }

loc_50A7F8:
    latch[2] = 0x0B; /* C6 40 02 0B */
    battle_to_update_flags_dword_1D96A9C |= 0x40000000u; /* A1 / 0D 00 00 00 40 / A3 */
loc_50A80B:
    tick = (int)BattleActionSequence_Tick_Generic;
loc_50A861:
    node = au_re_BdLinkTask(tick); /* 50 E8; 83 C4 04 */
    *(unsigned char *)(node + 0x0D) = 0; /* C6 40 0D 00 (also inside BdLinkTask) */
    *(int *)(node + 0x10) = task; /* 89 70 10 DWORD */
    return 8;
}
```
