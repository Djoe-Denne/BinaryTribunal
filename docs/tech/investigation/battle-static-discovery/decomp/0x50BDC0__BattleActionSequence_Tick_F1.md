# BattleActionSequence_Tick_F1 @ 0x50BDC0

- Instr (live): 81
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1099 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1687 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=303 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_F1(int)
- Notes parent: cascade sub/dec phases 0/1, pas de jpt, pas de fallthrough 0→1. WORD 66 [SharedB+4]. jl/jg SIGNED sur EBX (pas ja). loc_50BE75: byte_1D99A80=8 entre cmp et jnz. Sticky C4 FF15 add esp,4; byte_1D99A81=0 avant l'appel. AND AL,0EFh puis store DWORD flags. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_Tick_F1 @ 0x50BDC0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 81 instr, size 0x111, end 0x50BED1. cdecl, 1 arg. Saved EBX ESI EDI. retn C3.
 * BYTE [esi+0Dh] phase: 33C9 8A4E 0D; sub ecx,0 / jz loc_50BE47; dec / jnz loc_50BECB.
 * Phases 0 and 1 only. Phase 0 does NOT fall into phase 1. No jpt.
 * 66 8B 40 04 WORD [SharedB+4] into AX; 8B D8; 81 E3 FFFF0000 EBX = zero-ext WORD.
 * Phase 1: 66 3D FCFF / FAFF cmp AX. loc_50BE14 WaitBusy+ReleaseCamera; ebx==FFFC AND AL,0EFh.
 * Else byte_1D99A81==1 and BYTE camera==0 → loc_50BE3A [edi+1]=FFh EAX=2.
 * Phase 0: sub_50A750 + SetupContext 0 args. test ebx / jl SIGNED; cmp ebx,5 / jg SIGNED.
 * loc_50BE75: C6 byte_1D99A80=8 BETWEEN cmp ebx,FFFC and jnz (both FFFC and FFFA).
 * FF15 g_GfActiveCallbackPtr; push &byte_1D99A78; C6 byte_1D99A81=0 BEFORE call; add esp,4.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / stride 0x9C: absent.
 * No setcc / ja. jl+jg SIGNED on EBX. No domain::.
 */

extern unsigned char *g_GfSequenceContextSharedB; /* 0x1D99A50 */
extern unsigned char byte_1D99A78; /* 0x1D99A78; this fn pushes ADDRESS */
extern unsigned char byte_1D99A80; /* 0x1D99A80 */
extern unsigned char byte_1D99A81; /* 0x1D99A81 */
extern unsigned char byte_1D99A82; /* 0x1D99A82 */
extern unsigned int g_BattleCameraFlags; /* 0x1D97718; this fn reads LOW BYTE (A0) */
extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C */
extern int (__cdecl *g_GfActiveCallbackPtr)(int); /* 0x21DFEC4 */

extern int sub_50A750(void);
extern unsigned char *BattleActionSequence_SetupContext(void);
extern int __cdecl BattleActionSequence_WaitBusy(void);
extern int *BattleActionSequence_ReleaseCamera(void);

int __cdecl BattleActionSequence_Tick_F1(int node)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned int ebx;
    unsigned short ax_word;
    unsigned int ecx;
    unsigned char al;
    unsigned char dl;
    unsigned char *sharedB;

    sharedB = g_GfSequenceContextSharedB; /* A1 */
    esi = (unsigned char *)node;
    ax_word = *(unsigned short *)(sharedB + 4); /* 66 8B 40 04 */
    ecx = 0;
    ecx = esi[0x0D]; /* 33 C9; 8A 4E 0D */
    ebx = ax_word; /* 8B D8; then AND 0xFFFF — AX already WORD so ebx is zero-ext */
    ebx &= 0xFFFFu; /* 81 E3 FF FF 00 00 */
    edi = *(unsigned char **)(esi + 0x10); /* 8B 7E 10 */

    ecx -= 0; /* 83 E9 00 */
    if (ecx == 0) /* 74 jz loc_50BE47 */
        goto loc_50BE47;
    ecx -= 1; /* 49 */
    if (ecx != 0) /* 0F 85 jnz loc_50BECB; leftover EAX then xor */
        goto loc_50BECB;

    /* phase == 1 */
    if (ax_word == 0xFFFC) /* 66 3D FC FF */
        goto loc_50BE14;
    if (ax_word == 0xFFFA) /* 66 3D FA FF */
        goto loc_50BE14;
    if (byte_1D99A81 != 1) /* 80 3D ... 01; 0F 85 */
        goto loc_50BECB;
    al = (unsigned char)g_BattleCameraFlags; /* A0 */
    if (al == 0) /* 84 C0 / 74 jz loc_50BE3A */
        goto loc_50BE3A;
    return 0; /* pop edi; pop esi; xor eax; pop ebx; retn */

loc_50BE14:
    if (BattleActionSequence_WaitBusy() != 0)
        goto loc_50BECB;
    BattleActionSequence_ReleaseCamera(); /* EAX unused */
    if (ebx != 0xFFFCu) /* 81 FB FC FF 00 00 */
        goto loc_50BE3A;
    ecx = battle_to_update_flags_dword_1D96A9C; /* A1; reuse as EAX */
    al = (unsigned char)ecx;
    al &= 0xEFu; /* 24 EF */
    ecx = (ecx & 0xFFFFFF00u) | al;
    battle_to_update_flags_dword_1D96A9C = ecx; /* A3 */

loc_50BE3A:
    edi[1] = 0xFF; /* C6 47 01 FF */
    return 2; /* pop edi; pop esi; B8 02; pop ebx; retn. phase not incremented */

loc_50BE47: /* phase == 0 */
    sub_50A750(); /* 0 stack args */
    BattleActionSequence_SetupContext(); /* 0 stack args, no add esp */
    if ((int)ebx < 0) /* 85 DB / 7C jl SIGNED */
        goto loc_50BE65;
    if ((int)ebx > 5) /* 83 FB 05 / 7F jg SIGNED */
        goto loc_50BE65;
    ebx = (ebx & 0xFFFFFF00u) | (unsigned char)((unsigned char)ebx + 2); /* 80 C3 02 */
    byte_1D99A80 = (unsigned char)ebx; /* 88 1D */
    goto loc_50BE9F;

loc_50BE65:
    if (ebx == 0xFFFCu) /* 81 FB FC FF 00 00 */
        goto loc_50BE75;
    if (ebx != 0xFFFAu) /* 81 FB FA FF 00 00 */
        goto loc_50BE9F;

loc_50BE75:
    /* cmp ebx, 0xFFFC; THEN C6 byte_1D99A80=8; THEN jnz loc_50BE8D */
    byte_1D99A80 = 8;
    if (ebx != 0xFFFCu)
        goto loc_50BE8D;
    byte_1D99A82 = 0; /* C6 05 ... 00 */
    goto loc_50BE9F;

loc_50BE8D:
    sharedB = g_GfSequenceContextSharedB; /* 8B 0D reload */
    dl = sharedB[6]; /* 8A 51 06 */
    dl = (unsigned char)(dl - 5); /* 80 EA 05 */
    byte_1D99A82 = dl; /* 88 15 */

loc_50BE9F:
    byte_1D99A81 = 0; /* C6 05 ... 00 BEFORE FF15 */
    g_GfActiveCallbackPtr((int)&byte_1D99A78); /* 68 78 9A D9 01; FF 15; EAX unused */
    ecx = battle_to_update_flags_dword_1D96A9C;
    al = esi[0x0D]; /* 8A 46 0D */
    /* add esp,4 */
    ecx |= 0x10u; /* 83 C9 10 */
    al = (unsigned char)(al + 1); /* FE C0 */
    battle_to_update_flags_dword_1D96A9C = ecx;
    esi[0x0D] = al; /* 88 46 0D */

loc_50BECB:
    return 0; /* pop edi; pop esi; xor eax,eax; pop ebx; retn */
}
```
