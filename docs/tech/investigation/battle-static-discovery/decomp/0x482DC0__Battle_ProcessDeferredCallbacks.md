# Battle_ProcessDeferredCallbacks @ 0x482DC0

- Instr (live): 19
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=24
- A==B: non
- Push IDB: oui
- SetType: _BYTE *Battle_ProcessDeferredCallbacks(void)
- Notes parent: 16 flags BYTE `unk_1D28C53` stride `0x10` jusqu’à `0x1D28D53` via `jl` signed ; si `==1` store BYTE 0 puis `BattleExecQueue_UnlinkNode(edi, &links, &head_index)` `add esp,0Ch` ; EAX leftover (pas `return 0`).

## C réconcilié

```c
/* Battle_ProcessDeferredCallbacks @ 0x482DC0
 * Ground truth = live ASM (asm_clean.asm). 19 instr.
 * IDA: _BYTE *(); no mov eax before retn — EAX leftover from last
 * BattleExecQueue_UnlinkNode or from the caller if no slot matched.
 */

typedef struct FF8BattleExecQueueNode {
    unsigned char prev_index;
    unsigned char next_index;
    unsigned char reserved_2;
    unsigned char reserved_3;
} FF8BattleExecQueueNode; /* live IDA size 4 @ links 0x1D28C03 */

extern unsigned char unk_1D28C53;           /* 0x1D28C53 BYTE flags */
extern FF8BattleExecQueueNode links;         /* 0x1D28C03 */
extern unsigned char head_index;            /* 0x1D28DF6 */

extern FF8BattleExecQueueNode *BattleExecQueue_UnlinkNode(
    unsigned char node_index,
    FF8BattleExecQueueNode *queue_links,
    unsigned char *queue_head); /* cdecl, add esp 0Ch */

_BYTE *Battle_ProcessDeferredCallbacks(void)
{
    unsigned char *flag;      /* esi */
    unsigned int node_index;  /* edi */

    flag = &unk_1D28C53;
    node_index = 0;

    /* loc_482DC9: body first, then signed jl vs exclusive end 0x1D28D53 */
    do {
        if (*flag == 1) { /* cmp byte [esi],1 ; jnz loc_482DE4 */
            *flag = 0;    /* mov byte [esi],0  — before the call */
            BattleExecQueue_UnlinkNode(
                (unsigned char)node_index, /* push edi */
                &links,
                &head_index);
            /* add esp, 0Ch */
        }
        /* loc_482DE4 */
        flag += 0x10; /* add esi, 10h */
        node_index++; /* inc edi */
    } while ((int)flag < (int)0x1D28D53);
    /* 16 slots: (0x1D28D53-0x1D28C53)/0x10. IDA overlay name on the
     * end address is g_BattlePendingActionSlot0.active+8 — not a field
     * of this flag array. */

    /* retn; EAX leftover — not written to 0 */
}
```
