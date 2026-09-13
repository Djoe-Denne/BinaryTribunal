# ParseVertices @ 0x50F900

- Instr (live): 297
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=9610
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=14723
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=18900
- A==B: non
- Push IDB: non (tag glm-triple 2026-09-13 déjà présent ; SAVE True)
- SetType: __int16 __cdecl ParseVertices(__int16 *ctx, __int16 **verts, _DWORD **outPacked)
- Notes parent: WORD count + xyz stride 6, out 8 o. PATH A jbe unsigned 0x01000000/0x02000000. PATH B jge/jle signed 0x01100000/0x01200000/0x02400000/0x02800000. jg near, fdivr zoom/pz. Magic 0x4330000080000000. worldZ no *8. Occupancy/0xD0/0x1D0/0x44 absents.

## C réconcilié

```c
/* ParseVertices @ 0x50F900
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes.
 * 297 instr, size 0x43E, end 0x50FD3E. IDA type __int16 __cdecl(__int16 *, __int16 **, _DWORD **).
 * cdecl, retn C3. and esp,-8 ; sub esp,54h. Saved ebx,esi,edi. No callees.
 * arg_0 ctx: WORD +14h minX, +16h minY, +18h sizeX, +1Ah sizeY (movsx, shl 3).
 * arg_4 **verts: WORD count then WORD xyz triplets, stride 6.
 * arg_8 **outPacked: stride 8, DWORD (sy<<16)|sx then DWORD (depth_lo16|flags).
 * PATH A (minX*8==0 && minY*8==0): unsigned jbe vs max only; flags 0x01000000/0x02000000.
 * PATH B else: signed jge/jle vs min and max; flags 0x01100000/0x01200000/0x02400000/0x02800000.
 * IDA "offset VIT_0_STATUS_MASK?" etc. are imm32 (81 CE / 81 CA), not xrefs.
 * Magic double 0xB693D8 = 0x4330000080000000. Near flag 0x20000.
 * Occupancy 1+2 / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44 / GetRandomInt: unused.
 * No Hex-Rays. No domain::.
 */

extern int world_CameraWorldSpaceX; /* 0x1CA9290 DWORD fild */
extern int World_CameraWorldSpaceY; /* 0x1CA9294 */
extern int World_CameraWorldSpaceZ; /* 0x1CA9298, *8 ABSENT */
extern short word_1CA92DE; /* 0x1CA92DE WORD movsx */
extern short World_CameraWorldLookAtZ; /* 0x1CA92E2 WORD */
extern int World_CameraZoom; /* 0x1CA92E4 DWORD, low 16 used */
extern float Cam_xyz1_z_float; /* 0x1CA9234 */
extern float Cam_xyz1_y_float; /* 0x1CA9238 */
extern float Cam_xyz1_x_float; /* 0x1CA923C */
extern float Cam_xyz2_z_float; /* 0x1CA9240 */
extern float Cam_xyz2_y_float; /* 0x1CA9244 */
extern float Cam_xyz2_x_float; /* 0x1CA9248 */
extern float Cam_xyz3_z_float; /* 0x1CA924C */
extern float Cam_xyz3_y_float; /* 0x1CA9250 */
extern float Cam_xyz3_x_float; /* 0x1CA9254 */

/* Low dword of (x + 2^52+2^31). PATH A scratch = var_10; PATH B = var_8. */
static unsigned int parseverts_f2i_lo(double x)
{
    union {
        double d;
        unsigned int w[2];
    } u;
    u.d = x + 4503601774854144.0; /* 0xB693D8 */
    return u.w[0];
}

__int16 __cdecl ParseVertices(__int16 *ctx, __int16 **verts, _DWORD **outPacked)
{
    int minX8, minY8, maxX8, maxY8;
    int lookAtX8, lookAtZ8, count, nearZ;
    unsigned int zoomW, flags, sx, sy, depth, lo;
    float worldX8, worldY8, worldZ, zoomF, cam3x, cam3y, cam3z;
    float px, py, vx8, vy8, vz8;
    double pz, scale;
    __int16 *stream;
    _DWORD *out;

    minX8 = (int)*(__int16 *)((char *)ctx + 0x14) << 3; /* var_14 */
    minY8 = (int)*(__int16 *)((char *)ctx + 0x16) << 3; /* dword var_10 */
    maxX8 = minX8 + ((int)*(__int16 *)((char *)ctx + 0x18) << 3); /* var_1C */
    maxY8 = minY8 + ((int)*(__int16 *)((char *)ctx + 0x1A) << 3); /* var_18 */

    stream = *verts;
    out = *outPacked;
    count = (unsigned short)*stream; /* mov ax,[edx]; test ax,ax */
    stream++; /* add edx,2 */

    if (count == 0) /* jz loc_50FD37: no pointer stores */
        return 0;

    worldX8 = (float)world_CameraWorldSpaceX * 8.0f; /* fild + CONST_8.0 @ 0xB693E4 */
    worldY8 = (float)World_CameraWorldSpaceY * 8.0f;
    worldZ = (float)World_CameraWorldSpaceZ; /* fild only */
    zoomW = (unsigned int)World_CameraZoom & 0xFFFF;
    zoomF = (float)(int)zoomW; /* fild var_20 then fstp float over it */
    nearZ = (int)(zoomW >> 1); /* shr, then signed jg vs depth */
    lookAtX8 = (int)word_1CA92DE << 3; /* var_40 */
    lookAtZ8 = (int)World_CameraWorldLookAtZ << 3; /* var_44 */
    cam3x = Cam_xyz3_x_float * 0.125f; /* CONST_0.125 @ 0xB693E0 → var_2C */
    cam3y = Cam_xyz3_y_float * 0.125f; /* var_30 */
    cam3z = Cam_xyz3_z_float * 0.125f; /* var_34 */

    count = (int)(short)(unsigned short)count; /* movsx word var_48 */
    if (count <= 0) { /* jle loc_50FD2D signed; edx still stream after count */
        *verts = stream;
        *outPacked = out;
        return (__int16)(int)verts; /* EAX leftover = arg_4 */
    }

    if (minX8 == 0 && minY8 == 0) {
        /* PATH A loc_50FA19 / loc_50FA0D. var_10 reused as magic qword. */
        do {
            vx8 = (float)((int)stream[0] << 3);
            vy8 = (float)((int)stream[1] << 3);
            vz8 = (float)((int)stream[2] << 3);
            stream += 3; /* add edx,6; var_4C */

            px = Cam_xyz1_z_float * vz8 + Cam_xyz1_y_float * vy8
               + Cam_xyz1_x_float * vx8 + worldX8;
            py = Cam_xyz2_z_float * vz8 + Cam_xyz2_y_float * vy8
               + Cam_xyz2_x_float * vx8 + worldY8;
            pz = (double)vz8 * cam3z + (double)vy8 * cam3y
               + (double)vx8 * cam3x + (double)worldZ;

            lo = parseverts_f2i_lo(pz);
            depth = lo + 0x80000000u;
            if ((int)depth > nearZ) { /* jg loc_50FAFD */
                scale = (double)zoomF / pz; /* fdivr var_20 */
                flags = 0;
                sx = parseverts_f2i_lo((double)px * scale) + (unsigned int)lookAtX8 + 0x80000000u;
                sy = parseverts_f2i_lo((double)py * scale) + (unsigned int)lookAtZ8 + 0x80000000u;
            } else {
                flags = 0x20000u;
                sx = (unsigned int)lookAtX8 + 2u * parseverts_f2i_lo((double)px);
                sy = (unsigned int)lookAtZ8 + 2u * parseverts_f2i_lo((double)py);
            }

            if (sx > (unsigned int)maxX8) /* jbe loc_50FB43 unsigned */
                flags |= 0x01000000u;
            if (sy > (unsigned int)maxY8) /* jbe loc_50FB4F */
                flags |= 0x02000000u;

            out[0] = (sy << 16) | (sx & 0xFFFFu);
            out[1] = (depth & 0xFFFFu) | flags;
            out += 2;
        } while (--count != 0);

        *verts = stream; /* loc_50FB79 */
        *outPacked = out;
        return (__int16)(int)verts;
    }

    /* PATH B loc_50FBAD / loc_50FBA1. Magic in var_8; var_10 still minY*8. */
    do {
        vx8 = (float)((int)stream[0] << 3);
        vy8 = (float)((int)stream[1] << 3);
        vz8 = (float)((int)stream[2] << 3);
        stream += 3;

        px = Cam_xyz1_z_float * vz8 + Cam_xyz1_y_float * vy8
           + Cam_xyz1_x_float * vx8 + worldX8;
        py = Cam_xyz2_z_float * vz8 + Cam_xyz2_y_float * vy8
           + Cam_xyz2_x_float * vx8 + worldY8;
        pz = (double)vz8 * cam3z + (double)vy8 * cam3y
           + (double)vx8 * cam3x + (double)worldZ;

        lo = parseverts_f2i_lo(pz);
        depth = lo + 0x80000000u;
        if ((int)depth > nearZ) { /* jg loc_50FC91 */
            scale = (double)zoomF / pz;
            flags = 0;
            sx = parseverts_f2i_lo((double)px * scale) + (unsigned int)lookAtX8 + 0x80000000u;
            sy = parseverts_f2i_lo((double)py * scale) + (unsigned int)lookAtZ8 + 0x80000000u;
        } else {
            flags = 0x20000u;
            sx = (unsigned int)lookAtX8 + 2u * parseverts_f2i_lo((double)px);
            sy = (unsigned int)lookAtZ8 + 2u * parseverts_f2i_lo((double)py);
        }

        if ((int)sx < minX8) /* jge loc_50FCD9 signed */
            flags |= 0x01100000u;
        else if ((int)sx > maxX8) /* jle loc_50FCE5 */
            flags |= 0x01200000u;
        if ((int)sy < minY8) /* cmp eax, dword var_10 ; jge loc_50FCF3 */
            flags |= 0x02400000u;
        else if ((int)sy > maxY8)
            flags |= 0x02800000u;

        out[0] = (sy << 16) | (sx & 0xFFFFu);
        out[1] = (depth & 0xFFFFu) | flags;
        out += 2;
    } while (--count != 0);

    *verts = stream; /* loc_50FD29 / loc_50FD2D */
    *outPacked = out;
    return (__int16)(int)verts;
}
```
