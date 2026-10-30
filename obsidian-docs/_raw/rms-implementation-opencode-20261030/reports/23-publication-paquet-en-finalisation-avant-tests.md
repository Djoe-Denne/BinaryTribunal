# 23. Publication : paquet en finalisation avant vérification

## Objectif et état

Le développeur annonce le code et les tests prêts à geler sur six chemins : trois consommateurs existants, deux modules et un fichier de tests nouveaux. Le superviseur attend le paquet final avec empreintes et sélection exacte avant toute exécution. Aucun typecheck ou test de publication n'est encore exécuté.

## Prérequis de commit vérifié

Le développeur ne pouvait pas inspecter les hooks du dépôt commun sans sortir de son périmètre. Le parent a effectué cette lecture depuis le worktree possédé : core.hooksPath est absent ; les quatre hooks de commit pre-commit, prepare-commit-msg, commit-msg et post-commit sont absents ; le répertoire ne contient aucune entrée hors exemples .sample. Aucun hook exécuté, désactivé ou contourné, aucune configuration modifiée.

Cette confirmation est livrée au développeur : il peut finaliser son commit local borné selon le workflow existant, sans test produit ni bypass. Ce n'est pas une réception du code.

## Préparation de la validation

Le parent a lu le nouveau fichier de tests pour qualifier ses effets annoncés. Il utilise les fixtures hors ligne existantes, les bases OWN et des fichiers sous leurs propres racines ; il crée aussi des jonctions locales pour les tests de refus de liens. Il ne crée pas de thread et ne contient pas de nettoyage récursif. Les cas sont bornés à quinze secondes. Le driver et la fermeture réelle des imports devront encore être rapprochés des pins du paquet livré avant exécution.

Les tests visent les coupures de reprise, l'effet physique unique, les nouveaux octets retenus, la révocation et les fences avant/après effet, les digests divergents, l'attestation privée niveau1, les refus d'autorité et les cibles altérées ou liées. Cette liste décrit les scénarios présents, **pas leurs résultats ni leur suffisance déjà acceptée**.

Les oracles et preuves existants seront réutilisés selon impact ; les sélections atteignant threads, diagnostic gelé ou autres arrêts restent interdites. Revue indépendante et validation consolidée suivront le candidat exact, sans nouveau GO utilisateur.

## Localisation, impact et limites

Worktree : publication-durable. Chemins annoncés et retrouvés : src/engine.ts, src/graph-engine.ts, src/graph-store.ts, src/graph-publication-materialization.ts, src/graph-static-publication.ts et test/graph-integration/publication.test.ts sous tools/ff8-harness. La lecture actuelle du test fait232 lignes ; ces octets ne sont pas encore un pin de livraison.

Impact de ce jalon : inspection des hooks et préparation de QA uniquement. Aucune intégration de publication, preuve native, projection du prochain contexte ou clôture de mission.
