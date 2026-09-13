# au_re_BdLinkTask_0 @ 0x506C10

- Instr (live): 6
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl au_re_BdLinkTask_0(int callback)
- Notes parent: cdecl Register(list_head, callback) add esp,8. push offset unk_1D986B8. Retour EAX nœud. Occupancy/GetRandomInt/0xD0/0x1D0 absents. Pas de BYTE [node+0x0D].

## C réconcilié

```c
/* au_re_BdLinkTask_0 @ 0x506C10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 6 instr, size 0x13, end 0x506C23. cdecl, 1 arg. No saved regs. retn C3.
 * EAX=[esp+4] callback DWORD; push callback; push offset unk_1D986B8;
 * call BdLinkTask_Register; add esp,8; retn. Return EAX = node from Register.
 * Occupancy / GetRandomInt / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No 66. No BYTE [node+0x0D] (unlike sibling 0x500DD0). No jump table.
 * No domain::.
 */

extern unsigned int unk_1D986B8; /* 0x1D986B8 auxiliary BdLink list head (IDA untyped) */

extern int __cdecl BdLinkTask_Register(int list_head, int callback);

int __cdecl au_re_BdLinkTask_0(int callback)
{
    return BdLinkTask_Register((int)&unk_1D986B8, callback);
}
```
