# Op43_PlaySE @ 0x8E03D0

- Instr (live): 19
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=11
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=14
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int Op43_PlaySE(void)
- Notes parent: 19 instr, size 0x46, retn C3. `BdPlaySE` cdecl 3 args (`add esp,0xC`): pos = table[`[slot+0x4A]>>9`] + table, table = `[seqCtx+0xC4]`, sound = movsx word `[IP+2]`, attr `0x80`. IP reload puis +4 ; EAX = nouvel IP. STREAM16[43] @ 0x1852B44. Opcode 43 (pas 172). Occupancy 1+2 / 0xD0 / 0x1D0 / GFSG 0x44 / K_GF 0x84 absents. Prefix 66 sur `[slot+0x4A]`.

## C réconcilié

```c
/* Op43_PlaySE @ 0x8E03D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 19 instr, size 0x46, end 0x8E0416. IDA type int().
 * No args, no prologue, no saved regs, no locals. retn C3 (not retn N).
 * cdecl callee BdPlaySE @ 0x501330, add esp 0xC.
 * STREAM16[43] dword 0x1852B44 = 0x8E03D0. Opcode 43, not 172.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No packed struct. No domain::.
 */

extern int __cdecl BdPlaySE(unsigned int *, int, unsigned int);
extern unsigned char *g_MagVm_IP;
extern unsigned char *g_GfCinematic_SequenceCtxPtr;
extern unsigned char *g_GfCinematic_RuntimeSlotPtr;

int Op43_PlaySE(void)
{
    unsigned char *ip;
    unsigned int *table;
    unsigned int idx;
    int sound_id;

    ip = g_MagVm_IP;
    sound_id = *(short *)(ip + 2);

    table = *(unsigned int **)(g_GfCinematic_SequenceCtxPtr + 0xC4);

    idx = *(unsigned short *)(g_GfCinematic_RuntimeSlotPtr + 0x4A);
    idx >>= 9;

    BdPlaySE(
        (unsigned int *)((unsigned char *)table + table[idx]),
        sound_id,
        0x80u);

    ip = g_MagVm_IP;
    ip += 4;
    g_MagVm_IP = ip;
    return (int)ip;
}
```
