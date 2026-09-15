# BattleModel_AdvanceH4Frame @ 0x50C950

- Instr (live): 68
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1068 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=985 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=191 (effort_used=high)
- A==B: non
- Push IDB: oui
- SetType: char *__cdecl BattleModel_AdvanceH4Frame(int actor, int h4Index)
- Notes parent: pas occupancy 1+2 ni test [actor],2. Table u16 [[actor+84h]+30h]. BYTE rec[5] count / [6] mode / [7] counter. cmp al,8 : ==8 modulo (c+1)%(n+1) sans shr; sinon lea 8+8*n idiv puis shr 3. Store BYTE [esi+7]. Shared loc_50C9DC cmp edx,edi. Apply add esp,0Ch. Scroll si count==0 (edi non poussé). jz only, cdq idiv SIGNED. EAX leftover. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleModel_AdvanceH4Frame @ 0x50C950
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 68 instr, size 0xB4, end 0x50CA04. cdecl, 2 args. retn C3. No local frame.
 * Saved EBX EBP ESI. EDI pushed only after rec[5]!=0 (50c98b).
 * Callees: ApplyH4UvSlot add esp,0Ch; ScrollH4SlotV add esp,0Ch.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / stride 0x9C: absent.
 * No BYTE [actor] test 2 (unlike ApplyH4UvSlot).
 * Widths: BYTE 8A/88/3C/84; WORD 66 table; DWORD ptrs. Store [esi+7] BYTE 88 56 07.
 * No ja/jg/jl/setcc/jpt. Only jz. cdq+idiv SIGNED.
 * loc_50C9BF falls through loc_50C9DC (no shr). !=8 path shr edi/edx,3 then jmp.
 * Apply success: own pop esi/ebp/ebx/retn, does NOT fall loc_50CA00.
 * loc_50C9F0: edi never pushed; falls into loc_50CA00. EAX leftover.
 * No domain::.
 */

char *__cdecl BattleModel_ApplyH4UvSlot(int actor, int h4Index, int frame);
char *__cdecl BattleModel_ScrollH4SlotV(int actor, int h4Index, __int16 delta);

char *__cdecl BattleModel_AdvanceH4Frame(int actor, int h4Index)
{
    unsigned short *table;
    unsigned short off;
    unsigned char *rec;
    unsigned int count;
    unsigned int mode;
    unsigned int counter;
    unsigned int oldIdx;
    unsigned int newIdx;
    int dividend;
    int divisor;
    int rem;
    int quot;

    table = *(unsigned short **)(*(unsigned int *)(actor + 0x84) + 0x30);
    /* 8B 83 84 00 00 00; 8B 40 30 */
    if (table == 0) /* 85 C0 / 0F 84 loc_50CA00 */
        return (char *)0; /* EAX leftover 0 */

    off = table[h4Index]; /* 66 8B 34 68 */
    if (off == 0) /* 66 85 F6 / 0F 84 loc_50CA00 */
        return (char *)table; /* EAX leftover = table */

    rec = (unsigned char *)table + off; /* 81 E6 FFFF0000 / 03 F0 */

    count = rec[5]; /* 8A 4E 05 */
    if (count == 0) { /* 84 C9 / 74 loc_50C9F0; edi not pushed */
        /* 33 C0 / 8A 46 06 / 50 / 55 / 53 / E8 Scroll / 83 C4 0C / loc_50CA00 */
        return BattleModel_ScrollH4SlotV(actor, h4Index, (__int16)rec[6]);
    }

    mode = rec[6]; /* 8A 46 06; 57 push edi; 3C 08 */
    counter = rec[7];

    if (mode == 8) { /* 74 loc_50C9BF; fallthrough loc_50C9DC, NO shr */
        /* 33 D2; 81 E1 FF000000; 8A 56 07; 41; 8B FA; 8D 47 01; 99; F7 F9 */
        dividend = (int)(counter + 1);
        divisor = (int)(count + 1);
        quot = dividend / divisor;
        rem = dividend % divisor;
        rec[7] = (unsigned char)rem; /* 88 56 07 */
        newIdx = (unsigned int)rem & 0xFFu; /* 81 E2 FF000000; no C1 EA 03 */
        oldIdx = counter; /* edi = old [esi+7], unshifted */
    } else {
        /* loc_50C990: 25 FF000000; 8A 56 07; 81 E1 FF000000; 03 C2; 8B FA */
        dividend = (int)(mode + counter);
        divisor = (int)(8 * (count + 1)); /* 8D 0C CD 08 00 00 00 lea ecx,[ecx*8+8] */
        quot = dividend / divisor; /* 99 cdq; F7 F9 idiv SIGNED */
        rem = dividend % divisor;
        oldIdx = counter >> 3; /* C1 EF 03 BEFORE store */
        rec[7] = (unsigned char)rem; /* 88 56 07 */
        newIdx = ((unsigned int)rem & 0xFFu) >> 3; /* 81 E2; C1 EA 03 */
    }

    /* loc_50C9DC: 3B D7 / 5F pop edi / 74 loc_50CA00 */
    if (newIdx == oldIdx)
        return (char *)quot; /* EAX leftover = idiv quotient */

    /* 52 push edx (newIdx) / 55 ebp / 53 ebx / E8 Apply / 83 C4 0C */
    return BattleModel_ApplyH4UvSlot(actor, h4Index, (int)newIdx);
}
```
