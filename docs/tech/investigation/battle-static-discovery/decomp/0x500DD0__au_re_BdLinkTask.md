# au_re_BdLinkTask @ 0x500DD0

- Instr (live): 7
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl au_re_BdLinkTask(int callback)
- Notes parent: cdecl Register(list_head, callback) add esp,8. push offset 0x1D96D78. C6 BYTE [eax+0x0D]=0. Retour = nœud EAX. Occupancy/GetRandomInt/0xD0/0x1D0 absents. Pas de test NULL.

## C réconcilié

```c
/* au_re_BdLinkTask @ 0x500DD0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 7 instr, size 0x17, end 0x500DE7. IDA type int __cdecl(int).
 * cdecl: EAX=[esp+4] callback DWORD, push callback, push offset list head,
 * call BdLinkTask_Register, add esp,8.
 * C6 40 0D 00: BYTE [node+0x0D]=0. No 66. No NULL test.
 * Return EAX = node from Register (C6 does not clobber EAX).
 * Occupancy / GetRandomInt / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned int g_BattleTaskQueueListHead[4]; /* 0x1D96D78 _DWORD[4] */

extern int __cdecl BdLinkTask_Register(int list_head, int callback);

int __cdecl au_re_BdLinkTask(int callback)
{
    int node;

    node = BdLinkTask_Register((int)&g_BattleTaskQueueListHead, callback);
    *(unsigned char *)(node + 0x0D) = 0;
    return node;
}
```
