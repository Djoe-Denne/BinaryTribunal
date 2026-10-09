# readbackVramRectToRam @ 0x45BE70

- Statut : validé par le parent le 2026-10-09 — clôture documentaire historique LIKELY, hors métriques pilote ; aucun verdict d'équivalence runtime.
- Native : 42 instructions ; 106 octets ; un chunk `[0x45BE70,0x45BEDA)` ; 5 blocs ; 5 arêtes inter-blocs internes (+2 vers EXIT si incluses) ; 44 arêtes d'instructions (38 seq, 2 taken, 2 fallthrough, 2 retn).
- Callees : zéro CALL natif sortant ; `F3 A5`/`F3 A4` sont REP MOVSD/MOVSB, pas des appels ; les callbacks du C sont des primitives de traduction uniquement.
- Source SHA-256 : `de079e91588b791dd85e6a8a8db7efa0ba38d9f6a2eb967bd8faae29b1dae7bc` (octets natifs frais, égaux au neutral).
- Canon : hors cohorte — Flash A + Sol B indépendante + Sol R ; arbitrage par instructions natives, jamais par vote A/B ; pas un triple GLM.
- Sém : mode 1+V ; verdict ACCEPTE ; LIKELY ; A==V.
- Rôle/nom : hypothèse LIKELY (« VRAM » non prouvée par le nom) ; faits numériques établis (copie rectangle de mots, base `0x01B47818`, strides `0x800`/`2*w`) ; confiance LIKELY, CERTAIN limité aux opérations numériques conditionnelles.
- Ancien pack : hints contaminés (`hexrays.c`, `wiki.md`, semantic antérieure) et un refus de mission antérieur (pas un OOM) — conservés comme historique uniquement, PAS de nouveaux inputs pour ce livrable.
- Nouveau pack : `pilot-2026-10-09` — décodage exclusivement numérique (`decode_insn` + `get_bytes`), Hex-Rays jamais appelé.

## C réconcilié

§5.6 parent natif complet : 42 instructions/chunk/5 blocs/hash, zéro callee natif, trois xrefs CODE et trois callers réels, deux arguments et cleanup8, stride2048/source1024mots, destination2*w, TEST/JZ zéro seulement, DEC/JNZ modulo32 et deux retours EAX32=1. Source stridée à quatre mots + caller 0x472A9E fournissant rectangle constant/destination et masquant4096mots donnent deux preuves indépendantes du rôle/nom descriptif ; « VRAM » reste LIKELY. Parent a relu le C final complet : DF deux polarités, PUSH/POP guest, home-slot rechargé, ordre REP DWORD entier puis octets, wrap et RET/EIP effectivement propagés. Raw fence5685octets exactsource. Append `[semantic-triple 2026-10-09]`, sauvegarde true/relecture exacte ; aucun rename/SetType/patch, aucun backend/compilation native certifié.

Embarquement RAW bytes de `c_reconciled_sol.c` — SHA-256 `4937e99ec95735f59728289df118319901a562cfda3de21e8fe05a2e3db284ef`, LF pur, UTF-8 sans BOM, aucune LF supplémentaire.

```c
/* H-C11-C-R: numeric C reconciliation; NOT a native host ABI replacement.
 * Guest bytes [0x45BE70,0x45BEDA), 106 bytes, 42 instructions, one chunk.
 * Native byte SHA256:
 * de079e91588b791dd85e6a8a8db7efa0ba38d9f6a2eb967bd8faae29b1dae7bc
 *
 * Memory backend is deliberately an unprovided interface. Its successful
 * accesses implement ordinary flat 32-bit little-endian RAM. read16/read32
 * return the complete operand BEFORE a subsequent write; each MOVSD remains
 * one complete load then one complete store, not four interleaved byte moves.
 * Operands must be completely mapped and not cross the 32-bit address border.
 * Base-address/register arithmetic wraps modulo 2^32. Unaligned accesses and
 * aliasing among guest stack, arguments, source and destination are permitted.
 * Backend/context and host register state must be disjoint from guest RAM;
 * callbacks must not mutate r or df, reenter, or introduce external changes.
 * Faults/partial execution, segments, MMIO, concurrency, atomicity, other
 * EFLAGS and intermediate EIP are outside the model. DF input is 0 or 1;
 * neither polarity is silently discarded. EIP is the consumed RET address.
 * Helpers/callbacks are translation primitives: native outgoing CALLs = 0.
 * This artifact makes NO CISO/native/runtime equivalence or promotion claim.
 */
#include <stdint.h>

typedef struct {
    uint32_t eax, ebx, ecx, edx, esi, edi, ebp, esp, eip;
    unsigned df;
} x86_45be70;

typedef struct {
    void *context;
    uint8_t  (*read8)(void *, uint32_t);
    uint16_t (*read16)(void *, uint32_t);
    uint32_t (*read32)(void *, uint32_t);
    void (*write8)(void *, uint32_t, uint8_t);
    void (*write32)(void *, uint32_t, uint32_t);
} memory_45be70;

static uint32_t r16sx(const memory_45be70 *m, uint32_t a)
{
    uint32_t v = m->read16(m->context, a);
    return (v & UINT32_C(0x8000)) ? v | UINT32_C(0xffff0000) : v;
}

static uint32_t r32(const memory_45be70 *m, uint32_t a)
{
    return m->read32(m->context, a);
}

static void w32(const memory_45be70 *m, uint32_t a, uint32_t v)
{
    m->write32(m->context, a, v);
}

static void p32(x86_45be70 *r, const memory_45be70 *m, uint32_t v)
{
    r->esp -= UINT32_C(4);
    w32(m, r->esp, v);
}

static uint32_t q32(x86_45be70 *r, const memory_45be70 *m)
{
    uint32_t v = r32(m, r->esp);
    r->esp += UINT32_C(4);
    return v;
}

uint32_t sub_45BE70(x86_45be70 *r, const memory_45be70 *m)
{
    uint32_t v;
    uint32_t d4 = r->df ? UINT32_C(0xfffffffc) : UINT32_C(4);
    uint32_t d1 = r->df ? UINT32_C(0xffffffff) : UINT32_C(1);

    r->ecx = r32(m, r->esp + UINT32_C(4));         /* 45BE70 */
    p32(r, m, r->ebx);                            /* 45BE74 */
    p32(r, m, r->esi);                            /* 45BE75 */
    r->edx = r16sx(m, r->ecx + UINT32_C(2));       /* 45BE76 */
    r->esi = r16sx(m, r->ecx);                    /* 45BE7A */
    r->eax = r16sx(m, r->ecx + UINT32_C(4));       /* 45BE7D */
    r->ecx = r16sx(m, r->ecx + UINT32_C(6));       /* 45BE81 */
    r->edx <<= 10;                                /* 45BE85 */
    r->edx += r->esi;                             /* 45BE88 */
    r->eax <<= 1;                                 /* 45BE8A */
    r->ebx = (r->edx << 1) + UINT32_C(0x1b47818);  /* 45BE8C */
    r->edx = r32(m, r->esp + UINT32_C(0x10));      /* 45BE93 */
    if (r->ecx == 0)                              /* 45BE97, 45BE99 */
        goto loc_45BED2;
    p32(r, m, r->ebp);                            /* 45BE9B */
    p32(r, m, r->edi);                            /* 45BE9C */
    w32(m, r->esp + UINT32_C(0x14), r->ecx);       /* 45BE9D: entry ESP+4 */

loc_45BEA1:
    r->ecx = r->eax;                              /* 45BEA1 */
    r->esi = r->ebx;                              /* 45BEA3 */
    r->ebp = r->ecx;                              /* 45BEA5 */
    r->edi = r->edx;                              /* 45BEA7 */
    r->ecx >>= 2;                                 /* 45BEA9: logical */
    while (r->ecx != 0) {                         /* 45BEAC: REP MOVSD */
        v = r32(m, r->esi);
        w32(m, r->edi, v);
        r->esi += d4;
        r->edi += d4;
        --r->ecx;
    }
    r->ecx = r->ebp;                              /* 45BEAE */
    r->edx += r->eax;                             /* 45BEB0 */
    r->ecx &= UINT32_C(3);                        /* 45BEB2 */
    r->ebx += UINT32_C(0x800);                    /* 45BEB5: before MOVSB */
    while (r->ecx != 0) {                         /* 45BEBB: REP MOVSB */
        v = m->read8(m->context, r->esi);
        m->write8(m->context, r->edi, (uint8_t)v);
        r->esi += d1;
        r->edi += d1;
        --r->ecx;
    }
    r->ecx = r32(m, r->esp + UINT32_C(0x14));      /* 45BEBD: real reload */
    --r->ecx;                                     /* 45BEC1 */
    w32(m, r->esp + UINT32_C(0x14), r->ecx);       /* 45BEC2 */
    if (r->ecx != 0)                              /* 45BEC6: DEC result */
        goto loc_45BEA1;
    r->edi = q32(r, m);                           /* 45BEC8 */
    r->ebp = q32(r, m);                           /* 45BEC9 */
    r->esi = q32(r, m);                           /* 45BECA */
    r->eax = UINT32_C(1);                         /* 45BECB: EAX32 */
    r->ebx = q32(r, m);                           /* 45BED0 */
    r->eip = q32(r, m);                           /* 45BED1: RET, no imm */
    return r->eax;

loc_45BED2:
    r->esi = q32(r, m);                           /* 45BED2 */
    r->eax = UINT32_C(1);                         /* 45BED3: EAX32 */
    r->ebx = q32(r, m);                           /* 45BED8 */
    r->eip = q32(r, m);                           /* 45BED9: RET, no imm */
    return r->eax;
}
```

## Écarts rapportés fidèlement depuis R

- **Cible A — raccourcis limités (non exhaustif alias-safe)** : compteur `cnt` privé au lieu des trois accès RAM natifs du home slot ; écritures de sauvegardes, rechargements et RET mémoire non représentés ; ordre de lectures WORD `+0,+2,+4,+6` au lieu du natif `+2,+0,+4,+6` ; avance `src += 0x800` placée après MOVSB au lieu d'avant ; `DF=0` annoncé sans généralisation par ces callers ; `uintptr_t` hôte ne garantit pas le wrap 2^32 ; déréférencements `uint16_t*`/`uint32_t*` potentiellement UB C sur buffers non alignés.
- **B — aucun défaut supplémentaire établi** dans son domaine explicite (RAM plate stable, little-endian, intégralement mappée, sans fautes/MMIO/atomicité) ; chaque DWORD chargé intégralement avant son store conserve l'ordre pertinent en recouvrement.
- **Métadonnées ABI neutral fausses — remplacées par l'ASM** : `frame_pointer_used=true` à tort (EBP reçoit ECX/la longueur, jamais ESP — pas un frame pointer) ; `string_ops:[]` omet REP MOVSD/MOVSB ; `observed_arg_reads` contient des writes ; `pop_count=6` est une somme statique des deux chemins, pas six POP d'un chemin ; le LEA aplati sans index ne remplace pas le SIB brut `8d 1c 55 18 78 b4 01`.

## Limites du modèle

- **Backend mémoire non fourni** : interface callbacks déclarée, implémentation absente ; aucune exécution différentielle, aucune équivalence backend validée.
- **DF** : 0 et 1 préservés (aucun CLD/STD) ; deltas MOVSD ±4, MOVSB ±1 ; les avances de bases EDX/EBX restent inchangées par DF.
- **Home slot et alias** : `[S+4]`, slot d'entrée de a1, écrit, rechargé et décrémenté en RAM réelle ; les copies peuvent cibler compteur, sauvegardes et adresse de retour ; PUSH/POP/RET rechargent la RAM réelle.
- **Pas d'équivalence native ISO** : aucune revendication CISO/native/runtime ; fautes/états partiels, segments non plats, MMIO, concurrence, atomicité, EFLAGS hors DF et EIP intermédiaire exclus du modèle.

## Push IDB

- Parent §5.6 vert : append `[semantic-triple 2026-10-09]`, save true et relecture exacte, tag unique. Pas de SetType/rename/patch. Cela clôt le livrable documentaire borné, pas la disponibilité du backend ni l'équivalence native/ISO/runtime.
