# computeCrit @ 0x492B30

- Instr (live): 36
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=523
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=25
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=766
- A==B: non
- Push IDB: oui
- SetType: char __cdecl computeCrit(int p_attacker_slot_id)
- Notes parent: slot*0xD0 luck BYTE +0xC2 ; occupancy/F_CHAR absents ; GetRandomInt AL+AND 0xFF toujours tiré ; chance=(255*sum)/255 signed 80808081h ; jz chance==0 puis jb unsigned ; crit HIT_TYPE_2|=2 BOOL=1 ; miss BOOL=0 EAX=rand8 ; pas de 66/setcc/ja/jg

## C réconcilié

```c
/* computeCrit @ 0x492B30
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 36 instr, size 0x6c. End 0x492B9C.
 * IDA type char __cdecl(int p_attacker_slot_id).
 * No domain::. Slot stride 0xD0. Occupancy 1+2 unused. F_CHAR 0x1D0 unused.
 * GetRandomInt AL only + AND 0xFF. No setcc. jz + jb (unsigned), not jg. No jump table.
 * BYTE luck +0xC2, RELATED_TO_CRIT_BONUS, HIT_TYPE_2, BOOL_ATTACK_CRITED. No WORD / no 66.
 */

unsigned char __cdecl Battle_GetRandomInt(void);

extern unsigned char BATTLE_SLOT_DATA[];      /* 0x1D27B10 stride 0xD0 */
extern unsigned char RELATED_TO_CRIT_BONUS; /* 0x1D2A23B BYTE */
extern unsigned char HIT_TYPE_2;            /* 0x1D27ADE BYTE ; bit 0x2 = crit */
extern unsigned char BOOL_ATTACK_CRITED;    /* 0x1D28E07 BYTE */

char __cdecl computeCrit(int p_attacker_slot_id)
{
    int slot_off;
    int sum;
    int chance;
    unsigned int rnd;
    unsigned char hit;

    /* lea ecx,[eax+eax*2]; lea edx,[eax+ecx*4]; shl edx,4 => slot*0xD0 */
    slot_off = p_attacker_slot_id * 0xD0;

    /* xor eax,eax; mov al, [edx+0x1D27BD2]; xor ecx,ecx; mov cl, RELATED_TO_CRIT_BONUS */
    sum = (int)BATTLE_SLOT_DATA[slot_off + 0xC2] + (int)RELATED_TO_CRIT_BONUS;

    /* ecx = (sum<<8)-sum = 255*sum; imul 80808081h; add edx,ecx; sar edx,7; edx+=(edx>>31)
     * ESI = signed (255*sum)/255 */
    chance = (255 * sum) / 255;

    rnd = (unsigned int)Battle_GetRandomInt() & 0xFFu; /* call; and eax,0FFh ; always drawn */

    if (chance == 0)
        goto loc_492B93;

    /* cmp esi,eax; jb loc_492B93 = UNSIGNED below, not jg */
    if ((unsigned int)chance < rnd)
        goto loc_492B93;

    hit = HIT_TYPE_2;          /* A0 */
    BOOL_ATTACK_CRITED = 1;    /* C6 05 07 8E D2 01 01 */
    hit |= 2u;                  /* 0C 02 */
    HIT_TYPE_2 = hit;           /* A2 after pop esi */
    return (char)hit;

loc_492B93:
    BOOL_ATTACK_CRITED = 0;     /* C6 05 ... 00 ; HIT_TYPE_2 unchanged */
    return (char)rnd;           /* EAX leftover = rand8 */
}
```
