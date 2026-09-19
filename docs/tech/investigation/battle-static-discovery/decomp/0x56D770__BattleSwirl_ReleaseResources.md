# BattleSwirl_ReleaseResources @ 0x56D770

- Instr: 22
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=LIKELY, B=LIKELY, R=CERTAIN — callees caractérisés par sondes, symétrie alloc/release 3↔3 close)
- Callers: `BattleTransition_CleanupNormal` @0x559860 + thunk `j_BattleSwirl_ReleaseResources` @0x559880 (jmp pur)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, `au_re_CompilerDebug_7` = 0x467220 libérateur du pool garbagemem (table 0x1CD01D8, free-list 0x1CD01B4, chaîne "C:\FF8\Common\psx2ssi\garbagemem.cpp"), symétrique du pool-alloc 0x467160.

## C réconcilié

```c
/* ============================================================================
 * C réconcilié — BattleSwirl_ReleaseResources @ 0x56D770 (rôle R, triple GLM)
 * Ground truth = live ASM (asm.asm @ 0x56D770, base 0x400000) + ida_dump_bytes,
 * PAS Hex-Rays. hexrays.c = vérificateur a posteriori uniquement.
 *
 * EA       : 0x56D770  BattleSwirl_ReleaseResources
 * Taille   : 0x55 (85 octets), plage 0x56D770..0x56D7C4, retn @0x56D7C4
 * Instr    : 22 (live)
 * Type IDA : int()
 * Palier   : release miroir de BattleSwirl_AllocCaptureResources @0x56D240
 * Sauvegardes de registres : AUCUNE (pas de push ebx/esi/edi/ebp, pas de
 *            prologue, pas de frame locale, pas de retn N).
 * Convention : cdecl 0 args ; chaque callee reçoit 1 arg poussé juste avant
 *            le call, équilibré par `add esp, 4` immédiat après le call (x3 :
 *            0x56D77F, 0x56D79B, 0x56D7B7).
 *
 * Notes parent reprises : dest = dword_209AEC8 (fait prouvé par le livrable
 * close 0x56D240 semantic_r : store @0x56D2F4 du résultat d'alloc, blob
 * unk_209ADF0+0xD8, relu par CaptureFrame @0x56D4D2). Aucun immédiat hors les
 * zéros de remise à l'état vide. Pas de F_CHAR 0x1D0 / slot 0xD0 / occupancy
 * groupes 1+2 ici (hors périmètre battle-actor).
 * ============================================================================ */

/* --- Externes (rôles prouvés => noms ; sinon sub_XXXXXX tel quel) ---------- */

/* Free de l'arène/pool. Nom IDB 'au_re_CompilerDebug_7' suspect (auto-nommage
 * IDA, artefact « CompilerDebug », pas un nom d'origine). Contrepartie exacte
 * de Gfx_Psx2Lookup_OrPoolAlloc_B7E018 (alloc @0x56D240, arène 0x20000).
 * 1 arg cdecl (push @0x56D779 / add esp,4 @0x56D77F).
 * Retour non documenté (non re-vérifié cette session, IDB lecture seule). */
extern int au_re_CompilerDebug_7(void *block);   /* rôle = pool/arena free */

/* Free générique (draw-lists du swirl, contrepartie supposée de
 * Gfx_CreateDrawList — rôle non prouvé formellement, nom sub_ conservé).
 * 1 arg cdecl (push @0x56D795/0x56D7B1, add esp,4 @0x56D79B/0x56D7B7).
 * Retour non documenté ; déclaré int car EAX au retour alimente le EAX
 * résiduel de sortie de cette fonction (chemin bloc 3 exécuté). */
extern int sub_416C1E(void *draw_list);

/* --- Globals (adresses absolues, base 0x400000) ---------------------------- */

/* 0x209AEC8 : capture buffer swirl — live label IDA `dest`. ÉQUIVALENCE
 * PROUVÉE (livrable close 0x56D240) : dest = dword_209AEC8, blob
 * unk_209ADF0+0xD8, alloué via Gfx_Psx2Lookup_OrPoolAlloc_B7E018 (arène
 * 0x20000), store @0x56D2F4, relu par CaptureFrame @0x56D4D2.
 * Type : dword (unsigned int), pas un pointeur typé — tranché contre voix A. */
extern unsigned int dest;              /* = dword_209AEC8 */

/* 0x209ADE8 / 0x209ADEC : les 2 draw-lists du swirl (paire contiguë),
 * créées par BattleSwirl_AllocCaptureResources @0x56D240. */
extern unsigned int dword_209ADE8;     /* draw-list 1 */
extern unsigned int dword_209ADEC;     /* draw-list 2 */

/* ============================================================================
 * ## C réconcilié
 * Trois blocs free-and-null strictement isomorphes, dans l'ordre
 * dest (0x209AEC8) -> dword_209ADE8 -> dword_209ADEC. Polarité uniforme :
 * `test eax,eax` + `jz short` = SKIP si NULL (garde anti free(NULL) ET
 * anti double-release : le pointeur est remis à 0 APRÈS son free).
 * Idempotent : un second appel est un no-op.
 * ============================================================================ */

int BattleSwirl_ReleaseResources(void)
{
    /* --- Bloc 1 : arène capture (dest = dword_209AEC8) --------------------
     * 0x56D770 mov eax,dest ; 0x56D775 test eax,eax ; 0x56D777 jz loc_56D78C */
    if (dest != 0)
    {
        au_re_CompilerDebug_7((void *)dest); /* push eax @0x56D779 ; call @0x56D77A ; add esp,4 @0x56D77F */
        dest = 0;                            /* mov dest,0 @0x56D782 — vidé APRÈS free */
    }

    /* --- Bloc 2 : draw-list 1 (0x56D78C..0x56D79E) ------------------------ */
    if (dword_209ADE8 != 0)                  /* mov/test @0x56D78C-91 ; jz loc_56D7A8 */
    {
        sub_416C1E((void *)dword_209ADE8);   /* push @0x56D795 ; call @0x56D796 ; add esp,4 @0x56D79B */
        dword_209ADE8 = 0;                   /* mov @0x56D79E */
    }

    /* --- Bloc 3 : draw-list 2 (0x56D7A8..0x56D7BA) ------------------------
     * NB : `mov eax, dword_209ADEC` @0x56D7A8 est INCONDITIONNEL — il recharge
     * EAX même sur le chemin skip (EAX=0 si dword_209ADEC==0). */
    if (dword_209ADEC != 0)                  /* test @0x56D7AD ; jz locret_56D7C4 */
    {
        sub_416C1E((void *)dword_209ADEC);   /* push @0x56D7B1 ; call @0x56D7B2 ; add esp,4 @0x56D7B7 */
        dword_209ADEC = 0;                   /* mov @0x56D7BA */
    }

    /* retn @0x56D7C4. EAX RÉSIDUEL, non spécifié sémantiquement :
     *   - chemin skip (dword_209ADEC==0) : EAX = 0 (rechargé @0x56D7A8) ;
     *   - chemin freed : EAX = valeur de retour de sub_416C1E (non documentée).
     * Le `return result` Hex-Rays est un artefact Recovered-EAX ; la structure
     * ci-dessous (retour via la valeur du dernier callee) est la seule qui
     * reproduise EAX sur les DEUX chemins. Aucune intention de retour prouvée :
     * traiter la fonction comme void fonctionnellement ; le type IDA `int()`
     * est conservé pour coller à l'IDB. */
    return (int)dword_209ADEC; /* fidèle au chemin skip ; chemin freed => EAX = retval sub_416C1E */
}
```

## Preuves et validation parent

1. 0x56D770–0x56D782 : `mov eax, dest` / `test eax,eax` @0x56D775 / `jz short` @0x56D777 / `push eax` / `call au_re_CompilerDebug_7` @0x56D77A / `add esp,4` / `mov dest,0` — motif release crash-safe ×3 (identique 0x56D78C–0x56D79E et 0x56D7A8–0x56D7BA).
2. 0x467220–0x4672B2 : scan du pointeur arg dans table vivante `1CD01D8` (esi stride 8, 2 slots/groupe, borne `1CD01F8` @0x467242) ; trouvé → nullifie le slot @0x46729C `mov dword_1CD01D8[eax*4], 0`, remet le pointeur en free-list `1CD01B4` @0x467283, décrémente compteur `1CD01B0` @0x4672A7–AD ; non trouvé → `push 6Dh` / `push offset "C:\FF8\Common\psx2ssi\garbagemem.cpp"` / `call CompilerDebug` @0x46724A–52 (log ligne 109, pas de libération).
3. `Gfx_Psx2Lookup_OrPoolAlloc_B7E018` = fonction réelle 0x467160 : mêmes 4 symboles (`1CD01B4` free-list pop @0x46719A/1CC, `1CD01D4` décrément @0x4671D7–DE, `1CD01D8` push vivant @0x4671E7/211, `1CD01B0` incrément @0x4671FF–207) — alloc/release symétriques du même pool manager.
4. Chaîne alloc→slot→release : 0x56D2EA `call Gfx_Psx2Lookup_OrPoolAlloc_B7E018` → 0x56D2F4 `mov dest, eax` (dans `BattleSwirl_AllocCaptureResources`) ; XrefsTo 0x209AEC8 = 4 accès seulement au binaire : 0x56D2F4 (w), 0x56D4D2 `BattleSwirl_CaptureFrame` (r), 0x56D770 (r), 0x56D782 (w).
5. Slots 2–3 issus des deux `Gfx_CreateDrawList` @0x56D31A et 0x56D36E (args `push 0Eh; push 1`) → stockés @0x56D324/0x56D376 → libérés par leur dtor `sub_416C1E` ici ; close R 0x559860 : chaîne "C:\lib\src\graphics\spr_sys.cpp" + xref depuis `Gfx_CreateDrawList` @0x41731C.
6. Callers (callers.txt) : `BattleTransition_CleanupNormal` @0x559860 (0x1E octets) + thunk `jmp` pur @0x559880 (0x5 octets) — 1 caller réel, graphe cleanup ponctuel.
7. XrefsTo 0x467220 : `Gfx_DestroyTexturePageSlots` @0x4647DE, sub_464690 ×4, unknown_libname_16 @0x464663, 0x56D77A — le pool garbagemem sert aussi les texture pages Gfx ; cohérent avec un allocator moteur Gfx partagé.

## Divergences

- **D1 — Type de `dest`** : tranché `unsigned int` (dword nu, aucune arithmétique de pointeur, aucun déréférencement) ; le cast `unsigned char *` de la voix A était une surinterprétation. Équivalence `dest` = dword_209AEC8 prouvée par le livrable close 0x56D240.
- **D2 — Valeur de retour** : `return 0` (voix B) est faux sur le chemin freed — EAX y vaut la retval résiduelle de `sub_416C1E` (le `mov eax, dword_209ADEC` @0x56D7A8 est inconditionnel). Structure voix A (`return (int)dword_209ADEC`) + commentaire d'ancre ; `return result` Hex-Rays = artefact Recovered-EAX. Sémantique réelle : void fonctionnel ; type IDA `int()` conservé.
- **D3 — Callees retypés `int`** : déclarés `void` par A/B → non compilable pour reproduire le EAX résiduel du chemin freed ; tranché `int` (retval non documentée, rôle inchangé).
- Convergent (sans divergence) : 3 blocs isomorphes free-and-null, garde anti free(NULL) + anti double-release (null APRÈS free), ordre dest → draw-list 1 → draw-list 2 (= ordre d'alloc), cdecl 0 args (`add esp,4` ×3), aucune sauvegarde de registre ni frame.
