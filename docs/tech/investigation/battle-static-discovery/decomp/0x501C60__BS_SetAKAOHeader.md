# BS_SetAKAOHeader @ 0x501C60

- Instr (live): 9
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=22
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: char __cdecl BS_SetAKAOHeader(void)
- Notes parent: Latch BYTE 8A 0D; jz si 0 → Pointer=BSS 0x1CE075C sinon Embedded 0x1CDC750. BYTE A2 1D96EA1 puis 1D96EA0. Retour AL=0. Occupancy/GetRandomInt absents.

## C réconcilié

```c
/* BS_SetAKAOHeader @ 0x501C60
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 9 instr, size 0x2B, end 0x501c8b. cdecl, no args, no locals. retn C3.
 * BYTE 8A 0D latch @ 0x1CFF6E9; xor al,al; cmp cl,al; jz loc_501C85.
 * BYTE A2: byte_1D96EA1 then byte_1D96EA0 = 0. DWORD C7 05 Pointer_AKAOPointer.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt unused.
 */

extern unsigned char g_AKAO_BattleBankLatch; /* 0x1CFF6E9 */
extern unsigned char byte_1D96EA1;           /* 0x1D96EA1 */
extern unsigned char byte_1D96EA0;           /* 0x1D96EA0 */
extern unsigned char g_AKAO_BattleBSS[];     /* 0x1CE075C */
extern unsigned char g_AKAO_Embedded[];      /* 0x1CDC750 */
extern unsigned char *Pointer_AKAOPointer;   /* 0x1D96EA8 DWORD */

char __cdecl BS_SetAKAOHeader(void)
{
    unsigned char latch;

    latch = g_AKAO_BattleBankLatch;
    byte_1D96EA1 = 0;
    Pointer_AKAOPointer = g_AKAO_BattleBSS;
    if (latch != 0)
        Pointer_AKAOPointer = g_AKAO_Embedded;
    byte_1D96EA0 = 0;
    return 0;
}
```
