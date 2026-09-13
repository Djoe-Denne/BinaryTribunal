# Draw_ComputeStealCount @ 0x48FD20

- Instr (live): 83
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=744
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=48
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1544
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Draw_ComputeStealCount(int p_attacker_slot_id, int p_target_slot_id, int p_magic_id)
- Notes parent: stride slot 0xD0; occupancy / F_CHAR 0x1D0 absents; BMI71[71*target] BYTE; deux loads `monster_info_section`; LowLvlDraw +0x104 {id,amount}×4; level BYTE +0xBC; mag BYTE +0xBF; K_MAGIC stride 0x3C drawResist +0x0C; GetRandomInt AL only puis AND 0xFF puis signed %32; /5 via 66666667h; clamp jns/jle signés; pas de setcc; pas de ja/jg; pas de 66.

## C réconcilié

```c
/* Draw_ComputeStealCount @ 0x48FD20
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 83 instr, size 0xE9. End 0x48FE09. IDA type int __cdecl(int,int,int). No domain::.
 * Slot stride 0xD0 (lea*3/+*4/shl4). Occupancy unused. F_CHAR 0x1D0 unused.
 * BMI71 BYTE[143] @ 0x1D28E89, index 71*target (lea*9/shl3/sub).
 * GetRandomInt AL only; AND 0xFF then MSVC signed %32 (AND 8000001Fh; jns).
 * BYTE: BMI71, LowLvlDraw id/amount, level +0xBC, mag +0xBF, drawResist +0x0C.
 * DWORD: args, monster_info ptr, AND 25, imul F7 E9. No WORD / no 66.
 * No setcc. jl/jle/jns signed (7C / 7E / 79). No ja/jg. No jump table.
 * No packed struct: live offsets only.
 */

extern unsigned char BATTLE_SLOT_DATA[];              /* 0x1D27B10, FF8BattleSlotData_s[11], stride 0xD0 */
extern unsigned char BMI71_LOW_MED_HIGH_LEVEL_BIS[]; /* 0x1D28E89 */
extern unsigned char K_MAGIC[];                       /* 0x1CF4064, stride 0x3C */

unsigned char __cdecl Battle_GetRandomInt(void); /* AL only; 0 args, no add esp */

int __cdecl Draw_ComputeStealCount(int p_attacker_slot_id, int p_target_slot_id, int p_magic_id)
{
    unsigned char *tgt;   /* target slot, stride 0xD0 */
    unsigned char *atk;   /* attacker slot, stride 0xD0 */
    unsigned char *info;  /* **monster_info_section */
    unsigned char *entry;
    int rand_val;
    int tier;
    int amount;
    int i;
    int lvl_term;
    int total;

    /* call Battle_GetRandomInt; and eax,0FFh (25 FF 00 00 00)
     * and eax,8000001Fh (25 1F 00 00 80); jns loc_48FD3A (79 05)
     * else dec / or 0FFFFFFE0h / inc. After AND 0xFF, EAX is 0..255 so jns always. */
    rand_val = (int)Battle_GetRandomInt() & 0xFF;
    rand_val &= 0x8000001F;
    if (rand_val < 0) {
        rand_val = ((rand_val - 1) | (int)0xFFFFFFE0) + 1;
    }
    rand_val += 1; /* 48fd42 inc eax → (byte % 32) + 1 */

    /* lea edx,[ecx+ecx*2]; lea esi,[ecx+edx*4]; shl esi,4 → target*0xD0 */
    tgt = BATTLE_SLOT_DATA + (unsigned int)p_target_slot_id * 0xD0u;
    /* lea edi,[ecx+ecx*8]; shl edi,3; sub edi,ecx → target*71 */
    tier = (int)BMI71_LOW_MED_HIGH_LEVEL_BIS[71 * p_target_slot_id];
    /* 48fd66: DWORD-store zero-ext tier over [esp+18h] (arg1 reused as local) */

    /* mov edx, dword [esi+0x1D27B10]; mov ebx,[edx] — two DWORD loads */
    info = **(unsigned char ***)tgt;

    /* lea edi,[ebx+ecx*8+104h]; 4 x {BYTE id, BYTE amount}, add edi,2; jl signed */
    amount = 1; /* 48fd82 mov edi,1 if scan misses */
    entry = info + 0x104 + tier * 8;
    for (i = 0; i < 4; i++) {
        /* xor ecx,ecx; mov cl,[edi]; cmp ebp,ecx */
        if (p_magic_id == (int)entry[0]) {
            /* loc_48FDEA: ecx=saved tier; lea edx,[edx+ecx*4]
             * mov cl,[ebx+edx*2+105h] */
            amount = (int)info[(i + tier * 4) * 2 + 0x105];
            break;
        }
        entry += 2;
    }

    /* loc_48FD87 shared tail. ecx = attacker*0xD0. esi still target*0xD0 until 48fdaf. */
    atk = BATTLE_SLOT_DATA + (unsigned int)p_attacker_slot_id * 0xD0u;

    /* xor edx,edx; mov dl, level[+0xBC]; BYTE zero-ext then signed sub */
    lvl_term = (int)atk[0xBC] - (int)tgt[0xBC];
    lvl_term += 10;          /* add ebx, 0Ah */
    lvl_term >>= 1;         /* D1 FB sar ebx,1 */

    /* lea edx,[ebp+ebp*2]; lea esi,[edx+edx*4] → magic*15; [esi*4+0x1CF4070]
     * = K_MAGIC[id*0x3C + 0x0C] drawResist BYTE. esi overwrites target*0xD0 here. */
    lvl_term -= (int)K_MAGIC[(unsigned int)p_magic_id * 0x3Cu + 0x0C];

    /* mov dl, mag[+0xBF]; add eax,ebx; ecx=edx; add ecx,eax */
    total = rand_val + lvl_term + (int)atk[0xBF];

    /* mov eax,66666667h; imul ecx (F7 E9); sar edx,1; shr eax,1Fh; add edx,eax */
    total = total / 5;
    total -= amount; /* sub eax, edi */

    /* pops then jns loc_48FDFE (79 17, flags from sub); else xor eax,eax retn */
    if (total < 0)
        return 0;
    /* cmp eax,9; jle locret_48FE08 (7E 05); else mov eax,9 */
    if (total > 9)
        total = 9;
    return total;
}
```
