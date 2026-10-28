# Récupération des workers interrompus — 2026-10-14

## Incident et cause

Mission concernée : `re-graph-scheduler`, équipe `team_mv6tmopg_0000_4urn3c`.
Le service passe du run `52929bb1` à `f9c3aacb` vers 11:28 UTC. L2 Local QA,
L4 Last Astra et L5 Relation Review ne reprennent pas leurs drains natifs, mais
restent `busy/running` dans Ensemble. L3 Num Review a terminé à 11:26 avec un
rapport ACCEPTABLE borné, mais reste `shutdown_requested` après 11:38.
L'UI expose les états persistés ; quatre slots fantômes font croire à quatre
workers actifs. L6 RVA Review, plus récent, a rendu son rapport et s'est arrêté
normalement : il ne doit pas être réveillé pour compenser cet incident.

Trois défauts génériques :
1. `createV2Client.session.status` suppose `ctx.session.active()`, alors que le
   sous-ensemble officiel du contexte plugin V2 ne l'expose pas. L'API HTTP
   publique l'expose. Les mocks incluaient artificiellement cette méthode.
2. La récupération au démarrage ne couvre que les admissions `starting` mortes,
   pas les drains `running` ni les arrêts gracieux interrompus.
3. Le flag graceful-stop était écrit après l'enqueue de son message ; un idle
   rapide pouvait être suivi d'un flag `shutdown_requested` désormais périmé.

## Correctifs et sûreté

- Lecture d'activité par capacité native si disponible ; sinon pont HTTP public
  authentifié existant, vérifié contre une session lead de la mission propriétaire
  (ID/projet/date de création/directory). Pas de base OpenCode/Ensemble lue depuis
  le harnais externe ; pas de faux `{}` sur erreur de transport/capacité/auth.
- Réconciliation au démarrage des états owned à partir d'une observation native
  réussie et bornée ; healthy/retry et admissions starting possédées préservées.
  Fence session/status/execution/time/token/spawn, application transactionnelle.
- Inactive running → ready/idle, claims in_progress conservés ; stop confirmé →
  shutdown/idle, release des seuls claims inachevés. Inactivité ≠ résultat accepté.
- Flag graceful-stop persisté avant livraison ; rejet de wake entraîne une
  réobservation native, pas une libération aveugle.
- RPC readonly `ensemble.memberRecoveryStatus` : résultat de réconciliation et
  état des membres/leases, pour ne pas confondre mocks, compteur et activité native.
- Aucune suppression/reset d'historique, worktree, branche, fichier ou evidence.
  Aucun modèle/variante/provider modifié ; garde-fou d'autorisation conservé.

Source isolée :
`C:/Users/djden/AppData/Local/Temp/opencode/ensemble-model-admission-20261013`.
Version locale active :
`C:/Users/djden/.config/opencode/local-plugins/ensemble/20261014-member-recovery-71d3bcbee00f`.
SHA256 du bundle :
`71d3bcbee00f2b5d36554e5acc58ce4bae4f1afee5d16cc3b44bfa2420d1bbd4`.

## Validation et activation

Gates finales : **1251 tests PASS, 0 FAIL**, typecheck/lint/build exit 0. RED/GREEN
de la réconciliation, de la course d'arrêt et de la capacité réelle absente sont
conservés. Un run complet intermédiaire a échoué sur un serveur de test dashboard
ne pouvant binder son port aléatoire ; test isolé puis suite complète passent,
sans modification ni suppression de l'assertion.

Le premier readback natif a refusé la clôture : l'adaptateur de statut appelait
encore la capacité absente. Cela a déclenché le correctif du pont, pas une
promotion basée sur le PASS des mocks. Nouvelle version validée et chargée
automatiquement par OpenCode. La commande shell de reload explicite a ensuite
été permission-rejected ; elle n'a pas été rejouée via un autre outil.

Readback public à **15:16:54 UTC** : guards ready/configured, `checked=4`,
`unavailable=false`, `recovered=4` ; trois continuations ready/idle et L3 arrêté.
Capacité : 0 running, 0 starting, 5 disponibles. Pause temporaire retirée après
ce constat, vues admission/transport vérifiées ; préférences identiques au backup.

À **15:18:36 UTC**, GO de reprise livré au **lead existant**, session
`ses_eca40a8e2ffeanEKTBLiGjDNw8`, message `msg_13afe73df001lppgUG2M4ADzPu`.
Référence native conservée : `openai/gpt-6.1-sol`, variante `xhigh`. Consignes :
reprendre L2/L4/L5 dans leurs mêmes sessions/roles/gels/modèles, ne pas réveiller
les reviewers terminés, respecter les cinq workers et gates/dépendances. Seul
le lead délègue ; aucun worker directement piloté depuis le chat de diagnostic.
Cette acknowledgement de livraison n'est pas une preuve que les workers ont déjà
repris ou que leurs lots sont acceptés.

Readback supplémentaire à **15:20:13 UTC** : superviseur natif actif et
`l4-last-astra` réellement actif dans sa session originale. Compteur cohérent :
1 running, 0 starting, 4 disponibles. Le lead a explicitement confirmé la reprise
des trois mêmes sessions ; L2/L5 pas encore observés actifs dans ce snapshot.

## Préservation et limites

Evidence locale : `.tmp/member-recovery-20261014/` (gates, backups, releases,
readbacks, reçus de reprise). Diffs et fichiers source non suivis des workers
sauvegardés dans `worker-preservation-safe/`, sans opérations Git mutantes.
Les reviewers partageant la racine, un premier backup trop large a tenté de
dupliquer des captures étrangères à leur périmètre et rencontré ENOSPC. Seules
les copies nouvelles de cette tentative ont été retirées (~4,59 Go), avec ~7,90 Go
libres ensuite ; les originaux n'ont pas été touchés. Backup corrigé : périmètre
source possédé, limites par fichier/total, gros artefacts conservés en place.

La pause de maintenance n'est pas une pause RE permanente. Pas de commit/push,
IDB, live FF8 ou canary d'inférence de test dans l'intervention. La reprise de
mission explicitement autorisée peut consommer les quotas des modèles déjà
sélectionnés ; elle reste distincte des tests offline et readbacks readonly.
