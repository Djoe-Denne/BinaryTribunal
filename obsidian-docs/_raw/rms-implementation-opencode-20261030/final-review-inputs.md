# Paquet de consolidation finale — candidat intégré, sans clôture présumée

## Mandat et indépendance

Vérifier le candidat statique RMS intégré et rapprocher les obligations D5/M2 des preuves exactes. Ce paquet est prêt pour une future revue fresh ; sa présence ne vaut pas admission. Aucun contexte privé d'auteur ou transcript de raisonnement à lire. Réutiliser les preuves valides et ne pas rejouer pour l'arrivée d'un reviewer. Séparer défauts de code, manques obligatoires, suggestions et portée native non prouvée.

Racine : re-ff8. Candidat parent `05c3c5321a3f9f4ced1f7e8d9106027d1dea59d9`. Manifeste `evidence/projection-r6-manifest.json` :365 fichiers du harness et dépendances décrites par3493 pins. Les sept chemins de la projection sont relus après intégration ; les onze modifications préexistantes ne sont pas livrées. Ne pas attribuer ces modifications utilisateur à la mission.

## Sources normatives

- `docs/missions/re-graph-scheduler/ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md`, §7.1 et§8.
- `docs/missions/re-graph-scheduler/rms-static-documentation-20261028/{02-parcours-et-frontieres,04-contrat-public-et-observations,05-verification-et-scenario-final,06-plan-et-decisions}.md` : préparation documentaire, pas résultats courants.
- Contrats locaux ratifiés : rapports08,21,31 amendé32,38 ; amendement utilisateur délai au rapport43 :600000 ms/test. Les autres arrêts explicites restent opposables.

## Preuves retenues, non interchangeables

1. Base exacte transférée : rapport04 et manifeste de composition ; exception codec et originaux conservés. Copie ≠ nouveau droit/origine.
2. Raccord runtime/public : rapport19 et reçus writer-r6 ; commit87a933f. Contrôle des erreurs/idempotence/digests et anti-fallback validé hors ligne ; pas identité du handler déployé ou terminalité native.
3. Publication : `evidence/publication-integration-r3.parent-readback.json`, rapports27–29 ; commit56d6a35d.25 tests/249 assertions dont fidélité brute, reprises et attestation ; deux historiques ciblés, typecheck et primitives. Conserver RED de la normalisation canonique.
4. Projection : `evidence/projection-r6-consolidated-checks.json` et `projection-integration-r6.parent-readback.json`, rapports44–48.47 cas/405 assertions via trois sélections complémentaires, pas SKIP ou suite globale. Autorisation privée après publication, octets exacts réellement lus, inputs/body/outbox, aveuglement A/B, union R explicite, révocations et replay.
5. Dispatch/fences : RED r4, GREEN r5 et deux régressions simulées ; même code en r6. Migration : huit tests eventlog r3, mêmes attentes de schéma et code de migration après les correctifs ultérieurs.
6. Compilation/primitives : reçus projection-integrated-typecheck-r6 et projection-integrated-q1-r6 sur dépôt intégré.365 sources et3493 dépendances identiques au candidat qualifié, onze modifications préservées.

## Manques à rendre explicitement, pas à effacer

- Remplacement : pas de delta correctif sélectionné ; le délai historique≈111s ne dépasse plus à lui seul le nouveau plafond600s, mais l'ancien résultat ne devient pas PASS rétroactivement. **Preuves normales actuelles supplémentaires** : `evidence/replacement-current-normal-checks.json`,11 cas ciblés/77 assertions (nominal17,activation fraîche6,invariants54),179775ms cumulés, aucune source modifiée. Rapport52 dispose la tâche corrective « sans changement supplémentaire justifié », pas couverture complète. Diagnostic de remplacement gelé non rejoué. Threads HOLD125 et scénario de quatre origines restent des questions distinctes non résolues.
- Handler déployé : source/version et droits natifs non établis, avec refus external_directory historique non contourné. D4:216–221 exige source autorisée épinglée ; présence de SDK/fixtures ou récupération de messages d'agents ne prouve pas ce handler.
- Projection DATA v3 : knowledgeProjectionPolicyRef reste null ; acquisition prouvée uniquement GraphRunV2 hors ligne.
- D5 complet : preuves de réponse perdue/retry, résultats tardifs, publication et nouveau travail existent dans leurs scénarios séparés ; aucun unique trajet natif final n'est déclaré prouvé par composition de compteurs.
- L9 finale fresh et L10 parent ne sont pas remplacés par les revues par incrément ou un statut de tâche completed.

## Limites de commande et revue

Pas de tests/CLI/service/live par le lecteur. Ne pas exécuter bun test global, les anciens diagnostics/threads/quatreorigines/scientifique. Ne pas importer les données de coordination comme autorité runtime. La suite ciblée ne prétend pas à une suite globale. Une revue favorable statique peut accepter les livrables dans leur portée, pas supprimer les preuves requises de clôture.

## Durées connues pour le bilan

Central183105ms, union232456ms,45 autres1354758ms cumulés ; pas de détail par cas dans cette dernière capture. Total projection1770319ms,47 cas distincts. Borne configurée600000ms/test. Pas de causalité performance/SQL/GC inventée, benchmark produit ou rejeu uniquement pour mesurer davantage.

## Retour attendu

Courte conclusion motivée par risque : preuve réutilisable et version, manques véritables, défauts bloquants concrets et limites. Références ciblées et arbitrages nécessaires, pas extension automatique du périmètre. Les conclusions d'acceptation finale appartiennent au parent.

La consolidation parent D5 au rapport52 est un résultat de vérification **partiel**, pas un PASS natif. La fin administrative des tâches amont constate leurs décisions et rapports, sans valider des obligations absentes. Vérifier précisément cette distinction dans la revue finale.
