# M2 — 76 : contrat de capacités fermé, implémentation locale autorisée

## Décision et portée

Les corrections75 sont reçues et inspectées. Le parent ratifie le contrat interne corrigé : acquisition unique retenue par pool physique stable, journal de toutes les occupations partagées, affectations liées au travail, et domaine A/B/R sans worker R inventé. Ce sont les garanties de ressources déjà demandées par M2, pas un nouveau scheduler ni un contrat public.

La prochaine tranche implémente ces garanties dans la candidate isolée. Elle reste **source seulement** : aucune nouvelle origine liée/exécutée ni aucun test, SQL ou accès à une base autorisé maintenant. Les preuves73 restent celles de la version70 conservée ; elles ne deviennent pas un PASS des sources modifiées.

## Preuves acquises et limites

Lecture parent du contrat corrigé:14–94 et des types source:85–128 : scopes pool/travail distincts, CAS global au pool, nouvelle acquisition non prise pour un crédit, rôles A/B/R. Les hashes recalculés correspondent à la livraison :

- CONTRACT.md : 7091B, `5baffef80c4e404a6d040eed48fd7a8fe75532328e838d607c59c2f905d05d32`.
- resource-fixtures.ts : 24412B, `bc9524497d17d94c5c083a9aadc25a8f8e50de398b63014039cb1579ae8b805f`.

Les cinq sources70 sont encore identiques. Les nouvelles entrées restent non qualifiées par S1 ; leur cohérence sera une précondition réellement vérifiée, pas un résultat présumé du recalage de hashes.

Serena voit la classe candidate à ses lignes138–377. Ses références de prepareAdmissionV3 désignent atomic-admission.test.ts ; la réponse a fourni la liste sans snippets car le corps dépassait la borne. Grep exact dans la candidate complète cette liste et retrouve reserveFamily/releaseProvenV3 ainsi que les fixtures auteur. Cela délimite les consommateurs connus, sans prouver une absence universelle de consommateurs. L'auteur vérifie aussi les références des nouvelles signatures qu'il touchera.

## Ownership et fichiers autorisés

Avant dégel, parent conserve les cinq fichiers source70 et leur manifeste sous snapshots/s2-source-70 ; les deux artefacts corrigés76 sont protégés readonly. Dans `.tmp/m2-s1-integration-r2/tools/ff8-harness`, autoriser seulement :

- modifier `src/graph-generation-store.ts` et `src/graph-trusted-authority.ts` ;
- créer `src/graph-resource-ledger.ts` pour les records/types, calculs sûrs et projection physique privée nécessaires ;
- créer `test/s2-author/resource-admission.test.ts` et `test/s2-author/resource-fixtures.ts` ;
- adapter `test/s2-author/fixtures.ts` et `test/s2-author/atomic-admission.test.ts` uniquement au nouveau contrat d'acquisition/affectation et aux préconditions de leurs cas existants.

Aucun import produit depuis les tests ou les inputs de mission. Les types nécessaires vivent dans le module produit ; les entrées synthétiques corrigées sont readonly et peuvent être utilisées par le nouveau test avec un chemin exact vérifié, pas recopiées en oracle miroir. Les attentes manuelles ne sont pas produites par le ledger/planner. Réutiliser les primitives qualifiées, pas un framework.

Budget/helper65, body.test.ts, 309sources de base, fixture auteur S1 fournie, configs, snapshots, sources canoniques/v6/client/engine/adapter restent intacts. Besoin d'un autre fichier ou d'une DDL différente : remonter la cause précise avant extension. Pas d'édition opportuniste.

## Contrat d'implémentation

Appliquer CONTRACT corrigé et les décisions74–75 : aucune sélection/rank/planner nouvelle ; acquisition et observations indépendantes via hôte fixture privilégié ; handles opaques liés à connexion/refs/révocations, vérifiés au consommateur. Requête ou hash cofabriqués ne donnent aucun droit.

ReserveFamily exige une acquisition valide lorsqu'il engage le travail ; prepareAdmissionV3 exige les témoins appropriés avant tout nouveau pin/SPENT/outbox. Absence de preuve ne doit pas activer un mode de compatibilité permissif. Les anciennes identités persistées restent lisibles/auditables, sans nouveau droit d'émission ; unknown ne devient pas inventaire vide. Signature optionnelle permise seulement si absence => HOLD pour une nouvelle consommation, jamais bypass booléen.

Commande70, S1, grant, affectation et scopes exacts sont joints dans la transaction. Worker exclusif, quotas compte et six dimensions séparés, concurrence et set des claims inclus vérifiés globalement ; déduction unique et CAS. Over-cap engagé peut BURNED sans occupation physique, après validation de ses préconditions ; aucun worker fantôme. Tout rollback doit inclure le ledger physique avec pin/débit/outbox/events.

Réutiliser les tables OWN/EventLog existantes, sans DDL nouvelle dans cette tranche. En cas d'impossibilité de représenter une projection sûre, STOP ciblé plutôt que contournement. La reconstruction du ledger physique à reopen vérifie événements, claims, acquisition retenue et projection courante sans réinitialiser les débits/engagements. Pas de reducer S4 complet ni de transfert d'acquisition.

La release physique par executionId/allocationId et la release familiale utilisent la même primitive et preuve Q actuelle ; supprimer le DELETE familial global dangereux. Un Q déjà consommé est idempotent et ne supprime pas l'occupation suivante. Révocation/capacité inconnue ne doit pas empêcher l'observation ou la preuve d'arrêt, ni rendre la libération permissive. Aucun remboursement logique.

## Tests préparés et gates suivantes

Écrire les cas finis correspondant au contrat : worker partagé, quotas compte, dimensions/unknown, staleness/révocation, set incomplet, tentative de pool/quota neuf, R incompatible, rollback, retry, Q répétée/réaffectation, reopen et BURNED sans occupation. Conserver les 14 scénarios précédents et leurs attentes substantielles, adapter seulement leur nominal aux nouvelles preuves. Si une attente ancienne contredit une nouvelle obligation, l'expliquer au parent ; ne pas supprimer le cas pour faire passer la suite.

Livrer sources/hashes/imports/signatures/événements et inventaire de tests écrits. Aucun import évalué, compilation, test ou probe des fixtures pour accélérer le diagnostic à cette étape.

Après livraison, le parent examinera le delta et fera reprendre au reviewer indépendant existant les frontières nouvelles et l'impact sur les trois défauts précédemment fermés. Les preuves inchangées sont réutilisées. Les contrôles runtime seront ensuite matérialisés avec OWN/registre/env et budget propre ; les 240s proposés ne sont pas une autorisation actuelle et aucun ancien ledger n'est rouvert. Pas de nouveau harnais important autorisé.

000b/S2/M2 demeurent ouverts ; public/S3, transitions, crossgen, publication et S4 global non acquis. Aucun Git, nettoyage, native/live/IDA, C# ou modification globale.

## Préparation effectivement réalisée

Les cinq fichiers70 ont été copiés avec readback des hashes sous snapshots/s2-source-70, avec SOURCE_MANIFEST.json, tous readonly. Les deux entrées corrigées sont readonly après vérification de leurs pins. Seuls store/authority/fixtures/atomic-test courants sont dégelés ; budget reste protégé. Le GO76 borné a été transmis à l'auteur existant. Aucune exécution produit ou création de DB lors de cette préparation.

## Ajustement explicite de deux attentes historiques

L'auteur signale deux conséquences nécessaires du ledger physique : une admission conserve son claim fn/G2 et ajoute un claim worker ; le parcours Q/release conserve ses huit événements historiques et ajoute resource-allocated/resource-released. Le parent autorise cette adaptation des assertions, sans suppression de scénario : distinguer les deux types de claims et leurs identités/propriétaires ; vérifier séparément les deux nouveaux événements, leurs payloads et leur position, tout en conservant les huit événements d'origine et leur ordre relatif. Ne pas remplacer les égalités par une simple borne basse ou filtrer les événements inconnus. Il s'agit d'étendre les attentes au comportement requis, pas d'assouplir un seuil. Ces nombres restent des attentes source, non des résultats exécutés. Aucun droit de test ou autre fichier ajouté.
