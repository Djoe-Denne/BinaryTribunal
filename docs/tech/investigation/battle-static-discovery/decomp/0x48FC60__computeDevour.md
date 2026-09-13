# computeDevour @ 0x48FC60

- Instr (live): 38
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=37
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=30
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=42
- A==B: non
- Push IDB: oui
- SetType: int __cdecl computeDevour(int p_enemy_number)
- Notes parent: stride slot 0xD0; occupancy / F_CHAR 0x1D0 absents; GetRandomInt absent; deux loads monster_info_section; BMI71 *71 BYTE; cascade 0/1/2 → +0xFB/+0xFC/+0xFD sinon reload DWORD arg; cmp 0xFF DWORD; stores BYTE DEVOUR_RESULT / UNKNOWN_FLAG_3 / DEVOUR_SUCEED; EAX 0 ou 1. Pas de 66/setcc/ja/jg. Pas de Hex-Rays. Pas de struct packée.

## C réconcilié

```c
/* computeDevour @ 0x48FC60
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 38 instr, size 0x80. End 0x48FCE0. IDA type int __cdecl(int p_enemy_number).
 * No domain::. Slot stride 0xD0. Occupancy unused. F_CHAR 0x1D0 unused.
 * GetRandomInt unused. No call / add esp. No setcc. No JA/JG. No 66.
 * No packed struct: live byte offsets on deref monster_info ptr.
 */

extern unsigned char BATTLE_SLOT_DATA[];              /* 0x1D27B10, FF8BattleSlotData_s[11], stride 0xD0 */
extern unsigned char BMI71_LOW_MED_HIGH_LEVEL_BIS[];  /* 0x1D28E89 _BYTE[143], index slot*71 */
extern unsigned char DEVOUR_SUCEED;                   /* 0x1D28E26 BYTE */
extern unsigned char DEVOUR_RESULT;                   /* 0x1D28E27 BYTE */
extern unsigned char UNKNOWN_FLAG_3;                  /* 0x1D28E28 BYTE */

int __cdecl computeDevour(int p_enemy_number)
{
    unsigned char *base;
    unsigned char *info;
    unsigned int selected;
    unsigned int tier;

    /* lea ecx,[eax+eax*2]; lea edx,[eax+ecx*4]; shl edx,4 → slot*0xD0 */
    base = BATTLE_SLOT_DATA + (unsigned int)p_enemy_number * 0xD0u;

    /* mov ecx, dword [edx+0x1D27B10]; mov ecx,[ecx] — two DWORD loads */
    info = **(unsigned char ***)base;

    /* lea edx,[eax+eax*8]; shl edx,3; sub edx,eax → slot*71 */
    /* xor eax,eax; mov al, BMI71[...] BYTE zero-ext */
    tier = BMI71_LOW_MED_HIGH_LEVEL_BIS[(unsigned int)p_enemy_number * 71u];

    /* sub eax,0 / jz +0xFB; dec jz +0xFC; dec jnz default; else +0xFD */
    if (tier == 0)
        selected = info[0xFB]; /* Devour[0] low */
    else if (tier == 1)
        selected = info[0xFC]; /* Devour[1] med */
    else if (tier == 2)
        selected = info[0xFD]; /* Devour[2] high */
    else
        selected = (unsigned int)p_enemy_number; /* loc_48FCAE DWORD reload */

    /* cmp eax,0FFh (3D DWORD); jnz success */
    if (selected == 0xFFu) {
        DEVOUR_SUCEED = 0; /* BYTE C6 */
        return 0;
    }

    DEVOUR_RESULT = (unsigned char)selected; /* BYTE A2 AL */
    UNKNOWN_FLAG_3 = info[0xFF];             /* BYTE A2 from [ecx+0xFF] */
    DEVOUR_SUCEED = 1;                       /* BYTE C6 */
    return 1;
}
```
