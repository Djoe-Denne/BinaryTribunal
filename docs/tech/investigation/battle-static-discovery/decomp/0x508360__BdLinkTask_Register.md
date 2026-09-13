# BdLinkTask_Register @ 0x508360

- Instr (live): 37
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=30
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=30
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=30
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BdLinkTask_Register(int list_head, int callback)
- Notes parent: BYTE OR bit0 (80 0E 01) ≠ occupancy 1+2. WORD 66 [node+2]. Tail chargé avant zeros ; jz sur CMP. [tail+4]=node. EAX=ESI. add esp 4+4. 0xD0/0x1D0/0x44 absents.

## C réconcilié

```c
/* BdLinkTask_Register @ 0x508360
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 37 instr, size 0x56, end 0x5083B6. cdecl, 2 args. Saved ESI/EDI. retn C3.
 * Callees: sub_5083C0 add esp,4 EAX=node-or-NULL; OutputDebugString_1 add esp,4 unused.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * Widths: BYTE 80 0E 01 OR bit0 (node occupied, not occupancy 1+2); WORD 66 89 4E 02;
 * DWORD 89 46 08 / 89 4E 04 / 89 70 04 / 89 77 04 / 89 37.
 * jz (74) on tail==0 after CMP EAX,ECX; MOVs after CMP do not clobber flags.
 * EAX always = ESI (node or 0). No setcc / ja / jpt / domain::.
 */

extern char aBdlinktaskFail[]; /* 0xB8B96C "BdLinkTask: FAILED !!!!\n" */

unsigned char *__cdecl sub_5083C0(int list_head);
void __cdecl OutputDebugString_1(char *text);

int __cdecl BdLinkTask_Register(int list_head, int callback)
{
    int node;
    int tail;

    node = (int)sub_5083C0(list_head);
    if (node == 0) {
        OutputDebugString_1(aBdlinktaskFail);
        return node;
    }

    *(unsigned char *)node |= 1u;                 /* 80 0E 01 BYTE OR bit0 */
    *(int *)(node + 8) = callback;                /* 89 46 08 DWORD tick */
    tail = *(int *)(list_head + 4);               /* 8B 47 04; 3B C1 cmp vs 0 */
    *(unsigned short *)(node + 2) = 0;            /* 66 89 4E 02 WORD */
    *(int *)(node + 4) = 0;                       /* 89 4E 04 DWORD next */
    if (tail == 0) {
        *(int *)list_head = node;                 /* loc_50839A: 89 37 head */
        *(int *)(list_head + 4) = node;           /* 89 77 04 tail */
        return node;
    }
    *(int *)(tail + 4) = node;                    /* 89 70 04 old-tail next */
    *(int *)(list_head + 4) = node;               /* 89 77 04 new tail */
    return node;
}
```
