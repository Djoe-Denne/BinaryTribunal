# 0x7012C0 — contrat sémantique R réconcilié

## Verdict et périmètre

**CERTAIN pour la mécanique locale ; LIKELY pour l'interprétation rotation Z Q12 ; UNCERTAIN pour les propriétés trigonométriques exactes, la convention vectorielle et le retour source intentionnel.** Aucun conflit mécanique résiduel dans le gel. Pas de promotion native ni de validation finale §5.6.

Nom proposé : **`Mat3S16_MakeRotZ_Q12_PosSin01` (LIKELY)**. Le suffixe décrit le signe de l'emplacement (0,1) dans l'indexation ligne-major choisie, pas un sens physique de rotation. Nom mécanique possible sans hypothèse trigonométrique : `Build3x3_C_S_NegS_Unit4096`.

Lecture limitée à `inputs/ff8-decomp-semantics-20261011-r01/reconciliation/g02/0x7012C0/semantic/` : manifest, A/B, compaction, paquet original, deux slices ASM, slice bytes, manifest et metadata natives, tous lus intégralement et sans troncation. Réconciliation sémantique uniquement : aucun C de l'autre volet consulté ou produit.

Couverture : **29/29 instructions, 76/76 octets, 1/1 chunk `[0x7012C0,0x70130C)`, 1/1 bloc CFG, 30/30 xrefs entrants et 2/2 cibles directes**. Le paquet original, les slices et les métadonnées concordent en contenu ; les annotations de noms/commentaires ne sont pas utilisées comme preuves natives.

## Provenance et intégrité

Deux auteurs indépendants déposés par le parent, sessions distinctes :

| Auteur | Session native | Modèle effectif déclaré | SHA-256 déclaré du candidat |
|---|---|---|---|
| A | `ses_ed3e15452ffeL6JFEjfokVPKcB` | `openai/gpt-6.1-sol`, medium | `a6404191758848a74deac982b16d6cbc0ce434e19f4d79ca7675bbe54d94e429` |
| B | `ses_ed3e14f45ffe3pUXqev7z6b9Yh` | `openai/gpt-6.1-sol`, medium | `d93b0db742fac0c831435ba13c461d8bd1763b44b55fe03515d3307ab4fb01ee` |

Gel original déclaré : `1266b0df632a32ee19635b92615cab7a74f81d7e9bd28c0c70afcb3fd08f3ba8` ; compaction : `abd0d35bc10361b0176d6b94098e638b312ebb9a90784a14509f56e6a2b40b34`. Ces identifiants concordent entre manifest de réconciliation, manifest natif et les deux candidats. PE32 déclaré : SHA-256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966+00:00`.

Les SHA-256 de fichiers sont fournis, pas recalculés : aucun primitive de lecture binaire/hachage de fichiers disponible dans ce rôle. Le parent conserve la vérification byte-for-byte des hashes d'entrée et le calcul du hash de sortie. Aucun auteur manquant ni identifiant de hash incohérent constaté ; l'indépendance est attestée par le dépôt/provenance du parent, non redémontrée par inspection des sessions.

## Contrat final : entrées, sorties et effets

### ABI et entrées

- Fonction x86 32 bits avec deux slots arguments sur pile. Premier slot : seuls **16 bits bas**, lus en WORD et sign-étendus en EDI ; valeur transmise `a ∈ [-32768,32767]`. Les 16 bits hauts du slot n'interviennent pas. Deuxième slot : adresse destination 32 bits capturée dans ESI.
- EBX/ESI/EDI sont sauvés puis restaurés. RET sans immédiat, nettoyage externe par l'appelant : **compatible cdecl** ; les types/prototype source exacts ne sont pas démontrés.
- Destination capturée avant l'angle ; les deux sont capturés avant les stores. Aucun test de pointeur, allocation, bornage, saturation ou branche. Pour le parcours ordinaire, la zone destination doit accepter les écritures de **20 octets**, même si neuf coefficients n'en occupent que 18. L'ASM n'impose pas d'alignement ni de non-alias.

### Séquence observable exacte

1. Sauver EBX puis ESI ; charger destination dans ESI ; mettre EAX à zéro ; copier ESI dans ECX ; sauver EDI ; charger/signer le WORD d'angle dans EDI.
2. Store DWORD nul à `dst+0` ; pousser l'angle ; stores DWORD nuls à `dst+4`, `+8`, `+12`, `+16`, dans cet ordre.
3. Appeler **0x56D130**. Désigner son EAX de retour complet par **S**.
4. Pousser encore l'angle, puis copier S en EBX ; appeler **0x56D100**. Désigner son EAX de retour complet par **C**.
5. Copier EBX en EDX ; retirer ensemble les huit octets d'arguments poussés ; `NEG EDX`, donc **N = (0 − S) modulo 2^32**.
6. Stores WORD successifs : `dst+0 = low16(C)` ; `dst+6 = low16(N)` ; `dst+2 = low16(S)` ; `dst+8 = low16(C)` ; `dst+16 = 0x1000`.
7. Restaurer EDI, ESI, EBX et RET. Aucun bloc caché ni branche/loop/shift local.

Le premier argument poussé reste sur la pile pendant le second appel ; `ADD ESP,8` intervient seulement après celui-ci. Chaque callee voit l'angle au premier slot argument. Ne pas modifier l'ordre des appels, des stores ou des captures. Les helpers restent les deux cibles natives : aucune substitution par une bibliothèque mathématique, aucun appel ou garde inventé.

### Disposition et valeur finale

Sans modification de la zone par les helpers, les neuf WORDs à offsets `0,2,4,6,8,10,12,14,16` sont :

```text
[ low16(C)   low16(S)   0      ]
[ low16(N)   low16(C)   0      ]
[ 0          0          0x1000 ]
```

Stride coefficient **2 octets**, stride ligne **6 octets** sous cette indexation. Ce n'est pas un stride d'itération ou la preuve d'un type nominal complet. Les octets +18/+19 ont été remis à zéro avec le DWORD à +16 ; ils ne sont pas réécrits localement ensuite. Les offsets de coefficients non réécrits restent également zéro **sous réserve des effets indirects des callees**. Les cinq derniers stores sont certains sur le chemin de retour normal ; une finalité globale « tous les autres octets sont zéro » requiert cette réserve.

Les stores prouvent des **patterns WORD**, pas un type signé déclaré. Leur interprétation s16 est naturelle pour la matrice Q12 mais ne change pas les bits. NEG est 32 bits avec wrap avant troncature, y compris S=`0x80000000` ; pas de négation signée C pouvant déborder. Les instructions AX/DX/BX lisent les moitiés basses : elles ne modifient pas EAX/EDX/EBX.

### Retour et état

- **EAX final = C complet, 32 bits**, pas uniquement AX/AL, pas destination, pas booléen. Signedness de ce retour et intention de l'exposer dans un prototype source : UNCERTAIN. Aucun caller ASM consommant ce retour n'est fourni.
- EDX final = N modulo 2^32 ; ECX n'est pas fixé au retour par le corps après les appels. Flags volatils, localement ceux de NEG après ADD ; registres non volatils et pile restaurés sous le contrat ABI ordinaire des callees.
- Aucun accès global direct et aucune instruction x87 locale. **Ne pas conclure que l'environnement x87 global est inchangé** : les callees peuvent agir sur son état, précision, arrondi, exceptions ou autres globals. Ce gel ne les borne pas.
- L'alias destination/état des helpers n'est pas exclu. La remise à zéro précède les appels : déplacer cette remise à zéro après les calculs changerait potentiellement le résultat. La restauration/valeur de retour décrites supposent un parcours normal, sans corruption du cadre de pile actif par un alias pathologique.

## Preuves natives — huit ancres exactes

Toutes les sources ci-dessous sont relatives à la projection autorisée.

1. **0x7012C2 et 0x7012CB**, `native-asm-001.txt:3,7`, bytes `8B 74 24 10` puis `0F BF 7C 24 10` : adresse deuxième slot, angle WORD signé du premier slot après trois pushes. Prouve largeur, ordre de capture et absence de dépendance aux bits hauts de l'angle.
2. **0x7012C6–0x7012DC**, `native-asm-001.txt:4–13` : XOR EAX,EAX et cinq MOV DWORD à +0/+4/+8/+12/+16 ; PUSH EDI intercalé à 0x7012D2. Prouve empreinte 20 octets et ordre pré-appels.
3. **0x7012DF et 0x7012E7**, `native-asm-001.txt:14–17`, `native-bytes-001.txt:1–2` : `E8 4C BE E6 FF` cible `0x7012E4 + sign32(0xFFE6BE4C) = 0x56D130` ; `E8 14 BE E6 FF` cible `0x7012EC + sign32(0xFFE6BE14) = 0x56D100`. Prouve l'ordre des cibles indépendamment des labels. PUSH EDI/MOV EBX,EAX séparent les appels.
4. **0x7012EC–0x7012F1**, `native-asm-001.txt:18–20`, bytes `8B D3 83 C4 08 F7 DA` : conservation de S, nettoyage différé de deux slots, négation EDX sans préfixe WORD. Prouve wrap 32 bits et ABI locale des appels.
5. **0x7012F3–0x7012FE**, `native-asm-001.txt:21–24`, préfixes `66` dans `native-bytes-001.txt:2–3` : stores WORD +0/+6/+2/+8, diagonales identiques et hors-diagonales opposées. **Première preuve du rôle proposé** : forme d'un bloc plan de rotation, sans hypothèse issue du nom.
6. **0x701302**, `native-asm-001.txt:25`, bytes `66 C7 46 10 00 10` : unité `0x1000` sur le troisième axe ; zéros des quatre croisements d'axes établis par l'ancre 2, avec réserve d'effets indirects. **Deuxième preuve du rôle proposé** : axe restant invariant et unité fixe 4096, compatible Q12. Ne prouve pas seul que S/C sont des fonctions trigonométriques.
7. **0x701308–0x70130B**, `native-asm-002.txt:1–4`, bytes `5F 5E 5B C3`, avec les ancres 4–6 : aucune réassignation EAX après le second callee ; seules lectures AX. Prouve retour machine complet C, restauration et RET sans immédiat.
8. **Xrefs 0x701328/448/4D7/556/5F9/679**, `native-metadata.json:163–198` : six callers locaux distincts ; tous les 30 xrefs sont lus. Le CFG `:11–17` donne le seul bloc sans successeur et `:200–205` les deux cibles/29 instructions. Prouve réutilisation et couverture, pas les paramètres de callers ni un domaine métier.

## Convergences, divergences et erreurs communes recherchées

| Point | A / B | Décision R contre les preuves |
|---|---|---|
| Capture WORD signé, footprint 20, ordre des calls et des stores | Accord | Retenu après décodage des largeurs/opcodes et contrôle du bloc unique ; accord seul non utilisé comme preuve. |
| Retour | Accord EAX complet, intention inconnue | Retenu : pas de write AX/AL/EAX après 0x7012E7 ; ne pas convertir en retour pointeur/void/cosine API certifié. |
| Nom | A ajoute `PosSin01`, B non | Suffixe retenu comme convention descriptive +S à offset 2, -S à offset 6 ; sens physique reste UNCERTAIN. Aucune transposition pour harmoniser une convention mathématique. |
| Zéros finaux | A les formule sans réserve locale ; B réserve les effets indirects | Retenir la réserve B : les zéros sont écrits avant deux calls dont le corps n'est pas fourni. L'ASM cible prouve les stores, pas l'absence de mutation indirecte. |
| Type « s16 » | Les deux l'utilisent dans le nom/matrice | Bitpatterns WORD certains ; signedness nominale du buffer seulement LIKELY. MOVSX concerne l'angle, pas les résultats stockés. |
| Sin/cos Q12, période 4096 | Accord contextuel, confiance LIKELY | Ne pas promouvoir cet accord : compaction et commentaires ne sont pas deux preuves natives des callees. Structure compatible rotation ; calcul exact/périodicité restent non validés localement. |

Recherche explicite d'erreurs communes : aucune normalisation de signe, aucun effacement limité à 18 octets, pas de relecture de l'angle après stores, pas de réduction du retour à AX, aucune saturation ou conversion x87 inventée. La formule en S/C ne certifie pas orthogonalité, norme exacte ou déterminant 1 : les résultats peuvent être arrondis ou soumis à un environnement x87 particulier.

## Limites et contrôle restant au parent

La compaction autorisée associe les cibles à sinus/cosinus Q12 ; cette information secondaire rend le nom trigonométrique **LIKELY**, non CERTAIN. Le rôle mécanique et ses deux preuves natives restent valides sans ces labels. Repère, vecteurs lignes/colonnes et sens positif réel : **UNCERTAIN**. Aucun métier caméra/battle établi.

Pour lever ces incertitudes seulement : capture gelée des corps de 0x56D130/0x56D100 et de callers représentatifs consommant la matrice/retour, avec constantes et effets x87. Cette limite n'empêche pas le présent contrat local ; aucune rediscovery n'a été tentée.

Pas de test, compilation, exécution, IDB/Git/registre/live/API ou inspection de sessions/services. Context Mode absent du catalogue ; seules lectures courtes bornées demandées par la mission ont été utilisées, sans outil de remplacement pour une analyse volumineuse. Hash de sortie, vérification binaire des hashes d'entrée, contrôle natif final §5.6 et éventuelle promotion réservés au lead.
