# specialGFDamage @ 0x4931C0

- Instr (live): 45
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=14
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=48
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=22
- A==B: non
- Push IDB: oui
- SetType: int __cdecl specialGFDamage(int p_attacker_slot_id, int p_target_slot_id, int p_attacker_power, int a4)
- Notes parent: slot*0xD0 ; occupancy 1+2 / F_CHAR 0x1D0 / GetRandomInt absents ; Petrify BYTE status_1+0x80 bit 4 ; Invincible DWORD status_2+0x08 test ch,8 = 0x800 ; jpt_4931ED 8 dwords a4-11 UNSIGNED ja ; 11:100*power-HIT&FF ; 12:curhp DWORD-1 ; 13:0x10624DD3 /1000 +1 then *1000 ; 18:EAX=1 ; 14-17/ja:power ; pas de 66/setcc/jg ; attacker unused

## C réconcilié

```c
/* specialGFDamage @ 0x4931C0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_4931ED.
 * 45 instr, size 0x97, end 0x493257. IDA type int __cdecl(int,int,int,int).
 * No domain::. Slot stride 0xD0. Occupancy 1+2 unused. F_CHAR 0x1D0 unused.
 * GetRandomInt unused (no call). No setcc. ja UNSIGNED switch bound, not jg.
 * No 66 / no WORD. BYTE: status_1 test. DWORD: status_2, current_hp, HIT/GF loads.
 * p_attacker_slot_id unused.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10, stride 0xD0 */
extern unsigned int HIT_ATTACK_HITPERCENT; /* 0x1D2A238 BYTE, DWORD load, AND 0xFF */
extern unsigned int GF_LEVEL; /* 0x1D2A240 BYTE, DWORD load, AND 0xFF */

int __cdecl specialGFDamage(int p_attacker_slot_id, int p_target_slot_id,
                            int p_attacker_power, int a4)
{
    int slot_off;
    unsigned int status2;
    unsigned int type;
    int lvl;
    int prod;
    int q;

    (void)p_attacker_slot_id; /* [esp+4] never read */

    /* lea ecx,[eax+eax*2]; lea eax,[eax+ecx*4]; shl eax,4 => slot*0xD0 */
    slot_off = p_target_slot_id * 0xD0;

    /* test byte ptr status_1[+0x80], 4 ; jnz loc_493254  Petrify */
    if ((BATTLE_SLOT_DATA[slot_off + 0x80] & 4) != 0)
        return 0;

    /* mov ecx, status_2[+0x08] DWORD ; test ch,8 ; jnz loc_493254  bit 0x800 Invincible */
    status2 = *(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x08];
    if ((status2 & 0x800u) != 0)
        return 0;

    /* lea ecx,[edx-0Bh]; cmp ecx,7; ja def_4931ED (UNSIGNED). jpt @ 0x493258 */
    type = (unsigned int)(a4 - 11);
    if (type > 7u)
        return p_attacker_power; /* a4 < 11 or a4 > 18 */

    switch (type) {
    case 0: /* a4==11 loc_4931F4 : power*100 - (HIT & 0xFF) ; *5 *5 shl2 */
        return p_attacker_power * 100 - (int)(HIT_ATTACK_HITPERCENT & 0xFFu);

    case 1: /* a4==12 loc_493210 Moomba : current_hp DWORD +0x18, DEC */
        return (int)(*(unsigned int *)&BATTLE_SLOT_DATA[slot_off + 0x18]) - 1;

    case 2: /* a4==13 loc_493218 Cactuar */
        lvl = (int)(GF_LEVEL & 0xFFu);
        prod = lvl * p_attacker_power; /* imul ecx, power (low 32) */
        /* imul eax=0x10624DD3 * ecx -> edx:eax; sar edx,6; shr sign 31; lea [edx+eax+1] */
        q = (int)(((long long)prod * 0x10624DD3LL) >> 32);
        q >>= 6;
        q = q + (int)((unsigned int)q >> 31) + 1;
        return q * 1000; /* *5 *5 *5 shl3 */

    case 3:
    case 4:
    case 5:
    case 6: /* a4==14..17 -> def_4931ED */
        return p_attacker_power;

    case 7: /* a4==18 loc_493249 Excalipoor */
        return 1;

    default:
        return p_attacker_power;
    }
}
```
