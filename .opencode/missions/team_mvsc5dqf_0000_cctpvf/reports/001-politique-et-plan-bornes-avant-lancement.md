# 1. Achever le pipeline statique RMS sans relancer le diagnostic arrêté

## Objectif et stade

La mission doit livrer une chaîne statique complète, des faits d’un exécutable
jusqu’à la connaissance durable et au prochain travail. **Nous sommes uniquement
au stade de la préparation, sans approbation de lancement.**

Le remplacement reste trop lent et des preuves indispensables manquent. Le
brouillon initial proposait aussi une vérification moins exigeante que votre
ordre. L’approuver tel quel aurait rendu les limites du lancement ambiguës.

**Recommandation :** approuver une première phase de reprise des preuves et
d’études, avec vérification renforcée, puis décider des modifications et essais
sur une proposition précise. Cela évite de refaire des livraisons existantes ou
de relancer un diagnostic explicitement arrêté.

## Ce qui a changé depuis le brouillon initial

- Le brouillon est corrigé vers `verification.level: reinforced`, avec commandes,
  critères d’acceptation et interdictions explicites.
- Le catalogue proposé reprend celui de M2 : Luna low/medium et Sol
  medium/high/xhigh, fournisseur OpenAI. C’est une nouvelle proposition, pas
  une migration ou une réapprobation de M2.
- Onze tâches natives ont été créées avec leurs vraies dépendances : quatre
  études publiées, puis sept tâches différées, dont les décisions et la validation
  finale réservées au parent. Aucune tâche n’a été exécutée.
- Le premier lancement proposé n’autorise ni modification du produit ni test.
  Les corrections/exécutions futures nécessitent le contrat précis applicable.

## Résultats vérifiés et inconnues

Les ordres, le journal et les rapports demandés ont été consultés. Le rapport
historique final établit un test d’environ 111 secondes pour une limite de quinze
secondes ; la copie ciblée n’a pris que 4,2234 millisecondes pour quatre appels.
Cela n’attribue pas le coût restant à un autre composant.

Les modèles et variantes proposés figurent dans le catalogue natif consulté.
Cela ne prouve pas leur quota ou authentification. Aucun worker n’a été lancé :
la référence effective de son modèle sera contrôlée à son admission.

Les trois chemins avec threads restent interdits ; deux nouveaux candidats
distincts restent incompatibles avec la limite de trois origines ; la route
publique native du produit n’est pas démontrée. Les preuves des auteurs existants
et les versions du candidat seront rapprochées dans la première étude, pas
présumées qualifiées dans cette préparation.

**Aucun test, instrumentation, optimisation, appel IDA/live, nettoyage ou commande
Git de publication n’a été effectué. Les trois commandes consolidées restent
non exécutées.**

## Plan proposé

1. Retrouver les livraisons et rapprocher versions, preuves et obligations.
2. En parallèle lorsque les entrées sont acceptées : étudier le remplacement,
   préciser le contrat public et reprendre les oracles indépendants de transitions.
3. Présenter le contrat précis nécessaire avant toute modification ou exécution.
4. Ensuite seulement, sous autorisations : persistance/remplacement, route publique,
   connaissance durable/replay, preuves indépendantes, revue finale et intégration
   parent. Une preuve indispensable impossible conserve un état partiel ou bloqué.

Un seul superviseur ; une recherche initiale puis au plus trois études utiles.
Pas de pipeline fixe de spécialistes, de classifier ou de second ordonnanceur.

## Choix de vérification et décision attendue

Le défaut technique était **proportionate**, c’est-à-dire des vérifications selon
le risque. Le niveau **light** ne prévoit que des contrôles ciblés. Votre ordre
exige ici **reinforced** : obligations explicites et revue indépendante des
risques requis, en réutilisant les preuves valides. Je recommande cette correction.
Réduire ce niveau nécessiterait de modifier explicitement le mandat ; ce n’est
pas une option silencieuse du lancement.

Vous pouvez corriger en discussion le périmètre, le catalogue ou les critères,
ou conserver la pause sans changer le produit. Aucune durée ou dépense totale
n’est estimée ; les coûts du catalogue ne sont que des références historiques.

**Décision proposée : afficher avec `/ensemble-mission config` la politique
corrigée, puis, si elle vous convient, lancer vous-même
`/ensemble-mission start`.** Cette approbation initiale porte seulement sur les
études décrites. Le superviseur ne lance pas la commande à votre place.

## Annexe technique

- [Plan détaillé, identifiants natifs, dépendances et projections](../PLAN_PREPARATION.md).
- [Brouillon exact de politique](../model-policy.json). Le hash du brouillon initial
  fourni dans le message utilisateur n’est plus celui de cette proposition corrigée.
  La prévisualisation native `config` doit porter la nouvelle révision avant `start`.
- Ordre M2 §7.1 : lignes 346–407 ; condition d’arrêt §8 : lignes 409–431.
- Rapport M2 180 : lignes 5–17 pour les mesures, 23–34 pour les interdictions.
- Rapport M2 181 : lignes 63–71 pour récupération, validation et gel conservé.

Localisation / impact / limites : préparation documentaire et file de cette
nouvelle mission seulement ; aucune écriture dans M2 ni requalification des reçus
primaires. La [vérification de cohérence documentaire](../evidence/preparation-consistency.json)
confirme le JSON lisible, les cinq couples modèle/variante et leurs métriques
identiques au catalogue M2, les trois commandes conservées sans exécution et les
onze identifiants du plan conformes aux reçus de création. La file native consultée
confirme quatre études publiées, sept tâches différées, les contextes indépendants
et l’acceptation réservée au parent. Ce n’est pas une validation du produit RMS.

Empreinte SHA-256 des octets du brouillon corrigé :
`9e87b5d559f7435ad15e3e0e4aae195073cb57be5d9ae2e75d06835afd488c79`.
Elle ne remplace pas l’empreinte de proposition calculée par la prévisualisation
native `config`, qui doit encore être présentée et approuvée.
