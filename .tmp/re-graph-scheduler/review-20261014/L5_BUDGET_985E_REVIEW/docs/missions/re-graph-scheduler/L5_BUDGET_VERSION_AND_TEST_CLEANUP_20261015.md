# L5 — borne policyVersion et frontière des cleanups de tests

2026-10-15, même tâche Astra `task_mv9k1ikn_0000_bo44nq`, delta ciblé dans les
paths déjà ratifiés, pas nouvelle admission ni modification L1/L6.

## Borne réellement observée

Le vrai test GraphStore a refusé les nouvelles versions de fixture trop longues.
Auteur : typecheck0,65 anciennes régressions PASS, focused137PASS/5FAIL sur142,
cinq échecs mission-plan.policyVersion maxLength32. Ce n'est pas un contournement
à corriger dans L6 : son guard fonctionne. DB de test fermée et conservée, zéro submit.

Parent relit mission-plan-v1.schema.json : maxLength32. Le validateur L6 actuel
graph-store.ts:192 compte **String.length / unités UTF-16**, pas octets UTF8 ni
points de code Unicode. Préfixe complete-admission-cap-v1: =26 unités, donc suffixe
non vide de1 à6 unités. Exemples test1=31 au total et l6v1=30. Ne pas tronquer ou
élargir le schéma. Ne pas créer de whitelist ASCII : vérifier BMP/astral et32/33
selon ce vrai lecteur ; la mesure des bodies demeure canonical **UTF8**, distincte.

**Ratifié : validation précoce ≤32 pour le NOUVEAU mode seulement** et correction
des noms des nouvelles fixtures. Le chemin legacy reste byte-exact, mêmes65 tests,
pas de changement global des versions anciennes. Source L1/L6 readonly.

## Cleanup : exception étroite aux hooks déjà existants

L'auteur a justement HOLD le full devant «zéro suppression». Parent constate :
eventlog.test.ts:17–24 supprime ses propres DB/sidecars dans le répertoire mkdtemp
de cette exécution ; store.test.ts:19–34 crée des noms UUID puis nettoie ces fixtures.
Les fichiers factices foreign.db/ensemble.db de ces tests ne sont pas une DB privée
de l'infrastructure. Aucun accès à une vraie DB Ensemble n'est autorisé.

**Full autorisé avec ces hooks PRÉEXISTANTS NON MODIFIÉS**, seulement sur les
fixtures uniques créées par CETTE exécution, dans un namespace mkdtemp/UUID possédé.
Confiner via OWN/.tmp/L5_ADMISSION_BUDGET/full-temp-UUID/opencode fraîchement créé,
TEMP/TMP uniquement dans les sous-processus de test, jamais environnement global.
Préparer le sous-répertoire opencode avant Bun pour éviter l'erreur déjà connue.

Aucune suppression manuelle/cleanup nouveau, aucun hook ajouté, aucun gel/receipt/
log/evidence/campagne/DB préexistante ou étrangère touché. Le nouveau gate L6
l5-admission-budget-* ferme et **conserve** ses fichiers, y compris dans le full.
Si un ancien hook vise une ressource hors namespace ou non créée ici, STOP/escalade,
ne pas patcher les suites readonly. Borne420s, logs nouveaux, codes/comptes exacts.

Décision complète envoyée directement en un message court, pas un header de fichier
tronqué ; ACK demandé avant application. Elle complète les GO de tests/ownership,
sans autoriser d'autres suppressions ni réinterpréter les règles d'infrastructure.
Les futures affirmations «aucun cleanup» désignent l'absence de cleanup manuel ou
d'evidence ; elles ne doivent pas masquer ces hooks internes de fixtures autorisés.

## Deux exceptions de namespace confirmées avant full

L'auteur a ensuite correctement STOP avant lancement : TEMP/TMP ne confinent pas
re-policy.test.ts:26–27 (base Temp/opencode littérale) ni runtime.test.ts:11 (base
LOCALAPPDATA/Temp/opencode). Aucun full ni workaround lancé à ce point.

Parent lit réellement ces sources : re-policy conserve uniquement les racines
retournées par mkdtemp dans son tableau privé roots, ferme ses clients puis les
retire ; runtime capture la racine mkdtemp fraîche dans done(), pas un chemin reçu
de l'opérateur. Parent autorise donc **deux exceptions étroites**, sous
`C:/Users/djden/AppData/Local/Temp/opencode/` : racines fraîchement créées dans CE
full par les hooks inchangés, préfixes **ff8-re-policy-** et **ff8-runtime-test-**.
Ces préfixes désignent les retours mkdtemp précis, **pas une permission de glob**.

Aucun delete manuel ou nouveau hook, aucune racine préexistante/étrangère/evidence
ou DB privée. Ne pas modifier LOCALAPPDATA. Le reste conserve son TEMP/TMP child
isolé/opencode ; tout autre échappement ou ressource non créée ici → STOP.
Les nouvelles DB l5-admission-budget-* restent fermées/conservées. Full420s permis
seulement après focused vert corrigé, logs neufs/codes/comptes et ces deux exceptions
signalées. Ne jamais revendiquer «tout était confiné OWN» après cette autorisation.

Dernier incident de setup déclaré : un nouveau test sans readyAtEvent échouait,
corrigé dans le seul nouveau test ; aucun défaut d'un module accepté inféré et
aucun PASS final déduit avant sa relance. Les deux décisions complètes ont été
notifiées directement et ACK demandés, sans nouvelle propriété d'écriture source.
