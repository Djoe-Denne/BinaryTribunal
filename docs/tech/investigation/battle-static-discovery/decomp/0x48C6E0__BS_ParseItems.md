# BS_ParseItems @ 0x48C6E0

- Instr (live): 22
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=19
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=19
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=115
- A==B: non
- Push IDB: oui
- SetType: _BYTE *BS_ParseItems(void)
- Notes parent: stride EQUAL 5 (32 slots jusqu’à BMI_MONSTER1_DRAW_SPELL_ID1), SG_ITEM 2 (198, fin 0x1CFE929). BYTE id/qty, aucun préfixe 66. jl 7C / jge 7D signés. Remap `(SG_ANGELO_POINTS+7)[id]` = SG_ITEM_BATTLE_ORDER[id-1] pour 1..32. Skip id==0 || id>=0x21 ITEM_TENT. Tail jmp sub_48C670 (pas retn). Pas de struct packée. Pas de Hex-Rays.

## C réconcilié

```c
/* BS_ParseItems @ 0x48C6E0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 22 instr, size 0x51. IDA type _BYTE *(). No domain::. No args.
 * No 66 prefix. All stores/loads BYTE (C6/8A/88). No setcc. No add esp.
 * Zero loop: 32 EQUAL slots, stride 5, end BMI_MONSTER1_DRAW_SPELL_ID1
 *   0x1D28F18. Writes qty [eax+1] then id [eax]; +2/+3/+4 untouched.
 * Import: 198 SG_ITEM {id,qty} stride 2. edx starts at .amount 0x1CFE79D.
 *   id = [edx-1] zero-extend (xor eax,eax; mov al). Skip id==0 or
 *   signed jge vs 21h (ITEM_TENT). Keep 1..0x20.
 * Remap BYTE (SG_ANGELO_POINTS+7)[id] @ 0x1CFE77B+id → ecx; stores at
 *   [ecx+ecx*4] (stride 5). Named SG_ITEM_BATTLE_ORDER @ 0x1CFE77C is
 *   the 32-byte table for id 1..32 (id-1). No packed struct.
 * Loops jl SIGNED (7C). Bound jge SIGNED (7D), not ja/jae.
 * Tail jmp sub_48C670 (E9), not CALL/retn. EAX leftover = that callee.
 */

extern unsigned char EQUAL_ITEM_ID[];            /* 0x1D28E78 */
extern unsigned char EQUAL_ITEM_QUANTITY[];       /* 0x1D28E79 */
extern unsigned char SG_ITEM_ID_AND_QUANTITY[];   /* 0x1CFE79C, 198 x 2 */
extern unsigned char SG_ANGELO_POINTS[];          /* 0x1CFE774, 8 bytes */
extern unsigned char BMI_MONSTER1_DRAW_SPELL_ID1; /* 0x1D28F18 sentinel */

unsigned char *__cdecl sub_48C670(void);

unsigned char *__cdecl BS_ParseItems(void)
{
    unsigned char *p;      /* eax: EQUAL_ITEM_ID walker */
    unsigned char *qty;    /* edx: SG_ITEM .amount walker */
    unsigned int item_id; /* eax: xor+mov al, 0..255 */
    unsigned int slot;     /* ecx: xor+mov cl remap */

    p = EQUAL_ITEM_ID;
    do {
        /* loc_48C6E5: BYTE [eax+1] then BYTE [eax], then add 5 */
        p[1] = 0;
        p[0] = 0;
        p += 5;
        /* cmp eax, offset BMI_MONSTER1_DRAW_SPELL_ID1 ; jl 7C */
    } while ((int)p < (int)&BMI_MONSTER1_DRAW_SPELL_ID1);

    qty = SG_ITEM_ID_AND_QUANTITY + 1; /* .amount @ 0x1CFE79D */
    do {
        /* loc_48C6FB */
        item_id = qty[-1]; /* BYTE id, high eax 0 */
        if (item_id != 0 && (int)item_id < 0x21) {
            /* jge 7D skip if id >= ITEM_TENT. Signed, not jae. */
            slot = SG_ANGELO_POINTS[7 + item_id]; /* BYTE at 0x1CFE77B+id */
            EQUAL_ITEM_ID[slot + slot * 4] = (unsigned char)item_id;
            EQUAL_ITEM_QUANTITY[slot + slot * 4] = qty[0];
        }
        /* loc_48C721 */
        qty += 2;
        /* cmp edx, 1CFE929h ; jl 7C */
    } while ((int)qty < 0x1CFE929);

    /* jmp sub_48C670 — tail, not call */
    return sub_48C670();
}
```
