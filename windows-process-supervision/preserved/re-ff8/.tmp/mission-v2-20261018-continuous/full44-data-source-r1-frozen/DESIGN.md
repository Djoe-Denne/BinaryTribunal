# DESIGN — GenericTargetPlan.cs (source DATA_ONLY proposée)

Auteur : `full44-q1-data-author-r1`, tâche `task_mvdy1o3t_000j_oo31db`
(team `mission-a58a462638c0db92`). Date : 2026-10-18.
Statut : **SOURCE PROPOSÉE, NONBLIND, non compilée, non exécutée**. Le parent
seul V-fresh, compile, exécute et intègre. Le présent fichier décrit la source
proposée `GenericTargetPlan.cs` (même dossier) ; il n'exécute rien et ne
ratifie rien.

Autorités appliquées, rehashées intactes avant écriture :

- `FULL44_Q1_API_FIXED_R1.md` (API fixée E1–E10), 10596 B,
  sha256 `d84313a6741998985c0acedf2a3d8ea49fbf485b53d424ef869d6670444c9a41` ;
- `../inputs/INPUT_MANIFEST.json` (enveloppe), 2830 B,
  sha256 `c5340417f5270049fbd8ba0ae6dd40e9d45aeb12f8dd648f8e3d7eb8dcaac6e3` ;
- 9 pins du paquet, 150960 B, 9/9 exacts (voir MANIFEST.json).

## 1. Périmètre et exclusions

Namespace sibling `ReGraph.GuardV3`, .NET4/C#4 strict (pas d'auto-propriétés
C#6, pas d'expression-bodied, pas d'interpolation, pas de `nameof`). Pure
donnée : aucun IO, Process, PInvoke, Stream, Thread, réseau, horloge, Job,
fichier. SHA256 mémoire et UTF-8 strict seulement. Fichiers gelés réutilisés
en lecture seule dans la même assembly (E9) : `CaseIdentity`,
`GuardV3Contract`, `GuardianPredicates`, `GuardianMemoryEvidence` — aucune
édition, aucun contournement par reflection, aucun accès au core/owner/native
au runtime de QA pure. Aucune implémentation broker/Job/IO/kernel/launch ; le
codec n'est ni un writer ni un débit runtime. Une valeur validée ici est
DATA_ONLY : jamais trusted authority, lease, proof ou pin OS acquis.

## 2. Décisions E1–E10 appliquées (FULL44_Q1_API_FIXED_R1.md)

| Décision | Application dans la source |
|---|---|
| E1 | `GenericPlanReservationBinding` = `{ReservationSha256, ReservationEpoch>0}`, label immuable, validé `HexPin` + epoch>0 (`BadReservationBinding`). |
| E2 | `GenericOwnershipRootBinding` = `{BindingLabel, BindingSha256, BindingEpoch>0}` ; tableau ≤16 (`MaxOwnershipRootBindings`), labels distincts **Ordinal**, ≥1 élément (E10). Aucun handle/lease/droit OS depuis ces champs. |
| E3 | `GenericSourcePin` = `{PathLabel, Bytes, Sha256}` ; labels distincts Ordinal ; SHA répété permis (mêmes bytes sous labels distincts) ; Bytes `0..int.MaxValue` ; labels ≤259 par `PlainBounded` (pas de contrôles/NUL/surrogate invalide) ; labels = données de provenance, jamais preuve filesystem. |
| E4 | `StrictUtf8 = new UTF8Encoding(false, true)` : UTF-8 strict sans BOM, erreur sur surrogate isolé. Les bornes natives argv/env restent des **unités UTF16** (comparées sur `string.Length`). |
| E5 | `WindowsCommandLine`/`EnvironmentBlock` exclus du record canonique ; calculés seulement depuis vecteurs + IDs de codecs bindés. `IntentSha256 = SHA256(record)` en hex64 minuscule ; aucun `IntentSha256` en input, aucune auto-référence. |
| E6 | Pas de sous-cap 8192. `AdditionalControlArtifacts` tableau obligatoire (vide permis), deep-copié, ≤16 éléments non-null, chaque `byte[]` ≤32768. Le record lie chaque artifact par `u32LE(len)+raw32(SHA256)` ; les bytes d'artifacts ne sont PAS embarqués (pas de double crédit). `ControlFileByteCount = canonical.Length + Σ artifact.Length` vérifié **dans TryBuild** contre `GuardV3Contract.MaxControlFileBytes` (32768). Une liste vide/partielle ne prouve jamais l'inventaire hôte complet. |
| E7 | Bornes data : env 4096, allowlist 4096, pins 64, roots 16, labels 259, args 128, bytes source `0..int.MaxValue`, artifacts 16. Aucune hausse des caps/Q1. |
| E8 | Pin d'image explicite requis : exactement un pin avec label **Ordinal** égal à `TargetImagePath`, son `Sha256` **Ordinal** égal à `TargetImageSha256` et `Bytes>0` — vérification de données seulement, aucun hash d'image réel prétendu. |
| E9 | Prédicats gelés `GuardianPredicates` appelés tels quels (même assembly) ; closure parent mono-assembly = V3 gelé connu + cette source (+ QA) après V fresh. |
| E10 | `QualificationMode` requis, valeurs C01..C14 (1..14) ; pins ≥1 ; roots ≥1 ; `TimeProfileId` = const `V3-Q1` (pas un input). |

## 3. Codec argv `win-quote-v1`

`TryEncodeWindowsArgument(argument, out encoded)` : refus unique = argument
null (output null). **L'argument vide est encodable** : `""` → `""`.
Sinon : quote exigée ssi l'argument contient un espace (U+0020) ou un `"` ;
dans ce cas, entre quotes :

- n backslashes consécutifs suivis d'un `"` → `2n+1` backslashes puis un
  caractère `"` (quote littérale à l'intérieur de la région quotée) ;
- n backslashes consécutifs en fin d'argument → `2n` backslashes (la quote
  finale unique est ajoutée après la boucle) ;
- sinon backslashes inchangés ; un `"` isolé (n=0) → `\"`.

Un argument avec backslash mais **sans espace ni quote reste NON QUOTÉ** et
inchangé (ex. `a\` → `a\`). Exemples de référence : `""`→`""` ; `a b`→`"a b"` ;
`a"b`→`"a\"b"` ; `a\`→`a\` (non quoté) ; `a b\`→`"a b\\"` ; `a\"`→`"a\\\""` ;
`"`→`"\""`.

`TryEncodeWindowsCommandLine(argv, out commandLine)` : refuse array null/vide/
élément null ; joint les encodages par espace unique. NUL éventuel passe au
codec verbatim (codec indépendant de la politique) — mais TryBuild refuse de
tels arguments via `PlainBounded` **avant** l'encodage, donc le command line
d'un plan n'a jamais NUL. Seul TryBuild lie `argv[0]` à l'image DOS `.exe`
exacte (Ordinal).

**Politique fermée Q1 (TryBuild seulement)** : refus `BadArgv` pour argument
exactement égal (Ordinal) à `--preload`/`--require`/`--watch`/`--hot`/
`--env-file` ou de forme `flag=value` (préfixe `flag=`) ; et `-r` refusé
**seulement** sous la forme `-r=value` (préfixe `-r=`), lecture littérale du
motif ratifié « avec forme `-r=value` seulement » — le `-r` nu passe la
politique. Aucun balayage substring sur les valeurs ; `--no-env-file` est
permis (ni exact ni préfixe `--env-file=`). Ceci est un profil de données
ratifié, pas une preuve qu'un target inconnu ignorerait d'autres options.

## 4. Codec env `win-env-v1`, allowlist, politique fermée

`TryEncodeEnvironmentBlock(entries, out block)` : refuse array null, élément
null, entrée sans `=` ou à nom vide, entrée hors `PlainBounded(entry, 32765)`
(contrôles/NUL/surrogate invalide — bornes core) ; **trie par nom
OrdinalIgnoreCase** (liste caller non triée NON refusée — canonicalisation) ;
doublons ignore-case refusés via ordre strictement croissant ; valeurs vides
permises ; bloc = `entry+'\0'` chacun puis `'\0'` final ; bloc ∈
[2, `MaxEnvironmentBlockUnits`=32767] unités UTF16 ; env vide encode
exactement deux NUL.

TryBuild ajoute : `AllowedEnvironmentNames` explicite (jamais
`Environment.Get*`), ≤4096 noms, forme ASCII `[A-Za-z_][A-Za-z0-9_]*`, chaque
nom ≤259, pas de doublon ignore-case, refus `BadEnvironmentAllowlist` (18) des
noms fermés `NODE_OPTIONS`/`BUN_OPTIONS`/`NODE_PATH`/`FF8_ENSEMBLE_SOURCE`
ignore-case **même déclarés** ; chaque entrée doit être allowlistée
(ignore-case) sinon `BadEnvironmentEntries` (9) ; aucune entrée injectée ni
environnement hérité. Le plan conserve l'allowlist **triée/copiée** (et les
entries triées — ordre d'entrée effacé de l'objet, voir §5).

## 5. Encodage canonique `gtplan-canonical-v1`

Primitives : `u32LE` (LE), `i64LE` (LE, via `unchecked((ulong)v)` + Put64),
`countedUtf8(s) = u32LE(byteCount) + UTF8strict(s)` (sans BOM, sans
terminateur). Ordre exact du record (layout parent, inchangé) :

```
"GTPL"(4B) | u32LE(1)
countedUtf8(Version="generic-t-dual-1"), countedUtf8("win-quote-v1"), countedUtf8("win-env-v1")
countedUtf8(NonceHex) | i64LE(Epoch) | countedUtf8(LeaseReceiptSha256)
countedUtf8(ReservationSha256) | i64LE(ReservationEpoch)
countedUtf8(TargetImagePath) | countedUtf8(TargetImageSha256)
u32LE(argc) | argc × countedUtf8(arg) | countedUtf8(WorkingDirectory)
u32LE(envCount) | envCount × countedUtf8(sortedEntry)
u32LE(allowedNameCount) | allowedNameCount × countedUtf8(sortedAllowedName)
u32LE(pinCount) | pinCount × (countedUtf8(label) | i64LE(bytes) | countedUtf8(sha))
countedUtf8(LedgerPlanSha256) | countedUtf8(TimeProfileId="V3-Q1") | u32LE(mode)
u32LE(rootCount) | rootCount × (countedUtf8(label) | countedUtf8(sha) | i64LE(epoch))
u32LE(additionalCount) | additionalCount × (u32LE(actualLen) | raw32(SHA256(actualBytes)))
```

- **Sans self-reference** : le record n'inclut ni `IntentSha256` ni les
  dérivés (`WindowsCommandLine`/`EnvironmentBlock`, exclus — E5) ; rien du
  record ne dépend du hash de ce record.
- **Ordres** : entries et allowlist encodées **triées** (ordre caller effacé) ;
  pins/roots/artifacts encodés dans l'**ordre d'entrée, préservés et liés**,
  jamais triés silencieusement.
- **Comptage sans double crédit** : deux passes (mesure exacte puis
  remplissage) ; cap agrégé vérifié AVANT allocation ; `filled == measured`
  vérifié après remplissage ; `ControlFileByteCount` = `canonical.Length`
  (qui inclut la table de métadonnées artifacts) + Σ bytes d'artifacts
  (chaque ensemble compté **une fois**). Le plan expose les **bytes exacts**
  (`GetCanonicalEncoding`), jamais un entier séparé des bytes ;
  `CanonicalByteCount` == `GetCanonicalEncoding().Length` par construction.
- **Déterminisme** : deux encodages d'un même plan sont byte-identiques ;
  `TryEncodeCanonical(plan)` reproduit les bytes stockés, re-encode les
  dérivés et vérifie l'égalité Ordinal avec `plan.WindowsCommandLine`,
  `plan.EnvironmentBlock` et `plan.IntentSha256` — tout écart =
  `InternalEncodingFailure`, jamais un succès.
- Aucun IO/Stream/OS : tout en mémoire, arithmétique vérifiée, exceptions de
  hash/encodage converties en `InternalEncodingFailure` (jamais en succès).

## 6. Ordre TryBuild et matrice des refus (premier code gagne)

| # | Code | Déclencheurs (ordre interne gelé) |
|---|---|---|
| 1 | `NullInput=1` | input null |
| 2 | `BadIdentity=2` | `Identity` null (la validité nonce/epoch est garantie par le ctor gelé de `CaseIdentity`) |
| 3 | `BadPin=3` | `LeaseReceiptSha256` puis `TargetImageSha256` null/hors hex64 minuscule |
| 4 | `BadLedgerPlanPin=4` | `LedgerPlanSha256` null/hors hex64 |
| 5 | `BadTargetPath=5` | image null, hors `DosPath`, ou suffixe `.exe` absent (OrdinalIgnoreCase) |
| 6 | `BadArgv=6` | argv null/vide/>128 ; élément null ; `argv[0] != TargetImagePath` (Ordinal) ; arg nonvide hors `PlainBounded(arg, 32766)` (NUL/contrôles/surrogate invalide) ; politique fermée flags (§3) |
| 7 | `BadCommandLine=7` | jointure codec échouée (déjà couverte par 6) ou `PlainBounded(≤32766)` sur la chaîne jointe (dépassement) |
| 8 | `BadWorkingDirectory=8` | cwd null ou hors `DosPath` |
| 9 | `BadEnvironmentAllowlist=18` | allowlist null/>4096 ; nom null, hors forme ASCII ou >259 ; nom fermé Q1 ; doublon ignore-case |
| 10 | `BadEnvironmentEntries=9` | entries null/>4096 ; élément null ; sans `=` ou nom vide ; hors `PlainBounded(entry, 32765)` ; nom non allowlisté ; doublon ignore-case |
| 11 | `BadEnvironmentBlock=10` | codec env échoué (dépassement 32767 en pratique) ou prédicat core `EnvironmentBlock` refusé |
| 12 | `BadReservationBinding=11` | binding null ; `ReservationSha256` hors hex64 ; epoch ≤0 |
| 13 | `BadSourcePins=12` | pins null/0/>64 ; élément null ; label hors `PlainBounded(≤259)` ; Bytes hors [0, int.MaxValue] ; sha hors hex64 ; label dupliqué (Ordinal) ; pin d'image absent, sha image inégal ou Bytes≤0 (E8) |
| 14 | `BadOwnershipRootBindings=13` | roots null/0/>16 ; élément null ; label hors `PlainBounded(≤259)` ; sha hors hex64 ; epoch ≤0 ; label dupliqué (Ordinal) |
| 15 | `BadQualificationMode=14` | valeur entière hors 1..14 |
| 16 | `BadControlArtifacts=17` | artifacts null/>16 ; élément null ; `byte[]` >32768 |
| 17 | `ControlBudgetExceeded=15` | `canonical.Length + Σ artifacts` > 32768, vérifié dans TryBuild avant allocation |
| 18 | `InternalEncodingFailure=16` | exception hash/encodage, écart measure/fill, ou incohérence défensive de ré-encodage |

Sorties d'échec gelées : TryBuild → `plan=null, refusal≠None` ; succès →
`refusal=None`. Codecs string → output null sur false ;
`TryEncodeCanonical` → canonical null + refusal≠None sur false ;
`TryCountControlFiles` → `totalBytes=0` sur false, somme des arrays réellement
fournis, refuse null/array null/élément null/somme >32768, ne prétend jamais
que l'inventaire est complet. Les exceptions de ressources/outage ne créent
jamais de plan partiellement valide.

## 7. Copies défensives et immutabilité

TryBuild copie chaque champ une fois à l'entrée (snapshot) : `string[]`
copiés élément par élément (chaînes immutables partagées), tableaux de DTOs
recopiés (DTOs immuables à champs readonly), `byte[][]` **deep-copié**
(`Clone()` par élément). Getters de tableaux → copie fraîche à CHAQUE accès,
y compris bytes imbriqués (`GetAdditionalControlArtifacts`). `CaseIdentity`
est le type gelé immuable, stocké par référence. Aucune mutation possible
d'un plan construit ; `TryEncodeCanonical` opère sur les copies des getters
(contenu identique). La mutation de `GenericTargetPlanInput` après TryBuild
n'a aucun effet ; sa mutation concurrente pendant l'appel est hors contrat
(appel mono-thread documenté).

## 8. Non fourni / obligations futures du trusted host

Cette slice ne fournit PAS : broker, ledger runtime, permits, pumps, Job,
handles, CreateProcess, launch, stdin/stdout wiring, readback/ACK, ledger
plan concret, OWNER/lease/ledger/registry réels. Les vérifications de
chemin sont **syntaxiques** : canonicité, non-reparse, hash réel de l'image,
ownership et inventaire physique complet restent des obligations futures du
trusted host parent. Un plan accepté (refusal=None) n'autorise aucun
lancement. Aucun champ inconnu n'est promu en capacité ; aucun contrat native
inventé ; aucun widening du loader produit ; CaseIdentity/core inchangés.

## 9. Limites ratifiées et inchangées

Q1 seul : setup 5000 / normal 20000 / cleanup 30000 / total 55000 ms
(`GuardV3Contract`, inchangés) ; `TimeProfileId` const `V3-Q1` ; le profil
`T-FULL44-TIME-PROPOSAL-1` (125 s) reste non ratifié et absent de cette
source. Evidence 262144 / capture 114688 / control 32768 inchangés — la
source ne les modifie pas et ne prétend pas les étendre ; les caps Q1 et
l'inventaire full44 restent à ratifier ailleurs. Aucun run01/live/FF8/G5–G7,
aucune adoption L8, aucun 000d/full44 ; gates V fresh, compile et
qualification parent restent distinctes et à venir.

## 10. Ancres vérifiables

- **D1** `FULL44_Q1_API_FIXED_R1.md:8-63` — décisions E1–E10 + corrections argv/env/politique fermée.
- **D2** `FULL44_Q1_API_FIXED_R1.md:65-148` — surface C#4 exacte, ordre TryBuild, sorties d'échec.
- **D3** `FULL44_Q1_API_FIXED_R1.md:150-174` — layout canonique + comptage agrégé + frontière QA.
- **D4** `../inputs/RATIFICATION.md:22-31` — caps Q1/evidence/contrôle inchangés, ensemble compté sans double crédit.
- **D5** `../inputs/RATIFICATION.md:32-42` — contrat slice : identity/argv/env/pins, syntaxique seulement.
- **D6** `../inputs/contracts/GENERIC_T_CONTRACT.md:31-58` — champs `GenericTargetPlanV1` et bornes.
- **D7** `../inputs/reference/GuardianCore.cs:223-274` — prédicats gelés réutilisés (`PlainBounded/DosPath/EnvironmentBlock/HexPin`).
- **D8** `../inputs/reference/BudgetedEvidence.cs:119-137` — caps/precharge/no-refund (modèle du comptage).
