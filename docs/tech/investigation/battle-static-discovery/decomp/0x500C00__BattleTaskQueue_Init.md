# BattleTaskQueue_Init @ 0x500C00

- Instr (live): 42
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=116
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=73
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=94
- A==B: non
- Push IDB: oui
- SetType: void *__cdecl BattleTaskQueue_Init(void)
- Notes parent: Head 12 B (A3) puis stosd 0x3E/0x5A/0x14 dwords. BYTE A2 sur 1D96D98..9A. add esp,28h. EAX=&g_BattleTaskQueueListHead. Occupancy/GetRandomInt absents.

## C réconcilié

```c
/* BattleTaskQueue_Init @ 0x500C00
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 42 instr, size 0xB2, end 0x500cb2. cdecl, no args. EDI saved.
 * add esp,28h after 3 cdecl calls (4+4+2 args = 10 dwords).
 * EAX = &g_BattleTaskQueueListHead (B8 78 6D D9 01), not callee leftover.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused. GetRandomInt absent.
 * No setcc / ja/jg / jpt / 66. DWORD stores A3/89 0D/C7 05/stosd; BYTE A2.
 */

typedef struct BattleTaskLink BattleTaskLink;

typedef struct BattleTaskQueueHead {
    void *link_pool;       /* +0 @ 0x1D96D68 */
    BattleTaskLink *list;  /* +4 */
    void *node_arena;      /* +8 */
} BattleTaskQueueHead;

extern BattleTaskQueueHead battle_task_2_stru;        /* 0x1D96D68 size 12 */
extern unsigned char unk_1D96C20[];                   /* 0x1D96C20 */
extern unsigned char unk_1D96AB8[];                   /* 0x1D96AB8 */
extern unsigned char unk_1D96D18[];                   /* 0x1D96D18 */
extern int dword_1D96D74;                            /* 0x1D96D74 */
extern unsigned int g_BattleTaskQueueListHead[4];    /* 0x1D96D78 size 16 */
extern int battle_read_effect_task;                  /* 0x1D96D88 */
extern int dword_1D96D8C;                            /* 0x1D96D8C */
extern int dword_1D96D90;                            /* 0x1D96D90 */
extern int dword_1D96D94;                            /* 0x1D96D94 */
extern void *off_B8A3F0;                             /* 0xB8A3F0 */
extern unsigned char byte_1D96D98;                    /* 0x1D96D98 */
extern unsigned char byte_1D96D99;                    /* 0x1D96D99 */
extern unsigned char byte_1D96D9A;                    /* 0x1D96D9A */

unsigned char *__cdecl sub_5031E0(int, int, int, int);
int __cdecl BS_Memset(int, unsigned short *, unsigned int, int);
int __cdecl BdLinkTask_Register(int list_head, int callback);
int BattleTaskQueue_Tick(void);

void *__cdecl BattleTaskQueue_Init(void)
{
    unsigned int i;

    battle_task_2_stru.link_pool = 0;   /* A3 EAX=0 */
    battle_task_2_stru.list = 0;
    battle_task_2_stru.node_arena = 0;

    for (i = 0; i < 0x3Eu; i++)          /* rep stosd edi=unk_1D96C20 ecx=0x3E */
        ((unsigned int *)unk_1D96C20)[i] = 0;
    for (i = 0; i < 0x5Au; i++)          /* edi=unk_1D96AB8 ecx=0x5A */
        ((unsigned int *)unk_1D96AB8)[i] = 0;
    for (i = 0; i < 0x14u; i++)          /* edi=unk_1D96D18 ecx=0x14 */
        ((unsigned int *)unk_1D96D18)[i] = 0;

    dword_1D96D74 = 0;                 /* A3 EAX (still 0) */
    battle_read_effect_task = 0;        /* 89 0D after xor ecx,ecx */
    dword_1D96D8C = 0;
    dword_1D96D90 = 0;
    dword_1D96D94 = 0;
    off_B8A3F0 = &battle_read_effect_task; /* C7 05 */
    byte_1D96D98 = 0;                   /* A2 AL, xor al,al */
    byte_1D96D99 = 0;
    byte_1D96D9A = 0;

    sub_5031E0((int)&battle_task_2_stru, (int)unk_1D96C20, (int)unk_1D96AB8, 0x1E);
    BS_Memset((int)g_BattleTaskQueueListHead, (unsigned short *)unk_1D96D18, 0x14u, 4);
    BdLinkTask_Register((int)g_BattleTaskQueueListHead, (int)BattleTaskQueue_Tick);

    return (void *)g_BattleTaskQueueListHead;
}
```
