# moveVramRectToVram @ 0x45BDD0

- Statut : validé par le parent le 2026-10-09 ; récupération historique hors métriques pilote.
- Instr (live) : 59 ; 159 octets ; cinq blocs ; un chunk `[0x45BDD0,0x45BE6F)`.
- SHA-256 live : `93994b3d9d5d2a739f17ec478b26dc80b2831f134827f14fc205f6cb241d12ca`.
- Mode : 1+V ; verdict sémantique ACCEPTE ; A==V oui ; LIKELY ; nom trop large.
- Provenance : A SOL indépendante ; V/R GPT-6.1 Sol demandé explicitement ; Flash comparé uniquement après dérivation V pour R C. Aucun Hex-Rays/wiki, aucun appel GLM dans V/R ; override Sol explicitement autorisé, pas de changement des defaults globaux.
- C A==B : non. Corrections ASM : Flash avançait de `0x800+longueur` au lieu de `0x800`, soustrayait en signé avant cast et utilisait des casts mémoire ordinaires. R conserve deux bases de ligne et le snapshot DWORD avant store ; wrap32 sans UB signé.
- Push IDB : oui — append `[semantic-triple 2026-10-09]`, sauvegarde true/relecture exacte. Aucun SetType/rename/patch ni remplacement des commentaires.
- Notes parent : §5.6 parent natif vert, 59 instructions/cinq blocs complets, hash live inchangé ; neuf xrefs CODE (un hors fonction IDA), trois arguments cdecl (cleanup différé 3+1 confirmé), helper quatre arguments/+10, stride 2048 et retour entier EAX=1. Deux preuves indépendantes du nom ; bloc C final relu, corrections Flash propagées et limites explicites. DF=0 hypothèse non prouvée ; RAM/alias/pile/fautes/MMIO détaillés dans le C. Pas de compilation ni exécution native.
- C embarqué : identique au fichier pack `c_reconciled_sol.c` ; contrôle dans `artifact_verify_sol.md`.

## C réconcilié

```c
/* C10-V-R-SOL: 0x45BDD0 moveVramRectToVram, reconciled against live ASM.
 * 159 bytes, 59 instructions, 5 CFG blocks, one chunk [45BDD0,45BE6F).
 * SHA256: 93994b3d9d5d2a739f17ec478b26dc80b2831f134827f14fc205f6cb241d12ca
 * Three cdecl stack args; full EAX=1 on normal return; helper return ignored.
 * DF=0 is an UNPROVEN precondition (no CLD in the original).
 * GCC/Clang i386 little-endian model, original addresses mapped as ordinary RAM.
 * No memcpy/memmove; dword snapshot before store, then residual bytes.
 * Overlap can contaminate subsequent reads; no clipping or validation.
 * Not equivalent for DF=1, MMIO, faults, interrupts, flags, or aliases with
 * native CPU stack slots. Volatile/packed accesses do not prove MMIO fidelity.
 * Memory helpers below model opcodes, not original library calls.
 */
#include <stdint.h>
#include <limits.h>

#if !defined(__GNUC__) && !defined(__clang__)
# error "Requires GCC/Clang packed/may_alias extensions."
#endif
#if !defined(__i386__)
# error "Requires x86 32-bit target, not the 64-bit host."
#endif
_Static_assert(CHAR_BIT == 8, "Requires eight-bit bytes");
_Static_assert(UINTPTR_MAX == UINT32_MAX, "Requires 32-bit addresses");
#define CDECL __attribute__((cdecl))

typedef struct __attribute__((packed, may_alias)) { uint16_t value; } Raw16;
typedef struct __attribute__((packed, may_alias)) { uint32_t value; } Raw32;

static uint16_t read_word(uint32_t address)
{
    return ((const volatile Raw16 *)(uintptr_t)address)->value;
}
static uint32_t read_dword(uint32_t address)
{
    return ((const volatile Raw32 *)(uintptr_t)address)->value;
}
static void write_dword(uint32_t address, uint32_t value)
{
    ((volatile Raw32 *)(uintptr_t)address)->value = value;
}
static uint32_t sign_extend_word(uint16_t value)
{
    uint32_t result = value;
    if ((result & UINT32_C(0x8000)) != 0u)
        result |= UINT32_C(0xffff0000);
    return result;
}

/* Sole original CALL: 0x464850, four cdecl arguments, inclusive bounds.
 * uint32_t carries register bits, not a claim that the helper is unsigned.
 * void denotes discarded/unmodelled return, not a recovered native type.
 * External binding at 0x464850 is required; no replacement implementation.
 */
extern void CDECL sub_464850(uint32_t x_min, uint32_t y_min,
                           uint32_t x_max, uint32_t y_max);

uint32_t CDECL moveVramRectToVram(const void *rectangle,
                                uint32_t destination_x,
                                uint32_t destination_y)
{
    const uint32_t rectangle_address = (uint32_t)(uintptr_t)rectangle;
    /* Original read order: +4, +2, +0, +6; all MOVSX word. */
    const uint32_t width = sign_extend_word(read_word(rectangle_address + 4u));
    const uint32_t source_y = sign_extend_word(read_word(rectangle_address + 2u));
    const uint32_t source_x = sign_extend_word(read_word(rectangle_address));
    const uint32_t height = sign_extend_word(read_word(rectangle_address + 6u));
    uint32_t source_row = UINT32_C(0x01b47818)
                        + ((source_y << 10) + source_x) * 2u;

    if (height != 0u) { /* TEST/JZ, not a signed positivity test. */
        uint32_t delta = ((destination_y - source_y) << 10)
                       - source_x + destination_x;
        uint32_t destination_row = source_row + delta * 2u;
        uint32_t remaining_rows = height; /* Original overwrites arg_0 slot. */
        do {
            uint32_t source = source_row;
            uint32_t destination = destination_row;
            const uint32_t row_bytes = width + width;
            uint32_t dwords = row_bytes >> 2; /* SHR, not SAR. */
            uint32_t bytes = row_bytes & 3u;
            source_row += UINT32_C(0x800); /* EAX, not post-REP ESI. */
            while (dwords != 0u) { /* REP MOVSD, DF=0 assumed. */
                uint32_t value = read_dword(source);
                write_dword(destination, value);
                source += 4u;
                destination += 4u;
                --dwords;
            }
            destination_row += UINT32_C(0x800); /* EDX, not post-REP EDI. */
            while (bytes != 0u) { /* REP MOVSB continues after MOVSD. */
                unsigned char value = *(const volatile unsigned char *)(uintptr_t)source;
                *(volatile unsigned char *)(uintptr_t)destination = value;
                source += 1u;
                destination += 1u;
                --bytes;
            }
            --remaining_rows; /* DEC/JNZ, modulo 2^32, negative heights too. */
        } while (remaining_rows != 0u);
    }
    /* Called even for height==0; original reloads destination args from stack. */
    sub_464850(destination_x, destination_y,
               width + destination_x - 1u,
               height + destination_y - 1u);
    return 1u; /* Full EAX, after normal return of the helper. */
}
```
