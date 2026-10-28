# M2 — 84 : décision nécessaire sur le nombre de dossiers préparés

## Objectif, stade et problème concret

La mission doit pouvoir préparer une génération suivante, fermer les nouvelles admissions et laisser terminer le travail déjà engagé. La tranche de réservations physiques est vérifiée82 :60PASS/436assertions, typing vert. Les préalables83 de la prochaine étape sont livrés, mais révèlent une règle manquante : le protocole impose des préparations persistantes bornées sans fixer leur plafond ni leur comptage initial.

Une « origine préparée » est ici un dossier de génération enregistré durablement. Ce n'est ni une session de modèle, ni une admission A/B/R, ni un appel réseau. Laisser ce nombre inconnu doit bloquer avant création ; l'inférer des limites d'activation ou de remplacement inventerait un droit.

## Faits vérifiés et limites de recherche

- Parent recoupe DRAIN31–44 et302–309 : staging/préparation soumis à des compteurs root persistants, T0 non autorisant.
- S1 ratifié proposal/01-root-envelope-t0.md:23 et produit graph-execution-envelope.ts:171 ne donnent que maxActivationAttempts et maxCandidateReplacements. Le matching ciblé des entrées S1 n'apporte pas de plafond de préparations initiales. Cette recherche bornée ne prétend pas prouver l'absence de toute mention dans tout le dépôt.
- Contrat83:8–24 laisse correctement policy/counter UNKNOWN et prepareInitial/T1 HOLD avant effet. Aucun code consommateur ou nouvelle exécution lancé.
- Deux artefacts83 reçus et hashes parent conformes, sept sources82 inchangées. Les propositions de pré/postimage T0/T1 et les blueprints de succès restent à examiner/ratifier ; elles ne donnent pas un succès acquis.

## Proposition recommandée, soumise à accord

Pour les nouvelles fixtures de cette mission uniquement : **au plus trois origines durables par root/lineage**, bootstrap inclus. Cela couvre le bootstrap, une première fille et un éventuel stage de remplacement sans déduire cette borne du plafond de remplacement existant. C'est une proposition nouvelle explicite, pas une règle déjà approuvée.

Comptage :

1. Une nouvelle origine enregistrée durablement consomme une unité, dès son commit, même si elle n'est ensuite pas retenue ou activée. Le bootstrap consomme donc la première unité.
2. Retry strictement identique : relire mêmes IDs/refs, zéro consommation nouvelle. Transaction annulée avant persistance : aucun incrément.
3. Abandon, refus ultérieur, activation, remplacement, redémarrage ou changement d'étiquette/epoch ne rendent aucune unité. Aucun compteur remis à zéro dans la lignée.
4. ActivationAttempts et CandidateReplacements gardent leurs compteurs et plafonds indépendants. Préparer n'autorise pas à activer/remplacer ; un remplacement futur devra respecter les deux budgets applicables et ses gates.
5. Octroi fixture privilégié indépendant, lié au root/lineage et conservé avec son compteur atomique/audit durable. Aucune valeur copiée d'une demande pour créer une autorité. Inconnu, absent ou source révoquée : HOLD avant effet. Les types publics S1 ne sont pas modifiés silencieusement ; le raccord privé exact sera revu avant exécution.
6. Ne pas modifier les bases historiques82 ni leur inventer rétroactivement un octroi. Les nouvelles fixtures doivent enregistrer cette politique avant leur bootstrap et compter effectivement ce dernier. Le développement futur n'utilise jamais un nouvel OWN pour remettre à zéro les droits d'une lignée existante.

Ce choix ne modifie ni C/N/T, ni les allocations physiques, ni la sélection des modèles, ni le budget de sessions. Il n'autorise aucun nouveau test ou appel public à lui seul ; les gates source, revue, ownership et runtime restent obligatoires.

## Options et conséquences

- **Adopter cette borne de trois** — permet de fermer le préalable de préparation pour les fixtures ; ensuite seulement poursuivre le contrat/delta T0/T1. Risque borné : un scénario nécessitant davantage d'origines devra refuser ou demander une révision explicite, pas relever le plafond. Aucune durée ou dépense d'exécution n'est estimée ici ; aucun provider payant n'est appelé par cette décision.
- **Maintenir le blocage ou choisir une autre borne** — les60tests82 et les preuves précédentes restent valides ; aucune origine candidate ni T1 ne peut progresser avant clarification. Le périmètre finalM2 n'est pas réduit ni déclaré satisfait. Une autre règle doit préciser plafond, bootstrap, unité, retries et conservation du compteur ; elle sera consignée avant code.

Recommandation : trois pour cette fixture, car cela couvre le chemin initial et un remplacement tout en imposant une limite finie traçable. Ce nombre n'est pas présenté comme optimal pour une future campagne ou un runtime natif.

## Décision demandée et état sûr

Autoriser cette politique fixture précise, ou conserver HOLD/proposer une autre règle. Tant que l'accord manque, aucun code de création du candidat/T1 consommateur n'est autorisé. Les tâches indépendantes déjà permises peuvent continuer sans contourner cette borne.

Annexe : CONTRACT83 6500B/SHA48b4c80f89724dcbaafbc02e32fcd357292fd8daa575bd8b2a090b4e218cae08 ; transition-fixtures.ts28517B/SHA8cc9ab0bc2e8c75bb7799a35e51764611c1af4de05897ba94c9e919e410ce9f8. Contrôle statique parent via Context Mode, aucun import évalué. Paquet81 clos ;000b/S2global/M2 ouverts ; aucun Git, DB/native/public/cleanup ou commande consolidée exécuté par cette préparation.
