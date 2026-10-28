# 0x50BF90 — C réconcilié R, g27/run01

## Périmètre et provenance

Réconciliation du **seul volet C**, sans lecture du volet sémantique voisin ni d'un verdict historique. Source de vérité : octets du chunk et 81 instructions natives, commentaires/noms IDA exclus des preuves. Entrée exclusive : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g27/C/`.

Le blocage initial de provenance a été levé par le manifeste fourni par le lead. `manifest.json` : SHA256 annoncé par le parent `799111f2027162791658101f5f7398570ee65828ac11209a467fa23f4ff67782`; checkpoint exclusif `msg_12be31170001b3JqulokpGSCsD`. Sessions A `ses_ed3fb725affeSP4CX39Mq2Ie1U`, B `ses_ed3fb6c81ffeV7SfJQSVTFzNyQ`, distinctes, dérivées du même checkpoint lecteur exclusif selon le receipt parent. Aucun auteur manquant ni contradiction de provenance constatée.

| Artefact gelé | SHA256 du manifeste parent |
|---|---|
| c_a.md | `c1751368ce04d6f3d9eddc2517fadd88ad98d365a670a022b72277d120cc5a5a` |
| c_b.md | `599c8a8fdf2d9dcfa5841ad8a45e06f0b598ca23e50332d2dbed510408cb73e2` |
| common-compaction.md | `7b885f8d258f5c0e8121e281427974d5c0c9b0ab73ff5a496b6d49a35b603c7f` |
| 0x50BF90.json | `523b578c584278d960cfc11a0b6a7040ae1ab80b26d0b8d26454e1190e26f678` |
| asm-01.txt | `3dce9d48c8ce6a2a583143026da748ffdb6864ee79e37461acde735202b47705` |
| asm-02.txt | `d2176b52122ac2151eeba51f52deaaafc50be6d014b134015f97fa5b998f2b9c` |
| asm-03.txt | `fb478606dfb661af88d4cef614daa19ce6ef3c596d56f700726689caa64fe397` |
| asm-04.txt | `5a8d52c6b719abe8d7f1ee80a3d2ba61db2ecad6be1888c73083e2fd2cd70340` |

EXE SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`; chunk `[0x50BF90,0x50C090)` = 256 octets, SHA256 `87e46f3c9d4a4887e644b74372ba88c60db247c499b5e2f347a81e654aa14921` rapporté par la compaction. Les hashes de fichiers ne sont pas recalculés ici : attestations parent, non faux contrôle cryptographique worker. ASM intégral lu dans les quatre fichiers bornés; hex et CFG lus dans le JSON. Aucun accès aux sources historiques citées par la compaction.

## Convergences, divergences et erreurs communes

Les décisions ci-dessous reposent sur les instructions, pas sur un vote A/B.

| Sujet | A / B | Décision R et preuve |
|---|---|---|
| Largeurs globales | Accord BYTE/WORD/DWORD | Retenues après contrôle des préfixes/opcodes : `66 89 2D` aux stores WORD, `66 09 05` à 50C034, `80 0D ... 02` à 50C046. Pas de store DWORD déduit d'un label. |
| Strides / shifts | Accord 0x9C, 0x14, 0x18, count&31 | Retenus : 50BFCB–D3, 50C05B, 50C04D, `D3 E0` à 50C00F/32 et OR BP,AX `66 0B E8` à 50C011. |
| Scratch `[S-4]` | A conserve DWORD/stack; B remplace par `b0` | **A retenu** : 50BFB9 écrit un BYTE, 50C053 recharge un DWORD réel. Les trois autres octets et les écritures aliasant ce scratch ne doivent pas être supprimés. ECX complet est un résultat machine même s'il est caller-saved. |
| Scratch `[S-8]` | A store/read; B substitue constante 1 | **A retenu** : 50C023 écrit DWORD 1, 50C027 écrit ensuite un global, puis 50C02E recharge le DWORD. Une adresse globale peut recouvrir le scratch; le reload reste obligatoire. |
| Compteur extérieur `[S+4]` | A mémoire; B variable locale / stores commentés | **A retenu** : `89 44 24 1C` à 50BFF7/50C05F et `8B 44 24 1C` à 50C057. Le slot argument est un état mémoire observable, possiblement altéré par les stores du corps. B n'est pas équivalent avec alias stack. |
| PUSH/POP et état machine | A slots mémoire/GPR; B commentaires | **A retenu** : les saves/restores sont des accès effectifs. L'ordre POP EDI → store WORD A5C → POP EBX, puis POP ESI → store BYTE A56 → POP EBP est observable sous alias. Ne pas garantir inconditionnellement la préservation des valeurs des registres sauvés. |
| CL final / nombre de groupes | B affirme toujours `b0` et exactement 1..256 groupes; A code exact mais certaines phrases restent non conditionnées | **Correction de prose** : CL vient du scratch relu après un groupe non vide; sans alias/altération il égale le byte initial. Le nombre initial vaut 1..256, mais le nombre effectivement parcouru n'est garanti égal à ce nombre que si `[S+4]` n'est pas altéré par les stores des records/globals. A=B sur l'analyse nominale ne prouve pas une propriété avec alias arbitraire. |
| Retour | A sortie état machine; B `uint32_t __cdecl` | Retenir EAX exact via état machine. Sur toute exécution atteignant normalement le tail, DEC EAX à 50C05E a donné zéro : EAX final = byte final, 0..255; AX = ce même byte. Aucun booléen ni contrat métier de retour établi. Le caller connu écrase EAX. |
| Réutilisation des pointeurs tail | Accord relecture | Retenue : 50C073 écrit A5A **avant** 50C07A recharge `[ESI+8]`; ne pas utiliser le pointeur capturé à l'entrée ou A60. |
| C portable / alias | A image mémoire GNU; B casts volatile scalaires | B ne prouve ni alignement ni alias C légal : `volatile` n'annule pas l'UB d'alignement/alias. Retenir le modèle GNU packed/may_alias avec limites de représentation explicites, pas une promesse de portabilité ISO ni d'accès atomique. |

**Contre-exemple concret à la constante CL de B**, sans fault ni code modifié : poser `S=0x01D99A88`, donc `[S-4]=0x01D99A84`; payload disjoint avec byte initial 5, `[p+0x11]=0`, `[p+0x10]=1`, pointeur `[p+8]` vers un record disjoint dont byte +3 = 0x88. 50BFB9 écrit 5 au scratch, 50C027 écrit 2 au même byte, 50C053 recharge ce byte 2 dans CL : 50C085 écrit **2**, pas 5, à A56. Les bytes supérieurs du scratch restent ceux de la mémoire d'entrée. C'est une divergence observable, pas seulement une différence esthétique de registre caller-saved.

Autre risque partagé à ne pas masquer : si `[S+4]` recouvre A84, le store de catégorie peut modifier le compteur extérieur; celui-ci est relu à 50C057. Un parcours supplémentaire ou une absence de terminaison est possible. Aucun bornage de validité/sécurité n'est ajouté au C.

## Reconstruction C complète corrigée

Traduction register/memory-level, **pas un remplacement natif directement linkable**. Le protocole natif est cdecl compatible : un DWORD argument à `[S+4]`, C3 sans nettoyage d'argument, caller `push` puis `add esp,4` selon la capture bornée rapportée par la compaction. L'interface hôte ci-dessous utilise un état machine pour conserver argument home, scratch partiel, sorties GPR et ret; son retour `void` ne qualifie pas le retour natif.

Contrat d'exécution : GNU C11, little-endian, bytes 8 bits, uint32_t 32 bits, support packed/may_alias, image mémoire plate de 4 GiB accessible, état `r` hors de cette image. Arithmétique d'adresses modulo 2^32. Tous les accès sont valides, ordinaires, non faultants, sans MMIO/concurrence/modification du code exécuté, sans effets de segmentation. Les accès WORD/DWORD ne traversent pas la fin de l'image. Les helpers représentent un accès de la largeur native; codegen/alignement hôte restent à valider par le lead. Les RMW sont séquencés read/write sans revendication d'atomicité ou de fidélité aux faults/interleavings x86. Pas de zéro inventé pour les octets de stack non initialisés.

```c
#include <stdint.h>
#include <limits.h>

#if CHAR_BIT != 8 || UINT_MAX != 0xffffffffU
#error Requires 8-bit bytes and 32-bit unsigned int
#endif
#if !defined(__BYTE_ORDER__) || __BYTE_ORDER__ != __ORDER_LITTLE_ENDIAN__
#error Requires little-endian GNU-compatible C
#endif

typedef struct __attribute__((packed, may_alias)) { uint16_t v; } Mem16;
typedef struct __attribute__((packed, may_alias)) { uint32_t v; } Mem32;
typedef struct {
    uint32_t eax, ebx, ecx, edx, esi, edi, ebp, esp, eip, eflags;
} X86State;

static inline uint8_t rd8(volatile uint8_t *m, uint32_t a)
{ return m[a]; }
static inline uint16_t rd16(volatile uint8_t *m, uint32_t a)
{ return ((volatile Mem16 *)(m + a))->v; }
static inline uint32_t rd32(volatile uint8_t *m, uint32_t a)
{ return ((volatile Mem32 *)(m + a))->v; }
static inline void wr8(volatile uint8_t *m, uint32_t a, uint8_t v)
{ m[a] = v; }
static inline void wr16(volatile uint8_t *m, uint32_t a, uint16_t v)
{ ((volatile Mem16 *)(m + a))->v = v; }
static inline void wr32(volatile uint8_t *m, uint32_t a, uint32_t v)
{ ((volatile Mem32 *)(m + a))->v = v; }
static inline uint32_t put8(uint32_t x, uint8_t v)
{ return (x & 0xffffff00U) | (uint32_t)v; }
static inline uint32_t put16(uint32_t x, uint16_t v)
{ return (x & 0xffff0000U) | (uint32_t)v; }
static inline int signed_le32(uint32_t a, uint32_t b)
{ return (a ^ 0x80000000U) <= (b ^ 0x80000000U); }

/* Last ADD ESP,8 overwrites all six arithmetic flags. Other EFLAGS
 * bits are unchanged by the represented instructions. Intermediate
 * flags need not be materialized: branch conditions below are exact. */
static inline uint32_t final_add8_flags(uint32_t f, uint32_t before,
                                       uint32_t after)
{
    uint32_t p = after & 255U;
    p ^= p >> 4; p ^= p >> 2; p ^= p >> 1;
    return (f & ~0x8d5U)
         | (uint32_t)(after < before)                  /* CF */
         | ((1U ^ (p & 1U)) << 2)                     /* PF */
         | ((before ^ 8U ^ after) & 0x10U)            /* AF */
         | ((uint32_t)(after == 0U) << 6)             /* ZF */
         | ((after >> 24) & 0x80U)                    /* SF */
         | (((~(before ^ 8U) & (before ^ after)) >> 20) & 0x800U);
}

void reconstruct_0050BF90(volatile uint8_t *m, X86State *r)
{
    uint32_t eax = r->eax, ebx = r->ebx, ecx = r->ecx, edx = r->edx;
    uint32_t esi = r->esi, edi = r->edi, ebp = r->ebp, esp = r->esp;
    uint32_t eflags = r->eflags, eip, t;
    int zero;

    /* 50BF90 .. 50BFF2 */
    esp -= 8U;                                      /* 50BF90 */
    esp -= 4U; wr32(m, esp, ebp);                    /* 50BF93 */
    esp -= 4U; wr32(m, esp, esi);                    /* 50BF94 */
    esi = rd32(m, esp + 0x14U);                      /* 50BF95 */
    ebp = 0U;                                       /* 50BF99 */
    wr32(m, 0x01d99a50U, esi);                       /* 50BF9B */
    wr16(m, 0x01d99a5cU, (uint16_t)ebp);             /* 50BFA1 */
    eax = rd32(m, esi + 8U);                         /* 50BFA8 */
    ecx = put8(ecx, rd8(m, esi));                    /* 50BFAB */
    wr32(m, 0x01d99a60U, eax);                       /* 50BFAD */
    eax = ecx;                                      /* 50BFB2 */
    eax &= 255U;                                    /* 50BFB4 */
    wr8(m, esp + 12U, (uint8_t)ecx);                 /* 50BFB9: only BYTE */
    wr16(m, 0x01d99a90U, (uint16_t)ebp);             /* 50BFBD */
    wr8(m, 0x01d99a6dU, 0);                         /* 50BFC4 */
    edx = eax + eax * 4U;                           /* 50BFCB */
    edx <<= 3;                                      /* 50BFCE */
    edx -= eax;                                     /* 50BFD1 */
    eax = 0x01d972c0U + edx * 4U;                   /* 50BFD3 */
    edx = rd32(m, esi + 12U);                        /* 50BFDA */
    wr32(m, 0x01d99a40U, eax);                       /* 50BFDD */
    eax = 0U;                                       /* 50BFE2 */
    eax = put8(eax, rd8(m, esi + 0x11U));            /* 50BFE4 */
    wr32(m, 0x01d99a74U, edx);                       /* 50BFE7 */
    eax += 1U;                                      /* 50BFED */
    if (signed_le32(eax, ebp)) goto L50C06E;         /* 50BFEE/F0 */

    /* 50BFF2 .. 50BFFB */
    esp -= 4U; wr32(m, esp, ebx);                    /* 50BFF2 */
    esp -= 4U; wr32(m, esp, edi);                    /* 50BFF3 */
    ebx = esi + 0x10U;                              /* 50BFF4 */
    wr32(m, esp + 0x1cU, eax);                       /* 50BFF7: argument home */

L50BFFB:
    eax = 0U;                                       /* 50BFFB */
    eax = put8(eax, rd8(m, ebx));                    /* 50BFFD */
    if (signed_le32(eax, 0U)) goto L50C057;          /* 50BFFF/C001 */
    /* 50C003 .. 50C008 */
    edx = rd32(m, ebx - 8U);                         /* 50C003 */
    edi = eax;                                      /* 50C006 */

L50C008:
    ecx = put8(ecx, rd8(m, edx));                    /* 50C008 */
    eax = 1U;                                       /* 50C00A */
    eax <<= (ecx & 31U);                             /* 50C00F */
    ebp = put16(ebp, (uint16_t)(ebp | eax));         /* 50C011: BP only */
    eax = put8(eax, rd8(m, edx + 3U));               /* 50C014: AL only */
    if (((uint8_t)eax & 8U) == 0U) goto L50C03B;     /* 50C017/19 */
    /* 50C01B .. 50C03B */
    ecx = 1U;                                       /* 50C01B */
    eax = put8(eax, (uint8_t)((uint8_t)eax >> 6));    /* 50C020: SHR AL */
    wr32(m, esp + 0x10U, ecx);                       /* 50C023 */
    wr8(m, 0x01d99a84U, (uint8_t)eax);               /* 50C027 */
    ecx = put8(ecx, (uint8_t)eax);                   /* 50C02C */
    eax = rd32(m, esp + 0x10U);                      /* 50C02E: real reload */
    eax <<= (ecx & 31U);                             /* 50C032 */
    t = rd16(m, 0x01d99a90U);                       /* 50C034: WORD RMW */
    wr16(m, 0x01d99a90U, (uint16_t)(t | eax));

L50C03B:
    ecx = put8(ecx, rd8(m, edx + 2U));               /* 50C03B */
    ecx = put8(ecx, (uint8_t)((uint8_t)ecx & 0x30U)); /* 50C03E */
    if ((uint8_t)ecx != 0x30U) goto L50C04D;         /* 50C041/44 */
    /* 50C046 .. 50C04D */
    t = rd8(m, 0x01d99a6dU);                        /* 50C046: BYTE RMW */
    wr8(m, 0x01d99a6dU, (uint8_t)(t | 2U));

L50C04D:
    edx += 0x18U;                                   /* 50C04D */
    edi -= 1U;                                      /* 50C050 */
    if (edi != 0U) goto L50C008;                    /* 50C051 */
    /* 50C053 .. 50C057 */
    ecx = rd32(m, esp + 0x14U);                      /* 50C053: DWORD, not BYTE */

L50C057:
    eax = rd32(m, esp + 0x1cU);                      /* 50C057 */
    ebx += 0x14U;                                   /* 50C05B */
    eax -= 1U;                                      /* 50C05E */
    wr32(m, esp + 0x1cU, eax);                       /* 50C05F */
    if (eax != 0U) goto L50BFFB;                    /* 50C063 */
    /* 50C065 .. 50C06E */
    edi = rd32(m, esp); esp += 4U;                   /* 50C065 */
    wr16(m, 0x01d99a5cU, (uint16_t)ebp);             /* 50C066 */
    ebx = rd32(m, esp); esp += 4U;                   /* 50C06D */

L50C06E:
    eax = put8(eax, rd8(m, esi + 0x10U));            /* 50C06E */
    zero = ((uint8_t)eax == 0U);                     /* 50C071 */
    wr8(m, 0x01d99a5aU, (uint8_t)eax);               /* 50C073 */
    if (zero) goto L50C084;                         /* 50C078 */
    /* 50C07A .. 50C084 */
    edx = rd32(m, esi + 8U);                         /* 50C07A: fresh pointer */
    eax = put8(eax, rd8(m, edx));                    /* 50C07D */
    wr8(m, 0x01d99a48U, (uint8_t)eax);               /* 50C07F */

L50C084:
    esi = rd32(m, esp); esp += 4U;                   /* 50C084 */
    wr8(m, 0x01d99a56U, (uint8_t)ecx);               /* 50C085 */
    ebp = rd32(m, esp); esp += 4U;                   /* 50C08B */
    t = esp; esp += 8U;                             /* 50C08C */
    eflags = final_add8_flags(eflags, t, esp);
    eip = rd32(m, esp); esp += 4U;                   /* 50C08F: C3 */

    r->eax = eax; r->ebx = ebx; r->ecx = ecx; r->edx = edx;
    r->esi = esi; r->edi = edi; r->ebp = ebp; r->esp = esp;
    r->eip = eip; r->eflags = eflags;
}
```

## Couverture native / ABI / résultats

Un chunk complet, 81/81 instructions et 15/15 blocs du CFG représentés. Pas de call ni branche indirecte interne; RET recharge l'adresse de retour réelle.

| Bloc [début, fin) | Transitions représentées |
|---|---|
| 50BF90–50BFF2 | signed JLE vers C06E / saves BFF2 |
| 50BFF2–50BFFB | compteur en mémoire → BFFB |
| 50BFFB–50C003 | groupe vide C057 / groupe non vide C003 |
| 50C003–50C008 | charge pointeur, EDI → C008 |
| 50C008–50C01B | masque BP, test bit3 → C01B / C03B |
| 50C01B–50C03B | scratch DWORD, catégorie, RMW WORD → C03B |
| 50C03B–50C046 | test byte masqué → C046 / C04D |
| 50C046–50C04D | RMW BYTE → C04D |
| 50C04D–50C053 | DEC EDI → C008 / C053 |
| 50C053–50C057 | recharge DWORD scratch → C057 |
| 50C057–50C065 | recharge/DEC/store compteur → BFFB / C065 |
| 50C065–50C06E | POP, store WORD, POP → C06E |
| 50C06E–50C07A | AL, TEST, store BYTE → C07A / C084 |
| 50C07A–50C084 | recharge pointeur/AL et store BYTE → C084 |
| 50C084–50C090 | POP, store BYTE, POP, ADD ESP, RET |

Avec S=ESP d'entrée : saved EBP S-12, ESI S-16, EBX S-20, EDI S-24; scratch DWORD S-8, scratch byte/DWORD S-4, argument/counter S+4. Sur terminaison, ESP=S+4 après RET, pas S+8. Le caller connu nettoie encore quatre bytes; une seule valeur poussée, aucune ambiguïté multi-argument.

50BFF0 est un JLE signé réellement représenté, mais sa condition est impossible sous les définitions natives EAX=zext8+1 (1..256), EBP=0. 50C001 est également signé; EAX=zext8, donc le saut correspond à un count nul. Les compteurs et toutes les adresses du C sont uint32_t pour éviter l'overflow signé et conserver le wrap. Le DEC/JNZ extérieur porte sur la valeur **relue**, pas nécessairement sur le count d'entrée. Le count interne est un byte capturé en EDI, non rechargé à chaque itération.

EAX final, sur terminaison normale, est le byte frais de `[ESI+0x10]` s'il est nul, sinon le byte frais du pointeur rechargé à `[ESI+8]`; il peut donc être zéro même si la branche non vide est prise. AL=AX=EAX numériquement dans ce cas, grâce au compteur final zéro, pas à MOVZX. L'unique caller gelé (xref 50A799, fonction 50A790) remplace EAX à 50A79E selon la capture rapportée par la compaction : cela ne prouve pas le type source. ECX complet reste exposé dans l'état, y compris les trois octets de scratch non initialisés explicitement. EDX est le curseur final ou le pointeur tail rechargé. Les quatre registres sauvés sont restaurés **depuis leurs slots**, avec altérations éventuelles sous alias.

Sans alias de scratch, la seconde accumulation est `WORD A90 |= low16(1U << (byte3>>6))`; avec alias du scratch S-8, elle utilise le DWORD réellement relu à 50C02E. Le premier masque utilise toujours count hardware `byte0 & 31`, puis tronque à AX : 16..31 ne contribuent pas, 32..255 réutilisent les counts 0..31. Aucun slot bound n'existe. A84 n'est pas reset inconditionnellement, A48 n'est pas touché sur la branche tail vide. Les autres bytes des globals partiellement écrits sont conservés.

## Rôle structurel et preuves (sans verdict sémantique du volet voisin)

Rôle directement observable : préparer un contexte global à partir d'un pointeur de payload, calculer une adresse de table indexée, parcourir deux niveaux de records et accumuler des masques/flags. Nom neutre proposé : `LatchPayloadContextAndAccumulateRecordMasks_50BF90`. Il est justifié indépendamment par le latch DWORD à 50BF9B et par SHL/OR BP à 50C00F/11 avec store final 50C066; il ne présuppose ni GF, ni Attack, ni cible métier.

1. **Latch** : 50BF9B, 50BFAD, 50BFE7 écrivent p, `[p+8]`, `[p+0xC]` dans A50/A60/A74, avec lectures/stores séquencés.
2. **Adresse indexée** : 50BFCB–50BFDD calculent `0x1D972C0 + 0x9C*zext8([p])` et écrivent A40; capacité/type de la table non prouvés.
3. **Deux niveaux** : 50BFF4/50C05B donnent le curseur extérieur +0x10/stride 0x14; 50C003/50C04D chargent le pointeur à -8 et avancent de 0x18.
4. **Masque WORD** : 50C008–50C011 ORent BP avec AX issu de `1 << (CL&31)`; 50C066 écrit le WORD A5C.
5. **Catégorie conditionnelle** : 50C017–50C034 testent bit3 de byte+3, écrivent son >>6 à A84, puis ORent AX dans WORD A90; la valeur shiftée vient du scratch rechargé.
6. **Flag de record** : 50C03B–50C046 testent `(byte+2 & 0x30)==0x30` et ORent BYTE A6D avec 2.
7. **Tail / identité** : 50C06E–50C085 écrivent A5A, conditionnellement A48 via un pointeur frais, puis CL à A56.

Confiance élevée pour les faits numériques/instructions et pour la reconstruction dans son domaine déclaré; **pas une certification d'exécution**. Le métier des records et des globals, les auteurs de +0x10/+0x11, les capacités des tables, la validité des pointeurs, les conventions source exactes de retour et la politique d'alias sont **UNCERTAIN**. Aucun CONFLICT instructionnel non tranché entre A/B ne subsiste; aucune confiance CERTAIN inventée pour les inconnues métier.

## Validation et limites à transmettre au lead

Effectué : confrontation manuelle des octets/opcodes, ASM intégral, stack displacements, arêtes CFG et ordre mémoire; réconciliation des deux textes et recherche de fausses conclusions communes. Aucun build, test, différentiel, live, hash local, mutation IDB/git/registre/ledger/config ou délégation. Le fichier ne remplace pas le contrôle natif final §5.6 du lead.

À vérifier par le lead : compilation GNU/ABI hôte; mémoire/GPR/stack complets contre natif; groupes vides/non vides; count 255 et count extérieur 256; shifts 15/16/31/32/255; stores BYTE/WORD entourés de sentinelles; scratch avec trois octets non nuls; alias stack/globals (notamment contre-exemple CL et compteur); relectures tail et slots sauvés. Hors domaine : faults, MMIO, concurrence, self-modification, segmentation/contrôle système. Une version struct-based simplifiée nécessiterait un contrat explicite de non-alias et des types vérifiés, absents du gel.

Hash de sortie à calculer par le lead conformément à la mission; aucune clôture native/promotion revendiquée.
