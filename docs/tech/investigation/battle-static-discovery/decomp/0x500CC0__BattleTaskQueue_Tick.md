# BattleTaskQueue_Tick @ 0x500CC0

- Instr (live): 87
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2107
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6575
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=3714
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleTaskQueue_Tick(void)
- Notes parent: count jle signé ; markers jbe non signé ; id WORD 66 jle/jge signé 1..14 / 101..119 / 1001..1003. AL = nibble puis retour dispatch. FF 05 incrémente le BYTE* puis EBP reload. Unlink AL==15 : delete, cursor--, zéro 98/99, pas de rotate. Retour EAX=0. Occupancy/GetRandomInt absents.

## C réconcilié

```c
/* BattleTaskQueue_Tick @ 0x500CC0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 87 instr, size 0x108, end 0x500DC8. IDA type int() -> int __cdecl(void).
 * Occupancy / GF Exists / GetRandomInt / jpt / ja absent.
 * Signed jle on count and on WORD task_id (66 prefix, 7E/7D). Unsigned jbe on markers vs *cursor.
 * inc off_B8A3F0 = FF 05: increment the BYTE* by 1, then reload for [ebp].
 * Return EAX = 0 both exits. No Hex-Rays. No domain::.
 */

typedef struct BattleTaskQueueHead {
    void *link_pool; /* +0 */
    void *list;      /* +4 */
    void *node_arena;/* +8 */
} BattleTaskQueueHead; /* live size 12 */

typedef struct BattleTaskNode {
    unsigned char seq;            /* +0 */
    unsigned char markers;        /* +1 */
    unsigned short task_id;       /* +2 WORD; compares are signed CX */
    void *payload;                /* +4 unused here */
    short actor_slot;             /* +8 unused here */
    unsigned char reserved10;     /* +0xA */
    unsigned char reserved11;     /* +0xB */
} BattleTaskNode; /* live size 12 */

extern BattleTaskQueueHead battle_task_2_stru; /* 0x1D96D68 */
extern unsigned char *off_B8A3F0;             /* 0xB8A3F0 DWORD holding BYTE* */
extern unsigned char byte_1D96D98;            /* 0x1D96D98 BYTE */
extern unsigned char byte_1D96D99;            /* 0x1D96D99 BYTE */

extern int __cdecl countNbElementInLIst_pre(unsigned int *);
extern int __cdecl getSecondValueFrom2ndNodeOfPlus1Pointer(unsigned int *);
extern int __cdecl BattleTaskQueue_DispatchIds1to14(int);
extern int __cdecl BattleTaskQueue_Dispatch(int);
extern int __cdecl BattleTaskQueue_DispatchStartupId(int);
extern int __cdecl pre_deleteElemFromList(unsigned int *);
extern int __cdecl moveFirstNodeToTheEndForPlus1Pointer(unsigned int *);

int __cdecl BattleTaskQueue_Tick(void)
{
    int count;
    int remaining;
    BattleTaskNode *node;
    unsigned char markers;
    unsigned char al;
    short id;

    count = countNbElementInLIst_pre((unsigned int *)&battle_task_2_stru);
    /* xor ebx,ebx ; cmp eax,ebx ; jle loc_500DC4  (signed) */
    if (count <= 0)
        return 0;

    remaining = count; /* EDI snapshot */
    do {
        node = (BattleTaskNode *)getSecondValueFrom2ndNodeOfPlus1Pointer(
            (unsigned int *)&battle_task_2_stru);
        markers = node->markers;          /* CL = [esi+1] */
        al = (unsigned char)(markers & 0x0F);

        /* cmp cl,[edx] ; jbe loc_500DA5  — UNSIGNED */
        if (markers <= *off_B8A3F0) {
            if (al != 0x0F)
                moveFirstNodeToTheEndForPlus1Pointer((unsigned int *)&battle_task_2_stru);
        } else {
            if (al == 0) {
                id = (short)node->task_id; /* 66 8B 4E 02 ; signed jle/jge */
                if (id > 0 && id < 0x0F)
                    al = (unsigned char)BattleTaskQueue_DispatchIds1to14((int)node);
                else if (id > 0x64 && id < 0x78)
                    al = (unsigned char)BattleTaskQueue_Dispatch((int)node);
                else if (id > 0x3E8 && id < 0x3EC)
                    al = (unsigned char)BattleTaskQueue_DispatchStartupId((int)node);
                /* loc_500D44 add esp,4 only if a call happened; loc_500D47 always: */
                off_B8A3F0++; /* FF 05: POINTER++ */
            }

            if (al == 0x0F) {
                unsigned char *p;
                pre_deleteElemFromList((unsigned int *)&battle_task_2_stru);
                p = off_B8A3F0; /* A1 after the call */
                --p;
                byte_1D96D98 = 0; /* BL = 0 */
                off_B8A3F0 = p;
                byte_1D96D99 = 0;
                /* jmp loc_500DB6 — no rotate */
            } else {
                unsigned char m = node->markers;
                unsigned char dl;
                *off_B8A3F0 = (unsigned char)(m & 0xF0); /* EBP reloaded after possible inc */
                dl = (unsigned char)(((m ^ al) & 0x0F) ^ m); /* (m&0xF0)|(al&0x0F) */
                node->markers = dl;
                byte_1D96D98 = *(unsigned char *)((char *)node + 2); /* 8A 4E 02 BYTE */
                byte_1D96D99 = node->seq;
                moveFirstNodeToTheEndForPlus1Pointer((unsigned int *)&battle_task_2_stru);
            }
        }
        --remaining;
    } while (remaining != 0);

    return 0;
}
```
