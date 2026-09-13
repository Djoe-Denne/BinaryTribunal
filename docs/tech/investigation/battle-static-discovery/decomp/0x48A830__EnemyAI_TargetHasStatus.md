# EnemyAI_TargetHasStatus @ 0x48A830

- Instr (live): 85
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=241
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=206 (retry high/65536 after length+C vide)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1203
- A==B: non
- Push IDB: oui
- SetType: BOOL __cdecl EnemyAI_TargetHasStatus(int p_target_generic, int p_comparator, unsigned int p_status_ai, int p_bool_ignore_comparator)
- Notes parent: 200 party 0..2 jl3 / 201 monsters 3..6 jl7 / else BYTE com_file_id @+0xBB stride 0xD0 jl vs byte_1D2817B (7 slots). occupancy 1+2, pas flag_data. esi=ignore?0:cmp via neg/sbb/not/and. callee add esp 14h EAX count. ignore=0 setnz count!=0 ; ignore!=0 setz/setnz vs comparator==0. Pas de Hex-Rays. GLM B 1er essai length.

## C réconcilié

```c
/* EnemyAI_TargetHasStatus @ 0x48A830
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 85 instr, size 0xC2. IDA type BOOL __cdecl(...). No domain::.
 * Slot stride 0xD0. Occupancy 1+2 = party 0..2 + monsters 3..6. No flag_data test here.
 * com_file_id BYTE @ 0x1D27BCB (base+0xBB). Sentinel byte_1D2817B, jl signed.
 * Callee 0x48A900 add esp,14h. No jpt_. No 66 prefix. No stores.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 */
extern unsigned char byte_1D2817B;      /* 0x1D2817B = com_file_id + 7*0xD0 */

int __cdecl BattleStatus_CheckTargetHasStatus(int p_comparator, unsigned int p_status_ai,
                                              int p_nb_target_with_status_found,
                                              int p_encounter_slot, int a5);

BOOL __cdecl EnemyAI_TargetHasStatus(int p_target_generic, int p_comparator,
                                     unsigned int p_status_ai, int p_bool_ignore_comparator)
{
    int ignore;
    int masked_cmp;
    int count;
    int slot;
    unsigned char *p_com;

    ignore = p_bool_ignore_comparator;
    /* neg/sbb/not/and: ignore==0 -> comparator, else 0 */
    masked_cmp = (ignore == 0) ? p_comparator : 0;
    count = 0; /* xor eax,eax */

    /* sub ecx,0C8h; jz loc_48A8AB. dec ecx; jz loc_48A88D. else walk. */
    if (p_target_generic == 200) {
        /* loc_48A8AB: edi=0; cmp edi,3; jl */
        for (slot = 0; slot < 3; slot++)
            count = BattleStatus_CheckTargetHasStatus(masked_cmp, p_status_ai,
                                                        count, slot, ignore);
    } else if (p_target_generic == 201) {
        /* loc_48A88D: edi=3; cmp edi,7; jl */
        for (slot = 3; slot < 7; slot++)
            count = BattleStatus_CheckTargetHasStatus(masked_cmp, p_status_ai,
                                                        count, slot, ignore);
    } else {
        /* loc_48A857: ebp=0x1D27BCB, edi=0. Every matching slot calls, not first-only. */
        slot = 0;
        p_com = &BATTLE_SLOT_DATA[0xBB];
        while (p_com < &byte_1D2817B) { /* cmp ebp,byte_1D2817B; jl */
            /* xor ecx,ecx; mov cl,[ebp]; cmp ecx,edx */
            if ((unsigned int)*p_com == (unsigned int)p_target_generic)
                count = BattleStatus_CheckTargetHasStatus(masked_cmp, p_status_ai,
                                                            count, slot, ignore);
            p_com += 0xD0;
            slot++;
        }
    }

    /* pop edi/esi/ebp; test ebx; pop ebx. [esp+8]=p_comparator */
    if (ignore == 0) {
        /* setnz cl; mov eax,ecx */
        return count != 0;
    }
    if (count != 0) {
        /* setz al */
        return p_comparator == 0;
    }
    /* setnz al */
    return p_comparator != 0;
}
```
