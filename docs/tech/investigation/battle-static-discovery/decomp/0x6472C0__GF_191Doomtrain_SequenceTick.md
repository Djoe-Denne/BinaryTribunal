# GF_191Doomtrain_SequenceTick @ 0x6472C0

- Instr (live): 10
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=144
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=104
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=112
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GF_191Doomtrain_SequenceTick(int)
- Notes parent: Pump dword_24FC330 add esp,4. INC WORD [ctx+0Ch] chaque tick. neg/sbb/and al,0FEh/+2 → 2 si kept==0 sinon 0. Occupancy/0xD0/0x1D0/GF+0x44/K_GF 0x84 absents.

## C réconcilié

```c
/* GF_191Doomtrain_SequenceTick @ 0x6472C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 10 instr, size 0x1F, end 0x6472DF. cdecl, 1 arg (stack _DWORD arg_0), retn C3.
 * Callee: BdLinkTask_Pump @ 0x508420 add esp,4. EAX = kept node count.
 * WORD 66 FF 41 0C: inc [ctx+0Ch] every tick (after Pump, before EAX transform).
 * Return F7 D8 / 1B C0 / 24 FE / 83 C0 02: Pump==0 -> EAX=2, else EAX=0.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No branches, no setcc, no jpt, no domain::.
 */

int __cdecl BdLinkTask_Pump(int *list_head);
extern int dword_24FC330[4]; /* 0x24FC330 IDA _DWORD[4] size 16 */

int __cdecl GF_191Doomtrain_SequenceTick(int ctx)
{
    int kept;

    kept = BdLinkTask_Pump(dword_24FC330);
    ++*(unsigned short *)(ctx + 0x0C);
    if (kept == 0)
        return 2;
    return 0;
}
```
