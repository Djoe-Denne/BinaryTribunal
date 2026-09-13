# MenuSprite_DrawCallback @ 0x4A0C00

- Instr (live): 46
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=595
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1111
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=539
- A==B: non
- Push IDB: oui
- SetType: char __cdecl MenuSprite_DrawCallback(int, unsigned int, int)
- Notes parent: Dernière EA LOT2_QUEUE (gfx/input). Occupancy 1+2 absente. Stride `esi*0x3C` (BYTE offset, pas 64 ni HUD 0x14). BYTE `[arg_0+3Ah]` + flag `byte_1D2B346`. DWORD fp `dword_1D2B368`. Rebase temporaire `dword_1D76608 = AddBase(0)+0x300`. `push edi` entier vers `sub_49FEB0`. Queue `0x4A0C80` hors fonction.

## C réconcilié

```c
/* MenuSprite_DrawCallback @ 0x4A0C00
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 46 instr, size 0x7B, end 0x4A0C7B. IDA type char __cdecl(int, unsigned int, int).
 * FLAGS 0x5400. FRSIZE 0x8. FRREGS 0. FUNC_THUNK=0. retn C3 (not retn N).
 * No mov ebp,esp. No sub esp. Saved ebp+esi always; ebx+edi only on flag!=0 path.
 * add esp: 4 after AddBase_1A78C88; 0Ch after call ecx; 0Ch after sub_49FEB0.
 * Stride: lea [esi+esi*2]; lea [eax+eax*4]; shl eax,2 = esi*0x3C BYTE offset.
 * Widths: 8A BYTE [arg_0+3Ah] and flag +0x16; DWORD fp +0x38; DWORD dword_1D76608 A3/89 2D.
 * No 66. No setcc. jz only. Labels loc_4A0C5C, loc_4A0C72.
 * Occupancy 1+2 / slot 0xD0 / actor 0x9C / F_CHAR 0x1D0 / GFSG 0x44 / K_GF 0x84: absent.
 * Catalog 8x64 @ 0x1D2B550 unused. HUD 0x14 / g_BattleUI_WidgetSlots: absent.
 * Tail 0x4A0C80 not this function. No packed struct. No domain::.
 */

extern unsigned int dword_1D76608; /* 0x1D76608, item_size=4 */
extern char dword_1D2B330[];       /* 0x1D2B330 record base, byte-offset */
extern char byte_1D2B346[];        /* 0x1D2B346 = base+0x16 flag, item_size=1 */
extern int dword_1D2B368[];        /* 0x1D2B368 = base+0x38 fp, item_size=4 */
extern char *__cdecl AddBase_1A78C88(int);
/* IDA types callee 3rd as __int16; this site push edi (DWORD). */
extern char __cdecl sub_49FEB0(int, unsigned int, int);

char __cdecl MenuSprite_DrawCallback(int arg_0, unsigned int arg_4, int arg_8)
{
    unsigned int saved;
    unsigned int idx;
    unsigned int off;
    int fp;
    char *record;
    char *addbase;
    char result;

    addbase = AddBase_1A78C88(0);
    saved = dword_1D76608;
    dword_1D76608 = (unsigned int)(addbase + 0x300);

    idx = *(unsigned char *)((char *)arg_0 + 0x3A);
    off = idx * 0x3C;

    if (!byte_1D2B346[off]) {
        dword_1D76608 = saved;
        return (char)off;
    }

    fp = *(int *)((char *)dword_1D2B368 + off);
    record = (char *)dword_1D2B330 + off;
    if (fp)
        ((void (__cdecl *)(char *, unsigned int, int))fp)(record, arg_4, arg_8);

    result = sub_49FEB0((int)idx, arg_4, arg_8);
    dword_1D76608 = saved;
    return result;
}
```
