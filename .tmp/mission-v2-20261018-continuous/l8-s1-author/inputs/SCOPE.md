# S1 source pure — quatre nouveaux fichiers isolés

RATIFICATION.md et contrats phase2 ratifiés régissent cette tranche. Paquet seul,
pas origins/autres workers. ACK_HOLD hash/NONBLIND + plan concret API/imports/types,
couverture full source/schema/B→L5 et inconnus, attendre GO parent avant code.
Le plan ne redéfinit pas les décisions ratifiées ; remonter seulement un manque
réel d'API/donnée/closure avec chemin/symbole, pas proposer un faux adaptateur.

Outputs quatre fichiers sous src/ et schemas/ (noms QA_MATRIX S1), DESIGN.md,
MANIFEST.json. Pas fichiers test/QA ni shared source centrale. Seules dépendances
réelles pinnées, compat TypeScript/Bun courant. Code source pur ; pas IO runtime,
SQLite, dispatch, OS/native/authority/trusted callbacks, pas imports producteurs
ou modules runtime pour récupérer des types accessibles via import type.
Si un codec existant pur est dans un module avec imports à effet (clustering/DB),
escalader choix de factoring parent avant code, pas copier arbitrairement le core.
Parse/bind/export/makeGraphRunV3 sans recompute scientifique au load ; B projection
explicite lossless et prepareExecutionV1 seulement dans nouvelle préparation.
R1/R2/R3 et scopes A/B intacts, pas transport ou loaders v1/v2 élargis.

Pas git/registre/DB/IDA/live/réseau/délégation/compile/test/validator/import produit/
exécution code proposé. Parsing/hashing statique du paquet permis. Rapport natif
final court : fichiers/tailles/hashes/3–8ancres/limites, aucune clôture teamtools.
Parent seul compile/exécute/intègre après V fresh et pins contrôlés.
