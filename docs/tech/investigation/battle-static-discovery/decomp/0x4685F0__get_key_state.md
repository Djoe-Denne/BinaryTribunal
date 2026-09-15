# get_key_state @ 0x4685F0

- Instr (live): 16
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl get_key_state(unsigned int)
- Notes parent: jbe 76 UNSIGNED vs 0FFh (pas jle/jg). Deux OutputDebugString_Simple + add esp,8. dword_1CD02D8 NULL → xor eax,eax. BYTE [buf+scancode] puis AND EAX,80h → 0 ou 0x80. Pas GetKeyState/GetAsyncKeyState/GetActiveWindow/GetForegroundWindow. Occupancy 1+2 / +44h / TEST AL,2 / OT 07/24 absents.

## C réconcilié

```c
/* get_key_state @ 0x4685F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 16 instr, size 0x38, end 0x468628. cdecl, 1 arg, two retn C3, no EBP, no saved regs.
 * cmp ecx,0FFh / jbe opcode 76 UNSIGNED (not jle/jg/ja). Error: two cdecl
 * OutputDebugString_Simple then add esp,8 (83 C4 08). Shared xor eax,eax at loc_468613.
 * BYTE load 8A 04 08 then AND EAX,80h (25 80 00 00 00) -> 0 or 0x80.
 * Not Win32 GetKeyState / GetAsyncKeyState. No GetActiveWindow / GetForegroundWindow.
 * Occupancy 1+2 / 0xD0 / 0x1D0 / +44h / TEST AL,2 / OT 07/24 absent.
 */

extern void __cdecl OutputDebugString_Simple(const char *lpOutputString);
extern unsigned char *dword_1CD02D8;
extern const char aInputParameter_0[];
extern const char aWilliamPleaseC[];

int __cdecl get_key_state(unsigned int scancode)
{
    unsigned char *buf;

    if (scancode > 0xFFu) {
        OutputDebugString_Simple(aInputParameter_0);
        OutputDebugString_Simple(aWilliamPleaseC);
        return 0;
    }

    buf = dword_1CD02D8;
    if (!buf)
        return 0;

    return buf[scancode] & 0x80;
}
```
