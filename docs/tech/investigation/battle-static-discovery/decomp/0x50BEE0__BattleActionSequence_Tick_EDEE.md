# BattleActionSequence_Tick_EDEE @ 0x50BEE0

- Instr (live): 53
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=219 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=7 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_EDEE(int)
- Notes parent: cascade sub/dec phases 0/1, pas de jpt. loc_50BF80 ALWAYS xor eax. loc_50BF36 shared done (ED camera-idle jmp; EE WaitBusy fallthrough). ED camera-busy epilogue 0x50BF17. setz+inc A80=1+(SharedB+1==0xED). Sticky C4 call [g_GfActiveCallbackPtr](&byte_1D99A78) add esp,4. OR flags 10h phase0; AND AL,0EFh EE-done. BYTE camera A0. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de ja/jg. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_Tick_EDEE @ 0x50BEE0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 53 instr, size 0xA5, end 0x50BF85. cdecl, 1 arg. Saved ESI+EDI. retn C3.
 * BYTE [node+0Dh] phase, DWORD [node+10h] task. Cascade sub eax,0 / jz ; dec / jnz (no jpt).
 * Phase 0 fallthrough into loc_50BF80 after inc. loc_50BF80 ALWAYS xor eax (return 0).
 * loc_50BF36 shared done: ED camera-idle jumps here; EE WaitBusy-success falls in.
 * Phase 1 ED camera-busy: own epilogue 0x50BF17 (no ReleaseCamera, no flag touch).
 * setz dl; inc edx; store DL: byte_1D99A80 = 1 + ([SharedB+1]==0xED)  (DL is 0/1, no carry).
 * BYTE [edi+1]=0xFF; BYTE SharedB+1 vs 0xED; BYTE A80/A81; BYTE camera moffs8; DWORD flags.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No ja/jg. No 66 prefix. No domain::.
 */

unsigned char *__cdecl BattleActionSequence_SetupContext(void); /* 0x50AFC0; 0 args */
extern int (__cdecl *g_GfActiveCallbackPtr)(int); /* 0x21DFEC4; add esp,4 */
int __cdecl BattleActionSequence_WaitBusy(void); /* 0x50AE80; 0 args */
int *BattleActionSequence_ReleaseCamera(void); /* 0x50AED0; 0 args */

extern unsigned char *g_GfSequenceContextSharedB; /* 0x1D99A50 */
extern unsigned char byte_1D99A78; /* 0x1D99A78; address pushed as C4 arg */
extern unsigned char byte_1D99A80; /* 0x1D99A80; BYTE store DL */
extern unsigned char byte_1D99A81; /* 0x1D99A81; BYTE cmp 1 */
extern unsigned int g_BattleCameraFlags; /* 0x1D97718; THIS fn loads low BYTE via A0 */
extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C */

int __cdecl BattleActionSequence_Tick_EDEE(int node)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned char *sharedB;
    unsigned int eax;
    unsigned int ecx;
    unsigned char al;
    unsigned char dl;

    esi = (unsigned char *)node;
    eax = 0;
    edi = *(unsigned char **)(esi + 0x10);
    eax = esi[0x0D]; /* 33 C0; 8A 46 0D */

    if (eax == 0) /* 83 E8 00 / 74 jz loc_50BF42 */
        goto loc_50BF42;
    eax -= 1; /* 48 */
    if (eax != 0) /* 0F 85 jnz loc_50BF80; leftover discarded by xor */
        goto loc_50BF80;

    /* phase == 1 @ 0x50BEFA */
    sharedB = g_GfSequenceContextSharedB; /* A1 */
    if (sharedB[1] != 0xED) /* 80 78 01 ED / 75 jnz loc_50BF1C */
        goto loc_50BF1C;
    if (byte_1D99A81 != 1) /* 80 3D ... 01 / 75 jnz loc_50BF80 */
        goto loc_50BF80;
    al = (unsigned char)g_BattleCameraFlags; /* A0 moffs8 low BYTE */
    if (al != 0) /* 84 C0 / 74 jz loc_50BF36 else 0x50BF17 */
        return 0; /* pop edi; xor eax; pop esi; retn. No ReleaseCamera, no flag AND */

    goto loc_50BF36; /* camera idle: skip WaitBusy / ReleaseCamera / and 0xEF */

loc_50BF1C: /* phase 1 and SharedB+1 != 0xED */
    if (BattleActionSequence_WaitBusy() != 0) /* test eax,eax / 75 jnz */
        goto loc_50BF80;
    BattleActionSequence_ReleaseCamera();
    eax = battle_to_update_flags_dword_1D96A9C; /* A1 */
    al = (unsigned char)eax;
    al &= 0xEFu; /* 24 EF; clear bit 0x10 of low byte */
    eax = (eax & 0xFFFFFF00u) | al;
    battle_to_update_flags_dword_1D96A9C = eax; /* A3 DWORD store */
    /* fall through loc_50BF36 */

loc_50BF36: /* shared done */
    edi[1] = 0xFF; /* C6 47 01 FF */
    return 2; /* B8 02; phase not incremented */

loc_50BF42: /* phase == 0 */
    BattleActionSequence_SetupContext(); /* 0 args */
    sharedB = g_GfSequenceContextSharedB; /* 8B 0D */
    /* push &byte_1D99A78 before cmp; cleaned by add esp,4 after call */
    dl = (unsigned char)(sharedB[1] == 0xED); /* 80 79 01 ED / 0F 94 C2 setz dl */
    eax = dl;
    eax += 1; /* 42 inc edx; DL was 0 or 1 so no carry into DH */
    byte_1D99A80 = (unsigned char)eax; /* 88 15 BYTE */
    g_GfActiveCallbackPtr((int)&byte_1D99A78); /* FF15 [0x21DFEC4] */
    ecx = battle_to_update_flags_dword_1D96A9C;
    al = esi[0x0D]; /* reload AFTER callback */
    /* add esp,4 */
    ecx |= 0x10u; /* 83 C9 10 */
    al += 1; /* FE C0 */
    battle_to_update_flags_dword_1D96A9C = ecx;
    esi[0x0D] = al; /* 88 46 0D; fall through loc_50BF80 */

loc_50BF80:
    return 0; /* 5F; 33 C0; 5E; C3 */
}
```
