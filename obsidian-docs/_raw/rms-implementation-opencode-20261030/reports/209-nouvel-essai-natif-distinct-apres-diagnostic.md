# 209. Nouvel essai natif distinct après diagnostic

## Prérequis de lancement vérifié

La revue `result_mvv6nbpg_0000_wynn43` confirme que le lancement natif à environnement fermé respecte le contrat sans modifier les gardes du produit. Sa condition supplémentaire est vérifiée : une sonde stdlib parent Bun→spawnSync→enfant Bun termine sortie0 en56ms et observe execArgv vide dans les deux processus. Aucun produit ou base n'est ouvert par cette sonde.

La base RMS a été relue après le HOLD207 : les empreintes logiques des37tables et le bail correspondent exactement à l'état après acquisition du fence2. Le refus n'a pas ajouté d'effet métier. Une origine reste comptée.

## Décision et préparation bornée

Le parent retient un **nouvel essai explicite**, non un retry automatique de207. Il utilisera un namespace neuf `owned-direct-209`, une nouvelle requête et le fence3 acquis distinctement par le même propriétaire. L'essai207, ses scripts originaux et son résultat HOLD restent conservés. Aucun permis modèle n'est réactivé.

Les deux scripts ponctuels reçoivent un seul argument fermé pour ce nouvel acte. La préparation exige la preuve207 exacte (HOLD, aucun enfant ni réponse), la sonde de chaîne positive et le fence2 existant. Les contrôles de continuité restent identiques. Le receiver conserve toutes les conditions du FINALOUTCOME ; seul le namespace/fence attendu change.

Le lanceur PowerShell `launch-native-owned-209.ps1` utilise ProcessStartInfo, Bun épinglé, arguments et cwd fermés, environnement vidé puis reconstruit, aucun shell enfant ou configuration globale. Il conserve les reçus avec création exclusive et arrête l'enchaînement au premier échec. Le maximum de l'invocation qualifiée reste120s ; les bornes externes de collecte ne permettent aucun succès tardif.

## Vérification et état

Les scripts adaptés et le lanceur ont passé les contrôles de syntaxe seuls (Node --check et parseur PowerShell), sans évaluation. Le reviewer existant reçoit uniquement les deltas d'arguments, namespace, fence et lancement. L'exécution reste en attente de cette vérification ; aucun fence3 ou nouvel hôte n'est encore créé.

Le code produit et ses cinq pins203 sont inchangés : aucun typecheck ou test acquis n'est rejoué pour ce seul changement du lanceur parent. Les POST, sessions et modèles restent exclus. Tranche B, B/R, D5 et M2 restent ouverts.

## Annexe technique

- `evidence/direct-bun-chain-facts-native-208.json` : chaîne stdlib propre,56ms.
- `evidence/owned-state-after-hold-207.json` :37tables inchangées, fence2.
- Originaux206 : `evidence/parent-scripts-206-original/` ; aucune base copiée.
- Préparation adaptée9794octets/SHA `11a57a0def4cfd9aefed2f45d8509d0239a1ea01e74fa7fa7a1e2c3192ac54ed`.
- Receiver adapté11633octets/SHA `1d3dbde41d5f9540133faba157cac1eb4831e9669fb3c027c54eee9f2c0c85e2`.

## Correction du dernier blocage du lanceur

L'avis `result_mvv6s2xh_0007_depbbw` confirme les deux actes adaptés, mais relève une attente sans délai après Kill et deux drains de sorties sans borne. Ces attentes sont corrigées dans le seul lanceur : fermeture après Kill limitée à2000ms, puis chaque drain limité à2000ms. Un échec, une exception ou une fin non prouvée conserve HOLD ; le résultat de tâche n'est lu qu'après confirmation de sa fin. Le reçu ne déduit aucune libération de ressources.

Le parseur PowerShell confirme la syntaxe et quatre appels d'attente ayant chacun un argument de borne. Aucune application n'est exécutée par ce contrôle. Le reviewer reprend uniquement ce blocage et son impact ; la qualification reste non exécutée pendant cette reprise.

Lanceur corrigé :4133octets/SHA `0d8fc60a44b1f7d420f112e1cffc534b476f6031eabc17b14a085a534d887b60`. Préparation, receiver et code produit sont inchangés.

## Gate reçue avant exécution

L'avis `result_mvv6tvvu_0000_qkexh5` lève ce dernier blocage sur l'empreinte du lanceur ci-dessus. Le parent reçoit cette correction et engage l'acte209 préparé, après vérification du pin et de l'absence de tentative dans son namespace. L'avis ne vaut pas réussite native : le FINALOUTCOME et ses preuves réelles restent à examiner après exécution.
