# GF_204Alexander_InvokeSummonScript @ 0xAFFCA0

- Instr (live): 24
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=47
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=52
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=72
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl GF_204Alexander_InvokeSummonScript(int)
- Notes parent: FamilyB Alexander. xorEAX_6 puis copies DWORD dword_2796DA4/DA0 -> g_MagicFileChunkTable[0] / Magic_b_01. InitSummonContext(arg_0) + sub_B0C150 + sub_B0B780. BS_Memset(dword_2796D70, unk_2796D80, 0x10, 1) puis BdLinkTask_Register(list, GF_204Alexander_SequenceTick @ 0xB00310). add esp,1Ch. EAX=&dword_2796D70. Occupancy 1+2 / 0xD0 / 0x1D0 / GFSG 0x44 / K_GF 0x84 absents. DWORD only.

## C réconcilié

```c
/* GF_204Alexander_InvokeSummonScript @ 0xAFFCA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 24 instr, size 0x5D, end 0xAFFCFD. IDA type _DWORD *__cdecl(int).
 * cdecl, 1 arg [ebp+8]. EBP frame, FRSIZE 0, no locals, no ESI/EDI. retn C3.
 * add esp,1Ch once (7 dwords: Init arg + 4 BS_Memset + 2 Register).
 * DWORD stores only (A3 / 89 0D / B8). No 66, no byte stores, no loc_/jpt_/setcc/ja/jg.
 * Return EAX = offset dword_2796D70 (B8), not leftover callee EAX.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No packed struct. No domain::.
 */

typedef unsigned int _DWORD;
typedef unsigned short _WORD;

int xorEAX_6(void);
int __cdecl GF_204Alexander_InitSummonContext(int);
int sub_B0C150(void);
int sub_B0B780(void);
int __cdecl BS_Memset(int list_head, _WORD *node_array, unsigned int stride, int count);
int __cdecl BdLinkTask_Register(int list_head, int callback);
unsigned int GF_204Alexander_SequenceTick(void);

extern int dword_2796DA4;            /* Alexander .00 arena ptr */
extern int dword_2796DA0;            /* Alexander .01 arena ptr */
extern int g_MagicFileChunkTable[];   /* 0x2798A68, [0]=.00 */
extern int Magic_b_01;               /* 0x2798A6C == g_MagicFileChunkTable[1] */
extern _DWORD dword_2796D70[4];      /* list_head / ctx, IDA size 16 */
extern unsigned char unk_2796D80;   /* 0x10-byte BS_Memset template (IDA size 1) */

_DWORD *__cdecl GF_204Alexander_InvokeSummonScript(int arg_0)
{
    xorEAX_6();
    g_MagicFileChunkTable[0] = dword_2796DA4;
    Magic_b_01 = dword_2796DA0;
    GF_204Alexander_InitSummonContext(arg_0);
    sub_B0C150();
    sub_B0B780();
    BS_Memset((int)dword_2796D70, (_WORD *)&unk_2796D80, 0x10u, 1);
    BdLinkTask_Register((int)dword_2796D70, (int)GF_204Alexander_SequenceTick);
    return dword_2796D70;
}
```
