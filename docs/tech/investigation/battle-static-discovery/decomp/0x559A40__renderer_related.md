# renderer_related @ 0x559A40

- Nom proposé (markdown seul, nom IDA gardé en ancre) : `BattleTransition_SetupRenderViewport`
- Instr: 50
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=CERTAIN, B=CERTAIN, R=CERTAIN — nom IDA générique)
- Callers: `BattleTransition_RunNormal` @0x5599EF et `BattleTransition_RunBoss` @0x559F17, chaque frame t>70 (avant le test de fin)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, consommateur du viewport prouvé = `Gfx_SubmitViewportLists` (0x499EA0, lectures 0x499F06–0x499F7C)

## C réconcilié

```c
/* =============================================================================
 * 0x559A40  renderer_related — C réconcilié (rôle R, méthode triple GLM)
 * -----------------------------------------------------------------------------
 * Ground truth = live ASM (asm.asm, 50 instructions, .text @ 0x559A40,
 * base 0x400000, taille IDB 168 octets) + ida_dump_bytes, NOT Hex-Rays.
 * hexrays.c utilisé uniquement comme vérificateur.
 *
 * Type IDA    : int() — conservé : eax = retour de isGetDrawBuf2, inchangé
 *               jusqu'au retn @0x559AE7 (aucune instruction ne touche eax).
 * Sauvegardes : ebp, esi, edi. Locales : sub esp,0x10 ([ebp-10h]..[ebp-4h]).
 * Cleanup     : UN SEUL `add esp,28h` @0x559ADF = 40 octets
 *               = SetResolution 16 + isGetDrawBuf 8 + isGetDrawBuf2 16.
 *               FFGetBufferAddress : 0 args, rien à nettoyer.
 * Callers     : BattleTransition_RunNormal @0x5599EF,
 *               BattleTransition_RunBoss   @0x559F17 (fan-in = 2, exact).
 * Divergences tranchées : voir reconcile_notes.md (memset Hex-Rays = idiome,
 *               store Render_Height après pushes = quirk sans effet,
 *               zéroage var_8->var_C->var_10 = 3 movs distincts, pas un memset).
 * =============================================================================
 */

typedef unsigned int DWORD;   /* dwords bruts, fidèle ASM */

/* --- Externes nommés (noms portés par l'IDB / pack) --- */
extern int  FFGetBufferAddress(void);                    /* 0x559A48, 0 args */
extern void SetResolution(int x, int y, int w, int h);   /* 0x559AA8, cdecl */
extern void isGetDrawBuf(void *dst /* struct 16o */, void *buffer); /* 0x559ACE */
extern int  isGetDrawBuf2(int a, int b, int c, void *buffer);       /* 0x559ADA */

/* --- Globals (dword) --- */
extern DWORD High_resolution;   /* lu uniquement (test/jz @0x559A54..56) */
extern DWORD Render_X_Axis;
extern DWORD Render_Y_Axis;
extern DWORD Render_width;
extern DWORD Render_Height;

/* Bloc local 16 octets passé à isGetDrawBuf :
 *   [ebp-0x10] var_10 = 0
 *   [ebp-0x0C] var_C  = 0
 *   [ebp-0x08] var_8  = 0
 *   [ebp-0x04] var_4  = 0x3F800000 (= 1.0f, ancre float IEEE 754) */
typedef struct DrawBufReq {
    DWORD field_0x00;   /* 0 */
    DWORD field_0x04;   /* 0 */
    DWORD field_0x08;   /* 0 */
    DWORD field_0x0C;   /* 0x3F800000 = 1.0f */
} DrawBufReq;

int renderer_related(void)
{
    DWORD buffer;           /* edi — eax de FFGetBufferAddress, réutilisé x2 */
    DrawBufReq req;         /* var_10..var_4 */
    int ret;                /* eax conservé depuis isGetDrawBuf2 */

    buffer = (DWORD)FFGetBufferAddress();        /* 559A48 ; mov edi,eax */

    if (High_resolution) {                       /* 559A4F test / 559A56 jz loc_559A79 */
        /* high-res : origine (0,0), plein cadre 640x480 */
        Render_X_Axis = 0;                       /* 559A61 (eax=0)   */
        Render_Y_Axis = 0;                       /* 559A66 (ecx=0)   */
        Render_width  = 640;                     /* 559A6C (edx=280h)*/
        Render_Height = 480;                     /* 559A72 (esi=1E0h)*/
    } else {
        /* low-res : 320x240 (140h x F0h) centré en (160,120) = (A0h,78h)
         * dans le cadre 640x480 — viewport moitié centré. */
        Render_X_Axis = 160;                     /* 559A88 (eax=A0h) */
        Render_Y_Axis = 120;                     /* 559A8D (ecx=78h) */
        Render_width  = 320;                     /* 559A93 (edx=140h)*/
        Render_Height = 240;                     /* 559A99 (esi=F0h) */
    }
    /* loc_559A9E : push esi / push edx / push ecx / push eax
     * => cdecl droite->gauche : SetResolution(x, y, w, h). */
    SetResolution(Render_X_Axis, Render_Y_Axis,
                  Render_width, Render_Height);  /* call @559AA8 — 16 o */
    /* QUIRK @559AA2 : `mov Render_Height, esi` s'exécute APRÈS les 4 pushes
     * (559A9E..A1) mais AVANT le call. Sans effet : les pushes capturent les
     * registres (eax/ecx/edx/esi), pas les globales — aucune aliasing. */

    /* 559AAD lea eax,[ebp+var_10] ; 559AB0 push edi ; 559AB1 push eax.
     * Zéroage ASM réel (ordre inversé vs lecture logique) :
     * var_8 @559AB2 -> var_C @559AB9 -> var_10 @559AC0 (3 movs dword 0,
     * PAS un call memset) ; puis var_4 = 3F800000h @559AC7. */
    req.field_0x00 = 0;                          /* var_10 @559AC0 */
    req.field_0x04 = 0;                          /* var_C  @559AB9 */
    req.field_0x08 = 0;                          /* var_8  @559AB2 */
    req.field_0x0C = 0x3F800000;                 /* var_4  @559AC7 = 1.0f */

    isGetDrawBuf(&req, (void *)buffer);          /* call @559ACE — 8 o */

    /* 559AD3 push edi ; 559AD6/D8 push 1,1,1
     * => cdecl : isGetDrawBuf2(1, 1, 1, buffer). */
    ret = isGetDrawBuf2(1, 1, 1, (void *)buffer);/* call @559ADA — 16 o */

    return ret;   /* 559ADF add esp,28h ; pop edi/esi ; mov esp,ebp ; retn @559AE7
                     eax (isGetDrawBuf2) intact jusqu'au retn */
}
```

## Preuves et validation parent

1. **Bifurcation résolution** : 0x559A54 `test eax,eax` / 0x559A56 `jz` sur `High_resolution` — hi-res 640×480 (0x280×0x1E0) origine (0,0) @0x559A5C–0x559A72 ; low-res 320×240 (0x140×0xF0) centré origine (160,120) = (0xA0,0x78) @0x559A79–0x559A99, soit viewport moitié centré dans le cadre 640×480.
2. **4 globals `Render_*` + `SetResolution`** : écritures de `Render_X_Axis` / `Render_Y_Axis` / `Render_width` dans chaque branche puis `Render_Height` @0x559AA2 ; pushes (h,w,y,x) 0x559A9E–0x559AA1 droite→gauche → `call SetResolution(x,y,w,h)` @0x559AA8.
3. **Clear-color vec4** : 0x559AB2–0x559AC7 construisent {0,0,0,1.0f} (`mov [ebp+var_4],3F800000h` @0x559AC7 = 1.0f) ; args `push edi` @0x559AB0 / `push eax` (lea var_10) @0x559AB1 → `call isGetDrawBuf(&vec4, buffer)` @0x559ACE.
4. **Prep buffer** : pushes edi,1,1,1 0x559AD3–0x559AD9 → `call isGetDrawBuf2(1,1,1,buffer)` @0x559ADA ; eax conservé jusqu'au retn @0x559AE7 (retour de la fonction).
5. **Cleanup cumulé** : un seul `add esp,28h` @0x559ADF = 40 = SetResolution 16 + isGetDrawBuf 8 + isGetDrawBuf2 16 — arités cdecl prouvées (4+2+4 args), aucune lib call inventée.
6. **Miroir boss** : call miroir dans `BattleTransition_RunBoss` @0x559F17 suivi de `cmp edi,52h` (82) / `jl` @0x559F1C–0x559F1F — même ordre call-avant-test-de-fin que le runner normal (`559962 jg loc_5599EF` → call @0x5599EF → `cmp edi,48h`).

## Divergences

1. **« memset(v6,0,12) » Hex-Rays = idiome** : l'ASM ne contient aucun call entre 559AC0 et 559AC7 — trois `mov dword 0` distincts (ordre réel var_8 → var_C → var_10, inversé vs l'ordre logique). Le C réconcilié écrit 3 affectations individuelles.
2. **Quirk store `Render_Height` @559AA2 après les pushes** : le store global tombe entre les pushes (0x559A9E–0x559AA1) et le call @0x559AA8 — les 4 args viennent des registres eax/ecx/edx/esi, jamais relus depuis les globales ⇒ aucun effet observable. Le C réconcilié place les 4 stores avant le call (sémantique équivalente) et documente le quirk inline.
3. **Nom tranché A vs B** : A `BattleTransition_SetupRenderViewport` vs B `BattleTransition_SetupRenderResolution` — tranché : A. `SetResolution` reçoit 4 dims (x,y,w,h) et la fonction écrit les 4 globals consommés comme viewport complet (origine + dimensions) par `Gfx_SubmitViewportLists` (0x499EA0) ; « Resolution » ne couvrirait que W×H et masquerait l'origine (160,120) low-res.
