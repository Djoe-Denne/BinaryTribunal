# BattleSlot_ApplyMonsterStatScaling @ 0x48C1C0

- Instr (live): 192
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1640
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1831
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1503
- A==B: non
- Push IDB: oui
- SetType: unsigned int __cdecl BattleSlot_ApplyMonsterStatScaling(int p_slot_id)
- Notes parent: stride ASM 0xD0. BMI 71*(slot-3). Pas d'occupancy. BYTE stores +0xBD..+0xC1 et +0xC3 (luck +0xC2 non écrit). Indices callee 0/1/2/5 ; SPR/SPD linéaire inline + CapTo255. jle signé 7E cap 255. /10 = 66666667h. Double deref monster_info_section. EAX leftover (0xFF si eva>255, sinon signbit). Pas de Hex-Rays.

## C réconcilié

```c
/* BattleSlot_ApplyMonsterStatScaling @ 0x48C1C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 192 instr, size 0x22C. IDA type unsigned int __cdecl(int p_slot_id). No domain::.
 * BATTLE_SLOT stride 0xD0 (not F_CHAR 0x1D0). BMI monster record stride 71*(slot-3).
 * No occupancy test. No GetRandomInt. BYTE stores only, no 66 prefix, no setcc.
 * 255 clamps are signed jle (7E). MSVC 66666667h = signed /10.
 * Callees: Monster_CalculateScaledStat cdecl 3 args add esp 0Ch (indices 0,1,2,5);
 * CapTo255 cdecl 1 arg add esp 4 (SPR then SPD only).
 */

extern unsigned char BATTLE_SLOT_DATA[];            /* 0x1D27B10 */
extern unsigned char BMI_MONSTER1_DRAW_SPELL_ID1[]; /* 0x1D28F18 */

int __cdecl Monster_CalculateScaledStat(int p_level, unsigned __int8 *p_stat_params, int p_stat_index);
int __cdecl CapTo255(int p_value);

unsigned int __cdecl BattleSlot_ApplyMonsterStatScaling(int p_slot_id)
{
    unsigned char *slot;    /* edi = BATTLE_SLOT_DATA + slot*0xD0 */
    unsigned char *params;  /* esi = *[slot+0] (monster_info_section) */
    unsigned char *bmi;     /* ebp = BMI + 71*(slot-3) */
    int level;               /* BYTE +0xBC, zero-extended */
    int val;
    int a;
    int b;
    int c;
    int d;

    /* lea ecx,[eax+eax*2]; lea edx,[eax+ecx*4]; shl edx,4 → slot*0xD0 */
    slot = BATTLE_SLOT_DATA + p_slot_id * 0xD0;

    /* mov ecx, dword [edi+0]; mov esi, [ecx] — double deref */
    params = *(unsigned char **)(*(void **)slot);

    /* eax=slot-3; lea ebp,[eax+eax*8]; shl ebp,3; sub ebp,eax; add ebp,0x1D28F18 */
    bmi = BMI_MONSTER1_DRAW_SPELL_ID1 + 71 * (p_slot_id - 3);

    /* xor edx,edx; mov dl,[edi+0BCh] */
    level = slot[0xBC];

    /* STR: CalculateScaledStat(level, esi, 0) * [ebp+40h] /10 ; BYTE [edi+0BDh] */
    val = Monster_CalculateScaledStat(level, params, 0);
    val = val * bmi[0x40] / 10;
    if (val > 255) /* jle signed */
        val = 255;
    slot[0xBD] = (unsigned char)val;

    /* VIT: index 1, [ebp+41h] → [edi+0BEh] */
    val = Monster_CalculateScaledStat(level, params, 1);
    val = val * bmi[0x41] / 10;
    if (val > 255)
        val = 255;
    slot[0xBE] = (unsigned char)val;

    /* MAG: index 2, [ebp+42h] → [edi+0BFh] */
    val = Monster_CalculateScaledStat(level, params, 2);
    val = val * bmi[0x42] / 10;
    if (val > 255)
        val = 255;
    slot[0xBF] = (unsigned char)val;

    /* SPR inline linear: CapTo255(c + lvl*a + lvl/b - lvl/d), a..d at esi+28h..+2Bh.
     * ASM: idiv d, then idiv b, sub, add a*lvl, add c. No zero-divisor guard.
     * * [ebp+43h]/10 ; BYTE [edi+0C0h] */
    a = params[0x28];
    b = params[0x29];
    c = params[0x2A];
    d = params[0x2B];
    val = CapTo255(c + level * a + level / b - level / d);
    val = val * bmi[0x43] / 10;
    if (val > 255)
        val = 255;
    slot[0xC0] = (unsigned char)val;

    /* SPD: same linear, esi+2Ch..+2Fh ; pop ebx before /10 imul; [ebp+44h] → [edi+0C1h] */
    a = params[0x2C];
    b = params[0x2D];
    c = params[0x2E];
    d = params[0x2F];
    val = CapTo255(c + level * a + level / b - level / d);
    val = val * bmi[0x44] / 10;
    if (val > 255)
        val = 255;
    slot[0xC1] = (unsigned char)val;

    /* EVA: index 5, [ebp+45h] → [edi+0C3h] (luck +0xC2 not written). Split epilogue. */
    val = Monster_CalculateScaledStat(level, params, 5);
    val = val * bmi[0x45] / 10;
    if (val > 255) {
        /* mov eax,0FFh ; mov [edi+0C3h], al ; pop*; retn */
        slot[0xC3] = 0xFF;
        return 0xFFu;
    }
    /* loc_48C3E1: mov [edi+0C3h], dl ; EAX leftover = signbit of /10 (0 if val>=0) */
    slot[0xC3] = (unsigned char)val;
    return (unsigned int)(val < 0);
}
```
