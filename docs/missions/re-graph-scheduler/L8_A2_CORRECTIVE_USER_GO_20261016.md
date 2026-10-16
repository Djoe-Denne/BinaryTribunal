# L8 A2 — GO utilisateur correctif ciblé Sol Max, PLAN avant code

À la question d'extension du client readonly après deux BLOCK confirmés, réponse
explicite : **« Sol Max ciblé (Recommended) »**. Autorise les deux corrections et
l'extension BORNÉE àclient.ts après ratification du plan ; full/intégration restent
sous gates séparées. Ne vaut ni approbation d'un futur correctif ni effacement du
BLOCK/runtime15, des gels, des reports ou des gates de review.

GO de reprise post-maintenance également reçu. L'utilisateur précise qu'il pouvait
s'agir d'un simple arrêt OpenCodeV2, pas d'une vraie pause mission. Readback natif
12:12Z : cible déjà ABSENTE pausedTeams persistante/transport/admission, guardready,
seule AUTRE mission reste en pause. **Aucun verrou/config globale modifié**, aucune
autre mission relancée. Équipe/lead/tasks/models conservés, migration19→20 donnée
comme vérifiée par l'utilisateur, pas nouvelle opérationSQLite exécutée par nous.

## Même propriétaire / même modèle / étape actuelle

Auteur`l8-integration-r1`, taskglobal`task_mv6towrm_000c_24005n` toujoursin_progress,
session`ses_ec12fcc43ffeI6xXQ5rSTty2mV`, **openai/gpt-6.1-sol variant=max** existant.
Lead`ses_eca40a8e2ffeanEKTBLiGjDNw8` Sol/xhigh ;5slots max,manual,autoDispatch/
autoScalefalse,providerpolicy4/modelpolicy2legacy préservés. Pas nouvelle grille,
nouveau superviseur, fallback, achat, fork ou reprise d'un reviewer completed.

Présent paquet = **ACCÈS SEUL**, lecture/hash/rôle/OWN/conditionsACK, puis message
parent distinct **GO ANALYSE/PLAN UNIQUEMENT**. Pas code/probe/typecheck/test/DB/full
avant plan ratifié et leurs permissions distinctes. La fin d'un tour n'est pas la
clôture de la tâche globale. En cas de tâchecompleted réelle, escalader au parent.

## Périmètre du plan, pas algorithme imposé

Source : runtime15 du fullgel492f9f83…8ac05b,321686B, encoreBLOCK ; clientaf00 et
adapter8da hérités inclus. Preuvesreview fraîche complétée et fermée, reportparent
deuxBLOCKs et contrecontrôles fournis. Les chemins absolus d'anciens rapports/tests
sont **provenance seulement**, jamais accès aux DB/package/proofs du reviewer.
Source propreOWN/pins et dépendancesreadonly déjà autorisées uniquement ; pas index
partagé qui lirait une autre copie, pas inbox/autres sessions.

1. **RV8A2-01** : proposer snapshot détaché digest/body/retry/receipt cohérent AVANT
   await/callback ; cas nested/arrays/key/executionId, callback snapshot/renew/token,
   absence d'effet sur l'objet caller, bytes/key d'origine et concurrence/lostreply.
   Décrire entrées JSON/accessors/proxy réellement supportées et compatibilité :
   pas durcissement généralisé ou nouvelle sérialisation inventée pour masquer le
   défaut. Pas mutation/réparation d'anciens journaux, receipts ou DB d'evidence.
   Défaut hérité clientaf00, pas une régressionv2 établie ni une preuve native.
2. **RV8A2-02** : bloquer nouvelle soumission/acceptation PREPARED pendant pause,
   sans blanketreturn qui supprimerait observations/travaux déjà acceptés, vrais
   résultats/stop/fences/releases. Préserver retry/backoff/resume/IDs/body et N=1
   durable ; pause≠quiescence, pas remboursement/réautorisation. Traiter étapes et
   await intercalés/dernier étatdurable, limites des appels déjà envoyés et lostreply
   ambigu explicitement : aucune promesse d'arrêt réseau atomique non prouvable.

Chemins candidats à ratifier : `src/client.ts` (extensionuser),`src/graph-engine.ts`
(scopeL8existant), nouveau`test/graph-integration/body-pause-regressions.test.ts`.
Expliquer nécessité/placement exact avant tout write ; autre chemin ou besoinAPI
readonly → escalader. Adapter,autresruntime/tests60/fixture-driver/L1–L6/Store/
schemas/config/registre restent readonly. Ne pas élargir l'ancien droit6src+7tests
pour opportunisme, ni affaiblir un ancien contrôle pour rendre le nouveau vert.

## Livrable PLAN et gates futures

PLAN dansOWN/.tmp/L8_A2_CORRECTIVE_20261016/ : preuves3–8 path:line et étatinitial,
invariants, design snapshot/pause, matrice positif/négatif/race/reprise, chemins et
risques/ambiguités à arbitrer. Aucun oracle testé recopié comme vérité. Probes
publiques fournies sont des contre-exemples reproduits, pas une certification de
toutes les jonctions ni autorisation d'exécuter leurs anciens imports absolus.

Après ratification : RED qualifié sur baseline, writeborné,60anciens+nouveaux/
typecheck, SQLite propres sous permissions séparées, gel et futur full unique
exclusif seulement aprèsGO ; puis **freshreviewindépendante runtimeentier** et gates
parent avant intégration. La reviewprécédente restecompleted/shutdown. D'anciens
full930PASS+1SKIP ne lèvent pas ces défauts et ne sont pas à relancer maintenant.

Toutes preuves/gels/DB connues conservées, aucun delete manuel/reset/install/Git/
LLM/dispatchréel/IDA/live/globalconfig/sous-agent. Pas sourceL7 ni régimeB/simCLI/
L9/L10/interop réel/science/native. L7replayparent131PASS est distinct, FULLL7 encore
sous sa propre réservation/permission ; n'attendre aucun full fictif en cours.
