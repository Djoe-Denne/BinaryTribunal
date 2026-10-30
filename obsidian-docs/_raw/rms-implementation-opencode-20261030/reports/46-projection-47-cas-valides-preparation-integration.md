# 46. Projection : 47 cas validés, préparation d'intégration

## Résultats observés

Les45 scénarios restants réussissent : **45 PASS, zéro échec,295 assertions**, en22 min35 s pour cette sélection complète. Les deux exclusions correspondent exactement aux positifs déjà vérifiés séparément ; ce ne sont pas des SKIP comptés PASS.

La projection totalise donc **47 cas distincts et405 assertions réussies** sur le candidat r6 inchangé. Sont couverts les octets effectivement consommés, la séparation des rôles, l'approbation parent privée après publication, les événements importés non autorisants, les révocations, les cibles physiques hostiles, la reprise et le cache pur. Les contrôles antérieurs de fence et de compatibilité restent réutilisés dans leur portée inchangée.

La compilation et les55 tests de primitives sont également réussis. Aucun nouveau défaut n'a été rencontré dans ces sélections. Ces résultats ne qualifient toujours pas un agent réel ou une route native.

## Durées : constat, pas arrêt artificiel

- Acquisition centrale :3 min03 s.
- Séparation des rôles et union autorisée :3 min52 s.
- Autres45 cas :22 min35 s cumulées ; la capture Bun ne fournit pas les durées individuelles de ces45 cas.

Total des trois processus de projection : environ29 min30 s. Chaque test était configuré à dix minutes. Ces deux premiers scénarios sont nettement plus longs que l'ancien budget ; aucune cause exclusive n'est déduite. Pas de rejeu des45 cas uniquement pour remplir un tableau de durées. Le bilan final distinguera durées mesurées et détails indisponibles.

## Intégration préparée et prochaine étape

Le parent a vérifié avant toute fusion :365 fichiers et3493 dépendances conformes, sept chemins exacts, index vide, onze modifications préexistantes sans recouvrement et épinglées. Le registre de fixtures est snapshoté sans nettoyage : les ressources des tentatives interrompues sont préservées. Les49 pins de fermeture enregistrés sur l'ensemble de l'historique ne signalent aucun WAL/SHM ouvert ; ce compteur n'est pas présenté comme49 nouveaux tests.

La consolidation indépendante des nouvelles preuves est demandée au même reviewer, sans réaudit général ni répétition des tests. Après réception et vérification du verdict dans sa portée : arrêt du développeur, fusion native des sept chemins, readback exact et contrôles affectés par le transfert, commit parent borné. Aucune nouvelle autorisation utilisateur nécessaire pour ce jalon.

La réalisation reste hors ligne GraphRunV2 ; le binding de projection v3 et les garanties natives ne sont pas acquis. L'intégration de ce livrable ne sera pas assimilée à une clôture complète M2 ou à la levée des arrêts explicites historiques.

## Preuves

`../evidence/projection-r6-consolidated-checks.json`, trois reçus projection-*-ten-minutes-r6 et captures, manifeste r6, snapshot des fixtures et `premerge-projection-r6.json`. Consolidation indépendante encore attendue ; aucune fusion ou réception finale annoncée par anticipation.
