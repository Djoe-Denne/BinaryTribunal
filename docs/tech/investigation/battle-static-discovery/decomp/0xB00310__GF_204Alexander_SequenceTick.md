# GF_204Alexander_SequenceTick @ 0xB00310

- Instr (live): 120
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=164
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=181
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl GF_204Alexander_SequenceTick(void)
- Notes parent: Tick FamilyB Alexander. WORD ++ [ctx+32h], BYTE parity slot+41h puis copie +40h. Bit 400h WORD [ctx+0] -> OT+0Ch / WORD render+24h. Pause BYTE +35h depuis flag bataille bit0. Miroir camera 1D97778..94 vers deux banques (1D97788 & FFFFh). Interp signe [88h]=[84h]+[8Ch]*movsx slot+40h. Deux tests BYTE [ctx+1]&80h. 3 passes si +35h==0. BS_Debug arg = DWORD [slot+38h] (OT+44h, pas occupancy). Ret ((~WORD state+0Ah)>>14)&2. Occupancy/0xD0/0x1D0/GF Exists 0x44/K_GF 0x84/stride 0x9C absents.

## C réconcilié

```c
/* GF_204Alexander_SequenceTick @ 0xB00310
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 120 instr, size 0x215, end 0xB00525. IDA type unsigned int(). cdecl, 0 args, retn C3.
 * Labels loc_B0036B / loc_B0037A / loc_B0037D / loc_B0049C / loc_B004AD / loc_B004D4.
 * add esp: 8 (BS_Debug_UnknownFloatOperations), 4 (Call_Bs_parseCamera2).
 * EAX return: ((~WORD[SequenceStatePtr+0Ah]) >> 14) & 2.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84 / actor stride 0x9C: absent.
 * add edx,44h = g_BattleOTBase+0x44 -> slot+38h, not GF Exists. seqCtx+84h interp, not K_GF.
 * No domain::.
 */

int au_re_bs_modulo_50(void);
int __cdecl _rand(void);
_DWORD *__cdecl BS_Debug_UnknownFloatOperations(_DWORD *, int);
int sub_B00530(void);
int GF_204Alexander_PassIfIPNegative(void);
int sub_B00630(void);
int GF_204Alexander_PassIfIPPositive(void);
int GF_204Alexander_DispatchDrawOpcodes(void);
int __cdecl Call_Bs_parseCamera2(int);
int sub_AFFDE0(void);

extern _DWORD g_GfCinematic_SequenceCtxPtr;
extern _DWORD g_GfCinematic_RuntimeSlotPtr;
extern _DWORD g_GfCinematic_RenderCtxPtr;
extern _DWORD g_GfCinematic_SequenceStatePtr;
extern _DWORD g_BattleOTBase;
extern _DWORD g_BattlePacketCursor;
extern _DWORD battle_to_update_flags_dword_1D96A9C;
extern __int16 word_1D8E038;
extern _DWORD dword_1D97778;
extern _DWORD dword_1D9777C;
extern _DWORD dword_1D97780;
extern _DWORD dword_1D97784;
extern _DWORD dword_1D97788;
extern _DWORD dword_1D9778C;
extern _DWORD dword_1D97790;
extern _DWORD dword_1D97794;
extern _DWORD dword_27979E8;
extern _DWORD dword_27979EC;
extern _DWORD dword_27979F0;
extern _DWORD dword_27979F4;
extern _DWORD dword_27979F8;
extern _DWORD dword_27979FC;
extern _DWORD dword_2797A00;
extern _DWORD dword_2797A04;
extern _DWORD dword_2796F90;
extern _DWORD dword_2796F94;
extern _DWORD dword_2796F98;
extern _DWORD dword_2796F9C;
extern _DWORD dword_2796FA0;
extern _DWORD dword_2796FA4;
extern _DWORD dword_2796FA8;
extern _DWORD dword_2796FAC;

unsigned int __cdecl GF_204Alexander_SequenceTick(void)
{
    unsigned int seqCtx;
    unsigned int slot;
    unsigned int render;
    unsigned int state;
    unsigned int eax;
    int interp;

    au_re_bs_modulo_50();
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    ++*(_WORD *)(seqCtx + 0x32);
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    slot = g_GfCinematic_RuntimeSlotPtr;
    *(_BYTE *)(slot + 0x41) = *(_BYTE *)(seqCtx + 0x32) & 1;
    _rand();
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    if ( *(_WORD *)seqCtx & 0x400 )
    {
        render = g_GfCinematic_RenderCtxPtr;
        *(_DWORD *)(render + 0x2C) = g_BattleOTBase + 0xC;
        render = g_GfCinematic_RenderCtxPtr;
        *(_WORD *)(render + 0x24) = 0;
        seqCtx = g_GfCinematic_SequenceCtxPtr;
    }
    if ( *(_BYTE *)&battle_to_update_flags_dword_1D96A9C & 1 )
        *(_BYTE *)(seqCtx + 0x35) = 0xFF;
    else
        *(_BYTE *)(seqCtx + 0x35) = 0;
    slot = g_GfCinematic_RuntimeSlotPtr;
    *(_BYTE *)(slot + 0x40) = *(_BYTE *)(slot + 0x41);
    slot = g_GfCinematic_RuntimeSlotPtr;
    *(_DWORD *)(slot + 0x38) = g_BattleOTBase + 0x44;
    dword_27979FC = dword_1D9778C;
    dword_27979E8 = dword_1D97778;
    eax = dword_1D97788 & 0xFFFF;
    dword_2796F90 = dword_1D97778;
    dword_27979EC = dword_1D9777C;
    dword_27979F8 = eax;
    dword_2797A00 = dword_1D97790;
    dword_2796F94 = dword_1D9777C;
    dword_2796FA0 = eax;
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    dword_2796FA4 = dword_1D9778C;
    dword_27979F0 = dword_1D97780;
    dword_27979F4 = dword_1D97784;
    dword_2797A04 = dword_1D97794;
    dword_2796F98 = dword_1D97780;
    dword_2796F9C = dword_1D97784;
    dword_2796FA8 = dword_1D97790;
    dword_2796FAC = dword_1D97794;
    *(_DWORD *)(seqCtx + 0x7C) = g_BattlePacketCursor;
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    *(_DWORD *)(seqCtx + 0xD8) = *(_DWORD *)(seqCtx + 0xD4);
    slot = g_GfCinematic_RuntimeSlotPtr;
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    interp = *(int *)(seqCtx + 0x8C) * (int)(char)*(_BYTE *)(slot + 0x40);
    *(_DWORD *)(seqCtx + 0x88) = *(_DWORD *)(seqCtx + 0x84) + interp;
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    if ( *(_BYTE *)(seqCtx + 1) & 0x80 )
    {
        slot = g_GfCinematic_RuntimeSlotPtr;
        BS_Debug_UnknownFloatOperations(*(_DWORD **)(slot + 0x38), 0x1000);
    }
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    if ( *(_BYTE *)(seqCtx + 1) & 0x80 )
        sub_B00530();
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    *(_BYTE *)(seqCtx + 0xD2) = 0;
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    if ( !*(_BYTE *)(seqCtx + 0x35) )
    {
        GF_204Alexander_PassIfIPNegative();
        sub_B00630();
        GF_204Alexander_PassIfIPPositive();
    }
    render = g_GfCinematic_RenderCtxPtr;
    *(_WORD *)(render + 4) = 0;
    slot = g_GfCinematic_RuntimeSlotPtr;
    *(_WORD *)(slot + 0x46) = 0;
    GF_204Alexander_DispatchDrawOpcodes();
    Call_Bs_parseCamera2((int)word_1D8E038);
    seqCtx = g_GfCinematic_SequenceCtxPtr;
    g_BattlePacketCursor = *(_DWORD *)(seqCtx + 0x7C);
    sub_AFFDE0();
    state = g_GfCinematic_SequenceStatePtr;
    eax = *(_WORD *)(state + 0xA);
    eax = ~eax;
    eax >>= 14;
    return eax & 2;
}
```
