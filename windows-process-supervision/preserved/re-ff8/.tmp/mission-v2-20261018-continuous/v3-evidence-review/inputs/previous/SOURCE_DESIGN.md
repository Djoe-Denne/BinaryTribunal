# V3 MATRIX — candidat source borné, révision 1

## Statut et autorité

SOURCE SEULEMENT : aucune compilation, importation de produit, exécution, test,
sonde, API native ou campagne n'a été réalisé par l'auteur. Ce document décrit
des **faits attendus conditionnels**, jamais des faits observés ni une acceptation.
Une revue fresh et une gate parent distincte restent obligatoires.

Le parent a approuvé le plan révisé et le GO WRITE limité à `RunnerMatrix.cs`,
ce document et `MANIFEST.json` dans ce seul répertoire outputs. Les 14 entrées
initiales et les 2 entrées du supplément sont deux gels distincts, intouchés.
NONBLIND : le paquet contient du contexte historique validé ; ce n'est pas une
analyse aveugle de fonction x86. Le receipt slice 2 n'est pas une observation
de ce candidat et aucune ancienne tâche n'est reprise ou clôturée.

Ce candidat couvre cinq variantes bornées. Il ne constitue **pas une matrice
exhaustive de pertes réelles S/D/G**, ne promeut aucune gate projet et n'accorde
aucune autorisation de run/live/FF8. `RunnerReal.cs` n'est ni modifié ni appelé.

## Composition et surfaces effectivement disponibles

Les seams sont les surfaces **internal de la même assembly**, pas une API DLL
publique : `IGuardianOwnerNative`, `GuardianCore` à trois arguments,
`IGuardianProcessHost`, `HostAttestation`, `HostLauncher` et les destinations
`Stream` de `WriterLedger`. Il n'y a ni réflexion sur des membres privés ni API
inventée. Les helpers privés de RunnerReal ont une implémentation séparée ici.

`ScenarioOwner` délègue chacun des 14 membres à un véritable `RealNative` gelé :
PointerBytes, LayoutsMatch, CreateJob, SetLimits, ReadLimits, GetInheritance,
CreateSuspended, Assign, IsMember, Resume, WaitControl, StopJob,
StopUnresumedRoot, Close. `KernelObserver` et `GuardianStopwatchClock` restent
réels, sans wrapper de résultat ou faux temps. Les retours natifs ne sont pas
corrigés pour satisfaire les attendus. Le compteur OWNER_CALLS comprend aussi
des propriétés/checks managés et ne se présente pas comme un compteur Win32.

Les deux contrôles S/D sont des `CreateEventW` anonymes, manuels, initialement
non signallés, héritage exactement 0. Les trois pipes ont un bout enfant
héritable exactement 1 et un bout parent exactement 0 ; les huit handles sont
positifs et distincts. Les STDIO seulement sont admis par RealNative dans la
liste d'héritage. La variante attestation prépare ces ressources comme les
autres variantes : « aucun appel owner/Job/T » ne signifie pas « aucune API
de préparation ». Aucune preuve de vrai processus D ou de processus S/G
distincts n'est proposée.

Un futur lancement parent ne reçoit que `CASE DIRECTORY`. Les cinq noms de cas
sont exacts et sensibles à la casse. Chaque invocation crée huit `FileStream`
frais `CreateNew`, `ReadWrite`, `FileShare.Read`, buffer 4096, un par slot dans
l'ordre de l'enum. Un répertoire déjà existant est refusé. Nonce aléatoire,
epoch positif, pins image/commande/chemins et réservation objet reprennent les
limites de confiance du baseline ; ils ne prouvent ni un bail durable ni la
canonicité/reparse des chemins.

## Variantes et attendus conditionnels

### 1. `d-loss-signalled`

T reçoit le mode enfant `bounded-hold` : un `Thread.Sleep(60000)` fini, sans I/O,
sous-processus ou activité externe. La durée est `TotalMilliseconds + 5000`.
Il ne faut pas interpréter l'expiration naturelle de ce délai comme l'injection.

Après le vrai `Resume` retournant exactement 1, au premier `WaitControl` du
handle D dans `Run`, l'owner tente une seule fois `SetEvent(D)` puis délègue
toujours le vrai `RealNative.WaitControl`. Aucun délai arbitraire ne déclenche
l'événement et aucun résultat Signaled n'est fabriqué. Tentative débitée avant
SetEvent ; aucun retry. Booléen, erreur Win32 (ou -1 pour exception) et résultat
du vrai wait sont conservés. Si SetEvent échoue, le wrapper lève après la
délégation du wait : le noyau transforme cette erreur en HOLD d'intégrité.
L'absence d'injection ou son échec ne peut satisfaire ExpectedFacts.

Seulement si création, reprise, signal, stop et preuve noyau réussissent dans
leurs bornes : DriverLost, un appel owned StopJob réussi, QUIET, puis
ForcedQuiescent. Un ACK exact peut sceller le résultat ; l'attendu complet est
AcknowledgedSealed/Sealed, JOB_RETAINED=false, SEALED=true, RESERVED=true et un
seul ACK. **ForcedQuiescent n'est jamais PASS**, même avec exit 0 et Sealed.

### 2. `s-loss-signalled`

Même enfant borné et même mécanisme, mais SetEvent cible le contrôleur S.
Seulement si le chemin est exercé : ControllerLost permanent, un stop owned
réussi, preuve de quiescence conservée comme fait, HoldQuarantined/Quarantined,
HeldNotQuiescent, JOB_RETAINED=true, SEALED=false, RESERVED=true, zéro ACK.
S demeure vivant et co-localisé ; sa mort n'est pas simulée ou prétendue.

### 3. `g-thread-loss-postRun-preACK`

Le seul travail owner de ce cas est exécuté sur un thread G dédié réel.
`core.Run` utilise le vrai owner/observer/clock et T en mode self-exit. Après
le retour de Run, une exception managée dédiée est volontairement levée puis
capturée à la frontière supérieure du thread. Le thread se termine réellement.
S effectue un `Join` unique borné à 60000 ms ; GuardianAlive consulte le vrai
`Thread.IsAlive`, pas un booléen falsifié. Aucun ACK n'est envoyé depuis S ou
après la terminaison G. Dans les autres cas, Run et ACK utilisent le même thread
owner, avec contrôle ManagedThreadId avant l'ACK, en plus du contrôle du core.

L'attendu exige Join réussi, thread terminé, faute injectée et capturée, aucune
exception imprévue, ainsi qu'un Run ayant déjà produit KernelQuiescent,
NaturalQuiescent, pending publication et J retenu. La gate liveness du launcher
doit rendre GuardianLostBeforeProof/SEALED=false/RESERVED=true, zéro ACK et zéro
stop explicite. La publication était en mémoire mais n'a pas été persistée ou
acknowledged par S : elle n'est pas une publication scellée.

Un timeout rend null au launcher et HOLD/exit 4 ; il ne prouve pas une mort de
thread. Les compteurs de timeout peuvent être des instantanés partiels non
atomiques. Aucun Thread.Abort, TerminateThread, kill de G ou close de J n'est
utilisé. **Perte mid-Run, crash non géré, crash natif et pertes de processus
S/G séparés restent NON ÉTABLIS.** Ce bornage a été explicitement ratifié dans
le supplément SCOPE, pas extrapolé au contrat historique complet.

### 4. `ack-mismatch-byte191`

T self-exit. Le seul slot GuardianResult reçoit un décorateur `Stream` autour
de son véritable `FileStream`. Le callback Write est appelé uniquement par le
BudgetedSink déjà débité. Il exige une unique écriture complète de 192 octets,
copie exactement 192 octets, applique `XOR 1` à l'octet 191 seulement, vérifie
une seule différence, puis appelle réellement FileStream.Write et Flush dans
ce même callback. L'entrée/source publication n'est pas modifiée. Deuxième
write, mauvaise longueur ou exception : échec, débit conservé, aucun retry.
Le décorateur refuse SetLength et n'introduit ni neuvième writer ni crédit.

WriterLedger corrigé relit les vrais octets du même FileStream ; Read/Seek
sont délégués sans substitution. SupervisorReceipt reçoit ce vrai readback
altéré et l'ACK porte ce readback, jamais une copie reconstruite de la source.
Le match byte-exact du noyau doit refuser. Attendu : une mutation complète,
une différence, 192 octets réellement relus, un ACK, HeldNoAcknowledgement,
PublicationUnacknowledged, HoldQuarantined/Quarantined, QUIET=true,
JOB_RETAINED=true, SEALED=false, RESERVED=true. RejectPublication demande son
unique stop owned, même si le Job était déjà quiescent ; cela fait partie de
l'attendu et ne constitue pas un stop demandé par le harness.

La mutation est une injection contrôlée de destination, pas un défaut observé
du système de fichiers. Les 192 octets de GuardianResult et SupervisorReceipt
devraient être identiques ; l'octet 191 devrait valoir 1, le padding source y
étant zéro dans le core gelé. Aucune garantie fsync/panne électrique n'est
établie par ce candidat.

### 5. `attestation-incoherent-length4`

Seul le tableau de transferts de l'attestation est délibérément de longueur 4
au lieu de 5. HostAttestation invalide sa forme ; HostLauncher.Coherent doit
être false et Launch doit rendre AttestationIncoherent/null, SEALED=false,
RESERVED=true, CORE_LAUNCHES=0/OWNER_CALLS=0/ACK_CALLS=0. Aucun Job/T n'est créé.
Les events/pipes/fichiers de préparation existent mais aucun transfert n'est
effectué ; leurs handles restent au harness et sont fermés par lui.

## Ressources, faits et échecs

Aucun code du harness ne reçoit ou stocke J. Les seuls appels StopJob et
Close(J) transitent du core vers le membre owner délégué. Qualification ferme
ses bouts parent de pipes et ses FileStream ; elle ne ferme les cinq transferts
qu'avant handoff ou dans le cas incohérent. La frontière est conservativement
débitée avant Launch : sur rejet exceptionnel avant adoption, des transferts
peuvent rester ouverts jusqu'à la fin du processus plutôt que risquer un double
close. Aucun accès à J après fin de processus n'est pratiqué ou proposé.

La fin du runner peut fermer le J retenu via l'OS et KILL_ON_JOB_CLOSE. Ce filet
n'est **pas** une observation du dernier close. `last-close case6 =
NOT_ESTABLISHED` reste inchangé. La réservation n'est jamais relâchée par le
launcher ou ce candidat, même lorsque le core est Sealed.

Tous les payloads de cas suivent les sinks gelés. Caps 262144 total / 4096
chunk / 114688 capture intacts, aucun crédit ou writer recréé. Seule la ligne
de faits stdout (au plus 2048 caractères, champs fixes, pas de données enfant)
est hors ledger, comme le baseline ; sa capture relève de la future gate
parent. `LOCAL_CHARGED` et `LOCAL_BUDGET_HELD` sont un snapshot local, jamais une
preuve globale. **Budget intégré cross-process = NOT_PROVEN.**

La ligne est émise après fermeture des ressources possédées de préparation et
disposal des fichiers. Une erreur de cleanup interdit les attendus complets
(CLEANUP_FAILED=true). Échec stdout : exit 3, pas de succès silencieux. Les
codes proposés sont 0 = faits attendus correspondants seulement, 2 = précondition,
3 = exception/échec de sortie, 4 = HOLD, cas non exercé, timeout ou divergence.
Exit 0, QUIET et MATRIX_HOLD=none-expected-facts-only ne valent jamais acceptation.
Les autres champs exposent les tentatives/erreurs de signal, stops, ACK, faute
thread, mutation et readback ; aucune absence d'événement n'est lavée en succès.
Stderr n'est pas consommé : `STDERR=not-observed`. L'enfant est silencieux par
construction source, pas par observation de cette livraison.

## Closure exacte pour une gate parent FUTURE, non autorisée ici

La source candidate est à compiler **dans la même assembly** que les huit
dépendances suivantes, uniquement après revue fresh, rehash et GO parent de
compilation/exécution distincts. Chemins relatifs au répertoire `v3-matrix-source` :

- `inputs/frozen/V3_CORE_ABI1_20261017/GuardV3.Contracts.cs` — 8016 B,
  `bb4758cc60d6ff32176b01b87d72ac94685729796afb3b585b0a29e6d4864709`.
- `inputs/frozen/V3_GUARDIAN_CORE_R1_OUTPUT_20261017/GuardianCore.cs` — 71132 B,
  `7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f`.
- `inputs/frozen/V3_KERNEL_OBSERVER_R1_OUTPUT_20261017/KernelObserver.cs` — 21557 B,
  `a419fc426fef0a77ed1385f04f17b7c7fffe2ca457d98fb0bdc27dad365d5284`.
- `inputs/frozen/V3_BUDGET_SOURCE_OUTPUT_R1_20261017/BudgetedEvidence.cs` — 11846 B,
  `0944a3bbf9f0599b3a748efb0fc88b41b3ba109773f951daeea4fb6470f0c80f`.
- `inputs/frozen/V3_HOST_SOURCE_OUTPUT_20261017/HostLauncher.cs` — 15729 B,
  `1cc9cca0f0d2516f40c42f6d2b421126aa7b05bef29bcbfcd3e5760c1d956a15`.
- `supplement-capture/inputs/CaptureWiring.cs` — 6029 B,
  `d08beba3b371661a1c7a12d4ddda697514556bdc2f91dc16028b0fa20cc2987f`.
- `inputs/frozen/V3_HOST_CORRECTION_OUTPUT_20261017/WriterLedger.cs` — 8889 B,
  `67e9b21c1f8ec6212fa3d21199254359770e5e0b4b56c7268567af55eb0323b0`.
  **Jamais la première version host** : TryReadBackGuardianResult est requis.
- `inputs/frozen/V3_REALNATIVE_OUTPUT_20261017/RealNative.cs` — 15934 B,
  `e58eef0c8086240e2e8296415cf6ff7e3cbce253aba1d0e4bf425728e1e26e14`.
- `outputs/RunnerMatrix.cs` — pin complet de cette livraison dans MANIFEST.json.

Sélection proposée : compilateur Framework64, `/target:winexe /platform:x64
/langversion:5 /main:ReGraph.GuardV3.RunnerMatrix`, frameworks System,
System.Core et mscorlib par défaut, sortie EXE dans un scratch parent frais.
Exclure RunnerReal, toutes les suites Tests, tous autres hôtes/writers et tout
bootstrapper. Aucun script de build ni exécutable n'est livré. Une dépendance
nouvelle doit être demandée ; elle n'est pas implicite dans cette closure.

Proposition de gate future, **aucune étape exécutée ni autorisée par ce GO source** :

1. Revue fresh disjointe sur ces sorties gelées ; parent arbitre les limites.
   Rehash des deux manifestes inputs, 14/14 + 2/2 pins et sorties. Compiler
   seulement la closure ci-dessus, conserver hash compilateur/EXE et diagnostics.
2. Environnement parent x64 Windows documenté, droits/Job nesting compatibles,
   chemins DOS locaux frais, EXE explicite, pas de sentinelle dans les arguments
   parent. Refuser tout écart de readback 0x2208/8/4GiB ; ne pas affaiblir les
   limites. Un refus OS reste une précondition/HOLD, pas une réussite de variante.
3. Une invocation détenue par le parent par cas avec deux arguments exacts,
   jamais de parallélisme de cas. Proposer une borne externe de 70000 ms et
   capture stdout bornée : son expiration échoue la qualification. Toute action
   de terminaison du runner appartient à un GO parent explicite séparé, pas à
   cette source ; elle ne peut fournir une preuve de perte G ni de last-close.
4. Conserver stdout, exit, durée, huit fichiers/tailles/SHA256 et préconditions
   sans renommer les faits en verdict. Les cas D et ACK devraient avoir 192 B
   dans GuardianResult et SupervisorReceipt, les six autres slots vides ; les
   cas S/G/attestation devraient laisser les huit slots vides sur les chemins
   attendus décrits. Écarts/ligne absente/HOLD/injection non exercée bloquent.
   Pour ACK, comparer réellement les deux fichiers et leur octet 191 ; ne pas
   accepter uniquement le booléen de la ligne.
5. Revue/adjudication parent des faits ; aucune répétition automatique, relance,
   intégration, publication, promotion ou réutilisation de tâche historique.

Les attendus de fichiers ne valent ni oracle externe déjà exécuté, ni preuve
de budget cross-process, de lease durable, de dernier close, de mid-Run G-loss
ou de processus séparés. Aucun résultat de cette future gate n'est livré ici.

## Huit ancres de vérification source

Chemins de gel ci-dessus ; numéros 1-based. Ces ancres expriment la causalité
source, pas une preuve dynamique :

1. `RunnerMatrix.cs:32-66` et `:361-395` : choix unique, enfant borné, handoff,
   cleanup puis faits ; `RunnerReal.cs:213-300` : baseline séparé et immuable.
2. `RunnerMatrix.cs:171-240` : les 14 délégations, SetEvent unique post-Resume ;
   `GuardianCore.cs:587-620,703-712` : consommation réelle S/D pendant Run.
3. `GuardianCore.cs:715-743,841-870` : stop owned, publication/HOLD,
   ForcedQuiescent distinct de NaturalQuiescent ; `RunnerMatrix.cs:474-508` :
   attendus conditionnels, pas verdict.
4. `RunnerMatrix.cs:245-309` : thread réel, Join borné, faute postRun-preACK,
   aucun ACK après perte ; `HostLauncher.cs:205-219,237-252` : liveness et
   réservation tenue ; `GuardianCore.cs:961-975` : owner-thread et ACK unique.
5. `RunnerMatrix.cs:312-349` : mutation de la seule écriture 192B/octet 191,
   vrai fichier ; `WriterLedger.cs:114-134` et `GuardianCore.cs:393-413` : vrai
   readback puis comparaison exacte.
6. `RunnerMatrix.cs:432-471` : seule attestation length=4, seul slot décoré ;
   `HostLauncher.cs:153-188,209-210` : gate avant core ; OWNER_CALLS=0 attendu.
7. `supplement-capture/inputs/CaptureWiring.cs:24-27,40-43,107-112` : interface
   réellement fournie, pump gelée et bornes ; `BudgetedEvidence.cs:119-139,
   270-297` : débit avant callback, aucun remboursement après erreur.
8. `RunnerMatrix.cs:510-603` : facts-only et cleanup limité aux ressources
   possédées, jamais J ; `supplement-capture/inputs/SCOPE.md:14-39` et
   `inputs/ORDER.md:89-96` : périmètre ratifié, G borné, pas de matrice exhaustive.

## Bornes finales et demandes restantes

Les manques initiaux de CaptureWiring ont été résolus uniquement par le
supplément explicitement autorisé et pinné. Aucune autre dépendance n'a été
inventée ou recherchée hors des paquets. Pas de nouvelle demande de contexte
pour ce candidat borné. La compilabilité n'a pas été vérifiée par compilation.
La revue fresh peut encore identifier un défaut ou un besoin d'extension : dans
ce cas HOLD et disposition parent, pas de correction/run automatique.

Toujours : budget intégré NOT_PROVEN ; last-close case6 NOT_ESTABLISHED ;
vrai D-process, multi-process S/G, perte G mid-Run/crash non géré, durée de bail,
reparse/canonique, stderr et répétabilité non prouvés. DriverLoss forcé jamais
PASS. Aucun résultat observé de ce candidat ; aucune acceptation centrale.
