# 109. Entrée locale parent concrète autorisée

## Objectif et précision ratifiée

Fermer le point d'entrée du raccord sans inventer une authentification du superviseur à l'intérieur de Bun. L'auteur a précisé un appelant réalisable avec les outils actuels : un mode direct borné dans le module client existant, activé uniquement à son exécution directe, et lancé plus tard par le superviseur via son outil natif autorisé.

Cette précision est approuvée pour réalisation. Elle concrétise le rapport108 ; elle n'accorde à l'auteur aucun droit de lancer le produit, créer un compte, émettre un grant ou appeler le service.

## Frontière de confiance explicite

Le contrôle et le reçu de l'invocation native appartiennent au parent : identité de session appelante, pin/hash du programme, commande, scope et base possédée, PID/start et sortie corrélée. Le programme ne déduit aucun rôle lead de ses arguments, d'un fichier ou de l'utilisateur OS. Son entrée contrôlée crée une capability privée en mémoire, bornée et non réutilisable par la simple lecture d'un document.

Une bibliothèque locale ne garantit pas une résistance cryptographique contre un autre processus du même utilisateur capable de lancer arbitrairement le programme. Cette propriété plus forte n'est ni annoncée ni ajoutée aux exigences. L'enforcement natif des droits d'exécution reste la frontière ; un refus ne peut être contourné par un autre outil ou processus.

## Garde-fous de réalisation

L'import de bibliothèque ne crée ni issuer, compte, octroi ou effet. Préparation/inspection, octroi et exécution sont des actions explicitement distinctes, refusantes si incomplètes ; aucune action distante ou mutation privée au simple import ou affichage d'aide. La CLI historique n'est pas modifiée.

Les leases, versions de décision, images et contrôles atomiques existants suffisent comme mécanisme local à réutiliser. Le challenge à usage unique après chaque claim n'est pas une nouvelle exigence systématique. Rafraîchir seulement les faits du service requis aux frontières pertinentes, dans les bornes prévues, sans supposer un GET atomique avec un POST. La conservation physique des faits après effet et le refus de retry restent inchangés.

## Suite

La réalisation est explicitement ouverte dans les cinq modules du rapport108 et leurs tests existants. Prochain jalon : candidat composé, pin et manifeste cohérents pour QA parent, pas une nouvelle ratification générique du même plan. Tout obstacle réellement indispensable doit être décrit précisément ; les parties indépendantes utiles continuent.

Les preuves d'invocation réelle, d'acquisition et de qualification native seront produites après les gates applicables, par le parent. Aucun effet réalisé par ce rapport ; r8 reste la dernière preuve logicielle exécutée.
