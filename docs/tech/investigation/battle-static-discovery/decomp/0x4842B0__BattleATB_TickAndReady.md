# BattleATB_TickAndReady @ 0x4842B0

- Instr (live): 142
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5171 (retry high/65536 after length/empty rt=7586)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2949
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=4466 (retry high/65536 after length/empty rt=6588)
- A==B: non
- Push IDB: oui
- SetType: char BattleATB_TickAndReady(void)
- Notes parent: present=`flag_data&1` (pas occupancy 1+2) ; Death skip UI `loc_484460` ; Sleep|Stop/Petrify `loc_48444D` ; `jg` signé max vs cur ; mask immédiat `0x02004000` ; `or ch,2` puis `|=8` si `flag_data&10h` sans enqueue ; charge WORD 2/3/1 ; slots 0..6 stride `0xD0` ; F_CHAR `0x1D0` ; GetRandomInt absent ; tail-jmp escape. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleATB_TickAndReady @ 0x4842B0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 142 instr, size 0x1db. IDA type char() — AL = byte_1D280C3 or CAN_BATTLE_BE_PAUSED
 * or tail-jmp BattleEscape_PollInputAndRollChance.
 * GetRandomInt absent. Occupancy 1+2 absent (present = flag_data bit0).
 */

typedef int BOOL;

extern unsigned char  byte_1D280C3;                 /* 0x1D280C3 */
extern unsigned char  BATTLE_ACTION_TAKING_PLACE_;  /* 0x1D28DEB BYTE */
extern unsigned char  AI_BATTLE_ACTIVE_FLAG;        /* 0x1D280C2 */
extern unsigned int   dword_1D27B00;                /* 0x1D27B00 action-execution lock */
extern unsigned char  CAN_BATTLE_BE_PAUSED;         /* 0x1D28DEA */
extern unsigned char  K_MISC_atb_speed_multiplier;  /* K_MISC+0x0E @ 0x1CF8B22 */
extern unsigned char  BATTLE_SLOT_DATA[];           /* 0x1D27B10 stride 0xD0 */
extern unsigned short F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER[]; /* 0x1CFF014 stride 0x1D0 */
extern unsigned char  BCI_GF_XP_EARNED[];           /* 0x1CFF580; loop end +4 */
extern unsigned int   BATTLE_ATB_UI_MIRROR[];       /* 0x1CFF180 stride 0x1D0 DWORDs */
extern unsigned int   dword_1D280D4;                /* 0x1D280D4 = slot[7].cur_atb exclusive */

extern BOOL sub_4A9450(void); /* 0x4A9450 BOOL() */
extern int __cdecl BattleUI_EnqueueCommand(int param_slot_id, __int16 a2, char a3, int a4); /* add esp,10h */
extern int *__cdecl Battle_ProcessAutoCommand(int attacker_slot); /* add esp,4 */
extern char __cdecl BattleEscape_PollInputAndRollChance(void); /* tail jmp 0x486130 */

char BattleATB_TickAndReady(void)
{
    unsigned char *gfd;     /* flag_data BYTE* walking DWORD loads, stride 0xD0 */
    unsigned short *gt;     /* GF charge WORD, stride 0x1D0 */
    unsigned char *curp;    /* &slot.cur_atb, stride 0xD0 */
    unsigned char *uip;     /* ATB UI mirror, stride 0x1D0 */
    int slot;

    /* a0 c3 80 d2 01 ; 84 c0 ; 0f 85 cd 01 00 00 */
    if (byte_1D280C3)
        return (char)byte_1D280C3;

    BATTLE_ACTION_TAKING_PLACE_ = 0;
    if (!AI_BATTLE_ACTIVE_FLAG)
        goto loc_48447C;
    if (!sub_4A9450())
        goto loc_48447C;
    if (dword_1D27B00)
        goto loc_48447C;

    /* push ebp/esi/edi ; C6 ... 01 */
    BATTLE_ACTION_TAKING_PLACE_ = 1;

    /* GF charge: 3 party F_CHAR, end BCI_GF_XP_EARNED+4 @ 0x1CFF584, jl signed */
    gfd = BATTLE_SLOT_DATA + 0x7C;
    gt = F_CHAR_ACTIVE_SUMMON_CHARGE_TIMER;
    do {
        unsigned int t;
        unsigned int f;
        int dec;

        /* 8B 07 ; F6 C4 04  test ah,4  => flag_data DWORD bit 0x400 */
        if (!(*(unsigned int *)gfd & 0x400)) {
            t = *gt; /* xor eax,eax ; 66 8B 01  WORD zero-extend */
            if (t) {
                f = *(unsigned int *)((unsigned char *)gt + 0x174);
                dec = 2;
                if (f & 2)
                    dec = 3;
                if (f & 4)
                    dec = 1; /* Slow overrides Haste */
                t -= (unsigned int)dec; /* sub eax,esi ; jns */
                if ((int)t < 0)
                    t = 0;
                *gt = (unsigned short)t; /* 66 89 01 WORD */
            }
        }
        gt = (unsigned short *)((unsigned char *)gt + 0x1D0);
        gfd += 0xD0;
    } while ((int)(intptr_t)gt < (int)(intptr_t)(BCI_GF_XP_EARNED + 4));

    slot = 0; /* xor edi,edi */
    uip = (unsigned char *)BATTLE_ATB_UI_MIRROR;
    curp = BATTLE_SLOT_DATA + 0x14; /* BATTLE_SLOT_DATA.cur_atb */
    do {
        unsigned int *fd_d = (unsigned int *)(curp + 0x68); /* DWORD at flag_data +0x7C */
        unsigned short st1;
        unsigned int st2;
        unsigned int v;
        unsigned int maxv;
        unsigned int base;
        unsigned int spd;
        unsigned int mult;
        int inc;

        /* F6 46 68 01  present: flag_data bit0 BYTE. Not occupancy 1+2. */
        if (!(*(curp + 0x68) & 1))
            goto loc_484460;
        st1 = *(unsigned short *)(curp + 0x6C); /* 66 8B 46 6C status_1 +0x80 */
        if (st1 & 1) /* Death */
            goto loc_484460;
        if (*(curp + 0x68) & 0x80) /* flag_data bit7 */
            goto loc_484460;

        /* F6 46 F4 09  Sleep|Stop status_2 bits 0+3 — skip increment+ready, still UI */
        if (*(curp - 0x0C) & 9)
            goto loc_48444D;
        if (st1 & 4) /* Petrify status_1 bit2 */
            goto loc_48444D;

        st2 = *(unsigned int *)(curp - 0x0C); /* 8B 4E F4 */
        base = 10;
        if (st2 & 2)
            base = 15; /* Haste */
        if (st2 & 4)
            base = 5; /* Slow wins */
        spd = curp[0xAD]; /* +0xC1 BYTE */
        mult = K_MISC_atb_speed_multiplier;
        /* 51EB851Fh imul ; sar edx,5 ; shr eax,1Fh ; add edx,eax => signed /100 */
        inc = (int)((spd + 30) * mult * base) / 100;
        v = *(unsigned int *)curp + (unsigned int)inc;
        *(unsigned int *)curp = v; /* DWORD cur_atb */

        maxv = *(unsigned int *)(curp - 4);
        if ((int)maxv > (int)v) /* 3B D0 ; 7F jg SIGNED */
            goto loc_48444D;
        *(unsigned int *)curp = maxv; /* clamp */

        st1 = *(unsigned short *)(curp + 0x6C); /* 66 8B 4E 6C */
        if (st1 & 4)
            goto loc_48444D;
        st2 = *(unsigned int *)(curp - 0x0C);
        if (st2 & 9)
            goto loc_48444D;
        if (*(curp + 0x68) & 0x0C) /* already auto 4 or menu 8, BYTE */
            goto loc_48444D;

        if (st1 & 0x20) /* Berserk */
            goto loc_48443C;
        if (st2 & 0x02004000) /* Confuse|Angel Wing IMMEDIATE, not a pointer */
            goto loc_48443C;

        if (*(curp + 0x68) & 0x10) {
            /* flag_data & 0x10: menu-ready without enqueue; or ch,2 then |= 8 */
            *fd_d = *fd_d | 0x200;
            *fd_d = *fd_d | 8;
            goto loc_48444D;
        }

        /* loc_48441F: push 0 ; 80h ; 11h ; edi ; add esp,10h */
        BattleUI_EnqueueCommand(slot, 17, (char)0x80, 0);
        *fd_d = *fd_d | 8;
        goto loc_48444D;

loc_48443C:
        Battle_ProcessAutoCommand(slot); /* add esp,4 */
        *fd_d = *fd_d | 4; /* or al,4 DWORD store */

loc_48444D:
        /* cmp esi, cur_atb+270h ; 7D jge signed. 0x270/0xD0 = 3 party slots */
        if ((int)(intptr_t)curp >= (int)(intptr_t)(BATTLE_SLOT_DATA + 0x14 + 0x270))
            goto loc_484460;
        *(unsigned int *)(uip + 4) = *(unsigned int *)curp;
        *(unsigned int *)uip = *(unsigned int *)(curp - 4);

loc_484460:
        curp += 0xD0;
        ++slot;
        uip += 0x1D0;
    } while ((int)(intptr_t)curp < (int)(intptr_t)&dword_1D280D4); /* jl signed, slots 0..6 */

    /* pop edi/esi/ebp */
loc_48447C:
    if (!CAN_BATTLE_BE_PAUSED)
        return (char)CAN_BATTLE_BE_PAUSED;
    return BattleEscape_PollInputAndRollChance(); /* E9 tail jmp, not call */
}
```
