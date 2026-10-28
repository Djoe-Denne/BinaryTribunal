# 0x00505C00 — production C B indépendante

Tâche `task_mv44sf6j_00b9_hv4w2b`, mission `ff8-decomp-semantics-20261011-r01`.
Livrable de reconstruction, **pas** une promotion ni une validation de compilation.
Les noms historiques ne sont pas utilisés pour attribuer une finalité.

## Entrées et limites du contrat

Préfixe des entrées : `inputs/ff8-decomp-semantics-20261011-r01/g17/`.

- `0x505C00.json:4–18` : provenance, unique chunk et ASM complet.
  SHA256 du paquet **cité depuis le manifeste**, non recalculé ici :
  `a9a3657c00325a3d8641238ff73c3400f89c3dff920d3ffdb3a9291a5cde3d58`.
- `common-compaction.md`, notamment lignes 12, 18 et 25 : contexte factuel
  commun ; SHA256 cité :
  `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`.
- `0x505C00.readable/manifest.json:1–30`, `asm-001.txt:1–25`,
  `asm-002.txt:1–17`, `bytes-001.txt:1–4` ; lectures complètes de ces fichiers.
- `0x505C00.readable/metadata.json:1–107,1320–1339` : CFG,
  deux cibles d'appels directs et compte de 42 instructions.
- Exécutable source, SHA256 déclaré par le gel :
  `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` ;
  x86 32 bits ; export `2026-10-11T16:38:25.140966+00:00`.

La fonction consomme **deux** DWORD sur la pile. Son type de retour C n'est
pas authentifié : deux sorties conservent l'EAX d'entrée, d'autres exposent
des résidus différents. Le code ci-dessous transporte explicitement cet EAX
avec un **troisième paramètre de modélisation**, qui n'est **pas** un argument
natif. Il restitue l'EAX final sans inventer un BOOL, un statut ni un `void`
authentifié. Ce n'est donc pas un remplacement ABI directement linkable de
la fonction à deux arguments.

Les deux déclarations `native_*` représentent seulement les deux E8 attestés.
Leur `uint32_t` de retour transporte le registre EAX observé à leur retour,
sans affirmer leur type source. Leurs corps et celui du callback ne sont pas
inventés. Leur intégration exige que le lead fournisse les liaisons vers les
adresses correspondantes, avec les mêmes effets mémoire et les garanties
usuelles de préservation EBX/ESI. Un éventuel ABI de helper utilisant d'autres
registres en entrée n'est pas démontré par ce seul paquet et demanderait une
liaison adaptée ; ces déclarations décrivent les arguments **empilés** observés.

## C complet du corps cible

Dialecte : C11, espace d'adresses hôte x86 32 bits correspondant aux adresses
du gel. Les helpers `m_*` sont des accès mémoire locaux, pas des callees
supplémentaires postulés dans le binaire. Aucun appel de bibliothèque.

Les accès little-endian sont assemblés par octets pour éviter d'imposer une
structure inventée, un alignement ou un aliasing de types 16/32 bits. Cela
modélise les valeurs WORD/DWORD exactes en mémoire ordinaire, sans prétendre
reproduire la granularité des transactions matérielles : mémoire valide,
sans MMIO ni observateur concurrent durant ces accès. Les fautes partielles,
EFLAGS et l'état transitoire de pile ne sont pas émulés par ce C.

```c
#include <stdint.h>
#include <limits.h>

#if defined(_MSC_VER) && defined(_M_IX86)
# define X86_CDECL __cdecl
#elif defined(__i386__) && (defined(__GNUC__) || defined(__clang__))
# define X86_CDECL __attribute__((cdecl))
#else
# error This address-bound reconstruction requires a 32-bit x86 target.
#endif

_Static_assert(CHAR_BIT == 8, "8-bit bytes required");
_Static_assert(sizeof(uint16_t) == 2, "16-bit words required");
_Static_assert(sizeof(uint32_t) == 4, "32-bit dwords required");
_Static_assert(UINTPTR_MAX == UINT32_MAX, "32-bit address space required");

typedef uint32_t addr32;

/* External dependencies: exactly the two observed native CALL targets.
 * Results denote raw post-call EAX, not inferred semantic return types.
 * callback_address is an opaque code address, NOT a guessed prototype.
 */
extern uint32_t X86_CDECL native_00506C10(uint32_t callback_address);
extern uint32_t X86_CDECL native_00505BC0(addr32 arg1, uint32_t arg2);

static inline addr32 aadd(addr32 base, uint32_t displacement)
{
    return (addr32)(base + displacement);  /* x86 address wrap, modulo 2^32 */
}

static inline uint8_t m_u8(addr32 address)
{
    return (uint8_t)*(volatile unsigned char *)(uintptr_t)address;
}

static inline void m_put8(addr32 address, uint8_t value)
{
    *(volatile unsigned char *)(uintptr_t)address = (unsigned char)value;
}

static inline uint16_t m_u16(addr32 address)
{
    uint32_t lo = m_u8(address);
    uint32_t hi = m_u8(aadd(address, UINT32_C(1)));
    return (uint16_t)(lo | (hi << 8));
}

static inline uint32_t m_u32(addr32 address)
{
    uint32_t b0 = m_u8(address);
    uint32_t b1 = m_u8(aadd(address, UINT32_C(1)));
    uint32_t b2 = m_u8(aadd(address, UINT32_C(2)));
    uint32_t b3 = m_u8(aadd(address, UINT32_C(3)));
    return b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
}

static inline void m_put16(addr32 address, uint16_t value)
{
    m_put8(address, (uint8_t)value);
    m_put8(aadd(address, UINT32_C(1)), (uint8_t)((uint32_t)value >> 8));
}

static inline void m_put32(addr32 address, uint32_t value)
{
    m_put8(address, (uint8_t)value);
    m_put8(aadd(address, UINT32_C(1)), (uint8_t)(value >> 8));
    m_put8(aadd(address, UINT32_C(2)), (uint8_t)(value >> 16));
    m_put8(aadd(address, UINT32_C(3)), (uint8_t)(value >> 24));
}

/* arg1 and arg2 are the two native stack arguments.
 * entry_eax is modeling state only; it has no native stack slot.
 * The result is the raw final EAX, including unchanged entry values.
 */
uint32_t re_00505C00_eax_model(addr32 arg1, uint32_t arg2,
                              uint32_t entry_eax)
{
    uint32_t eax = entry_eax;
    uint32_t ebx = arg2;
    addr32 esi;
    addr32 first;

    /* 00505C00..00505C08: full DWORD test, not a BL/AX test. */
    if (ebx == UINT32_C(0))
        return eax;

    esi = arg1;

    /* 00505C0E..00505C17: TEST BH,10h means EBX bit 12. */
    if ((m_u8(aadd(esi, UINT32_C(0x08))) & UINT32_C(0x18)) != 0 &&
        (ebx & UINT32_C(0x00001000)) == 0)
        return eax;

    /* 00505C19..00505C24: load precedes the partial-register AND. */
    eax = m_u32(aadd(esi, UINT32_C(0x8C)));
    ebx &= UINT32_C(0xFFFFEFFF);  /* only BH bit 4 is cleared */

    if (eax == UINT32_C(0)) {
        /* 00505C61..00505C68: PUSH EBX; PUSH ESI; CALL; ADD ESP,8.
         * No re-test when removing bit 12 made ebx zero.
         */
        eax = native_00505BC0(esi, ebx);
        return eax;
    }

    /* 00505C26..00505C35: this function passes, but does not call,
     * the literal callback address 00505C70.
     */
    eax = native_00506C10(UINT32_C(0x00505C70));
    if (eax == UINT32_C(0))
        return eax;

    /* 00505C37..00505C3F: retain ordering, including possible aliasing. */
    m_put32(aadd(eax, UINT32_C(0x0C)), esi);
    m_put8(aadd(eax, UINT32_C(0x15)), (uint8_t)ebx);
    first = esi;                    /* native ECX */

    for (;;) {
        /* 00505C44..00505C4C: start with the original arg1, not +8C.
         * Native EDX = 0000FFBF; AND uses only DX (16 bits).
         */
        if ((m_u8(esi) & UINT32_C(0x02)) != 0) {
            addr32 word_address;
            uint16_t old_word;

            eax = m_u32(aadd(esi, UINT32_C(0x74)));
            word_address = aadd(eax, UINT32_C(0x2C));
            old_word = m_u16(word_address);
            m_put16(word_address,
                    (uint16_t)((uint32_t)old_word & UINT32_C(0xFFBF)));
        }

        /* 00505C50..00505C5C: re-read after writes; no cached initial link.
         * Preserve stop-on-original before the null test.
         */
        esi = m_u32(aadd(esi, UINT32_C(0x8C)));
        if (esi == first)
            return eax;             /* 00505C6B..00505C6D */
        if (esi == UINT32_C(0))
            return eax;             /* 00505C5E..00505C60 */
    }
}
```

## ABI, largeurs et retours

Soit `S` l'ESP à l'entrée, contenant l'adresse de retour.

- `00505C01`, octets `8B 5C 24 0C`, après `PUSH EBX` : lecture de
  `[S+8]`, second argument DWORD. `00505C0A`, `8B 74 24 0C`, après les
  deux sauvegardes : lecture de `[S+4]`, premier argument DWORD.
- EBX et ESI sont sauvegardés/restaurés sur toutes les sorties ; pas de
  local sur pile. EBP/EDI ne sont pas écrits par le corps cible.
- À `00505C2B`, la pile immédiatement avant CALL vaut `S-12`, avec
  `00505C70` au sommet ; le callee voit cet argument à son `[ESP+4]`.
  `00505C30` enlève quatre octets après retour.
- À `00505C63`, la pile avant CALL vaut `S-16` : premier argument ESI au
  sommet, second argument EBX juste au-dessus. Le callee les voit à
  `[ESP+4]` et `[ESP+8]`. `00505C68` enlève huit octets après retour.
- Les deux épilogues font `POP ESI; POP EBX; RET`, sans `RET n` : ESP
  final `S+4`, les arguments restent à nettoyer par le caller. Le corps est
  compatible caller-cleanup ; cela ne prouve pas tous les prototypes source.

| Chemin | EAX final natif, transporté par le C |
|---|---|
| Deuxième argument DWORD nul | EAX d'entrée inchangé |
| Masque `arg1[8]&0x18` non nul et bit 12 de l'argument absent | EAX d'entrée inchangé |
| DWORD `arg1+8C` nul | EAX après `00505BC0(arg1, arg2 & FFFFEFFF)` |
| `00506C10` retourne zéro | Zéro |
| Branche avec résultat non nul, aucun record testé avec bit 1 de BYTE +0 | Résultat DWORD de `00506C10` |
| Même branche, au moins un record avec ce bit | Dernier DWORD chargé à record+74 dans cette branche |

Pas d'écriture partielle AL/AX dans la cible. Les écritures partielles
pertinentes sont `AND BH,EFh` et l'utilisation de BL ; aucune ne justifie de
réduire le deuxième argument à huit ou seize bits. `MOV EDX,0000FFBFh` est
un DWORD, puis `AND [EAX+2C],DX` est WORD. Après parcours réussi, ECX contient
le premier argument et EDX vaut `0000FFBF` ; ils restent des registres
caller-clobbered, non des sorties sémantiques revendiquées par le modèle.

Toutes les décisions sont zéro/égalité/tests de bits, sans ordre signé.
Aucun shift natif, division ni arithmétique signée à reproduire. Les seuls
shifts C sont ceux des accès little-endian, unsigned et bornés à 8/16/24.
L'addition des déplacements d'adresse est explicitement modulo 2^32.

## Couverture et preuves octets/ASM

Unique chunk `[00505C00,00505C6E)`, soit `0x6E = 110` octets,
42 instructions, 13 blocs du CFG. Pas de tail chunk ni de table de saut
nécessaire pour cette cible. Le callback `00505C70` est hors chunk.

| Bloc half-open | Couverture dans le C |
|---|---|
| `00505C00–00505C0A` | Sauvegardes ABI ; test DWORD nul |
| `00505C0A–00505C14` | Lecture du premier argument ; test BYTE +8 |
| `00505C14–00505C19` | Test BH, masque de sortie inchangé |
| `00505C19–00505C26` | Lecture DWORD +8C ; clear bit 12 ; branche |
| `00505C26–00505C37` | Appel exact 506C10, nettoyage, test EAX |
| `00505C37–00505C44` | Store DWORD +0C puis BYTE +15 ; ancre de parcours |
| `00505C44–00505C49` | Test BYTE +0 bit 1 |
| `00505C49–00505C50` | Lecture DWORD +74 ; AND WORD +2C |
| `00505C50–00505C5A` | Relecture DWORD +8C, comparaison à l'ancre |
| `00505C5A–00505C5E` | Test zéro et rebouclage |
| `00505C5E–00505C61` | Épilogue après lien nul |
| `00505C61–00505C6B` | Appel exact 505BC0 avec les deux DWORD |
| `00505C6B–00505C6E` | Épilogue partagé |

Vérifications manuelles sur les octets fournis :

1. `F6 C7 10` à `00505C14`, puis `80 E7 EF` à `00505C1F` : BH,
   donc masque DWORD `00001000` puis `FFFFEFFF`, **pas** `0x10` appliqué à BL.
2. `68 70 5C 50 00` à `00505C26` transmet exactement `00505C70`.
   `E8 E0 0F 00 00` à `00505C2B` : `00505C30 + 0FE0 = 00506C10`.
3. `89 70 0C` et `88 58 15` à `00505C37/3A` distinguent le store
   pointeur DWORD du store BL ; aucun effacement d'autres octets du résultat.
4. `66 21 50 2C` à `00505C4C` garantit la largeur WORD du masque
   `FFBF`, donc clear du bit `0040`, pas écrasement du DWORD voisin.
5. `8B B6 8C 00 00 00` à `00505C50` recharge le lien après les writes ;
   `74 11` à `00505C58` termine sur retour à l'ancre ; `75 E6` à
   `00505C5C` revient à `00505C44` seulement si le lien n'est pas nul.
6. `E8 58 FF FF FF` à `00505C63` : `00505C68 - 0A8 = 00505BC0`.
   `53 56` immédiatement avant transmet EBX entier après le clear de BH.

## Incertitudes, hypothèses et validations non exécutées

- Aucune sémantique de retour authentifiée. Le troisième paramètre et le
  résultat du C sont une convention de modélisation des résidus EAX, pas
  une modification proposée de l'ABI binaire.
- Les corps des deux callees et du callback ne sont pas dans le paquet
  cible. Effets externes laissés opaques ; pas de rôle/allocation supposé.
- Les références doivent désigner de la mémoire accessible aux largeurs
  observées. Pas de garde `arg1 == NULL`, ni de contrôle d'un pointeur +74.
  Le modèle n'ajoute pas de protection absente du natif.
- Un lien circulaire revenant à l'origine termine ; une chaîne terminant
  par zéro termine ; un cycle ne revenant jamais à l'origine peut boucler
  indéfiniment. Aucun compteur ni réparation de chaîne ajouté.
- La première lecture +8C sélectionne la branche seulement. Après le
  callee et les stores du résultat, le parcours repart de l'origine et
  recharge les champs : les mutations/alias locaux ne sont pas supprimés.
  La visibilité concurrente et les fautes partielles des accès octetisés
  restent hors du contrat du C proposé, comme indiqué plus haut.
- Contrôle effectué : lecture complète des 42 instructions et des 110
  octets, rapprochement manuel CFG/branches, tailles et séquences de pile.
  Pas d'exécution, de compilation, de test différentiel, de désassemblage
  indépendant, de hash recalculé ni de validation native §5.6.
- À faire par le lead/rôle autorisé : vérifier les contrats des deux
  liaisons natives et la convention EAX choisie, compiler sur x86 32 bits,
  comparer les chemins zéro/gate/bit-12-seul, liens nul/auto-boucle/chaîne,
  retour nul de 506C10 et pointeurs aliasés. Ce sont des demandes de
  validation, **pas des PASS**.
- Aucun voisin producteur, C antérieur, ledger ou index de résultats lu.
  La lecture supplémentaire du `CONTRACT.md` commun a été refusée par
  permissions ; aucun contournement. Le guide commun et le handoff parent
  explicite de cette tâche ont été utilisés.
