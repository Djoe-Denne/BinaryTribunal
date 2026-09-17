# Gpu_BeginPrimitivePass @ 0x460C20

- Nom IDA: `sub_460C20`
- Instr: 21
- Mode: 1+P
- Verdict: CERTAIN — capture le contexte graphique puis, uniquement quand `dword_B7CC20==0`, ouvre/configure le pass de primitives et réinitialise son état
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database

## C réconcilié

```c
int __cdecl Gpu_BeginPrimitivePass(void)
{
    int engine = FFGetBufferAddress();
    dword_1CA9A8C = engine;

    if (dword_B7CC20 != 0)
        return engine;

    int result;
    if (*(int *)(engine + 0x8FC)) {
        result = GfxDriver_SelectRenderTarget(0, engine);
        dword_1CA9E98 = 1;
    } else {
        result = GfxDriver_BeginScene(0, engine);
        dword_1CA9E98 = 0;
    }

    dword_1CA9A84 = 3;
    dword_1CA9EA0 = 1;
    dword_1CA9A88 = 0;
    return result;
}
```

## Preuves et validation parent

1. `460c20 call FFGetBufferAddress` / `460c2b mov dword_1CA9A8C,eax` — capture inconditionnelle du contexte.
2. `460c30 test dword_B7CC20` / `460c32 jnz locret_460C85` — le pass actif n'est initialisé que pour la polarité zéro.
3. `460c34 mov ecx,[eax+8FCh]`; zéro appelle `GfxDriver_BeginScene`, non-zéro `GfxDriver_SelectRenderTarget(0,engine)` — sélection exacte, pas une fin de scène.
4. `dword_1CA9E98` reçoit respectivement 0 ou 1, mémorisant la branche driver.
5. Les trois écritures finales `1CA9A84=3`, `1CA9EA0=1`, `1CA9A88=0` réinitialisent l'état du pass.
6. Callers uniques: `Gpu_DrawOTag` appelle la fonction avant les passes opaque et semi-transparent; le flag vaut 1 au premier appel, 0 au second. Le corps n'agit donc que pour le second pass.
7. Retour EAX 32 bits résiduel: contexte si gate non nul, sinon résultat du wrapper driver. Aucun caller ne le consomme.
