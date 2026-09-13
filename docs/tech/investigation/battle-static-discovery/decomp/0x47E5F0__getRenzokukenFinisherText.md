# getRenzokukenFinisherText @ 0x47E5F0

- Instr (live): 11
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: char *__cdecl getRenzokukenFinisherText(int idx)
- Notes parent: stride 24 (lea*3 puis [eax*8+0x1CF758C]), wiki 12 rejeté ; WORD 66 offsetLimitName +0 ; sentinel 0xFFFF → DEFAULT 0x1CFF84C ; sinon DWORD KERNEL_HEADER+0x94 + AND 0xFFFF ; 2× retn C3. Occupancy/0xD0/0x1D0/Exists absents. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* getRenzokukenFinisherText @ 0x47E5F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 11 instr, size 0x2E. End 0x47E61E. IDA type char *__cdecl(int). No domain::.
 * Stride 24: 8D 04 40 lea [eax+eax*2] then 66 8B 04 C5 [eax*8+0x1CF758C].
 * offsetLimitName WORD +0. KERNEL_HEADER @ 0x1CF3E48; DWORD +0x94 @ 0x1CF3EDC.
 * 66 3D FFFF / 75 06 jnz loc_47E60B else B8 DEFAULT_TEXT_WHEN_NOT_FOUND 0x1CFF84C.
 * loc: 8B 0D / 25 FFFF0000 / 8D 84 08 483ECF01. Two retn C3. No callees.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: unused.
 * No setcc. No ja/jg. No jump table. No packed 12-byte struct (wiki 12 rejected).
 */

extern unsigned char K_RENZOKUKEN_FINISHER[]; /* 0x1CF758C, rows 24; IDA itemsize 96 */
extern unsigned char KERNEL_HEADER[];         /* 0x1CF3E48; offsetRenzokukenFinishersText DWORD +0x94 */
extern char DEFAULT_TEXT_WHEN_NOT_FOUND[];    /* 0x1CFF84C */

char *__cdecl getRenzokukenFinisherText(int idx)
{
    unsigned int name_off;
    unsigned int text_off;

    /* 66 MOV AX: WORD at K_RENZOKUKEN_FINISHER + idx*24. High EAX leftover idx*3. */
    name_off = *(unsigned short *)(K_RENZOKUKEN_FINISHER + (unsigned int)idx * 24u);

    if (name_off == 0xFFFFu) /* cmp ax, 0FFFFh ; jnz loc_47E60B */
        return DEFAULT_TEXT_WHEN_NOT_FOUND;

    /* and eax, 0FFFFh ; lea eax, [eax+ecx+KERNEL_HEADER] */
    text_off = *(unsigned int *)(KERNEL_HEADER + 0x94);
    return (char *)(KERNEL_HEADER + text_off + (name_off & 0xFFFFu));
}
```
