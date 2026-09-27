# decomp — sub_43DF2A (slot 45, DDrawAlt)

## En-tête
| | |
|---|---|
| EA | `0x43DF2A`, size `0x29`, retn `0x43DF52` |
| Type IDA | `int __cdecl sub_43DF2A(int a1, int a2, int a3)` |
| Instr (live) | 13 |
| Palier | closure walk-direct bind (lot 15) |
| ACCÈS | via fnptr driver slot +0xB4 (store @0x425971 dans `RenderBackend_Construct_DDrawAlt`) |

## C réconcilié

> Préambule : ground truth = live ASM (`sub_43DF2A` disasm complet de ce run), Hex-Rays relué dessus.
> Taille 0x29, plage 0x43DF2A..0x43DF52, 3 args cdecl (pile droite→gauche), ebp frame standard.

```c
int __cdecl sub_43DF2A(int a1 /*ctx*/, int a2, int a3 /*cookie*/){
    if (*(DWORD*)(a1 + 0x30) == 0)         /* @0x43DF31 gate (*(ctx+0x30)) */
        return a1;                          /* retn @0x43DF52 */
    /* sub_441581(*(a1+0x38), a3) */
    return sub_441581(*(DWORD*)(a1 + 0x38), a3);  /* @0x43DF48 matdesc, cookie */
}
```

## Faits structurels
- **Slot 45 (+0xB4)** : thunk de commit render-state pur. (Mapping exact type de
  liste→slot 45 non établi dans ABI §6 ; ne pas l'inventer — seul le ctor 0x425971
  est prouvé pour le numérotage.)
- `*(a1+0x30)` = gate du ctx (unique contrôle de flux).
- `*(a1+0x38)` = matdesc (shadow render-state 0x64, produit par `sub_407B59` →
  `Render_sub_4070E2` calloc @0x4070F9).
- Le callee `sub_441581(matdesc, cookie)` fait :
  - gate `*(cookie+0xAC4)` @0x44158A,
  - `texobj = *(matdesc+0x14)` @0x4415A7,
  - device-lost check `[*(texobj+8)VT+0x60]` @0x4415D5,
  - `sub_41F99A(matdesc, cookie)` (= `sub_41EF7A(1, matdesc, cookie)`) @0x4415FC/0x44160E
    — c'est là que le bind texture (SetTexture via `sub_41ED69` → `sub_41EF3C`
    `call [deviceVT+0x98]`) SE PRODUIT si `*(matdesc+0x14) != 0` et bit 0x2.
  - si `*(texobj+8) == 0` → `sub_41EF7A(0, matdesc, cookie)` @0x441622 : **enable=0,
    pas de re-bind** (chemin direct : matdesc+0x14 = 0 → jamais bindé depuis ce slot).

## Divergences Hex-Rays vs ASM
- Aucune : `sub_441581(v4, a3)` est un call cdecl à 2 args (push droite→gauche :
  `push eax /*a3*/ @0x43DF44`, `push ecx /*matdesc*/ @0x43DF46`, `call` @0x43DF48,
  `add esp,8` @0x43DF4D), confirmé live.
