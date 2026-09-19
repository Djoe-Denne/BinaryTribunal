# battleswirl_generatescanlinesBuffer @ 0x559750

- Nom descriptif proposé (markdown seul) : `battleswirl_GenScanlineNoise_MidpointDisplacement` — décrirait mieux l'algorithme (midpoint displacement récursif) ; nom catalogue confirmé, pas un nom mensonger.
- Instr: 56
- Mode: 2+1 (triple GLM)
- Verdict: CERTAIN (A=CERTAIN, B=CERTAIN, R=CERTAIN)
- Callers: BattleTransition_InitScanlinesNormal @0x55970f (appel (0, screen_y-1)) + self-récursion
- Push IDB: append-only `[semantic-triple 2026-09-19]` + save_database
- Revue semantic-triple 2026-09-19: triple 2+1, 3 divergences tranchées, questions closes (args, reader Phase2 0x559D10, screen_y = hauteur backbuffer écrite par 0x559530)

## C réconcilié

```c
// ============================================================================
// c_reconciled.c — battleswirl_generatescanlinesBuffer @ 0x559750 (base 0x400000)
// Triple GLM, voix A + voix B réconciliées contre l'ASM live.
//
// Ground truth = live ASM (asm.asm, Intel, labels IDA) + ida_dump_bytes,
// PAS Hex-Rays. hexrays.c = vérificateur seulement (aucune divergence
// sémantique détectée ; deux non-équivalences cosmétiques notées dans
// reconcile_notes.md).
//
// Taille live : 147 octets (0x559750..0x5597E2), 56 instructions.
// Type IDA    : int __cdecl battleswirl_generatescanlinesBuffer(int a1, int a2)
// Sauvegardes : push ebp / mov ebp,esp ; push ebx ; push esi ; push edi
//               (0x559750..0x559758) ; épilogue symétrique 0x5597DE..0x5597E2.
//               retn sans opérande => callee ne nettoie pas ses args (__cdecl) ;
//               la récursion interne nettoie : add esp,8 @ 0x5597CD.
// Args        : arg_0 = [ebp+8]  = a1 (index gauche, cache ebx)
//               arg_4 = [ebp+0Ch] = a2 (index droit, relu [ebp+arg_4] @0x55975F
//               et @0x559795)
// Contrôle    : moitié GAUCHE = appel récursif (push esi ; push ebx ; call self
//               @0x5597C8, args (a1, mid) poussés droite->gauche) ;
//               moitié DROITE = tail-call converti en boucle
//               (mov ebx,esi @0x5597D7 ; jmp loc_559759 @0x5597D9).
//               a2 n'est PAS porté par la boucle (rechargé pile chaque tour) ;
//               screen_y est relu depuis le global à CHAQUE itération (0x559759).
// ============================================================================

extern int screen_y;                 // global relu chaque itération (0x559759)
extern int dword_204DB38[490];       // buffer scanlines, DWORD stride 4,
                                     // accès [idx*4] SANS clamp (borne ouverte
                                     // documentée, consommée par phase2 0x559C70)

int __cdecl battleswirl_generatescanlinesBuffer(int a1, int a2)
{
    int result;  // eax : moyenne résiduelle ou retour du dernier appel récursif

    for (;;)                                        // tête = loc_559759
    {
        // --- 0x559759..0x559780.
        // Division screen_y/30 : magic 0x88888889 (0x559762) * screen_y (imul
        // signé 0x559769) ; compensation add edx,ecx (0x55976D) ; sar edx,4
        // (0x559772) ; fix de signe shr edi,1Fh (0x55977B) + add (0x559780).
        // Delta (a2-a1)>>2 calculé en parallèle : sub edi,ebx (0x55976B) ;
        // sar edi,2 (0x55976F) — sar ARITHMÉTIQUE, opérandes signés.
        // ORDRE ASM : le delta est ajouté au quotient brut à 0x55977E, APRÈS le
        // sar 4 de la division et AVANT le fix de signe — commutatif, résultat
        // identique à screen_y/30 + ((a2-a1)>>2). Le delta ne traverse JAMAIS
        // un shift de la division.
        int amp = screen_y / 30 + ((a2 - a1) >> 2); // edi

        // --- 0x559779 add esi,ebx ; 0x559782 sar esi,1 : midpoint ARITHMÉTIQUE.
        int mid = (a1 + a2) >> 1;                   // esi

        // --- 0x559784 call _rand (cdecl, rien à nettoyer). EAX 32 bits ENTIÈRE
        //     consommé (imul ecx,edi @0x559790) — contrairement à
        //     Battle_GetRandomInt qui ne retourne que AL.
        // --- Bruit : 0x55978B mov eax,80010003h ; 0x559793 imul ecx ;
        //     0x559798 add edx,ecx (compensation magie) ; 0x5597A1 sar edx,0Eh ;
        //     fix de signe 0x5597A6 shr ecx,1Fh + 0x5597A9 add
        //     => (rand() * amp) / 0x7FFF, division signée tronquée vers zéro.
        //     Magie vérifiée : x=0x7FFF -> 1, x=-0x7FFF -> -1.
        //     NB : rand()*amp wrap 32 bits silencieux (imul) — UB MSVC assumée.
        int noise = (rand() * amp) / 0x7FFF;        // edx

        // --- 0x559795 mov edi,[ebp+arg_4] (recharge a2, edi était le quotient).
        //     0x55979A mov eax, dword_204DB38[ebx*4]  ; t[a1] lu en premier
        //     0x5597AB mov ecx, dword_204DB38[edi*4]  ; puis t[a2]
        //     0x5597B2 add ; 0x5597B7 sar eax,1       : moyenne ARITHMÉTIQUE.
        //     0x5597B9 add edx,eax ; 0x5597BD mov [esi*4],edx.
        //     Le STORE est entre le cmp (0x5597BB) et le jge (0x5597C4) :
        //     exécuté chaque itération, y compris celle qui sort.
        result = (dword_204DB38[a1] + dword_204DB38[a2]) >> 1;
        dword_204DB38[mid] = result + noise;        // midpoint displacement

        // --- 0x5597B4 lea ecx,[ebx+1] ; 0x5597BB cmp ecx,esi ; 0x5597C4 jge
        //     — comparaison SIGNÉE (jge = SF=OF). Récursion gauche si a1+1 < mid.
        if (a1 + 1 < mid)
        {
            // 0x5597C6 push esi (mid) ; 0x5597C7 push ebx (a1) ; call self
            // @0x5597C8 ; add esp,8 @0x5597CD (cdecl, caller clean).
            // ebx/esi préservés par le callee => a1 et mid survivent à l'appel.
            result = battleswirl_generatescanlinesBuffer(a1, mid);
        }

        // --- 0x5597D0 lea edx,[esi+1] ; 0x5597D3 cmp edx,edi (a2) ; 0x5597D5
        //     jge loc_5597DE — comparaison SIGNÉE. Sortie si mid+1 >= a2.
        if (mid + 1 >= a2)
            break;                                  // épilogue 0x5597DE..0x5597E2

        // --- 0x5597D7 mov ebx,esi ; 0x5597D9 jmp loc_559759 : moitié droite
        //     itérative (tail-call). a2 et screen_y relus en tête de boucle.
        a1 = mid;
    }

    // --- Retour : EAX est un RÉSIDU de dataflow, pas une valeur de contrat.
    //     À 0x5597E2, EAX = retour du dernier appel récursif gauche si branché
    //     (0x5597C8), sinon la moyenne du dernier midpoint (sar eax,1
    //     @0x5597B7). Le suivi `result` ci-dessus reproduit ce EAX exactement.
    //     La source d'origine retournait probablement void ; l'appelant
    //     0x559690 (BattleTransition_InitScanlinesNormal, xref @0x55970F) n'est
    //     pas montré comme consommateur de EAX dans le pack (non vérifié ici).
    return result;                                  // retn @0x5597E2
}

// ----------------------------------------------------------------------------
// Notes structurantes :
//  * Rôle : midpoint displacement récursif (bruit 1D fractal) sur
//    dword_204DB38 — remplit les points intermédiaires entre les extrémités
//    initialisées par rand()%0x78 dans BattleTransition_InitScanlinesNormal
//    (0x559690, caller unique hors self @0x55970F). Consommé par phase2
//    0x559C70 (PH10).
//  * Amplitude du bruit : (rand()/32767) * (screen_y/30 + (a2-a1)/4) —
//    screen_y relu à chaque itération ; le delta (a2-a1)>>2 est ajouté après
//    le sar 4 de la division screen_y/30, jamais à l'intérieur d'un shift.
//  * Table 490 DWORD, accès [idx*4] SANS clamp : a1/a2 doivent rester dans
//    [0,489] — responsabilité des callers.
//  * Terminaison : chaque moitié strictement plus petite ; récursion gauche
//    seulement (profondeur ~log2(490) ≈ 9), droite itérative. Appel avec
//    a1 >= a2 : un store puis retour immédiat, pas de boucle infinie.
//  * Comparaisons jge des deux branches : SIGNÉES.
// ----------------------------------------------------------------------------
```

## Preuves et validation parent

1. Magie `/30` : `mov eax, 88888889h` @0x559762, `imul` signé @0x559769, compensation `add edx,ecx` @0x55976D, `sar edx,4` @0x559772, fix de signe `shr 1Fh`+`add` @0x55977B/0x559780 → `screen_y / 30` signé tronqué vers zéro (vérifié : x=30→1, x=−30→−1).
2. Magie `/32767` : `mov eax, 80010003h` @0x55978B, `imul ecx` @0x559793, compensation @0x559798, `sar edx,0Eh` @0x5597A1, fix @0x5597A6/0x5597A9 → `(rand() * amp) / 0x7FFF` signé tronqué vers zéro (vérifié : x=0x7FFF→1, x=−0x7FFF→−1) ; RAND_MAX = 0x7FFF, EAX 32 bits entièrement consommé (contrairement à `Battle_GetRandomInt`, AL only).
3. Store médian unique `dword_204DB38[esi*4]` @0x5597BD : `buf[mid] = (buf[a1]+buf[a2])/2 + noise` — une seule écriture mémoire par appel, exécutée chaque itération (située entre le cmp @0x5597BB et le jge @0x5597C4 : scheduling, pas branche conditionnelle).
4. Récursion gauche = vrai `call self` @0x5597C8 (push mid/a1 droite→gauche, `add esp,8` @0x5597CD, cdecl) ; moitié droite = tail-call converti en boucle (`mov ebx,esi` @0x5597D7, `jmp loc_559759` @0x5597D9) — `a2` rechargé pile et `screen_y` relu du global à chaque tour ; gardes `jge` @0x5597C4/0x5597D5 signées (SF=OF), profondeur gauche ~log2(490) ≈ 9.
5. Buffer `dword_204DB38` = `int[490]` (0x7A8 octets), accès `[idx*4]` @0x55979A/0x5597AB/0x5597BD **sans clamp** — borne ouverte, responsabilité des callers ; appel unique `(0, screen_y-1)` par l'init (extrémités seedées `rand()%0x78`), jamais les bornes.
6. Reader externe unique : `XrefsTo(0x204DB38)` → 0x5596EC/0x559708 (init, écritures bornes), 0x55979A/0x5597AB/0x5597BD (cette fonction), **0x559D10 (`NormalTransition_Phase2`)** — consommateur externe unique, lecture seule ; wiki `render_transitions.md` concorde (« Phase2 only READS the buffer, sole consumer per xrefs »).

## Divergences

1. **Formule amplitude** : `screen_y / 30 + ((b - a) >> 2)` confirmé — l'ASM calcule `(b-a)>>2` (`sar edi,2` @0x55976F) en parallèle de la division et l'additionne au quotient brut @0x55977E, après le `sar 4` et avant le fix de signe (le delta ne traverse jamais un shift de la division). La md de A (`amp = screen_y/30` seul) était incohérente avec sa propre reconstruction C ; voix B adoptée.
2. **Retour** : `return result;` (résidu dataflow : moyenne du dernier midpoint `sar eax,1` @0x5597B7, ou retour du dernier `call` gauche @0x5597C8) — le `return 0 // placeholder` de A contredit le dataflow ASM (EAX jamais mis à zéro ; épilogue 0x5597DE..E2 = pops + retn uniquement). Valeur résiduelle, pas un contrat (source probablement void).
3. **Hex-Rays** : concorde sur toute la sémantique ; deux non-équivalences cosmétiques seulement — ordre de lecture `buf[a2]`/`buf[a1]` (addition commutative ; l'ASM lit `a1` d'abord @0x55979A, ordre adopté) et matérialisation du produit intermédiaire `v5 = v3*rand()` (l'ASM enchaîne les `imul` : forme `(rand()*amp)/0x7FFF` adoptée, wrap 32 bits silencieux documenté). Hex-Rays recalcule aussi `a1 = (a1+a2)>>1` là où l'ASM réutilise `mid` (`mov ebx,esi` @0x5597D7) — même valeur, forme ASM adoptée.
