# Admission des modèles — correctif activé le 2026-10-13

## Incident et autorisation

La session de développement graph/scheduler a épuisé le quota OpenCode Go de
cinq heures (`429 Go usage limit exceeded`). Son lead avait choisi explicitement
`opencode-go/grok-4.7#high` pour L1/L3/L5/L6 ; ces références sont confirmées dans
les messages natifs. Le routage par préférences était court-circuité par les
overrides explicites et ne constituait donc pas une autorisation obligatoire.
Ces preuves ne chiffrent pas une facture ni un solde financier.

L'utilisateur a autorisé le correctif puis choisi **« Activer sans reprise »** :
nouvelle version locale du plugin, pause de requêtes pour cette seule campagne,
rechargement, préférences conservées. Aucun lancement scientifique ou appel
provider de test n'était autorisé. Pas de commit/push dans cette opération.

## Correctif et vérification

Source isolée :
`C:/Users/djden/AppData/Local/Temp/opencode/ensemble-model-admission-20261013`.
Elle reconstruit la version de production depuis HEAD `42a8a2b...` et le snapshot
du déploiement `20261012-ensemble-project-scope-52e26eee373c`, pas depuis les
évolutions ultérieures non déployées du canary/bulletin. Les 75 blocs source du
bundle initial sont identiques ; après normalisation des commentaires de chemins
de dépendances liés à la junction, SHA256 identique au plugin précédent.

Avec une sélection opérateur configurée :
- modèle **et variante exacts** doivent être présents et disponibles ;
- disabled/poids zéro restent interdits, en mode legacy comme balanced ;
- overrides/spawn/model updates/fallbacks/reprises ne réautorisent pas un modèle ;
- une politique de mission ne réactive pas un modèle désactivé globalement ;
- sélection explicitement vide/illisible : fail-closed ; installation réellement
  sans sélection opérateur : compatibilité legacy, sans prétention de whitelist ;
- normalisation de `provider/model#variant` en Model.Ref native séparée ;
- précontrôles avant allocation, changement de modèle/agent, wake, compaction et
  helpers ; guards natifs `model.request`, `http.request`, handshake/send WS ;
- relecture des préférences de la mission propriétaire, y compris pour ses
  worktrees, et révocation effective aux requêtes suivantes.

La protection ne rembourse pas une requête déjà envoyée et n'est pas un plafond
monétaire pour les modèles volontairement autorisés. Le budget dur est distinct.

**Gates hors ligne : 1234 tests PASS, 0 FAIL ; typecheck, lint, build exit 0.**
Les RED du contournement, migrations des assertions et les gates intermédiaires
restent dans `.tmp/model-admission-20261013/`. Aucun sous-agent LLM créé pour ce
correctif ; sessions, transports et providers simulés dans les tests.

## Déploiement et pause

Plugin actif :
`C:/Users/djden/.config/opencode/local-plugins/ensemble/20261013-model-admission-926eca256605`.
Bundle SHA256 :
`926eca256605a33377aaa07146856a359b59afa4041fba10cbbbd6a6add99868`.

Seuls le pointeur du plugin et `modelRouting.pausedTeams` ont été modifiés dans
les configurations globales autorisées. Tous les modèles, coûts, préférences et
autres champs de routage ont été conservés et relus. Ancienne version intacte ;
backups de configuration et receipt dans `.tmp/model-admission-20261013/deployment/`.

Équipe en pause de requêtes : `team_mv6tmopg_0000_4urn3c` (`re-graph-scheduler`).
La pause bloque lead/membres/helpers et retries, même sur un modèle autorisé.
Elle conserve tâches, sorties, worktrees et journaux ; le statut métier peut
encore être `active` et une tâche `in_progress`, sans autoriser de génération.
Retirer cette entrée est une **décision explicite de reprise**, pas une étape du
correctif. Ne pas revenir à l'ancien plugin en supposant qu'il respecte ce champ.

Rechargement par API publique `location.reload`, sans redémarrage du service.
Cette API recharge toutes les locations ; ses effets ont été examinés : aucune
permission/form en attente dans la session native active, campagne sans worker
actif. Les autres sessions n'ont pas été arrêtées.

RPC readonly `ensemble.modelAuthorizationStatus` relu : `ready:true`,
`configured:true`, 27 paires disponibles et pause cible présente, dans la racine
FF8 ainsi que les **vraies locations natives** de `l5-shard-fix` et `l7-qa-r3`.
Après rechargement : **0 worker actif, 0 starting**, tâches conservées. Vérification
de chargement/readback, pas canary d'inférence payant.

## Estimation de progression, pas certification finale

Au dernier état public : L1–L6 marqués terminés ; L7 QA en cours, L8 intégration
en attente, L9 review et L10 validation finale bloqués par les prérequis. Des
correctifs L4/L5 restent en cours ; 12 tâches terminées sur 19, dont sous-lots de
review/fix. Ces tailles ne sont pas égales : estimation pondérée **55–60 %**,
sans assimiler le nombre de tâches à une mesure exacte du travail validé.

Le correctif de politique est activé. La campagne **n'a pas été reprise**.

## Suivi chronologique — retrait de pause et défaut de cache (20:29 UTC)

Après le GO utilisateur de retrait de pause, le fichier opérateur avait été
modifié à 20:09:10 UTC et les guards/RPC lisaient bien `pausedTeams: []`.
Cependant `ToolDeps.config` restait le snapshot du chargement : le `team_spawn`
du lead à 20:14:31 UTC refusait encore la mission comme pausée. La confirmation
initiale de reprise était donc insuffisante pour les outils d'admission.

Correction : propriété `modelRouting` live partagée par les outils d'admission,
préférences, pause et révocation relues à l'utilisation ; une sélection déjà
établie ne devient pas permissive si son fichier disparaît. Le RPC expose aussi
`admissionPausedTeams` pour comparer la vue résidente à la vue des transports.

Reproduction RED : 3 refus/comportements erronés sur le cache. GREEN : 4 tests,
dont un vrai `setupEnsemble` avec outils SDK enregistrés et sessions simulées,
pause retirée puis rétablie sans rechargement. Gates complets : **1238 PASS**,
typecheck/lint/build exit 0, aucun test d'inférence payant.

Version active : `20261013-model-admission-d398ac24bf2e`, bundle SHA256
`d398ac24bf2ec68f4f899a01f092d548644367a68c4bb5b5af98cf21bf21d597`.
Pause temporaire pendant le rechargement, puis restauration de l'état non pausé
déjà demandé par l'utilisateur. Les deux vues ont ensuite été relues **sans
second rechargement** : `pausedTeams: []`, `admissionPausedTeams: []`, guards ready.
Préférences identiques avant/après ; aucun worker lancé. La campagne conserve
ses six tâches READY/pending, sans relance forcée du lead interrompu.

Preuves : `.tmp/model-admission-20261013/resume-cache-{RED,GREEN}.log`,
`resume-cache-gates.json` et `resume-cache-deployment/` (receipts/readbacks).
Le prochain message utilisateur peut poursuivre le lead ; les refus des modèles
non autorisés restent actifs et ne doivent pas être contournés.
