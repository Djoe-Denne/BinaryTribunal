# 0x701220 — C R, réconciliation indépendante

## Périmètre, provenance et verdict

Projection exclusivement lue : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g02/0x701220/C/`. A/B, compaction, packet original, deux slices ASM, slice bytes et métadonnées ont été lus intégralement par lectures bornées. Aucun autre volet, résultat voisin, index ou service natif consulté.

- A : session `ses_ed3e1722fffexGwBtTNU06mnTr`, `openai/gpt-6.1-sol`, `high`; hash déposé `fec4ec898bec2db97e1c7706f71ec0e199b84f2c540c5a39801e367b6857a0f9`.
- B : session `ses_ed3e16d47ffelNw8YGqdd5QMLB`, `opencode-go/gpt-6-luna`, `medium`; hash déposé `10f8602d8b6a4b14a1bb6e118eaa6b75a5a6f929af2a8b41a5bb144e29aa253e`.
- Packet : `5a2d2dd11b9e5f5d5e3ec79fd236f5bbc03a85ec1d9b7065538ef166905b9141`; compaction : `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`.
- EXE PE32 : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; export `2026-10-11T16:38:25.140966+00:00`.
- Les deux auteurs indépendants et leurs modèles/sessions sont enregistrés par le parent dans le manifest. Les hashes du native-manifest concordent avec ceux du manifest R. Aucun auteur absent ni incohérence de hash déclarée constaté. **Les hashes de fichiers ne sont pas recalculés ici** : aucune primitive de hash/fichier brute autorisée disponible; le parent reste chargé de la vérification effective et du hash du livrable.

**Verdict local : C réconcilié complet sous ABI cdecl i386 ordinaire; haute confiance sur les instructions/largeurs/dataflow.** Pas de conflit natif local résiduel. Contrat mathématique des deux callees, type source du retour et sémantique métier restent **UNCERTAIN** au-delà des faits du gel. Aucun PASS §5.6 final ni promotion revendiqué.

## Convergences, divergences et erreurs communes recherchées

| Point | A / B | Arbitrage par bytes/ASM |
|---|---|---|
| Entrée angle | A prend un slot `uint32_t`, extrait/signe low16; B prend `int16_t`. | `0F BF 7C 24 10` à 70122B lit seulement un WORD et le signe en DWORD. Les deux donnent le même angle pour les appels ordinaires correctement abaissés; aucune preuve du prototype source. R retient le slot brut pour expliciter l'indépendance de ses 16 bits hauts. |
| Destination / alias / alignement | A : packed/may_alias/volatile; B : casts `uint32_t *` puis `uint16_t *`, non volatile. | L'ASM ne prouve ni alignement ni absence d'alias. B n'offre pas en C standard les garanties nécessaires pour destination non alignée/cross-type, ni pour l'ordre/largeur des stores après optimisation. R retient les adapters GNU d'A, sous validation du code émis. Ce n'est pas une assertion MMIO. |
| Ordre et taille mémoire | Accord : cinq DWORD clears puis cinq WORD stores. | Accord vérifié indépendamment : opcodes `89` sans préfixe aux clears, `66` à tous les coefficients. 20 octets écrits, pas une simple matrice de 18 octets. Pas de `memset`/boucle/struct assignment substitué. |
| Appels et nom | A lie par adresses génériques; B emploie les noms sine/cosine. | Rel32 re-dérivés : 701244 + signed(FFE6BEEC) = 56D130; 70124C + signed(FFE6BEB4) = 56D100. R conserve ces deux appels opaques. Noms et commentaires ne prouvent pas leurs algorithmes. |
| Wrap et registres partiels | Accord : `0u - sine`, AX/DX/BX pour les stores, EAX complet au retour. | `F7 DA` à 701251 est NEG EDX 32 bits; les stores ne modifient pas EAX. R garde le wrap unsigned et ne signe/normalise pas le retour. Vérification indépendante, pas vote. |
| Modèle de stack des deux appels | Les deux C peuvent nettoyer chaque argument séparément, contrairement à l'ASM. | Native pousse le premier angle, puis un second en conservant le premier; `ADD ESP,8` unique. Valeurs et ABI identiques sous cdecl ordinaire; comportement d'un callee inspectant les slots sans argument non couvert. Limite explicite conservée. |
| Lecture métier | A conditionne rotation/Q12; B donne le nom sémantique directement mais avertit sur labels. | R conditionne le nom : pattern de coefficients démontré; sinus/cosinus, unité angulaire, usage actif/passif ou row/column des consommateurs non démontrés par les bodies absents. |

Erreurs communes expressément exclues : aucune substitution `sin`/`cos`, aucune réduction d'angle, clamp ou guard; pas de retour destination, pas de réduction du retour à AX, pas de NEG signé susceptible d'overflow C, pas d'omission des octets +18/+19. L'accord A=B ne fournit aucune preuve supplémentaire. Même leurs stores concordants ont été contrôlés contre les bytes.

## C complet réconcilié

C pour GNU-compatible **i386 little-endian**, `stdint.h`, `cdecl`, accès packed/may_alias. Les adapters sont des types d'accès locaux, pas de nouveaux appels natifs. `volatile` sert à conserver les dix opérations de mémoire ordonnées; leur largeur effective doit être vérifiée par le parent dans l'ASM compilé. Aucun `restrict` ni exigence d'alignement supplémentaire.

```c
#include <stdint.h>

typedef struct __attribute__((packed, may_alias)) {
    uint32_t value;
} access_u32;
typedef struct __attribute__((packed, may_alias)) {
    uint16_t value;
} access_u16;

/* Bind to the EXISTING native targets; no replacement implementations.
 * Observed interface: one sign-extended angle DWORD, result bits in EAX.
 * Actual helper effects, including x87 environment, must remain intact.
 */
extern uint32_t __attribute__((cdecl)) sub_0056D130(int32_t angle);
extern uint32_t __attribute__((cdecl)) sub_0056D100(int32_t angle);

/* Raw slot/result representation, not a reconstructed source prototype. */
uint32_t __attribute__((cdecl)) sub_00701220(uint32_t angle_slot,
                                          void *destination)
{
    unsigned char *const p = (unsigned char *)destination;
    const uint32_t low16 = angle_slot & UINT32_C(0xFFFF);
    const int32_t angle = (int32_t)(low16 ^ UINT32_C(0x8000))
                        - INT32_C(32768);
    uint32_t sine_bits;
    uint32_t cosine_bits;
    uint32_t neg_sine_bits;

    ((volatile access_u32 *)(p + 0x00))->value = UINT32_C(0);
    ((volatile access_u32 *)(p + 0x04))->value = UINT32_C(0);
    ((volatile access_u32 *)(p + 0x08))->value = UINT32_C(0);
    ((volatile access_u32 *)(p + 0x0C))->value = UINT32_C(0);
    ((volatile access_u32 *)(p + 0x10))->value = UINT32_C(0);

    sine_bits = sub_0056D130(angle);
    cosine_bits = sub_0056D100(angle);
    neg_sine_bits = UINT32_C(0) - sine_bits;

    ((volatile access_u16 *)(p + 0x00))->value = UINT16_C(0x1000);
    ((volatile access_u16 *)(p + 0x08))->value = (uint16_t)cosine_bits;
    ((volatile access_u16 *)(p + 0x0E))->value = (uint16_t)neg_sine_bits;
    ((volatile access_u16 *)(p + 0x0A))->value = (uint16_t)sine_bits;
    ((volatile access_u16 *)(p + 0x10))->value = (uint16_t)cosine_bits;

    return cosine_bits;
}
```

La conversion de low16 ne dépend pas d'un narrowing unsigned→signed : le cast est toujours dans [0,65535], la soustraction dans [-32768,32767]. `uint32_t` assure NEG modulo 2^32, y compris 0x80000000; les casts `uint16_t` conservent exactement low16. Pas de AL utilisé, pas de shift, pas de multiplication, pas d'overflow signé. Les stores AX ne changent pas EAX; BX/DX ne sont pas des retours supplémentaires. Il n'y a aucune opération FP propre à la fonction. Aucune normalisation, sauvegarde/restauration ou modification inventée du contrôle x87 : les mêmes callees doivent exécuter leurs effets réels.

## Couverture native et ABI

Chunk unique `[0x00701220,0x0070126C)` : **76/76 bytes, 29/29 instructions, 1/1 bloc CFG**, aucune branche/successor ni autre chunk dans le packet. Les trois lignes de native-bytes concaténées égalent le hex du chunk original; comptage et deux destinations rel32 contrôlés arithmétiquement.

| Adresses / instructions | Couverture |
|---|---|
| 701220 PUSH EBX; 701221 PUSH ESI | Sauvegardes ABI des nonvolatiles. |
| 701222 MOV ESI,[ESP+10h] | Destination DWORD capturée avant toute écriture; slot entry ESP+8. |
| 701226 XOR EAX,EAX; 701228 MOV ECX,ESI | Zéro des stores; destination de travail. |
| 70122A PUSH EDI; 70122B MOVSX EDI,word [ESP+10h] | Sauvegarde; angle low16 entry ESP+4 lu/signé avant clears. |
| 701230 MOV [ECX],EAX; 701232 PUSH EDI | Premier DWORD clear; préparation argument du premier appel. |
| 701233, 701236, 701239, 70123C | Quatre autres DWORD clears à +4,+8,+0C,+10, dans cet ordre. |
| 70123F CALL 56D130 | Premier appel avec angle signé DWORD. |
| 701244 PUSH EDI; 701245 MOV EBX,EAX; 701247 CALL 56D100 | Même angle; premier EAX conservé intégralement dans EBX avant second appel. |
| 70124C MOV EDX,EBX; 70124E ADD ESP,8; 701251 NEG EDX | Copie premier résultat, nettoyage caller des deux slots, négation 32 bits. |
| 701253, 701258, 70125C, 701260, 701264 | WORD writes : +0=1000h, +8=AX, +0E=DX, +0A=BX, +10=AX. |
| 701268 POP EDI; 701269 POP ESI; 70126A POP EBX; 70126B RET | Restauration nonvolatiles; plain RET/caller cleanup des args de cette fonction, EAX intact. |

Entrée ESP=S : return address à S, premier slot à S+4, destination à S+8. Après les deux premiers pushes, le load `[ESP+10h]` vise S+8; après EDI push, le MOVSX `[ESP+10h]` vise S+4. Après les deux appels, ADD ESP,8 ramène au niveau des trois sauvegardes, ensuite restaurées. Pas de local frame ni RET imm. EBP n'est pas touché par ce body. Le C exige des callees ordinaires respectant EBX/ESI/EDI et un abaissement i386 cdecl préservant les nonvolatiles.

Les seuls accès data explicites hors stack/calls sont les dix stores; aucune lecture destination ni accès global explicite. Les cinq DWORD clears couvrent +0..+19. Les cinq WORD stores arrivent après les deux calls, en ordre **0,8,14,10,16**, non en ordre croissant. Les valeurs antérieures du buffer ne sont jamais relues. Angle et destination sont déjà capturés avant le premier store. Un callee pouvant toucher une région aliasée n'est pas déclaré pur; ses effets ne sont pas effacés. En particulier, les bytes non réécrits après les appels ne peuvent être garantis zéro si un callee les modifie.

## Contrat local et preuves (sans verdict sémantique voisin)

Rôle démontré : initialise un buffer writable de 20 octets et insère cinq coefficients low16 issus d'une constante et de deux résultats scalaires opaques. Entrées observées : angle signé low16 d'un slot DWORD, destination DWORD. Effets observés : dix stores, deux calls ordonnés; retour machine résiduel = EAX complet de 56D100. Type source/usage intentionnel de ce retour **UNCERTAIN**.

Sous l'hypothèse contextuelle que 56D130/56D100 fournissent sin/cos Q12, les neuf premiers WORDs disposés en trois triplets sont :

```text
1000h  0        0
0      low16(C) low16(S)
0      low16(-S) low16(C)
```

Nom proposé **conditionnel** : `Mat3S16_MakeRotX_Q12`. Preuve 1 : coefficient fixe en première position, couples égaux sur les deux autres diagonales et coefficients opposés aux offsets +0A/+0E isolent la première coordonnée dans ce layout. Preuve 2 : unity 0x1000 concorde avec l'échelle 4096 documentée dans la compaction pour les deux cibles effectivement appelées. Cette seconde preuve est contextuelle, pas une vérification des bodies. Orientation géométrique précise et convention des consommateurs restent **UNCERTAIN**; aucune correction arbitraire des signes.

Sept ancres exactes :

1. **701222 / 70122B**, bytes `8B 74 24 10` / `0F BF 7C 24 10` : largeur pointer/angle et ordre de capture.
2. **701230–70123C** : cinq MOV DWORD, offsets 0,4,8,0C,10; footprint de 20 octets et initialisation avant calls.
3. **70123F / 701247**, displacements `EC BE E6 FF` / `B4 BE E6 FF` : cibles 56D130 puis 56D100, indépendamment de leurs labels; native-metadata `code_targets` lignes 254–257 concorde.
4. **701245 / 70124C / 701251**, `8B D8` / `8B D3` / `F7 DA` : sauvegarde sine bits, copie et NEG DWORD.
5. **701253–701264**, opcodes préfixés `66` : placement, signes et largeur WORD des cinq coefficients.
6. **70124E / 701268–70126B**, `83 C4 08` / `5F 5E 5B C3` : nettoyage stack, nonvolatiles, retour EAX complet.
7. **xref 701336→701220 depuis 701310** et **701479→701220 depuis 701430**, native-metadata lignes 217–228 : fonction effectivement appelée comme helper. Xrefs sans ASM caller ne prouvent pas retour utilisé ni interprétation métier.

## Limites et contrôles réservés au parent

- Le C est une traduction source sous ABI ordinaire, **pas une émulation du processus x86**. L'ordre exact des sauvegardes/pushes, le maintien du premier slot pendant le second call, les flags et résidus des registres volatiles ne sont pas reproduits instruction par instruction. Un alias pathologique avec la stack active, un callee inspectant des slots/registres hors ABI, exception/fault timing, MMIO ou interleavings asynchrones demanderaient un modèle natif distinct. Aucun comportement de cette sorte n'est établi ici.
- Destination : stockage ordinaire writable couvrant 20 octets; la traduction ne rajoute pas de guard. Le langage C ne couvre pas une région d'objet franchissant le wrap de l'espace d'adresses; seuls les calculs numériques natifs utiles ici (NEG/low16) ont un wrap explicite. Aucune allocation/alignment/type struct d'origine prouvé.
- Les bodies des callees et ASM callers ne sont pas dans cette projection. Math exact, arrondis, précision/exceptions et état x87/global des helpers non revalidés. Les appels opaques préservent cette dépendance; aucune certitude métier inventée.
- Packed/may_alias/volatile sont une convention d'implémentation GNU i386, non du C portable. Parent : vérifier binding des deux cibles, cdecl et ASM compilé (largeur/ordre exact des stores et absence de réordonnancement FP), ainsi que les hashes source/output. Aucune compilation/exécution effectuée.
- Tests suggérés au parent si autorisés : slots 0x00008000/0xFFFF8000/0xDEAD7FFF; helper bits 0x80000000/0xFFFFFFFF et cosine avec hauts 16 bits non nuls; destination non alignée, buffer de 20 octets et canaries après +19; trace des dix stores et des deux calls. Suggestions, pas résultats PASS.
- Contrôle §5.6 natif final, promotion, IDB/save/readback et intégration restent exclusivement au lead. Aucune mutation IDB/Git/ledger/registre/config/live réalisée.
