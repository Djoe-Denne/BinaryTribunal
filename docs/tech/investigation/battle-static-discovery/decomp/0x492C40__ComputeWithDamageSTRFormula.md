# ComputeWithDamageSTRFormula @ 0x492C40

- Instr (live): 167
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=806
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=811
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=65
- A==B: non
- Push IDB: oui
- SetType: int __cdecl ComputeWithDamageSTRFormula(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power, int a4)
- Notes parent: slot*0xD0 ; occupancy/F_CHAR 0x1D0 absents (NumKills CharacterData 152) ; GetRandomInt AL+AND 0xFF case 0/19 ; VIT_0 TEST imm 0x01000000 jz keep ; ja unsigned switch 20 / jpt 6 ; jge signed slot>=3 ; 66 NumKills WORD ; case 19 fallthrough ; pas de setcc/CRIT /20+2

## C réconcilié

```c
/* ComputeWithDamageSTRFormula @ 0x492C40
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 167 instr, size 0x1A1, end 0x492DE1. IDA type int __cdecl(int,int,int,int). No domain::.
 * Slot stride 0xD0. Occupancy 1+2 unused. F_CHAR 0x1D0 unused (NumKills CharacterData 152).
 * GetRandomInt AL only then AND 0xFF. Switch bound UNSIGNED ja. jge signed slot>=3.
 * VIT_0 TEST ECX, imm 0x01000000 (F7 C1 00 00 00 01), not a pointer. WORD NumKills 66 prefix.
 * No setcc. No CRIT /20+2 (crit is caller computeCrit + callee HpModifier).
 */

unsigned char __cdecl Battle_GetRandomInt(void); /* AL only, no add esp */
int __cdecl HpModifierComputationForPhysical(int p_attacker_slot_id, int p_target_slot_id,
                                             int p_attack_power, int p_damage_done); /* add esp,10h */

extern unsigned char HIT_TYPE_2;            /* 0x1D27ADE BYTE ; miss bit 0x4 */
extern unsigned char BATTLE_SLOT_DATA[];    /* 0x1D27B10 stride 0xD0 */
extern unsigned char SG_PARTY_BATTLE[];     /* 0x1CFE74C BYTE, slot -> char_id */
extern unsigned char SG_ARRAY_CHARA_DATA[]; /* 0x1CFE0E8 CharacterData[8] stride 0x98 */

#define OFF_STATUS2  0x08
#define OFF_CURHP    0x18
#define OFF_MAXHP    0x1C
#define OFF_FLAGDATA 0x7C
#define OFF_STR      0xBD
#define OFF_VIT      0xBE
#define OFF_NUMKILLS 0x90

#define BS8(slot, off)  (*(unsigned char *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))
#define BS32(slot, off) (*(unsigned int  *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))
#define BS32S(slot, off) (*(int          *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))

static int sdiv16(int v) { return (v + ((v >> 31) & 0xF)) >> 4; }    /* cdq; and edx,0Fh; sar 4 */
static int sdiv256(int v) { return (v + ((v >> 31) & 0xFF)) >> 8; }  /* cdq; and edx,0FFh; sar 8 */

int __cdecl ComputeWithDamageSTRFormula(int p_attacker_slot_id, int p_target_slot_id,
                                        int p_attack_power, int a4)
{
    unsigned int vit;
    unsigned int status_2;
    int raw;
    unsigned char hit;

    /* lea eax,[esi+esi*2]; lea eax,[esi+eax*4]; shl eax,4 => target*0xD0 (EAX kept for case 1) */
    status_2 = BS32(p_target_slot_id, OFF_STATUS2);
    vit = (unsigned int)BS8(p_target_slot_id, OFF_VIT); /* xor ebx,ebx; mov bl */

    /* test ecx, 01000000h ; jz loc_492C69 (keep vit) ; xor ebx,ebx */
    if (status_2 & 0x01000000u)
        vit = 0;

    /* cmp a4,13h ; ja def_492C86 UNSIGNED. byte_492DFC + jpt_492C86 (6 dwords). */
    switch (a4) {
    case 19:
        vit = 0; /* loc_492C8D xor ebx,ebx then fall through into loc_492C8F */
        /* fall through */
    case 0: {
        int spread;
        int str;
        int str_term;
        int tmp;

        /* call GetRandomInt; and eax,0FFh ; cdq; idiv 21h ; add edx,0F0h */
        spread = ((int)(Battle_GetRandomInt() & 0xFFu) % 33) + 0xF0;

        str = (int)BS8(p_attacker_slot_id, OFF_STR); /* xor edx,edx; mov dl */
        str_term = str + sdiv16(str * str);
        tmp = sdiv256((0x109 - (int)vit) * str_term); /* 0x109 = 265 */
        tmp = sdiv16(tmp * p_attack_power);
        raw = sdiv256(tmp * spread);
        return HpModifierComputationForPhysical(p_attacker_slot_id, p_target_slot_id,
                                                p_attack_power, raw);
    }
    case 1:
        /* EAX still = target*0xD0 from prologue */
        if (BS32(p_target_slot_id, OFF_FLAGDATA) & 0x10000u) {
            hit = HIT_TYPE_2;     /* 8A 0D */
            hit |= 4u;            /* 80 C9 04 */
            HIT_TYPE_2 = hit;     /* 88 0D BYTE */
            raw = 0;
        } else {
            raw = sdiv16(BS32S(p_target_slot_id, OFF_CURHP) * p_attack_power);
        }
        return HpModifierComputationForPhysical(p_attacker_slot_id, p_target_slot_id,
                                                p_attack_power, raw);
    case 3:
        raw = BS32S(p_attacker_slot_id, OFF_MAXHP) * 5; /* lea eax,[eax+eax*4] */
        return HpModifierComputationForPhysical(p_attacker_slot_id, p_target_slot_id,
                                                p_attack_power, raw);
    case 16:
        if (p_target_slot_id >= 3) { /* cmp esi,3 ; jge loc_492DB9 SIGNED */
            raw = 0;
        } else {
            unsigned int char_id;
            unsigned short num_kills;

            char_id = (unsigned int)SG_PARTY_BATTLE[p_target_slot_id]; /* BYTE, no occupancy-1 */
            /* 66 8B 0C C5 78 E1 CF 01 after lea*19 => char_id*152 */
            num_kills = *(unsigned short *)(SG_ARRAY_CHARA_DATA + char_id * 152u + OFF_NUMKILLS);
            raw = (int)num_kills * p_attack_power; /* imul, no divide */
        }
        return HpModifierComputationForPhysical(p_attacker_slot_id, p_target_slot_id,
                                                p_attack_power, raw);
    default:
        /* jpt[5] def_492C86: cases 2,4-15,17,18 and a4>19 ; p_damage_done = target slot */
        raw = p_target_slot_id;
        return HpModifierComputationForPhysical(p_attacker_slot_id, p_target_slot_id,
                                                p_attack_power, raw);
    }
}
```
