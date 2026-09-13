# GF_205Brothers_SequenceTick @ 0xAF4B90

- Instr (live): 120
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=10
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=271
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2290
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl GF_205Brothers_SequenceTick(void)
- Notes parent: FamilyB Brothers. inc WORD [seq+0x32], BYTE slot+41h=counter&1 puis copie +40h. Dual copy 8 DWORD (mask 0xFFFF seulement copie 1D97788). OT+0x44 → slot+38h (pas GFSG). Interp signed byte*seq+8Ch + seq+84h → +88h (pas K_GF). Deux if [seq+1]&80h. EAX=((~WORD[state+0Ah])>>14)&2. Occupancy 1+2 absente. add esp 8 puis 4.

## C réconcilié

```c
/* GF_205Brothers_SequenceTick @ 0xAF4B90
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 120 instr, size 0x215, end 0xAF4DA5. IDA type unsigned int(). cdecl, 0 args, retn C3. FLAGS 0x5400. FRSIZE 0.
 * push ebx/esi/edi at 0xAF4C02 (after early BYTE/WORD stores). No sub esp. No arg_0.
 * add esp,8 after BS_Debug_UnknownFloatOperations; add esp,4 after Call_Bs_parseCamera2.
 * _rand EAX discarded. Dual 8-DWORD copy; 0xFFFF only on dword_1D97788 copy (source not mutated).
 * OT+0x44 into slot+0x38 is OT-base offset, not GFSG Exists 0x44. seq+84h/88h/8Ch interp, not K_GF.
 * Occupancy 1+2 / slot 0xD0 / actor 0x9C / F_CHAR 0x1D0 / GFSG 0x44 / K_GF 0x84: absent.
 * Widths: BYTE slot+40h/41h, seq+1 bit7, seq+35h, seq+0D2h, flags low byte;
 *   WORD 66 counter +32h, seq+0 bit10, render+24h/+4, slot+46h, state+0Ah, word_1D8E038;
 *   DWORD pointers, interp, copies, packet cursor.
 * jz/jnz only. No setcc, no jpt, no ja/jg, no domain::.
 * Labels loc_AF4BEB / loc_AF4BFA / loc_AF4BFD / loc_AF4D1C / loc_AF4D2D / loc_AF4D54.
 */

int __cdecl au_re_bs_modulo_49(void);
int __cdecl _rand(void);
unsigned int *__cdecl BS_Debug_UnknownFloatOperations(unsigned int *ot, int a2);
int __cdecl sub_AF4DB0(void);
int __cdecl sub_AFF6A0(void);
int __cdecl sub_AF4EB0(void);
int __cdecl sub_AFFAC0(void);
int __cdecl sub_AF9ED0(void);
int __cdecl Call_Bs_parseCamera2(int);
int __cdecl sub_AF4660(void);

extern unsigned char *g_GfCinematic_SequenceCtxPtr;    /* 0x27973EC */
extern unsigned char *g_GfCinematic_RuntimeSlotPtr;   /* 0x27973B8 */
extern unsigned char *g_GfCinematic_RenderCtxPtr;     /* 0x27973BC */
extern unsigned char *g_GfCinematic_SequenceStatePtr; /* 0x27973C0 */
extern unsigned int g_BattleOTBase;                    /* 0x1D8E04C integer, +0Ch/+44h are byte adds */
extern unsigned int *g_BattlePacketCursor;             /* 0x1D8E054 */
extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C; test BYTE bit0 */
extern unsigned int dword_1D97778;
extern unsigned int dword_1D9777C;
extern unsigned int dword_1D97780;
extern unsigned int dword_1D97784;
extern unsigned int dword_1D97788;
extern unsigned int dword_1D9778C;
extern unsigned int dword_1D97790;
extern unsigned int dword_1D97794;
extern unsigned int dword_27979E8[8]; /* dest A 0x27979E8 */
extern unsigned int dword_2796F90[8]; /* dest B 0x2796F90 */
extern unsigned short word_1D8E038;      /* 0x1D8E038 */

unsigned int __cdecl GF_205Brothers_SequenceTick(void)
{
    unsigned char *seq;
    unsigned char *slot;
    unsigned char *render;
    unsigned char *state;
    unsigned int v78, v7C, v80, v84, v88, v8C, v90, v94;
    int interp;
    unsigned int w;

    au_re_bs_modulo_49();

    seq = g_GfCinematic_SequenceCtxPtr;
    *(unsigned short *)(seq + 0x32) += 1;

    seq = g_GfCinematic_SequenceCtxPtr;
    slot = g_GfCinematic_RuntimeSlotPtr;
    slot[0x41] = seq[0x32] & 1;

    _rand();

    seq = g_GfCinematic_SequenceCtxPtr;
    if (*(unsigned short *)seq & 0x400) {
        render = g_GfCinematic_RenderCtxPtr;
        *(unsigned int *)(render + 0x2C) = g_BattleOTBase + 0x0C;
        *(unsigned short *)(render + 0x24) = 0;
        seq = g_GfCinematic_SequenceCtxPtr;
    }

    /* loc_AF4BEB */
    if (battle_to_update_flags_dword_1D96A9C & 1)
        seq[0x35] = 0xFF;
    else
        seq[0x35] = 0; /* loc_AF4BFA: cl==0 after xor ecx,ecx */

    /* loc_AF4BFD */
    slot = g_GfCinematic_RuntimeSlotPtr;
    slot[0x40] = slot[0x41];
    *(unsigned int *)(slot + 0x38) = g_BattleOTBase + 0x44;

    v78 = dword_1D97778;
    v7C = dword_1D9777C;
    v80 = dword_1D97780;
    v84 = dword_1D97784;
    v88 = dword_1D97788 & 0xFFFF;
    v8C = dword_1D9778C;
    v90 = dword_1D97790;
    v94 = dword_1D97794;

    dword_27979E8[0] = v78;
    dword_27979E8[1] = v7C;
    dword_27979E8[2] = v80;
    dword_27979E8[3] = v84;
    dword_27979E8[4] = v88;
    dword_27979E8[5] = v8C;
    dword_27979E8[6] = v90;
    dword_27979E8[7] = v94;

    dword_2796F90[0] = v78;
    dword_2796F90[1] = v7C;
    dword_2796F90[2] = v80;
    dword_2796F90[3] = v84;
    dword_2796F90[4] = v88;
    dword_2796F90[5] = v8C;
    dword_2796F90[6] = v90;
    dword_2796F90[7] = v94;

    seq = g_GfCinematic_SequenceCtxPtr;
    *(unsigned int *)(seq + 0x7C) = (unsigned int)g_BattlePacketCursor;

    seq = g_GfCinematic_SequenceCtxPtr;
    *(unsigned int *)(seq + 0xD8) = *(unsigned int *)(seq + 0xD4);

    slot = g_GfCinematic_RuntimeSlotPtr;
    seq = g_GfCinematic_SequenceCtxPtr;
    interp = (int)(signed char)slot[0x40];
    interp = interp * *(int *)(seq + 0x8C) + *(int *)(seq + 0x84);
    *(int *)(seq + 0x88) = interp;

    seq = g_GfCinematic_SequenceCtxPtr;
    if (seq[1] & 0x80) {
        slot = g_GfCinematic_RuntimeSlotPtr;
        BS_Debug_UnknownFloatOperations(
            (unsigned int *)*(unsigned int *)(slot + 0x38),
            0x1000);
    }

    /* loc_AF4D1C */
    seq = g_GfCinematic_SequenceCtxPtr;
    if (seq[1] & 0x80)
        sub_AF4DB0();

    /* loc_AF4D2D */
    seq = g_GfCinematic_SequenceCtxPtr;
    seq[0xD2] = 0;

    seq = g_GfCinematic_SequenceCtxPtr;
    if (seq[0x35] == 0) {
        sub_AFF6A0();
        sub_AF4EB0();
        sub_AFFAC0();
    }

    /* loc_AF4D54 */
    render = g_GfCinematic_RenderCtxPtr;
    *(unsigned short *)(render + 4) = 0;
    slot = g_GfCinematic_RuntimeSlotPtr;
    *(unsigned short *)(slot + 0x46) = 0;

    sub_AF9ED0();
    Call_Bs_parseCamera2((int)(signed short)word_1D8E038);

    seq = g_GfCinematic_SequenceCtxPtr;
    g_BattlePacketCursor = (unsigned int *)*(unsigned int *)(seq + 0x7C);

    sub_AF4660();

    state = g_GfCinematic_SequenceStatePtr;
    w = *(unsigned short *)(state + 0x0A);
    return ((~w) >> 14) & 2;
}
```
