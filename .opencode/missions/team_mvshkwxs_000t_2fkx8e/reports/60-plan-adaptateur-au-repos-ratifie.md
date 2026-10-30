# 60. Plan de l’adaptateur au repos ratifié avec limites fermées

## Décision

Le parent ratifie le rattachement proposé au journal existant de GraphStore pour une **opération de données au repos**, pas pour une exécution native. Les contrôles actuels de contrôleur, réservation, famille et entrées gelées restent indispensables. Le journal client seul n’accorde pas cette autorité et le chemin administratif DATA v3 n’est pas détourné.

La réalisation peut commencer dans le worktree confirmé, après vérification de sa base et de l’absence de changements inattendus. Elle est limitée aux deux nouveaux modules, à l’extension bornée de GraphStore et aux tests ciblés proposés. Aucun raccord CLI/GraphEngine, changement des refus d’exécution, nouveau magasin ou service.

## Précisions obligatoires

- Les nouvelles admissions utilisent un format prospectif distinct. Les anciens cycles ne sont pas modifiés rétroactivement ; le résultat ne prouve ni droits exercés ni terminaison.
- La rétention des identifiants/images et l’arbitrage des appels concurrents doivent être atomiques. Après une réponse perdue ou un envoi en cours, rapprochement des mêmes identités seulement ; une file absente ou un message consommé n’autorise pas une nouvelle identité ni un réveil.
- Chaque effet est précédé et suivi des contrôles applicables avec une horloge fraîche. Une observation reçue après perte d’autorité est conservée comme donnée tardive, sans autoriser l’étape suivante. Le chemin de conservation tardive doit être borné à une opération déjà retenue, pas une API publique d’injection d’événements faisant autorité.
- Transport fermé à la création, aux lectures et à l’admission avec `resume:false`. Pas de pièces jointes non qualifiées pour ce premier incrément ; deny-all seulement. Pas de PATCH, suppression, réveil ou endpoint fourni par le body. Aucun credential ou erreur distante brute persisté.
- Les collisions comparent les champs attendus et le contenu réellement retenu ; un HTTP200 n’est pas une validation d’égalité. Le parent fournit un readback normalisé de la session et de la file déjà possédées, obtenu par GET seulement. Aucun nouveau canary ni travail de modèle.

## Vérification et suites

L’auteur produit code et tests hors ligne mais n’exécute aucun test ou appel natif. Après gel du candidat, le parent inspectera la sélection, exécutera compilation, primitives et contrôles ciblés dans les droits accordés, puis demandera une revue indépendante. Dix minutes par test ; aucune suite globale ou scénario arrêté. Les preuves antérieures inchangées restent réutilisables.

## Références techniques

Plan reçu de `admission-native-repos` pour `task_mvtkcnkw_0009_mkw3tl`. Corps relus par le parent : `graph-store.ts:867–944,960–996` ; les barrières et le journal ne suffisent pas à eux seuls à prouver une propriété serveur.

Entrée supplémentaire : `../evidence/native-core-at-rest-wire-normalized-r1.json`. Le GET possédé a retrouvé la même session sans parent et le même message en file ; aucune mutation. Le modèle stocké reste distinct d’un modèle effectivement exécuté.
