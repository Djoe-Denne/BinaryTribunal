# Pool continu — avenant utilisateur 2026-10-10

## Autorité, capacité, activation

Demande utilisateur : 12 agents TOTAL, fallback d'un agent Flash échoué vers Sol
high, prochain travail dès libération d'un slot. Supersède les anciennes limites
3/5, batch5 et l'arrêt global automatique sur tout échec Flash/ownership.
**Slot 0 = superviseur ; slots 1–11 = workers.** Le chat racine externe ne compte
pas comme un autre agent du pool. Onze est un plafond, pas une obligation de
fabriquer onze tâches. Les sessions terminées historiques ne consomment aucun slot.

File réelle : `CAMPAIGN_POOL_2026-10-10.json`. Setup foreground seulement :
`activation=awaiting_parent_long_GO`, slots workers BLOCKED, aucun appel worker.
Le parent lie son superviseur/session et ouvre la gate avant tout dispatch.

La capacité est une **politique contrôlée par le superviseur et le validateur**,
pas une limite runtime OpenCode démontrée. Guides V2 consultés :
`https://opencode.ai/v2/docs/config`, `/agents`, `/api` et `/cli` (2026-10-10).
Aucun champ de concurrence étayé dans ces guides ; aucun `max_agents`,
`max_parallel` ou autre champ inventé ajouté. `opencode.jsonc` laissé byte-exact,
y compris `experimental.subagent_depth=2`, defaults et MCP. API `config.get`
avec `location[directory]` confirme la config locale ; `agent.list` confirme le
superviseur autorisé à déléguer et les feuilles `subagent:* deny`.
La profondeur n'est pas la largeur. Ces lectures ne prouvent pas onze appels
simultanés ni une nouvelle disponibilité provider/native ; aucun test de charge.

## Attribution continue et isolation

Sur finale/échec reçu : consigner le résultat réel et les digests, libérer le
slot, recalculer READY, affecter immédiatement la prochaine tâche admissible,
sans attendre un batch. Ordre déterministe : priorité puis ID de tâche. Vérifier
gates, dépendances acceptées, manifests et absence de conflit d'écriture avant
l'affectation. `completed` veut dire résultat accepté, pas simple callback.
Un résultat doit être contrôlé avant de débloquer ses descendants.

Une tâche worker : un EA, un rôle, un writer, sorties disjointes. Un pipeline EA
reste sériel pack/C-A → C-review → A → V → propagation → gate → IDB → commit.
Après gel accepté, les deux contrôles C-B/sémB préassignés peuvent être parallèles
car inputs/sorties disjoints ; R attend les deux. J3 gate/push/commit précède toute
promotion pilote, sans bloquer les analyses indépendantes.

Slots persistants, contextes renouvelés : sessions neuves pour A, V, B, C-B,
reviews C indépendantes et tout fallback. Ne jamais fusionner A/V. Réutiliser
une session non aveugle uniquement si rôle compatible, absence d'anciens hints
pertinents démontrée et budget contexte suffisant ; sinon nouvelle session dans
le même slot. Les nouvelles affectations sont enregistrées avec sessionID réel,
rôle/EA, modèle explicite et digest d'inputs **avant** usage de leurs résultats.
Jamais reparentAPI, reprise étrangère, duplication d'un worker actif connu ou
régénération des résultats déjà acceptés pour occuper la capacité.

Inputs aveugles = manifest numérique/versionné permis seulement, ni catalogue,
nom métier, commentaire IDA, conclusion review, wiki ou historique d'autres rôles.
Les métadonnées administratives du pool/registre ne sont pas un pack worker.
Les digests null des tâches dépendantes ne sont pas des hashes fictifs : créer
et geler le manifest réel avant dispatch. Révisions de sortie neuves pour P1R/P3
de remplacement ; préserver les drafts et versions gelées.

## Modèles, échec et fallback

Override explicite à **chaque** appel :
- pack/C primaire, réparation neutre et propagation mécanique :
  `zai-coding-plan/glm-5.3-flash#high` ;
- C-review, sémantique A/V/B/R, C-B de contrôle :
  `openai/gpt-6.1-sol#high`.

Flash provider/transport/quota/fonds/refus de tâche ou sortie incomplète
inutilisable : conserver partiels/erreur exacte/usage observé, marquer failed,
libérer le slot, créer **une** tentative Sol high fraîche, même rôle et inputs
gelés. Enregistrer le lien failed→fallback ; ne pas attribuer à Flash le résultat
Sol ni transformer son indisponibilité en résultat analytique. Maximum une
tentative Sol de remplacement par tâche primaire Flash ; pas de boucle de retries.
Une erreur de syntaxe/arguments du script se corrige, ce n'est pas une panne MCP.
Une review CORRIGE de C ne déclenche pas le fallback infra : patch ciblé puis
re-review indépendante du fichier réel ; escalade uniquement selon le protocole.

Échec d'un rôle déjà Sol : préserver le partiel, bloquer ses descendants,
libérer le slot pour autre travail READY disjoint ; pas de provider alternatif.
Si Sol est globalement indisponible, IDA nécessaire est indisponible ou OOM
global critique : arrêt sûr/checkpoint, pas de boucle ni fallback solo.
Une ownership étrangère ne doit pas être retentée : remplacements frais possédés
maintenant autorisés, en utilisant les versions conservées, pas une fausse finale.

## Gates, queue initiale et vrais inconnus

État hérité `5b4d7b2` : pilote 0/6 clos, C re-review2/6, A/V1/6,
contrôles retournés1/3, adjudiqués0/3 ; J3 documentaire borné accepté mais
gate/push/commit pending. P1R/P3 anciens interrompus, pas de worker actif connu.
P1R a deux drafts réels non acceptés, JSON final absent. Nouveaux résultats R
ne remplacent pas ces drafts et ne valident pas rétroactivement leur claim B=0.

P2 C final accepté ne suffit pas à rendre son pack neutre exact : les commentaires
gelés de `neutral/asm.txt`/`frame_abi.txt` disent EAX[31:8]=idx et même
`(idx<<8)|b`, alors que AND EAX,0xFF laisse EAX[31:8]=0. **P2 A est bloqué**
jusqu'à création factuelle `neutral-v2` et gate parent ; conserver v1 byte-exact.
La correction ne doit pas changer les octets/opcodes ni régénérer le C accepté.

Six tâches worker initialement READY : P1R continuation fraîche, P2 neutral-v2,
packs/C-A P3–P6. **P3 réserve le remplacement Sol high** de son ancien Flash
interrompu sans pack/C utilisable ; aucune tentative Sol n'est encore lancée.
Le rôle/EA/hash source numérique sont conservés, le digest du prompt historique
complet est inconnu et aucune équivalence de contexte entière n'est prétendue.
J3 gate et audit de lecture sémB P1 sont READY superviseur.
Les slots non utilisés ne tournent pas à vide. États READY restent soumis au GO
et aux guards natif/manifest ; ne pas appeler un worker avant ces guards.

Dual-gen contrôle uniquement P1/P3/P5 ; one-Flash-C + review Sol exhaustive
ailleurs. Sémantique 1+V, B aveugle/R si désaccord persistant/invariant non fermé.
Pas seuil >200 seul dans cette cohorte ; >600 matrice régions/couverture totale.
Le scheduler insère les nœuds d'escalade réels et re-bloque descendants dès
ESCALADE ; jamais marquer V ou R completed sur un verdict non résolu.

§5.6 et propagation exacte en ASM natif, ABI/cleanups différés, AL/AX/EAX,
strides, signedness, shifts&31, adresse vs contenu, ordre/alias/reloads,
CFG/chunks/callees/callers/deux ancres métier : parent seul. Append multiligne
daté 2026-10-10 sans écraser l'histoire, save=true, readback exact/digest/tag
unique avant commit par fonction. Pas rename/SetType/octet/debugger/runtime.
Commits suivi séparés ; ni add., amend/reset/revert/no-verify/remote ni autres M.

Chaque événement queue porte timestamp UTC, task/EA/rôle, dépendances, état,
slot, sessionID, modèle et digest inputs. Null = inconnu, pas preuve de travail.
Usage observé production/contrôle/remplacement séparé, cumul API jamais sommé
deux fois. Premier bilan après les six traités : erreurs B nouvelles contre BOTH
gels C-review/V, R-only, incertitudes et coûts observés ; pas inférence causale
modèle ni indépendance statistique (couplage P3→P5 connu). Ne pas étendre
l'adaptatif hors six sans autorisation ; futur canon reste inchangé.

## Validation setup

`python tools/validate_campaign_pool.py --self-test` vérifie config/policy,
plafond 1+11, graphes/gates/isolation/overrides/fallback borné, digests connus,
gels P1, slots et absence de campagne lancée. Les essais sont copies en mémoire,
ne délèguent rien, ne modifient pas la queue ni l'IDB et ne programment rien.

## Receipt runtime Ensemble — 2026-10-10

La garde IDA actuelle a passé input/IDB/SHA, puis une équipe native a été créée
et six sessions fraîches demandées séquentiellement, sans worktree ni git worker.
Les six ont immédiatement `API outcome=failed`, aucun résultat/assistant ni
token observé. Les overrides demandés `provider/model#high` sont effectivement
stockés comme `model.id` contenant **littéralement `#high`**, `variant=default`.
C'est un échec vérifié du **contrat de représentation des modèles** ; le payload
d'erreur sous-jacent est inconnu. Ne pas inventer ModelNotFound, quota/fonds/OOM,
panne provider ou régression IDA. Pas d'exécution correcte high établie.

Le pool est `blocked_ensemble_model_reference`, six tâches failed et descendants
bloqués ; deux gates parent structurellement READY ne sont pas exécutées après
l'arrêt global. P3 remplacement Sol demandé/créé mais contrat modèle échoué,
pas un C primaire Sol réussi. Six demandes de shutdown non-forcé envoyées,
état API terminal failed/0 tokens confirmé ; confirmation de shutdown des membres
non reçue. Aucun merge/cleanup/purge, aucune nouvelle boucle de lancement ni
changement silencieux de modèle/harness ; les records de l'équipe sont conservés.

**Désormais vérifier le Model.Ref de la première session et de chaque dispatch
avant d'étendre le pool** : `providerID` exact, `id` sans `#high`, `variant=high`.
Le validateur rejette des slots running dont ce contrat n'est pas prouvé ; les
receipts failed restent des diagnostics, pas des travaux complétés. La correction
de l'interface Ensemble ou l'autorisation explicite d'un autre harness précède
toute reprise ; ne pas supprimer high pour contourner le problème. Les nouveaux
tests de référence sont offline, sans réparer le plugin/service/configuration.

## Migration native autorisée et canaries — 2026-10-10T09:05:13.104Z

L'utilisateur a explicitement répondu « oui » au retour au harness **natif
OpenCode**, avec 12 total, fallback Flash→Sol et vérification effective high.
Superviseur frais unique slot0 : `ses_edaf43c0cffeAOikFDjgKGcu9H`, remplace
`ses_edb526e53ffe58rQKvbPeclTqv` terminé. `functions.subagent` seulement ;
aucun team_create/team_spawn nouveau, aucune reprise/reparent d'enfants étrangers.

Diagnostic unique de quiescence : team_status indique que la nouvelle session
n'est pas dans une équipe ; API native des six IDs historiques confirme
`outcome=failed`, `time.idle` présent et tous champs tokens=0, timestamps
inchangés depuis le checkpoint. Aucun calculleur/writer actif observé : slots
libres sans attendre une seconde confirmation de shutdown terminal. Records,
IDs, messages, digests et drafts sont conservés ; ni force/purge/merge/DB reset.

Guide API V2 consulté et `/openapi.json` live via le CLI authentifié fourni avec
Desktop (`resources/opencode-cli.exe`) : `Model.Ref` a `providerID`, `id`,
`variant`. GET `/api/session/{sessionID}` retourne ces champs dans `data.model` ;
GET `/api/session/{sessionID}/message` corrobore modèle/message/tokens/finale.
Le superviseur est réellement `{providerID:openai,id:gpt-6.1-sol,variant:high}`.
Deux appels natifs foreground bornés, lecture seule sans outils/fichiers/git/IDA :
- Flash `ses_edaf2a405ffeHrArD1aj2xiDFY` : ID `glm-5.3-flash`, provider
  `zai-coding-plan`, variant **high**, outcome succeeded, finale
  `NATIVE_HIGH_CANARY_OK`, tokens input17060/output8/reasoning66/cache0.
- Sol `ses_edaf25b79ffecfI6g5pN2KtDPw` : ID `gpt-6.1-sol`, provider `openai`,
  variant **high**, outcome succeeded, même finale, input16165/output10/
  reasoning0/cache0. Ce probe teste le transport Sol, **pas un fallback déclenché**.
Les deux parentID sont le nouveau superviseur ; snapshots de fichiers vides.
La chaîne d'override `#high` est donc décodée par ce harness, pas prise seule pour
preuve. Lire le Model.Ref de **chaque** future session avant toute extension ;
mismatch → checkpoint bloquant, sans retry provider ni variante default.

Adjudication administrative du budget : les six échecs Ensemble sont des
**demandes invalides de harness avant exécution high**, pas des échecs analytiques
ni des pannes Flash/Sol établies. Leur historique failed reste immuable dans les
receipts/events. Les six tâches sont requeue READY dans le nouveau transport,
sans descendants acceptés. Pour P3, la demande Sol invalide est conservée avec
`original_kind=sol_fallback`, classée `harness_contract_failure` et exclue du
budget d'exécution ; **une seule exécution Sol high fraîche reste réservée** en
remplacement du Flash historique interrompu sans pack. Cette décision est propre
à la migration autorisée, pas un droit général de répéter un rôle Sol échoué.
Inputs numériques identiques ; digest du prompt historique complet toujours
inconnu, nouvelle révision possédée et manifest gelé avant tout travail.

Garde IDA native actuelle lecture seule réussie : input Steam FF8_EN.exe,
IDB `D:/Modding/ff8/retro-exe/FF8_EN.exe - 9.3.i64`, PE SHA256
`064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`.
Pas de pack, §5.6, promotion, écriture/save IDB ou action d'alimentation.
Queue **awaiting_background_GO**, `dispatch_GO=false`, six workers READY,
deux tâches parent READY, zéro worker occupé après les deux canaries terminés.
L'ancien GO long ne déclenche pas cette phase : attendre CONTINUATION background
explicite. Plafond 1+11, aveuglement frais, gates J3/P2, gels 8/8 P1, fractions
pilote et limite adaptative six EA inchangés. Config/profiles/defaults/MCP intacts.
