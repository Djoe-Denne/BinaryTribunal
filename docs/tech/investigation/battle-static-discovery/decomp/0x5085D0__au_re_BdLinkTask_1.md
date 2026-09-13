# au_re_BdLinkTask_1 @ 0x5085D0

- Instr (live): 8
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=45
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=43
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl au_re_BdLinkTask_1(int ctx)
- Notes parent: case dispatcher `'p'` (112). BYTE `[node+0Dh]=0` (`C6`) ; DWORD `[node+10h]=ctx` (`89`). `add esp,4`. EAX=8 pas le nœud. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Worker `BattleTask_CameraBarrier70_Worker` @ 0x5085F0 sans namespace.

## C réconcilié

```c
/* au_re_BdLinkTask_1 @ 0x5085D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 8 instr, size 0x1E, end 0x5085EE. cdecl, 1 arg. No saved regs. retn C3.
 * Call au_re_BdLinkTask(BattleTask_CameraBarrier70_Worker @ 0x5085F0); add esp,4.
 * Widths: BYTE [eax+0Dh]=0 (C6 40 0D 00); DWORD [eax+10h]=ctx (89 48 10). No 66.
 * EAX return = 8 (B8 08 000000), not the task node. Node only for the two stores.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Caller: BattleTaskQueue_Dispatch jumptable case 112 ('p'). No domain::.
 */

int __cdecl au_re_BdLinkTask(int callback);
int __cdecl BattleTask_CameraBarrier70_Worker(int task);

int __cdecl au_re_BdLinkTask_1(int ctx)
{
    int node;

    node = au_re_BdLinkTask((int)BattleTask_CameraBarrier70_Worker);
    *(unsigned char *)(node + 0x0D) = 0; /* C6 40 0D 00 BYTE; callee already zeros it */
    *(int *)(node + 0x10) = ctx;         /* 89 48 10 DWORD; worker reads this as ctx */
    return 8;                            /* B8 08 000000 */
}
```
