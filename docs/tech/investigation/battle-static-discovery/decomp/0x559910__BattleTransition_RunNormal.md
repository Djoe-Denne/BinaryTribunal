# BattleTransition_RunNormal @ 0x559910

- Instr: 89 (0x559910..0x559A03, taille 0xF4 = 244 octets)
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=CERTAIN, B=CERTAIN, R=CERTAIN)
- Caller: unique `FFBattleTransitionModule` @0x5598AA (close)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1 ; `renderer_related` appelé à CHAQUE frame t>70 (R tranche contre B), xrefs vérifiées (1 code, 0 data).

## C réconcilié

```c
/* ============================================================================
 * c_reconciled.c — BattleTransition_RunNormal @ 0x559910 (base 0x400000)
 * Reconnaissance C réconciliée (rôle R, triple GLM) — voix A (c_a.c) vs voix B (c_b.c),
 * tranchées contre l'ASM live (asm.asm, ground truth). hexrays.c = vérificateur.
 *
 * Métadonnées :
 *   Instr (live) : 89 (0x559910..0x559A03, taille 0xF4 = 244 octets)
 *   Palier       : triple GLM 2 voix aveugles + réconciliation
 *   Type IDA     : BOOL __cdecl(int, int) — (t, ctx)
 *   Sauvegardes  : ebp (frame) ; esi @0x559916 (ctx) ; edi @0x55991A (copie de t @0x559959)
 *   Notes parent : arité Phase1 = 4 args (t, f, 0, ctx) vs Phase2 = 3 args (t-20, f, ctx) ;
 *                  writeback mov [ebp+arg_0], eax @0x5599C5 (t-20 réécrit dans le slot,
 *                  relu par fild @0x5599C9) ; bande morte t=71 (ret 0 après renderer_related) ;
 *                  cleanup fusionné add esp,1Ch @0x55995C ; bornes runner 70 (0x46) @0x55995F
 *                  et 72 (0x48) @0x5599F4 ; corps Phase2 (0x559C70) SANS garde.
 *
 * Préambule : Ground truth = live ASM (asm.asm) + ida_dump_bytes, PAS Hex-Rays.
 * Conventions : cmp/jg/jl SIGNED (t = compteur de frames positif) ; tous les appels
 * cdecl, esp nettoyé par le caller (add esp explicites).
 * ========================================================================== */

#ifndef BOOL
typedef int BOOL; /* 4 octets, retour dans eax */
#endif

/* --- Externes (noms IDB du pack ; rôles non prouvés restent tels quels) --- */
extern int  isGetDrawBuf(void *buf, int ctx);              /* 0x55993C — remplit struct 16o */
extern void time_related_deltaTimeMaybe(void);             /* 0x559941 — 0 arg (aucun push) */
extern int  isGetDrawBuf2(int a, int b, int c, int ctx);   /* 0x55994D — (0,1,1,ctx) */
extern void time_related_deltaTimeMaybe2(int code);        /* 0x559954 — (0x21) */
extern int  GfxDriver_BeginScene(int a, int ctx);          /* 0x55996B — eax testé */
extern void GfxDriver_LeaveScene(int ctx);                 /* 0x5599B1 / 0x5599DF */
extern void Render_ESI_A60h_unused(int ctx);               /* 0x559978 */
extern void render_ESIA78h(int ctx);                       /* 0x55997E */
extern void render_ESI348(int ctx);                        /* 0x559984 */
extern void sub_409B25(int ctx);                           /* 0x55998A */
extern void NormalTransition_Phase1(int t, float u, int zero, int ctx); /* 0x559AF0 — 4 args */
extern void NormalTransition_Phase2(int t2, float v, int ctx);          /* 0x559C70 — 3 args */
extern void renderer_related(void);                        /* 0x5599EF — 0 arg, 0 cleanup */

/* Constantes FP lues via fmul ds:m32fp (élargies en double par la FPU) :
 *   CONST_0_050000001 = 0x3D4CCCCD = 0.05f
 *   CONST_0_02        = 0x3CA3D70A = 0.02f */
#define CONST_0_050000001 0.05000000074505806  /* double exact de 0x3D4CCCCD */
#define CONST_0_02        0.019999999552965164 /* double exact de 0x3CA3D70A */

/* Bloc 16 octets @ [ebp-10h] (sub esp,10h @0x559913), passé par pointeur à isGetDrawBuf.
 * NB : lea+push des args (@0x55991B/1E/1F) PRÉCÈDENT les stores (@0x559920..0x559935) —
 * l'adresse est poussée avant l'initialisation, valide au moment du call. */
typedef struct {
    int   field_00;  /* var_10 @ ebp-10h — zéro @0x55992E */
    int   field_04;  /* var_C  @ ebp-0Ch  — zéro @0x559927 */
    int   field_08;  /* var_8  @ ebp-8h   — zéro @0x559920 (1er store, ordre réel) */
    float field_0C;  /* var_4  @ ebp-4h   — 0x3F800000 = 1.0f @0x559935 */
} DrawBufInit;

BOOL __cdecl BattleTransition_RunNormal(int t /*arg_0 @ ebp+8, compteur frames*/,
                                        int ctx /*arg_4 @ ebp+0xC, handle/contexte*/)
{
    DrawBufInit buf; /* [ebp-10h], 16 octets */

    /* --- Prologue @0x559910-55991A --- */
    /* push ebp; mov ebp,esp; sub esp,10h; push esi; mov esi,[ebp+arg_4]; push edi */

    /* --- Init struct 16 octets @0x55991B-55993B (ordre réel, non trié par le compilo) --- */
    buf.field_08 = 0;    /* 0x559920 mov [ebp+var_8], 0   */
    buf.field_04 = 0;    /* 0x559927 mov [ebp+var_C], 0   */
    buf.field_00 = 0;    /* 0x55992E mov [ebp+var_10], 0  */
    buf.field_0C = 1.0f; /* 0x559935 mov [ebp+var_4], 3F800000h */

    /* --- Setup draw / timing @0x55993C-559954 ---
     * Pushes cumulés : esi,eax(&buf) | — | esi,1,1,0 | 0x21 = 28 octets,
     * soldés en UN SEUL cleanup fusionné : add esp,1Ch @0x55995C. */
    isGetDrawBuf(&buf, ctx);             /* 0x55993C ; args (&buf, ctx) */
    time_related_deltaTimeMaybe();       /* 0x559941 ; 0 arg, 0 cleanup */
    isGetDrawBuf2(0, 1, 1, ctx);         /* 0x55994D ; pushes @0x559946..55994B */
    time_related_deltaTimeMaybe2(0x21);  /* 0x559954 ; push 21h @0x559952 */

    /* 0x559959 mov edi, [ebp+arg_0] — edi = t pour toute la suite (arg_0 reste lisible) */
    /* 0x55995C add esp, 1Ch — cleanup fusionné (8+0+16+4) */

    if (t <= 70) {                       /* 0x55995F cmp edi,46h / 0x559962 jg loc_5599EF (SIGNÉ) */
        if (GfxDriver_BeginScene(0, ctx)) { /* 0x55996B (push esi, push 0) ; test eax,eax @0x559973 */
            /* 0x559975 jz short loc_5599E7 — échec : épilogue return 0 SANS LeaveScene
             * (asymétrie volontaire du code original) */
            Render_ESI_A60h_unused(ctx); /* 0x559978 */
            render_ESIA78h(ctx);         /* 0x55997E */
            render_ESI348(ctx);          /* 0x559984 */
            sub_409B25(ctx);             /* 0x55998A ; add esp,10h @0x55998F (4×4 octets) */

            if (t <= 20) {               /* 0x559992 cmp edi,14h / 0x559995 jg short loc_5599C1 (SIGNÉ) */
                /* --- Phase 1 : t <= 20, ARITÉ 4 (t, float, 0, ctx), add esp,10h ---
                 * 0x559997 fild [ebp+arg_0] : charge t ORIGINAL (arg_0 non encore modifié)
                 * 0x55999A push esi / 0x55999B push 0 / 0x55999D push ecx (réservation slot,
                 *            contenu ecx sans importance, écrasé par fstp)
                 * 0x55999E fmul ds:CONST_0_050000001 (x87 précision étendue, modèle double)
                 * 0x5599A4 fstp [esp+24h+var_24] = [esp+0] : float atterrit dans le slot ecx
                 * 0x5599A7 push edi (1er arg = t)
                 * Pile args : [esp]=t, [esp+4]=float, [esp+8]=0, [esp+0Ch]=ctx */
                NormalTransition_Phase1(t, (float)((double)t * CONST_0_050000001), 0, ctx);
                /* 0x5599A8 call ; 0x5599AD add esp,10h */
                GfxDriver_LeaveScene(ctx); /* 0x5599B1 ; add esp,4 @0x5599B6 */
                return 0;                  /* 0x5599B9 xor eax,eax ; épilogue ..0x5599C0 retn */
            }

            /* --- Phase 2 : 21 <= t <= 70, ARITÉ 3 (t-20, float, ctx), add esp,0Ch ---
             * La garde 70/72 est ICI (runner) ; le corps 0x559C70 est SANS garde.
             * 0x5599C1 lea eax, [edi-14h]
             * 0x5599C5 mov [ebp+arg_0], eax — WRITEBACK : (t-20) réécrit dans le slot home
             *            de l'arg 1 (clobber la copie du caller sur sa pile)
             * 0x5599C9 fild [ebp+arg_0] — RELIT le slot fraîchement modifié (= t-20)
             * 0x5599C4 push esi (3e arg) / 0x5599C8 push ecx (réservation slot 2e arg)
             * 0x5599CC fmul ds:CONST_0_02 / 0x5599D2 fstp [esp+20h+var_20] = [esp+0]
             * 0x5599D5 push eax (1er arg = t-20)
             * Pile args : [esp]=t-20, [esp+4]=float, [esp+8]=ctx */
            t = t - 20; /* fidèle au writeback mémoire @0x5599C5 + relecture fild @0x5599C9 */
            NormalTransition_Phase2(t, (float)((double)t * CONST_0_02), ctx);
            /* 0x5599D6 call ; 0x5599DB add esp,0Ch */
            GfxDriver_LeaveScene(ctx); /* 0x5599DF ; add esp,4 @0x5599E4 */
        }
        /* chute / jz vers épilogue partagé @0x5599E7 */
        return 0; /* pop edi / xor eax,eax @0x5599E8 / pop esi / mov esp,ebp / pop ebp / retn */
    }

    /* --- t > 70 : fin de transition @loc_5599EF --- */
    renderer_related(); /* 0x5599EF — 0 arg, pas de cleanup */
    if (t < 72)         /* 0x5599F4 cmp edi,48h / 0x5599F7 jl short loc_5599E7 (SIGNÉ) */
        return 0;       /* t == 71 : bande morte d'une frame — tick renderer_related puis ret 0 */
    return 1;           /* 0x5599FA mov eax,1 — t >= 72 : transition terminée ; épilogue ..0x559A03 */
}

/* ============================================================================
 * NOTES DE RÉCONCILIATION (détail complet : reconcile_notes.md)
 * 1. Voix A et B convergent sur toute la structure ; divergences tranchées :
 *    modèle FP double (B) > float (A) ; BOOL (B) > bool/stdbool (A) ;
 *    writeback t = t-20 direct (B) > t = t2 via var intermédiaire (A) ;
 *    locales résiduelles de A (scratch/t2/edi) éliminées.
 * 2. Divergences Hex-Rays (indice, pas vérité) :
 *    - memset(v5,0,12) : AUCUN call memset dans l'ASM — 3 mov stores var_8→var_C→var_10
 *      puis var_4=1.0f @0x559920..0x559935 ;
 *    - le writeback mov [ebp+arg_0], eax @0x5599C5 est INVISIBLE chez Hex-Rays
 *      (il utilise a1-20 directement) — présent dans l'ASM live et relu par fild @0x5599C9 ;
 *    - `return a1 >= 72` est l'équivalent sémantique correct de cmp 48h/jl.
 * 3. Effet du writeback côté caller (0x5598AA) : NON vérifié ici (hors périmètre) —
 *    tranché localement (le fild relit le slot modifié), indécis côté caller.
 * ========================================================================== */
```

## Preuves et validation parent

1. **Borne 70** : `55995F cmp edi, 46h` + `559962 jg loc_5599EF` — corps actif seulement t≤70 (cmp/jg signés, compteur ≥0, polarité cohérente).
2. **Borne 72** : `5599F4 cmp edi, 48h` + `5599F7 jl loc_5599E7` (t<72 → `xor eax,eax` return 0) sinon `5599FA mov eax, 1` (t≥72 → TRUE). Wiki (`battle-render-pipeline-entrypoints.md`) : « runners **70/72 normal** and 80/82 boss; phase bodies unguarded » — opcode↔wiki exact.
3. **Sous-phases** : `559992 cmp edi, 14h` / `559995 jg` → Phase1 si t≤20 : `559997 fild [arg_0]` + `55999E fmul CONST_0_050000001` → progress = t×0.05 (=1.0 à t=20) ; Phase2 : `5599C1 lea eax,[edi-14h]` + **writeback `5599C5 mov [ebp+arg_0], eax`** puis `5599C9 fild [arg_0]` (relit le slot réécrit = t−20) + `5599CC fmul CONST_0_02` → (t−20)×0.02 (=1.0 exactement à t=70). Constantes FP = preuve arithmétique des bornes ; la garde est dans le runner, pas dans les corps (commentaire IDA @0x5599D6).
4. **Caller unique, 0 data xref** (vérifié IDB read-only) : `XrefsTo(0x559910)` → 1 seule xref, type 17 (near call), @0x5598AA, 0 data. Fonction conteneur : `FFBattleTransitionModule` [0x559890, 0x55990B). Wiki : ce module = entrée du battle swirl.
5. **Séquence frame** : vec4 {0,0,0,1.0f} → `55993C call isGetDrawBuf` (args : lea eax,[ebp+var_10] @0x55991B + push esi @0x55991E) → `559941 call time_related_deltaTimeMaybe` → `55994D call isGetDrawBuf2(0,1,1,esi)` (pushes @0x559946–0x55994B, droite→gauche) → `559954 call time_related_deltaTimeMaybe2(0x21)`.
6. **Early-out BeginScene (fail-safe)** : `55996B call GfxDriver_BeginScene(0, ctx)` + `559973 test eax,eax` + `559975 jz loc_5599E7` → échec ⇒ return 0 sans LeaveScene ni dessin (cohérent slot 40 du pipeline wiki).
7. **Cleanup pile = preuve d'arité cdecl** : `55995C add esp,1Ch` = 8 (isGetDrawBuf) + 0 (deltaTimeMaybe) + 16 (isGetDrawBuf2) + 4 (deltaTimeMaybe2) ; `55998F add esp,10h` après les 4 passes 1-arg (`559978 Render_ESI_A60h_unused`, `55997E render_ESIA78h`, `559984 render_ESI348`, `55998A sub_409B25`) ; `5599AD add esp,10h` Phase1 (4 args) ; `5599DB add esp,0Ch` Phase2 (3 args) — `fstp [esp+…]` écrit le float dans le slot du `push ecx`, vérifié instruction par instruction.
8. **Retour BOOL (0/1)** : `xor eax,eax` @0x5599B9/@0x5599E8 (0) ; seul t≥72 fait `mov eax,1` @0x5599FA — prototype IDA `BOOL __cdecl(int,int)` confirmé par l'ASM.

## Divergences

Résumé de `reconcile_notes.md` (voix A vs voix B tranchées contre l'ASM live, 89 instr) :

- **Modèle FP x87 étendu** : `fild` charge l'int en précision étendue, `fmul ds:m32fp` multiplie en étendu, `fstp m32fp` arrondit en float — le calcul se fait en étendu/double ; le C réconcilié retient `(float)((double)t * cst)` (voix B) contre le cast float intermédiaire de A, qui introduit une perte absente de l'ASM. Choix documentaire des littéraux doubles exacts de `0x3D4CCCCD` / `0x3CA3D70A` (comportemental identique).
- **Writeback invisible chez Hex-Rays** : `mov [ebp+arg_0], eax` @0x5599C5 puis `fild [ebp+arg_0]` @0x5599C9 — l'ASM écrase le slot home de arg_0 avec t−20 et le relit ; Hex-Rays utilise `a1 - 20` directement sans montrer l'écrasement mémoire. Le C réconcilié reproduit la dépendance via `t = t - 20` avant le calcul du float. Effet côté caller (0x5598AA) : non vérifié (hors périmètre), signalé.
- **`memset` inventé** : `memset(v5, 0, 12)` (hexrays.c:8) n'existe pas dans l'ASM — aucun call ; ce sont 3 `mov [mem],0` dans l'ordre var_8 → var_C → var_10 @0x559920/27/2E, puis `var_4 = 3F800000h` @0x559935. L'ordre réel des stores (non trié par le compilo) est conservé en commentaire d'ancre.
- **Libellé IDA `Render_ESI_A60h_unused` = leurre** : `559978 call Render_ESI_A60h_unused` est sur le chemin actif ; le suffixe « unused » est périmé sur ce chemin (tranché pour A contre B qui le reprenait sans commentaire). Renommage interdit (R read-only), consigné ici en markdown seul.

Autres points tranchés (détail dans reconcile_notes.md) : type de retour `BOOL` (typedef int) > `bool`/`<stdbool.h>` ; writeback direct `t = t - 20` > variable intermédiaire `t2` + locales résiduelles (scratch/edi) inexistantes dans l'ASM ; `renderer_related` appelé à CHAQUE frame t>70 y compris t≥72 (R tranche contre B, dont la table omettait l'appel au row « ≥72 ») ; adresse caller 0x559890 (début de fonction) vs 0x5598AA (EA du call) = faux conflit, niveaux différents. Aucune divergence indécise sur le code de la fonction elle-même.
