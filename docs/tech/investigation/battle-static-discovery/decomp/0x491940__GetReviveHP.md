# GetReviveHP @ 0x491940

- Instr (live): 116
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2437
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2270
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1229
- A==B: non
- Push IDB: oui
- SetType: int __cdecl GetReviveHP(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power)
- Notes parent: slot*0xD0 / F_CHAR*0x1D0 ; occupancy 1+2 absent ; bounce `DCC/DCD/DCE[idx*3]` pas +1/+2 sur DCD/DCE ; `jge` signé slot < 3 ; status_1 WORD 66 ; flag_data `|=0x4000`/`&=~0x4000` ; HIT_TYPE_2|=1 avant test Death ; seal 0x40 miss sans clear Death ; sentinel -100000 → HP/8 (Med Data cmd 4|0x0D + ability&2 → /4, min 1)

## C réconcilié

```c
/* GetReviveHP @ 0x491940
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 116 instr, size 0x18e. IDA type int __cdecl(int, int, int).
 */

extern unsigned char COMMAND_TYPE_ID;                         /* 0x1D27AD9 BYTE */
extern unsigned char ATTACK_FLAG;                             /* 0x1D28E0E BYTE test 10h */
extern unsigned char HIT_TYPE_2;                              /* 0x1D27ADE BYTE ; 0x1 heal, 0x4 miss */
extern unsigned char byte_1D27ADD;                            /* 0x1D27ADD BYTE */
extern unsigned char BACK_PREEMTIVE_INFO_3;                   /* 0x1D28E0B BYTE (IDA spelling) */
extern unsigned char byte_1D28DCC[];                          /* 0x1D28DCC */
extern unsigned char byte_1D28DCD[];                          /* 0x1D28DCD */
extern unsigned char byte_1D28DCE[];                          /* 0x1D28DCE */
extern unsigned char CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID; /* 0x1D27AF4 BYTE */
extern unsigned char unk_1D28E29;                             /* 0x1D28E29 BYTE */
extern unsigned char BATTLE_SEAL;                             /* 0x1CFF6E8 BYTE test 40h */
extern unsigned char CHARA_ABILITIES[];                       /* 0x1CFF190 BYTE, F_CHAR stride 0x1D0 */
extern unsigned char BATTLE_SLOT_DATA[];                      /* 0x1D27B10, slot stride 0xD0 */

extern int __cdecl ComputeMagicAndGFDamage(int p_attacker_slot_id, int p_target_slot_id,
                                           int p_AttackPower, int p_gf_magic_type_damage); /* add esp,10h */

int __cdecl GetReviveHP(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power)
{
    unsigned char cmd;
    int slot_off;
    unsigned short status1;
    int attacker;
    int max_hp;
    int hp;

    cmd = COMMAND_TYPE_ID;

    /* Reflect bounce: command 0xF7 (247) jz loc_4919CD; ATTACK_FLAG BYTE & 0x10 jz;
     * status_2 BYTE +0x08 & 0x80 Reflect jz. Else queue and miss. */
    if (cmd != 0xF7 && (ATTACK_FLAG & 0x10)) {
        slot_off = p_target_slot_id * 0xD0; /* lea eax,[edx+edx*2]; lea r,[edx+eax*4]; shl r,4 */
        if (BATTLE_SLOT_DATA[slot_off + 0x08] & 0x80) {
            unsigned char idx;

            /* xor eax,eax ; mov al, BACK_PREEMTIVE_INFO_3 ; stores [eax+eax*2] */
            idx = BACK_PREEMTIVE_INFO_3;
            byte_1D28DCC[idx * 3] = cmd;
            byte_1D28DCD[idx * 3] = CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID;
            byte_1D28DCE[idx * 3] = (unsigned char)p_target_slot_id;
            BACK_PREEMTIVE_INFO_3 = (unsigned char)(idx + 1); /* inc bl BYTE */

            /* flag_data DWORD +0x7C ; or dh,40h */
            *(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x7C] |= 0x4000u;
            byte_1D27ADD |= 0x31;
            HIT_TYPE_2 |= 4;
            return 0;
        }
    }

loc_4919CD:
    slot_off = p_target_slot_id * 0xD0;
    /* and ch,0BFh on flag_data DWORD */
    *(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x7C] &= ~0x4000u;
    attacker = p_attacker_slot_id;
    unk_1D28E29 = 1;
    status1 = *(unsigned short *)&BATTLE_SLOT_DATA[slot_off + 0x80]; /* 66 8B status_1 WORD +0x80 */

    if (status1 & 0x40) {
        /* Zombie: ComputeMagicAndGFDamage(attacker, target EDX, power, 0) */
        hp = ComputeMagicAndGFDamage(attacker, p_target_slot_id, p_attack_power, 0);
        if (hp != (int)0xFFFE7960) /* -100000 sentinel ; jnz loc_491A65 */
            return hp;
        cmd = COMMAND_TYPE_ID; /* loc_491A13 reload BL after call */
        goto loc_491A19;
    }

    /* loc_491A69: HIT_TYPE_2 |= 1 stored BEFORE test al,1 Death */
    HIT_TYPE_2 |= 1;
    if ((status1 & 1) == 0) {
        HIT_TYPE_2 |= 4;
        return 0;
    }
    if (BATTLE_SEAL & 0x40) {
        /* loc_491A8B: miss + byte_1D27ADD|=4, keep Death, jmp loc_491A19 */
        HIT_TYPE_2 |= 4;
        byte_1D27ADD |= 4;
    } else {
        /* loc_491AB1: and eax,0FFFEh (25 FE FF 00 00) ; 66 89 status_1 AX */
        status1 = (unsigned short)(status1 & 0xFFFE);
        *(unsigned short *)&BATTLE_SLOT_DATA[slot_off + 0x80] = status1;
        byte_1D27ADD |= 4;
    }

loc_491A19:
    max_hp = *(int *)&BATTLE_SLOT_DATA[slot_off + 0x1C]; /* max_hp DWORD +0x1C ; esi overwritten */
    hp = max_hp / 8; /* cdq ; and edx,7 ; add ; sar 3  (signed toward 0) */

    /* COMMAND 4 or 0Dh ; cmp edi,3 ; jge SIGNED (not ja) ; CHARA_ABILITIES[edi*0x1D0] BYTE & 2 */
    if (cmd == 4 || cmd == 0x0D) {
        if (attacker < 3) {
            if (CHARA_ABILITIES[attacker * 0x1D0] & 2)
                hp = max_hp / 4; /* cdq ; and edx,3 ; add ; sar 2 */
        }
    }

    if (hp == 0)
        hp = 1;
    return hp;
}
```
