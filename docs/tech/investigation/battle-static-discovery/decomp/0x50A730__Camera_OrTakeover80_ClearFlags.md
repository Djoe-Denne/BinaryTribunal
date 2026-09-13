# Camera_OrTakeover80_ClearFlags @ 0x50A730

- Instr (live): 3
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: void Camera_OrTakeover80_ClearFlags(void)
- Notes parent: BYTE OR 80h at dword_1D97704+1 (takeover 0x8000). WORD MOV flags+0=0 (BYTE2 intact). Pas de callee/occupancy/0xD0/0x1D0/0x44. EAX leftover.

## C réconcilié

```c
/* Camera_OrTakeover80_ClearFlags @ 0x50A730
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 3 instr, size 0x11, end 0x50A741. IDA type void().
 * cdecl, 0 args, no saved regs, no locals, no callees, no add esp.
 * VOID: leftover EAX (no mov eax before retn).
 * 80 0D: OR BYTE [dword_1D97704+1], 0x80 — set bit 15 of WORD at 0x1D97704.
 * 66 C7 05 g_BattleCameraFlags: MOV WORD +0 = 0; BYTE2 @ 0x1D9771A untouched.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: absent.
 * No Hex-Rays. No domain::.
 */

extern unsigned int dword_1D97704;       /* 0x1D97704; this site BYTE OR +1 only */
extern unsigned int g_BattleCameraFlags;   /* 0x1D97718; this site WORD MOV +0 only */

void Camera_OrTakeover80_ClearFlags(void)
{
    *((unsigned char *)&dword_1D97704 + 1) |= 0x80u;
    *(unsigned short *)&g_BattleCameraFlags = 0;
}
```
