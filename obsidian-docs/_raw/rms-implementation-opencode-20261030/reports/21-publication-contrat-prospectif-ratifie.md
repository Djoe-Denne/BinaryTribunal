# 21. Publication : contrat prospectif ratifié avant réalisation

## Objectif et décision

Relier les nouveaux octets réellement retenus à une publication statique unique, relue et reprise sans deuxième effet. Le superviseur ratifie le plan final du développeur, **avec son amendement compatible par evidence réservée**, et autorise la réalisation dans le worktree possédé. Aucun GO utilisateur supplémentaire requis.

Ce contrat ne crée ni accès natif, ni autorité scientifique implicite, ni acquisition automatique du contexte suivant. Les preuves de la route native restent bloquées et la suite globale interdite.

## Contrat retenu

1. **Choix prospectif avant le cycle.** La policy versionnée (root existant parent-owned, namespace, ownerActorId) doit être figée dans le preparing atomique avant anchor. Le port statique et la source doivent correspondre exactement à cette policy durable. Un ancien preparing sans policy refuse l'opt-in ; aucun changement de GraphRun/cycleKnowledge ou migration silencieuse.
2. **Manifeste complet et immuable.** PublicationMaterializationV1 lie mission/run/unité/fences, binding/plan/snapshot, policy, révisions entrée/sortie, niveau, cible et ensemble exact des résultats/artéfacts. Contenus, tailles et empreintes sont retenus, sans dépendre du contenu préannoncé de publicationsByFunction. stored-result signifie octets exacts du résultat source ; parent-derived doit être explicitement approuvé par l'attestation, pas autorisé par une étiquette worker.
3. **Attestation par le tuple existant.** Ne pas ajouter publicationMaterializationSha256 à ParentAttestationRequest/ParentAttestation ni élargir le codec historique. Utiliser une unique entrée Evidence réservée, versionnée, contenant hash du manifeste et tuple exact de portée. Le digest de toute l'evidence et les checks de l'attestation privée couvrent cette entrée. Le store recalcule et compare tout le manifeste, résultats et scope : une evidence déclarative seule n'accorde rien. Attestation non révoquée requise dans le mode prospectif **même au niveau1**, sans durcir silencieusement le régime historique.
4. **Un seul journal.** Matérialisation durable non autorisante, validation/attestation, pending puis readback/commit et bindings/receipts utilisent GraphStore et son journal existant. Réserver et relire les images retenues ; callbacks divergents après rétention ne les remplacent pas. Refaire contrôles de contrôleur/famille/résultats/quiescence/attestation au bord write et en transaction commit. Aucun second store, ordonnanceur ou watcher.
5. **Cible statique et effet unique.** Port local synchrone : cible déterministe sans chemin libre worker, création exclusive ou existant strictement identique, fsync/close et lecture Buffer exacte. Refuser symlinks, types inadmissibles, mismatch et fichiers partiels ; ne jamais écraser/réparer implicitement, supprimer une preuve ou choisir une nouvelle cible pour masquer l'échec. Root et policy viennent de la configuration parent figée, pas du payload résultat.
6. **Pas d'atomicité SQLite/FS inventée.** Un effet physique déjà produit peut survivre à une révocation ou une coupure ; il reste une observation brute tant que readback et commit ne sont pas acceptés. Il ne satisfait alors aucun prérequis. Aucune promesse de durabilité sous coupure d'alimentation ni effacement rétroactif ; les preuves portent sur les fenêtres de reprise réellement exercées.

## Précisions de domaine à préserver

- Distinguer hash des octets d'artefact, ManifestHash des octets JSON canoniques publiés, digest de pending et commitId scientifique existant ; ne pas substituer ces domaines ou modifier scientificCommitId pour les faire coïncider.
- Les pins de résultats doivent utiliser les digests réellement vérifiés du store, avec leurs domaines explicites ; ne pas confondre contenu brut, document parsé et record complet couvert par l'attestation.
- ArtifactBinding existant contient content/provenance et n'est pas un ArtifactFile de contexte. Le fichier manifeste publié n'est pas à présenter comme un fichier brut d'artefact ayant un autre SHA. La matérialisation d'entrées physiques pour le prochain travail reste la tâche suivante.
- Les copies documentaires ignorées servent aux développeurs, pas d'autorité ou d'entrée runtime importée.

## Réalisation et vérification autorisées

Fichiers ciblés : deux modules matérialisation/port statique, GraphStore, GraphEngine, GraphPorts/Engine et fixtures/tests de publication nécessaires. Schémas et codecs historiques inchangés. Tout besoin contradictoire remonte au superviseur avant extension, sans solliciter un second architecte.

Le développeur écrit code/tests seulement, **aucun test ou CLI produit par lui**. Après pin stable, le parent qualifie et exécute les sélections pertinentes : nouveau test publication, cas existants filtrés de durabilité/recovery/engine, typecheck ; q1 selon impact ou consolidation. Aucun fichier recovery entier avec threads ni tests aux timeouts historiques supérieurs adoptés. Registre et bases de fixtures neufs/OWN, effets pris en charge avant exécution, quinze secondes par test.

Couvrir quatre coupures (prepare, write/réponse perdue, readback avant commit, commit/réponse perdue), réouverture/retry exact, octets/cibles/provenance divergents, mismatch/partiel/symlink, double commit, retrait/tardif/révocation/fence avant effet et avant commit, callback divergent et ancien cycle opt-in refusé. Les oracles doivent vérifier les vrais octets et l'effet, pas seulement des flags. Aucun nouveau framework, test supprimé ou SKIP compté PASS.

Une revue indépendante proportionnée aux frontières modifiées et la consolidation du candidat intégré restent requises. Cela ne devient pas une chaîne fixe d'agents ni un rejeu des preuves inchangées.

## Localisation, impact et limites

Le parent a consulté Serena sur la racine commune retro-eng, sans réactivation : ParentAttestationRequest, ses références, GraphStore.preparePublication et GraphEngine.materializeArtifacts. Les octets canoniques de base87a933f ont été comparés aux360 pins du worktree : les lectures sont applicables à ce socle ; après modifications, le worktree sera vérifié par ses fichiers et ses pins propres. Les refs bornées ne prouvent pas exhaustivité.

Serena confirme l'evidence et les checks existants ainsi que les tests d'attestation ; le lien par evidence réservée évite le changement optionnel de champ initialement proposé. Aucun code n'est écrit par cette ratification. Native, L9 finale, L10 et clôtureM2 restent non acquis.
