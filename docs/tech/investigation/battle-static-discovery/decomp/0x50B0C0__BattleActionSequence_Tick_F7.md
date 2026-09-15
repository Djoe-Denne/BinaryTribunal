# BattleActionSequence_Tick_F7 @ 0x50B0C0

- Instr (live): 61
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=16
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1138
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=256
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleActionSequence_Tick_F7(int)
- Notes parent: Phase BYTE [esi+0Dh] 0/1/2 (sub 0 / dec / dec), case 0 fallthrough into 1. WORD 66 timeout vs 0x384, jl SIGNED. Idle EAX=2, BYTE [edi+1]=FFh, AND AL 0EFh. add esp,8 = Camera + FF15 sticky C4. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleActionSequence_Tick_F7 @ 0x50B0C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 61 instr, size 0xC9, end 0x50B189. cdecl, 1 arg. Saved ESI EDI. retn C3.
 * Phase BYTE [esi+0Dh]: 33C0 8A46 0D; sub 0 / dec / dec. Cases 0,1,2 else EAX=0.
 * Case 0: sub_50ADE0; if EAX!=0 yield; FE 46 0D then FALL THROUGH loc_50B13A.
 * Case 1: OR DWORD flags 10h; SetupContext 0 args; BYTE 1D99A79 |= 1;
 *   Camera (push dword_1D99A40); FF15 g_GfActiveCallbackPtr (push &byte_1D99A78);
 *   A3 CandidateA; add esp,8; re-read BYTE phase, INC AL, WORD timeout=0, store phase.
 * Case 2: WaitBusy; idle loc_50B111 ReleaseCamera, C6 [edi+1]=FFh, 24 EF, EAX=2.
 *   Busy: CandidateA!=0 yield; 66 INC AX; CMP AX,384h; JL SIGNED; else sfx_stop EAX=0.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / stride 0x9C: absent.
 * No setcc / jpt / ja. No domain::.
 */

extern int sub_50ADE0(void);
extern int __cdecl BattleActionSequence_WaitBusy(void);
extern int InitializeSound_CAL_sfx_stop_all2(void);
extern int *BattleActionSequence_ReleaseCamera(void);
extern unsigned char *BattleActionSequence_SetupContext(void);
extern short *Camera_ZeroS16_Or800_IfPast_1D97494(short *);
extern int *g_GfSequenceContextCandidateA; /* 0x1D96AAC */
extern short word_1D99A4A; /* 0x1D99A4A; 66 WORD */
extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C */
extern unsigned char byte_1D99A79; /* 0x1D99A79 */
extern int dword_1D99A40; /* 0x1D99A40 */
extern unsigned char byte_1D99A78; /* 0x1D99A78 */
extern int (__cdecl *g_GfActiveCallbackPtr)(int); /* 0x21DFEC4 */

int __cdecl BattleActionSequence_Tick_F7(int arg_0)
{
    unsigned char *obj;
    unsigned char *edi;
    unsigned char phase;

    obj = (unsigned char *)arg_0;
    phase = obj[0x0D]; /* 8A 46 0D */
    edi = *(unsigned char **)(obj + 0x10); /* 8B 7E 10 */

    switch (phase) {
    case 0: /* loc_50B12E */
        if (sub_50ADE0() != 0)
            return 0; /* loc_50B184 */
        obj[0x0D] = (unsigned char)(obj[0x0D] + 1); /* FE 46 0D; fall through */
    case 1: /* loc_50B13A */
        battle_to_update_flags_dword_1D96A9C |= 0x10u; /* 83 0D ... 10 */
        BattleActionSequence_SetupContext(); /* 0 stack args, no add esp */
        byte_1D99A79 = (unsigned char)(byte_1D99A79 | 1); /* 8A/80CA/88 BYTE */
        Camera_ZeroS16_Or800_IfPast_1D97494((short *)dword_1D99A40);
        g_GfSequenceContextCandidateA =
            (int *)g_GfActiveCallbackPtr((int)&byte_1D99A78); /* FF 15 */
        /* 83 C4 08 cleans Camera + sticky C4 */
        phase = (unsigned char)(obj[0x0D] + 1); /* 8A 46 0D; FE C0 */
        word_1D99A4A = 0; /* 66 C7 05 ... 0000 before phase store */
        obj[0x0D] = phase; /* 88 46 0D */
        return 0; /* loc_50B184 xor eax,eax */

    case 2:
        if (BattleActionSequence_WaitBusy() != 0) {
            if (g_GfSequenceContextCandidateA != 0)
                return 0;
            word_1D99A4A = (short)(word_1D99A4A + 1); /* 66 A1 / 66 40 / 66 A3 */
            if (word_1D99A4A < 0x384) /* 66 3D 8403; 7C jl SIGNED */
                return 0;
            InitializeSound_CAL_sfx_stop_all2();
            return 0; /* xor eax,eax; phase stays 2 */
        }
        /* loc_50B111 */
        BattleActionSequence_ReleaseCamera();
        edi[1] = 0xFF; /* C6 47 01 FF */
        battle_to_update_flags_dword_1D96A9C &= ~0x10u; /* 24 EF then A3 DWORD */
        return 2; /* B8 02 */

    default:
        return 0; /* phase != 0,1,2 */
    }
}
```
