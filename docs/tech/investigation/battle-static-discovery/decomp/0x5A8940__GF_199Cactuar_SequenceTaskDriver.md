# GF_199Cactuar_SequenceTaskDriver @ 0x5A8940

- Instr (live): 118
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=133
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=122
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=151
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GF_199Cactuar_SequenceTaskDriver(int)
- Notes parent: WORD [task+0x0C] 66. flags & 0x201 early 0 sans inc. Init t==0: Register5, Trans E94910, rand (EAX ignore), sub_4A29A0 -> dword_225A834. Cascade signed jge/jl movsx. Fire 10/15/53/76/145/148. setnle ax>151 -> 2. add esp 0C/28/18/14/0C/4 + loc_5A8AC1 +4. Occupancy/0x44/K_GF absents. Pas de Hex-Rays.

## C réconcilié

```c
/* GF_199Cactuar_SequenceTaskDriver @ 0x5A8940
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 118 instr, size 0x1A0, end 0x5A8AE0. IDA type int __cdecl(int). No domain::.
 * cdecl, 1 arg. frsize 0. push esi after the flag gate. WORD at task+0x0C.
 * add esp: 0Ch (Mat 3), 28h (init 5+2+0+3), 18h (SE+stream), 14h (SE+trans),
 * 0Ch (stream), 4 (IdMatches), loc_5A8AC1 add esp,4 (Clear and also task24).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Signed jge/jl on movsx. setnle = (short)counter > 151. No packed struct.
 */

extern unsigned int dword_1D97778;
extern short word_2259950;
extern unsigned int dword_2259978[8];
extern unsigned int battle_to_update_flags_dword_1D96A9C;
extern unsigned int dword_2259A08[4];
extern unsigned char unk_225A838;
extern unsigned char unk_CF35BC;
extern unsigned char unk_225A8D4;
extern unsigned char unk_E94910;
extern unsigned char unk_E94914;
extern unsigned char unk_CF3318;
extern unsigned char unk_CF3558;
extern unsigned char unk_CF355C;
extern unsigned int dword_225A834;

extern void *__cdecl Mat_ComposeTwoThenCopy8(unsigned int *, int, void *);
extern int __cdecl BdLinkTask_Register_63E9C0(int, int, int, int, int);
extern int __cdecl BdTransSummonStream(unsigned int *, unsigned char *);
extern int au_re__rand(void);
extern int __cdecl sub_4A29A0(int, int, int);
extern int __cdecl au_re_BdLinkTask_24(int callback);
extern int __cdecl BdPlaySE(unsigned int *, int, unsigned int);
extern int __cdecl BdPlaySummonStream(unsigned int, int, unsigned int);
extern unsigned short *au_re_BdLinkTask_25(void);
extern unsigned short *au_re_BdLinkTask_26(void);
extern int __cdecl BattleMenu_IdMatches_1D6BBD8(int);
extern void __cdecl Table4x24_Clear_1D6BBB8(int);
extern int __cdecl sub_5A8C20(int);

int __cdecl GF_199Cactuar_SequenceTaskDriver(int arg_0)
{
    short *counter;
    int t;

    Mat_ComposeTwoThenCopy8(&dword_1D97778, (int)&word_2259950, dword_2259978);
    if (battle_to_update_flags_dword_1D96A9C & 0x201)
        return 0;

    counter = (short *)((char *)arg_0 + 0x0C);

    if (*counter == 0) {
        BdLinkTask_Register_63E9C0(
            (int)&unk_CF35BC,
            (int)&word_2259950,
            (int)&unk_225A838,
            (int)dword_2259A08,
            0);
        BdTransSummonStream((unsigned int *)&unk_E94910, &unk_225A8D4);
        au_re__rand();
        dword_225A834 = (unsigned int)sub_4A29A0((int)&unk_CF3318, 1, 0x80);
    }

    t = *counter;

    if (t < 0x0F) {
        if (t == 0x0A)
            au_re_BdLinkTask_24((int)sub_5A8C20);
    } else if (t < 0x14) {
        if (t == 0x0F) {
            BdPlaySE((unsigned int *)&unk_CF3558, 0, 0x80);
            BdPlaySummonStream(0x80, 0, 0x60);
        }
    } else if (t < 0x1E) {
        /* 20..29: cascade hole (jl after sub 5 / cmp 0Ah) */
    } else if (t < 0x35) {
        /* 30..52: cascade hole (jl after sub 0Ah / cmp 17h) */
    } else if (t < 0x41) {
        if (t == 0x35) {
            BdPlaySE((unsigned int *)&unk_CF355C, 0, 0x80);
            BdTransSummonStream((unsigned int *)&unk_E94914, &unk_225A8D4);
            au_re_BdLinkTask_25();
        }
    } else if (t < 0x5E) {
        if (t == 0x4C)
            BdPlaySummonStream(0x80, 0, 0x60);
    } else if (t < 0x7E) {
        /* 94..125: cascade hole (jl after sub 1Dh / cmp 20h) */
    } else if (t < 0x97) {
        if (t == 0x91)
            au_re_BdLinkTask_26();
        else if (t == 0x94) {
            if (BattleMenu_IdMatches_1D6BBD8((int)dword_225A834))
                Table4x24_Clear_1D6BBB8((int)dword_225A834);
        }
    }

    ++*counter;
    return (*counter > 0x97) ? 2 : 0;
}
```
