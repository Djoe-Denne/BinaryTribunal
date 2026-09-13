# BattleTaskQueue_Dispatch @ 0x502380

- Instr (live): 243
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5761
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3216
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5897
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleTaskQueue_Dispatch(int)
- Notes parent: jpt_50239A 18 DWORD ja UNSIGNED (id-0x66)>11h ; 0x6B def 0x0F ; stride 0x9C pas 0xD0/0x1D0 ; TEST [esi-8],2 pas occupancy 1+2 ; 0x71/0x73 sans C6 +0Dh ; 0x75 PUSH EAX leftover 66 AX+82h ; 0x76/0x77 fallthrough 0x0F ; jl SIGNE 3 slots.

## C réconcilié

```c
/* BattleTaskQueue_Dispatch @ 0x502380
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_50239A.
 * 243 instr, size 0x2A8, end 0x502628 (jpt starts at end). IDA type int __cdecl(int).
 * WORD opcode at node+2 (66 8B 4E 02); MOVSX; add -0x66; cmp 11h; ja UNSIGNED.
 * jpt_50239A @ 0x502628, 18 DWORD, index = (s16)opcode - 0x66. Opcode 0x6B -> default.
 * Presentation actors @ 0x1D972C0 stride 0x9C (idx*39*4). NOT slot 0xD0 / F_CHAR 0x1D0 / GF 0x44.
 * Occupancy 1+2 ABSENT. Flag test is TEST AL,2 / TEST BYTE [esi-8], BL=2 (actor+0 bit 0x02).
 * Return 8 = child spawned; 0x0F = unlink. 0x68/0x70 return callee EAX (0x70 callee itself mov eax,8).
 * No Hex-Rays. No domain::.
 */

extern unsigned char g_BattlePresentationActors[]; /* 0x1D972C0 */
extern unsigned int dword_1D972C8[];              /* 0x1D972C8 = actor[0]+8 */
extern unsigned int dword_1D9749C[];              /* 0x1D9749C = end after 3*0x9C */

extern int __cdecl au_re_BdLinkTask(int callback);                 /* 0x500DD0 add esp,4 EAX=node */
extern int __cdecl sub_5027D0(int node);                            /* 0x5027D0 add esp,4 */
extern int __cdecl BattleActionSequence_DispatchTick(int node);   /* 0x50A790 add esp,4 */
extern char *__cdecl sub_509CD0(int actor, unsigned int status);     /* 0x509CD0 cdecl 2 */
extern void __cdecl BattlePresentation_StartActorAnimation(int actor, int anim); /* 0x505C00 */
extern void __cdecl sub_503190(int slot, char anim, int flag);      /* 0x503190 add esp,0Ch */
extern int __cdecl au_re_BdLinkTask_1(int node);                     /* 0x5085D0 add esp,4 EAX=8 */
extern int __cdecl sub_50A070(int actor, int a2, int a3);           /* 0x50A070 cdecl 3 */
extern void __cdecl BattleAction_TickScript_IfByte4lt10(int actor); /* 0x509C80 */
extern int __cdecl sub_509BA0(unsigned short a1, int a2);           /* 0x509BA0 add esp,8 EAX=mask */

extern int __cdecl sub_502670(int);                          /* 0x502670 opcode 0x66 */
extern int __cdecl sub_502ED0(int);                          /* 0x502ED0 opcode 0x69 */
extern int __cdecl BattleTask_ActorReadyRelay71_Worker(int); /* 0x502F30 opcode 0x71 */
extern int __cdecl BS_StageMusicAndActorInit(int);           /* 0x503040 opcode 0x73 */
extern int __cdecl BattleTask_EscapeRelay74_Worker(int);       /* 0x502F90 opcode 0x74 */

int __cdecl BattleTaskQueue_Dispatch(int node)
{
    char *n = (char *)node;
    short opcode_s16;
    unsigned int sel;
    unsigned char *actor;
    int child;
    int idx;
    int slot;
    unsigned int *status_ptr;
    unsigned short flags;
    char *payload;
    int a2;
    int a3;
    unsigned int status;
    unsigned int mask;
    unsigned char shift;
    unsigned int bit;

    opcode_s16 = *(short *)(n + 2); /* 66 WORD, then MOVSX EAX,CX */
    sel = (unsigned int)((int)opcode_s16 - 0x66); /* add eax, 0FFFFFF9Ah */

    /* cmp eax,11h ; ja def_50239A (UNSIGNED). Includes opcode 0x6B via jpt. */
    if (sel > 0x11u)
        return 0x0F;

    switch (sel) {
    case 0: /* 0x66 loc_5023A1 */
        child = au_re_BdLinkTask((int)sub_502670);
        *(int *)(child + 0x10) = node;                 /* DWORD 89 70 10 */
        *(unsigned char *)(child + 0x0D) = 0;        /* C6 40 0D 00 */
        return 8;

    case 1: /* 0x67 loc_5023BE */
        sub_5027D0(node);
        return 0x0F;

    case 2: /* 0x68 loc_5023D0 — no mov eax; return callee EAX */
        return BattleActionSequence_DispatchTick(node);

    case 3: /* 0x69 loc_5023DD */
        idx = *(short *)(n + 8);
        actor = g_BattlePresentationActors + idx * 0x9C; /* lea/shl/sub then *4 */
        flags = *(unsigned short *)actor;              /* 66 load actor+0 */
        if ((flags & 2) == 0)                          /* TEST AL,2 ; JZ default */
            return 0x0F;
        flags = (unsigned short)(flags | 0x10);      /* OR AL,10h */
        *(unsigned short *)actor = flags;            /* 66 89 01 WORD store */
        child = au_re_BdLinkTask((int)sub_502ED0);
        *(int *)(child + 0x10) = node;
        *(unsigned char *)(child + 0x0D) = 0;
        return 8;

    case 4: /* 0x6A loc_502422 — 509CD0 + StartAnim, add esp,10h */
        idx = *(short *)(n + 8);
        actor = g_BattlePresentationActors + idx * 0x9C;
        sub_509CD0((int)actor, 0);
        BattlePresentation_StartActorAnimation((int)actor, 3);
        return 0x0F;

    case 5: /* 0x6B def_50239A */
        return 0x0F;

    case 6: /* 0x6C loc_5024CF — 3 party slots, jl SIGNED */
        slot = 0;
        status_ptr = dword_1D972C8;
        do {
            /* TEST [esi-8], BL=2  (84 5E F8) : actor+0 BYTE bit 0x02 */
            if (*((unsigned char *)status_ptr - 8) & 2)
                sub_503190(slot, 0x18, 1);
            else
                *status_ptr |= 0x01000000u;            /* 81 0E 00 00 00 01 */
            status_ptr = (unsigned int *)((char *)status_ptr + 0x9C);
            slot++;
        } while ((int)status_ptr < (int)dword_1D9749C);
        return 0x0F;

    case 7: /* 0x6D loc_50250A */
        slot = 0;
        status_ptr = dword_1D972C8;
        do {
            if (*((unsigned char *)status_ptr - 8) & 2)
                sub_503190(slot, 0x18, 0);
            else
                *status_ptr &= 0xFEFFFFFFu;           /* 81 26 FF FF FF FE */
            status_ptr = (unsigned int *)((char *)status_ptr + 0x9C);
            slot++;
        } while ((int)status_ptr < (int)dword_1D9749C);
        return 0x0F;

    case 8: /* 0x6E loc_502464 */
        sub_503190(*(short *)(n + 8), 0x17, 1);
        return 0x0F;

    case 9: /* 0x6F loc_502498 */
        idx = *(short *)(n + 8);
        actor = g_BattlePresentationActors + idx * 0x9C;
        BattlePresentation_StartActorAnimation((int)actor, *(short *)(n + 0x0A));
        return 0x0F;

    case 10: /* 0x70 loc_5024C2 camera barrier; EAX from au_re_BdLinkTask_1 */
        return au_re_BdLinkTask_1(node);

    case 11: /* 0x71 loc_502562 — push worker, jmp loc_50256E */
        child = au_re_BdLinkTask((int)BattleTask_ActorReadyRelay71_Worker);
        *(int *)(child + 0x10) = node;                /* shared tail: NO C6 +0Dh */
        return 8;

    case 12: /* 0x72 loc_50247E */
        sub_503190(*(short *)(n + 8), 0x17, 0);
        return 0x0F;

    case 13: /* 0x73 loc_502569 — same tail loc_50256E */
        child = au_re_BdLinkTask((int)BS_StageMusicAndActorInit);
        *(int *)(child + 0x10) = node;
        return 8;

    case 14: /* 0x74 loc_502545 escape worker */
        child = au_re_BdLinkTask((int)BattleTask_EscapeRelay74_Worker);
        *(int *)(child + 0x10) = node;
        *(unsigned char *)(child + 0x0D) = 0;
        return 8;

    case 15: /* 0x75 loc_502582 — add esp,10h after 50A070+TickScript */
        idx = *(short *)(n + 8);                     /* MOVSX EAX */
        payload = *(char **)(n + 4);                  /* ESI = [node+4] */
        a3 = *(int *)(payload + 0x0C);                 /* EDX = DWORD [payload+0Ch] */
        /* 66 8B 86 82 00 00 00 then PUSH EAX: high 16 leftover from MOVSX idx */
        a2 = (idx & (int)0xFFFF0000) | (int)*(unsigned short *)(payload + 0x82);
        actor = g_BattlePresentationActors + idx * 0x9C;
        sub_50A070((int)actor, a2, a3);
        BattleAction_TickScript_IfByte4lt10((int)actor);
        return 0x0F;

    case 16: /* 0x76 loc_5025BC */
    case 17: /* 0x77 loc_5025BC shared */
        idx = *(short *)(n + 8);
        actor = g_BattlePresentationActors + idx * 0x9C;
        status = *(unsigned int *)(actor + 8);      /* EDI = dword_1D972C8[edx*4] */
        shift = *(unsigned char *)(n + 0x0A);         /* 8A 4E 0A */
        bit = 1u;
        bit <<= shift;                                /* SHL r32, CL */
        if (opcode_s16 == 0x76) {                      /* 66 83 F9 76 ; CX still opcode */
            mask = (unsigned int)sub_509BA0((unsigned short)bit, 0);
        } else {
            mask = (unsigned int)sub_509BA0(0, (int)bit);
        }
        status &= ~mask;                              /* NOT ECX ; AND EDI, ECX */
        if (*(unsigned char *)(n + 0x0B) != 0)       /* 8A 4E 0B ; TEST CL,CL */
            status |= mask;                           /* OR EDI, EAX (509BA0 return) */
        sub_509CD0((int)actor, status);
        BattleAction_TickScript_IfByte4lt10((int)actor);
        return 0x0F;                                  /* fallthrough def_50239A */

    default:
        return 0x0F;
    }
}
```
