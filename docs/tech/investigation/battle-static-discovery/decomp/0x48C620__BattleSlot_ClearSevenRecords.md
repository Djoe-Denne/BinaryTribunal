# BattleSlot_ClearSevenRecords @ 0x48C620

- Instr (live): 22
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=214
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=20
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=183
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleSlot_ClearSevenRecords(void)
- Notes parent: stride ASM 0xD0 (pas F_CHAR 0x1D0). 7 records: 0x1D27B90+7*0xD0=0x1D28140, pas preuve cardinalité. Cursor status_1. BYTE +3Bh=FF ; DWORD 89 [edx-4] ; BYTE OR [edx],1 ; BYTE +38h/+39h ; WORD 66 +4 et +4Ch ; BYTE +4Ah. lea-2Ch puis add 0D0h puis 8 stosd 0xFBA9FBA9 (timer +0x54). cmp puis stosd (flags) jl 7C signé. EAX leftover. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleSlot_ClearSevenRecords @ 0x48C620
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 22 instr, size 0x44. IDA type int(). No domain::.
 * BATTLE_SLOT stride 0xD0 (not F_CHAR 0x1D0). Cursor = status_1 (+0x80).
 * 0x1D28140 - 0x1D27B90 = 0x5B0 = 7 * 0xD0. Seven records only; this
 * function does not prove total logical slot cardinality.
 * Widths: BYTE C6/88/80 ; DWORD 89 at [edx-4] (no 66) ; WORD 66 89 at +4
 * and +4Ch. No packed struct. No setcc. jl opcode 7C signed (not ja/jg).
 * cmp then rep stosd (flags live). EAX leftover 0xFBA9FBA9. No callees.
 */

extern unsigned char BATTLE_SLOT_DATA[];           /* 0x1D27B10 */
extern unsigned char END_MONSTER_DATA_IN_BATTLE[]; /* 0x1D28140 */

int __cdecl BattleSlot_ClearSevenRecords(void)
{
    unsigned char *edx; /* cursor = &status_1 */
    unsigned int ebx;   /* xor ebx,ebx */
    unsigned int *edi;  /* lea edi,[edx-2Ch] */
    int ecx;
    unsigned int eax;

    edx = &BATTLE_SLOT_DATA[0x80]; /* imm 0x1D27B90 */
    ebx = 0;

    do {
        edx[0x3B] = 0xFF;                                      /* BYTE +0xBB */
        *(unsigned int *)(edx - 4) = ebx;                     /* DWORD +0x7C */
        *edx |= 1u;                                            /* BYTE OR Death */
        edx[0x39] = (unsigned char)ebx;                       /* BYTE +0xB9 */
        edx[0x38] = (unsigned char)ebx;                       /* BYTE +0xB8 */
        *(unsigned short *)(edx + 4) = (unsigned short)ebx;    /* WORD +0x84 */
        edx[0x4A] = (unsigned char)ebx;                       /* BYTE +0xCA */
        *(unsigned short *)(edx + 0x4C) = (unsigned short)ebx; /* WORD +0xCC */
        edi = (unsigned int *)(edx - 0x2C);                   /* timer +0x54 */
        edx += 0xD0;
        ecx = 8;
        eax = 0xFBA9FBA9u;
        /* cmp edx, END_MONSTER_DATA_IN_BATTLE ; flags preserved across stosd */
        do {
            *edi++ = eax;
        } while (--ecx);
    } while ((int)edx < (int)END_MONSTER_DATA_IN_BATTLE); /* jl 7C */

    return (int)eax;
}
```
