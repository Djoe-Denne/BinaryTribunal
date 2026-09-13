# ComputeGFLevelAndApAfterKill @ 0x494AF0

- Instr (live): 166
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6361 (retry high/65536 after auto length)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3712 (retry high/65536 after auto length)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6155 (retry high/65536 after auto length)
- A==B: non
- Push IDB: oui
- SetType: __int16 __cdecl ComputeGFLevelAndApAfterKill(int p_attacker_slot_id, int p_target_slot_id, int p_command_type_id, int a4)
- Notes parent: slot 0xD0; F_CHAR/occupancy/GetRandomInt absents. monster_info ** deux loads. extra_xp WORD +0x100 / xp WORD +0x102 / ap BYTE +0x14F. 0xFE RELATED_TO_XP[a4]+kills stride 0x44. 0x1D/7 AP only. XP_EARNED 8B then 66 C7 cap, ja UNSIGNED. jge vs 1; jbe vs 0xEA60. NumberOfKills 66 FF WORD. Retour movzx AX.

## C réconcilié

```c
/* ComputeGFLevelAndApAfterKill @ 0x494AF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 166 instr, size 0x24E. IDA type __int16 __cdecl(int,int,int,int). No domain::.
 * Slot stride 0xD0 (lea*3 / +*4 / shl 4). F_CHAR 0x1D0 unused.
 * Occupancy flag_data 1+2 unused. GetRandomInt unused. No setcc.
 * monster_info_section @+0 is a pointer: mov ecx,[slot+0]; mov ecx,[ecx]
 *   then WORD extra_xp +0x100, WORD xp +0x102, BYTE ap +0x14F.
 * Slot: +0x18 current_hp DWORD, +0x1C max_hp DWORD, +0xBC level BYTE.
 * GF NumberOfKills @ 0x1CFDCE4, id=a4-0x40, *17 then [eax*4] = stride 0x44, 66 FF WORD inc.
 * 66 WORD: extra_xp/xp/RELATED/XP_EARNED_EXTRA/XP_EARNED store/AP add.
 * XP_EARNED: 8B DWORD load, 66 C7 WORD cap first, 03 C1, 66 3D, 77 ja UNSIGNED, 66 A3.
 * jge SIGNED vs 1 (7D); jbe UNSIGNED vs 0xEA60 (76). Return movzx AX, ap BYTE.
 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10, stride 0xD0 */
extern unsigned char AVERAGE_PARTY_LEVEL[]; /* 0x1CFF320 BYTE, index a4*12 */
extern unsigned short RELATED_TO_XP[]; /* 0x1CFF520 WORD[a4] */
extern unsigned short XP_EARNED_EXTRA[]; /* 0x1CFF57A WORD[attacker] */
extern unsigned short BCI_GF_AP_EARNED; /* 0x1CFF5C0 WORD */
extern int __cdecl GetPartyAverageLevelExact(void);

static unsigned char *SlotBase(int slot_id)
{
    /* lea [id+id*2]; lea [id+eax*4]; shl 4 */
    return BATTLE_SLOT_DATA + slot_id * 0xD0;
}

static unsigned char *MonsterInfo(unsigned char *slot)
{
    /* mov ecx, [slot+0]; mov ecx, [ecx] */
    return *(unsigned char **)(*(void **)slot);
}

/* extra_xp/xp==0 -> 0; else signed min 1 (jge); unsigned AX max 0xEA60 (jbe). */
static int ClampXpGain(int v, unsigned short src)
{
    if (src == 0)
        return 0;
    if (v < 1)
        return 1;
    if ((unsigned short)v > 0xEA60u)
        return 0xEA60;
    return v;
}

static unsigned short SaturateAddWord(unsigned short old, unsigned short addend)
{
    /* 66 add ax, mem; cmp ax, 0EA60h; jbe; mov eax, 0EA60h */
    unsigned short sum = (unsigned short)(old + addend);
    if (sum > 0xEA60u)
        sum = 0xEA60;
    return sum;
}

__int16 __cdecl ComputeGFLevelAndApAfterKill(
    int p_attacker_slot_id,
    int p_target_slot_id,
    int p_command_type_id,
    int a4)
{
    unsigned char *tgt = SlotBase(p_target_slot_id);
    unsigned char *mi;
    int cmd = p_command_type_id;
    int gain;
    unsigned short extra_xp;
    unsigned short xp;
    int tlevel;
    int divisor;

    if (cmd == 0xFE) { /* COMMAND_G_FORCE */
        mi = MonsterInfo(tgt);
        extra_xp = *(unsigned short *)(mi + 0x100);
        tlevel = (int)tgt[0xBC]; /* xor edx,edx; mov dl, level */
        divisor = (int)AVERAGE_PARTY_LEVEL[a4 * 12]; /* lea edx,[a4+a4*2]; mov bl,[edx*4] */

        /* imul level,extra; lea *5; cdq; idiv ebx; sub extra — no zero-divisor guard */
        gain = tlevel * (int)extra_xp;
        gain = gain * 5 / divisor - (int)extra_xp;
        gain = ClampXpGain(gain, extra_xp);

        RELATED_TO_XP[a4] = SaturateAddWord(RELATED_TO_XP[a4], (unsigned short)gain);

        {
            int gf = a4 - 0x40; /* add ecx, 0FFFFFFC0h */
            unsigned short *kills = (unsigned short *)(0x1CFDCE4 + gf * 0x44);
            ++*kills; /* 66 FF inc WORD */
        }
        goto loc_494C70;
    }

    if (cmd != 0 && cmd != 0xF5 && cmd != 0x1D && cmd != 7 && cmd != 0xF6) {
        unsigned char *atk = SlotBase(p_attacker_slot_id);

        mi = MonsterInfo(tgt);
        extra_xp = *(unsigned short *)(mi + 0x100);
        tlevel = (int)tgt[0xBC]; /* xor ecx,ecx; mov cl, level */
        divisor = (int)atk[0xBC]; /* xor ebx,ebx; mov bl, attacker level */

        gain = tlevel * (int)extra_xp;
        gain = gain * 5 / divisor - (int)extra_xp;
        gain = ClampXpGain(gain, extra_xp);

        XP_EARNED_EXTRA[p_attacker_slot_id] =
            SaturateAddWord(XP_EARNED_EXTRA[p_attacker_slot_id], (unsigned short)gain);

        cmd = p_command_type_id; /* mov eax, [esp+cmd] */
    }

    /* loc_494C5E */
    if (cmd == 0x1D || cmd == 7) /* COMMAND_CARD / COMMAND_DEVOUR */
        goto loc_494D19;

loc_494C70:
    mi = MonsterInfo(tgt);
    xp = *(unsigned short *)(mi + 0x102);
    if (xp == 0 || *(unsigned int *)(tgt + 0x1C) == *(unsigned int *)(tgt + 0x18)) {
        gain = 0; /* loc_494CE1 */
    } else {
        unsigned int max_hp = *(unsigned int *)(tgt + 0x1C);
        unsigned int cur_hp = *(unsigned int *)(tgt + 0x18);
        int avg = GetPartyAverageLevelExact(); /* cdecl, 0 args, no add esp */

        tlevel = (int)tgt[0xBC]; /* xor eax,eax; mov al, [esi+0BCh] */
        gain = tlevel * (int)xp;
        gain = gain * 5 / avg - (int)xp;
        gain = gain * (int)(max_hp - cur_hp) / (int)max_hp;
        gain = ClampXpGain(gain, xp);
    }

    {
        /* 8B 0D DWORD load; 66 C7 WORD 0xEA60; 03 C1; cmp ax; ja UNSIGNED; 66 A3 */
        unsigned int old = *(unsigned int *)0x1CFF574;
        unsigned int sum;
        *(unsigned short *)0x1CFF574 = 0xEA60;
        sum = (unsigned int)gain + old;
        if ((unsigned short)sum <= 0xEA60u)
            *(unsigned short *)0x1CFF574 = (unsigned short)sum;
    }

loc_494D19:
    mi = MonsterInfo(tgt);
    {
        unsigned short ap = (unsigned short)*(mi + 0x14F); /* 66 0F B6 movzx ax, BYTE */
        BCI_GF_AP_EARNED = (unsigned short)(BCI_GF_AP_EARNED + ap); /* 66 01 add mem, ax */
        return (__int16)ap;
    }
}
```
