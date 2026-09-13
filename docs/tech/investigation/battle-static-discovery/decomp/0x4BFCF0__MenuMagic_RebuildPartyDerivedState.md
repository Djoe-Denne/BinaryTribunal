# MenuMagic_RebuildPartyDerivedState @ 0x4BFCF0

- Instr (live): 17
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=34
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=34
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=80
- A==B: non
- Push IDB: oui
- SetType: __int16 __cdecl MenuMagic_RebuildPartyDerivedState(int char_id)
- Notes parent: loop eax 0..2 signed jl. BYTE save/blank SG_PARTY_BATTLE then BYTE scratch 1D771A4[eax]. cl=0xFF. call sub_4BFB40(char_id) add esp,4 AL unused. Restore WORD then BYTE. Tail jmp sub_495EF0. Occupancy/GetRandomInt/0xD0/0x1D0 absents.

## C réconcilié

```c
/* MenuMagic_RebuildPartyDerivedState @ 0x4BFCF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 17 instr, size 0x48, end 0x4BFD38. IDA type __int16 __cdecl(int).
 * Slot 0xD0 / F_CHAR 0x1D0 / occupancy 1+2 / GetRandomInt / GF Exists 0x44: unused.
 * jl signed vs 3 (7C E8). No ja/jg/setcc/jpt.
 * add esp,4 after sub_4BFB40 (1 cdecl arg). Tail jmp E9 sub_495EF0.
 * Loop BYTE 8A/88; restore 66-prefix WORD then BYTE. cl=0xFF (B1 FF).
 */

extern unsigned char SG_PARTY_BATTLE[4]; /* 0x1CFE74C; bytes 0..2 used */
extern unsigned short word_1D771A4;      /* 0x1D771A4 */
extern unsigned char byte_1D771A6;       /* 0x1D771A6 */

char __cdecl sub_4BFB40(int char_id);
__int16 __cdecl sub_495EF0(void);

__int16 __cdecl MenuMagic_RebuildPartyDerivedState(int char_id)
{
    int i;
    unsigned char blank;
    unsigned char saved;

    i = 0;
    blank = 0xFF; /* B1 FF once, reused as cl */
    do {
        saved = SG_PARTY_BATTLE[i];
        SG_PARTY_BATTLE[i] = blank;
        *((unsigned char *)&word_1D771A4 + i) = saved;
        ++i;
    } while (i < 3); /* cmp eax,3 / jl loc_4BFCF4 */

    sub_4BFB40(char_id); /* cdecl 1 arg; AL unused */

    *(unsigned short *)SG_PARTY_BATTLE = word_1D771A4; /* 66 8B CX / 66 89 CX */
    SG_PARTY_BATTLE[2] = byte_1D771A6;                  /* 8A DL / 88 DL */

    return sub_495EF0(); /* jmp, not call+ret */
}
```
