# 105. Point d'entrée natif manquant : composition réelle et continuité à fermer

## Objectif et manque concret

La mission vise une exécution RMS réellement reliée aux résultats et à la publication, pas seulement un moteur testé sur des simulations. Le complément de l'auteur établit que le candidat r8 dispose de points d'injection typés mais ne livre ni implémentation host réelle ni port HTTP runtime réel. La CLI construit encore le transport historique.

Le superviseur a corroboré les références produit et lu le port runtime : il expose une interface request, sans composition opérationnelle. Les transports historiques ne peuvent pas être castés pour combler ce manque : leurs contrats au repos et leurs gardes sont différents.

La réception opérationnelle reste donc ouverte malgré les 75 tests réussis et la revue favorable du logiciel dans leur portée. Ce constat ne suspend pas les recherches et raccords utiles autorisés.

## Deux travaux indépendants engagés

1. **Composition et autorité réelles.** Le même auteur prépare en lecture seule un plan de composition parent et transport, avec fichiers et symboles exacts. Il doit identifier la source réelle des droits et décisions du parent, la fraîcheur des observations du service et leur révocation. Une interface synchrone n'autorise pas à baptiser un cache JSON « autorité actuelle ». Si un précontrôle asynchrone est nécessaire, il doit être proposé explicitement avec contrôles locaux de versions avant effet et sans attente réseau dans une transaction SQL. Aucun noyau, second stockage ou grand harnais ajouté par défaut.
2. **Continuité des origines et du budget.** Un build indépendant en lecture seule recherche les artefacts réels du root, de sa lignée, des grants et des origines bootstrap. Il distingue sessions développeurs, origines de travail et sondes selon leurs contrats. Il ne peut ni importer l'autorité d'une fixture ni remplacer une histoire manquante par la baseline simulée « bootstrap 1, débit 17 ».

Ces travaux sont disjoints et ne modifient pas r8. Le modèle effectif du nouveau build a été relu nativement : OpenAI Sol high, dans le catalogue approuvé. Aucun changement de politique ou nouveau GO de routine.

## Prérequis conservés

Avant tout effet : préparation exécutable avec modèles/profils réels et sources indépendantes, histoire exhaustive des origines et budgets applicable au root, autorité et ownership actuels, serveur et droits rapprochés, identités et images retenues, bornes et gardes vérifiées. Les métadonnées serveur et sources publiques ne prouvent pas seules ces propriétés.

Les contrats94/95 sont réutilisés. Les décisions de conception nécessaires seront prises par le superviseur dans le mandat. Aucun nouveau grand harnais, SDK, configuration globale, installation, appel natif ou expérience arrêtée n'est autorisé à ces workers. L'objectif et les permissions restent inchangés.

## Preuves et portée

- Auteur : `read-only-plan-real-host-missing`, reçu dans la file native.
- Lectures parent : références `verifyNativeRuntime`, `startNativeGraph`, `connectPublic` sous src ; `native-runtime-transport.ts:68–70`, `native-at-rest-transport.ts:17–54`.
- Recherche indépendante : tâche `task_mvu3gvue_001f_2v90c6`, session `ses_e764b2706ffeMhoLH4bvWvc1So`, build OpenAI `gpt-6.1-sol`, variant high, racine canonique.
- [QA logicielle acquise et limites](104-regressions-fermees-preparation-qualification-reelle.md).
- Aucun raccord r8 intégré, qualification native, D5 ou clôture M2 acquis.
