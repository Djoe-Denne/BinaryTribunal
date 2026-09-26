# decomp — sub_421C41 (remap palette + allocation clut/pixels TIM)

## En-tête
| | |
|---|---|
| EA | `0x421C41`, size `0x311`, retn `0x421F51` |
| Type IDA | `void __cdecl sub_421C41(int a1, _DWORD *a2, int a3)` |
| Instr (live) | 216 (couverture fenêtres disasm : [0..70], [70..180], [100..190], [160..260]) |
| Palier | lot 15 |
| ACCÈS | caller unique = `sub_4221E6` @0x422260 — args réels (a1 = palette_idx, a2 = TIM-src = *(D+0x98), a3 = slot E) |

## C réconcilié (sections prouvées, chaque ligne porte son EA)

```c
void __cdecl sub_421C41(int a1_idx, DWORD *a2_TIMsrc, DWORD *a3_E_slot) {
    *(a3 + 0x30) = 0;                                  /* @0x421c56-59 — init pixels-ptr */
    *(a3 + 0x2C) = 0;                                  /* @0x421c60-63 — init clutBuf-ptr */
    if (a2_TIMsrc == 0) goto fin;                      /* @0x421c6a-6e */
    if (*(a2_TIMsrc + 4) == 0) goto fin;               /* @0x421c74-7b guard */
    DWORD *v14 = (DWORD*)(a2_TIMsrc + 0x3C);           /* @0x421c81-87 — v14 = TIM+0x3C */
    if (*v14 + 0x28 != 8) goto fin;                    /* @0x421c8d-91 (cmp [ecx+28h],8) — bpp 8 obligatoire */
    *(a3 + 8) = 0;                                     /* @0x421c9a */
    /* clutBuf alloc : 4 octets × *(v14 + 0x20) — le count palette-entries */
    clut = AllocateMemory(*(v14 + 0x20) * 4, remap.cpp:50);   /* @0x421ca1-0x421cb7 */
    *(a3 + 0x2C) = clut;                               /* @0x421cba-0x421cbd */
    if (*(v14 + 0x1C) <= 0) goto fin;                  /* @0x421cc0-0x421cc7 guard nb clut */
    /* occupancy rmask : 8 DWORD = 256 bit */
    for (i = 0; i < 8; ++i) *(a3 + 4*i + 0xC) = 0;     /* @0x421ce5-0x421ceb */
    flat = assert_calloc(*(v14 + 0x1C), 4, remap.cpp:66);  /* @0x421cf5-0x421d0d — tabel remap T-u32 */
    if (flat == 0) goto fin;
    /* source palette du slot : base = *(v14+0x24) + (idx × entries × 4) */
    pos = lea (*(v14 + 0x24) + (a1_idx * *(v14 + 0x20)) * 4);  /* @0x421d1d-0x421d2a (imul, lea) */
    *(a3 + 0x2C + 4) = *(int*)pos;                     /* @0x421d3c-0x421d41 : *v20 = *v10 (copy entry 0) */
    /* boucle : scanu des entries (v14+0x34 limite = *a2+0x70 vu aussi à l'EA 0x421d77) */
    for (i = 0; i < *(a2_TIMsrc + 0x34); ++i) {        /* @0x421d77 (cmp eax,[edx+34h]) */
        flat[i] = i;                                   /* @0x421d89 */
        *(a3 + 0x2C + i*4) = *pos;                     /* @0x421d92 */
        if ((*(char*)pos + 3) == 0) {                  /* @0x421d99-0x421d9b — **STP = byte3 test** */
            if (i != 0) {                              /* j!=0 @0x421daa */
                var_4 = 1;                              /* @0x421dd6 — full color remap engaged */
                *(a3 + 4*(i>>5) + 0xC) |= 1 << (i & 0x1F);  /* @0x421df0-0x421e02 : **occupancy rmask bit** */
                ...
            } else {
                *v10 = couleur clut (rgb 0 → 0xFF00FF BGR conversion @0x421db2-0x421dc9);
            }
            flat[i] = 0;                               /* @0x421e41-0x421e47 remaptable cas couleur 0 */
        }
        pos += 4; v10 += 4;                            /* @0x421e55-0x421e64 avance */
        *(a3 + 8) += 1;                                /* @0x421e6f-0x421e78 lately-stable pointer */
    }
    /* alloc pixels remap — taille = *(v14+0)*var_8+4 */
    pixel_bytes = *(v14) * *(v14 + 4);                 /* @0x421ea3-0x421ea8 (imul) */
    indices_src = *(a2_TIMsrc + 0xD8);                 /* @0x421e97 (arg TIM-pixels base) */
    remapped = AllocateMemory(pixel_bytes, remap.cpp:161);  /* @0x421ebd-0x421ec8 */
    *(a3 + 0x30) = remapped;                           /* @0x421ec8-0x421ecb — **E+0x30 pixels buffer** */
    for (k = 0; k < pixel_bytes; ++k) {                /* @0x421edb-0x421f10 */
        remapped[k] = flat[ indices_src[k] ];          /* @0x421eee/f07 — remap byte par byte */
    }
    if (remapped == 0) { *(a3 + 0x2C) = 0; }           /* @0x421f30 */
    /* fin de procédure : CompilerDebug(un-freed flat) @0x421f45 */
    retn;                                              /* @0x421f51 */
}
```

## Fait structurels

| Fait | Anchres EA |
|---|---|
| TIMdesc = a2_TIMsrc (le wrapper arg4 de sub_4221E6) | @0x421c74 |
| block-T = a4_TIMsrc + 0x3C | @0x421c84 |
| clut-base = v14+0x24 + idx × entries × 4 | @0x421d1d-0x421d2a |
| entries-count = *(v14 + 0x20) | @0x421cab |
| remap-tbl alloc 4 × entries | @0x421cbd |
| occupancy rmask 8 DWORD = 256 bit (= §known "occupancy groupes 1+2") | @0x421ce5 / @0x421df3 |
| **STP test = byte[3]** du T-u32 | @0x421d9b |
| pixels-source = *(a4 + 0xD8) | @0x421e97 |
| pixel stride = *(v14) × *(v14+4) | @0x421ea3-0x421ea8 |
| remapped buffer storage | **@0x421ec8 → E_slot+0x30** |

## Divergences Hex-Rays vs ASM

Reconstruit à la **main** depuis les fenêtres ASM (pas de décomp de sub_421C41 au pack initial).
La ligne "remapped[k] = flat[indices_src[k]]" est un artifice de pseudocode — la vrai lecture est
`mov dl,[esi+edx*4] ; mov [eax+ecx],dl` @0x421f0a-0x421f0d (1 caractère par octet, pas u32).
Le reste des correspondances est corrigé au-dessus.
