# RenderGeometry @ 0x5099D0 — C descriptif relu (drain)

- Confiance : LIKELY NUMERIC ; rôle métier/type/prototype/ABI non certifiés.
- Parent gate native : `6e646da93c9c68b4e07622bde5ea7b428a26593466f6bbbcd9c95b6abc0cc5e8`, 118 EA / 351 octets ; [sémantique](../semantic/0x5099D0__RenderGeometry.md).
- C exact SHA-256 `9308f355bcc2278bfa2a5e3c94a2659c83a63cfa14adfecc646c248097130f1f` ; ce C conditionnel est descriptif, pas certification compilateur/runtime.
- Payload C : exactement 4940 octets après ouverture de fence ; le LF séparateur Markdown éventuel avant fermeture est hors payload, pas normalisation du fichier C accepté.
- Aucun rename/SetType/patch ; les anciennes mentions Push/SetType ci-dessous sont **historiques**, pas opérations du drain.

## C réconcilié / indépendant relu — payload exact

```c
/* Targeted correction of the existing candidate: F001-F004 only.
 * Ground truth: supplied numeric ASM and bytes, not names or Hex-Rays.
 * Root [0x5099D0,0x509B2F): 118 instructions, 351 bytes.
 * Documentary x86-32 little-endian model: unsigned int/int/_DWORD = 32 bits,
 * unsigned short/short = 16 bits, unsigned char = 8 bits; signed counts and
 * indices interpret the stored bits. Address arithmetic is modulo 2^32.
 * Ordinary non-volatile RAM only: no MMIO, races, faults/exceptions or stack
 * inspection. External memory cannot alias the private frame, including
 * argument homes. Only the two stream/verts cells passed to sub_50F900 are
 * exposed in/out; their pointers do not escape, and no helper accesses other
 * frame slots. Aliases among ordinary ctx/table/stream/buffers/globals ARE
 * allowed; in particular a helper may change the ordinary table count cell.
 * Each actual access must be valid: arg_0 DWORDs, latch DWORD, ctx argument
 * bytes, initial signed DWORD count and per-group DWORD offsets, reloaded
 * arg_0[1] and ctx+0x20 DWORD mask, selected ctx+4 DWORD, signed WORD count
 * and indices, then four WORD reads at the aligned stream and sequential
 * WORD stores at ctx+8/+A/+C/+E, and ctx+0 DWORD store. The four-byte skip
 * reads nothing. Helper access extents are unknown, not buffer-extent proofs.
 * No nonnegative-index assumption, count<=32 limit, or extra guard is added.
 * Root allocates 12 bytes; late EBX/EBP/ESI/EDI saves restore in reverse;
 * both RETs are caller-cleanup. Source ctx argument home is reused for i.
 * Source stream is reloaded after sub_50F900 (0x509AA2). At 0x509AA6,
 * add esp,16 cleans deferred 4 bytes for sub_509B30 plus 12 for sub_50F900,
 * not four arguments for the latter. Other cleanups: 12 at 0x509A2C and
 * 16 at 0x509B0B. This C does not reproduce the native private-frame layout.
 * Externs are opaque documentary interfaces with numeric root-call targets;
 * unused returns are not assigned invented values. Prototypes, cleanup and
 * casts prove neither source ABI nor business types. No portable ISO C,
 * compilation or native runtime equivalence is claimed for this text.
 * Independent fresh Sol review and original canon receipts gate remain
 * pending; this fix is neither ACCEPTE nor new dual-generation/reconciliation.
 */

extern unsigned int dword_B8B9F8;
extern int sub_45B570(void);
extern int __cdecl sub_45DDA0(int slot15, int slot16, int slot17);
extern int __cdecl sub_509B30(int bone_matrix);
extern void __cdecl sub_50F900(void *ctx, unsigned int *p_stream, unsigned int *p_verts);
extern int __cdecl sub_50FDF0(void *ctx, void *ot_base, int ot_shift, void *packet);

int __cdecl fn_5099D0(_DWORD *arg_0, void *ctx, void *ot_base, int ot_shift, void *packet)
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

    /* F002: 0x509A17/0x509A20 count capture, 0x509A24 table advance. */
    count = (int)*off;
    off++;
    /* F003: root CALL 0x509A27 targets 0x45DDA0, not its internal helper. */
    sub_45DDA0((int)ctxb[0x1C], (int)ctxb[0x1D], (int)ctxb[0x1E]);

    if (count > 0)
    {
        for (i = 0; i < count; i++)
        {
            stream = arg_0[1] + *off;
            off++;
            /* F001: 0x509A4F D3 E2 masks CL to five bits, including i>=32. */
            if ((*(unsigned int *)(ctxb + 0x20) & (1u << ((unsigned int)i & 31u))) != 0)
            {
                verts = *(unsigned int *)(ctxb + 4);
                stream += 2;
                bone_count = (int)*(short *)(stream - 2);
                while (bone_count > 0)
                {
                    bone_index = (int)*(short *)stream;
                    stream += 2;
                    sub_509B30(
                        (int)(bone_base + 0x10 + (unsigned int)bone_index * 0x30));
                    sub_50F900(ctx, &stream, &verts);
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
                packet = (void *)sub_50FDF0(ctx, ot_base, ot_shift, packet);
            }
        }
    }
    return (int)packet;
}
```

## Source documentaire antérieure, préservée

Préimage SHA-256 `cc8603b0149334d5ca229414734109f08f03e2f426455348ac31e1f4a2a7ac77` ; copie gelée `tools/_tmp_semantic_triple/0x5099d0/native-2026-10-10/parent_named_source_prepublication.md`. La clôture numérique ci-dessus supersède les anciens votes/code/claims sans les effacer.

````text
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
````
