# RenderGL_DrawElements_PosColorTex @ 0x44655F

- Instr (live): 196
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=172
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=233
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=206
- A==B: non
- Push IDB: oui
- SetType: void __cdecl RenderGL_DrawElements_PosColorTex(GLsizei count, GLvoid *indices, int vertices, float *matrix)
- Notes parent: ecx=1 jz 74 7A never taken; both paths in image. Array: stride 0x20, color +0x10, ENABLE 0x8078 + glTexCoordPointer +0x18, glDrawElements U16. Immediate: jle signed, u16 shl 5, sub_41457F +12, W<=0 skip, glColor4ub v0 only BGRA, glTexCoord2f all 3 verts. Occupancy absent. 4 args add esp,10h. ≠0x445DE9 ≠0x446000 ≠0x4467B6.

## C réconcilié

```c
/* RenderGL_DrawElements_PosColorTex @ 0x44655F
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 196 instr, size 0x257, end 0x4467B6. cdecl, 4 args (callers add esp,10h), retn C3.
 * IDA live type was 3-arg truncated; arg_C is the 4x4 matrix (immediate path only).
 * Guard: mov ecx,1 / test ecx,ecx / jz loc_4465EE (74 7A). Constant 1: jz never taken.
 * Array path: glVertexPointer(3,GL_FLOAT,0x20,base) + glColorPointer(4,GL_UNSIGNED_BYTE,0x20,base+0x10)
 *   + glEnableClientState(GL_TEXTURE_COORD_ARRAY) + glTexCoordPointer(2,GL_FLOAT,0x20,base+0x18)
 *   + glDrawElements(GL_TRIANGLES,count,GL_UNSIGNED_SHORT,indices).
 * Immediate path (present, runtime-dead): glBegin; signed jle (0F 8E) on remaining; u16 indices (66 prefix);
 *   shl 5 = *32; sub_41457F cdecl add esp,0Ch; fcomp flt_B69568=0.0 / test ah,41h / jnz skip if W<=0;
 *   glColor4ub only vertex0 (BGRA dword +0x10); no color loads for v1/v2;
 *   glTexCoord2f s=+0x18 t=+0x1C on all three vertices; perspective divide; glVertex3f; var_8+=3.
 * GL IAT stdcall (FF 15). Not call [reg] driver slot. Occupancy 0xF8 / 1+2 / 0xD0 / 0x1D0 / 0x44 absent.
 * Distinct from PosColor 0x445DE9, PosColor_Imm 0x446000, PosColorTex_Imm 0x4467B6.
 */

extern float *__cdecl sub_41457F(float *matrix, float *vec, float *out);

void __cdecl RenderGL_DrawElements_PosColorTex(GLsizei count, GLvoid *indices, int vertices, float *matrix)
{
    unsigned char *pointer; /* ebp-4 : arg_8 copy */
    int var_8;              /* ebp-8 : element-index cursor */
    int var_C;              /* ebp-0xC : remaining count, SIGNED (jle) */
    unsigned char *var_10;  /* ebp-0x10 : vertex2 */
    unsigned int var_14;    /* ebp-0x14 : packed color DWORD (v0 only) */
    unsigned char *var_28;  /* ebp-0x28 : vertex0 */
    unsigned char *var_2C;  /* ebp-0x2C : vertex1 */
    float clip0[4];         /* var_3C,var_38,var_34,var_30 xyzw */
    float clip1[4];         /* var_4C,var_48,var_44,var_40 xyzw */
    float clip2[4];         /* var_24,var_20,var_1C,var_18 xyzw */

    pointer = (unsigned char *)vertices;

    if (1) /* mov ecx,1; test ecx,ecx; jz loc_4465EE — never taken */
    {
        glEnableClientState(0x8074); /* GL_VERTEX_ARRAY */
        glVertexPointer(3, 0x1406, 0x20, pointer); /* GL_FLOAT, stride 32 */
        glEnableClientState(0x8076); /* GL_COLOR_ARRAY */
        glColorPointer(4, 0x1401, 0x20, pointer + 0x10); /* GL_UNSIGNED_BYTE */
        glEnableClientState(0x8078); /* GL_TEXTURE_COORD_ARRAY */
        glTexCoordPointer(2, 0x1406, 0x20, pointer + 0x18); /* GL_FLOAT */
        glDrawElements(4, count, 0x1403, indices); /* GL_TRIANGLES, GL_UNSIGNED_SHORT */
        return; /* jmp loc_4467B2 */
    }

    glBegin(4); /* GL_TRIANGLES */
    var_8 = 0;
    var_C = count;
    goto loc_44660E;
    do
    {
        var_C -= 3;
    loc_44660E:
        if (var_C <= 0) /* jle loc_4467AC, signed, not ja */
            break;

        var_28 = pointer + (((unsigned int)*(unsigned short *)((unsigned char *)indices + var_8 * 2)) << 5);
        var_2C = pointer + (((unsigned int)*(unsigned short *)((unsigned char *)indices + var_8 * 2 + 2)) << 5);
        var_10 = pointer + (((unsigned int)*(unsigned short *)((unsigned char *)indices + var_8 * 2 + 4)) << 5);

        sub_41457F(matrix, (float *)var_28, clip0);
        if (!(clip0[3] > 0.0f)) /* fcomp 0.0; test ah,41h; jnz loc_44679E */
            goto loc_44679E;
        sub_41457F(matrix, (float *)var_2C, clip1);
        if (!(clip1[3] > 0.0f))
            goto loc_44679E;
        sub_41457F(matrix, (float *)var_10, clip2);
        if (!(clip2[3] > 0.0f))
            goto loc_44679E;

        var_14 = *(unsigned int *)(var_28 + 0x10);
        glColor4ub(
            (unsigned char)(var_14 >> 16),  /* red   = +2 */
            (unsigned char)(var_14 >> 8),   /* green = +1 */
            (unsigned char)var_14,          /* blue  = +0 */
            (unsigned char)(var_14 >> 24)); /* alpha = +3 */
        glTexCoord2f(*(float *)(var_28 + 0x18), *(float *)(var_28 + 0x1C));
        glVertex3f(clip0[0] / clip0[3], clip0[1] / clip0[3], clip0[2] / clip0[3]);

        glTexCoord2f(*(float *)(var_2C + 0x18), *(float *)(var_2C + 0x1C));
        glVertex3f(clip1[0] / clip1[3], clip1[1] / clip1[3], clip1[2] / clip1[3]);

        glTexCoord2f(*(float *)(var_10 + 0x18), *(float *)(var_10 + 0x1C));
        glVertex3f(clip2[0] / clip2[3], clip2[1] / clip2[3], clip2[2] / clip2[3]);

    loc_44679E:
        var_8 += 3;
    } while (1);
    glEnd();
}
```
