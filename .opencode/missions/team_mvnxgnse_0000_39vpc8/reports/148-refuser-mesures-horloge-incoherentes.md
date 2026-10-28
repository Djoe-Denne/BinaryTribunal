# M2 — 148 : signaler les pannes d'horloge au lieu de produire un diagnostic complet

## Défaut et décision

Revue147 À_CORRIGER sur DIAG-TIME146 seulement. Les trois shells, leurs exceptions/returns, l'inactivité, la séparation d'autorité et le nettoyage/readout sont acceptés statiquement et réutilisables hors impact.

Le parent a lu le collecteur : enter/leave ne retiennent pas le dernier timestamp observé et les sommes temporelles ne sont pas protégées contre Infinity. Deux racines10→20 puis15→25 peuvent être additionnées comme20ms au lieu de détecter la régression ; deux spans imbriqués de même site1e308ms peuvent déborder une somme pourtant marquée complète. Ces contre-exemples de panne sont statiques, pas des mesures observées ni une altération produit.

## Correctif source borné

Après snapshot des quatorze sources146/manifeste, autoriser **uniquement src/graph-local-measure145.ts**. Aucun shell, codec, test, type public, record ou configuration modifié.

Retenir et vérifier l'ordre de toutes les lectures d'horloge au sein de la session, y compris entre racines, phases et finish. Toute valeur non finie, régression ou intervalle incohérent doit arrêter le diagnostic avec incomplete, sans throw vers le produit. Employer la même source performance.now existante, pas d'horloge injectable/provider/env ou callback supplémentaire.

Vérifier les additions temporelles inclusives/résiduelles/enfants/rootUnion/phase avant validation des mises à jour : valeurs finies, non négatives et cohérentes. Un débordement ne doit pas devenir Infinity puis null dans un JSON prétendument complet. Les compteurs/bytes/bornes de pile/session déjà acceptés restent inchangés. Aucune correction arbitraire, saturation, normalisation de panne ou extrapolation qui donnerait un résultat valide inventé.

Conserver l'échec diagnostic fail-soft, la priorité des exceptions métier et finishdésactivation/purge. Pas de nouvel appel ou scan quand inactif, ni stats d'autorité ou nouvelle dépendance. Les métriques normales gardent leur définition (résiduel instrumenté, pas temps propre absolu). Leur gain/net/coût restent inconnus.

## Livraison et validation

Livrer hash/diff, ordre des observations et sites d'addition protégés, traitement des deux contre-exemples et limites. Analyse source seulement, pas de test d'horloge injecté ou microbench exécuté. Même reviewer reprend ce défaut et son impact uniquement, constats147 sur les shells/readout réutilisés. Un nouveau besoin de fichier ou protocole à escalader avant édition.

Après gel/revue seulement, parent fermera compilation puis un run diagnostic fini OWN/asset neuf. Aucun import/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA autorisé. Autres treize sources146/inputs122/308base+overlaycodecpins gelés, preuves historiques conservées. HOLD125 intégral, aucune hausse15s/300s ni framework. S2/M2/remplacement/S1concret global/contention non acceptés.
