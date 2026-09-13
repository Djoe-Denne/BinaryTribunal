# Status_TickAndExpire @ 0x483470

- Instr (live): 237
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=12393
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=12324
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=11151
- A==B: non
- Push IDB: oui
- SetType: void Status_TickAndExpire(void)
- Notes parent: curseur BYTE status_1 0x1D27B90 stride 0xD0 jl vs END 0x1D28140 (slots 0..6 occupancy 1+2, pas flag_data) ; skip Death|Petrify ; 14 WORD timers sentinel 0xFBA9 ; jg signe ; disable 0xFBA9 avant jnz Doom ; Doom bit10 enqueue (slot,5,0) clear bit skip slot ; Petrify bit12 OR BYTE 4 ; Shell/Protect/Reflect ; delta 2/Haste3/Slow1 ; Sleep+Stop timer[3] ; Regen idiv 60 avant sub WORD ; party cmp ebp 0x1D27E00. Pas de jpt_ ni GetRandomInt.

## C réconcilié

```c
/* Status_TickAndExpire @ 0x483470
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 237 instr, size 0x2a8. IDA type void().
 * Slot walk: ebp = BATTLE_SLOT_DATA.status_1 @ 0x1D27B90, stride 0xD0,
 * jl signed vs END_MONSTER_DATA_IN_BATTLE @ 0x1D28140 (slots 0..6, occupancy 1+2).
 * No occupancy BYTE (flag_data +0x7C). GetRandomInt absent. No jpt_.
 */

enum {
    kBattleSlotStride = 0xD0,
    kOffStatus2       = 0x08, /* DWORD @ 0x1D27B18 ; ebp-78h */
    kOffCurrentHp      = 0x18, /* DWORD @ 0x1D27B28 ; ebp-68h */
    kOffTimer0        = 0x54, /* WORD  @ 0x1D27B64 ; ebp-2Ch */
    kOffStatus1       = 0x80  /* WORD  @ 0x1D27B90 */
};

#define TIMER_SENTINEL ((unsigned short)0xFBA9) /* -1111 */

extern unsigned char BATTLE_SLOT_DATA[]; /* 0x1D27B10 */

extern void            __cdecl BattleStatus_ExpirePetrifyingToPetrify(int slot);
extern char           *__cdecl BattleText_GetCharacterName(int slot);
extern int            __cdecl getAddressMonsterName(int p_slot_id);
extern char           *__cdecl BattleText_GetMiscText(int p_text_index);
extern char           *__cdecl BattleText_PrepareBuffer(char *p_address_text, char p_text, char *a3);
extern char           *__cdecl BattleText_Print(char *s);
extern int            __cdecl Battle_SetMessagePointer(int);
extern int             sub_485420(void);
extern int            __cdecl sub_483720(char *name, char *misc_text);
extern __int16        __cdecl Battle_ComputeCrisisLevelFromHP(int p_target_slot_id, int p_current_hp, __int16 *param_pointer_status_1);
extern unsigned int   __cdecl BattleStatus_UpdateSlotStatusCopy(int slot);
extern unsigned char  *__cdecl BattleStatus_ApplyAndSyncSlot(int param_target_slot_id, unsigned __int16 param_status_1, unsigned int param_status_2);
extern unsigned short *__cdecl BattleStatus_EnqueueStatusCopyUpdate(int slot);
extern int            __cdecl pre_manageAttackerDeath(int param_slot_id);
extern void           *__cdecl Battle_EnqueueSpecialAction(int slot, __int16 special_id, int group);

void Status_TickAndExpire(void)
{
    unsigned char *status_1; /* ebp */
    int slot;                 /* edi ; also [esp+18h] target_slot_id_bis */
    int timer_index;          /* var_C */
    unsigned short *timer;   /* var_8 */
    unsigned int bit;        /* ebx = 1<<cl */
    unsigned int status2;
    int stop_bit;             /* ecx = status2 & 8 */
    int delta;                /* esi ; then name */
    short t;                 /* dx */
    char *name;
    char *text_id;
    char *text_74;
    char *text_1B;
    char *buf;
    char b0, b1;

    slot = 0;
    status_1 = BATTLE_SLOT_DATA + kOffStatus1; /* 0x1D27B90 */

    /* loc_483482: jl signed vs 0x1D28140 */
    while ((int)status_1 < 0x1D28140) {
        /* test byte ptr [ebp], 5 / jnz loc_4836F9 */
        if (status_1[0] & 5)
            goto loc_4836F9;

        timer_index = 0;
        timer = (unsigned short *)(status_1 - 0x2C); /* ebp-2Ch = slot+0x54 */

        /* loc_483499 */
        for (;;) {
            t = (__int16)*timer; /* 66 8B 10 */
            if (t == (__int16)0xFBA9) /* jz loc_4836C4 */
                goto loc_4836C4;

            bit = 1u << timer_index; /* mov ebx,1 ; shl ebx,cl */

            if (t > 0) { /* test dx,dx / jg loc_483640 */
                status2 = *(unsigned int *)(status_1 - 0x78);
                delta = 2;
                if (status2 & 2) /* Haste */
                    delta = 3;
                if (status2 & 4) /* Slow wins */
                    delta = 1;

                stop_bit = (int)(status2 & 8);
                if (stop_bit && (status2 & 1)) {
                    /* Sleep+Stop: only timer[3] keeps delta; else xor esi,esi */
                    if (timer_index != 3)
                        delta = 0;
                } else {
                    if (stop_bit && timer_index != 3)
                        delta = 0;
                    if ((status2 & 1) && timer_index != 0)
                        delta = 0;
                }

                /* loc_483689: Regen bit4 ; movsx ecx,si ; jz skip
                 * idiv signed ; movsx ebx,ax (16-bit quot) ; 60/delta ; rem==0
                 * push edx (=0) / push 6 / push edi ; add esp,0Ch
                 * ebx clobbered (quotient) — not reused on this path */
                if ((bit & 0x10) && (int)(__int16)delta != 0) {
                    int step = (int)(__int16)delta;
                    int quot = (int)(__int16)(t / step);
                    int span = 60 / step;
                    if (quot % span == 0)
                        Battle_EnqueueSpecialAction(slot, 6, 0);
                }

                /* loc_4836BD: 66 29 30  WORD sub even if delta==0 */
                *(__int16 *)timer -= (__int16)delta;
            } else {
                /* expire: 66 C7 00 A9 FB BETWEEN test bh,4 and jnz */
                *timer = TIMER_SENTINEL;

                if (bit & 0x400) { /* test bh,4 Doom timer[10] loc_4836E2 */
                    Battle_EnqueueSpecialAction(slot, 5, 0);
                    *(unsigned int *)(status_1 - 0x78) &= ~bit;
                    goto loc_4836F9; /* skip remaining timers */
                }

                if (bit & 0x1000) { /* test bh,10h Gradual Petrify timer[12] */
                    status_1[0] |= 4; /* or byte ptr [ebp], 4 */
                    BattleStatus_ExpirePetrifyingToPetrify(slot); /* add esp,4 */
                }

                /* loc_4834D7: push edi ; cmp ebp, 0x1D27E00 / jge monster */
                if ((int)status_1 < 0x1D27E00)
                    name = BattleText_GetCharacterName(slot);
                else
                    name = (char *)getAddressMonsterName(slot);
                /* add esp,4 */

                if (bit & 0x40) { /* Shell timer[6] loc_4834F6 */
                    text_id = BattleText_GetMiscText(0x4F);
                    text_74 = BattleText_GetMiscText(0x74);
                    b0 = *(char *)BattleText_GetMiscText(0x0B); /* mov al,[eax] ; push eax */
                    b1 = *(char *)BattleText_GetMiscText(0x0B); /* mov cl,[eax] ; push ecx */
                    text_1B = BattleText_GetMiscText(0x1B);
                    buf = BattleText_PrepareBuffer(name, 7, text_1B); /* add esp,10h w/ leftover 0x1B */
                    buf = BattleText_PrepareBuffer(buf, b1, text_id); /* add esp,0Ch */
                    buf = BattleText_PrepareBuffer(buf, b0, text_74);
                    Battle_SetMessagePointer((int)BattleText_Print(buf));
                    /* add esp,14h */
                    sub_485420();
                    /* mov edi, [esp+18h] */
                }

                if (bit & 0x20) { /* Protect timer[5] loc_483564 */
                    text_id = BattleText_GetMiscText(0x4E);
                    text_74 = BattleText_GetMiscText(0x74);
                    b0 = *(char *)BattleText_GetMiscText(0x0B); /* mov dl,[eax] */
                    b1 = *(char *)BattleText_GetMiscText(0x0B); /* mov al,[eax] */
                    text_1B = BattleText_GetMiscText(0x1B);
                    buf = BattleText_PrepareBuffer(name, 7, text_1B);
                    buf = BattleText_PrepareBuffer(buf, b1, text_id);
                    buf = BattleText_PrepareBuffer(buf, b0, text_74);
                    Battle_SetMessagePointer((int)BattleText_Print(buf));
                    sub_485420();
                }

                if (bit & 0x80) { /* Reflect timer[7] loc_4835D2 */
                    /* GetMiscText(0x50) leftover + 2 args ; add esp,0Ch */
                    sub_483720(name, BattleText_GetMiscText(0x50));
                }

                /* loc_4835E3 */
                *(unsigned int *)(status_1 - 0x78) &= ~bit;
                Battle_ComputeCrisisLevelFromHP(
                    slot,
                    *(int *)(status_1 - 0x68),
                    (__int16 *)status_1);
                BattleStatus_UpdateSlotStatusCopy(slot);
                /* add esp,10h (3+1) */

                if ((int)status_1 < 0x1D27E00) { /* party loc_483609 */
                    /* mov ax,[ebp] ; push edx status_2 ; push eax ; add esp,0Ch */
                    BattleStatus_ApplyAndSyncSlot(
                        slot,
                        *(unsigned __int16 *)status_1,
                        *(unsigned int *)(status_1 - 0x78));
                    BattleStatus_EnqueueStatusCopyUpdate(slot); /* add esp,4 */
                } else { /* loc_483629 */
                    pre_manageAttackerDeath(slot);
                    BattleStatus_EnqueueStatusCopyUpdate(slot);
                }
                /* jmp loc_4836C4 */
            }

        loc_4836C4:
            ++timer_index;
            ++timer; /* add eax,2 */
            if (timer_index >= 14) /* cmp ecx,0Eh / jge loc_4836F9 */
                break;
        }

    loc_4836F9:
        status_1 += kBattleSlotStride;
        ++slot;
        /* mov [esp+18h], edi */
    }
}
```
