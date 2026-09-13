# BdLinkCallback_5A6D20 @ 0x5A6D20

- Instr (live): 247
- Palier: low
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9625
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8973
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=10606
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLinkCallback_5A6D20(int node)
- Notes parent: WORD [node+0Ch] phase (66), pas BYTE +0x0D. Register 2 args `push offset` list. EAX=2 unlink TEST AL,2. setnz+inc anim 1|2. or ah,8 = actor bit 0x800 ≠ occupancy. jg/jl signed. add esp 14h/8/10h/18h/0Ch. 0xD0/0x1D0/0x44/_rand CRT absents de occupancy/GetRandomInt.

## C réconcilié

```c
/* BdLinkCallback_5A6D20 @ 0x5A6D20
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 247 instr, size 0x375, end 0x5A7095. IDA type int __cdecl(int (*)()).
 * cdecl, 1 arg = BdLink node (EDI). EBP is zero constant, not a frame pointer.
 * Saved EBP EDI then EBX ESI. retn C3.
 * BdLinkTask_Register 2 args (list_head, callback); add esp 8 or 10h (pair).
 * Child phase: WORD [node+0Ch]=0 (66 89 xx 0C), NOT BYTE +0x0D.
 * Pump unlink: EAX=2 (TEST AL,2). Keep: EAX=0 (flags 201h or phase<=total).
 * setnz al; inc eax → animId 1 or 2. jg/jl/jle signed. No ja. No jpt.
 * Actor stride lea/shl/sub → slot*0x9C at g_BattlePresentationActors 0x1D972C0.
 * or ah,8 / and 800h = actor WORD bit 0x800, NOT occupancy 1+2, NOT Register bit0.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * add esp: 14h (5022C0+StartAnim), 8, 10h, 18h (Camera+GTE), 0Ch (BdPlaySE).
 * No packed node struct. No NULL check on Register EAX. No domain::.
 */

extern unsigned int battle_to_update_flags_dword_1D96A9C;
extern int dword_22598A4;
extern unsigned char g_BattlePresentationActors[];
extern int dword_24FEB68;
extern int dword_E9264C;
extern int dword_2259940;
extern unsigned char byte_1D98214[];
extern int dword_225993C;
extern int dword_2258A80;
extern int dword_209FAA8;
extern int dword_22598B0;
extern int dword_2258A50;
extern int dword_2258A54;
extern int dword_2258A58;
extern int dword_2258A5C;
extern int dword_2258A60;
extern int dword_2258A64;
extern int dword_2258A68;
extern int dword_2258A6C;
extern int dword_2258A70;
extern int dword_2258A74;
extern int dword_2258A78;
extern int dword_2258A7C;
extern int off_B8B7D8;
extern unsigned int off_E91520;

extern int *__cdecl sub_5022C0(int actor, int *a2, int *a3);
extern void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId);
extern int __cdecl BdLinkTask_Register(int list_head, int callback);
extern int __cdecl _rand(void);
extern int *__cdecl FillWordPairStride2C_1D989B8(short word, int dword);
extern int __cdecl Camera_SetPackedSlots_15_16_17(int a, int b, int c);
extern int *__cdecl GteState_StorePtr_1CA8A28(int *ptr);
extern int __cdecl GteState_Set_1CA8A30(int v);
extern int __cdecl sub_45F270(void);
extern int *__cdecl GteState_GetToPtr_1CA8A68(int *ptr);
extern int __cdecl BdPlaySE(unsigned int *a, int b, unsigned int c);
extern int __cdecl sub_5A7660(int node);
extern int __cdecl sub_5A7BA0(int node);
extern int __cdecl sub_5A7CD0(int node);
extern int __cdecl sub_5A70A0(int node);
extern int __cdecl sub_5A8340(int node);

int __cdecl BdLinkCallback_5A6D20(int node)
{
    unsigned char *actor;
    unsigned short phase0;
    unsigned short w;
    int slot;
    int child;
    int n;
    int sum;
    int i;
    int *p;
    int gte_slot;
    short phase_s;

    if (battle_to_update_flags_dword_1D96A9C & 0x201)
        return 0;

    slot = dword_22598A4;
    actor = &g_BattlePresentationActors[slot * 0x9C];
    phase0 = *(unsigned short *)(node + 0x0C); /* DX; 66 8B 57 0C */

    if (phase0 == 0) {
        w = *(unsigned short *)actor;
        *(unsigned short *)(node + 0x0E) = (unsigned short)(w & 0x800); /* 81 E3 00 08; 66 89 5F 0E */
        *(unsigned short *)actor = (unsigned short)(w | 0x800);       /* 80 CC 08 */
    }

    if (phase0 == 1) { /* CMP DX,1 uses original DX, not a reload */
        sub_5022C0((int)actor, &dword_24FEB68, &dword_E9264C);
        BattlePresentation_StartActorAnimation((int)actor, (dword_2259940 != 0) + 1); /* setnz+inc */
        /* add esp,14h */
    }

    if (*(unsigned short *)(node + 0x0C) == 2) { /* reload SI */
        n = (unsigned char)byte_1D98214[0] + 1;
        sum = 0;
        dword_225993C = 0;
        if (n >= 1) { /* JL skip; dead for zero-ext byte+1, kept */
            for (i = 1; i <= n; i++) /* JLE */
                sum += (unsigned char)byte_1D98214[i];
            dword_225993C = sum;
        }
        if (*(unsigned short *)(node + 0x0C) == 2) { /* CMP SI,2 recheck */
            child = BdLinkTask_Register((int)&dword_2258A80, (int)sub_5A7660);
            *(unsigned short *)(child + 0x0C) = 0; /* 66 89 68 0C */
            for (p = &dword_22598B0; (int)p < (int)&dword_225993C; p = (int *)((char *)p + 0x14))
                *p = 0; /* 89 28; ADD EAX,14h; JL */
            child = BdLinkTask_Register((int)&dword_2258A80, (int)sub_5A7BA0);
            *(unsigned short *)(child + 0x0C) = 0;
            *(unsigned short *)(child + 0x0E) = (unsigned short)(_rand() % 0x18); /* CDQ/IDIV 18h DX */
            child = BdLinkTask_Register((int)&dword_2258A80, (int)sub_5A7CD0);
            *(unsigned short *)(child + 0x0C) = 0;
            /* add esp,10h */
        }
    }

    if (dword_2259940 != 0 && (int)(short)*(unsigned short *)(node + 0x0C) == dword_225993C) {
        child = BdLinkTask_Register((int)&dword_209FAA8, (int)sub_5A70A0);
        *(unsigned short *)(child + 0x0C) = 0;
        *(unsigned short *)(child + 0x1A) = (unsigned short)dword_22598A4; /* 66 89 48 1A */
    }

    if (*(unsigned short *)(node + 0x0C) == 0x3A) {
        child = BdLinkTask_Register((int)&dword_2258A80, (int)sub_5A8340);
        *(unsigned short *)(child + 0x0C) = 0;
        sum = _rand() % 0xC00; /* IDIV 0C00h remainder EDX */
        sum = (sum + 0x1D00) / 3; /* IMUL 55555556h + SHR 1Fh */
        dword_2258A68 = dword_2258A50;
        dword_2258A74 = dword_2258A5C;
        dword_2258A70 = dword_2258A58;
        dword_2258A6C = dword_2258A54;
        dword_2258A7C = dword_2258A64;
        dword_2258A78 = dword_2258A60;
        *(unsigned short *)(child + 0x1E) = (unsigned short)sum;
        *(unsigned short *)(child + 0x1C) = (unsigned short)sum;
    }

    phase_s = (short)*(unsigned short *)(node + 0x0C);
    if (phase_s <= 16) { /* CMP AX,10h / JG signed */
        FillWordPairStride2C_1D989B8((short)(phase_s << 7), 0);
    } else if (phase_s >= dword_225993C - 8 && phase_s > 4 && dword_2259940 == 0) {
        FillWordPairStride2C_1D989B8((short)((dword_225993C - phase_s) << 8), 0);
    }

    phase_s = (short)*(unsigned short *)(node + 0x0C);
    if (phase_s <= 8 || (phase_s >= dword_225993C - 8 && phase_s > 4)) {
        /* second arm has no dword_2259940 test (unlike FillWordPair) */
        Camera_SetPackedSlots_15_16_17(0xF0, 0x60, 0x40);
        gte_slot = off_B8B7D8; /* overlays arg_0 on stack */
        GteState_StorePtr_1CA8A28(&gte_slot);
        GteState_Set_1CA8A30(phase_s <= 8 ? phase_s << 9 : (dword_225993C - phase_s) << 9);
        sub_45F270();
        GteState_GetToPtr_1CA8A68((int *)(actor + 0x28)); /* 1D972E8 + slot*0x9C */
        /* add esp,18h */
    }

    if (*(unsigned short *)(node + 0x0C) == 1)
        BdPlaySE(&off_E91520, 0x8000, 0x80); /* add esp,0Ch */

    *(unsigned short *)(node + 0x0C) += 1; /* 66 FF 47 0C */
    if ((int)(short)*(unsigned short *)(node + 0x0C) <= dword_225993C)
        return 0;

    if (dword_2259940 == 0)
        FillWordPairStride2C_1D989B8(0, 0);

    *(int *)(actor + 0x28) = off_B8B7D8;
    w = *(unsigned short *)actor;
    w = (unsigned short)((w & 0xF7FF) | *(unsigned short *)(node + 0x0E)); /* 81 E2 FF F7; 66 0B 57 0E */
    *(unsigned short *)actor = w;
    return 2;
}
```
