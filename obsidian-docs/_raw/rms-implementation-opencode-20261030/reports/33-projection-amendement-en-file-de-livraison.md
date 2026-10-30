# 33. Projection : amendement en file de livraison, candidat non recevable en l'état

## Problème observé

Le développeur annonce un delta sans table/API d'approbation, alors que l'amendement32 impose une approbation privée exacte après publication. Le parent a vérifié les sources actuelles : la table et la méthode prévues sont absentes. Ce delta ne peut donc pas être reçu comme conforme au contrat amendé.

La vérification native distingue un problème de transmission d'une décision technique ignorée : les messages parent d'amendement sont encore dans l'inbox avec `delivery=queue`, tandis que la lecture bornée de l'historique user ne montre que le prompt initial. Cela ne prouve pas que le développeur a effectivement reçu et traité32. Les documents locaux sont néanmoins déjà disponibles dans son worktree autorisé.

## Décision et suite

Le parent demande un point d'arrêt local avant une livraison revendiquée conforme et la lecture du rapport32 local et des messages disponibles au prochain point sûr. La même session peut ensuite corriger vers l'approbation privée déjà autorisée, sans nouveau GO utilisateur, nouveau worker, contournement d'outil ou mutation API directe pour forcer la livraison.

Une finale complète est ensuite reçue pour le commit `dba86c50d95c1bcf286621f7e4e37987d4398a56`, sur le socle56d6a35d, six chemins. Elle confirme encore la variante sans table/API privée. Cette livraison est conservée comme version intermédiaire, **non acceptée et non testée comme conforme32**. La même session est reprise avec instruction explicite de lire l'amendement local et d'adapter son delta, sans reset ni amend. Les compteurs de tests écrits du worker ne sont pas des résultats exécutés et ne satisfont pas l'obligation privée manquante.

Mise à jour : le développeur confirme ensuite avoir reçu32 comme correction active distincte des messages31 retardés et reprend le candidat sans réinitialisation. Il annonce l'ajout de l'approbation privée et de sa révocation, puis précise la migration locale6→7 et les quatre attentes de métadonnée à aligner. Cette extension mécanique est autorisée et bornée dans le rapport32. La transmission est donc prise en compte ; la conformité du prochain code et ses tests restent à recevoir, sans PASS anticipé.

La table est une extension privée additive du GraphStore et de l'identité parent existants, pas une nouvelle autorité. Les grants prospectifs seuls restent des limites de scope. Aucun test d'approbation n'est exécuté et aucun PASS n'est déduit d'un éventuel succès du delta incomplet. Les sources ne sont pas encore pinnées pour réception.

Le périmètre v2 hors ligne et le manque explicite v3/natif restent inchangés. Le parent poursuit la coordination, pas une attente d'autorisation utilisateur ; il attend la prise en compte effective du contrat avant de qualifier ce candidat.

## Preuves et limites

- Matching exact worktree graph-store.ts : aucune occurrence de `ff8_graph_next_context_approvals` ou `approveNextContextArtifact` au contrôle.
- GET read-only de l'inbox de la session possédée `ses_e7b75aefeffefXXnyaOA5BAdlv` : six messages en queue, dont les amendements `msg_18493d7f50017b3QHLFwQe6TnN` et `msg_18494d33b001KN5hvO1bNAvAit` contiennent la table privée ; premier contient la référence rapport32.
- Le GET borné des messages user ne retrouve que le prompt initial ; pas de conclusion générale sur tout l'historique ou sur la cause interne du délai.
- Fichier local déjà livré : tools/ff8-harness/evidence-private/mission-context/AMENDEMENT_PROJECTION.md. Aucun secret, raisonnement privé ou réponse API brute persisté dans ce rapport.

Localisation : livraison des décisions et conformité du delta en cours. Impact : réception/QA différées jusqu'à prise en compte32 ; pas de reset ou relance destructive. Limites : aucune approbation privée encore réalisée/prouvée, aucune clôture globale.
