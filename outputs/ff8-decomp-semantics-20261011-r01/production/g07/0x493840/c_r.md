# 0x493840 — C réconcilié (R) — g07

## 1. Provenance, entrées, limites de la remise

- Rôle : R (réconciliation), session fresh `pool-73`, tâche `task_mv44rmug_0081_2cvau4`. Aucun accès IDA, shell, git, live, index ni autre session. Aucune sortie sémantique (`semantic_a/b/r`) lue.
- Gel natif lu en entier (`inputs/ff8-decomp-semantics-20261011-r01/g07/0x493840.json` + `0x493840.readable/asm-001..008.txt`) : 190 instructions, 26 blocs CFG, chunk unique `[0x493840,0x493AE3)` = 675 octets, EXE SHA-256 cité `064d466b…9570`, export `2026-10-11T16:38:25Z`.
- A = `outputs/…/g07/0x493840/c_a.md` (auteur c-a-493840, GPT-6 Astra). B = `outputs/…/g07/0x493840/c_b.md` (auteur c-b-493840, GPT-6.1 Sol). Les deux annoncent le même hash manifeste `6df9af35…9704` et la même compaction commune `6925ce25…1fff`.
- **Limite de remise (à signaler au lead)** : je n'ai trouvé dans `inputs/` ni copie de A/B ni liste de hashes de A/B (seul le gel est présent). A et B ont été lus à leur emplacement `outputs/` et **leurs hashes de fichier n'ont pas été vérifiés** (pas de shell, pas de valeur de référence). Les hashes ci-dessus sont des valeurs citées, non recalculées. Le lead doit confirmer que ces deux fichiers sont bien les livrables gelés.
- Non exécuté : compilation, analyse statique, différentiel, runtime, recalcul de hash. Aucun PASS n'est revendiqué ; ces contrôles restent au lead (§5.6 natif).

## 2. Verdict de réconciliation

**A et B sont sémantiquement équivalentes sur tous les blocs.** Je n'ai trouvé aucune divergence de comportement (adresse, largeur, ordre mémoire/appel, nettoyage de pile, valeur de retour). Les différences sont de représentation (API du pont natif, modélisation des flags indéfinis, noms). Comme « A=B » ne suffit pas, j'ai revérifié tout le chunk instruction par instruction contre les octets et l'ASM (§4) et cherché des erreurs communes (§5) : aucune erreur commune matérielle trouvée.

Le C final (§3) reprend le corps de A (structure plus compacte, `CALL(target,return)` explicite) et adopte de B le suivi `undefined_flags`, utile pour un différentiel. Aucun comportement n'a été ajouté ni retiré.

## 3. C complet réconcilié

Contrat de représentation : lift **machine-state / espace d'adressage**, pas un prototype C natif deviné. Tous les accès passent par un bus LE 32 bits ; tout calcul d'adresse enveloppe modulo 2^32 ; aucune vérification de borne (le natif n'en fait aucune). Le pont `native` doit exécuter le **vrai** callee jusqu'à son `RET` (qui ne dépile que l'adresse de retour déjà poussée par `CALL`), avec ses effets registres/flags/mémoire/x87. Aucun appel n'est inventé : les seules cibles sont les 10 destinations E8 réelles.

Entrée : `[S]` retour, `[S+4]` = slot/index (DWORD, `ESI`), `[S+8]` = second argument (accédé seulement en BYTE/WORD ; `status_1`), `[S+12]` = troisième argument (DWORD, `EBX` ; `status_2`). Quatre pushes (EBX, EBP, ESI, EDI) puis restauration ; `RET` simple, l'appelant possède les trois arguments. `EBP` vaut 0 sur toute la fonction. Le retour source n'est pas établi : EAX après le dernier call survit à l'appelant.

```c
#include <stdint.h>

typedef struct X493840 {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi;
    uint32_t eip, eflags;
    uint32_t undefined_flags;   /* arithmetic flags not architecturally defined; mask in diffs */
    void *environment;          /* real external x87/SIMD/segment state; untouched locally */
} X493840;

typedef struct {
    void *context;
    /* width in bytes: 1, 2 or 4; little-endian; no bounds/fault policy added here */
    uint32_t (*load)(void *, uint32_t address, unsigned width);
    void (*store)(void *, uint32_t address, unsigned width, uint32_t value);
    /* CALL already pushed its return address and set x->eip = target.
       Run the REAL callee to its RET (pops only the return address). */
    void (*native)(void *, X493840 *, uint32_t target);
} Bus493840;

enum { F_CF = 1u, F_PF = 4u, F_AF = 16u, F_ZF = 64u, F_SF = 128u, F_OF = 2048u,
       F_ARITH = 1u | 4u | 16u | 64u | 128u | 2048u };

static uint32_t lo8(uint32_t old, uint32_t x)
{ return (old & UINT32_C(0xffffff00)) | (x & UINT32_C(0xff)); }
static uint32_t lo16(uint32_t old, uint32_t x)
{ return (old & UINT32_C(0xffff0000)) | (x & UINT32_C(0xffff)); }
static uint32_t hi8(uint32_t old, uint32_t x)
{ return (old & UINT32_C(0xffff00ff)) | ((x & UINT32_C(0xff)) << 8); }

static void szp(X493840 *x, uint32_t v, unsigned bits)
{
    uint32_t p = v & 255u;
    uint32_t sign = UINT32_C(1) << (bits - 1u);
    if (bits != 32u) v &= (UINT32_C(1) << bits) - 1u;
    p ^= p >> 4; p ^= p >> 2; p ^= p >> 1;
    x->eflags = (x->eflags & ~(F_SF | F_ZF | F_PF))
              | ((v & sign) ? F_SF : 0u)
              | ((v == 0u) ? F_ZF : 0u)
              | (((p & 1u) == 0u) ? F_PF : 0u);
}
/* AND/OR/XOR/TEST: CF=OF=0; SF/ZF/PF defined; AF undefined (representative 0). */
static uint32_t logic(X493840 *x, uint32_t v, unsigned bits)
{
    if (bits != 32u) v &= (UINT32_C(1) << bits) - 1u;
    x->eflags &= ~(F_CF | F_OF | F_AF);
    szp(x, v, bits);
    x->undefined_flags = (x->undefined_flags & ~(uint32_t)F_ARITH) | F_AF;
    return v;
}
static uint32_t plus32(X493840 *x, uint32_t a, uint32_t b)
{
    uint32_t r = a + b;
    x->eflags = (x->eflags & ~(F_CF | F_OF | F_AF))
        | ((r < a) ? F_CF : 0u)
        | (((~(a ^ b) & (a ^ r)) >> 31) ? F_OF : 0u)
        | (((a ^ b ^ r) & 16u) ? F_AF : 0u);
    szp(x, r, 32u);
    x->undefined_flags &= ~(uint32_t)F_ARITH;
    return r;
}
static uint32_t minus32(X493840 *x, uint32_t a, uint32_t b)
{
    uint32_t r = a - b;
    x->eflags = (x->eflags & ~(F_CF | F_OF | F_AF))
        | ((a < b) ? F_CF : 0u)
        | ((((a ^ b) & (a ^ r)) >> 31) ? F_OF : 0u)
        | (((a ^ b ^ r) & 16u) ? F_AF : 0u);
    szp(x, r, 32u);
    x->undefined_flags &= ~(uint32_t)F_ARITH;
    return r;
}
static void cmp16(X493840 *x, uint32_t a, uint32_t b)
{
    uint32_t r;
    a &= 65535u; b &= 65535u; r = (a - b) & 65535u;
    x->eflags = (x->eflags & ~(F_CF | F_OF | F_AF))
        | ((a < b) ? F_CF : 0u)
        | ((((a ^ b) & (a ^ r)) & 32768u) ? F_OF : 0u)
        | (((a ^ b ^ r) & 16u) ? F_AF : 0u);
    szp(x, r, 16u);
    x->undefined_flags &= ~(uint32_t)F_ARITH;
}
/* Every SHL here has count 4: CF = bit 28 of source; OF/AF undefined. */
static uint32_t shl4(X493840 *x, uint32_t a)
{
    uint32_t r = a << 4;
    x->eflags = (x->eflags & ~(F_CF | F_OF | F_AF)) | (((a >> 28) & 1u) ? F_CF : 0u);
    szp(x, r, 32u);
    x->undefined_flags = (x->undefined_flags & ~(uint32_t)F_ARITH) | F_AF | F_OF;
    return r;
}

static uint32_t rd(const Bus493840 *b, uint32_t a, unsigned w)
{
    uint32_t v = b->load(b->context, a, w);
    return w == 1u ? v & 255u : w == 2u ? v & 65535u : v;
}
static void wr(const Bus493840 *b, uint32_t a, unsigned w, uint32_t v)
{
    if (w == 1u) v &= 255u;
    else if (w == 2u) v &= 65535u;
    b->store(b->context, a, w, v);
}
static void push32(X493840 *x, const Bus493840 *b, uint32_t v)
{ x->esp -= 4u; wr(b, x->esp, 4u, v); }
static uint32_t pop32(X493840 *x, const Bus493840 *b)
{ uint32_t v = rd(b, x->esp, 4u); x->esp += 4u; return v; }
static void call_native(X493840 *x, const Bus493840 *b, uint32_t target, uint32_t next)
{
    push32(x, b, next);
    x->eip = target;
    b->native(b->context, x, target);   /* includes the callee's own RET */
}

void lift_00493840(X493840 *x, const Bus493840 *b)
{
#define R8(a)    rd(b, (uint32_t)(a), 1u)
#define R16(a)   rd(b, (uint32_t)(a), 2u)
#define R32(a)   rd(b, (uint32_t)(a), 4u)
#define W8(a,v)  wr(b, (uint32_t)(a), 1u, (v))
#define W16(a,v) wr(b, (uint32_t)(a), 2u, (v))
#define W32(a,v) wr(b, (uint32_t)(a), 4u, (v))
#define TEST(v,m,n) ((void)logic(x, (v) & (m), (n)))
#define Z() ((x->eflags & F_ZF) != 0u)
#define PUSH(v) push32(x, b, (v))
#define CALL(t,r) call_native(x, b, (t), (r))
#define DROP(n) (x->esp = plus32(x, x->esp, (n)))

    /* 493840..493854 */
    PUSH(x->ebx);
    x->ebx = R32(x->esp + 0x10u);              /* [S+12] */
    PUSH(x->ebp);
    x->ebp = logic(x, x->ebp ^ x->ebp, 32u);
    PUSH(x->esi);
    x->esi = R32(x->esp + 0x10u);              /* [S+4]  */
    TEST(x->ebx, 0x80000000u, 32u);
    PUSH(x->edi);
    if (Z()) goto L4938DA;

    /* 49385A..49387F: 0x1D0*slot (mod 2^32); WORD @1CFF018+off vs EBP(=0) */
    x->eax = x->esi * 8u;
    x->eax = minus32(x, x->eax, x->esi);
    x->ecx = x->esi + x->eax * 4u;
    x->ecx = shl4(x, x->ecx);
    cmp16(x, R16(0x01CFF018u + x->ecx), x->ebp);
    if (Z()) goto L4938B0;
    TEST(R8(x->esp + 0x18u), 0x35u, 8u);       /* [S+8] byte */
    if (!Z()) goto L4938B0;
    TEST(x->ebx, 0x00014000u, 32u);
    if (!Z()) goto L4938B0;
    /* 493881..49389C: 0xD0*slot, DWORD @1D27B8C, CH bit 2 (mask 0x400) */
    x->edx = x->esi + x->esi * 2u;
    TEST(x->ebx, 9u, 8u);
    x->eax = x->esi + x->edx * 4u;
    if (Z()) goto L49389E;
    x->eax = shl4(x, x->eax);
    x->eax += 0x01D27B8Cu;
    x->ecx = R32(x->eax);
    x->ecx = hi8(x->ecx, logic(x, (x->ecx >> 8) | 4u, 8u));
    W32(x->eax, x->ecx);
    goto L4938DA;
L49389E:
    x->eax = shl4(x, x->eax);
    x->eax += 0x01D27B8Cu;
    x->ecx = R32(x->eax);
    x->ecx = hi8(x->ecx, logic(x, (x->ecx >> 8) & 0xFBu, 8u));
    W32(x->eax, x->ecx);
    goto L4938DA;
L4938B0:
    x->edx = x->esi + x->esi * 2u;
    x->eax = x->esi + x->edx * 4u;
    x->eax = shl4(x, x->eax);
    x->edi = R32(0x01D27B18u + x->eax);
    x->edi = logic(x, x->edi & 0x7FFFFFFFu, 32u);   /* memory only; EBX unchanged */
    W32(0x01D27B18u + x->eax, x->edi);
    x->ecx = R32(0x01D27B8Cu + x->eax);
    x->ecx = hi8(x->ecx, logic(x, (x->ecx >> 8) & 0xFBu, 8u));
    W32(0x01D27B8Cu + x->eax, x->ecx);

L4938DA:
    TEST(R8(x->esp + 0x18u), 4u, 8u);
    if (!Z()) goto L4938E6;
    TEST(x->ebx, 9u, 8u);
    if (Z()) goto L493925;
L4938E6:
    PUSH(x->esi);
    CALL(0x00484600u, 0x004938ECu);
    DROP(4u);
    TEST(x->eax, x->eax, 32u);                 /* full EAX */
    if (!Z()) goto L493925;
    TEST(x->ebx, 0x80000000u, 32u);
    if (!Z()) goto L49398E;
    /* 4938FF..493922: two separate DWORD RMW on the same address */
    x->edx = x->esi + x->esi * 2u;
    x->eax = x->esi + x->edx * 4u;
    x->eax = shl4(x, x->eax);
    x->eax += 0x01D27B8Cu;
    x->ecx = R32(x->eax);
    x->ecx = logic(x, x->ecx & 0xFFFFFFF7u, 32u);
    W32(x->eax, x->ecx);
    x->edx = R32(x->eax);
    x->edx = logic(x, x->edx & 0xFFFFFFFBu, 32u);
    W32(x->eax, x->edx);
    PUSH(x->esi);
    CALL(0x00485030u, 0x00493922u);
    DROP(4u);

L493925:
    TEST(x->ebx, 0x80000000u, 32u);
    if (!Z()) goto L49398E;
    x->eax = lo8(x->eax, R8(0x01D28E30u + x->esi * 2u));
    x->edx = lo8(x->edx, R8(x->esp + 0x18u));
    x->eax = lo8(x->eax, logic(x, x->eax ^ x->edx, 8u));
    TEST(x->eax, 0x20u, 8u);
    if (!Z()) goto L49394F;
    x->ecx = R32(0x01D28E38u + x->esi * 4u);
    x->ecx = logic(x, x->ecx ^ x->ebx, 32u);
    TEST(x->ecx, 0x02004000u, 32u);            /* literal mask, not a dereference */
    if (Z()) goto L49398E;
L49394F:
    PUSH(x->esi);
    CALL(0x00484600u, 0x00493955u);
    DROP(4u);
    TEST(x->eax, x->eax, 32u);
    if (!Z()) goto L49398E;
    x->edx = logic(x, x->edx ^ x->edx, 32u);
    x->edx = lo8(x->edx, R8(0x01D27B0Fu));
    (void)minus32(x, x->esi, x->edx);
    if (Z()) goto L49398E;
    /* 493968..49398B */
    x->eax = x->esi + x->esi * 2u;
    x->ecx = x->esi + x->eax * 4u;
    x->ecx = shl4(x, x->ecx);
    x->eax = 0x01D27B8Cu + x->ecx;
    x->edx = R32(x->eax);
    x->edx = logic(x, x->edx & 0xFFFFFFF7u, 32u);
    W32(x->eax, x->edx);
    x->ecx = R32(x->eax);
    x->ecx = logic(x, x->ecx & 0xFFFFFFFBu, 32u);
    W32(x->eax, x->ecx);
    PUSH(x->esi);
    CALL(0x00485030u, 0x0049398Bu);
    DROP(4u);

L49398E:
    x->edx = x->esi + x->esi * 2u;
    x->edi = x->esi + x->edx * 4u;
    x->edi = shl4(x, x->edi);
    TEST(x->ebx, 0x00010000u, 32u);
    x->eax = lo16(x->eax, R16(0x01D27B92u + x->edi));
    W16(0x01D28E30u + x->esi * 2u, x->eax);
    x->ecx = R32(0x01D27B1Cu + x->edi);
    W32(0x01D28E38u + x->esi * 4u, x->ecx);
    if (Z()) goto L493A38;                     /* MOVs preserve TEST's ZF */

    /* 4939BB..493A36: five pushed slot DWORDs removed together at 493A33 */
    x->eax = R32(0x01D27B18u + x->edi);
    PUSH(x->esi);
    x->eax = logic(x, x->eax & 0xFFFEFFFFu, 32u);
    W32(0x01D27B18u + x->edi, x->eax);
    CALL(0x00486C70u, 0x004939D2u);
    x->edx = R32(0x01D27B8Cu + x->edi);
    x->edx = logic(x, x->edx & 0xFFFFFFF7u, 32u);
    W32(0x01D27B8Cu + x->edi, x->edx);
    x->eax = R32(0x01D27B8Cu + x->edi);
    x->eax = lo8(x->eax, logic(x, x->eax & 0xFBu, 8u));
    W32(0x01D27B8Cu + x->edi, x->eax);
    PUSH(x->esi);
    CALL(0x00485030u, 0x004939F5u);
    PUSH(x->esi);
    CALL(0x00484640u, 0x004939FBu);
    W32(0x01D27B24u + x->edi, x->ebp);
    x->ecx = x->esi * 8u;
    x->ecx = minus32(x, x->ecx, x->esi);
    PUSH(x->esi);
    x->edi = x->esi + x->ecx * 4u;
    x->edi = shl4(x, x->edi);
    W32(0x01CFF184u + x->edi, x->ebp);
    CALL(0x0048C5C0u, 0x00493A1Cu);
    W8(0x01CFF1C3u + x->edi, 0xFFu);
    CALL(0x00485FF0u, 0x00493A28u);            /* no fresh push */
    CALL(0x004A8460u, 0x00493A2Du);            /* no fresh push */
    PUSH(x->esi);
    CALL(0x00497110u, 0x00493A33u);
    DROP(0x14u);
    goto L493A8C;

L493A38:
    TEST(R8(x->esp + 0x18u), 1u, 8u);
    if (Z()) goto L493A8C;
    /* 493A3F..493A89: three pushed slot DWORDs removed at 493A89 */
    x->edx = R32(0x01D27B8Cu + x->edi);
    x->edx = logic(x, x->edx & 0xFFFFFFF7u, 32u);
    W32(0x01D27B8Cu + x->edi, x->edx);
    x->eax = R32(0x01D27B8Cu + x->edi);
    x->eax = lo8(x->eax, logic(x, x->eax & 0xFBu, 8u));
    W32(0x01D27B8Cu + x->edi, x->eax);
    PUSH(x->esi);
    CALL(0x00485030u, 0x00493A62u);
    PUSH(x->esi);
    CALL(0x00484640u, 0x00493A68u);
    W32(0x01D27B24u + x->edi, x->ebp);
    x->ecx = x->esi * 8u;
    x->ecx = minus32(x, x->ecx, x->esi);
    PUSH(x->esi);
    x->edx = x->esi + x->ecx * 4u;
    x->edx = shl4(x, x->edx);
    W32(0x01CFF184u + x->edx, x->ebp);
    CALL(0x00485EC0u, 0x00493A89u);
    DROP(0x0Cu);

L493A8C:
    x->eax = x->esi * 8u;
    x->ebx = logic(x, x->ebx & 0x030E7FFFu, 32u);
    x->eax = minus32(x, x->eax, x->esi);
    x->ecx = x->esi + x->eax * 4u;
    x->ecx = shl4(x, x->ecx);
    x->eax = 0x01CFF000u + x->ecx;
    x->ecx = lo16(x->ecx, R16(x->esp + 0x18u));
    x->ecx = logic(x, x->ecx & 0x7Fu, 32u);
    PUSH(x->eax);                              /* row pointer pushed BEFORE the stores */
    W16(x->eax + 0x1B2u, x->ecx);
    W32(x->eax + 0x188u, x->ebx);
    TEST(R8(x->eax + 0x1B2u), 0x10u, 8u);      /* BYTE re-read after the stores */
    if (Z()) goto L493AD5;
    PUSH(1u);                                  /* last pushed = first cdecl arg */
    CALL(0x00493AF0u, 0x00493ACDu);
    DROP(8u);
    x->edi = pop32(x, b);
    x->esi = pop32(x, b);
    x->ebp = pop32(x, b);
    x->ebx = pop32(x, b);
    x->eip = pop32(x, b);
    return;
L493AD5:
    PUSH(x->ebp);                              /* EBP == 0 */
    CALL(0x00493AF0u, 0x00493ADBu);
    DROP(8u);
    x->edi = pop32(x, b);
    x->esi = pop32(x, b);
    x->ebp = pop32(x, b);
    x->ebx = pop32(x, b);
    x->eip = pop32(x, b);
    return;

#undef R8
#undef R16
#undef R32
#undef W8
#undef W16
#undef W32
#undef TEST
#undef Z
#undef PUSH
#undef CALL
#undef DROP
}
```

## 4. Contrôle contre les octets/ASM (indépendant de A et B)

Opcodes décodés du hex du gel ; destinations E8 recalculées `next + rel32`.

### 4.1 Arguments et pile
| Fait | Preuve | A | B |
|---|---|---|---|
| EBX = `[S+12]` (3ᵉ arg) | `493841 8B5C2410` après 1 push | ok | ok |
| ESI = `[S+4]` (slot) | `493849 8B742410` après 3 pushes | ok | ok |
| 2ᵉ arg `[S+8]` lu en byte/word | `493872 F644241835` (ESP=S-16), `4938DA`, `49392D 8A542418`, `493A38`, `493AA7 668B4C2418` | ok | ok |
| Pendant 4939BB..493A33 : 5 pushes (`4939C1,4939EF,4939F5,493A0A,493A2D`) = `ADD ESP,14h` | comptage | ok | ok |
| Pendant 493A3F..493A89 : 3 pushes (`493A5C,493A62,493A77`) = `ADD ESP,0Ch` | comptage | ok | ok |
| `485FF0` et `4A8460` appelés sans push frais (le dernier push est ESI de `493A0A`) | `493A23`,`493A28` | ok | ok |
| Fin : `PUSH row` (`493AAF`) puis `PUSH 1` ou `PUSH EBP` ; premier arg cdecl = 1/0, second = pointeur de ligne ; `RET` simple | `493AC6/AD5` | ok | ok |

### 4.2 Appels (16 sites, 10 cibles)
`484600` (`4938E7`→ret `4938EC`; `493950`→`493955`), `485030` (`49391D`→`493922`; `493986`→`49398B`; `4939F0`→`4939F5`; `493A5D`→`493A62`), `486C70` (`4939CD`→`4939D2`), `484640` (`4939F6`→`4939FB`; `493A63`→`493A68`), `48C5C0` (`493A17`→`493A1C`), `485FF0` (`493A23`→`493A28`), `4A8460` (`493A28`→`493A2D`), `497110` (`493A2E`→`493A33`), `485EC0` (`493A84`→`493A89`), `493AF0` (`493AC8`→`493ACD`; `493AD6`→`493ADB`). Toutes les cibles E8 recalculées et tous les return addresses du C ci-dessus concordent.

### 4.3 Adresses, strides et largeurs
- `49385A..493866` : `((8s−s)*4+s)<<4 = 0x1D0·s` ; WORD `cmp [ecx+1CFF018],bp` (`66 39 A9`).
- `0xD0·s` (`s+3s*4=13s`, `<<4`) pour `1D27B8C` (flag DWORD, base ligne +0x7C), `1D27B18` (status_2), `1D27B92` (copie WORD), `1D27B1C` (copie DWORD), `1D27B24` (ATB).
- `1D28E30+2s` WORD ; `1D28E38+4s` DWORD ; `1D27B0F` BYTE ; `1CFF184+0x1D0·s` DWORD ; `1CFF1C3+0x1D0·s` BYTE ← FFh ; ligne F_CHAR = `1CFF000+0x1D0·s`, `+1B2` WORD, `+188` DWORD.
- `OR/AND CH` → masque DWORD `0x400` ; `AND AL,FBh` → masque `0x4` seulement (bits 8–31 d'EAX conservés, écriture DWORD).
- `MOV CX,[esp+18]` conserve ECX haut jusqu'à `AND ECX,7Fh`.

### 4.4 Flags traversant des blocs
Le seul cas : `TEST EBX,10000h` (`493997`) → deux MOV (ne touchent pas ZF) → `JZ` (`4939B9`). Reproduit par A, B et R. Aucun autre flag n'est consommé après une instruction qui le redéfinit.

## 5. Matrice des divergences A / B et recherche d'erreurs communes

| # | Point | A | B | Décision / preuve |
|---|---|---|---|---|
| D1 | API du pont natif | `native(ctx, x, target)` | `run_native_until_return(opaque, x)` lisant `eip` | Équivalent ; `CALL` pousse le retour et met `eip` avant. R garde la forme à `target` (+ `eip` renseigné). Aucun effet observable. |
| D2 | Flags indéfinis (AF après AND/OR/XOR/TEST ; AF/OF après `SHL 4`) | laissés tels quels | forcés à 0 + masque `undefined_flags` | Aucun flag n'est consommé après redéfinition (§4.4). R : valeur représentative 0 + `undefined_flags` pour masquer les différentiels. Matériel exact non prouvable depuis l'ASM : **UNCERTAIN, non matériel**. |
| D3 | Taille de modélisation du cleanup `ADD ESP` | `plus32` | `add32` | Identique. |
| D4 | Commentaires de plage (`49385A..493870` vs `..493880`) | | | Cosmétique. |
| D5 | Nom proposé | `BattleStatus_RefreshSlotEffectsAndCharacterStatus` | `BattleSlotStatus_SyncCachesAndCommitCharacterFlags` | Hors périmètre C ; à trancher par le sémantique R. Le C n'en dépend pas. Je note seulement que les écritures finales `+1B2` (WORD, `&0x7F`) et `+188` (DWORD, `&0x030E7FFF`) sont des masques de status_1/status_2 d'entrée : « status » et « flags » restent des étiquettes **non prouvées** par l'ASM seul. |
| D6 | Rôle du commentaire IDA (« Doom+Zombie clears Doom… ») | non implémenté | non implémenté | Confirmé : aucune instruction locale ne fait ce travail ; au mieux dans `493AF0` (invisible). |

Aucune divergence sur : adresses, largeurs, wrap, ordre des écritures/appels, nettoyage de pile, retour EAX, restauration des registres sauvegardés.

**Erreurs communes recherchées** (hypothèses susceptibles d'être partagées par A et B) :
1. Bits d'entrée vs mémoire : `4938B9–4938C5` efface le bit 31 en mémoire, pas dans EBX ; `4939BB–4939C7` efface 0x10000 en mémoire, pas dans EBX — vérifié, correct.
2. Précédence `0x10000` (EBX) avant le bit 1 du 2ᵉ argument (`493A38`) — vérifié par le saut `4939B9`.
3. Largeur `EAX` : `TEST EAX,EAX` après `484600` est 32 bits ; le tag « channel-USED flag » du commentaire IDA n'autorise pas un test AL — vérifié correct dans A/B/R.
4. `ESI` d'avant `CALL` : pas de re-push entre `48C5C0` et `4A8460` (pile partagée) — vérifié.
5. EBP : jamais modifié après `XOR EBP,EBP` ; les écritures `1D27B24`/`1CFF184` ← 0 sont donc des zéros ; A et B utilisent `x->ebp` (équivalent si le callee préserve EBP, comme exigé par les callees cdecl normaux — **non prouvé** sans corps callee).
6. Valeur de retour : seul EAX du dernier callee ; aucune tentative de le typer — correct.
Aucune erreur commune trouvée.

## 6. Couverture

190/190 instructions (chaque `asm-00x` lue), 26/26 blocs CFG (`493840,49385A,493872,493879,493881,49388C,49389E,4938B0,4938DA,4938E1,4938E6,4938F3,4938FF,493925,49392D,49393E,49394F,49395C,493968,49398E,4939BB,493A38,493A3F,493A8C,493AC6,493AD5`), chunk unique 675 octets, deux sorties `RET` (`493AD4`, `493AE2`), aucune table de saut. Xrefs code vers l'EA (métadonnées) : `47DB6C(f 47DAF0)`, `47DC59(f 47DBA0)`, `483613`, `493D01` (owner nul), `493FF3`, `4940B5` : usages seulement, pas de sémantique d'appelant établie.

## 7. Statuts

- **CERTAIN** (octets/ASM) : flux de contrôle, adresses/largeurs/wrap, ordre des effets et appels, pile, retour EAX, restauration registres.
- **UNCERTAIN** : valeurs exactes de AF/OF indéfinis ; préservation d'EBP par chaque callee (hypothèse ABI standard) ; domaine valide de `slot` (aucune borne) ; sens métier des champs (`+1B2`, `+188`, flags `0x400/0x8/0x4`) ; sens de retour.
- **Hors périmètre** : corps des 10 callees, nom définitif (sémantique R), intégration.

## 8. Contrôles demandés au lead (non effectués ici)

1. Confirmer que `c_a.md` et `c_b.md` sont bien les livrables gelés (hash de fichier absent de mon `inputs/`).
2. Compiler le C isolé avec un adaptateur ; différentiel natif/lift sur les deux sorties finales (`PUSH 1` vs `PUSH EBP`), chaque combinaison de branches (bit31, `0x10000`, bit 1 du 2ᵉ arg, `484600` retour 0/≠0, slot == `1D27B0F`), wrap d'adresse (valeurs de slot hors domaine produisant un débordement 32 bits), `CH` vs `AL`, RMW DWORD répétés, callbacks modifiant la mémoire partagée ou l'argument.
3. Comparer registres/pile/mémoire en masquant `undefined_flags`.
4. §5.6 natif final reste au lead.
