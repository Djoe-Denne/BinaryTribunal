# sub_6D2EE0 @ 0x6D2EE0

- Instr (live): 33
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=18
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int sub_6D2EE0(void)
- Notes parent: clone BdLink pump (IDA: 0x508434). call [node+8] cdecl add esp,4. TEST AL,2 unlink (pas occupancy 1+2). WORD 66 C7 [node+0]=0. TEST EDI puis MOV (ZF préservé). dword_2543CC0 head / dword_2543CC4 tail. EAX=kept (EBX). 0xD0/0x1D0/GF+0x44 absents. Caller sub_6D2E50.

## C réconcilié

```c
/* sub_6D2EE0 @ 0x6D2EE0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 33 instr, size 0x4E, end 0x6D2F2E. IDA type int().
 * No args. Saved EBX ESI EDI. retn C3.
 * Indirect FF 56 08 call [node+8](node); add esp,4. TEST AL,2 unlink.
 * 66 C7 06 00 00 WORD [node+0]=0 on unlink (bytes +0,+1).
 * TEST EDI,EDI then MOV WORD then JZ (MOV does not clobber ZF).
 * dword_2543CC0 head / dword_2543CC4 tail. EAX=kept (EBX).
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * Clone of BdLinkTask_Pump @ 0x508434 (hardcoded head/tail, no list_head arg).
 * No domain::.
 */

extern unsigned int dword_2543CC0;
extern unsigned int dword_2543CC4;

int sub_6D2EE0(void)
{
    unsigned int node;
    unsigned int prev;
    unsigned int kept;

    node = dword_2543CC0;
    prev = 0;
    kept = 0;
    if (node != 0)
    {
        do
        {
            if (((unsigned char)((int (__cdecl *)(unsigned int))*(unsigned int *)(node + 8))(node)) & 2)
            {
                *(unsigned short *)node = 0;
                if (prev != 0)
                    *(unsigned int *)(prev + 4) = *(unsigned int *)(node + 4);
                else
                    dword_2543CC0 = *(unsigned int *)(node + 4);
            }
            else
            {
                prev = node;
                kept++;
            }
            node = *(unsigned int *)(node + 4);
        }
        while (node != 0);
    }
    dword_2543CC4 = prev;
    return (int)kept;
}
```
