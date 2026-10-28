# C A — 0x47E3F0

## Provenance et contradiction du brief

Source autoritaire : `inputs/ff8-decomp-semantics-20261011-r01/g10/0x47E3F0.json`, lignes 11–24 et 196–199 ; projections `0x47E3F0.readable/{manifest.json,asm-001.txt,bytes-001.txt,metadata.json}` ; contexte `common-compaction.md`, notamment ligne 15.

SHA256 d'entrée cité du manifeste (non recalculé) : `79e9a6e4379f45417ab7ae5c7e7f643e5f9e390f2b81e80527f0726966a31e64`.
SHA256 compaction cité : `2ccc15a8b4611fa627c6b30b697010479c2c9b96cc69923fba089cfc278d7a01`.
SHA256 EXE déclaré par le gel : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` ; export du 2026-10-11T16:38:25.140966+00:00, x86 32 bits.

**Le gel contient 24 octets, non 52, et un CALL direct, non zéro.** Les 48 chiffres hexadécimaux couvrent exactement `[0x47E3F0,0x47E408)`. `E8 EC 29 08 00` à 0x47E3FF appelle `0x47E404 + 0x000829EC = 0x500DF0`. Ce callee n'est donc pas inventé. Les neuf instructions et le bloc unique concordent. Pas de JMP indirect ; RET transfère naturellement vers l'adresse de retour empilée. Le présent livrable privilégie les octets, sans corriger le CALL pour satisfaire la description contradictoire.

## C — interface ABI usuelle

```c
#include <stdint.h>

#if defined(_MSC_VER) && defined(_M_IX86)
# define FF8_CDECL __cdecl
#elif (defined(__GNUC__) || defined(__clang__)) && defined(__i386__)
# define FF8_CDECL __attribute__((cdecl))
#else
# error This ABI binding requires a 32-bit x86 C target
#endif

/* Binding to the proven native address 0x00500DF0, not a replacement body.
 * Three opaque 32-bit stack words; uint32_t preserves their bit patterns.
 * The native function's semantic argument and return types are unknown.
 */
extern uint32_t FF8_CDECL ff8_at_00500DF0(uint32_t a1,
                                       uint32_t a2,
                                       uint32_t a3);

uint32_t FF8_CDECL ff8_at_0047E3F0(uint32_t a1,
                                uint32_t a2,
                                uint32_t a3)
{
    return ff8_at_00500DF0(a1, a2, a3);
}
```

Cette vue exprime le forwarding cdecl et EAX intégral. Elle n'impose pas au compilateur les copies de pile ni les EFLAGS natifs ; notamment une optimisation en tail-call ne conserverait pas les flags du ADD. Pour l'exigence registre/mémoire/flags exacte, la spécification C suivante est la référence, pas le code machine éventuellement généré pour la vue ABI.

## C — modèle architectural explicite, neuf instructions

```c
#include <stdint.h>

typedef struct FF8_X86 {
    uint32_t eax, ecx, edx, ebx, esp, ebp, esi, edi;
    uint32_t eip, eflags;
    /* Shared flat 32-bit guest address space, little-endian.
     * Backing storage must cover every accessed guest address.
     */
    volatile uint8_t *memory;
} FF8_X86;

static uint32_t load32(FF8_X86 *s, uint32_t a)
{
    uint32_t b0 = s->memory[a];
    uint32_t b1 = s->memory[(uint32_t)(a + UINT32_C(1))];
    uint32_t b2 = s->memory[(uint32_t)(a + UINT32_C(2))];
    uint32_t b3 = s->memory[(uint32_t)(a + UINT32_C(3))];
    return b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
}

static void store32(FF8_X86 *s, uint32_t a, uint32_t v)
{
    s->memory[a] = (uint8_t)v;
    s->memory[(uint32_t)(a + UINT32_C(1))] = (uint8_t)(v >> 8);
    s->memory[(uint32_t)(a + UINT32_C(2))] = (uint8_t)(v >> 16);
    s->memory[(uint32_t)(a + UINT32_C(3))] = (uint8_t)(v >> 24);
}

/* Sole opaque native dependency, the same address as in the ABI view.
 * Entry state includes CALL's pushed return address and EIP=0x500DF0.
 * Execute the actual callee INCLUDING its RET, preserving its full effects
 * in s and shared memory. Return to this model only if it returns normally
 * to 0x47E404; faults/nonreturning control remain callee outcomes.
 * This is a model binding, NOT an additional call in the original binary.
 */
extern void execute_native_00500DF0_through_return(FF8_X86 *s);

void model_0047E3F0(FF8_X86 *s)
{
    uint32_t old_sp, new_sp, p, flags;

    /* 0047E3F0 / F4 / F8: all loads occur before any push. */
    s->eax = load32(s, (uint32_t)(s->esp + UINT32_C(12)));
    s->ecx = load32(s, (uint32_t)(s->esp + UINT32_C(8)));
    s->edx = load32(s, (uint32_t)(s->esp + UINT32_C(4)));

    /* 0047E3FC / FD / FE: PUSH EAX / ECX / EDX. */
    s->esp = (uint32_t)(s->esp - UINT32_C(4));
    store32(s, s->esp, s->eax);
    s->esp = (uint32_t)(s->esp - UINT32_C(4));
    store32(s, s->esp, s->ecx);
    s->esp = (uint32_t)(s->esp - UINT32_C(4));
    store32(s, s->esp, s->edx);

    /* 0047E3FF: CALL rel32. MOV/PUSH/CALL do not change flags. */
    s->esp = (uint32_t)(s->esp - UINT32_C(4));
    store32(s, s->esp, UINT32_C(0x0047E404));
    s->eip = UINT32_C(0x00500DF0);
    execute_native_00500DF0_through_return(s);

    /* 0047E404: ADD ESP,12, with all six arithmetic flags. */
    old_sp = s->esp;
    new_sp = (uint32_t)(old_sp + UINT32_C(12));
    p = new_sp & UINT32_C(255);
    p ^= p >> 4;
    p ^= p >> 2;
    p ^= p >> 1;
    flags = (uint32_t)(new_sp < old_sp);                /* CF bit 0 */
    flags |= ((p ^ UINT32_C(1)) & UINT32_C(1)) << 2;  /* PF bit 2 */
    flags |= (old_sp ^ UINT32_C(12) ^ new_sp) & UINT32_C(0x10);
    flags |= (uint32_t)(new_sp == UINT32_C(0)) << 6;  /* ZF bit 6 */
    flags |= (new_sp >> 31) << 7;                     /* SF bit 7 */
    flags |= ((~(old_sp ^ UINT32_C(12)) & (old_sp ^ new_sp))
              >> 31) << 11;                          /* OF bit 11 */
    s->eflags = (s->eflags & ~UINT32_C(0x8D5)) | flags;
    s->esp = new_sp;

    /* 0047E407: near RET, no immediate, no flag modification. */
    s->eip = load32(s, s->esp);
    s->esp = (uint32_t)(s->esp + UINT32_C(4));
}
```

`load32`/`store32` sont des primitives du modèle, pas des callees attribués à la cible. Le modèle ne fournit pas une fausse implémentation du callee absent du gel. Aucun appel de bibliothèque n'est ajouté.

## ASM_resume / couverture et effets

| EA | Octets | Effet vérifié par lecture |
|---|---|---|
| 47E3F0 | 8B 44 24 0C | EAX = DWORD [ESP+12] |
| 47E3F4 | 8B 4C 24 08 | ECX = DWORD [ESP+8] |
| 47E3F8 | 8B 54 24 04 | EDX = DWORD [ESP+4] |
| 47E3FC | 50 | PUSH EAX |
| 47E3FD | 51 | PUSH ECX |
| 47E3FE | 52 | PUSH EDX |
| 47E3FF | E8 EC 29 08 00 | CALL direct 500DF0, retour 47E404 |
| 47E404 | 83 C4 0C | ADD ESP,12 ; écriture CF/PF/AF/ZF/SF/OF |
| 47E407 | C3 | RET near sans nettoyage des arguments d'entrée |

Couverture : 9/9 instructions, 24/24 octets, 1/1 bloc exporté, 1/1 chunk. Aucun chemin conditionnel local, aucune garde ajoutée. Le callee peut avoir des chemins non retournants non documentés.

Pour ESP d'entrée S : lecture des arguments à S+12, S+8, S+4, puis écritures à S-4 (a3), S-8 (a2), S-12 (a1), S-16 (retour 47E404). À l'entrée du callee, `[ESP+4,+8,+12]` porte a1,a2,a3. Sous retour cdecl normal, ESP=S-12 après le callee, S après ADD, S+4 après RET. Les trois arguments originaux restent à la charge de l'appelant ; les cellules libérées ne sont pas effacées. Aucun pointeur passé n'est déréférencé par le wrapper lui-même. Les effets mémoire transitifs du callee restent opaques.

Toutes les opérations de données locales sont sur 32 bits entiers bruts ; aucun signe métier n'est prouvé, aucune conversion char/short n'est justifiée par les commentaires. EAX après retour est celui du callee, sans extension ni masquage : AX et AL en sont les 16 et 8 bits bas. ECX/EDX et les autres effets de registres du callee ne sont pas réinitialisés. Le wrapper ne touche pas lui-même EBX/ESI/EDI/EBP ; leur préservation transitive dépend du callee. Les additions/soustractions du modèle sont modulo 2^32 ; les shifts sont logiques, de comptes constants inférieurs à 32.

Flags de sortie : si P est ESP immédiatement après le retour du callee et R=(P+12) modulo 2^32, CF=(R<P), ZF=(R==0). RET ne modifie pas ces flags ; il ne faut ni supposer CF/ZF nuls d'après un ESP habituel ni conserver ceux du callee. Les autres flags arithmétiques sont calculés dans le modèle et les flags non affectés restent ceux du callee.

## Limites et validations non exécutées

- La vue ABI suppose le contrat cdecl attendu par le nettoyage local de 12 octets ; le corps de 500DF0 et ses types sémantiques ne sont pas fournis. Aucun nom métier ni commentaire d'IDA n'est utilisé comme preuve.
- Le modèle couvre l'exécution normale en mémoire plate 32 bits, pas les exceptions de page/segment, les accès concurrents/MMIO, l'atomicité matérielle des accès DWORD, ni les mécanismes de debug. Ses accès octet par octet ne revendiquent pas cette équivalence transactionnelle.
- Les valeurs des flags architecturaux sont explicites dans le modèle ; un C ABI ordinaire ne garantit pas les EFLAGS physiques, les adresses de pile ou les registres volatils exacts. L'intégration native doit conserver ces contraintes si elles sont observables.
- Lecture et calculs manuels seulement : aucun test, compilation, exécution native, désassemblage indépendant ou recalcul SHA256 effectué. Relecture/compilation/intégration et hash du livrable réservés au parent. La contradiction « 52 octets / aucun call » nécessite correction du descriptif, pas suppression du CALL prouvé.
