# decomp — sub_43E0E2 (slot 48/49/50 « walk direct », DDrawAlt)

## En-tête
| | |
|---|---|
| EA | `0x43E0E2`, size `0xB5`, retn `0x43e196` |
| Type IDA | `int __cdecl sub_43E0E2(int a1, int a2, int a3)` (prototype Hex-Rays relu ASM) |
| Instr (live) | 59 |
| Palier | lot 15 (closure walk-direct texture chain) |
| ACCÈS | via fnptr driver slot (xref DATA unique @0x4259F3 dans `presentation::RenderBackend_Construct_DDrawAlt`) |

## C réconcilié

> Preamble : ground truth = asm live (fenêtre disasm `sub_43E0E2` complète de ce run), Hex-Rays relué dessus.
> Taille 0xB5, plage 0x43E0E2..0x43E196, 3 args cdecl (pile droite→gauche), sauvegardes ebp/esp standard.

```c
int __cdecl sub_43E0E2(int a1 /*node walk-direct*/, int a2 /*part slot-node*/, int a3 /*ctx engine*/){
    if (*(DWORD*)(a1 + 0x30) == 0)                    /* @0x43e0e9 gate */
        return a1;                                    /* retn @0x43e196 */
    DWORD* w = (DWORD*)*(DWORD*)(a1 + 0x38);          /* @0x43e0f6 — wrapper « palette-dev entry » */
    sub_441581(w, a3);                                /* @0x43e104 (args : w @0x43e100, a3 @0x43e0ff) */
    DWORD* texinfo = (DWORD*)*(DWORD*)(a2 + 0x2C);    /* @0x43e10f (N) */
    if (*(DWORD*)(texinfo + 0x80) != 0xFFFFFFFF)      /* @0x43e112 idx != -1 */
        sub_407EB4(*(DWORD*)(texinfo + 0x80), (int)w);/* @0x43e12c idx, W ; add esp,8 @0x43e131 */
    if (*(DWORD*)(texinfo + 0xA4))                    /* @0x43e13a */
        ((void(*)(DWORD*,DWORD*,int,int))(**(DWORD***)(a3+0x314) + 0x64))  /* @0x43e167 */
            (*(DWORD**)(a3+0x314), *(DWORD**)(a3+0x314), 1, *(DWORD**)(texinfo+0xA8));
    else
        ((void(*)(DWORD*,DWORD*,int,int))(**(DWORD***)(a3+0x314) + 0x64))  /* @0x43e190 */
            (*(DWORD**)(a3+0x314), 1, (DWORD*)(texinfo+0xAC));
    return a1;
}
```

## Faites structurels
- **Les offsets du node = a1** (pas a2) : +0x30 gate / +0x38 wrapper.
- **le a2 est une structure secondaire** : seul champ utilisé = `+0x2C` = pointeur « texinfo »,
  avec +0x80 (idx palette texobj), +0xA4 (flag), +0xA8/+0xAC (draw-arg / inline).
- Le call à `sub_407EB4` (@0x43e12c) reçoit en a1 = *(texinfo+0x80) et en a2 = W — NSI
  Notez que le a2 **n'est PAS derivé de texinfo** mais d'un champ du node (+0x38).
- Comparé avec `RenderDDrawAlt_DrawIndexedPrimitive_FVF1C4` @0x43E24A : mémé hook driver
  `+0x314` (a3) + même vtable `call [eax+64h]` @0x43e308 — donc le « slot pass-through » du
  passthrough = le device DrawIndexedPrimitive faible (LireDrawPrimitive + enface [+0x2C+0x108"DIB3"]).

## Divergences Hex-Rays vs ASM
- Aucune diverge série detectée sur ce corps : les `c_dec`-compares Hex-Rays
  reliaient `sub_441581(v4, a3)` en un arg-B de pile cdecl — confirmé ASM (push-ordre droite→gauche @0x43e0ff/0x43e100).
- La fenêtre vtable `[eax+0x64]` a un 1-pilefait « inline » plutôt qu'UNE méthode __thiscall
  — les 4 args restent en pile après call (pas d'add esp ; le callee conventionne stdcall/dansre).
