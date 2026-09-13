# Read_ff8input_cfg @ 0x498B50

- Instr (live): 123
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1236
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=121
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1133
- A==B: non
- Push IDB: oui
- SetType: bool __cdecl Read_ff8input_cfg(const char *);
- Notes parent: lot 2 gfx/input. sprintf+fopen add esp 18h ; fgets 0Ch ; atoi 4 ; fclose 4. ebx = stores ; `cmp ebx,0Dh; jg` joystick `dword_1D2A290` sinon clavier `dword_1D2A2C8` (ebp*4). `esi+3` puis 1er digit. `setnl` AL si ebx>=28. jge/jl/jg signed. Occupancy absent. Pas de Hex-Rays.

## C réconcilié

```c
/* Read_ff8input_cfg @ 0x498B50
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 123 instr, size 0x15D, end 0x498CAD. cdecl, 1 arg. retn C3 both exits.
 * Callees CRT: sprintf+fopen add esp,18h; fgets add esp,0Ch; atoi add esp,4;
 * fclose add esp,4. Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * Widths: BYTE 8A/80/3C; DWORD 89 04 AD (ebp*4); setnl AL 0F 9D C0. No 66 prefix.
 * ebx = successful stores only; keyboard if ebx<=0Dh else joystick. Index = atoi-1.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

extern int dword_1D2A2C8[]; /* keyboard DIK table @ 0x1D2A2C8, [0..13] */
extern int dword_1D2A290[]; /* joystick table     @ 0x1D2A290, [0..13] */

bool __cdecl Read_ff8input_cfg(const char *directory)
{
    FILE *Stream;
    char String[260];
    char Buffer[260];
    int stored;
    int len;
    int i;
    char *p;
    char *rest;
    int restlen;
    int idx;
    int value;

    sprintf(Buffer, "%s\\%s", directory, "ff8input.cfg");
    Stream = fopen(Buffer, "r");
    if (Stream == NULL) {
        /* xor al, al; pop esi; add esp,20Ch; retn */
        return 0;
    }

    stored = 0; /* xor ebx, ebx before first fgets */
    if (fgets(String, 0xFF, Stream) != NULL) {
        for (;;) {
            /* loc_498BBF: cmp ebx,1Ch; jge loc_498C93 (signed) */
            if (stored >= 28)
                break;

            /* BYTE String[0]: 8A 44 24 14 */
            if (String[0] == '\0' || String[0] == '\n')
                goto loc_498C74;

            /* strlen via scasb/not/dec; jle loc_498BFA if <=0 */
            len = (int)strlen(String);
            i = 0;
            /* loc_498BEE: BYTE cmp 20h; jnz out; inc; jl (signed) */
            while (i < len && String[i] == ' ')
                i++;

            if (i == len)
                goto loc_498C74;

            p = &String[i];
            if (p == NULL) /* test esi, esi — stack addr, not taken */
                goto loc_498C74;

            idx = atoi(p);
            rest = p + 3; /* lea edx, [esi+3] */
            /* add esp,4 after atoi; then dec ebp (1-based -> 0-based) */
            idx -= 1;
            restlen = (int)strlen(rest);
            if (restlen <= 0) /* signed jle */
                goto loc_498C74;

            /* loc_498C27: BYTE [eax+edx]; jl/'0' then jle/'9' -> loc_498C3B */
            i = 0;
            for (;;) {
                if (rest[i] >= '0' && rest[i] <= '9')
                    break;
                i++;
                if (i >= restlen)
                    goto loc_498C74;
            }

            /* loc_498C3B: add eax, edx; test eax, eax; jz skip; atoi */
            p = rest + i;
            if (p == NULL)
                goto loc_498C74;
            value = atoi(p);

            /* signed jl/jg: ebp in [0,0Dh], eax in [0,0FFh] */
            if (idx < 0 || idx > 13)
                goto loc_498C74;
            if (value < 0 || value > 0xFF)
                goto loc_498C74;

            /* cmp ebx,0Dh; jg loc_498C6C — count, not parsed index */
            if (stored > 13)
                dword_1D2A290[idx] = value; /* loc_498C6C */
            else
                dword_1D2A2C8[idx] = value;
            stored++; /* loc_498C73 */

        loc_498C74:
            /* reload Stream (esi was clobbered by strlen/scan) */
            if (fgets(String, 0xFF, Stream) == NULL)
                break; /* jz loc_498C93 */
        }
    }

    /* loc_498C93 */
    fclose(Stream);
    /* cmp ebx,1Ch; setnl al — signed not-less */
    return stored >= 28;
}
```
