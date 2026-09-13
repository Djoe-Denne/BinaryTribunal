# increaseCharaStatBy1 @ 0x495F90

- Instr (live): 65
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=32
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl increaseCharaStatBy1(int p_target_slot_id, int a2)
- Notes parent: CharacterData stride 0x98 (pas F_CHAR 0x1D0). Occupancy 1+2 absente. GetRandomInt absent. ja unsigned vs 5, jpt_495FB3 6 dwords STR/VIT/MAG/SPR/SPD/LCK +0x0A..+0x0F. BYTE stores AL. CapTo255 add esp 4, EAX leftover. Case 5 tombe dans def pop/ret. Default EAX=a2. Pas de Hex-Rays.

## C réconcilié

```c
/* increaseCharaStatBy1 @ 0x495F90
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_495FB3,
 * not Hex-Rays. 65 instr, size 0xA2. End 0x496032. No domain::.
 * IDA type: int __cdecl(int p_target_slot_id, int a2).
 * CharacterData stride 0x98 (152) at 0x1CFE0E8. F_CHAR 0x1D0 unused.
 * Occupancy 1+2 unused. GetRandomInt unused. No 66 prefix.
 * BYTE stats +0x0A..+0x0F. ja UNSIGNED vs 5. CapTo255 add esp 4, jle signed.
 * Case 5 store falls into def_495FB3 pop/ret. Default: no store, EAX=a2.
 */

extern unsigned char SG_PARTY_BATTLE[];    /* 0x1CFE74C BYTE */
extern unsigned char SG_ARRAY_CHARA_DATA[]; /* 0x1CFE0E8 CharacterData[8] stride 0x98 */

int __cdecl CapTo255(int p_value); /* 0x495930, cdecl add esp 4 */

int __cdecl increaseCharaStatBy1(int p_target_slot_id, int a2)
{
    unsigned char *row;
    unsigned int char_id;
    int capped;

    /* xor eax,eax ; mov al, SG_PARTY_BATTLE[ecx] */
    char_id = (unsigned char)SG_PARTY_BATTLE[p_target_slot_id];
    /* lea edx,[eax+eax*8]; lea eax,[eax+edx*2]; lea esi,1CFE0E8h[eax*8] */
    row = SG_ARRAY_CHARA_DATA + char_id * 0x98u;

    /* cmp eax,5 ; ja (77) def_495FB3 */
    if ((unsigned int)a2 > 5u)
        return a2;

    switch (a2) {
    case 0: /* loc_495FBA STR +0x0A */
        capped = CapTo255((int)row[0x0A] + 1);
        row[0x0A] = (unsigned char)capped;
        return capped;
    case 1: /* loc_495FCE VIT +0x0B */
        capped = CapTo255((int)row[0x0B] + 1);
        row[0x0B] = (unsigned char)capped;
        return capped;
    case 2: /* loc_495FE2 MAG +0x0C */
        capped = CapTo255((int)row[0x0C] + 1);
        row[0x0C] = (unsigned char)capped;
        return capped;
    case 3: /* loc_495FF6 SPR +0x0D */
        capped = CapTo255((int)row[0x0D] + 1);
        row[0x0D] = (unsigned char)capped;
        return capped;
    case 4: /* loc_49600A SPD +0x0E */
        capped = CapTo255((int)row[0x0E] + 1);
        row[0x0E] = (unsigned char)capped;
        return capped;
    case 5: /* loc_49601E LCK +0x0F then def_495FB3 pop/ret */
        capped = CapTo255((int)row[0x0F] + 1);
        row[0x0F] = (unsigned char)capped;
        return capped;
    }
    return a2;
}
```
