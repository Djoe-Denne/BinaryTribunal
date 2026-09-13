# Damage_ComputeRawDeltaFromAttackType @ 0x4922B0

- Instr (live): 588
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=20854 (retry after length/empty)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=22948
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=19549 (retry after length/empty)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Damage_ComputeRawDeltaFromAttackType(int p_attack_type, int p_attacker_slot_id, int p_target_slot_id, int p_attack_power)
- Notes parent: jpt_4922E0 37 DWORD ja UNSIGNED vs 24h; case 12 fallthrough case 0; computeCrit 2 args add esp 8; RelatedToStatus 0x4001/0x800000 si ATTACK_FLAG&3==0; stride 0xD0; occupancy 1+2 unused; F_CHAR unused; GetRandomInt unused; 66 WORD K_DEVOUR only; resurrection 0xFFFE7960; HIT_TYPE_2|=4 miss.

## C réconcilié

```c
/* Damage_ComputeRawDeltaFromAttackType @ 0x4922B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_4922E0, not Hex-Rays.
 * 588 instr, size 0x773, end 0x492A23. IDA type int __cdecl(int,int,int,int).
 * No domain::. Slot stride 0xD0 (lea*3/+*4/shl4). F_CHAR 0x1D0 unused.
 * Occupancy 1+2 unused (flag_data only OR 0x20000 in case 24). GetRandomInt unused.
 * ja UNSIGNED vs 24h on switch; devour jl SIGNED; case24 jle SIGNED. No setcc.
 * 66 prefix: only mov dx K_DEVOUR.DevourDescriptionOffset at 0x492737 (WORD).
 * Named slot fields + offsets; no packed struct.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10, stride 0xD0 */
/* +0x08 status_2 DWORD, +0x18 current_hp DWORD, +0x1C max_hp DWORD,
 * +0x7C flag_data DWORD, +0x80 status_1 BYTE, +0xBB com_file_id BYTE */

extern unsigned char ATTACK_FLAG;
extern unsigned int HIT_STATUS_2;
extern unsigned char HIT_TYPE_2;
extern unsigned char byte_1D27ADD;
extern unsigned char HIT_ATTACK_HITPERCENT;
extern unsigned int SG_CONFIG_FLAGS_SETTING;
extern unsigned int SG_ENEMY_SCANNED_ONCE[];
extern unsigned char DEVOUR_RESULT;
extern unsigned char DEVOUR_SUCEED;
extern unsigned int UNKNOWN_FLAG_3; /* BYTE store at fail; DWORD load then & 0xFF */
extern unsigned int KERNEL_HEADER_offsetDevourText;
extern unsigned char K_DEVOUR[]; /* 0x1CF8A54, stride 12; WORD desc at +0 */
extern unsigned char END_BATTLE_CARD_OBTAINED;
extern unsigned char byte_1D28E11;
extern unsigned char byte_1D28E12;
extern unsigned char byte_1D28E13;
extern unsigned int dword_1D28E20; /* BYTE at +2 is mug-message latch */

void __cdecl RelatedToStatus1And2(int p_target_slot_id, short p_status_1_mask_to_set, int p_status_2_mask_to_set);
int __cdecl ContainPhysicalDamageFormula(int p_attacker_slot_id, int p_target_slot_id, int p_AttackPower);
int __cdecl ShouldSkipPhysicalHitCheck(int attacker_slot_id, int target_slot_id);
int __cdecl IsTargetHit_HitPercentComputed(int p_attacker, int p_target);
int __cdecl computeCrit(int p_attacker_slot_id, int p_target_slot_id); /* 2 pushes + add esp 8 at every site */
int __cdecl ComputeWithDamageSTRFormula(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power, int a4);
int __cdecl ComputeMagicAndGFDamage(int p_attacker_slot_id, int p_target_slot_id, int p_AttackPower, int p_gf_magic_type_damage);
int __cdecl computeCurativeMagic(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power, int a4);
int __cdecl computeCurativeGFMagicItem(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power, int p_gf_magic_type_damage);
int __cdecl GetReviveHP(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power);
int __cdecl Battle_QueueReflectedActionIfNeeded(int attacker_slot_id, int target_slot_id);
int __cdecl computeResurrection(int p_attacker_slot_id, int p_target_slot_id, int p_attacker_power);
int __cdecl sub_493810(int com_file_id);
int __cdecl sub_493650(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power, int a4);
int __cdecl BattleStatus_CanApplyHitStatus(int p_target_slot_id);
int __cdecl sub_48F0C0(int chance, int bound);
char *__cdecl getAddressAttackName(unsigned short p_attack_name_offset, int p_address_text_gf_attack);
int __cdecl Battle_SetMessagePointer(int);
char *__cdecl BattleText_GetMiscText(int p_text_index);
char *__cdecl GetPtr_OffU16_B964F8_IfLt6E(int); /* add esp 4; leftover DWORD stays for PrepareBuffer */
char *__cdecl BattleText_PrepareBuffer(char *p_address_text, char p_text, char *a3);
char *__cdecl BattleText_Print(char *);
unsigned char sub_493760(void);
char *__cdecl getTextBattleItem(int);
int __cdecl sub_494AA0(int, unsigned char *);
int __cdecl specialGFDamage(int p_attacker_slot_id, int p_target_slot_id, int p_attacker_power, int a4);
int __cdecl computeAttackPhysical(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power, int a4);

int __cdecl Damage_ComputeRawDeltaFromAttackType(int p_attack_type, int p_attacker_slot_id,
                                                 int p_target_slot_id, int p_attack_power)
{
    unsigned char *tgt; /* esi * 0xD0 */
    unsigned char *atk;
    unsigned int edi; /* return in EAX */
    int attacker;
    int a4;
    unsigned char var_10[16]; /* sub esp,10h; case 24 scratch */

    tgt = BATTLE_SLOT_DATA + p_target_slot_id * 0xD0;

    /* prologue: ATTACK_FLAG & 3 == 0 → physical class, status_2 0x4001 (Sleep|Confuse) */
    if ((ATTACK_FLAG & 3) == 0)
        RelatedToStatus1And2(p_target_slot_id, 0, 0x4001);

    /* cmp eax,24h ; ja def_4922E0 UNSIGNED */
    switch ((unsigned int)p_attack_type) {
    case 0: /* loc_4925C9 */
    case_0:
        byte_1D27ADD |= 1u;
        edi = 0;
        goto epilogue;

    case 1: /* loc_492301 */
        a4 = 0;
        goto physical_gate;

    case 2: /* loc_492379 */
        a4 = 0;
        goto magic_tail;

    case 3: /* loc_492395 */
        a4 = 7;
        goto curative_magic_tail;

    case 4: /* loc_4923B1 */
        a4 = 0xE;
        goto curative_gf_tail;

    case 5: /* loc_4923CD */
        edi = (unsigned int)GetReviveHP(p_attacker_slot_id, p_target_slot_id, p_attack_power);
        goto epilogue;

    case 6: /* loc_4923E7 */
        attacker = p_attacker_slot_id;
        if (Battle_QueueReflectedActionIfNeeded(attacker, p_target_slot_id))
            goto default_case;
        {
            int r = computeResurrection(attacker, p_target_slot_id, p_attack_power);
            if (r != (int)0xFFFE7960) { /* -100000 sentinel; jnz loc_4926A9 */
                edi = (unsigned int)r;
                goto epilogue;
            }
            edi = *(unsigned int *)(tgt + 0x1C); /* max_hp DWORD */
            if (edi == 0)
                edi = 1;
            goto epilogue;
        }

    case 7: /* loc_492438 */
        a4 = 1;
        goto physical_gate;

    case 8: /* loc_49249F */
        edi = (unsigned int)ComputeMagicAndGFDamage(p_attacker_slot_id, p_target_slot_id, p_attack_power, 1);
        goto epilogue;

    case 9: /* loc_4924C2 */
        a4 = 0;
        goto physical_gate;

    case 10: /* loc_4922E7 gunblade */
        edi = (unsigned int)ContainPhysicalDamageFormula(p_attacker_slot_id, p_target_slot_id, p_attack_power);
        goto epilogue;

    case 11: /* loc_492545 → loc_49237B */
        a4 = 2;
        goto magic_tail;

    case 12: /* loc_492565 Scan, falls into case 0 */
        if ((SG_CONFIG_FLAGS_SETTING & 0x100u) == 0) { /* test ah,1 */
            unsigned int com = tgt[0xBB]; /* com_file_id BYTE zero-ext */
            unsigned int ecx = com;
            int eax_s;
            unsigned int bit;
            /* MSVC signed %32: and ecx,8000001Fh; jns / dec / or / inc. For 0..255 == & 0x1F */
            ecx &= 0x8000001Fu;
            if ((int)ecx < 0) {
                ecx--;
                ecx |= 0xFFFFFFE0u;
                ecx++;
            }
            eax_s = (int)com;
            /* cdq; and edx,1Fh; add eax,edx; sar eax,5 */
            eax_s = (eax_s + ((eax_s >> 31) & 31)) >> 5;
            bit = 1u << (ecx & 31);
            if (SG_ENEMY_SCANNED_ONCE[eax_s] & bit)
                byte_1D27ADD |= 2u;
        }
        sub_493810((int)tgt[0xBB]);
        goto case_0;

    case 13: /* loc_4925F4 */
        edi = (unsigned int)sub_493650(p_attacker_slot_id, p_target_slot_id, p_attack_power, 0);
        goto epilogue;

    case 14:
    case 30:
    case 31:
    default:
    default_case: /* def_4922E0 */
        edi = 0;
        goto epilogue;

    case 15: /* loc_49254C */
        edi = (unsigned int)ComputeMagicAndGFDamage(p_attacker_slot_id, p_target_slot_id, p_attack_power, 5);
        goto epilogue;

    case 16: /* loc_49260D: capture missing HP, a4=1, restore current_hp, return 0 */
    {
        unsigned int missing = *(unsigned int *)(tgt + 0x1C) - *(unsigned int *)(tgt + 0x18);
        sub_493650(p_attacker_slot_id, p_target_slot_id, p_attack_power, 1);
        *(unsigned int *)(tgt + 0x18) = *(unsigned int *)(tgt + 0x1C) - missing; /* max reloaded */
        goto default_case;
    }

    case 17: /* loc_492791 Card. edi xor'd to 0 first */
    {
        char *s10;
        char *s47;
        char *s9;
        char *ptr;
        char *r1;
        char *r2;
        char *r3;
        unsigned char c1;
        unsigned int c2_eax;
        edi = 0;
        if (END_BATTLE_CARD_OBTAINED == 0xFFu) {
            HIT_TYPE_2 |= 4u;
            goto epilogue;
        }
        *(unsigned int *)(tgt + 0x08) |= 0x10000u; /* status_2 Eject */
        byte_1D27ADD |= 1u;
        s10 = BattleText_GetMiscText(0x10);
        c1 = *(unsigned char *)BattleText_GetMiscText(0x0B); /* mov cl,[eax]; push ecx (high bytes dirty) */
        /* GetPtr: push ecx, push card-id; add esp 4 → card-id cleaned, ecx leftover */
        ptr = GetPtr_OffU16_B964F8_IfLt6E((int)(unsigned char)END_BATTLE_CARD_OBTAINED);
        s47 = BattleText_GetMiscText(0x47);
        {
            char *tB = BattleText_GetMiscText(0x0B);
            c2_eax = (unsigned int)(unsigned char)*tB; /* ASM: mov al,[eax]; push eax (ptr high leftover) */
        }
        s9 = BattleText_GetMiscText(9);
        r1 = BattleText_PrepareBuffer(s9, (char)c2_eax, s47);
        r2 = BattleText_PrepareBuffer(r1, 7, ptr);
        r3 = BattleText_PrepareBuffer(r2, (char)c1, s10);
        Battle_SetMessagePointer((int)BattleText_Print(r3)); /* bundled add esp,14h */
        goto epilogue;
    }

    case 18: /* loc_492649 */
        if (BattleStatus_CanApplyHitStatus(p_target_slot_id))
            goto default_case;
        attacker = p_attacker_slot_id;
        if ((tgt[0x08] & 9) == 0 && HIT_ATTACK_HITPERCENT != 0xFFu) { /* BYTE status_2 Sleep|Stop */
            if (!IsTargetHit_HitPercentComputed(attacker, p_target_slot_id))
                goto miss;
        }
        computeCrit(attacker, p_target_slot_id);
        a4 = 3;
        goto str_tail;

    case 19: /* loc_4926BC Devour */
    {
        int thp;
        int ahp;
        atk = BATTLE_SLOT_DATA + p_attacker_slot_id * 0xD0;
        thp = (int)*(unsigned int *)(tgt + 0x18);
        ahp = (int)*(unsigned int *)(atk + 0x18);
        if (ahp < thp) /* jl SIGNED */
            goto devour_fail;
        {
            int diff = ahp - thp;
            int chance = (diff * 255) / ahp; /* shl 8 / sub / cdq / idiv ebp SIGNED */
            if (!sub_48F0C0(chance, 0xFF)) /* push 0xFF then chance */
                goto devour_fail;
        }
        byte_1D27ADD |= 1u;
        {
            unsigned int st = *(unsigned int *)(tgt + 0x08);
            st |= 0x10000u;
            *(unsigned int *)(tgt + 0x08) = st;
        }
        {
            unsigned int idx = (unsigned char)DEVOUR_RESULT; /* xor eax,eax; mov al */
            unsigned short desc;
            DEVOUR_SUCEED = 1;
            desc = *(unsigned short *)(K_DEVOUR + idx * 12); /* 66 mov dx */
            /* push KERNEL_HEADER.offsetDevourText; push edx (high 16 = idiv remainder leftover) */
            Battle_SetMessagePointer(
                (int)getAddressAttackName(desc, (int)KERNEL_HEADER_offsetDevourText));
        }
        edi = UNKNOWN_FLAG_3 & 0xFFu;
        goto epilogue;
    devour_fail: /* loc_49275F */
        *(unsigned char *)&UNKNOWN_FLAG_3 = 8; /* C6 05 BYTE store */
        edi = UNKNOWN_FLAG_3 & 0xFFu;          /* 8B 3D DWORD load then and 0xFF */
        DEVOUR_SUCEED = 0;
        HIT_TYPE_2 |= 4u;
        goto epilogue;
    }

    case 20: /* loc_492529 */
        edi = (unsigned int)ComputeMagicAndGFDamage(p_attacker_slot_id, p_target_slot_id, p_attack_power, 4);
        goto epilogue;

    case 21: /* loc_49278A → loc_492397 */
        a4 = 8;
        goto curative_magic_tail;

    case 22: /* loc_4924BB → loc_49237B */
        a4 = 6;
        goto magic_tail;

    case 23: /* loc_49284B item text; jmp def → return 0 */
    {
        char *s40;
        char *item;
        char *s47;
        char *r1;
        char *r2;
        byte_1D28E11 = 1;
        byte_1D28E12 = sub_493760(); /* AL */
        byte_1D28E13 = 1;
        byte_1D27ADD |= 1u;
        s40 = BattleText_GetMiscText(0x40);
        item = getTextBattleItem((int)(unsigned char)byte_1D28E12); /* xor ecx,ecx; mov cl */
        s47 = BattleText_GetMiscText(0x47);
        r1 = BattleText_PrepareBuffer(s47, 7, item);
        r2 = BattleText_PrepareBuffer(r1, 7, s40); /* two PrepareBuffer only, then Print */
        Battle_SetMessagePointer((int)BattleText_Print(r2)); /* add esp,14h */
        goto default_case;
    }

    case 24: /* loc_4928C4 mug-like */
    {
        int n;
        byte_1D27ADD |= 1u;
        if ((tgt[0x80] & 1) == 0) { /* BYTE status_1 Death */
            n = sub_494AA0(p_target_slot_id, var_10);
            if (n > 0) { /* test/jz then jle SIGNED */
                do {
                    *(unsigned int *)(tgt + 0x7C) |= 0x20000u; /* flag_data DWORD */
                } while (--n != 0);
            }
        }
        if (*((unsigned char *)&dword_1D28E20 + 2) == 0) {
            Battle_SetMessagePointer((int)BattleText_GetMiscText(0x36));
            (*((unsigned char *)&dword_1D28E20 + 2))++;
        }
        goto default_case;
    }

    case 25: /* loc_4928BD → loc_4923B3 */
        a4 = 9;
        goto curative_gf_tail;

    case 26: /* loc_49293C */
        edi = (unsigned int)ComputeMagicAndGFDamage(p_attacker_slot_id, p_target_slot_id, p_attack_power, 0xA);
        goto epilogue;

    case 27: /* loc_492958 → loc_4929ED */
        a4 = 0xB;
        goto special_gf_tail;

    case 28: /* loc_49295F */
        edi = (unsigned int)specialGFDamage(p_attacker_slot_id, p_target_slot_id, p_attack_power, 0xC);
        goto epilogue;

    case 29: /* loc_49297B */
        edi = (unsigned int)specialGFDamage(p_attacker_slot_id, p_target_slot_id, p_attack_power, 0xD);
        goto epilogue;

    case 32: /* loc_492997 */
        edi = (unsigned int)computeCurativeGFMagicItem(p_attacker_slot_id, p_target_slot_id, p_attack_power, 0xF);
        goto epilogue;

    case 33: /* loc_4929B3 */
        edi = (unsigned int)ComputeMagicAndGFDamage(p_attacker_slot_id, p_target_slot_id, p_attack_power, 0x11);
        goto epilogue;

    case 34: /* loc_4929CF */
        edi = (unsigned int)computeAttackPhysical(p_attacker_slot_id, p_target_slot_id, p_attack_power, 0x10);
        goto epilogue;

    case 35: /* loc_4929EB */
        a4 = 0x12;
        goto special_gf_tail;

    case 36: /* loc_492A07 */
        edi = (unsigned int)computeAttackPhysical(p_attacker_slot_id, p_target_slot_id, p_attack_power, 0x13);
        goto epilogue;
    }

physical_gate: /* cases 1, 7, 9 */
    if ((HIT_STATUS_2 & 0x04000000u) == 0) {
        if (tgt[0x80] & 4u) /* BYTE Petrify */
            goto default_case;
        if (*(unsigned int *)(tgt + 0x08) & 0x180800u)
            goto default_case;
    }
    attacker = p_attacker_slot_id;
    /* push esi,edi always before jnz; skip IsTargetHit if ShouldSkip != 0 */
    if (!ShouldSkipPhysicalHitCheck(attacker, p_target_slot_id)) {
        if (!IsTargetHit_HitPercentComputed(attacker, p_target_slot_id))
            goto miss;
    }
    computeCrit(attacker, p_target_slot_id); /* add esp 8 */

str_tail: /* loc_49269A */
    edi = (unsigned int)ComputeWithDamageSTRFormula(attacker, p_target_slot_id, p_attack_power, a4);
    goto epilogue;

magic_tail: /* loc_49237B */
    edi = (unsigned int)ComputeMagicAndGFDamage(p_attacker_slot_id, p_target_slot_id, p_attack_power, a4);
    goto epilogue;

curative_magic_tail: /* loc_492397 */
    edi = (unsigned int)computeCurativeMagic(p_attacker_slot_id, p_target_slot_id, p_attack_power, a4);
    goto epilogue;

curative_gf_tail: /* loc_4923B3 */
    edi = (unsigned int)computeCurativeGFMagicItem(p_attacker_slot_id, p_target_slot_id, p_attack_power, a4);
    goto epilogue;

special_gf_tail: /* loc_4929ED */
    edi = (unsigned int)specialGFDamage(p_attacker_slot_id, p_target_slot_id, p_attack_power, a4);
    goto epilogue;

miss: /* loc_4926B0 */
    HIT_TYPE_2 |= 4u;
    goto default_case;

epilogue: /* loc_4925D2 */
    if ((ATTACK_FLAG & 3) == 0)
        RelatedToStatus1And2(p_target_slot_id, 0, 0x800000); /* encoding 68 00 00 80 00 */
    return (int)edi;
}
`````
