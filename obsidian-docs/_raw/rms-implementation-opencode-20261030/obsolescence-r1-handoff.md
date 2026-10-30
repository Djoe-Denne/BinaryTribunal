# Candidat auteur RMSO r1 — non qualifié

Base e1a58997 ; branche et sept chemins exactement ceux ratifiés. Contrat83 et précisions84 reçues par message parent avant écriture. Aucune modification publique du cycle/codecs, route native refusante inchangée.

## Réalisation

- GraphStore v8 : table privée additive commandes, image, digest, reçu RMS stable, séquence par flux, CAS avant/après append et parent vérifié. Décision locale indépendante de la livraison. Livraison explicitement OFFLINE ; après ambiguïté, reconcile seulement. Session connue impose le flux commun ; changement de liaison refuse.
- Autorisation courante séparée des résultats/admissions historiques. Scope exécution invalide conservativement sa famille entière (une A/B/R sans source admissible ne peut publier), sans effacer le résultat eligible historique. Dépendances inter-unités et approbations de contexte relues transitivement, cycles refusés.
- Gardes client/dispatch/at-rest, Engine préparation/reprise/revue/publication ; réponse tardive conservée comme observation. COMMITTED et témoins de terminaison conservés. Aucun release/remboursement produit par la décision.

## Vérification et sélection proposée au parent

Aucun typecheck, test, primitive, produit, réseau ou natif exécuté par l'auteur. Durées tests : aucune. `git diff --check` seul exécuté (code0), et inventaire SHA256 des sept fichiers par Context Mode. Une erreur de regex du script d'inventaire a été corrigée ; aucun module produit importé par celui-ci.

Après inspection des imports et permissions, depuis tools/ff8-harness du pin :

- `bun run typecheck`
- `bun run test:q1-primitives`
- `bun test test/eventlog.test.ts --test-name-pattern '^RMSO-' --timeout 600000` (quatre cas)
- `bun test test/client.test.ts --test-name-pattern '^RMSO-' --timeout 600000` (un cas)
- `bun test test/graph-integration/publication.test.ts --test-name-pattern '^RMSO-' --timeout 600000` (un cas)
- `bun test test/graph-integration/next-context.test.ts --test-name-pattern '^RMSO-' --timeout 600000` (un cas)

Les imports fixture-driver contiennent Worker/sqliteContender : ce dernier n'est appelé par aucun nouveau cas RMSO ; le parent doit fermer cette sélection avant exécution. Aucune suite globale autorisée, aucun HOLD125/thread/quatre origines/diagnostic gelé/rejeu scientifique. Aucun SKIP/PASS anticipé.

## Limites et risques opposables

La livraison ordonnée est une surface prospective OFFLINE, jamais une qualification native. Aucun raccord natif nouveau, aucune preuve d'ordre reçu/lecture/application agent. Les gardes ne prétendent pas atomiser commit local et réseau : un effet déjà engagé reste rapprochable et le calcul peut continuer.

Les sept cas nouveaux ne couvrent pas exhaustivement toute la matrice du plan : notamment révocation parent injectée postappend, obsolescence pendant quota et publication physique ambiguë n'ont pas encore un nouveau négatif RMSO dédié. Les régressions existantes ne doivent pas être promues sans inspection. Typecheck et revue indépendante fresh restent des gates bloquantes ; ce paquet n'est pas une acceptation M2 ni une déclaration zéro défaut.

Localisation : GraphStore.retainOrderedCommandV1/deliverOrderedCommandV1/assertRmsWorkCurrentV1, GraphEngine.submit/observe/finish/fill, ExecutionClient.submit. Impact : sept fichiers manifestés ; attentes de version privée des tests ajustées7→8. Limite index : Serena a servi aux références canoniques seulement, modifications sur octets own non indexés.
