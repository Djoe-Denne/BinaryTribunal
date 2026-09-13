# isRandomProbaNumDen255 @ 0x48F0F0

- Instr (live): 20
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: BOOL __cdecl isRandomProbaNumDen255(int numerator, int denominator)
- Notes parent: `GetRandomInt` AL only puis `and eax,0FFh` (25) ; `t` = shl 8 − num puis `idiv` signé DWORD (cdq, pas 66) ; `jz` si t==0 ; `jb` unsigned (72) vs r, pas ja/jg ; EAX 1 ou 0 ; RNG avant le test t==0 ; pas d'add esp (0 args callee). Pas de Hex-Rays.

## C réconcilié

```c
/* isRandomProbaNumDen255 @ 0x48F0F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 20 instr, size 0x30. End 0x48F120. IDA type BOOL __cdecl(int, int).
 * No domain::. Callee Battle_GetRandomInt AL only then and 0xFF. No occupancy.
 * No packed struct. No BATTLE_SLOT 0xD0 / F_CHAR 0x1D0. No jump table. No setcc.
 * Widths: all DWORD (no 66). idiv DWORD. jb unsigned 72 vs r, not ja/jg.
 * EAX = 1 (mov eax,1) or 0 (xor eax,eax). RNG call always before the t==0 test.
 */

extern unsigned char __cdecl Battle_GetRandomInt(void); /* AL only; 0 args, no add esp */

BOOL __cdecl isRandomProbaNumDen255(int numerator, int denominator)
{
    int t;           /* esi after signed idiv */
    unsigned int r;  /* eax after and 0FFh */

    /* mov ecx,[esp+4]; mov eax,ecx; shl eax,8; sub eax,ecx */
    t = (int)(((unsigned int)numerator << 8) - (unsigned int)numerator);
    /* cdq; idiv dword ptr [esp+0Ch] */
    t /= denominator;

    /* call Battle_GetRandomInt; and eax,0FFh (25 FF 00 00 00) */
    r = (unsigned int)Battle_GetRandomInt() & 0xFF;

    /* test esi,esi; jz loc_48F11C */
    if (t == 0)
        return 0;

    /* cmp esi,eax; jb loc_48F11C (opcode 72, unsigned CF). Else mov eax,1 */
    if ((unsigned int)t < r)
        return 0;

    return 1;
}
```
