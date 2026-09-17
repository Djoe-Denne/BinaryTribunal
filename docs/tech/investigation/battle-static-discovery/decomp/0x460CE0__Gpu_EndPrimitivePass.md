# Gpu_EndPrimitivePass @ 0x460CE0

- Nom IDA: `sub_460CE0`
- Instr: 23
- Mode: 1+P
- Verdict: CERTAIN — clôt le pass courant; la polarité `dword_B7CC20!=0` soumet les listes TPage, la polarité zéro flush la liste puis restaure/quitte le driver
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database

## C réconcilié

```c
int __cdecl Gpu_EndPrimitivePass(void)
{
    if (dword_B7CC20 != 0)
        return Gfx_SubmitTexturePageLists(); /* tail-call */

    Gpu_FlushCurrentDrawList();
    if (dword_1CA9E98 != 0) {
        GfxDriver_SetBlendMode(4, dword_1CA9A8C);
        return GfxDriver_SelectRenderTarget(0, dword_1CA9A8C);
    }
    return GfxDriver_LeaveScene(dword_1CA9A8C);
}
```

## Preuves et validation parent

1. `460ce0 mov eax,dword_B7CC20` / `460ce7 jnz 460D26` / `460d26 jmp Gfx_SubmitTexturePageLists` — tail-call exact pour la polarité non nulle.
2. Polarité zéro: `460ce9 call sub_460C90`, désormais `Gpu_FlushCurrentDrawList`.
3. `460cf5 jz 460D16` — si le begin-pass avait pris `GfxDriver_BeginScene` (`dword_1CA9E98=0`), la fin appelle `GfxDriver_LeaveScene`.
4. Sinon, pushes `engine,4` vers `GfxDriver_SetBlendMode`, puis `engine,0` vers `GfxDriver_SelectRenderTarget`: restauration blend/target, pas présentation de frame.
5. Callers uniques: les deux fins de pass dans `Gpu_DrawOTag`, après tables opaque puis semi-transparente.
6. Retour EAX 32 bits = retour du tail-call ou du dernier wrapper driver; caller ignorant.
