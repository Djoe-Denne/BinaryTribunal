# 226. Corriger la réponse native avant toute connexion

## Problème confirmé et conséquence

La revue indépendante `result_mvvbgj6y_001p_xw2qrc` reçoit le correctif de dossier225, mais signale un blocage de la voie Auth : le parseur du challenge exige une enveloppe contenant seulement data. L'API native renvoie location et data. Une connexion serait engagée puis son challenge refusé, sans droit à recommencer automatiquement. Aucun essai OAuth n'est nécessaire pour constater ce défaut.

Le parent confirme le diagnostic dans le code du parseur et l'OpenAPI219 conservé. Pour CONNECT, la réponse200 exige exactement location et data ; Location.PublicRef contient exactement directory. Le helper serveur response2 construit aussi une enveloppe localisée. Les seuls tests positifs utilisaient une enveloppe simplifiée. Les tests223–225 réussis restent des preuves de leurs oracles, pas de compatibilité native du format erroné.

## Correction minimale ratifiée

Le constructeur peut modifier seulement client, transport, binding et testbinding du candidat198. Les autres fichiers, bootstrap/plan et ancienne qualification219 restent inchangés. La baseline huit fichiers225 est vérifiée et préservée dans `qa-owned-auth-225/baseline-before-envelope-226` avant l'ordre.

Valider l'enveloppe native fermée location/data et le directory Windows absolu complet contre le contexte privé réellement attendu du child Auth, pas contre un chemin fourni par la réponse ou un callback. Le contexte attendu est son cwd privé auth-private-intent/work, obtenu de la composition possédée. Les réponses localisées CONNECT, statut et intégration doivent être contrôlées à la frontière du transport avant projection. Info et OpenAPI gardent leurs formats non localisés.

Le parseur de challenge doit accepter le format natif exact après cette validation, sans suppression aveugle de location ni tolérance de champs inconnus. Les tests existants doivent employer ce format et refuser location manquante, autre contexte, chemin relatif/URL et champs inattendus. Aucun secret réel ou nouvelle dépendance ; un helper DATA validant une forme ne crée aucune autorité ou capability.

## Validation et suite

Après gel, le parent contrôle le diff et les pins, puis ferme typecheck et sélections d'impact dans les fichiers existants. La même revue reprend uniquement ce blocage et ses effets ; les autres preuves inchangées sont réutilisées. Le constructeur n'exécute rien et n'annule pas les protections de claim/réponse perdue.

Le relais utilisateur est construit parallèlement dans deux fichiers disjoints. Allocation privée Windows, relais vivant et réception extérieure restent des prérequis natifs distincts non prouvés. Aucun compte connecté, token créé, modèle envoyé, nouvelle origine ou action IDA. M2 reste ouvert.

## Références techniques

- Parseur gel225 : `graph-runtime-binding.ts:103–110` ; transport CONNECT transmis brut et projections localisées : `native-runtime-transport.ts:122–130`.
- Source serveur épinglée180 : `media-uri-gqq6kfhc.js:31–41,48–53` ; schema `@opencode/schema/dist/location.js:6–12,26–28`.
- OpenAPI natif conservé219 : POST `/api/integration/{integrationID}/connect/oauth`, réponse200 et Location.PublicRef ; aucune requête HTTP nouvelle pour cette vérification.

## Correctif gelé et sélection de contrôle

Le correctif est livré dans les quatre fichiers autorisés. Le parent a recalculé les huit pins et lu le diff contre la baseline225 : validation native location/data avant chaque projection localisée, directory privé dérivé de la composition, signatures des trois parseurs mises à jour, oracles positifs et négatifs adaptés. Pas de suppression aveugle du contexte. Les quatre autres fichiers et les interfaces de fenêtre ne sont pas modifiés par ce delta.

Le parent autorise depuis le candidat198 : typecheck ; un test client exact `RMSN-AUTH OFFLINE forged caps and readonly caps cannot reach authentication fetch` ; deux tests binding exacts `RMSN-AUTH routes bind exact OpenAI headless bytes and known attempt only` et `RMSN-AUTH projections keep challenge private and discard credential and error secrets`. Filtres ancrés, zéro autre test, maximum dix minutes par invocation et pas de retry automatique. Attendus : sortie0, un puis deux tests, zéro échec/timeout et huit pins avant/après concordants. Reçus dans `qa-owned-auth-226`.

Les nouveaux imports restent des helpers DATA de modules existants. Leurs corps et tests ont été lus ; aucune base réelle, authentification, exécution native ou fenêtre n'est appelée. Les anciennes preuves de root225 et des autres tests224 inchangés sont réutilisées, pas rejouées.

Pins nouveaux : client131567/7266a3af, transport30544/79dd1ef4, binding41039/cbe0c5a9 et testbinding35040/3137556b ; empreintes complètes dans les reçus. GraphStore8969c150, testclientc64568d2, bootstrap398a184a et plan2fdeb0e5 restent inchangés.

## Résultats réels du correctif

Typecheck PASS4096ms ; un test client PASS18assertions96ms ; deux tests binding PASS80assertions64ms. Zéro échec ou timeout ;121cas client et17binding filtrés non exécutés. Les huit pins concordent avant et après chaque commande. Les trois reçus et sorties existent dans `qa-owned-auth-226`.

Le même reviewer reprend le blocage de format et l'impact de sa correction avec ces preuves, sans les rejouer. Sa réception du code reste attendue. Aucun import du bootstrap, processus natif, fenêtre, OAuth ou effet sur la base RMS réelle pendant ces tests.

## Réception du correctif

L'avis indépendant `result_mvvbprhb_000c_p94rl2` rapproche les huit pins et lève le blocage d'enveloppe sans nouveau défaut identifié dans son impact. Il confirme le contexte issu du registre privé, la validation avant projection et les oracles adaptés ; il relit les résultats226 sans les rejouer. Le parent reçoit ce correctif dans cette portée. La vraie connexion reste fermée jusqu'aux preuves séparées d'interface, de droits Windows et de réception extérieure ; aucune clôture L9 ou M2.
