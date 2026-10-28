# État de contrôle — reprise après restart du 2026-10-13

## Essai 16 — PASS natif strict complet, vérifié par le parent

L'utilisateur a choisi Relancer après validation du dossier strict v3 sur les
entrées réelles R de l'essai 15. Nouvelle fixture isolée, modèle inchangé
`openai/gpt-6-astra#high`, `json-schema-strict`, max. 2 workers, budget coopératif
1 200 s. Gates : 219 tests FF8 PASS ; source Ensemble inchangée depuis ses
1 419 PASS et gates verts. Modèle/high réinventorié, 31 fichiers globaux intacts.

Préflight : `../evidence/native-canary-20261013-attempt16-preflight.json`.
Preuve : `../evidence/native-canary-20261013-attempt16.json`.
Revue finale : `../evidence/native-canary-20261013-attempt16-review.json`.
Readbacks indépendants : `../evidence/native-canary-20261013-attempt16-native-readback.json`
et `../evidence/native-canary-20261013-attempt16-publication-readback.json`.
Log : `.tmp/strict-output-20261013/native-canary-20261013-attempt16.log`.
Shell `sh_1350fb131001yn1yRzaa1V1S24` terminé, **exit 0 en 165 397 ms**.

**PASS confirmé**, après relecture indépendante par le parent :
- Cinq sessions fresh distinctes, sans fork, un seul message utilisateur chacune ;
  `Model.Ref={providerID:openai,id:gpt-6-astra,variant:high}` confirmé partout.
- 18 requêtes WebSocket avec schéma strict, cinq captures validées contre leurs
  schémas/hashes/références natives ; artifacts contrôleur relus octet par octet.
- Reprise après perte de réponse sans deuxième session ni retransmission ;
  sentinelle refusée, accès attendus attestés, aucune écriture worker.
- Dossiers v3 lisibles, certificats source/projection recalculés ; les deux
  propositions R sont reconstituées sans perte. R a rendu `certain` dans cette
  fixture synthétique uniquement.
- Une publication fixture et un readback, cible révision 1, vérifiés dans la
  base **fixture uniquement**, ouverte read-only et inchangée. La connaissance
  consolidée contient la conclusion validée, pas les textes privés A/B.
- Clôture `verified=true` : admissions en pause, ensemble exact des cinq couples
  exécution/session arrêté ; les cinq sessions natives sont terminales.
- Bundle isolé relu/hash conforme, 25 fichiers source conformes au préflight,
  31 fichiers globaux protégés inchangés. Copie datée synchronisée.

La mission de canary est terminée ; aucun nouvel essai à lancer. **Ce PASS ne
vaut ni publication IDA/IDB autonome ni validation réelle de FF8.** Le transport
HTTP n'a pas été exercé en natif ; le budget reste coopératif. Aucun commit/push
ni installation globale. Les sections ci-dessous conservent l'historique des
essais et leurs échecs, jamais réécrits comme des succès.

## Essai 15 — clôture prouvée ; R refusé avant admission

L'utilisateur a autorisé un nouvel essai après validation des dossiers stricts
v2, des mesures SHA-256 source/projection et du suivi d'identité après reprise.
Nouvelle fixture isolée, `openai/gpt-6-astra#high`, `json-schema-strict`, au plus
deux workers, budget coopératif 1 200 s. Préflight : 205 tests FF8 et 1 419 tests
Ensemble PASS ; gates verts, modèle/high réinventorié, 31 fichiers globaux
protégés inchangés. Aucun fallback ni installation globale.

Préflight : `../evidence/native-canary-20261013-attempt15-preflight.json`.
Preuve : `../evidence/native-canary-20261013-attempt15.json`.
Readback indépendant : `../evidence/native-canary-20261013-attempt15-native-readback.json`.
Revue parente : `../evidence/native-canary-20261013-attempt15-review.json`.
Rejeu offline du R exact : `../evidence/native-canary-20261013-attempt15-offline-R-replay.json`.
Log : `.tmp/strict-output-20261013/native-canary-20261013-attempt15.log`.
Shell `sh_134fe8913001NpUOJWnHNUoNat` terminé, exit 1 après **91 792 ms**.
Explore/evaluate/A/B ont terminé : quatre sessions distinctes, 13 témoins stricts
WebSocket, captures revalidées, dossiers lisibles et certificats SHA-256 relus.
Reprise après perte et sentinelle refusée confirmées. La clôture automatique est
désormais **verified=true**, ensemble exact des quatre identités revérifié ;
toutes les sessions natives sont terminales. **Zéro publication/readback fixture**.

R n'a jamais été alloué : la nouvelle garde a refusé une ligne du dossier à
2 323 caractères. Cause précise : `inputs.proposals[*].content` encodait encore
le JSON complet d'A/B dans une chaîne, malgré les fichiers projetés indentés.
Les instructions R ne dépassent pas 1 291 caractères par ligne sérialisée.
Trois tentatives locales bornées, aucun appel modèle R. Les tests précédents
ne couvraient pas la forme complète `FrozenProposal` du dossier R réel.

Correction test-first livrée : dossier strict v3, contenu gelé représenté par
`contentLines`/`contentEncoding=utf8-lines-lf`, métadonnées/document et hashes
conservés ; manifeste interne et anciennes fixtures inchangés. Aucune troncature
ni assouplissement de limite. Le contenu est comparé à son document et aux hashes
du manifeste/source/projection avant soumission.

Vérification parente sur **les entrées R réelles de l'essai 15**, sans appel natif :
dossier de 35 736 octets / 678 lignes, ligne maximale **1 288 caractères**,
deux auteurs restitués sans perte, trois fichiers certifiés, replay identique.
Sources originales inchangées. Régressions autonomes : RED 14 échecs puis GREEN.
Gates complets FF8 : **219 PASS**, typecheck/build exit 0 ; source Ensemble
inchangée depuis ses **1 419 PASS**. Les 31 fichiers globaux protégés sont intacts.
**Aucun essai supplémentaire autorisé automatiquement.**

## Essai 14 — sortie stricte prouvée ; canary complet bloqué

Relance explicitement choisie par l'utilisateur après les corrections RPC et SDK.
Nouvelle fixture, `openai/gpt-6-astra#high`, `json-schema-strict`, max. 2 workers,
budget coopératif 1 200 s. Gates : 187 tests FF8 et 1 419 tests Ensemble PASS ;
typecheck/build/lint/diff-check verts. Aucune modification globale, pas de fallback.

Préflight : `../evidence/native-canary-20261013-attempt14-preflight.json`.
Preuve : `../evidence/native-canary-20261013-attempt14.json`.
Vérification native parente : `../evidence/native-canary-20261013-attempt14-native-readback.json`.
Revue parente : `../evidence/native-canary-20261013-attempt14-review.json`.
Log : `.tmp/strict-output-20261013/native-canary-20261013-attempt14.log`.
Shell `sh_134e19f99001AZQM9ty1sgHqy5` terminé, exit 1 après **140 949 ms**.

**Contrat de sortie stricte vérifié** : cinq workers distincts (explore/evaluate/
A/B/R), un seul message utilisateur chacun, Model.Ref exact OpenAI/Astra/high,
18 requêtes WebSocket contraintes, cinq réponses finales capturées et revalidées
indépendamment (schémas, hashes et références natives). `accessVerified=true`
partout ; sentinelle refusée ; perte de réponse et reprise prouvées. Les cinq
sessions natives sont `succeeded` au readback public. Cela ne vaut pas PASS du
canary complet : **R a légitimement choisi blocked**, zéro publication/readback.

Deux entrées manquaient à R : dossier mono-ligne tronqué par le read natif à
2 000 caractères et attestation explicite des hashes calculés par le contrôleur.
Mesure sur le dossier gelé R : 23 717 caractères sur une ligne ; même une simple
indentation laisserait la string `instructions` à 2 153 caractères sur sa ligne.
La correction est livrée : dossiers strict v2 et résultats JSON triés/indentés,
instructions lossless en tableau, mesures source/projection effectivement
calculées et relues contre les hashes attendus. Toute ligne physique de plus de
2 000 caractères est refusée explicitement, jamais tronquée. Le mode legacy
reste inchangé ; les anciennes fixtures et le résultat R ne sont pas modifiés,
aucun `certain` ou faux contrôle IDA n'est forcé.

Le reçu automatique de clôture était négatif : l'observateur des identités avait
été perdu avec le wrapper de panne lors de la reprise. Les cinq exécutions sont
pourtant `stopped` et les cinq sessions `succeeded`, vérifiés séparément. Correctif
test-first : observer sous le wrapper jetable, également utilisé après reprise
(11 tests canary ciblés PASS). Le reçu historique n'est pas réécrit.
Gates après correction : **205 tests FF8 PASS**, typecheck/build exit 0.
Ensemble reste à **1 419 PASS**, typecheck/build/lint/diff-check exit 0.
Les 31 fichiers globaux protégés sont inchangés (hashes relus). Les correctifs
de dossier et de clôture n'ont pas encore été validés dans un nouveau canary.
**Aucun essai supplémentaire lancé ni autorisé automatiquement.**

## Essai 13 — refus de profil avant admission ; correctif SDK validé offline

L'utilisateur a choisi **Relancer** après la revue de l'essai 12. Nouveau canary
isolé, `openai/gpt-6-astra#high`, `json-schema-strict`, correctif RPC inclus,
deux workers au plus, budget coopératif 1 200 s. Pas de fallback ni de relance
supplémentaire automatique. Aucun changement global, run01 reste arrêté.

Préflight : `../evidence/native-canary-20261013-attempt13-preflight.json`.
Preuve : `../evidence/native-canary-20261013-attempt13.json`.
Readback public : `../evidence/native-canary-20261013-attempt13-native-readback.json`.
Revue parente : `../evidence/native-canary-20261013-attempt13-review.json`.
Log : `.tmp/strict-output-20261013/native-canary-20261013-attempt13.log`.
Shell `sh_134d5a1a4001r87bHQd0yAzU2O` terminé, exit 1 après 1 322 ms :
`permission: strict profile readback mismatch`, non récupérable, un seul submit.
La correction RPC de l'essai 12 a passé sa frontière ; le nouveau blocage est
dans l'adaptateur du profil : `ctx.agent.get` renvoie **{location,data}**, alors
que le contrôle strict attend le profil brut et son `id`.

Signature SDK `AgentGetOutput` et API réelle concordent : les **cinq** profils
ont le bon `data.id` et la bonne `location.directory`. Le callback par défaut
doit vérifier ces champs puis extraire `data`, sans assouplir l'admission.
Les anciens mocks de profil brut avaient masqué cette erreur de frontière.
Correctif de frontière livré dans `src/v2-setup.ts`, avec un test utilisant
le chemin SDK par défaut et la vraie enveloppe de réponse. Forme/profil/répertoire
incorrects restent refusés ; aucun contournement des contrôles d'admission.
RED : 14 échecs attendus ; suite complète après correction : **1 419 PASS**,
typecheck/build/lint/diff-check exit 0. Les 13 warnings/12 infos de lint restent
préexistants. Les 31 fichiers globaux protégés sont toujours inchangés.
Aucun retest natif post-correctif ni nouveau canary autorisé automatiquement.

**Zéro worker, aucune génération modèle, zéro publication/readback fixture**.
Seul le lead inerte existe (contexte public relu : 0 message). Arrêt du pont
attesté : admissions en pause, zéro exécution. La route stricte provider reste
**non vérifiée en natif**, aucun PASS présumé.

## Implémentation stricte — essai 12 bloqué avant admission, correctif offline validé

L'utilisateur a autorisé l'implémentation puis le choix d'une route compatible
parmi ZAI, OpenCode Go et OpenAI. Route retenue et annoncée :
`openai/gpt-6-astra#high`, présente dans l'inventaire natif public avec la variante
`high`, driver `@opencode/ai/providers/openai` et endpoint existant
`https://chatgpt.com/backend-api/codex`. La page officielle du modèle annonce
« Structured outputs — Supported » ; la liaison réelle doit encore être
confirmée par le canary, pas déduite de cette déclaration.

Le pont générique a reçu le contrat strict, les hooks HTTP/WS et la capture
native. Les cinq payloads FF8 sont fermés, le header et la sérialisation
appartiennent au contrôleur, sans permission d'écriture worker. Tests FF8 :
**187 PASS**, typecheck/build exit 0. Compatibilité des cinq schémas avec le
validateur du pont et égalité des hashes canoniques vérifiées par le parent.
Ensemble avant l'essai : **1 400 PASS** ; après correctif RPC : **1 402 PASS**,
typecheck/build/lint/diff-check exit 0 ; le lint conserve
13 warnings et 12 infos préexistants. Témoins liés à leur exécution/session,
réponse settled et lectures attestées exigées, ancêtres junction refusés,
clôture comparée aux identités observées. Les sessions strictes n'injectent plus
le contexte team ni les nudges demandant un `team_message` supplémentaire.
Les 31 fichiers protégés de l'installation globale sont inchangés (hashes relus).

**Essai 12 : FAIL avant admission**, après 3 145 ms. Le runtime RPC refuse les
keywords `pattern` du contrat d'entrée (`output.name`, puis `schemaSha256`).
Trois tentatives bornées du même submit ; **zéro worker natif**, aucun appel
modèle atteint, aucun témoin de contrainte/capture, aucune publication. La seule
session native du répertoire est le lead inerte : contexte public relu, **0 message**.
La clôture publique confirme admissions en pause et zéro exécution restante.

Correctif test-first : retirer les regex du seul envelope RPC, conserver ses
bornes de longueur et les validations exactes nom/hash dans `parseExecutionOutput`
avant toute allocation. Le test de régression passe RED→GREEN ; la conversion
Effect générique du SDK ne reproduisait pas à elle seule la politique safe du
service, donc le test interdit explicitement les keywords observés incompatibles.
**Aucun retest natif post-correctif** : l'E2E strict reste non prouvé. Pas de
fallback modèle/JSON libre ni de nouvelle relance automatique.
Préflight : `../evidence/native-canary-20261013-attempt12-preflight.json`.
Preuve : `../evidence/native-canary-20261013-attempt12.json`.
Revue parente : `../evidence/native-canary-20261013-attempt12-review.json`.
Readback natif : `../evidence/native-canary-20261013-attempt12-native-readback.json`.
Log privé : `.tmp/strict-output-20261013/native-canary-20261013-attempt12.log`.
Contrôleur background `sh_134ca2e6e001HMd1Mh3tj1WuMK` terminé (exit 1).
Ne pas reprendre cette fixture ni run01. Un prochain essai exige un GO et une
nouvelle racine isolée, sur le modèle OpenAI annoncé sauf instruction contraire.

Contrat détaillé : [STRICT_OUTPUT.md](STRICT_OUTPUT.md). Les sections suivantes
conservent l'historique, notamment l'annulation de l'essai 11 ; elles ne valent
pas preuve d'exécution du nouveau contrat. Run01 reste arrêté, aucun commit/push,
restart global ou remplacement du plugin installé.

## Historique — prérequis corrigé : contrainte réelle, pas seulement catalogue

Après l'arrêt utilisateur, vérification documentaire sans appel d'inférence :
ZAI documente `response_format.type = json_object` ; sa spécification consultée
n'expose que `text | json_object`, pas `json_schema`/`strict`. Le flag
Models.dev `structured_output: true` **ne certifie donc pas un schéma strict**.
Pour `zai-coding-plan/glm-5.3-flash#high`, le strict reste **inconnu**, pas
déclaré impossible. Un objet JSON valide pourrait encore utiliser `proposals`.
Preuve sourcée/hashée : `../evidence/strict-output-readiness-20261013.json`.

Contrat à réaliser avant tout nouveau canary : conserver le modèle explicitement
choisi, admettre uniquement une route strict-schema établie, transmettre le schéma
effectivement à la génération et enregistrer ce fait ; refuser l'exécution si la
route est inconnue/incompatible, sans remplacement de modèle ni fallback JSON libre.
Le résultat doit être un payload structuré capturé, pas du texte arbitraire passé
à `write`; le contrôleur ajoute les identifiants immuables et sérialise après
validation. Les contrôles scientifiques et le readback restent indépendants.
À ce stade : **aucune intégration de contrainte stricte déclarée opérationnelle**,
aucun nouveau test natif autorisé. Les 27 entrées du catalogue sont éligibles au
filtre déclaratif général, **pas attestées pour ce contrat strict**.

Audit read-only du pont collecté puis vérifié sur les signatures locales :
`src/execution-rpc.ts:22,77-83` n'offre actuellement aucun contrat de sortie
schema-bound. Le SDK public V2 installé expose `session.http.request` avec un
`Request` remplaçable et l'identité session/agent/modèle/type de requête
(`node_modules/@opencode/plugin/dist/promise/session.d.ts:56-79`), pas un champ
magique `provider.request`. Une injection protocol-aware et une capture de la
réponse native sont donc envisageables sans modifier OpenCode ; ce n'est pas
une preuve d'intégration ni de support strict pour ZAI.

L'extension devra inclure le schéma/hash dans le contrat et l'idempotence,
rejeter les routes inconnues avant allocation, exclure requêtes auxiliaires et
sessions étrangères, et refuser un transport non couvert (dont WebSocket).
La réception d'un outcome/report « réussi » seul ne devra pas valoir résultat
strict accepté. En remplaçant l'écriture worker par une capture native, adapter
explicitement les accès attendus ; ne jamais fabriquer un témoin `edit`.
Cet audit n'a modifié ni code du pont ni runtime, et n'a lancé aucun test natif.

## Retest interrompu à la demande utilisateur — essai 11 annulé

L'utilisateur demande de relancer après la maintenance du catalogue. Un seul
nouveau canary fresh, borne monotone **1200 secondes**, modèle inchangé
`zai-coding-plan/glm-5.3-flash#high`, au plus deux workers natifs simultanés.
Même sentinelle refusée, coupure/reprise, cinq sessions distinctes et publication
fixture avec readback exigés. Aucun résultat PASS présumé ; aucune relance suivante
automatique. Aucun ancien essai ni run01 réarmé, aucun restart du service global.

Préflight : **147 tests FF8 PASS**, support déclaré positif pour la connexion
exacte, quatre sessions de l'essai 10 relues via l'API publique avec outcomes
terminaux (`succeeded`/`interrupted`). Cela ne vaut pas reçu global de clôture.
`../evidence/native-canary-20261013-attempt11-preflight.json` conserve ces preuves
et les hashes du canary/profils. Le filtrage du catalogue **n'active toujours pas
le décodage JSON contraint** ; cette limite a été annoncée avant le lancement.

L'utilisateur a retiré son accord en précisant qu'il croyait la génération déjà
contrainte. **Arrêt exécuté** : seul le processus contrôleur possédé (PID 3084)
a été terminé, puis la session `evaluate` active a reçu `session.interrupt`
avec `resume:false` et son outcome `interrupted` a été relu. La session
`explore` avait déjà terminé (`succeeded`). Deux sessions distinctes seulement,
aucun A/B/R admis. Base fixture relue readonly : **0 écriture, 0 readback**.
Les événements `session_created` rejoués ne sont pas des sessions supplémentaires.

Le snapshot scientifique brut reste conservé avec son ancien statut `running` ;
ce n'est pas l'état d'activité actuel. Aucun reçu global `stopMission` : le token
opérateur éphémère appartenait au contrôleur arrêté. Ne pas prétendre une clôture
du pont attestée ; arrêt processus et interruption native sont prouvés séparément.
**Aucune reprise ni nouvelle génération canary autorisée.** Il faut d'abord
brancher et vérifier la contrainte effective, distincte du flag du catalogue.

Preuve d'annulation : `../evidence/native-canary-20261013-attempt11.json`.
Reçu d'interruption : `../evidence/native-canary-20261013-attempt11-interrupt.json`.
Log privé : `.tmp/external-harness-20261012/native-canary-20261013-attempt11.log`.

## Catalogue : capacité structured output et sélection restreinte

Demande utilisateur suivante : modifier `ensemble-model-catalogue` pour rechercher
et conserver cette capacité, puis limiter les choix aux modèles qui la déclarent.
Skill source, copie de distribution et skill effectivement chargé synchronisés.
Le helper prépare un catalogue sourcé par provider/model exact : valeur booléenne
ou inconnue, URL, date UTC, SHA256 du dataset et journal des observations.
`strictVerification` reste **unverified** : une déclaration n'est pas une preuve
de décodage contraint. Scores, coûts, variantes, préférences et dates de refresh
complet conservés ; aucune activation nouvelle.

Catalogue global et journal appliqués puis relus : **27 couples modèle/variante
éligibles sur 52**, **1 non supporté déclaré**, **24 inconnus** exclus.
`requireStructuredOutput: true` est conservé par le chargeur et filtre le routeur
source, réserves/replis inclus. Le masquage `available: false` protège aussi le
routage des anciennes versions après rechargement. Les choix explicites doivent
suivre le même précontrôle dans le skill ; toutes les API de modèles épinglés
ne sont pas interceptées mécaniquement par ce réglage.

**1303 tests Ensemble**, typecheck/build/lint PASS (13 warnings/12 infos inchangés).
Le plugin exécutable global et `opencode.json` restent inchangés (hashes relus) :
seuls les cinq fichiers du skill installé et le catalogue/journal sont déployés.
Le plugin charge sa configuration à l'initialisation : **aucun restart ni
rechargement des instances déjà ouvertes n'a été effectué**.
Preuve : `../evidence/structured-output-catalogue-20261013.json`.

Cette maintenance ne branche pas encore un JSON Schema contraint dans le pont.
Cette maintenance seule n'a lancé aucun canary ; essai 10 toujours FAIL,
run01 toujours arrêté. Le retest ensuite autorisé est suivi séparément ci-dessus.

## Retest autorisé — essai 10 FAIL de schéma, budget 20 minutes

Après le diagnostic du délai global, demande utilisateur « ALORS Retest ».
Nouvelle fixture fresh isolée, modèle inchangé
`zai-coding-plan/glm-5.3-flash#high`, mêmes permissions/gates/preuves,
maximum deux workers natifs simultanés. Aucun ancien essai ou run01 repris.

Le canary accepte désormais un budget explicite en secondes : **1200** pour
cet essai, temps monotone global, jamais réinitialisé à la reprise du contrôleur.
Échéance contrôlée avant/après les ticks; un RPC en vol est attendu, sans
fermeture prématurée de sa base. Défaut 600 secondes, plafond 1200 secondes.
Deux régressions ajoutées test-first; **147 tests FF8**, typecheck/build PASS.
Le pont Ensemble n'a pas changé lors de ce retest.

Preuve : `../evidence/native-canary-20261013-attempt10.json`;
log privé : `.tmp/external-harness-20261012/native-canary-20261013-attempt10.log`.
Review parent : `../evidence/native-canary-20261013-attempt10-review.json`.

**FAIL après 408741 ms (~6 min 49), pas un timeout.** A a produit un JSON
syntaxiquement valide mais a nommé son tableau `proposals` au lieu de la clé
requise `propositions`. Rejet exact : `propositions must be an explicit array`.
La clé attendue était déjà indiquée dans le profil et les instructions canary;
il s'agit d'un non-respect du contrat de sortie par le modèle, pas d'un refus
de permissions. Artefact A conservé intact, sans réparation d'alias après coup.

Explore/evaluate/B résolus; A bloqué. Quatre sessions natives distinctes,
Model.Ref Flash high conformes, accessVerified true partout, quatre hashes
d'artefacts relus conformes. Reprise après perte de réponse et refus natif de
la sentinelle confirmés. R n'est pas admis après ce défaut bloquant; aucune
réconciliation. Base fixture lue readonly : **0 publication, 0 readback**.
L'état moteur `complete` signifie ici file épuisée avec candidat bloqué,
pas réussite scientifique; le canary retourne bien exit 1.

La borne de 20 minutes est en place, mais le cycle complet reste non démontré.
Pas de nouvel essai automatique, de contournement du validateur ou de changement
de modèle. Ce résultat ne justifie pas de nouvel allongement du délai.

## Relance explicitement demandée — essai 9 terminé FAIL

Après le FAIL borné de l'essai 8, l'utilisateur a demandé « relance ».
Un nouvel essai **fresh isolé** a été lancé, sans reprendre les anciennes fixtures
ni run01. Paramètres inchangés : `zai-coding-plan/glm-5.3-flash#high`,
600 ticks (~10 minutes hors durée des appels), maximum deux workers natifs
simultanés, même contrat de preuves et bundle générique régénéré isolément.
Preuve : `../evidence/native-canary-20261013-attempt9.json`;
log privé : `.tmp/external-harness-20261012/native-canary-20261013-attempt9.log`.

Résultat : **FAIL après 615300 ms**, même borne de 600 ticks atteinte.
Location `ff8-bridge-canary-tt4LpL`, cinq sessions natives distinctes et
Model.Ref Flash high confirmés. Explore/evaluate/A/B sont résolus avec
accessVerified true et quatre artefacts dont les SHA256 sont relus conformes.
La reprise après perte de réponse et le refus natif de la sentinelle sont
confirmés. R est encore `submitted/observed_running` : tous ses inputs ont été
lus, mais son écriture attendue manque et aucun artefact R n'est présent.
Base fixture lue en readonly : **0 publication, 0 readback**.

Review parent : `../evidence/native-canary-20261013-attempt9-review.json`
(hash de la preuve brute, Model.Ref, hashes artefacts, accès manquants).
Le stop est tenté par le script après cette capture, sans reçu distinct de
clôture dans l'evidence. Ne pas déclarer une clôture native attestée.
Pas de dixième essai automatique, ni d'augmentation implicite de borne ou repli.

## Diagnostic concret demandé après l'essai 9

Chronologie reconstruite depuis le journal RPC répliqué dans la base propre,
puis vérifiée via les API publiques authentifiées `session.get/message.list`.
Preuve : `../evidence/native-canary-20261013-timeout-diagnosis.json`.

La borne de 600 ticks porte sur **tout le cycle**, pas sur chaque rôle.
Essai 9 : exploration terminée à +131 s, évaluation à +207 s, A/B terminés
à +423 s, R transmis à +425 s. R lit ses quatre inputs à +444 s et commence
à générer un appel `write` à +576 s. Cet appel n'a pas de `time.ran` et est
interrompu avant exécution à +615 s : `aborted / Tool execution interrupted`.
La session R est confirmée `outcome: interrupted`, avec `Step interrupted`.
Ce n'est donc pas un refus de permissions : le harnais coupe une génération
encore en cours. Essai 8 : R démarrait à +453 s et n'avait que ~162 s;
son interruption est également confirmée par l'API native.

Le dimensionnement global laisse ~190 s à R dans l'essai 9, après ~7 minutes
consommées par les étapes précédentes. Relancer la même limite ne corrige pas
ce problème. Une borne plus longue ne garantit pas pour autant le PASS final.
Aucun changement de durée, modèle, permissions ou relance effectué au diagnostic.
La confirmation d'interruption de R ne vaut pas reçu global de clôture du pont
ni clôture RE; les preuves antérieures pré-stop sont conservées intactes.

## Fait, ne pas refaire

- Harnais/client/CLI/projections/publication fixture et adaptateur IDB offline
  implémentés sous `tools/ff8-harness/`.
- Pont générique `ensemble.execution.v1` dans le worktree Ensemble autorisé.
- Derniers contrôles parent : **147 tests FF8**, **1303 tests Ensemble**,
  typechecks/builds/lint exit 0. Lint Ensemble : 13 warnings/12 infos, aucun fix.
  Preuve : `../evidence/tests-20261013.json` (FF8 n'a pas de script lint propre).
- Probe natif RPC/auth/team/session PASS. Cycle scientifique natif complet
  **pas encore PASS** : aucun mock ne remplace ce critère.
- Baseline/patch initial dans `.tmp/external-harness-20261012/`. État initial
  FF8 et dépôt principal Ensemble conservés; intégrations sur quatre fichiers
  déjà dirty du worktree identifiées séparément.
- Run01 jamais relancé/réarmé; arrêt décidé != clôture RE vérifiée. Pas de
  modification IDB, de campagne jeu, de power, d'installation globale ou git.

## Corrections intégrées et essais conservés

Le hook public `permission.evaluate` n'était pas émis pour les outils fichiers
testés. Le pont utilise désormais les callbacks publics réellement observés
`execute.before/after`, mapping des opérations fichiers, et succès leaf
`(messageID,callID,tool)` ; aucun succès umbrella ne prouve une lecture.

La normalisation des ressources relatives contre le répertoire possédé vérifié
est intégrée et testée. Traversal, drive-relative et alias restent refusés;
les effets natifs deny/ask ne sont pas transformés en allow.

Worker pont historique : `ses_eceb825d6ffebbzpbqoaVMQE86`, correction terminée.
Aucun follow-up ni nouveau worker nécessaire pour les deux correctifs locaux.
Parent reste seul intégrateur; les contextes scientifiques ne sont pas recyclés.

Essai 6 (`ff8-bridge-canary-PhlQ08`) : tick à 308642 ms, expiration du bail
local de 300000 ms, aucune exécution native. Conservé dans
`../evidence/native-canary-20261013-attempt6.json` et l'ancienne preuve datée.
Correctif moteur : heartbeat pendant les opérations externes, arrêt systématique
du timer, conservation du token/fencing/CAS, aucun renouvellement après perte
du bail. Huit tests déterministes couvrent admission/inspection, contrôles,
publication/readback, inputs/connaissance, erreurs et fences expirés/concurrents.

Essai 7 (`ff8-bridge-canary-uw6Ksu`) : création native, perte de réponse et
réouverture/reprise démontrées; Model.Ref Flash high et accessVerified natifs
observés. FAIL scientifique : `resultHeader` imbriqué, schemaVersion absent
à la racine. Artefact rejeté intact; aucune normalisation opportuniste du résultat.
Preuve : `../evidence/native-canary-20261013-attempt7.json`.
Correctif adapter/profils : enveloppe WorkerResult explicitement plate, champs
invariants à la racine; régression couvrant les cinq rôles, test négatif de rejet
sans réparation des headers imbriqués. Validateur inchangé.
Les futurs échecs conservent également les `boundaryChecks` natives.

Context Mode était transitoirement absent après restart, puis le catalogue
parent a de nouveau exposé ses 11 outils. Aucune dispense ni réparation globale.

## Résultat précédent — essai 8 FAIL borné

Essai 8 fresh isolé (`ff8-bridge-canary-cP1PPb`) terminé FAIL après **614780 ms**,
borne de 600 ticks atteinte alors que R restait `submitted/observed_running`.
Preuve brute : `../evidence/native-canary-20261013-attempt8.json`;
review parent : `../evidence/native-canary-20261013-attempt8-review.json`.
Modèle explicite et natif : `zai-coding-plan/glm-5.3-flash#high`, bundle
générique régénéré immuable. Pas de nouveau canary automatiquement.

Acquis vérifiés de cet essai (ne valent pas PASS complet) :
- cinq sessions natives distinctes, Model.Ref high vérifiés;
- explore/evaluate/A/B résolus, quatre SHA256 d'artefacts relus inchangés,
  accessVerified natif true pour ces quatre rôles;
- perte de réponse après création native et réouverture/reprise démontrées;
- lecture de `denied-canary.json` refusée par un before-check natif
  `boundaryAllowed: false`;
- aucune réconciliation ni connaissance acquise; base fixture relue en readonly :
  **0 publication, 0 readback**. R n'avait pas d'artefact au contrôle final.

Le script a tenté `stopMission` après la capture d'échec, mais cette evidence
ne contient pas de reçu distinct de clôture : ne pas déclarer la clôture native
attestée. Le snapshot scientifique capturé avant ce stop reste `running`.
Ni reprise/réarmement de cette fixture ni changement de budget/repli implicite.
Un nouvel essai éventuel doit être fresh et avoir une borne temporelle et un
budget de modèles explicitement validés; ne pas allonger la borne après coup.

Exigences inchangées : cinq sessions natives distinctes, perte de réponse après
création native observée, réouverture/reprise, hashes/validations, refus natif
d'une lecture hors frontière, publication fixture unique + readback unique,
accessVerified natif partout. Aucun mock ne remplace ces critères.

Périmètre recontrôlé : `../evidence/ownership-20261013.json`. HEAD inchangés;
4645 fichiers FF8 préexistants ont les mêmes taille/mtime (pas une attestation
SHA256 de ces grands artefacts); les 39 fichiers préexistants du dépôt principal
Ensemble ont des SHA256 inchangés. Seules les quatre intégrations déclarées
ont changé parmi les 16 fichiers préexistants du worktree Ensemble.

Le 2026-10-12, l'utilisateur a autorisé pour **canary isolé uniquement** les
grants read/edit au niveau outil derrière les guards exacts du pont, avec preuve
négative obligatoire. Ne pas transformer cet accord en permission de production.

## Limite restante indépendante

Cible canonique confirmée : **IDB IDA + docs**. Adaptateur testé offline,
binding natif public complet indisponible sans lifecycle/tool invocation et
gates parent sûrs. Publication IDB autonome non déclarée opérationnelle.
