# BattleTarget_FindByCondition @ 0x483940

- Instr (live): 245
- Palier: low (budget) / GLM: high + max_tokens=65536 (consigne >=200)
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9209
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=8203
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=8512
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleTarget_FindByCondition(int slot_index, int *out_section, int *out_arg, __int16 *out_target_mask)
- Notes parent: jpt_4839BA + byte_483C50 live (handlers 1/12, 2, 4 ; ja unsigned) ; F_CHAR 0x1D0 command bytes +0x1E stride 4 ; pas de walk 0xD0 ni occupancy 1+2 ; *mask WORD / *arg DWORD ; BATTLE_SEAL bit1 magic / bit0 item ; retry (esi+1)&3 infini ; Confuse via EnemyAI_PrepareTurnAction (status_2 0x4000).

## C réconcilié

```c
/* BattleTarget_FindByCondition @ 0x483940
 * Ground truth = live ASM (asm_clean.asm) + jpt_dump.txt, not Hex-Rays.
 * 245 instr, size 0x2FE. cdecl. EAX = selected command byte (also *out_section).
 * No BATTLE_SLOT 0xD0 walk, no occupancy 1+2, no setcc.
 */

extern unsigned char  Battle_GetRandomInt(void);
extern unsigned short BattleTarget_GetRandomPartyMask(void);
extern unsigned short BattleTarget_GetRandomMonsterMask(void);
extern unsigned short BattleTarget_GetEveryoneMask(void);
extern unsigned short BattleTarget_GetAllEnemyMask(void);
extern unsigned short BattleTarget_GetAllPartyMask(void);
extern int             sub_483C60(int slot, int cmd_byte); /* 0 if F_CHAR[+0x1E] 4-slot scan hits cmd, else 0xFF */
extern int             EnemyAI_SelectRandomMagicFromPlayer(int player_slot, int preset_magic_id);
extern unsigned short sub_483D20(char target_info); /* inverted 0x30/0x40 side mask; 0x30 leaves EAX=0x30 */
extern int             sub_483CA0(int preset); /* preset!=0 passthrough; 0 = random EQUAL_ITEM_ID or 0xFF */
extern int             BattleEqualItemBuffer_AdjustCount(int id, int remove_one);
extern unsigned short BattleTarget_ComputeMaskFromDefaultTarget(unsigned char target_info);

extern unsigned char byte_1CFF01E[]; /* F_CHAR_DATA@0x1CFF000 + 0x1E; 4 command bytes, stride 4; char stride 0x1D0 */
extern unsigned char K_MAGIC[];      /* stride 0x3C; defaultTarget at +0x0A */
extern unsigned char K_ITEM[];       /* stride 0x18; targetInfo at +0x09 */
extern unsigned char BATTLE_SEAL;   /* BYTE @ 0x1CFF6E8; bit1 magic seal, bit0 item seal */

int __cdecl BattleTarget_FindByCondition(int slot_index, int *out_section, int *out_arg, __int16 *out_target_mask)
{
    int cmd_base; /* var_4: slot*0x74 */
    int cmd_slot; /* var_8/esi: first RNG signed%4, then (esi+1)&3 on retry */
    int result;   /* EAX at loc_483C1B */
    unsigned char bl;

    /* and eax,0FFh; and esi,80000003h; jns; dec/or -4/inc → signed %4 of 0..255 */
    cmd_slot = (Battle_GetRandomInt() & 0xFF) % 4;
    /* lea ecx,[slot*8]; sub ecx,slot; lea ebp,[slot+ecx*4]; shl ebp,2 */
    cmd_base = slot_index * 0x74;

    for (;;) { /* loc_48397F */
        unsigned char action;
        unsigned char info;
        unsigned int flags;
        unsigned int side; /* spill: written only on 0x30 in {0,0x10,0x20} */

        bl = (unsigned char)((Battle_GetRandomInt() & 0xFF) % 3); /* cdq; idiv 3; mov bl,dl */
        *out_arg = 0; /* mov dword ptr [edi], 0 */
        /* add ebp,esi; mov dl, byte_1CFF01E[ebp*4]; mov ebp,edx */
        action = byte_1CFF01E[(cmd_base + cmd_slot) * 4];

        result = 0;
        /* lea eax,[action-1]; cmp eax,0Bh; ja def_4839BA (UNSIGNED)
         * cl = byte_483C50[eax]; jmp jpt_4839BA[ecx*4]
         * index 00 01 03 02 03 03 03 03 03 03 03 00 → handlers 1/12, 2, 4 only */
        switch (action) {
        case 1:
        case 12: /* loc_4839C1 */
            if (bl != 0)
                *out_target_mask = (__int16)BattleTarget_GetRandomPartyMask();
            else
                *out_target_mask = (__int16)BattleTarget_GetRandomMonsterMask();
            result = action;
            break;

        case 2: { /* loc_4839EB magic */
            int preset;
            int magic;

            if (BATTLE_SEAL & 2) /* test BYTE, 2 / jz loc_4839FB */
                preset = 0xFF;
            else
                preset = sub_483C60(slot_index, 2); /* add esp,8 */
            magic = EnemyAI_SelectRandomMagicFromPlayer(slot_index, preset); /* add esp,8 */
            *out_arg = magic; /* DWORD */
            if (magic == 0xFF)
                break; /* jz def_4839BA */

            info = K_MAGIC[magic * 0x3C + 0x0A]; /* defaultTarget */
            if (bl != 0) {
                flags = 0;
                if (info & 1)
                    flags = 0x4000;
                if (info & 2)
                    flags |= 0x2000;
                /* push info; sub_483D20; add esp,4; or eax,flags; WORD AX; esi restored from var_8 */
                *out_target_mask = (__int16)(sub_483D20((char)info) | flags);
            } else {
                /* (info&0x30): 0x20 Everyone; 0x10 +bit6 RandomMonster else RandomParty;
                 * 0 +bit6 AllEnemy else AllParty; else skip helper (spill = out_arg STACK slot, not *out_arg) */
                switch (info & 0x30) {
                case 0x20:
                    side = BattleTarget_GetEveryoneMask();
                    break;
                case 0x10:
                    side = (info & 0x40) ? BattleTarget_GetRandomMonsterMask()
                                         : BattleTarget_GetRandomPartyMask();
                    break;
                case 0x00:
                    side = (info & 0x40) ? BattleTarget_GetAllEnemyMask()
                                         : BattleTarget_GetAllPartyMask();
                    break;
                default:
                    break; /* 0x30: no store to spill */
                }
                /* reload defaultTarget from *out_arg (magic id still in [edi]); or ch,20h */
                info = K_MAGIC[(unsigned)*out_arg * 0x3C + 0x0A];
                flags = 0;
                if (info & 1)
                    flags = 0x4000;
                if (info & 2)
                    flags |= 0x2000;
                *out_target_mask = (__int16)(flags | side); /* WORD CX */
            }
            result = action;
            break;
        }

        case 4: { /* loc_483AE6 item */
            int preset;
            int id;

            if (BATTLE_SEAL & 1)
                preset = 0xFF;
            else
                preset = sub_483C60(slot_index, 4); /* add esp,8 */
            id = sub_483CA0(preset); /* add esp,4 */
            *out_arg = id;
            if (id == 0xFF)
                break; /* jz def_4839BA */

            BattleEqualItemBuffer_AdjustCount(id, 1); /* push 1; push id; add esp,8 */
            id = *out_arg;
            info = K_ITEM[id * 0x18 + 0x09]; /* targetInfo; lea [id+id*2] then [edx*8] */

            if (bl != 0) {
                /* 0x30 decode INVERTED vs magic-bl==0 / item-bl==0 */
                switch (info & 0x30) {
                case 0x20:
                    side = BattleTarget_GetEveryoneMask();
                    break;
                case 0x10:
                    side = (info & 0x40) ? BattleTarget_GetRandomPartyMask()
                                         : BattleTarget_GetRandomMonsterMask();
                    break;
                case 0x00:
                    side = (info & 0x40) ? BattleTarget_GetAllPartyMask()
                                         : BattleTarget_GetAllEnemyMask();
                    break;
                default:
                    break; /* var_10 leftover */
                }
                info = K_ITEM[(unsigned)*out_arg * 0x18 + 0x09];
                flags = 0;
                if (info & 1)
                    flags = 0x4000;
                if (info & 2)
                    flags |= 0x2000; /* or ch,20h */
                *out_target_mask = (__int16)(flags | side); /* WORD CX */
            } else {
                switch (info & 0x30) {
                case 0x20:
                    side = BattleTarget_GetEveryoneMask();
                    break;
                case 0x10:
                    side = (info & 0x40) ? BattleTarget_GetRandomMonsterMask()
                                         : BattleTarget_GetRandomPartyMask();
                    break;
                case 0x00:
                    side = (info & 0x40) ? BattleTarget_GetAllEnemyMask()
                                         : BattleTarget_GetAllPartyMask();
                    break;
                default:
                    break; /* var_C leftover */
                }
                /* push targetInfo; ComputeMaskFromDefaultTarget; add esp,4; or eax,var_C; WORD AX */
                *out_target_mask = (__int16)(BattleTarget_ComputeMaskFromDefaultTarget(info) | side);
            }
            result = action;
            break;
        }

        default: /* def_4839BA: action 0, 3, 5-11, >12 */
            result = 0;
            break;
        }

        /* loc_483C1B: mov [out_section], eax; test eax,eax; jnz epilogue */
        *out_section = result;
        if (result != 0)
            return result;
        /* inc esi; and esi,3; ebp = var_4; jmp loc_48397F — can loop forever */
        cmd_slot = (cmd_slot + 1) & 3;
    }
}

```
