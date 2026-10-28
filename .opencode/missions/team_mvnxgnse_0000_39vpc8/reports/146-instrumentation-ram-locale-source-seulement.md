# M2 — 146 : instrumenter localement les coûts, sans changer les décisions

## Objectif et choix

Le trajet OLDREADY→swap→freshfinal dépasse15s et le profileur CPU n'a pas produit de fichier sous bun test. La propositionRO145 fournit une solution locale : chronos de phases et trois sites de lecture/codec, agrégés en mémoire. Le parent retient ce petit diagnostic interne plutôt qu'un nouveau runner, profiler externe ou refactor spéculatif.

Autoriser **source seulement**, pas un run. Ce raccord n'altère aucune frontière métier, permission, représentation persistée ou APIpublique ; les données diagnostics ne servent jamais aux gardes. Toute extension à un framework/service/contrat ou infrastructure importante reste à arbitrer avant réalisation.

## Ownership et préservation

Après snapshot des douze sources138 et du codec isolé, allowlist **cinq fichiers** dans `.tmp/m2-s1-integration-r2/tools/ff8-harness` :

- modifier src/graph-execution-envelope.ts, graph-generation-replacement.ts et graph-final-inventory.ts ;
- modifier test/s2-author/replacement.test.ts ;
- créer src/graph-local-measure145.ts, petit collecteurRAM sans dépendance, environ90–130lignes visées et non moteur général.

Le nouveau chemin doit être absent avant création. Toutes autres sources/inputs122/configs/records/frames/types publics/oracles/cases/titres et artefacts restent protégés. Aucun test de contexte/numérique ni scientifique supplémentaire autorisé.

**Exception de pin explicite :** le codec isolé fait partie de base309, actuellement137324B/SHA92478d02fa089b48dc54c5c3c13694c3c8c543ad9fb436629ae94d989f8344fc. Cette copie seulement peut recevoir l'instrumentation. Ne modifier ni COMPOSITION_RECEIPT, ni la source qualifiée d'origine `.tmp/m2-s1-candidate-r2`, ni le dépôt canonique. Livrer l'overlay codec avec ancien/nouveaupin ; ne plus annoncer309base intacts mais308+ce delta déclaré. Les preuves historiques restent attachées au codec sans instrumentation ; l'équivalence inactive sera revue statiquement, pas une nouvelle campagne450+9 implicite.

## Contrat du diagnostic

1. Module basniveau sans imports métier, filesystem, SQL, process, worker, provider, EventLog ou config. APIs internes uniquement aux quatre consommateurs autorisés, pas de réexport public/RPC, envflag ou callback caller. Inactif par défaut ; activation/reset/phase/finish explicites dans le seul test ciblé. Session unique synchrone sans simultanéité ; activation imbriquée/overflow/mauvais token rendent le diagnostic incomplet, jamais une nouvelle erreur produit ou un résultat valide inventé.
2. Entrée/sortie directes aux trois sites bindExecutionSourcesV1, replacementStage120 et finalDocumentV1. Conserver expressions/ordre/returns/SQL et toutes branches de garde. Une seule exécution du corps ; finally enregistre aussi les throws et la même exception reste propagée. Retour CodecResultok:false, stagenull, succès et throw comptés séparément. Aucun appel évité/caché et aucun résultat/argument modifié par la mesure.
3. Hors activation : aucun scanbytes/horloge/allocation de token par appel, seulement le test d'activité et passage inerte. Vérifier par diff restaurable que les validations et erreurs restent identiques ; pas de promesse de coût strictement nul. Les stats ne sont lues ni par le codec ni par les gardes métier. Défaillance du collecteur ne doit pas masquer un throw ou fabriquer un CodecResult.
4. performance.now et compteursRAM seulement pendant les transactions ; pas d'IO, await, callback fourni, traversal/sérialisation métier supplémentaire ou modification de preuves. Les bytes sont Buffer.byteLength de chaînes déjà disponibles (origin.document.utf8, stage.document.utf8, doc.utf8), pas ref.byteLength déclarée. Indisponible avant erreur est explicitement unknown/unavailable ; pas fauxvolumecomplet0. Les strings/objets métier ne sont pas retenus dans les agrégats.
5. Données bornées par ensembles fermés phase/site et petite pile bornée. Comptages, retours/rejects/null/throws, inclusif/max et bytes par occurrence, pas volumeunique ou mémoiretotale. Résiduel = span moins enfants instrumentés directs, **pas temps propre absolu**. Union des spansracines séparée, ne pas additionner les inclusifs pour expliquer une phase ; coût noncouvert/GC/SQLite reste inconnu. Débordement/stack incohérente=>incomplete, pas extrapolation.
6. Phases lexicales du test, horsTX : fixtureoldFinal+constructionNEW, stageNEW, swap, ancienactivate, collecte/finalfrais, freshactivate, assertionsrestantes/close. Conserver toutes assertions d'origine sur rejetSTALE, refs/ordinal2/COMMITTED/counters. Un finally couvre construction et cleanup ; l'erreur de produit/fermeture garde sa priorité. Finish désactive puis rend un snapshot détaché ; purge même si erreur. Un unique logJSON borné est émis **après fermeture OWN et horsTX**, sans données métier brutes, vers les logs de la future gate.

## Validation source et livraison

Livrer cinqhashs (dont codecancien/nouveau), imports/APIprivées, diff restaurable des trois fonctions et du test, assertions/cas préservés, preuve d'inactivité et absence de nouveaux cycles, coût/limites de mesure et chemins incomplete. Vérifier les références/consommateurs production utiles avecSerena sans lire les oraclesQA S1/L7. Ce n'est ni optimisation ni PASS : aucun chiffre mesuré avant un run autorisé.

Même reviewer pour ces seuls deltas et risques diagnostics, preuves139/137 hors impact réutilisées. Après gel/revue, parent fermera compilation et une future gate diagnostic sur OWN/asset neuf, mêmesassertions15s/plafond fini, mesure rouge toujoursFAIL. Pas de nouvelle matrice de reviewers ou couverturemaximale.

Source uniquement : aucun import évalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Aucunprofilingautorisément déduit de ce GO. Les trois chemins thread restent HOLD125, aucune sûreté native ou confinement accordé. S2/M2/remplacement/S1concret global/contention non acceptés ; trois commandes consolidées non lancées.
