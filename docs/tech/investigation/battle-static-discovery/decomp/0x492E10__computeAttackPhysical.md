# computeAttackPhysical @ 0x492E10

- Instr (live): 216
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4910
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7758
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6539
- A==B: non
- Push IDB: oui
- SetType: int __cdecl computeAttackPhysical(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power, int a4)
- Notes parent: slot*0xD0 ; F_CHAR 0x1D0 absent (NumKills CharacterData 152 WORD +0x90) ; occupancy 1+2 absente ; GetRandomInt AL+AND 0xFF x4 ; ja unsigned jpt_492FD2+byte_4930F0 ; case 19 fallthrough case 0 ; case 16 jge signed ; jb unsigned hit/crit ; BYTE HITPERCENT shr 2 Darkness ; petrify sans miss bit ; add esp 10h ; EAX=HpModifier

## C réconcilié

```c
/* computeAttackPhysical @ 0x492E10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 216 instr, size 0x2C8, end 0x4930D8. IDA type int __cdecl(int,int,int,int).
 * No domain::. Slot stride 0xD0 from BATTLE_SLOT_DATA @ 0x1D27B10.
 * F_CHAR 0x1D0 unused. CharacterData stride 152 (0x98) for NumKills WORD +0x90.
 * Occupancy 1+2 unused. GetRandomInt AL only + AND 0xFF at 4 sites.
 * No setcc. Switch ja UNSIGNED (cmp a4,13h). Case 16 jge SIGNED. Hit jb unsigned.
 * jpt_492FD2 @ 0x4930D8 (6 dwords) + byte_4930F0[20]. Case 19 falls into case 0.
 * Widths: BYTE luck/eva/str/vit/status_1/HITPERCENT/HIT_TYPE_2/BOOL/SG_PARTY;
 * WORD NumKills (66); DWORD status_2/hp/flag_data/HIT_STATUS_2.
 * add esp,10h after HpModifier. EAX = HpModifier, or 0 on petrify/invuln/accuracy-miss.
 */

unsigned char __cdecl Battle_GetRandomInt(void);
int __cdecl HpModifierComputationForPhysical(
    int p_attacker_slot_id,
    int p_target_slot_id,
    int p_attack_power,
    int p_damage_done);

extern unsigned int HIT_STATUS_2;            /* 0x1D2A234 DWORD */
extern unsigned char HIT_ATTACK_HITPERCENT;  /* 0x1D2A238 BYTE */
extern unsigned char RELATED_TO_CRIT_BONUS; /* 0x1D2A23B BYTE */
extern unsigned char HIT_TYPE_2;             /* 0x1D27ADE BYTE */
extern unsigned char BOOL_ATTACK_CRITED;    /* 0x1D28E07 BYTE */
extern unsigned char BATTLE_SLOT_DATA[];     /* 0x1D27B10 stride 0xD0 */
extern unsigned char SG_PARTY_BATTLE[];      /* 0x1CFE74C BYTE */
extern unsigned char SG_ARRAY_CHARA_DATA[]; /* 0x1CFE0E8 CharacterData[8] stride 152 */

/* BATTLE_SLOT_DATA offsets: status_2 +0x08, current_hp +0x18, max_hp +0x1C,
 * flag_data +0x7C, status_1 +0x80, str +0xBD, vit +0xBE, luck +0xC2, eva +0xC3 */

/* MSVC cdq; and edx,mask; add eax,edx; sar eax,shift  (signed /16 and /256) */
static int sdiv16(int x)
{
    return (x + ((x >> 31) & 0x0F)) >> 4;
}

static int sdiv256(int x)
{
    return (x + ((x >> 31) & 0xFF)) >> 8;
}

static unsigned int rand8(void)
{
    return (unsigned int)Battle_GetRandomInt() & 0xFFu;
}

static void apply_crit(int chance, unsigned int rnd)
{
    /* test edi,edi; jz miss; cmp edi,eax; jb miss  (unsigned) */
    if (chance != 0 && (unsigned int)chance >= rnd) {
        unsigned char hit = HIT_TYPE_2;
        BOOL_ATTACK_CRITED = 1;
        hit |= 2u;
        HIT_TYPE_2 = hit;
    } else {
        BOOL_ATTACK_CRITED = 0;
    }
}

int __cdecl computeAttackPhysical(
    int p_attacker_slot_id,
    int p_target_slot_id,
    int p_attack_power,
    int a4)
{
    int tgt_off;
    int atk_off;
    int vit;
    int raw;
    int chance;
    unsigned int rnd;

    /* HIT_STATUS_2 DWORD test 0x04000000 bypass; else Petrify BYTE or invuln DWORD */
    if ((HIT_STATUS_2 & 0x04000000u) == 0) {
        int gate_off = p_target_slot_id * 0xD0;
        if (BATTLE_SLOT_DATA[gate_off + 0x80] & 4)
            return 0; /* loc_4930D2: no HIT_TYPE_2 miss bit */
        if ((*(unsigned int *)&BATTLE_SLOT_DATA[gate_off + 0x08] & 0x00180800u) != 0)
            return 0;
    }

    tgt_off = p_target_slot_id * 0xD0; /* loc_492E4B: ebp = target * 0xD0 */

    if ((BATTLE_SLOT_DATA[tgt_off + 0x08] & 9) != 0
        || HIT_ATTACK_HITPERCENT == 0xFF) {
        /* auto-hit: Sleep|Stop BYTE or HITPERCENT==0xFF ; crit only (loc_492E68) */
        atk_off = p_attacker_slot_id * 0xD0;
        chance = (int)BATTLE_SLOT_DATA[atk_off + 0xC2] + (int)RELATED_TO_CRIT_BONUS;
        chance = (255 * chance) / 255; /* 80808081h */
        rnd = rand8();
        apply_crit(chance, rnd);
    } else {
        int acc;

        atk_off = p_attacker_slot_id * 0xD0;
        if (BATTLE_SLOT_DATA[atk_off + 0x80] & 8)
            HIT_ATTACK_HITPERCENT >>= 2; /* shr BYTE global,2 Darkness */

        acc = ((int)BATTLE_SLOT_DATA[atk_off + 0xC2] >> 1)
            - (int)BATTLE_SLOT_DATA[tgt_off + 0xC3]
            - (int)BATTLE_SLOT_DATA[tgt_off + 0xC2]
            + (int)(HIT_ATTACK_HITPERCENT & 0xFF);
        if (acc < 0)
            acc = 0; /* jns */

        chance = (255 * acc) / 100; /* 51EB851Fh sar 5 */
        rnd = rand8(); /* consumed even if chance==0 */
        if (chance == 0 || (unsigned int)chance < rnd) {
            HIT_TYPE_2 |= 4u; /* loc_4930CB then loc_4930D2 */
            return 0;
        }

        chance = (int)BATTLE_SLOT_DATA[atk_off + 0xC2] + (int)RELATED_TO_CRIT_BONUS;
        chance = (255 * chance) / 255;
        rnd = rand8();
        apply_crit(chance, rnd);
    }

    vit = (int)BATTLE_SLOT_DATA[tgt_off + 0xBE];
    if ((*(unsigned int *)&BATTLE_SLOT_DATA[tgt_off + 0x08] & 0x01000000u) != 0)
        vit = 0; /* TEST EAX, 01000000h */

    /* cmp a4,13h ; ja def_492FD2 UNSIGNED ; byte_4930F0 then jpt_492FD2 */
    if ((unsigned int)a4 > 19u) {
        raw = p_target_slot_id;
    } else {
        switch (a4) {
        case 19: /* loc_492FD9 xor edi,edi ; fall through loc_492FDB */
            vit = 0;
            /* fall through */
        case 0: {
            int spread;
            int str;
            int str_term;
            int tmp;

            spread = (int)(rand8() % 33u) + 0xF0; /* cdq; idiv 21h ; +240 */
            str = (int)BATTLE_SLOT_DATA[atk_off + 0xBD];
            str_term = str + sdiv16(str * str);
            tmp = sdiv256((0x109 - vit) * str_term);
            tmp = sdiv16(tmp * p_attack_power);
            raw = sdiv256(tmp * spread);
            break;
        }
        case 1: /* loc_493042 */
            if ((*(unsigned int *)&BATTLE_SLOT_DATA[tgt_off + 0x7C] & 0x00010000u) != 0) {
                unsigned char hit = HIT_TYPE_2;
                raw = 0;
                hit |= 4u;
                HIT_TYPE_2 = hit;
            } else {
                int hp = *(int *)&BATTLE_SLOT_DATA[tgt_off + 0x18];
                raw = sdiv16(hp * p_attack_power);
            }
            break;
        case 3: { /* loc_493075 lea [esi+esi*4] */
            int max_hp = *(int *)&BATTLE_SLOT_DATA[atk_off + 0x1C];
            raw = max_hp + max_hp * 4;
            break;
        }
        case 16: /* loc_493080 */
            if (p_target_slot_id >= 3) { /* jge SIGNED */
                raw = 0;
            } else {
                unsigned int char_id = SG_PARTY_BATTLE[p_target_slot_id];
                unsigned short kills = *(unsigned short *)&SG_ARRAY_CHARA_DATA[char_id * 152u + 0x90];
                raw = (int)kills * p_attack_power;
            }
            break;
        default: /* def_492FD2 cases 2,4-15,17,18 */
            raw = p_target_slot_id;
            break;
        }
    }

    return HpModifierComputationForPhysical(
        p_attacker_slot_id,
        p_target_slot_id,
        p_attack_power,
        raw);
}
```
