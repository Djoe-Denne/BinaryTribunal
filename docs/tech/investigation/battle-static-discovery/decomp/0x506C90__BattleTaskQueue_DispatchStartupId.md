# BattleTaskQueue_DispatchStartupId @ 0x506C90

- Instr (live): 29
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleTaskQueue_DispatchStartupId(int node)
- Notes parent: movsx WORD +2 ; jz 1002→sub_506CF0 ; fallthrough 1003→sub_506DE0 ; else loc_506CD9 poke nœud existant. C6 BYTE +0x0D ; 89 DWORD +0x10 (esi). Toujours EAX=8. add esp,4. Occupancy/GetRandomInt/0xD0/0x1D0 absents.

## C réconcilié

```c
/* BattleTaskQueue_DispatchStartupId @ 0x506C90
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 29 instr, size 0x5B, end 0x506CEB. IDA type int __cdecl(int node).
 * movsx WORD [esi+2]; sub eax,3EAh; jz loc_506CBE (1002);
 * dec eax; jnz loc_506CD9; fallthrough = 1003.
 * C6 40 0D 00 BYTE [eax+0x0D]=0. 89 70 10 DWORD [eax+0x10]=esi. No 66.
 * Always B8 08; retn. jz/jnz only. No ja/jg. No jpt.
 * Occupancy / GetRandomInt / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No Hex-Rays. No domain::.
 */

extern int __cdecl au_re_BdLinkTask(int callback); /* 0x500DD0 add esp,4 EAX=node */
extern int __cdecl sub_506CF0(int); /* 0x506CF0 callback offset only */
extern int __cdecl sub_506DE0(int); /* 0x506DE0 callback offset only */

int __cdecl BattleTaskQueue_DispatchStartupId(int node)
{
    int task_id;
    int bd;

    task_id = (int)*(short *)((char *)node + 2); /* 0F BF 46 02 */

    if (task_id == 0x3EA) { /* 1002; jz loc_506CBE */
        bd = au_re_BdLinkTask((int)sub_506CF0);
        *(unsigned char *)(bd + 0x0D) = 0;
        *(int *)(bd + 0x10) = node; /* esi = original node */
        return 8;
    }
    if (task_id == 0x3EB) { /* 1003; fallthrough after dec */
        bd = au_re_BdLinkTask((int)sub_506DE0);
        *(unsigned char *)(bd + 0x0D) = 0;
        *(int *)(bd + 0x10) = node;
        return 8;
    }
    /* loc_506CD9: EAX reloaded from arg; esi still original node */
    *(unsigned char *)(node + 0x0D) = 0;
    *(int *)(node + 0x10) = node; /* self-pointer */
    return 8;
}
```
