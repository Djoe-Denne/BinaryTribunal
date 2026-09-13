# MenuMagic_RemoveStockRaw @ 0x4C2D50

- Instr (live): 48
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=752
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=719
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=96
- A==B: non
- Push IDB: oui
- SetType: int __cdecl MenuMagic_RemoveStockRaw(int chara_idx, int magic_id, int delta);
- Notes parent: stride `chara_idx*0x98` (lea/shl). Magic 32×2 BYTE id/amount, pas 32×5. Occupancy 1+2 absente (match id only). GetRandomInt absent. `jl`/`jns` signés. Floor 0, pas de clamp 100. Junction 19 BYTEs depuis +0x5C. EAX leftover. Aucun CALL.

## C réconcilié

```c
/* MenuMagic_RemoveStockRaw @ 0x4C2D50
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 48 instr, size 0x71. cdecl. CharacterData stride 0x98. Magic 32x2.
 * EAX leftover (not qty removed): delta==0 -> chara_idx; not found -> 0x20;
 * remaining!=0 -> slot 0..31; remaining==0 -> 0x13 after junction sweep.
 */

extern unsigned char SG_ARRAY_CHARA_DATA[]; /* CharacterData[8] @ 0x1CFE0E8 */

int __cdecl MenuMagic_RemoveStockRaw(int chara_idx, int magic_id, int delta)
{
    unsigned char *chara;     /* CharacterData base: idx * 0x98 */
    unsigned char *stock;     /* ESI: current Magic {id,amount} pair */
    int slot;                 /* EAX during search / leftover return */
    int remaining;            /* EDX: signed amount - delta */
    int j;                    /* EAX during JunctionHP sweep */
    unsigned int jid;         /* EBX: zero-extended junction BYTE */

    /* lea ecx,[eax+eax*8]; lea ecx,[eax+ecx*2]; shl ecx,3 => chara_idx * 0x98 */
    chara = SG_ARRAY_CHARA_DATA + chara_idx * 0x98;
    stock = chara + 0x10;     /* Magic.id @ +0x10 (0x1CFE0F8), 32 x {BYTE id, BYTE amount} */

    if (delta == 0)           /* test edi,edi / jz loc_4C2DBD — no mutation */
        return chara_idx;

    slot = 0;                 /* xor eax,eax */
    while (magic_id != (int)(signed char)stock[0]) { /* 0F BE id; cmp ebp,edx; jz found */
        stock += 2;           /* add esi,2 */
        slot++;               /* inc eax */
        if (slot >= 0x20)     /* cmp eax,20h / jl loc_4C2D74 (signed) */
            return 0x20;      /* not found: EAX leftover 32 */
    }

    remaining = (int)(signed char)stock[1] - delta; /* movsx amount; sub edx,edi */
    if (remaining < 0)        /* jns loc_4C2D94; else xor edx,edx / jmp loc_4C2D98 */
        remaining = 0;        /* floor 0; no upper clamp 100 */

    if (remaining == 0) {     /* test edx,edx / jnz loc_4C2DBA */
        stock[0] = 0;         /* C6 06 00 clear id */
        j = 0;                /* xor eax,eax */
        do {
            jid = (unsigned char)chara[0x5C + j]; /* xor ebx,ebx; mov bl, JunctionHP[ecx+eax] */
            if ((int)jid == magic_id)             /* cmp ebx,ebp */
                chara[0x5C + j] = 0;              /* BYTE store 0 */
            j++;                                  /* inc eax */
        } while (j < 0x13);   /* cmp eax,13h / jl loc_4C2D9E (signed, 19 BYTEs) */
        slot = 0x13;          /* EAX leftover after sweep */
    }

    stock[1] = (unsigned char)remaining; /* 88 56 01 loc_4C2DBA shared BYTE amount store */
    return slot;
}
```
