# 11. Premier raccord vérifié ; revue indépendante en cours avant intégration

## Objectif et résultat concret

Le premier incrément relie une préparation v3 DATA à une entrée réellement consommée par Engine et à un journal client prospectif. Il conserve les gardes historiques et refuse toujours l'activation et l'observation natives faute de garanties établies. Le parent a vérifié cette version exacte sur disque, pas seulement le compte rendu du développeur.

Résultats des contrôles exécutés :

- **Compilation TypeScript complète : réussie**, code 0, environ 3,5 secondes. Le script exact typecheck est utilisé ; ses inclusions src/test/scripts et strict/noEmit sont conservées.
- **Tests client : 20 réussis, zéro échec, 70 assertions.** Les neuf défauts reproduits avant correction ne se reproduisent plus ; tous les corps de tests historiques sont conservés verbatim, un cas prospectif est ajouté.
- **Nouveaux tests de raccord : 2 réussis, zéro échec, 10 assertions.** Préparation DATA sans accès à l'état d'Engine, intégrité des octets, refus de qualification inventée et refus natif.
- **Protocole : 6 réussis, zéro échec, 26 assertions.** Sélection explicite, effets de fixtures qualifiés.
- **Préservation verticale v2 : un seul cas sélectionné réussi, zéro échec, 18 assertions.** Les autres cas de ce fichier ne sont pas exécutés ni comptés réussis. Les timeouts historiques de trente/soixante secondes n'ont pas été adoptés.

Chaque test exécuté conserve un plafond explicite de quinze secondes. Les 360 fichiers pinnés ont été relus après les contrôles, **zéro dérive**. Les 55 tests primitifs antérieurs gardent leur preuve séparée dans leur portée ; les compteurs des différentes suites et de la baseline ne sont pas additionnés comme couverture globale.

## Ce qui n'est pas prouvé

La preuve est statique et hors ligne : le quatrième digest RPC reste null parce qu'aucun body transporté n'est observé. Une référence DATA ne devient ni autorité ni preuve native. Aucun appel à ensemble.execution.v1, thread, diagnostic gelé ou campagne scientifique. La suite globale demeure interdite et non exécutée.

Le remplacement, le body RPC complet, les droits effectifs des futurs workers RMS, la terminalité native, la publication générale et l'acquisition de nouveaux contenus ne sont pas clos par cet incrément. La mission n'est pas acceptée globalement.

## Revue et corrections d'audit

Un lecteur indépendant en contexte fresh examine maintenant ce raccord précis avant intégration. Ce n'est pas la revue finale de toute la mission ; sa preuve sera réutilisée dans sa portée, avec reprises seulement pour bloquants et impacts. Il ne lance aucun test ni nouveau harnais.

Deux corrections administratives sont demandées au développeur : exclure les copies de coordination parent du paquet Git final (elles restent sur disque), et préciser la provenance de deux imports adaptés. Contrairement à une formule trop large du compte rendu, cross-epoch-fixtures.ts est un dérivé de la catégorie protected113 et final-host-fixture.ts un dérivé source176 : leurs pins changent dans le worktree, **pas dans les originaux gelés**. Ces adaptations de chemins étaient autorisées et manifestées ; les preuves héritées ne sont pas étendues automatiquement.

Les deux documents d'audit peuvent être corrigés sans modifier le produit. Les tests ne seront pas rejoués pour ces seuls changements documentaires ; les hashes source/config/tests seront comparés à la version testée avant tout transfert de preuve.

Mise à jour : les corrections ont été reçues et vérifiées sur HEAD `964487b110b7d4350e856a1eb37395720bcd7d88`. Aucun fichier de coordination de mission ne reste suivi. Sur les 360 pins comparés, seuls les deux documents d'audit changent ; les 358 autres fichiers sont identiques. Nouveau manifeste r2 : `../evidence/writer-r2-manifest.json`. Mapping de réutilisation : `../evidence/writer-r1-r2-proof-reuse.json`. Les cinq contrôles r1 restent valides pour leurs frontières inchangées ; aucune réexécution artificielle. Le reviewer indépendant est informé de cette correction de provenance, sans reprise de revue globale.

## Propriété des ressources et intégration

Le protocole et le cas v2 écrivent un registre neuf dans le worktree possédé. Il conserve six bases de fixtures fermées et épinglées ; neuf chemins sont réservés au total, dont trois sans base de données. Aucun WAL/SHM ouvert sur les bases épinglées, aucune suppression, aucune origine native remise à zéro. Un snapshot de ce registre est conservé côté parent avant une éventuelle suppression future du worktree.

L'inspection préparatoire Git ne trouve aucun chevauchement entre le delta de branche et les onze modifications suivies existantes du dépôt principal. Cette observation prépare l'intégration, mais ne l'effectue pas ; les copies de coordination indûment suivies doivent d'abord être retirées et la revue reçue.

## Références techniques

- Candidat : `../evidence/writer-r1-manifest.json`, SHA256 `7f6c516a4278606f94c0ab6c33d990edc4cb52f7730881a4d47fc585e8666dcd`.
- Synthèse parent : `../evidence/writer-r1-parent-checks.json` ; reçus et captures `typecheck-r1`, `client-r1`, `runtime-binding-r1`, `protocol-r1`, `vertical-v2-r1`.
- Registre conservé : `../evidence/focused-fixtures-r1.snapshot.jsonl` ; propriété : `fixture-registry-owner-r1.json`.
- Revue ciblée indépendante : tâche `task_mvsk6ph8_000u_uq8hf2`, session fresh `ses_e7bd3ecb9ffevCYWkaFJF5KMn3`.
- HEAD reçu avant corrections documentaires : `52303a85672e70b90c176c350758cd2328784314` ; ce commit n'est pas à lui seul une acceptation.

Localisation : delta comparé au seed exact, imports/effets vérifiés dans les fichiers du worktree ; les index canoniques ne prouvent pas cette version. Impact : code statique et corrections client contrôlés, réception partielle préparée. Limites : revue en cours, intégration non faite et obligations natives/globales ouvertes.
