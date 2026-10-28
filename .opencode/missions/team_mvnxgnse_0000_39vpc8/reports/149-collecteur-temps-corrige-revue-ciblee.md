# M2 — 149 : collecteur de temps corrigé, reprise ciblée

## Livraison vérifiée

Seul graph-local-measure145.ts est modifié :8021B/119lignes, SHAeda327a1… vérifié par le parent. Les treize autres pins146 et inputs122 sont inchangés ; quatorze sources gelées. [Manifeste148](../evidence/s2-replacement-source-148.json), baseline complète sous snapshots/s2-measure-147.

Aucune compilation/mesure nouvelle ;61cas et leurs assertions restent inchangés. Overlaycodec146 explicitement conservé308base+delta, pas de309intacts ni transfert des preuves scientifiques. Le coût du collecteur et respect15s restent inconnus.

## Revue DIAG-TIME uniquement

Reprendre le reviewer retenu sur ce module et son impact :

- observe145 suit la dernière lecture de session, depuisbegin jusqu'aux phases/racines/leave/finish ; valeur nonfinie/négative ou régression entraîne incomplete/arrêt, égalité admise. Aucune horloge/provider injectable, même performance.now.
- interval/addTime protègent toutes les destinations temporelles avant commit, pas uniquement bytes : inclusif/résiduel/enfants ourootUnion/phase. Vérifier finitude/cohérence et ordre d'update, y compris le contre-exemple1e308 imbriqué et la régression20→15 entre racines. Pas de saturation ou normalisation donnant un diagnostic complet inventé.
- Exceptionproduit/readout/finish et comportement inactif restent ceux acceptés147 ; un appel incomplet n'est pas un outcome validé, mais finish doit conserver la première raison et purger. Aucun nouveau coût d'horloge/token/bytes inactif ou stats d'autorité.

Réutiliser constats147 sur les shells, le test, l'absence d'autorité et le nettoyage hors impact ; ne pas rouvrir les cinq fichiers, la matrice61/131 ou450+9. Retour source prêt pour compilation/diagnostic ou défaut concret source/contrat/scénario. Aucun PASS/performance par le seul raisonnement statique, suggestions différables séparées.

## Permissions et suite

StrictRO lectures/hash/AST/refs bornées ; aucun write/import/replan/seal/bind/typing/test/clockfault/microbench/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Tâche globale lead inchangée. Parent fermera compilation et une gate diagnostic neuve après verdict, mêmes15s et plafondfini, sans rejouer les paquets clos ou créer une infrastructure externe.

HOLD125 sur les trois cas thread intégral. S2/M2/remplacement/S1concret global/contention non acceptés ; trois commandes consolidées non lancées.
