# 24. Publication : premiers tests ciblés réussis

## Objectif et résultats vérifiés

La publication doit conserver les nouveaux octets retenus, les lier à l'attestation et reprendre sans deuxième effet. Le parent a reçu et épinglé la version r1 : 363 fichiers, exactement six changements sur le socle intégré, 3493 fichiers de dépendances vérifiés.

Contrôles réellement exécutés par le parent :

- Typecheck complet : **réussi, code0**, environ3,6 secondes.
- Seul nouveau fichier de publication : **23 PASS, zéro échec,206 assertions**. Durée totale49,87 secondes ; chaque test conserve son timeout explicite de quinze secondes. Le temps total d'un fichier n'est pas le délai d'un test.
- Après exécution, les363 fichiers ont été recalculés : **aucune dérive**.

Les cas de jonctions locales sont inclus dans cette sélection : aucun refus de permission n'a été transformé en SKIP. Les quatre coupures et scénarios adverses restent des preuves hors ligne, pas une qualification native du parcours complet.

## Ressources et périmètre

Le parent a créé un registre neuf, possédé, dans le worktree publication. Il contient47 réservations de chemins et23 bases fermées et épinglées ; aucun pin ne signale de WAL/SHM ouvert. Les fichiers, y compris les cibles volontairement altérées et jonctions de test, sont conservés. Aucun nettoyage tiers, thread, appel RPC natif ou campagne scientifique.

Le développeur maintient les octets figés. Aucun test produit n'est exécuté par lui. Ses hooks de commit ont été inspectés par le parent : aucun hook actif, aucune désactivation ou configuration modifiée.

## Suite autorisée

La revue indépendante fresh doit maintenant attaquer les six changements et leurs frontières : attestation/manifeste, rétention, reprises, effet physique distinct du commit accepté et compatibilité historique. Les régressions existantes pertinentes seront sélectionnées selon les consommateurs modifiés, sans fichier recovery entier avec threads, suite globale ni rejeu scientifique. Les preuves valides inchangées seront réutilisées.

Ces premiers succès ne valent ni réception finale du code, ni intégration, ni preuve du contexte suivant. Les obligations natives et de remplacement restent ouvertes. Aucun nouveau GO demandé.

Mise à jour : la revue indépendante fresh est lancée sur les six changements. Model.Ref natif relu : OpenAI Sol high, session distincte de l'auteur. Deux contrôles historiques hors ligne précisément filtrés (commit/readback/binding et attestation niveau2) passent : **2 PASS,39 assertions** ; un seul cas vertical v2 passe : **1 PASS,18 assertions**. Aucun autre cas de ces fichiers n'est exécuté ou compté PASS, aucun rejeu de campagne scientifique. Leurs timeouts sont explicitement quinze secondes.

Le parent confirme le commit local de l'auteur `b4b3e552d06e4c51e384a1cbc3e1f6a7f5917707` : exactement les six chemins attendus, état suivi propre, octets pinnés identiques après les régressions. Le registre a été snapshoté côté parent sans supprimer de ressource. L'intégration attend le verdict indépendant ; pas de reprise d'une ancienne file.

## Preuves techniques

- `../evidence/publication-r1-manifest.json`, SHA256 `584dbedcf2b4b8accc5e1bc9f7b324c4f42e3187a1cc91e886552e57eee22649`.
- `../evidence/publication-r1-parent-checks.json`, reçus et captures `publication-typecheck-r1` et `publication-tests-r1`.
- Propriété du registre : `../evidence/publication-fixture-owner-r1.json` ; racine du worktree `.tmp/L8_PHASE_A_V2`.
- Un premier script de synthèse des captures a échoué en syntaxe regex ; il a été corrigé puis seul ce traitement observationnel a été rejoué, pas les tests. Aucun échec d'infrastructure ni résultat produit supplémentaire.

Localisation : worktree publication gelé et imports/fixtures connus, rapprochés aux pins. Impact : première validation ciblée réussie ; revue et régressions affectées à venir. Limites : hors ligne uniquement, aucune acceptation globale.
