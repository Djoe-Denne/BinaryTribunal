# Reprise continue — steering utilisateur explicite

Utilisateur : « Reprend et ne t'arrête plus jamais à moins d'un bloqueur qui
nécessite mon intervention. Un simple go ne constitue pas un bloqueur. »

Ce steering supersède les anciens arrêts administratifs et limites de cycles
auto-imposées du relais. Les gels/receipts précédents restent des faits datés
immuables. Le superviseur continue les tâches READY, résout les corrections et
franchit lui-même les gates techniques après preuves, sans GO utilisateur de
routine. Aucun changement de politique modèles r1, override, achat ou config.

Priorités : qualification compile puis cas V3 parent sériels, publication des
sous-gates ; arbitrage d'ownership et intégration L8 ; clôture bornée L1 ; QA
L7/L8 puis L9/L10 selon dépendances. Frontières et preuves ne sont pas sautées.

Travail V3 = harnais de sécurité sans FF8, pas run01/live/nativeFF8 ni G5/G6/G7.
Ces exclusions permanentes et full44 gated sont maintenus. Toute action sur
processus possédé est décrite dans sa gate parent, jamais un pouvoir générique
de kill ou de nettoyage. Parent seul compile/exécute/valide/intègre ; workers
source/statique exclusivement. Reviewer fresh par livraison, contexte disjoint.

Concurrence initiale3 workers utiles, parent inclus hors slots ; admissions
manuelles/routage grille imposé, Model.Ref natif vérifié. Les erreurs/provider,
auth/coût, collisions réelles d'ownership ou choix hors périmètre sont escaladés
seulement s'ils nécessitent vraiment l'utilisateur ; les branches indépendantes
continuent. Pas de nouvelle équipe/reset ni de reprise de session étrangère.

425 changements utilisateur observés au démarrage à HEAD bba8eb9 : rien de ces
changements ne sera nettoyé, réécrit, embarqué ou committé opportunistement.
Les sorties source restent isolées jusqu'à attribution explicite par parent.
