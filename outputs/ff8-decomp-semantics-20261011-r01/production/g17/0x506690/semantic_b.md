# Sémantique B — 0x506690 / g17

Mission run01 ; tâche task_mv44si61_00bt_r65nhl ; auteur pool-216 ; modèle contractuel openai/gpt-6.1-sol high. Analyse indépendante du gel factuel ; aucun C cible, autre auteur, review ou verdict consulté. Pas de promotion ni validation §5.6.

## Conclusion et confiance

**Nom proposé : `BattleEvent_DispatchActorUpdatesAndEffects` — LIKELY.**

Rôle mécanique **CERTAIN** : dispatcher séquentiel d'un enregistrement vers un acteur indexé, avec traitement initial inconditionnel, gates d'acteur, transmission de flags/valeurs, branche de registration d'un callback, appels conditionnels codés par flags et traitement facultatif d'une seconde portion de l'enregistrement. Le métier « événement de bataille / mises à jour et effets de présentation » est **LIKELY**, soutenu séparément par l'adressage d'acteurs et la synchronisation d'acteur, puis par la registration différée et les appels commandés par codes/position. L'application exacte de HP/statuts, le sens des codes et la nature sonore/popup restent **UNCERTAIN** sans ASM des helpers. Le nom évite de garantir que cette fonction applique elle-même les dégâts ou produit toujours des popups.

## Entrée, sortie et ABI

- Un argument pointeur sur pile, récupéré à 506692 ; caller-cleanup, RET simple, EBX/ESI/EDI sauvegardés. Pas de null-check ni de validation des indices.
- L'entrée utilise au moins les offsets 0,1,2,3,4 (WORD),8 (DWORD),0xC,0xD,0x10 (WORD),0x14 (DWORD), donc une empreinte de 0x18 octets. Deux portions espacées de **0xC**, et non deux enregistrements de 0x18 ; le curseur environnant avance de 0x18 selon la compaction, ligne 34.
- L'indice principal est un BYTE **non signé** (EAX préalablement nul) ; le secondaire est également zéro-étendu après comparaison au sentinel 0xFF. Adresse d'acteur : `0x1D972C0 + index*0x9C`. Ni signed WORD index ni stride de slot métier 0xD0.
- Champs transmis à 506B50 : acteur, zéro-extension du WORD entrée+4, DWORD entrée+8. Dans la branche différée, le bit 4 du WORD transmis est supprimé ; ailleurs il reste présent.
- Second acteur : le AND EAX,0xFF avant MOV AX,[entrée+0x10] garantit que PUSH EAX transmet un WORD zéro-étendu, malgré l'écriture partielle AX. Entrée+1 et +0xD sont explicitement zéro-étendus pour 506620.
- Aucun retour AL/AX/EAX contractualisé : aucun code final uniforme, et l'épilogue ne définit pas EAX. Les sorties observables sont les appels, leur ordre et les écritures, pas un BOOL. L'EAX du chemin court peut conserver des bits hauts d'un helper avec AX remplacé par les flags de l'acteur ; les autres chemins héritent d'appels distincts.

## Effets et ordre observables

1. Calcule l'acteur principal puis appelle 493D80(entrée) **avant tout gate local**. Lit ensuite acteur+4 ; valeur 0x8C déclenche 50E510(3). Les commentaires historiques ne prouvent pas le métier de ces helpers.
2. Si acteur WORD+0 n'a pas bit 2, ou a bit 0x10, rejoint l'épilogue : aucun traitement secondaire dans ce cas, mais les appels initiaux ont déjà eu lieu.
3. Appelle 506B50(acteur,flags,valeur). Si entrée+4 bit 4 est présent, acteur BYTE+8 masque 0x1A nul et WORD [acteur+0x74]+0x2C masque 0x140 nul : retire bit 4 avant l'appel et enregistre callback 506860 dans la liste 1D986A8 via 508360. Écrit l'indice d'acteur BL dans BYTE [retour+0xC], **sans vérifier le retour contre zéro**. Le calcul signed IMUL/SAR/correction de signe ramène ici le déplacement d'acteur au quotient par 156 ; l'indice initial reste unsigned BYTE.
4. Entrée BYTE+2 bit 0x40 : appels 570F20(acteur,B8B858), 50C090(acteur,7), puis 5017A0(0xD,8,acteur+0x1C) et 5017A0(0xE,0x10,acteur+0x1C). Sinon, 506620(acteur,entrée[1]) seulement si DWORD entrée+8 bit 0x10000 est absent, puis 509C80(acteur) dans tous les cas de cette branche.
5. Si global DWORD 1D96A9C bit 0x10000000 est présent, le **consomme** par AND 0xEFFFFFFF et supprime l'appel 5712C0. S'il est absent et entrée[3]&2, appelle 5712C0(0,1,0,0xFF). La consommation est conditionnée aux gates précédents.
6. Masque entrée[2]&0x30 : 0x10→571050(acteur,0x27), 0x20→code 0x28, 0x30→code 0x26, zéro→aucun appel. Appelle ensuite 5065B0(entrée), puis 5068B0(entrée).
7. Si entrée[0xC]!=0xFF, traite le second acteur sans refaire les gates du principal : 50A070(acteur2,WORD entrée+0x10,DWORD entrée+0x14), 506620(acteur2,BYTE entrée+0xD), 509C80(acteur2), 5068B0(entrée+0xC), dans cet ordre.

Les mutations d'acteur et d'entrée réalisées par les helpers ne sont pas bornées par ce corps ; les flags et données sont relus après appels. Le corps ne contient aucune écriture explicite de HP, mais cela **ne prouve pas l'absence de mutation HP transitive**. Il n'écrit directement que le BYTE de node enregistré et le global de flags ; il n'écrit pas directement l'enregistrement d'entrée.

## Huit preuves indépendantes / provenance

Préfixe de tous les chemins ci-dessous : `inputs/ff8-decomp-semantics-20261011-r01/g17/`. Les opcodes sont fournis par `0x506690.json:12–16`, l'ASM par `:18`, CFG par `:19–228`. Un chunk [506690,506853), 154 instructions, 28 blocs (compaction:14). Les labels et commentaires après `;` ne sont pas utilisés comme preuves.

1. **Structure d'acteur et appel initial** : `0x506690.readable/asm-001.txt:3–12`, 506692–5066AB : argument pile, XOR/MOV AL, formule index*156, CALL 493D80. Première justification indépendante du nom : dispatch indexé vers acteurs, et non simple affichage d'une valeur.
2. **Gates post-appel** : `asm-001.txt:13–25`, 5066B0–5066D7 : comparaison BYTE 0x8C, appel avec 3, bits 2/0x10 testés sur AL issu de WORD acteur+0. Les effets initiaux précèdent les sorties anticipées.
3. **Flags et registration différée** : `asm-002.txt:1–25` et `asm-003.txt:1–12`, 5066DB–506746 : masques 0x1A/0x140, WORD→DWORD, callback literal 506860, list literal 1D986A8, retour de 508360 utilisé pour stockage BYTE. Deuxième justification indépendante du nom : orchestration d'effets différés et de mise à jour, pas simple copie de record.
4. **Commandes portant une position** : `asm-003.txt:13–25` et `asm-004.txt:1–6`, 506749–50677C : sélection par bit 0x40, paire de triples avec adresse acteur+0x1C, codes 0xD/0xE, paramètres 8/0x10. Soutient « effets », sans prouver « sons ».
5. **Synchronisation d'acteur alternative** : `asm-004.txt:7–17`, 50677E–50679C : DWORD bit 0x10000, BYTE zéro-étendu, call 506620 puis 509C80. Compaction:26 décrit mécaniquement 509C80 ; le nom historique du callee n'est pas la preuve.
6. **Consommation d'un flag global** : `asm-004.txt:18–25` et `asm-005.txt:1–4`, 50679F–5067C6 : test 0x10000000, clear EFFFFFFF, alternative conditionnée par entrée[3]&2.
7. **Mapping de codes et fin principale** : `asm-005.txt:5–25`, 5067D0–506804 : AND 0x30, codes 0x27/0x28/0x26, puis calls 5065B0 et 5068B0 avec la même entrée.
8. **Portion secondaire et retour** : `asm-006.txt:1–25` et `asm-007.txt:1–4`, 506807–506852 : sentinel 0xFF, stride acteur identique, AND 0xFF avant MOV AX/PUSH EAX, appels et cleanup de 0x1C, RET sans définition de retour.

## Divergences et questions ouvertes

- Aucune contradiction mécanique constatée entre bytes, ASM et compaction. Les assertions annotées « applique HP/statuts », « popup ne mute pas HP » et les noms de helpers dépassent ce que démontre l'ASM cible : **historique non validé**, pas résultats de cette production.
- Demander au lead les gels 493D80,506B50,5068B0,5065B0,506620,50A070,506860,508360 et des helpers 57xxxx pour nommer exactement les transitions et effets. Qui possède le callback enregistré et quelles garanties de succès/aliasing offre-t-il ?
- Quels enums documentent les bits 2/0x10 d'acteur, les bits d'événement et les codes 0x26–0x28 ? Quel rôle précis a la deuxième portion : réplique, contre-effet, cible liée ? Aucune de ces hypothèses n'est retenue comme fait.
- Quels callers consomment EAX, s'il en existe ? Les xrefs abondantes ne prouvent ni un type de retour ni la validité des indices. Ni l'état runtime des acteurs ni la sûreté des pointeurs ne sont établis par ce gel.
