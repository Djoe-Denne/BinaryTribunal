# 86. Contrôles ciblés réussis, réception encore ouverte

## Objectif et résultat

Vérifier l'incrément logiciel de commandes ordonnées et d'obsolescence sur son candidat épinglé. Après compilation réussie, les primitives ont réussi :55 cas,125 assertions. Les sept nouveaux cas ciblés ont également réussi :40 assertions, aucun échec. Ces résultats ne qualifient ni le parcours natif ni toute la matrice des risques exigés.

## Sélection et permissions vérifiées

Le superviseur a inspecté les imports et corps des nouveaux tests, les enregistrements exécutés au chargement par analyse syntaxique, ainsi que les branches utiles du driver de fixtures. Aucun nouveau cas ne lance le Worker/contender ; le driver enregistre un hook de conservation des bases hors ligne sur le thread principal. Les exécutions sélectionnées utilisent des transports factices et des fichiers/bases possédés, pas de nouvelles origines natives.

Les commandes sont fermées à quatre fichiers existants et au motif `^RMSO-`, avec600000 ms par test. Le répertoire requis par le registre existant de fixtures a été créé dans le worktree, sans changer les sources ni les oracles. Aucune suite globale, test gelé, thread interdit ou diagnostic historique n'a été exécuté. Les tests filtrés ne comptent pas comme réussites.

## Résultats observés

- Journal/commandes/reprise/résultats :4 cas,28 assertions ;348 ms processus.
- Client/refus d'une décision durable corrompue :1 cas,2 assertions ;96 ms.
- Obsolescence pendant l'attente de revue, avant publication :1 cas,5 assertions ;652 ms.
- Producteur déjà publié rendu obsolète, historique conservé et contexte refusé après reprise :1 cas,5 assertions ;9575 ms.
- Primitives :55 cas,125 assertions ;67 ms processus.

Le cas le plus long mesuré dure9510,82 ms ; aucun nouveau test n'a atteint la borne de dix minutes. Les deux bases d'intégration et leurs manifestes sont conservés par le driver existant.

## Manques et suite autonome

La revue indépendante reste nécessaire, et les fenêtres négatives reconnues par l'auteur restent à rapprocher de preuves valides : notamment révocation parent après append, quota et effet physique ambigu. Le superviseur demandera seulement les corrections ou compléments requis par ces risques et l'impact, sans transformer sept cas en couverture globale. Les régressions affectées restent à sélectionner selon cette analyse. Aucune fusion ni acceptation de cette réalisation n'est prononcée à ce stade.

## Preuves

- [Reçus parent des primitives et des sept cas ciblés](../evidence/obsolescence-r1-targeted-parent.json).
- [Compilation et prérequis locaux](85-candidat-retrouve-et-compilation-verifiee.md).
- Pin : `77200f40c1892480b7deb97110abbfaf451ad2bb` ; sept empreintes vérifiées selon le manifeste auteur.
