# GF_191Doomtrain_SequenceTaskDriver @ 0x63F2D0

- Instr (live): 340
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=168
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8225
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8784
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GF_191Doomtrain_SequenceTaskDriver(int)
- Notes parent: FamilyA secondary driver. WORD [task+0x0C] 66. flags 0x201 bit0 -> 0 sans inc; bit 0x200 seul -> PresentationFileGate signed. Init t==0 Register5+sub_63F9D0+sub_63F970+Trans F78380+sub_4A29A0. Cascade signed jge/jl. loc_63F588 jmp loc_63F655. loc_63F4D2 Trans GetPtr. GetPtr_209FAB8 != dword_24FD3A0. 0x22C sans +0x10000. ApplyEventRecords BYTE [rec+10h] at t==420. jg 0x1A7 -> 2. Occupancy/0xD0/0x1D0/0x44/K_GF/0x9C absents.

## C réconcilié

```c
/* GF_191Doomtrain_SequenceTaskDriver @ 0x63F2D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 340 instr, size 0x48A, end 0x63F75A. IDA type int __cdecl(int). No domain::.
 * cdecl, 1 arg. No locals (ASM: push esi / push edi only). WORD at task+0x0C.
 * add esp: 0Ch (Mat 3), 28h (init 5+0+0+2+3), 0Ch (SE), 8 (CharacterLoad),
 * 0Ch (TIM+Load), 10h (stream+task78), 8 (Trans), 18h (SE+stream),
 * 14h (stream+Load), loc_63F705 +4 (task78/TIM/Clear).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84 /
 * presentation stride 0x9C: absent. Signed jge/jl/jg on movsx. No jpt.
 */

extern unsigned int dword_1D97778;
extern unsigned char unk_24FBDA8;
extern unsigned int dword_24FBF90[8];
extern int dword_24FBE88;
extern unsigned int battle_to_update_flags_dword_1D96A9C;
extern unsigned int dword_24FC330[4];
extern unsigned char byte_24FC290[64];
extern unsigned char unk_E3CA88;
extern unsigned char unk_24FC280;
extern unsigned char unk_F78380;
extern unsigned char unk_E3C774;
extern unsigned int dword_24FC28C;
extern unsigned char unk_E3C8A8;
extern unsigned char unk_E3C8AC;
extern unsigned char unk_E3C8B0;
extern unsigned char unk_E3C8B4;
extern unsigned char unk_E3C8B8;
extern int dword_24FD3A0;
extern int dword_24FD258;

extern void *__cdecl Mat_ComposeTwoThenCopy8(_DWORD *, int, void *);
extern int Battle_PresentationFileGate(void);
extern int __cdecl BdLinkTask_Register_63E9C0(int, int, int, int list_head, int);
extern int sub_63F9D0(void);
extern void sub_63F970(void);
extern int __cdecl BdTransSummonStream(_DWORD *, _BYTE *);
extern int __cdecl sub_4A29A0(int, int, int);
extern int __cdecl BdPlaySE(unsigned int *, int, unsigned int);
extern int __cdecl BattleFile_CharacterLoad(int, int);
extern unsigned __int8 *__cdecl BattleTimQueue_EnqueueType1(unsigned __int8 *);
extern _WORD *au_re_BdLinkTask_79(void);
extern _WORD *sub_63FAA0(void);
extern int sub_640390(void);
extern int __cdecl au_re_BdLinkTask_78(int callback);
extern void *GetPtr_209FAB8(void);
extern _WORD *au_re_BdLinkTask_81(void);
extern int sub_63F930(void);
extern _WORD *au_re_BdLinkTask_82(void);
extern int __cdecl BdPlaySummonStream(unsigned int, int, unsigned int);
extern _WORD *au_re_BdLinkTask_80(void);
extern BOOL __cdecl BattleMenu_IdMatches_1D6BBD8(int);
extern void __cdecl Table4x24_Clear_1D6BBB8(int);
extern char __cdecl BattleAction_ApplyEventRecords(unsigned __int8 *result_event, int count);
extern char *sub_63F780(void);
extern int sub_63F8F0(void);
extern int *__cdecl FillWordPairStride2C_1D989B8(__int16, int);
extern int __cdecl sub_641AF0(int);
extern int __cdecl sub_641EA0(int);
extern int __cdecl sub_641E60(int);

int __cdecl GF_191Doomtrain_SequenceTaskDriver(int arg_0)
{
    unsigned int *src;
    unsigned int *dst;
    int n;
    int flags;
    int t;
    int a;
    int rec;

    src = (unsigned int *)&dword_1D97778;
    dst = (unsigned int *)&unk_24FBDA8;
    for (n = 0; n < 8; ++n)
        dst[n] = src[n];
    Mat_ComposeTwoThenCopy8((_DWORD *)&dword_1D97778, (int)&dword_24FBE88, dword_24FBF90);

    flags = (int)battle_to_update_flags_dword_1D96A9C;
    if (flags & 0x201) {
        if (flags & 1)
            return 0;
        if (Battle_PresentationFileGate() < 0)
            return 0;
    }

    if (*(__int16 *)(arg_0 + 0x0C) == 0) {
        BdLinkTask_Register_63E9C0(
            (int)&unk_E3CA88,
            (int)&dword_24FBE88,
            (int)byte_24FC290,
            (int)dword_24FC330,
            0);
        sub_63F9D0();
        sub_63F970();
        BdTransSummonStream((_DWORD *)&unk_F78380, &unk_24FC280);
        dword_24FC28C = (unsigned int)sub_4A29A0((int)&unk_E3C774, 1, 0x80);
    }

    t = *(__int16 *)(arg_0 + 0x0C);

    if (t < 0x1E) {
        if (t == 4) {
            BdPlaySE((unsigned int *)&unk_E3C8A8, 0, 0x80u);
            goto loc_63F708;
        }
        if (t == 5) {
            BattleFile_CharacterLoad(0x22B, dword_24FD3A0 + 0x10000);
            goto loc_63F708;
        }
        if (t == 0xF) {
            if (Battle_PresentationFileGate() < 0)
                return 0;
            BattleTimQueue_EnqueueType1((unsigned __int8 *)(dword_24FD3A0 + 0x10000));
            BattleFile_CharacterLoad(0x22C, dword_24FD3A0);
            au_re_BdLinkTask_79();
            goto loc_63F708;
        }
        if (t == 1) {
            sub_63FAA0();
            goto loc_63F708;
        }
        if (t == 0x14) {
            sub_640390();
            au_re_BdLinkTask_78((int)sub_641AF0);
            goto loc_63F705;
        }
        goto loc_63F708;
    }

    a = t - 0x1E;
    if (a < 0xF) {
        if (a != 0)
            goto loc_63F708;
        if (Battle_PresentationFileGate() < 0)
            return 0;
        BattleFile_CharacterLoad(0x22D, dword_24FD3A0 + 0x10000);
        goto loc_63F708;
    }

    a -= 0xF;
    if (a < 0xF)
        goto loc_63F708;
    a -= 0xF;
    if (a < 0x19)
        goto loc_63F708;
    a -= 0x19;
    if (a < 0x12) {
        if (a == 0) {
            if (Battle_PresentationFileGate() < 0)
                return 0;
            BattleFile_CharacterLoad(0x22E, (int)GetPtr_209FAB8());
            au_re_BdLinkTask_81();
            goto loc_63F708;
        }
        if (a != 0xA)
            goto loc_63F708;
        if (Battle_PresentationFileGate() < 0)
            return 0;
        goto loc_63F4D2;
    }

    a -= 0x12;
    if (a < 0x14) {
        if (a != 0)
            goto loc_63F708;
        sub_63F930();
        au_re_BdLinkTask_82();
        goto loc_63F708;
    }

    a -= 0x14;
    if (a < 0x24) {
        if (a != 1)
            goto loc_63F708;
        BdPlaySummonStream(0x80u, 0, 0x60u);
        au_re_BdLinkTask_78((int)sub_641EA0);
        goto loc_63F708;
    }

    a -= 0x24;
    if (a < 9) {
        if (a != 1)
            goto loc_63F708;
        BdPlaySE((unsigned int *)&unk_E3C8AC, 0, 0x80u);
        goto loc_63F708;
    }

    a -= 9;
    if (a < 0x19) {
        if (a == 0) {
            BattleFile_CharacterLoad(0x22F, (int)GetPtr_209FAB8());
            goto loc_63F708;
        }
        if (a != 0xA)
            goto loc_63F708;
        goto loc_63F65B;
    }

    a -= 0x19;
    if (a < 0x64)
        goto loc_63F708;
    a -= 0x64;
    if (a < 0x14) {
        if (a == 1) {
            BdPlaySE((unsigned int *)&unk_E3C8B0, 0, 0x80u);
            BdPlaySummonStream(0x80u, 0, 0x60u);
            goto loc_63F708;
        }
        if (a != 0)
            goto loc_63F708;
        BattleFile_CharacterLoad(0x230, (int)GetPtr_209FAB8());
        goto loc_63F708;
    }

    a -= 0x14;
    if (a < 0x16)
        goto loc_63F653;
    a -= 0x16;
    if (a < 0x14) {
        if (a == 1) {
            BdPlaySE((unsigned int *)&unk_E3C8B4, 0, 0x80u);
            goto loc_63F708;
        }
        if (a != 0)
            goto loc_63F708;
        BdPlaySummonStream(0x80u, 0, 0x60u);
        BattleFile_CharacterLoad(0x231, (int)GetPtr_209FAB8());
        goto loc_63F708;
    }

    a -= 0x14;
    if (a < 0xA)
        goto loc_63F653;

    a -= 0xA;
    if (a < 0x28) {
        if (a != 1)
            goto loc_63F708;
        BdPlaySummonStream(0x80u, 0, 0x60u);
        goto loc_63F708;
    }

    a -= 0x28;
    if (a >= 0x12)
        goto loc_63F708;
    if (a == 0xC) {
        BdPlaySE((unsigned int *)&unk_E3C8B8, 0, 0x80u);
        goto loc_63F708;
    }
    if (a == 0) {
        au_re_BdLinkTask_80();
        BattleTimQueue_EnqueueType1((unsigned __int8 *)(dword_24FD3A0 + 0x10000));
        goto loc_63F705;
    }
    if (a == 1) {
        au_re_BdLinkTask_78((int)sub_641E60);
        goto loc_63F705;
    }
    if (a != 0xF)
        goto loc_63F708;
    if (BattleMenu_IdMatches_1D6BBD8((int)dword_24FC28C))
        Table4x24_Clear_1D6BBB8((int)dword_24FC28C);
    goto loc_63F705;

loc_63F653:
    if (a != 0)
        goto loc_63F708;
loc_63F65B:
    if (Battle_PresentationFileGate() < 0)
        return 0;
loc_63F4D2:
    BdTransSummonStream((_DWORD *)GetPtr_209FAB8(), &unk_24FC280);
    goto loc_63F708;

loc_63F705:
    ;
loc_63F708:
    if (*(__int16 *)(arg_0 + 0x0C) == 0x1A4) {
        rec = *(int *)(dword_24FD258 + 4);
        BattleAction_ApplyEventRecords(
            *(unsigned __int8 **)(rec + 8),
            *(unsigned __int8 *)(rec + 0x10));
    }
    ++*(__int16 *)(arg_0 + 0x0C);
    if (*(__int16 *)(arg_0 + 0x0C) > 0x1A7) {
        sub_63F780();
        sub_63F8F0();
        FillWordPairStride2C_1D989B8(0, 0);
        return 2;
    }
    return 0;
}
```
