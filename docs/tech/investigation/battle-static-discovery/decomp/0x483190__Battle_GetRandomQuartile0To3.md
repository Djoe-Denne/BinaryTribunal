# Battle_GetRandomQuartile0To3 @ 0x483190

- Instr (live): 16
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_GetRandomQuartile0To3();
- Notes parent: `GetRandomInt` AL only puis `and eax,0FFh` ; `jge` signed vs `40h`/`80h` ; `setnl cl` + `add ecx,2` → buckets 64-wide 0..3 ; 0 args donc pas de `add esp` ; EAX 0/1/2/3.

## C réconcilié

```c
/* Battle_GetRandomQuartile0To3 @ 0x483190
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes. 16 instr.
 * cdecl int(); three retn paths write EAX 0 / 1 / 2 / 3.
 */

extern unsigned char __cdecl Battle_GetRandomInt(void); /* AL only; 0 args, no add esp */

int __cdecl Battle_GetRandomQuartile0To3(void)
{
    int r;

    /* call Battle_GetRandomInt ; and eax, 0FFh (25 FF 00 00 00)
     * callee writes AL only — do not treat EAX as a clean int. */
    r = Battle_GetRandomInt() & 0xFF;

    /* cmp eax, 40h ; jge loc_4831A2 (opcode 7D, signed). Else xor eax,eax ; retn */
    if (r < 0x40)
        return 0;

    /* loc_4831A2: cmp eax, 80h ; jge loc_4831AF */
    if (r < 0x80)
        return 1;

    /* loc_4831AF: xor ecx,ecx ; cmp eax, 0C0h ; setnl cl ; add ecx, 2 ; mov eax, ecx */
    return 2 + (r >= 0xC0);
}
```
