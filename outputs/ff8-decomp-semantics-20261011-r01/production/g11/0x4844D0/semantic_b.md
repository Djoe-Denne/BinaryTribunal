# Semantic B — 0x4844D0

Mission run01; rôle B indépendant; modèle contractuel openai/gpt-6.1-sol medium. Analyse bornée au paquet natif et à la compaction g11 fournis dans inputs. Aucune production sœur consultée, aucune promotion.

## Conclusion et nom proposé

**Nom : BattleSlot_InitializeRandomATBFromSpeed. Confiance LIKELY pour le métier, CERTAIN pour les opérations mécaniques.**

Initialise la jauge ATB courante d'un slot à partir de sa jauge maximale, de son SPD et d'un tirage aléatoire, puis applique deux bornages signés. Le nom est étayé indépendamment par (1) le calcul et l'écriture du champ courant à +0x14 en fonction du maximum à +0x10 et du SPD à +0xC1, et (2) l'appel RNG et les deux callers d'initialisation documentés. Le nom ancien et les commentaires de verdict historiques ne constituent pas des preuves.

## Entrées, sortie et effets

- Un argument dword à [ESP_initial+4] : index de slot. Pas de contrôle de domaine; les documents communs décrivent 11 slots mais l'ASM n'impose pas cette borne.
- Adresse calculée : 0x1D27B10 + index*0xD0, avec arithmétique 32 bits. La signedness contractuelle de l'index n'est pas déterminable; aucune extension/sign comparison de l'index.
- Lecture dword +0x10 (maximum ATB) et lecture byte **non signée** +0xC1 (SPD). XOR EAX,EAX puis MOV AL garantit zéro-extension; SHR 2 donne floor(SPD/4).
- Un appel à 0x48F020; son EAX est masqué par 0x7F puis incrémenté, donc r∈[1,128]. Effet RNG de curseur selon le contexte validé, non établi par le corps natif du callee absent du gel.
- Facteur f=floor(SPD/4)+r−35, intervalle possible −34..156. Quotient q=trunc_signed(max/100), calculé par multiplication signée longue par 0x51EB851F, décalage arithmétique et correction de signe. Produit p=f*q, conservé sur 32 bits.
- Écrit +0x14=p; si p>max en comparaison signée, écrit max; si la valeur ainsi obtenue est négative, écrit zéro. L'ordre est borne supérieure puis zéro. Pour max≥0 cela borne la jauge à [0,max]; pour max<0 ne pas prétendre à cet intervalle : le stockage final est zéro.
- **Retour EAX complet**, pas AL/AX ni booléen : valeur après borne supérieure mais **avant** remise à zéro. Un retour négatif est donc possible alors que +0x14 contient zéro. La consommation ou non de ce retour par les callers n'est pas gelée.
- ESI sauvegardé/restauré; EAX/ECX/EDX modifiés; RET simple sans dépilage d'argument, compatible cdecl à un argument (signature source exacte non prouvée).

## Preuves natives (7)

Source N = `inputs/ff8-decomp-semantics-20261011-r01/g11/0x4844D0.json`; ASM en N:18, bytes en N:15.

1. **4844D1–4844DA** : CALL rel32 vers 48F020, AND EAX,7Fh, INC EAX, MOV EDX,EAX; tirage transformé 1..128. N:70–72 confirme la cible.
2. **4844DC–4844EB** : charge argument après PUSH ESI; deux LEA font 3*i puis 13*i; SHL 4 et ADD base donnent stride **208 / 0xD0**, pas 0x1B0.
3. **4844E6,4844F1–4844FA** : XOR EAX,EAX, MOV AL,[ECX+C1h], SHR EAX,2, LEA ESI,[EAX+EDX−23h]; byte unsigned, SPD/4 et facteur signé potentiellement négatif, sans branche de parité.
4. **4844FE–484510** : lecture max, IMUL un opérande signé par 51EB851Fh, SAR EDX,5, SHR copie,31 et addition : division signée par 100 avec troncature vers zéro.
5. **484512–484526** : IMUL ESI,EDX et store courant; CMP EDX,EAX puis JGE signé saute la substitution par max. Aucun bornage unsigned.
6. **484529–484537** : reload EAX courant, TEST/JGE signé; bytes `c7411400000000 c3` prouvent store zéro à +14h puis RET **sans reload EAX**. Distinguer retour et stockage est obligatoire. CFG N:35–54 confirme ces branches.
7. **Xrefs N:56–68** : appels à 48B740 depuis 48B5F0 et 48BF35 depuis 48BBD0. La compaction G11.4:26–30 rattache ces callers à initialisation party/enemy et les offsets aux champs ATB/SPD (contexte documentaire, pas ASM caller).

## Interprétation métier, limites et divergences

Le mapping +10h=max_atb, +14h=cur_atb, +C1h=SPD et le rôle initialisation party/enemy viennent de `common-compaction.md:26–31`, avec références documentaires explicites. Ils rendent le nom LIKELY sans transformer les labels en preuve native. L'ASM cible établit le calcul mais pas les conditions Initiative/préemptif/back des callers, ni la politique de lecture du retour.

Les annotations étrangères au calcul (arme à 4844D6; formule paire/impaire à 4844F1) contredisent les instructions et sont rejetées. Le stride 0x1B0 cité dans l'annotation historique de la fonction voisine est également incompatible avec les LEA/SHL; 0xD0 est mécanique ici. Les assertions historiques PASS ne fondent aucune confiance.

La compaction fournie contient aussi un résumé de reconstruction C sœur (G11.5:33–36); il n'a pas été utilisé comme preuve, comparé ni consulté directement. Cette présence dans le gel doit être signalée au lead pour audit de projection aveugle.

Questions ouvertes : obtenir ASM borné des deux callers pour confirmer préconditions max/index et utilisation d'EAX; confirmer le writer SPD avant ce tirage; fournir gel callee 48F020 pour vérifier nativement ABI et effet curseur; déterminer si le contrat métier exclut max négatif et overflow du produit. Aucun complément externe recherché.

## Inventaire

Lectures : guide `docs/tech/RE_MULTI_PROVIDER_MISSIONS.md`; répertoires inputs de mission/g11; N complet (ligne ASM affichée tronquée, tail vérifié par bytes); `inputs/ff8-decomp-semantics-20261011-r01/g11/common-compaction.md:1–50`. Contexte de découverte hérité factuel uniquement; priorité au gel inputs pour cette production. Seule écriture : ce livrable possédé.
