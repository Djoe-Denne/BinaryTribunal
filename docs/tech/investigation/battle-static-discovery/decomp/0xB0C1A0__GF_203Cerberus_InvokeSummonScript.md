# GF_203Cerberus_InvokeSummonScript @ 0xB0C1A0

- Instr (live): 25
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=47
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl GF_203Cerberus_InvokeSummonScript(int)
- Notes parent: FamilyB 0x62 (25 instr vs Brothers/Eden 24). Extra: InitSummonContext 0-arg (or al,1 dword_1CA8850) avant xorEAX_6. A3 table[0] depuis dword_2796DDC ; Magic_b_01 depuis dword_2796DD8. sub_B0C210(arg_0) + B18950 + B17F80. BS_Memset(head, unk_2796DB8, 0x10, 1). Register(tick, head). add esp,1Ch. EAX=B8 &dword_2796DA8. Occupancy 1+2 / 0xD0 / 0x1D0 / GFSG 0x44 / K_GF 0x84 absents.

## C réconcilié

```c
/* GF_203Cerberus_InvokeSummonScript @ 0xB0C1A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 25 instr, size 0x62, end 0xB0C202. IDA type _DWORD *__cdecl(int).
 * cdecl, ebp frame, FRSIZE 0, no locals, no ESI/EDI. retn C3 (not retn N).
 * FUNC_THUNK=0 (flags 0x5410 FUNC_FRAME). 25 vs Brothers/Eden 24: extra 0-arg
 * InitSummonContext CALL (5 bytes) before xorEAX_6.
 * Bytes: 55 / 8B EC / E8 28 F4 94 FF / E8 A3 8F 05 00 / 8B 55 08 /
 *   A1 DC 6D 79 02 / 8B 0D D8 6D 79 02 / 52 / A3 68 8A 79 02 /
 *   89 0D 6C 8A 79 02 / E8 44 00 00 00 / E8 7F C7 00 00 /
 *   E8 AA BD 00 00 / 6A 01 / 6A 10 / 68 B8 6D 79 02 / 68 A8 6D 79 02 /
 *   E8 17 C1 9F FF / 68 20 C8 B0 00 / 68 A8 6D 79 02 / E8 68 C1 9F FF /
 *   83 C4 1C / B8 A8 6D 79 02 / 5D / C3.
 * add esp,1Ch = sub_B0C210 4 + BS_Memset 16 + Register 8.
 * InitSummonContext / xorEAX_6 / B18950 / B17F80: 0 args.
 * Widths: DWORD A3 / 89 0D / B8. No 66. No BYTE store. push 1 and 10h imm8.
 * Return EAX = &dword_2796DA8 (B8), not Register/Init leftover.
 * xorEAX_6 EAX unused. InitSummonContext EAX unused (overwritten by xorEAX_6).
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No setcc. No jcc. No jpt. No domain::.
 */

extern int dword_2796DDC;                 /* 0x2796DDC per-GF .00 file ptr */
extern int dword_2796DD8;                 /* 0x2796DD8 per-GF .01 file ptr */
extern int g_MagicFileChunkTable[];        /* 0x2798A68 [0]=.00 */
extern int Magic_b_01;                    /* 0x2798A6C == table[1] */
extern _DWORD dword_2796DA8[4];           /* 0x2796DA8 list head, 16 bytes */
extern unsigned char unk_2796DB8;        /* BS_Memset template */

extern int __cdecl GF_203Cerberus_InitSummonContext(void);
extern int __cdecl xorEAX_6(void);
extern int __cdecl sub_B0C210(int);
extern int __cdecl sub_B18950(void);
extern int __cdecl sub_B17F80(void);
extern int __cdecl BS_Memset(int, _WORD *, unsigned int, int);
extern int __cdecl BdLinkTask_Register(int list_head, int callback);
extern unsigned int __cdecl GF_203Cerberus_SequenceTick(void);

_DWORD *__cdecl GF_203Cerberus_InvokeSummonScript(int arg_0)
{
    GF_203Cerberus_InitSummonContext(); /* 0-arg; or al,1 on dword_1CA8850; EAX unused */
    xorEAX_6(); /* EAX leftover unused */

    g_MagicFileChunkTable[0] = dword_2796DDC; /* A3 68 8A 79 02 */
    Magic_b_01 = dword_2796DD8;                /* 89 0D 6C 8A 79 02 */

    sub_B0C210(arg_0);    /* push edx=arg_0 before stores; call after */
    sub_B18950();
    sub_B17F80();

    BS_Memset((int)dword_2796DA8, (_WORD *)&unk_2796DB8, 0x10u, 1);
    BdLinkTask_Register((int)dword_2796DA8, (int)GF_203Cerberus_SequenceTick);

    return dword_2796DA8; /* B8 A8 6D 79 02 */
}
```
