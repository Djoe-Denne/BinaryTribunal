# Input_ProcessInput @ 0x467D10

- Instr (live): 334
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3198
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5093
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2557
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Input_ProcessInput()
- Notes parent: 2 slots stride 0x70, 3 banks x 32; mouse idiv (0Bh-scale); kb BYTE+80h; joy 0x50 analog signed DWORD; +44h=rgbButtons[20] pas GF Exists; GetActiveWindow seulement caller; TEST AL,2 / OT07 / code24 absents; EAX leftover sub_468790.

## C réconcilié

```c
/* Input_ProcessInput @ 0x467D10
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 334 instr, size 0x4CB, end exclusive 0x4681DB. cdecl, 0 args, retn C3, no EBP frame.
 * sub esp,8 / add esp,8 at unique epilogue. Saved EBX EBP ESI EDI.
 * Return leftover EAX = sub_468790(); callers ignore (IsWindowNOTActive xor eax,eax).
 * Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / GF Exists: ABSENT.
 * +44h here = BYTE [joy+0x44] (DIJOYSTATE.rgbButtons[20], case 0xF4). NOT GF Exists.
 * OT tag 07 / GPU code 24 / TEST AL,2 unlink: ABSENT.
 * GetActiveWindow / GetForegroundWindow / GetKeyState: ABSENT (caller 0x45B2E0 uses GetActiveWindow).
 * ja unsigned: mouse window jb/ja 6Ah/6Ch; keyboard vs joy ja 0DDh; switch ja 1Fh.
 * jg/jl signed: cursor clamps jl; slot/bank/btn loops jl; joy esi>=8 jge; analog jge/jle.
 * No presentation::. Slot stride 0x70. Joy pad stride 0x50. Mapping 3*32 bytes.
 */

void *sub_468B60(void);
void *sub_468D80(void);
void *sub_4692B0(void);
int __cdecl au_re_timeGetTime_0(int slot);
int sub_468790(void);

extern int dword_1CD01F8;   /* just-pressed, slot+0 */
extern int dword_1CD01FC;   /* current mask, slot+4 */
extern int dword_1CD0204;   /* previous mask, slot+0xC */
extern unsigned char byte_1CD0208; /* mapping, slot+0x10 */
extern int dword_1CD02D8;   /* keyboard 256-byte* */
extern int dword_1CD02F0;   /* time hook enable */
extern int dword_1CD02F8;   /* joy DIJOYSTATE* base */
extern int dword_1CD03F8;   /* mouse DIMOUSESTATE* */
extern int dword_1CD03FC;   /* cursor X */
extern int dword_1CD0400;   /* cursor Y */
extern int dword_1CD0404;   /* cursor X max */
extern int dword_1CD0408;   /* cursor Y max */
extern int dword_1CD040C;   /* lX scaled */
extern int dword_1CD0410;   /* lY scaled */
extern int dword_1CD0414;   /* mouse divisor term */

int __cdecl Input_ProcessInput(void)
{
    int bank;
    unsigned char code;
    unsigned char *map_row;
    unsigned char *mouse;
    unsigned char *kbd;
    unsigned char *pad;
    int *p_cur;
    int *p_prev;
    int *p_just;
    int slot;
    int btn;
    int base;
    int divisor;
    int lxs;
    int lys;
    int joy_idx;
    int current;
    int prev;

    dword_1CD03F8 = (int)sub_468B60();
    dword_1CD02D8 = (int)sub_468D80();
    dword_1CD02F8 = (int)sub_4692B0();

    mouse = (unsigned char *)dword_1CD03F8;
    if (mouse != 0)
    {
        divisor = 11 - dword_1CD0414;
        lxs = *(int *)mouse / divisor;
        dword_1CD040C = lxs;
        lys = *(int *)(mouse + 4) / divisor;
        dword_1CD03FC += lxs;
        dword_1CD0410 = lys;
        if (dword_1CD03FC < 0)
            dword_1CD03FC = 0;
        if (dword_1CD03FC >= dword_1CD0404)
            dword_1CD03FC = dword_1CD0404 - 1;
        dword_1CD0400 += lys;
        if (dword_1CD0400 < 0)
            dword_1CD0400 = 0;
        if (dword_1CD0400 >= dword_1CD0408)
            dword_1CD0400 = dword_1CD0408 - 1;
    }

    for (slot = 0; slot < 2; slot++)
    {
        base = ((slot * 8) - slot) << 4;
        p_cur = (int *)((unsigned char *)&dword_1CD01FC + base);
        p_prev = (int *)((unsigned char *)&dword_1CD0204 + base);
        p_just = (int *)((unsigned char *)&dword_1CD01F8 + base);

        *p_prev = *p_cur;
        *p_cur = 0;

        for (bank = 0; bank < 3; bank++)
        {
            map_row = (unsigned char *)&byte_1CD0208 + base + (bank << 5);
            for (btn = 0; btn < 0x20; btn++)
            {
                code = map_row[btn];

                if (code >= 0x6A && code <= 0x6C)
                {
                    if (dword_1CD03F8 == 0)
                        continue;
                    mouse = (unsigned char *)dword_1CD03F8;
                    if (code == 0x6A)
                    {
                        if ((mouse[0x0C] & 0x80) == 0)
                            continue;
                    }
                    else if (code == 0x6B)
                    {
                        if ((mouse[0x0D] & 0x80) == 0)
                            continue;
                    }
                    else
                    {
                        if ((mouse[0x0E] & 0x80) == 0)
                            continue;
                    }
                }
                else if (code <= 0xDD)
                {
                    kbd = (unsigned char *)dword_1CD02D8;
                    if (kbd == 0)
                        continue;
                    if ((kbd[code] & 0x80) == 0)
                        continue;
                }
                else
                {
                    if (slot >= 8)
                        continue;
                    if (dword_1CD02F8 == 0)
                        continue;
                    joy_idx = (int)code - 0xE0;
                    if ((unsigned int)joy_idx > 0x1F)
                        continue;
                    pad = (unsigned char *)dword_1CD02F8 + ((slot + slot * 4) << 4);
                    if (joy_idx < 28)
                    {
                        if (pad[0x30 + joy_idx] == 0)
                            continue;
                    }
                    else if (joy_idx == 28)
                    {
                        if (*(int *)(pad + 4) >= 0)
                            continue;
                    }
                    else if (joy_idx == 29)
                    {
                        if (*(int *)(pad + 4) <= 0)
                            continue;
                    }
                    else if (joy_idx == 30)
                    {
                        if (*(int *)pad >= 0)
                            continue;
                    }
                    else
                    {
                        if (*(int *)pad <= 0)
                            continue;
                    }
                }

                *p_cur |= 1u << btn;
            }
        }

        current = *p_cur;
        prev = *p_prev;
        *p_just = current & ~(current & prev);

        if (dword_1CD02F0 != 0)
        {
            au_re_timeGetTime_0(slot);
            /* edi = dword_1CD02F8; */
        }
    }

    return sub_468790();
}
```
