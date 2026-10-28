# M2 — 69 : trois défauts confirmés, corrections source avant toute DB

## Verdict et conséquences

La revue indépendante68 rend **À_CORRIGER**. Le parent a relu les branches source concernées : les trois défauts ci-dessous sont confirmés contre le sourceSet67 b2fd2548… . Aucune DB/opener/SQL/test/typing exécuté, aucun nouveau PASS. La gate première fixtureDB reste fermée,000b/S2 non clos.

Il ne s'agit ni de manques natifs différables ni de suggestions de couverture : les opérations actuellement acceptées peuvent déjà produire des effets durables incohérents. Corriger ces trois risques, pas réélaborer le contrat de transport ou maximiser le nombre de tests.

## Défauts vérifiés et critère de fermeture

### 1. La commande n'est pas liée au droit consommé

Store196–215 vérifie quelques identités/subIntent/grant/cap mais ne compare pas command au modèle/profil/fonction/inputs/manifest/source du travail. Store229–232 consomme le slot et crée l'outbox même pour command={} ou étrangère. Le helper65 est correctement un outil DATA : il ne doit pas devenir artificiellement autorité pour combler cette lacune.

Fermer le join sur la **voie fixture** depuis les données S1 figées et sources indépendantes retenues : command correcte pour l'unité/sous-intent/rôle/grant, modèle/profil/identité et sources consommées exacts. Comparer du contenu, pas seulement une empreinte copiée du même caller. Attendu fixture construit depuis les sources, pas un nouveau schéma RPC/auth59 imposé au client. Si les prérequis d'une commande complète ne sont pas définis/disponibles, cette préparation doit HOLD/refuser avant SPENT/BURNED/outbox, sans prétendre que S3 la corrigera après consommation. Tout manque contractuel précis est remonté avant invention.

Tests : partir d'un nominal valide atteignant la branche ; changer seulement modèle/profil/fonction/inputs/manifest/source ou fournir commande vide, sans modifier la source de référence. Prouver refus/HOLD et absence de nouvel effet durable. Ne pas masquer le risque par un rejet précoce de hash/shape non relié au join.

### 2. Receipt révoqué consommé par proveTerminal

Store263–268 relit row.receipt mais n'en revérifie pas la source courante avant effetTERMINAL. Le contrôle release287–288 est réel, mais trop tard pour cet effet distinct. Scénario : receipt accepted, reconcile, **révocation avant proveTerminal**, proof completed/quiescent courant : le TERMINAL réussit sur67.

Correction locale : revalider le receipt au point de consommation, dans la même transaction, avant tout effet terminal/event. Conserver la revérification release et les gardes de génération/fence/attempt. Ajouter exactement ce placement de révocation aux négatifs ; le cas existant révoqué après terminal reste conservé.

### 3. Guard de schéma insuffisant à la réouverture

Store30–37 vérifie noms/markers, pas colonnes/PK/UNIQUE/indexes/contraintes du schema19–28. Une base portant les mêmes noms et marqueurs mais g3_claims sansPK(resource_key) est acceptée et peut perdre l'unicité de réservation ; même risque sur l'unicité root/slot outbox.

Valider structure/contraintes effectivement nécessaires des tables/indexes acceptés (y compris PK/UNIQUE/checks de version/fence), sans migration/réparation d'une base incompatible. Le guard doit refuser AVANT toute mutation sur le fichier existant. Les tests sur bases **parent-owned futures** reproduisent les mêmes noms/markers avec contrainte manquante ; ne pas se contenter d'une table étrangère au nom évident. Pas nouveau validateur SQL général ou framework, fermeture de ce schéma privé précis.

## Travail autorisé et ownership

Parent conserve un snapshot readonly des5fichiers67 avant dégel. **GO corrections source uniquement** : src/graph-generation-store.ts, test/s2-author/fixtures.ts et test/s2-author/atomic-admission.test.ts. Budget/authority restent inchangés/read-only, ainsi que309base, helperbodytest65, inputs auteurS1, configurations, canonique et gels. Si un autre fichier/signature/contrat devient indispensable, le préciser au parent avant édition.

Pas de baisse de seuil, suppression de cas existant, casting v3→v2, copie d'oracles QA/L7 ou restructuration opportuniste. Aucun import métier/fixture, test/typing, SQL/opener/DB/native/service/Git/cleanup durant cette correction. Les tests nouveaux restent source-only jusqu'à gate explicite.

Après livraison : hashes/diff/API/SQL et scénarios fermant1–3, risques restants. Le **même reviewer indépendant** reprend les trois défauts et l'impact des corrections ; ses protections statiques4–6 valides sont réutilisées, pas nouvelle session/chaîne ou re-audit gratuit. Un nouveau défaut introduit par la correction reste bloquant. Le parent seul ouvrira ensuite les fixtures et runner/budget.

## Limites et connaissances conservées

La revue constate aussi structures transactionnelles/CAS, handles privés, retry et distinctions expiry/Q utiles, mais ce sont des constats statiques, pas PASS runtime. Worker/account/concurrence d'émission, transition/drain/crossgen/publication/replayS4/natif restent non prouvés ; ils ne masquent pas ces trois défauts d'opérations déjà disponibles. Compaction et RPC59 ne sont pas concernés par ces corrections.

Les preuves S1DATA/numeric/planner/helper65 restent dans leurs portées ; aucune commande consolidée M2 exécutée. Aucun contrat nouveau ou permission runtime/DB implicite.

## Mise en œuvre de la décision

Parent a vérifié puis copié les5sources67 byte-exacts sous snapshots/s2-source-67 (readonly), avec SOURCE_MANIFEST.json. SourceSet b2fd2548… préservé. Seuls store/fixtures/atomic-test courants sont rendus éditables pour les correctifs ; budget/authority restent readonly. GO de reprise bornée effectivement transmis à l'auteur existant000b. Aucun fichier canonique, test, DB, sourcegel ou oracle indépendant modifié/exécuté par cette préparation.
