# BattleActionSequence_Tick_PhysicalNoEvents @ 0x50BD00

- Instr (live): 48
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=158
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=230
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=550
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_PhysicalNoEvents(int)
- Notes parent: cascade sub/dec/jz phases 0/1/2, pas de jpt. Phase0 fallthrough loc_50BD3A. loc_50BD7C leftover EAX=phase-2 (pas xor). BYTE [edi+1] C6 47 01. BYTE SharedB+2. DWORD [actor+8] AND 0xFF7FFFFF. Anim==0x0A inc+return 0 sinon return 2. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de ja/jg. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_Tick_PhysicalNoEvents @ 0x50BD00
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 48 instr, size 0x7F, end 0x50BD7F. cdecl, 1 arg. Saved ESI+EDI. retn C3.
 * BYTE [node+0Dh] phase, DWORD [node+10h] task. Cascade sub eax,0 / dec / dec (no jpt).
 * Phase 0 fallthrough into loc_50BD3A after inc. Phase 2 does not fall into phase 1.
 * loc_50BD7C unknown-phase: EAX leftover = phase-2, no xor.
 * BYTE [edi+1]=0xFF; BYTE SharedB+2; DWORD [actor+8] AND 0xFF7FFFFF.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No ja/jg. No setcc. No 66 prefix. No domain::.
 */

int sub_50AE00(void); /* 0x50AE00; 0 args */
void __cdecl BattlePresentation_StartActorAnimation(int actor, int animId); /* 0x505C00; add esp,8 */

extern int dword_1D99A40; /* 0x1D99A40; value used as pointer */
extern unsigned char *g_GfSequenceContextSharedB; /* 0x1D99A50 */

int __cdecl BattleActionSequence_Tick_PhysicalNoEvents(int node)
{
    unsigned char *esi;
    unsigned char *edi;
    unsigned int eax;
    unsigned int ecx;
    int actor;
    unsigned char *sharedB;

    esi = (unsigned char *)node;
    eax = 0;
    edi = *(unsigned char **)(esi + 0x10);
    eax = esi[0x0D]; /* 33 C0; 8A 46 0D */

    if (eax == 0) /* 83 E8 00 / 74 jz loc_50BD2E */
        goto loc_50BD2E;
    eax -= 1; /* 48 */
    if (eax == 0) /* 74 jz loc_50BD3A */
        goto loc_50BD3A;
    eax -= 1; /* 48 */
    if (eax != 0) /* 75 jnz loc_50BD7C; EAX leftover = phase-2 */
        goto loc_50BD7C;

    /* phase == 2 @ 0x50BD19 */
    if (sub_50AE00() != 0)
        goto loc_50BD7A;
    edi[1] = 0xFF; /* C6 47 01 FF */
    return 2; /* B8 02; phase not incremented */

loc_50BD2E: /* phase == 0 */
    if (sub_50AE00() != 0)
        goto loc_50BD7A;
    ++esi[0x0D]; /* FE 46 0D; fall through loc_50BD3A */

loc_50BD3A: /* phase == 1, or fallthrough from phase 0 */
    actor = dword_1D99A40; /* A1 */
    sharedB = g_GfSequenceContextSharedB; /* 8B 15 */
    ecx = *(unsigned int *)(actor + 8); /* 8B 48 08 */
    ecx &= 0xFF7FFFFFu; /* 81 E1 FF FF 7F FF; clear bit 0x00800000 */
    *(unsigned int *)(actor + 8) = ecx; /* 89 48 08 */
    ecx = 0;
    ecx = sharedB[2]; /* 33 C9; 8A 4A 02 zero-ext BYTE */
    BattlePresentation_StartActorAnimation(actor, (int)ecx); /* push ecx; push eax; add esp,8 */
    sharedB = g_GfSequenceContextSharedB; /* A1 reload */
    if (sharedB[2] == 0x0A) /* 80 78 02 0A / 74 jz loc_50BD77 */
        goto loc_50BD77;
    edi[1] = 0xFF; /* C6 47 01 FF */
    return 2; /* phase not incremented */

loc_50BD77:
    ++esi[0x0D]; /* FE 46 0D */
loc_50BD7A:
    eax = 0; /* 33 C0 */
loc_50BD7C:
    return (int)eax;
}
```
