# BattleActionSequence_PreparePayloadContext @ 0x50BF90

- Instr (live): 81
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2557 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3651 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5597 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: char __cdecl BattleActionSequence_PreparePayloadContext(int)
- Notes parent: jle SIGNED 7E (50BFF0 / 50C001), pas ja/jg. Aucun CALL. Actor *0x9C, events +0x18, groupes +0x14. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. WORD 66 A5C/A90/BP. BYTE A48 seulement si [esi+10h]!=0. Retour AL ignoré (DispatchTick recharge SharedB). C omettait A48.

## C réconcilié

```c
/* BattleActionSequence_PreparePayloadContext @ 0x50BF90
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 81 instr, size 0x100, end 0x50C090. cdecl, 1 arg, retn C3. FRAME 8.
 * No callees. add esp,8 is epilogue only.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * Actor stride 0x9C present. Event stride 0x18. Group walk +0x14.
 * jle SIGNED (7E) at 50BFF0 and 50C001. No ja/jg/setcc/jpt.
 */

extern unsigned char *g_GfSequenceContextSharedB; /* 0x1D99A50 DWORD ptr */
extern unsigned int dword_1D99A40;               /* presentation actor */
extern unsigned char byte_1D99A48;               /* first event slot; BYTE store */
extern unsigned char byte_1D99A56;               /* attacker slot; BYTE CL */
extern unsigned char byte_1D99A5A;               /* payload[0x10]; BYTE */
extern unsigned int dword_1D99A5C;               /* WORD target mask (66) */
extern unsigned int result_event;                /* 0x1D99A60 DWORD [payload+8] */
extern unsigned int dword_1D99A6C;               /* BYTE at +1 */
extern unsigned int dword_1D99A74;               /* DWORD [payload+0xC] */
extern unsigned int dword_1D99A84;               /* BYTE flags>>6 */
extern unsigned int dword_1D99A90;               /* WORD extra mask (66) */

char __cdecl BattleActionSequence_PreparePayloadContext(int a1)
{
    unsigned char *payload;   /* esi */
    unsigned short bpMask;    /* BP; WORD OR of 1<<event[0] */
    unsigned char attacker;   /* CL / var_4 BYTE */
    unsigned char *grp;       /* ebx; starts payload+0x10, += 0x14 */
    unsigned char *evt;       /* edx; += 0x18 */
    unsigned int slot;
    int outerLeft;            /* [esp+arg_0] reused */
    unsigned int evtLeft;     /* edi */
    unsigned char al;

    payload = (unsigned char *)a1;
    bpMask = 0; /* xor ebp, ebp */

    g_GfSequenceContextSharedB = payload;
    *(unsigned short *)&dword_1D99A5C = 0; /* 66 */

    result_event = *(unsigned int *)(payload + 8);
    attacker = payload[0]; /* mov cl,[esi]; BYTE var_4 */
    slot = attacker;       /* and eax, 0FFh */

    *(unsigned short *)&dword_1D99A90 = 0; /* 66 */
    *((unsigned char *)&dword_1D99A6C + 1) = 0;

    /* lea edx,[eax+eax*4]; shl edx,3; sub edx,eax; lea eax,1D972C0h[edx*4] */
    dword_1D99A40 = 0x1D972C0 + slot * 0x9C;

    dword_1D99A74 = *(unsigned int *)(payload + 0xC);

    outerLeft = (int)((unsigned char)payload[0x11] + 1); /* xor eax,eax; mov al; inc */
    if (outerLeft <= 0) /* 50BFF0 jle SIGNED vs ebp=0; skip ebx/edi */
        goto loc_50C06E;

    grp = payload + 0x10;
    do {
        evtLeft = (unsigned char)grp[0]; /* xor eax,eax; mov al,[ebx] */
        if ((int)evtLeft <= 0) /* 50C001 jle SIGNED */
            goto loc_50C057;

        evt = *(unsigned char **)(grp - 8); /* DWORD [ebx-8] */
        do {
            /* shl eax,cl then 66 OR BP,AX — x86 SHL masks CL to 5 bits */
            bpMask |= (unsigned short)(1u << (evt[0] & 31));

            if (evt[3] & 8) { /* test al,8 / jz loc_50C03B */
                unsigned char shift = (unsigned char)(evt[3] >> 6); /* shr al,6 */
                *(unsigned char *)&dword_1D99A84 = shift;
                *(unsigned short *)&dword_1D99A90 |= (unsigned short)(1u << shift);
            }

            if ((evt[2] & 0x30) == 0x30) /* and cl,30h; cmp 30h; jnz */
                *((unsigned char *)&dword_1D99A6C + 1) |= 2;

            evt += 0x18;
        } while (--evtLeft); /* dec edi; jnz loc_50C008 */

        /* 50C053 mov ecx,[var_4] — CL := saved payload[0] (only CL used later) */
        attacker = payload[0];

    loc_50C057:
        grp += 0x14;
    } while (--outerLeft); /* dec eax; jnz loc_50BFFB */

    *(unsigned short *)&dword_1D99A5C = bpMask; /* 66 after pop edi */

loc_50C06E:
    al = payload[0x10];
    byte_1D99A5A = al; /* always, even if 0 */
    if (al != 0) { /* jz loc_50C084 */
        al = *(unsigned char *)(*(unsigned int *)(payload + 8)); /* [esi+8], not result_event alias */
        byte_1D99A48 = al;
    }
    byte_1D99A56 = attacker; /* CL = payload[0] on every path */
    return (char)al; /* leftover AL; DispatchTick overwrites EAX from SharedB */
}
```
