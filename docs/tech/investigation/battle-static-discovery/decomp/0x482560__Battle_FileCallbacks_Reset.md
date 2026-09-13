# Battle_FileCallbacks_Reset @ 0x482560

- Instr (live): 13
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_FileCallbacks_Reset();
- Notes parent: `rep stosd` 16 DWORDS `battle_file_callback_2` (ecx=10h) ; WORD `word_1D29AD0=0` ; boucle `loc_48257E` WORD `[edx]=0` stride `0xC` jusqu’à `&dword_1D29AC8` via `jl` signed (16 slots, pas le record 12 o entier) ; aucun call/`add esp` ; EAX=0.

## C réconcilié

```c
/* Battle_FileCallbacks_Reset @ 0x482560
 * Ground truth = live ASM (asm_clean.asm). 13 instr.
 * cdecl int(); EAX leftover 0 from xor eax,eax (stosd does not change EAX).
 */

#include <string.h>

extern int     battle_file_callback_2[16]; /* 0x1D29638 ; IDA int[16] */
extern __int16 word_1D29AD0;               /* 0x1D29AD0 ; 66-prefix WORD */
extern __int16 word_1D29A08;               /* 0x1D29A08 ; first WORD of 0xC records */
extern int     dword_1D29AC8;           /* 0x1D29AC8 exclusive end ADDRESS */

int __cdecl Battle_FileCallbacks_Reset(void)
{
    __int16 *p;

    /* push edi; ecx=10h; xor eax,eax; edi=&battle_file_callback_2; rep stosd */
    memset(battle_file_callback_2, 0, 16 * sizeof(int));

    word_1D29AD0 = 0; /* 66 C7 05 d0 9a d2 01 00 00 */

    /* edx=&word_1D29A08; pop edi */
    p = &word_1D29A08;
    /* loc_48257E: word ptr [edx]=0 (66 C7 02); add edx,0Ch;
     * cmp edx, offset dword_1D29AC8; jl (signed, exclusive end).
     * 16 iters: (0x1D29AC8-0x1D29A08)/0xC = 16. Does not clear +2/+8. */
    while ((int)p < (int)&dword_1D29AC8) {
        *p = 0;
        p = (__int16 *)((char *)p + 0xC);
    }

    return 0;
}
```
