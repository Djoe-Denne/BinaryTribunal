# Camera_BlendLookAtAndWorldXZ_Word3 @ 0x6FC250

- Instr (live): 56
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: _WORD *__cdecl Camera_BlendLookAtAndWorldXZ_Word3(unsigned __int16 *, unsigned __int16 *, int, int, int, int)
- Notes parent: 6 args ; envelope WORD `66 A3` → `word_1D977A2` ; Q12 `t=(t_num<<12)/(duration-1)` ; ESI=t EDI=KEEP (inverse 0x657DF0) ; KEEP `sub_45E9D0` puis MAC `sub_45EBF0` ; LookAt `0xB8B7F8` puis world `0xB8B7F0` ; `add ebx/ebp,6` byte ; `add esp,28h` = 10 pushes ; EAX leftover last Get ; occupancy/0xD0 absents.

## C réconcilié

```c
/* Camera_BlendLookAtAndWorldXZ_Word3 @ 0x6FC250
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 56 instr, size 0xA6, end 0x6FC2F6. cdecl, 6 args. Saved EBX EBP ESI EDI. retn C3.
 * add esp,28h = 10 cdecl pushes (keep, src_a, t, src_b, LookAt, keep, src_a+6, t, src_b+6, world).
 * sub_45E9D0 / sub_45EBF0 take 0 stack args. KEEP then MAC; scale is dword_1CA8A30, not IR0.
 * After Q12: ESI=t, EDI=0x1000-t (KEEP). Do not copy 0x657DF0 register assignment.
 * Envelope WORD 66 A3 → word_1D977A2 @ 0x1D977A2. imul/idiv SIGNED (cdq).
 * add ebx,6 / add ebp,6 = BYTE +6 (next Word3). GetWord3 writes 3 WORDs +0/+2/+4.
 * Dest LookAt @ 0xB8B7F8 then world @ 0xB8B7F0. EAX leftover = last GetWord3 dest.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * Linear; no loc_/jpt_/setcc; no ja/jg. No domain::.
 */

extern _WORD word_1D977A2; /* 0x1D977A2, WORD store AX */
extern _WORD Battle_Camera_LookAt_XZ_s16[]; /* 0xB8B7F8 */
extern _WORD Battle_Camera_world_XZ_s16[];  /* 0xB8B7F0 */

extern int __cdecl GteState_Set_1CA8A30(int);
extern unsigned __int16 *__cdecl GteState_SetWord3_1CA8A34(unsigned __int16 *);
extern int sub_45E9D0(void);
extern int sub_45EBF0(void);
extern _WORD *__cdecl GteState_GetWord3_1CA8A34(_WORD *);

_WORD *__cdecl Camera_BlendLookAtAndWorldXZ_Word3(
    unsigned __int16 *src_a,
    unsigned __int16 *src_b,
    int start,
    int end,
    int t_num,
    int duration)
{
    int denom;
    int t;
    int keep;

    denom = duration - 1; /* lea ecx,[eax-1] */

    /* 66 A3: WORD AX only. imul eax,edi then cdq/idiv ecx SIGNED. */
    word_1D977A2 = (_WORD)(start + (end - start) * t_num / denom);

    t = (t_num << 12) / denom; /* shl eax,0Ch ; cdq ; idiv ecx. ESI */
    keep = 0x1000 - t;        /* EDI */

    GteState_Set_1CA8A30(keep);
    GteState_SetWord3_1CA8A34(src_a);
    sub_45E9D0();
    GteState_Set_1CA8A30(t);
    GteState_SetWord3_1CA8A34(src_b);
    sub_45EBF0();
    GteState_GetWord3_1CA8A34(Battle_Camera_LookAt_XZ_s16);

    GteState_Set_1CA8A30(keep);
    src_a = (unsigned __int16 *)((char *)src_a + 6);
    GteState_SetWord3_1CA8A34(src_a);
    sub_45E9D0();
    GteState_Set_1CA8A30(t);
    src_b = (unsigned __int16 *)((char *)src_b + 6);
    GteState_SetWord3_1CA8A34(src_b);
    sub_45EBF0();
    return GteState_GetWord3_1CA8A34(Battle_Camera_world_XZ_s16);
}
```
