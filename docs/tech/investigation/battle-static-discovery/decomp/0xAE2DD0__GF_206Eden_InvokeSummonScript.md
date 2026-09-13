# GF_206Eden_InvokeSummonScript @ 0xAE2DD0

- Instr (live): 24
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=34
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=40
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=32
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl GF_206Eden_InvokeSummonScript(int)
- Notes parent: FamilyB Eden. xorEAX_6 puis copies DWORD dword_2796D2C/D28 -> g_MagicFileChunkTable[0] / Magic_b_01. InitSummonContext(arg_0) + sub_AF44D0 + sub_AF3B00. BS_Memset(dword_2796CF8, unk_2796D08, 0x10, 1) puis BdLinkTask_Register(list, GF_206Eden_SequenceTick @ 0xAE3470). add esp,1Ch. EAX=&dword_2796CF8. Occupancy 1+2 / 0xD0 / 0x1D0 / GFSG 0x44 / K_GF 0x84 absents. DWORD only.

## C réconcilié

```c
/* GF_206Eden_InvokeSummonScript @ 0xAE2DD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 24 instr, size 0x5D, end 0xAE2E2D. IDA type _DWORD *__cdecl(int).
 * cdecl, 1 arg [ebp+8]. EBP frame, FRSIZE 0, no locals, no ESI/EDI. retn C3.
 * add esp,1Ch once (7 dwords: Init arg + 4 BS_Memset + 2 Register).
 * DWORD stores only (A3 / 89 0D / B8). No 66, no byte stores, no loc_/jpt_/setcc/ja/jg.
 * Return EAX = offset dword_2796CF8 (B8), not leftover callee EAX.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No packed struct. No domain::.
 */

int xorEAX_6(void);
int __cdecl GF_206Eden_InitSummonContext(int);
int sub_AF44D0(void);
int sub_AF3B00(void);
int __cdecl BS_Memset(int list_head, _WORD *node_array, unsigned int stride, int count);
int __cdecl BdLinkTask_Register(int list_head, int callback);
unsigned int GF_206Eden_SequenceTick(void);

extern int dword_2796D2C;
extern int dword_2796D28;
extern int g_MagicFileChunkTable[];
extern int Magic_b_01;
extern _DWORD dword_2796CF8[4];
extern unsigned char unk_2796D08;

_DWORD *__cdecl GF_206Eden_InvokeSummonScript(int arg_0)
{
    xorEAX_6();
    g_MagicFileChunkTable[0] = dword_2796D2C;
    Magic_b_01 = dword_2796D28;
    GF_206Eden_InitSummonContext(arg_0);
    sub_AF44D0();
    sub_AF3B00();
    BS_Memset((int)dword_2796CF8, (_WORD *)&unk_2796D08, 0x10u, 1);
    BdLinkTask_Register((int)dword_2796CF8, (int)GF_206Eden_SequenceTick);
    return dword_2796CF8;
}
```
