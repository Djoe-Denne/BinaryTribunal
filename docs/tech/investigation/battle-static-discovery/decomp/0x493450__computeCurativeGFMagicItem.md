# computeCurativeGFMagicItem @ 0x493450

- Instr (live): 106
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=52
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1608
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=304
- A==B: non
- Push IDB: oui
- SetType: int __cdecl computeCurativeGFMagicItem(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power, int p_gf_magic_type_damage)
- Notes parent: stride slot 0xD0 / F_CHAR 0x1D0 (QUISTIS_CURRENT_HP WORD + CHARA_ABILITIES BYTE). Occupancy 1+2 absent. GetRandomInt AL then AND 0xFF. Type 9/14/15 ; default=4e arg. jle/jge SIGNED (0F 8E / 7E / 7D), pas de ja. 66 seulement HIT_STATUS_1. Type9 HP ≠ slot +0x18. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* computeCurativeGFMagicItem @ 0x493450
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 106 instr, size 0x148, end 0x493598. IDA type int __cdecl(int,int,int,int).
 * No domain::. Slot stride 0xD0. F_CHAR 0x1D0 used (QUISTIS_CURRENT_HP, CHARA_ABILITIES).
 * Occupancy 1+2 unused. GetRandomInt AL only then AND 0xFF. No setcc. No ja/jb.
 * jle/jge SIGNED. 66 only on HIT_STATUS_1. Type9 HP = F_CHAR WORD, not slot +0x18.
 */

extern unsigned char HIT_TYPE_2;              /* 0x1D27ADE BYTE */
extern unsigned char HIT_ATTACK_HITPERCENT; /* 0x1D2A238 BYTE, A1 DWORD then AND 0xFF */
extern unsigned char HIT_ATTACK_ENABLER;    /* 0x1D2A239 BYTE, xor eax,eax / mov al */
extern unsigned int HIT_STATUS_2;          /* 0x1D2A234 DWORD */
extern unsigned short HIT_STATUS_1;         /* 0x1D2A23E WORD, 66 8B */
extern unsigned char ATTACK_FLAG;           /* 0x1D28E0E BYTE */
extern unsigned char BATTLE_SLOT_DATA[];   /* 0x1D27B10, stride 0xD0 */
extern short QUISTIS_CURRENT_HP[];         /* 0x1CFF172 WORD, F_CHAR +0x172, byte index *0x1D0 */
extern unsigned char CHARA_ABILITIES[];    /* 0x1CFF190, IDA int[] but test BYTE, *0x1D0 */

extern unsigned char __cdecl Battle_GetRandomInt(void); /* AL only, no add esp */
extern char __cdecl checkDoubleStatusApply(int p_target_slot_id, int p_unk,
                                           unsigned short p_hit_status_1, int p_hit_status_2); /* add esp,10h */

static int sdiv16(int v) { return (v + ((v >> 31) & 0xF)) >> 4; } /* cdq; and edx,0Fh; add; sar 4 */

int __cdecl computeCurativeGFMagicItem(int p_attacker_slot_id, int p_target_slot_id,
                                        int p_attack_power, int p_gf_magic_type_damage)
{
    int attacker;
    int target;
    int power;
    int type;
    int amount;
    int roll;

    HIT_TYPE_2 |= 1; /* 80 0D ... 01 at entry, even on later miss */

    /* signed idiv 100 after AND 0xFF; inc edx => 1..100; jle 0F 8E SIGNED */
    roll = (int)(Battle_GetRandomInt() & 0xFF) % 100 + 1;
    if ((HIT_ATTACK_HITPERCENT & 0xFF) <= roll) {
        HIT_TYPE_2 |= 4; /* A0 / 0C 04 / A2 ; heal bit already set */
        return 0;
    }

    attacker = p_attacker_slot_id; /* ECX, read before pushes, kept until Med Data */
    power = p_attack_power;         /* EBP */
    target = p_target_slot_id;     /* EDI */
    type = p_gf_magic_type_damage;  /* EAX then sub/jz chain */

    /* sub 9 jz type9; sub 5 jz type14; dec; jnz default; fallthrough type15 */
    if (type == 9) {
        /* White Wind: attacker.max_hp DWORD - movsx QUISTIS_CURRENT_HP[attacker*0x1D0] */
        amount = *(int *)&BATTLE_SLOT_DATA[attacker * 0xD0 + 0x1C]
               - (int)*(short *)((unsigned char *)QUISTIS_CURRENT_HP + attacker * 0x1D0);
    } else if (type == 14) {
        /* lea [ebp+ebp*4]; lea [eax+eax*4]; shl 1 => 50*power */
        amount = 50 * power;
    } else if (type == 15) {
        /* target.max_hp * power, signed /16 */
        amount = sdiv16(*(int *)&BATTLE_SLOT_DATA[target * 0xD0 + 0x1C] * power);
    } else {
        /* loc_4934ED: reload 4th arg after 3 pushes ([esp+0x1C]) */
        amount = p_gf_magic_type_damage;
    }

    /* ATTACK_FLAG BYTE &3 ==2 ; cmp ecx,3 ; jge SIGNED ; test BYTE CHARA_ABILITIES,2 ; shl eax,1 */
    if ((ATTACK_FLAG & 3) == 2 && attacker < 3
        && (CHARA_ABILITIES[attacker * 0x1D0] & 2)) {
        amount <<= 1;
    }

    /* lea/shl target*0xD0 ; test BYTE status_1+0x80, 40h Zombie ; neg ; esi=eax */
    if (BATTLE_SLOT_DATA[target * 0xD0 + 0x80] & 0x40)
        amount = -amount;

    /* test esi,esi ; jge loc_49354C ; and HIT_TYPE_2,0FEh ; not esi ; inc esi */
    if (amount < 0) {
        HIT_TYPE_2 &= 0xFEu;
        amount = ~amount + 1;
    }

    /* always on hit path. xor eax,eax; mov al,ENABLER ; inc edx ; cmp ; jle SIGNED 7E */
    roll = (int)(Battle_GetRandomInt() & 0xFF) % 100 + 1;
    if ((int)HIT_ATTACK_ENABLER > roll) {
        /* push HIT_STATUS_2 DWORD, HIT_STATUS_1 WORD in EDX, power, target ; add esp,10h */
        checkDoubleStatusApply(target, power, HIT_STATUS_1, (int)HIT_STATUS_2);
    }

    return amount; /* mov eax,esi */
}
```
