# 175. La rétention du journal est optionnelle dans les sources

## Résultat corroboré et correction de portée

Les sources apportent une explication plus directe que la purge ou un filtre : **la conservation des événements est désactivée par défaut**. Dans ce mode, les projecteurs mettent à jour les sessions et messages, la séquence avance, mais aucune ligne event n'est conservée.

Le parent a corroboré ce mécanisme dans l'archive source associée. Les tests source de replay précédemment cités activent explicitement persist=true : ils ne garantissent donc pas que toute distribution conserve l'historique par défaut. Les rapports171–173 doivent se lire avec cette condition. Aucun de ces tests n'a été exécuté ici.

Le marqueur12 avec zéro événement observé dans la base candidate correspond à ce comportement. **Le réglage effectif du processus actif n'est toutefois pas démontré.** Il ne s'agit donc pas d'un diagnostic confirmé du serveur ou d'une preuve que ces événements n'ont jamais existé.

## Décision

Ne pas modifier le serveur, activer une option globale ou rejouer un travail pour remplir le journal. Des événements non retenus ne sont pas récupérés rétroactivement par un autre curseur. Les preuves natives170 et les observations vides restent conservées telles quelles.

L'objectif du parcours complet demeure ouvert. Le parent examine une alternative prospective strictement bornée : des projections natives réellement persistées, liées à l'input et à l'assistant exacts, avec une version stable et des refus explicites des cas ambigus. Cela reste une **hypothèse de contrat à vérifier**, pas un témoin déjà accepté. Le constructeur doit en attaquer les liens causaux, l'atomicité et l'exhaustivité dans les sources avant toute proposition de code ou exécution.

La réponse ACK170 ne sera pas transformée en résultat scientifique et les droits expirés ne sont pas réactivés. Le GET de la file inbox ne sera pas utilisé comme preuve de livraison par absence : l'OpenAPI conservée décrit une file, pas à lui seul un reçu causal de fin.

## Preuves et limites

- packages/core/src/bus.ts183–208 : option de conservation et défaut persist=false ;397–428 : projection et séquence, puis insertion event conditionnelle. Corroborés parent.
- packages/server/src/routes.ts123–125 : transmission de options.events.persist au bus. Corroboré parent.
- packages/core/test/session-log.test.ts25 : persist=true dans les tests de replay. Corroboré parent, test non exécuté.
- Finding SOURCE_RETENTION_MECHANISM_IDENTIFIED_DEFAULT_NONPERSISTENCE_ACTIVE_CAUSE_UNPROVEN : suppression ordinaire remove efface aussi la séquence ; migration legacy distincte possible, sans activation prouvée. Aucune investigation de configuration globale demandée.
- Diagnostic174 : marqueur12/event0 dans une vue candidate non attribuée directement au PID. Revue de ce diagnostic toujours distincte.
- Aucun nouveau GET, base, import, test, modification produit, prompt ou origine pour ce résultat source et cette décision.

## Attaque en cours de l'hypothèse prospective

Le constructeur signale trois difficultés à fermer avant toute ratification : l'entrée utilisateur serait projetée lors de sa livraison, mais le démarrage et l'assistant ne porteraient pas de référence causale explicite vers cet input ; un transcript actuel à un input n'établirait pas, seul, une histoire à un input en présence de revert/import ; la pagination ne serait complète qu'après observation d'une page vide, pas après une page simplement plus courte que la limite.

Ce sont des constats intermédiaires en attente du verdict borné et des ancrages complets, pas une preuve nouvelle de suffisance. Le double marqueur et le transcript ne sont donc pas ratifiés comme témoin d'intervalle. Aucun code, appel ou budget n'est engagé sur cette hypothèse.

## Marqueur positif de fin de tour identifié

Un élément plus précis est identifié puis corroboré par le parent : packages/schema/src/session-message.ts291–302 définit le **message persisté** type idle/outcome comme délimiteur d'un tour, comprenant les étapes et prompts steered depuis le marqueur précédent. Un shutdown n'en crée pas. Ce n'est donc pas le simple statut d'inactivité ni une absence d'activité.

La relecture du fichier UTF-8 déjà conservé170 retrouve ce message, id msg_18cd1ec45001yVrphfUXkguqJw, time.created1793363930181, outcome=succeeded. Aucun GET n'a été refait. Cela fournit un fait positif à examiner avec la livraison de l'input et l'assistant ; **sa suffisance causale n'est pas encore ratifiée**. Les règles d'import/revert, l'exhaustivité et l'ancrage de session fraîche restent en cours de vérification source. Aucune clôture permanente ou libération physique n'en est déduite.
