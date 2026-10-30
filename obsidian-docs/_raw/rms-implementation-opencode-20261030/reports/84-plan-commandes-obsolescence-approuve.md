# 84. Plan de réalisation approuvé : commandes et obsolescence

## Objectif et décision

Rendre l'annulation RMS effective et durable, avec livraison ordonnée des commandes et absence de relance automatique. Le superviseur approuve le plan de l'auteur dans les sept fichiers fermés ci-dessous, avec les précisions de portée suivantes. La réalisation peut commencer ; aucun test ni effet natif n'est encore autorisé à l'auteur.

## Choix tranchés

- **Ordre prospectif explicite.** Une API dédiée peut retenir et livrer les commandes futures. Elle ne prétend pas imposer un ordre natif universel ou migrer les anciens transports. Son raccord réel au parcours natif reste une obligation de l'étape suivante ; une API isolée et ses fixtures ne suffisent pas à qualifier le parcours final.
- **Obsolescence sans exception de transport.** Les refus de départ, relance, reprise et consommation doivent couvrir les chemins RMS existants concernés, y compris lorsque la commande n'a pas été livrée. L'exception de portée prospective ne permet pas de garder un chemin legacy autorisant un travail devenu obsolète. Aucun fallback permissif.
- **Stockage additif privé.** Une table privée de commandes dans la base existante et sa migration versionnée sont autorisées. Aucun changement public de schéma ou de contrat gelé implicite. Identité et image exactes, autorité parent et versions attendues contrôlées avant et après append dans la transaction. Le contrôle post-append doit tenir compte des seules modifications attendues de la transaction, sans désactiver le contrôle des autres changements.
- **Ordre et décision locale séparés.** Une livraison inconnue bloque les livraisons suivantes sur le même flux mais ne bloque pas le commit local d'obsolescence. Un doublon retourne le reçu existant ; un état ambigu n'autorise que le rapprochement exact, jamais une resoumission automatique. Une session partagée exige un flux commun dès qu'elle est connue ; une liaison ambiguë ne doit pas produire deux flux indépendants permissifs.
- **Admissibilité transitive et historique.** Les usages futurs doivent contrôler les sources dépendantes, sans réécrire les résultats et événements historiques. Cycle non résolu : refus, pas boucle. Les témoins physiques, les effets engagés et les commits publiés restent attribuables et lisibles pour rapprochement, sans devenir consommables scientifiquement.
- **Ressources.** Aucun claim, lease, budget ou allocation libéré par la seule obsolescence. Les méthodes natives actuellement refusantes restent refusantes.

## Fichiers et livraison

Dans `tools/ff8-harness` : production `src/graph-store.ts`, `src/graph-engine.ts`, `src/client.ts` ; tests `test/eventlog.test.ts`, `test/client.test.ts`, `test/graph-integration/publication.test.ts`, `test/graph-integration/next-context.test.ts`.

Un manifeste et une note de livraison sous `.opencode` sont autorisés comme preuves locales non produit, sans modifier la politique de mission. Toute autre extension de fichiers requiert une justification au superviseur avant écriture. La copie de politique préparatoire reste hors livrable produit.

## Vérification préparée, non exécutée

L'auteur écrit les cas préfixés `RMSO-` : atomicité, séquence et divergence, autorité et comparaison de versions, rollback après append, livraison unique, réponse perdue et redémarrage sans renvoi, obsolescence avant départ et reprise, résultats déjà retenus/tardifs et dépendances, attentes de revue, publication avant/après effet et après commit, prochain contexte et ressources inchangées.

Le superviseur exécutera la compilation, les primitives et les sélections ciblées après pin et inspection des imports/branches effectives. Les noms seuls ne prouvent pas qu'un import est sûr. Dix minutes par test ; aucune suite globale, HOLD125, diagnostic gelé, quatrième origine ou rejeu scientifique. Une revue indépendante du candidat et la réception parent restent nécessaires. Les preuves préexistantes ne sont rejouées que selon l'impact.

## État observé et limites

Le reçu de plan confirme la base possédée attendue et le rattachement corrigé : les lectures relatives du worktree réussissent. Le superviseur a déposé la copie préparatoire de politique dans cet espace ; ses 63 lignes sont identiques à la copie locale déjà possédée, sans qualification des fins de ligne octet par octet. Le message du plan qui la dit encore manquante est antérieur à cette livraison et ne nécessite pas une autre copie.

Aucun code réalisé, test passé ou propriété native qualifiée n'est déduit de ce plan. L'étape suivante reste la réalisation par l'auteur unique, puis examen du candidat épinglé.

## Traçabilité

- Auteur : `commandes-obsolescence` ; tâche `task_mvtsy9sr_0006_byd61i` ; base `e1a58997b6d0fe4e145aa844382f9ce1c637d0e2`.
- Worktree : `ensemble-793e3f62-2fkx8e-commandes-obsolescence` ; branche `ensemble-2a11f6d2-2843-45a7-a374-70c003613274`.
- Contrat : [obsolescence ratifiée](83-contrat-obsolescence-ratifie-et-plan-de-realisation.md).
