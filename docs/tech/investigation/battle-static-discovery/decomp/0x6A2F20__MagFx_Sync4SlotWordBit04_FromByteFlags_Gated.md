# MagFx_Sync4SlotWordBit04_FromByteFlags_Gated @ 0x6A2F20

- Instr (live): 17 (49 o, 0x6A2F20-0x6A2F50)
- Palier: 1+P (2 voix c_a + semantic_a, verification parent P)
- Verdict: CERTAIN - pour chacun des 4 records mag FX (word a 0x1D97494, stride 0x9C) dont le bit 0x02 est pose, copie le bit 0x04 de l'octet de controle a 0x25102AC+4*i dans le bit 0x04 du word, autres bits preserves (formule (b^w)&4)^w @0x6A2F32-3B) ; retour void effectif (AX residuel du mov ax,[esi] @0x6A2F2B, type IDA __int16() signale)
- Push IDB: OK append-only + save_database 2026-09-20
- Confiance: CERTAIN
- Nom IDA: sub_6A2F20\nTYPE ; proposition: MagFx_Sync4SlotWordBit04_FromByteFlags_Gated
- Notes parent: checks 5.6 OK (role P) : 17 instr bit-a-bit prouvees (formule xor/or 0x6A2F32-3B), callees.txt vide = feuille sans call, caller sub_6A1660 (2 sites, catalogue CERTAIN) ; convergence c_a/sem_a ; sémantique metier bits 0x02/0x04 laissee ouverte (non documentee)

## C reconcilie

```c
// ============================================================================
// sub_6A2F20 — CELLULE 0x6A2F20 (voix c_a)
// Plage live : 0x6A2F20 .. 0x6A2F50 (49 octets, 17 instr — asm.asm GROUND TRUTH)
// Type IDA   : __int16 sub_6A2F20(void)
// Convention : cdecl implicite, AUCUN argument pile, AUCUN appel.
// Sauvegardes: push esi / pop esi uniquement (ebx, edi intouchés).
// Ground truth = live ASM (asm.asm) + ida_dump_bytes, not Hex-Rays.
// Appelants  : sub_6A1660 uniquement (xrefs 0x6A16E4 et 0x6A1E0E, fan-in 1 fn / 2 sites).
// ============================================================================

// ---- Externes (noms IDA live ; rôle sémantique non prouvé ici) ------------
// word_1D97494 : base table de WORDs, stride 0x9C (156) — contexte : famille mag FX battle 0x6A2xxx
// unk_25102AC  : base table d'octets, stride 4 — 4 entrées (0x25102AC..0x25102B8),
//                borne fin = byte_25102BC (0x25102BC)
extern unsigned __int16 word_1D97494;   // 0x1D97494
extern unsigned __int8  unk_25102AC;    // 0x25102AC
extern unsigned __int8  byte_25102BC;   // 0x25102BC (borne de fin, jamais lue)

__int16 sub_6A2F20(void)
{
    unsigned __int16 *p_word; // esi — itère sur word_1D97494, pas de +0x9C octets
    unsigned __int8  *p_flag; // ecx — itère sur unk_25102AC, pas de +4
    unsigned __int16  w;      // ax — mot chargé (jamais réécrit par la branche)
    unsigned __int16  nw;     // dx — mot modifié

    p_word = &word_1D97494;   // mov esi, offset word_1D97494
    p_flag = &unk_25102AC;    // mov ecx, offset unk_25102AC

    // Boucle : exactement 4 itérations (0x25102BC - 0x25102AC = 0x10, /4)
    do
    {
        w = *p_word;                          // 6A2F2B  mov ax, [esi]

        if ( (w & 2) != 0 )                   // 6A2F2E  test al, 2  (bit 1 de l'octet bas)
        {
            // 6A2F32  mov dl, [ecx]
            // 6A2F34  xor dl, al
            // 6A2F36  and edx, 4        -> seul le bit 2 (0x04) peut survivre :
            //                                    nw = w ^ (bit2(flag) ^ bit2(w))
            // 6A2F39  xor edx, eax
            // 6A2F3B  mov [esi], dx
            nw = w ^ ( ( unsigned __int16 )( ( *p_flag ^ ( unsigned __int8 )w ) & 4 ) );
            *p_word = nw;

            // NB : condition teste le bit 1 (0x02) mais l'effet porte sur le
            // bit 2 (0x04) — polarité/offset volontairement laissés tels quels,
            // l'ASM est la vérité (access: le bit 0x40 inversé selon l'accesseur
            // est un piège connu de la famille, pas observé ici).
        }

        p_flag += 4;                          // 6A2F3E  add ecx, 4
        p_word = ( unsigned __int16 * )( ( unsigned __int8 * )p_word + 0x9C );
                                              // 6A2F41  add esi, 9Ch
    }
    while ( ( int )p_flag < ( int )&byte_25102BC );
                                              // 6A2F47  cmp ecx, offset byte_25102BC
                                              // 6A2F4D  jl  — comparaison SIGNÉE (jl, pas jb)

    // 6A2F50  retn — retour dans AX = dernier mot CHARGÉ (valeur d'AVANT la
    // modification du dernier tour : l'ASM stocke dx, ax reste l'ancien mot).
    // Hex-Rays confirme (result = *v0 non modifié). Largeur : 16 bits.
    return ( __int16 )w;
}
// UNCERTAIN 0x6A2F20 sémantique : word_1D97494 (table mag FX ?) et unk_25102AC
// (flags par entrée, stride 4) n'ont pas de rôle prouvé dans ce pack — noms IDA
// conservés. Le retour AX est-il consommé par sub_6A1660 (non vérifiable ici) ?
```

## Analyse semantique

# Sémantique sub_6A2F20 @ 0x6A2F20 (analyse A)

- Rôle (1 phrase) : synchronise, pour chacune des 4 entrées d'un tableau de records mag-FX (stride 0x9C à `0x1D97494`), le bit 0x04 du word d'état sur le bit 0x04 d'un octet de contrôle du tableau `0x25102AC` (stride 4), mais uniquement lorsque le bit 0x02 du word est posé.
- Confiance : **CERTAIN** (mécanique bit-à-bit intégralement prouvée par opcodes ; caller unique catalogué CERTAIN dans la famille mag FX ; feuille sans calls, cohérent avec callees.txt vide). La *signification métier* des bits 0x02/0x04 reste non documentée dans le wiki (voir Questions ouvertes).
- Nom catalogue : `sub_6A2F20` neutre, non mensonger. Proposition (markdown seul, PAS de rename) :
  **`MagFx_Sync4SlotWordBit04_FromByteFlags_Gated`**

## In / Out / Effets

- In (implicites, aucun argument cdecl) :
  - `word_1D97494` : base du tableau de records mag-FX, mots de 16 bits, stride `0x9C` (4 entrées, offset mot +0 de chaque record).
  - `unk_25102AC` : base d'un tableau de 4×4 octets (limite de boucle `byte_25102BC`, type `_BYTE[4]` côté IDA mais plage scannée 0x25102AC..0x25102BC = 16 octets) ; seul l'octet +0 de chaque entrée est lu.
- Out :
  - Écriture mot (`mov [esi], dx` @ `0x6A2F3B`) dans `word_1D97494 + 0x9C*i`, i = 0..3.
  - Retour : IDA type `__int16()`, mais AX n'est pas positionné délibérément — AX contient incidemment le dernier word lu (`mov ax,[esi]` @ `0x6A2F2B`). Largeur retour effective : **void** (EAX résiduel non contractuel).
- Effets exacts par slot i :
  - `w = word[1D97494 + 0x9C*i]` ; si `(w & 0x0002)` : `w.bit2 = byte[25102AC + 4*i].bit2`, tous les autres bits préservés (`((b^w)&4)^w` prouvé : `6A2F32`–`6A2F3B`).
  - Si `(w & 0x0002) == 0` : aucun accès au tableau `0x25102AC`, record intact (`jz short loc_6A2F3E` @ `0x6A2F30`).
- Pas d'effet de bord autre : pas d'appel, pas de stack frame, `esi` sauvegardé/restauré (`push esi` @ `0x6A2F20` / `pop esi` @ `0x6A2F4F`).

## Verdict CERTAIN — justification

Mode 1+P exige CERTAIN. Atteint car :
1. La sémantique est **déterministe et complète** depuis 17 opcodes : copie conditionnelle d'un bit, aucune ambiguïté de signe (le seul branchement conditionnel de boucle `jl` @ `0x6A2F4D` compare des pointeurs bas tous positifs ; le gate `jz`/`test al,2` @ `0x6A2E/0x6A2F30` est non signé par construction).
2. Callers alignés : 2 sites d'appel (`0x6A16E4`, `0x6A1E0E`) dans `sub_6A1660` — catalogué **CERTAIN**, famille « Invocations et effets magiques » (catalogue decomp 437, QMD ff8-wiki `decomp-function-catalog.md`), plage 0x6A2xxx = famille mag FX confirmée par les voisins `0x6A79B0 MagFx_RenderComposedFK_Alloc4C` (CERTAIN) et `0x6DA980 MagFx_IndexPackedNodeTree`.
3. Callees : aucun (feuille) — `callees.txt` CALLS vide, et l'ASM ne contient aucun `call` : alignement exact.
4. Wiki : pas de page dédiée à `word_1D97494`/`0x25102AC` (wiki.md du pack en échec ; recherche QMD ff8-wiki négative sur ces adresses) — ce silence n'**contraint pas** la mécanique prouvée par opcodes, il borne seulement l'interprétation métier des bits.

## Preuves (ASM cité)

1. `0x6A2F21 mov esi, offset word_1D97494` + `0x6A2F41 add esi, 9Ch` : tableau de words, stride **0x9C**, base `0x1D97494` (stride en nombre, pas de `*232` Hex-Rays ici).
2. `0x6A2F26 mov ecx, offset unk_25102AC` + `0x6A2F3E add ecx, 4` + `0x6A2F47 cmp ecx, offset byte_25102BC` + `0x6A2F4D jl` : exactement **4 itérations** (0x25102AC→0x25102BC, pas 4), aligné avec `globals.txt` `_BYTE[4]`.
3. `0x6A2F2E test al, 2` + `0x6A2F30 jz short loc_6A2F3E` : gate sur le **bit 0x02** du word record ; sans ce bit, l'octet de contrôle n'est jamais lu (court-circuit vers l'incrément).
4. `0x6A2F32 mov dl,[ecx]` / `0x6A2F34 xor dl,al` / `0x6A2F36 and edx,4` / `0x6A2F39 xor edx,eax` / `0x6A2F3B mov [esi],dx` : algèbre `((b^w)&4)^w` ⇒ **seul le bit 0x04** du word est réécrit, à la valeur du bit 0x04 de l'octet source (copie, pas toggle ni inversion — polarité non inversée).
5. `0x6A2F20 push esi` / `0x6A2F4F pop esi` / `0x6A2F50 retn` : feuille sans appel, aucun `call` dans l'ASM ⇒ cohérent avec `callees.txt` (CALLS vide) ; aucun library call inventé.
6. Callers `callers.txt` : `sub_6A1660` @ `0x6A16E4` et @ `0x6A1E0E` (fonction de taille 0x10F9, unique caller) — double appel cohérent avec un helper de resynchronisation de flags invoqué à deux phases du driver mag FX ; `more: false`.
7. Divergence Hex-Rays signalée : type IDA `__int16()` — le AX de retour est résiduel (`mov ax,[esi]` @ `0x6A2F2B`, dernière itération), **pas** une valeur de retour contractuelle ; à réconcilier en `void`.

## Checks demandés

- Callees cités présents dans callees.txt : OUI (aucun callee, liste vide — alignement exact).
- Strides en nombres : 0x9C (records word) et 4 (octets de contrôle), tous deux issus d'opcodes cités.
- Polarités : gate = bit posé (jz = saut si absent) ; copie de bit sans inversion ; boucle `jl` signée sur pointeurs bas, inoffensive.
- Largeur retour : void effectif (AX résiduel), 16 bits si lu tel quel.

## Questions ouvertes

- Signification métier des bits 0x02 (gate) et 0x04 (valeur synchronisée) du word record : le wiki ne documente ni `word_1D97494` ni `0x25102AC`. Hypothèse LIKELY (non prouvée) : flags de visibilité/activation d'effet par slot d'entité, l'octet à `0x25102AC+4i` étant l'état maître (peut-être par groupe d'exécution). À trancher par lecture des écrivains de `0x25102AC` (hors périmètre de ce pack).
- Rôle exact des 2 sites d'appel dans `sub_6A1660` (init vs tick de fin d'effet) : nécessiterait le désassemblage du caller, absent du pack.

## IDBCOMMENT

```
Synchronise les flags mag FX des 4 slots : pour chaque record word a 1D97494+9C*i dont le bit 02 est pose, recopie le bit 04 de l'octet de controle a 25102AC+4*i dans le bit 04 du word, sans toucher les autres bits. Feuille sans appel, appelee deux fois par sub_6A1660 (0x6A16E4, 0x6A1E0E) ; pas de valeur de retour contractuelle (AX residuel). [semantic-triple 2026-09-20]
```
