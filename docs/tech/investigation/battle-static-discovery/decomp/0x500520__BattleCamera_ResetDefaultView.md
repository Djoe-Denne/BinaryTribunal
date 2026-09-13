# BattleCamera_ResetDefaultView @ 0x500520

- Instr (live): 22
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=85
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=79
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=126
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleCamera_ResetDefaultView(void)
- Notes parent: WORD zeros 03E then 03C (AX=0). 2× ParseCamera(0xA0,0x6C)+parseCamera2(0x200) réel, pas une boucle. add esp,18h après A1, EAX préservé. or al,4. BYTE 03A=0x11. Retour flags|4. Occupancy/GetRandomInt absents.

## C réconcilié

```c
/* BattleCamera_ResetDefaultView @ 0x500520
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 22 instr, size 0x68, end 0x500588. IDA type int() -> int __cdecl(void).
 * Deferred cdecl: 6 dword args, add esp,18h after last call (EAX preserved).
 * Occupancy / GetRandomInt / ja/jg/setcc/jpt absent.
 * WORD 66-prefix: 1D8E03E, 1D8E03C, 1D8E038. BYTE 1D8E03A. DWORD flags A1/A3.
 * Return EAX = flags dword with bit 2 (0x4) set. No Hex-Rays. No domain::.
 */

extern int __cdecl j_BattleDebug_CopyStructuresUNK(void);
extern int __cdecl Call_Bs_ParseCamera(int x, int y);
extern int __cdecl Call_Bs_parseCamera2(int fov);

extern unsigned short word_1D8E038; /* 0x1D8E038 WORD FOV/projection */
extern unsigned char byte_1D8E03A;  /* 0x1D8E03A BYTE */
extern unsigned short word_1D8E03C; /* 0x1D8E03C WORD shake/offset */
extern unsigned short word_1D8E03E; /* 0x1D8E03E WORD shake/offset */
extern unsigned int battle_to_update_flags_dword_1D96A9C; /* 0x1D96A9C DWORD */

int __cdecl BattleCamera_ResetDefaultView(void)
{
    unsigned int flags;

    j_BattleDebug_CopyStructuresUNK();

    /* xor eax,eax; push 6Ch; push 0A0h; WORD AX stores before first call */
    word_1D8E03E = 0; /* 66 A3 */
    word_1D8E03C = 0; /* 66 A3 */
    Call_Bs_ParseCamera(0xA0, 0x6C);

    word_1D8E038 = 0x200; /* 66 C7 05 ... 0002 */
    Call_Bs_parseCamera2(0x200);

    /* duplicate pair is real, not a loop */
    Call_Bs_ParseCamera(0xA0, 0x6C);
    word_1D8E038 = 0x200;
    Call_Bs_parseCamera2(0x200);

    flags = battle_to_update_flags_dword_1D96A9C; /* A1 */
    /* add esp,18h — deferred cleanup, EAX preserved */
    flags |= 4u; /* 0C 04 or al,4 */
    byte_1D8E03A = 0x11; /* C6 05 ... 11 */
    battle_to_update_flags_dword_1D96A9C = flags; /* A3 */
    return (int)flags;
}
```
