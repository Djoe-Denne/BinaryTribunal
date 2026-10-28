# M2 — 170 : deux mesures pour choisir, pas une nouvelle optimisation

## Objectif et autorisation

Le diagnostic168 reste rouge à94s. Le protocoleRO169 propose de séparer deux coûts que les trois sites actuels confondent : conformité pure des documents replacement (pisteA) et comparaisons pures des catégoriesOWN (pisteB). Ni leur poids ni l'impossibilité d'atteindre15s ne sont établis. Parent recoupe exactReplacementDocument61–65 et assertFinalOwn474–477.

Autoriser source dans **trois fichiers existants uniquement**, après snapshot des quatorze sources164/manifeste : src/graph-generation-replacement.ts, src/graph-final-inventory.ts et src/graph-local-measure145.ts. Aucun test, codec, record/frame/publictype, formatpersisté, configuration ou nouveau module modifié. C'est l'extension bornée du diagnosticRAM déjà autorisé146, pas un nouveauframework/profiler/runner ni changement d'autorité. Aucune optimisationA/B autorisée maintenant.

## Mesures fermées

Ajouter exactement deux sites fermés :

- replacementExact : entourer le corps existant de exactReplacementDocument120 (parse/assert/conformité/immutableCopy), sans SQL ; tous genres de documents, pas seulement stage. Mesurer les bytes de la chaîne déjà lue pour le parse, sans getter supplémentaire ou lecture anticipée d'un doc invalide.
- ownCategoryCompare : entourer seulement l'invariant de comparaison des dixcatégoriesOWN dans la boucle actuelle474–477, incluant le getterpur et sans englober verifyFinalHost/Q/SQL ou toute assertFinalOwn. Bytesunavailable par conception : ne pas sérialiser davantage les objets pour leur taille.

Passer l'ensemble du collecteur3→5sites (35agrégats pour7phases), sans nouveaux labels dynamiques ou APIproduit. Conserver monotonie148, limitespile32/compteurs, failsoft/incomplete et purge. Mêmes expressions/ordre, une exécution, mêmes returns et exceptions ; enter/leave directs avec finally, aucune callbackcaller ou IOdansTX. Inactif : pas clock/scan/token additionnel ; aucun argument/résultat/stat ne commande une garde. Mémo153 et clés164 fonctionnellement inchangés.

Le test et ses septassertions restent byte-exacts ; même activation/readout aprèsclose horsTX. JSONtoujours borné au plafond existant ; si cinqsites excèdent la borne, diagnostic incomplet plutôt qu'un logtronqué prétendu complet. Aucun contenu métier retenu ou brut dansstats. Overhead supplémentaire inconnu et noncorrigé artificiellement.

## Interprétation fixée avant run

Dans freshCollect et freshActivate uniquement : A=somme des résiduels instrumentés replacementExact ; B=somme des résiduels ownCategoryCompare, excluant leurs enfants instrumentés. Utiliser les agrégats, pas additionner les inclusifs imbriqués.

- Si A+B représente au moins50% du temps total de ces deuxphases et A≥2B : priorité à l'étude deA.
- Même couverture et B≥2A : priorité à l'étude deB.
- Sinon : cette mesure ne tranche pas ; ne coder aucune piste sur sa seule base et ne pas relancer une mesure aveugle.

Ces ratios sont un choix de tri analytique, **pas un seuil produit modifié ni preuve de gain futur**. Les algorithmes envisagés (équivalence byte-exacte sans doubles chaînes) exigeraient mandat et preuve d'équivalence séparés. Les tempsrésiduels restent instrumentés, pas tempspropresabsolus ; GC/SQL nonattribués. Le nouvelensemble5sites change rootunion/résiduels : baisse d'un résiduelstage par apparition d'un enfant n'est pas un gain de performance. Ne pas comparer les métriques3sites/5sites comme si leur couverture était identique.

## Livraison et gates ultérieurs

Livrer3hashs/diffsrestaurables, sites/ownership/bytesdisponibles/throws/outcomes, inactivité/failsoft/bornesJSON et absence d'effetmétier. Références nécessaires bornées selon politique ; aucunoracleQA. Même reviewer : shells nouveaux et extension du collecteur seulement, preuves148/149/165 et autres horsimpact réutilisées. Après gel/revue seulement, compilation puis une gate diagnostic neuve sur OLDREADY avec15s/test et150sprocess0retry/OWNassetneufs ; contrat de lecture verrouillé aux5sites avantRUN.

Source seulement : aucun importévalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA/cleanup. Autres onze sources164 et inputs122/308base+overlay gelés ;450+9nonrejoués. Seuil15s/300s inchangé,HOLD125intégral,S2/M2nonacceptés,commandesconsolidéesnonlancées. Frontières de stockage/cacheautorité/publiccontrat restent soumises à arbitrage distinct, non prouvées indispensables ici.
