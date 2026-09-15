# OtNode24_PoolAllocLink_Code1 @ 0x45C8E0

- Instr (live): 34
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=30
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=24
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=17
- A==B: non
- Push IDB: oui
- SetType: int __cdecl OtNode24_PoolAllocLink_Code1(int *, _DWORD *)
- Notes parent: jnb unsigned cap 0x60000, stride +0x18. WORD 66 +14h=1 (pas BYTE flags). BYTE +16h=(old *arg_0)>>24. XOR/AND/XOR 0xFFFFFF vers *arg_4. Zéros DWORD +4/+8/+C/+10, pas de copie RGB. TEST AL,2 / occupancy 1+2 / +44h / 0xD0 / 0x1D0 absents. EAX=curseur (bumpé ou non).

## C réconcilié

```c
/* OtNode24_PoolAllocLink_Code1 @ 0x45C8E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 34 instr, size 0x5E, end 0x45C93E. cdecl, 2 args, retn C3, no EBP.
 * jnb 73 48 unsigned cap: (cursor - g_OtNodePool) >= 0x60000u -> EAX=cursor, no stores.
 * DWORD zeros [eax+4/+8/+C/+10]. 66 C7 40 14 01 00 WORD +14h=1 (flags+reserved_15).
 * BYTE 88 50 16 [eax+16h]=(old *arg_0)>>24. +17 untouched. add eax,18h bump.
 * Link: [eax]=arg_4; *arg_0=node; *arg_4 = ((*arg_4 ^ old) & 0xFFFFFF) ^ *arg_4.
 * No callees, no add esp, no TEST AL,2 unlink, no occupancy 1+2, no +44h, no ja/jg.
 */

typedef unsigned int _DWORD;

typedef struct OtNode24 {
    void *primitive;                 /* +0 */
    int vertex_otz[4];               /* +4 .. +13 */
    unsigned char flags;             /* +14 */
    unsigned char reserved_15;     /* +15, cleared by WORD store */
    unsigned char next_high;         /* +16 */
    unsigned char reserved_17;     /* +17, not written */
} OtNode24;

extern OtNode24 *g_OtNodePoolCursor;  /* 0x1CA8828 */
extern OtNode24 g_OtNodePool[16384]; /* 0x1C48828 */

int __cdecl OtNode24_PoolAllocLink_Code1(int *arg_0, _DWORD *arg_4)
{
    OtNode24 *node;
    unsigned int old_ot;
    unsigned int prim_head;
    unsigned int packed;

    node = g_OtNodePoolCursor;
    if ((unsigned int)((char *)node - (char *)g_OtNodePool) >= 0x60000u)
        return (int)node;

    node->vertex_otz[0] = 0;
    node->vertex_otz[1] = 0;
    node->vertex_otz[2] = 0;
    node->vertex_otz[3] = 0;

    old_ot = (unsigned int)*arg_0;
    *(unsigned short *)((char *)node + 0x14) = 1;
    *((unsigned char *)node + 0x16) = (unsigned char)(old_ot >> 24);

    node->primitive = (void *)arg_4;
    *arg_0 = (int)node;

    prim_head = (unsigned int)*arg_4;
    packed = (prim_head ^ old_ot) & 0x00FFFFFFu;
    packed ^= prim_head;
    *arg_4 = packed;

    node = (OtNode24 *)((char *)node + 0x18);
    g_OtNodePoolCursor = node;
    return (int)node;
}
```
