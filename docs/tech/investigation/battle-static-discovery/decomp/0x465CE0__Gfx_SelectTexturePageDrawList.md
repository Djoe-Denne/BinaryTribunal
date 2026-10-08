# Gfx_SelectTexturePageDrawList @ 0x465CE0

- Instr (live): 288
- Palier: high
- GLM A (historique): fence_found=true finish_reason=stop reasoning_tokens=11118
- GLM B (historique): fence_found=true finish_reason=stop reasoning_tokens=15672
- GLM C (historique): fence_found=true finish_reason=stop reasoning_tokens=15448
- A==B: non
- Mode de revue: A historique + V Sol + B aveugle strict + R final Sol ; aucune diversité de modèles revendiquée.
- §5.6 / Push IDB: en attente du parent ; le statut/tag hérité n'est pas une preuve de clôture. Cette revue n'écrit pas l'IDB.
- Type IDA (lecture, pas de SetType): int __cdecl Gfx_SelectTexturePageDrawList(unsigned int, unsigned int, __int16, _DWORD *, _DWORD *, _DWORD *)
- Notes parent: and al,0FDh puis cmp eax 64h/74h/7Ch (pas &0xFD). jl/jle/jge signes, pas ja. WORD 66 [ctx+448h] CLUT. Table pleine skip +24h et floats. UploadCLUTSlot alloc+(arg_4&60h)==40h seulement. *arg_C sans NULL, saute si var_20C==2. Occupancy/OT07/code24/TIM 0x10/GF Exists/+0x9C absents. ctx*0x44C slot*0x64 alt*0x470.
- R final: `tools/_tmp_semantic_triple/0x465ce0/semantic_r_sol.md` ; ASM live + octets recontrôlés, SHA-256 identique au R. count==0 avec clé non nulle publie slot 1 puis teste +24h, sans création locale ; initialisation antérieure inconnue. Corps de sélection déjà conforme, pas réécrit.

## C réconcilié

```c
/* Gfx_SelectTexturePageDrawList @ 0x465CE0
 * Ground truth = live ASM (asm_clean.asm) + ida_dump_bytes, not Hex-Rays.
 * 288 instr, size 0x3AC, end 0x46608C. cdecl, retn C3, no EBP frame (EBP scratch).
 * sub esp,210h / add esp,210h on every retn (locals, not callee cleanup).
 * EBX/EBP/ESI/EDI saved. Six DWORD argument slots; IDA annotates CLUT as __int16,
 *   but 465CE6 reads a DWORD, masks to 15 useful bits; 465EA1 compares a WORD.
 * Call cleanup add esp: sprintf 14h, lookup 8, add 0Ch, alloc 28h,
 *   companion constructor 0Ch, transfer 10h (cdecl, pushes right-to-left).
 * EAX (all 32 bits): zero on d==3 or failure of a reached +24h guard;
 *   otherwise caches or slot[0x2C+4*v] (code bit1 clear),
 *   slot[0x34+4*v+8*b] (bit1 set), possibly zero themselves.
 * +24h supplies arg_10, not the final return; special/saturation paths bypass
 *   the +24h guard. Final selection is common to normal and special tables.
 * arg_14 separately receives slot[0x34+4*v] if supplied.
 * ctx stride 0x44C at unk_1CB6040; slot records +4 stride 0x64; alt table 0x470.
 * [ctx+448h] WORD CLUT (66-prefix). NOT GF Exists. NOT occupancy 1+2. NOT +444h buffer.
 * jcc: jl/jle/jge/jz/jnz only. No ja/jg. No setcc. No jpt.
 * TEST AL,2 unlink / OT tag 07 / GPU code 24 / TIM stride 0x10 / list+0x9C/+0xA0: ABSENT.
 */

extern int __cdecl _sprintf(char *dest, const char *fmt, ...);
extern int __cdecl sub_466090(void *ctx, unsigned int clut);
extern int __cdecl sub_4660D0(void *ctx, unsigned int clut, unsigned int mask);
extern int __cdecl sub_466190(void *ctx, unsigned int clut, int index, unsigned int mask);
extern void *__cdecl Gfx_AllocTexturePageSlot(void *ctx, void *slot, int a3, int a4, int a5, int a6,
    int a7, int a8, int a9, int a10);
extern void *__cdecl Gfx_UploadCLUTSlot(void *slot, int tpage, void *src);

extern unsigned int dword_1CA8880;
extern unsigned int dword_1CB6030[];
extern unsigned int dword_1CA8884;
extern unsigned int dword_1CCFD50[];
extern unsigned int dword_1CCFD44[];
extern unsigned int dword_1CCFD90;
extern unsigned int dword_1CA8848;
extern unsigned int dword_1CA8870;
extern unsigned short word_1CA8874;
extern unsigned short word_1CA8876;
extern unsigned int dword_1CB603C;
extern unsigned int dword_1CB6038;
extern unsigned int dword_1CA8A00;
extern unsigned char unk_1CB6040[];
extern unsigned char unk_1CAD228[];
extern char aSsigpuTxSelect[];
extern char aNull_1[];

int __cdecl Gfx_SelectTexturePageDrawList(
    unsigned int arg_0,
    unsigned int arg_4,
    unsigned int arg_8, /* DWORD ABI slot; original source type not established */
    unsigned int *arg_C,
    unsigned int *arg_10,
    unsigned int *arg_14)
{
    char Buffer[512];
    unsigned int var_210;
    unsigned int var_20C;
    unsigned int var_204;
    unsigned int var_208;
    unsigned int clut;
    unsigned int ebx;
    unsigned int bit;
    unsigned int list;
    unsigned int code;
    unsigned char *ctx;
    unsigned char *slot;
    int count;
    int ebp_i;
    int idx;
    unsigned int mask;

    clut = (unsigned int)arg_8 & 0x7FFFu; /* 25 ff7f0000, stored back to arg_8 */
    ebx = arg_4 & 0x1Fu;
    var_20C = (arg_4 >> 7) & 3u;
    var_204 = (arg_4 >> 5) & 3u;

    if ((int)var_20C >= 3) /* cmp edx,3 / jl (7C signed); AND-3 so edx==3 -> 0 */
        return 0;

    /* and al,0FDh (24 FD): clear bit1 of AL only, then 32-bit cmp eax,imm */
    code = (arg_0 & 0xFFFFFFFDu);
    if (code == 0x64u || code == 0x74u || code == 0x7Cu) {
        var_210 = 1;
        if (dword_1CCFD90 != 0 && var_20C != 2) {
            /* ebx*9 <<3 -ebx <<4 = ebx*0x470 */
            slot = unk_1CAD228 + ebx * 0x470u;
            goto output; /* loc_466030, skips *arg_C */
        }
        goto main_path;
    }

    var_210 = (arg_0 >> 3) & 1u;

    if ((*(unsigned char *)&dword_1CA8880 & 1u) != 0) { /* mov al,byte; test al,1 */
        if (arg_10 != 0)
            *arg_10 = 0;
        return (int)dword_1CB6030[var_210];
    }

    if ((arg_0 & 4u) == 0) { /* test cl,4 */
        if ((arg_0 & 2u) != 0) { /* test cl,2 — flag bit, NOT unlink-clone */
            /* lea ecx,[ebp+eax*2]; add eax,ecx => 3*dword_1CA8884 + var_210 */
            return (int)dword_1CCFD50[dword_1CA8884 * 3u + var_210];
        }
        return (int)dword_1CCFD44[var_210];
    }

main_path:
    /* ((var_20C*32+ebx)*275)*4 = index * 0x44C */
    ctx = unk_1CB6040 + (var_20C * 32u + ebx) * 0x44Cu;

    if (dword_1CA8848 == 0) {
        slot = ctx + 4; /* loc_465FD2 slot 0; no float copy */
        goto check_list;
    }

    count = *(int *)ctx;
    ebp_i = 1;
    slot = ctx + 0x68; /* slot index 1 */
    if (count > 1) { /* cmp eax,1 / jle (7E signed) */
        do {
            if (*(unsigned int *)(slot + 0x58) != 0
                && *(unsigned int *)(slot + 0x20) == dword_1CA8848) {
                bit = 1u << ((unsigned)ebp_i & 31u); /* 465E42 shl eax,cl: x86 modulo 32 */
                *(unsigned int *)(ctx + 0x324) |= bit;
                if ((arg_4 & 0x60u) == 0x40u) { /* and ecx,60h; cmp cl,40h */
                    *(unsigned int *)(ctx + 0x328) |= bit;
                    *(unsigned short *)(ctx + 0x448) = (unsigned short)clut; /* 66 89 */
                }
                goto copy_floats; /* ebp != count */
            }
            ebp_i++;
            slot += 0x64;
        } while (ebp_i < count); /* jl (7C signed) */
    }

    /* loc_465E7E: mov eax,[esi]; cmp ebp,eax */
    if (ebp_i != count) {
        /* count==0: slot 1, no local creation/bitset; publish then test +24h */
        goto copy_floats;
    }

    if (count < 8) { /* cmp eax,8 / jl (0F 8C signed) */
        *(int *)ctx = count + 1;
        slot = ctx + 4 + count * 0x64;
        Gfx_AllocTexturePageSlot(
            ctx,
            slot,
            (int)*(short *)&dword_1CA8870,
            (int)*((short *)&dword_1CA8870 + 1),
            (int)(short)word_1CA8874,
            (int)(short)word_1CA8876,
            (int)var_20C,
            (int)ebx,
            (int)dword_1CA8848,
            0);
        bit = 1u << ((unsigned)ebp_i & 31u); /* 465F77 shl eax,cl; ebp = old count */
        *(unsigned int *)(ctx + 0x324) |= bit;
        if ((arg_4 & 0x60u) == 0x40u) {
            *(unsigned int *)(ctx + 0x328) |= bit;
            *(unsigned short *)(ctx + 0x448) = (unsigned short)clut;
            Gfx_UploadCLUTSlot(slot, (int)ebx, ctx);
        }
        goto copy_floats;
    }

    /* count >= 8: slot 0, skip float copy and +24h test */
    slot = ctx + 4;
    goto clut_lookup;

copy_floats: /* loc_465FBB */
    dword_1CB603C = *(unsigned int *)(slot + 0x18);
    dword_1CB6038 = *(unsigned int *)(slot + 0x1C);

check_list: /* loc_465FD5 */
    if (*(unsigned int *)(slot + 0x24) == 0)
        return 0;

clut_lookup: /* loc_465E98 */
    if (var_20C == 2)
        goto output; /* 465E9B jz loc_466029: d==2 skips helpers AND *arg_C */

    if ((unsigned short)clut == 0) { /* 66 83 bc ... cmp word arg_8,0 */
        _sprintf(Buffer, aSsigpuTxSelect, aNull_1, 0, 0);
        clut = 1;
    }
    var_208 = clut & 0xFFFFu;
    idx = sub_466090(ctx, var_208);
    if (idx < 0) { /* test ebx / jge (0F 8D signed) */
        mask = 0x10u << (var_20C * 4u); /* colour count 0x10/0x100 only; d==2 bypasses this block */
        idx = sub_4660D0(ctx, var_208, mask);
        if (idx < 0)
            idx = 0;
        else
            sub_466190(ctx, var_208, idx, (int)mask);
    }

    /* 465FFD/466002 jnz 466014 tests b, not d. Encoded CLUT index,
     * stored at 466027 without NULL guard, only when this block is reached. */
    *arg_C = (unsigned int)idx * 2u
        + ((var_204 == 2u && dword_1CA8A00 == 0) ? 1u : 0u);

output: /* loc_466030; ebp reloaded from var_210 on the *arg_C path */
    if (arg_14 != 0)
        *arg_14 = *(unsigned int *)(slot + var_210 * 4u + 0x34u);

    if ((arg_0 & 2u) != 0) { /* test cl,2 on reloaded arg_0 */
        list = *(unsigned int *)(slot + (var_210 + var_204 * 2u) * 4u + 0x34u);
        if (arg_10 != 0)
            *arg_10 = list;
        return (int)list;
    }
    if (arg_10 != 0)
        *arg_10 = *(unsigned int *)(slot + var_210 * 4u + 0x24u);
    return (int)*(unsigned int *)(slot + var_210 * 4u + 0x2C);
}
```
