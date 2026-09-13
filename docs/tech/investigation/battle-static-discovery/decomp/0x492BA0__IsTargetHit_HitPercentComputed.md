# IsTargetHit_HitPercentComputed @ 0x492BA0

- Instr (live): 48
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=79
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: BOOL __cdecl IsTargetHit_HitPercentComputed(int p_attacker, int p_target)
- Notes parent: slot*0xD0 luck BYTE +0xC2 eva +0xC3 status_1 +0x80 bit 8 Darkness SHR r/m8 global HIT_ATTACK_HITPERCENT in-place ; occupancy/F_CHAR absents ; GetRandomInt AL+AND 0xFF toujours tiré ; chance=(255*acc)/100 signed 51EB851Fh ; jns clamp ; jz chance==0 puis jb unsigned ; EAX 1=hit / 0=miss ; pas de 66/setcc/ja/jg

## C réconcilié

```c
/* IsTargetHit_HitPercentComputed @ 0x492BA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 48 instr, size 0x92. End 0x492C32. IDA type BOOL __cdecl(int, int).
 * No domain::. Slot stride 0xD0. Occupancy 1+2 unused. F_CHAR 0x1D0 unused.
 * GetRandomInt AL only + AND 0xFF. Always drawn before chance==0.
 * No setcc. jz + jb (unsigned), jns signed clamp. No ja/jg. No jump table.
 * BYTE status_1 +0x80, luck +0xC2, eva +0xC3, HIT_ATTACK_HITPERCENT. No WORD / no 66.
 */

unsigned char __cdecl Battle_GetRandomInt(void);

extern unsigned char BATTLE_SLOT_DATA[];      /* 0x1D27B10 stride 0xD0 */
extern unsigned char HIT_ATTACK_HITPERCENT; /* 0x1D2A238 BYTE */

int __cdecl IsTargetHit_HitPercentComputed(int p_attacker, int p_target)
{
    int att_off;
    int tgt_off;
    int acc;
    int chance;
    unsigned int rnd;

    /* lea ecx,[eax+eax*2]; lea edx,[eax+ecx*4]; shl edx,4 => slot*0xD0 */
    att_off = p_attacker * 0xD0;

    /* test byte ptr status_1[edx], 8 ; jz loc_492BBD
     * C0 2D 38 A2 D2 01 02 SHR r/m8,2 IN PLACE (global mutated) */
    if ((BATTLE_SLOT_DATA[att_off + 0x80] & 8) != 0)
        HIT_ATTACK_HITPERCENT >>= 2;

    /* target: lea ecx,[eax+eax*2]; lea ecx,[eax+ecx*4]; shl ecx,4
     * attacker luck read from EDX before xor edx,edx */
    tgt_off = p_target * 0xD0;

    /* xor eax,eax; mov al,luck[edx]; shr eax,1
     * mov dl,eva[ecx]; sub; mov dl,luck[ecx]
     * mov ecx, dword HIT_ATTACK_HITPERCENT; and ecx,0FFh; add */
    acc = (int)BATTLE_SLOT_DATA[att_off + 0xC2];
    acc >>= 1;
    acc -= (int)BATTLE_SLOT_DATA[tgt_off + 0xC3];
    acc -= (int)BATTLE_SLOT_DATA[tgt_off + 0xC2];
    acc += (int)HIT_ATTACK_HITPERCENT;

    /* jns loc_492BFA else xor eax,eax */
    if (acc < 0)
        acc = 0;

    /* ecx=(acc<<8)-acc=255*acc; imul 51EB851Fh; sar edx,5; edx+=(edx>>31)
     * ESI = signed (255*acc)/100 */
    chance = (255 * acc) / 100;

    rnd = (unsigned int)Battle_GetRandomInt() & 0xFFu; /* always drawn */

    if (chance == 0)
        goto loc_492C2E;

    /* cmp esi,eax; jb loc_492C2E = UNSIGNED below, not jg */
    if ((unsigned int)chance < rnd)
        goto loc_492C2E;

    return 1;

loc_492C2E:
    return 0;
}
```
