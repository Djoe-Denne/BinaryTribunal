# ContainPhysicalDamageFormula @ 0x48F480

- Instr (live): 115
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4896
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2400
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=506
- A==B: non
- Push IDB: oui
- SetType: int __cdecl ContainPhysicalDamageFormula(int p_attacker_slot_id, int p_target_slot_id, int p_AttackPower)
- Notes parent: stride slot 0xD0. Occupancy/F_CHAR absents. GetRandomInt AL+AND 0xFF idiv 33. WORD 66 word_1D28D9x. CRIT_DAMAGE MOVSX /20+2 (sar 3 pas /10). VIT_0 imm32 0x01000000. Gate Petrify|0x180800 bypass 0x04000000. Miss ne saute pas la formule. /256 puis *power. EAX=0 early ou leftover HpModifier add esp 10h. Pas de setcc/ja/jg. Pas de Hex-Rays.

## C réconcilié

```c
/* ContainPhysicalDamageFormula @ 0x48F480
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 115 instr, size 0x17D. End 0x48F5FD.
 * IDA type int __cdecl(int p_attacker_slot_id, int p_target_slot_id, int p_AttackPower).
 * No domain::. EBP = target slot DWORD, not a frame pointer.
 * Slot stride 0xD0 (lea*3 / lea*4 / shl4). Occupancy 1+2 unused. F_CHAR 0x1D0 unused.
 * GetRandomInt AL only + AND 0xFF. No setcc. jz/jnz only (74/75), no ja/jg. No jump table.
 * WORD 66: word_1D28D92 / word_1D28D90. CRIT_DAMAGE MOVSX 0F BF (signed WORD).
 * VIT_0 mask imm32 0x01000000 (F7 C2 00 00 00 01), not a pointer.
 */

unsigned __int8 __cdecl Battle_GetRandomInt(void);
int __cdecl HpModifierComputationForPhysical(
    int p_attacker_slot_id,
    int p_target_slot_id,
    int p_attack_power,
    int p_damage_done);

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 FF8BattleSlotData_s[11] stride 0xD0 */
extern unsigned __int16 word_1D28D90;    /* WORD @ 0x1D28D90 */
extern unsigned __int16 word_1D28D92;    /* WORD @ 0x1D28D92 */
extern unsigned char byte_1D28E00;       /* BYTE @ 0x1D28E00 */
extern unsigned char byte_1D28E03;       /* BYTE @ 0x1D28E03 */
extern unsigned char HIT_TYPE_TARGET_ANIMATION_TO_PLAY; /* BYTE @ 0x1D27ADC */
extern unsigned char COMMAND_TYPE_ID;    /* BYTE @ 0x1D27AD9 */
extern unsigned int HIT_STATUS_2;        /* DWORD @ 0x1D2A234 */
extern unsigned char BOOL_ATTACK_CRITED; /* BYTE @ 0x1D28E07 */
extern __int16 CRIT_DAMAGE;              /* signed WORD @ 0x1D28D94 */

int __cdecl ContainPhysicalDamageFormula(
    int p_attacker_slot_id,
    int p_target_slot_id,
    int p_AttackPower)
{
    unsigned int toff; /* target * 0xD0 */
    unsigned int aoff; /* attacker * 0xD0 */
    int vit;
    int str;
    int str_term;
    int spread;
    int raw;
    int crit_mul;
    unsigned int st2;

    /* 66 A1 / 66 3B WORD compare. jz loc_48F4A6 if equal. Miss does not skip formula. */
    if (word_1D28D92 != word_1D28D90) {
        byte_1D28E00 = 1;
        HIT_TYPE_TARGET_ANIMATION_TO_PLAY = 0xFF; /* C6 ... FF, not 9 */
        goto loc_48F4F6;
    }

    /* loc_48F4A6: cmp byte_1D28E03, cl (CL=0 from xor ecx,ecx) */
    if (byte_1D28E03 != 0) {
        byte_1D28E03 = 0; /* 88 0D ... CL */
        byte_1D28E00 = 1;
        HIT_TYPE_TARGET_ANIMATION_TO_PLAY = 0xFF;
        goto loc_48F4F6;
    }

    /* loc_48F4C4 */
    byte_1D28E00 = 0; /* CL still 0 */
    if (COMMAND_TYPE_ID == 0xFB) {
        /* status_1 BYTE @ +0x80 bit0 Death: and 1; neg; sbb dl,dl; and 5; dec -> 4 or 0xFF */
        toff = (unsigned int)p_target_slot_id * 0xD0u;
        HIT_TYPE_TARGET_ANIMATION_TO_PLAY =
            (unsigned char)((BATTLE_SLOT_DATA[toff + 0x80] & 1) ? 4 : 0xFF);
    }

loc_48F4F6:
    /* test HIT_STATUS_2, 4000000h ; jnz loc_48F526 bypass */
    if ((HIT_STATUS_2 & 0x04000000u) == 0) {
        toff = (unsigned int)p_target_slot_id * 0xD0u;
        /* BYTE F6 status_1 & 4 Petrify ; DWORD F7 status_2 & 0x180800 */
        if ((BATTLE_SLOT_DATA[toff + 0x80] & 4) != 0
            || (*(unsigned int *)(BATTLE_SLOT_DATA + toff + 0x08) & 0x180800u) != 0)
        {
            /* loc_48F522: xor eax,eax ; pop ebp ; retn (ebx/esi/edi not pushed yet) */
            return 0;
        }
    }

    /* loc_48F526 */
    BOOL_ATTACK_CRITED = 0; /* CL still 0 */
    toff = (unsigned int)p_target_slot_id * 0xD0u;
    st2 = *(unsigned int *)(BATTLE_SLOT_DATA + toff + 0x08);
    vit = (int)BATTLE_SLOT_DATA[toff + 0xBE]; /* xor ebx,ebx ; mov bl, vit */
    if ((st2 & 0x01000000u) != 0) /* VIT_0 imm32, IDA "offset VIT_0_STATUS_MASK?" is not a pointer */
        vit = 0;

    /* loc_48F552: AL-only RNG, AND 0xFF, signed idiv ecx=0x21, rem EDX + 0xF0 -> 240..272 */
    spread = (int)(Battle_GetRandomInt() & 0xFF) % 33 + 0xF0;

    aoff = (unsigned int)p_attacker_slot_id * 0xD0u;
    str = (int)BATTLE_SLOT_DATA[aoff + 0xBD]; /* xor edx,edx ; mov dl, str */

    /* str_term = str + str*str/16 : imul; cdq; and 0Fh; add; sar 4; add edi */
    str_term = str + (str * str) / 16;

    /* 0x109=265; imul (265-vit); signed /256 THEN * power; shl 2; signed /128 */
    raw = str_term * (265 - vit);
    raw = raw / 256;
    raw = raw * p_AttackPower;
    raw = raw << 2;
    raw = raw / 128;

    /* MOVSX CRIT_DAMAGE; imul 66666667h; sar edx,3; +sign +2 => signed /20 + 2 */
    crit_mul = (int)CRIT_DAMAGE / 20 + 2;

    raw = raw * crit_mul;
    raw = raw * spread;
    raw = raw / 256;

    /* push eax, edi, ebp, esi ; add esp, 10h ; EAX leftover from callee */
    return HpModifierComputationForPhysical(
        p_attacker_slot_id, p_target_slot_id, p_AttackPower, raw);
}
```
