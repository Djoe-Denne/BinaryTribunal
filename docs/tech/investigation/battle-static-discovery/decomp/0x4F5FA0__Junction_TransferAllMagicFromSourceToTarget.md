# Junction_TransferAllMagicFromSourceToTarget @ 0x4F5FA0

- Instr (live): 53
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Junction_TransferAllMagicFromSourceToTarget(int source_char, int target_char)
- Notes parent: EBX=source arg_0, EBP=target arg_1. CharacterData 0x98. Magic 32x2 BYTE id/amount (movsx + two inc), pas 32x5. Occupancy 1+2 = skip id==0 ou amount==0. GetRandomInt absent. var_4 DWORD sticky. Add target puis Remove source (meme si added==0). Prune/Rebuild source puis target, add esp,10h. EAX=var_4. Pas de 66/setcc/ja/jpt.

## C réconcilié

```c
/* Junction_TransferAllMagicFromSourceToTarget @ 0x4F5FA0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 53 instr, size 0x8D, end 0x4F602D. IDA type int __cdecl(int, int).
 * arg_0 EBX = source, arg_1 EBP = target. push ecx / pop ecx = var_4.
 * Persistent Magic: 32 x {BYTE id, BYTE amount} at CharacterData+0x10.
 * CharacterData size 0x98. Battle F_CHAR Magic 32x5 unused here.
 * Occupancy 1+2 as transfer gate: skip if id==0 OR amount==0 (test/jz).
 * GetRandomInt absent. No 66. No setcc/ja/jg/jpt.
 * Loop: DWORD count=20h in arg_0 slot, dec/jnz loc_4F5FCA.
 * Add(target) then Remove(source, added) even if added==0.
 * Then Prune+Rebuild source, Prune+Rebuild target, add esp,10h.
 * Return EAX = var_4 (sticky 0/1). No domain::.
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

int __cdecl MenuMagic_AddStockRaw(int chara_idx, int magic_id, int delta);
int __cdecl MenuMagic_RemoveStockRaw(int chara_idx, int magic_id, int delta);
int __cdecl MenuMagic_PruneZeroStockAndJunctionRefs(int charIndex);
__int16 __cdecl MenuMagic_RebuildPartyDerivedState(int char_id);

int __cdecl Junction_TransferAllMagicFromSourceToTarget(int source_char, int target_char)
{
    int any_transferred; /* var_4, C7 44 24 10 imm32 */
    int remaining;      /* arg_0 slot reused, C7 44 24 18 20h */
    ff8_id_quantity_storage *slotp;
    int magic_id;
    int amount;
    int added;

    any_transferred = 0;
    /* lea eax,[ebx+ebx*8]; lea ecx,[ebx+eax*2]; lea edi,ds:1CFE0F8h[ecx*8] */
    slotp = SG_ARRAY_CHARA_DATA[source_char].Magic;
    remaining = 0x20;

    do {
        magic_id = (int)(signed char)slotp->id;     /* 0F BE 37 */
        amount = (int)(signed char)slotp->amount;    /* 0F BE 47 01 */
        slotp++; /* 47; 47 */

        if (magic_id != 0 && amount != 0) {
            added = MenuMagic_AddStockRaw(target_char, magic_id, amount);
            if (added != 0)
                any_transferred = 1; /* C7 44 24 10 1 */
            MenuMagic_RemoveStockRaw(source_char, magic_id, added);
        }

        remaining--; /* 8B 44 24 18; 48; 89 44 24 18 */
    } while (remaining != 0); /* 75 C2 */

    MenuMagic_PruneZeroStockAndJunctionRefs(source_char);
    MenuMagic_RebuildPartyDerivedState(source_char);
    MenuMagic_PruneZeroStockAndJunctionRefs(target_char);
    MenuMagic_RebuildPartyDerivedState(target_char);
    /* 8B 44 24 20 then add esp,10h */
    return any_transferred;
}
```
