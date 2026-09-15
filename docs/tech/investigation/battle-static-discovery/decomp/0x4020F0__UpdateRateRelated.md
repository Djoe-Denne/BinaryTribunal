# UpdateRateRelated @ 0x4020F0

- Instr (live): 103
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=2894
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2458
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2378
- A==B: non
- Push IDB: oui
- SetType: int __cdecl UpdateRateRelated()
- Notes parent: Limiteur 15 fps. sub_40AA62 cdecl arg0=current arg1=prev arg2=dest. K*D FSTP double 0x1A78BE0. FCOM test ah,41h jz=ST>mem. Sleep stdcall + __ftol. Return 0/1. Pas de ja/jg. Occupancy 1+2 / 0xD0 / 0x1D0 / GF+0x44 absents. A uint64 FSTP faux; A/C ordre dest; B/C sans __ftol.

## C réconcilié

```c
/* UpdateRateRelated @ 0x4020F0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 103 instr, size 0x193, end 0x402283. cdecl, 0 args, retn C3. No saved regs.
 * Frame sub esp,10h / add esp,10h. add esp,14h = 5 cdecl args (1+3+1).
 * Sleep stdcall: no add esp. Post-Sleep timeGetTime: add esp,4.
 * FCOM: test ah,41h; jz iff ST > mem; jnz iff ST <= mem. No ja/jg.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 absent.
 * No domain::.
 */

int __cdecl au_re_timeGetTime(int);
__int64 __cdecl sub_40AA62(_QWORD *, _QWORD *, _QWORD *);
double __cdecl sub_40AAEF(unsigned int *);
__int64 __ftol(double);
void __stdcall Sleep(unsigned int);

extern _DWORD dword_1A78BD8;
extern _DWORD dword_1A78BDC;
extern double dbl_1A78BE8;
extern double dbl_1A78BF0;
extern _DWORD dword_1A78BF8;
extern double timer_volume_change_related_dbl_1A788B8;
extern double dbl_1A78C00;
extern double dbl_1A78C08;
extern _DWORD dword_1A78C10;

int __cdecl UpdateRateRelated()
{
    _QWORD var_10; /* [esp+0] current timestamp, low+high (var_10 / var_C) */
    _QWORD var_8; /* [esp+8] 64-bit delta */
    double D;
    double LIMIT;
    double leftover;
    unsigned int ms;
    int result;

    au_re_timeGetTime((int)&var_10);
    /* cdecl: arg0=current, arg1=prev, arg2=dest. *dest = *current - *prev */
    sub_40AA62(&var_10, (_QWORD *)&dword_1A78BD8, &var_8);
    D = sub_40AAEF((unsigned int *)&var_8);

    /* fld K; fmul st,st(1); fstp QWORD timer_volume_change_related_dbl_1A788B8 */
    timer_volume_change_related_dbl_1A788B8 = dbl_1A78BF0 * D;

    if (dword_1A78BF8 != 0) {
        dbl_1A78C08 = D;
        dword_1A78C10 = 1;
        dword_1A78BF8 = 0;
        result = 0;
        goto loc_40226B;
    }

    if (dword_1A78C10 != 0) {
        /* fld T; fadd st,st; fsub C00; fsub C08 */
        LIMIT = (dbl_1A78BE8 + dbl_1A78BE8) - dbl_1A78C00 - dbl_1A78C08;
        /* fcomp D vs LIMIT; jz loc_4021B1 iff D > LIMIT */
        if (D > LIMIT) {
            leftover = D - LIMIT;
            dbl_1A78C00 = leftover;
            /* fcomp leftover vs T; jnz skip clamp iff leftover <= T */
            if (leftover > dbl_1A78BE8)
                dbl_1A78C00 = dbl_1A78BE8; /* two DWORD movs */
            dword_1A78C10 = 0;
            dword_1A78BF8 = 1;
            result = 1;
            goto loc_40226B;
        }
        ms = (unsigned int)__ftol((LIMIT - D) * dbl_1A78BF0);
        Sleep(ms);
        au_re_timeGetTime((int)&var_10);
        dword_1A78BF8 = 0;
        dword_1A78C10 = 0;
        result = 0;
        goto loc_40226B;
    }

    /* loc_4021F8: fcom T (no pop); jz loc_402232 iff D > T */
    if (D > dbl_1A78BE8) {
        leftover = D - dbl_1A78BE8;
        dbl_1A78C00 = leftover;
        if (leftover > dbl_1A78BE8)
            dbl_1A78C00 = dbl_1A78BE8;
        result = 1;
        dword_1A78BF8 = result;
        goto loc_40226B;
    }
    ms = (unsigned int)__ftol((dbl_1A78BE8 - D) * dbl_1A78BF0);
    Sleep(ms);
    au_re_timeGetTime((int)&var_10);
    result = 0;
    dword_1A78BF8 = result;

loc_40226B:
    dword_1A78BD8 = (_DWORD)var_10;
    dword_1A78BDC = (_DWORD)(var_10 >> 32);
    return result;
}
```
