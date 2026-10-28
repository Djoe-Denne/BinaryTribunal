# Sémantique B — 0x50B830 — run01 / g17

## Identité et provenance

- Auteur : pool-221, session `ses_ecf07ae37ffeONz03wZxxNyWFj`, tâche `task_mv44siqk_00c0_u0xbbk`, rôle B indépendant, 2+1.
- Modèle effectif attesté par le lead à l'admission : `openai/gpt-6.1-sol`, variante `medium`, override=0 ; comparaison native/persistée PASS. La mention high du dispatch est historique, non la référence effective.
- Source factuelle autorisée : checkpoint révision 2 de `ses_ed41fc6c0ffeWZh5hkKIUXKy89`, frontière exclusive `msg_12be1cd49001BowbZIVfuXq4cy`, préfixe de 8 messages attesté par le parent. Aucune lecture d'auteur frère, de review, de C ou de ledger.
- Entrée lue : `inputs/ff8-decomp-semantics-20261011-r01/g17/0x50B830.readable/` : manifest, huit fichiers ASM (195 instructions), deux fichiers bytes, metadata complet ; `g17/common-compaction.md` ; les quatre fichiers du supplément `0x50B830.supplemental-v1/`.
- SHA256 attestés parent/manifests, **non recalculés par cet auteur** : manifest lisible `ee68ab702a3c81b773646633c43449c19551c802e947faf107877e9368d0cf82` ; paquet original `e89c8ab63b9fd82b3051f599dea4bcd4e2d1bc49457d7a0afe239ac230aafbbf` ; compaction `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c` ; manifest supplément v1 `ddf0c47e293841fdd067f43f05b0f582c733984a96d5a3317883a75f157a8e3a`.
- EXE 32-bit SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570` ; gel original exporté 2026-10-11T16:38:25.140966+00:00. Supplément statique capturé 2026-10-12T17:03:18.889793+00:00, égalité racine/table IDB–PE attestée ; aucune lecture IDB personnelle.
- Abréviations ci-dessous : `R/` = répertoire readable ; `S/` = supplemental-v1 ; `K` = common-compaction.md. Labels et commentaires historiques exclus des preuves de finalité.

## Rôle, confiance et nom

**CERTAIN (mécanique)** : tick d'une machine à huit états, pilotée par l'octet node+0x0D, qui coordonne un callback chargé depuis un identifiant WORD, des barrières de disponibilité, et la suspension/reprise d'un sous-ensemble des trois premiers records acteurs de stride 0x9C. Il conserve un masque de participants dans l'octet 0x1D99A6C, lance le callback une fois à l'état 2, puis effectue une séquence de restauration et marque le descripteur capturé terminé.

**Interprétation métier LIKELY**, mais **verdict global UNCERTAIN** : orchestration d'une séquence de présentation/action de combat à callback, avec préparation et restauration d'acteurs/ressources. La portée « Special », une catégorie GF particulière, ou une exclusion de tout effet sur HP/status/stock ne sont pas démontrées. Le callback et plusieurs callees restent opaques ; la fonction n'est pas prouvée purement visuelle.

**Nom proposé : `BattleActionSequence_TickMaskedActorCallback`. Verdict nom : LIKELY / non promu.** Le composant Tick/Sequence est étayé indépendamment par le dispatch persistant et ses barrières (P1/P6), MaskedActor par les boucles d'enregistrement puis restauration (P3/P7), Callback par la résolution et l'appel indirect (P4/P5). Aucun ancien nom ne sert de preuve. Si un nom CERTAIN strictement mécanique est requis : `Sequence_TickThreeRecordCallback` ; conserver toutefois le contexte battle comme interprétation, non authentification d'ABI.

## Entrées, sortie et effets

### ABI et largeurs

- Un argument DWORD sur pile, pointeur node : lecture à 0x50B831. Champs lus : BYTE +0x0D (état), DWORD +0x10 (pointeur sauvegardé). Plain RET, sauvegarde/restauration EBP/ESI/EDI ; nettoyage des arguments de callees explicite. Compatible cdecl, sans preuve d'un prototype C authentifié.
- Le DWORD node+0x10 est capturé dès l'entrée dans le slot pile de l'argument à 0x50B841. À la terminaison, c'est ce pointeur capturé, **pas node et pas un rechargement de 0x1D99A50**, qui reçoit BYTE +1 = 0xFF. Une mutation de node+0x10 par un helper ne change pas cette cible pour l'appel courant.
- **Retour EAX complet** : 0 pour attente, état hors 0..7, ou progression non terminale ; 2 uniquement après nettoyage final. XOR EAX et MOV EAX,2 définissent les 32 bits : ni simple AL, ni AX, ni booléen. Le retour du callback est stocké en DWORD à 0x1D96AAC, mais n'est pas le retour de ce tick.
- L'état est zero-extended BYTE puis comparé unsigned à 7 (`JA`). Le paramètre du descripteur +4 est comparé unsigned en AX à [7,10]. Son WORD +6 est explicitement zero-extended dans EAX avant passage à 0x50AF20.
- Le DWORD 0x1D99C8 est testé **signé** (`TEST EAX,EAX; JL`) : négatif bloque, zéro autorise la suite. Les boucles de pointeurs emploient `JL` signé ; leurs bornes fixes sont positives. Les masques/flags ne sont pas des comparaisons signées.
- Les `OR AH/CH,0x10` ajoutent le bit DWORD **0x1000**, non 0x10 : après masquage à 0xFF pour les arguments de 0x507080, ou sur le EAX complet de 0x509C10 pour 0x505C00. Ne pas réduire ce dernier retour à un BYTE. Les shifts emploient CL et les règles x86 de masque de compte ; les indices des boucles sont seulement 0,1,2.

### Progression native (table du supplément)

| État à l'entrée | Travail et condition de progression |
|---|---|
| 0 → 0x50B85A | 0x508580(0x1A,0x40), puis 0x501190 doivent chacun retourner zéro ; sinon retour 0 sans incrément. Incrémente node+0x0D puis tombe dans l'état 1. |
| 1 → 0x50B87E | Lit WORD [*[0x1D99A50]+4] ; appelle 0x50A750 si hors [7,10]. Positionne des flags, appelle 0x50AFC0, construit le masque des trois acteurs dont BYTE +0 bit 2 était présent, appelle 0x50C090(actor,0x0B), deux fois 0x501740 avec arguments (0x18/0x19,0,0x80), puis 0x50AF20(WORD +6,&0x21DFEC4). Incrémente l'état, retourne 0. |
| 2 → 0x50B934 | Attend DWORD 0x1D99C8 non négatif et BYTE +0 bit 4 présent sur chaque acteur sélectionné. Appelle 0x46B440 ; si masque bit 4, modifie le record 0x1D973F8. Copie le callback C4 vers C8, écrit BYTE 0x1D96DC4=1, appelle le callback avec &0x1D99A78, stocke EAX à 0x1D96AAC. Incrémente l'état, retourne 0. |
| 3 → 0x50B9B9 | Attend EAX=0 de 0x50AE80 ; incrémente puis tombe dans 4. |
| 4 → 0x50B9C9 | Si masque bit 4, appelle 0x507080(low-byte DWORD 0x1D973FC,2,0). Incrémente puis tombe dans 5. |
| 5 → 0x50B9EE | Attend EAX=0 de 0x507070 ; si masque bit 4, appelle 0x50B810(&0x1D973F8), puis 0x507080((DWORD 0x1D973FC & 0xFF) | 0x1000,2,0). Incrémente puis tombe dans 6. |
| 6 → 0x50BA2B | Attend EAX=0 de 0x507070 ; si masque bit 2, appelle 0x507080((DWORD 0x1D97360 & 0xFF) | 0x1000,1,0). Incrémente puis tombe dans 7. |
| 7 → 0x50BA60 | Attend EAX=0 de 0x507070, restaure les acteurs sélectionnés, appelle 0x50AED0, efface bit 0x10 de 0x1D96A9C et DWORD 0x1D99A64, écrit BYTE [pointeur capturé+1]=0xFF, retourne 2. Pas d'incrément de l'état 7. |

Les chutes successives ne sont pas un tick par état : un appel peut traverser 0→1, ou 3→4→5→6→7 jusqu'à une barrière. Un état déjà incrémenté est conservé si la barrière suivante bloque. Tout état 8..255 retourne 0 sans terminaison ni correction d'état.

### Effets directs et indirects

- Chaque entrée, même bloquée/invalide, écrit BYTE 0x1D99A56=0xFF.
- Préparation : OR BYTE 0x1D97705 avec 0x80 ; OR DWORD 0x1D96A9C avec 0x10 ; effacement/reconstruction du BYTE 0x1D99A6C. Les boucles couvrent [0x1D972C0,0x1D97494), exactement trois records de 0x9C ; aucun indice sur une taille universelle d'array.
- Avant callback, si bit 4 du masque : AND WORD 0x1D973F8 avec 0xFFFD et BYTE 0x1D97459=0. Backup DWORD 0x21DFEC8=callback courant de 0x21DFEC4 ; DWORD résultat 0x1D96AAC modifié.
- Restauration finale : pour chaque sélection, OR BYTE actor+0 avec 2 ; appelle 0x509C10(actor), 0x505C00(actor,EAX | 0x1000), 0x50C090(actor,0x0C). Les bits d'autres acteurs ne sont pas directement changés par cette boucle.
- La plupart des retours de préparation/restauration sont ignorés ; aucun rollback, null-check du callback ni mécanisme de réentrance n'est visible. Les helpers peuvent muter les globals et objets. Le masque est relu à plusieurs points : ne pas supposer une copie immuable pendant toute la séquence.

## Huit preuves indépendantes ASM/xrefs

1. **P1 — dispatch persistant.** `R/asm-001.txt:2–12`, 0x50B831–0x50B853 ; `S/table.json:8–48`, DWORDs LE bruts : 0→B85A,1→B87E,2→B934,3→B9B9,4→B9C9,5→B9EE,6→BA2B,7→BA60. Les octets `FF 24 85 E0 BA 50 00` et la borne unsigned authentifient la sélection, pas les commentaires case.
2. **P2 — préparation et type de paramètre.** `R/asm-001.txt:23–25`, `asm-002.txt:1–10`, 0x50B87E–0x50B8AC : descripteur partagé +4 en AX, tests unsigned [7,10], flags 0x1D97705/0x1D96A9C et appel 0x50AFC0. Ne démontre pas que [7,10] sont quatre catégories métier.
3. **P3 — masque acteurs initial.** `R/asm-002.txt:11–25`, `asm-003.txt:1–3`, 0x50B8B1–0x50B8EE : base 0x1D972C0, stride 0x9C, fin 0x1D97494, bit actor+0=2, helper avec 0x0B et bit d'indice dans le masque BYTE. Cette preuve structurelle est indépendante du dispatch.
4. **P4 — résolution de callback.** `R/asm-003.txt:12–21`, 0x50B90C–0x50B92B : descripteur rechargé, XOR EAX/MOV AX,+6, passage du WORD zero-extended et adresse C4 à 0x50AF20 ; contexte natif voisin résumé dans `K:33` établit une sélection via tables et sortie par pointeur. Pas de preuve du callback concret à runtime.
5. **P5 — barrière puis appel indirect.** `R/asm-004.txt:2–25`, `asm-005.txt:1–13`, 0x50B934–0x50B9B8 : blocage signé et bits de disponibilité des participants, callback C4 sauvegardé C8, CALL EAX avec &0x1D99A78, stockage du retour DWORD, incrément BYTE et retour EAX=0. Interdit d'assimiler retour du callback et retour du tick.
6. **P6 — séquence de barrières/restauration.** `R/asm-005.txt:14–25`, `asm-006.txt:1–25`, `asm-007.txt:1–10`, 0x50B9B9–0x50BA67 : barrières 0x50AE80/0x507070, incréments et chutes, branches masque 4/2, appels 0x507080 et arguments 0x1000|BYTE. Les fonctions de chargement restent des interprétations des labels, non une garantie d'effet.
7. **P7 — restauration des mêmes participants.** `R/asm-007.txt:11–25`, `asm-008.txt:1–8`, 0x50BA6D–0x50BAB1 : second parcours des mêmes trois strides, sélection par masque relu, bit +0=2, EAX complet de 0x509C10 OR 0x1000 vers 0x505C00 et mode 0x0C vers 0x50C090. Confirme une orchestration acteur, indépendamment de P3.
8. **P8 — résultat terminal et limite d'xref.** `R/asm-008.txt:9–20`, 0x50BAB3–0x50BADE : nettoyage, sentinel sur pointeur capturé et MOV EAX,2. `R/metadata.json:322–328` : unique référence entrante 0x50A812, type=1/iscode=false, depuis 0x50A790 ; c'est une référence d'adresse, **pas** une preuve de call direct ou de contrat de retour consommé.

Les bytes complets `R/bytes-001.txt:1–20` et `bytes-002.txt:1–2` couvrent [0x50B830,0x50BADF), avec réconciliation des immédiats/largeurs cités. Aucun conflit opcode/ASM/table observé. Le supplément résout le manque de table signalé historiquement dans `K:38`, sans modifier le gel original.

## Limites, divergences et questions ouvertes

- Le commentaire d'entrée « presentation/state-machine only, no damage/status/stock » est une conclusion historique, non une propriété prouvée. L'appel indirect et les callees non gelées interdisent la négation générale d'effets domaine. Pas de CONFLICT mécanique avéré ; écart de niveau de preuve vis-à-vis de cette annotation.
- Que signifient les bits acteur+0=2/4, les paramètres 7..10, les modes 0x0B/0x0C et les bits des globals ? Des noms évocateurs ne suffisent pas.
- Quel callback concret est sélectionné, ses effets/ABI, et 0x50AF20 garantit-il un pointeur valide dans tous les cas ? Ce tick ignore son retour et appelle sans null-check.
- Quels sont précisément les effets de 0x501190, 0x50A750, 0x50AE80, 0x507070, 0x507080 et 0x50B810 ? L'observation de retours zero/nonzero ne valide pas les labels Busy/Loader.
- Qui consomme EAX=2 et retire le node ? Le tick ne change pas l'état 7 ; le réappeler après terminaison répéterait le nettoyage si les barrières le permettent. Quelle garantie de durée de vie pour le pointeur capturé et les globals partagés ?
- Que désigne la variante historique « Special » et en quoi diffère-t-elle métier des autres ticks ? La séquence locale est certaine, cette catégorisation reste UNCERTAIN.
- Aucune promotion, §5.6, écriture IDB/git/registre ni action live. Dépôt B uniquement, à confronter indépendamment à A et à l'ASM par R/lead.
