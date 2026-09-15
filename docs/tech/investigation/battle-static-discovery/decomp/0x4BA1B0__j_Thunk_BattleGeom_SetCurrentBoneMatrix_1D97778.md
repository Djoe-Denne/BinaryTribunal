# j_Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778 @ 0x4BA1B0

- Instr (live): 1
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0 (effort_used=high)
- A==B: oui
- Push IDB: oui
- SetType: int __cdecl j_Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778(void)
- Notes parent: 1 instr E9 jmp 0x5034E0, pas un CALL. 0 args, add esp absent. Occupancy 1+2 absent. EAX passthrough. Cible 0x5034E0 hors body. TYPE_AFTER int __cdecl(). Pas de Hex-Rays.

## C réconcilié

```c
/* j_Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778 @ 0x4BA1B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 1 instr, size 0x5, end 0x4BA1B5. IDA type int(void). cdecl, 0 args.
 * No frame, no saved regs, no sub esp, no retn in this body.
 * Body is E9 2B930400 near JMP to Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778
 * @ 0x5034E0 (rel32 +0x4932B from next_ip 0x4BA1B5). Not a CALL.
 * Callees IDA: empty. add esp: none. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 /
 * GF Exists 0x44: absent. No stores, no jcc, no setcc, no jpt.
 * EAX passthrough from the target. No domain::.
 */

int __cdecl Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778(void);

int __cdecl j_Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778(void)
{
    return Thunk_BattleGeom_SetCurrentBoneMatrix_1D97778();
}
```
