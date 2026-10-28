# 0x45E610 — contrat sémantique final R (2+1)

## Verdict et provenance

**CERTAIN : mécanique locale et nom descriptif. UNCERTAIN : mapping matériel exact, statut métier et prototype source historique.** L'interprétation AVSZ4/profondeur reste **LIKELY contextuelle**, sans promotion de conformité matérielle. Aucun CONFLICT mécanique résiduel.

Projection exclusivement consultée : `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g02/0x45E610/semantic/`. A et B sont présents, déposés par le parent après deux sessions indépendantes déclarées :

| Auteur | Session | Model.Ref | SHA-256 déclaré |
|---|---|---|---|
| A | `ses_ed3e1ac7cffeIWVgq5a9RufF09` | `openai/gpt-6.1-sol`, medium | `2467db7f1661c3ca477b064a575dd139ed8a630da25955b5668eea5213174685` |
| B | `ses_ed3e1a980ffeI7iDUBK72XHQp7` | `openai/gpt-6.1-sol`, medium | `34bb51a2dbfa66bf5bf110fcc7dc98dc006270e6db9b5ae412a10168e3b1dbd7` |

Gel packet : `942cc92944c0c0364bd9efa7a43e04b381f5fc1cdca6710c180140ba7b5af909`. Compaction : `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`. Les références du manifest R, du native-manifest et des candidats sont cohérentes. SHA-256 non recalculés : aucun accès brut/hash de fichier disponible dans le catalogue autorisé ; contrôle cryptographique final laissé au parent, sans prétendre l'avoir effectué. Aucune incohérence observée dans les déclarations ou les représentations ASM/bytes.

Lecture complète : manifest R 1–72 ; A 1–46 ; B 1–41 ; compaction 1–24 ; native-manifest 1–25 ; ASM 1–18 ; bytes 1–3 ; metadata 1–3286 ; packet original 1–3294. Les deux JSON ont été lus par plages successives sans lacune jusqu'à leur accolade finale. Les indications de pagination de `read` n'ont pas été traitées comme fins de fichier. Le catalogue n'expose pas Context Mode ; les lectures bornées expressément demandées ont été utilisées, sans index ni service externe. Aucun autre volet/candidat/historique consulté.

Couverture : **18/18 instructions, 86/86 octets, 1/1 chunk, 1/1 bloc** `[0x45E610,0x45E666)`, RET à `0x45E665`, zéro branche et zéro appel. Les octets du packet et de la slice correspondent à l'ASM ; notamment `0F BF 15` = MOVSX WORD vers EDX, `0F AF C2` = IMUL EAX,EDX, `C1 E8 0C` = SHR EAX,12 et `C3` = RET proche sans immédiat.

## Rôle et nom retenu

**`GlobalSum4U16_MulS16_Shr12_ClearDword_Store2`** : extraire quatre u16 depuis quatre slots DWORD globaux, les sommer, multiplier modulo 2^32 par un coefficient s16 global, décaler logiquement de 12, publier le même résultat dans deux DWORDs et effacer un troisième DWORD avant multiplication.

Deux preuves distinctes fondent ce nom : quatre AND `0xFFFF` et trois ADD établissent la somme u16 ; MOVSX WORD, IMUL32 et SHR12 établissent le coefficient s16 et le traitement du produit. Les trois stores établissent ClearDword/Store2. Le nom ne suppose ni moyenne, ni profondeur, ni registre matériel FLAG. Le label exporté et les annotations ne sont pas des preuves.

## Contrat binaire observable

### Entrées, ordre et largeurs

Sur exécution normale, aucune valeur entrante de registre général ni argument stack n'est consommé comme donnée. Cinq lectures mémoire, dans cet ordre exact :

1. DWORD `[0x1CA8A5C,0x1CA8A60)` vers EAX ;
2. DWORD `[0x1CA8A58,0x1CA8A5C)` vers ECX ;
3. DWORD `[0x1CA8A54,0x1CA8A58)` vers EDX ;
4. DWORD `[0x1CA8A50,0x1CA8A54)` vers ECX, après la première ADD ;
5. WORD `[0x1CA92F4,0x1CA92F6)` sign-étendu vers EDX, après les deuxième ADD et quatrième AND, avant la troisième ADD.

Les quatre premiers accès sont réellement des lectures 32 bits : les remplacer par quatre accès WORD change la trace mémoire/fautes possible. Seuls leurs 16 bits bas participent au résultat. Le stride des slots est **4**, non 2 ; pas de boucle ni FIFO décalée ici. Le coefficient ne lit pas le WORD voisin `0x1CA92F6`.

En désignant par `a,b,c,d` les low16 des lectures 1–4 et par `K` la valeur signée du WORD lu en cinquième :

```
S = ((a + b) + c) + d          // 0 <= S <= 262140
P = (S * K) modulo 2^32       // -32768 <= K <= 32767
R = unsigned32(P) >> 12       // 0 <= R <= 0xFFFFF
```

L'IMUL deux opérandes conserve uniquement les 32 bits bas ; le wrap précède SHR. Le produit mathématique peut dépasser 32 bits signés ou non signés. Aucun overflow C signé ne doit être introduit. SHR n'est ni SAR, ni une division signée, ni un décalage de produit 64 bits suivi de troncature. Aucune saturation u16, aucune garde sur K/S et aucun ajustement d'arrondi ne figurent dans ce bloc.

### Effets et sorties

Après toutes les lectures et la troisième ADD, écritures dans cet ordre :

1. DWORD `[0x1CA92F8,0x1CA92FC)` = 0, **avant IMUL** ;
2. calcul P puis R ;
3. DWORD `[0x1CA8A2C,0x1CA8A30)` = R ;
4. DWORD `[0x1CA8A70,0x1CA8A74)` = R ;
5. RET.

Les huit plages de données lues/écrites sont disjointes aux adresses linéaires données ; aucun pointeur paramétrable, alias local ou dépendance store→load. Ne pas généraliser à un snapshot atomique : aucune synchronisation ; d'autres agents d'exécution peuvent modifier les globals entre lectures ou observer les sorties entre stores. Le DWORD effacé reste zéro même si IMUL déborde, en l'absence d'écriture extérieure ; les flags CPU ne sont pas sauvegardés dans ce DWORD. Il n'est pas prouvé que ce DWORD soit un « statut » logiciel/matériel.

À RET : **EAX entier = R**, ECX = d, EDX = signextend16(coefficient), EBX/ESI/EDI/EBP inchangés. Aucun MOV AL/AX ni retour partiel : AL=R&255 et AX=R&65535 sont seulement des vues du résultat EAX. ESP n'est pas modifié avant RET ; RET lit l'adresse de retour puis avance ESP de 4 en x86-32. Une signature descriptive `uint32_t __cdecl f(void)` convient au contrat de résultat disponible, mais ni l'usage de ce résultat par les callers, ni le type retourné historique, ni le choix cdecl contre toutes les autres conventions sans argument ne sont établis. Aucun argument ou callee à inventer.

Les flags arithmétiques en sortie sont ceux de SHR12, les MOV/RET n'y changeant rien : CF=bit11(P), SF=0, ZF=(R==0), PF=parité paire de l'octet bas de R ; OF/AF indéfinis pour ce décalage multi-bit. Les autres flags non affectés par ces instructions restent inchangés. Aucun x87/SSE ni instruction de contrôle FPU : environnement x87, pile/valeurs x87, exceptions préexistantes et mode d'arrondi inchangés ; aucun FINIT/FWAIT à ajouter.

## Réconciliation : convergences, divergences et erreurs communes recherchées

| Point | A / B | Décision fondée sur le natif |
|---|---|---|
| Arithmétique | Accord : u16×s16, wrap32 puis SHR12 | Conservé après redérivation opcodes, pas par vote. `0F AF C2` n'est pas un produit EDX:EAX ; `C1 E8 0C` exclut SAR. |
| Largeur/ordre/stride | Accord : DWORD masqués, WORD coefficient, stride4, clear puis stores2 | Conservé par les opérandes absolus et l'ordre des 18 instructions. Pas de réduction des lectures à WORD. |
| Nom descriptif | A : `Sum4U16_ScaleS16_Shr12_StoreGlobals` ; B : `GlobalSum4U16_MulS16_Shr12_ClearStatus` | Retenu un nom couvrant effacement et duplication, sans « Status » : le store zéro prouve DWORD, pas son rôle métier. |
| Moyenne/profondeur | A : profondeur agrégée ; B : profondeur moyenne compatible AVSZ4 | Pas une moyenne inconditionnelle. Si K=1024 et absence de wrap, R=floor(S/4), mais cet invariant n'est pas localement prouvé. « Profondeur »/AVSZ4 restent contexte LIKELY ; mapping exact UNCERTAIN. |
| Retour/ABI | Accord : EAX=R, compatible cdecl zéro argument, usage inconnu | Disponible mécaniquement, prototype historique non certifié. Les xrefs seuls ne prouvent pas une consommation d'EAX. |
| Flags/état partagé | A détaille flags ; B précise SF=0 et absence de synchronisation | Compléments compatibles : SHR12 limite R à 20 bits et donc SF=0 ; aucun LOCK/barrière. Aucun conflit à départager. |

Contrôles adversariaux des accords A=B : vérification du coefficient signé contre MOVSX (pas MOVZX), du produit bas32 contre IMUL deux opérandes (pas largeur64), du logical shift contre les bytes, du résultat déjà décalé dans **les deux** outputs, du clear qui n'est pas la capture des flags CPU, et de l'absence de clamp/guards dans tout le chunk. Aucun défaut mécanique commun trouvé. L'ancrage « Status » dans le nom B et toute lecture littérale de « moyenne » sont corrigés au niveau du contrat, même si les réserves dans son texte limitaient déjà ces interprétations.

Contre-exemples dérivés, non tests exécutés sur le natif : S=1,K=-1 donne P=`0xFFFFFFFF`, R=`0xFFFFF` (ni SAR=-1 ni clamp=0) ; S=262140,K=32767 donne P=`0xFFFA0004`, R=`0xFFFA0`, tandis qu'un produit large décalé donne `0x1FFFA0`. Le second calcul a été contrôlé en JavaScript pur dans Code Mode. Cela réfute deux normalisations séduisantes sans supposer qu'elles soient atteintes par les callers.

## Référence C complète du contrat de données

Cette traduction du seul bloc est fournie comme définition exécutable du contrat mémoire/résultat ; elle n'est pas une lecture ni une validation des livrables du volet C. C ciblé x86-32 avec `uint32_t` de rang au moins `int`, mapping des adresses absolues valide et accès volatile de largeur native. Le sign-extend est exprimé sans conversion hors plage ni branche. Pas d'appel ajouté (les macros sont des accès directs).

```c
#include <stdint.h>
#define RD32(a) (*(volatile uint32_t *)(uintptr_t)(a))
#define RD16(a) (*(volatile uint16_t *)(uintptr_t)(a))
#define WR32(a,v) (*(volatile uint32_t *)(uintptr_t)(a) = (v))

uint32_t __cdecl GlobalSum4U16_MulS16_Shr12_ClearDword_Store2(void)
{
    uint32_t eax = RD32(0x01CA8A5Cu);             /* 45E610 */
    uint32_t ecx = RD32(0x01CA8A58u);             /* 45E615 */
    uint32_t edx = RD32(0x01CA8A54u);             /* 45E61B */
    eax &= UINT32_C(0xFFFF);                     /* 45E621 */
    ecx &= UINT32_C(0xFFFF);                     /* 45E626 */
    edx &= UINT32_C(0xFFFF);                     /* 45E62C */
    eax += ecx;                                 /* 45E632 */
    ecx = RD32(0x01CA8A50u);                     /* 45E634 */
    eax += edx;                                 /* 45E63A */
    ecx &= UINT32_C(0xFFFF);                     /* 45E63C */
    uint32_t k_bits = RD16(0x01CA92F4u);         /* 45E642 */
    int32_t k = (int32_t)(k_bits ^ UINT32_C(0x8000))
                - INT32_C(32768);
    edx = (uint32_t)k;
    eax += ecx;                                 /* 45E649 */
    WR32(0x01CA92F8u, UINT32_C(0));              /* 45E64B */
    eax *= edx;                                 /* 45E655: modulo 2^32 */
    eax >>= 12;                                 /* 45E658: logical */
    WR32(0x01CA8A2Cu, eax);                      /* 45E65B */
    WR32(0x01CA8A70u, eax);                      /* 45E660 */
    return eax;                                 /* 45E665 */
}
#undef RD32
#undef RD16
#undef WR32
```

Limite du C : les variables portent des noms de registres pour la preuve, sans imposer leur allocation par un compilateur. EFLAGS, ECX/EDX finaux et RET exact sont des clauses natives ci-dessus, non une promesse d'identité instructionnelle du binaire compilé. Aucune compilation/test effectué. L'accès absolu relève de la plateforme, pas d'une portabilité ISO C ou d'une réentrance garanties.

## Preuves natives exactes (7 ancrages)

Tous les chemins abrégés sont dans la projection R précitée.

1. **`native-asm-001.txt:1–6,8,10`**, `0x45E610/615/61B/621/626/62C/634/63C` : quatre loads DWORD, quatre AND `0xFFFF`, opérandes absolus espacés de quatre ; extraction u16, largeur réelle et stride.
2. **ASM `:7,9,11–12`**, `0x45E632/63A/642/649` ; **`native-bytes-001.txt:2–3`**, `0F BF 15 F4 92 CA 01` : exactement trois additions et coefficient WORD sign-étendu.
3. **ASM `:13`**, `0x45E64B` ; bytes `:2–3`, `C7 05 F8 92 CA 01 00 00 00 00` : store DWORD zéro à 92F8 avant produit, aucune mise à jour ultérieure dans le bloc complet.
4. **ASM `:14–15`**, `0x45E655/658` ; bytes `:3`, `0F AF C2 C1 E8 0C` : IMUL bas32 puis SHR logique12, non produit64/SAR/clamp.
5. **ASM `:16–18`**, `0x45E65B/660/665` ; bytes `:3`, `A3 2C 8A CA 01 A3 70 8A CA 01 C3` : deux stores EAX DWORD, EAX inchangé jusqu'à RET sans nettoyage d'arguments.
6. **`0x45E610.json:11–25,3292–3294`** et **`native-metadata.json:11–17,3284–3286`** : chunk/bloc unique de 86 octets, 18 instructions, aucun successeur/code_target, confirmé par décodage intégral sans CALL/branche/x87.
7. **metadata `:19–30,217–222`** (packet `:27–38,225–230`) : xrefs code `0x547F65` dans `0x547E60`, `0x556291` dans `0x5561E0`, `0x5AA11F` dans `0x5A9C10`. Réutilisation de la feuille, sans preuve d'usage de retour ni de sémantique des globals. Le reste des xrefs a également été lu ; `0x7866D2` a un owner null, donc tous ne doivent pas être présentés comme des callers identifiés.

## Résiduels et limites de promotion

- **UNCERTAIN** : correspondance validée des globals avec SZ0..SZ3/ZSF4/OTZ/MAC0/FLAG. Le pattern somme4×coefficient>>12 et le contexte commun rendent AVSZ4 plausible ; les labels, notes et xrefs de la cible ne certifient pas cette correspondance.
- **UNCERTAIN** : source historique void/u32, convention exacte, consommation EAX/AL/AX versus sorties mémoire par les callers. Il faudrait des slices ASM callers dédiées, non présentes ici.
- **UNCERTAIN** : invariants runtime qui évitent K<0, wrap ou R>65535, et raison de l'absence de saturation. Il faudrait les producteurs natifs des inputs et consommateurs des outputs pour répondre ; aucune garde inventée.
- Aucun manque de capture ne bloque le **contrat mécanique**. Un complément doit passer par le lead si celui-ci exige un nom matériel plutôt que le nom descriptif prouvé.

Écriture limitée à ce fichier. Aucune mutation IDB/Git/ledger/registre/config/live ni délégation ; aucune validation §5.6/promotion effectuée. Le parent possède la vérification des hashes, les contrôles natifs finaux et toute intégration.
