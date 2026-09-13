# Field_CanAddOneMagicToCharacterStock @ 0x47ED90

- Instr (live): 48
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=234
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=223
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=197
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Field_CanAddOneMagicToCharacterStock(int, int)
- Notes parent: stride save CharacterData 152 (0x98) pas F_CHAR 0x1D0 ; Magic id BYTE @ 0x1CFE0F8 ; amount BYTE @ 0x1CFE0F9 (`80 3c 45 … 64`, pas 66) ; jl vs 20h ; sbb/inc → 0 si amount<100u sinon 1 ; 2 si 32 slots pleins ; magic_id==0 ou slot vide → 0. Pas de callee.

## C réconcilié

```c
/* Field_CanAddOneMagicToCharacterStock @ 0x47ED90
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 48 instr, size 0x6a. cdecl. No callees. BYTE id/amount. stride CharacterData 152.
 */

int __cdecl Field_CanAddOneMagicToCharacterStock(int char_idx, int magic_id)
{
    unsigned char *ids; /* Magic[].id @ 0x1CFE0F8 + char*152 */
    int slot;

    if (magic_id == 0)
        return 0; /* loc_47ED9B */

    /* lea ecx,[esi+esi*8]; lea ecx,[esi+ecx*2]; lea edi,ds:1CFE0F8h[ecx*8] */
    ids = (unsigned char *)(0x1CFE0F8 + char_idx * 152);

    /* pass 1: find id (xor edx,edx; mov dl,[ecx]; cmp edx,ebp; jz loc_47EDE2) */
    for (slot = 0; slot < 0x20; slot++) { /* jl vs 20h, eax 0..31 */
        if ((int)ids[slot * 2] == magic_id) {
            unsigned char amount;

            /* lea eax,[eax+edx*4] ; cmp r/m8 [0x1CFE0F9+eax*2], 64h (opcode 80, no 66) */
            amount = ids[slot * 2 + 1];
            /* sbb eax,eax ; inc eax : amount < 100u -> 0 else 1 */
            return (amount < 100u) ? 0 : 1;
        }
    }

    /* pass 2: empty slot (cmp byte ptr [ecx], 0 ; jz loc_47ED9B) */
    for (slot = 0; slot < 0x20; slot++) {
        if (ids[slot * 2] == 0)
            return 0;
    }

    return 2; /* 32 slots occupied, spell absent */
}
```
