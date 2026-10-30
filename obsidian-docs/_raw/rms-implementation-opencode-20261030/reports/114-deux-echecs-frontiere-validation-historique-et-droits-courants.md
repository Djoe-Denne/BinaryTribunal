# 114. Deux échecs : validation historique et droits courants confondus

## Objectif et résultat

Le candidat corrigé doit préparer un travail valide puis refuser l'expiration pendant une attente. Après correction de typage vérifiée et compilation réussie en 3 956 ms, les six sélections ciblées donnent **65 réussites, 2 échecs et 851 assertions**.

Les nouveaux cas de double grant concurrent, conservation après échec de refresh, conflit de curseur et rollback du témoin réussissent dans leur portée. Les deux scénarios d'expiration pendant l'attente n'atteignent pas encore leur oracle : la préparation initiale valide échoue déjà.

## Cause corroborée par le superviseur

Le lecteur d'admission durable construit un contexte historique avec heure0 pour vérifier l'image conservée. Pendant une préparation native, cette validation appelle le vérificateur de droits courants, qui exige désormais issuedAt inférieur ou égal à l'heure fournie. L'acquisition émise à1000 est alors comparée à0, au lieu du vrai contexte courant de préparation.

Ce mélange entre validation historique et autorisation présente est bloquant. Il ne justifie pas de supprimer la garde d'expiration, d'inventer une heure à partir de l'acquisition ou d'accepter le refus initial comme résultat attendu du test.

## Décision et revue

Le même auteur reçoit un diagnostic statique borné à cette chaîne, sans modification pendant cette analyse. Le plus petit correctif devra soit séparer l'intégrité historique des contrôles courants réels, soit propager le contexte courant déjà authentifié au bon endroit, sans reconstruire d'autorité depuis la réservation historique.

La revue statique des trois corrections initiales était favorable sur ce pin avant communication de la nouvelle QA. Cet avis reste conservé dans sa portée, mais ne clôt pas l'échec comportemental. Le reviewer est réactivé uniquement sur cet impact historique/courant, pas pour une nouvelle revue générale.

## Confirmation indépendante et correction autorisée

L'avis d'impact `result_mvu7g0ug_0002_46dluf` confirme la chaîne et constate que la branche d'opération native déjà retenue présente le même mélange quand current=false. Le superviseur a relu les pins indépendants et leurs comparaisons dans assertAdmissionInputs : digest, événement, scope, fences, plan, rôle, projection et en-tête doivent rester tous vérifiés.

La correction minimale est désormais autorisée dans graph-store et le test client : ne plus utiliser le contexte historique à heure0 comme autorité temporelle dans les deux branches natives. Les validations historiques demeurent des contrôles d'images et de sources retenues, pas des permissions de nouvel effet. Préparation et usages courants gardent une vraie autorité actuelle, expiration et révocation avant I/O. Il est interdit de supprimer globalement issuedAt ou de choisir une date artificielle pour passer.

Le prochain candidat doit préparer un travail local valide, atteindre réellement les deux coupures d'expiration et conserver le refus des pins/images/rôles corrompus. Les lectures historiques peuvent rester inspectables après échéance, sans ouvrir un dispatch. Le gel est levé seulement pour ce correctif borné ; pas de nouvelle étude ou infrastructure.

Option concrète retenue après le diagnostic auteur : ajouter un argument privé currentAuthority à assertDurableAdmission, fourni par les deux appels natifs courants de préparation et d'envoi, où cette autorité est déjà vérifiée et relue. La réservation conserve uniquement son identité historique ; elle ne donne aucune heure ni droit actuel. currentRevision=false et toutes les comparaisons historiques restent inchangés. Un appel natif sans cette vraie autorité refuse avant le host au lieu de lui transmettre now0. Les API pures d'inspection des faits restent distinctes d'une validation de droit courant. Aucun contrat persisté ni autre module à changer ; correction et tests ciblés sont explicitement autorisés, sans nouvelle attente de ratification.

## Preuves et limites

- [Reçus, durées et chaîne d'échec](../evidence/native-runtime-r10-fixed-parent-qa.json).
- Pin : `1306705da2e98deccdb75db0aaba8461a29a1b4c`,18empreintes conformes.
- Lectures parent : graph-store964–978,1124–1149,1192–1205,2179–2183,2303–2310 ; client.test359–373.
- Cas maximal exécuté : 4 296,7 ms ; aucun dépassement de dix minutes, suite globale ou effet natif.
- Aucun raccord intégré, qualification native ou acceptation complète de mission. Les deux FAIL restent des échecs.
