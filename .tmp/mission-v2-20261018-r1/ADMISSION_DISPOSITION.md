# Disposition admission — révision 1

Le reçu d'accès L1 initial est conservé. Le self-claim in-turn du successeur
task_mvdlr82o_000t_adde4x a été refusé par le harness :
« Mission assignments require an idle routed execution boundary: ask the lead
for dispatch/spawn, not an in-turn self-claim ».

Aucune analyse, mutation ni tentative de contournement du worker après refus.
Ce n'est pas une panne provider, un défaut du produit ou une preuve de quota.

Résolution parent : contexte de la tâche pending versionné en fork de notre
propre auteur d'accès idle ; nouvelle admission native par team_spawn, sans
override modèle. l1-b1-analysis-r1 / ses_eb1b998bdffe1UIItgakc7QAjU est admis
sur le successeur. Model.Ref effectif vérifié : opencode-go/glm-5.3-flash max.
L'ancien auteur l1-b1-search-r1 est shut down ; ses reçus restent conservés.
Le fork ne revendique aucune indépendance de review : même rôle recherche,
aucune analyse antérieure, ACK et GO acquis. La review ultérieure restera fresh.

V3 : ACK 14/14, 250 521B et hash manifeste concordants ; GO de lecture/plan
statique transmis et worker réactivé explicitement sur sa tâche IN_PROGRESS.
Pas d'approbation d'écriture ; pas de compilation ou exécution autorisée.

Toutes clôtures historiques, intégrations, ownerships et gates demeurent
inchangés. Les receipts d'admission sont distincts des résultats scientifiques.
