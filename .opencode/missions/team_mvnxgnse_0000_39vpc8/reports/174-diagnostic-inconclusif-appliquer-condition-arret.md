# M2 — 174 : diagnostic inconclusif, appliquer la condition d'arrêt

## Résultats vérifiés

Compilation172 verte. Diagnostic173 réellement **0PASS/1FAIL,7assertions**,93762ms processus/test93552,95ms,1run0retry,exit1sanssignal,source170stable. Paquet clos rouge. Unique diagnostic complet :septphases×cinqsites exacts,incomplete:null,valeursfinies,logs/reçu/diagnostichashsvérifiés. UneDB/40751104octets,unasset/troisentrées conservés,0unowned/0hashdrift/manifeststable/processExited. Aucunthread,SQLdiagnostic oucleanup.

## Tri préenregistré appliqué, sans ajustement après résultat

Sur freshCollect+freshActivate,F=80818,7674ms ;A=résiduelreplacementExact21614,6462ms ;B=résiduelownCategoryCompare665,5603ms. A/B≈32,48mais(A+B)/F=27,5681%, **inférieur aux50% requis**. Résultat : **INCONCLUSIF**. La condition de couverture n'est pas satisfaite, donc aucune prioritéA ouB n'est accordée par ce protocole. Ne pas sélectionnerA en ne citant que son ratio élevé, ni abaisser50% après coup.

Dans toutletrajet,2214appelsreplacementExact/24508,16ms et3812284846octetsparoccurrence ;50comparaisonsOWN/2103,72msinclusifs/703,32msrésiduels. Stage185calls34574,72msinclusifs/20713,88msrésiduels cinqsites ;finalDocument537calls8957,37ms ;bind280calls8106,59ms. Réduction du résiduelstage par nouvelenfant n'est pas gain ; volumesrépétés ne sont ni mémoirepic ni documentsuniques. Le temps nonexpliqué reste nonattribué, pas une preuve d'impossibilité15s.

## Décision et préparation suivante bornée

Appliquer l'arrêt de cette sélectionA/B : **aucun algorithmeA/B, nouveau compteur, patch ou run autorisé**. Seuil15s/HOLD125 inchangés ; les septassertions terminées ne font pas unPASS. Ne pas étendre le diagnostic de procheenproche ou changer le critère sans décision explicite.

Autoriser uniquement une synthèseROcourte des options restantes : ce que les preuves ferment ou non, alternative technique nonspéculative déjà dans le périmètre si elle existe, ou besoin précis d'une extension/arbitrage. Réutiliser les mesures et le code connus, aucune nouvelle méthode exécutée. Une proposition de nouvelle mesure doit nommer la décision concrète qu'elle trancherait et le changement de périmètre ; ce n'est pas unGO. Distinguer manque de preuve, impossibilité démontrée et simple estimation. Aucun besoin architectural n'est encore prouvé par ce résultat.

La prochaine décision structurante, si nécessaire, sera présentée à l'utilisateur avec options et conséquences ; ne pas transformer un échec de tri enpermission tacite d'une nouvelle campagne. Les missions suivantes ou une acceptationpartielle ne sont pas déclarées acquises. S2/M2 restent nonacceptés, troiscommandesconsolidéesnonlancées, scientifique450+9 nonrejoué.

StrictROsources/helpersconnus et JSON/logs ;aucun write/importévalué/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA/cleanup. Sources170/inputs122/308base+overlaygelés. Preuves172/167/161 et revues horsimpact réutilisées ;pasréauditcatalogue66/131.

## Annexe

Reçu173 SHAd3fc4d9c334878a7ada77cf27fc9a981a07cef2c75a4d9b186a18fd5c0ca2c04 ;diagnosticSHA42f74006ebcd2aa27ead3841377ffad46cf955d86ec98f40861681e80dfd264f. SourceSetc9d7328d…/sourceFiles90a57215…intacts. Evidence s2-measure-170-runtime.
