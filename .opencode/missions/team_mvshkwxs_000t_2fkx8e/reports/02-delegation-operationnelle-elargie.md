# 2. Réalisation RMS : délégation opérationnelle élargie

## Objectif et changement demandé

Réaliser et vérifier le parcours statique RMS sans refaire la documentation acceptée. L'utilisateur demande que le superviseur résolve les questions et prenne les décisions sans lui demander de permissions supplémentaires, en consultant un seul architecte si nécessaire et en utilisant Internet.

Le brouillon local est corrigé en ce sens. Cette correction ne lance pas la mission : la révision exacte doit encore être présentée par config, puis approuvée par start.

## Différence avec la proposition précédente

- Délégation générale après start pour les décisions opérationnelles et architecturales nécessaires à l'objectif ; suppression de la demande systématique d'accord architectural supplémentaire.
- Une question architecturale conduit à consulter **un seul agent architecte**, avec recherche Internet explicitement autorisée. Le superviseur tranche et garde l'intégration et l'acceptation finale. Aucun agent supplémentaire n'est lancé pendant cette préparation.
- Les autres questions sont résolues par recherche et décision du superviseur, sans questionnaire ni GO intermédiaire.
- Les limites incontournables sont consignées comme blocages ; elles ne deviennent pas une boucle de demandes de permission ou de sondes.

Cette délégation est persistée dans `autonomy.instructions`, champ dédié déjà présent dans la politique ; aucun champ ad hoc ni changement de classification, modèles ou configuration globale.

## Ce qui reste inchangé

OpenAI uniquement, même modèle par tâche, seuil de planification 50, absence de classificateur. Le plan en six étapes du [rapport précédent](01-plan-realisation-et-contrat-propose.md) reste valable ; ses demandes d'accord architectural supplémentaires sont remplacées par la présente délégation pour les choix nécessaires à l'objectif.

La vérification **reinforced** reste proposée : plan explicite, preuves ciblées selon impact, revue indépendante finale et acceptation parent. Les niveaux light et proportionate ne sont pas substitués à l'obligation M2. Les commandes et sept critères d'acceptation sont inchangés ; aucun nouveau test ou nouveau chantier n'est ajouté.

L'autorisation générale ne fournit pas un accès technique refusé, ne change pas les permissions natives et ne lève pas silencieusement les arrêts obligatoires : quinze secondes par test, trois origines, chemins threads HOLD125 et diagnostic gelé. Ces contraintes restent signalées, pas contournées. Internet ne remplace ni une preuve native ni les sources épinglées ; secrets et artefacts privés ne sont pas envoyés à des services externes.

## État et prochaine action

Seuls le brouillon et ce rapport sont modifiés. Aucun worker, classificateur ou test produit lancé. La lecture préalable du brouillon confirme la présence du contrat long run et de la QA renforcée ; une vérification de syntaxe JSON et des champs modifiés est effectuée après l'édition, sans exécuter de commande produit.

Recommandation : conserver cette délégation et la vérification renforcée, puis lancer `/ensemble-mission config` pour afficher le contrat corrigé. Si cette révision convient, `/ensemble-mission start` l'activera. Une correction supplémentaire ou un report laisse l'exécution suspendue ; aucun délai ou coût total fiable n'est établi.

Localisation : politique locale de cette mission. Impact : autonomie seulement, aucun code produit. Limites : aucune qualification logicielle ou observation native nouvelle ; l'affichage config, et non ce rapport, présente la révision approuvable.
