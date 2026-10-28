# Sortie native contrainte — contrat d'intégration

**État vérifié le 2026-10-13 : PASS du canary natif complet (essai 16)** sur la
connexion OpenAI indiquée ci-dessous. Voir la
[revue parente](../evidence/native-canary-20261013-attempt16-review.json).
Cette preuve est synthétique et ne vaut pas publication IDA/IDB réelle.

La déclaration catalogue `structured_output: true` ne suffit pas. Le canary
utilise désormais un mode explicite `json-schema-strict` ; aucune erreur ne doit
le faire revenir au JSON libre ou changer de modèle. Le mode historique `file`
reste distinct et doit être demandé explicitement pour un diagnostic legacy.

## Route retenue

Provider natif autorisé : `openai`, modèle `gpt-6-astra`, variante `high`.
L'inventaire public confirme `@opencode/ai/providers/openai` et l'endpoint de la
connexion existante `https://chatgpt.com/backend-api/codex`. Aucun achat ni
changement de credentials/configuration provider n'est introduit ; les appels
consomment l'accès et les quotas existants, sans promesse de gratuité.

Sources de protocole :
- https://developers.openai.com/api/docs/models/gpt-6-astra (Structured outputs : Supported)
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/websocket-mode
- https://developers.openai.com/codex/noninteractive

Le protocole Responses transmet `text.format` avec `type: json_schema`, `name`,
`schema` et `strict: true`. Le hook V2 HTTP porte un `Request` remplaçable ; les
hooks WebSocket publics expérimentaux portent les frames. La sélection native,
l'endpoint, la session, le profil et le type de requête doivent rester corrélés.
Les appels auxiliaires et les autres sessions ne doivent pas être modifiés.
Une route/forme non couverte est refusée, jamais transmise sans la contrainte.

La documentation ZAI consultée établit `json_object`, pas un contrat JSON Schema
strict ; OpenCode Go ne reçoit pas par analogie le support d'une autre connexion.
Ils ne sont pas des replis implicites. Aucune prétention de support universel.

## Frontière générique / FF8

Ensemble reçoit un contrat générique `output` versionné par sa route :
`mode`, `strict`, `name`, `schema`, `schemaSha256`, `route`.
L'opérateur autorise le modèle exact dans `strictOutputModels`. Le schéma fait
partie du digest d'idempotence : le changer ne permet pas de réutiliser une clé.
Le pont contraint les requêtes et capture une réponse assistant terminale avec
sa référence native. Il ne connaît ni rôle scientifique FF8 ni publication IDB.
Les sessions strictes ne reçoivent pas les rappels automatiques Ensemble
« envoyer les résultats via team_message » : ce second prompt contredirait la
capture finale et la règle fresh-only. Leur contexte exclut aussi l'injection
automatique des messages du groupe et des textes d'autres auteurs ; les sessions
ordinaires conservent le comportement habituel. Aucun succès par simple message
de complétion. Une capacité séparée peut autoriser la consultation explicite d'un
bulletin borné : voir [les contrats d'accès par rôle](ROLE_ACCESS.md). Elle ne
modifie ni le schéma final ni l'isolation par défaut et n'était pas activée dans
le canary 16.

Le harnais construit un schéma fermé pour chacun des cinq rôles dans
`src/structured-result.ts`. Le modèle ne produit que le payload scientifique,
jamais les identifiants de mission/exécution, `kind` ou `role`. Les seuls nulls
convertis en absence sont les optionnels explicitement décrits par le schéma ;
aucun alias, valeur scientifique ou résultat invalide n'est réparé après coup.

L'adaptateur vérifie le contrat/hash, les témoins de requête, le message natif,
le modèle/profil/session et les accès. Il valide le payload, ajoute le header
immuable puis écrit et relit un fichier immuable. Le modèle n'a plus d'accès
`edit` à ce résultat. Les attentes d'accès ne doivent donc pas fabriquer de
témoin d'écriture worker : les lectures natives restent exigées.
Chaque témoin porte aussi son couple exécution/session ; un témoin d'une autre
exécution ou sans cette liaison est refusé. Il s'agit d'une attestation du pont
public authentifié, pas d'une signature cryptographique du provider.

Le moteur applique ensuite les validations scientifiques existantes. Un JSON
conforme n'établit ni la vérité de l'analyse ni une gate ASM/IDB réelle.

### Lisibilité et intégrité des entrées strictes

Les dossiers stricts version 3 et les artifacts contrôleur sont du JSON à clés
triées, indenté sur deux espaces, terminé par LF. `instructions` est un tableau
de lignes dont la concaténation avec LF restitue le texte original. Le hash du
dossier/artifact porte sur les octets persistés et relus ; le hash du payload
natif conserve sa forme canonique. Les dossiers legacy version 1 sont inchangés.
Les propositions gelées utilisent `contentLines` et
`contentEncoding: utf8-lines-lf` plutôt qu'un document JSON entier échappé dans
une seule chaîne. Joindre ces lignes avec LF reconstitue exactement `content` ;
métadonnées et `document` restent intacts. Ce format de transport ne remplace pas
le `InputBundle` interne. Contenu, document, manifeste et mesures source/projection
doivent concorder avant admission. Les dossiers v2 existants restent immuables.

`controllerInputIntegrity` contient les SHA-256 réellement calculés des sources
approuvées et de leurs projections gelées, comparés aux hashes du manifeste.
Ce certificat déterministe atteste seulement les fichiers de ce rôle : ce n'est
ni un calcul effectué par le worker, ni une vérité sémantique, ni une gate IDA.
Une divergence, une projection manquante au replay ou une ligne physique de
plus de 2 000 caractères bloque l'admission/materialisation. Aucun contenu
n'est tronqué ou réparé. Les anciennes fixtures restent immuables.

## Gates avant PASS

Tests déterministes d'abord : mauvais schéma/hash, alias `proposals`, champs
réservés, route inconnue, identité divergente, requêtes auxiliaires/étrangères,
transport non couvert, capture manquante/tronquée/refusée, accès manquants,
réponses perdues et reprise sans double soumission.

Le canary natif doit ensuite prouver les cinq sessions fresh distinctes, leurs
Model.Ref, les schémas réellement injectés, les captures validées, la reprise,
le refus de sentinelle, une publication fixture unique et son readback. Il reste
synthétique : aucune science FF8 ou publication IDB n'est attestée par ce test.
Les tests mockés ne remplacent jamais cette preuve native.

L'essai 12 a été arrêté avant tout worker : le runtime RPC refuse les regex
`pattern` dans son envelope d'entrée. Elles ont été retirées de cet envelope
seulement ; le nom et le hash restent validés exactement dans le code d'admission.
L'essai 13 a ensuite révélé l'enveloppe `{location,data}` du readback de profil,
désormais vérifiée et extraite à la frontière SDK.

**Essai 14 : chemin strict natif confirmé** sur la connexion OpenAI existante,
transport WebSocket : 18 requêtes contraintes, cinq sessions fresh distinctes,
cinq réponses schema-bound relues via l'API publique et validées indépendamment.
Le transport HTTP conserve ses tests déterministes, sans validation native dans
cet essai. Le canary complet reste en échec : R a rendu `blocked` faute d'entrées
entièrement lisibles et d'attestation explicite des hashes. Aucune publication
fixture ou réelle ; ne pas transformer ce refus légitime en `certain` après coup.
Voir [RESUME_STATUS](RESUME_STATUS.md) et la preuve native de l'essai 14.

L'essai 15 a confirmé la clôture exacte après reprise et les certificats des
quatre workers créés. R a été refusé avant allocation à cause de la chaîne JSON
dupliquée `FrozenProposal.content` ; le correctif v3 ci-dessus est validé sur
ses entrées réelles en offline, sans transformer cet essai en PASS complet.

**Essai 16 : PASS complet**, avec les dossiers v3. Cinq sessions fresh OpenAI
`high`, 18 requêtes WebSocket contraintes, cinq captures revalidées, reprise sans
duplication, sentinelle refusée, publication fixture unique et readback vérifiés
en lecture seule, clôture exacte des cinq sessions confirmée. Les certificats et
propositions ont été relus sans perte. Le bundle isolé et les fichiers globaux
protégés ont été contrôlés par hash. Le PASS ne généralise pas le support à ZAI,
OpenCode Go, HTTP natif ou à une publication scientifique réelle.

L'opérateur peut créer `STOP_REQUESTED` dans la racine du canary. Le contrôleur
conserve ainsi son token en mémoire pour demander l'arrêt par le pont et relire
sa clôture. Aucun token n'est persisté. Les anciennes fixtures et run01 ne sont
jamais repris pour un nouvel essai.
La clôture compare l'ensemble exact des couples exécution/session observés avec
le snapshot arrêté : une liste vide, un doublon ou une substitution ne confirme
pas l'arrêt des cinq workers.

### Limite de disponibilité conservée

Le budget et l'arrêt restent **coopératifs**, conformément au contrat de durée
existant : un RPC déjà engagé est attendu avant fermeture des bases. Ce n'est
pas une garantie d'interruption à 1 200 secondes d'un serveur bloqué. Après une
erreur retournée, l'arrêt est demandé avant le snapshot diagnostique. Si un RPC
ne revient jamais, une intervention ciblée reste nécessaire ; ne pas annoncer
une clôture native attestée sur la seule expiration d'un délai local.
