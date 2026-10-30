# 54. Bilan parent : livraison statique acceptée, clôture complète M2 non acquise

## Décision finale sur le candidat livré

Le superviseur accepte **dans leurs portées hors ligne vérifiées** les trois incréments intégrés : raccord prospectif runtime/public, publication durable des octets retenus et acquisition des nouveaux contenus par le travail suivant. Le candidat est intégré, relu et vérifié ; aucun nouveau défaut de code bloquant n'est démontré dans ces frontières.

**Ce n'est pas une acceptation complète RMS/M2.** La revue finale indépendante et le parent constatent des obligations natives ou explicitement arrêtées encore sans preuve. Aucun report modifiant le contrat n'a été accepté pour les effacer. Le résultat global est donc une livraison statique reçue avec **bilan M2 partiel**, conformément au§8, et non une mission complètement réussie.

## Fonctions réellement livrées

- **Admission préparée et reprise contrôlée** : images durables du body et des inputs, domaines de digest distincts, rétention transactionnelle et garde anti-fallback. Attention : les méthodes prospectives `submitRuntime` et `observeRuntime` refusent encore explicitement la route native non qualifiée ; elles ne sont pas un moteur d'agents natifs livré comme fonctionnel.
- **Publication physique hors ligne** : résultat retenu et manifeste exact liés à l'attestation privée parent, write exclusif ou existant strictement identique, readback exact, commit et bindings/receipts, reprises sans second effet. Le résultat stocké garde ses octets bruts, y compris JSON indenté ; une transformation nécessite une dérivation parent explicitement déclarée.
- **Prochain contexte GraphRunV2** : vrais fichiers des contenus publiés, approbation privée exacte après publication, nouvelles révisions et provenance, images effectivement présentes dans inputs/body/outbox, séparation A/B et union R explicitement autorisée, historique distinct du droit actuel et reprise sans modifier le cycle gelé.
- **Remplacement existant** : onze cas normaux ciblés qualifiés sous la nouvelle limite, sans modifier le code ou inventer une optimisation. Cette décision ne prouve ni les chemins concurrents interdits ni le scénario de quatre origines.

## Vérification et durées réellement mesurées

- Compilation du candidat intégré : sortie0,13,45 s.
- Primitives :55 PASS/125 assertions,52 ms processus après intégration.
- Publication :25 PASS/249 assertions sur son candidat exact, deux régressions historiques ciblées et contrôles de fidélité inclus ; preuves réutilisées dans leur portée inchangée et complétées par la projection actuelle.
- Projection :47 cas distincts/405 assertions, zéro échec, via trois sélections complémentaires. Central3 min03 s ; union autorisée3 min52 s ;45 autres22 min35 s cumulées. Les durées individuelles de ces45 cas ne sont pas disponibles, pas inventées.
- Remplacement normal :11 cas/77 assertions, zéro échec. Nominal14,81 s ; activation1 min32 s ; neuf invariants1 min13 s cumulées.
- Raccord/client et régressions de dispatch : preuves versionnées conservées, non réexécutées pour l'arrivée du reviewer. Les nombres ci-dessus ne sont pas additionnés en un prétendu compteur de suite globale.

La borne courante est **dix minutes par test**. Aucun dépassement individuel de cette borne n'est établi dans les résultats actuels. Les scénarios de3–4 minutes justifient un éventuel travail de performance ultérieur, mais n'échouent plus du seul fait du seuil historique de quinze secondes. Ni cause exclusive SQL/GC ni gain comparatif n'est prétendu. Les interruptions antérieures restent historiques ; elles ne sont pas réécrites en PASS.

`bun test` global n'a pas été exécuté : sa sélection actuelle peut atteindre des chemins arrêtés. Aucun SKIP n'est compté PASS. Aucun nouveau benchmark, rejeu scientifique, harnais important ou boucle de profilage n'a été ajouté pour fabriquer une clôture.

## Vérification finale parent et indépendance

La revue L9 fresh est favorable aux incréments hors ligne et défavorable à une clôture M2 complète. Elle a recalculé365 empreintes et lu sources/reçus/oracles sans exécuter de produit ni recevoir de transcript privé d'auteur. Le parent a contrôlé les frontières critiques et fait un dernier readback indépendant :365 sources et3493 dépendances identiques, huit reçus et captures vérifiés, onze modifications préexistantes préservées, index vide. Aucun nouveau test n'a été lancé pour cette seule relecture.

Une première lecture des reçus PowerShell a rencontré leur marqueur UTF-8 BOM ; le parseur observationnel a été corrigé et seule la lecture d'empreintes a été répétée. Les reçus et le produit n'ont pas été modifiés, aucun test rejoué. Cette erreur d'outil n'a pas interrompu la consolidation.

## Obligations qui empêchent la clôture complète

1. **Route native réelle** : source et version épinglées du handler déployé, droits des workers et événements terminaux du trajet produit non établis. Le refus externe historique n'est pas contourné. Les sources publiques trouvées sur Internet ne prouvent pas le code effectivement installé. Les méthodes natives refusantes citées plus haut sont une limite fonctionnelle assumée, pas seulement un détail de rapport.
2. **Projection DATA v3** : le binding conserve `knowledgeProjectionPolicyRef:null`. Le nouvel input effectivement acquis est prouvé sur GraphRunV2 hors ligne ; il n'est pas promis pour un parcours v3 natif non qualifié. Ajouter une image DATA isolée ne remplacerait pas cette qualification et n'est pas réalisé pour maquiller le manque.
3. **Scénario final natif D5 unique** : pas d'observation réunissant toutes les étapes, identités, droits, terminalité/tardifs, reprise, publication et nouveau travail. Des scénarios distincts réussis restent distincts.
4. **Arrêts indépendants de sûreté et de budget** : chemins threadsHOLD125/garantie anti-orphelin et scénario nécessitant quatre origines sous plafond trois non prouvés et non exécutés. Le diagnostic gelé n'a pas été rejoué. L'amendement de délai et la révision2 ne lèvent aucun de ces arrêts.

Aucune correction supplémentaire raisonnablement justifiée dans les sources examinées ne remplace ces preuves. Les supprimer ou les appeler « hors périmètre » pour annoncer M2 terminé réduirait silencieusement le contrat ; le parent ne le fait pas. Une reprise sur ces points doit disposer des sources/droits natifs autorisés et, pour les chemins arrêtés, d'un arbitrage explicite des garanties et contraintes concernées. Il n'est pas demandé de GO général ou de nouvelle campagne sans ce besoin précis.

## Ressources, intégration et reprise

Commits source intégrés : raccord87a933f, publication56d6a35d, projection05c3c532. Aucun push distant, amend ou hook contourné. Les onze changements utilisateur et les sources historiques sont intacts. Aucune ressource Docker ou action FF8 live créée.

Les fusions natives ont réussi ; le nettoyage de certains worktrees a échoué. Branches, worktrees, bases et actifs de preuve sont conservés, sans seconde fusion après succès, suppression forcée ou nettoyage global. Ce nettoyage différable ne bloque pas les fonctionnalités reçues.

Reprise minimale : utiliser `../final-review-inputs.md`, le journal `../OBLIGATIONS.md` et les références ci-dessous. Les statuts administratifs completed constatent la réception d'un travail et de son résultat, **pas le PASS de toutes les obligations**. L10 rend ici une acceptation bornée et un refus motivé de clôture complète.

## Annexe de preuves

- Candidat final : `05c3c5321a3f9f4ced1f7e8d9106027d1dea59d9`.
- Readback parent : `../evidence/final-parent-l10-readback-r1.json`.
- Intégration : `projection-integration-r6.parent-readback.json`, `publication-integration-r3.parent-readback.json`, reçus du raccord et manifests correspondants.
- QA : `projection-r6-consolidated-checks.json`, `replacement-current-normal-checks.json` et captures/reçus référencés.
- Revue finale : `../evidence/ses_e788b1f59ffeNncR9EBFemGPv1-native-finals-bundle-r1.json`, finale `msg_18778bc7d001KbOhss7r3e55Q5`, SHA256 texte `8f25c04b3ea80f15582a425e15588fef54e8157ee431f359f5ba7c0f2fb4c5ac`, Model.Ref natif OpenAI Sol high.
- Autorité de décision : ordre M2§7.1/§8, particulièrement417–431 ; révision2 et amendement utilisateur dix minutes/test.
