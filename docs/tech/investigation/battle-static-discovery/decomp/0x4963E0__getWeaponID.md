# getWeaponID @ 0x4963E0

- Instr (live): 31
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=51
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=177
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=49
- A==B: non
- Push IDB: oui
- SetType: int __cdecl getWeaponID(int p_char_slot_id)
- Notes parent: stride CharacterData 0x98 (lea*9 / *19 / shl3). F_CHAR 0x1D0 / slot 0xD0 / occupancy 1+2 absents. Flag BYTE 0x1CFE97A bit0 jz WeaponID. ModelID+0x08 sub 8 / dec / dec → Laguna 8 / Kiros 9 / Ward 0xA. Laguna DWORD+AND 0xFF ; Kiros/Ward mov al. GetRandomInt absent. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* getWeaponID @ 0x4963E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 31 instr, size 0x5C, end 0x49643C. IDA type int __cdecl(int p_char_slot_id).
 * CharacterData stride 0x98. Occupancy 1+2 unused. F_CHAR 0x1D0 unused. slot 0xD0 unused.
 * GetRandomInt absent. No setcc. jz after test bit0 / sub/dec. No 66 prefix.
 * Laguna: dword load then AND 0xFF. Kiros/Ward: xor eax,eax; mov al.
 * No packed struct: live offsets on SG_ARRAY_CHARA_DATA[slot*0x98].
 */

extern unsigned char SG_ODIN_ANGEL_GILGA_FLAG; /* 0x1CFE97A BYTE, test bit 0 */
extern unsigned char SG_ARRAY_CHARA_DATA[];     /* 0x1CFE0E8 CharacterData[8] stride 0x98 */
extern unsigned char SG_WEAPON_ID_LAGUNA;      /* 0x1CFE760 BYTE; dream path: DWORD load + AND 0xFF */
extern unsigned char SG_WEAPON_ID_KIROS;       /* 0x1CFE761 BYTE */
extern unsigned char SG_WEAPON_ID_WARD;        /* 0x1CFE762 BYTE */

#define OFF_MODELID  0x08
#define OFF_WEAPONID 0x09

int __cdecl getWeaponID(int p_char_slot_id)
{
    unsigned int slot;
    unsigned int off;
    unsigned int model;

    slot = (unsigned int)p_char_slot_id;
    off = slot * 0x98u;

    if ((SG_ODIN_ANGEL_GILGA_FLAG & 1) == 0)
        return SG_ARRAY_CHARA_DATA[off + OFF_WEAPONID];

    model = SG_ARRAY_CHARA_DATA[off + OFF_MODELID];
    model -= 8;
    if (model == 0)
        return *(unsigned int *)&SG_WEAPON_ID_LAGUNA & 0xFFu;
    model--;
    if (model == 0)
        return SG_WEAPON_ID_KIROS;
    model--;
    if (model == 0)
        return SG_WEAPON_ID_WARD;
    return SG_ARRAY_CHARA_DATA[off + OFF_WEAPONID];
}
```
