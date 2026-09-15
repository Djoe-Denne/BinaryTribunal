# RenderGL_DrawElements_PosColor @ 0x445DE9

- Instr (live): 174
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=1464
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=964
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=442
- A==B: non
- Push IDB: oui
- SetType: void __cdecl RenderGL_DrawElements_PosColor(GLsizei count, GLvoid *indices, int vertices, float *matrix)
- Notes parent: ecx=1 jz 74 never taken; both paths in image. Array: stride 0x20, color +0x10, disable 0x8078, glDrawElements U16. Immediate: jle signed, u16 shl 5, sub_41457F +12, W<=0 skip, glColor4ub v0 only BGRA. Occupancy absent. 4 args add esp,10h. ≠0x446000.

## C réconcilié

```c
/* RenderGL_DrawElements_PosColor @ 0x445DE9
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 174 instr, size 0x217, end 0x446000. cdecl, 4 args (callers add esp,10h), retn C3.
 * IDA live type was 3-arg truncated; arg_C is the 4x4 matrix (immediate path only).
 * Guard: mov ecx,1 / test ecx,ecx / jz loc_445E62 (74 64). Constant 1: jz never taken.
 * Array path: glVertexPointer(3,GL_FLOAT,0x20,base) + glColorPointer(4,GL_UNSIGNED_BYTE,0x20,base+0x10)
 *   + glDisableClientState(GL_TEXTURE_COORD_ARRAY) + glDrawElements(GL_TRIANGLES,count,GL_UNSIGNED_SHORT,indices).
 * Immediate path (present, runtime-dead): glBegin; signed jle (0F 8E) on remaining; u16 indices (66 prefix);
 *   shl 5 = *32; sub_41457F cdecl add esp,0Ch; fcomp flt_B69568=0.0 / test ah,41h / jnz skip if W<=0;
 *   glColor4ub only vertex0 (BGRA dword +0x10); v1/v2 color DWORD loaded then unused;
 *   perspective divide; glVertex3f; var_8+=3.
 * GL IAT stdcall (FF 15). Not call [reg] driver slot. Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / 0x44 absent.
 * Distinct from RenderGL_DrawElements_PosColor_Imm 0x446000 (adjacent, size 0x243).
 */

extern float *__cdecl sub_41457F(float *matrix, float *vec, float *out);

void __cdecl RenderGL_DrawElements_PosColor(GLsizei count, GLvoid *indices, int vertices, float *matrix)
{
    unsigned char *pointer; /* ebp-4 : arg_8 copy */
    int var_8;              /* ebp-8 : element-index cursor */
    int var_C;              /* ebp-0xC : remaining count, SIGNED (jle) */
    unsigned char *var_10;  /* ebp-0x10 : vertex2 */
    unsigned int var_14;    /* ebp-0x14 : packed color DWORD */
    unsigned char *var_28;  /* ebp-0x28 : vertex0 */
    unsigned char *var_2C;  /* ebp-0x2C : vertex1 */
    float clip0[4];         /* var_3C,var_38,var_34,var_30 xyzw */
    float clip1[4];         /* var_4C,var_48,var_44,var_40 xyzw */
    float clip2[4];         /* var_24,var_20,var_1C,var_18 xyzw */

    pointer = (unsigned char *)vertices;

    if (1) /* mov ecx,1; test ecx,ecx; jz loc_445E62 — never taken */
    {
        glEnableClientState(0x8074); /* GL_VERTEX_ARRAY */
        glVertexPointer(3, 0x1406, 0x20, pointer); /* GL_FLOAT, stride 32 */
        glEnableClientState(0x8076); /* GL_COLOR_ARRAY */
        glColorPointer(4, 0x1401, 0x20, pointer + 0x10); /* GL_UNSIGNED_BYTE */
        glDisableClientState(0x8078); /* GL_TEXTURE_COORD_ARRAY */
        glDrawElements(4, count, 0x1403, indices); /* GL_TRIANGLES, GL_UNSIGNED_SHORT */
        return; /* jmp loc_445FFC */
    }

    glBegin(4); /* GL_TRIANGLES */
    var_8 = 0;
    var_C = count;
    goto loc_445E82;
    do
    {
        var_C -= 3;
    loc_445E82:
        if (var_C <= 0) /* jle loc_445FF6, signed, not ja */
            break;

        var_28 = pointer + (((unsigned int)*(unsigned short *)((unsigned char *)indices + var_8 * 2)) << 5);
        var_2C = pointer + (((unsigned int)*(unsigned short *)((unsigned char *)indices + var_8 * 2 + 2)) << 5);
        var_10 = pointer + (((unsigned int)*(unsigned short *)((unsigned char *)indices + var_8 * 2 + 4)) << 5);

        sub_41457F(matrix, (float *)var_28, clip0);
        if (!(clip0[3] > 0.0f)) /* fcomp 0.0; test ah,41h; jnz loc_445FE8 */
            goto loc_445FE8;
        sub_41457F(matrix, (float *)var_2C, clip1);
        if (!(clip1[3] > 0.0f))
            goto loc_445FE8;
        sub_41457F(matrix, (float *)var_10, clip2);
        if (!(clip2[3] > 0.0f))
            goto loc_445FE8;

        var_14 = *(unsigned int *)(var_28 + 0x10);
        glColor4ub(
            (unsigned char)(var_14 >> 16),  /* red   = +2 */
            (unsigned char)(var_14 >> 8),   /* green = +1 */
            (unsigned char)var_14,          /* blue  = +0 */
            (unsigned char)(var_14 >> 24)); /* alpha = +3 */
        glVertex3f(clip0[0] / clip0[3], clip0[1] / clip0[3], clip0[2] / clip0[3]);

        var_14 = *(unsigned int *)(var_2C + 0x10); /* loaded, no glColor4ub */
        glVertex3f(clip1[0] / clip1[3], clip1[1] / clip1[3], clip1[2] / clip1[3]);

        var_14 = *(unsigned int *)(var_10 + 0x10); /* loaded, no glColor4ub */
        glVertex3f(clip2[0] / clip2[3], clip2[1] / clip2[3], clip2[2] / clip2[3]);

    loc_445FE8:
        var_8 += 3;
    } while (1);
    glEnd();
}
```
