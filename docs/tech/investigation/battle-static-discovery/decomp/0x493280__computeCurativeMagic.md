# computeCurativeMagic @ 0x493280

- Instr (live): 139
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4708
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1078
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1811 (1er appel finish=length C vide, retry --effort high --max-tokens 65536)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl computeCurativeMagic(int p_attacker_slot_id, int p_target_slot_id, int p_attack_power, int a4)
- Notes parent: stride slot 0xD0 ; occupancy 1+2 / F_CHAR 0x1D0 absents (ASM: flag_data DWORD +0x7C bit 0x4000). GetRandomInt AL then AND 0xFF, %33+0xF0. Bounce EAX=0. HIT_TYPE_2|=1 avant gates. Invuln 0x200000 only + Death + Earth/Float. a4=7 cure / a4=8 max_hp*power/16 / default=target slot. Shell BYTE sans ATTACK_FLAG&3. 66: status_1, HIT_STATUS_1. jge SIGNED. setcc/ja/jg absents. Pas de struct packée. Pas de Hex-Rays.

## C réconcilié

```c
/* computeCurativeMagic @ 0x493280
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 139 instr, size 0x1CB, end 0x49344B. IDA type int __cdecl(int,int,int,int).
 * No domain::. Slot stride 0xD0. Occupancy 1+2 unused. F_CHAR 0x1D0 unused.
 * GetRandomInt AL only then AND 0xFF. No setcc. No ja/jg (jz/jnz/jge SIGNED).
 * WORD 66: status_1[esi], HIT_STATUS_1. flag_data DWORD 0x4000. Bounce EAX=0.
 */

extern unsigned char COMMAND_TYPE_ID;                         /* 0x1D27AD9 BYTE */
extern unsigned char ATTACK_FLAG;                             /* 0x1D28E0E BYTE */
extern unsigned char BACK_PREEMTIVE_INFO_3;                  /* 0x1D28E0B BYTE (IDA spelling) */
extern unsigned char CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID; /* 0x1D27AF4 WORD, BYTE read */
extern unsigned char HIT_TYPE_2;                              /* 0x1D27ADE BYTE */
extern unsigned char byte_1D27ADD;                            /* 0x1D27ADD BYTE */
extern unsigned int HIT_STATUS_2;                            /* 0x1D2A234 DWORD */
extern unsigned short HIT_STATUS_1;                         /* 0x1D2A23E WORD (66) */
extern unsigned char HIT_ELEMENT;                              /* 0x1D2A244 BYTE */
extern unsigned char byte_1D28DCC[];                          /* 0x1D28DCC */
extern unsigned char byte_1D28DCD[];                          /* 0x1D28DCD */
extern unsigned char byte_1D28DCE[];                          /* 0x1D28DCE */
extern unsigned char BATTLE_SLOT_DATA[];                       /* 0x1D27B10 stride 0xD0 */

extern unsigned char __cdecl Battle_GetRandomInt(void); /* AL only, no add esp */
extern char __cdecl checkDoubleStatusApply(int p_target_slot_id, int p_unk,
                                           unsigned short p_hit_status_1, int p_hit_status_2);

#define OFF_STATUS2  0x08
#define OFF_MAXHP    0x1C
#define OFF_FLAGDATA 0x7C
#define OFF_STATUS1  0x80
#define OFF_MAG      0xBF

#define BS8(slot, off)  (*(unsigned char  *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))
#define BS16(slot, off) (*(unsigned short *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))
#define BS32(slot, off) (*(unsigned int   *)(BATTLE_SLOT_DATA + (unsigned int)(slot) * 0xD0u + (off)))

/* cdq; sub eax,edx; sar 1 */
static int sdiv2(int v) { return (v - (v >> 31)) >> 1; }
/* cdq; and edx,0Fh; add; sar 4 */
static int sdiv16(int v) { return (v + ((v >> 31) & 0xF)) >> 4; }
/* cdq; and edx,0FFh; add; sar 8 */
static int sdiv256(int v) { return (v + ((v >> 31) & 0xFF)) >> 8; }

int __cdecl computeCurativeMagic(int p_attacker_slot_id, int p_target_slot_id,
                                 int p_attack_power, int a4)
{
    unsigned char cmd;
    unsigned char idx;
    unsigned int status2;
    unsigned short st1;
    int heal;
    int spread;
    int mag;
    int t;

    cmd = COMMAND_TYPE_ID;

    /* cmp dl,0F7h ; jz loc_49330B
     * test ATTACK_FLAG,10h ; jz loc_49330B
     * lea/shl target*0xD0 ; test BYTE status_2,80h Reflect ; jz loc_49330B */
    if (cmd != 0xF7 && (ATTACK_FLAG & 0x10) != 0
        && (BS8(p_target_slot_id, OFF_STATUS2) & 0x80) != 0) {
        idx = BACK_PREEMTIVE_INFO_3; /* xor eax,eax ; mov al */
        byte_1D28DCC[idx * 3] = cmd;
        byte_1D28DCD[idx * 3] = CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID;
        byte_1D28DCE[idx * 3] = (unsigned char)p_target_slot_id; /* BL */
        /* re-read BL, inc bl, store BYTE (8-bit wrap) */
        BACK_PREEMTIVE_INFO_3 = (unsigned char)(BACK_PREEMTIVE_INFO_3 + 1);

        /* dword ptr flag_data+0x7C ; or ah,40h  (no 66) */
        BS32(p_target_slot_id, OFF_FLAGDATA) |= 0x4000u;

        byte_1D27ADD |= 0x31;
        HIT_TYPE_2 |= 4;
        return 0; /* xor eax,eax ; pop esi/ebx */
    }

    /* loc_49330B: recompute target*0xD0 into ESI; and dh,0BFh */
    BS32(p_target_slot_id, OFF_FLAGDATA) &= ~0x4000u;

    /* or dl,cl cl=1 ; store HIT_TYPE_2 BEFORE test 0x04000000 */
    HIT_TYPE_2 |= 1;

    if ((HIT_STATUS_2 & 0x04000000u) == 0) {
        status2 = BS32(p_target_slot_id, OFF_STATUS2);
        if ((status2 & 0x200000u) != 0)
            goto loc_493362;
        if ((BS8(p_target_slot_id, OFF_STATUS1) & 1) != 0) /* cl=1 Death */
            goto loc_493362;
        /* F6 05 HIT_ELEMENT,8 ; jz loc_493373 ; test ah,20h Float */
        if ((HIT_ELEMENT & 8) != 0 && (status2 & 0x2000u) != 0)
            goto loc_493362;
    }

    /* EAX=a4 ; sub eax,7 ; jz loc_493398 ; dec eax ; jnz loc_4933E4 */
    if (a4 == 7) {
        /* GetRandomInt AL ; AND 0xFF ; idiv 21h ; add 0F0h */
        spread = (int)(Battle_GetRandomInt() & 0xFFu) % 33 + 0xF0;
        mag = (int)BS8(p_attacker_slot_id, OFF_MAG);
        t = sdiv2(mag + p_attack_power);
        t = t * spread;                 /* imul eax,ecx */
        t = t * p_attack_power;         /* imul eax,edi */
        heal = sdiv256(t);
    } else if (a4 == 8) {
        /* max_hp DWORD * power ; cdq ; and edx,0Fh ; add ; sar 4 */
        heal = sdiv16((int)BS32(p_target_slot_id, OFF_MAXHP) * p_attack_power);
    } else {
        heal = p_target_slot_id; /* loc_4933E4: [esp+0Ch+p_target_slot_id] */
    }

    /* loc_4933E8: BYTE status_2 Shell 0x40 ; no ATTACK_FLAG&3 */
    if ((BS8(p_target_slot_id, OFF_STATUS2) & 0x40) != 0 && heal != 0) {
        byte_1D27ADD |= 0x20;
        heal >>= 1; /* sar eax,1 */
    }

    /* 66 mov cx, status_1 */
    st1 = BS16(p_target_slot_id, OFF_STATUS1);
    if ((st1 & 4) != 0) /* Petrify */
        heal = 0;
    if ((st1 & 0x40) != 0) /* Zombie neg */
        heal = -heal;

    if (heal < 0) { /* jge SIGNED 7D, not ja */
        HIT_TYPE_2 &= 0xFEu; /* and dl,0FEh */
        heal = ~heal + 1; /* not esi ; inc esi */
    }

    /* push HIT_STATUS_2 ; push CX=HIT_STATUS_1 ; push edi=power ; push ebx=target */
    checkDoubleStatusApply(p_target_slot_id, p_attack_power, HIT_STATUS_1, (int)HIT_STATUS_2);
    return heal; /* mov eax,esi ; pop edi,esi,ebx */

loc_493362:
    HIT_TYPE_2 |= 4; /* heal bit 1 already stored */
    return 0;
}
```
