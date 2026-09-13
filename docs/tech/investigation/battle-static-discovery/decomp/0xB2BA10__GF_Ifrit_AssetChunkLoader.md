# GF_Ifrit_AssetChunkLoader @ 0xB2BA10

- Instr (live): 79
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5560
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5682
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5184
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GF_Ifrit_AssetChunkLoader(void)
- Notes parent: Presentation Ifrit chunk walker. BUSY BYTE poll copies WORD mag+0xC8 -> slot+0x3E. Else BUSY=0xFF, opcode WORD slot+4Ah. Bit15 -> loc_B2BAFA (bit5 skip table/+A2/+A0, file_id (>>9&0x1F)+0x16B). MagVm IP+2: lo==0xFF uses [seq+0xB8] not table[0xFF]; lo&0x80 shl hi 0xC; else table[lo] + optional dword_1874894 walk. loc_B2BA6B DWORD table[idx+=BYTE+A2] then movsx WORD+A0. BattleFile_preLoad(id,chunk,0,ClearBusy) add esp,10h. Signed jle IP+2 else +4. Occupancy 1+2 / 0xD0 / 0x1D0 / GFSG 0x44 / K_GF 0x84 absents.

## C réconcilié

```c
/* GF_Ifrit_AssetChunkLoader @ 0xB2BA10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 79 instr, size 0x12B, end 0xB2BB3B. IDA type int(). cdecl, 0 args, retn C3. FLAGS 0x5400. FRSIZE 0.
 * No ebp / no sub esp / no arg_0. push ebx then esi on the not-busy path; inner push/pop edi at loc_B2BADF.
 * add esp,10h once after BattleFile_preLoad (4 dword pushes: file_id, chunk, 0, ClearBusy).
 * jle 7E after cmp word [slot+4Ah],0 is SIGNED. No ja/jg, no setcc, no jpt_.
 * Occupancy 1+2 / slot 0xD0 / actor 0x9C / F_CHAR 0x1D0 / GFSG 0x44 / K_GF 0x84: absent.
 * Widths: BYTE BUSY A0/C6, [seq+0xA2] 8A; WORD 66 slot+4Ah / IP+2 / mag+0xC8->slot+3Eh, movsx seq+0xA0;
 *   DWORD table[eax], [seq+0xB4], [seq+0xB8], dword_18748B0/4894 walk.
 * No packed struct. No domain::.
 */

typedef unsigned int _DWORD;
typedef unsigned short _WORD;
typedef unsigned char _BYTE;

int __cdecl BattleFile_preLoad(int file_id, int dest, int a3, int a4);
void GF_Ifrit_AssetLoadCompletion_ClearBusy(void);

extern unsigned char GF_IFRIT_ASSET_LOAD_BUSY;     /* 0x2798219 size 1 */
extern unsigned char *g_GfCinematic_RuntimeSlotPtr; /* 0x27973B8 */
extern unsigned char *g_GfCinematic_SequenceCtxPtr; /* 0x27973EC */
extern unsigned char *g_MagVm_IP;                   /* 0x2797450 */
extern int g_MagicFileChunkTable[];                 /* 0x2798A68 int[] */
extern unsigned char *dword_27973E8;                /* 0x27973E8 mag-object */
extern unsigned int dword_18748B0;                  /* 0x18748B0 */
extern int dword_1874894[];                         /* 0x1874894 int[] */

int __cdecl GF_Ifrit_AssetChunkLoader(void)
{
    unsigned char *slot;
    unsigned char *seq;
    unsigned char *ip;
    unsigned int opcode;
    unsigned int w2;
    unsigned int lo;
    unsigned int hi;
    unsigned int idx;
    unsigned int chunk;
    unsigned int p;

    if (GF_IFRIT_ASSET_LOAD_BUSY)
        goto loc_B2BB24;

    slot = g_GfCinematic_RuntimeSlotPtr;
    GF_IFRIT_ASSET_LOAD_BUSY = 0xFFu;
    seq = g_GfCinematic_SequenceCtxPtr;
    opcode = *(_WORD *)(slot + 0x4A);

    if (opcode & 0x8000)
        goto loc_B2BAFA;

    ip = g_MagVm_IP;
    w2 = *(_WORD *)(ip + 2);
    lo = w2 & 0xFFu;
    hi = w2 >> 8;
    idx = (opcode & 0xFFFFu) >> 9;
    if (lo != 0xFFu)
        goto loc_B2BABD;

    chunk = *(_DWORD *)(seq + 0xB8);

loc_B2BA6B:
    idx += *(_BYTE *)(seq + 0xA2);
    g_MagicFileChunkTable[idx] = (int)chunk;
    idx += (unsigned int)(int)(short)*(_WORD *)(seq + 0xA0);

loc_B2BA85:
    idx &= 0xFFFFu;
    *(_DWORD *)(seq + 0xB4) = chunk;
    BattleFile_preLoad((int)idx, (int)chunk, 0, (int)GF_Ifrit_AssetLoadCompletion_ClearBusy);
    slot = g_GfCinematic_RuntimeSlotPtr;
    ip = g_MagVm_IP;
    if ((short)*(_WORD *)(slot + 0x4A) <= 0)
        goto loc_B2BB1B;
    ip += 4;
    g_MagVm_IP = ip;
    return (int)ip;

loc_B2BABD:
    if ((lo & 0x80u) == 0)
        goto loc_B2BAD3;
    lo &= 0x7Fu;
    hi <<= 12;
    chunk = (unsigned int)g_MagicFileChunkTable[lo] + hi;
    goto loc_B2BA6B;

loc_B2BAD3:
    chunk = (unsigned int)g_MagicFileChunkTable[lo];
    if ((_BYTE)hi == 0xFF)
        goto loc_B2BA6B;
    p = (unsigned int)dword_1874894 + dword_18748B0;
    p += *(_DWORD *)(p + lo * 4);
    chunk += *(_DWORD *)(p + hi * 4);
    goto loc_B2BA6B;

loc_B2BAFA:
    chunk = *(_DWORD *)(seq + 0xB8);
    idx = (opcode >> 9) & 0x3Fu;
    if ((idx & 0x20) == 0)
        goto loc_B2BA6B;
    idx = (idx & 0x1Fu) + 0x16Bu;
    goto loc_B2BA85;

loc_B2BB1B:
    ip += 2;
    g_MagVm_IP = ip;
    return (int)ip;

loc_B2BB24:
    slot = g_GfCinematic_RuntimeSlotPtr;
    *(_WORD *)(slot + 0x3E) = *(_WORD *)(dword_27973E8 + 0xC8);
    return (int)slot;
}
```
