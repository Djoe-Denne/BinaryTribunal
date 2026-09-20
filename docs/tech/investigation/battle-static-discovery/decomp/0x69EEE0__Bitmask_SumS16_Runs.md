# Bitmask_SumS16_Runs @ 0x69EEE0

- Instr (live): 49 (119 o, 0x69EEE0-0x69EF56)
- Palier: 1+P (2 voix + sondes IDA parent P)
- Verdict: CERTAIN - walker pur sans callee : parcourt les runs d'une ressource indexee (dword n a P+0, table a P+4+4*i), selectionne le run i si le bit i de *arg4 est pose (shl/test/jz), somme en s32 signe les s16 a element+2 (stride element 4+6*V), bornes signees, retour EAX int ; skip si n<=0
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: Bitmask_SumS16_Runs\nTYPE ; proposition: Bitmask_SumS16_Runs
- Notes parent: checks 5.6 OK (role P) : mecanisme integral opcode-prouve par semantic_a (bitmask 0x69EF15-23, somme 0x69EF2F/36, runs 0x69EF0F/1A/4D) + convergence c_a ; nom IDA Bitmask_SumS16_Runs CONFIRME au niveau mecanisme ; sonde IDA xrefs_to 0x69EEE0 = 3 callers x 2 sites tous zone mag FX : sub_69EE80 @0x69EE9B/@0x69EEB7 (pipeline MAG213, ferme CERTAIN), sub_6CE5B0 @0x6CE5CB/@0x6CE5E7, sub_6EA8C0 @0x6EA8DB/@0x6EA8F7 ; verdict UNCERTAIN de semantic_a leve par ces sondes

## C reconcilie

```c
// ============================================================================
// c_a — Bitmask_SumS16_Runs @ 0x69EEE0 (0x69EEE0..0x69EF56, 49 instr, 119 o)
// Voice c_a : reconstruction C fidèle au live ASM (asm.asm).
// Ground truth = live ASM (asm.asm) + ida_dump_bytes, NOT Hex-Rays.
// hexrays.c = vérificateur SEULEMENT ; divergences corrigées ci-dessous.
//
// Proto IDA  : int __cdecl(int, _DWORD *)  — nom IDA : Bitmask_SumS16_Runs
// Convention : __cdecl, args droite→gauche, retour EAX entier 32 bits (full).
// Sauvegardes de registres :
//   - esi/edi push en tête (0x69EEE7/0x69EEE8), pop en fin (0x69EF51/0x69EF52).
//   - ebx/ebp push/pop À L'INTÉRIEUR du bloc "count > 0"
//     (0x69EF07/0x69EF08 push, 0x69EF4F/0x69EF50 pop) — pas de save si
//     [base] <= 0 (early-out par 0x69EF01 jle -> 0x69EF51).
// Aucun callee : zéro `call` dans l'ASM, aucune library call.
// Correction Hex-Rays : 0x69EF42 recharge esi depuis le save pile var_8
//   (= base initial), PAS depuis [a1+4] comme écrit hexrays.c:38. Ici base
//   n'est jamais modifiée en C, donc l'instruction est sémantiquement un no-op.
// Divergence nulle par ailleurs : jle/jl signés (count et bit), movsx s16
//   (run_count ET val), stride identique (6*val+4 octets), accumulation
//   eax 32 bits signé.
// ============================================================================

int __cdecl Bitmask_SumS16_Runs(int a1, _DWORD *a2)
{
    int            sum;    // eax — accumulateur 32 bits signé (0x69EEE9 xor eax,eax)
    int            bit;    // ecx — index de bit courant (0x69EEEE xor ecx,ecx)
    unsigned char *base;   // esi — [a1+4] : base du blob (0x69EEEB mov esi,[ecx+4])
    unsigned char *p;      // edi — curseur dans la table d'offsets dwords
    int            n;      // [base] — nombre de groupes, dword signé (0x69EEF6)
    unsigned char *q;      // edx — curseur de parcours des runs (adresses en octets)
    int            run_count; // ebx — s16 sign-extendé, nb d'itérations de run (0x69EF25)
    int            val;    // s16 sign-extendé lu à rec+2 (0x69EF2F)
    int            step;   // ebp — 3*val (0x69EF38)
    int            m;      // ebp puis copie pile — masque *a2 (0x69EF09/0x69EF0B)

    sum  = 0;                                   // 0x69EEE9
    base = *(unsigned char **)(a1 + 4);         // 0x69EEEB — champ +4 de la struct a1
    bit  = 0;                                   // 0x69EEEE
    p    = base;                                // 0x69EEF0
    n    = *(int *)p;                           // 0x69EEF6 — 1er dword du blob = count de groupes
    p   += 4;                                   // 0x69EEF8 — la table d'offsets suit le count

    if (n > 0)                                  // 0x69EF01 jle — comparaison SIGNÉE
    {
        m = *a2;                                // 0x69EF09 mov edx,[edx] — a2 pointe le dword masque
        // (0x69EF0B : le masque est aussi recopié dans le slot arg_0 de la pile)

        do {
            // Offset dword lu dans la table, relatif à base (PAS en unités de 4)
            q = base + *(int *)p;               // 0x69EF0F mov edx,[edi] ; 0x69EF1A add edx,esi
            p += 4;                             // 0x69EF1E add edi,4 — élément suivant de la table
            // 0x69EF1C shl ebx,cl : x86 masque cl sur 5 bits — si n > 32,
            // (1 << bit) boucle sur bit & 31 (comportement matériel, pas UB C).
            if ((m & (1 << bit)) != 0)          // 0x69EF1C/0x69EF21/0x69EF23 jz
            {
                run_count = *(short *)q;        // 0x69EF25 movsx ebx, word ptr [edx] — SIGNÉ
                q += 2;                         // 0x69EF28 add edx,2
                if (run_count > 0)              // 0x69EF2D jle — SIGNÉ (count <= 0 -> zéro itération)
                {
                    do {
                        // Lecture à rec+2 : q pointe le début d'itération, la valeur
                        // s16 est 2 octets plus loin. Signe étendu.
                        val = *(short *)(q + 2);    // 0x69EF2F movsx esi, word ptr [edx+2]
                        q += 2;                     // 0x69EF33 add edx,2
                        sum += val;                 // 0x69EF36 add eax,esi — 32 bits signé
                        step = val + val * 2;       // 0x69EF38 lea ebp,[esi+esi*2] = 3*val
                        --run_count;                // 0x69EF3B dec ebx
                        // Stride : q_next = (q+2) + 2*(3*val) + 2, soit depuis le
                        // début d'itération : +6*val+4 octets. val étant signé,
                        // un val négatif fait RECULER le curseur.
                        q = q + step * 2 + 2;       // 0x69EF3C lea edx,[edx+ebp*2+2]
                    } while (run_count != 0);       // 0x69EF40 jnz — boucle tant que count != 0
                    // 0x69EF42 : l'ASM recharge esi depuis le save pile var_8
                    // (== base initial). En C : base n'a pas changé — no-op.
                }
            }
            ++bit;                              // 0x69EF4A inc ecx
        } while (bit < n);                      // 0x69EF4D jl — SIGNÉ
    }
    // 0x69EF4F/0x69EF50 pop ebp/ebx (dans le bloc), 0x69EF51+ pop edi/esi, add esp,8, retn
    return sum;                                 // EAX 32 bits, largeur de retour exacte
}

// ----------------------------------------------------------------------------
// Notes structurantes (prouvé par ASM) :
//  - Blob à [a1+4] : dword[0] = n (count groupes), puis n offsets dwords
//    relatifs à base (octets, pas index). Groupe g à base + off[g].
//  - Groupe sélectionné par (mask & (1 << bit)), bit = index de groupe.
//  - Dans un groupe sélectionné : word s16 = nb d'itérations ; chaque
//    itération lit un s16 à (curseur+2), l'additionne à la somme, puis
//    avance de 6*s16+4 octets depuis le début d'itération.
//  - Ni écriture mémoire, ni comptage : somme seule retournée dans EAX.
// UNCERTAIN 0x69EF2F — signification métier du s16 lu à rec+2 (poids ?
//    longueur ?) et du layout à stride 6*val+4 : à arbitrer par A/V/R.
// UNCERTAIN 0x69EEE0 — sémantique du champ a1+4 (type de struct hôte) :
//    seul l'offset +4 est prouvé.
// ----------------------------------------------------------------------------
```

## Analyse semantique

# Sémantique Bitmask_SumS16_Runs @ 0x69EEE0 (analyse A, mode aveugle)

- **Rôle (1 phrase)** : Walker pur de ressource indexée — parcourt une table de « runs » adressés par offsets relatifs, sélectionne chaque run i par le bit i d'un masque 32 bits lu via le 2ᵉ argument, et retourne en EAX la somme signée des s16 situés à élément+2 de chaque élément des runs sélectionnés.

- **Confiance** : **UNCERTAIN** (au sens du barème triple — voir ci-dessous)
  - **Pourquoi pas CERTAIN** : le barème exige callers + callees + wiki alignés **et** opcodes cités. Ici : callees alignés (feuille pure, `callees.txt` ne liste aucun CALL — le `add esp,8` @ 0x69EF53 est l'épilogue symétrique du `sub esp,8` @ 0x69EEE0) ; opcodes tous cités ; **mais** (a) la jambe wiki est absente — `wiki.md` du pack est un échec de génération (`qmd failed`) et 3 recherches QMD ff8-wiki (adresse, nom IDA, formats candidats « table d'offsets + comptes s16 + payload 6·V ») donnent 0 hit pertinent ; (b) les 6 callers ne sont connus que par adresse (0x69EE9B/0x69EEB7, 0x6CE5CB/0x6CE5E7, 0x6EA8DB/0x6EA8F7 — 3 fonctions jumelles de 0x51 octets, 2 appels chacune) et la construction des arguments aux sites d'appel n'est **pas vérifiable en mode aveugle** (IDA interdit). Aucune divergence détectée — l'échec est une absence de preuve, pas une contradiction (donc pas CONFLICT). **Ce qui est certain par opcodes** : toute la mécanique décrite ci-dessous est prouvée instruit par instruit ; seul le rattachement domaine (sémantique du payload 6·V, usage de la somme par les callers) reste ouvert. Si la jambe wiki ou le désassemblage d'un caller est fourni, montée CERTAIN immédiate attendue.

- **Nom catalogue** : `Bitmask_SumS16_Runs` — **confirmé** au niveau mécanisme (≥2 preuves adressées) :
  1. *Bitmask* : 0x69EF15 `mov ebx,1` / 0x69EF1C `shl ebx,cl` / 0x69EF21 `test ebp,ebx` / 0x69EF23 `jz` — test du bit i du dword `*arg4`.
  2. *SumS16* : 0x69EF2F `movsx esi, word ptr [edx+2]` + 0x69EF36 `add eax,esi` — accumulation de s16 étendus signés.
  3. *Runs* : 0x69EF0F `mov edx,[edi]` + 0x69EF1A `add edx,esi` — blocs adressés par une table d'offsets relatifs, bouclés par 0x69EF4D `jl`.
  - Le nom ne prétend rien sur le domaine (pas de mensonge, pas d'over-claim) : pas de renommage proposé. Suggestion markdown seule si affinage ultérieur : `Bitmask_SumS16_OfIndexedRuns` (gain marginal, non requis).

- **In / Out / Effets** (cdecl, arguments évalués droite→gauche, prototype `int __cdecl(int, _DWORD *)`) :
  - **In arg0** (int, en réalité pointeur, [esp+0xC] du cadrage initial, lu @ 0x69EEE3) : pointeur vers un header dont le dword à **+0x04** (0x69EEEB) = `P`. Layout à `P` : dword **n** signé @ P+0 (0x69EEF6), puis table de n dwords **offsets relatifs à P** @ P+4+4·i (0x69EF0F, add P @ 0x69EF1A). Chaque run pointé : **s16 count** @ +0 (0x69EF25), puis `count` éléments de taille **4 + 6·V** octets où V = s16 à élément+2 (0x69EF2F) ; le s16 à élément+0 n'est jamais lu.
  - **In arg4** (`_DWORD *`, [esp+0x10], lu @ 0x69EF03, déréférencé @ 0x69EF09) : pointeur vers un dword **Q** = masque de bits ; bit i ⇒ run i inclus. Lu une seule fois, respillé @ 0x69EF0B.
  - **Out** : EAX = somme signée 32 bits des V (s16 @ élément+2) sur tous les éléments de tous les runs sélectionnés ; **0 si n ≤ 0** (retour anticipé 0x69EF01). Retour `int`, largeur pleine EAX.
  - **Effets** : AUCUN hors de sa pile — pas d'écriture mémoire externe, pas de globals (`globals.txt` vide), pas d'appel (feuille). Pure et réentrante. Seuls spills locaux : var_8/var_4 (0x69EEF2/0x69EEFD) et réemploi du slot arg_0 pour Q (0x69EF0B).

- **Preuves (opcodes cités)** :
  1. 0x69EEE9 `xor eax,eax` puis 0x69EEFB `test edx,edx` / 0x69EF01 `jle short 0x69EF51` : n (dword @ P+0) testé **signé** ; ≤ 0 ⇒ retour immédiat avec EAX=0.
  2. 0x69EEE3 `mov ecx,[esp+8+arg_0]` + 0x69EEEB `mov esi,[ecx+4]` : P = dword @ arg0+0x04 (l'offset +0 de arg0 n'est jamais lu).
  3. 0x69EF03 `mov edx,[esp+18h+arg_4]` + 0x69EF09 `mov edx,[edx]` : Q = `*arg4` — arg4 est un pointeur vers le masque, pas le masque lui-même.
  4. 0x69EF15/0x69EF1C/0x69EF21/0x69EF23 `mov ebx,1` / `shl ebx,cl` / `test ebp,ebx` / `jz` : sélection par bit i (i = ECX, 0-based) du masque.
  5. 0x69EF0F `mov edx,[edi]` + 0x69EF1A `add edx,esi` + 0x69EF1E `add edi,4` : offsets de runs **dwords relatifs à P**, table à stride 4 (invariant esi=P maintenu par restauration var_8 @ 0x69EF42).
  6. 0x69EF25 `movsx ebx, word ptr [edx]` + 0x69EF2B `test ebx,ebx` + 0x69EF2D `jle` : compteur d'éléments par run = **s16 signé** ; ≤ 0 ⇒ run ignoré sans contribution.
  7. 0x69EF2F `movsx esi, word ptr [edx+2]` + 0x69EF36 `add eax,esi` : la valeur sommée est le **s16 signé** à élément+2 (l'accumulateur EAX est 32 bits, signe préservé).
  8. 0x69EF38 `lea ebp,[esi+esi*2]` (3·V) + 0x69EF33 `add edx,2` + 0x69EF3C `lea edx,[edx+ebp*2+2]` (+6·V+2) : stride élément = **4+6·V octets** exactement ; boucle interne 0x69EF3B/0x69EF40 `dec ebx; jnz` (comptage pur, ZF) ; borne externe 0x69EF4A–0x69EF4D `inc ecx; cmp ecx,edx; jl` **signée** (i < n).

- **Checks demandés** :
  - **Strides (nombres)** : table d'offsets de runs = **4** octets/entrée (dword) ; header de run = **2** octets (s16 count) ; élément = **4 + 6·V** octets (header 4 octets : s16 non lu @+0, s16 V @+2 ; payload **6·V** octets). Aucun stride 0x1D0/0xD0/232 du catalogue battle — ce n'est pas une structure de slot battle connue.
  - **Polarités** : toutes les lectures 16 bits sont **signées** (`movsx` ×2) ; tous les branchements de borne sont **signés** (`jle` @ 0x69EF01, `jle` @ 0x69EF2D, `jl` @ 0x69EF4D) ; aucun `ja/jb` unsigned dans la fonction ; `jz`/`jnz` sont des tests de bit/compteur neutres en signe. `shl ebx,cl` logique sur 1 (masque).
  - **Largeur retour** : EAX 32 bits pleine largeur, somme de s16 signés ⇒ `int` signé ; `retn` @ 0x69EF56 sans nettoyage d'arguments (cdecl — l'appelant nettoie ; le callee ne dépile que ses 8 octets locaux + 4 registres sauvegardés).

- **Questions ouvertes** :
  1. Sémantique du payload 6·V : V est-il un compteur d'enregistrements de 6 octets (ex. sommets s16×3) ? Indécidable depuis l'ASM seul — la fonction ne lit jamais le payload.
  2. Le s16 à élément+0 est ignoré par cette fonction : double emploi avec count, ou champ destiné à un autre consommateur ?
  3. Pourquoi 3 callers jumeaux de 0x51 octets × 2 appels chacun (0x69EE80 / 0x6CE5B0 / 0x6EA8C0) ? Probable cumul sur deux masques distincts (allocation/taille de buffer ?) — non vérifiable en aveugle.
  4. Quirk latent : si n > 32, `shl ebx,cl` modulo 32 réutilise les bits du masque — hypothèse implicite n ≤ 32 (masque 32 bits), non gardée par le code.

- **IDBCOMMENT** (proposition) :
  > Parcourt une table de runs : P = dword a arg0+4, n = dword a P+0, offsets relatifs dword a P+4+4*i. Le bit i du masque lu a *arg4 active le run i ; chaque run commence par un s16 compte, puis somme le s16 a element+2 pour chaque element de taille 4+6*valeur octets. Retour eax = somme signee, 0 si n <= 0 ; pure, aucun effet de bord. [semantic-triple 2026-09-20]
