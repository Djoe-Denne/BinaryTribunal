# BattleStatus_CheckTargetHasStatus @ 0x48A900

- Instr (live): 289
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5089 (retry high/65536 after length+C vide, rt=65536)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5119
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4221
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleStatus_CheckTargetHasStatus(int p_comparator, unsigned int p_status_ai, int p_nb_target_with_status_found, int p_encounter_slot, int a5)
- Notes parent: stride 0xD0 lea/shl ; a5==0 HP (1-9=(max/10)*n, 10=SAR/4, else CompareValues) ; a5!=0 bits (WORD status_1 <16, DWORD status_2-16) ; Death code 0 BYTE bypass dead-skip ; flag_data BYTE bit0 ; ja unsigned jpt_48A9E3/jpt_48AAAD ; pas de struct packée ; pas de setcc. GLM A 1er essai length.

## C réconcilié

```c
/* BattleStatus_CheckTargetHasStatus @ 0x48A900
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_ dwords, not Hex-Rays.
 * 289 instr, size 0x324. cdecl. No domain::. EAX = updated count (also written back to stack arg).
 * Slot stride 0xD0 lea/shl. No F_CHAR. No GetRandomInt. No setcc. No slot loop.
 * Callee 0x48A680 EnemyAI_CompareValues add esp,0Ch.
 * jpt_48A9E3 @ 0x48AC24, jpt_48AAAD @ 0x48AC3C, def_48A9E3 @ 0x48AC11.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 FF8BattleSlotData_s[11] stride 0xD0 */

extern int __cdecl EnemyAI_CompareValues(unsigned int left, int op, unsigned int right);

int __cdecl BattleStatus_CheckTargetHasStatus(int p_comparator, unsigned int p_status_ai,
                                              int p_nb_target_with_status_found,
                                              int p_encounter_slot, int a5)
{
    unsigned int off; /* lea/shl: ((slot+slot*2)*4+slot)<<4 = slot*0xD0 */
    int count;
    unsigned int hp;
    unsigned int thresh;
    unsigned int bits;
    unsigned int mask;
    int q;

    off = (unsigned int)p_encounter_slot * 0xD0u;
    count = p_nb_target_with_status_found;

    /* a5!=0 && status_ai==0: Death-special, no dead-skip (48A911). ebx=1. */
    if (a5 != 0 && p_status_ai == 0) {
        /* 84 98 8c 7b d2 01  BYTE flag_data bit0 @ +0x7C (0x1D27B8C). Host field is WORD. */
        if ((BATTLE_SLOT_DATA[off + 0x7C] & 1) == 0)
            return count; /* loc_48A974 */

        if (p_comparator == 0) {
            /* 84 98 90 7b d2 01  BYTE status_1 Death @ +0x80 */
            if ((BATTLE_SLOT_DATA[off + 0x80] & 1) != 0)
                return count + 1;
            return count;
        }
        if (p_comparator == 3) {
            if ((BATTLE_SLOT_DATA[off + 0x80] & 1) == 0)
                return count + 1;
            return count; /* loc_48A968 */
        }
        return count;
    }

    /* loc_48A97A: esi=slot*0xD0. skip unoccupied OR BYTE Death. */
    if ((BATTLE_SLOT_DATA[off + 0x7C] & 1) == 0)
        return count; /* loc_48AC1D */
    if ((BATTLE_SLOT_DATA[off + 0x80] & 1) != 0)
        return count;

    if (a5 != 0) {
        /* loc_48AB6E: status bits. cmp status_ai,10h ; jnb unsigned. */
        if (p_status_ai < 16u) {
            /* 66 8B 86 90 7b d2 01  WORD status_1. shl edx,cl with ebx=1. */
            bits = *(unsigned short *)(BATTLE_SLOT_DATA + off + 0x80);
            mask = 1u << p_status_ai;
            if (p_comparator == 0) {
                if ((bits & mask) != 0)
                    return count + 1;
                return count; /* def_48A9E3 */
            }
            if (p_comparator == 3) {
                if ((bits & mask) == 0)
                    return count + 1;
                return count;
            }
            return count;
        }

        /* status_2 DWORD @ +0x08 (0x1D27B18). add ecx, -16; shl 1,cl. */
        bits = *(unsigned int *)(BATTLE_SLOT_DATA + off + 0x08);
        mask = 1u << (p_status_ai - 16);
        if (p_comparator == 0) {
            if ((bits & mask) != 0)
                return count + 1;
            return count;
        }
        if (p_comparator == 3) {
            if ((bits & mask) == 0)
                return count + 1;
            return count;
        }
        return count;
    }

    /* a5==0: HP form. current_hp DWORD @ +0x18 (0x1D27B28). */
    hp = *(unsigned int *)(BATTLE_SLOT_DATA + off + 0x18);

    /* test ecx,ecx; jbe → ==0. cmp 9 / jbe → 1..9. cmp 0Ah; jnz → else. */
    if (p_status_ai == 0 || p_status_ai > 10u) {
        /* loc_48AB4A: push status_ai, comparator, current_hp; add esp,0Ch */
        return count + EnemyAI_CompareValues(hp, p_comparator, p_status_ai);
    }

    if (p_status_ai == 10u) {
        /* SAR max_hp,2 signed /4. jpt_48A9E3. */
        thresh = (unsigned int)((int)*(unsigned int *)(BATTLE_SLOT_DATA + off + 0x1C) >> 2);
    } else {
        /* 1..9: imul 66666667h; sar edx,2; shr eax,1Fh; add edx,eax; imul edx,ecx
         * = (signed max_hp / 10) * status_ai, THIS order, not max*n/10. */
        q = (int)*(unsigned int *)(BATTLE_SLOT_DATA + off + 0x1C) / 10;
        thresh = (unsigned int)(q * (int)p_status_ai);
    }

    /* Both jpt: cmp ecx/eax,5 ; ja unsigned def_48A9E3. cmp current_hp, thresh UNSIGNED. */
    switch ((unsigned int)p_comparator) {
    case 0:
        return count + (hp == thresh);
    case 1:
        return count + (hp < thresh); /* jnb fail */
    case 2:
        return count + (hp > thresh); /* jbe fail */
    case 3:
        return count + (hp != thresh);
    case 4:
        return count + (hp <= thresh); /* ja fail */
    case 5:
        return count + (hp >= thresh); /* jb fail */
    default:
        return count;
    }
}
```
