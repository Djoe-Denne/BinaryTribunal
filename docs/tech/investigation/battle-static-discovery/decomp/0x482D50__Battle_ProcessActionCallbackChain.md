# Battle_ProcessActionCallbackChain @ 0x482D50

- Instr (live): 33
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2157
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=149
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1407
- A==B: non
- Push IDB: oui
- SetType: char __cdecl Battle_ProcessActionCallbackChain();
- Notes parent: scan `prev_index==0xFF` stride +4 jusqu’à `unk_1D28C43` via `jl` signé (max 16, pas 0xD0) ; 2× `call [idx<<4 + dword_1D28C44]` cdecl `add esp,4` ; `next_index` BYTE `esi*4` ; `head_index` BYTE seulement à `loc_482D84` ; EAX leftover `char()`.

## C réconcilié

```c
/* Battle_ProcessActionCallbackChain @ 0x482D50
 * Ground truth = live ASM (asm_clean.asm + dump_bytes.txt). 33 instr, size 0x61.
 * IDA type char() — EAX leftover (no mov/xor before either retn).
 * No domain:: in idents. Not Hex-Rays.
 */

typedef struct FF8BattleExecQueueNode {
    unsigned char prev_index;  /* +0 */
    unsigned char next_index; /* +1 */
    unsigned char reserved_2;
    unsigned char reserved_3;
} FF8BattleExecQueueNode; /* IDA live, size 4 @ 0x1D28C03 — NOT an invented [16] */

extern FF8BattleExecQueueNode links;     /* 0x1D28C03 */
extern unsigned char unk_1D28C43;        /* 0x1D28C43 exclusive scan end */
extern int dword_1D28C44[];              /* 0x1D28C44 int[]; FP = first DWORD, stride 16 */
extern unsigned char head_index;        /* 0x1D28DF6 */

char __cdecl Battle_ProcessActionCallbackChain(void)
{
    unsigned int idx;       /* esi */
    unsigned char *node;    /* eax: prev_index walk */
    unsigned char next;     /* al */
    void (__cdecl *fp)(unsigned int);

    idx = 0;
    node = (unsigned char *)&links; /* byte ptr [eax] = prev_index */

    /* loc_482D58 */
    while (*node != 0xFF) {
        node += 4;
        idx++;
        /* cmp eax, offset unk_1D28C43 ; jl (7C) signed */
        if ((int)node >= (int)&unk_1D28C43)
            return (char)(int)node; /* loc_482D68: EAX leftover = scan pointer */
    }

    /* loc_482D6A: call dword ptr [esi*16 + 0x1D28C44] ; push esi ; add esp,4 */
    fp = *(void (__cdecl **)(unsigned int))((char *)dword_1D28C44 + (idx << 4));
    fp(idx);

    /* 8A: mov al, [0x1D28C04 + esi*4] */
    next = *((unsigned char *)&links + idx * 4 + 1);
    if (next == 0xFF)
        goto loc_482DAF;

loc_482D84:
    if (head_index == 0xFF) /* 80 3D ... FF byte */
        goto loc_482DAF;

    idx = next; /* mov esi,eax ; and esi,0FFh (AL already next) */
    fp = *(void (__cdecl **)(unsigned int))((char *)dword_1D28C44 + (idx << 4));
    fp(idx); /* push esi ; shl ecx,4 ; add esp,4 */

    next = *((unsigned char *)&links + idx * 4 + 1);
    if (next != 0xFF)
        goto loc_482D84;

loc_482DAF:
    return (char)next; /* leftover AL = next_index (0xFF on sentinel exit) */
}
```
