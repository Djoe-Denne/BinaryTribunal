# Junction_SwapMagicEntriesBetweenCharacters @ 0x4F6300

- Instr (live): 252
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6901
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5347
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=11583
- A==B: non
- Push IDB: oui
- SetType: BOOL __cdecl Junction_SwapMagicEntriesBetweenCharacters(int char_a, int char_b, int slot_a, int slot_b)
- Notes parent: CharacterData 0x98. Magic 32x2 BYTE @ +0x10 (pas 32x5 / F_CHAR 0x1D0). Junction 19 BYTE depuis +0x5C. Occupancy absente. GetRandomInt absent. Pas de clamp 100. CurrentHP WORD. setnle si HP_B baisse. EAX=1 si HP_A baisse.

## C réconcilié

```c
/* Junction_SwapMagicEntriesBetweenCharacters @ 0x4F6300
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 252 instr, size 0x2FD, end 0x4F65FD. IDA type BOOL __cdecl(int, int, int, int).
 * CharacterData 0x98 via lea i*9, lea i+eax*2, shl 3.
 * Magic: ff8_id_quantity_storage[32] @ +0x10, stride 2 (BYTE id, BYTE amount).
 *   NOT battle F_CHAR 32x5 / 0x1D0 (unused here).
 * Junction walk: 19 BYTEs from JunctionHP @ +0x5C (cmp eax,13h / jl). Unknown2 +0x6F not walked.
 * Occupancy 1+2 ABSENT. GetRandomInt absent. No 64h / 100 clamp.
 * CurrentHP WORD (66 prefix). Magic/junction BYTE. setnle on HP-B tail. jl/jle signed.
 * arg_0 stack slot overwritten with magic_b_id after the loads; char_a stays in EBP.
 */

#pragma pack(push, 1)
typedef struct {
    unsigned char id;      /* +0 BYTE */
    unsigned char amount; /* +1 BYTE */
} ff8_id_quantity_storage; /* size 2; IDA live */

typedef struct {
    short CurrentHP;                          /* +00 WORD */
    short MaxHP;                             /* +02 */
    int Experience;                           /* +04 */
    unsigned char ModelID;                  /* +08 */
    unsigned char WeaponID;                 /* +09 */
    unsigned char STR;                        /* +0A */
    unsigned char VIT;                       /* +0B */
    unsigned char MAG;                       /* +0C */
    unsigned char SPR;                       /* +0D */
    unsigned char SPD;                       /* +0E */
    unsigned char LCK;                       /* +0F */
    ff8_id_quantity_storage Magic[32];     /* +10 size 0x40 */
    unsigned char Commands[4];               /* +50 */
    unsigned char Abilitie[4];               /* +54 */
    short JunctionedGFs;                     /* +58 */
    unsigned char Unknown1;                 /* +5A */
    unsigned char AltModel;                  /* +5B */
    unsigned char JunctionHP;                 /* +5C; first of 19 BYTE refs walked here */
    unsigned char JunctionSTR;                /* +5D */
    unsigned char JunctionVIT;              /* +5E */
    unsigned char JunctionMAG;              /* +5F */
    unsigned char JunctionSPR;              /* +60 */
    unsigned char JunctionSPD;               /* +61 */
    unsigned char JunctionEVA;               /* +62 */
    unsigned char JunctionHIT;              /* +63 */
    unsigned char JunctionLCK;              /* +64 */
    unsigned char JunctionElemAttack;      /* +65 */
    unsigned char JunctionMentalAttack;    /* +66 */
    unsigned char JunctionElemDefense[4];  /* +67 */
    unsigned char JunctionMentalDefense[4]; /* +6B .. +0x6E last walked */
    unsigned char Unknown2;                  /* +6F not in this 0x13 walk */
    short GFCompatibility[16];             /* +70 */
    short NumKills;                           /* +90 */
    short NumKOs;                            /* +92 */
    unsigned char Exists;                    /* +94 */
    unsigned char Unknown3;                 /* +95 */
    unsigned char MentalStatus;              /* +96 */
    unsigned char Unknown4;                 /* +97 */
} CharacterData;                              /* size 0x98 IDA live */
#pragma pack(pop)

extern CharacterData SG_ARRAY_CHARA_DATA[8]; /* 0x1CFE0E8 */

extern unsigned char *__cdecl sub_4C2FA0(int char_id, int magic_id);
extern int __cdecl sub_4C2ED0(int char_id, int magic_id, int junc_index);
extern short __cdecl MenuMagic_RebuildPartyDerivedState(int char_id);
extern unsigned char *__cdecl sub_4C3120(int char_id);

BOOL __cdecl Junction_SwapMagicEntriesBetweenCharacters(
    int char_a, int char_b, int slot_a, int slot_b)
{
    CharacterData *pA = &SG_ARRAY_CHARA_DATA[char_a];
    CharacterData *pB = &SG_ARRAY_CHARA_DATA[char_b];
    unsigned char *junc;
    int old_hp_a;      /* var_8: WORD zero-ext */
    int old_hp_b;      /* a2_bis */
    int magic_a_id;    /* EBX: xor ebx,ebx / mov bl */
    int magic_b_id;    /* ECX then arg_0 slot: xor ecx,ecx / mov cl */
    int amount_a;      /* squall_magic_amount */
    int amount_b;      /* var_1C */
    int junc_a;        /* var_2C */
    int junc_b;        /* var_28 */
    int write_slot_a; /* arg_8, maybe rewritten by coalesce rescan */
    int write_slot_b; /* arg_C */
    int i;
    int j;
    int found_amt;
    int other_amt;

    old_hp_a = (unsigned short)pA->CurrentHP;
    old_hp_b = (unsigned short)pB->CurrentHP;

    magic_a_id = (unsigned char)pA->Magic[slot_a].id;
    amount_a = (unsigned char)pA->Magic[slot_a].amount;
    magic_b_id = (unsigned char)pB->Magic[slot_b].id;
    amount_b = (unsigned char)pB->Magic[slot_b].amount;

    write_slot_a = slot_a;
    write_slot_b = slot_b;

    /* 19-byte JunctionHP walk; movsx BYTE vs zero-ext id; not found => -1 */
    if (magic_a_id == 0) {
        junc_a = -1;
    } else {
        junc_a = -1;
        junc = &pA->JunctionHP;
        for (i = 0; i < 19; i++) {
            if ((int)(signed char)junc[i] == magic_a_id) {
                junc_a = i;
                break;
            }
        }
    }

    if (magic_b_id == 0) {
        junc_b = -1;
    } else {
        junc_b = -1;
        junc = &pB->JunctionHP;
        for (i = 0; i < 19; i++) {
            if ((int)(signed char)junc[i] == magic_b_id) {
                junc_b = i;
                break;
            }
        }
    }

    sub_4C2FA0(char_a, magic_a_id);
    sub_4C2FA0(char_b, magic_b_id);

    if (magic_a_id != magic_b_id) {
        if (magic_a_id != 0) {
            found_amt = 0;
            for (i = 0; i < 32; i++) {
                if ((int)(signed char)pB->Magic[i].id == magic_a_id) {
                    found_amt = (signed char)pB->Magic[i].amount;
                    if (found_amt == 0)
                        break;
                    other_amt = 0;
                    for (j = 0; j < 32; j++) {
                        if ((int)(signed char)pA->Magic[j].id == magic_a_id) {
                            other_amt = (signed char)pA->Magic[j].amount;
                            break;
                        }
                    }
                    /* zero original dest slot (ESI), not the found index */
                    pB->Magic[slot_b].id = 0;
                    pB->Magic[slot_b].amount = 0;
                    amount_a = other_amt + found_amt;
                    write_slot_b = 0;
                    for (j = 0; j < 32; j++) {
                        if ((int)(signed char)pB->Magic[j].id == magic_a_id) {
                            write_slot_b = j;
                            break;
                        }
                    }
                    break;
                }
            }
        }

        if (magic_b_id != 0) {
            found_amt = 0;
            for (i = 0; i < 32; i++) {
                if ((int)(signed char)pA->Magic[i].id == magic_b_id) {
                    found_amt = (signed char)pA->Magic[i].amount;
                    if (found_amt == 0)
                        break;
                    other_amt = 0;
                    for (j = 0; j < 32; j++) {
                        if ((int)(signed char)pB->Magic[j].id == magic_b_id) {
                            other_amt = (signed char)pB->Magic[j].amount;
                            break;
                        }
                    }
                    /* zero original src slot (EDI) */
                    pA->Magic[slot_a].id = 0;
                    pA->Magic[slot_a].amount = 0;
                    amount_b = other_amt + found_amt;
                    write_slot_a = 0;
                    for (j = 0; j < 32; j++) {
                        if ((int)(signed char)pA->Magic[j].id == magic_b_id) {
                            write_slot_a = j;
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }

    pA->Magic[write_slot_a].id = (unsigned char)magic_b_id;
    pA->Magic[write_slot_a].amount = (unsigned char)amount_b;
    pB->Magic[write_slot_b].id = (unsigned char)magic_a_id;
    pB->Magic[write_slot_b].amount = (unsigned char)amount_a;

    if (junc_a >= 0) /* test eax,eax / jl */
        sub_4C2ED0(char_a, magic_b_id, junc_a);
    if (junc_b >= 0)
        sub_4C2ED0(char_b, magic_a_id, junc_b);

    MenuMagic_RebuildPartyDerivedState(char_a);
    MenuMagic_RebuildPartyDerivedState(char_b);
    sub_4C3120(char_a);
    sub_4C3120(char_b);

    if (old_hp_a > (int)(unsigned short)pA->CurrentHP) /* cmp / jle */
        return 1;
    return old_hp_b > (int)(unsigned short)pB->CurrentHP; /* setnle al */
}
```
