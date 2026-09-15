# Vec3S32_CrossQ12 @ 0x56BBF0

- Instr (live): 37
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=58
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=25
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=58
- A==B: non
- Push IDB: oui
- SetType: int __cdecl Vec3S32_CrossQ12(int *, int *, int *)
- Notes parent: IMUL r32 signé, SAR 12 (Q12). out.x=(ay*bz-az*by)>>12, out.y=(az*bx-ax*bz)>>12, out.z=(ax*by-ay*bx)>>12. EAX=out.z. Spill by sur slot arg_0. Occupancy 1+2 / 0xD0 / 0x1D0 / 0x44 absents. Pas d'appel, pas de Jcc. DWORD only.

## C réconcilié

```c
/* Vec3S32_CrossQ12 @ 0x56BBF0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 37 instr, size 0x5A, end 0x56BC4A. cdecl 3 int* args. retn C3.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: ABSENT.
 * No CALL / add esp. No 66 prefix. No setcc / jpt / Jcc.
 * IMUL r32 signed (low 32). SAR 12 = signed Q12. No domain::.
 * Spill: by overwritten onto the original arg_0 stack slot.
 * EAX at retn = out.z after SAR.
 */

int __cdecl Vec3S32_CrossQ12(int *a, int *b, int *out)
{
    int by;
    int ay;
    int bz;
    int az;
    int bx;
    int ax;
    int ox;
    int oy;
    int oz;

    by = b[1]; /* [ecx+4] */
    ay = a[1]; /* [eax+4] */
    bz = b[2]; /* [ecx+8] */
    az = a[2]; /* [eax+8] */
    bx = b[0]; /* [ecx] */
    ax = a[0]; /* [eax] */

    ox = (ay * bz - az * by) >> 12; /* IMUL; SUB; SAR EBP,0Ch */
    out[0] = ox;
    oy = (az * bx - ax * bz) >> 12; /* IMUL; SUB; SAR EBP,0Ch */
    oz = (ax * by - ay * bx) >> 12; /* IMUL; SUB; SAR EAX,0Ch */
    out[1] = oy; /* [ebx+4] after pop edi */
    out[2] = oz; /* [ebx+8] after pop esi */
    return oz;
}
```
