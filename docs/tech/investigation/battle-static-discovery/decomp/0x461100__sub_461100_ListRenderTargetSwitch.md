# sub_461100 (bascule liste courante + SelectRenderTarget 0/1) @ 0x461100

- Instr (live): 0x461100–0x461209 (~64 instr)
- Rôle: commutateur de draw-list courante appelé par `sub_461A30` (allocateur commun des émetteurs GPU-dispatch) **uniquement quand `dword_B7CC20 == 0`**, c.-à-d. pendant le **pass semi-transparent** de `Gpu_DrawOTag`
- Source: décompilation Hex-Rays + disasm live (anchors EIA conservés)

## Rôle prouvé

1. Si la liste demandée est déjà la liste courante (`dword_1CA9A88`) : simple incrément `dword_1CA9EA4`, rien d'autre.
2. Sinon : **flush de la liste courante** via `Gpu_FlushCurrentDrawList` (`sub_460C90` → `Gfx_WalkDrawList` → slots driver 43–64), puis sélection du render target selon le **code primitive** :
   - `code & 2` (primitives **texturées** : FT3/FT4/gouraud texturés, sprites 0x64–0x7E) → `GfxDriver_SelectRenderTarget(1, engine)` — rendu dans **RT1** ;
   - sinon (flat/gouraud non texturés) → `GfxDriver_SelectRenderTarget(0, engine)` + `Gfx_SetRenderState(2, 1, engine)` (blend ON) — rendu dans **RT0**.
3. La liste courante `dword_1CA9A88` reçoit la nouvelle liste.

## C réconcilié

```c
/* sub_461100 @ 0x461100 — ground truth = live ASM + Hex-Rays (anchors 0x46110c..0x461209)
 * void __cdecl f(int list, unsigned int prim_code)
 * a1 = draw-list cible (retour de Gfx_SelectTexturePageDrawList dans sub_461A30)
 * a2 = code primitive PSX (octet +7 du paquet)
 */
void __cdecl sub_461100(int list, unsigned int prim_code)
{
    if (list == dword_1CA9A88) {           /* 0x46110c */
        ++dword_1CA9EA4;                   /* 0x461115 — même liste: compteur seul */
        return;
    }
    Gpu_FlushCurrentDrawList();            /* 0x46111d call sub_460C90 — flush via Gfx_WalkDrawList (slots 43–64) */
    ++dword_1CA9A7C;                       /* 0x461134 */
    int rt_switch;
    if ((prim_code & 2) != 0) {            /* 0x46113d — primitive TEXTURÉE */
        if (dword_1CA9A84 != 0) {          /* 0x461141 — RT courant != 1 */
            GfxDriver_SelectRenderTarget(1, dword_1CA9A8C);  /* 0x46114b — → RT1 */
            dword_1CA9A84 = 0;             /* 0x46115a */
            rt_switch = (dword_1CA8884 == 0);                /* 0x461169 */
        }
        if (prim_code >= 0x64 && prim_code <= 0x7E)          /* 0x461173 — sprites */
            Gfx_SetRenderState(2, 0, dword_1CA9A8C);         /* 0x46117e — blend OFF */
    } else {                               /* non texturé */
        if (dword_1CA9A84 != 1) {          /* 0x461183 */
            GfxDriver_SelectRenderTarget(0, dword_1CA9A8C);  /* 0x46118d — → RT0 */
            rt_switch = 1;                 /* 0x461192 */
            dword_1CA9A84 = 1;             /* 0x46119a */
        }
        Gfx_SetRenderState(2, 1, dword_1CA9A8C);             /* 0x4611ab — blend ON */
    }
    if (dword_1CCFD84 != 0) {              /* 0x4611ba — variante backend */
        if (rt_switch) {
            Gfx_SetRenderState(0x19, 122, dword_1CA9A8C);    /* 0x4611cb — 0x7A */
            Gfx_SetRenderState(0x18, 5, dword_1CA9A8C);      /* 0x4611da */
            Gfx_SetRenderState(0xB, 1, dword_1CA9A8C);       /* 0x4611ea */
            dword_1CA9A88 = list;          /* 0x4611f2 */
            return;
        }
        Gfx_SetRenderState(0xB, 0, dword_1CA9A8C);           /* 0x461200 */
    }
    dword_1CA9A88 = list;                  /* 0x461209 */
}
```

## Preuves ASM (sélection)

1. `46110c cmp [dword_1CA9A88]` / `461115 inc dword_1CA9EA4` — fast-path même liste.
2. `46111d call sub_460C90` — flush de la liste courante AVANT bascule (donc **par Gfx_WalkDrawList**).
3. `46113d test a2,2 / 461141 jz` — polarité code&2 = texturé.
4. `46114b call GfxDriver_SelectRenderTarget` avec arg 1 — **RT1** pour les texturés.
5. `461173 cmp a2,64h..7Eh` + `46117e Gfx_SetRenderState(2,0)` — sprites : blend OFF, toujours RT1.
6. `46118d GfxDriver_SelectRenderTarget` avec arg 0 + `4611ab SetRenderState(2,1)` — RT0 + blend pour les non-texturés.
7. `461209 mov dword_1CA9A88, a1` — la nouvelle liste devient courante.

## Conséquence capture

Toutes les listes basculées ici finissent, au flush, dans `Gfx_WalkDrawList` (0x4178D7) → slots driver 43–64 : **ce chemin est wrappable/capturable**. La polarité RT1 (texturés) vs RT0 (flat) organise le compositing framebuffer PSX (RT1) vs écran direct (RT0) ; le contenu initial de RT1 (fond/ciel) ne provient pas de ces draws (voir `driver-passthrough/CLOSURE_sky-path.md`).
