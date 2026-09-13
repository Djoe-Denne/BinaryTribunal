# BattleStatus_ApplyHitStatus @ 0x4914E0

- Instr (live): 252
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9606
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=12050
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=11206
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleStatus_ApplyHitStatus(int arg_0, int p_attacker_slot_id, unsigned int p_target_slot_id, int arg_C, int p_target_vit)
- Notes parent: stride 0xD0 lea/shl, pas F_CHAR 0x1D0, occupancy 1+2 absente (flag_data +0x7C test dh,10h); pas GetRandomInt/setcc/jpt_/0xFBA9; HIT_STATUS_2 clear 0x04000000 puis drain 0x8000; mental_res[0x17] BYTE +0xA7; WORD 66 status_1/HIT_STATUS_1/elem_def+4; jle/jl signed; charged not+inc = NEG; invuln +0xC9 saute apply+reconcile; acc AL only; VIT_0 imm 0x01000000; EAX leftover arg_C ou HIT_TYPE_2|4.

## C réconcilié

```c
/* BattleStatus_ApplyHitStatus @ 0x4914E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 252 instr, size 0x31E. End 0x4917FE. IDA type int __cdecl(int, int, int, int, int).
 * No domain::. Slot stride 0xD0 from BATTLE_SLOT_DATA @ 0x1D27B10. No F_CHAR 0x1D0.
 * Occupancy 1+2 unused (flag_data DWORD +0x7C, test dh,10h = 0x1000). No GetRandomInt.
 * No setcc. No ja/jb. No jpt_. No 0xFBA9.
 * Widths: 66 WORD status_1 / HIT_STATUS_1 / elem_def+4; DWORD HIT_STATUS_2 / status_2 /
 * max_hp / flag_data / LINKED_TO_DRAIN; BYTE flags, stats, mental_res[0x17] +0xA7.
 * HIT_STATUS_2 &= ~0x04000000 then test ah,80h (0x8000 drain). VIT_0 = imm 0x01000000.
 * ebx keeps attacker slot; p_attacker_slot_id stack reused as BYTE acc; p_target_vit
 * reused as def-stat after drain imul. EAX leftover: arg_C, or HIT_TYPE_2|4 on no-land.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 stride 0xD0 */

extern unsigned int   HIT_STATUS_2;                /* 0x1D2A234 DWORD */
extern unsigned short HIT_STATUS_1;                /* 0x1D2A23E WORD */
extern unsigned char  HIT_ATTACK_ENABLER;          /* 0x1D2A239 BYTE */
extern unsigned char  RELATED_TO_ATTACKER_SLOT_ID; /* 0x1D27ADF BYTE */
extern unsigned int   LINKED_TO_DRAIN;             /* 0x1D27AEC DWORD */
extern unsigned char  ATTACK_TYPE_PHY_OR_MAG;      /* 0x1D27AE2 BYTE bit0 */
extern unsigned char  HIT_TYPE_2;                  /* 0x1D27ADE BYTE */
extern unsigned char  byte_1D27ADD;                /* 0x1D27ADD BYTE */

extern int __cdecl DoesMentalStatusHit(int p_attacker_slot_id, unsigned int p_target_slot_id,
                                       int p_index, int p_mask, int p_status_list_to_check,
                                       int p_attacker_str, int p_target_vit, int p_hit_attack_enabler);
extern int __cdecl BattleStatus_ReconcileExclusiveGroup(int old_status_2, unsigned int *p_new_status_2,
                                                        int group_mask);

int __cdecl BattleStatus_ApplyHitStatus(int arg_0, int p_attacker_slot_id,
                                        unsigned int p_target_slot_id, int arg_C,
                                        int p_target_vit)
{
    unsigned int off_atk;
    unsigned int off_tgt;
    unsigned int *p_status_2;
    unsigned int old_status_2;
    unsigned int mask;
    unsigned int kept;
    unsigned int recon;
    int drain;
    int acc;
    int atk_stat;
    int def_stat;
    int index;
    int addend;
    unsigned short atk_st1;

    /* and eax,0FBFFFFFFh ; store HIT_STATUS_2 (clear bypass 0x04000000) */
    HIT_STATUS_2 &= 0xFBFFFFFFu;

    off_atk = (unsigned int)p_attacker_slot_id * 0xD0u;

    if (HIT_STATUS_2 & 0x8000u) { /* test ah,80h */
        int p;
        unsigned int tgt_st1_z;

        /* lea/shl target*0xD0 ; RELATED_TO_ATTACKER_SLOT_ID = bl */
        off_tgt = p_target_slot_id * 0xD0u;
        RELATED_TO_ATTACKER_SLOT_ID = (unsigned char)p_attacker_slot_id;

        /* P = zext(HIT_ATTACK_ENABLER) - zext(mental_res[0x17] @ +0xA7) */
        p = (int)HIT_ATTACK_ENABLER - (int)BATTLE_SLOT_DATA[off_tgt + 0xA7];
        if (p <= 0) { /* signed jle loc_49159A */
            drain = 0;
            ATTACK_TYPE_PHY_OR_MAG |= 1u;
        } else {
            /* edx = (P * p_target_vit) / 100 ; imul 51EB851Fh sar 5 + sign */
            drain = (p * p_target_vit) / 100;

            /* 66 mov ax, attacker.status_1 ; and ax,40h */
            atk_st1 = *(unsigned short *)(BATTLE_SLOT_DATA + off_atk + 0x80) & 0x40u;
            /* 84 test BYTE target.status_1, cl */
            tgt_st1_z = (unsigned int)(BATTLE_SLOT_DATA[off_tgt + 0x80] & 0x40u);

            if (atk_st1 == 0 && tgt_st1_z != 0)
                drain = -drain;
            if (atk_st1 != 0 && tgt_st1_z == 0)
                drain = -drain;
            drain = -drain; /* always neg edx */

            if (drain < 0) { /* jns loc_491589 else not+inc */
                ATTACK_TYPE_PHY_OR_MAG |= 1u;
                drain = -drain;
            }
            if (drain > 9999) /* signed jle 270Fh */
                drain = 9999;
        }
        LINKED_TO_DRAIN = (unsigned int)drain;
        HIT_STATUS_2 &= ~0x8000u; /* and ah,7Fh */
    } else {
        drain = (int)LINKED_TO_DRAIN; /* loc_4915BD */
        off_tgt = p_target_slot_id * 0xD0u;
    }

    /* edi = target*0xD0 ; var_4 = &status_2 ; var_8 = snapshot */
    p_status_2 = (unsigned int *)(BATTLE_SLOT_DATA + off_tgt + 0x08);
    old_status_2 = *p_status_2;

    /* status_2&0x400000 && attacker flag_data dh&10h && arg_0==0 */
    if ((old_status_2 & 0x400000u) != 0
        && (*(unsigned int *)(BATTLE_SLOT_DATA + off_atk + 0x7C) & 0x1000u) != 0
        && arg_0 == 0) {
        if (ATTACK_TYPE_PHY_OR_MAG & 1u)
            drain = -drain; /* not esi; inc esi  (NEG, not abs) */

        /* 66 mov cx, (elem_def+4) ; ecx = 384h - that WORD */
        addend = 0x384 - (int)*(unsigned short *)(BATTLE_SLOT_DATA + off_atk + 0x48);
        /* max_hp / 5 : imul 66666667h sar 2 + sign ; then *addend / 100 */
        addend = (addend * ((int)*(unsigned int *)(BATTLE_SLOT_DATA + off_atk + 0x1C) / 5)) / 100;
        drain += addend;

        if (drain < 0) { /* jns loc_491675 */
            ATTACK_TYPE_PHY_OR_MAG |= 1u;
            drain = -drain;
        } else {
            ATTACK_TYPE_PHY_OR_MAG &= 0xFEu;
        }
        if (drain > 9999)
            drain = 9999;
        RELATED_TO_ATTACKER_SLOT_ID = (unsigned char)p_attacker_slot_id;
        LINKED_TO_DRAIN = (unsigned int)drain;
    }

    /* mov [p_attacker_slot_id], 0 ; test scripted_invuln BYTE +0xC9 */
    acc = 0;
    if (BATTLE_SLOT_DATA[off_tgt + 0xC9] != 0)
        goto loc_4917CB; /* skip apply AND reconcile */

    if (arg_0 != 0) { /* MAG/SPR loc_4916D9 */
        atk_stat = (int)BATTLE_SLOT_DATA[off_atk + 0xBF];
        def_stat = (int)BATTLE_SLOT_DATA[off_tgt + 0xC0];
    } else { /* STR/VIT */
        atk_stat = (int)BATTLE_SLOT_DATA[off_atk + 0xBD];
        def_stat = (int)BATTLE_SLOT_DATA[off_tgt + 0xBE];
    }
    if (old_status_2 & 0x01000000u) /* test ecx, 01000000h VIT_0 */
        def_stat = 0;

    /* HIT_STATUS_1 bits 0..6, list=0, index=edi, mask=esi. signed jl 7 */
    mask = 1u;
    index = 0;
    while (index < 7) {
        if ((unsigned int)HIT_STATUS_1 & mask) {
            acc += DoesMentalStatusHit(p_attacker_slot_id, p_target_slot_id, index,
                                       (int)mask, 0, atk_stat, def_stat,
                                       (int)HIT_ATTACK_ENABLER);
        }
        mask <<= 1;
        index++;
    }

    /* HIT_STATUS_2 bits 0..31 -> indices 8..39, list=1. signed jl 28h */
    mask = 1u;
    index = 8;
    while (index < 0x28) {
        if (HIT_STATUS_2 & mask) {
            acc += DoesMentalStatusHit(p_attacker_slot_id, p_target_slot_id, index,
                                       (int)mask, 1, atk_stat, def_stat,
                                       (int)HIT_ATTACK_ENABLER);
        }
        mask <<= 1;
        index++;
    }

    if (*p_status_2 != old_status_2) {
        kept = *p_status_2 & 0xFFFFFCF1u;
        recon = (unsigned int)BattleStatus_ReconcileExclusiveGroup((int)old_status_2, p_status_2, 0x300);
        recon |= (unsigned int)BattleStatus_ReconcileExclusiveGroup((int)old_status_2, p_status_2, 0xE);
        *p_status_2 = kept | recon;
    }

    if ((unsigned char)acc != 0) { /* loc_4917E7 land: test AL only */
        if (arg_C == 0)
            byte_1D27ADD |= 1u;
        return arg_C; /* mov eax, arg_C */
    }

loc_4917CB:
    if (arg_C == 0) {
        HIT_TYPE_2 |= 4u;
        return (int)HIT_TYPE_2; /* mov al,HIT_TYPE_2 ; or al,4 ; EAX low */
    }
    return arg_C;
}
```
