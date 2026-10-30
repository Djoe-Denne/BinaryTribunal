# Instruction courante du superviseur — révision 117-FREEZE-6FE-2

Cette instruction est écrite par le superviseur pour résoudre les notifications livrées en retard. Elle concerne le périmètre de réalisation, pas une autorité native ou permission d'effet.

1. Le parent a constaté que le patch inverse était DÉJÀ committé au HEAD `6fe50ce4cf97f8e21b6407f0c2ce5529cd5bef8c` lors de son contrôle. Il a relu le diff exact contre R11 ca85 : seuls les imports et génériques de types restent ; le test client est byte-identique à ca85. Ce constat remplace la révision116-R12-GUARD-1, ne pas la rejouer.
2. CONSERVER ET GELER le code/test EXACT du pin6fe50ce4. NE PLUS changer de variante, ajouter currentAuthority, remettre R12 ou ajouter sa garde expected. Aucun reset/revert/restore/patch inverse supplémentaire.
3. Le superviseur choisit ce candidat maintenant vérifié pour éviter toute nouvelle réécriture. Il est conforme au split pur déjà revu, avec son correctif de typage ; il n'est pas encore compilé/testé/accepté par cette décision.
4. SEULE édition auteur autorisée : actualiser le manifeste18 et un checkpoint fidèles au candidat6fe, en preuves locales possédées. ZÉRO changement de source ou test. Le nouveau commit éventuel ne porte que ces preuves et doit conserver les octets produit/test6fe.
5. Annoncer pin final et gel code/test/proofs pour compilation/QA/revue parent. Aucune exécution auteur : ni test/typecheck/import produit/réseau/direct-run/natif/octroi.
6. Les changements tiers d'agents et entrées préparatoires restent intacts, hors index/livrable. Aucun reset/restore/cherry-pick large.
7. Avant de réagir à une nouvelle notification portant un steering contradictoire, relire cette instruction courante et signaler le conflit plutôt que changer la variante. Une future modification de scope exige une révision parent explicite de ce document, pas le simple réaffichage d'un ancien message.

Références : contrôle parent du HEAD6fe et diff ca85→6fe. Les échecs de compilation R12 restent historiques, sans nouvelle garde à ajouter au candidat actuel. Aucun nouveau GO utilisateur n'est requis ; seul le parent décide la réception après QA.
