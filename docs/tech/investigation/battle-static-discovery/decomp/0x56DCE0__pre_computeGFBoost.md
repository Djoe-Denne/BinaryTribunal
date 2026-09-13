# pre_computeGFBoost? @ 0x56DCE0

- Instr (live): 32
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=768
- A==B: non
- Push IDB: oui
- SetType: int __cdecl(char, int)
- Notes parent: stride K_GF 0x84 (cmd_arg-0x40; *33; *4). Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. 66 movzx BYTE unknown40 +0x81 puis +0x80 ; *15 lea*3*5 ; WORD 66 F4=hi F6=lo. BYTE CEF9=FF d'abord. Slot HUD 6 flags 3. add esp 18h. EAX leftover SetWidgetSlotFlags. Nom catalogue pre_computeGFBoost?.

## C réconcilié

```c
/* pre_computeGFBoost? @ 0x56DCE0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 32 instr, size 0x87, end 0x56DD67. IDA type int __cdecl(char, int).
 * Catalogue name pre_computeGFBoost? kept (C ident cannot hold « ? »).
 * K_GF_JUNCTIONABLE @ 0x1CF4DC0 stride 0x84: add -0x40; shl 5; add; lea [ecx*4].
 * unknown40 WORD +0x80: BYTE loads 66 0F B6 at +0x81 then +0x80; *15 via lea*3*5;
 * WORD stores 66 to word_209CEF4 / word_209CEF6. Occupancy 1+2 unused.
 * Slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt / jpt_ / setcc: unused.
 * add esp,18h = RegisterWidgetSlot 4 args + SetWidgetSlotFlags 2 args.
 * EAX leftover = BattleUI_SetWidgetSlotFlags. No domain::.
 */

extern unsigned char K_GF_JUNCTIONABLE[]; /* 0x1CF4DC0, stride 0x84 */
extern unsigned char byte_209CEF9;         /* BYTE C6 @ 0x209CEF9 */
extern unsigned short word_209CEF4;        /* WORD 66 89 @ 0x209CEF4 */
extern unsigned short word_209CEF6;        /* WORD 66 A3 @ 0x209CEF6 */
extern unsigned short BCI_CURRENT_GF_BOOST; /* WORD 66 A3 @ 0x209CEF0 */
extern unsigned short unk_209CEF2;          /* WORD 66 A3 @ 0x209CEF2 */
extern unsigned char byte_209CEF8;
extern unsigned char byte_209CEFB;
extern unsigned char byte_209CEFD;

void __cdecl BattleUI_RegisterWidgetSlot(
    int slot_index,
    void *update_callback,
    void *draw_callback,
    void *aux_callback);
int __cdecl BattleUI_SetWidgetSlotFlags(int slot_index, int flags);
int BattleUI_GFBoost_Update(void);
void *__cdecl sub_56E130(int, void *);

int __cdecl pre_computeGFBoost(char arg_0, int command_arg)
{
    unsigned int gf_index;
    unsigned int rec33;
    unsigned char *row;
    unsigned int hi;
    unsigned int lo;

    byte_209CEF9 = 0xFFu; /* C6 05 F9CE0902 FF ; first store */

    gf_index = (unsigned int)command_arg + 0xFFFFFFC0u; /* add eax, 0FFFFFFC0h */
    rec33 = (gf_index << 5) + gf_index;                 /* shl ecx,5; add ecx,eax */
    row = K_GF_JUNCTIONABLE + rec33 * 4;                /* lea eax, ds:1CF4DC0h[ecx*4] */

    /* 66 0F B6 0C 8D 414ECF01 : movzx cx, byte [ecx*4+0x1CF4E41] = row[0x81] */
    hi = (unsigned int)row[0x81];
    /* 66 0F B6 80 80000000   : movzx ax, byte [eax+80h] */
    lo = (unsigned int)row[0x80];

    /* lea ecx,[ecx+ecx*2]; lea edx,[ecx+ecx*4] then 66 89 15 word_209CEF4, dx */
    word_209CEF4 = (unsigned short)((hi + hi * 2) * 5);
    /* lea eax,[eax+eax*2]; lea eax,[eax+eax*4] then 66 A3 word_209CEF6 */
    word_209CEF6 = (unsigned short)((lo + lo * 2) * 5);

    /* xor eax,eax ; 66 A3 / 88 / A2. byte_209CEFA / byte_209CEFC not written. */
    BCI_CURRENT_GF_BOOST = 0;
    unk_209CEF2 = 0;
    byte_209CEF8 = (unsigned char)arg_0; /* mov cl,[esp+arg_0] before *15 eax lea */
    byte_209CEFB = 0;
    byte_209CEFD = 0;

    BattleUI_RegisterWidgetSlot(6, BattleUI_GFBoost_Update, sub_56E130, 0);
    return BattleUI_SetWidgetSlotFlags(6, 3);
}
```
