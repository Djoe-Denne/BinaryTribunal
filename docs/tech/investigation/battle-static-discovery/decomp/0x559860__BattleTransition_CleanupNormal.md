# BattleTransition_CleanupNormal @ 0x559860

- Instr: 7
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=LIKELY, B=LIKELY, R=CERTAIN — cycle de vie dword_204E2E0 fermé par xrefs)
- Caller: unique FFBattleTransitionExitSystem @0x55982C (jambe bossBattle==0)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, sub_416C1E = dtor spr_sys (prouvé par sonde 0x416C1E..0x416CBF, chaîne "C:\lib\src\graphics\spr_sys.cpp" + pool-finalizer 0x416CB3, xref depuis Gfx_CreateDrawList @0x41731C) ; cycle dword_204E2E0 : alloc 0x5596DA (InitScanlinesNormal) → 4 lectures Phase2 → destroy+null ici.

## C réconcilié

```c
// =============================================================================
// C réconcilié — BattleTransition_CleanupNormal (0x559860), base 0x400000
// Rôle R (triple GLM) : réconciliation de c_a.c / c_b.c contre asm.asm (ground
// truth = live ASM + ida_dump_bytes, NOT Hex-Rays). Hex-Rays = vérificateur.
// Instr (live) : 7 — Taille : 0x1E = 30 octets = [0x559860 .. 0x55987E)
// Type IDA     : int()  — Sauvegardes de registres : AUCUNE (EAX seul touché)
// Couverture octets (contiguë, aucun gap, aucun padding) :
//   call rel32 (5) + mov eax,moffs32 (5) + push eax (1) + call rel32 (5)
//   + add esp,4 (3) + mov moffs32,imm32 (10) + retn (1) = 30 = 0x1E ✓
// =============================================================================

// --- Externes ----------------------------------------------------------------
// BattleSwirl_ReleaseResources (nom IDA existant) : appelé SANS arg poussé et
//   SANS `add esp` ensuite => void(), rôle annoté : libère arène + draw-lists.
// sub_416C1E : rôle NON prouvé => nom sub conservé (pas d'invention).
//   1 arg cdecl (push eax @ 0x55986a, `add esp, 4` @ 0x559870 = cleanup
//   appelant). Arg = valeur 32 bits lue du global (handle). Retour EAX seul.
// dword_204E2E0 : global IDA '_DWORD *' @ 0x204E2E0 — handle/état du swirl.
//   Aucun stride/struct connu => DWORD brut, lu puis remis à 0 en place.
// -----------------------------------------------------------------------------

extern void BattleSwirl_ReleaseResources(void);   // 0x559860 callee
extern int  sub_416C1E(unsigned int handle);      // 0x416C1E callee, cdecl x1
extern unsigned int dword_204E2E0;                // 0x204E2E0 (IDA: '_DWORD *')

// Caller unique (callers.txt) : FFBattleTransitionExitSystem @ 0x55982c.

int BattleTransition_CleanupNormal(void)
{
    // 0x559860 — release arène + draw-lists. Zéro arg (pas de add esp ensuite).
    // Tout EAX retourné ici est écrasé à 0x559865 => valeur non pertinente.
    BattleSwirl_ReleaseResources();

    // 0x559865..0x559870 — charge le handle global, pousse l'unique arg
    // (droite->gauche, cdecl), appel, cleanup appelant `add esp, 4`.
    int result = sub_416C1E(dword_204E2E0);

    // 0x559873 — invalide le handle APRÈS que l'appel l'a consommé
    // (ordre porteur de sens : zeroing avant l'appel passerait NULL).
    // Le mov mémoire ne touche pas EAX.
    dword_204E2E0 = 0;

    // 0x55987d — retn nu (cdecl). Valeur de retour = EAX survivant de
    // sub_416C1E (`add esp,4` et `mov` mémoire n'y touchent pas).
    return result; // type IDA int() confirmé par le retval EAX
}

// --- Ancres / notes ----------------------------------------------------------
// - Flux strictement linéaire : aucune branche, aucun court-circuit. Le reset
//   du handle n'a lieu QUE si les deux appels reviennent.
// - Ordre porteur de sens : release -> lecture handle -> appel -> reset à 0.
// - add esp, 4 : sub_416C1E est cdecl avec exactement 1 argument.
// - Hex-Rays (hexrays.c) : en accord total sur le flux. Le commentaire
//   « normal teardown (0x1E) » : 0x1E = taille en octets, PAS un id de mode.
// - Aucune divergence Hex-Rays vs ASM relevée sur cette fonction.
// =============================================================================
```

## Preuves et validation parent

1. `0x559860 call BattleSwirl_ReleaseResources` — release swirl inconditionnel en tête.
2. `0x559865 mov eax, dword_204E2E0` + `0x55986A push eax` + `0x55986B call sub_416C1E` + `0x559870 add esp,4` — 1 arg cdecl (droite→gauche), idiome destroy+clear.
3. `0x559873 mov dword_204E2E0, 0` — null du handle propriétaire ; xrefs complètes : alloc `0x5596DA` (après `Gfx_CreateDrawList` @`0x5596D5`), lectures `NormalTransition_Phase2` ×4.
4. `0x416C22 cmp [ebp+arg_0],0` / `0x416C26 jz` et `0x416C2F cmp dword ptr [eax+30h],0` / `0x416C33 jz` — dtor gardé NULL-safe.
5. `0x416C98 push offset aCLibSrcGraphic_126` ("C:\lib\src\graphics\spr_sys.cpp", ligne 0x32F) + `0x416CB3 call sub_42491A` (borne arena signée `jl` @`0x424941`) — dtor spr_sys avec pool-finalizer ; xref depuis `Gfx_CreateDrawList` @`0x41731C`.

## Divergences

Résumé de `reconcile_notes.md` (divergences cosmétiques/typage, aucune divergence sémantique ASM vs Hex-Rays) :

1. **Typage extern/unsigned** — `dword_204E2E0` tranché en `extern unsigned int` (cohérent avec le type IDA `'_DWORD *'`, DWORD brut lu puis remis à 0, pas de stride/struct connu) ; argument de `sub_416C1E` tranché en `unsigned int handle` (handle/pointeur 32 bits issu d'un mov moffs32 brut, nom `sub` conservé car rôle non prouvé) ; type de retour `int` (type IDA `int()`, retn avec EAX vivant de `sub_416C1E`).
2. **Bornes** — fin **exclusive 0x55987E**, SIZE 30 = 0x1E (meta.json), vérifié par longueurs d'instructions : 5+5+1+5+3+10+1 = 30 = 0x1E ✓.
3. **0x1E = taille, pas un mode** — le commentaire Hex-Rays « normal teardown (0x1E) » désigne la taille en octets, PAS un identifiant de mode de teardown : ne pas sur-interpréter.
