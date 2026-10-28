# M2 — 78 : corriger le contrôle du contenu des admissions à la reprise

## Problème confirmé et conséquence

La revue indépendante77 rend **À_CORRIGER** sur un seul défaut bloquant : le ledger physique vérifie les identités et les références d'une admission persistée, mais pas l'intégrité complète de ses bytes ni leur égalité au pin SPENT et à l'événement durable. Une occupation issue d'une admission altérée peut donc être considérée comme cohérente à la réouverture, puis réutilisée pour autoriser un autre travail.

Le parent confirme la branche par lecture : ledger:179 ne charge pas les colonnes d'image/hashes de l'outbox ;197–205 ne compare que les identités et quelques refs du claim. Le garde store:437–439 recapture effectivement l'image, mais cet audit de reprise ne l'appelle pas. Le point est requis par le contrat76 de reconstruction locale et par la gate77 ; ce n'est pas une extension au replay S4 global.

Les autres protections constatées par le reviewer sont retenues comme preuves statiques réutilisables : pool global/acquisition unique, handles/révocation, dimensions/CAS/atomicité, libération Q et impact B1–B3. Elles ne constituent toujours pas des PASS runtime.

## Correction autorisée

Après conservation de la version finale77, modifier seulement :

- `src/graph-resource-ledger.ts` ;
- `test/s2-author/resource-admission.test.ts`.

Les cinq autres fichiers77, les entrées corrigées, les sources70 conservées, configurations, helpers et sources de base restent protégés. Aucun autre fichier ou signature partagé modifié sans cause précise remontée au parent.

Dans l'audit de **chaque allocation persistée**, joindre l'outbox complète à l'image SPENT et à l'événement `g3_admission_prepared` exact. Vérifier les bytes Admission et command, leur relation, les SHA et requestDigest ; comparer aussi le contenu durable complet pertinent et ses identités/sources. Un nouvel hash calculé depuis la seule ligne altérée n'authentifie pas cette ligne. Réutiliser les primitives qualifiées de capture/intégrité, sans les réimplémenter ou ajouter un validateur général.

Une divergence doit refuser/HOLD avant de qualifier l'inventaire de cohérent, aussi bien à reopen qu'avant toute nouvelle consommation utilisant cet inventaire. Ne pas corriger/réparer les données corrompues ou attendre le retry de l'ancienne admission. L'histoire enregistrée peut être auditée sans transformer une source ensuite révoquée en autorité courante ; préserver cette distinction.

## Test fini et acceptation source

Ajouter un négatif de corruption sur une base synthétique parent-owned future : partir d'une admission A réellement allouée, altérer seulement son contenu d'outbox en conservant ses identités et son pin/journal, puis fermer/réouvrir. Le JSON reste valide afin d'atteindre le vrai join ; attendre refus avant reprise/nouvelle admission B, sans nouvel effet durable.

Les mutations ciblées des colonnes request_digest et command_sha doivent aussi être refusées ; quelques variantes du même test suffisent. Vérifier au moins une discordance avec le pin/journal qui ne soit pas masquée par une simple erreur de JSON ou de hash local. Injection SQL directe permise **dans le source du seul test de corruption** et sur ses fixtures neuves futures ; aucun SQL exécuté maintenant, aucune base73 touchée. Ne pas ajouter une infrastructure de corruption ou multiplier des campagnes.

Livrer les deux nouveaux hashes, les joins et scénarios corrigés. Reprise par le même reviewer indépendant sur ce défaut et l'impact du delta uniquement ; réutiliser ses constats2–6 inchangés. Aucun défaut introduit par le correctif n'est dispensé de revue.

## Gates et limites

GO écriture source uniquement. Aucun import évalué, seal/bind, typing, test, SQL/opener/DB, native/service/Git ou nettoyage. Les 45+14 cas restent écrits/non exécutés ; leur nombre ne vaut pas acceptation. La nouvelle origine reste non qualifiéeS1.240s proposés non exécutables, paquets66/72 clos, aucun compteur réinitialisé.

000b et S2/global restent ouverts. La version77 sera conservée avec ses sept hashes et son manifeste avant dégel ; aucun changement de contrat public, S3, crossgen ou S4 global.

Préservation effectivement réalisée : snapshots/s2-resource-source-77 contient les sept fichiers6654c67a… et SOURCE_MANIFEST, readbacks conformes et readonly. Seuls ledger et resource-test sont dégelés ; GO78 transmis à l'auteur. Le reviewer est informé de ne pas relire le courant mutable avant le prochain manifeste. Aucun produit/SQL exécuté dans cette préparation.
