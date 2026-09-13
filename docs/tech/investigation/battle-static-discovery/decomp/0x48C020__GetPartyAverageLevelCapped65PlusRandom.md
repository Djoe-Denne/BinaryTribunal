# GetPartyAverageLevelCapped65PlusRandom @ 0x48C020

- Instr (live): 47
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=41
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GetPartyAverageLevelCapped65PlusRandom(void)
- Notes parent: stride ASM 0xD0 (pas F_CHAR 0x1D0). 3 slots party 0..2. Occupancy BYTE com_file_id @+0xBB != 0xFF (pas flag_data 1+2), comme Exact 0x48B2E0. BYTE level xor edx / mov dl. jl 7C / jg 7F. 1er GetRandomInt = test al,1. 2e/3e and eax,0FFh puis MSVC signed %4 (≡ byte&3). Clamp [1,65]. Pas de Hex-Rays.

## C réconcilié

```c
/* GetPartyAverageLevelCapped65PlusRandom @ 0x48C020
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 47 instr, size 0x7E. IDA type int(). No domain::.
 * BATTLE_SLOT stride 0xD0 (not F_CHAR 0x1D0). Party slots 0..2 only
 * (ecx from 0x1D27BCC to 0x1D27E3C = level+0x270). Occupancy is BYTE
 * com_file_id != 0xFF at +0xBB, not flag_data 1+2. BYTE level at +0xBC.
 * Callee Battle_GetRandomInt @ 0x48F020 unsigned __int8, 0 args, no add esp.
 * First RNG: test al,1 only. Later: and eax,0FFh then MSVC signed %4.
 * No 66 prefix. No stores. jl/jg signed. Clamp [1, 65].
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 */
unsigned char __cdecl Battle_GetRandomInt(void);

int __cdecl GetPartyAverageLevelCapped65PlusRandom(void)
{
    int sum;                 /* eax */
    int count;               /* esi */
    unsigned char *p_level;  /* ecx = BATTLE_SLOT_DATA.level */
    int avg;                 /* esi after idiv */
    int jitter;              /* eax after 2nd/3rd rng */

    sum = 0;                 /* xor eax,eax */
    count = 0;               /* xor esi,esi */
    p_level = &BATTLE_SLOT_DATA[0xBC]; /* 0x1D27BCC */

    do {
        /* cmp byte ptr [ecx-1], 0FFh ; jz loc_48C037 */
        if (p_level[-1] != 0xFF) {
            /* xor edx,edx ; mov dl,[ecx] ; add eax,edx ; inc esi */
            sum += (int)p_level[0];
            count++;
        }
        p_level += 0xD0;
        /* cmp ecx, 0x1D27E3C ; jl loc_48C02A (signed, opcode 7C) */
    } while ((int)p_level < (int)&BATTLE_SLOT_DATA[0xBC + 0x270]);

    /* cdq ; idiv esi ; mov esi,eax — no esi==0 guard */
    avg = sum / count;

    /* call Battle_GetRandomInt ; test al,1 ; jz loc_48C06D */
    if (Battle_GetRandomInt() & 1) {
        /* odd: add (byte % 4) */
        jitter = Battle_GetRandomInt() & 0xFF;
        jitter = jitter % 4; /* and 80000003h / jns / dec / or / inc */
        avg += jitter;
    } else {
        /* even: sub (byte % 4) */
        jitter = Battle_GetRandomInt() & 0xFF;
        jitter = jitter % 4;
        avg -= jitter;
    }

    /* test esi,esi ; jg loc_48C090 (signed 7F) */
    if (avg <= 0)
        return 1;

    /* cmp esi,41h ; mov eax,41h ; jg loc_48C09C ; mov eax,esi */
    if (avg > 65)
        return 65;
    return avg;
}
```
