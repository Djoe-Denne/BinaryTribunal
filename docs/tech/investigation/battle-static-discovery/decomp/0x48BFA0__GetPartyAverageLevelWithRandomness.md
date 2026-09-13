# GetPartyAverageLevelWithRandomness @ 0x48BFA0

- Instr (live): 48
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GetPartyAverageLevelWithRandomness(void)
- Notes parent: stride ASM 0xD0 (pas F_CHAR 0x1D0). 3 slots party 0..2 (level+0x270=0x1D27E3C). Occupancy BYTE com_file_id @+0xBB != 0xFF (pas flag_data 1+2), comme Exact @ 0x48B2E0. BYTE level xor ebx / mov bl. jl 7C / jg 7F signés. GetRandomInt AL only (test al,1), 0 args, pas d'add esp. Magics 66666667h / 99999999h = ±avg/5 truncating, pas (6*avg)/5. Clamp <=0→1, >100→100. Pas de Hex-Rays.

## C réconcilié

```c
/* GetPartyAverageLevelWithRandomness @ 0x48BFA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 48 instr, size 0x74. IDA type int(). No domain::.
 * BATTLE_SLOT stride 0xD0 (not F_CHAR 0x1D0). Party slots 0..2 only
 * (ecx from 0x1D27BCC to 0x1D27E3C = level+0x270). Occupancy is BYTE
 * com_file_id != 0xFF at +0xBB, not flag_data 1+2. BYTE level at +0xBC.
 * Battle_GetRandomInt @ 0x48F020: unsigned __int8, 0 args, no add esp;
 * only AL is consumed (test al,1). No 66 prefix. No stores. No setcc.
 * jl/jg signed (7C / 7F). cdq/idiv esi, no count==0 guard.
 * Odd AL: +avg/5 (magic 66666667h). Even: -avg/5 (magic 99999999h).
 * Truncating idiv, not (6*avg)/5. Clamp signed: <=0 → 1, >100 → 100.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 */

unsigned char __cdecl Battle_GetRandomInt(void);

int __cdecl GetPartyAverageLevelWithRandomness(void)
{
    int sum;                 /* eax */
    int count;               /* esi */
    unsigned char *p_level;  /* ecx = BATTLE_SLOT_DATA.level */
    int avg;                 /* esi after idiv */
    int delta;               /* edx after imul magic */
    unsigned char rnd;      /* AL only */

    sum = 0;                 /* xor eax,eax */
    count = 0;               /* xor esi,esi */
    p_level = &BATTLE_SLOT_DATA[0xBC]; /* 0x1D27BCC */

    do {
        /* cmp [ecx-1], dl (0xFF) ; jz loc_48BFB9 */
        if (p_level[-1] != 0xFF) {
            /* xor ebx,ebx ; mov bl,[ecx] ; add eax,ebx ; inc esi */
            sum += (int)p_level[0];
            count++;
        }
        p_level += 0xD0;
        /* cmp ecx, 0x1D27E3C ; jl loc_48BFAD (signed, opcode 7C) */
    } while ((int)p_level < (int)&BATTLE_SLOT_DATA[0xBC + 0x270]);

    /* cdq ; idiv esi ; mov esi,eax — no esi==0 guard */
    avg = sum / count;

    rnd = Battle_GetRandomInt(); /* test al, 1 ; jz loc_48BFE7 */
    if (rnd & 1) {
        /* 66666667h ; imul esi ; sar edx,1 ; sign(edx) → edx = avg/5 */
        delta = avg / 5;
    } else {
        /* 99999999h = -66666667h → edx = -avg/5 */
        delta = -(avg / 5);
    }
    avg += delta; /* loc_48BFF7 add esi,edx */

    /* test esi,esi ; jg loc_48C005 (signed 7F). esi<=0 → eax=1 */
    if (avg <= 0)
        return 1;

    /* cmp esi,64h ; mov eax,64h ; jg loc_48C011 ; mov eax,esi */
    if (avg > 100)
        return 100;
    return avg;
}
```
