# MAG_223_METEOR @ 0xA8F890

- Instr (live): 24
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=25
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=157
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=80
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl MAG_223_METEOR(int)
- Notes parent: FamilyB entry 0x5D. xorEAX_6; seed [0]/Magic_b_01 from dword_2796BA4/BA0; sub_A8F8F0(arg_0)+A9B1B0+A9A7E0; BS_Memset(ctx, tmpl, 0x10, 1); BdLink(ctx, SequenceTick); add esp,1Ch; EAX=&dword_2796B70. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. DWORD only.

## C réconcilié

```c
/* MAG_223_METEOR @ 0xA8F890
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 24 instr, size 0x5D, end 0xA8F8ED. cdecl, 1 arg, retn C3. Saved ebp. FRSIZE 0.
 * add esp,1Ch once (7 dword pushes: sub_A8F8F0 1 + BS_Memset 4 + BdLink 2).
 * EAX return = offset dword_2796B70 (list head / ctx), not leftover from last call.
 * Occupancy 1+2 / slot 0xD0 / actor 0x9C / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * Widths: DWORD A3 g_MagicFileChunkTable, 89 0D Magic_b_01, B8 return. No 66 WORD, no BYTE.
 * Straight-line: no loc_ / jpt / setcc / ja / jg. No domain::.
 */

typedef unsigned int _DWORD;
typedef unsigned short _WORD;

int xorEAX_6(void);
int __cdecl sub_A8F8F0(int);
int sub_A9B1B0(void);
int sub_A9A7E0(void);
int __cdecl BS_Memset(int list_head, _WORD *node_array, unsigned int stride, int count);
int __cdecl BdLinkTask_Register(int list_head, int callback);
unsigned int MAG_223_METEOR_SequenceTick(void);

extern int dword_2796BA4;            /* Meteor .00 arena ptr */
extern int dword_2796BA0;            /* Meteor .01 arena ptr */
extern int g_MagicFileChunkTable[];   /* 0x2798A68, [0]=.00 */
extern int Magic_b_01;               /* 0x2798A6C == g_MagicFileChunkTable[1] */
extern _DWORD dword_2796B70[4];      /* list_head / ctx, IDA size 16 */
extern _WORD unk_2796B80[];           /* 0x10-byte BS_Memset template */

_DWORD *__cdecl MAG_223_METEOR(int arg_0)
{
    xorEAX_6();
    g_MagicFileChunkTable[0] = dword_2796BA4;
    Magic_b_01 = dword_2796BA0;
    sub_A8F8F0(arg_0);
    sub_A9B1B0();
    sub_A9A7E0();
    BS_Memset((int)dword_2796B70, unk_2796B80, 0x10u, 1);
    BdLinkTask_Register((int)dword_2796B70, (int)MAG_223_METEOR_SequenceTick);
    return dword_2796B70;
}
```
