# L7 final — full borné après gel vérifié et réservation explicite

Même task task_mv9si4oj_003p_veyhvi, fresh Astra max
ses_ebf78f8d5ffedb0W7RDtlrlmOR. Source candidate **494b8bf87fa7a5e4b3c66058869d12be765a066c8ca9882d8a6ad12d2006fcde**,
95 290B ; nouveau test **8d44e0f640d969399682d498babfe81e7ecf04332b16d42f6dd80c891a288991**,
21 963B. Gel intermédiaire **74a6c0e7cca2e83887c07761600fbfb843be872d5718ec4a42e9fdc72799e2b8**.
Pas acceptation ni intégration du candidat.

## Prérequis vérifiés parent

25artefacts/321 691B, copies freeze exactes, inputs382+2 et366readonlyOWN exacts ;
33types/interfaces exportés byte-exacts. Auteur RED ancien3ea conservé5PASS/17FAIL,
22tests ;24nouveaux finalement (deux contrôles phases ajoutés explicitement).
Parent lit le delta ciblé et rejoue **typecheck0 puis100PASS/0FAIL/13 606assertions**,
six fichiers/6.62s.76anciens contrôles inchangés, L5courant985readonly.
Parent ne traite ni ces tests ni ce gel comme review indépendante ou preuve native.

## Accès, ACK et créneau distincts

Lire/hash/ACK cette décision complète puis **attendre message FINAL FULL GO**.
Le créneau est préparé, pas encore acquis : une gate ciblée L8 engine.test.ts a été
observée en cours. L8 doit finir naturellement et confirmer sa libération ; aucun
kill/abort, ni nouveau full concurrent. Analyse/code L8 indépendant reste autorisé,
ses gates lourdes suivantes attendent la libération parent après ce full.
Un reçu de transfert ou cette note ne remplace pas la réservation finale.

## Exécution autorisable, une seule tentative du gel

Depuis OWN/tools/ff8-harness : suite complète offline, processus enfant avec
TEMP/TMP **neufs** sous OWN/.tmp/l7-final-fix-20261015/full-<identité fraîche>/,
son sous-répertoire opencode préparé. Environnement de l'enfant seulement ; pas
LOCALAPPDATA/config globale/harness/provider modifié, pas réinstallation.
Borne **420s**, aucun second full ou relance automatique. Journaliser commande,
début/fin/exit/signal/durée et vrais comptes PASS/FAIL/SKIP/assertions/fichiers.
Le seul SKIP réel reste déclaré, jamais promu native.

Sanity attendue du corpus committé930PASS+100SIM = **1030PASS/1SKIP**, pas un résultat
inféré ni un droit de changer les tests si le compte diffère. Les26maintenances non
committées du main ne sont pas dans OWN. Pas956main ni928ancien auteur revendiqués.

## Fixtures et conservation, permissions exactes

Seuls escapes littéraux historiques déjà vérifiés :
- C:/Users/djden/AppData/Local/Temp/opencode/ff8-re-policy-* et ff8-runtime-test-* :
  seuls retours mkdtemp **créés par CE run**, leurs hooks préexistants possédés peuvent
  terminer leur lifecycle. Pas glob/manual delete/réutilisation d'une ancienne DB.
- C:/Users/djden/AppData/Local/Temp/opencode/graph-interop-* : seuls retours mkdtemp
  créés par CE run, handles fermés, own.sqlite/sidecars **hashés et conservés**.
  Aucun delete de ces racines/artefacts n'est autorisé.
- Nouveau test budget L5readonly utilise le TEMP/TMP enfant pour sa propre fixture
  l5-admission-budget-*/own.db ; handles fermés, DB **hashée et conservée** également.

Pour toutes preuves nouvelles conservées : chemins exacts/tailles/SHA des DB et
sidecars effectivement présents, logs de leur création/lifecycle ; pas inventaire
ou accès d'autres racines Temp préexistantes. Autre escape détecté → STOP ciblé,
pas correction de tests readonly ni changement de TEMP global pour masquer le cas.
DBfixtures seulement, jamais DB privée/native/session réelle, aucune soumission.

## Après le full

Relire tous pins readonly/inputs et source/test du gel, conserver résultats FAIL
éventuels. Une gate rouge/diff de pins → rapport ciblé/HOLD, pas patch ou rerun de
confort pendant la réservation. Libérer explicitement le créneau par notification
à la fin naturelle, même en échec ; pas de worker restart/commit/intégration.

Si vert : nouveau gel final, HANDOFF+manifest avec3ea/RED/historiques conservés,
deux paths source/test seulement. Nouvelle review indépendante fresh puis gates
parent requises. Pas changement README/DTO/L1–L6/L8/QA/Store/config/registre.
Pas Git/install/sous-agent/inbox/réseau/LLM/dispatch réel/IDA/live/suppression manuelle.
Ndurable/ports/proofs host, régimeB, simulationCLI et native/science restent hors GO.
