# BattleMesh_RemapPrimitiveTPageBits @ 0x507550

- Instr (live): 159
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3375
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=5453
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=3887
- A==B: non
- Push IDB: oui
- SetType: int __cdecl BattleMesh_RemapPrimitiveTPageBits(int *p_mesh, char *p_tpage_table)
- Notes parent: Leaf cdecl 2 args (call site add esp,8). EDX scratch, pas usercall. Table 6: var_C=(al+0xE0)<<6 always; UNSIGNED al>=0x0C -> bit7=0x80 / CLUT=al-2 else (al>>1)+10 / (al&1)<<7. jl SIGNED ecx<6. Skip verts movsx; align and al,0FCh. Pass 0x10: TPage+0xA |0x803F, CLUT+0xE |0xFFE0, bit7 +9/+0xD/+7. Pass 0x14: +0/+4, bit7 -1/+3/+7/+9. Gates UNSIGNED (tpage&0x3F)<0x10 et Y>>6 in [0xE0,0xF0). Index movsx sans clamp. ja/jg/setcc/occupancy/0xD0/0x1D0/0x44 absents. EAX leftover. Pas de Hex-Rays.

## C réconcilié

```c
/* BattleMesh_RemapPrimitiveTPageBits @ 0x507550
 * Ground truth = live ASM (asm_clean.asm) + dump_bytes, not Hex-Rays.
 * 159 instr, size 0x1E9, end 0x507739. cdecl 2 stack args, retn C3.
 * Call site 0x50753B: push table; push mesh; call; add esp,8. Caller discards EAX.
 * EDX scratch (xor dx,dx at 0x507560); not an incoming register arg.
 * Leaf: callees=[]. add esp,20h is local unwind only.
 * Locals: BYTE var_20[6], WORD var_18[6], WORD var_C[6] — not a packed struct.
 * Widths: 66 WORD TPage/CLUT; BYTE bit7; DWORD count/offset; and al,0FCh align.
 * ja/jg none. Unsigned jnb/jb on 0x0C / 0x10 / 0xE0 / 0xF0. Signed jl/jle on counts.
 * Occupancy 1+2 / slot 0xD0 / actor 0x9C / F_CHAR 0x1D0 / GFSG 0x44 / K_GF 0x84: absent.
 * No domain::. No packed mesh struct: live offsets +0x0A/+0x0E/+7/+9/+0xD and 0x10/0x14.
 */

int __cdecl BattleMesh_RemapPrimitiveTPageBits(int *p_mesh, char *p_tpage_table)
{
    unsigned char var_20[6];
    unsigned short var_18[6];
    unsigned short var_C[6];
    int remaining;
    int *p_off;
    unsigned char *cursor;
    int i;

    for (i = 0; i < 6; i++) {
        unsigned char al = (unsigned char)p_tpage_table[i];
        unsigned int edx = al;

        var_C[i] = (unsigned short)((edx + 0xE0u) << 6);
        if (al >= 0x0C) {
            var_20[i] = 0x80;
            var_18[i] = (unsigned short)(edx - 2u);
        } else {
            var_18[i] = (unsigned short)((al >> 1) + 10u);
            var_20[i] = (unsigned char)((al & 1u) << 7);
        }
    }

    remaining = *p_mesh;
    p_off = p_mesh + 1;
    if (remaining <= 0)
        return remaining;

    do {
        short nskip;
        short n16;
        short n20;

        cursor = (unsigned char *)p_mesh + (unsigned int)*p_off;
        p_off++;

        nskip = *(short *)cursor;
        cursor += 2;
        if (nskip > 0) {
            int k = nskip;
            do {
                short m = *(short *)(cursor + 2);
                cursor += 2;
                cursor += m * 6 + 2;
            } while (--k != 0);
        }

        cursor += 3;
        cursor = (unsigned char *)((unsigned int)cursor & 0xFFFFFFFCu);

        n16 = *(short *)cursor;
        n20 = *(short *)(cursor + 2);
        cursor += 2;
        cursor += 0xA;

        if (n16 > 0) {
            int k = n16;
            do {
                unsigned short w = *(unsigned short *)(cursor + 0xA);
                unsigned char low6 = (unsigned char)(w & 0x3F);
                unsigned short y = (unsigned short)(w >> 6);

                if (low6 < 0x10 && y >= 0xE0 && y < 0xF0) {
                    int idx = (int)(short)(y - 0xE0);
                    unsigned char b7;

                    *(unsigned short *)(cursor + 0xA) =
                        (unsigned short)(var_C[idx] | (w & 0x803F));
                    w = *(unsigned short *)(cursor + 0xE);
                    *(unsigned short *)(cursor + 0xE) =
                        (unsigned short)(var_18[idx] | (w & 0xFFE0));
                    b7 = var_20[idx];
                    cursor[9] = (unsigned char)((cursor[9] & 0x7F) | b7);
                    cursor[0xD] = (unsigned char)((cursor[0xD] & 0x7F) | b7);
                    cursor[7] = (unsigned char)((cursor[7] & 0x7F) | b7);
                }
                cursor += 0x10;
            } while (--k != 0);
        }

        if (n20 > 0) {
            int k = n20;
            cursor += 0xA;
            do {
                unsigned short w = *(unsigned short *)cursor;
                unsigned char low6 = (unsigned char)(w & 0x3F);
                unsigned short y = (unsigned short)(w >> 6);

                if (low6 < 0x10 && y >= 0xE0 && y < 0xF0) {
                    int idx = (int)(short)(y - 0xE0);
                    unsigned char b7;

                    *(unsigned short *)cursor =
                        (unsigned short)(var_C[idx] | (w & 0x803F));
                    w = *(unsigned short *)(cursor + 4);
                    *(unsigned short *)(cursor + 4) =
                        (unsigned short)(var_18[idx] | (w & 0xFFE0));
                    b7 = var_20[idx];
                    cursor[-1] = (unsigned char)((cursor[-1] & 0x7F) | b7);
                    cursor[3] = (unsigned char)((cursor[3] & 0x7F) | b7);
                    cursor[7] = (unsigned char)((cursor[7] & 0x7F) | b7);
                    cursor[9] = (unsigned char)((cursor[9] & 0x7F) | b7);
                }
                cursor += 0x14;
            } while (--k != 0);
        }
    } while (--remaining != 0);

    return 0;
}
```
