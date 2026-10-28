# M2 — 90 : revue T0/T1 acceptée partiellement, contrôles ciblés

## Décision et portée

Le même reviewer indépendant rend **PRÊT_FIXTURE PARTIEL** sur source88ad2577ba… : T0-A/T0-B/T1-C fermés statiquement et aucun nouveau bloquant d'impact identifié. Le raccord hôte est accepté uniquement comme source synthétique privilégiée, pas registre natif/global. Les constats87 non affectés sont réutilisés.

Parent accepte cette gate source partielle et ferme le paquet runtime ci-dessous. Les27tests écrits ne deviennent pas PASS, la fille S1 n'est pas encore qualifiée. L'absence de preuve d'épuisement3 reste enregistrée sans waiver ; cette vérification ne clôt ni budget préparation ni S2 global.

## Commandes et arrêt fermés

1. Une invocation typing ciblé,60s maximum, couvrant les modules T0/T1/ressources et les trois tests atomic-admission/resource-admission/t1-transition avec imports transitifs.
2. Seulement si vert : une invocation Bun sur ces trois fichiers,90s maximum, concurrence1,10s/test.

Deux invocations maximum/150s cumulées,0retry ou modification intermédiaire. Les60scénarios82 ont des préconditions affectées par l'octroi/seed et par les nouveaux champs/contrôles du store ; leur rejeu est donc justifié, contrairement aux suites scientifiques/S1 globales inchangées. Les27casT1 annoncés seront comptés d'après exécution, jamais d'après leur seul inventaire.

Typing rouge => aucun SQL/DB. Runtime rouge/timeout/signal => paquet clos, artefacts et causes exacts conservés. Une précondition de fixture échouée ne prouve rien sur les assertions en aval. SKIP/TODO ne vaut pas PASS et bloque l'acceptation des cas prévus. Tous anciens paquets80/81/72/66 restent clos ; aucun compteur réinitialisé ni240s proposé réutilisé.

## Isolation et ownership

Contrôleur parent adapté du gate81 fini, pas nouveau framework : pins source88 et sourcesressources inchangées82,309base, contrôles, helpers/inputS1 et quatre inputs T1/ressources vérifiés avant/après. Même sourceSet entre typing et runtime. Le contrôleur n'importe jamais le produit/fixture ; il lance les commandes et collecte leurs reçus.

Avant runtime, réserve répertoire NEUF evidence/s2-t1-88/owned-databases et namespace fini s2-author-1..256.db avec compagnonsSQLite. Les chemins sont consignés avant création ; les tests utilisent ownedPath/FF8_S2_FIXTURE_DIRECTORY sans fallback, y compris les négatifs multi-DB et copies de documents d'octroi. Aucune base82 réutilisée, aucune migration ou source native appelée. Fixtures :memory: existantes admises pour leurs négatifs de connexion.

Le nouvel hôte synthétique alloue ses sources avant la demande d'octroi, pas un provider réel ; aucune authentification payante ou session modèle. Le test peut modifier les sources de son propre hôte et les bases qu'il possède pour ses négatifs approuvés. Inventaire complet/hash/taille après runtime, rouge compris ; conserver DB, logs/reçus et compagnons. Aucun cleanup/réparation/réouverture SQL supplémentaire par le contrôleur, réservations non créées jamais comptées comme fichiers.

Environnement HOME/config/temp propres et possédés, no-env/config Bun vide, outils Bun/TS pinnés, aucun secret/options hérités. Aucun accès aux oracles QA S1/L7. Reçu d'acceptation partielle de la source exigé par le contrôleur avant runtime.

## Acceptation et suite

Typing vert et cas réellement exécutés sans fail/skip avec sources stables pourraient qualifier T0/T1 dans leur portée fixture et la continuation des60cas impactés. Revoir particulièrement les causes des négatifs A/B/C et la qualification réelle de la fille : ne pas interpréter un refus précoce en preuve du risque visé.

La preuve3commits+quatrième refus au plafond reste **obligatoire/non obtenue**, même si tous les tests de cette tranche passent. Aucun staging/T2/replace/succession ajouté pour la fabriquer. S3/public/native/publication/S4global et QA indépendante plus large/L9/L10 restent hors acceptation de ce paquet.000b/S2global/M2 ouverts ; pas de Git/canonique/v6/client/configglobal/C#/jeu/live/IDA/cleanup. Trois commandes consolidéesM2 toujours à obtenir au stade applicable.
