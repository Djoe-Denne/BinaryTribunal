# M2 — 65 : reprise sur la capture pure d'admission et ses plafonds

## But et décision

Après composition/typing64 réussis, reprendre une tranche de code000b indépendante du stockage et de l'émission : **capturer sans perte une Admission déjà construite, vérifier l'image et ses plafonds en octets**. Cette utilité est commune aux choix body59 et ne tranche ni exclusions protocole/auth ni sémantique des fichiers référencés. Pas de gestionnaire de contexte ajouté, compaction OpenCode inchangée.

Mandat de code local dans la candidate .tmp/m2-s1-integration-r2 uniquement ; ne pas interpréter « reprends » comme ratification globale59. Aucun opener OWNv3, SQL, migration, service, client, engine, réserve/acquisition, débit ou dispatch dans cette tranche. S2 global reste ouvert.

## Contrat technique borné

- Reprendre la forme Admission actuelle graph-store.ts:125–128, sans charger GraphStore : identités requises non vides et command objet JSON ; conserver tous les champs JSON supplémentaires, pas de projection/troncature. Ne pas imposer un nouveau schéma S1.
- Capture JSON stricte détachée avant lecture des champs, réutilisant les primitives S1 qualifiées : getters/proxy/non-JSON/Unicode invalides refusés sans les exécuter. Images canonique entière et command, longueurs UTF8 réelles, SHA exacts et fingerprint upstream nommés distinctement. Pas de faux domaine nouveau ni de mélange RAW/D/requestDigest.
- Vérifier l'intégrité d'une image reçue avant de lui faire confiance (bytes, compte, hashes et lien command/admission), ou utiliser une construction privée vérifiable ; un JSON cofabriqué déclarant une petite longueur ne donne pas de droit.
- Comparaison pure `actualBytes <= currentUnitCap <= acquiredSlotCap`, caps explicites entiers sûrs valides ; unknown/null/malformé bloque, jamais zéro par défaut. Débit acquis non réduit à la taille réelle ; pas de règle `Cunit <= chaque Cf` non ratifiée. Pas d'addition de coût ou d'inférence root restante.
- Cette comparaison ne prouve ni sourcecaps authentiques, ni complétude scientifique finale/native, ni stabilité transport/public ; elle n'autorise aucune exécution. Aucune mutationDB/BURNED/ledger sous ce helper : l'état durable et le mapping S3 demeurent gates distinctes.
- Données synthétiques seulement, aucun token/credential réel lu, persisté, journalisé ou hashé. Aucun droit d'introduire des exclusions silencieuses ou de filtrer les champs pour faire entrer une image.

## Ownership et livrable

Même auteur000b, source nouvelle `src/graph-generation-budget.ts` (utilités pures seulement, pas ledger) et nouveau test `test/s2-author/body.test.ts` dans la candidate. Ces deux fichiers uniquement ; les309sources composées et les configs64 restent readonly/inchangées, WIP canonique et les gels intacts. Pas d'accès aux oracles QA S1/L7, pas de source scientifique modifiée. Plan de tranche fermé ici, pas besoin de produire un nouveau catalogue avant code.

Écrire d'abord les attentes manuelles de test : sérialisation littérale indépendante/multioctets, préservation des champs et détachement, images/rawhash/fingerprint, image altérée, caps aux frontières−1/égal/+1, Unicode/nonJSON/unknown/overflow, entrée non mutée et appels interdits absents. Couverture du contrat fini, pas maximisation abstraite. Livrer fichiers/hashes/interfaces/imports et limites au parent.

## Gate de vérification

**GO écriture des deux fichiers, pas GO test/typing** : parent inspecte le delta/imports puis fournit une vérification ciblée de cette source nouvelle. Enveloppe prévue : un typing60s et un test30s,90s cumulées, aucun retry implicite ; elle devra être matérialisée avant exécution. Ne pas réutiliser les compteurs/runner QA000a clos ni contourner le one-shot64 ; nouveaux inputs et nouveau code distincts, reçus séparés. Aucun test global/numeric450+9/planner415/QA107 ou nouvelle DB autorisé.

Retour en cas de manque de contrat précis avant invention ; un seuil ou invariant existant n'est pas assoupli. Revue parent des risques locaux et L9 indépendante à venir ; pas nouvelle chaîne universelle de reviewers pour une utilité pure sans SQL.

## Limites

Cette tranche prépare S2 sans la clôturer. La composition64 n'est pas rendue comportementalement intégrée par un nouveau module non testé ; son typing antérieur ne couvre pas cet ajout. Body final de transport/OWNv3/admission durable/publication et preuves publiques encore non acquis. Aucun Git/cleanup, DB/native/live/IDA/C#/service/session/configglobal ou nouveau framework.
