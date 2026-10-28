# M2 — 26 : candidat dispatch offline livré, typing/revue du delta

## Livraison et contrôle parent

W2 = namespace dispatch-20261026-r1 de l'auteur. Paquet DISPATCH_REPORT/RECEIPT/CONTRACT/DIFF et DISPATCH_RUN_INPUTS livré. Parent vérifie **37/37pins, zéro écart**,6219octets/SHA `1ee16314d47c6e638437c806d7c50d2092a3a1f73c184ef1d31acd3aeee0f544`. Comparaison au manifeste précédent984de… : quatrepinsprod changés seulement, differential/native-proof/native-ast/collector. B1lifecycle/B2source-audit, sources scientifiques et fixtures du manifeste sont byte-exacts ; pas de nouveau module child (13) ou pin de plus.

Source test nouvelle dba355… avec nouveauxpoints caller961:28/factory589:74/target608:9, distincts de l'ancien RAW20833f586/998/629/648. Schémas binding/catalogueV3 et dispatchSource explicites selon livraison ; doivent être revus, pas considérés automatiquement qualifiés par versionJSON.

## Tests annoncés et bornes

Auteur : quatre invocations offline consommées, dont première16/31 avec fixturealias contaminée consignée séparément, rouge exact46/1 puis vert47/0 sur mêmefixture, final49/0/140 avec négatifs d'omission et FULLerror-proof. Aucun test scientifique ou collecteur exécuté. Parent doit lire les logs/receipts, pas extrapoler49à450. Ancien run échoué et preuve neufPASS restent historiques intacts.

## Décisions

1. Typechecker la version finale modifiée avec configW2/tsconfig.parent-dispatch-r1.json déjà préparée : strict/noEmit et mêmes TS/declarations/supports, sixentréesconsumer/testdispatch/3helpersroot-child/9reg+fermeture. Une invocation60s, diagnostics/inputs/config/logs conservés. Aucun module scientifique évalué ; CJS reste non typé sémantiquement.
2. Même reviewer indépendant réactivé uniquement sur contrat/code dispatch et impact : témoinSOURCE privé depuis itération effective+index et FULLproof admis/relus, objets/owner/grantsnonfabriqués, ASTsourcebinding/mappingnouveauxpoints, liste23exacte, relationtousindices/directbranch et schémasV3/collecteur. Les avisB1/B2 et receiver/invariants inchangés restent acquis dans leur portée.
3. Vérifier vraies données de binding/catalogue/SEAL de l'ancien run et nouvellesourceéditée comme deux versions distinctes ; aucune trace future fabriquée, pas de648inventé ou JSONwitnessauto-authentifiant.
4. Pas de runscience à ce jalon. Après typing/revue recevables, présenter un éventuel arbitrage d'exécution supplémentaire précis ; budgetinspecté1/1consommé ne disparaît pas avec le nouveau candidat.

## Limites

Numeric450 pas qualifié,208historiqueincomplet et209..449nonexécutés. NeufPASS valides pour sources/conditions inchangées, pas rejoués. Trois checks globaux/integrationS1/suiteM2 nonclos, aucun Git final/clean/install/configglobal/jeu/live/IDA/Docker.

## Typing initial du dispatch et correction strictement typologique

Invocation parent-dispatch-typecheck-01 réellement exécutée : exit2, un diagnostic TS2769 (sept lignes de détail) dans le nouveautest128. Bun expect infère une union littérale depuis DISPATCH_POISONS ; l'oracle indépendant est string[] et ne satisfait pas l'overload tropétroit. Aucun défaut de source scientifique, ni runtime de test exécuté par ce typing.

Parent a corrigé exactement cette assertion : `expect<string[]>([...DISPATCH_POISONS]).toEqual(oracle)` au lieu d'inférence implicite. Aucun any/ts-ignore, oracle attendu, cas, comparaison ou code de production modifié. Le paramètre générique est effacé à l'émission : vérifier explicitement l'égalité du JStranspilé ancien/nouveau sans l'exécuter, puis secondeinvocation noEmit pour la correction affectée. Ne pas rejouer49tests si l'émission est byte-exacte. Le reçu test de l'auteur reste historique avec son hash d'alors ; une preuve parent lie la correction typologique, pas réécriture du reçu.

## Contrôles effectivement obtenus

`W2/evidence/parent-dispatch-type-only-erasure.json` : ancienhash test82e558… conforme au pin du reçu auteur ; nouveauhashcfc3aac… ; JSémis ancien/nouveau **byte-exact**SHA9441da… sans exécution, zéro diagnostic de parsing. Les49tests restent réutilisés, pas nouveau run.

`W2/evidence/parent-dispatch-typecheck-02.json` : **exit0, zéro diagnostic, stderr vide**, lie config/compilateur/manifeste1ee163… et nouveauhashtest/receiptdecorrélation. Typing final du consumer+helpers+test+neufreg fermé dans cette composition explicite, pas CJS ou science.

Footers des logs offline lus par le parent : rouge exact46/1/130assertions puis vert47/0/137, final49/0/140. La premièrefixture16/31reste conservée distinctement. Même reviewer réactivé sur l'amendement final/delta et impact, nativebusy confirmé ; preuve typing et correction typologique transmise, aucun nouveau test attendu de sa part.
