# Gpu_FlushCurrentDrawList @ 0x460C90

- Nom IDA: `sub_460C90`
- Instr: 19
- Mode: 1+P
- Verdict: CERTAIN — soumet la draw-list courante, invalide son stamp, puis efface le pointeur courant
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database

## C réconcilié

```c
int __cdecl Gpu_FlushCurrentDrawList(void)
{
    GfxDrawList236 *list = (GfxDrawList236 *)dword_1CA9A88;
    if (!list)
        return 0;

    Gfx_SetRenderState(0x0E, 1, dword_1CA9A8C);
    Gfx_WalkDrawList(list, dword_1CA9A8C);
    int result = Gfx_InvalidateDrawListStamp(list);
    dword_1CA9A88 = 0;
    return result;
}
```

## Preuves et validation parent

1. `460c90 mov eax,dword_1CA9A88` / `460c97 jz locret` — no-op si aucune liste courante.
2. Trois pushes `engine,1,0Eh` avant `Gfx_SetRenderState` — état 14 forcé à 1; l'annotation live identifie le bit de culling 0x4000.
3. Deux pushes `engine,list` avant `Gfx_WalkDrawList` — cdecl à deux arguments; le pseudo-C Hex-Rays montre un faux premier argument non initialisé, rejeté par l'ASM.
4. `460cc1 call Gfx_InvalidateDrawListStamp` puis `460cc9 mov dword_1CA9A88,0` — invalidation avant oubli du courant.
5. Callers `sub_461100` (flush lors d'un changement de liste/état) et `sub_460CE0` (fin de pass) confirment le rôle.
6. Retour EAX 32 bits: zéro/pointeur courant si no-op, sinon retour de l'invalidation; les callers l'ignorent.
