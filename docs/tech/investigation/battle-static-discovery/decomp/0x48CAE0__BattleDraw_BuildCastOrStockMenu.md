# BattleDraw_BuildCastOrStockMenu @ 0x48CAE0

- Instr (live): 79
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=149
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=1107
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1393
- A==B: non
- Push IDB: oui
- SetType: __int16 *__cdecl BattleDraw_BuildCastOrStockMenu(int, int)
- Notes parent: F_CHAR 0x1D0 pas slot 0xD0. Occupancy non testée. jge 7D signé vs 0x40 (GF +7=2). Stock 32×5 @ +0x82, cmp BYTE zext vs ebp (B/C tronquaient). Cap amount 0x64 → OR 2. attackFlags&0x80 → +7=1 et OR 1. Tous stores BYTE, pas de 66. EAX leftover row. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleDraw_BuildCastOrStockMenu @ 0x48CAE0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 79 instr, size 0xD0. End 0x48CBB0. IDA type __int16 *__cdecl(int, int).
 * No domain::. No callees. No GetRandomInt. No occupancy 1+2.
 * F_CHAR stride 0x1D0 (lea*8/sub/lea*4/shl4), not BATTLE_SLOT 0xD0.
 * Widths: ALL BYTE (C6/88/08/8A/38/80); no 66 prefix. No setcc.
 * jge 7D signed vs magic_id 0x40. Stock loops jl 7C signed vs 0x20.
 * EAX leftover = F_CHAR_DATA + 0x1D0 * arg_0. No packed struct.
 */

extern unsigned char F_CHAR_DATA[];       /* 0x1CFF000 */
extern unsigned char K_BATTLE_COMMAND[];  /* 0x1CF3F2C, stride 8 */
extern unsigned char K_MAGIC[];            /* 0x1CF4064, stride 0x3C */

__int16 *__cdecl BattleDraw_BuildCastOrStockMenu(int chara_index, int magic_id)
{
    unsigned char *row;   /* eax after lea F_CHAR_DATA[edx] */
    unsigned char *stock; /* edi = row + 0x82 */
    unsigned char cl;
    unsigned char dl;
    int ecx;
    unsigned int edx;

    /* lea ecx,[eax*8]; sub ecx,eax; lea edx,[eax+ecx*4]; shl edx,4 */
    row = F_CHAR_DATA + 0x1D0 * chara_index;

    /* cmd 0x0A * 8 = +50h: unknownFlags BYTE +5, target BYTE +6 */
    cl = K_BATTLE_COMMAND[0x50 + 5];
    dl = K_BATTLE_COMMAND[0x50 + 6];

    row[0] = 0x0A; /* C6 00 0A */
    row[1] = cl;
    row[2] = dl;
    row[3] = 0;    /* bl */
    row[4] = 9;    /* C6 40 04 09 */

    /* cmp ebp,40h ; jge 7D (signed). Header +0..4 already stored. */
    if (magic_id >= 0x40) {
        row[5] = 0;
        row[6] = 0;
        row[7] = 2; /* C6 40 07 02 */
        return (__int16 *)row; /* loc_48CBA1 -> loc_48CBAB */
    }

    /* imul ecx,ebp,3Ch ; BYTE K_MAGIC.unknown1/defaultTarget/attackFlags */
    ecx = magic_id * 0x3C;
    row[5] = K_MAGIC[ecx + 9];
    row[6] = K_MAGIC[ecx + 0x0A];
    cl = (unsigned char)(K_MAGIC[ecx + 0x0B] & 0x80); /* and cl,80h */

    row[7] = 0; /* bl */
    dl = 1;
    if (cl != 0) /* jz loc_48CB4E (ZF from and) */
        row[7] = dl;
    if (cl != 0) /* loc_48CB4E: cmp cl,bl ; jz loc_48CB55 */
        row[3] |= dl;

    stock = row + 0x82;
    ecx = 0;
    /* loc_48CB5F: xor edx,edx; mov dl,[esi]; cmp edx,ebp  (BYTE zext vs full ebp) */
    while (1) {
        edx = stock[5 * ecx];
        if (edx == (unsigned int)magic_id)
            break; /* loc_48CB8F */
        ecx += 1;
        if (ecx >= 0x20)
            goto loc_not_found; /* jl 7C signed fail */
    }

    /* loc_48CB8F: lea edx,[eax+ecx*4]; cmp byte [ecx+edx+83h],64h
     * = amount at row + 5*ecx + 0x83 */
    if (stock[5 * ecx + 1] == 0x64)
        goto loc_or_flag2; /* jz loc_48CB81 */
    return (__int16 *)row;

loc_not_found:
    ecx = 0;
    /* loc_48CB74: cmp [edx],bl ; jz loc_48CBAB */
    while (1) {
        if (stock[5 * ecx] == 0)
            return (__int16 *)row; /* empty id: no OR 2 */
        ecx += 1;
        if (ecx >= 0x20)
            break; /* jl 7C signed fail */
    }

loc_or_flag2:
    /* loc_48CB81: mov cl,[eax+3]; or cl,2; mov [eax+3],cl */
    row[3] |= 2;
    return (__int16 *)row;
}
```
