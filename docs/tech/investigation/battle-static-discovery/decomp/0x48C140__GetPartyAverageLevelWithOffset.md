# GetPartyAverageLevelWithOffset @ 0x48C140

- Instr (live): 50
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=89
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GetPartyAverageLevelWithOffset(int)
- Notes parent: stride ASM 0xD0 (pas F_CHAR 0x1D0). 3 slots party 0..2 (level+0x270=0x1D27E3C). Occupancy BYTE com_file_id @+0xBB != 0xFF (pas flag_data 1+2), comme Exact @ 0x48B2E0. BYTE level xor ebx / mov bl. jl 7C / jg 7F / jle 7E signés. GetRandomInt AL only (test al,1). Magics ±avg/5. Clamp jitter [1,100] puis min signé(arg-100, avg). Pas de Hex-Rays.

## C réconcilié

```c
/* GetPartyAverageLevelWithOffset @ 0x48C140
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 50 instr, size 0x7E. IDA type int __cdecl(int). No domain::.
 * BATTLE_SLOT stride 0xD0 (not F_CHAR 0x1D0). Party slots 0..2 only
 * (ecx from 0x1D27BCC to 0x1D27E3C = level+0x270). Occupancy is BYTE
 * com_file_id != 0xFF at +0xBB, not flag_data 1+2. BYTE level at +0xBC.
 * Battle_GetRandomInt @ 0x48F020: unsigned __int8, 0 args, no add esp.
 * One RNG call, AL only (test al,1). No 66 prefix. No stores. No setcc.
 * jl/jg/jle signed (7C / 7F / 7E). cdq/idiv esi, no count==0 guard.
 * Odd AL: +avg/5 (magic 66666667h). Even: -avg/5 (magic 99999999h).
 * Truncating idiv, not (6*avg)/5. Clamp jittered avg [1,100], then
 * signed min(arg-100, clamped_avg). Function does not re-clamp EAX.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 */

unsigned char __cdecl Battle_GetRandomInt(void);

int __cdecl GetPartyAverageLevelWithOffset(int scene_level_code)
{
    int sum;                 /* eax */
    int count;               /* esi */
    unsigned char *p_level;  /* ecx = BATTLE_SLOT_DATA.level */
    int avg;                 /* esi after idiv / jitter / clamp */
    int delta;               /* edx after imul magic */
    unsigned char rnd;       /* AL only */
    int offset_level;        /* eax = arg_0 - 100 */

    sum = 0;                 /* xor eax,eax */
    count = 0;               /* xor esi,esi */
    p_level = &BATTLE_SLOT_DATA[0xBC]; /* 0x1D27BCC */
    /* mov dl,0FFh once before loc_48C14D; reused each cmp */

    do {
        /* cmp [ecx-1], dl ; jz loc_48C159  (opcode 38 = r/m8) */
        if (p_level[-1] != 0xFF) {
            /* xor ebx,ebx ; mov bl,[ecx] ; add eax,ebx ; inc esi */
            sum += (int)p_level[0];
            count++;
        }
        p_level += 0xD0;
        /* cmp ecx, 0x1D27E3C ; jl loc_48C14D (signed, opcode 7C) */
    } while ((int)p_level < (int)&BATTLE_SLOT_DATA[0xBC + 0x270]);

    /* cdq ; idiv esi ; mov esi,eax — no esi==0 guard */
    avg = sum / count;

    rnd = Battle_GetRandomInt(); /* test al,1 ; jz loc_48C187 */
    if (rnd & 1) {
        /* 66666667h ; imul esi ; sar edx,1 ; sign(edx) → edx = avg/5 */
        delta = avg / 5;
    } else {
        /* 99999999h = -66666667h → edx = -avg/5 */
        delta = -(avg / 5);
    }
    avg += delta; /* loc_48C197 add esi,edx */

    /* test esi,esi ; jg loc_48C1A4. esi<=0 → esi=1, jmp loc_48C1AE */
    if (avg <= 0)
        avg = 1;
    else if (avg > 100) /* cmp esi,64h ; jle loc_48C1AE ; mov esi,64h */
        avg = 100;

    /* loc_48C1AE: mov eax,[esp+0Ch] ; sub eax,64h ; cmp eax,esi ; jl keep */
    offset_level = scene_level_code - 100;
    if (offset_level < avg) /* signed jl 7C */
        return offset_level;
    return avg;
}
```
