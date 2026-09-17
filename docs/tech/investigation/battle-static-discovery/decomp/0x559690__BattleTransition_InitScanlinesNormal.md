# BattleTransition_InitScanlinesNormal @ 0x559690

- File demandée: `0x5596D0`; correction parent: cette EA est le push du descripteur dans la fonction commencée à `0x559690`.
- Instr: 58
- Mode: 1+P
- Verdict: CERTAIN — crée la draw-list de transition normale, initialise les extrémités du profil scanline, génère les milieux, capture l'écran et classe le timing
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database

## C réconcilié

```c
int __cdecl BattleTransition_InitScanlinesNormal(unsigned char *engine)
{
    GfxDrawListDesc desc;
    Gfx_InitDrawListDesc(dword_1CA8A00 ? 2 : 0, &desc);
    dword_204E2E0 = Gfx_CreateDrawList(
        1, 0x13, &desc, NULL, *(void **)(engine + 0xA50));

    dword_204DB38[0] = rand() % 0x78;
    int last = screen_y - 1;
    dword_204DB38[last] = rand() % 0x78;
    battleswirl_generatescanlinesBuffer(0, last);

    BattleSwirl_EnsureAndCapture(
        dword_204DB2C, dword_204DB30, screen_x, screen_y);

    int delta = time_related_deltaTimeMaybe();
    dword_C76DA8 = (delta <= 0x19);
    return delta;
}
```

## Preuves et validation parent

1. `dword_1CA8A00` choisit filtre 2 ou 0 pour `Gfx_InitDrawListDesc`; ce n'est pas le type de liste.
2. Cinq pushes vers `Gfx_CreateDrawList`: `1,0x13,&desc,0,*(engine+0xA50)`.
3. Deux `idiv 0x78`; restes EDX stockés aux indices 0 et `screen_y-1` du tableau scanline.
4. `battleswirl_generatescanlinesBuffer(0,last)` remplit récursivement les points intermédiaires.
5. `BattleSwirl_EnsureAndCapture(x,y,screen_x,screen_y)` prépare la texture de capture utilisée par la transition.
6. `cmp eax,19h` / `setle cl` est signé: flag vrai si delta ≤25. Retour EAX complet = delta.
7. Caller unique `FFBattleTransitionInitSystem`; nom confirmé par création draw-list + scanlines + capture.
- Risque: le tableau scanline possède 490 DWORD; aucune borne locale ne valide `screen_y-1`, fidèle à l'ASM.
