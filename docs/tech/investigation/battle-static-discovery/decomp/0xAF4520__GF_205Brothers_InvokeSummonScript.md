# GF_205Brothers_InvokeSummonScript @ 0xAF4520

- Instr (live): 24
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=103
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=47
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=104
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl GF_205Brothers_InvokeSummonScript(int)
- Notes parent: FamilyB 0x5D. xorEAX_6 EAX jeté. A3 table[0] depuis dword_2796D6C ; Magic_b_01 depuis dword_2796D68. Init + AFFC50 + AFF280. BS_Memset(head, unk_2796D48, 0x10, 1). Register(tick, head). add esp,1Ch. EAX=B8 &dword_2796D30. Occupancy 1+2 / 0xD0 / 0x1D0 / GFSG 0x44 / K_GF 0x84 absents.

## C réconcilié

```c
/* GF_205Brothers_InvokeSummonScript @ 0xAF4520
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 24 instr, size 0x5D, end 0xAF457D. IDA type _DWORD *__cdecl(int).
 * cdecl, ebp frame, no locals, no ESI/EDI. retn C3 (not retn N). FUNC_THUNK=0 (flags 0x5400).
 * Bytes: 55 / 8B EC / E8 28 0C 07 00 / 8B 55 08 / A1 6C 6D 79 02 /
 *   8B 0D 68 6D 79 02 / 52 / A3 68 8A 79 02 / 89 0D 6C 8A 79 02 /
 *   E8 39 00 00 00 / E8 04 B7 00 00 / E8 2F AD 00 00 /
 *   6A 01 / 6A 10 / 68 48 6D 79 02 / 68 30 6D 79 02 / E8 9C 3D A1 FF /
 *   68 90 4B AF 00 / 68 30 6D 79 02 / E8 ED 3D A1 FF /
 *   83 C4 1C / B8 30 6D 79 02 / 5D / C3.
 * add esp,1Ch = Init 4 + BS_Memset 16 + Register 8. xorEAX_6 / AFFC50 / AFF280: 0 args.
 * Widths: DWORD A3 / 89 0D / B8. No 66. No BYTE store. push 1 and 10h imm8.
 * Return EAX = &dword_2796D30 (B8), not Register/Init leftover. xorEAX_6 EAX unused.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No setcc. No jcc. No jpt. No domain::.
 */

extern int dword_2796D6C;                 /* 0x2796D6C per-GF .00 file ptr */
extern int dword_2796D68;                 /* 0x2796D68 per-GF .01 file ptr */
extern int g_MagicFileChunkTable[];        /* 0x2798A68 [0]=.00 */
extern int Magic_b_01;                    /* 0x2798A6C == table[1] */
extern _DWORD dword_2796D30[4];           /* 0x2796D30 list head, 16 bytes */
extern unsigned char unk_2796D48;        /* BS_Memset template */

extern int __cdecl xorEAX_6(void);
extern int __cdecl GF_205Brothers_InitSummonContext(int);
extern int __cdecl sub_AFFC50(void);
extern int __cdecl sub_AFF280(void);
extern int __cdecl BS_Memset(int, _WORD *, unsigned int, int);
extern int __cdecl BdLinkTask_Register(int list_head, int callback);
extern unsigned int __cdecl GF_205Brothers_SequenceTick(void);

_DWORD *__cdecl GF_205Brothers_InvokeSummonScript(int arg_0)
{
    xorEAX_6(); /* EAX leftover unused */

    g_MagicFileChunkTable[0] = dword_2796D6C; /* A3 68 8A 79 02 */
    Magic_b_01 = dword_2796D68;                /* 89 0D 6C 8A 79 02 */

    GF_205Brothers_InitSummonContext(arg_0);    /* push edx=arg_0 before stores; call after */
    sub_AFFC50();
    sub_AFF280();

    BS_Memset((int)dword_2796D30, (_WORD *)&unk_2796D48, 0x10u, 1);
    BdLinkTask_Register((int)dword_2796D30, (int)GF_205Brothers_SequenceTick);

    return dword_2796D30; /* B8 30 6D 79 02 */
}
```
