# Sémantique A — 0x5083C0

Mission `ff8-decomp-semantics-20261011-r01`, groupe g20, rôle A indépendant, modèle contractuel `openai/gpt-6.1-sol`, variante `medium`. Analyse exclusivement du gel autorisé et de sa compaction ; aucune lecture C/B/review/verdict, aucune promotion.

## Rôle, confiance et nom

- **CERTAIN (mécanique)** : recherche séquentielle bornée du premier emplacement dont le bit 0 du premier octet est nul, à partir d'une adresse fournie par un descripteur, avec déplacement signé fourni par celui-ci. Renvoie cette adresse ou zéro ; ne réserve ni ne modifie l'emplacement.
- **LIKELY (interprétation)** : sélection d'une entrée libre dans un ensemble à pas configurable. Les deux callers numériques historiques positionnent ensuite ce même bit et renseignent l'entrée ; cela étaye le sens « occupé » du bit, sans identifier le métier de l'ensemble.
- Nom proposé : **`FindFirstUnclaimedStridedEntry`**, confiance **LIKELY**. Deux preuves indépendantes : test local du bit 0 avec retour immédiat sur bit nul ; callers distincts 0x508360 et 0x5083F0 positionnant ce bit après succès. Alternative strictement mécanique si les voisins ne sont pas revalidés : `FindFirstEntryWithBit0Clear`.
- **UNCERTAIN** : type métier, nature exacte des callbacks et structures, mode de création du descripteur. Aucun nom IDA historique n'est utilisé comme preuve.

## Entrées, sortie et effets

Un pointeur descripteur est lu à `[ESP d'entrée+4]`. Champs utilisés : DWORD à +8 (adresse initiale 32 bits), WORD **signé** à +0xE (borne), WORD **signé** à +0xC (déplacement en octets). Ces offsets ne constituent pas une définition complète de structure.

Retour **EAX entier 32 bits**, adresse sélectionnée ou zéro ; ni booléen AL ni résultat AX. Borne <=0 : EAX=0, aucun octet d'entrée n'est testé, mais le DWORD descripteur +8 a déjà été lu. Borne positive : jusqu'à borne tests, dans l'ordre ; premier bit nul : retour de l'adresse courante. Tous les bits testés à 1 : EAX=0. Le déplacement est relu dans le corps uniquement après un test à 1, y compris après le dernier test avant remise à zéro du résultat.

Pas d'écriture hors pile, d'appel ou de référence globale directe. ESI/EDI sauvegardés-restaurés ; EAX/ECX/EDX et flags modifiés ; EBX/EBP inchangés. `RET` sans immédiat, un argument pile et nettoyage caller dans les voisins : ABI compatible cdecl, pas prototype nominal démontré.

La borne est capturée une fois. Le déplacement est signé et peut être négatif ou nul : ne pas supposer progression croissante, éléments distincts, taille constante positive ou stride `sizeof(struct)`. Addition d'adresses x86 32 bits ; aucun contrôle de débordement, de pointeur nul, d'étendue ou d'alignement. Même sans mutation locale, aucune garantie de synchronisation/atomicité ou d'absence d'alias n'est prouvée. Une adresse nulle sélectionnée serait indiscernable d'un échec à l'interface ; la validité mémoire reste une précondition externe.

## Preuves (8)

Source locale primaire : `inputs/ff8-decomp-semantics-20261011-r01/g20/0x5083C0.json`, ligne 18 pour les instructions, lignes 11–16 pour les octets, lignes 19–55 pour le CFG.

1. **0x5083C0/C7/CB** : argument pile vers EDX, `MOVSX ESI,WORD [EDX+0xE]`, `MOV EAX,[EDX+8]` : descripteur, borne signée et adresse initiale, ordre des lectures établi.
2. **0x5083CF/D1** : `TEST ESI,ESI; JLE 0x5083E3` : borne nulle ou négative éliminée avant tout test `[EAX]`.
3. **0x5083D3/D6** : `TEST BYTE [EAX],1; JZ 0x5083E5` : bit 0 seul pertinent ; l'adresse courante reste dans EAX lors de la sortie précoce.
4. **0x5083D8/DC** : `MOVSX EDI,WORD [EDX+0xC]; ADD EAX,EDI` : déplacement signé 16 bits étendu sur 32 bits et rechargé dans chaque itération poursuivie, pas taille d'élément déduite.
5. **0x5083C5/DE/DF/E1/E3** : compteur initial zéro, incrément, comparaison/JL signés puis `XOR EAX,EAX` : parcours borné et résultat zéro à épuisement ; inclut l'avancement après le dernier test à 1.
6. **0x5083E5–E7**, corps complet **C0–E7** : restauration EDI/ESI et `C3 RET` ; seules écritures pile, aucun appel ; résultat EAX, non AL/AX. Les xrefs primaires sont 0x508367 et 0x5083F6 (JSON lignes 57–70).
7. **Caller 0x508360**, compaction autorisée `common-compaction.md:13–14`, provenance historique `tools/_tmp_semantic_triple/0x5083c0/native-2026-10-10/N5083C0_pack/neutral/asm.txt:28–67` : 0x50836C conserve EAX dans ESI, 0x508370 nettoie 4 octets, 0x508373/375 teste le résultat complet ; succès : `OR BYTE [ESI],1` à 0x50837B puis écritures +2/+4/+8. Étaye sélection suivie de revendication, distincte de la recherche.
8. **Caller 0x5083F0**, compaction `common-compaction.md:15`, même source historique `asm.txt:69–86` : 0x5083FB nettoie 4 octets, 0x5083FE/8400 teste EAX, 0x508408 pose le bit 0 et 0x508411/414/417 renseigne +8/+4 et le lien du descripteur. Deuxième contexte indépendant concordant ; ne pas confondre le +8 descripteur avec le +8 entrée.

## Sources, divergences et limites

Gel primaire : x86 32 bits, un chunk [0x5083C0,0x5083E8), 40 octets, 19 instructions, cinq blocs ; export 2026-10-11T16:38:25.140966+00:00. SHA256 EXE `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`. La compaction `inputs/ff8-decomp-semantics-20261011-r01/g20/common-compaction.md:5,10–15` rapporte concordance exacte des 40 octets de la racine historique avec ce gel, mais les voisins restent des snapshots du 2026-10-10 non revalidés dans l'export actuel. Aucun conflit mécanique dans les sources autorisées.

Les appellations historiques de création de tâches/callbacks et les descriptions d'initialisation (compaction :20–26) ne prouvent ni la structure complète ni le métier de cette fonction. Elles ne sont pas nécessaires au nom mécanique proposé. Aucun global n'est directement référencé par la cible ; les adresses des fenêtres depth-2 appartiennent aux callers. La situation ancienne C_R BLOCKED n'est pas un verdict run01.

Questions ouvertes pour le lead : revalider les deux callers contre leurs octets actuels ; fournir le gel de l'initialiseur pour établir stockage, borne et déplacement réels ; documenter les invariants de validité/non-nullité et de synchronisation ; confirmer la signification métier de bit 0 plutôt que la déduire des noms anciens. En attendant, conserver **LIKELY** pour « unclaimed/free » et **UNCERTAIN** pour tout nom métier plus précis.
