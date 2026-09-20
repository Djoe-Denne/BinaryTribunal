# IndexLut_FillFF_AssignKeys @ 0x6A1230

- Instr (live): 28 (71 o, 0x6A1230-0x6A1276)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - init un enregistrement LUT de 0x85 octets : or eax,0FFFFFFFFh + rep stosd 0x20 dwords = 128 octets a 0xFF (nom FillFF prouve @0x6A1243/5C), en-tete 5 octets (4 zeros + count byte), puis LUT[cle_i]=i pour chaque cle vararg lue en pile (mov [ecx+edx+5],al @0x6A126A = AssignKeys) ; cdecl variadique (caller depile, 5 args chez 0x6A0DC0), boucle signee jle/jl, retour EAX = compteur residuel
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: IndexLut_FillFF_AssignKeys\nTYPE ; proposition: IndexLut_FillFF_AssignKeys
- Notes parent: checks 5.6 OK (role P) : or eax,0FFFFFFFFh (0x6A1243), rep stosd (0x6A125C), mov [ecx+edx+5],al (0x6A126A) = nom IDA confirme par 2 preuves mecanisme ; zero callees, zero add esp (variadique) ; 8 xrefs callers.txt ; CERTAIN pose par la voix

## C reconcilie

```c
// ============================================================================
// c_a.c — IndexLut_FillFF_AssignKeys @ 0x6A1230  (voix c_a : reconstruction C)
// ============================================================================
// Ground truth = live ASM (asm.asm, 28 instr, 0x6A1230..0x6A1276, taille 0x47)
// + ida_dump_bytes, PAS Hex-Rays. hexrays.c = vérificateur seulement.
//
// Type IDA : int __cdecl(_BYTE *, int) — INCOMPLET. La fonction lit N clés
// supplémentaires directement dans la pile d'arguments (variadique de facto) :
//   lea esi, [esp+0Ch+arg_4]  -> esi = adresse stack de arg_4 (= &count)
//   boucle : mov ecx, [esi+4] ; add esi, 4
// Le caller stepper MAG213 0x6A0DC0 (0x6A10F7) pousse 5 args :
//   IndexLut_FillFF_AssignKeys(hdl+0x150, 3, 0xE, 0x12, 0x16)
// Hex-Rays n'en montre que 2 (il reconstitue le parcours via v3 = &a2).
//
// Conventions : cdecl (callee ne nettoie PAS la pile — `retn` sans immédiat,
// aucun `add esp` : aucun call dans la fonction, callees.txt vide).
// Comparaisons SIGNED : test ebx,ebx / jle ; cmp eax,ebx / jl.
//
// Layout LUT écrit (0x85 octets) :
//   +0x00..0x03 : 4 octets zero (4 stores byte)
//   +0x04       : (byte)count  — mov [edx+4], bl, SEUL le low byte
//   +0x05..0x84 : 0x80 octets a 0xFF (rep stosd, ecx=0x20 dwords, eax=-1)
//   puis lut[5 + key] = index pour chaque clé lue en stack.
// ============================================================================

int __cdecl IndexLut_FillFF_AssignKeys(unsigned __int8 *lut, int count, ...)
{
    // lea esi, [esp+0Ch+arg_4] : esi pointe sur l'arg_4 stack (= &count).
    // Le parcours des clés se fait par adressage stack relatif, pas via un
    // vrai va_list ; &count reproduit exactement le comportement ASM
    // (mêmes adresses effectives [esi+4], [esi+8], ...).
    int *pKey = &count;

    // ---- Zero des 4 premiers octets (stores bytes, ordre 3,2,1,0 en ASM) ----
    lut[3] = 0;
    lut[2] = 0;
    lut[1] = 0;
    lut[0] = 0;

    // mov [edx+4], bl — stocke SEULEMENT le low byte de count
    lut[4] = (unsigned __int8)count;

    // ---- rep stosd : 0x20 dwords a 0xFFFFFFFF depuis lut+5 => 0x80 octets ----
    {
        unsigned __int32 *dst = (unsigned __int32 *)(lut + 5); // lea edi,[edx+5]
        int i;
        for (i = 0; i < 0x20; ++i)                             // mov ecx, 20h
            dst[i] = 0xFFFFFFFFu;                              // or eax, -1
    }

    // ---- Assignation des clés : lut[5 + key_i] = i, i in [0, count) ----
    // Boucle SIGNED (jle / jl). count <= 0 => aucune assignation.
    // cle lue en stack : mov ecx, [esi+4] (dword complet) ; index d'ecriture
    // = ecx full 32-bit : [ecx+edx+5]. Aucun bound-check dans l'ASM : une
    // cle >= 0x80 (ou negative) ecrirait hors des 0x85 octets de la LUT.
    // Stocke al seulement (mov [ecx+edx+5], al).
    int i;
    for (i = 0; i < count; ++i)          // cmp eax, ebx / jl — SIGNED
    {
        int key = pKey[1];               // mov ecx, [esi+4] — arg stack 2+i
        ++pKey;                          // add esi, 4
        lut[5 + key] = (unsigned __int8)i;
    }

    // retn : EAX = compteur de boucle residuel (0 si count<=0, sinon count).
    // Aucun store de retour volontaire dans l'ASM ; valeur probablement non
    // utilisee par les callers.
    return i;
}

// ============================================================================
// Notes c_a (divergences / vérifications ASM vs Hex-Rays) :
//  1. Hex-Rays `memset(a1 + 5, 0xFFu, 0x80u)` : cohérent avec rep stosd
//     (0x20 dwords = 0x80 octets). OK.
//  2. Hex-Rays montre 2 args seulement : la signature réelle est variadique
//     (count + count clés en stack). Corrigé ici via `...` + parcours &count,
//     qui reflète l'adressage stack live (lea esi, [esp+0Ch+arg_4]).
//  3. Hex-Rays `return result` : fidèle (EAX = compteur), mais le prototype
//     `int` est trompeur — rien ne prouve que les callers lisent EAX.
//     // UNCERTAIN 0x6A1276 Les callers (sub_6A0DC0 @0x6A10F7, sub_6F7310,
//     // sub_695AB0, sub_68A050, sub_68B2F0, sub_68B700, sub_68B950) lisent-ils
//     // EAX après le call, ou est-ce un retour mort ?
//  4. Pas de bounds-check sur `key` dans l'ASM (index 32-bit brut dans
//     [ecx+edx+5]) : les clés 0xE/0x12/0x16 du stepper MAG213 restent dans la
//     LUT, mais un key >= 0x80 sortirait du buffer. Fidèle à l'ASM, garder tel quel.
// ============================================================================
```

## Analyse semantique

# Sémantique IndexLut_FillFF_AssignKeys @ 0x6A1230 (analyse A, mode 1+P aveugle)

- Rôle (1 phrase) : Initialise à `pArg0` un enregistrement LUT inverse de 0x85 octets — en-tête 5 octets (4 zéros + compte), table de 128 octets pré-remplie à 0xFF — puis, pour chaque clé vararg `k_i` lue sur la pile, écrit `LUT[k_i] = i` (table clé → indice).
- Confiance : CERTAIN (mécanique intégralement déterminée par les opcodes ; aucun callee, 8 call sites réels dans callers.txt. Réserve : wiki.md indisponible — la convergence wiki n'a pas pu être vérifiée, mais l'ASM est ground truth et le nom est confirmé par 2 preuves adressées).
- Nom catalogue : **confirmé** (markdown seul, pas de rename)
  - `FillFF` : pré-remplissage à 0xFF prouvé — `or eax, 0FFFFFFFFh` @ 0x6A1243 + `rep stosd` (0x20 dwords = 128 octets de 0xFF) @ 0x6A125C.
  - `AssignKeys` : boucle d'assignation `mov [ecx+edx+5], al` @ 0x6A126A écrit l'indice de clé à `LUT[clé]`.
  - `IndexLut` : cohérent avec une LUT inverse (valeur de clé = offset dans la table, indice de clé = donnée stockée).

## In / Out / Effets

- **In (cdecl, callee ne dépile pas — `retn` nu @ 0x6A1276)** :
  - `arg_0` (edx) : pointeur `_BYTE*` vers le buffer LUT (ex. appelant 0x6A0DC0 : `hdl+0x150`).
  - `arg_1` (ebx) : `int count`, nombre de clés — comparaisons **signées** (`jle` @ 0x6A1262, `jl` @ 0x6A1271).
  - `arg_2..arg_N` : **variadique** — dwords lus sur la pile via `lea esi, [esp+0Ch+arg_4]` @ 0x6A1258 puis `mov ecx, [esi+4]; add esi, 4` (stride pile = 4) @ 0x6A1264–67. Valeurs d'exemple : 0xE, 0x12, 0x16.
- **Out** :
  - `[edx+0..3] = 0` (4 stores octet @ 0x6A1246–0x6A1252).
  - `[edx+4] = (u8)count` @ 0x6A1255 (`mov [edx+4], bl` — seul l'octet bas est stocké).
  - `[edx+5 .. edx+0x84] = 0xFF` (128 octets, `rep stosd`, edi = edx+5).
  - Pour i in 0..count-1 : `[edx+5 + clé_i] = (u8)i` — la clé est utilisée comme **offset octet** dans la LUT.
- **Retour / largeur** : EAX 32 bits = `count` (eax incrémenté jusqu'à ebx dans la boucle ; 0 si count <= 0 via `xor eax, eax` @ 0x6A125E).
- **Effets de bord** : aucun (pas de globals, pas d'appels — feuille pure, callees.txt vide cohérent).

## Verdict : CERTAIN

Structure totalement couverte par les opcodes : 28 instructions, aucune branche non expliquée. Le prototype IDA `int __cdecl(_BYTE *, int)` est **incomplet** (variadique réel : `int __cdecl f(_BYTE *lut, int count, ...)`).

## Preuves (6)

1. **Pré-remplissage 0xFF** : `mov ecx, 20h` @ 0x6A123E + `or eax, 0FFFFFFFFh` @ 0x6A1243 + `rep stosd` @ 0x6A125C → 128 octets à 0xFF depuis `edx+5`. Valide le segment « FillFF » du nom.
2. **Assignation clé→indice** : boucle 0x6A1264–0x6A1271 — `mov ecx, [esi+4]` (lit le vararg), `mov [ecx+edx+5], al` (écrit l'indice i à `LUT+clé`). Valide « AssignKeys ».
3. **En-tête count** : `mov [edx+4], bl` @ 0x6A1255 — le compte est mémorisé dans l'enregistrement, cohérent avec une LUT auto-descriptive.
4. **Feuille pure** : callees.txt vide, aucun `call` dans l'ASM — la fonction ne fait qu'écrire dans le buffer fourni ; pas d'invention de library call.
5. **Convention cdecl** : `retn` sans `ret n` @ 0x6A1276 — le caller dépile les varargs, confirmant l'appel variadique cdecl (les 8 xrefs de callers.txt, dont 0x6A10F7 dans sub_6A0DC0, pushent les clés droite→gauche).
6. **Comparaisons signées** : `jle` @ 0x6A1262 / `jl` @ 0x6A1271 sur le compte — count traité comme `int` signé, cohérent avec un guard `if (count <= 0) return 0;`.

## Checks

- Strides : varargs **4 octets** (`add esi, 4`) ; LUT **128 octets = 0x20 dwords × 4** (pas 512) ; enregistrement total **0x85 octets** (5 en-tête + 0x80 LUT). Aucun stride 0x1D0/232 ici — pas de piège structure personnage.
- Polarités : comparaisons **signées** (`jle`/`jl`) sur count ; pas de comparaison unsigned (`ja`/`jb`) dans la fonction.
- Largeur retour : **EAX 32 bits**, valeur = count. Le stockage `[edx+4]` est 8 bits seulement.
- Clés hors bornes : aucune validation — une clé ≥ 0x80 (ou négative) écrirait hors de la zone pré-remplie ; la confiance repose sur les constantes des callers (0xE/0x12/0x16).

## Questions ouvertes

- wiki.md indisponible (échec qmd) : la convergence wiki n'a pas été vérifiée — à réconcilier par V.
- Le contexte orchestrateur cite un appelant 0x69EB70, mais callers.txt ne le liste pas (8 xrefs : sub_68A050, sub_68B2F0, sub_68B700, sub_68B950, sub_695AB0, sub_6A0DC0, sub_6F7310 ×2) — divergence à clarifier.
- Signification domaine exacte des clés 0xE/0x12/0x16 (indices de sorts/mag FX ?) non déterminable depuis le pack seul.
- Le prototype IDA à 2 args sous-estime l'arité réelle (variadique) — proposition markdown : `int IndexLut_FillFF_AssignKeys(_BYTE *lut, int count, ...)`.

## IDBCOMMENT

Initialise a pArg0 un enregistrement de 133 octets : octets 0-3 a zero, octet 4 = nombre de cles, puis LUT de 128 octets a pArg0+5 pre-remplie avec 0xFF. Pour chaque cle vararg lue sur la pile (cdecl, caller depile), ecrit l'indice de la cle a pArg0+5+cle : table inverse cle vers indice, 0xFF restant sentinelle d'entree absente. Retourne le nombre de cles dans EAX. [semantic-triple 2026-09-20]
