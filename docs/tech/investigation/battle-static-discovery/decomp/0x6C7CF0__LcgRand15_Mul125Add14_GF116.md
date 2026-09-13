# LcgRand15_Mul125Add14_GF116 @ 0x6C7CF0

- Instr (live): 7
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl LcgRand15_Mul125Add14_GF116()
- Notes parent: DWORD seed `GF_116Quezacotl_RngSeed` @ 0x025217A0. Trois `lea [eax+eax*4]` (+14) = `x*125+14` puis `and 7FFFh`. EAX = nouveau seed. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas de CALL, pas de GetRandomInt, pas de LCG 69069.

## C réconcilié

```c
/* LcgRand15_Mul125Add14_GF116 @ 0x6C7CF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 7 instr, size 0x1A, end 0x6C7D0A. IDA type int(). cdecl, 0 args.
 * No prologue, no saved regs, no locals. retn C3 (not retn N).
 * Bytes: A1 A0 17 52 02 / 8D 04 80 / 8D 04 80 / 8D 44 80 0E / 25 FF 7F 00 00 / A3 A0 17 52 02 / C3
 * Seed DWORD @ 0x025217A0. lea*3 = x*125+14, then AND 7FFFh. EAX = new seed 0..32767.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / K_GF 0x84: absent.
 * No CALL, no GetRandomInt, no 69069 camera LCG. No packed struct. No domain::.
 */

extern unsigned int GF_116Quezacotl_RngSeed; /* DWORD 0x025217A0 */

int __cdecl LcgRand15_Mul125Add14_GF116(void)
{
    unsigned int seed;

    seed = GF_116Quezacotl_RngSeed; /* A1 mov eax, [0x025217A0] */
    seed = seed * 5;               /* 8D 04 80 lea eax,[eax+eax*4] */
    seed = seed * 5;               /* 8D 04 80 */
    seed = seed * 5 + 14;          /* 8D 44 80 0E → x*125+14 */
    seed &= 0x7FFF;                 /* 25 FF 7F 00 00 */
    GF_116Quezacotl_RngSeed = seed; /* A3 mov [0x025217A0], eax */
    return (int)seed;
}
```
