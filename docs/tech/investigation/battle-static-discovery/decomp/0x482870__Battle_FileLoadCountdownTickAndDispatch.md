# Battle_FileLoadCountdownTickAndDispatch @ 0x482870

- Instr (live): 17
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=127
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=82
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=82
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Battle_FileLoadCountdownTickAndDispatch();
- Notes parent: slot `movsx word_1D2A200` × `0xC` ; si countdown WORD==0 marque `word_1D29A08=0xFFFF` puis call cdecl `dword_1D29A10` (`add esp,4`) avec `CURRENT_FIILE_READ_RESULT` ; **toujours** `dec` WORD `word_1D29A0A` à `loc_4828A7` ; EAX leftover ; 16 slots `battle_file_callback_2`.

## C réconcilié

```c
/* Battle_FileLoadCountdownTickAndDispatch @ 0x482870
 * Ground truth = live ASM (asm_clean.asm). 17 instr.
 * cdecl int(); EAX leftover (movsx index, 0 if null cb, or cb return).
 */

extern __int16 word_1D2A200;                 /* 0x1D2A200 ; WORD slot index */
extern __int16 word_1D29A08[];               /* 0x1D29A08 ; +0 WORD mark */
extern __int16 word_1D29A0A[];               /* 0x1D29A0A ; +2 WORD countdown */
extern int     CURRENT_FIILE_READ_RESULT[]; /* 0x1D29A0C ; +4 DWORD */
extern int     dword_1D29A10[];             /* 0x1D29A10 ; +8 completion cb */

int __cdecl Battle_FileLoadCountdownTickAndDispatch(void)
{
    int eax;
    int off;
    int (__cdecl *cb)(int);

    /* movsx eax, word_1D2A200 */
    eax = (int)(__int16)word_1D2A200;
    /* lea esi,[eax+eax*2]; shl esi,2  => slot * 0xC ; 16 slots */
    off = (eax + eax * 2) << 2;

    /* cmp word_1D29A0A[esi], 0 ; jnz loc_4828A7 */
    if (*(__int16 *)((char *)word_1D29A0A + off) == 0) {
        /* 66 C7 : WORD store 0xFFFF */
        *(__int16 *)((char *)word_1D29A08 + off) = (__int16)0xFFFF;
        eax = *(int *)((char *)dword_1D29A10 + off);
        cb = (int (__cdecl *)(int))eax;
        if (eax != 0) {
            /* push CURRENT_FIILE_READ_RESULT[esi] ; call eax ; add esp, 4 */
            eax = cb(*(int *)((char *)CURRENT_FIILE_READ_RESULT + off));
        }
        /* else eax already 0 (null cb) */
    }

    /* loc_4828A7: always WORD dec, including fire (0 -> 0xFFFF) */
    --*(__int16 *)((char *)word_1D29A0A + off);
    return eax;
}
```
