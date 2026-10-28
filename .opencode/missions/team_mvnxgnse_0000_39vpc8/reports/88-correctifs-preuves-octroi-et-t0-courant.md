# M2 — 88 : deux défauts T0 confirmés, correction source avant exécution

## Résultat et constat parent

La revue87 rend **À_CORRIGER** sur deux défauts actuels, distincts du test d'épuisement3 encore absent. Le parent relit authority:18–33 et store:392–413 : constats confirmés. Aucune compilation/test/SQL exécuté sur cette version, aucune qualification de la fille S1, runtime fermé.

Les constats indépendants de CAS complet, ledger intra-OWN, cut de familles sans outbox, continuations et préservation de la barrière sont conservés comme preuves statiques. Ils ne compensent pas les deux lacunes ni ne deviennent PASS runtime.

## Défaut A : octroi sans preuve indépendante d'émission

Le contrat corrigé15–24 exige provenance issuer, ownership root/lineage et preuve courante de première émission/histoire vide avant initialisation0. Les entrées ratifiées nomment ces références. Le produit ne les consomme pas : approval local avec issuer/IDs/path, Map originOwners en mémoire et OWN vide suffisent. Changer fixtureId/caseId/path peut alors créer une autre clé et un compteur0 sans preuve de domaine réellement indépendant. Une carte mémoire et un nom de fichier ne constituent pas l'histoire durable requise.

Fermer le join avec les **vraies sources privilégiées convenues** et leur current/révocation, retenues indépendamment de la demande/grant. Domaine canonique root/lineage et éventuel univers fixture indépendant prouvé ; les caseId/path/fixtureId ne créent pas à eux seuls un nouveau budget. Source d'ownership ou première émission inconnue => HOLD avant enregistrement consommable/bootstrap/compteur. Après reprise, absence de source indépendante ne signifie jamais première émission.

Pas exigence de lock natif inter-OWN ni interdiction de fixtures de test indépendantes : leur indépendance doit être attestée par l'hôte selon le contrat, pas déduite d'un filename. Aucun service, registre global ou framework nouveau autorisé. Si ces preuves ne peuvent être représentées/consommées dans les ports privés déjà approuvés, signaler l'impossibilité précise avant extension ; une donnée JSON auto-produite par le grant ne ferme pas la lacune.

Négatifs finis : octroi avec approval mais sans preuves indépendantes ; preuve/current absent, périmé ou révoqué ; réémission du même domaine sous autre case/path refusée ou HOLD ; nominal réellement indépendant fourni par la fixture privilégiée. Conserver le test de handle mauvaiseDB qui vérifie un autre risque.

## Défaut B : observation T0 révoquée après append

prepareInitial lit observationRef avant effet (392–397) ; après append (409), il revalide controller/grant et captureOperational, mais celle-ci exclut les documents transition-source. Une révocation de l'observation après le vrai append n'est donc pas détectée avant commit de l'origine, du pointeur et du compteur2. Le refus ultérieur à T1 intervient trop tard.

Revalider cette observation consommée après append dans la même transaction, avec identité/version/contenu et source actuelle, avant commit. Préserver tous les autres contrôles de postimage/TTL/grant/counter. Test ciblé utilisant le point d'injection append déjà présent : appeler le vrai append puis révoquer observationRef et retourner normalement ; attendre échec et rollback de l'ensemble, y compris la révocation faite dans cette transaction. Pas de nouveau harnais/concurrence native.

## Ownership et revue du correctif

Après snapshot readonly des six fichiers87 et du manifeste, GO corrections dans **cinq fichiers seulement** : store, authority, generation-transition, t1-fixtures.ts, t1-transition.test.ts. Seed commun fixtures.ts reste inchangé ; s'il doit charger un nouveau témoin obligatoire avant bootstrap, remonter ce besoin précis avant édition. Les entrées83/85 et autres sources/DB82/configs/gels restent intactes. Toute autre extension/DDL exige un arbitrage parent préalable.

Ces modifications ferment le contrat déjà approuvé, pas une nouvelle architecture. Source seulement : aucun import évalué/scellement/bind, typing/test/SQL/DB/opener/native/service/Git ou délégation. Livraison hashes/records/API/scénarios/limites, puis reprise du même reviewer sur défauts et impact ; pas réaudit général ou chaîne supplémentaire.

## Point encore à trancher : doublon T1 et case consommé

Le signalement sous gel87 reste distinct : requestDrain420–430 ne retient/compare pas la ref exacte d'autorisation du premier T1. La revue reçue ne tranche pas explicitement l'autre-case/même-candidat. Demander une conclusion ciblée au même reviewer sur le snapshot87, sans forcer son verdict. Ne pas appliquer le patch proposé tant que la décision n'est pas fermée. Il pourra être ajouté au même paquet de corrections si confirmé, pas comme nouvelle campagne.

## Limites

Préuve d'épuisement3 toujours obligatoire/non obtenue, pas waiver. T2/staging/remplacement/succession/S3/public/native/S4 hors périmètre.000b/S2global/M2 ouverts, aucun nouveau PASS, aucune commande consolidée ou réouverture d'ancien runner. Pas de tentative d'édition après prochaine livraison/gel sans GO parent, même dans cette allowlist.

Préservation réalisée : les six sources87 et SOURCE_MANIFEST sont conservés byte-exacts readonly sous snapshots/s2-t1-source-87 ; seuls les cinq fichiers annoncés sont dégelés. GO88 transmis à l'auteur. Le reviewer reprend uniquement le point du doublon sur ce snapshot immuable, distinct du courant désormais mutable ; aucun SQL ou import évalué dans ces opérations.

## Complément reçu : troisième défaut confirmé, même paquet de correctifs

Le reviewer confirme indépendamment **T1-C**, bloquant du retry exact sur le snapshot87 : authority autorise case2 courant avec mêmes bindings et seul caseId changé ; requestDrain420–430 renvoie alors le reçuT1 de case1. La source consommée n'est retenue ni dans résultat483–484 ni événement489. Le contrat56–61/75–81 ne ratifie aucune équivalence entre cases. Aucun nouveau débit ou événement allégué : défaut d'identité et de traçabilité distinct de T0-A/B.

GO correctifT1-C dans la **même allowlist88**, sans dégel supplémentaire : conserver une ByteRef privée exacte de la source d'autorisation réellement consommée dans DrainResult et son événement durable ; lier cette ref à la lecture/audit du résultat et la comparer au retry. Le nom de champ privé est un choix local, pas un nouveau contrat public S1. Un handle fraîchement résolu vers la même source après reopen doit rester recevable sous ses contrôles courants ; caseId différent ou autre ref ne peut relire le reçu comme doublon exact.

Négatif API fini : T1case1 réussi, case2 mêmes autres bindings, tentative au head attendu original => refus sans effet. Conserver positif retry exact et réouverture. L'audit historique doit conserver l'identité du case consommé sans confondre histoire révoquée et autorité courante ni lever la barrière. Aucun patch appliqué par le reviewer. Auteur livre désormais les trois corrections ensemble ; reprise indépendante ensuite sur défauts et impact, pas nouveau pipeline ou nouvelle campagne. Toutes permissions source-only88 inchangées.

## Raccord nominal T0-A autorisé après signalement précis du seed

Le seed commun ne reçoit pas de source indépendante : il appelle registerOriginGrant(db,authority,f,path). L'auteur a raison de ne pas reconstruire les trois preuves dans ce helper depuis f/path/approval, ce qui reproduirait T0-A. Le parent étend l'ownership88 à **deux fichiers seulement** : modifier test/s2-author/fixtures.ts et créer test/s2-author/origin-host-fixture.ts, petit helper de sources hôte synthétiques. Aucun service/registre global/framework ou nouveau module produit ajouté.

Le helper est la source de fixture privilégiée, **séparée de la demande d'octroi et de son validateur**. Il doit retenir avant cette demande un bundle de provenance issuer, propriété du domaine root et preuve complète de première émission, ainsi que leurs current/révocations. Le domaine/univers de test doit être explicitement alloué par les données de l'hôte ; le filename/caseId ou l'absence de ligne dans OWN ne prouve ni cette indépendance ni une histoire vide. Les noms/ref/quotas et la politique approuvée ne sont jamais auto-authentifiés en recopiage de la demande.

Raccord possible : port/handle privé de source hôte fourni à l'authority à sa construction ou enregistrement privilégié avant registerPreparationGrant. Choix local permis si l'objet connexion, domaine retenu, assignment du fichier et current sont réellement vérifiés au consommateur. Le seed transmet la source allouée et les bindings scientifiques exacts ; il ne crée pas une preuve « première émission » par défaut pour faire passer ses propres paramètres. Les bindings aux sources S1/fichier réels doivent être contrôlés contre l'affectation retenue de l'hôte, pas devenir une nouvelle autorité du seul fait de leur hash.

Une source synthétique indépendante est légitime pour chaque cas réellement isolé ; son univers/capacité doit être démontré dans les records hôte convenus. Renommer un domaine ou son chemin ne réémet pas l'octroi. À reopen, réutiliser les sources retenues ou HOLD si leur état courant est inconnu ; ne pas se reposer sur la seule carte mémoire précédemment vide. Les méthodes d'observation/arrêt et l'audit historique ne gagnent ni ne perdent artificiellement une autorité du fait de cette adaptation.

Si cet input ne peut être fourni sans créer une nouvelle infrastructure ou élargir un contrat public, remonter l'impossibilité précise ; ne pas implémenter une autorité fictive. Les tests historiques restent gelés : le seed doit adapter leurs préconditions sans changer leurs attentes. Un besoin inévitable de consommateur supplémentaire est signalé avant édition.

Allowlist totale désormais sept fichiers (les cinq88 + seed commun + nouveau helper hôte). Seed87 est déjà conservé byte-exact dans snapshots/s2-t1-source-87 ; parent le dégèle explicitement pour ce raccord. Aucune autre permission changée, aucun import/test/SQL/DB autorisé. Prochain livrable réunit T0-A/T0-B/T1-C et ce raccord, sous la même revue indépendante ciblée.
