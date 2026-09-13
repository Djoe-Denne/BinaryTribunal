# BattleExecQueue_ConsumeCurrentSlot @ 0x4845A0

- Instr (live): 33
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1926
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=814
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=27
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleExecQueue_ConsumeCurrentSlot(int queue_slot)
- Notes parent: groupe = BYTE `0x1D28DF2` (zero-extend) ; UnlinkNode cdecl `add esp,0Ch` ; P = `0x1D288EE+(slot+group*11)*24` ; BYTE `[eax-6]=0xFF`, DWORD `[edi]=0`, WORD `66 [edi+4]=0` ; `ecx=2` `add eax,0Ch` `jnz loc_4845E6` ; EAX leftover `P+0x18` ; pas de setcc/ja.

## C réconcilié

```c
/* BattleExecQueue_ConsumeCurrentSlot @ 0x4845A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 33 instr, size 0x5c. IDA type int __cdecl(int queue_slot).
 * Callee 0x482C30 UnlinkNode cdecl add esp,0Ch (3 pushes). EAX leftover = P+0x18.
 */

FF8BattleExecQueueNode *__cdecl BattleExecQueue_UnlinkNode(
    unsigned __int8 node_index,
    FF8BattleExecQueueNode *links,
    unsigned __int8 *head_index);

int __cdecl BattleExecQueue_ConsumeCurrentSlot(int queue_slot)
{
    unsigned int group;          /* ESI, zero-extended BYTE */
    int node;                    /* EDI = queue_slot */
    unsigned __int8 *head;
    FF8BattleExecQueueNode *links;
    unsigned __int8 *eax_p;      /* P = 0x1D288EE + idx*24 */
    unsigned __int8 *edi_p;
    int n;                       /* ECX */
    unsigned int idx;

    /* 33 C0 ; A0 F2 8D D2 01  WHEN_DOING_SOMETHING_VALUE_IS_1 */
    group = *(unsigned __int8 *)0x1D28DF2;
    node = queue_slot;

    /* lea edx,[esi+esi*4] ; lea ecx, byte_1D28C00[esi] */
    head = (unsigned __int8 *)0x1D28C00 + group;
    /* lea eax,[esi+edx*2] => group*11 ; lea ecx, 1D28864h[eax*4] => +group*44 */
    links = (FF8BattleExecQueueNode *)(0x1D28864 + group * 44);

    /* push head ; push links ; push edi ; call ; add esp,0Ch */
    BattleExecQueue_UnlinkNode((unsigned __int8)node, links, head);

    /* lea edx,[esi+esi*4] ; add edi,esi ; mov ecx,2
     * lea eax,[edi+edx*2] => queue_slot + group*11
     * mov dl,0FFh
     * lea eax,[eax+eax*2] ; lea eax, 1D288EEh[eax*8]
     * eax = 0x1D288EE + (queue_slot + group*11)*24  (= cell_base + 6) */
    idx = (unsigned int)queue_slot + group * 11;
    n = 2;
    eax_p = (unsigned __int8 *)(0x1D288EE + idx * 24);

loc_4845E6:
    edi_p = eax_p;
    /* xor esi,esi */
    eax_p[-6] = 0xFF;                         /* 88 50 FA  BYTE attacker */
    eax_p += 0x0C;                            /* 83 C0 0C */
    *(unsigned int *)edi_p = 0;               /* 89 37     DWORD target_mask[0..1] */
    --n;                                      /* 49 */
    *(unsigned __int16 *)(edi_p + 4) = 0;     /* 66 89 77 04 WORD target_mask[2] */
    if (n != 0)                               /* 75 ED jnz */
        goto loc_4845E6;

    /* no mov eax before retn */
    return (int)eax_p;
}
```
