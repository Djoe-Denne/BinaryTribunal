# RealNative — seam owner Win32, slice 2

Auteur frais `v3-realnative-r1`, mode NONBLIND. Source seulement : cette session n'a ni compilé ni exécuté. Aucun Job, aucun `CreateProcessW` et aucun processus T n'a été créé ici. Le parent compile et lance plus tard, gate séparée.

Livrables exacts, dans ce répertoire : `RealNative.cs`, `RunnerReal.cs`, `DESIGN.md`, `MANIFEST.json`.

Le noyau gelé n'est pas modifié. `GuardianWin32Owner` (`GuardianCore.cs:985`) reste en place et n'est pas construit par le harnais. `CoLocatedGuardianHost` (`HostLauncher.cs:83`) n'est pas utilisé : il appelle le constructeur à un argument, qui installe `GuardianWin32Owner`. Le harnais appelle `new GuardianCore(new RealNative(), new KernelObserver(), new GuardianStopwatchClock())`.

C# 5 strict. `RunnerReal` a `Check` pour les fautes de programmation et `Main` parce que le parent doit pouvoir lancer le winexe. Il n'a pas de `RunAll` : une quiescence observée n'est pas une acceptation.

## Arbitrages parent

- A accepté. `PerJobUserTimeLimit` (`BasicLimits.JobTime`) reste 0. Le flag `0x4` n'est pas posé. Le poser contredirait `LimitsMatch` (`GuardianCore.cs:319-322`) et une limite de temps nulle tuerait T.
- B accepté. Contrôleur et driver sont des `CreateEventW` manuels, non signalés, héritage 0. Le noyau ne consomme que `WaitForSingleObject` et `GetHandleInformation` (`GuardianCore.cs:598`, `:646-648`). Un vrai process D reste NOT_PROVEN. Pas de `OpenProcess`, pas de `DuplicateHandle`.
- C accepté. `ReadLimits` renvoie les flags bruts. S'ils ne sont pas exactement `0x2208`, le noyau fait `LimitRefused` avec l'erreur de l'API (0 si l'API a réussi). Le readback n'est pas corrigé.

## Structures

`RealNative` déclare, en `LayoutKind.Sequential` sans `Pack` forcé :

- `BasicLimits` 64 octets. `Flags` à l'offset 16. `ActiveProcesses` à l'offset 40. `JobTime` à l'offset 8, laissé à 0.
- `IoCounters` 48 octets, six `ulong`. C'est le bloc interne du 144, pas l'accounting.
- `ExtendedLimits` 144 = 64+48+32. `JobMemory` à l'offset 120.
- `StartupInfo` 104. `StartupInfoEx` 112. `ProcessInformation` 24.

`LayoutsMatch` exige ces tailles et ces offsets, ainsi que `IntPtr.Size == 8`. Faux : `WrongArchitecture`, erreur 0, sans appel Win32 (`GuardianCore.cs:943`).

Flags : `0x2208 = 0x8 | 0x200 | 0x2000`. Pas `0x2A08`, pas `0x3208`. Création T : `0x80404 = 0x4 | 0x400 | 0x80000`. Liste de handles : `0x20002`, trois pointeurs, 24 octets. Classe d'information des limites : 9. `STARTF_USESTDHANDLES = 0x100`.

L'accounting 48 octets et la liste de PID 72 octets restent dans `KernelObserverLayout64` (`KernelObserver.cs:14-32`). `RealNative` ne les déclare pas et n'appelle pas les classes 1 et 3. Son `QueryInformationJobObject` ne sert qu'à la classe 9.

## Droits et durées de vie

`CreateJobObjectW(NULL, NULL)` : job anonyme, descripteur de sécurité NULL, handle non héritable. Le noyau en est le propriétaire après `Install` (`GuardianCore.cs:656-657`).

T est créé suspendu. Ses handles process et thread reviennent au noyau (`GuardianCore.cs:667-685`). S'ils existent et que le nettoyage de la liste d'attributs échoue, `Created` reste vrai et la méthode renvoie faux : le noyau possède quand même les handles et pose `CreateFailed`. Les SECURITY_ATTRIBUTES de process et de thread sont NULL. `bInheritHandles` est vrai, mais la liste `0x20002` ne contient que les trois stdio. T n'hérite pas le handle du job. L'assignation `AssignProcessToJobObject` le place dans le job, une fois (`GuardianCore.cs:690-694`).

Les cinq handles transférés (event contrôleur, event driver, lecture stdin, écriture stdout, écriture stderr) deviennent la propriété du noyau dès que `Run` les installe. `RunnerReal` ne les ferme plus après un `Launch` revenu. Les bouts parents (écriture stdin, lecture stdout, lecture stderr) restent au harnais et sont fermés dans le `finally`, après la pompe de capture. Fermer deux fois un handle transféré est évité : si `HostComplete` échoue avant l'installation, ces cinq handles fuient jusqu'à la fin du process, qui les ferme sans requête ensuite. Ce n'est pas une observation de last-close.

`Close` n'est appelé par le noyau que hors borrow (`GuardianCore.cs:551-558`). Un échec devient `CloseFailed` et n'est pas retenté. Le harnais n'appelle pas `TerminateJobObject`. Seul `RealNative.StopJob` le fait, et seulement si le noyau l'appelle (`GuardianCore.cs:731-732`), avec le code `0xE0000001`. `StopUnresumedRoot` est le même code via `TerminateProcess`, uniquement si T a été créé, non assigné, et si la reprise n'a pas été tentée (`GuardianCore.cs:735-740`). Pas de `OpenProcess`.

Le job retenu par un HOLD reste ouvert dans le process du harnais. La fin de ce process ferme les handles encore ouverts, y compris J si le noyau l'a gardé. Aucune requête n'est faite après cette fermeture. `KILL_ON_JOB_CLOSE` peut alors agir comme filet d'OS. Ce n'est pas le cas 6. last-close reste NOT_ESTABLISHED.

La réservation durable n'est pas relâchée, même si la phase est `Sealed`.

## Mappage des 14 membres

Chaque échec Win32 lit `GetLastError` tout de suite. Une exception dans `CreateSuspended` devient l'erreur 8 et n'avale pas un process déjà créé.

1. `PointerBytes` — pas de P/Invoke, `IntPtr.Size`. Conso `GuardianCore.cs:925-926`. Différent de 8 : `WrongArchitecture`, aucun appel Win32.
2. `LayoutsMatch` — `Marshal.SizeOf` / `OffsetOf` seulement. Conso `:943`. Faux : `WrongArchitecture`, erreur 0.
3. `CreateJob` — `CreateJobObjectW(NULL, NULL)`. Conso `:656-657`. Handle non installable : `CreateFailed` plus l'erreur. Échec : `IntPtr.Zero` et `GetLastError`.
4. `SetLimits` — `SetInformationJobObject`, classe 9, 144 octets, flags `0x2208`, actifs 8, mémoire `4294967296`, temps de job 0 sans flag `0x4`. Conso `:659-661`. Faux : `LimitRefused`.
5. `ReadLimits` — `QueryInformationJobObject`, classe 9, 144 octets, champs bruts. Conso `:637-639` et second `CheckLimits` à `:701`. API fausse : `LimitRefused` plus l'erreur. API vraie hors `144 / 0x2208 / 8 / 4294967296` (`:319-322`) : `LimitRefused`, erreur 0. Pas de correction du readback.
6. `GetInheritance` — `GetHandleInformation`. Conso `:646-648`. Attendu exact : transferts 0 et 1 = 0, transferts 2 à 4 = 1 (`:653`) ; job = 0 (`:658`) ; process et thread de T = 0 (`:687`). Écart ou API fausse : `InvalidLease`.
7. `CreateSuspended` — sonde `InitializeProcThreadAttributeList` (erreur 122), `UpdateProcThreadAttribute(0x20002)`, `CreateProcessW` avec `0x80404`, héritage vrai, stdio seuls dans la liste, `STARTUPINFOEX` 112. Conso `:667-685`. Échec de création : faux, `Created` faux, `GetLastError`. Sonde hors 122 : erreur 87 ou l'erreur vue. Nettoyage raté après création : erreur 8, `Created` reste vrai. PID ou TID nul : `CreateFailed` à `:680`.
8. `Assign` — `AssignProcessToJobObject`, un appel. Conso `:690-694`. Faux : `AssignFailed`. Pas de second essai.
9. `IsMember` — `IsProcessInJob(process, job, out member)`. Conso `:698-700`. API fausse ou `member` faux : `MembershipFailed`. `member` n'est pas forcé.
10. `Resume` — `ResumeThread`. Conso `:704` et `:709`. Seul un compte précédent de 1 est accepté. `0xFFFFFFFF` : `GetLastError`. Un autre compte avec API réussie : ce compte, erreur 0. Un seul appel.
11. `WaitControl` — `WaitForSingleObject`. Au-dessus de 100 ms : `Failed`, erreur 87, sans appel. Conso `:598`, tenue par le noyau à `:603` et `:609`. 0 : `Signaled`. 258 : `Timeout`, erreur 0, sans Hold. `0xFFFFFFFF` : `Failed` plus `GetLastError`. Autre : `Failed`, erreur 0. Contrôleur signalé : `ControllerLost` permanent. Driver signalé : `DriverLost` non permanent. Échec d'attente : Hold permanent.
12. `StopJob` — `TerminateJobObject(job, 0xE0000001)`, une fois. Conso `:731-732`. Faux : `InternalFailure`. Le harnais ne l'appelle pas.
13. `StopUnresumedRoot` — `TerminateProcess(process, 0xE0000001)`. Conso `:735-740`. Faux : `InternalFailure`. Pas de `OpenProcess`.
14. `Close` — `CloseHandle`. Conso `:551-558`. Borrow actif : le noyau pose `InvalidBorrow` et n'appelle pas. Faux : `CloseFailed`, pas de retry.

## T

T est le même winexe, pas un binaire système. `0x80404` ne contient pas `CREATE_NO_WINDOW`. Un exécutable console ferait entrer `conhost` dans le job et laisserait `AutoRun` possible.

`Main` voit l'argument exact `re-graph-v3-self-exit` et appelle `Environment.Exit(0)` avant tout Job. Pas de console, pas d'enfant, code 0. `TotalProcesses` cumulatif 1 est admis. La quiescence demandée par le noyau est `Active = Assigned = InList = 0` après fermeture des handles racine.

La ligne de commande est le chemin quoté de l'exe, un espace, puis la sentinelle. `lpApplicationName` est le chemin nu, qui doit passer `DosPath` et finir par `.exe`.

## Ordre de RunnerReal

Un seul fil.

0. Sentinelle dans les arguments : `Environment.Exit(0)`. Le parent ne doit pas passer cette sentinelle ; seul T la reçoit.
1. Refus si `IntPtr.Size != 8`, si l'argument unique n'est pas un `DosPath`, ou si ce chemin est un fichier. Le répertoire de cas est créé s'il manque.
2. Huit `FileStream` `CreateNew`, `ReadWrite`, buffer 4096, un par `EvidenceSlot` dans l'ordre de l'enum : `control-files.bin`, `fixture-markers.bin`, `captured-streams.bin`, `guardian-evidence.bin`, `driver-evidence.bin`, `guardian-result.bin`, `supervisor-result.bin`, `supervisor-receipt.bin`.
3. Deux events non signalés, héritage 0. Trois `CreatePipe` de 4096 octets. Bouts enfant : flag exactement 1. Bouts parent : flag exactement 0. `SetHandleInformation` ne masque que le bit d'héritage. Si le dword de flags n'est pas exactement 0 ou 1, précondition `flag`, erreur traitée comme 0, sans correction des autres bits.
4. Attestation fraîche : nonce 32 octets en hex minuscule, epoch `UtcNow.Ticks`, pins SHA-256 hex. Image = hash du fichier exe, lu par blocs de 4096, sans l'exécuter. Bloc d'environnement : une entrée `PATH=C:\Windows\System32` terminée par deux NUL.
5. `HostLauncher` reçoit `RealNativeProcessHost`. Tant que `Coherent` est faux, `Launch` n'est pas appelé.
6. `Launch` enchaîne `Run`, la pompe de capture jusqu'à EOF, l'écriture des 192 octets, `TryReadBackGuardianResult` depuis la destination, le receipt, puis un seul `Acknowledge`. L'ACK n'est pas une copie du buffer source.
7. Une ligne stdout : `STATE PHASE HOLD OUTCOME QUIET JOB_RETAINED SEALED RESERVED`. Exit 0 = cette ligne a été écrite. Exit 2 = précondition (`STATE=precondition CODE=...`). Exit 3 = exception, ligne `STATE=exception`, sans message d'exception. La réservation n'est pas relâchée.

La capture est la lecture stdout, par `ReadFile` synchrone (`lpOverlapped` NULL). Ce n'est pas un IOCP. `ERROR_BROKEN_PIPE` (109) ou une lecture de 0 octet établit l'EOF. Un stdout vide avec EOF est une capture terminée, pas un zéro fabriqué. stderr n'est pas capturé : son absence dans le ledger ne dit pas qu'il était vide. T ne doit rien écrire. Les octets stderr non lus sont inconnus, pas comptés à zéro.

Les caps restent ceux de `CaseBudgetV3` : total 262144, chunk 4096, flux capturés 114688. Le harnais n'ajoute pas de neuvième writer de cas. La ligne de faits va sur stdout, hors quota.

## Préconditions du parent pour la slice 2

Cette liste est le contrat d'exécution du parent. Elle n'autorise pas cette session à compiler ou à lancer.

- Windows x64 capable de `JOB_OBJECT_LIMIT_JOB_MEMORY`. Process 64 bits. Le parent compile avec `csc /nologo /target:winexe /platform:x64 /langversion:5`. Un AnyCPU 32 bits échoue la précondition `architecture`.
- Closure, gels intouchés, re-hash avant compilation : `GuardV3.Contracts.cs`, `GuardianCore.cs`, `KernelObserver.cs`, le `BudgetedEvidence.cs` déjà admis (pin historique `0944a3bb`, à re-vérifier par le parent), `HostLauncher.cs`, `CaptureWiring.cs`, le `WriterLedger.cs` du correctif readback, puis `RealNative.cs` et `RunnerReal.cs`. Ne pas inclure les tests. Ne pas prendre un `WriterLedger` sans `TryReadBackGuardianResult`.
- Lancer `RunnerReal.exe` avec un seul argument : répertoire de cas frais, `DosPath`, lecteur local. Stdout du winexe redirigé par le parent. Le process ne doit pas déjà être dans un job non imbriquable, sinon `Assign` échoue.
- L'égalité `LimitFlags == 0x2208` au readback est une précondition d'OS. Un bit en plus donne `LimitRefused`, erreur 0.
- Le parent capture stdout, le code de sortie et les huit fichiers. Exit 0 et `QUIET=true` ne sont pas une acceptation. `AcknowledgedSealed` non plus : l'outcome et le premier Hold restent les faits.
- Le parent re-hash le noyau gelé après l'écriture de ces livrables. Il doit être identique aux pins d'entrée.

## NOT_PROVEN

- last-close NOT_ESTABLISHED. Aucune requête après le dernier close de J. La fin du process n'est pas cette preuve.
- Process D réel NOT_PROVEN. Les stands-in sont des events.
- Multi-process S/G NOT_PROVEN. S et G sont co-localisés.
- Budget intégré cross-process NOT_PROVEN.
- Durée de lease durable NOT_PROVEN. L'objet de réservation et les fichiers ne sont pas un protocole de libération.
- Chemin reparse ou canonique NOT_PROVEN. `DosPath` est syntaxique.
- Matrice S-loss, D-loss, G-loss non exercée.
- Égalité du readback `0x2208` non prouvée tant que le parent n'a pas exécuté.
- stderr non collecté : inconnu, pas un zéro mesuré.
