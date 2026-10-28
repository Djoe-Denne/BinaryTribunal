# M2 — 83 : fermer les préalables de la barrière sans activer un candidat

## Objectif et manque établi

Après la vérification des réservations physiques82, l'étape suivante doit pouvoir fermer les nouvelles familles tout en laissant finir les familles engagées. La préparation RO identifie un préalable réel : le store ne conserve qu'une origine bootstrap active et une vue RUNNING. Il ne sait pas encore préparer durablement un candidat fille/T0 ni résoudre une autorisation privée transitionA.

Le parent recoupe les contrats : DRAIN302–309 impose une préparation immuable non autorisante ;327–337 distingue la transaction de barrière T1 ;18–68 exige un candidat courant pointé et un cut complet des familles réservées, même sans worker/outbox. S1 définit déjà PreparationObservationT0:146–154, CandidateRef/DrainEntry:227–230 et GenerationHead:253–259. Ces formes sont réutilisées, pas remplacées par un booléen drain.

## Décision locale et livrable autorisé

Fermer maintenant le contrat fixture et les entrées concrètes nécessaires au **seul prepare initial + T1**. Autoriser exactement deux fichiers nouveaux dans `inputs/s2-t1-fixture-r2/` de la mission : `CONTRACT.md` et `transition-fixtures.ts`. Ils doivent être réutilisables par le prochain code/test, pas un nouveau catalogue S2–S4. Aucune modification du produit, source82, input gelé, base ou runner.

La fille est une nouvelle origine synthétique construite avant scellement depuis les données auteur disponibles, liée au parent réellement retenu par le host. Son T0 et les records indépendants sont fournis depuis les données host courantes, jamais copiés d'une demande pour la valider. Aucun import/évaluation/scellement/typing/test/SQL/DB/native/Git autorisé à cette étape.

## Points à fermer concrètement

1. Préparation : candidat PREPARED immuable non actif, même lineage/root, parent actif/ordinal exacts ; refs envelope/run/T0 originales et sélection initiale par CAS si aucun candidat courant. Staged non pointé n'autorise rien. Décrire préimage/postimage de cette préparation et attente exacte T1 : ne pas réécrire T0 pour lui faire correspondre un head devenu différent. Résoudre depuis les contrats les effets sur head.revision/candidateRevision/eventSequence ; si incompatibilité réelle, la citer précisément avant invention.
2. Autorité fixture transitionA distincte du controller/bootstrap : record fermé et handle privé, purpose request-drain, issuer/connexion/case revision/candidat/parent/T0/source refs/owner/fence/révocation au consommateur. Les records de provenance mission/plan/knowledge/inventaire/budget sont retenus indépendamment par l'hôte. Une ref/hash/authorizationKind de la requête n'est pas autorité. Aucun HOST/native/B implicite ; autorité finale T2 future distincte.
3. Cut : documents BoundDocument fermés pour engagedFamiliesRef et inventoryAtCutRef, avec liste triée complète des familles **réservées** de l'active (pas seulement celles avec outbox), leases/fences, origines/unités/source/body refs, slots logiques engagés/dépensés et occupations physiques/révisions au cut. Lier les records indépendants nécessaires et les preuves d'exhaustivité. Absence/incomplétude => HOLD, pas tableau vide par défaut. Réutiliser le ledger82 ; pas inventaire parallèle auto-authentifié.
4. T1 : même transaction/connexion et CAS que la réservation, vérification de toutes attentes T0/case/source actuelles, append des cuts/DrainEntry et barrierRootId, candidat PENDING_DRAIN et mode DRAIN_NEW_FAMILIES, h→h+1. Aucun débit, libération, changement de connaissance ou occupation créé par ce seul cut. Doublon exact relit le même résultat ; autre candidat/body/source périmée refuse sans effet. Q n'est pas requis pour entrer en drain et cette entrée ne prouve pas un drain terminé.
5. Continuation : après barrière, nouvelles familles absentes du cut interdites et candidat non ACTIVE non autorisant. Observer/arrêter/libérer et poursuivre les seuls sous-intents originaux engagés reste permis sous leurs conditions propres. Les exigences reviewer/prédécesseurs de R ne sont pas dispensées. Nouvelle observation indépendante de capacité requise après changement des workCuts pour une nouvelle occupation ; aucune allocation/quota neuf ni deuxième déduction. Retry identité ne devient pas redispatch.
6. Bornes de préparation : DRAIN31–44 rappelle les compteurs root de préparation/staging. Identifier leurs sources/plafonds approuvés et ce que consomme la préparation initiale. Ne pas inventer un plafond, déclarer illimité ou remettre un compteur à zéro parce que seules les transitions initiales sont couvertes. Si ce contrat n'est pas défini dans les entrées déjà ratifiées, citer ce manque distinct et laisser l'opération correspondante HOLD avant effet.

Formats privés de cuts proposés possibles dans ces deux fichiers, sans changer les interfaces S1/les références publiques. DDL nouvelle non autorisée ; remonter une impossibilité de projection sûre plutôt que contourner les garanties existantes. Préserver intégralement SPENT/BURNED/ENCUMBERED, pool acquis et occupations à travers les nouvelles projections.

## Attentes finies et limites

Décrire nominal avec famille engagée sans outbox, doublon, CAS/source/case révoqués, rollback append, ordre réserve-avant-T1/réserve-après-T1, continuation engagée/refus branche absente, cuts de capacité périmés puis renouvelés sans nouveau quota, refus bootstrap recyclé/B/native. Attentes manuelles indépendantes du futur produit ; nominal à qualifier plus tard, pas PASS de construction de hashes.

T2/ActivationAttempt/remplacement/succession/levée de barrière/S3 restent hors cette livraison et HOLD. Retour court : deux fichiers/hashes/imports, champs et décisions fermées, contradictions précises restantes. Aucun nouveau budget runtime ;81 clos, aucune base82 rouverte. 000b/S2global/M2 toujours ouverts, trois commandes consolidées non exécutées.
