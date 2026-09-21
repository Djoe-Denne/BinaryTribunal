# MagFx_SpawnRandParamTasks @ 0x6A3960

- Instr (live): 67 (204 o, 0x6A3960-0x6A3A2B)
- Palier: 1+P (2 voix + sondes IDA parent P)
- Verdict: CERTAIN - alloue jusqu'a 1+arg_0 noeuds taches FX sur la liste dword_2510208 (2x BdLinkTask_Register @0x6A3969/0x6A3A15, callback arg) et remplit chacun de 12 octets de parametres (3 s16 base+jitter aleatoire via 4x rand*mult sar 0Fh signe @0x6A398C-E3, 1 s16 a echelle propre, 4 u8 d'options), boucle test pre-decrement (N+1 iterations pour a1=N, mov edx,ebx/dec/test) ; retour AL = arg_24, 0 si echec d'allocation
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A3960\nTYPE ; proposition: MagFx_SpawnRandParamTasks
- Notes parent: checks 5.6 OK (role P) : 2x Register (0x6A3969/0x6A3A15), 4x rand/imul/sar 0Fh (0x6A398C-E3), boucle jnz (0x6A3A21), caller unique sub_6A1660 @0x6a19b9 [code] (callers.txt + sonde) ; verdict UNCERTAIN de semantic_a leve par ces sondes (caller known, mecanisme converge c_a)

## C reconcilie

```c
/* ============================================================================
 * sub_6A3960 — cellule 0x6A3960 (famille mag FX battle, suite MAG_212 0x6A1660)
 * C réconcilié — rôle voix c_a
 *
 * Ground truth = live ASM (asm.asm, 67 instr) — PAS Hex-Rays.
 * Taille live : 204 octets (0x6A3960..0x6A3A2B inclus, retn @ 0x6A3A2B).
 * Type IDA    : 'char __cdecl(int, char, __int16, __int16, __int16, int,
 *               __int16, char, char, char, int, __int16, int callback)'
 * Sauvegardes : ebx, ebp, esi, edi (push/pop dans cet ordre) — pas d'EBX
 *               réserve locale, pas d'frame EBP.
 * Correction add esp : 2 × `add esp, 8` après BdLinkTask_Register (cdecl, 2 args)
 *               @0x6A3975 et @0x6A3A1C. Les 4 × call _rand n'ont PAS de
 *               `add esp` (rand = cdecl 0 arg, callee-clean non — c'est le
 *               caller qui nettoie, mais 0 octet d'args ici, rien à nettoyer).
 *
 * Rôle : alloue N+1 tâches FX via BdLinkTask_Register sur la liste
 * dword_2510208 (g_BattleOTBase+0x44 domaine battle), et remplit pour chacune
 * un bloc de paramètres aux offsets 0x0C..0x17 du handle retourné : 4 mots
 * positionnés avec jitter (rand()*mult >> 15, sar signé) + 4 octets copiés
 * directement. Le callback est repassé tel quel à chaque registre.
 * ========================================================================== */

/* --- Externes (uniquement ceux présents dans asm.asm / callees.txt) -------- */

/* @0x6A396E / @0x6A3A15 — push callback ; push offset dword_2510208 →
 * arg1 = &dword_2510208 (list_head, cf. g_BattleOTBase+0x44), arg2 = callback.
 * Retour : handle de tâche dans EAX (0 = échec). Signature des args
 * UNCERTAIN (pointeur vs int), mais 2 args × 4 octets poussés est certain. */
extern int BdLinkTask_Register(int *list_head, int callback); // UNCERTAIN 0x6A396E signature exacte de callback (aucun appel indirect visible dans cette cellule)

/* @0x6A398C / @0x6A39A3 / @0x6A39BA / @0x6A39D1 — CRT rand(), 0 arg. */
extern int rand(void);

/* Liste de tâches battle (head). globals.txt : dword_2510208 @ 0x2510208. */
extern int dword_2510208;

/* --- Fonction -------------------------------------------------------------- */

char __cdecl sub_6A3960(
        int    a1,       /* arg_00 : compteur d'itérations (voir note boucle)  */
        char   a2,       /* arg_04 : -> byte [task+0x17]                       */
        short  a3,       /* arg_08 : -> word  [task+0x0C] (base + jitter)      */
        short  a4,       /* arg_0C : -> word  [task+0x0E]                      */
        short  a5,       /* arg_10 : -> word  [task+0x10]                      */
        int    a6,       /* arg_14 : multiplicateur jitter mots 0x0C/0x0E/0x10 */
        short  a7,       /* arg_18 : offset de base ajouté à a3/a4/a5          */
        char   a8,       /* arg_1C : -> byte [task+0x14]                       */
        char   a9,       /* arg_20 : -> byte [task+0x15]                       */
        char   a10,      /* arg_24 : -> byte [task+0x16]                       */
        int    a11,      /* arg_28 : multiplicateur jitter word 0x12           */
        short  a12,      /* arg_2C : base ajoutée au word 0x12                 */
        int    callback) /* arg_30 : repassé à BdLinkTask_Register             */
{
    int handle;  /* esi — handle de tâche courant */
    int base;    /* edi = a7 — chargé une seule fois avant la boucle (0x6A3980) */
    int mult;    /* ebp = a6 — idem (0x6A3984) */
    int count;   /* ebx = a1 — compteur décrémenté (0x6A3988) */
    int t;       /* résultats temporaires de rand() */

    /* 0x6A3960-0x6A3975 : première allocation.
     * push eax(callback) ; push offset dword_2510208 → args droite→gauche :
     * arg1 = &dword_2510208, arg2 = callback. add esp, 8. */
    handle = BdLinkTask_Register(&dword_2510208, callback); // 0x6A396E
    if (handle == 0)                                        // 0x6A397A jz
        return 0;                                           // 0x6A3A27 (EAX=0)

    base  = a7;   // 0x6A3980 mov edi, [esp+10h+arg_18]
    mult  = a6;   // 0x6A3984 mov ebp, [esp+10h+arg_14]
    count = a1;   // 0x6A3988 mov ebx, [esp+10h+arg_0]

    do {
        /* --- word [task+0x0C] = a3 + a7 + ((rand() * a6) >> 15) [sar signé] */
        t = rand() * mult;                    // 0x6A398C call _rand ; 0x6A3991 imul
        *(short *)(handle + 0x0C) = (short)(a3 + base + (t >> 15)); // sar eax, 0Fh ; add eax, edi ; add eax, [arg_8] ; mov [esi+0Ch], ax

        /* --- word [task+0x0E] = a4 + a7 + ((rand() * a6) >> 15) ------------- */
        t = rand() * mult;                    // 0x6A39A3 / 0x6A39A8
        *(short *)(handle + 0x0E) = (short)(a4 + base + (t >> 15)); // 0x6A39B6 mov [esi+0Eh], ax

        /* --- word [task+0x10] = a5 + a7 + ((rand() * a6) >> 15) ------------- */
        t = rand() * mult;                    // 0x6A39BA / 0x6A39BF
        *(short *)(handle + 0x10) = (short)(a5 + base + (t >> 15)); // 0x6A39CD mov [esi+10h], ax

        /* --- word [task+0x12] = a12 + ((rand() * a11) >> 15) — autres mults - */
        t = rand() * a11;                     // 0x6A39D1 ; 0x6A39D6 imul eax, [arg_28]
        /* Ordre ASM des stores autour d'ici (0x6A39DF-0x6A3A06) :
         *   cl = a8, dl = a9, [task+0x15] = a9, [task+0x12] = ax,
         *   al = a10, [task+0x14] = a8, cl = a2, [task+0x16] = a10,
         *   [task+0x17] = a2. L'ordre exact des octets n'a pas d'effet de bord
         *   observable (aucun aliasing prouvé), on groupe par champ. */
        *(short *)(handle + 0x12) = (short)(a12 + (t >> 15));        // 0x6A39EF mov [esi+12h], ax

        *(char *)(handle + 0x14) = a8;   // 0x6A39F7 mov [esi+14h], cl   (cl = arg_1C)
        *(char *)(handle + 0x15) = a9;   // 0x6A39EC mov [esi+15h], dl   (dl = arg_20)
        *(char *)(handle + 0x16) = a10;  // 0x6A3A01 mov [esi+16h], al   (al = arg_24)
        *(char *)(handle + 0x17) = a2;   // 0x6A3A06 mov [esi+17h], cl   (cl = arg_4)

        /* --- Boucle : test sur la valeur PRÉ-décrémentée -------------------
         * 0x6A39FE-0x6A3A09 : mov edx, ebx ; dec ebx ; test edx, edx ; jz exit.
         * `count-- == 0` teste l'ancienne valeur puis décrémente — mapping
         * exact. ⇒ avec a1 = N, N+1 tâches sont écrites (la dernière itération
         * a count == 0 mais est quand même exécutée). Fidèle Hex-Rays
         * (v16 = a1--; if (!v16) break). Si le caller passe N-1, il obtient N
         * tâches — UNCERTAIN 0x6A3A04 sémantique attendue du compteur chez le
         * caller sub_6A1660 (non visible dans cette cellule). */
        if (count-- == 0)                     // test edx,edx sur l'ancienne valeur
            break;                            // 0x6A3A09 jz loc_6A3A27

        /* 0x6A3A0B-0x6A3A1C : ré-allocation pour l'itération suivante.
         * callback est relit depuis [esp+10h+callback] à chaque tour. */
        handle = BdLinkTask_Register(&dword_2510208, callback); // 0x6A3A15 ; add esp, 8
    } while (handle != 0);                    // 0x6A3A21 jnz loc_6A398C

    /* Retour : dernier handle (0 si échec d'un registre ou du premier).
     * ASM laisse le handle 32 bits complet dans EAX à 0x6A3A2B retn ;
     * type IDA 'char' ⇒ tronqué à AL. UNCERTAIN 0x6A3A2B largeur réellement
     * consommée par le caller sub_6A1660 @0x6A19B9 (AL seul vs EAX complet) —
     * le typage IDA/Hex-Rays suggère AL seul, l'ASM ne tranche pas. */
    return (char)handle;
}

/* ============================================================================
 * Notes de réconciliation ASM vs Hex-Rays
 * ----------------------------------------------------------------------------
 * 1. sar 0Fh (0x6A3998/0x6A39AF/0x6A39C6/0x6A39E3) : décalage ARITHMÉTIQUE
 *    signé. Hex-Rays `(x * mult) >> 15` est correct ; ne pas remplacer par
 *    shr / division non signée. imul (signé) dans les 4 cas.
 * 2. Stores entrelacés 0x6A39DF-0x6A3A06 : l'ordre ASM intercale les lectures
 *    a8/a9/a10/a2 entre le calcul du word 0x12 et son store, mais aucun
 *    aliasing prouvé entre ces octets — regroupement par champ fidèle au
 *    résultat.
 * 3. Compteur : test pré-décrément ⇒ N+1 tâches pour a1 = N ≥ 0. Hex-Rays
 *    d'accord. Pas de garde a1 < 0 dans l'ASM (int décrémenté, test == 0
 *    signé) : a1 négatif bouclerait ~2^31 fois — comportement non gardé,
 *    probablement jamais atteint par le caller.
 * 4. Pas d'autre callee que BdLinkTask_Register et _rand — aucune library
 *    call inventée. Pas de lecture/écriture g_BattleOTBase+0x44 directe dans
 *    CETTE cellule : le lien passe par dword_2510208 (head de liste passé à
 *    BdLinkTask_Register).
 * 5. Un seul caller connu (callers.txt) : sub_6A1660 @0x6A19B9 (fan-in 1).
 * ========================================================================== */
```

## Analyse semantique

# Sémantique sub_6A3960 @ 0x6A3960 (analyse A, mode B-aveugle 1+P)

- Rôle (1 phrase) : Spawner d'effets de magie battle — alloue jusqu'à `1+arg_0` nœuds tâches sur la liste BdLinkTask `dword_2510208` avec le callback fourni, et remplis chacun de 12 octets de paramètres (3 s16 « position » base+jitter aléatoire, 1 s16 à échelle propre, 4 u8 d'options) consommés par le tick périodique.
- Confiance : **UNCERTAIN** (voir Verdict) — mécanique ASM certaine, étiquette fonctionnelle LIKELY.
- Nom catalogue : absent (stub `sub_6A3960`) → trop absent ; proposition markdown seule : **`MagFx_SpawnRandParamTasks`** (pas de rename).

## Verdict

**UNCERTAIN** au sens barème mode 1+P (CERTAIN non atteint), pour ces raisons précises :
1. **Jambes callees : OK.** `BdLinkTask_Register` et `_rand` présents dans `callees.txt` (l.8–14), et le contrat du callee est documenté wiki (battle-address-catalog.md L101 : « registers per-frame GF/effect tick; callback at `node+8`, pump `0x508420` ») — alignement ASM/wiki sur le mécanisme.
2. **Jambe caller : insuffisante.** Un seul xref (`call` depuis `sub_6A1660` @ `0x6a19b9`, MAG_212 — ticker famille fermé CERTAIN) mais `callers.txt` ne contient aucune ligne push : les **arguments du site d'appel sont invisibles**, je ne peux pas vérifier que arg_8/arg_C/arg_10 sont bien 3 bases d'axes ni la valeur typique de arg_0.
3. **Jambe wiki directe : absente.** Recherches QMD ff8-wiki (2026-09-21) : 0 hit pour `6A3960`, `2510208`, `BdLinkTask_Register`-en-contexte-6Axxxx, `6A1660`/MAG_212. Seul le catalogue d'adresses couvre le callee, pas cette fonction.

La mécanique (allocation N tâches + remplissage aléatoire déterministe des champs 0x0C..0x17) est prouvée par opcodes ; c'est l'interprétation sémantique des champs (axes ? délai ? options ?) et l'appariement caller/wiki qui manquent pour CERTAIN. Rien de contraire détecté (pas de CONFLICT).

## In / Out / Effets

Prototype IDA (meta.json) : `char __cdecl(int, char, __int16, __int16, __int16, int, __int16, char, char, char, int, __int16, int callback)` — 13 args cdecl, cadrés `[esp+10h+arg_X]` après 4 pushes.

**In** (interprétation depuis les seuls usages ASM) :
| Arg | Type | Rôle déduit | Destination |
|---|---|---|---|
| arg_0 (+0x00) | s32 | nb de tâches *supplémentaires* (boucle 6a39fe–6a3a21 : `1+arg_0` tâches au total, jamais 0) | compteur ebx |
| arg_4 (+0x04) | u8 | option 4 | node+0x17 |
| arg_8 (+0x08) | s16 | base axe 1 | node+0x0C |
| arg_C (+0x0C) | s16 | base axe 2 | node+0x0E |
| arg_10 (+0x10) | s16 | base axe 3 | node+0x10 |
| arg_14 (+0x14) | s32 | échelle de jitter commune (signée) | 3 premiers mots |
| arg_18 (+0x18) | s32 | offset commun ajouté aux 3 axes | 3 premiers mots |
| arg_1C (+0x1C) | u8 | option 1 | node+0x14 |
| arg_20 (+0x20) | u8 | option 2 | node+0x15 |
| arg_24 (+0x24) | u8 | option 3 | node+0x16 |
| arg_28 (+0x28) | s32 | échelle de jitter du 4e mot (signée) | node+0x12 |
| arg_2C (+0x2C) | s16 | base du 4e mot | node+0x12 |
| callback (+0x30) | ptr | tick par frame | stocké par `BdLinkTask_Register` en node+8 (contrat wiki) |

**Out** : retour eax **non conventionné** (proto `char` IDA probablement un artefact) — en sortie normale AL = arg_24 (reliquat du `mov al,[esp+10h+arg_24]` à 6a39f3, store 6a3a01) ; en échec d'allocation eax = 0 hérité de `BdLinkTask_Register`. Pas de stepper 0/2 constaté ici.

**Effets** : alloue jusqu'à `arg_0+1` nœuds sur la liste tête `dword_2510208` (0x2510208, `int`, globals.txt) via `BdLinkTask_Register(list, callback)` (cdecl : `push eax; push offset dword_2510208; call` à 6a3968–6a396e et 6a3a0b–6a3a15) ; écrit node+0x0C..node+0x17 (12 octets de payload utilisateur) ; **arrêt immédiat au premier échec d'allocation** (`test esi,esi; jz` 6a3978/6a3a1f). Aucune autre écriture mémoire ; pas d'accès direct OT/GfxDrawList.

## Preuves (ASM cité)

1. **6a3968–6a396e** : `push eax(callback); push offset dword_2510208; call BdLinkTask_Register` → alloue un nœud tâche FX sur la liste 0x2510208, callback en 2e arg cdecl (droite→gauche).
2. **6a3978–6a397a** : `test esi,esi; jz loc_6A3A27` → retour 0 du Register = échec, sortie sans remplissage.
3. **6a398c–6a399f** : `call _rand; imul eax, ebp(arg_14); sar eax,0Fh; add eax, edi(arg_18); add eax, edx(arg_8); mov [esi+0Ch], ax` → jitter uniforme [0..arg_14[ (rand∈[0,0x7FFF], `>>15` = /32768) + base commune + base axe → **s16** node+0x0C.
4. **6a39a3–6a39cd** : même motif ×2 → s16 node+0x0E (base arg_C, 6a39b6) et node+0x10 (base arg_10, 6a39cd), toujours + arg_18 : **3 axes partagent offset commun et échelle**.
5. **6a39d1–6a39ef** : 4e `_rand` avec échelle dédiée `imul eax,[esp+10h+arg_28]` et base `arg_2C` → s16 **indépendant** node+0x12.
6. **6a39df–6a3a06** : 4 octets copiés tels quels : arg_1C→[esi+14h] (6a39f7), arg_20→[esi+15h] (6a39ec), arg_24→[esi+16h] (6a3a01), arg_4→[esi+17h] (6a3a06).
7. **6a39fe–6a3a21** : `mov edx,ebx; dec ebx; test edx,edx; jz exit` (test du compteur **avant** décrément) + `call BdLinkTask_Register` puis `jnz loc_6A398C` → boucle do-while : remplissages = **arg_0+1** (arg_0=0 produit quand même 1 tâche) ; arrêt sur échec d'allocation.
8. **Wiki, battle-address-catalog.md L101–102** : `BdLinkTask_Register` 0x508360 « per-frame GF/effect tick ; callback at node+8 », `BdLinkTask_Pump` 0x508420 « call [node+8] … unlink on return bit 2 » → les 12 octets 0x0C..0x17 sont la payload utilisateur lue par le callback tick (alignement callee/wiki).

Justification du nom (≥2 preuves adressées) : spawn d'instances tâches (1, 7) × paramètres aléatoires (3, 5) → `MagFx_SpawnRandParamTasks`.

## Checks

- **Callees cités présents dans callees.txt** : `BdLinkTask_Register` (6a396e, 6a3a15 → l.8, l.14) ✓ ; `_rand` (6a398c, 6a39a3, 6a39ba, 6a39d1 → l.10–13) ✓. Aucun autre call.
- **Strides en nombres** : écritures à offsets **fixes** sur le nœud — mots 2 octets à 0x0C/0x0E/0x10/0x12, octets à 0x14/0x15/0x16/0x17 ; payload utilisateur = 12 octets (0x0C→0x18). Aucun stride de tableau (rien à voir avec F_CHAR 0x1D0 ni slot 0xD0 ici) ; `sar 0Fh` = division 2^15, pas un stride.
- **Polarités signées** : `imul eax, ebp` / `imul eax, arg_28` (multiplication **signée**) + `sar` (shift **arithmétique**) → échelles de jitter signées acceptées ; aucune comparaison `ja/jb` unsigned dans la fonction (seulement `test/jz/jnz`) ✓.
- **Largeur retour** : `retn` nu (cdecl, caller nettoie 0x34) ; eax jamais positionné délibérément — retour `char` du proto = leurre probable, à traiter comme void/indifférent ; 0 effectif uniquement sur échec d'allocation.
- **Divergences Hex-Rays non vérifiables** (mode aveugle : hexrays.c/c_*.c interdits). Seul point de proto suspect : le retour `char` (voir ci-dessus).

## Questions ouvertes

- Sémantique de node+0x12 (angle ? délai ? taille ?) et des 4 octets +0x14..+0x17 : dépend du callback passé par `sub_6A1660` — callback absent du pack.
- `dword_2510208` = `g_BattleOTBase+0x44` (si base 0x25101C4) ou liste de tâches FX indépendante : non tranchable sans IDA ; le contexte orchestrator mentionne aussi `dword_2510258` (liste sœur ? +0x50).
- Site d'appel 0x6a19b9 : valeurs concrètes des 13 args inconnues → l'interprétation « 3 axes + jitter » (x/y/z) reste LIKELY, pas CERTAIN.
- Zéro couverture wiki directe de 0x6A3960 / 0x6A1660 / 0x2510208 dans ff8-wiki (QMD, 2026-09-21) : à réinjecter après ouverture de la cellule.

## IDBCOMMENT

```
Alloue 1+arg0 noeuds tache sur la liste BdLinkTask dword_2510208 avec le callback passe en dernier argument, puis remplit chacun de 12 octets de parametres : 3 mots 16 bits base commune + base + jitter rand*echelle>>15 (0x0C/0x0E/0x10), un 4e mot a echelle propre (0x12) et 4 octets d'options (0x14..0x17). La boucle s'arrete au premier echec d'allocation (retour 0) ; la tache est ensuite tickée par BdLinkTask_Pump qui appelle le callback en node+8. [semantic-triple 2026-09-21]
```
