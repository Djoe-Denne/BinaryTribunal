# GetPartyAverageLevelExact @ 0x48B2E0

- Instr (live): 20
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=19
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=19
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=20
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GetPartyAverageLevelExact(void)
- Notes parent: stride ASM 0xD0 (pas F_CHAR 0x1D0). 3 slots party 0..2 (level+0x270=0x1D27E3C). Occupancy BYTE com_file_id @+0xBB != 0xFF (pas flag_data 1+2). BYTE level xor ebx / mov bl. jl signé 7C. cdq/idiv esi, pas de garde count==0. Aucun callee. Pas de Hex-Rays.

## C réconcilié

```c
/* GetPartyAverageLevelExact @ 0x48B2E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 20 instr, size 0x2D. IDA type int(). No domain::.
 * BATTLE_SLOT stride 0xD0 (not F_CHAR 0x1D0). Party slots 0..2 only
 * (ecx from 0x1D27BCC to 0x1D27E3C = level+0x270). Occupancy is BYTE
 * com_file_id != 0xFF at +0xBB, not flag_data 1+2. BYTE level at +0xBC.
 * No callees. No 66 prefix. No stores. jl signed. cdq/idiv esi.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 */

int __cdecl GetPartyAverageLevelExact(void)
{
    int sum;                 /* eax */
    int count;               /* esi */
    unsigned char *p_level;  /* ecx = BATTLE_SLOT_DATA.level */

    sum = 0;                 /* xor eax,eax */
    count = 0;               /* xor esi,esi */
    p_level = &BATTLE_SLOT_DATA[0xBC]; /* 0x1D27BCC */

    do {
        /* cmp [ecx-1], dl (0xFF) ; jz loc_48B2F9 */
        if (p_level[-1] != 0xFF) {
            /* xor ebx,ebx ; mov bl,[ecx] ; add eax,ebx ; inc esi */
            sum += (int)p_level[0];
            count++;
        }
        p_level += 0xD0;
        /* cmp ecx, 0x1D27E3C ; jl loc_48B2ED (signed, opcode 7C) */
    } while ((int)p_level < (int)&BATTLE_SLOT_DATA[0xBC + 0x270]);

    /* cdq ; idiv esi — EAX=quotient, EDX discarded. No esi==0 guard. */
    return sum / count;
}
```
