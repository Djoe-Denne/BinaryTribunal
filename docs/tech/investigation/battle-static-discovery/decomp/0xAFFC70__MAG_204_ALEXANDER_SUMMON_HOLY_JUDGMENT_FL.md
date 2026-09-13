# MAG_204_ALEXANDER_SUMMON_HOLY_JUDGMENT_FL @ 0xAFFC70

- Instr (live): 8
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=68
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=13
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=17
- A==B: non
- Push IDB: oui
- SetType: int __cdecl MAG_204_ALEXANDER_SUMMON_HOLY_JUDGMENT_FL()
- Notes parent: FamilyB *_FL Alexander. 2x IO_GetFile_MAGIC mag203_b.00/.01. DWORD A3 dword_2796DA4=.00 then dword_2796DA0=.01. add esp,8 batched. EAX leftover 2e call. Occupancy/0xD0/0x1D0/0x44/0x84/0x9C absents. Pas de jcc/setcc.

## C réconcilié

```c
/* MAG_204_ALEXANDER_SUMMON_HOLY_JUDGMENT_FL @ 0xAFFC70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 8 instr, size 0x22, end 0xAFFC92. IDA type int(); cdecl retn C3.
 * No args. No ebp frame. FRSIZE 0. FRREGS 0. FUNC_THUNK=0.
 * Callee: IO_GetFile_MAGIC @ 0x571B80 void *__cdecl(const char *). Two calls.
 * Push order: mag203_b.00, call; mag203_b.01, DWORD store DA4, call; add esp,8;
 *   DWORD store DA0; retn. Batched cleanup 8 bytes (2 dword pushes).
 * Stores A3 DWORD only (no 66 / no byte). EAX return = second IO_GetFile_MAGIC.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84 / 0x9C: absent.
 * No setcc. No jcc. No jpt. No domain::.
 */

extern void *IO_GetFile_MAGIC(const char *name);
extern int dword_2796DA4;
extern int dword_2796DA0;

int __cdecl MAG_204_ALEXANDER_SUMMON_HOLY_JUDGMENT_FL(void)
{
    int file_00;
    int file_01;

    file_00 = (int)IO_GetFile_MAGIC("mag203_b.00");
    dword_2796DA4 = file_00;
    file_01 = (int)IO_GetFile_MAGIC("mag203_b.01");
    dword_2796DA0 = file_01;
    return file_01;
}
```
