# M2 — 152 : diagnostic complet, le final frais concentre le coût

## Résultat et séparation des verdicts

Gate151 : **0PASS/1FAIL,7assertions**, un seul test,107302ms, exit1 sans signal, une invocation sans retry. Le test dépasse15s après107110ms : il reste FAIL. Le diagnostic est en revanche complet : une ligne JSON aprèsclose, incomplete:null, sept phases atteintes, valeursfinies, source148 stable et hashesvérifiés. Le statut diagnostic ne qualifie pas le produit.

Typing150vert et revues147/149 restent les preuves de l'instrumentation ; aucune réexécution scientifique450+9 ou commande consolidée. Les anciennes mesures noninstrumentées ne servent pas de benchmark causal.

## Ce qui est mesuré

- Total des phases :107109,73ms. Collectefinalefraîche52329,97ms puis activationfraîche40603,12ms, soit86,76% du total.
- Les spansracines des trois sites instrumentés couvrent60099,41ms ;47010,32ms restent non couverts. Ce reste n'est pas attribué arbitrairement àSQL,GC ou une fonction.
- bind :280appels,8297,07ms inclusifs,18214598octets mesurés par occurrence.
- replacementStage :185appels,47471,51ms inclusifs, dont42735,60ms de résiduel sans enfantsinstrumentés directs ;1126143342octets par occurrence,32appels sans chaîne disponible (branchesnull notamment). Ce n'est pas1,1Go de documents uniques ou de mémoirepic.
- finalDocument :537appels,9066,74ms inclusifs,1256388150octets par occurrence, sans unavailable. Ne pas additionner son temps avec tout autre inclusif imbriqué pour expliquer le total.

Autres phases : fixture2546,29ms ; stageNEW2149,32ms ; swap8198,16ms ; ancienactivate63,37ms ; assertions-close1219,51ms. Toutes sont entrées dans cet échantillon, mais les coûtsinternes noninstrumentés et l'overhead restent inconnus. Les métriques ne prouvent pas un gain futur ni l'absence de tout autre goulot.

## Intégrité

UneDB/40751104octets et unasset/troisentrées conservés :0unowned/0hashdrift/manifeststable/processExited. Aucun SQL de diagnostic, cleanup ou thread lancé. Logs/reçu/diagnosticJSON vérifiés ; receiptc9a2481f… et diagnostic807b48d9… . Overlaycodec146 et308base intacts selon contrôles, aucun compteur/preuve scientifique requalifié par ces stats.

## Prochaine préparation RO fondée sur les mesures

Autoriser l'auteur à lire le diagnosticJSON et les sources connues, **sans code ou nouveau run**. Priorité : les chemins de collectefinale/activation qui réauditen le même stage et recopient/reparsèment ses inventaires/documents. Relier les185appels et les volumes répétés aux callers précis ; distinguer les contrôles LIVE réellement distincts des calculs purs de contenu identique. Les47s noncouverts doivent rester inconnus tant qu'aucune preuve supplémentaire ne les attribue.

Proposer le plus petit delta compatible avec les mêmes documents/frames/records et toutes les gardes courant/metadataSQL/revocation/Q/TTL avant/aprèsappend. Nommer les clés et la durée de vie d'une éventuelle réutilisation pure, les données effectivement relues à chaque frontière et comment une mutation adverse reste détectée. Ne pas relâcher un contrôle sous prétexte qu'il est appelé souvent ou que son contenu est gros.

Ne pas optimiser le seul bind en promettant résoudre107s : sa part mesurée est limitée. Éviter une nouvelle campagne de mesures aveugle ; un compteur supplémentaire ne doit être proposé que s'il tranche une décision précise indispensable. Si le format persisté, le contrat public, un cache d'autorité global ou une autre architecture est indispensable, nommer cette frontière et ses options **avant** implémentation/arbitrage. Aucun changement de représentation implicitement autorisé.

Retour court : causes/attributions prouvées et inconnues, callers et calculs répétés, delta minimal/fichiers/risques/invariants/validation affectée, impossibilité éventuelle sous15s sans changement structurant. Aucune promesse chiffrée fondée sur le simple retrait d'appels.

## Permissions et limites

RO seulement, message sans écriture/import/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Sources148/inputs122 et tous artefacts gelés, aucune DB ouverte. Gate151 clos rouge pour le produit et diagnosticconservé. HOLD125 intégral ; seuil15s/300s inchangé. S2/M2/remplacement/S1concret global/contention non acceptés et troiscommandesconsolidées nonlancées.
