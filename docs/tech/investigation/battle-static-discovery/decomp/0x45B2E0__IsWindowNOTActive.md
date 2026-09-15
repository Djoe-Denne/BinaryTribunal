# IsWindowNOTActive @ 0x45B2E0

- Instr (live): 14
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl IsWindowNOTActive()
- Notes parent: GetActiveWindow (pas GetForegroundWindow). DWORD [buf+0x5C] vs HWND; jnz 75 0D → -1; égal: Input_ProcessInput + sub_498410 + xor eax,eax. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de ja/jg. Pas de add esp. C GLM stub (stop, C non vide) → pas de retry.

## C réconcilié

```c
/* IsWindowNOTActive @ 0x45B2E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 14 instr, size 0x27, end 0x45B307. cdecl, 0 args, retn C3, no EBP frame.
 * Call order: FFGetBufferAddress @ 0x40A04A then GetActiveWindow IAT (NOT GetForegroundWindow).
 * DWORD load [esi+0x5C] opcode 8B 4E 5C vs HWND EAX; jnz 75 0D → or eax,0FFFFFFFFh (83 C8 FF).
 * Equal path: Input_ProcessInput @ 0x467D10; sub_498410 @ 0x498410; xor eax,eax (33 C0).
 * Callee EAX discarded. add esp absent. Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / 0x44 absent.
 * No ja/jg (ZF only). No 66 prefix. No jump table. Raw +0x5C, no packed struct.
 */

extern int __cdecl FFGetBufferAddress(void);
extern void *__stdcall GetActiveWindow(void);
extern int Input_ProcessInput(void);
extern int sub_498410(void);

int __cdecl IsWindowNOTActive(void)
{
    unsigned char *buf;          /* ESI ← FFGetBufferAddress / dword_1A79D88 */
    void *hwndActive;            /* EAX ← GetActiveWindow */
    unsigned int hwndStored;     /* ECX ← DWORD [esi+0x5C] */

    buf = (unsigned char *)FFGetBufferAddress();
    hwndActive = GetActiveWindow();
    hwndStored = *(unsigned int *)(buf + 0x5C);
    if (hwndStored != (unsigned int)hwndActive)
        return -1;
    Input_ProcessInput();
    sub_498410();
    return 0;
}
```
