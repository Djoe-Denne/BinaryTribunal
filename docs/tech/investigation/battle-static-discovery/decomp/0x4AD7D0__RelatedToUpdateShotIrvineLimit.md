# RelatedToUpdateShotIrvineLimit @ 0x4AD7D0

- Instr (live): 60
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1152
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=180
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1434
- A==B: non
- Push IDB: oui
- SetType: char __cdecl RelatedToUpdateShotIrvineLimit(__int16, int)
- Notes parent: Init UI Shot (pas un tick). arg0 WORD, arg4 DWORD `shl 2` → deux WORD durée @ 1D76750/+2. 5D=BL avant neg; 5F=0x50/0x40; 60=0x80 avant 5F. 15 pushes, add esp,3Ch, puis update_callback 0 arg. ESI=1D6D490 avant Register, restore après tick. Occupancy/GetRandomInt/slot/F_CHAR absents. add eax,3AEh mort.

## C réconcilié

```c
/* RelatedToUpdateShotIrvineLimit @ 0x4AD7D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 60 instr, size 0xFE, end 0x4AD8CE. No domain::.
 * Unique caller RelatedToShotIrvineLimit @ 0x48D1E4: 2 pushes + add esp,8.
 * arg0 WORD (66 8B), arg4 DWORD (8B 44 24 08) then shl eax,2.
 * Occupancy 1+2 unused. GetRandomInt absent. Slot 0xD0 / F_CHAR 0x1D0 unused.
 * 15 cdecl pushes, one add esp,3Ch, then update_callback() with 0 args.
 * Return EAX leftover from update_callback. No Hex-Rays.
 */

unsigned int __cdecl sub_4AAF50(char, unsigned __int16, char);
char *__cdecl AddBase_1A78C88(int);
char __cdecl sub_4BA4A0(char);
char __cdecl sub_4BA4B0(char);
void __cdecl BattleUI_RegisterWidgetSlot(int slot_index, void *update_callback, void *draw_callback, void *aux_callback);
int __cdecl BattleUI_SetWidgetSlotFlags(int, int);
char update_callback(void);

char __cdecl RelatedToUpdateShotIrvineLimit(__int16 arg0, int arg4)
{
    unsigned int eax;
    unsigned short bx;
    unsigned char bl;
    unsigned char cl;
    unsigned char *base;
    unsigned int saved_hud;
    char result;

    eax = (unsigned int)arg4;
    eax <<= 2; /* C1 E0 02 */
    bx = (unsigned short)arg0; /* 66 8B 5C 24 08 */
    *(unsigned short *)&dword_1D76750 = (unsigned short)eax; /* 66 A3 @ 0x1D76750 */
    *(unsigned short *)((char *)&dword_1D76750 + 2) = (unsigned short)eax; /* 66 A3 @ 0x1D76752 */

    eax = *((unsigned char *)&dword_1D750BC + 2) & 0xF8u; /* A0 @ 0x1D750BE ; 25 F8 00 00 00 */

    byte_1D7675A = 0;
    byte_1D7675B = 0;
    byte_1D7675C = 1;
    byte_1D7675D = (unsigned char)bx; /* 88 1D, before neg bx */

    eax = sub_4AAF50(0x40, 1, (char)eax); /* push eax; push 1; push 40h */
    word_1D76756 = (unsigned short)eax; /* 66 A3 after the call */

    base = (unsigned char *)AddBase_1A78C88(0);
    cl = base[0x3BB];
    byte_1D7675E = cl;

    base = (unsigned char *)AddBase_1A78C88(0);
    base[0x3BB] = 0xFFu; /* C6 80 BB 03 00 00 FF */

    /* 66 F7 DB / 1A DB / 80 E3 F0 / 80 C3 50 */
    if (bx == 0)
        bl = 0x50;
    else
        bl = 0x40;

    byte_1D76760 = 0x80; /* C6 05 before 5F */
    byte_1D7675F = bl;
    byte_1D76761 = 0;
    byte_1D76762 = 4;

    base = (unsigned char *)AddBase_1A78C88(0);
    base[0x3AF] |= 0x18u; /* 80 88 AF 03 00 00 18 */
    /* 05 AE 03 00 00 add eax,3AEh is dead; EAX clobbered by sub_4BA4A0 */

    sub_4BA4A0(1);
    sub_4BA4B0(1);

    saved_hud = dword_1D6D490; /* 8B 35 before Register */
    BattleUI_RegisterWidgetSlot(6, (void *)update_callback, (void *)sub_4ADBF0, (void *)sub_4AAFD0);
    BattleUI_SetWidgetSlotFlags(6, 3);

    base = (unsigned char *)AddBase_1A78C88(0);
    dword_1D6D490 = (unsigned int)(base + 0x390); /* 05 90 03 00 00 then A3 */
    result = update_callback(); /* 0 args, after add esp,3Ch */
    dword_1D6D490 = saved_hud;
    return result;
}
```
