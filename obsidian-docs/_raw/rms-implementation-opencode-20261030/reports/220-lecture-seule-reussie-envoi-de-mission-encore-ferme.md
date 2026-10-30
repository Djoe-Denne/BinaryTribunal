# 220. Lecture seule réussie ; envoi de mission encore fermé

## Résultat concret

L'essai219 réussit en19445ms. Le lanceur vérifie les32227fichiers réels, démarre son enfant Bun, reçoit les deux réponses HTTP attendues, ferme l'hôte normalement et produit un résultat reçu par le contrôle extérieur. Aucun arrêt forcé ou timeout.

**Le raccord en lecture seule fonctionne dans sa portée. Ce n'est pas encore la simulation complète dans IDA.** La version actuelle refuse volontairement tous les POST, donc elle ne peut pas encore envoyer une mission à un modèle. Le prochain travail est ce raccord d'envoi contrôlé, pas une autre amélioration générale du lanceur.

## Preuves reçues et limites

- Tous les32227fichiers/332635368octets vérifiés en17952ms, zéro erreur ou lecture en vol ; maximum quatre lectures, réservation nominale maximale13933577octets. Ce temps observé n'est pas une garantie de performance future.
- GET `/api/info` :200,291octets. GET `/openapi.json` :200,330732octets.
- Processus parent37244 et enfant39604 rapprochés ; scope et enfant fermés, sortie0, aucun Kill.
- Fin réelle, durée entière, expiration, identités de fichier BigInt et cinq pins de code rapprochés. Candidate et reçu provisoire liés par leurs empreintes ; seul le FINALOUTCOME extérieur est reçu. Le provisoire reste non adoptable seul.
- Les hashes des captures, du provisoire et des deux logs ont été relus par le parent après l'exécution ; ils correspondent aux reçus.
- L'état logique des37tables RMS est inchangé après l'invocation, comparé à l'état après acquisition du bail. Une origine reste comptée ; aucun crédit, grant ou historique remis à zéro.

Aucune session, demande de modèle, nouvelle origine ou action IDA dans cet essai. Les chargements DLL/WASM exhaustifs et l'équivalence avec du code chargé en mémoire restent non prouvés. Les HOLD207/209/216 sont conservés, pas reclassés en succès.

## Prochaine étape bornée

Le parent demande au constructeur, en lecture seule, le plus petit contrat de fichiers pour la voie d'envoi encore manquante : droits et images exactes avant tout effet, preuve positive d'enregistrement après création et avant prompt, refus des travaux obsolètes et prise en compte des réponses perdues. La custody du helper ne confère pas ces droits.

Cette préparation doit aussi distinguer l'entrée IDA retenue des anciennes données construites : ne pas renommer une fixture ou l'ACK170 pour fabriquer une mission IDA. Les droits modèle expirés ne sont pas réutilisés. Les droits B/R, l'accès d'authentification réellement permis et le budget doivent être établis, non déduits du seul statut « activé » d'un modèle.

Le contrat doit réutiliser les acquis, préserver les versions qualifiées et éviter tout nouveau moteur ou harnais général. Aucune édition, lecture de secrets, base, API, nouveau modèle ou serveur n'est autorisée au constructeur par cette consultation. La revue existante reçoit parallèlement les seuls artefacts219 pour confirmer leur portée sans rien rejouer.

## Références

- `owned-direct-219/FINALOUTCOME.json` : `READONLY_BUN_TO_BUN_QUALIFICATION_ACCEPTED`, sortie0,19445,3105ms.
- Captures exactes, requête et commande dans le même dossier ; reçu provisoire et sorties sous `qualification-0ac2c7e3-a670-4640-819f-4ae76687d05e` de l'hôte180.
- Actes parent : `evidence/owned-direct-219-prepare.json` (136ms) et `owned-direct-219-receive.json` (19544ms de collecte).
- Code : cinq pins218, contrôles et revue ciblés reçus avant l'essai.

Les POST, l'exécution de mission, la publication et les nouveaux contenus ne sont pas encore acquis. Le petit parcours IDA, la revue finale et M2 restent ouverts.

## Relecture indépendante des artefacts reçue

L'avis `result_mvv8qs66_000o_5npwx7` confirme la recevabilité219 dans la seule portée de lecture A, sans blocage concret. Le reviewer a recalculé les empreintes de requête, scope, candidate, provisoire, réponses et logs, et vérifié attribution, fin normale, durée et expiration sans rien rejouer. Il ne transforme pas ces preuves en droits d'envoi, auteur scientifique ou qualification exhaustive. Le parent reçoit cette confirmation ; la préparation de la voie d'envoi continue sans refaire les acquis.
