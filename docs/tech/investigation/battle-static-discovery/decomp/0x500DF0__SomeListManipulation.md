# SomeListManipulation @ 0x500DF0

- Instr (live): 55
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl SomeListManipulation(__int16 p_some_id, unsigned __int8 p_bitmask, int p_pointer_info_section)
- Notes parent: id 107 flush vs enqueue. WORD 66 [node+2]/SI. BYTE [node+0]/[node+1]/byte_1D96D9A. DWORD [node+4]. jle/jge signed ]100,120[. ja unsigned group vs bitmask. add esp 4/4/4+shared/8. Flush return 0. Enqueue EAX+8 même si append=0. Occupancy/GetRandomInt/0xD0/0x1D0 absents.

## C réconcilié

```c
/* SomeListManipulation @ 0x500DF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 55 instr, size 0xA5, end 0x500E95. IDA type int __cdecl(__int16, unsigned __int8, int).
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused. GetRandomInt absent.
 * ja UNSIGNED (AL vs BL). jle/jge SIGNED on WORD [node+2] vs 100/120.
 * Shared add esp,4 at loc_500E52 after delete or rotate. add esp,8 after append.
 * Flush id==107 returns 0. Enqueue returns EAX+8 even if append returned 0.
 * No Hex-Rays. No domain::.
 */

typedef struct BattleTaskLink BattleTaskLink;

typedef struct BattleTaskQueueHead {
    void *link_pool;       /* +0 @ 0x1D96D68 */
    BattleTaskLink *list;  /* +4 */
    void *node_arena;      /* +8 */
} BattleTaskQueueHead;

extern BattleTaskQueueHead battle_task_2_stru; /* 0x1D96D68 size 12 */
extern unsigned char byte_1D96D9A;              /* 0x1D96D9A size 1 */

int __cdecl countNbElementInLIst_pre(BattleTaskQueueHead *);
int __cdecl getSecondValueFrom2ndNodeOfPlus1Pointer(BattleTaskQueueHead *);
int __cdecl pre_deleteElemFromList(BattleTaskQueueHead *);
int __cdecl moveFirstNodeToTheEndForPlus1Pointer(BattleTaskQueueHead *);
int __cdecl appendAndSetByte(int *, char p_value_to_set);

int __cdecl SomeListManipulation(
    __int16 p_some_id,
    unsigned __int8 p_bitmask,
    int p_pointer_info_section)
{
    __int16 id;
    unsigned __int8 mask;
    unsigned __int8 group;
    unsigned __int8 seq;
    __int16 task_id;
    int node;
    int count;

    id = p_some_id;
    if (id == 107)
    {
        count = countNbElementInLIst_pre(&battle_task_2_stru);
        if (count <= 0)
            return 0;

        mask = p_bitmask;
        do
        {
            node = getSecondValueFrom2ndNodeOfPlus1Pointer(&battle_task_2_stru);
            task_id = *(__int16 *)(node + 2);
            if (task_id > 100 && task_id < 120)
            {
                group = *(unsigned char *)(node + 1);
                if ((group & 0x0F) == 0 && group <= mask)
                    pre_deleteElemFromList(&battle_task_2_stru);
                else
                    moveFirstNodeToTheEndForPlus1Pointer(&battle_task_2_stru);
            }
            else
            {
                moveFirstNodeToTheEndForPlus1Pointer(&battle_task_2_stru);
            }
        } while (--count);
        return 0;
    }

    node = appendAndSetByte((int *)&battle_task_2_stru, (char)(p_bitmask & 0xF0));
    if (node)
    {
        seq = byte_1D96D9A;
        *(__int16 *)(node + 2) = id;
        *(unsigned char *)node = seq;
        byte_1D96D9A = (unsigned char)(seq + 1);
        *(int *)(node + 4) = p_pointer_info_section;
    }
    return node + 8;
}
```
