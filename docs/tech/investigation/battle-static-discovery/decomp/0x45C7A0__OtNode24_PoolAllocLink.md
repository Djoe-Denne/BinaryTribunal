# OtNode24_PoolAllocLink @ 0x45C7A0

- Instr (live): 59
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: OtNode24 *__cdecl OtNode24_PoolAllocLink(OtNode24 **p_ot, unsigned int *pkt)
- Notes parent: jnb unsigned cap 0x60000. BYTE [pkt+7] AND FC; jb 0x20 / ja 0x3C unsigned; TEST CL,8 (pas TEST AL,2). Quad copie 1CA8A50..5C → +4..+10; tri 54/58/5C + DWORD 0 à +10. WORD 66 à +14h=0; BYTE old_head>>24 à +16h. OT-link pkt[0] mask 0xFFFFFF. add eax,18h; EAX=nouveau curseur (pas le nœud). Occupancy 1+2 / 0xD0 / 0x1D0 / +44h absents. Leaf, callers add esp,8.

## C réconcilié

```c
/* OtNode24_PoolAllocLink @ 0x45C7A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 59 instr, size 0xBA, end 0x45C85A. cdecl leaf, 2 args (callers add esp,8), retn C3.
 * Pool: g_OtNodePool OtNode24[16384] @ 0x1C48828, cursor @ 0x1CA8828, cap 0x60000, stride 0x18.
 * BYTE [pkt+7] = GPU code; AND 0xFC; unsigned jb 0x20 / ja 0x3C; TEST CL,8 (not TEST AL,2).
 * Quad copies dword_1CA8A50..5C (GteState_SetQuad SXY cache) to +4..+10; tri copies 54/58/5C + zero +10.
 * WORD 66 store 0 at +14h; BYTE old_head>>24 at +16h; pkt[0] OT-link 0xFFFFFF.
 * EAX = new cursor (node+0x18) on success, unchanged cursor if jnb full. Occupancy / 0xD0 / 0x1D0 / +44h absent.
 */
typedef struct OtNode24 {
    void *primitive;              /* +0 */
    int vertex_otz[4];            /* +4..+10; this body copies GTE SXY cache, not OTZ */
    unsigned char flags;         /* +14 */
    unsigned char reserved_15;  /* +15 */
    unsigned char next_high;    /* +16 */
    unsigned char reserved_17;  /* +17 unused here */
} OtNode24;

extern OtNode24 *g_OtNodePoolCursor;
extern OtNode24 g_OtNodePool[];
extern unsigned int dword_1CA8A50;
extern unsigned int dword_1CA8A54;
extern unsigned int dword_1CA8A58;
extern unsigned int dword_1CA8A5C;

OtNode24 *__cdecl OtNode24_PoolAllocLink(OtNode24 **p_ot, unsigned int *pkt)
{
    OtNode24 *node;
    unsigned int code;
    unsigned int old_head;
    unsigned int tag;

    node = g_OtNodePoolCursor;
    if ((unsigned int)((char *)node - (char *)g_OtNodePool) >= 0x60000u)
        return node;

    code = *(unsigned char *)((char *)pkt + 7);
    code &= 0xFFFFFFFCu;

    if (code < 0x20u || code > 0x3Cu) {
        node->vertex_otz[0] = 0;
        node->vertex_otz[1] = 0;
        node->vertex_otz[2] = 0;
        node->vertex_otz[3] = 0;
    } else if (code & 8u) {
        node->vertex_otz[0] = (int)dword_1CA8A50;
        node->vertex_otz[1] = (int)dword_1CA8A54;
        node->vertex_otz[2] = (int)dword_1CA8A58;
        node->vertex_otz[3] = (int)dword_1CA8A5C;
    } else {
        node->vertex_otz[0] = (int)dword_1CA8A54;
        node->vertex_otz[1] = (int)dword_1CA8A58;
        node->vertex_otz[2] = (int)dword_1CA8A5C;
        node->vertex_otz[3] = 0;
    }

    *(unsigned short *)((char *)node + 0x14) = 0;

    old_head = *(unsigned int *)p_ot;
    *(unsigned int *)p_ot = (unsigned int)node;
    node->next_high = (unsigned char)(old_head >> 24);

    tag = pkt[0];
    node->primitive = pkt;
    pkt[0] = ((tag ^ old_head) & 0x00FFFFFFu) ^ tag;

    node = (OtNode24 *)((char *)node + 0x18);
    g_OtNodePoolCursor = node;
    return node;
}
```
