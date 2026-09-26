# decomp — sub_4221E6 (slot-cache engine, le résolveur palette-slot E)

## En-tête
| | |
|---|---|
| EA | `0x4221E6`, size `0x135`, retn `0x422314`(?) fin de corps disasm live @0x422304-314 |
| Type IDA | `int __cdecl sub_4221E6(int a1, int a2, int a3, int a4)` |
| Instr (live) | 92 (fenêtre disasm complète du run) |
| Palier | lot 15 |
| ACCÈS | caller direct unique = `sub_407EB4` @0x407fef |

## C réconcilié

> Ground truth = disasm live @0x4221E6..0x422314, Hex-Rays relué dessus :
> `v8 = 72*a1 + *(M+0x40)` [SLOT E].

```c
int __cdecl sub_4221E6(int a1_palette_idx, int a2_M, int a3_(TIMc+0x94), int a4_(TIMc+0x98)) {
    engine_root = FFGetBufferAddress();                   /* @0x4221ec */
    var_C = 0;                                            /* @0x4221f4 — trigger flag */
    E = engine_root_slot + a1_palette_idx * 0x48;         /* @0x4221fb / @0x422204 base @+0x40 → @0x422209 */
    if (*E != 0) {                                        /* @0x42220f : slot déjà stocké */
        if (E[0x40] == engine_root[758])                  /* @0x42221d ([root+BD8h]) */
            E[0x44] += 1;                                 /* @0x422225-31 frame-counter hit */
        else {
            E[0x40] = engine_root[758];                   /* @0x422242 */
            E[0x44] = 0;                                  /* @0x422248 */
        }
    } else {
        sub_421C41(a1_palette_idx, a4, E);                /* @0x422260 — palette TIM remap init */
        *E = 1;                                            /* @0x42226b engaged */
        if (E[1] != 0) {                                   /* @0x422274 */
            if ((engine_active = engine_root[0xBDC]) != 0)  /* @0x42227e-0x42228a */
                { if (engine_root[0xBD4] <= 0) lim = 0x140000; else lim = engine_root[0xBD4];
                  if (sub_422451(engine_active) >= lim)     /* @0x4222ba-0x4222c6 */
                    sub_42206E(engine_active); }           /* @0x4222cc — cache purge */
            sub_421F9A(a3, a4, E);                          /* @0x4222e3 — le create-texture engine timestamp */
            E[0x40] = engine_root[758];                     /* @0x4222f7 */
            E[0x44] = 0;                                    /* @0x4222fd */
        }
    }
    if (E[1]) { var_C = 1; }                              /* @0x422304-3d */
    return var_C;
}
```

## Faites structurels

| Fait | Anchre EA |
|---|---|
| heap基地 E = *(M + 0x40), stride **0x48** | @0x422204-0x422209 |
| cache-commit hit test `E[0x40] == *(engine_root+0xBD8)` | @0x42221d |
| slot E renouvelé micro-frame (E+0x44) | @0x422231 |
| engine alloc init `*(engine+0xBDC/0xBD4)` | @0x422281-4222a0 |
| texture-create via sub_421F9A (push ordre **E** en a4=+2C/+30/+38 fort) | @0x4222e3 |
| sub_421C41 remap init champ « @ instructor arg_4 (+0x3C/color) » | @0x422260 |

## Divergences Hex-Rays vs ASM
- Arevoir : Hex-Rays pré-Dispositionait « a2 = *a4+? » — l'ASM montre un**slot E stoqué sur (M+0x40) + idx*0x48** ; la récursive
  la TLS-Sequence-Block cache-table ne clean pas avec le décomp — **l'ASM gagne.**
