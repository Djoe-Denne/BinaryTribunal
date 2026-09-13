# GetCharacterEva @ 0x4968A0

- Instr (live): 53
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=81
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GetCharacterEva(int p_char_id, int p_spd)
- Notes parent: CharacterData stride 0x98 (pas F_CHAR 0x1D0). Occupancy 1+2 absents. GetRandomInt absent. JunctionEVA BYTE +0x62 ; Magic 32×{id,qty} +0x10/+0x11 stride 2 ; K_MAGIC 0x3C evaJunctionValue BYTE +0x1D. jl SIGNED vs 0x20. /100 magic 51EB851F + spd SAR 2. 2e arg = SPD caller F_CHAR+0x1BF (IDA p_level). CapTo255 add esp 4. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* GetCharacterEva @ 0x4968A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 53 instr, size 0x8A, end 0x49692A. IDA type int __cdecl(int p_char_id, int p_level).
 * Second arg is SPD: caller 0x495C28 zero-extends F_CHAR[+0x1BF] then SAR 2 here.
 * CharacterData stride 0x98 (lea*9 / *19 / shl 3). F_CHAR 0x1D0 unused in this func.
 * Occupancy 1+2 unused. GetRandomInt unused. GF Exists 0x44 unused. No 66 prefix.
 * BYTE 8A: JunctionEVA +0x62, Magic.id +0x10, Magic.amount +0x11, evaJunctionValue +0x1D.
 * jl SIGNED vs 0x20 (32 magic slots, stride 2). test ecx,ecx / jz after K_MAGIC BYTE load.
 * /100 = 0x51EB851F imul + sar edx,5 + signbit. Return EAX from CapTo255. No domain::.
 */

extern unsigned char SG_ARRAY_CHARA_DATA[]; /* 0x1CFE0E8 CharacterData[8] stride 0x98 */
extern unsigned char K_MAGIC[];             /* 0x1CF4064 FF8KernelMagicData[57] stride 0x3C */

int __cdecl CapTo255(int p_value);

#define OFF_MAGIC_ID      0x10
#define OFF_MAGIC_AMOUNT  0x11
#define OFF_JUNCTION_EVA  0x62
#define OFF_EVA_JUNC_VAL  0x1D

int __cdecl GetCharacterEva(int p_char_id, int p_spd)
{
    unsigned int off;
    int junc_eva;
    int eva_junc;
    int qty;
    int slot;
    int product;

    off = (unsigned int)p_char_id * 0x98u;
    junc_eva = SG_ARRAY_CHARA_DATA[off + OFF_JUNCTION_EVA];
    /* lea edx,[ecx+ecx*2]; lea edx,[edx+edx*4]; mov bl, [edx*4+0x1CF4081] — flags intact */
    eva_junc = K_MAGIC[(unsigned int)junc_eva * 0x3Cu + OFF_EVA_JUNC_VAL];

    qty = 0;
    if (junc_eva != 0) {
        for (slot = 0; slot < 0x20; slot++) {
            if (SG_ARRAY_CHARA_DATA[off + OFF_MAGIC_ID + (unsigned int)slot * 2u] == junc_eva) {
                qty = SG_ARRAY_CHARA_DATA[off + OFF_MAGIC_AMOUNT + (unsigned int)slot * 2u];
                break;
            }
        }
    }

    product = qty * eva_junc;
    /* imul 51EB851Fh; sar edx,5; add signbit => signed /100 toward 0; sar p_spd,2 */
    return CapTo255(product / 100 + (p_spd >> 2));
}
```
