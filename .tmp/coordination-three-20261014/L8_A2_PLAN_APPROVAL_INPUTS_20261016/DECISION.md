# L8 A2 — plan ratifié sous conditions A–E, RED séparé avant source-write

Plan auteur463lignes/32071B/SHA00fbd781e6018dd60ea12913145e1dbd9ea15132739aefa96f8cf2b6dd1b1b11.
Même auteurSolMAX/taskglobalin_progress/OWN, routeuser «Sol Max ciblé». Parent
relit le codec réel validation5–9, client27–28/60–94, préparation89–111/journal142–190
et L6dispatch688–741/reconcile746–766. **A–E ratifiés avec les précisions suivantes**.
Ce texte n'est PAS une permission d'exécuter ; lire/hash/ACK puis message final
distinct pour le prochain stade. Aucune acceptation ou levée du BLOCK implicitée.

## A — image canonique détachée, compatibilité circonscrite

Codec`canonical` ACTUEL puis décodage JSON, une image avant callbacks configurés/
await, key/digest/body/receipt liés à cette image ; payload jamais relu du caller.
Rawautorité via`in` AVANT image préserve undefined/hérité ; **recontrôler aussi les
champs d'autorité interdits sur l'image capturée** pour ne pas accepter une donnée
que des traps/getters auraient fait apparaître pendant la sérialisation. Pas de
rejet global des Proxy/getters ni nouvel opérateur de sérialisation/normalisation.

Domaine positif : imageJSON objet avec keychaîne danssesdonnéessérialisées, valeurs
admises parcodec actuel/objetsnested/tableauxdenses ; key peutdifférerexecutionId.
Images indécodables/horscontrat, keynonénumérable perdue ou tableauroot àpropriétés
additionnelles ne deviennent pas des admissions réussies : refus local avant
transport/écriture de row. Pas promesse de compat générale JSarbitraire. Getter/
Proxy peut agir pendant SA lecture de canonical ; image ENSUITE détachée avant
callbacks client, pas snapshot atomique de JS hostile ni absence de ses effets.
Callerjamaisgelé/modifié ; bytes/descriptors/enveloppecompat réels à prouver.

## B — pause locale, pas linéarisation interconnexion/réseau inventée

Dernier journal DURABLE, guards après inputs/checkInputs/autorité et avant nouvelle
réserve/refus/claim/dispatch. Guard danssame-db`.immediate()` deprepare AVANT pin/
claim/outbox, réutiliselectureproposals, fences finales inchangées ; aucune await/
I/O/callbackconfig/Storewrite/autreconnexion ajoutée danscette transaction.
Signal local de préparation différée précis, pas catchgénéral ni fausse quota/
execution_rejected dans L6. Pas spin ni attempt/backoff/N remboursé.

Parent ratifie **la frontière locale §5.4** : aucun nouvel appel engagé par un
dernier guard qui constate pause. L6necomposepas atomiquement dernierreadL8,
SENDING et acceptation externe. Pause peut arriver entreconnexions aprèsceguard,
ou pendant un port déjàengagé, y compris sescallbacks/await internes : faits et
vraiesreceipts restent retenus. Ne pas afficher «zéroacceptationaprèsheurepause»
ou quiescence. Une exigence plusforte imposerait nouvelleAPI/scopeL6, NON autorisés.
Tester/qualifier ces intercalages sans maquiller l'ordre effectif d'entrée du port.

## C — contrôle borné des rows utilisés, pas réparation historique

Approuvé dansclient.ts : avant cachedreceipt/retry/relectureconcurrente, vérifier
body→payload en retirant **seulement missionId/directory/controllerId/expectedRevision**,
les quatre vrais champsenveloppe, et comparerimage/digestcapturés. Ne pas comparer
les anciennes valeursCAS/controller au contexteactuel comme un payloadchangé.
Rowincohérent/malformé → refuslocal, aucun UPDATE réparateur, remplacementkey/body,
effacementreceipt ou réhabilitation d'anciensrun. Pas query/table/migration nouvelle.

Pour preuve négative dédiée : le RED RV01 sur baseline produit lui-même une DB
FAKE neuve incohérente via APIpublique ; **identifier/logguer/fermer/pinner/conserver**
ce retour exact, plus un contrôle cohérent. Après permission ultérieure spécifique,
copieSCRATCHneuve de ces seules DB DE CE RED puis APIpublique du client corrigé.
Originals rouges jamaismodifiés, pas ancienneDB d'evidence/SQLseed/patchbinaire.
Le REDn'autorise PAS encore cettecopie/réouverture. Si preuveC pasautonome dansle
futurtestcommitté, la garder probe séparée explicite ; aucun import indispensable
d'un inputs/proof ignoré dans le test permanent, aucune couverture CIinventée.

## D — observer PREPARED souspause, jamais le soumettre

Autorisé surrecorddéjàdurable avec port OBSERVER EXISTANT et mêmes preuves/
attributions. Positifacceptedlié peut passer parreconcileAdmissionpublic existant
qui sait retenir ce fait, pas création de worker. Pending/absent/unknown ne valent
ni rejet/quiescence ni autorisation ; rejet surPREPARED ne doit pas être forcé dans
la brancheL6 réservée SENDING/AMBIGUOUS. Garder dossier/claim/temps sansresubmit.
Completed sanspreuvesrequises resteinéligible. Conserver observations légitimes
SENDING/AMBIGUOUS/ACCEPTED/terminal/late/stop/fences/releases, pasreturnglobalstep.
Si un nouveauport/contratAPIreadonly est nécessaire : STOP au lieu de l'inventer.

## E — trois chemins et séquence de permissions

Seulschemins futurs :src/client.ts,src/graph-engine.ts,
nouveau test/graph-integration/body-pause-regressions.test.ts. Les60anciens tests,
fixture-driver/adapter/autresruntime/L1–L6/Store/schema/config restentreadonly.
Matrice duplan approuvée avec ajoutcaptured-authority ci-dessus ; pas oraclecopié,
injectionprivée, égalitékey/executionId ajoutée, API/raceatomique fabriquée.

Prochainstade autorisable APRÈSACK+messagefinal : **nouveautestWRITE + RED SEUL**
contreles15baselineinchangés. Uneinvocationinitiale ciblée bornée≤180s,
`bun test --timeout 30000 test/graph-integration/body-pause-regressions.test.ts`.
Typecheck/global60/full et les DEUX SOURCES restent interdits àcestade. Erreursetup
qualifiée/conservée, pas preuve source ni oracleaffaibli/rerunautomatique ; escalader.

SQLite de ceRED seulement viaAPIspubliques/fakes :childTEMP/TMPfrais sousproofdir
OWN/.tmp/L8_A2_CORRECTIVE_20261016/RED-<fresh>/,LOCALAPPDATAinchangé et seuls retours
mkdtemp`l8-central-v2-*` du fixture-driverinchangé. Conserver DB/sidecars/receipts/
cheminstaillesSHAaprèsvraiescloses, aucun delete/SQLdirect/ancienTempinventorié.
HelperappendseulsoncumulatifOWN/.tmp/L8_PHASE_A_V2/focused-fixtures.jsonl :snapshot
AVANT puis préfixe EXACT+taille/tail APRÈS, aucunrewrite. Copies d'archives/full
anciennes restentexactes ; ne pas prétendre que le cumulatifappendé garde sonhash.

AprèsREDqualifié : nouveauxGOsources+focused60/nouveaux/typecheck/fixturesbornées,
puisgelruntime16/fulluniqueexclusif et FRESHreviewindépendante+gatesparent séparés.
Pas Git/install/sous-agent/inbox/LLM/dispatchréel/IDA/live/autremission/power/native/
science/régimeB/simCLI/L7 depuiscettepermission. Taskresteouverte, sourceencoreBLOCK.
