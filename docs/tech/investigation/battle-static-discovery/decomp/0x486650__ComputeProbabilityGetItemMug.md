# ComputeProbabilityGetItemMug @ 0x486650

- Instr (live): 72
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1429
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=155
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=81
- A==B: non
- Push IDB: oui
- SetType: int __cdecl ComputeProbabilityGetItemMug(int p_monster_slot_id)
- Notes parent: Stride slot*0xD0. Occupancy +1/+2 / F_CHAR 0x1D0 / GF 0x44 absents. GetRandomInt AL + AND 0xFF x2, 0 args. flag_data +0x7C test ch,8 = 0x800. info **deref +0. jg signe vs +0x14D. jnb unsigned count>=24. Rare bit2: jge 80/F2 setnl 105. Normal B2/E5/F4. BMI71 slot*71 BYTE. Paires BYTE +0x134/+0x135. EAX leftover.

## C réconcilié

```c
/* ComputeProbabilityGetItemMug @ 0x486650
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 72 instr, size 0xFA, end 0x48674A. cdecl, 1 arg. Saved ebx/esi/edi. retn C3.
 * Slot stride 0xD0 (lea [esi+esi*2]; lea [esi+eax*4]; shl 4). Occupancy +1/+2 unused.
 * F_CHAR 0x1D0 unused. GF Exists 0x44 unused.
 * GetRandomInt AL only, 0 args, no add esp; both calls followed by AND EAX,0xFFh.
 * jg/jge/setnl SIGNED. jnb UNSIGNED. BYTE stores only (no 66).
 * EAX leftover at retn (no xor/mov eax). No domain::.
 */

extern unsigned char BATTLE_SLOT_DATA[];             /* 0x1D27B10, FF8BattleSlotData_s[11], stride 0xD0 */
extern unsigned char RARE_ITEM_ABILITY_IN_IT;        /* 0x1CFF6D8 BYTE, bit 2 = Rare Item */
extern unsigned char BMI71_LOW_MED_HIGH_LEVEL_BIS[]; /* 0x1D28E89 _BYTE[143], index slot*71 */
extern unsigned char ITEM_RELATED[];                  /* 0x1CFF5E0 BYTE item id */
extern unsigned char ITEM_RELATED_0[];               /* 0x1CFF5E1 BYTE qty (= ITEM_RELATED+1) */
extern unsigned char ATTACKER_SLOT_ID_0[];            /* 0x1D28DF8; [2] @ 0x1D28DFA BYTE pair count */

unsigned char __cdecl Battle_GetRandomInt(void); /* 0x48F020, AL only */

int __cdecl ComputeProbabilityGetItemMug(int p_monster_slot_id)
{
    unsigned char *base;
    unsigned char *info;
    unsigned int flags;
    int roll;
    int rarity;
    unsigned int band;
    unsigned int index;
    unsigned int count;
    unsigned char item_id;
    unsigned char qty;

    /* lea eax,[esi+esi*2]; lea eax,[esi+eax*4]; shl eax,4 → slot*0xD0 */
    base = BATTLE_SLOT_DATA + (unsigned int)p_monster_slot_id * 0xD0u;

    /* mov ecx, DWORD flag_data[+0x7C]; test ch,8 → bit 11 = 0x800 */
    flags = *(unsigned int *)(base + 0x7C);
    if ((flags & 0x800u) != 0)
        goto loc_486746;

    /* mov ecx, DWORD monster_info_section[+0]; mov edi,[ecx] */
    info = *(unsigned char **)(*(unsigned int *)base);

    /* xor ebx,ebx; mov bl,[edi+14Dh] */
    /* call GetRandomInt; and eax,0FFh; cmp eax,ebx; jg SIGNED */
    roll = (int)Battle_GetRandomInt() & 0xFF;
    if (roll > (int)info[0x14D])
        goto loc_486746;

    /* cmp BYTE [0x1D28DFA],18h; jnb UNSIGNED */
    if (ATTACKER_SLOT_ID_0[2] >= 0x18u)
        goto loc_486746;

    /* second GetRandomInt; mov cl,RARE_ITEM; and eax,0FFh; test cl,2 */
    roll = (int)Battle_GetRandomInt() & 0xFF;
    if ((RARE_ITEM_ABILITY_IN_IT & 2u) != 0) {
        /* cmp 80h; jge. Else xor eax,eax */
        if (roll >= 0x80) {
            /* cmp 0F2h; jge. Else mov eax,1 */
            if (roll >= 0xF2) {
                /* xor edx,edx; cmp 105h; setnl dl; add edx,2
                 * After AND 0xFF, EAX is 0..255 so >=0x105 is never true. */
                rarity = 2 + (roll >= 0x105 ? 1 : 0);
            } else {
                rarity = 1;
            }
        } else {
            rarity = 0;
        }
    } else {
        /* loc_4866DD: cmp 0B2h / 0E5h / 0F4h + setnl */
        if (roll >= 0xB2) {
            if (roll >= 0xE5) {
                rarity = 2 + (roll >= 0xF4 ? 1 : 0);
            } else {
                rarity = 1;
            }
        } else {
            rarity = 0;
        }
    }

    /* loc_486705: lea edx,[esi+esi*8]; shl 3; sub edx,esi → slot*71
     * xor ecx,ecx; mov cl,BMI71[edx] */
    band = (unsigned int)BMI71_LOW_MED_HIGH_LEVEL_BIS[(unsigned int)p_monster_slot_id * 71u];
    count = (unsigned int)ATTACKER_SLOT_ID_0[2];
    /* lea ecx,[eax+ecx*4] */
    index = (unsigned int)rarity + band * 4u;

    /* xor eax,eax; mov al,dl; BYTE [edi+ecx*2+134h] / +135h */
    item_id = info[index * 2u + 0x134];
    qty = info[index * 2u + 0x135];
    /* shl eax,1; inc dl; BYTE stores; write count */
    ITEM_RELATED[count * 2u] = item_id;
    ITEM_RELATED_0[count * 2u] = qty;
    ATTACKER_SLOT_ID_0[2] = (unsigned char)(count + 1u);

loc_486746:
    /* pop edi; pop esi; pop ebx; retn. EAX leftover (no xor/mov eax). */
}
```
