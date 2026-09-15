# sub_54FDA0 @ 0x54FDA0

- Instr (live): 165
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=5887 (retry high/65536; auto length c_len=0)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=9547 (retry high/65536; auto length c_len=0)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=9380 (retry high/65536; auto length c_len=0)
- A==B: non
- Push IDB: oui
- SetType: int __cdecl sub_54FDA0(int)
- Notes parent: meter [arg_0+0x70] vs 0x20000 UNSIGNED jb. Vehicle signed (0x22..0x28 ou 0x20). Item 0xA2 qty jg signe, BYTE amount--. Terrain [LocationDRAW+0xD]: 0x1C sar, 0x1B|8 shl. Stride dword_C76640*0x28 movsx. add esp 4/4/0Ch/4/2Ch. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. EAX=0 seulement loc_54FF86.

## C réconcilié

```c
/* sub_54FDA0 @ 0x54FDA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 165 instr, size 0x1EC, end 0x54FF8C. cdecl, 1 arg, retn C3. EBP frame, no sub esp.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * Stride: lea [eax+eax*4]*5 then [eax*8] => dword_C76640*0x28 at byte_20426D0 (movsx BYTE).
 * Inventory {id,amount} BYTE+BYTE stride 2, 0x1CFE79C..0x1CFE928 (0x18C / 198 slots).
 * Meter [arg_0+0x70] vs 0x20000 is UNSIGNED jb. Qty/vehicle/cooldown/ptr bound SIGNED.
 * ebx stays 0. No 66. No setcc. No jump table. ESI pushed only on consume path.
 */

extern int dword_2045C78;
extern int dword_20409F0;
extern int world_currentVehicle;
extern unsigned char byte_2036B70;
extern int dword_C76640;
extern char byte_20426D0[];
extern unsigned char SG_ITEM_ID_AND_QUANTITY[];
extern unsigned char SG_GAME_TIME[];
extern int dword_20430C0;
extern int dword_2043FF4;
extern char byte_2043DF4[];
extern char byte_2043EF4[];
extern char byte_2043C78[];
extern unsigned char *Worldmap_weirdregister0_LocationDRAW;

extern int __cdecl sub_543A40(int);
extern int __cdecl sub_546F90(int);
extern int __cdecl sub_543790(int, int, unsigned char *);
extern char *__cdecl getTextBattleItem(int);
extern unsigned char *__cdecl sub_54FAD0(unsigned char *, int);
extern char *__cdecl sub_54FC80(char *, int, const char *, const char *, const char *, const char *);

int __cdecl sub_54FDA0(int arg_0)
{
    int veh;
    int meter;
    int gain;
    int esi_slot; /* ESI: -1 until amount-- ; then slot index */
    int slot;     /* EDX on consume scan */
    unsigned int qty; /* ECX: xor then mov cl (zero-ext BYTE), SIGNED cmps */
    unsigned char *inv;
    unsigned char terrain;
    char *text;
    char *dst;
    int n;
    int rv;
    unsigned char amt;

    /* cooldown: signed jle vs 0; dec only if dword_20409F0 != 0 */
    if (dword_2045C78 <= 0)
        sub_543A40(1);
    else if (dword_20409F0 != 0)
        --dword_2045C78;

    /* vehicle: signed jl 0x22 / jle 0x28, else must be 0x20 */
    veh = world_currentVehicle;
    if (veh < 0x22 || veh > 0x28) {
        if (veh != 0x20)
            return 0; /* loc_54FF86: xor eax,eax — only explicit 0 */
    }
    if (byte_2036B70 != 0)
        return 0; /* loc_54FF86 */

    meter = *(int *)((char *)arg_0 + 0x70);
    if ((unsigned int)meter < 0x20000) { /* jb UNSIGNED -> loc_54FF32; ESI not pushed */
        inv = SG_ITEM_ID_AND_QUANTITY;
        for (;;) {
            qty = inv[1]; /* mov cl,[eax+1] even when id mismatches */
            if (inv[0] == 0xA2 && (int)qty > 0) /* jg SIGNED vs ebx=0 */
                break;
            inv += 2;
            if ((int)inv >= (int)SG_GAME_TIME) /* jl SIGNED */
                return (int)inv; /* leftover EAX = end pointer */
        }
        gain = dword_20409F0;
        terrain = Worldmap_weirdregister0_LocationDRAW[0x0D];
        if (terrain == 0x1C) { /* 28: sar eax,1 then store+ret */
            gain = gain >> 1;
            *(int *)((char *)arg_0 + 0x70) = meter + gain;
            return gain;
        }
        if (terrain == 0x1B || terrain == 8) /* 27 or 8: shl eax,1 */
            gain = gain << 1;
        *(int *)((char *)arg_0 + 0x70) = meter + gain;
        return gain;
    }

    /* consume path: push esi; movsx BYTE at byte_20426D0 + index*0x28 */
    sub_546F90((int)(signed char)byte_20426D0[dword_C76640 * 40]);
    esi_slot = -1; /* or esi, 0xFFFFFFFF */
    dword_20430C0 = esi_slot;
    dword_2043FF4 = 0;
    slot = 0;
    inv = SG_ITEM_ID_AND_QUANTITY;
    for (;;) {
        qty = inv[1];
        if (inv[0] == 0xA2 && (int)qty > 0)
            break; /* loc_54FE68 */
        inv += 2;
        ++slot;
        if ((int)inv >= (int)SG_GAME_TIME) { /* fall into loc_54FE49 */
            rv = sub_543790(1, 0x2B, 0);
            *(int *)((char *)arg_0 + 0x70) = 0;
            dword_2045C78 = 0x1E;
            return rv;
        }
    }

    /* cmp ecx,1; jl loc_54FE85 (dead after jg>0; ESI would stay -1) */
    if ((int)qty >= 1) {
        amt = SG_ITEM_ID_AND_QUANTITY[slot * 2 + 1];
        esi_slot = slot;
        --amt; /* dec al; BYTE store */
        dword_20430C0 = esi_slot;
        SG_ITEM_ID_AND_QUANTITY[slot * 2 + 1] = amt;
    }

    qty = SG_ITEM_ID_AND_QUANTITY[esi_slot * 2 + 1]; /* xor eax,eax; mov al, amount[esi*2] */
    dword_2043FF4 = (int)qty;
    if ((int)qty <= 0) { /* signed jle -> loc_54FE49 */
        rv = sub_543790(1, 0x2B, 0);
        *(int *)((char *)arg_0 + 0x70) = 0;
        dword_2045C78 = 0x1E;
        return rv;
    }

    byte_2043DF4[0] = 0;
    text = getTextBattleItem(0xA2);
    n = 0;
    if (byte_2043DF4[0] != 0) {
        do {
            /* loc_54FEB7: al = byte_2043DF5[ecx]; inc ecx; until NUL */
            ++n;
        } while (byte_2043DF4[n] != 0);
    }
    dst = &byte_2043DF4[n]; /* lea ecx, byte_2043DF4[ecx] */
    *dst = *text;
    if (*dst != 0) {
        do { /* loc_54FED0: [edx+1], inc ecx, inc edx */
            ++dst;
            ++text;
            *dst = *text;
        } while (*dst != 0);
    }

    byte_2043EF4[0] = 0; /* before sub_54FAD0 */
    sub_54FAD0((unsigned char *)byte_2043EF4, dword_2043FF4);
    byte_2043C78[0] = 0; /* between pushes and call sub_54FC80 */
    sub_54FC80(byte_2043C78, 0, byte_2043DF4, byte_2043EF4, 0, 0);
    rv = sub_543790(1, -2, (unsigned char *)byte_2043C78); /* add esp,2Ch batches 8+24+12 */
    *(int *)((char *)arg_0 + 0x70) = 0;
    dword_2045C78 = 0x1E;
    return rv;
}
```
