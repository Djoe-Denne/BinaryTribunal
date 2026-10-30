# 87. Revue indépendante : corrections requises avant réception

## Objectif et décision

L'incrément doit rendre une annulation durable opposable à toute relance et consommation, sans casser l'historique ni les travaux indépendants. Les sept tests ajoutés réussissent, mais la revue indépendante identifie des contre-exemples non couverts. Le superviseur maintient le refus de réception et d'intégration du candidat r1 et engage une correction bornée. Le reste de la mission n'est ni clôturé ni globalement arrêté.

## Défauts à corriger

1. **Périmètre client non fiable.** Une unité donnée dans les métadonnées appelantes prime sur l'unité de l'exécution durable. Une soumission peut ainsi vérifier une unité courante différente de celle annulée. Résoudre la cible depuis les identités durables et refuser toute contradiction avant transport, sans laisser le champ appelant produire l'autorisation.
2. **Historique et admissibilité courante confondus à une frontière de reprise.** Un résultat retenu comme admissible, puis rendu obsolète avant sa projection runtime, peut être journalisé comme tardif tout en gardant une rétention historique admissible ; le lecteur rejette ensuite ce journal. Préserver les faits historiques cohérents tout en refusant leur utilisation courante, y compris à cette coupure.
3. **Décision perdue silencieusement à la réouverture.** Une table privée ou ligne perdue peut être recréée/vide, alors que les événements de décision subsistent, puis produire une autorisation permissive. Détecter l'incohérence et refuser ; ne pas reconstruire une autorité depuis les seuls événements publics. Distinguer une migration légitime d'une perte de données d'autorité déjà créée.
4. **Annulation locale bloquant le reste du parcours.** Un reçu historique d'un producteur obsolète peut faire échouer la vue entière ; une unité READY obsolète peut aussi arrêter la sélection au lieu de laisser passer une unité indépendante courante. Conserver l'histoire, filtrer les usages courants et poursuivre les travaux indépendants sans libération fictive de ressources.
5. **Tests de version future devenus faux.** Deux négatifs injectent8, désormais supportée, tout en attendant un refus. Maintenir l'oracle « version future refusée » avec une version réellement non supportée ; ne pas supprimer les tests ni affaiblir leur attente.

## Vérification du superviseur

Le superviseur a corroboré par lecture le choix du périmètre client et le défaut de rapprochement à l'outbox ; le lecteur exigeant `eligible:false` pour un événement tardif face à la projection utilisant le booléen courant de rétention ; la création `IF NOT EXISTS` de la table privée ; et le négatif injectant8 après migration réussie vers8. Les chemins de reçus historiques ont aussi été lus. Il s'agit de preuves statiques ; aucun contre-exemple n'a été exécuté à ce stade. Les échecs prédits des tests de version ne sont pas présentés comme des tests exécutés.

## Preuves ciblées encore nécessaires

Ajouter ou identifier une preuve existante exacte pour les cinq corrections, puis pour : révocation parent après append avec rollback conjoint, quota après obsolescence, effet physique de publication ambigu suivi de reprise, source obsolète pendant lecture du prochain contexte, rapprochement de notification après réouverture et exclusion de livraisons concurrentes. Vérifier l'image exacte remise aux ports, pas seulement leur compteur. Vérifier `view`/`step` et l'absence de nouvelle soumission après obsolescence d'un producteur.

Ces contrôles relèvent des risques déjà ratifiés ; aucun nouveau harnais, qualification native ou test historique gelé n'est exigé. Réutiliser les preuves valides lorsqu'elles couvrent exactement la fenêtre et l'oracle ; ne pas rechercher une couverture maximale.

## Réalisation et réception

Le même auteur reste propriétaire de la correction dans les sept fichiers déjà autorisés, avec manifeste et handoff actualisés. Pas de mutation du candidat pendant une lecture active de l'ancien pin par la revue : la revue r1 étant rendue, la correction peut commencer. Aucun test/typecheck/produit/natif par l'auteur ; le superviseur contrôle le nouveau pin et exécute seulement les sélections pertinentes autorisées. La reprise de revue porte sur les bloquants et l'impact de correction, pas une nouvelle revue générale par principe.

Les PASS du rapport86 restent valides pour r1 et ne sont pas transférés automatiquement aux octets modifiés. Aucun test filtré, preuve interdite ou absence de message ne devient PASS. La qualification native et le scénario final restent ultérieurs.

## Traçabilité

- Revue intégralement reçue : `result_mvtvijlf_0005_qormro` ; session `ses_e77205002ffeOQBt2JOjVMyPgb` ; message `msg_188e7efb8001Mg3tZ8Df3Uqgdz`.
- Pin revu : `77200f40c1892480b7deb97110abbfaf451ad2bb`, HEAD et7empreintes confirmés par la revue.
- Localisation r1 : client120–122 ; graph-store39–65,311,746,1654–1657 ; graph-engine207–217,232–246,408–410,619–632 ; eventlog1056 ; next-context446–449.
- [Résultats ciblés r1](86-controles-cibles-obsolescence-r1.md).
