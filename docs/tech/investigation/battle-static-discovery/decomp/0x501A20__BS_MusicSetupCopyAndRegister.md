# BS_MusicSetupCopyAndRegister @ 0x501A20

- Instr (live): 18
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=29
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=29
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=60
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BS_MusicSetupCopyAndRegister(_DWORD *header, _BYTE *flag)
- Notes parent: Header +4/+8/+0C DWORD. Stores 1D96EA4/E9C/EAC avant call. add esp,4. BYTE [node+0x0C], DWORD [node+0x10]=flag, BYTE *flag=0. EAX=nœud. Occupancy/GetRandomInt absents. C GLM a inversé stores/call.

## C réconcilié

```c
/* BS_MusicSetupCopyAndRegister @ 0x501A20
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 18 instr, size 0x41, end 0x501A61. IDA type int __cdecl(_DWORD *, _BYTE *).
 * cdecl: arg_0 header DWORD*, arg_4 flag BYTE*. No locals, no saved regs, no 66.
 * push offset BS_MusicCommitStagedAKAO then header math, then
 * call au_re_BdLinkTask_0, then 8B 4C 24 0C (flag), add esp,4 (1 DWORD).
 * Stores before call: DWORD 89 0D 1D96EA4, 89 15 1D96E9C, A3 1D96EAC.
 * After: C6 BYTE [node+0x0C]=0, 89 DWORD [node+0x10]=flag, C6 BYTE [flag]=0.
 * Return EAX = node (C6/89 do not clobber EAX). No NULL test.
 * Occupancy / GetRandomInt / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned int dword_1D96EA4; /* 0x1D96EA4 */
extern unsigned int dword_1D96E9C; /* 0x1D96E9C staged AKAO src */
extern unsigned int dword_1D96EAC; /* 0x1D96EAC staged len */

extern int BS_MusicCommitStagedAKAO(void);
extern int __cdecl au_re_BdLinkTask_0(int callback);

int __cdecl BS_MusicSetupCopyAndRegister(unsigned int *header, unsigned char *flag)
{
    int node;

    dword_1D96EA4 = (unsigned int)header + header[1]; /* [eax+4]+eax, 89 0D */
    dword_1D96E9C = (unsigned int)header + header[2]; /* lea edx,[ecx+eax], 89 15 */
    dword_1D96EAC = header[3] - header[2];           /* [eax+0Ch]-ecx, A3 */

    node = au_re_BdLinkTask_0((int)BS_MusicCommitStagedAKAO);
    *(unsigned char *)(node + 0x0C) = 0;           /* C6 40 0C 00, not +0x0D */
    *(unsigned int *)(node + 0x10) = (unsigned int)flag;
    *flag = 0;                                       /* C6 01 00 */
    return node;
}
```
