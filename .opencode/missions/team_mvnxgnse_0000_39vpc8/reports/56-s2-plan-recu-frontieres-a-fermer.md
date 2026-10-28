# M2 — 56 : plan S2 reçu, frontières body et ownership à fermer avant code

## Objectif et état

000b a livré un plan RO d'intégration S1 puis S2. Aucun fichier modifié/test/DB/import produit exécuté. Le parent retient la préparation, **pas un GO code ou d'exécution**. QA S1 DATA acquise au55, intégration encore manquante.

Le worker rapporte300fichiers WIP conformes à GO,47pins S1 conformes,13overlays nécessaires pour composition isolée (4modules qualifiés divergents,7nouveaux modules,2schémas). Ces comparaisons sont des résultats de sa recherche, pas encore une projection parent faite. Namespace proposé .tmp/m2-s2-integration-r2 non créé par ce mandat. Fermeture filesystem/types et budget tests restent à approuver ; aucune copie en bloc/écrasement WIP.

## Conflits vérifiés par le parent

1. **Images de body différentes.** graph-adapter:172–208 construit Admission contenant command ; client.submit:87–124 ajoute scope/controller/revision, peut les changer au retry ; client.call:55–68 ajoute principal/token en mémoire. Une empreinte d'Admission n'est donc pas l'empreinte du RPC complet. On ne peut pas déclarer bodyRef/pas de changement de body avec un seul digest couvrant arbitrairement ces images.
2. **Contrat scientifique.** DRAIN_AND_ACTIVATION:575–588 exige body final complet dossier/prompt/manifests/knowledge/context/proposals/modèle/access/resultHeader après acquisition des inputs, entier UTF8, immutable jusqu'à consommation. Il ne fournit pas dans cet extrait une définition complète de l'image RPC/auth à budgéter. Le plan doit fermer explicitement ces domaines, pas décider par habitude du v2 ou prétendre le gap déjà prouvé au55.
3. **Refus avant/après engagement.** DRAIN:625–636 exige ledger terminal SPENT/BURNED, body trop grand après engagement BURNED et aucun crédit/retry différent. Cela ne contredit pas un oracle v2 zéro mutation avant engagement : deux états/préconditions distincts doivent être testés. Aucun effet externe après refus, pas promesse indifférenciée zéro mutationDB.
4. **Ownership historique.** QA_MATRIX:132–161 prévoit OWN v3 séparé et modules génération/authority/budget, pas de prétendue génération dans tables mission/unit v6 ;195–200 réserve shared integration au parent et refuse retouche opportuniste graph-store/unit-lease. Le plan propose précisément ces shared files : cette permission n'est pas acquise. M2§5–6 exige réutilisation pertinente et frontière S1/S2, sans autoriser silencieusement un rewrite legacy ou nouveau backend/scheduler.

Références contrats ci-dessus : .tmp/mission-v2-20261018-continuous/s1-common-contract-final-plan/inputs/contracts/{DRAIN_AND_ACTIVATION,QA_MATRIX}.md, copies pinnées utilisées par S1. Code client/adapter canonique relu par le parent aux lignes citées. Aucun secret/token capturé ou consigné.

## Décisions immédiates

- Accepter la direction composition isolée sélective et réutilisation des stores/primitives, sous contrôle parent des origines/destinations/closure avant projection. Pas encore d'overlay ou d'intégration canonique.
- **Ne pas approuver la modification GraphStore/UnitLease proposée.** Demander un plan compatible avec les versions/schémas/permissions historiques, réutilisant les primitives sans reconstruire un second ordonnanceur. Distinguer un module v3 nécessaire d'une duplication de backend ; si cela demeure incompatible avec le mandat actuel, citer le conflit au lieu de le contourner. Pas de nouvelle allowlist SQL/signatures ratifiée aujourd'hui.
- Admettre la distinction pré-engagement zéro effet / post-engagement BURNED terminal, à condition de conserver les oracles v2 et de prouver les préconditions v3/absence de dispatch/crédit. Aucun changement de source à ce stade.
- Demander une proposition body fermée : champ exact et encodage de l'image scientifique complète, bytes/RAW versus digest documentaire, lien déterministe vers command, séparation transport/auth, recontrôle avant effet et retry exact. Les exclusions doivent découler du texte applicable ou être signalées comme arbitrage, jamais implicites. Aucun stockage de credential pour obtenir une égalité de bytes.

## Reprise bornée utile

Une seule révision documentaire de000b, sans nouveau catalogue/worker/reviewer : fermer ci-dessus les signatures minimales, schéma/connexion/owner et les preuves ciblées nécessaires. Ne pas construire de validator miroir, nouveau harnais/SQL ou fixture exécutable ; pas davantage de lectures massives ou de benchmarks. Reprendre les éléments acceptables du plan, pas réécrire les acquis S1/numeric/planner ou exposer les oracles QA.

Si un choix structurel reste réellement hors mandat après confrontation des textes, le parent présentera un arbitrage précis avec options au lieu de multiplier les plans. Critères de sortie : domainesbody+retry/BURNED+ownership+closure/types/fixtures/budget fermés, puis GO explicite de la tranche utile. Aucune condition contractuelle manquante n'est levée par la réussite de la QA DATA.

## Limites mission

000b non close ; S1_QUALIFIED_OFFLINE_DATA_NOT_INTEGRATED maintenu. S2/S3/S4/L7runtime/L9/L10 non acquis. Trois checks consolidés M2 NON EXÉCUTÉS ; aucun Git/DB/native/live/IDA/C#/jeu/framework ou permission supplémentaire autorisé.
