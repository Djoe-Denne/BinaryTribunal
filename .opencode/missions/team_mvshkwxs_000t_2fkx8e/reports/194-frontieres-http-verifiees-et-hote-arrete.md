# 194. Frontières HTTP vérifiées et hôte arrêté

## Résultat concret

La qualification193 du candidat corrigé réussit : **14 contrôles HTTP concordants**, en12582ms pour le runner et12646ms pour son invocation parent. Après les contrôles, le scope de l'application est fermé et le processus enfant termine sortie0, signalnull, sans arrêt forcé. Le serveur de qualification n'est pas maintenu actif.

Le parent a relu le reçu et recalculé les empreintes des quatorze réponses : zéro écart. Le schéma reçu contient330732octets. Les captures stdout1730octets et stderr0 sont conservées séparément ; le reçu ne relève ni troncature, redaction, écriture partielle ou erreur de capture.

## Ce qui est prouvé et ce qui ne l'est pas

L'info authentifiée et le schéma retournent200, l'info sans authentification401. Les dix variantes prévues retournent403 ; le preflight OPTIONS retourne204 comme convenu. Les refus de POST et d'upgrade restent des contrôles de code/revue seulement : aucun n'a été envoyé.

Le marqueur d'import applicatif est atteint après le préflight des32227fichiers : le refus d'environnement189 ne se reproduit pas dans ce scénario corrigé. Cela ne requalifie pas l'ancienne invocation, toujours HOLD.

**Les chargements natifs restent UNPROVEN**, malgré HTTP ready et absence d'erreur reconnue dans les logs. Le résultat ne démontre pas un pare-feu sortant universel, un compte SQL de zéro session, une custody pour des sessions futures ou une preuve scientifique. Il atteste les frontières HTTP testées et la fermeture du scope/processus possédé.

## Suite autorisée

Une revue ciblée du résultat est demandée au même reviewer, sans aucun rejeu. En parallèle, le constructeur prépare seulement le contrat de la future route RMS non-qualification : mutations réellement nécessaires, émetteur et custody, provenance, autorité avant effet et continuité du budget.

Cette préparation ne rouvre pas les routes de l'hôte arrêté. L'origine déjà engagée reste comptée dans le plafond de trois ; aucun canary supplémentaire, nouvelle base de comptabilité ou copie ne remet les compteurs à zéro. Si le scénario exige plus de deux nouvelles origines dans cette lignée, la dépendance devra être signalée avant tout effet. Aucun test à quatre origines ou campagne scientifique n'est autorisé.

## Preuves techniques

- [Invocation193](../evidence/host-qualification-invocation-193.json), [résultat193](../evidence/host-qualification-result-193.json), [relecture parent](../evidence/host-qualification-parent-readback-194.json).
- Reçu26418octets/SHA `6ad34a7230a1ecb30706fc0df74208483bad511fc98be8711f64631ef160a802`, sous `qualification-fcc8edc0-04f2-4399-b5a6-f45b7f5675c4` du namespace180.
- Relecture7058octets/SHA `ca3abaaa7af0887a39a6accaeeadb23fd00d02d0bdcbc1607883f95de558a239` ; pins des réponses et logs conservés.
- Enfant30832, loopback port64845 pendant l'exercice ; import à10849ms, ready12467ms, scope fermé12544ms, exit0 à14:54:21.629Z. Pas de kill forcé.
- Les deux qualifications189 et193 restent bien distinctes : échec préalable9338ms, qualification corrigée12646ms. Aucun dépassement de la borne120s, aucun test ancien interdit rejoué.

L'acceptation finale D5/M2 demeure ouverte ; aucun résultat ou auteur scientifique n'est créé par cette qualification sans modèle.

## Réception après revue indépendante

L'avis `result_mvv3ht9b_0002_b43ya4`, message `msg_18d4f9dec001LK6qwd0MiOKYF0`, corrobore l'attribution à OWN/plan, le corps info avec PID et chemins propres, les14statuts et les oracles JSON, la fermeture du scope puis de l'enfant et les captures sans anomalie. Il ne relève aucun bloquant dans cette portée. Les rehash parent sont réutilisés, pas présentés comme recalculés par le reviewer.

Le parent **reçoit la qualification HTTP193 dans cette portée limitée**. Les conditions de préparation sont satisfaites pour cet exercice ; aucun contrôle n'est rejoué pour le clôturer. Les inconnues natives restent UNPROVEN, l'échec189 reste HOLD, et aucune autorité de session, modèle ou publication ne découle de cette réception. La préparation du contrat de la prochaine route continue séparément.
