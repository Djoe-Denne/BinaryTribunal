# RenderGeometry @ 0x5099D0

- Instr (live): 118
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=3919
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=2833
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=1067
- A==B: non
- Push IDB: oui
- SetType: int __cdecl RenderGeometry(_DWORD *arg_0, void *ctx, void *ot_base, int ot_shift, void *packet)
- Notes parent: Latch dword_B8B9F8 + sub_45B570 0-arg. Thunk_45DD60 cdecl arg0=+1Ch/arg1=+1Dh/arg2=+1Eh (A/B/C inverses). Bit [ctx+20h] shl 1,i. Bone *0x30 at *arg_0+0x20. WORD 66 ctx+8..+0Eh. ParseVertices EAX ignore, ParsePolygons EAX=packet. jle/jl signes. Occupancy/0xD0/0x1D0/GF+0x44 absents.

## C réconcilié

```c
/* RenderGeometry @ 0x5099D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 118 instr, size 0x15F, end 0x509B2F. IDA type int __cdecl(_DWORD *, int, int, int, int).
 * cdecl, 5 args. Saved EBX EBP ESI EDI. sub esp,0Ch locals. retn C3.
 * Latch dword_B8B9F8; sub_45B570 0-arg; Thunk_45DD60 add esp,0xC;
 * SetCurrentBoneMatrix+ParseVertices add esp,10h; ParsePolygons add esp,10h.
 * Bone stride *0x30 at *arg_0+0x20. WORD 66 stores ctx+8..+0Eh.
 * Occupancy / slot 0xD0 / F_CHAR 0x1D0 / GF Exists 0x44: absent.
 * No domain::.
 */

extern unsigned int dword_B8B9F8;
extern int sub_45B570(void);
extern int __cdecl Thunk_45DD60(int slot15, int slot16, int slot17);
extern int __cdecl BattleGeom_SetCurrentBoneMatrix(int bone_matrix);
extern void __cdecl ParseVertices(void *ctx, unsigned int *p_stream, unsigned int *p_verts);
extern int __cdecl ParsePolygons(void *ctx, void *ot_base, int ot_shift, void *packet);

int __cdecl RenderGeometry(_DWORD *arg_0, void *ctx, void *ot_base, int ot_shift, void *packet)
{
    unsigned char *ctxb;
    unsigned int stream;
    unsigned int verts;
    int count;
    unsigned int bone_base;
    unsigned int *off;
    int i;
    int bone_count;
    int bone_index;

    ctxb = (unsigned char *)ctx;
    if (dword_B8B9F8 == 0)
    {
        dword_B8B9F8 = 1;
        if (sub_45B570() == 0)
            return (int)packet;
    }

    bone_base = arg_0[0] + 0x10;
    off = (unsigned int *)arg_0[1];

    /* cdecl: last push is arg0. Pushes were [ctx+1Eh], [ctx+1Dh], [ctx+1Ch]. */
    Thunk_45DD60((int)ctxb[0x1C], (int)ctxb[0x1D], (int)ctxb[0x1E]);

    count = (int)*off;
    off++;
    if (count > 0)
    {
        for (i = 0; i < count; i++)
        {
            stream = arg_0[1] + *off;
            off++;
            if ((*(unsigned int *)(ctxb + 0x20) & (1u << i)) != 0)
            {
                verts = *(unsigned int *)(ctxb + 4);
                stream += 2;
                bone_count = (int)*(short *)(stream - 2);
                while (bone_count > 0)
                {
                    bone_index = (int)*(short *)stream;
                    stream += 2;
                    BattleGeom_SetCurrentBoneMatrix(
                        (int)(bone_base + 0x10 + (unsigned int)bone_index * 0x30));
                    ParseVertices(ctx, &stream, &verts);
                    bone_count--;
                }
                stream = (stream + 3) & ~3u;
                *(unsigned short *)(ctxb + 8) = *(unsigned short *)stream;
                stream += 2;
                *(unsigned short *)(ctxb + 0xA) = *(unsigned short *)stream;
                stream += 2;
                *(unsigned short *)(ctxb + 0xC) = *(unsigned short *)stream;
                stream += 2;
                *(unsigned short *)(ctxb + 0xE) = *(unsigned short *)stream;
                stream += 2;
                stream += 4;
                *(unsigned int *)ctxb = stream;
                packet = (void *)ParsePolygons(ctx, ot_base, ot_shift, packet);
            }
        }
    }
    return (int)packet;
}
```
