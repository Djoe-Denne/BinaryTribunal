# MAG_203_CERBERUS_SUMMON_COUNTER_ROCKETS_FL @ 0xB0C170

- Instr (live): 8
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=20
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=17
- A==B: non
- Push IDB: oui
- SetType: int __cdecl MAG_203_CERBERUS_SUMMON_COUNTER_ROCKETS_FL()
- Notes parent: FamilyB *_FL Cerberus. 2x IO_GetFile_MAGIC mag202_b.00/.01 (catalogue MAG_203 ≠ fichier mag202). DWORD A3 dword_2796DDC=.00 then dword_2796DD8=.01. add esp,8 batched. EAX leftover 2e call. Occupancy/0xD0/0x1D0/0x44/0x84/0x9C absents. Pas de jcc/setcc.

## C réconcilié

```c
/* MAG_203_CERBERUS_SUMMON_COUNTER_ROCKETS_FL @ 0xB0C170
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 8 instr, size 0x22, end 0xB0C192. IDA type int(); cdecl retn C3.
 * No args. No ebp frame. FRSIZE 0. FRREGS 0. FUNC_THUNK=0.
 * Callee: IO_GetFile_MAGIC @ 0x571B80 void *__cdecl(const char *). Two calls.
 * Push order: mag202_b.00, call; mag202_b.01, DWORD store DDC, call; add esp,8;
 *   DWORD store DD8; retn. Batched cleanup 8 bytes (2 dword pushes).
 * Stores A3 DWORD only (no 66 / no byte). EAX return = second IO_GetFile_MAGIC.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84 / 0x9C: absent.
 * No setcc. No jcc. No jpt. No domain::.
 * Catalog MAG_203 != file mag202 (slot = effect_id-1 = 202).
 */

extern void *IO_GetFile_MAGIC(const char *name);
extern int dword_2796DDC;
extern int dword_2796DD8;

int __cdecl MAG_203_CERBERUS_SUMMON_COUNTER_ROCKETS_FL(void)
{
    int file_00;
    int file_01;

    file_00 = (int)IO_GetFile_MAGIC("mag202_b.00");
    dword_2796DDC = file_00;
    file_01 = (int)IO_GetFile_MAGIC("mag202_b.01");
    dword_2796DD8 = file_01;
    return file_01;
}
```
