# sub_45CEE0 (debug walker OT via g_SoftwarePrimDispatch) @ 0x45CEE0

- Instr (live): 95 (fin 0x45D04C)
- Palier: high
- GLM A/B: indisponibles (solo parent ; réconciliation Hex-Rays optionnelle non requise — dérivation directe ASM)
- Push IDB: oui
- SetType: non (prototype noteHex : `void __cdecl alt_DrawOTag_SoftwareDispatchOnly(unsigned int ot_head)`)
- Notes parent: annotation IDB existante sur 0x45cee0 : « Alternative DrawOTag walker through g_SoftwarePrimDispatch. Direct callers are B65xxx overlay/debug paths; the standard battle frame reaches Gpu_DrawOTag at 0x45D080 instead. » §5.6 : 5 xrefs code toutes dans 0xB65xxx (overlay/debug), pas de xref data.

## C réconcilié

```c
/* alt_DrawOTag walker (debug/overlay) @ 0x45CEE0 — resolution depuis ASM
 * 95 instr. fin 0x45D04C. cdecl 1 arg (ot_head), caller cleanup, pas de retour documente.
 * Identique a 0x45D080 MAIS : une seule table de dispatch (g_SoftwarePrimDispatch
 * @0xB7DC18 selectionnee DIRECTEMENT par le code GP0 [pkt+7]) — pas de
 * g_TexturePageDirtyDispatch, pas de gates dword_1CA8A0C/byte_B7CD28/B7CC24,
 * pas de re-emission opaque/semi, et reset dword_1CA8880 = 0 a l'entree.
 * Garde capacite (cursor-pool)/0x18 >= 0x4000 ; chainage 24 bits
 * (n[0x16]<<24 | L&0xFFFFFF), terminateur 0xFFFFFF ; stride g_PrimitiveWordStride
 * [code] (defaut 1) ; hors pool => sub_45D050, flag [rec+4]=1, si nul => sortie (EAX 0).
 */

void __cdecl sub_45CEE0(unsigned int ot_head)          /* 45cee0 */
{
    if ((g_OtNodePoolCursor - (unsigned)&g_OtNodePool) / 0x18 >= 0x4000)   /* 45cee6..45cf07 */
        return;

    dword_1CA8880 = 0;                                 /* 45cf11 reset global mask mode */
    unsigned head = ot_head;                           /* 45cf0d */
    if (head == 0) return;                             /* 45cf1b/45cf1d */

    while (head)                                       /* 45d03f/45d041 */
    {
        if (head < (unsigned)&g_OtNodePool || head >= (unsigned)&g_OtNodePoolCursor) /* 45cf23..45cf35 */
        {
            int rec = sub_45D050(head);                /* 45d01a */
            if (!rec) return;                          /* 45d022/45d024 */
            *(int *)(rec + 4) = 1;                     /* 45d028 flag record */
            head = *(unsigned *)head;                  /* 45d026 */
            if ((head & 0xFFFFFF) == 0xFFFFFF) return; /* 45d031..45d03d */
            continue;                                  /* 45d03f */
        }

        void *node = (void *)head;
        void *pkt = *(void **)node;                    /* 45cf3b/45cf3d ebx/edi */
        unsigned L = *(unsigned *)pkt;
        int cnt = L >> 24;                             /* 45cf3f..45cf4c */
        dword_1CA89B0 = cnt;
        while (cnt > 0)                                /* 45cff7 jg loop */
        {
            unsigned char code = *(unsigned char *)((char *)pkt + 7); /* 45cf54/45cf59 */
            int stride = 1;
            if (code != 0)                             /* 45cf5e/45cf60 */
            {
                if (*(unsigned char *)((char *)node + 0x14) & 1) /* 45cf66.. */
                { dword_B7CC00 = dword_B7CC0C; dword_B7CC04 = dword_B7CC10; dword_1CA89FC = 1; dword_B7CC1C = 0x10; }
                else
                { dword_B7CC00 = dword_B7CC14; dword_B7CC04 = dword_B7CC18; dword_1CA89FC = 0; dword_B7CC1C = 0xD; } /* 45cf98..45cfb8 */

                void (*fn)(unsigned *) = g_SoftwarePrimDispatch[code]; /* 45cfc2 dispatch direct u8 */
                if (fn) fn((unsigned *)pkt);           /* 45cfc9..45cfce */
                stride = g_PrimitiveWordStride[code];  /* 45cfd9..45cfe1 */
                if (!stride) stride = 1;               /* 45cfe3/45cfe5 */
            }
            cnt -= stride;                             /* 45cfea */
            pkt = (char *)pkt + 4 * stride;            /* 45cfec */
            dword_1CA89B0 = cnt;
        }

        unsigned next = *(unsigned *)pkt & 0xFFFFFF;   /* 45cffd/45cfff */
        if (next == 0xFFFFFF) return;                  /* 45d004/45d009 */
        head = next | ((unsigned)(*(unsigned char *)((char *)node + 0x16)) << 24); /* 45d00b..45d017 */
    }
}
```

## Preuves ASM (3-8)

1. `45cee6-45cf07` : garde capacité (magie /0x18, `cmp 0x4000`, `jge` signé).
2. `45cf11` : `dword_1CA8880 = 0` en entrée (diffère de 0x45D080 qui le fait aussi — 45d0b4 — mais ici répétition unique).
3. `45cfc2-45cfce` : dispatch unique `g_SoftwarePrimDispatch[code u8 @pkt+7]` arg=pkt, `add esp,4`.
4. `45cf66-45cfb8` : setup B7CC00/04, `1CA89FC`, `B7CC1C=10h/0Dh` selon node+14 bit0.
5. `45cfd9-45cfe5` : stride `g_PrimitiveWordStride[code]` (défaut 1).
6. `45cffd..45d017` : chainage 24 bits + terminateur `0xFFFFFF`.
7. `45d019-45d03d` : chemin externe `sub_45D050`, flag `[rec+4]=1`, sortie si nul, terminateur 0xFFFFFF.
8. `45cf3b..45cf60` etc — pas d'émission opaque/semi ni accumulation float (diffère dence vs 45D080/45D310).

## Divergences Hex-Rays

n/a (dérivation directe live ; pas de conflit Hex-Rays postulé).

## Questions ouvertes

- Les 5 callers 0xB65xxx = base overlay/debug (segments @0xB65xxx) — vérifier la liaison à un module debug (lot F/workspace stage).
