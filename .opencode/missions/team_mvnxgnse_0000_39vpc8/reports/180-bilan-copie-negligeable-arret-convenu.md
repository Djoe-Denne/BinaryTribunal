# M2 — 180 : copie ciblée négligeable, arrêt convenu appliqué

## Conclusion technique

La mesure unique autorisée175/176 est terminée. La copie immuable des preuves courantes instrumentée prend **4,2234ms pour quatre appels**, tous dans freshCollect/freshActivate. Ces deux phases durent94745,591ms ;partmesurée **0,00446%**, bien sous les50%fixés. **Cette copie précise n'est pas un coût majeur dans ce run.** Ne pas généraliser ce constat à toutes les copies, sérialisations ou comparaisons du programme.

Le diagnostic est complet :uniqueJSON,septphasesetsixsitesexacts,incomplete:null,métriquesfinies,intégrité vérifiée. Le test produit reste **FAIL** :0PASS/1FAIL,7assertions,110956,53ms contre15s autorisées. Processus111168ms,exit1sanssignal,uneinvocationzéroretry. Les assertions terminées ne compensent pas le délai.

La compilation178 est verte,zérodiagnostic5256ms ;revue177 indépendante acceptée. Cela clôt la tranche diagnostique autorisée, **pas S2/M2 ni le remplacement**. Aucune optimisation n'est autorisée par ces résultats.

## Mesure et limites

Copie :freshCollect2appels/2,4785ms ;freshActivate2appels/1,7449ms ;aucunthrow,quatre retours. Taillebytes indisponible par conception :aucunobjet n'a été sérialisé pour la mesurer. Aucun résultat/stat ne commande une garde.

Autres observations sur toutletrajet :stage185calls/41713,75ms inclusifs/24920,50msrésiduels ;replacementExact2214calls/29441,07ms ;finalDocument537calls/10450,76ms ;bind280calls/10118,34ms ;ownCategoryCompare50calls/2402,84ms inclusifs/790,28msrésiduels. Ces temps inclusifs ne s'additionnent pas causalement. Les ratios5sites/6sites et runs94s/111s ne sont pas un benchmarkcontrôlé :aucun gain ou régression causale ne leur est attribué,ni tempsnoncouvert àGC/SQL.

Le tri170 historique reste inconclusif ;aucune baisse de son critère50%. L'impossibilité d'atteindre15s sans autre architecture n'est pas démontrée. Les nouveaux résultats écartent seulement la copie ciblée comme coût majeur dans les conditions observées.

## Intégrité et exécutions réellement faites

Quatorze sources176 stables,308base+overlaycodec exact contrôlés,reçucomposition/codecoriginalqualifié/entrées122 intacts. UneDB/40751104octets et unasset/troisentrées conservés :0unowned/0hashdrift,manifeststable,processExited. Aucun SQLdiagnostic,cleanup,commit/merge/push ou thread lancé.

Les trois commandes consolidées convenues restent **NON EXÉCUTÉES** :
- cd tools/ff8-harness && bun run typecheck ;
- cd tools/ff8-harness && bun run test:q1-primitives ;
- cd tools/ff8-harness && bun test.

La compilation ciblée tsc effectuée n'est pas la première de ces commandes ;le test filtréOLDREADY n'est pas la troisième.450paireset9régressions restent aux preuves historiques qualifiées,nonrejouées/nontransférées. Les contrôlesmutations161/refus167 conservent leur périmètre/version,horsimpact seulement. Aucun cas filtré ou thread sousHOLD ne devientPASS.

## Arrêt effectivement décidé

Appliquer le contrat approuvé : **bilan puis arrêt des nouvelles exécutions**,dans touslescas. Aucun retry,seconde mesure,instrumentation ou optimisation supplémentaire. Sources/artefacts gelés ;aucun nettoyage ou retrait de l'instrumentation autorisé tacitement. Trois chemins thread toujoursHOLD125/nonwaived,preuveanti-orphelin nonobtenue ;deuxNEWdistincts toujoursinatteignables souscap3 sansdérogation.

TâcheglobaleS2 propriétairelead reste ouverte/bloquée ;S2/M2/remplacement et acceptation globale nonacquis. Suite uniquement sur nouveau mandat explicite :ne pas prolonger automatiquement le diagnostic ou substituer un refactorstockage/cacheautorité/publiccontrat. Aucun nouveau GO demandé pour accomplir ce qui vient d'être livré :la tranche autorisée est terminée et ses limites sont consignées.

## Annexe preuves

Evidence .tmp/m2-s1-integration-r2/evidence/s2-measure-176-runtime,sourceSetexécutéef5e7588f723b1a8f72ad91e47c02645b57a96730446f0703308e5d1ddc8aa99 ;sourceFilesba1d4632… . Reçu179SHAe90ef0f90a51059de7f8ed8d7559b43fe198277529ba152c78b6e8c36c8dd5c2 ;diagnosticSHA53ea1aa59ec595485f4a7b2d40f7904f6ab65f349759ced61f86765846d8c90b. Logs et fichiersd'artefacts relus pour leurs hashes uniquement,pasd'ouvertureSQL.
