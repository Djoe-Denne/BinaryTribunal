# BattleCommandMenu_OpenSelectedCommand @ 0x4BC770

- Instr (live): 240
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9301
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=4382
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=7816
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleCommandMenu_OpenSelectedCommand(int, unsigned __int8 *)
- Notes parent: rebase [esi+8] si +1Ah et flags bit2. Reject flags&2 ou id==0 (sound 5, EAX=0). jpt_4BC8D3 9 cases, ja unsigned vs 8. Opens via movsx [esi+14h] (pas le ptr). Case 0 mode 1/2/3 pour id 0x24/0x25. Case 3 Draw BYTE aux puis DWORD reload. Pending 0xC @ 1D76720, WORD 66 +2/+8, var_4=2. Bit scan trouvé = c<<c (pas 1<<c). 4A9850 seulement si aux&0x80. Occupancy/GetRandomInt absents. EAX 0/1/2.

## C réconcilié

```c
/* BattleCommandMenu_OpenSelectedCommand @ 0x4BC770
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes + jpt_4BC8D3.
 * 240 instr, size 0x2E5, end 0x4BCA55. IDA type int __cdecl(int, unsigned __int8 *).
 * No domain::. Occupancy 1+2 unused. GetRandomInt absent.
 * Slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Pending stride 0xC @ 0x1D76720 from lea [edx+edx*2] then [ecx*4].
 * jpt_4BC8D3 @ 0x4BCA58 (9 dwords). cmp ebp,8 ; ja unsigned (not jg).
 * Found-bit mask is ecx<<cl (c<<c), not 1<<c. jl signed vs 7.
 */

extern int __cdecl BattleUI_SetWidgetSlotFlags(int slot_index, int flags);
extern short __cdecl sub_4A9850(int flags_bit0);
extern int __cdecl sub_4AAE60(char aux, char unused_ffff);
extern int __cdecl sub_4A9D70(int aux, int mask, int sel, int val);
extern short __cdecl sub_4A9DD0(void);
extern int __cdecl sub_4C8840(int slot, int a2, int a3, char mode, void *fn);
extern int __cdecl sub_4C87A0(int slot, int a2, int a3, void *fn);
extern int __cdecl sub_4C8550(int slot, int a2, int a3, void *fn);
extern int __cdecl sub_4C8280(int slot, int a2, int a3, void *fn);
extern char __cdecl BattleDrawMenu_Open(char slot, char cmd_id, char aux, char flags);
extern int __cdecl sub_4C81C0(int slot, char cmd_id, int a3, int b, void *fn);
extern int __cdecl sub_4C81F0(int slot, char cmd_id, int a3, int b, void *fn);
extern int __cdecl sub_4C8220(int slot, char cmd_id, int a3, int b, void *fn);
extern int __cdecl sub_4C8190(int slot, char cmd_id, int a3, int b, void *fn);
extern int __cdecl sub_4C7920(int slot, char cmd_id);
extern char __cdecl sub_4C7030(char slot, char cmd_id, char kind, char flag);
extern char *__cdecl BattleUI_PlaySystemSoundUnlessFlag2(int sound);

extern void sub_4C8820(void);
extern char *BattleItemMenu_GetWorkingInventory(void);
extern char *sub_4C8250(int);
extern char *sub_4C7CD0(int);

extern int BATTLE_MENU_PENDING_CMD_COUNT; /* signed __int32 @ 0x1D76718 */

int __cdecl BattleCommandMenu_OpenSelectedCommand(int slot_ctx, unsigned char *cmd)
{
    int result; /* var_4 */
    unsigned char *slot;
    unsigned char *rec;
    unsigned char flags;
    unsigned char command_id;
    unsigned char kind;
    unsigned char aux;
    int slot_sx;
    unsigned char nz;
    unsigned short sel;
    unsigned int mask;
    int c;
    unsigned short v_ae60;
    unsigned short v_9d70;
    unsigned short v_9dd0;
    int count;
    unsigned char *entry;
    int mode;

    result = 0;
    slot = (unsigned char *)slot_ctx;
    rec = cmd;

    if (slot[0x1A] != 0 && (rec[3] & 4) != 0) {
        rec = *(unsigned char **)(slot + 8); /* DWORD [esi+8] */
        slot[0x1A] = 0x40;                   /* BYTE */
        cmd = rec;                           /* stack arg_4 overwritten */
    } else {
        slot[0x1A] = 0; /* BYTE */
    }

    BattleUI_SetWidgetSlotFlags(4, 2);
    BattleUI_SetWidgetSlotFlags(3, 2); /* add esp, 10h */

    flags = rec[3];
    if ((flags & 2) != 0)
        goto reject;
    command_id = rec[0];
    if (command_id == 0)
        goto reject;

    kind = rec[1];
    aux = rec[2];
    slot_sx = (int)(signed char)slot[0x14]; /* movsx [esi+14h] */

    if ((kind & 0x20) == 0) {
        /* ebp = kind & 0x1F ; cmp ebp,8 ; ja def_4BC8D3 */
        switch (kind & 0x1F) {
        case 0: /* loc_4BC8DA */
            mode = 1;
            if (command_id == 0x24)
                mode = 2;
            else if (command_id == 0x25)
                mode = 3;
            sub_4C8840(slot_sx, 1, 0x20, (char)mode, (void *)sub_4C8820);
            break; /* add esp, 14h -> loc_4BCA28 */
        case 1: /* loc_4BC93F */
            sub_4C8280(slot_sx, 3, 0x10, (void *)sub_4C8250);
            break; /* loc_4BCA25 add esp, 10h */
        case 2: /* loc_4BC914 cmp al, 24h */
            if (command_id == 0x24)
                sub_4C87A0(slot_sx, 2, 0x20, (void *)BattleItemMenu_GetWorkingInventory);
            else
                sub_4C8550(slot_sx, 2, 0x20, (void *)BattleItemMenu_GetWorkingInventory);
            break;
        case 3: /* loc_4BC957 Draw. BYTE store aux into arg_0, DWORD reload; callee char */
            BattleDrawMenu_Open((char)slot_sx, (char)command_id, (char)aux, (char)flags);
            break;
        case 4: /* loc_4BC9B9 Item family */
            sub_4C8220(slot_sx, (char)command_id, 4, (int)slot[0x2A], (void *)sub_4C7CD0);
            break; /* add esp, 14h */
        case 5: /* loc_4BC9FD */
            sub_4C7920(slot_sx, (char)command_id);
            break; /* add esp, 8 */
        case 6: /* loc_4BC972 */
            sub_4C81C0(slot_sx, (char)command_id, 4, (int)slot[0x2A], (void *)sub_4C7CD0);
            break;
        case 7: /* loc_4BC9DB */
            sub_4C8190(slot_sx, (char)command_id, 4, (int)slot[0x2A], (void *)sub_4C7CD0);
            break;
        case 8: /* loc_4BC997 */
            sub_4C81F0(slot_sx, (char)command_id, 4, (int)slot[0x2A], (void *)sub_4C7CD0);
            break;
        default: /* def_4BC8D3 cases 9..31 */
            sub_4C7030((char)slot_sx, (char)command_id, (char)kind, 0);
            break;
        }
    } else {
        /* loc_4BC7F6: setnz cl from [esi+1Ah] AFTER 0 / 0x40 store */
        nz = (unsigned char)(slot[0x1A] != 0);
        if ((aux & 0x80) == 0) {
            /* loc_4BC8B8: 4A9850 NOT called */
            sub_4C7030((char)slot_sx, (char)command_id, (char)kind, (char)nz);
        } else {
            sel = (unsigned short)sub_4A9850(flags & 1); /* mov di, ax ; and edi, 0FFFFh */
            if ((aux & 0x40) != 0) {
                mask = 8;
                for (c = 3; c < 7; c++) { /* cmp ecx,7 ; jl signed */
                    if (sel & (1u << c)) {
                        mask = (unsigned int)c << c; /* mov ebp,ecx ; shl ebp,cl */
                        break;
                    }
                }
            } else {
                mask = 1u << slot[0x14]; /* mov cl,[esi+14h] ; ebp=1 ; shl ebp,cl */
            }
            v_ae60 = (unsigned short)(sub_4AAE60((char)aux, (char)0xFFFF) & 0xFFFF);
            v_9d70 = (unsigned short)sub_4A9D70((int)aux, (int)mask, (int)sel, (int)v_ae60);
            v_9dd0 = (unsigned short)sub_4A9DD0();
            count = BATTLE_MENU_PENDING_CMD_COUNT;
            BATTLE_MENU_PENDING_CMD_COUNT = count + 1;
            entry = (unsigned char *)(0x1D76720 + count * 12);
            entry[0] = cmd[0]; /* BYTE from rebased arg_4 */
            entry[1] = 0;      /* BYTE */
            *(unsigned short *)(entry + 2) = v_9d70; /* WORD 66 */
            *(unsigned int *)(entry + 4) = 0;        /* DWORD */
            *(unsigned short *)(entry + 8) = v_9dd0; /* WORD 66 */
            result = 2;
        }
    }

    BattleUI_PlaySystemSoundUnlessFlag2(2);
    if (result != 0)
        return result;
    return 1;

reject:
    BattleUI_PlaySystemSoundUnlessFlag2(5);
    return 0;
}
```
