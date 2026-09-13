# GetPartyAverageLevelConstrainedTeam @ 0x48C0A0

- Instr (live): 54
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=22
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=47
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=100
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GetPartyAverageLevelConstrainedTeam(void)
- Notes parent: stride ASM 0xD0 (pas F_CHAR 0x1D0). 3 slots party 0..2 (level+0x270=0x1D27E3C). Occupancy BYTE com_file_id @+0xBB != 0xFF (pas flag_data 1+2), comme Exact @ 0x48B2E0. BYTE level xor edx / mov dl. jl 7C / jg 7F / jle 7E signés. GetRandomInt AL only : call1 test al,1 ; call2 and eax,0FFh puis remainder EDX. Magics 66666667h / 99999999h = ±avg/5 truncating. Clamp divisor [1,100] puis rnd8 % divisor, 0→1, >100→100. Pas de Hex-Rays.

## C réconcilié

```c
/* GetPartyAverageLevelConstrainedTeam @ 0x48C0A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 54 instr, size 0x91. IDA type int(). No domain::.
 * BATTLE_SLOT stride 0xD0 (not F_CHAR 0x1D0). Party slots 0..2 only
 * (ecx from 0x1D27BCC to 0x1D27E3C = level+0x270). Occupancy is BYTE
 * com_file_id != 0xFF at +0xBB, not flag_data 1+2. BYTE level at +0xBC.
 * Battle_GetRandomInt @ 0x48F020: unsigned __int8, 0 args, no add esp.
 * Call1 AL only (test al,1). Call2 and eax,0FFh then remainder EDX.
 * No 66 prefix. No stores. No setcc.
 * jl/jg/jle signed (7C / 7F / 7E). cdq/idiv esi, no count==0 guard.
 * Odd AL: +avg/5 (magic 66666667h). Even: -avg/5 (magic 99999999h).
 * Truncating idiv, not (6*avg)/5. Clamp divisor [1,100] in esi, then
 * rnd8 % divisor. Remainder 0→1, >100→100. Does not return the average.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 */

unsigned char __cdecl Battle_GetRandomInt(void);

int __cdecl GetPartyAverageLevelConstrainedTeam(void)
{
    int sum;                 /* eax */
    int count;               /* esi */
    unsigned char *p_level;  /* ecx = BATTLE_SLOT_DATA.level */
    int avg;                 /* esi after idiv / jitter / clamp */
    int delta;               /* edx after imul magic */
    unsigned char rnd;       /* AL only */
    int remainder;           /* EDX after second idiv */

    sum = 0;                 /* xor eax,eax */
    count = 0;               /* xor esi,esi */
    p_level = &BATTLE_SLOT_DATA[0xBC]; /* 0x1D27BCC */

    do {
        /* cmp byte ptr [ecx-1], 0FFh ; jz loc_48C0B7 */
        if (p_level[-1] != 0xFF) {
            /* xor edx,edx ; mov dl,[ecx] ; add eax,edx ; inc esi */
            sum += (int)p_level[0];
            count++;
        }
        p_level += 0xD0;
        /* cmp ecx, 0x1D27E3C ; jl loc_48C0AA (signed, opcode 7C) */
    } while ((int)p_level < (int)&BATTLE_SLOT_DATA[0xBC + 0x270]);

    /* cdq ; idiv esi ; mov esi,eax — no esi==0 guard */
    avg = sum / count;

    rnd = Battle_GetRandomInt(); /* test al, 1 ; jz loc_48C0E5 */
    if (rnd & 1) {
        /* 66666667h ; imul esi ; sar edx,1 ; sign(edx) → edx = avg/5 */
        delta = avg / 5;
    } else {
        /* 99999999h = -66666667h → edx = -avg/5 */
        delta = -(avg / 5);
    }
    avg += delta; /* loc_48C0F5 add esi,edx */

    /* test esi,esi ; jg loc_48C102. esi<=0 → esi=1, fall through to loc_48C10C */
    if (avg <= 0)
        avg = 1;
    else if (avg > 100) /* cmp esi,64h ; jle loc_48C10C ; mov esi,64h */
        avg = 100;

    /* loc_48C10C: call ; and eax,0FFh ; cdq ; idiv esi ; pop esi ; mov eax,edx */
    rnd = Battle_GetRandomInt();
    remainder = ((int)rnd & 0xFF) % avg;

    /* test eax,eax ; jnz loc_48C126 */
    if (remainder == 0)
        return 1;

    /* cmp eax,64h ; jle locret_48C130 ; mov eax,64h */
    if (remainder > 100)
        return 100;
    return remainder;
}
```
