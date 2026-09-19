# BattleTransition_CaptureBoss @ 0x5597F0

- Instr: 11
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=CERTAIN, B=CERTAIN, R=CERTAIN — thunk cdecl pur)
- Caller: unique `FFBattleTransitionInitSystem` @0x559670 (branche boss)
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, questions closes (origines viewport 204DB2C/30 écrites par l'init 0x559530, retour EAX non contractuel).

## C réconcilié

```c
/* Callee : 0x56Dxxx "transitions: alloc-if-needed + CaptureFrame".
 * __cdecl prouvé par `add esp, 10h` dans LE CALLER (cette fonction) ;
 * 4 args, ordre prouvé par les pushes (le dernier poussé = arg1). */
extern int __cdecl BattleSwirl_EnsureAndCapture(int start_x, int start_y,
                                                int src_w, int src_h);

/* Globaux — lectures 32 bits prouvées par l'encoding :
 *   0x5597F0: A1 imm32 (5 octets) -> screen_y   (mov eax, moffs32)
 *   0x5597F5: 8B /r imm32 (6 octets) -> screen_x (mov ecx, [imm32])
 *   0x5597FB: 8B /r imm32 -> dword_204DB30
 *   0x559802: 8B /r imm32 -> dword_204DB2C
 * Pas de movzx -> pas d'octets WORD ici. Rôles (start_x/start_y de capture,
 * précalculés par l'init) attestés par le chemin boss de FFBattleTransitionInitSystem
 * et le voisin 0x559690 InitScanlinesNormal (mêmes 4 opérandes, même ordre de push). */
extern int dword_204DB2C;   /* 0x204DB2C : start_x de capture */
extern int dword_204DB30;   /* 0x204DB30 : start_y de capture */
extern int screen_x;        /* largeur écran  -> arg3 (src_w) */
extern int screen_y;        /* hauteur écran  -> arg4 (src_h) */

int __cdecl BattleTransition_CaptureBoss(void)
{
    /* 5597F0  mov eax, screen_y        ; y chargé PREMIER (arg4) */
    /* 5597F5  mov ecx, screen_x        ; x (arg3) */
    /* 5597FB  mov edx, dword_204DB30   ; arg2 */
    /* 559801  push eax                 ; arg4 = screen_y (poussé 1er = plus profond) */
    /* 559802  mov eax, dword_204DB2C   ; réutilise EAX (arg1, chargé en DERNIER) */
    /* 559807  push ecx                 ; arg3 = screen_x */
    /* 559808  push edx                 ; arg2 = dword_204DB30 */
    /* 559809  push eax                 ; arg1 = dword_204DB2C (poussé en dernier = arg1) */
    /* 55980A  call BattleSwirl_EnsureAndCapture ; alloc-if-needed + CaptureFrame */
    /* 55980F  add esp, 10h             ; cleanup cdecl (4 x 4) */
    /* 559812  retn                     ; EAX du callee traverse intact */
    return BattleSwirl_EnsureAndCapture(dword_204DB2C,   /* arg1 : start_x */
                                        dword_204DB30,   /* arg2 : start_y */
                                        screen_x,        /* arg3 : src_w */
                                        screen_y);       /* arg4 : src_h */
    /* Ancre : chemin boss = capture seule, SANS scanlines — aucune génération
     * de profil scanline ni draw-list locale, contrairement au chemin normal
     * 0x559690 InitScanlinesNormal. EAX passthrough : aucun xor eax,eax ni
     * mov entre call (0x55980A) et retn (0x559812). */
}
```

## Preuves et validation parent

1. Opcodes du thunk : 2 args stack lus sans condition (`mov eax, screen_y` @ 0x5597F0, `mov ecx, screen_x` @ 0x5597F5), pushes ordonnés droite→gauche 0x559801→0x559809, `add esp, 10h` @ 0x55980F = 4 args cdecl, `retn` @ 0x559812 sans réaffectation EAX → thunk pur.
2. Dispatch : xref unique depuis `FFBattleTransitionInitSystem` @ 0x559670 = la branche boss du split d'init (la branche non-boss va vers `BattleTransition_InitScanlinesNormal` 0x559690, qui appelle avec le même tuple — preuve que le corps est partagé).
3. Absence de scanlines : les 11 instructions ne contiennent ni boucle, ni arithmétique de génération de quad, ni accès mémoire hors lecture des 2 globals — contrairement à 0x559690. Le nom `CaptureBoss` (capture only, address_catalog.md:483) est donc justifié par le dispatch + cette absence.
4. `dword_204DB2C`/`dword_204DB30` : xrefs vérifiées par IDA — écritures (type 2, dr_W) uniquement dans l'init `FFBattleTransitionInitSystem` @ 0x559574/0x559579 (`mov dword_204DB2C, eax` / `mov dword_204DB30, ecx`, sites de l'init 0x559530 close) = tuples viewport/transition ; toutes les autres xrefs sont des lectures (type 3, dr_R).
5. Usage aval aligné : `NormalTransition_Phase1` lit `dword_204DB2C` @ 0x559AF9 (`xbase = dword_204DB2C + a3`, close 0x559AF0) ; `BossTransition_Phase` lit en float `fild dword_204DB30` @ 0x559FD2 et `fild dword_204DB2C` @ 0x559FFB (pivots 0x204DB2C/30, close 0x559F30).

## Divergences

- **Ordre des loads vs pushes** : l'ordre de chargement des registres (y, x, DB30, DB2C) est l'inverse exact de l'ordre d'empilement — artefact d'évaluation droite→gauche des arguments en MSVC x86, **sans effet sémantique**. C'est l'ordre des `push` (0x559801→0x559809), pas l'ordre des `mov`, qui définit arg1..arg4 : dernier poussé (`dword_204DB2C` @0x559809) = arg1. Le chargement de `screen_y` en premier @0x5597F0 confirme que y = arg4 (le plus profond de la pile). A et B convergent déjà ; confirmé contre ASM.
- **Typage du retour** : aucune instruction entre `call` @0x55980A et `retn` @0x559812 (ni `xor eax,eax`, ni `mov`) — l'EAX du callee traverse intact (passthrough). Tranché **`int`** (pas `void`) : la convention cdecl passe le retour int dans EAX, et garder `int` sur le thunk préserve le passthrough exact (Hex-Rays le confirme mais n'est qu'un vérificateur). Nuance honest-uncertainty : le callee pourrait sémantiquement ne rien retourner d'utile, mais cette fonction laisse passer EAX — trancher `void` serait une invention non soutenue par l'ASM.
- Aucune divergence non tranchée ; taille 0x23 = 35 octets recouvre exactement 0x5597F0..0x559812, chunk complet.
