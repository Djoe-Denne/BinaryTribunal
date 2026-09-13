# computeResurrection @ 0x4935A0

- Instr (live): 49
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=42
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=38
- A==B: non
- Push IDB: oui
- SetType: int __cdecl computeResurrection(int p_attacker_slot_id, int p_target_slot_id, int p_attacker_power)
- Notes parent: slot*0xD0 ; occupancy 1+2 / F_CHAR 0x1D0 / GetRandomInt absents ; unk_1D28E29=1 ; status_1 WORD +0x80 66 ; Zombie AL&0x40 → ComputeMagicAndGFDamage(...,0) add esp,10h EAX tel quel ; HIT_TYPE_2|=1 avant test Death ; pas KO → |=4 EAX=0 ; seal 0x40 miss sans clear Death EAX=-100000 ; success and 0xFFFE + 66 store AX, byte_1D27ADD|=4, EAX=-100000 ; jz/jnz only ; pas de setcc/ja/jg/jpt ; pas de Hex-Rays

## C réconcilié

```c
/* computeResurrection @ 0x4935A0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 49 instr, size 0xA1, end 0x493641. IDA type int __cdecl(int,int,int).
 * No domain::. Slot stride 0xD0. Occupancy 1+2 unused. F_CHAR 0x1D0 unused.
 * GetRandomInt unused. No setcc. jz/jnz only (no ja/jg).
 * WORD status_1 66 load/store +0x80. BYTE: unk_1D28E29, HIT_TYPE_2, BATTLE_SEAL, byte_1D27ADD.
 * DWORD: and eax,0FFFEh (25 FE FF 00 00) then store AX.
 */

extern unsigned char unk_1D28E29;       /* 0x1D28E29 BYTE */
extern unsigned char HIT_TYPE_2;        /* 0x1D27ADE BYTE ; bit0=heal, bit2=miss */
extern unsigned char byte_1D27ADD;      /* 0x1D27ADD BYTE */
extern unsigned char BATTLE_SEAL;       /* 0x1CFF6E8 BYTE test 40h */
extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10, stride 0xD0 */

extern int __cdecl ComputeMagicAndGFDamage(int p_attacker_slot_id, int p_target_slot_id,
                                           int p_AttackPower, int p_gf_magic_type_damage); /* add esp,10h */

int __cdecl computeResurrection(int p_attacker_slot_id, int p_target_slot_id,
                                int p_attacker_power)
{
    unsigned int slot_off;
    unsigned short *status1_ptr;
    unsigned short status1;

    unk_1D28E29 = 1; /* C6 05 29 8E D2 01 01  all paths */

    /* lea eax,[ecx+ecx*2]; lea edx,[ecx+eax*4]; shl edx,4 => target*0xD0 */
    slot_off = (unsigned int)p_target_slot_id * 0xD0u;
    /* 66 8B 82 90 7B D2 01 ; 8D 92 90 7B D2 01  EDX=&status_1 WORD +0x80 */
    status1_ptr = (unsigned short *)&BATTLE_SLOT_DATA[slot_off + 0x80];
    status1 = *status1_ptr;

    if ((unsigned char)status1 & 0x40) { /* test al,40h Zombie */
        /* push 0, power, target ECX, attacker [esp+10h]; add esp,10h; ret EAX */
        return ComputeMagicAndGFDamage(p_attacker_slot_id, p_target_slot_id,
                                       p_attacker_power, 0);
    }

    /* loc_4935DB: or cl,1 ; test al,1 ; mov HIT_TYPE_2,cl ; jnz loc_4935FA */
    HIT_TYPE_2 |= 1;
    if ((status1 & 1) == 0) {
        HIT_TYPE_2 |= 4;
        return 0;
    }

    /* loc_4935FA: mov bl,BATTLE_SEAL ; test bl,40h ; mov cl,4 */
    if (BATTLE_SEAL & 0x40) {
        HIT_TYPE_2 |= 4;
        byte_1D27ADD |= 4;
        return (int)0xFFFE7960; /* -100000 ; Death kept */
    }

    /* loc_493627: and eax,0FFFEh ; 66 89 02 */
    status1 = (unsigned short)(status1 & 0xFFFE);
    *status1_ptr = status1;
    byte_1D27ADD |= 4;
    return (int)0xFFFE7960;
}
```
