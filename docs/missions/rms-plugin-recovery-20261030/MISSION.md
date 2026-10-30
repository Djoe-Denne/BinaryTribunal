# Reprise RMS comme plugin interne OpenCode V2

Statut : mission corrective préparée, non démarrée. Date : 30 octobre 2026.

## Objectif et correction

Réaliser le parcours statique RMS de bout en bout comme plugin chargé par l'instance OpenCode V2 hôte. Utiliser ses sessions, son client interne, sa connexion existante et ses permissions. Pas de contrôleur d'une seconde instance, nouvel OAuth ou service séparé par défaut.

La mission précédente est clôturée partiellement, sans réussite M2. Ses acquis statiques restent réutilisables selon leur contrat. Les essais d'instance isolée ne prouvent pas l'intégration plugin. Cette voie utilisait bien l'API publique OpenCode ; sa nécessité n'était pas établie. Après HOLD, la persistance Auth reste inconnue : ne pas supprimer, copier ou réinitialiser la base privée.

Lire CLOSURE.md, archive/README.md et le plan accepté ../re-graph-scheduler/rms-static-documentation-20261028/. Les sources historiques ne sont pas des autorisations présentes. Ne pas exposer les sorties croisées des archives aux auteurs/reviewers aveugles.

## Plan proposé pour la future mission

1. Identifier le point d'entrée plugin réel, les hooks, le client fourni par l'hôte et leurs versions. Vérifier leurs contrats par sources et références ciblées ; examiner les consommateurs avant changement. Ne pas présumer le prototype distant compatible.
2. Ratifier le contrat interne : instance/sessions, admission liée aux octets émis, permissions et Model.Ref effectifs, événements/provenance, persistance et reprise sans second effet. Pas de transfert de droits par copie. Un silence ou idle n'est pas une fin native.
3. Réutiliser commandes ordonnées, obsolescence durable, publication et projection. Conserver les registres existants ; aucun crédit, origine ou autorité remis à zéro. Écarter du chemin actif le lanceur et l'authentification de l'instance séparée.
4. Qualifier d'abord chargement et raccord plugin sans modèle ni IDA, puis les scénarios ciblés existants : réponse perdue, reprise, résultats tardifs, obsolescence et publication unique. Une fixture reste une fixture.
5. Après contrats et permissions réellement établis, réaliser un petit parcours statique IDA attribuable : acquisition, auteurs indépendants, revue/réconciliation, publication relue puis prochain contexte avec nouveaux contenus. Le cluster historique autour de 0x4ADD10 n'est pas un résultat acquis de ce parcours.
6. Revue indépendante fresh des frontières affectées, correction des bloquants et acceptation consolidée du parent. Réutiliser les preuves valides, sans nouvelle étude générale ni recherche de couverture maximale.

## Vérification à proposer dans config

Niveau reinforced. Fermer commandes et chemins avant exécution. Typecheck et tests ciblés selon impact ; test:q1-primitives après inspection des imports/permissions. bun test global reste interdit si sa sélection atteint HOLD125 ou un autre arrêt. Dix minutes maximum par test, bilan réel des durées ; aucun SKIP compté PASS.

Critères : plugin réellement chargé dans l'hôte identifié, sans seconde instance ; admission/modèle/permissions/provenance/fin observables ; autorités conservées ; obsolescence sans retry implicite ; publication unique et readback exact ; scénario final et prochain contenu réellement prouvés ; zéro bloquant requis et acceptation parent. Preuve indispensable inaccessible/interdite = bilan partiel.

## Limites et activation

OpenAI exclusivement, modèle/variante selon politique future approuvée et vérifiée. Aucun achat, changement global, accès secret ou contournement. Trois origines durables maximum, bootstrap compris. HOLD125/threads, diagnostic gelé, quatre origines et campagnes acquises restent arrêtés. Pas de FF8 live, mutation IDB ou exécution du code reconstruit implicites. L'obsolescence logique ne prouve pas la quiescence physique.

Ce document ne crée aucune tâche opérationnelle et ne vaut ni politique approuvée ni start. Configurer et démarrer explicitement la future mission selon le protocole natif, sans réactiver les anciennes files.
