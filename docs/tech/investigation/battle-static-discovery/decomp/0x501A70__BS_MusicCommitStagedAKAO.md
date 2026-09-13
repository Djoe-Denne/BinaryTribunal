# BS_MusicCommitStagedAKAO @ 0x501A70

- Instr (live): 49
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=41
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BS_MusicCommitStagedAKAO(unsigned char *node)
- Notes parent: switch BYTE [node+0x0C] 0/1/2. Case 1 only: xorEAX_0 + CopyGeometry(dst=Pointer_AKAOPointer, src=0x1D96E9C, len=0x1D96EAC) add esp,0Ch. Latch: load, flag=0, xor 1, store. BYTE cmd 1 vs 2 at 0x1D96EB4. Return 2 only case 2. Occupancy/0xD0/0x1D0 absents.

## C réconcilié

```c
/* BS_MusicCommitStagedAKAO @ 0x501A70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 49 instr, size 0x99, end 0x501B09. cdecl, 1 arg (BdLink node).
 * Switch unsigned BYTE [node+0x0C] via and 0xFFh / sub 0 / dec / dec.
 * Case 0: inc state, BYTE 0x1D96EA1=1, BYTE [0x1D96EB4]=1, return 0.
 * Case 1: xorEAX_0 test, optional latch xor, CopyGeometry add esp 0Ch,
 *         reload+inc [node+0x0C], BYTE 0x1D96EA1=1, BYTE [0x1D96EB4]=2, return 0.
 * Case 2: BYTE *[node+0x10]=1, return 2.
 * Occupancy / GetRandomInt / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned char g_MusicToggleOnceFlag;   /* 0xB8B7D4 */
extern unsigned char g_AKAO_BattleBankLatch;  /* 0x1CFF6E9 */
extern unsigned char *dword_1D96E9C;         /* 0x1D96E9C copy src */
extern unsigned char byte_1D96EA1;           /* 0x1D96EA1 */
extern unsigned char *Pointer_AKAOPointer;   /* 0x1D96EA8 copy dst */
extern unsigned int dword_1D96EAC;           /* 0x1D96EAC copy len */
extern unsigned char dword_1D96EB4;          /* 0x1D96EB4 BYTE cmd 1 or 2 */

extern int xorEAX_0(void);
extern void __cdecl BS_CopyGeometry(unsigned char *dst, unsigned char *src, unsigned int len);

int __cdecl BS_MusicCommitStagedAKAO(unsigned char *node)
{
    unsigned char state;
    unsigned char latch;

    state = node[0x0C];
    switch (state)
    {
    case 0:
        state = (unsigned char)(state + 1);
        byte_1D96EA1 = 1;
        dword_1D96EB4 = 1;
        node[0x0C] = state;
        return 0;

    case 1:
        if (xorEAX_0() != 0)
            return 0;
        if (g_MusicToggleOnceFlag != 0)
        {
            latch = g_AKAO_BattleBankLatch;
            g_MusicToggleOnceFlag = 0;
            latch ^= 1;
            g_AKAO_BattleBankLatch = latch;
        }
        BS_CopyGeometry(Pointer_AKAOPointer, dword_1D96E9C, dword_1D96EAC);
        state = (unsigned char)(node[0x0C] + 1);
        byte_1D96EA1 = 1;
        node[0x0C] = state;
        dword_1D96EB4 = 2;
        return 0;

    case 2:
        *(unsigned char *)(*(unsigned int *)(node + 0x10)) = 1;
        return 2;

    default:
        return 0;
    }
}
```
