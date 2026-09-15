# TextureRelated2 @ 0x419D8F

- Instr (live): 34
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=6
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=6
- A==B: non
- Push IDB: oui
- SetType: int __cdecl TextureRelated2(int *desc, int tex, int upload_key)
- Notes parent: jz tex==0 puis upload_key==0 (pas ja/jg). DWORD desc+0x64 → tex+0x2C. FindTexture(desc,tex,upload_key) add 0Ch. Upload(desc,tex,find) add 0Ch. EAX=var_8. Occupancy/stride TIM 0x10/slot 0xD0/GF+44 absents. desc non testé.

## C réconcilié

```c
/* TextureRelated2 @ 0x419D8F
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 34 instr, size 0x5A, end 0x419DE9. IDA type int __cdecl(int *, int, int).
 * cdecl, 3 args, retn C3. EBP frame. sub esp,8.
 * JCC: jz only (74 40 / 74 3A). No ja/jg/setcc/jpt.
 * DWORD stores only (C7 45 F8, 89 50 2C, 89 45 FC, 89 45 F8). No 66. No BYTE/WORD.
 * Occupancy 1+2 / TIM queue stride 0x10 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists +0x44: absent.
 *   Battle TIM queue stride 0x10 is a different system; this body does not enqueue.
 *   desc+0x64 read / tex+0x2C store are engine-cache fields, not GF Exists.
 * EAX designed return = var_8 (0 if tex==0 or upload_key==0, else Upload EAX).
 * arg_0 (desc) is never compared to 0.
 */

extern int __cdecl Texture_FindTexture(int *, int, int);
extern int __cdecl Texture_UploadRefcountOrReuse(int, int, int);

int __cdecl TextureRelated2(int *desc, int tex, int upload_key)
{
    int var_8;                               /* ebp-8, init 0, returned in EAX */
    int var_4;                               /* ebp-4, FindTexture EAX */

    var_8 = 0;                               /* C7 45 F8 00 00 00 00 */

    if (tex == 0)                            /* 83 7D 0C 00 ; jz loc_419DE2 */
        return var_8;
    if (upload_key == 0)                    /* 83 7D 10 00 ; jz loc_419DE2 */
        return var_8;

    *(unsigned int *)((unsigned char *)tex + 0x2C) =
        *(unsigned int *)((unsigned char *)desc + 0x64);  /* 8B 51 64 / 89 50 2C */

    var_4 = Texture_FindTexture(desc, tex, upload_key);    /* add esp,0Ch */
    var_8 = Texture_UploadRefcountOrReuse((int)desc, tex, var_4); /* add esp,0Ch */

    return var_8;                           /* loc_419DE2: 8B 45 F8 */
}
```
