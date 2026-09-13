# BdLinkCallback_5857D0 @ 0x5857D0

- Instr (live): 315
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=11903
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=13852
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=15600
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLinkCallback_5857D0(int node)
- Notes parent: stride actor 0x9C (pas slot 0xD0). Occupancy 1+2 absent (or ah,8 = flag 0x800). WORD 66 [node+0Ch] tick, pas BYTE +0x0D. Pump EAX=0 keep / 2 unlink. setnz+inc → 1|2. jg/jl/jle signed. Register 2 args. idiv 18h / 600h+1000h /3. add esp 14h/8/10h/4/18h/0Ch. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* BdLinkCallback_5857D0 @ 0x5857D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 315 instr, size 0x491, end 0x585C61. cdecl, 1 arg = node (Pump [node+8](node)).
 * IDA type was int __cdecl(int (*)()); SetType without namespace.
 * Saved EBX/EBP/ESI/EDI. sub esp,8 (var_8 WORD + var_4 DWORD). retn C3.
 * WORD 66 [node+0Ch] tick (not BYTE +0x0D). Pump return EAX=0 keep / EAX=2 unlink.
 * Stride lea/shl/sub: idx*0x9C on g_BattlePresentationActors @ 0x1D972C0.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * BYTE OR bit0 (80 0E 01) absent. Flag 0x800 is presentation WORD or ah,8.
 * setnz dl @ 58583D only. jg/jl/jle SIGNED; no ja/jpt.
 * No packed actor struct: live offsets +0x00/+0x14/+0x18/+0x1C/+0x20/+0x28.
 */

extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C DWORD */
extern unsigned int dword_21F71A4;                        /* actor index */
extern unsigned int dword_21F4498;                        /* second actor index */
extern unsigned char g_BattlePresentationActors[];        /* 0x1D972C0, stride 0x9C */
extern unsigned int dword_21F723C;
extern unsigned int dword_21F7240;
extern unsigned char byte_1D98214[];
extern unsigned int dword_21F71B0;                        /* zeroed stride 0x14 up to 21F723C */
extern unsigned int dword_21F6368;                        /* BdLink list head */
extern unsigned int dword_209FAA8;                        /* alt list head _DWORD[4] */
extern unsigned int dword_21F6350;
extern unsigned int dword_21F6354;
extern unsigned int dword_21F6358;
extern unsigned int dword_21F635C;
extern unsigned int dword_21F6360;
extern unsigned int dword_21F51B8;                        /* table base; index * 32 */
extern unsigned int off_B8B7D8;                           /* mutable set_texture_page_func */
extern unsigned int off_E6C48C;
extern unsigned int unk_24FEAA8;
extern unsigned int unk_E6CC38;

extern void __cdecl sub_5874B0(int, int, unsigned int *, int, int); /* add esp,14h */
extern int __cdecl BdLinkTask_Register(int list_head, int callback); /* add esp,8 */
extern int __cdecl _rand(void);
extern int __cdecl Actor_MidpointBonesF0F1(int actor, short *out); /* add esp,8 */
extern int __cdecl au_re_BdLinkTask_15(int callback); /* add esp,4 */
extern int *__cdecl FillWordPairStride2C_1D989B8(short, int); /* add esp,8 */
extern int __cdecl Camera_SetPackedSlots_15_16_17(int, int, int);
extern unsigned int *__cdecl GteState_StorePtr_1CA8A28(unsigned int *);
extern int __cdecl GteState_Set_1CA8A30(int);
extern int __cdecl sub_45F270(void); /* 0 stack args */
extern unsigned int *__cdecl GteState_GetToPtr_1CA8A68(unsigned int *); /* then add esp,18h */
extern int __cdecl BdPlaySE(unsigned int *, int, unsigned int); /* add esp,0Ch */

extern int sub_586230(unsigned short *);
extern int sub_5867B0(unsigned short *);
extern int sub_5868E0(unsigned short *);
extern int sub_585C70(unsigned short *);
extern int sub_586F90(unsigned short *);
extern int __cdecl sub_5872C0(unsigned short *);

#define ACTOR(idx) (g_BattlePresentationActors + (unsigned int)(idx) * 0x9Cu)

int __cdecl BdLinkCallback_5857D0(int node)
{
    unsigned char *np = (unsigned char *)node;
    unsigned char *actor;
    unsigned short tick;
    unsigned short flags;
    unsigned int gte_slot;
    unsigned char mid[8]; /* var_8 WORD @+0, var_4 DWORD @+4 */
    int t;
    int i;
    int n;
    int v;
    unsigned char *p;
    unsigned char *tbl;

    if (battle_to_update_flags_dword_1D96A9C & 0x201)
        return 0;

    tick = *(unsigned short *)(np + 0x0C);

    if (tick == 0) {
        actor = ACTOR(dword_21F71A4);
        flags = *(unsigned short *)actor;
        *(unsigned short *)(np + 0x0E) = flags & 0x800; /* and edi,800h */
        *(unsigned short *)actor = flags | 0x800;       /* or ah,8 */
    }

    if (tick == 1) {
        /* setnz dl from dword_21F7240!=0 (ZF preserved across mov eax,21F4498); inc edx */
        sub_5874B0(
            (int)ACTOR(dword_21F71A4),
            (int)ACTOR(dword_21F4498),
            &unk_24FEAA8,
            (int)&unk_E6CC38,
            (dword_21F7240 != 0) + 1);
    }

    if (tick == 2) {
        dword_21F723C = 0;
        n = (unsigned char)byte_1D98214[0] + 1;
        for (i = 1; i <= n; i++) /* eax=1..esi inclusive; signed jle */
            dword_21F723C += (unsigned char)byte_1D98214[i];

        t = BdLinkTask_Register((int)&dword_21F6368, (int)sub_586230);
        *(unsigned short *)(t + 0x0C) = 0; /* 66 89 58 0C */

        p = (unsigned char *)&dword_21F71B0;
        do {
            *(unsigned int *)p = 0;
            p += 0x14;
        } while (p < (unsigned char *)&dword_21F723C); /* jl signed */

        t = BdLinkTask_Register((int)&dword_21F6368, (int)sub_5867B0);
        *(unsigned short *)(t + 0x0C) = 0;
        *(unsigned short *)(t + 0x0E) = (unsigned short)(_rand() % 0x18); /* cdq/idiv 18h DX */

        t = BdLinkTask_Register((int)&dword_21F6368, (int)sub_5868E0); /* delayed add esp,10h */
        *(unsigned short *)(t + 0x0C) = 0;
    }

    if (dword_21F7240 != 0 && (int)(short)tick == (int)dword_21F723C) {
        t = BdLinkTask_Register((int)&dword_209FAA8, (int)sub_585C70);
        *(unsigned short *)(t + 0x0C) = 0;
        *(unsigned short *)(t + 0x1A) = (unsigned short)dword_21F71A4; /* 66 89 48 1A */
    }

    if (tick == 0x0D) {
        Actor_MidpointBonesF0F1((int)ACTOR(dword_21F4498), (short *)mid);
        actor = ACTOR(dword_21F71A4);
        *(unsigned short *)(actor + 0x1C) = *(unsigned short *)mid; /* 66 from var_8 */
        *(unsigned short *)(actor + 0x20) =
            (unsigned short)(*(unsigned int *)(mid + 4) + 0xF0A); /* DWORD var_4 + 0xF0A, 66 store */
    }

    if ((short)tick > 0x0D && (int)(short)tick == (int)dword_21F723C - 5) {
        actor = ACTOR(dword_21F71A4);
        *(unsigned short *)(actor + 0x1C) = *(unsigned short *)(actor + 0x14);
        *(unsigned short *)(actor + 0x20) = *(unsigned short *)(actor + 0x18);
    }

    if (tick == 0x28) {
        t = BdLinkTask_Register((int)&dword_21F6368, (int)sub_586F90);
        *(unsigned int *)(t + 0x10) = dword_21F6350;
        *(unsigned short *)(t + 0x0C) = 0;
        *(unsigned int *)(t + 0x14) = dword_21F6354;
    }

    if (tick == 0x3B) {
        t = au_re_BdLinkTask_15((int)sub_5872C0); /* no NULL test */
        v = _rand() % 0x600;                      /* cdq/idiv 600h */
        v += 0x1000;
        v = v / 3; /* MSVC 55555556h signed /3 */
        *(unsigned short *)(t + 0x1E) = (unsigned short)v;
        *(unsigned short *)(t + 0x1C) = (unsigned short)v;
        tbl = (unsigned char *)&dword_21F51B8
            + ((int)(short)*(unsigned short *)(t + 0x0E) << 5);
        *(unsigned int *)tbl = dword_21F6350;
        *(unsigned int *)(tbl + 4) = dword_21F6354;
        *(unsigned short *)(tbl + 0x10) = (unsigned short)dword_21F6358; /* 66 load/store */
        *(unsigned short *)(tbl + 0x12) = (unsigned short)dword_21F635C;
        *(unsigned short *)(tbl + 0x14) = (unsigned short)dword_21F6360;
    }

    if ((short)tick <= 0x10) {
        FillWordPairStride2C_1D989B8((short)((int)(short)tick << 7), 0);
    } else if ((int)(short)tick >= (int)dword_21F723C - 8 && (short)tick > 4
               && dword_21F7240 == 0) {
        FillWordPairStride2C_1D989B8(
            (short)(((int)dword_21F723C - (int)(short)tick) << 8), 0);
    }

    if ((short)tick <= 8) {
        Camera_SetPackedSlots_15_16_17(0xF0, 0x60, 0x40);
        gte_slot = off_B8B7D8;
        GteState_StorePtr_1CA8A28(&gte_slot);
        GteState_Set_1CA8A30((int)(short)tick << 9);
        sub_45F270();
        GteState_GetToPtr_1CA8A68((unsigned int *)(ACTOR(dword_21F71A4) + 0x28));
    } else if ((int)(short)tick >= (int)dword_21F723C - 8 && (short)tick > 4) {
        Camera_SetPackedSlots_15_16_17(0xF0, 0x60, 0x40);
        gte_slot = off_B8B7D8;
        GteState_StorePtr_1CA8A28(&gte_slot);
        GteState_Set_1CA8A30(((int)dword_21F723C - (int)(short)tick) << 9);
        sub_45F270();
        GteState_GetToPtr_1CA8A68((unsigned int *)(ACTOR(dword_21F71A4) + 0x28));
    }

    if (tick == 1)
        BdPlaySE(&off_E6C48C, 0x8000, 0x80);

    tick = ++*(unsigned short *)(np + 0x0C); /* 66 FF 45 0C */
    if ((int)(short)tick <= (int)dword_21F723C)
        return 0;

    if (dword_21F7240 == 0)
        FillWordPairStride2C_1D989B8(0, 0);

    actor = ACTOR(dword_21F71A4);
    *(unsigned int *)(actor + 0x28) = off_B8B7D8;
    flags = *(unsigned short *)actor;
    flags = (unsigned short)((flags & 0xF7FF) | *(unsigned short *)(np + 0x0E));
    *(unsigned short *)actor = flags;
    return 2;
}
```
