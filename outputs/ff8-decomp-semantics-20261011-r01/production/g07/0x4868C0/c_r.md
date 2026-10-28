# 0x4868C0 — C réconcilié (R) — g07

## 1. Provenance, entrées et limites de vérification

| Élément | Valeur / statut |
|---|---|
| Mission / tâche | `ff8-decomp-semantics-20261011-r01`, `task_mv44rodf_008d_bo31xw` (R, session fresh `pool-77`) |
| C A | `outputs/ff8-decomp-semantics-20261011-r01/production/g07/0x4868C0/c_a.md` (lu en entier) |
| C B | idem, `c_b.md` (lu en entier) |
| Paquet gelé | `inputs/ff8-decomp-semantics-20261011-r01/g07/0x4868C0.json` : 308 octets hex `[0x4868C0,0x4869F4)` lus en entier ; CFG 23 blocs, `xrefs_to` (47D4AF dans 47CCB0), `code_targets` {46B440, 485EC0, 4A92F0}, `instruction_count=90`. La ligne `assembly` est tronquée à 2000 caractères par le lecteur : **elle n'a pas servi de preuve** ; le désassemblage ci-dessous est refait à partir des octets. |
| Supplément | `.../g07/supplemental-0x4868C0/dispatch-table.json` : table VA `0x4869F4`, 20 octets `cc69480091694800cc694800a3694800d3694800`, SHA256 `eb34ae32…c722`, `idb_table_equals_pe=true`, `idb_target_equals_frozen=true` (validations fournies par le parent, non refaites ici) |
| Hash EXE (cité par A, B et le paquet) | `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, 32 bits, export 2026-10-11T16:38:25Z |
| Hash manifeste / compaction (cités par A et B, identiques) | `bb4e83a4…1f28` / `6925ce25…1fff` |

Limites de mon contrôle (rôle R : pas de shell, pas d'IDA) :

- Je n'ai **pas pu recalculer** de hash (SHA256 de A, B, paquet) ; les hashes ci-dessus sont ceux cités par les fichiers. A et B citent les mêmes hashes de manifeste/compaction/table : pas d'incohérence détectée. A et B ont été lus à l'emplacement `outputs/.../c_a.md|c_b.md` ; je n'ai pas pu lister `inputs/` (lecture de répertoire impossible). **Le lead doit confirmer que ce sont bien les livrables gelés avec leurs hashes.**
- Les tranches `asm-00N.txt`, `bytes-00N.txt`, `metadata.json` citées par A/B n'ont pas été retrouvées aux chemins que j'ai essayés ; je me suis appuyé sur les octets du JSON (complets) pour l'arbitrage.
- Aucune compilation, exécution ni test différentiel. Les critères §5.6 / contrôle natif final restent au lead.

## 2. Désassemblage de contrôle (refait depuis les 308 octets)

Toutes les cibles de saut et d'appel ont été recalculées depuis les déplacements.

| VA | Octets | Instruction | Effet utile / cible |
|---|---|---|---|
| 4868C0..C3 | `53 55 56 57` | push ebx, ebp, esi, edi | sauvegarde 16 octets |
| 4868C4 | `33 FF` | xor edi,edi | flags logiques |
| 4868C6 | `BD B2F1CF01` | mov ebp,0x1CFF1B2 | |
| 4868CB | `BE 907BD201` | mov esi,0x1D27B90 | |
| 4868D0 | `B3 FF` | mov bl,0xFF | |
| 4868D2 | `38 5E 3B` | cmp [esi+0x3B],bl | octet |
| 4868D5 | `74 3B` | jz 486912 | |
| 4868D7 | `33 C0` | xor eax,eax | |
| 4868D9 | `57` | push edi | argument de pile (indice 0..2) |
| 4868DA | `8A 87 4CE7CF01` | mov al,[edi+0x1CFE74C] | octet |
| 4868E0 | `8D 0C C0` | lea ecx,[eax+eax*8] | 9·id, sans flags |
| 4868E3 | `8D 14 48` | lea edx,[eax+ecx*2] | 19·id |
| 4868E6 | `66 8B 4E 98` | mov cx,[esi-0x68] | WORD |
| 4868EA | `66 81 26 DFFF` | and word [esi],0xFFDF | efface le masque 0x20 |
| 4868EF | `8D 04 D5 E8E0CF01` | lea eax,[edx*8+0x1CFE0E8] | 152·id |
| 4868F6 | `66 89 08` | mov [eax],cx | |
| 4868F9 | `66 8B 0E` | mov cx,[esi] | valeur post-AND |
| 4868FC | `66 89 88 96000000` | mov [eax+0x96],cx | |
| 486903 | `E8 B8F5FFFF` | call 0x485EC0 | retour 486908 |
| 486908 | `66 8B 16` | mov dx,[esi] | relecture après appel |
| 48690B | `83 C4 04` | add esp,4 | nettoyage appelant |
| 48690E | `66 89 55 00` | mov [ebp+0],dx | |
| 486912 | `81 C6 D0000000` | add esi,0xD0 | |
| 486918 | `47` | inc edi | |
| 486919 | `81 C5 D0010000` | add ebp,0x1D0 | |
| 48691F | `81 FE 007ED201` | cmp esi,0x1D27E00 | 0x270 = 3·0xD0 |
| 486925 | `7C AB` | jl 4868D2 | signé |
| 486927 | `BF 788ED201` | mov edi,0x1D28E78 | |
| 48692C | `0F BE 5F 01` | movsx ebx,byte [edi+1] | |
| 486930 | `33 D2` | xor edx,edx | |
| 486932 | `8A 17` | mov dl,[edi] | |
| 486934 | `85 D2` | test edx,edx | |
| 486936 | `74 3A` | jz 486972 | |
| 486938 | `B8 9CE7CF01` | mov eax,0x1CFE79C | |
| 48693D | `33 F6` | xor esi,esi | |
| 48693F | `33 C9` | xor ecx,ecx | |
| 486941 | `8A 08` | mov cl,[eax] | |
| 486943 | `3B CA` | cmp ecx,edx | |
| 486945 | `74 28` | jz 48696F | |
| 486947 | `83 C0 02` / `46` | add eax,2 / inc esi | |
| 48694B | `81 FE C6000000` | cmp esi,0xC6 | |
| 486951 | `7C EC` | jl 48693F | signé |
| 486953 | `B8 9CE7CF01` / `33 C9` | mov eax,0x1CFE79C / xor ecx,ecx | |
| 48695A | `80 38 00` | cmp byte [eax],0 | |
| 48695D | `74 0E` | jz 48696D | |
| 48695F | `83 C0 02` / `41` | add eax,2 / inc ecx | |
| 486963 | `81 F9 C6000000` | cmp ecx,0xC6 | |
| 486969 | `7C EF` | jl 48695A | signé |
| 48696B | `EB 05` | jmp 486972 | plein : aucune écriture |
| 48696D | `88 10` | mov [eax],dl | nouvel ID |
| 48696F | `88 58 01` | mov [eax+1],bl | quantité (octet bas) |
| 486972 | `83 C7 05` | add edi,5 | |
| 486975 | `81 FF 188FD201` | cmp edi,0x1D28F18 | 0xA0 = 32·5 |
| 48697B | `7C AF` | jl 48692C | signé |
| 48697D | `33 C0` / `A0 E7F6CF01` | xor eax,eax / mov al,[0x1CFF6E7] | |
| 486984 | `48` | dec eax | modulo 2^32 |
| 486985 | `83 F8 04` | cmp eax,4 | |
| 486988 | `77 52` | ja 4869DC | non signé |
| 48698A | `FF 24 85 F4694800` | jmp [eax*4+0x4869F4] | |
| 486991 | `66 FF 05 3AE9CF01` | inc word [0x1CFE93A] | |
| 486998 | `66 C7 05 C68FCD01 0500` | mov word [0x1CD8FC6],5 | |
| 4869A1 | `EB 39` | jmp 4869DC | |
| 4869A3 | `8A 15 DD87D201` | mov dl,[0x1D287DD] | |
| 4869A9 | `8B 1D 34E9CF01` | mov ebx,[0x1CFE934] | |
| 4869AF | `80 E2 10` | and dl,0x10 | |
| 4869B2 | `43` | inc ebx | préserve CF |
| 4869B3 | `F6 DA` | neg dl | CF = (dl≠0) |
| 4869B5 | `1B D2` | sbb edx,edx | 0 ou 0xFFFFFFFF |
| 4869B7 | `89 1D 34E9CF01` | mov [0x1CFE934],ebx | DWORD |
| 4869BD | `83 E2 5F` / `83 C2 05` | and edx,0x5F / add edx,5 | 5 ou 100 |
| 4869C3 | `66 89 15 C68FCD01` | mov [0x1CD8FC6],dx | |
| 4869CA | `EB 10` | jmp 4869DC | |
| 4869CC | `66 FF 05 38E9CF01` | inc word [0x1CFE938] | |
| 4869D3 | `66 C7 05 C68FCD01 6400` | mov word [0x1CD8FC6],0x64 | |
| 4869DC | `E8 5F4AFEFF` | call 0x46B440 | retour 4869E1 |
| 4869E1 | `66 C7 05 E0BFCD01 0000` | mov word [0x1CDBFE0],0 | |
| 4869EA | `E8 01292000` | call 0x4A92F0 | retour 4869EF |
| 4869EF..F2 | `5F 5E 5D 5B` | pop edi, esi, ebp, ebx | |
| 4869F3 | `C3` | ret | `RET` simple |

Total recompté : 90 instructions, fin à 0x4869F4 (exclusif) : conforme au paquet.

Table `0x4869F4` (DWORD little-endian) : idx0→4869CC, idx1→486991, idx2→4869CC, idx3→4869A3, idx4→4869D3. Avec `AL-1` : résultat 1→4869CC, 2→486991, 3→4869CC, 4→4869A3, 5→4869D3 ; 0 et 6..255 → 4869DC sans écriture de mode ni compteur.

## 3. Convergences A / B

Contrôlées contre les octets, toutes confirmées :

1. Chunk unique, 23 blocs CFG, aucune allocation de pile locale, `RET` simple, 3 appels natifs 485EC0 / 46B440 / 4A92F0.
2. Passe « party » : garde octet `[esi+0x3B]==0xFF` (saute), id zéro-étendu, stride 152 = 19·8, WORD `[esi-0x68]` lu avant l'AND, AND `0xFFDF` sur WORD `[esi]`, sauvegardes en `[rec]` puis `[rec+0x96]`, relecture de `[esi]` après appel et stockage en `[ebp]`, 3 itérations (0x270/0xD0) sous réserve de la préservation de ESI/EDI/EBP/EBX par le callee.
3. Inventaire : 32 lignes de stride 5 (`0xA0`), ID zéro-étendu, quantité MOVSX mais stockage de BL seul, recherche de l'ID existant sur 198 paires puis du premier ID zéro, **écrasement** de la quantité (ni addition, ni clamp), ID zéro ⇒ ligne sautée, inventaire plein ⇒ aucune écriture, sources non effacées.
4. Dispatch : `AL` zéro-étendu, `DEC` modulo 2^32, `JA` non signé, table décodée identique (mapping ci-dessus).
5. 486991 : INC WORD `0x1CFE93A`, mode WORD 5. 4869CC : INC WORD `0x1CFE938` puis chute dans 4869D3 (mode WORD 100). 4869A3 : INC DWORD `0x1CFE934`, mode = 5 si `[0x1D287DD]&0x10 == 0`, sinon 100, via `NEG DL ; SBB EDX,EDX` (EDX entier écrasé).
6. Queue commune : 46B440, WORD 0 en `0x1CDBFE0`, 4A92F0, quatre POP, RET. EAX final = retour du dernier callee, aucun type de retour source affirmé.

## 4. Matrice des divergences

| # | Sujet | A | B | Arbitrage (preuve) | Statut |
|---|---|---|---|---|---|
| D1 | Lecture de la table de dispatch | Mapping figé en constantes (`switch(eax)` sur indices 0..4), aucune lecture mémoire de la table | Lit `[0x4869F4+eax*4]` puis `switch` sur la cible ; pas de `default` | Octets `FF 24 85 F4694800` : `JMP` indirect = lecture DWORD réelle. Valeurs fournies par `dispatch-table.json` + équivalence IDB/PE. Les deux donnent les mêmes destinations ; B est plus fidèle (accès mémoire modélisé), A plus robuste face à un défaut (pas de `case` manquant). Fusion : lecture réelle + `switch` sur la cible + `default` explicite hors modèle. | Résolu |
| D2 | Adaptateur machine | `Mem` à callbacks par largeur + `execute_callee(ctx,s,continuation)` | `X86` contenant `read/write(width)` + `execute_to` | Pure forme d'interface : mêmes séquences d'accès, mêmes largeurs, même contrat « le callee réel s'exécute jusqu'à la continuation ». Aucune différence observable. Retenu : A (largeurs typées, pas de masquage implicite). | Résolu |
| D3 | Qualificatif du masque d'état effacé | « bit20 » (risque 2 et inconnues) | « bit20 status » (inconnues) | `66 81 26 DFFF` : masque 0x20 = bit d'indice 5, non « bit 20 ». Erreur de libellé commune à A et B. Corrigé ici en « masque 0x20 ». Le libellé IDA (« Berserk ») reste une hypothèse non utilisée. | Corrigé |
| D4 | Nom sémantique `Battle_PersistPartyAndItems_ThenExitByResult` | absent | proposé « pour description » | Hors périmètre C et non prouvé ; la sémantique relève du livrable `semantic_*`. Non repris dans le C. | Écarté |
| D5 | Libellés issus de l'étiquette (« F_CHAR+1B2 », « SG party », « documented logical eleven-slot extent ») | « eleven-slot » cité de la compaction | libellés cités | Aucun n'est prouvé par l'ASM. Le C réconcilié emploie uniquement des adresses numériques. L'étendue de la boucle est de **3** itérations sous préservation ABI (0x270/0xD0) ; « onze » n'est pas déduit de ces octets. | Écarté (UNCERTAIN pour toute lecture métier) |
| D6 | `ebx` de la garde | `alu(t, ebx)` | `sub_flags(…, ebx&0xFF, …, 8)` | `38 5E 3B` = `CMP r/m8,r8`. Les deux masquent à 8 bits ; équivalent. | Résolu |
| D7 | Modèle d'aide des drapeaux | `alu`, `logic`, `incdec`, `flags_known` | `add/sub/logic/inc/dec_flags`, `set_arith` | Relecture ligne à ligne : CF/OF/AF/ZF/SF/PF identiques pour ADD/SUB/SBB/NEG/CMP/INC/DEC/AND/XOR/TEST ; INC/DEC préservent CF ; AF indéfini après logique dans les deux. | Résolu |

Aucun désaccord de fond sur un effet mémoire, une largeur, un stride, une borne ou une destination de branche.

## 5. Erreurs communes recherchées (A=B ne suffit pas)

- Opérande/ordre de CMP et signedness : revérifiés (`jl` signé après `cmp esi, imm`, `ja` non signé après `dec`). Tous les opérandes sont < 0x80000000 mais la signedness brute est conservée.
- Écriture de quantité : octet bas (`88 58 01`), pas MOVSX 32 bits ; les patterns 0x80..0xFF sont conservés tels quels.
- Largeur du compteur à 486991/4869CC : WORD (`66 FF 05`). Compteur à 4869A3 : DWORD (`43` + `89 1D`).
- Mode à 4869A3 : `SBB EDX,EDX` écrase EDX entier, `CF` vient de `NEG DL`, et `INC EBX` entre `AND DL` et `NEG DL` ne modifie pas CF mais modifie ZF/SF/OF/PF/AF avant `NEG` (sans effet sur le résultat).
- Dépendances ABI implicites (non fabriquées par le C) : seul 485EC0 compte pour la boucle : la cible ne sauve pas EBX(BL=FF)/ESI/EDI/EBP autour de l'appel, donc 485EC0 doit les préserver et ne consommer que le DWORD de pile (nettoyé par l'appelant), sinon la lecture « 3 passes » ne tient plus. 46B440 et 4A92F0 sont suivis de pops depuis la pile (EDI/ESI/EBP/EBX restaurés), donc leur préservation de ces registres n'est pas requise ; EAX/ECX/EDX/flags finaux restent ceux de 4A92F0. L'adaptateur exécute le vrai code : ces propriétés ne sont **pas supposées par le C** mais déterminent la lecture « 3 slots ».
- Sous-effets non modélisés dans A/B : ZF/flags d'entrée de callees, exceptions mémoire synchrones, accès non alignés (WORD à des adresses impaires possibles car EBP = 0x1CFF1B2 + 0x1D0·k) ; documentés comme limites.
- Aucune lecture hors paquet : A et B n'invoquent aucune hypothèse sur le contenu de la table à l'exécution (supposée immuable).

## 6. C réconcilié final

Contrat : modèle C **explicite sur les registres, pile et largeurs** ; ce n'est pas un prototype source. Les trois appels natifs passent par `execute_callee` (le code réel s'exécute depuis `s->eip` jusqu'au retour à la continuation, en partageant registres, flags, mémoire et état externe). La table de dispatch est lue en mémoire ; sa conformité au contenu gelé est une précondition. Faute de quoi `unmodeled_indirect_jump` est appelé et le modèle ne poursuit pas.

```c
#include <stdint.h>

typedef struct X86 {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi;
    uint32_t eip, flags, flags_known;
    void *opaque_machine;  /* x87/SSE/segments/etc. : jamais touché par la cible */
} X86;

typedef struct Mem {
    void *ctx;
    uint8_t  (*r8)(void *, uint32_t);
    uint16_t (*r16)(void *, uint32_t);
    uint32_t (*r32)(void *, uint32_t);
    void (*w8)(void *, uint32_t, uint8_t);
    void (*w16)(void *, uint32_t, uint16_t);
    void (*w32)(void *, uint32_t, uint32_t);
    /* Exécute le code natif à s->eip jusqu'au retour à 'continuation'
       (adresse de retour déjà empilée). Aucun prototype supposé. */
    void (*execute_callee)(void *, X86 *, uint32_t continuation);
    /* Destination d'un JMP [table] hors des 4 cibles gelées : violation
       de précondition ; l'appelant du modèle doit traiter comme échec. */
    void (*unmodeled_indirect_jump)(void *, X86 *, uint32_t target);
} Mem;

enum { CF = 1u, PF = 4u, AF = 16u, ZF = 64u,
       SF = 128u, OF = 2048u, ARITH = CF | PF | AF | ZF | SF | OF };

static uint32_t width_mask(unsigned w)
{ return w == 32u ? UINT32_MAX : ((UINT32_C(1) << w) - 1u); }

static uint32_t zsp(uint32_t r, unsigned w)
{
    uint32_t b = r & 255u, odd = 0u;
    unsigned i;
    for (i = 0; i != 8u; ++i) odd ^= (b >> i) & 1u;
    return (r == 0u ? ZF : 0u) |
           ((r & (UINT32_C(1) << (w - 1u))) ? SF : 0u) |
           (odd == 0u ? PF : 0u);
}

/* AND/XOR/TEST : CF=OF=0, ZF/SF/PF définis, AF indéfini. */
static uint32_t logic(X86 *s, uint32_t r, unsigned w)
{
    r &= width_mask(w);
    s->flags = (s->flags & ~(uint32_t)ARITH) | zsp(r, w);
    s->flags_known = (s->flags_known & ~(uint32_t)AF) |
                     CF | PF | ZF | SF | OF;
    return r;
}

/* ADD (subtract==0) ou SUB/CMP/SBB/NEG (subtract==1, borrow = CF entrant). */
static uint32_t alu(X86 *s, uint32_t a, uint32_t b,
                    unsigned borrow, unsigned w, unsigned subtract)
{
    uint32_t mask = width_mask(w), sign = UINT32_C(1) << (w - 1u);
    uint32_t r, f;
    uint64_t wide;
    a &= mask;
    b &= mask;
    if (subtract) {
        wide = (uint64_t)a - (uint64_t)b - borrow;
        r = (uint32_t)wide & mask;
        f = ((uint64_t)a < (uint64_t)b + borrow ? CF : 0u) |
            (((a ^ b) & (a ^ r) & sign) ? OF : 0u);
    } else {
        wide = (uint64_t)a + b;
        r = (uint32_t)wide & mask;
        f = (wide > mask ? CF : 0u) |
            (((~(a ^ b)) & (a ^ r) & sign) ? OF : 0u);
    }
    f |= ((a ^ b ^ r) & 16u) | zsp(r, w);
    s->flags = (s->flags & ~(uint32_t)ARITH) | f;
    s->flags_known |= ARITH;
    return r;
}

static uint32_t add32(X86 *s, uint32_t a, uint32_t b)
{ return alu(s, a, b, 0u, 32u, 0u); }

static void cmp32(X86 *s, uint32_t a, uint32_t b)
{ (void)alu(s, a, b, 0u, 32u, 1u); }

/* INC/DEC : tous les flags arithmétiques sauf CF, qui est préservé. */
static uint32_t incdec(X86 *s, uint32_t a, unsigned w, unsigned dec)
{
    uint32_t cf = s->flags & CF, known = s->flags_known & CF;
    uint32_t r = alu(s, a, 1u, 0u, w, dec);
    s->flags = (s->flags & ~(uint32_t)CF) | cf;
    s->flags_known = (s->flags_known & ~(uint32_t)CF) | known;
    return r;
}

static unsigned jl(const X86 *s)   /* JL : SF != OF */
{ return ((s->flags & SF) != 0u) != ((s->flags & OF) != 0u); }

static uint32_t lo8(uint32_t a, uint32_t b)
{ return (a & UINT32_C(0xFFFFFF00)) | (b & 255u); }

static uint32_t lo16(uint32_t a, uint32_t b)
{ return (a & UINT32_C(0xFFFF0000)) | (b & 65535u); }

static void push32(X86 *s, Mem *m, uint32_t v)
{
    s->esp -= 4u;                       /* PUSH ne modifie aucun flag */
    m->w32(m->ctx, s->esp, v);
}

static uint32_t pop32(X86 *s, Mem *m)
{
    uint32_t v = m->r32(m->ctx, s->esp);
    s->esp += 4u;                       /* POP ne modifie aucun flag */
    return v;
}

static void native_call(X86 *s, Mem *m, uint32_t target, uint32_t next)
{
    push32(s, m, next);                 /* CALL : adresse de retour seule */
    s->eip = target;
    m->execute_callee(m->ctx, s, next); /* le callee exécute son propre RET */
}

/* Entrée : [ESP] = adresse de retour de l'appelant ; aucun argument. */
void reconstruct_004868C0(X86 *s, Mem *m)
{
    uint32_t t, cf;

    /* 4868C0..4868D0 */
    push32(s, m, s->ebx);
    push32(s, m, s->ebp);
    push32(s, m, s->esi);
    push32(s, m, s->edi);
    s->edi = logic(s, 0u, 32u);                 /* XOR EDI,EDI */
    s->ebp = UINT32_C(0x01CFF1B2);
    s->esi = UINT32_C(0x01D27B90);
    s->ebx = lo8(s->ebx, 255u);                 /* MOV BL,FFh */

L4868D2:
    t = m->r8(m->ctx, s->esi + 0x3Bu);          /* CMP BYTE [ESI+3Bh],BL */
    (void)alu(s, t, s->ebx, 0u, 8u, 1u);
    if (s->flags & ZF) goto L486912;

    /* 4868D7..48690E */
    s->eax = logic(s, 0u, 32u);                 /* XOR EAX,EAX */
    push32(s, m, s->edi);                       /* seul argument de pile (1 DWORD) */
    s->eax = lo8(s->eax, m->r8(m->ctx, UINT32_C(0x01CFE74C) + s->edi));
    s->ecx = s->eax + s->eax * 8u;              /* LEA : sans flags */
    s->edx = s->eax + s->ecx * 2u;              /* 19 * id */
    s->ecx = lo16(s->ecx, m->r16(m->ctx, s->esi - 0x68u));
    t = m->r16(m->ctx, s->esi);
    t = logic(s, t & 0xFFDFu, 16u);             /* AND WORD [ESI],FFDFh (masque 0x20) */
    m->w16(m->ctx, s->esi, (uint16_t)t);
    s->eax = UINT32_C(0x01CFE0E8) + s->edx * 8u; /* 152 * id, sans contrôle de plage */
    m->w16(m->ctx, s->eax, (uint16_t)s->ecx);
    s->ecx = lo16(s->ecx, m->r16(m->ctx, s->esi));      /* valeur post-AND */
    m->w16(m->ctx, s->eax + 0x96u, (uint16_t)s->ecx);
    native_call(s, m, UINT32_C(0x00485EC0), UINT32_C(0x00486908));
    s->edx = lo16(s->edx, m->r16(m->ctx, s->esi));      /* relecture APRES l'appel */
    s->esp = add32(s, s->esp, 4u);                      /* nettoyage par l'appelant */
    m->w16(m->ctx, s->ebp, (uint16_t)s->edx);

L486912:
    s->esi = add32(s, s->esi, 0xD0u);
    s->edi = incdec(s, s->edi, 32u, 0u);
    s->ebp = add32(s, s->ebp, 0x1D0u);
    cmp32(s, s->esi, UINT32_C(0x01D27E00));
    if (jl(s)) goto L4868D2;                    /* 0x270/0xD0 = 3 passes si ESI/EDI/EBP/EBX préservés */

    /* 486927 */
    s->edi = UINT32_C(0x01D28E78);
L48692C:
    t = m->r8(m->ctx, s->edi + 1u);
    s->ebx = (t & 128u) ? (0xFFFFFF00u | t) : t;        /* MOVSX EBX,BYTE */
    s->edx = logic(s, 0u, 32u);                         /* XOR EDX,EDX */
    s->edx = lo8(s->edx, m->r8(m->ctx, s->edi));
    (void)logic(s, s->edx, 32u);                        /* TEST EDX,EDX */
    if (s->flags & ZF) goto L486972;

    /* 486938 : recherche de l'ID existant (198 paires de 2 octets) */
    s->eax = UINT32_C(0x01CFE79C);
    s->esi = logic(s, 0u, 32u);
L48693F:
    s->ecx = logic(s, 0u, 32u);
    s->ecx = lo8(s->ecx, m->r8(m->ctx, s->eax));
    cmp32(s, s->ecx, s->edx);
    if (s->flags & ZF) goto L48696F;
    /* 486947 */
    s->eax = add32(s, s->eax, 2u);
    s->esi = incdec(s, s->esi, 32u, 0u);
    cmp32(s, s->esi, 0xC6u);
    if (jl(s)) goto L48693F;

    /* 486953 : recherche du premier ID nul */
    s->eax = UINT32_C(0x01CFE79C);
    s->ecx = logic(s, 0u, 32u);
L48695A:
    t = m->r8(m->ctx, s->eax);
    (void)alu(s, t, 0u, 0u, 8u, 1u);                    /* CMP BYTE [EAX],0 */
    if (s->flags & ZF) goto L48696D;
    /* 48695F */
    s->eax = add32(s, s->eax, 2u);
    s->ecx = incdec(s, s->ecx, 32u, 0u);
    cmp32(s, s->ecx, 0xC6u);
    if (jl(s)) goto L48695A;
    goto L486972;                                       /* 48696B : plein, aucune écriture */

L48696D:
    m->w8(m->ctx, s->eax, (uint8_t)s->edx);             /* nouvel ID (DL) */
L48696F:
    m->w8(m->ctx, s->eax + 1u, (uint8_t)s->ebx);        /* quantité : écrasement, octet bas */
L486972:
    s->edi = add32(s, s->edi, 5u);
    cmp32(s, s->edi, UINT32_C(0x01D28F18));
    if (jl(s)) goto L48692C;                            /* 32 lignes de stride 5 */

    /* 48697D..48698A */
    s->eax = logic(s, 0u, 32u);
    s->eax = lo8(s->eax, m->r8(m->ctx, UINT32_C(0x01CFF6E7)));
    s->eax = incdec(s, s->eax, 32u, 1u);                /* DEC modulo 2^32 */
    cmp32(s, s->eax, 4u);
    if ((s->flags & (CF | ZF)) == 0u) goto L4869DC;     /* JA non signé : 0 et 6..255 */

    /* JMP [EAX*4+4869F4h] : table gelée, DWORDs
       idx0 4869CC, idx1 486991, idx2 4869CC, idx3 4869A3, idx4 4869D3. */
    t = m->r32(m->ctx, UINT32_C(0x004869F4) + s->eax * 4u);
    s->eip = t;
    switch (t) {
    case UINT32_C(0x004869CC): goto L4869CC;            /* résultats 1 et 3 */
    case UINT32_C(0x00486991): goto L486991;            /* résultat 2 */
    case UINT32_C(0x004869A3): goto L4869A3;            /* résultat 4 */
    case UINT32_C(0x004869D3): goto L4869D3;            /* résultat 5 */
    default:
        m->unmodeled_indirect_jump(m->ctx, s, t);       /* précondition violée */
        return;
    }

L486991:
    t = m->r16(m->ctx, UINT32_C(0x01CFE93A));
    t = incdec(s, t, 16u, 0u);                          /* WORD, wrap 16 bits */
    m->w16(m->ctx, UINT32_C(0x01CFE93A), (uint16_t)t);
    m->w16(m->ctx, UINT32_C(0x01CD8FC6), 5u);
    goto L4869DC;

L4869A3:
    s->edx = lo8(s->edx, m->r8(m->ctx, UINT32_C(0x01D287DD)));
    s->ebx = m->r32(m->ctx, UINT32_C(0x01CFE934));
    t = logic(s, (s->edx & 255u) & 0x10u, 8u);          /* AND DL,10h */
    s->edx = lo8(s->edx, t);
    s->ebx = incdec(s, s->ebx, 32u, 0u);                /* INC EBX : CF préservé */
    t = alu(s, 0u, s->edx, 0u, 8u, 1u);                 /* NEG DL : CF = (DL != 0) */
    s->edx = lo8(s->edx, t);
    cf = (s->flags & CF) != 0u;
    s->edx = alu(s, s->edx, s->edx, cf, 32u, 1u);       /* SBB EDX,EDX : 0 ou FFFFFFFF */
    m->w32(m->ctx, UINT32_C(0x01CFE934), s->ebx);       /* DWORD, wrap 32 bits */
    s->edx = logic(s, s->edx & 0x5Fu, 32u);
    s->edx = add32(s, s->edx, 5u);                      /* 5 si bit 0x10 nul, sinon 100 */
    m->w16(m->ctx, UINT32_C(0x01CD8FC6), (uint16_t)s->edx);
    goto L4869DC;

L4869CC:
    t = m->r16(m->ctx, UINT32_C(0x01CFE938));
    t = incdec(s, t, 16u, 0u);                          /* WORD, wrap 16 bits */
    m->w16(m->ctx, UINT32_C(0x01CFE938), (uint16_t)t);
    /* chute native dans 4869D3 */
L4869D3:
    m->w16(m->ctx, UINT32_C(0x01CD8FC6), 0x64u);

L4869DC:
    native_call(s, m, UINT32_C(0x0046B440), UINT32_C(0x004869E1));
    m->w16(m->ctx, UINT32_C(0x01CDBFE0), 0u);
    native_call(s, m, UINT32_C(0x004A92F0), UINT32_C(0x004869EF));
    s->edi = pop32(s, m);
    s->esi = pop32(s, m);
    s->ebp = pop32(s, m);
    s->ebx = pop32(s, m);
    s->eip = pop32(s, m);                               /* RET simple, sans RET n */
}
```

Couverture : les 23 blocs CFG et les 90 instructions sont représentés ; tous les chemins sont couverts (sentinelle, 3 passes, saut ID nul, ID trouvé, premier zéro, plein, résultats 1..5, défaut 0/6..255, queue commune).

## 7. Contrat final et preuves

| Point | Contrat réconcilié | Preuves (VA) | Confiance |
|---|---|---|---|
| Entrée / pile | pas d'argument ; 16 octets sauvés ; slot empilé en 4868D9, retiré en 48690B ; RET simple | 4868C0..C3, 4868D9, 48690B, 4869F3 | CERTAIN |
| Garde de slot | octet `[ESI+0x3B]` comparé à BL=0xFF ; égalité ⇒ corps sauté | 4868D2/D5 | CERTAIN |
| Sauvegarde party | id octet zéro-étendu → `0x1CFE0E8 + 152·id` ; `[rec]` ← WORD `[ESI-0x68]` ; AND 0xFFDF ; `[rec+0x96]` ← WORD `[ESI]` post-AND ; appel 485EC0 ; `[EBP]` ← WORD `[ESI]` relu | 4868DA..90E | CERTAIN |
| Boucle party | pas ESI 0xD0, EBP 0x1D0, borne ESI 0x1D27E00 signée ⇒ 3 passes si registres préservés | 486912..925 | CERTAIN (bornes), CONDITIONNEL (préservation callee) |
| Fusion inventaire | 32 lignes × 5 octets depuis 0x1D28E78 ; ID=ligne[0], qty=signe-étendu(ligne[1]) ; ID 0 ⇒ ligne sautée ; recherche ID puis ID nul sur 198 paires depuis 0x1CFE79C ; écrase la quantité (octet bas) ; plein ⇒ rien | 48692C..97B | CERTAIN |
| Dispatch | résultat `[0x1CFF6E7]` : 1,3→4869CC ; 2→486991 ; 4→4869A3 ; 5→4869D3 ; 0 et 6..255→4869DC | 48697D..98A + table | CERTAIN |
| Effets de résultat | r2 : ++WORD `0x1CFE93A`, mode 5 ; r1/r3 : ++WORD `0x1CFE938`, mode 100 ; r5 : mode 100 seul ; r4 : ++DWORD `0x1CFE934`, mode 5 si `[0x1D287DD]&0x10==0` sinon 100 ; défaut : aucun | 486991..4869D3 | CERTAIN |
| Queue | 46B440 ; WORD 0 en `0x1CDBFE0` ; 4A92F0 ; pops ; EAX/ECX/EDX = sorties du dernier callee | 4869DC..4869F3 | CERTAIN |

## 8. Points UNCERTAIN / CONFLICT (aucun CERTAIN inventé)

- UNCERTAIN : prototypes, effets internes et préservation de registres de 485EC0, 46B440, 4A92F0 (aucun corps gelé dans ce paquet). Sert aussi de condition de la lecture « 3 passes ».
- UNCERTAIN : signification métier des champs (`[ESI±…]`, enregistrements `0x1CFE0E8`, buffer `0x1CFE79C`, source `0x1D28E78`, compteurs `0x1CFE934/38/3A`, mode `0x1CD8FC6`, bit `0x10` de `0x1D287DD`, résultat `0x1CFF6E7`) : les noms IDA/LIVE ne sont pas des preuves ; à traiter par la réconciliation sémantique séparée.
- UNCERTAIN : valeur de retour source (type/utilisation) ; seule la valeur résiduelle des registres est prouvée.
- Précondition non testée ici : table de dispatch immuable et égale aux 5 DWORD fournis (parent a validé IDB=PE et cible=gel).
- Aucun CONFLICT ouvert entre A et B ; D3 est une correction de libellé commune.

## 9. Validations demandées au superviseur (non réalisées par R)

1. Recalculer SHA256 de A, B, paquet, table, et confirmer que les livrables gelés correspondent à ceux lus ici.
2. Compiler `reconstruct_004868C0` avec des callbacks `execute_callee` natifs ; comparer traces registres/mémoire/flags contre l'exécutable pour : slot avec/sans sentinelle, statut avec le masque 0x20, inventaire avec ID existant / nouveau / plein / ID 0 / quantités 0x80..0xFF, tous les résultats 0..255 (en particulier 0, 1..5, 6, 255), bit 0x10 de `0x1D287DD`, enroulement des compteurs WORD/DWORD.
3. Contrôle natif final §5.6 : relecture ASM/xrefs de l'IDB pour les 90 instructions (le gel des octets a été utilisé ici ; l'ASM texte n'était disponible que tronqué).
