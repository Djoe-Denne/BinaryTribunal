# Op6_QueueChunk @ 0x8E54A0

- Instr (live): 79
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5416
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4461
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=5495
- A==B: non
- Push IDB: oui
- SetType: int Op6_QueueChunk(void)
- Notes parent: 79 instr, size 0x12B, retn C3. Busy BYTE: WORD mag-obj+0xC8 → slot+0x3E, pas d'IP. Sinon busy=0xFF, chunk puis `BattleFile_preLoad(fileId&0xFFFF, esi, 0, sub_8E55D0)` add esp 10h. `&0x7F` lecture table [0,127]; `&0x3F` file-id bit15. jle signé sur WORD [slot+0x4A] → IP+2/+4. STREAM16[6] @ 0x1852AB0. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents.

## C réconcilié

```c
/* Op6_QueueChunk @ 0x8E54A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 79 instr, size 0x12B, end 0x8E55CB. IDA type int().
 * No args. FRSIZE=0. retn C3. Saved ebx,esi on not-busy only.
 * cdecl callee BattleFile_preLoad @ 0x48D0A0, add esp 10h, 4 ints.
 * STREAM16[6] dword 0x1852AB0 = 0x8E54A0. Opcode 6, not 172.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No packed struct. No domain::.
 */

extern int __cdecl BattleFile_preLoad(int, int, int, int);
extern void sub_8E55D0(void);
extern unsigned char GF_IFRIT_ASSET_LOAD_BUSY; /* 0x2798219 BYTE */
extern unsigned char *g_GfCinematic_RuntimeSlotPtr; /* 0x27973B8 */
extern unsigned char *g_GfCinematic_SequenceCtxPtr; /* 0x27973EC */
extern unsigned char *g_MagVm_IP; /* 0x2797450 */
extern unsigned int g_MagicFileChunkTable[]; /* 0x2798A68 DWORD[] */
extern unsigned char *dword_27973E8; /* mag-object ptr */
extern unsigned int dword_1852628; /* 0x1852628 */
extern unsigned int dword_185260C[]; /* 0x185260C */

int Op6_QueueChunk(void)
{
    unsigned char *slot;
    unsigned char *seq;
    unsigned char *ip;
    unsigned char *reloc;
    unsigned short opcode;
    unsigned int fileId;
    unsigned int chunk;
    unsigned int operand;
    unsigned int index;
    unsigned int hi;

    if (GF_IFRIT_ASSET_LOAD_BUSY != 0) {
        slot = g_GfCinematic_RuntimeSlotPtr;
        *(unsigned short *)(slot + 0x3E) =
            *(unsigned short *)(dword_27973E8 + 0xC8);
        return (int)slot;
    }

    GF_IFRIT_ASSET_LOAD_BUSY = 0xFFu;
    slot = g_GfCinematic_RuntimeSlotPtr;
    seq = g_GfCinematic_SequenceCtxPtr;
    opcode = *(unsigned short *)(slot + 0x4A);

    if (opcode & 0x8000u) {
        chunk = *(unsigned int *)(seq + 0xB8);
        fileId = ((unsigned int)opcode >> 9) & 0x3Fu;
        if (fileId & 0x20u) {
            fileId = (fileId & 0x1Fu) + 0x16Bu;
            goto queue_preload;
        }
        goto store_table;
    }

    ip = g_MagVm_IP;
    operand = *(unsigned short *)(ip + 2);
    fileId = (unsigned int)opcode >> 9;
    index = operand & 0xFFu;
    hi = operand >> 8; /* xor ecx,ecx; mov cx,[IP+2]; sar ecx,8 → 0..255 */

    if (index == 0xFFu) {
        chunk = *(unsigned int *)(seq + 0xB8);
        goto store_table;
    }

    if (index & 0x80u) {
        chunk = g_MagicFileChunkTable[index & 0x7Fu] + (hi << 12);
        goto store_table;
    }

    chunk = g_MagicFileChunkTable[index];
    if (hi != 0xFFu) {
        reloc = (unsigned char *)dword_185260C + dword_1852628;
        reloc += *(unsigned int *)(reloc + index * 4);
        chunk += *(unsigned int *)(reloc + hi * 4);
    }

store_table:
    fileId += seq[0xA2];
    g_MagicFileChunkTable[fileId] = chunk;
    fileId = (unsigned int)((int)fileId + (int)*(short *)(seq + 0xA0));

queue_preload:
    fileId &= 0xFFFFu;
    *(unsigned int *)(seq + 0xB4) = chunk;
    BattleFile_preLoad((int)fileId, (int)chunk, 0, (int)sub_8E55D0);

    slot = g_GfCinematic_RuntimeSlotPtr;
    ip = g_MagVm_IP;
    if (*(short *)(slot + 0x4A) <= 0)
        ip += 2;
    else
        ip += 4;
    g_MagVm_IP = ip;
    return (int)ip;
}
```
