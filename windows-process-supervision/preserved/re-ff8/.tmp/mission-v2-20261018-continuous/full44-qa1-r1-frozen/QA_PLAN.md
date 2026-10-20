# QA_PLAN.md — QA1 source C#4 indépendante (source proposée, DATA_ONLY, aucune exécution)

Date : 2026-10-18. Rôle : `full44-Q1-independent-Csharp4-test-source`, tâche
`task_mvdz6yfe_001n_m472ji`, équipe `mission-a58a462638c0db92`. GO source reçu après
adjudication du plan `result_mvdzsw8a_0026_t56hi4` (P1–P7 tranchés) et lecture des
corrections persistées : `FULL44_QA1_PLAN_ADJUDICATION.md` (4157 B,
`77a0e50e7e8e9a2bf827fa07c1dc2167de89af18713113b543951dfcac6204d1`) et
`FULL44_Q1_API_R3_MEMBERSHIP_AND_NULL.md` (1474 B,
`6f31ec7a480e734edf2486c9e4688e2d889196eedbd9faa8cdac7747ace5cd26`), lues intégralement.
Ceci est une **source de tests proposée** : pas de compilation, pas d'exécution, pas de
couverture exécutée, pas d'acceptation candidate, pas de clôture.

## 1. Ack intégrité et NONBLIND

- Paquet `full44-q1-qa1/inputs` : **15 pins, 215401 B, 15/15 SHA256 exacts** (rehash
  local complet), aucune mutation depuis la déclaration parent.
- **Digest du paquet** : SHA-256 des bytes RAW de `inputs/INPUT_MANIFEST.json` =
  `473432b406b4110ca671dfadcd1fc1cdd6f2b8413d7b32a0a5860aa3f1afc403` — recomputé
  localement, **match exact** (même convention que QA0/U1 : digest du manifeste, jamais
  SHA384 ; aucune recette de concat des pins).
- `GOLDEN_DATA.json` : **4414 B**, `9dfa126f31750042cda8be6b47eea2c8f94f64dd1464eb72c86706f9766ebf09`
  (pin `inputs/GOLDEN_DATA.json` et copie top-level identiques, vérifiés).
- **Golden 862 B décodé indépendamment** (data-only, même catégorie que le rehash QA0)
  : layout `gtplan-canonical-v1` vérifié champ par champ contre la fixture — `GTPL|1`,
  Version `generic-t-dual-1`, `win-quote-v1`, `win-env-v1`, NonceHex 64×`'1'`, epochs 7,
  lease `936388aa…5eb`, réservation `2222…222`, image `C:\Q\app.exe` + `3333…333`,
  cwd `C:\Q`, argc 4 avec `""` encodable et `b\"c`, env trié `A=1,B=2`, allowlist triée
  `A,B`, pin image label=image Bytes=10, ledger `cf0398f0…66a`, TimeProfile `V3-Q1`,
  mode 1, root `fixture-root`/7, 4 artifacts `OWNER fixture`/`lease control`/
  `ledger control`/`registry fixture` (13/13/14/16 B, somme 56, controlFileBytes
  862+56 = **918**). **SHA256(record) recomputé indépendamment = `c404dcf72229ed1a11ce51da433ae5889b8d64059bd3927c63ab6b70f66b39cf`
  = `intentSha256` golden, match exact.** Les 4 raw32 de la table = SHA256 recomputés
  des bytes d'artifacts, match exact. Offsets ancrés pour les assertions ciblées :
  mode u32LE@614, additionalCount u32LE@714, `artifact[i]` length@718+36i,
  sha32@722+36i, **artifact[3] : length@826, sha32@830** ; path length@278, argv0
  length@362, pin0 label length@441, pin1 label length@533/chars@537.
- **NONBLIND** : lus = les 15 pins + les 2 suppléments autorisés ci-dessus +
  `PARENT_ACCESS_RECEIPT.json` du paquet. **Non lus** : `GenericTargetPlan.cs` /
  `DESIGN.md` de l'auteur, origins, production, outputs d'autres workers. Aucun
  compile/run/validateur/import produit/git/registre/IDA/live/réseau/DB/team tools ;
  aucun claim/complete.

## 2. Architecture de la source proposée (`outputs/GenericTargetPlanTests.cs`)

- Namespace `ReGraph.GuardV3`, `internal static class GenericTargetPlanTests`, entry
  **`internal static int Main(string[] args)`** pour un futur `csc /main` explicite
  parent. C#4/.NET4 strict : pas de framework de test, pas de C#6+ (pas d'interpolation,
  pas de `?.`, pas d'auto-properties readonly), pas d'`unsafe`, pas de `stackalloc`,
  pas de réflexion ; **heap-only** (tout buffer `byte[]`/`string` sur le tas) ;
  usings `System`, `System.Security.Cryptography`, `System.Text` (mscorlib uniquement).
- **SHA-256 = bibliothèque standard `System.Security.Cryptography.SHA256Managed`**
  (`ComputeHash(byte[])`, mémoire seule, `using`/dispose déterministe) — **aucune
  implémentation crypto maison** (correction 1). Le golden/intent littéral reste
  indépendant du codec produit ; la bibliothèque standard n'est pas une faiblesse
  d'indépendance.
- **Golden et données de test embarqués dans la source** (recordHex 862 B en littéral,
  fixture complète, intent, 918/56, recette padding) — les tests ne lisent jamais le
  JSON au runtime ; aucun File/Stream/Process/PInvoke/Job/OS/Thread/clock/env/réseau/DB.
- **Console ≤ 1024 B tout inclus** (tags d'échec, newlines, tag `TRUNC`, summary) :
  budget compté par émission ; place du tag (6 B) et du summary (≤ 23 B) **réservée
  avant consommation** des tags ; summary final `PASS a=N` ou `FAIL a=N f=M` ;
  `return 0` si toutes les assertions sont vraies, `1` sinon. Le run est **parent
  seul**, sous gates distinctes ; la console n'est que le rapport court de cette suite
  après gate parent, pas un writer full44 qualifié.
- Groupes **T01–T12, 336 assertions comptées** (aucun id complet dupliqué) ; helpers
  `BuildOk`/`BuildRefusal`/`EncArg`/`EncArgRefuse`/`EncCmd`/`EncCmdRefuse`/
  `EncEnv`/`EncEnvRefuse`/`CountOk`/`CountRefuse`/`ChkArgThrow`. Les négatifs partent
  d'une fixture valide et **mutent UN champ à la fois** ; chaque négatif passe réellement
  ses guards antérieurs (audit §5). Les positifs additionnels sont des fixtures
  coordonnées déclarées, jamais une mutation silencieuse.

## 3. Matrice d'oracles T01–T12 (extraits exacts ; source = référence exécutable)

| Groupe | Contenu | Oracle |
|---|---|---|
| T01 | Constantes fixées | 5 ids/constantes contrat (`generic-t-dual-1`, `V3-Q1`, `win-quote-v1`, `win-env-v1`, `gtplan-canonical-v1`), 8 caps E7, C01..C14=1..14 exhaustif, refusals 0..18 exhaustif ; **aucun champ TimeProfile/Intent/Version en input** — constants/dérivés seulement |
| T02 | Self-check oracle | `SHA256(golden embarqué) == c404dcf…` + longueur 862 + 862+56=918 + SHA256(vide)=`e3b0c442…b855` + recette padding 862+40+{31865,31866,31867}={32767,32768,32769} — **avant tout appel codec** |
| T03 | Codec argv positifs | QA0-R2 exacts : A01–A11, A15 (littéraux 12/15/18/20/17/20/22/17/21/19/16/28) + `TryEncodeWindowsArgument` pour chaque règle R1–R5 + primitives **sans politique** : `-r`, `--preload`, `--preload=x` inchangés/quotés selon quote-only + A13 (32766 exact, x×32753) + R07 (128 args, longueur exacte 539, pattern `a{i}`) |
| T04 | Codec argv refusals | R01 NUL, R02 tab, R03 LF, R04 surrogate haute seule, R04b basse seule, R06 0 args, R05/R08 129 args (simple + pattern), R09 cmd 32767, NUL via command line — output string null sur false |
| T05 | Codec env positifs | A01 vide → `␀␀` (2), A02 identité (19), A03a/b/c tri encodeur (9), A11 (5), A16 (**25**, delta R2), A12 bloc 32767 exact codec-only, `C=3` accepté (codec sans politique allowlist) |
| T06 | Codec env refusals | A04/A04b doublon ignore-case, A05 sans `=`, A06 `=`@0, A07 entrée vide, A08 tab, A09 NUL, A10 surrogate seule, A13 bloc 32768, A14 entrée 32767>32765 |
| T07 | Golden TryBuild positif | refusal `None` ; getters exacts (Version, TimeProfileId `V3-Q1`, **IntentSha256 = golden**, CanonicalByteCount **862**, ControlFileByteCount **918**, WindowsCommandLine = littéral exact **30 units**, EnvironmentBlock `A=1␀B=2␀␀`, entries/allowlist **triées** [P4], argv 4 exacts, Identity valeur-level, réservation, pin image 10 B, root, mode C01) ; `GetCanonicalEncoding()` == **862 B baseline bytes** (double appel + mutation copie sans effet) ; table : mode@614=1, additionalCount@714=4, a0len@718=13, a3len@826=16 ; `TryEncodeCanonical(plan)` == mêmes bytes/refusal None (supplément ancré au golden, jamais oracle seul) ; artifacts deep-copy 4 exacts |
| T08 | Contrôle actual 32767/32768/32769 | recette exacte : artifact index 3 remplacé (fill 120), **canonical reste 862** (table lengths+SHA32 seulement) ; 31865/31866 → **accept** avec ControlFileByteCount 32767/32768 exacts, u32@826 = 31865/31866, **sha32@830 = SHA256 indépendant du payload** (nouvelles valeurs de table/hash, jamais égalité avec le record baseline) ; 31867 → refus **`ControlBudgetExceeded(15)`**, plan null |
| T09 | Artifacts/null/arrays + TryCount standalone | artifacts `[]` accepté (E6) : canonical **718**, control **718**, u32@714=0 ; 17 éléments → `BadControlArtifacts(17)` ; inner null → 17 ; élément 32769 B → 17 (structural E6) ; élément 32768 B seul → **15** (agrégat 754+32768) ; `TryCountControlFiles` : null → false/0, inner null → false/0, `[]` → true/0, 4 golden → true/56, 31905/31906/**31907 → true** (standalone : somme des arrays fournis vs cap 32768, **pas de seuil caché 31906**) ; totaux réels **32767/32768 → true**, **32769 → false/0** ; le total 32769 record+artifacts reste le cas TryBuild T08 ; input null → `NullInput(1)` ; arrays null → code du step [P3] |
| T10 | Allowlist/policy | noms fermés `NODE_OPTIONS`/`BUN_OPTIONS`/`NODE_PATH`/`FF8_ENSEMBLE_SOURCE` + variante de cas + mixte → `BadEnvironmentAllowlist(18)` ; noms invalides (vide, `1A`, `a-b`, dup `A`/`a`, 260 chars, NUL, tab, surrogate) → 18 ; **4097 noms → 18** ; entry non-allowlistée → `BadEnvironmentEntries(9)` [P2] ; **membership OrdinalIgnoreCase SANS normalisation** (R3) : entries `A=1` + allowlist `a` → accept, entries gardées telles quelles (`A=1`), canonical 850 ; variante inverse (`a=1` + `A`) → accept, `a=1` tel quel, 850 ; **aucune égalité d'intent exigée entre variantes de casse** (R3) ; `--no-env-file` accepté |
| T11 | Flags argv policy (TryBuild) | refus `BadArgv(6)` : `--preload`/`--require`/`--watch`/`--hot`/`--env-file` **exacts**, formes valeur `--preload=1`/`--env-file=x`, **`-r` nu** et **préfixe `-r=`** (`-r=value`) ; anti-sur-refus (exactitude, règle 4) : `--requirefoo`, `x--preloady`, `x-r`, `-rv`, **`-rmodule`** acceptés ; les primitives quotent ces chaînes sans politique (T03) |
| T12 | Ordre des refusals + alias + defensive | Identity null → `BadIdentity(2)` ; identités invalides via **ctor gelé** (uppercase/63/65/`g`/epoch 0/-1 → `ArgumentException`, préconditions ABI, pas de réflexion, pas de forging) + ctor valide ok ; lease sha uppercase/63/`g` → `BadPin(3)` ; image sha uppercase → 3 ; ledger uppercase → `BadLedgerPlanPin(4)` ; pin sha uppercase → `BadSourcePins(12)` ; paths : `C:/T/app.exe`, `app.exe`, `C:\T\app`, quote, `*`, lecteur non-ASCII `É:`, 260 chars, **finissant espace → 5** (suffixe `.exe` OrdinalIgnoreCase), **finissant point → 5** ; **path 259 ASCII coiffé aux 3 occurrences** (`C:\d\`+250×`x`+`.exe` : TargetImagePath/argv0/label pin) → **accept, canonical 1603, control 1659**, u32 259 aux offsets 278/362/441 ; argv0≠image → `BadArgv(6)` [P1] ; cmd 32767 (y×32754) → `BadCommandLine(7)` [P5] ; A13 via TryBuild (cmd 32766 ok) → **15** (coût plan réel 33600+56) ; cwd `C:/T`/`T` → `BadWorkingDirectory(8)`, cwd finissant espace → **accept** 863 (syntaxique-only, OPEN-C03) ; entries structurelles (vide/sans `=`/`=`@0/NUL/tab/surrogate/4097) → 9 ; bloc dérivé 32772 → `BadEnvironmentBlock(10)` [P6, avant cap 15] ; réservation uppercase/epoch 0/-1 → `BadReservationBinding(11)` ; pins : label dup, image pin absent/SHA≠/Bytes 0, Bytes -1/2^31, label 260/NUL/surrogate, 65 pins → 12 ; **SHA répété sous labels distincts (`p2`) accepté → 944** (u32@533=2, char `p`) ; **pin zéro-byte non-image (`empty`, Bytes 0, SHA256 vide) accepté → 947** (u32@533=5, char `e`) ; roots : dup/260/NUL/surrogate/sha uppercase/epoch 0/17 éléments/élément null → `BadOwnershipRootBindings(13)` ; mode **0/15** → `BadQualificationMode(14)`, **C14 accepté** (862, u32@614=14) ; alias : même instance byte[] en 2 slots accepté (canonical 790, control 816), mutation post-build sans effet sur le plan (deep copy nested) ; même tableau partagé entre 2 TryBuild sans contamination ; mutation caller argv/entries post-build → snapshot inchangé ; mutation getters (canonical/artifacts) → état interne intact ; **`TryEncodeCanonical(null)` → false / canonical null / refusal ≠ None sans enum imposé** (R3) |

## 4. Corrections appliquées (adjudication + API R3, tracées)

1. `SHA256Managed` .NET4 standard, dispose déterministe ; aucune crypto maison.
2. WindowsCommandLine golden = **30 UTF16 units** (12 + 3 séparateurs + 2 + 5 + 8) ;
   chaîne transcrite depuis les règles/vecteurs QA0, jamais adaptée pour valider 29.
3. `TryCountControlFiles` standalone = somme des arrays **effectivement fournis** vs
   cap 32768 ; 31905/31906/31907 acceptés ; totaux réels 32767/32768 acceptés,
   32769 refusé (totalBytes 0) ; aucun seuil implicite 31906 ; le 32769
   record+artifacts est nommé dans TryBuild (T08-32769).
4. Padding T08 correct : 862 + firstThree 40 + 31865/31866/31867 ;
   table u32@826, sha32@830 ; nouvelles valeurs, pas d'égalité avec le baseline.
5. Path ASCII 259 : `C:\d\` + 250×`x` + `.exe` = 259, trois occurrences coordonnées
   (image/argv0/label pin) ⇒ record **1603**, contrôle **1659** (PAS 1348) ;
   validité data syntaxique seulement, aucun chemin réel/OS prouvé.
6. 944 = pin label `p2` (2 chars) +82 B ; 947 = pin label `empty` (5 chars), Bytes 0,
   SHA256(empty) via bibliothèque ; toute autre longueur de label dériverait sa vraie
   valeur ; SHA identique sous label distinct permis (correction 5/E3).
7. Golden bytes/intent = oracle **baseline** ; autres positifs = oracles indépendants
   ciblés (longueurs dérivées du layout fixé + champs ciblés) ; self-roundtrip seul
   n'est jamais oracle intégral.
8. `TryEncodeCanonical(null)` : false/canonical null/refusal ≠ None, aucun enum imposé.
9. Console cap 1024 tout inclus, tag réservé avant consommation, ASCII only.
10. R2 `-r` : refus du nu ET du préfixe `-r=` ; positif `-rmodule` sur domaine
    contractuel ; primitives sans politique TryBuild.

## 5. Audit « guards antérieurs passés » par négatif

Chaque négatif vérifie qu'aucun step antérieur ne peut refuser à sa place :
identity mutations (step 2 après NullInput) ; lease/image sha (step 3, identity
golden valide) ; ledger (4) ; targetpath (5 : lease/image/ledger valides ;
argv0 non muté dans les cas path — le step 5 précède le step argv, code déterministe 5) ;
argv0-mismatch/cmd-over (6/7 : identity/pins/ledger/targetpath golden-valides) ;
cwd (8 : argv golden exact) ; allowlist (18 : argv/cmd/cwd golden) ; entries (9 :
allowlist valide) ; envblock (10 : entries raw-valides triées allowlistées) ;
réservation (11 : blocs golden) ; pins (12 : réservation golden) ; roots (13) ;
mode 0/15 (14) ; artifacts 17/null/inner/32769 (17 : mode valide) ; cap 15
(padding structural-valide). C02g/C14/p2/empty/cwd-espace/membership/`--no-env-file`/
A13-cmd-ok = positifs protection contre le sur-refus.

## 6. Oracles dérivés documentés (longueurs canoniques, layout fixé)

862/918 baseline ; 718/718 artifacts vides ; 850 membership (×2 variantes de casse,
longueurs égales) ; 863 cwd espace ; 790/816 alias 2 slots ; 944 `p2` ; 947 `empty` ;
1603/1659 path 259 ; 862 mode C14 et padding (u32 ciblés @614/@714/@826/@830,
sha32 indépendant @830). Chaque valeur dérive de la recette fixée + longueurs réelles
des fixtures ; aucune inventée.

## 7. Hors table / non-oracles (sans méthode inexistante)

`InternalEncodingFailure(16)` : non atteignable par data pure — déclaration
documentaire, aucun vecteur inventé. `TryEncodeCanonical` sur plan invalide autre que
null : non spécifié — exclu. U7 : référence ContractPin absente du paquet — vraie
déclaration documentaire (SHA `bb69e0ade4c0b48c8d1c420e528683fe2d614eff6cac80fa64e6f58df33cafd3`
déclaré dans contracts/MANIFEST.json et présent dans le core gelé), pas d'origin, pas
de réseau. MaxChunk 4096, framing GTC1 16B, seuils capture 114688/total 262144 :
obligations broker/qualification futures, hors slice. Aucun validateur de bloc
préencodé exposé par l'API : les lignes CONDITIONNEL QA0 restent hors table
exécutable (correction 4). Aucun champ inconnu promu en capacité ; pas de
TimeProfile/Intent/Version en input (E5/E10 : constants/dérivés vérifiés en sortie).

## 8. Règle d'exactitude (correction 6 maintenue)

1. ACCEPT/REFUSE exacts sur le domaine commun fixé. 2. Une restriction additionnelle
ne s'auto-ratifie pas : remontée avant adoption. 3. Hors table, un écart est à
adjudication parent, jamais « autorisé par défaut ». 4. Ne jamais accepter une
implémentation qui refuse un positif contractualisé pour éviter le défaut (vecteurs
anti-sur-refus T03/T10/T11 inclus à cette fin).

## 9. Interprétations P1–P8

P1 argv0≠image → 6 ; P2 entry non allowlistée → 9 ; P3 arrays null → code du step
(input null → 1 ; réservation null → 11) ; P4 getters entries/allowlist **triés** ;
P5 cmd encodée > 32766 (argv raw-valide) → 7 ; P6 bloc dérivé > 32767 (entries
raw-valides) → 10 avant cap 15 ; P7 membership OrdinalIgnoreCase, casing conservé
dans les vecteurs triés, aucun invariant de hash par équivalence de casse (R3) —
**confirmés par le lead**. **P8 (restant, notation)** : getters scalaires/collections
de `GenericTargetPlanV1` utilisés comme **propriétés internal** (`plan.Version`,
`plan.Argv`…) conformément à la notation du bloc API (`Nom:type;`), tandis que
`GetCanonicalEncoding():byte[]`/`GetAdditionalControlArtifacts():byte[][]` sont des
**méthodes** ; DTOs (`GenericTargetPlanInput` mutable, bindings readonly) traités en
**champs internal** (`input.X = …`), fidèle à la notation « mutable fields / readonly
fields ». Si l'auteur a choisi des getters-méthodes, la correction est mécanique à la
gate compile (V fresh/parent) ; aucun choix d'API nouveau.

## 10. Frontières et suite

- 3 outputs possédés : ce fichier, `GenericTargetPlanTests.cs`, `MANIFEST.json` ;
  15 pins conservés intacts (rehash final post-écriture dans le manifest) ; 2
  suppléments autorisés hashés ; self-hash du manifest **détaché** (calculé après
  écriture, transmis dans le résultat natif ; le parent peut hasher indépendamment).
- Pas de compile/exécution/validateur/import produit ; pas de broker/writer/authority ;
  pas de full44/Q1 réel, time125, capability ; pas de git/registre/IDB/live/réseau/DB ;
  pas de délégation/team tools/clôture.
- Suite : **V fresh composé** sur source auteur + source QA (tranche P8, défauts
  corrigés avant compile) → **gate compile parent** séparée → **gate run parent**
  (`csc /main:ReGraph.GuardV3.GenericTargetPlanTests`, exit 0 attendu, console ≤ 1024 B)
  → lecture parent. Verdict final : livraison source proposée seulement ; aucune
  valeur validée ne devient trusted authority/lease/proof/OS pin acquis : tout reste
  DATA_ONLY. Pas de promotion full44/native/G5–G7.
