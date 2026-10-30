# 10. Plan approuvé ; neuf défauts client reproduits avant correction

## Objectif et décision

Le raccord RMS peut maintenant être réalisé sur la base isolée reçue. Le superviseur approuve le plan du développeur : contrat fermé, entrée préparatoire consommée par Engine, journal client existant et refus natif avant effet. Les cycles v2, propriétaires d'état et barrières historiques restent inchangés. La publication et le contexte suivant restent des étapes séparées.

Les corrections de chemins sont autorisées comme dérivés versionnés : quatre imports extérieurs et quatorze imports cassés ont été localisés précisément et transmis. Aucune attente de test ou source historique n'est retirée pour obtenir un succès.

## Baseline comportementale ciblée

Avant toute modification du développeur, le parent a exécuté **uniquement test/client.test.ts** sur le seed exact : **10 PASS, 9 FAIL, 41 assertions, 19 tests**. Code de sortie 1, 487 ms rapportés par Bun et 528 ms pour le processus. Les 356 pins du seed restent identiques après cette exécution.

Les neuf échecs concernent quatre catégories d'erreurs publiques, quatre snapshots ambigus ou en pause, et un receipt qui ne correspond pas à l'exécution attendue. Ce sont des défauts préexistants reproduits sur la base retenue, pas des régressions introduites par le nouveau writer. Ils sont dans le périmètre de correction compatible du plan ; aucun oracle affaibli ou test supprimé.

Cette sélection utilise un transport simulé et des bases SQLite neuves dans un répertoire temporaire possédé ; aucun appel au handler natif, thread ou campagne scientifique. Les tests existants ne nettoient que leurs propres répertoires créés. Le plafond explicite demeure quinze secondes par test.

## Répartition de réalisation et vérification

Le développeur écrit code et tests dans son worktree uniquement. Il ne dispose pas des outils d'exécution Context Mode : il ne contournera pas cette limite avec un shell volumineux. Le parent prend en charge les tests et typecheck, après réception des changements et qualification de leur sélection. Ce partage ne remplace pas la revue indépendante finale.

Le parent prépare une copie locale des dépendances déjà installées et versionnées, sans réseau, installation, script de lifecycle, configuration globale ou service. Inventaire préalable : 3493 fichiers, 88061705 octets, aucun lien ; client 2.0.26, TypeScript 5.9.3, types Bun 1.4.0. La copie et son readback auront un manifeste distinct ; cet inventaire seul ne prouve pas encore leur transfert ni leur compatibilité native.

Mise à jour : copie locale effectuée, 3493 fichiers relus dans source et destination sans différence. Reçu : `../evidence/writer-dependencies.json`, SHA256 `31c9c0d29a64005886c7a703f970724f668465873238b38ec292aafbb8284710`. Aucune commande d'installation ou de produit n'a été exécutée pour cette copie. Le développeur en est informé ; la compatibilité native du handler n'en découle pas.

Le développeur peut ajuster les résolutions de chemins et configurations dans une nouvelle révision manifestée, **sans retirer des fichiers du typecheck pour le faire passer**. Si une petite extension du schéma du journal client est nécessaire à la jointure atomique, elle reste dans le journal existant, compatible et sans nouvelle autorité ou nouveau store.

Précondition locale corrigée : les copies source héritaient effectivement de l'attribut Windows ReadOnly. Le parent l'a confirmé, puis levé uniquement sur les seize fichiers du plan nécessitant une édition. Les empreintes avant/après restent identiques ; aucun original, ACL, permission native ou réglage global modifié. Reçu : `../evidence/writer-editable-copy-metadata.json`. Cela corrige une propriété des copies possédées, pas un refus d'accès au dépôt ou une permission de rôle. Les autres fichiers gelés ne sont pas rendus modifiables en bloc.

Le développeur a ensuite signalé un patch partiel : nouveau module et test borné créés, puis EPERM sur une source seedée, sans poursuite ni test. Cette notification correspond au ReadOnly déjà corrigé ; une nouvelle observation parent confirme prepare/engine/client modifiables. Le reçu a été livré dans son propre contexte avec les six documents acceptés D1–D6, sans nouvelle étude ni modification documentaire. Il est autorisé à reprendre seulement l'édition bloquée puis son plan. Le rattachement natif reste le worktree correct ; Model.Ref relu après transition d'implémentation : même OpenAI Sol, variante high autorisée (au lieu de xhigh en planification). Aucun nouveau worker ni override.

## Preuves et limites

- Captures et commande : `../evidence/client-baseline.execution.json`, `client-baseline.stdout.log`, `client-baseline.stderr.log` ; captures PowerShell, pas flux enfant bruts.
- Commande : `bun --no-env-file --config=./bunfig.integration.toml test ./test/client.test.ts --timeout 15000 --max-concurrency=1` depuis le worktree seedé.
- Répertoire temporaire possédé : `C:/Users/djden/AppData/Local/Temp/opencode/rms-static-r1-client-baseline`.
- Sélection/imports vérifiés : test/client.test.ts:1–106, src/client.ts, store.ts:1–20 ; le SDK n'est chargé dynamiquement que par connectPublic, non appelé dans cette sélection.
- Le test protocol n'a pas été lancé : son driver écrit un registre propre au worktree, à qualifier avant exécution. La suite globale reste interdite. Typecheck reste non exécuté à cette étape.
- Les 55 tests primitifs précédents gardent leur portée exacte ; ils ne compensent pas les neuf échecs client.

Localisation : fichiers client et contrôles existants. Impact : plan d'implémentation autorisé, baseline et préparation locale des dépendances. Limites : défauts pas encore corrigés, preuve native et acceptation RMS toujours non acquises. Aucun nouveau GO utilisateur demandé.
