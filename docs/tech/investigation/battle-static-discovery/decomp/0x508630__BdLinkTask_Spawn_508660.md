# BdLinkTask_Spawn_508660 @ 0x508630

- Instr (live): 12
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLinkTask_Spawn_508660(int arg_0, _BYTE *arg_4)
- Notes parent: `au_re_BdLinkTask_0(sub_508660)` add esp,4. jz NULL → EAX=0. BYTE `[node+0x0C]=0` (pas +0x0D). DWORD `+0x10`/`+0x14`. BYTE `*arg_4=0`. Occupancy / 0xD0 / 0x1D0 / 0x44 absents.

## C réconcilié

```c
/* BdLinkTask_Spawn_508660 @ 0x508630
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 12 instr, size 0x27, end 0x508657. cdecl, 2 args. No saved regs. retn C3.
 * push offset sub_508660; call au_re_BdLinkTask_0; add esp,4.
 * test eax,eax / jz locret_508656 (shared C3). EAX leftover = node or 0.
 * BYTE [node+0x0C]=0 (C6 40 0C 00). DWORD [node+0x10]=arg_0 (89 48 10).
 * DWORD [node+0x14]=arg_4 (89 48 14). BYTE *[arg_4]=0 (C6 01 00).
 * Occupancy / GetRandomInt / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No 66. No jump table. No domain::.
 */

extern int __cdecl au_re_BdLinkTask_0(int callback);
int __cdecl sub_508660(int node); /* worker callback; not this function */

int __cdecl BdLinkTask_Spawn_508660(int arg_0, _BYTE *arg_4)
{
    int node;

    node = au_re_BdLinkTask_0((int)sub_508660);
    if (!node) /* test eax,eax / jz locret_508656 */
        return 0;

    *(unsigned char *)(node + 0x0C) = 0; /* C6 40 0C 00 BYTE */
    *(int *)(node + 0x10) = arg_0;         /* 89 48 10 DWORD */
    *(int *)(node + 0x14) = (int)arg_4;   /* 89 48 14 DWORD */
    *arg_4 = 0;                            /* C6 01 00 BYTE */
    return node;
}
```
