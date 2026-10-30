# 6. Remplacement documenté : ne pas choisir un correctif sans preuve

## Résultat d’étape et conséquence

L’[étude du remplacement](../../../../docs/missions/re-graph-scheduler/rms-static-documentation-20261028/03-remplacement-options-et-arbitrages.md)
est reçue dans sa portée documentaire. Elle ne sélectionne pas de nouvelle
optimisation : les mesures conservées ne prouvent ni son bénéfice ni la nécessité
d’un changement de stockage. Le dossier localise ces inconnues au lieu d’inventer
une solution ou de relancer le diagnostic arrêté.

Les optimisations déjà présentes sont identifiées : audits immédiatement doublés,
mémo stage153 et clés164. Les reproposer ferait refaire un travail existant.
Les validations séparées par un append durable ne sont pas des doublons adjacents :
le parent a relu la consommation LIVE et l’append pré/postvalidation dans les sources.

Les alternatives rejetées sont motivées : cache de verdict inter-appels incompatible
avec l’autorité courante, et priorité à la suppression de la copie ciblée non
justifiée par ses 4,2234 millisecondes mesurées. Une représentation persistée
normalisée reste une option architecturale non choisie, à arbitrer si son besoin
et son bénéfice deviennent démontrés.

## Suite documentaire engagée

L’auteur des oracles reprend le plan indépendant L7 et les quatre études reçues.
Il ne crée aucun oracle exécutable et ne lance aucun scénario. La consolidation
parent est préparée en parallèle : fiches de travail et registre des décisions,
avec D5 et la revue finale encore à intégrer avant réception finale.

Le délai, la fin native des threads et quatre origines contre plafond trois
restent séparés. Aucun budget historique, nouveau root, timeout relevé, filtre
présenté comme suite complète ou nouvel appel scientifique n’est autorisé.

## Traçabilité et limites

Finale D3 retrouvée sans remplacement après défaut de récupération :
`ses_e7c4d0590ffe0ltmz2cox0pJWX`, `msg_183b6d46b001pDkikMa35SHNtl`,
`finish:stop` puis idle/succeeded, Sol xhigh conforme. Auteur arrêté après réception.

Auteur D5 : `doc-oracles`, session `ses_e7c4576dbffeS2OXHoPPfYqJ8B` ;
`Model.Ref={providerID:openai,id:gpt-6.1-sol,variant:high}` lu nativement,
sans override. Le dossier et sa revue restent à terminer.

Aucun test, nouvelle mesure, base, module produit, source historique ou code
logiciel modifié ; publication documentaire seulement. Le projet logiciel
reste partiel/bloqué dans les périmètres identifiés, sans nouvel arbitrage utilisateur
nécessaire pour continuer la documentation autorisée.
