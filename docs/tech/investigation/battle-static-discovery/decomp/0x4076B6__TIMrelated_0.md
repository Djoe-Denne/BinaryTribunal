# TIMrelated_0 @ 0x4076B6

- Instr (live): 112
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=7
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=306
- A==B: non
- Push IDB: oui
- SetType: _DWORD *__cdecl TIMrelated_0(int bind_id, int tim_mode, char *path, int *desc, int upload_key)
- Notes parent: jz/jnz only. Cache desc+28h skip TextureRelated. BYTE tex+0xCC si flags&0x20, DWORD tex+0xD0=desc+68h. SetTIMDescFlags(1,mode,desc+20h,tim) add 10h. Copy dest=tex src=tim add 8. TextureRelated2 add 0Ch. Succès DWORD +10h/+14h + TIMrelated(var_C valeur). Fail: sub_41ABFD si +28h==0 puis au_re, return 0. EAX=tim_desc. Copie TextureRelated depuis EAX pas var_30. Occupancy/stride TIM 0x10/slot 0xD0/GF+44 absents.

## C réconcilié

```c
/* TIMrelated_0 @ 0x4076B6
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 112 instr, size 0x157, end 0x40780D. IDA type _DWORD *__cdecl(int, int, char *, int *, int).
 * cdecl, 5 args, retn C3. EBP frame. sub esp,30h.
 * JCC: jz/jnz only (74/0F84/75/0F85). No ja/jg/setcc/jpt.
 * BYTE store C6 81 CC 00 00 00 01 at tex+0xCC. All other stores DWORD. No 66.
 * Occupancy 1+2 / TIM queue stride 0x10 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists +0x44: absent.
 *   desc[0]&0x20 is bit 5, not occupancy. tex+0xD0 is a field, not slot stride.
 *   +10h/+14h are TIM-desc fields on the 0x64 calloc blob, not battle TIM queue.
 *   Gfx_CopyDescFields92_68 may read src+0x44 (TIM-desc DWORD=4); that is not GF Exists.
 * TextureRelated EAX is the 3-dword source (not the lea var_30 buffer).
 * TIMrelated gets the VALUE of var_C, not &var_C.
 */

extern _DWORD *Render_sub_4070E2(void);
extern int *__cdecl TextureRelated(int *out_buf, _DWORD *desc, char *path);
extern void __cdecl Gfx_SetTIMDescFlags(int, int, int, _DWORD *);
extern void __cdecl Gfx_CopyDescFields92_68(_DWORD *dest, _DWORD *src);
extern int __cdecl TextureRelated2(int *desc, int tex, int upload_key);
extern void __cdecl TIMrelated(void *);
extern int __cdecl sub_41ABFD(int *triple);
extern void __cdecl au_re_CompilerDebug(void *);

_DWORD *__cdecl TIMrelated_0(int bind_id, int tim_mode, char *path, int *desc, int upload_key)
{
    int out_buf[3];           /* var_30 lea, passed to TextureRelated */
    int *loaded;              /* EAX after TextureRelated */
    int load0;                /* var_24 */
    int load1;                /* var_20 */
    int load2;                /* var_1C */
    int upload_res;           /* var_18 */
    int fail;                 /* var_14 */
    int triple[3];            /* var_10 / var_C / var_8 */
    _DWORD *tim_desc;         /* var_4 */
    unsigned char *tex;

    tim_desc = Render_sub_4070E2();
    if (tim_desc == 0)
        goto loc_407806;

    if (desc[0x28 / 4] != 0) {
        triple[0] = 0;
        triple[1] = 0;
        triple[2] = desc[0x28 / 4];
    } else {
        loaded = TextureRelated(out_buf, (_DWORD *)desc, path);  /* add esp,0Ch */
        load0 = loaded[0];
        load1 = loaded[1];
        load2 = loaded[2];
        triple[0] = load0;
        triple[1] = load1;
        triple[2] = load2;
    }

    fail = triple[0];
    if (fail != 0)
        goto loc_4077D1;

    tex = (unsigned char *)triple[2];
    if (tex != 0) {
        if (desc[0] & 0x20)
            tex[0xCC] = 1;                                      /* BYTE C6 81 CC... */
        *(unsigned int *)(tex + 0xD0) = (unsigned int)desc[0x68 / 4];
    }

    Gfx_SetTIMDescFlags(1, tim_mode, desc[0x20 / 4], tim_desc); /* add esp,10h */
    Gfx_CopyDescFields92_68((_DWORD *)tex, tim_desc);           /* add esp,8 */
    upload_res = TextureRelated2(desc, (int)tex, upload_key);   /* add esp,0Ch */
    if (upload_res != 0) {
        *(unsigned int *)((unsigned char *)tim_desc + 0x10) = (unsigned int)bind_id;
        *(unsigned int *)((unsigned char *)tim_desc + 0x14) = (unsigned int)upload_res;
        TIMrelated((void *)triple[1]);                          /* add esp,4; value of var_C */
        goto loc_4077D8;
    }

    fail = 1;
    goto loc_4077D8;

loc_4077D1:
    fail = 1;

loc_4077D8:
    if (fail == 0)
        goto loc_407806;

    if (desc[0x28 / 4] == 0)
        sub_41ABFD(triple);                                     /* add esp,4 */

    au_re_CompilerDebug(tim_desc);                              /* add esp,4 */
    tim_desc = 0;

loc_407806:
    return tim_desc;
}
```
