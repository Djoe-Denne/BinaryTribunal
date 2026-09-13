# MenuMagic_AddStockRaw @ 0x4C2C70

- Instr (live): 74
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=973
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=751
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1052
- A==B: non
- Push IDB: oui
- SetType: int __cdecl MenuMagic_AddStockRaw(int chara_idx, int magic_id, int delta)
- Notes parent: Magic persistent 32×2 (add edx,2), CharacterData 0x98. Occupancy = BYTE id!=0 seulement. GetRandomInt absent; sub_4ABC40 EAX entier, add esp=8. Stores BYTE id/amount. Existing: jl signed clamp 100, pas de clamp bas. New: jge/jle [0,100]. Retour 0 si plein sinon qty ajoutée.

## C réconcilié

```c
/* MenuMagic_AddStockRaw @ 0x4C2C70
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 74 instr, size 0xAF, end 0x4C2D1F. IDA type int __cdecl(int, int, int).
 * Persistent Magic: 32 x {BYTE id, BYTE amount} at CharacterData+0x10, add edx,2.
 * CharacterData size 0x98. Battle F_CHAR Magic 32x5 unused here.
 * Occupancy: BYTE id != 0 only (not id+amount). GetRandomInt absent.
 * sub_4ABC40 returns full EAX slot index (not AL). No ja/jg/setcc/jpt.
 * Existing path: signed jl clamp to 100, no lower clamp. New path: signed [0,100].
 * Return: 0 if full; else effective qty added. No Hex-Rays. No domain::.
 */

typedef struct {
    unsigned char id;     /* +0 BYTE */
    unsigned char amount; /* +1 BYTE */
} ff8_id_quantity_storage; /* live IDA, size 2 */

typedef struct CharacterData {
    unsigned char _pre_magic[0x10];
    ff8_id_quantity_storage Magic[32]; /* +0x10, 32*2 */
    unsigned char _post_magic[0x48];   /* 0x10+0x40+0x48 = 0x98 */
} CharacterData;

extern CharacterData SG_ARRAY_CHARA_DATA[8]; /* 0x1CFE0E8 */

extern int __cdecl sub_4ABC40(int mask, int skip_count);

int __cdecl MenuMagic_AddStockRaw(int chara_idx, int magic_id, int delta)
{
    ff8_id_quantity_storage *stock;
    unsigned int occupancy;
    int slot;
    int old_amt;
    int new_amt;
    int amt;
    unsigned char id;

    /* lea eax,[esi+esi*8]; lea ecx,[esi+eax*2]; lea edx,ds:1CFE0F8h[ecx*8] */
    stock = SG_ARRAY_CHARA_DATA[chara_idx].Magic;
    occupancy = 0;

    for (slot = 0; slot < 0x20; slot++) {
        id = stock[slot].id; /* BYTE [edx] */

        if (id != 0) {
            /* mov ebp,1; shl ebp,cl; or edi,ebp — id only */
            occupancy |= 1u << slot;
        }

        /* movsx eax,al; cmp ebx,eax */
        if (magic_id == (int)(signed char)id) {
            if (stock[slot].amount != 0) {
                /* loc_4C2CC0: movsx amount, add delta, signed jl vs 64h */
                old_amt = (int)(signed char)stock[slot].amount;
                new_amt = old_amt + delta;
                if (new_amt >= 100)
                    new_amt = 100;
                stock[slot].amount = (unsigned char)new_amt; /* 88 42 01 BYTE */
                return new_amt - old_amt;
            }
        }
        /* add edx,2; inc ecx */
    }

    occupancy = ~occupancy; /* not edi */
    if (occupancy == 0)
        return 0; /* EAX leftover 0; inventory full */

    /* loc_4C2CE0: push 0; push eax; call; add esp,8 */
    slot = sub_4ABC40((int)occupancy, 0);

    amt = delta;
    if (amt < 0) /* test eax,eax / jge */
        amt = 0;
    else if (amt > 100) /* cmp 64h / jle */
        amt = 100;

    /* lea ecx,[slot+(chara*19)*4]; shl ecx,1 → byte offset 2*slot+0x98*chara */
    stock[slot].id = (unsigned char)magic_id;     /* 88 99 ... BYTE */
    stock[slot].amount = (unsigned char)amt;      /* 88 81 ... BYTE */
    return amt;
}
```
