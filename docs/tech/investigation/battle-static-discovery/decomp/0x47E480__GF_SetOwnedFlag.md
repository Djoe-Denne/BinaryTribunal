# GF_SetOwnedFlag @ 0x47E480

- Instr (live): 9
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=66
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=30
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=88
- A==B: non (sémantique identique ; forme d’index `<<2` / `*17*4` / `*68`)
- Push IDB: oui
- SetType: int __cdecl GF_SetOwnedFlag(int p_gforce_id);
- Notes parent: octets live `8B C8 C1 E1 04 03 C8` = ecx=id*17 ; `8D 04 8D B9 DC CF 01` = lea eax,[0x1CFDCB9+ecx*4] stride 0x44 ; `8A 0C 8D …` / `80 C9 01` / `88 08` = BYTE load, or 1, BYTE store ; `C3` EAX leftover = adresse Exists. Réconciliation Grok 4.6 Extra High.

## C réconcilié

```c
/* GF_SetOwnedFlag @ 0x47E480
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 9 instr, size 31. cdecl. BYTE store. stride 0x44.
 */

int __cdecl GF_SetOwnedFlag(int p_gforce_id)
{
    unsigned char *p_exists;
    unsigned char flags;

    /* ecx = id; shl 4; add eax => id*17; lea eax,[0x1CFDCB9+ecx*4] => +id*0x44 */
    p_exists = (unsigned char *)(0x1CFDCB9 + ((p_gforce_id * 17) << 2));

    flags = *p_exists; /* mov cl, byte [0x1CFDCB9+ecx*4] */
    flags |= 1u;       /* or cl, 1 — set bit0, preserve other bits */
    *p_exists = flags; /* mov [eax], cl — BYTE, 88 08 */

    return (int)p_exists; /* EAX leftover from lea = address of Exists */
}
```
