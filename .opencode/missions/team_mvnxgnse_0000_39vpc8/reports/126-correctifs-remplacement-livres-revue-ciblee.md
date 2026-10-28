# M2 — 126 : correctifs livrés, revue ciblée et contention toujours bloquée

## État vérifié

Le parent a vérifié les tailles et empreintes des huit fichiers124 modifiés, les quatre autres fichiers120 et les deux entrées122 inchangées. Les douze fichiers sont gelés readonly. [Manifeste corrigé](../evidence/s2-replacement-source-124.json) ; version antérieure conservée sous snapshots/s2-replacement-123.

L'auteur annonce50cas écrits, dont les28précédents et22variantes ciblées. Aucun cas n'est exécuté, aucun typing/import/thread/SQL/asset. Les trois corrections et l'atteignabilité du final restent à confirmer par revue ; leur prose n'est pas une preuve de fonctionnement. La contention reste HOLD125 avant toute exécution lançant un thread, même si les attentes sont maintenant bornées.

## Reprise indépendante proportionnée

Reprendre le reviewer retenu sur les trois défauts123 et l'impact des corrections124. Réutiliser ses constats source/counters/swap/histoire/opener/dépendances valides hors impact ; pas de réaudit général des131tests, de nouveau pipeline ou framework.

1. ObservationNEW : vérifier que finalOwnRows accepte sa ref seulement après validation positive du stage, événement, observation, T0/source/parent et préimages exacts. LIVE ne doit pas transformer un replay historique en autorité courante ; les nouveaux liens ne doivent pas masquer un record orphelin. Vérifier nominal statiquement atteignable et négatifs stage/observation/révocation/knowledge-join sans garde antérieure masquante.
2. HOSTcourant T2 : vérifier les preuves réellement consommées et figées dans la tentative/final, leurs liens record/proof/cap/case/source/allocation/epoch, et la relecture du même port installé avant et après appendattempt/outcome. Les mutations externes sans register DB doivent invalider l'autorisation. Aucun nouveau snapshot rafraîchi, cache ou epoch seul ne doit donner autorité. Les audits de commit/histoire lisent les preuves retenues sans provider LIVE nouveau ; branches sansremplacement et OLDSTALE inchangées.
3. Thread : vérifier les bornes WORK5s/CLEANUP2s réellement appliquées à toutes attentes/rendezvous/reply/exit/terminate/collecte, restauration du spy/signaux et erreurs primaire/nettoyage séparées. ExitObservé doit être posé exclusivement par l'événement exit, jamais par terminate résolu ou timeout. Les fautes locales avantreply/aprèsreply doivent tester les chemins annoncés, pas prouver une garantie native absente. Le coût setup/SQLsynchrone/scheduling n'est pas mesuré ; ne pas affirmer wallclock≤15s ou joindre un thread seulement parce que le timeout de test existe.

Le reviewer distingue la correction source des attentes non bornées, qu'il peut accepter statiquement, de la condition anti-orphelin toujours non obtenue qui bloque RUN125. Ne pas requalifier cette limite en suggestion ou waiver ; aucune nouvelle infrastructure externe requise dans ce mandat de revue.

## Permissions et suite

Revue strictementRO : lectures/hash/AST/références bornées, aucun import évalué, replan/seal/bind, typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA S1/L7. Pas de claim/complétion de la tâche globale, propriété du lead. Retour par défaut corrigé ou bloquant précis contrat/source/scénario ; suggestions différables à part. Aucun PASS runtime.

Après revue, le parent pourra fermer une préparation de gate sans thread et traiter séparément la permission/sûreté de la contention. Aucun lancement ou gate n'est autorisé ici ; les cas non lancés restent explicitement non exécutés, pas SKIP comptés PASS. S2/M2 ouvertes, remplacement non obtenu ; les trois commandes consolidées restent non lancées.
