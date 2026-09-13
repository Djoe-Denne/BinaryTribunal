# Battle_RunFileLoadingCallbacks @ 0x48D0C0

- Instr (live): 1
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: __int16 Battle_RunFileLoadingCallbacks(void)
- Notes parent: 1 instr E9 CB 54 FF FF jmp rel32 → 0x482590 (`battle_run_battle_file_callback_2_sub_482590`). Pas CALL, pas add esp, pas de store. AX leftover du worker `__int16()`. Corps 16 slots non inliné. TYPE_AFTER `__int16()`. Pas de Hex-Rays.

## C réconcilié

```c
/* Battle_RunFileLoadingCallbacks @ 0x48D0C0
 * Ground truth = live ASM (asm_clean.asm) + dump_bytes.txt, not Hex-Rays.
 * 1 instr, size 0x5. IDA type __int16(void). No domain::.
 * Bytes E9 CB 54 FF FF = jmp rel32. DISP 0x48D0C5+0xFFFF54CB = 0x482590.
 * Not CALL: no stack, no add esp. AX leftover from target __int16().
 * Do not inline battle_file_callback_2[16] (that body is 0x482590).
 */

__int16 battle_run_battle_file_callback_2_sub_482590(void);

__int16 Battle_RunFileLoadingCallbacks(void)
{
    return battle_run_battle_file_callback_2_sub_482590();
}
```
