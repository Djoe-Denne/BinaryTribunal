# BattleCamera_StartTrack @ 0x503520

- Instr (live): 52
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2286
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1838
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=194
- A==B: non
- Push IDB: oui
- SetType: void __cdecl BattleCamera_StartTrack(unsigned __int16 *, int)
- Notes parent: Offset banque = BYTE (ADD ESI,ECX), pas index u16. Script = LEA ESI+MOVSX*2. Scan 2×0x524 sans garde plein. BYTE takeover 0x1D97705|=80h si flags&0xFF00==0. WORD OR 1<<variant. VOID. Occupancy/GetRandomInt absents.

## C réconcilié

```c
/* BattleCamera_StartTrack @ 0x503520
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 52 instr, size 0xB6, end 0x5035d6. cdecl, 2 args. Saved EBX/ESI. retn C3.
 * VOID: no EAX write before ret. Success leftover EAX = 1<<variant (D3 E0).
 * add esp,8 after BdLinkTask_Register (2 DWORD args: head then tick).
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused. GetRandomInt absent.
 * Widths: 66 WORD (count/offset/rel/+0C/+0E/flags OR/blend); BYTE 80 0D / 88 1A / 80 3A FF;
 * DWORD 89 50 0C / 89 42 10 / 89 15 pointer. jge/jl signed (0F 8D / 7C). No setcc / ja / jpt.
 */

extern unsigned int g_BattleCameraFlags;            /* 0x1D97718 DWORD load A1, WORD OR 66 09 */
extern unsigned char dword_1D97704[];             /* 0x1D97704; BYTE +1 OR 80h @ 0x1D97705 */
extern unsigned char cameraStruct[];              /* 0x1D977A8, 2 x stride 0x524 */
extern unsigned char *cameraStructPointer;        /* 0x1D97798 DWORD */
extern unsigned short word_1D9771E;               /* 0x1D9771E */
extern unsigned int g_BattleCameraTaskListHead[];  /* 0x1D97768 */

int __cdecl BdLinkTask_Register(int list_head, int callback);
int BS_CameraAnim_Tick(void);

void __cdecl BattleCamera_StartTrack(unsigned short *table, int packed_id)
{
    int bank;
    int variant;
    unsigned short *stream;
    int node;
    unsigned char *rec;
    int i;
    int rel;

    if (!table)
        return;

    bank = (packed_id >> 4) & 0xF;          /* SAR 4, AND 0Fh */
    if (bank >= (int)table[0])               /* WORD count, signed jge */
        return;

    variant = packed_id & 7;
    /* WORD at table+bank*2+2 is a BYTE displacement (ADD ESI, ECX), not a u16 index. */
    stream = (unsigned short *)((unsigned char *)table + table[bank + 1]);

    /* After AND 0xFFFF, TEST 0xFFFFFF00 sees only bits 8..15. */
    if (((g_BattleCameraFlags & 0xFFFFu) & 0xFFFFFF00u) == 0)
        dword_1D97704[1] |= 0x80u;           /* takeover 0x8000 */

    node = BdLinkTask_Register((int)g_BattleCameraTaskListHead, (int)BS_CameraAnim_Tick);
    if (!node)
        return;

    rec = cameraStruct;
    for (i = 0; i < 2; i++) {
        if (rec[0] == 0xFFu)                 /* BYTE free sentinel */
            break;
        rec += 0x524;
    }

    rel = (int)(short)stream[variant];       /* MOVSX word [esi+ebx*2] */
    *(unsigned int *)(node + 0xC) = (unsigned int)rec;  /* EAX still = node */
    rec[0] = (unsigned char)variant;
    *(unsigned short *)(rec + 0xE) = 0;
    *(unsigned short *)(rec + 0xC) = 0;
    *(unsigned int *)(rec + 0x10) = (unsigned int)(stream + rel); /* LEA esi+rel*2 */

    cameraStructPointer = rec;
    word_1D9771E = 0;
    *(unsigned short *)&g_BattleCameraFlags |= (unsigned short)(1 << variant);
}
```
