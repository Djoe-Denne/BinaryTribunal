# 38. Projection : deux défauts statiques confirmés avant intégration

## Objectif et constats

La projection doit respecter les droits par rôle et ne rien envoyer après expiration de l'autorisation de famille. La revue indépendante est récupérée dans la session native malgré une notification incomplète. Elle maintient l'acceptation bloquée pour deux défauts de code/contrat et pour le manque comportemental déjà connu.

**Premier défaut : droits de R incompatibles avec les propositions exactes.** Une policy autorise un fichier à A et un autre à B, mais aucun à R. Pourtant R reçoit obligatoirement les propositions A+B intégrales ; leurs en-têtes contiennent les chemins des inputs. Le test exige leur absence dans le body R, ce qui contredit ces propositions exactes. Réduire ou réécrire les propositions masquerait le problème.

**Deuxième défaut : expiration produite par l'événement d'envoi.** Le store vérifie une lease valide au curseurN, puis écrit admission_sending et avance le curseur. Si la lease expire àN+1, elle est alors invalide, mais le transport est encore appelé. Le parent confirme l'absence de contrôle après append. L'introduction de ce défaut par le delta n'est pas établie ; sa présence à la frontière affectée suffit à devoir le traiter.

## Décisions de correction

1. **Fermer les combinaisons de grants incompatibles.** Pour un R qui consomme les exacts A+B d'une fonction, chaque grant de connaissances projetées vers A ou B doit autoriser explicitement R pour les mêmes références et octets. L'approbation privée doit couvrir ces rôles exacts ; aucun accès R implicite. Le refus intervient avant anchor/admission. La fixture positive séparera A+R et B+R : A/B restent aveugles l'un à l'autre, R reçoit l'union explicitement autorisée et ses propositions intactes. Un négatif conserve et refuse A-seul/B-seul sansR.
2. **Contrôler après l'événement et avant le transport.** Dans la transaction existante, après admission_sending, revalider contrôleur, lease de famille et inputs/projection courants avant de rendre la requête au transport. En cas de refus : rollback de l'état, tentative et événement. Pas de renouvellement automatique, extension de budget ou nouveau store.

Le même développeur ajoute d'abord les tests seuls, sans modification de production. Le test de fence utilisera un petit setupOWN existant, une vraie réservation/préparation et des événements de fixture pour arriver àexpiresAtEvent−1, sans fabriquer le TTL par SQL. Oracles : aucun appel transport et préimages conservées. Le test de policy doit être indépendant des deux publications du cas central interrompu.

Le parent exécutera ces négatifs sous la borne externe de quinze secondes avant d'autoriser les correctifs de production. Pas de nouveau framework, thread, profilage ou relance du cas central en boucle. Les sources restent gelées hors tests demandés jusqu'au retour parent.

## Revue favorable partielle et limites

Le reviewer juge statiquement favorables le cache limité à des dérivations pures avec relecture d'origine, l'approbation privée liée au parent et à une publication, et la matérialisation brute exclusive/identique avec readback. Ce ne sont pas des PASS comportementaux.

Le cas central reste interrompu à quinze secondes ; les46 scénarios ne sont pas qualifiés. Les huit succès historiques de migration restent valides uniquement dans leur sélection. Aucune récursion infinie ni cause exclusive du timeout démontrée. La suggestion de renforcer la fixture de migration reste différable, pas une nouvelle gate de couverture.

## Preuves et localisation

- Finale indépendante : `../evidence/ses_e7b0a03a5ffe7KDo96BY6HC38n-native-finals-bundle-r3.json`, message principal `msg_184f986b7001X66G92a5TM5chI`, SHA256 texte `310f08d5fa6b1af3e69bed17bbf667329c8a001e653b9ddbbfb4f256161e3f72`. Model.Ref natif OpenAI Sol high, contextefresh.
- R : graph-adapter.ts:162–166, validation.ts:141–146, test next-context:178–189 sur le worktree.
- Envoi : graph-store.ts:959–975 et unit-lease.ts:155–161 ; le parent a relu ces frontières.
- Le reviewer n'a exécuté aucun test et n'a pas recalculé les hashes ; les365 pins restent une preuve parent distincte, pas attribuée à la revue.

Impact : fermeture compatible d'une policy dangereuse et garde transactionnelle avant transport. Limites : reproductions et corrections à venir, délai central toujours bloquant, acquisitionv3/natif et acceptation finale non prouvés. Décisions dans le mandat existant, sans nouveau GO utilisateur.
