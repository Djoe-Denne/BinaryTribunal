# M2 — 49 : premiers contrôles QA verts, composants historiques DATA fournis

## Résultats indépendants lus par le parent

Reçus/logs Q/evidence (Q=.tmp/m2-s1-qa-r2), sans rejeu : wire-run32PASS/0FAIL/122assertions ; fixed-projection4PASS/0FAIL/11assertions ; isolation1PASS/0FAIL/5assertions ; typing de cette version QA exit0. Ledger courant4runs/0reprise/1803ms/nonbloqué. Handoff QA implementation/high confirmé par Model.Ref natif Solhigh.

Portée limitée explicitée par le worker : primitives/wire strict et inspections malformées, projection de snapshot manuel fixe, garde d'isolation ; **pas encore les nominaux complets enveloppe/run/root/knowledge/context**. Un typing réussi de la version QA partielle ne vaut pas typing des futurs fichiers complétés ni acceptation S1. Les preuves valides déjà acquises ne sont pas rejouées par convenance.

## Demande de données et constat borné

Le worker demande un input historique DATA-only permettant de construire des nominaux sans producteur candidat ou fixture auteur. Parent examine le manifeste S1 51 et les reçus planner nommés : le paquet contient sources/schémas/contrats/reçus, pas un bundle brut snapshot/mission/transport/groups/planning/sources déjà qualifié au contrat01–07. Les415tests qualifient le planner offline, pas un tel bundle S1 ; pas de recherche massive ou ouverture des traces FULL593Mo pour prétendre le contraire. Ce n'est pas une preuve d'absence partout sur disque.

## Fourniture finie sans oracle auteur

Trois snapshots historiques JSON **sans attendus** ont été vérifiés conformes aux pinsGO, puis copiés byte-exacts RO sous `Q/inputs/historical-snapshots/` :

- isolates.json :3057octets,1node/0edge,SHA658b4381… ;
- ff8-self-loop.json :4309octets,1node/1edge,SHA0fe3ac5b… ;
- components-disconnected.json :4131octets,2nodes/0edge,SHA71079dd2… .

Total11497octets ; origins/bytes/hashes/readbacks dans [s1-qa-historical-snapshot-inputs.json](../evidence/s1-qa-historical-snapshot-inputs.json) et INPUT_MANIFEST.json local. Aucun producteur ou test lancé, fixture/golden auteur copié ou code source modifié. Ces fichiers sont des composants d'entrée, **pas un nominal S1 déjà accepté**.

## Décision et continuation

Lire ces trois JSON comme données pinnées est autorisé ; conserver leurs hashes/origines dans le ledger QA et vérifier les bytes utilisés. Construire les autres composants mission/transport/group/planning/root/knowledge manuellement à partir des contrats/sources qualifiées, sans SUT appelé pour fabriquer l'attendu. Le plan manuel reste viable ; ne pas attendre une qualification préalable du nominal dont la QA doit justement vérifier les joins.

Aucun nouveau budget, commande, framework ou modification du runner/projection42 ; ces3inputsRO sont séparés des42sources immuables. Les groupes restants et les compléments nominaux pertinents continuent sous GO48, reprises limitées aux contrôles affectés et quota courant. Nouvelle erreur technique ou manque précis → diagnostic, pas oracle relaxé ni transfert des attentes auteur.

Trois checks consolidés M2 toujours NON EXÉCUTÉS ; S1/API non encore qualifié, intégration/S2–S4/L7exécution/L9/L10 restent distincts. Pas de Git/DB/native/live/IDA ou nouvelle ressource.
