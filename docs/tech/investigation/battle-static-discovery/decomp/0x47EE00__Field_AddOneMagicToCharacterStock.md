# Field_AddOneMagicToCharacterStock @ 0x47EE00

- Instr (live): 75
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=671
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=789
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=666
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Field_AddOneMagicToCharacterStock(int, int);
- Notes parent: leaf; magic_id==0 → EAX=0; CharacterData stride 0x98 (Magic @ +0x10, 32×{BYTE id, BYTE amount}) pas F_CHAR 0x1D0 ni *232; cmp edx,ebx (id zext vs ebx entier); cap `cmp al,64h`/`jnb` unsigned; empty slot `mov bl` puis `inc` du BYTE amount existant; ret 0/1/2; boucles `jl` vs 20h.

## C réconcilié

```c
/* Field_AddOneMagicToCharacterStock @ 0x47EE00
 * Ground truth = live ASM (asm_clean.asm + octets IDA), not Hex-Rays.
 * 75 instr, size 0xA9, retn. IDA type int __cdecl(int, int).
 * Leaf: no callees.
 *
 * SG_ARRAY_CHARA_DATA @ 0x1CFE0E8, IDA CharacterData stride 0x98 (152).
 * Magic @ +0x10: ff8_id_quantity_storage[32] { BYTE id; BYTE amount; }.
 * Not F_CHAR 0x1D0; do not use *232 / *76 word-index.
 */

typedef struct ff8_id_quantity_storage {
    unsigned char id;     /* +0 */
    unsigned char amount; /* +1 */
} ff8_id_quantity_storage;

extern unsigned char SG_ARRAY_CHARA_DATA[]; /* CharacterData[] @ 0x1CFE0E8 */

int __cdecl Field_AddOneMagicToCharacterStock(int char_index, int magic_id)
{
    ff8_id_quantity_storage *magic; /* ebp: 0x1CFE0F8 + char*0x98 */
    int slot;                       /* esi / ecx */
    unsigned char amount;           /* al / cl */

    /* test ebx, ebx ; jnz loc_47EE13 ; else EAX=0 */
    if (magic_id == 0)
        return 0;

    /* lea ecx,[eax+eax*8]; lea ecx,[eax+ecx*2]; lea ebp,1CFE0F8h[ecx*8] */
    magic = (ff8_id_quantity_storage *)&SG_ARRAY_CHARA_DATA[char_index * 0x98 + 0x10];

    /* loc_47EE28: xor edx,edx; mov dl,[edi]; cmp edx,ebx ; jz loc_47EE55
     * inc esi; add edi,2; cmp esi,20h ; jl — signed, 32 slots */
    for (slot = 0; slot < 32; slot++) {
        if ((unsigned int)magic[slot].id == (unsigned int)magic_id) {
            amount = magic[slot].amount; /* 8A, BYTE, no 66 */
            if (amount >= 0x64)          /* cmp al,64h ; jnb (73) unsigned */
                return 1;              /* loc_47EE79 EAX=1 */
            magic[slot].amount = (unsigned char)(amount + 1); /* inc al ; 88 BYTE */
            return 0;
        }
    }

    /* loc_47EE3D: cmp byte ptr [edx],0 ; jz loc_47EE83
     * inc ecx; add edx,2; cmp ecx,20h ; jl */
    for (slot = 0; slot < 32; slot++) {
        if (magic[slot].id == 0) {
            magic[slot].id = (unsigned char)magic_id; /* 88 BYTE bl -> Magic.id */
            amount = magic[slot].amount;            /* 8A BYTE, not assumed 0 */
            amount = (unsigned char)(amount + 1);   /* inc cl */
            magic[slot].amount = amount;            /* 88 BYTE */
            return 0;
        }
    }

    return 2; /* loc_47EE4B EAX=2 */
}
```
