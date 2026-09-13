# BattleSwirl_CaptureFrame @ 0x56D390

- Instr (live): 139
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1052
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=744
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1163
- A==B: non
- Push IDB: non (skip tag glm-triple déjà présent)
- SetType: int __cdecl BattleSwirl_CaptureFrame(int start_x, int start_y, int src_w, int src_h)
- Notes parent: C GLM double-deref dword_209ADE8. Lock vtbl+64h 5 stdcall flags 11h/21h. Unlock +80h. Alt 22/23 ssi BA8==0 ET ebp==0. dest arena dword_209AEC8 DWORD. EAX -1/0. Occupancy/0xD0/0x1D0/GF+0x44 absents.

## C réconcilié

```c
/* BattleSwirl_CaptureFrame @ 0x56D390
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 139 instr, size 0x193, end 0x56D523. IDA type was void __cdecl(int,int,int,int);
 * ASM returns EAX (-1 / 0) so SetType uses int.
 * cdecl, 4 args. Saved EBX EBP ESI EDI. sub esp,0FCh. retn C3.
 * COM Lock stdcall 5 args vtable+0x64; Unlock stdcall 2 args vtable+0x80.
 * DD_ErrorMessage add esp,0Ch; Resample256 add esp,1Ch; Alt22/23 pair add esp,10h.
 * DDSURFACEDESC 0x7C: dwSize@+0 DWORD, lPitch@+0x10, lpSurface@+0x24. No packed struct.
 * All stores DWORD (C7 44 / C7 84 / 89). No 66 prefix. No setcc. No ja/jg. No jpt.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No domain::.
 */

extern int dword_209ADE8;
extern int dword_209AEC8; /* IDA name dest; 256x256 16bpp arena */

extern int __cdecl FFGetBufferAddress(void);
extern int __cdecl DD_ErrorMessage(int hr, const char *file, int line);
extern int __cdecl BattleSwirl_Resample256(int src, int pitch, int start_x, int start_y, int src_w, int src_h, int dest);
extern int __cdecl sub_4203B2(int nested_plus14, int engine);
extern int __cdecl sub_420476(int nested_plus14, int engine);

typedef int (__stdcall *DDS_LockFn)(int this, void *rect, void *desc, int flags, int event);
typedef int (__stdcall *DDS_UnlockFn)(int this, void *rect);

int __cdecl BattleSwirl_CaptureFrame(int start_x, int start_y, int src_w, int src_h)
{
    unsigned char src_desc[0x7C];  /* var_F8 */
    unsigned char dest_desc[0x7C]; /* var_7C = src+0x7C */
    int engine;                     /* ebx */
    int nested;                    /* var_FC = [*(dword_209ADE8+10h)+14h] */
    int dest_sel;                   /* ebp = [engine+0BECh] */
    int src_surf;                   /* esi = [engine+7Ch] */
    int dest_surf;                  /* edi */
    int hr;

    engine = FFGetBufferAddress();

    nested = *(int *)(*(int *)(dword_209ADE8 + 0x10) + 0x14);
    dest_sel = *(int *)(engine + 0xBEC);
    src_surf = *(int *)(engine + 0x7C);

    /* test ebp; jz loc_56D3C2 -> [nested+0]; else [nested+8] */
    if (dest_sel != 0)
        dest_surf = *(int *)(nested + 8);
    else
        dest_surf = *(int *)nested;

    *(int *)(src_desc + 0) = 0x7C; /* dwSize DWORD */
    hr = (*(DDS_LockFn *)(*(int *)src_surf + 0x64))(src_surf, 0, src_desc, 0x11, 0);
    if (DD_ErrorMessage(hr, "C:\\FF8\\Common\\psx2ssi\\ssimotionblur.cpp", 0x7C) == 0)
        return -1; /* or eax,-1 ; no unlock */

    /* [ebx+0BA8h] ; jnz loc_56D4D2 */
    if (*(int *)(engine + 0xBA8) == 0) {
        *(int *)(dest_desc + 0) = 0x7C;
        hr = (*(DDS_LockFn *)(*(int *)dest_surf + 0x64))(dest_surf, 0, dest_desc, 0x21, 0);
        if (DD_ErrorMessage(hr, "C:\\FF8\\Common\\psx2ssi\\ssimotionblur.cpp", 0x82) == 0) {
            (*(DDS_UnlockFn *)(*(int *)src_surf + 0x80))(src_surf, 0);
            return -1;
        }

        BattleSwirl_Resample256(
            *(int *)(src_desc + 0x24), /* lpSurface */
            *(int *)(src_desc + 0x10), /* lPitch */
            start_x,
            start_y,
            src_w,
            src_h,
            *(int *)(dest_desc + 0x24));

        (*(DDS_UnlockFn *)(*(int *)dest_surf + 0x80))(dest_surf, 0);
        (*(DDS_UnlockFn *)(*(int *)src_surf + 0x80))(src_surf, 0);

        if (dest_sel == 0) {
            sub_4203B2(nested, engine); /* Alt slot 22 */
            sub_420476(nested, engine); /* Alt slot 23 */
        }
        return 0; /* xor eax,eax */
    }

    BattleSwirl_Resample256(
        *(int *)(src_desc + 0x24),
        *(int *)(src_desc + 0x10),
        start_x,
        start_y,
        src_w,
        src_h,
        dword_209AEC8);

    (*(DDS_UnlockFn *)(*(int *)src_surf + 0x80))(src_surf, 0);
    return 0; /* loc_56D516 */
}
```
