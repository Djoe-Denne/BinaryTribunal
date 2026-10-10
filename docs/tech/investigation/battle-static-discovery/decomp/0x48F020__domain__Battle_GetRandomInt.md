# 0x48F020 — `domain::Battle_GetRandomInt` — candidat de décompilation (P2_propagate)

> Candidat issu d'une propagation mécanique déterministe (aucune nouvelle analyse, aucun vote,
> aucune génération de C). Aucune promotion, aucun écrit IDB, aucun rename à ce niveau :
> `IDB_push_done = false`, `parent_gate_required = true` — le gate et la promotion appartiennent au parent.
> Destinataire après gate parent : `0x48F020__domain__Battle_GetRandomInt.md` (décomp) et page sémantique associée.

## Identification

- EA : `0x48F020`
- Nom catalogue : `domain::Battle_GetRandomInt` (reçu du contexte parent post-freeze ; confirmation structurelle par ancres documentée dans `semantic_candidate.md`, pas le label IDA seul)
- Safe filename visé : `0x48F020__domain__Battle_GetRandomInt`

## Source native

- Décodage numérique neutre v2 depuis l'IDB live (identifiants neutralisés en adresses résolues, commentaires IDA retirés, stack vars en offsets numériques, Hex-Rays non consulté, syntaxe Intel).
- 10 instructions, 41 octets, un seul chunk contigu `[0x48F020, 0x48F049)`.
- SHA-256 des octets natifs : `f9531ffbcf5e2663971762983f3afbc20b4674e86649a1ef39cf817a8324f92e` (vérifié à nouveau dans le receipt par reconstruction des 41 octets d'instructions).
- Entrées gelées (hashes vérifiés contre `input_manifest.json`) :
  - `P2_neutral_v2/asm.txt` : `a1db45693672814da50f04fb0ac4829fff2881d5861811d9280841023aaa8aa5`
  - `P2_neutral_v2/frame_abi.txt` : `abfcceed3a727bde8f67ce6c666f7638cff2ebc22f94f2d48c825a4d17867087`

### Désassemblage (10 instructions, 41 octets)

```
I1  0x48F020  5  A1 30 A2 D2 01        mov  eax, ds:0x1D2A230        ; EAX = M32[0x1D2A230]
I2  0x48F025  5  25 FF 00 00 00        and  eax, 0xFF                ; EAX &= 0xFF  -> EAX = old EAX[7:0], zext to 32; EAX[31:8] = 0
I3  0x48F02A  6  8D 88 28 A2 D2 01    lea  ecx, [eax + 0x1D2A228]   ; ECX = 0x1D2A228 + EAX (32-bit wrap), flags unaffected
I4  0x48F030  6  8A 80 28 A2 D2 01    mov  al, byte ptr [eax + 0x1D2A228] ; AL = M8[0x1D2A228 + EAX] ; EAX[31:8] unchanged (remains 0x00)
I5  0x48F036  2  8B D0                 mov  edx, eax                 ; EDX = EAX (= zero-extended byte; EAX[31:8] = 0)
I6  0x48F038  6  81 E2 FF 00 00 00    and  edx, 0xFF                ; EDX = b (zext 8->32)
I7  0x48F03E  2  FE C0                 inc  al                       ; AL = (b + 1) & 0xFF ; 8-bit wrap only, EAX[31:8] untouched
I8  0x48F040  2  88 01                 mov  byte ptr [ecx], al       ; M8[ECX saved at I3] = (b + 1) & 0xFF
I9  0x48F042  6  8A 82 F8 97 B6 00    mov  al, byte ptr [edx + 0xB697F8] ; AL = M8[0xB697F8 + b]
I10 0x48F048  1  C3                    retn                          ; near return; EAX[7:0] = I9 byte, EAX[31:8] = 0x00
```

Faits ISA pertinents (numériques, x86) : `and r32,0xFF` zero-étend l'octet bas (CF=0, OF=0) ; `inc r8` boucle modulo 0x100 sans propagation de retenue vers EAX[31:8] ; `lea` = calcul d'adresse 32 bits sans accès mémoire ni effet flags ; I4/I9 loads octet, I8 store octet ; aucun CALL/JMP externe, aucun branchement ; flags écrits (I2, I6, I7), jamais lus ni utilisés en contrôle. Aucune instruction shift/rotate : la règle count-mask `&31` n'est pas exercée ; la signedness (ja/jb vs jg/jl) n'est pas exercée (aucun branchement conditionnel). ABI/frame (`frame_abi.txt`) : FUNC_FRAME non positionné, `frsize=0`, aucun push/pop, EBP non référencé, ESP non référencé hors `retn` C3, aucun argument pile consommé, zéro callee ; registres volatils écrits : EAX (I1,I2,I4,I7,I9), ECX (I3), EDX (I5,I6).

## Provenance (ordre chronologique)

1. **C ancien — pilot 2026-10-09, review indépendante Sol, ACCEPTE.** `pilot-2026-10-09/c_corrected_sol.c` (SHA-256 `31db377a982f9b409e4d1546e7be5c84110f2c34722ec5c6fb229276951e911a`) : correction C par review indépendante, explicitement pas une nouvelle génération B ; génération A gelée et preuves neutres inchangées à cette étape.
2. **Vague native 2026-10-10 — A puis V natifs, numériques, LIKELY.** Entrées neutres v2 régénérées depuis l'IDB live (ASM/ABI numériques sans noms) ; analyse numérique A indépendante (`P2_A/semantic_a.md`, `9839b37a631ba036d9338c7dd82d09fd82c85d632516b11c315fadb763e5bc26`), puis review V native indépendante (`P2_V/semantic_v.md`, `2c7a9c30ce905fa1137ab121f83e665a423c1878687790bf20507e14ceb48c4d`) : verdict ACCEPTE, aucun désaccord avec A, aucune correction sémantique numérique (A==V).
3. **Contexte parent post-freeze** (`parent_postfreeze_context.json`, SHA-256 `7fe1880e5425006e1265b2343ed96ce9d2f3fe0ddca7519129fa591014730a60`) : nom catalogue `domain::Battle_GetRandomInt` exposé après le gel A/V avec ancres structurelles ; spécification finale de cette propagation.

**Clôture C : premier et unique bloc C de ce document = copie VERBATIM de `c_corrected_sol.c` (le C accepté, avec ses commentaires).** `accepted_C_neutral.c` (SHA-256 `f53490bda13462ce99f8a54794bfbc8298dbdbe7a58af6866c4207dd8abdcd25`, variante sans commentaires) a été lu comme fichier listé du manifest mais n'est **pas** la clôture C. Aucune régénération de C ; aucune modification des entrées gelées ni de v1. L'égalité des octets de la clôture avec le fichier source est prouvée par hash dans `propagation_receipt.json`.

## C accepté — copie verbatim (premier et unique bloc C de ce document)
```c
/* Independent C-review correction for 0x48F020; not a new generation B.
 * Frozen generation A and neutral evidence are deliberately unchanged.
 * Native bytes SHA-256:
 * F9531FFBCF5E2663971762983F3AFBC20B4674E86649A1EF39CF817A8324F92E
 *
 * Observation contract: ordered memory accesses and the numeric FULL EAX
 * result. This is an explicit-backend state projection, not universal ISO-C
 * equivalence, an ABI trampoline, or a native-runtime replacement.
 * The uint8_t API in A was admissible for an explicitly AL-only projection;
 * its assertions about idx occupying EAX[31:8] were not admissible.
 */
#include <stdint.h>

/* Backend must implement little-endian M32, byte M8, coherent address aliases,
 * and ordered calls. Native MMIO/fault/concurrency behavior is not established.
 * In particular, 0x01D2A230 == 0x01D2A228 + 8: preserve the initial M32 read
 * before the subsequent byte store, including indices 8, 9, 10 and 11.
 */
extern uint8_t  MEM8(uint32_t addr);
extern uint32_t MEM32(uint32_t addr);
extern void     SET_MEM8(uint32_t addr, uint8_t value);

uint32_t sub_48F020(void)
{
    /* I1 A1 30 A2 D2 01: read all four bytes, not merely the low byte. */
    uint32_t initial = MEM32(0x01D2A230u);

    /* I2 25 FF 00 00 00: upper 24 EAX bits become ZERO. No shift. */
    uint32_t idx = initial & 0xFFu;

    /* I3 8D 88 28 A2 D2 01: address calculation only, stride 1. */
    uint32_t addr = 0x01D2A228u + idx;

    /* I4 8A 80 28 A2 D2 01: AL replacement makes full EAX equal to b,
     * because EAX[31:8] was already zero. */
    uint8_t b = MEM8(addr);

    /* I5 8B D0; I6 81 E2 FF 00 00 00: EDX is zero-extended original b. */
    uint32_t edx = (uint32_t)b;

    /* I7 FE C0; I8 88 01: increment only AL, wrapping modulo 256;
     * store at the saved address, not at an address using the new AL. */
    SET_MEM8(addr, (uint8_t)((uint32_t)b + 1u));

    /* I9 8A 82 F8 97 B6 00: original b selects the byte AFTER the store. */
    uint8_t al = MEM8(0x00B697F8u + edx);

    /* I10 C3: native EAX == zero_extend_32(al), AX == zero_extend_16(al).
     * An AL-only harness may explicitly narrow this result to uint8_t. */
    return (uint32_t)al;
}

/* Excluded observations: final ECX = addr, final EDX = b, EFLAGS, ESP/return
 * address mechanics and backend/native fault behavior. There are no callees
 * or explicit argument/register inputs in the original instruction stream.
 * RET consumes the near return address, purges zero argument bytes (C3).
 * Final arithmetic flags: CF=0; OF=(b==0x7F); ZF=(b==0xFF);
 * SF=bit7((b+1)&255); AF=((b&15)==15); PF=even parity of (b+1)&255.
 * These flags are NOT implemented by the C projection. EAX/ECX/EDX are native
 * volatile outputs; callback register clobbers are not a native-state model.
 * Concrete native slot/table ranges do not intersect; an abstract backend
 * mapping that introduces aliases must still respect the ordered accesses.
 */
```

## Résumé du contrat (concordant avec le C ci-dessus)

- **Projection** : accès mémoire ordonnés + résultat EAX complet, rien d'autre. Ce C est une projection d'état à backend explicite, pas une équivalence ISO-C universelle, pas un trampoline ABI, pas un remplacement runtime natif.
- **Zero-extension EAX complète** : I2 `AND 0xFF` met EAX[31:8] à zéro (les 24 bits hauts deviennent ZERO, aucun shift) ; I4/I7/I9 ne réécrivent que AL ; le retour natif est EAX = zext32(octet final), AX = zext16. Le C retourne `(uint32_t)al` — projection pleine largeur par défaut, sans résidu haut ; un harnais AL-only peut explicitement réduire en uint8_t.
- **Ordre des accès** : lecture M32 `MEM32(0x01D2A230)` → lecture octet `MEM8(addr)` → écriture octet `SET_MEM8(addr, b+1)` → lecture table `MEM8(0x00B697F8 + edx)`.
- **Index table = ancien octet ; adresse d'écriture = adresse sauvegardée (ECX à I3)** : `edx` porte l'octet lu AVANT incrément et sélectionne la table APRES l'écriture ; le store se fait à `addr` calculé à I3, pas à une adresse dérivée du nouvel AL.
- **Alias idx 8..11** : `0x01D2A230 == 0x01D2A228 + 8` ; pour idx 8..11, la fenêtre d'octets recouvre `0x01D2A230..0x01D2A233`. Le C préserve la lecture M32 initiale avant l'écriture octet suivante ; le backend (little-endian, alias d'adresses cohérents) doit maintenir cet ordre. idx 8 peut modifier le prochain sélecteur, idx 9..11 ses octets hauts (masqués à la prochaine invocation).
- **Bornes** : idx 0..255, incrément modulo 256 (bouclage 255→0 sans retenue haute) ; aucun shift/rotate (règle `&31` non exercée) ; plages natives slot/table concrètes disjointes (un backend abstrait introduisant des alias doit quand même respecter l'ordre des accès).
- **Hors projection** : flags finaux (CF=0 ; OF=(b==0x7F) ; ZF=(b==0xFF) ; SF/AF/PF issus de l'incrément 8 bits), ECX final = addr, EDX final = b, mécanique ESP/adresse de retour, comportement fault/MMIO/concurrence natif — non modélisés par le C.
- **Backend externe non fourni, non validé** : `MEM32`/`MEM8`/`SET_MEM8` sont de simples déclarations externes ; le backend doit implémenter M32 little-endian, M8 octet, alias cohérents et ordre des appels. Ces helpers ne sont pas des appels natifs observés ; le comportement MMIO/fault/concurrence natif n'est pas établi.
- **Aucune équivalence validée** : conclusion statique uniquement — pas de compilation, pas d'équivalence ISO/native/runtime, aucun test effectué.

## Bornes de ce candidat

- Document produit par propagation mécanique déterministe (P2_propagate, 2026-10-10) depuis le manifest exclusif et ses fichiers listés (hashes vérifiés) ; aucune nouvelle analyse, aucun vote, aucune génération de C.
- Promotion de fichier, push IDB, rename, SetType, commit : interdits à ce niveau ; `parent_gate_required = true`, `IDB_push_done = false`.


## Gate parent natif 2026-10-10 — clôture

Les mentions candidate/pending de la provenance sont historiques et supersédées par ce gate. §5.6 PASS statique borné : 10/10 instructions, 41 octets et source SHA natif f9531ffbcf5e2663971762983f3afbc20b4674e86649a1ef39cf817a8324f92e. Parent vérifie EAX haut zéro (AND FF), adresse ECX capturée avant AL, ancien byte EDX, ordre M32→M8→store8→table8, zéro CALL/args, RET C3, stride1. 71 xrefs CODE CALL type17, ancres réelles 483190 (EAX/quartiles), 48CBD6 (EAX/idiv5), 4942CC (AL). Pas de condition signée ni shift dans la primitive ; consommation caller distincte. Premier et unique fence C exact, SHA31db377a982f9b409e4d1546e7be5c84110f2c34722ec5c6fb229276951e911a. Confiance LIKELY, contexte post-freeze concordant sans élargir les garanties numériques ni le domaine ; A==V, pas de trigger B/R. Backend/flags/registres hors projection/compilation/native/ISO/runtime restent non prouvés. Aucun test runtime. Preuve parent locale parent_gate_native.json SHAa1148e8b77d17b1bc07c79bc9ae1af43ad64afb1cee57a47f9c91746b06b6356.
