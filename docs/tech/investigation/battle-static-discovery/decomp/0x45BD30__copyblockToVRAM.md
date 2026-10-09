# Reconstruction C copyblockToVRAM @ 0x0045BD30

**C9-V-R-SOL — 2026-10-09. §5.6 parent OK ; append IDB daté, save true et relecture exacte.**

Reconstruction réconciliée contre bytes/ASM/CFG live, non vote entre modèles. V accepte A Sol : rôle copie compacte + notification, confiance **LIKELY**, nom catalogue **trop large**. [Sémantique et preuves](../semantic/0x45BD30__copyblockToVRAM.md).

Freshness : `[0x45BD30,0x45BDCE)`, un chunk, 158 bytes, 57 instructions, cinq blocs ; SHA256 `9aea64af6568d62d39bde9e97e467f8b879d9705085c00f164c866c54ea06a86`.

## C réconcilié exact

Contenu exact de `tools/_tmp_semantic_triple/0x45bd30/c_reconciled_sol.c` (hors délimiteurs Markdown). **Modèle non compilé/non exécuté en natif, pas un remplacement du décompilateur natif Hex-Rays.** Binding du helper non fourni.

```c
/* C9-V-R-SOL : reconstruction C reconcilee contre l'ASM live, non Hex-Rays.
 * 0x0045BD30..0x0045BDCE : 158 bytes, 57 instructions, 1 chunk, 5 blocs.
 * SHA256 : 9aea64af6568d62d39bde9e97e467f8b879d9705085c00f164c866c54ea06a86
 * Modele x86 32 bits, DF=0, memoire ordinaire accessible, hors alias avec
 * les slots de pile internes. Non compile/teste en natif. Pas un remplacement
 * du decompilateur natif Hex-Rays, pas un binding executable autonome.
 * Les acces byte preservent le snapshot logique d'un MOVSD, pas son atomicite,
 * MMIO, fautes ou accesses physiques. Helpers C = modelisation, pas calls ASM.
 */
#include <stdint.h>

#if defined(_MSC_VER)
# define R_CDECL __cdecl
#elif defined(__i386__) && (defined(__GNUC__) || defined(__clang__))
# define R_CDECL __attribute__((cdecl))
#else
# define R_CDECL
#endif

/* Unique CALL cible @0x00464850 ; quatre arguments cdecl de 32 bits.
 * Retour ignore : void est un choix de modele, pas son type natif prouve.
 * Binding a l'EA a fournir ; identite des tables / sous-helper inconnue.
 */
extern void R_CDECL sub_00464850(int32_t x0, int32_t y0,
                               int32_t x1, int32_t y1);

static int32_t r_s16_le(const uint8_t *p)
{
    const uint32_t v = (uint32_t)p[0] | ((uint32_t)p[1] << 8);
    return v < UINT32_C(0x8000) ? (int32_t)v : (int32_t)v - 65536;
}

static uint8_t r_load8(uint32_t address)
{
    return *(const volatile uint8_t *)(uintptr_t)address;
}

static void r_store8(uint32_t address, uint8_t value)
{
    *(volatile uint8_t *)(uintptr_t)address = value;
}

static void r_movsd_forward(uint32_t destination, uint32_t source)
{
    /* REP MOVSD : lire quatre bytes avant d'en ecrire un seul. */
    const uint8_t b0 = r_load8(source);
    const uint8_t b1 = r_load8(source + UINT32_C(1));
    const uint8_t b2 = r_load8(source + UINT32_C(2));
    const uint8_t b3 = r_load8(source + UINT32_C(3));
    r_store8(destination, b0);
    r_store8(destination + UINT32_C(1), b1);
    r_store8(destination + UINT32_C(2), b2);
    r_store8(destination + UINT32_C(3), b3);
}

int32_t R_CDECL copyblockToVRAM(const void *rect8, const void *packed_source)
{
    /* MOVSX +2,+0,+4,+6 ; valeurs originales sauvegardees avant la copie. */
    const uint8_t *const rect = (const uint8_t *)rect8;
    const int32_t y = r_s16_le(rect + 2);
    const int32_t x = r_s16_le(rect);
    const int32_t width = r_s16_le(rect + 4);
    const int32_t height = r_s16_le(rect + 6);
    const uint32_t index = ((uint32_t)y << 10) + (uint32_t)x;
    uint32_t row_destination = UINT32_C(0x01B47818) + UINT32_C(2) * index;
    const uint32_t row_bytes = UINT32_C(2) * (uint32_t)width;
    uint32_t rows_left = (uint32_t)height;

    /* TEST/JZ puis DEC/JNZ, jamais height > 0. Le vrai binaire reutilise
     * le slot arg_0 pour ce compteur @0x45BD73/97 ; pas le descripteur.
     */
    if (rows_left != 0) {
        uint32_t row_source = (uint32_t)(uintptr_t)packed_source;
        do {
            uint32_t source = row_source;
            uint32_t destination = row_destination;
            uint32_t count = row_bytes >> 2; /* SHR logique @0x45BD7F. */
            while (count != 0) {
                r_movsd_forward(destination, source);
                destination += UINT32_C(4);
                source += UINT32_C(4);
                --count;
            }
            /* ADD EBX,EDX et ADD EAX,0x800 avant REP MOVSB. */
            row_source += row_bytes;
            row_destination += UINT32_C(0x800);
            count = row_bytes & UINT32_C(3);
            while (count != 0) {
                const uint8_t value = r_load8(source);
                r_store8(destination, value);
                ++source;
                ++destination;
                --count;
            }
            --rows_left; /* Modulo 2^32, y compris hauteur negative. */
        } while (rows_left != 0);
    }
    /* PUSH y1,x1,y,x ; sommes int16 originales sans overflow int32.
     * Helper appele meme si hauteur/largeur zero ; aucun clipping/check.
     */
    sub_00464850(x, y, x + width - 1, y + height - 1);
    return INT32_C(1); /* MOV EAX,1 @0x45BDC2 : entier complet. */
}
```

## Arbitrages R et limites

- `REP MOVSD` à `0x45BD82` : snapshot dword avant écriture, contrairement à la boucle byte de Flash sous chevauchement. Restes à `0x45BD90 REP MOVSB` ; aucune library call inventée.
- `0x45BD96/9B DEC/JNZ` : compteur unsigned modulo 32 bits, évite l'overflow signé C du countdown Flash. Zéro seul saute les lignes ; dimensions négatives dangereuses.
- `0x45BD54/86/8B` : source `2*w`, destination `0x800`. Adresse `base+2*(1024*y+x)` en unsigned 32 bits, champs signés via `MOVSX`.
- `0x45BDBA/BF` : helper quatre arguments inclusifs, même hauteur zéro ; `0x45BDC2 MOV EAX,1`. Nom/type de retour du helper non déduits d'une étiquette.
- Cleanup caller non forcément immédiat : `0x45D662 CALL`, puis `0x45D696 ADD ESP,8`. Slot arg_0 réutilisé dans la cible ; ce modèle ne matérialise pas la pile interne.
- DF=0 supposé, aucun CLD local ; pas de reproduction de MMIO, atomicité ou fautes dword. Base logique VRAM/cache, capacité du buffer et rôle de `0x467550` restent inconnus.

Provenance : B Sol initialement indépendant de Flash/Hex-Rays/wiki ; R a lu les deux C et tranché par ASM live. Contre-exemple overlap vérifié par modèle JS uniquement ; aucune compilation/test natif. Notes complètes dans `tools/_tmp_semantic_triple/0x45bd30/c_reconcile_notes_sol.md`.

**§5.6 et push parent réalisés le 2026-10-09** : commentaire append-only `[semantic-triple 2026-10-09]`, save true, relecture exacte ; preuves et hashes pré/postimages dans le livrable semantic. Aucun type/rename/patch ni remplacement natif Hex-Rays. C documentaire non compilé et runtime safety non établie.
