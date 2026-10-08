# TexStaging_BlitCLUTAlpha @ 0x4677D0

- Instr (live): 196
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=4724 (effort_used=high)
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=3501 (effort_used=high)
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=2737 (effort_used=high; retry high/65536 after auto length/empty)
- A==B: non
- Confiance statique: CERTAIN ; mode 1+V ; verdict V: ACCEPTE.
- Nom catalogue: trop large ; proposition markdown seule `TexStaging_Blit555SumToAlpha4`.
- §5.6 / PUSH IDB: en attente du parent ; aucune écriture IDB dans cette correction.
- Type IDA observé: void __cdecl TexStaging_BlitCLUTAlpha(unsigned __int8 *, int, unsigned __int16 *, int, int, int, int, unsigned __int16 *)
- Notes parent: 196 instr, 35 blocs CFG (A/V), 0 call, 3 ret C3 ; modes 1/0/2/nop ; WORD (a<<12), RGB nul ; shift=((uint32_t)global+3u)&31u ; jle SIGNED height+clamp ; mode0 signed/2 dest compact et capture CLUT haute avant premier store ; mode1/2 pitch depuis base de ligne ; cdecl 8 args, add esp,24h caller inclut un push antérieur, pas 9 args ; EAX résiduel, pas un statut. Occupancy/OT07/AL2/TIM 0x10/+44h/gfx_driver absents. Historique SETTYPE/SAVE non réexécuté ; §5.6 et PUSH réservés au parent.

## C réconcilié

```c
/* TexStaging_BlitCLUTAlpha @ 0x4677D0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 196 instr, size 0x235, end exclusive 0x467A05. cdecl, 8 args, retn C3, no EBP frame
 * (EBP is dest row cursor). Saved EBX EBP ESI EDI. EAX leftover undefined.
 * Callees none. add esp none dans ce corps ; caller 0x4657D0 add esp,24h
 * inclut un push antérieur 0x46573F : toujours 8 arguments, pas 9.
 * Mode arg_18: 1 = 8bpp CLUT index, 0 = 4bpp nibbles (lo then hi), 2 = 16bpp 555
 * (src word is the color, no CLUT). Other modes: nop (cmp 2 / jnz loc_467A00).
 * Each dest store is WORD (66 89) of (luma_alpha << 12); low 12 bits 0.
 * Luma: r=(c SAR 0Ah)&1Fh, g=(c SAR 5)&1Fh, b=c&1Fh; a=(r+g+b) SAR cl;
 * shift = ((uint32_t)dword_1CA89E8+3u)&31u : LEA wrap32 (8D 48 03), SAR modulo32.
 * cmp 0Fh / jle SIGNED (7E) then mov 0Fh. Sum is 0..93, bit 15 ignored.
 * Height: test / jle SIGNED (0F 8E / 7E). Width skip: test / jz only (==0).
 * Mode1/2 row: reload src/dst from ROW START then add pitches (not cursor+pitch).
 * Mode0: cdq/sub/sar signed /2; arg_4 := src_pitch-pairs; arg_C overwritten with
 * pair count; dest packed (no dest-pitch add). High CLUT WORD loaded at 0x467901
 * BEFORE first dest store 0x467908, including CLUT/dst aliases.
 * Mode2 overwrites arg_1C with height.
 * Occupancy 1+2 / OT 07 / code 24 / TEST AL,2 / 0xD0 / 0x1D0 / TIM 0x10: ABSENT.
 * +44h ABSENT in this body (callers may pass [obj+44h] as dst_pitch; not GF Exists).
 * gfx_driver slots ABSENT. No ja/jg. No setcc. No jump table. No presentation::.
 */

#include <stdint.h>

extern int dword_1CA89E8;

void __cdecl TexStaging_BlitCLUTAlpha(unsigned __int8 *src, int src_pitch, unsigned __int16 *dst,
    int dst_pitch, int width, int height, int mode, unsigned __int16 *clut)
{
    uint32_t shift;
    int rows;
    int n;
    unsigned __int8 *row_src;
    unsigned __int16 *row_dst;
    unsigned __int8 *p;
    unsigned __int16 *d;
    unsigned int color;
    unsigned int hi;
    unsigned int byte;
    int r;
    int g;
    int b;
    int a;
    int pair_count;
    int src_pitch_adj;

    shift = ((uint32_t)dword_1CA89E8 + 3u) & 31u; /* 0x4677DB LEA wrap32; SAR CL mod32 */

    if (mode == 1) {
        if (height <= 0)
            return;
        rows = height;
        row_src = src;
        row_dst = dst;
        do {
            n = width;
            p = row_src;
            d = row_dst;
            if (n != 0) {
                do {
                    color = clut[*p]; /* 8A + 66 8B [ebx+eax*2]; ebx reloaded per pixel */
                    r = ((int)color >> 10) & 0x1F;
                    g = ((int)color >> 5) & 0x1F;
                    b = (int)color & 0x1F;
                    a = (r + g + b) >> shift; /* sar r32, cl */
                    if (a > 15) /* cmp 0Fh / jle SIGNED */
                        a = 15;
                    *d = (unsigned __int16)(a << 12); /* 66 89 WORD */
                    p++;
                    d++;
                } while (--n != 0);
            }
            row_src = row_src + src_pitch; /* from ROW START + arg_4, not p+pitch */
            row_dst = (unsigned __int16 *)((char *)row_dst + dst_pitch);
        } while (--rows != 0);
        return;
    }

    if (mode == 0) {
        pair_count = width / 2; /* cdq; sub eax,edx; sar eax,1 */
        src_pitch_adj = src_pitch - pair_count;
        if (height <= 0)
            return;
        rows = height;
        p = src;
        d = dst;
        do {
            n = pair_count;
            if (n != 0) {
                do {
                    byte = *p;
                    color = clut[byte & 0xF];
                    r = ((int)color >> 10) & 0x1F;
                    g = ((int)color >> 5) & 0x1F;
                    b = (int)color & 0x1F;
                    a = (r + g + b) >> shift;
                    if (a > 15)
                        a = 15;
                    hi = clut[byte >> 4]; /* 0x467901: capture BEFORE 0x467908, aliases allowed */
                    d[0] = (unsigned __int16)(a << 12); /* [ebp+0] WORD */
                    color = hi;
                    r = ((int)color >> 10) & 0x1F;
                    g = ((int)color >> 5) & 0x1F;
                    b = (int)color & 0x1F;
                    a = (r + g + b) >> shift;
                    if (a > 15)
                        a = 15;
                    d[1] = (unsigned __int16)(a << 12); /* [ebp+2] WORD */
                    p++;
                    d += 2; /* add ebp,4 */
                } while (--n != 0);
            }
            p += src_pitch_adj;
        } while (--rows != 0);
        return;
    }

    if (mode == 2) {
        if (height <= 0)
            return;
        rows = height;
        row_src = src;
        row_dst = dst;
        do {
            n = width;
            p = row_src;
            d = row_dst;
            if (n != 0) {
                do {
                    color = *(unsigned __int16 *)p; /* 66 8B 16; no CLUT */
                    r = ((int)color >> 10) & 0x1F;
                    g = ((int)color >> 5) & 0x1F;
                    b = (int)color & 0x1F;
                    a = (r + g + b) >> shift;
                    if (a > 15)
                        a = 15;
                    *d = (unsigned __int16)(a << 12); /* [edi+esi] WORD */
                    p += 2;
                    d++;
                } while (--n != 0);
            }
            row_src = row_src + src_pitch;
            row_dst = (unsigned __int16 *)((char *)row_dst + dst_pitch);
        } while (--rows != 0);
        return;
    }
}
```

## Corrections ciblées et limites

Sources A/V : `tools/_tmp_semantic_triple/0x4677d0/semantic_a_sol.md` et `semantic_v_sol.md` ; contrôle natif live `lookup_funcs` par VA puis `disasm` : 196/196, `done=true`, plage `[0x4677D0,0x467A05)`. Sans régénération C : seulement le shift wrap32/modulo32 et l'ordre de capture CLUT haute en mode 0 sont corrigés.

Les largeurs négatives non nulles ne sont pas rejetées ; aucune vérification de capacité, pitch ou alias source/destination. Ce C ne garantit pas l'émulation du wrap x86 des compteurs/pointeurs hors dimensions valides. Aucun garde ajouté. Hex-Rays du pack est un stub `missing addr`, pas une comparaison C exploitable. Validation statique seulement ; §5.6/PUSH en attente parent.
