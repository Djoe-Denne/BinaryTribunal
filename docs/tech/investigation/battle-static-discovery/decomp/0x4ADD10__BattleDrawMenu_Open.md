# BattleDrawMenu_Open @ 0x4ADD10

- Instr (live): 32
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=25
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=17
- A==B: non
- Push IDB: oui
- SetType: char __cdecl BattleDrawMenu_Open(char, char, char, char)
- Notes parent: 4 args BYTE. Widget slot imm 2 (pas arg_0). RegisterWidgetSlot add esp,10h. WORD 66 sur 1D768F0/+2 et 1D76900. DWORD seulement 1D768D0. [dword_1D6D490+0x2B]=0xFF et +0x2D=2. Retour EAX = StateMachine. Occupancy/GetRandomInt/slot 0xD0/F_CHAR absents. CharaSlotPtr+1 et 1D768E8+0 non écrits.

## C réconcilié

```c
/* BattleDrawMenu_Open @ 0x4ADD10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 32 instr, size 0x97, end 0x4ADDA7. IDA type char __cdecl(char, char, char, char).
 * No domain::. Occupancy 1+2 unused. GetRandomInt absent.
 * Slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 unused.
 * Unique caller BattleCommandMenu_OpenSelectedCommand case 3 @ 0x4BC968;
 * cleanup add esp,10h at loc_4BCA25.
 * Widget slot_index is immediate 2, not arg_0.
 * Return EAX = BattleDrawMenu_StateMachine() (no mov eax before retn).
 */

extern void __cdecl BattleUI_RegisterWidgetSlot(int slot_index, void *update_callback, void *draw_callback, void *aux_callback);
extern char BattleDrawMenu_StateMachine(void);
extern void sub_4AAFD0(void);
extern void sub_4AF4F0(void);

char __cdecl BattleDrawMenu_Open(char slot, char command_id, char aux_byte, char flags)
{
    unsigned char *p;
    unsigned char *chara;
    unsigned char *cmd;
    unsigned char *st;

    chara = (unsigned char *)&g_BattleSubmenu_CharaSlotPtr; /* 0x1D768D4 */
    cmd = (unsigned char *)&dword_1D768D8;                 /* 0x1D768D8 */
    st = (unsigned char *)&dword_1D768E8;                  /* 0x1D768E8 */

    chara[2] = (unsigned char)aux_byte; /* A2 D6 68 D7 01 BYTE */
    cmd[2] = (unsigned char)command_id; /* A2 DA 68 D7 01 BYTE */

    p = (unsigned char *)dword_1D6D490; /* A1 90 D4 D6 01, live across xor ebx / pushes */

    p[0x2B] = 0xFFu;                     /* C6 40 2B FF BYTE */
    chara[3] = (unsigned char)flags;      /* 88 0D D7 68 D7 01 BYTE */
    chara[0] = (unsigned char)slot;       /* 88 15 D4 68 D7 01 BYTE */
    *(unsigned short *)&dword_1D768F0 = 0;                       /* 66 89 1D WORD +0 */
    *(unsigned short *)((char *)&dword_1D768F0 + 2) = 0;         /* 66 89 1D WORD +2 */
    dword_1D768D0 = 0;                   /* 89 1D DWORD */
    cmd[3] = 0xFFu;                      /* C6 05 DB 68 D7 01 FF BYTE */
    st[1] = 1;                           /* C6 05 E9 68 D7 01 01 BYTE */
    p[0x2D] = 2;                         /* C6 40 2D 02 BYTE */
    st[2] = 0;                          /* 88 1D EA 68 D7 01 BYTE */
    st[3] = 0;                          /* 88 1D EB 68 D7 01 BYTE */
    byte_1D768ED = 0;                    /* 88 1D ED 68 D7 01 BYTE */
    byte_1D768EE = 0;                    /* 88 1D EE 68 D7 01 BYTE */
    /* chara[1] and st[0] / 0x1D768EC not written */

    BattleUI_RegisterWidgetSlot(
        2,
        BattleDrawMenu_StateMachine,
        sub_4AF4F0,
        sub_4AAFD0); /* add esp,10h */

    word_1D76900 = 0; /* 66 89 1D WORD after Register, before StateMachine */
    return BattleDrawMenu_StateMachine();
}
```
