# V3 evidence — review indépendante, données seulement

Source matrix acceptée après V, compilation et5invocations parent faites sous
gates séparées. Le parent demande un audit des receipts/raws/binaires, PAS une
ré-exécution ou une qualification FF8. Fresh, aucun fork du source reviewer.

ACK-HOLD : lecture/hash effectifs de tous pins puis plan/GO parent distinct,
tâche reste IN_PROGRESS. Après GO : re-dériver la correspondance par cas,
contester le décodeur parent si ses attentes ne suivent pas le source.

Vérifier :
- compilation9sources exactes,toolchain/argv/PE/EXE hash ; image EXE en entrée
  est une donnée à hasher/lire en octets seulement, JAMAIS à charger/exécuter ;
-5cas,uneinvocationchacun,exit naturel0/pas timeout,stdout unique borné,STATE/
  PHASE/OUTCOME/compteurs/injections cohérents ; CAS S/ACK négatifs attendus,
  pas PASS. g=null signifie valeurs typées UNKNOWN, pas quiescence/retentionfalse ;
-8fichiers par cas,tailles/SHA réels vs receipts,GR/SupervisorReceipt192égaux
  pour D/ACK,6autres0 ;8slots0 pour S/G/attestation ;pas donnée inventée ;
-recordsGCV3/version1,identités et limites réelles0x2208/8/4GiB. D padding168..191
  zéro ; ACK168..190zéro/octet191=1. Source WritePublication écrit0..167 seulement
  puis mutation annoncée ; publication pré-ACK distincte du résultat final :
  ACKrecord natural/nohold vs finalquarantine est attendu. Pas de comparaison
  intégrale contre une publication originale jamais persistée prétendue ;
-claims limités : événementsD/S stand-ins,GthreadpostRun-préACK seulement,
  budgetcross-processNOT_PROVEN,last-closecase6NOT_ESTABLISHED,stderr enfant
  non observé,réservation tenue≠release,pas full44/G5-G7/intégration ;
-pas d'exception de contrôle,répétition ou capture perdue dissimulée par le wrapper ;
  constater toute divergence source/script/receipt,distinguer parentbug et produit.

Rapport ACCEPTABLE_EVIDENCE_SCOPED|CORRIGE|BLOCK,3–8preuves path:ligne/offset,
rehash final,aucune source modifiée. Ne pas réparer ni relancer un cas. Toutes
origines hors paquet sont provenance uniquement, accès refusé. Parser/hash/PE/
comparaison JSON et binaire en données permis ; aucun exécutable,compile,
import produit,validator/test/probe,API native/processus/DB/git/IDA/live/réseau/
délégation/écriture. Erreur d'entrée/outils -> parent, pas arrêt global des
branches saines et pas demande d'un GO utilisateur de routine.
