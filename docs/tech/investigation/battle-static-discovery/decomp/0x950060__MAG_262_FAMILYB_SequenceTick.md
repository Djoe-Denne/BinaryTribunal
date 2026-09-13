# MAG_262_FAMILYB_SequenceTick @ 0x950060

- Instr (live): 120
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=274
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl MAG_262_FAMILYB_SequenceTick(void)
- Notes parent: FamilyB tick 0x215. INC WORD seq+0x32; BYTE runtime+0x41=counter&1. WORD[seq+0] bit 0x400 -> render+0x2C=OT+0xC, WORD render+0x24=0. Pause BYTE seq+0x35 = flags&1 ? 0xFF : 0. Dual copy 1D97778..94 -> 27979E8 / 2796F90, [4]&=0xFFFF. interp seq+0x88 = seq+0x84 + movsx(runtime+0x40)*seq+0x8C. OT+0x44 -> runtime+0x38 (pas occupancy). 3 passes si seq+0x35==0. Return ((~WORD[state+0xA])>>14)&2. Occupancy/0xD0/0x9C/0x1D0/K_GF absents.

## C réconcilié

```c
/* MAG_262_FAMILYB_SequenceTick @ 0x950060
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 120 instr, size 0x215, end exclusive 0x950275. IDA type unsigned int().
 * cdecl, 0 args, retn C3. No EBP. Labels loc_9500BB/0CA/0CD/1EC/1FD/224.
 * Callees: au_re_bs_modulo_9 @ 0x94FAA0 int(); _rand @ 0x55CBD2 int __cdecl();
 * BS_Debug_UnknownFloatOperations @ 0x45D530 _DWORD *__cdecl(_DWORD *, int) add esp,8;
 * sub_950280 @ 0x950280; sub_9592D0 @ 0x9592D0; sub_950380 @ 0x950380;
 * sub_9596F0 @ 0x9596F0; sub_954500 @ 0x954500; Call_Bs_parseCamera2 @ 0x56CD00
 * int __cdecl(int) add esp,4; sub_94FB30 @ 0x94FB30.
 * Return ((~WORD[state+0xA])>>14)&2 (SHR not SAR). EAX 0 continue / 2 done.
 * Occupancy 1+2 / slot 0xD0 / presentation 0x9C / F_CHAR 0x1D0 / GF Exists 0x44 /
 * K_GF 0x84: absent. add edx,44h = g_BattleOTBase+0x44 into runtime+0x38 (OT ptr).
 * No domain::.
 */

int __cdecl au_re_bs_modulo_9(void);
int __cdecl _rand(void);
unsigned int *__cdecl BS_Debug_UnknownFloatOperations(unsigned int *ptr, int a1);
int __cdecl sub_950280(void);
int __cdecl sub_9592D0(void);
int __cdecl sub_950380(void);
int __cdecl sub_9596F0(void);
int __cdecl sub_954500(void);
int __cdecl Call_Bs_parseCamera2(int);
int __cdecl sub_94FB30(void);

extern unsigned char *g_GfCinematic_SequenceCtxPtr;   /* 0x27973EC */
extern unsigned char *g_GfCinematic_RuntimeSlotPtr;   /* 0x27973B8 */
extern unsigned char *g_GfCinematic_RenderCtxPtr;     /* 0x27973BC */
extern unsigned char *g_GfCinematic_SequenceStatePtr; /* 0x27973C0 */
extern unsigned int g_BattleOTBase;                   /* 0x1D8E04C */
extern unsigned char battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C, TEST BYTE,1 */
extern unsigned int *g_BattlePacketCursor;            /* 0x1D8E054 */
extern short word_1D8E038;                            /* 0x1D8E038, movsx */

extern unsigned int dword_1D97778, dword_1D9777C, dword_1D97780, dword_1D97784;
extern unsigned int dword_1D97788, dword_1D9778C, dword_1D97790, dword_1D97794;
extern unsigned int dword_27979E8, dword_27979EC, dword_27979F0, dword_27979F4;
extern unsigned int dword_27979F8, dword_27979FC, dword_2797A00, dword_2797A04;
extern unsigned int dword_2796F90, dword_2796F94, dword_2796F98, dword_2796F9C;
extern unsigned int dword_2796FA0, dword_2796FA4, dword_2796FA8, dword_2796FAC;

unsigned int __cdecl MAG_262_FAMILYB_SequenceTick(void)
{
    unsigned char *seq;
    unsigned char *runtime;
    unsigned char *render;
    unsigned char *state;
    unsigned int m4;
    int interp;

    au_re_bs_modulo_9();

    seq = g_GfCinematic_SequenceCtxPtr;
    *(unsigned short *)(seq + 0x32) += 1; /* 66 FF 40 32 */

    runtime = g_GfCinematic_RuntimeSlotPtr;
    runtime[0x41] = seq[0x32] & 1; /* 8A 48 32; 80 E1 01; 88 4A 41 */

    _rand(); /* EAX discarded. xor ecx,ecx after reload seq; CL stays 0 */

    /* WORD [seq+0] bit 0x400 (66 8B 10; 81 E2 00 04 00 00; 66 85 D2) */
    if ((*(unsigned short *)seq & 0x400u) != 0) {
        render = g_GfCinematic_RenderCtxPtr;
        *(unsigned int *)(render + 0x2C) = g_BattleOTBase + 0x0C;
        *(unsigned short *)(render + 0x24) = 0; /* CX=0 */
        seq = g_GfCinematic_SequenceCtxPtr;
    }

    /* TEST BYTE battle_to_update_flags, 1 */
    if ((battle_to_update_flags_dword_1D96A9C & 1u) != 0)
        seq[0x35] = 0xFFu; /* C6 40 35 FF */
    else
        seq[0x35] = 0; /* 88 48 35 CL=0 */

    runtime = g_GfCinematic_RuntimeSlotPtr;
    runtime[0x40] = runtime[0x41];
    *(unsigned int *)(runtime + 0x38) = g_BattleOTBase + 0x44; /* OT, not GF-Exists */

    m4 = dword_1D97788 & 0xFFFFu; /* 25 FF FF 00 00 */
    dword_27979E8 = dword_1D97778;
    dword_2796F90 = dword_1D97778;
    dword_27979EC = dword_1D9777C;
    dword_2796F94 = dword_1D9777C;
    dword_27979F0 = dword_1D97780;
    dword_2796F98 = dword_1D97780;
    dword_27979F4 = dword_1D97784;
    dword_2796F9C = dword_1D97784;
    dword_27979F8 = m4;
    dword_2796FA0 = m4;
    dword_27979FC = dword_1D9778C;
    dword_2796FA4 = dword_1D9778C;
    dword_2797A00 = dword_1D97790;
    dword_2796FA8 = dword_1D97790;
    dword_2797A04 = dword_1D97794;
    dword_2796FAC = dword_1D97794;

    seq = g_GfCinematic_SequenceCtxPtr;
    *(unsigned int *)(seq + 0x7C) = (unsigned int)g_BattlePacketCursor;
    *(unsigned int *)(seq + 0xD8) = *(unsigned int *)(seq + 0xD4);

    runtime = g_GfCinematic_RuntimeSlotPtr;
    seq = g_GfCinematic_SequenceCtxPtr;
    interp = (int)(signed char)runtime[0x40]; /* 0F BE 48 40 */
    interp *= *(int *)(seq + 0x8C); /* 0F AF signed imul */
    interp += *(int *)(seq + 0x84);
    *(int *)(seq + 0x88) = interp;

    seq = g_GfCinematic_SequenceCtxPtr;
    if ((seq[1] & 0x80u) != 0) {
        runtime = g_GfCinematic_RuntimeSlotPtr;
        BS_Debug_UnknownFloatOperations(
            (unsigned int *)*(unsigned int *)(runtime + 0x38),
            0x1000); /* add esp,8 */
    }

    seq = g_GfCinematic_SequenceCtxPtr;
    if ((seq[1] & 0x80u) != 0)
        sub_950280();

    seq = g_GfCinematic_SequenceCtxPtr;
    seq[0xD2] = 0; /* 88 98 D2 00 00 00 BL=0 */

    if (seq[0x35] == 0) { /* 38 59 35 BYTE; paused 0xFF skips */
        sub_9592D0();
        sub_950380();
        sub_9596F0();
    }

    render = g_GfCinematic_RenderCtxPtr;
    *(unsigned short *)(render + 4) = 0; /* 66 89 5A 04 BX=0 */
    runtime = g_GfCinematic_RuntimeSlotPtr;
    *(unsigned short *)(runtime + 0x46) = 0; /* 66 89 58 46 */

    sub_954500();
    Call_Bs_parseCamera2((int)word_1D8E038); /* 0F BF movsx; add esp,4 */

    seq = g_GfCinematic_SequenceCtxPtr; /* reload after call, as ASM */
    g_BattlePacketCursor = (unsigned int *)*(unsigned int *)(seq + 0x7C);

    sub_94FB30();

    state = g_GfCinematic_SequenceStatePtr;
    /* 66 8B 41 0A; F7 D0; C1 E8 0E; 83 E0 02 */
    return ((unsigned int)~*(unsigned short *)(state + 0x0A) >> 14) & 2u;
}
```
