# 96. Modifications tierces isolées pendant la réalisation

## Objectif et observation

La réalisation du raccord natif se poursuit dans son espace isolé. L'auteur a signalé des modifications de vingt définitions d'agents hors du périmètre logiciel approuvé. Le superviseur confirme par métadonnées Git vingt chemins concernés, aucun d'eux dans l'index ; la base reste le commit intégré attendu.

L'origine de ces modifications n'est pas établie. Elles ne sont pas attribuées au worker ni considérées comme livrable de la mission. Leur contenu n'a pas été consulté pour ce contrôle.

## Décision de conservation

Ne pas lire, modifier, rétablir, stager ou intégrer ces définitions d'agents. Aucun nettoyage, reset, restauration ou staging général. La livraison doit rester limitée aux chemins produit/tests autorisés et à ses preuves possédées. Un mécanisme automatique qui tenterait d'embarquer les changements tiers doit être signalé avant effet, pas corrigé en élargissant les droits.

Cette observation ne bloque pas le travail indépendant dans les fichiers autorisés et ne crée pas une nouvelle demande de GO. Avant intégration, le superviseur vérifiera le périmètre exact du candidat et la conservation des changements tiers.

## Vérification et limites

Le readback natif de la session confirme encore l'agent build, OpenAI GPT-6.1 Sol high et le worktree attribué. Cela vérifie le modèle effectif dans le catalogue approuvé, pas l'identité de l'auteur des vingt modifications ou l'absence de changement des permissions. Les droits réellement exercés devront être établis par les preuves de qualification native requises, pas par ces fichiers ou ce seul readback.

Aucun test, appel d'exécution native, changement de configuration globale ou nouvelle admission n'a été lancé pour ce contrôle. Le raccord reste en cours, non livré et non qualifié.

## Traçabilité

- Session : `ses_e76e72b8dffebLfY5TjAf4xFI5` ; branche `ensemble-0c66ae1b-3cb3-456d-9756-fb77a82aa1be`.
- HEAD observé : `9c1b6aaf5288445c06d82978b122091111c2bc8f` ; vingt chemins `.opencode/agents/*.md` modifiés et aucun stagé.
- Périmètre approuvé : [plan de raccord](95-plan-raccord-natif-approuve-sources-courantes-livrees.md).
