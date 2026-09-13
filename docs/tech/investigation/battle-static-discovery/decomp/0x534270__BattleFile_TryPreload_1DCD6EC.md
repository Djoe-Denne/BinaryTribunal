# BattleFile_TryPreload_1DCD6EC @ 0x534270

- Instr (live): 23
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=62
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int BattleFile_TryPreload_1DCD6EC(void)
- Notes parent: 0 args. Idle si [p+3]==[p+4] && [p+0]==0 && [p+2]!=0 && ja [p+1]>0 faux. Stores BYTE +4=0, reload +3=0, +2=1, ret 0. Else call au_re_BattleFile_preLoad (0 args, pas d'add esp), EAX callee jeté, ret 1. Occupancy absente.

## C réconcilié

```c
/* BattleFile_TryPreload_1DCD6EC @ 0x534270
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 23 instr, size 0x44, end 0x5342B4. cdecl, 0 args. No saved regs. retn C3.
 * Callee au_re_BattleFile_preLoad @ 0x534210 TYPE int(); 0 args; no add esp.
 * EAX of callee discarded (B8 01 after call).
 * DWORD A1/8B15: dword_1DCD6EC @ 0x1DCD6EC (pointer, item_size=4).
 * BYTE 8A: [p+3], [p+4], [p+0]. BYTE 38: cmp [p+2], [p+1].
 * ja (77) unsigned [p+1] > 0. jnz/jz as encoded.
 * Idle BYTE stores: 88 48 04 [EAX+4]=0 (same EAX); 88 4A 03 after 8B15 reload;
 * C6 40 02 01 after A1 reload. Return 33C0=0 else B8 01=1.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No domain::.
 */

extern int dword_1DCD6EC;
int au_re_BattleFile_preLoad(void);

int BattleFile_TryPreload_1DCD6EC(void)
{
    _BYTE *p;

    p = (_BYTE *)dword_1DCD6EC; /* A1 EC D6 DC 01 */
    if (p[3] != p[4])           /* 8A 48 03 / 8A 50 04 / 3A CA / 75 2A */
        goto loc_5342A9;
    if (p[0] != 0)              /* 8A 10 / 32 C9 / 3A D1 / 75 22 */
        goto loc_5342A9;
    if (p[2] == 0)              /* 38 48 02 / 74 1D */
        goto loc_5342A9;
    if ((unsigned __int8)p[1] > 0) /* 38 48 01 / 77 18 ja unsigned */
        goto loc_5342A9;

    p[4] = 0;                          /* 88 48 04 BYTE, CL=0, same EAX */
    *(_BYTE *)(dword_1DCD6EC + 3) = 0; /* 88 4A 03 BYTE after 8B 15 reload */
    *(_BYTE *)(dword_1DCD6EC + 2) = 1; /* C6 40 02 01 BYTE after A1 reload */
    return 0;                          /* 33 C0 */

loc_5342A9:
    au_re_BattleFile_preLoad();
    return 1; /* B8 01 00 00 00 */
}
```
