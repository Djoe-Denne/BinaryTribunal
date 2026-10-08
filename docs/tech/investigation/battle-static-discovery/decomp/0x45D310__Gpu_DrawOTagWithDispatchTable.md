# Gpu_DrawOTagWithDispatchTable @ 0x45D310

- Instr (live): 144 (fin 0x45D529)
- Palier: high
- GLM A: indisponible (pas de MCP glm-decompile cette session ; solo parent)
- GLM B: indisponible (idem)
- A==B: n/a (Hex-Rays decompile MCP live + réconciliation parent contre asm.asm du pack)
- Push IDB: oui
- SetType: non (prototype noteHex : `int __cdecl Gpu_DrawOTagWithDispatchTable(unsigned int ot_head, void **dispatch_table)`)
- Notes parent: 2 args cdecl, add esp,10h au caller (45d2a3..45d2c3 dans 0x45D080) ; 2 appels depuis Gpu_DrawOTag (opaque 45d2a3, semi 45d2be). Tables codées 0xB7CF08/0xB7D308 (g_GpuPrimDispatchOpaque / g_GpuPrimDispatchSemiTransparent présumés). Hex-Rays aligné sur dérivation ASM (v17/var_8 = record sub_45D050, floats ot_heada/var_18 = accumulateur flt_1CA882C).

## C réconcilié

```c
/* Gpu_DrawOTagWithDispatchTable @ 0x45D310
 * Ground truth = live ASM (pack asm.asm). Reconcilié Hex-Rays decompile MCP.
 * 144 instr. fin 0x45D529. cdecl 2 args (ot_head, dispatch_table), caller cleanup.
 * Rôle: comme Gpu_DrawOTag (walker 0x18 du pool OT, chainage 24 bits) mais la
 * dispatch GP0 par code u8 [pkt+7] passe par LA TABLE PASSEE EN ARGUMENT
 * (dispatch_table[code] -> sub_46cxx Gpu_EmitPolyF3/FT3/FT4 ...).
 * Scale/offset shader setup selon node+14h bit0 (B7CC00/04, B7CC1C=10h/0Dh, 1CA89FC).
 * Code &~3 == 0x20/0x28 (F3/F4) + dword_1CA8880 => mask bit1 (0xFD).
 * float accumulateur: flt_1CA882C <- (2*rec[0xC]-2)*rec[0x18] balisé, puis
 * par chemin externe: dword_1CA89BC = (extHead - rec[0x24])>>2 ; × rec[0x18] :
 *   même rec => flt_1CA882C ; autre rec => += var_4 précédent. dword_1CA89A4 = rec[8].
 */

int __cdecl Gpu_DrawOTagWithDispatchTable(unsigned int ot_head, void **dispatch_table)
{
    unsigned int head = ot_head;                    /* 45d316 */
    int        rec  = sub_45D050(head);             /* 45d31c/45d321 */
    if (!rec)                                       /* 45d326..45d32c */
        return rec;                                 /* epilogue ret: eax=rec=0 */

    sub_460B20(0x10000);                            /* 45d332 */
    int    count  = *(int *)(rec + 0x0C);           /* 45d33c */
    dword_1CA884C = 0xFFFFFFFF;                     /* 45d348 */
    float  acc    = (float)(2 * count - 2) * *(float *)(rec + 0x18); /* 45d352..45d367 */
    flt_1CA882C   = acc;                            /* 45d361 */

    while (head != 0)                               /* 45d36b/45d51b */
    {
        if (head < (unsigned)g_OtNodePool || head >= (unsigned)&g_OtNodePoolCursor)
        {
            /* --- chemin externe (noeud hors pool) --- */
            int extrec = sub_45D050(head);          /* 45d4b9 */
            if (!extrec) break;                     /* (A: jz epilogue pas observe ici, test vitesse) */
            dword_1CA89BC = (int)(head - *(int *)(extrec + 0x24)) >> 2; /* 45d4be..45d4d4 */
            dword_1CA89A4 = *(int *)(extrec + 8);   /* 45d4c3/45d4dc */
            float term = (float)dword_1CA89BC * *(float *)(rec + 0x18);  /* 45d4d4..45d4e2 */
            if (extrec == rec) { flt_1CA882C = term;      acc = term;      } /* 45d4e5/45d4e7 */
            else               { flt_1CA882C = term + acc; acc = flt_1CA882C; } /* 45d4fb..45d505 */
            head = *(unsigned *)head;               /* 45d509 */
            if ((head & 0xFFFFFF) == 0xFFFFFF)      /* 45d50d..45d517 */
                return 0xFFFFFF;
            continue;                               /* 45d519 -> 45d371 */
        }

        /* --- noeud en pool --- */
        void *node = (void *)head;                  /* ebp */
        void *pkt  = *(void **)node;                /* 45d395/45d397 */
        dword_1CA8A08 = (int)head;                  /* 45d38f */
        flt_1CA882C   = acc;                        /* 45d39a */
        unsigned L = *(unsigned *)pkt;              /* 45d3a0 */
        dword_1CA89B0 = L >> 24;                    /* 45d3a2..45d3a7 tag = compte de mots */
        int cnt = dword_1CA89B0;
        if (cnt > 0)
        {
            unsigned char code;
            do
            {
                code = *(unsigned char *)((char *)pkt + 7); /* 45d3b3 */
                int stride = 1;
                if (code != 0)                          /* 45d3bb/45d3bd */
                {
                    unsigned mode = code & ~0x3u;       /* 45d3cd */
                    if (*(unsigned char *)((char *)node + 0x14) & 1) /* 45d3c3.. */
                    { dword_1CA89FC = 1; dword_B7CC00 = dword_B7CC0C; dword_B7CC04 = dword_B7CC10; dword_B7CC1C = 0x10; }
                    else
                    { dword_1CA89FC = 0; dword_B7CC00 = dword_B7CC14; dword_B7CC04 = dword_B7CC18; dword_B7CC1C = 0xD; }
                    if (dword_1CA8880 && (mode == 0x20 || mode == 0x28)) /* 45d435..45d443 */
                        code &= 0xFD;                   /* clear bit1 */
                    if ((dword_1CA8A0C & 1) != 0 || byte_B7CD28[code] != 0) /* 45d445..45d456 */
                    {
                        void (*fn)(unsigned *) = dispatch_table[code]; /* 45d458..45d45c */
                        if (fn) { fn((unsigned *)pkt); cnt = dword_1CA89B0; } /* 45d463..45d466 */
                    }
                    stride = g_PrimitiveWordStride[code]; /* 45d46f..45d47c */
                    if (!stride) stride = 1;            /* 45d47e/45d480 */
                }
                cnt -= stride;                          /* 45d489 */
                pkt = (char *)pkt + 4 * stride;         /* 45d48b */
                dword_1CA89B0 = cnt;                    /* 45d490 */
            } while (cnt > 0);                          /* 45d496 jg */
        }
        unsigned next = L & 0xFFFFFF;               /* 45d49c..45d4a3 */
        if (next == 0xFFFFFF) return 0xFFFFFF;      /* 45d4a8 terminateur */
        head = next | ((*(unsigned char *)((char *)node + 0x16)) << 24); /* 45d4aa..45d4b4 */
    }
    return (int)rec; /* epilogue: eax = dernier res (rec / 0xFFFFFF / sub result) */
}
```

## Preuves ASM (3-8)

1. `45d316/45d31b-45d323` : esi=arg0, `call sub_45D050` → record ebx ; jz sort (ret 0).
2. `45d332-45d367` : `sub_460B20(0x10000)` ; float `flt_1CA882C = (2*[rec+0xC]-2)*[rec+0x18]` via fild/fmul.
3. `45d371-45d383` : bornes pool non signées → chemin externe 45D4B8.
4. `45d38f-45d3a7` : `dword_1CA8A08 = node`, tag = `[pkt]>>24` → 1CA89B0, dispatch si > 0 (jle).
5. `45d3c3-45d425` : setup B7CC00/04, B7CC1C = 10h/0Dh selon `[node+0x14]` bit0 (mirrors 45D080 walker).
6. `45d435-45d443` : mask semi-transparence bit1 pour mode 0x20/0x28 si `dword_1CA8880`.
7. `45d445-45d46c` : `dispatch_table[code]` indirect call, arg = packet edi, `add esp,4`.
8. `45d46f-45d496` : stride `g_PrimitiveWordStride[code]` (défaut 1), count -=, packet += stride*4, jg loop ; terminateur 0xFFFFFF (45d4a8).

## Divergences Hex-Rays

- Hex-Rays modèle `return result` (int auxiliaire) : la sémantique réelle du retour = dernier EAX (record sub_45D050, 0xFFFFFF du terminateur, ou résultat de `and`) — non conçu comme retour documenté (callers 0x45D080 ignorent EAX : les deux appels suivent uniquement).
- La ligne noteHex `if (!extrec) break;` est une annotation parent : l'ASM 45d4be à 45d4d1 ne jz pas systématiquement sur eax — les procédures continuent (désalignement possible si eax nul ; Hex-Rays ne modélise pas ce defail).

## Questions ouvertes

- [rec+0x24]/[rec+0x8]/:[rec+0xC]/[rec+0x18] sémantique record sub_45D050 — provient octets record (là lot C/B).
- sub_460B20(0x10000) — probable reset/alloc 64K scratch ; LIKELY.
