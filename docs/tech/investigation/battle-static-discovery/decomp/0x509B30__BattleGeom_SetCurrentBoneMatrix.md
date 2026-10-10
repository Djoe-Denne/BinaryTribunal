# Décompilation candidate P1 — EA 0x509B30 — BattleGeom_SetCurrentBoneMatrix

Propagation mécanique déterministe post-freeze, aucun nouveau vote. Spécification authoritative : `parent_postfreeze_context.json` (sha256 `d7af8cb6f8f902893267d4b05d1a0934c659a47fc2e87384407994f682a63f2e`). Lecture bornée aux 18 fichiers listés par `input_manifest.json` (sha256 `e253322bc3e7a89fce2a5250881dda3688d1b3e8da9f5f1fa6b31f7dd02726f0`), hashes revérifiés 18/18. Le nom catalogue `BattleGeom_SetCurrentBoneMatrix` est préservé en titre comme libellé de propagation : « bone » NON CONFIRMÉ, fausseté non établie ; métier UNCERTAIN, mécanique LIKELY.

Protocole effectif : 1 (production A) + V + contrôles obligatoires C-B et semantic-B + adjudication contrôle R révision 2 — pas une routine « 2+1 ». Les gels A/V corrigés sont la baseline de comparaison ; aucun nouveau désaccord numérique n'est ouvert ; l'inconnu métier n'en est pas un.

## Fence C — première et unique, copie byte-exacte du gel

Copie octet-pour-octet de `pilot-2026-10-09/c_reviewed_final.c` — sha256 `5b6895601f08e3a943e823027e731d2340c7346a6aaff25abecb4b186f68f708`, 1862 octets, LF. Aucune regénération, aucune modification ; aucun autre bloc C dans ce document. L'égalité fence == gel est vérifiée par SHA256 et consignée dans `propagation_receipt.json`.

```c
/* P1-C-review-1: numeric C projection for the observed 32-bit x86 ABI.
 * Not an assertion of the original source-language prototypes or ISO C fidelity.
 * External bindings below expose the full EAX bit-pattern, not a business type.
 * Native source: [0x509B30,0x509B46), SHA256
 * c029df7ea2c29f93f080400654c8937447e4e12192bd1db4f562340cd9b0ed7d.
 */
#if !defined(_M_IX86) && !defined(__i386__)
#error This reconstruction requires the observed 32-bit x86 ABI.
#endif

typedef unsigned int pilot_u32;
typedef char pilot_u32_must_be_four_bytes[(sizeof(pilot_u32) == 4) ? 1 : -1];

extern pilot_u32 __cdecl sub_56BAE0(pilot_u32);
extern pilot_u32 __cdecl sub_56BB30(pilot_u32);

pilot_u32 __cdecl sub_509B30(pilot_u32 arg0)
{
    const pilot_u32 v = arg0; /* 0x509B31: snapshot entry [ESP+4], not *arg0. */

    (void)sub_56BAE0(v);      /* 0x509B35/36: one dword argument, first call. */
    return sub_56BB30(v);     /* 0x509B3B/3C: same snapshot; forward full EAX. */
}

/* Machine obligations not mandated by C source alone:
 * 0x509B30 saves ESI; 0x509B44 restores it.
 * Both pushes remain pending until ADD ESP,8 at 0x509B41; RET at 0x509B45
 * does not remove this function's incoming argument. Each call has only one
 * argument, so right-to-left push order is trivial, not reordered multi-arg C.
 * Ordinary C compilation may change cleanup placement, registers, flags,
 * tail-call shape and stack layout. Re-review the emitted binary if those
 * machine observables are required; no byte-exact or whole-state claim here.
 * This target's final normal return carries EAX=7; the first callee returns 4.
 * The final 0x45DEF0 call pushes 7 then its first argument and calls 0x45D7F0,
 * which loads the second argument into EAX and reaches 0x45DB48 without changing it.
 * The two native calls are retained; no constant-return substitution is used.
 */
```
## Résumé opérations et largeurs (spec / R final)

- Racine native `[0x509B30,0x509B46)` : 9 instructions, 22 octets, un chunk/un bloc, SHA256 `c029df7ea2c29f93f080400654c8937447e4e12192bd1db4f562340cd9b0ed7d` (contrôle). `0x509B31 8B742408` capture une seule fois le DWORD entrant (home slot [ESP entrée+4], pas `*arg0`) dans ESI après le `PUSH ESI` initial ; `PUSH ESI; CALL 0x56BAE0` puis `PUSH ESI courant; CALL 0x56BB30` ; `0x509B41 83C408` ; `0x509B44 5E` ; `0x509B45 C3`. Aucun conditionnel signé ni shift racine.
- Largeurs/retours sur continuation normale (frames et slots intacts) : EAX32 final racine = 7 ; premier callee `0x56BAE0→0x45DE00` = 4. Les deux appels natifs restent dans la projection C gelée ; aucune substitution par retour constant.
- ABI/pile : cdecl observée ; cleanup appelant racine 8 octets (`ADD ESP,8`) ; appels profonds au leaf `0x45D7F0` poussent indice puis valeur — cdecl (valeur, indice), droite→gauche — cleanups 40 octets (`0x45DE3D`, indices 0..4) et 24 octets (`0x45DF17`, indices 5..7) ; `RET C3` sans imm16, argument entrant laissé à l'appelant. ESI préservé par la chaîne (racine, deux chargeurs) ; le leaf n'écrit pas ESI et ne contient aucun CALL ; le dernier `POP ECX` (`0x56BB3A`) restitue p.
- Effets mémoire : huit DWORD lus aux offsets source 0..28 pas 4 ; banque DWORD `[0x1CA927C,0x1CA929C)` (8 DWORD) via `0x45D7FA 890C857C92CA01`, store avant gardes, SIB 85 = EAX*4 ; les cinq premiers DWORD contiennent 9 demi-mots signés convertis — `FILD DWORD scratch arg+8`, `FMUL m32 00008039` = 1/4096, `FSTP float32` — vers `[0x1CA9234,0x1CA9258)` avec permutation de destinations non triviale ; le dixième demi-mot est copié sans conversion — sémantique « padding » NON prouvée.
- Alias/ordre : adresse seule capturée, pas de photographie du contenu ; lectures ordonnées intercalées avec les stores (p+8/p+0xC/p+0x10 après les indices 0/1 ; p+0x1C après l'indice 5, avant 6). Témoins pile R-only : p=S−36 (`0x45DE07 6A00`) et p=S−8 (`0x509B35 56`), aucun caller réel observé produisant ces états.
- Bornes de projection C : le gel projette les appels natifs ordonnés, le DWORD entrant et EAX complet sous le cdecl observé uniquement ; il n'impose ni placement du cleanup différé, ni EFLAGS, ni layout de pile machine, ni état x87, ni équivalence ISO/compilée/runtime. Compilation de test et runtime natif : NON exécutés dans cette propagation (observations MSVC historiques = reviews gelées uniquement).
- Couverture profondeur reçue (non recalculée ici) : 6 fonctions, 241 instructions, 1016 octets ; 7 xrefs CODE, 0 DATA. Modèle callbacks C-B (`read32/write32/run_deeper`, statut hôte distinct de EAX natif) ≠ appels natifs ; aucun backend implémenté ni validé.

## Preuves, nouveautés et statut

- B novel contre BOTH (chaîne C-review ET gels A/V) : 0 défaut matériel prouvé ; nouveautés descriptives validées : permutation explicite des neuf destinations float, représentation flags/pile (six flags ADD, masque 0x8D5), détail CFG (27 blocs, 15 RET). Pas de claim d'absence exhaustive d'erreurs ; aucune claim littérale « B=0 ».
- R-only, non attribué à B : témoins S−36/S−8 ; exactitude binary32 de x/4096 (65 536 valeurs, zéro écart) — la valeur exacte ne certifie ni l'état x87, ni les exceptions, ni une équivalence de substitution C.
- Contexte QMD/métier natif non fourni : rien n'est inventé (« bone matrix », orthogonalité, usage caméra restent hors preuve).
- Portes parent restantes : gate de propagation, §5.6 (NON clôturé ici ; vérifications natives du parent = sondes), push/commit.


## Gate parent natif 2026-10-10 — clôture numérique bornée

Les mentions candidate/pending sont historiques et supersédées par ce gate final. §5.6 parent PASS dans la projection déclarée : 9/9 instructions root,6fonctions241insns/1016bytes rehashées en natif, caller7CODECALL(type17), ancres502222/509A8D. RootCALL56BAE0 puis56BB30 existent, deferredcleanup8/POP_ESI/RET C3. Relais nettoient4 par POP ECX ; deepcall5×2args=40 et3×2args=24octets, index poussé avant valeur. Facteur bank4 bytes et sign-extendedWORD→FILDdword→FMULm32=1/4096→FSTPfloat32, neuf conversions, table5cases dérivée en ASM natif. EAX32 root final7 sur continuation normale avec ABI/frames valides ; firstnativecallee4, pasAL-only ni substitutionreturn7. Root sans setcc/shift/condition. Leafguards JL/JG signed, storebank avantguards, index7→45D90F→45DA2C→45DB48 conserveEAX7. Les reads source sont successifs, pas snapshot mémoire ; p=1CA9278 expose aliasglobal, S-36/S-8 aliasesstack R-only sanscaller réelprouvé. C final fence exact SHA5b6895601f08e3a943e823027e731d2340c7346a6aaff25abecb4b186f68f708, 8/8gels inchangés. Métierbone UNCERTAIN, catalogue trop large/noncertifié mais pas fausseté établie ; nomnumérique proposé prouvé par storesbank et conversions, pas rename. 0défaut matériel inéditB contre BOTHgels, détailsdescriptifs/flags etR-only séparés ; pas absence exhaustive d'erreurs ni certificat infrastructure aveugle universel. No compile/ISO/native/runtime/backend/machine-stack/flags/x87-state equivalence claimed. Probes parent SHA32d2af7fa5b9aec3c6462f8f110ecb9a099a0047e95a6467b91f96b543e54e22 etaf380940f2abdcbc535dc15f7f0c41bf111a1fc4ee937ad61262124944841e3c.
