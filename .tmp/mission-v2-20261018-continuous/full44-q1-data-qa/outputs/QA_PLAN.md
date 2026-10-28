# QA_PLAN.md — QA0 full44-q1-data-qa (livrable partiel, DATA_ONLY, aucune exécution)

Date : 2026-10-18. Rôle : `full44-Q1-pure-data-qa`, tâche `task_mvdy1o3t_000k_0fwlcc`,
équipe `mission-a58a462638c0db92`. GO QA0 reçu après adjudication parente
`FULL44_Q1_QA0_PLAN_ADJUDICATION.md` (3217 B, SHA256
`3fcaf308e0835734f9d5e880e81ad1e3fff3df56ff4b4d9efed8075d9e544ffa`), lue intégralement.
Ceci est un livrable **partiel** : oracles data + plan. Pas de couverture exécutée,
pas de source de tests acceptée, pas de clôture.

## 1. Ack intégrité et NONBLIND

- Paquet `full44-q1-data-qa/inputs` : **9 pins, 150730 B, 9/9 SHA256 exacts** (rehash QA),
  aucune mutation depuis la déclaration parent.
- **U1 RÉSOLU (correction parent 1)** : le digest annoncé est **SHA-256 des bytes RAW
  de `inputs/INPUT_MANIFEST.json`** = `384734b29766a3bc5c99c0e15ba668c4eba6594adb4485265070fa2d6e26c557`
  — recomputé localement par QA, **match exact**. Le « SHA384734… » de la tâche
  concaténait le libellé « SHA » et un digest commençant par `384` ; ce n'était
  jamais SHA384. Noté comme **erreur d'interprétation QA**, pas un HOLD restant,
  pas un data drift ; aucune recette de concat/canonisation des pins n'existe.
- NONBLIND : seuls SCOPE.md, RATIFICATION.md, les quatre contrats, les trois
  références gelées et l'adjudication parente ont été lus. GenericTargetPlan.cs /
  DESIGN.md de l'auteur, origins, production et outputs d'autres workers **non lus**.
- Cohérence vérifiée : `GuardianPredicates.AbiPin` = SHA256 local de
  `reference/GuardV3.Contracts.cs` (`bb4758cc…4709`) ; caps de `CaseBudgetV3`
  relues dans la source = celles des contrats (total 262144, capture 114688,
  ControlFiles 32768, chunk-max 4096 réservé aux writes runtime futurs).
- **Delta R1→R2** (GO parent) : contrôle parent 19 littéraux longueur-déclarés
  → 18 exacts, 1 défaut `ENV-A16` (25 UTF-16 units, entrée 23 + 2 NUL, pas 24) ;
  correction de l'entier seul, chaîne attendue inchangée. R1 archivé readonly
  `full44-qa0-r1-frozen` ; pas d'acceptation candidate. Suppléments lisibles/
  hashés dans le manifest : `FULL44_QA0_LITERAL_DELTA_DECISION.md` et
  `FULL44_Q1_API_FIXED_R1.md` (API commune fixée, pas de code auteur). Pas de
  source C# QA1 à ce stade : nouvelle tâche/pins/gate distincts après réception
  de ce delta.

## 2. Architecture d'oracles — trois couches distinctes (correction parent 2)

Source de vérité exécutable : `ARG_ENV_ORACLES.json` (même répertoire). Le présent
document résume et fixe la méthode ; en cas de divergence, le JSON prime.

- **Couche A — encodeurs purs** : `argv[] → WindowsCommandLine` et
  `entries[] → EnvironmentBlock`. L'encodeur env **trie** lui-même les entrées
  caller (OrdinalIgnoreCase ascendant) et refuse les doublons ; il ne réutilise
  pas le refus de bloc non trié du core (correction 2). Littéraux exacts attendus
  (NUL = U+0000, backslashes comptés).
- **Couche B — validateur de bloc PRÉENCODÉ** : CONDITIONNEL — n'existe que si
  l'API parente fixée expose une validation de bloc ; sémantique exactement
  `GuardianPredicates.EnvironmentBlock` (prédicat core gelé documenté ; la
  réutilisation est légitime ici, l'interdit ne vise que l'encodeur). Si l'API
  n'expose pas de validateur de bloc, ces lignes sortent de la table exécutable,
  sans oracle d'une méthode qui n'existe pas (correction 4).
- **Couche C — validateur de PLAN complet (DTO)** : structural data-only, exact
  sur le domaine commun ; verdicts dépendant de l'API marqués
  `awaiting_api_fixation`. Les seuils contrôle 32767/32768/32769 attendent
  l'encodage canonique fixé puis ajustent les bytes supplémentaires réellement
  fournis (correction 3) ; un plan positif n'est **jamais** qualifié sur la seule
  longueur du bloc env ou de la command line.

## 3. Quotage argv — hypothèse `win-argv-quote-1` (U2 restant)

Règles MS-CRT canoniques : R1 quote ssi vide/espace/quote ; R2 n backslashes +
quote → 2n backslashes puis backslash+quote ; R3 backslashes finaux doublés sous
quoting ; R4 autres backslashes inchangés ; R5 jointure espace simple, argv[0]
mêmes règles. Statut : hypothèse de QA, à réconcilier avec le « Windows quoting
versionné » de l'auteur à la fixation API ; les vecteurs A04/A06/A07/A09/A10/A15
trancheront. Aucune signature inventée (correction : API/encoding à fixer par le
parent, pas blocker utilisateur).

Exemples clés (littéraux, image `C:\T\app.exe`) :

| ID | argv | Command line attendue (chars exacts) | Verdict |
|---|---|---|---|
| A02 | [image, ""] | `C:\T\app.exe ""` (15) | ACCEPT |
| A03 | [image, "a b"] | `C:\T\app.exe "a b"` (18) | ACCEPT |
| A05 | [image, dir\] | `C:\T\app.exe dir\` (17) — non quoté, backslash inchangé | ACCEPT |
| A06 | [image, "a b\"] | `C:\T\app.exe "a b\\"` (20) — 1 backslash final doublé | ACCEPT |
| A07 | [image, "x a\\"] | `C:\T\app.exe "x a\\\\"` (22) — 2 finaux doublés | ACCEPT |
| A09 | [image, b\+quote+c] | `C:\T\app.exe "b\\\"c"` (21) — 1 backslash+quote → 3 backslashes+quote échappée | ACCEPT |
| A10 | [image, ab+quote] | `C:\T\app.exe "ab\""` (19) — quote finale échappée | ACCEPT |
| A15 | [image avec espace intérieur] | `\"C:\Program Files\x\app.exe\"` (28) | ACCEPT |
| A13 | image + espace + x×32753 | longueur exacte 32766 | ACCEPT codec-only (§2 couche C) |
| R01–R04 | arg avec NUL / tab / LF / surrogate seule | — | REFUSE |
| R05/R06/R08 | 129 args / 0 args | — | REFUSE ; 128 args exact → ACCEPT |
| R09 | x×32754 | cmd 32767 | REFUSE |

## 4. Oracles env (couche A encodeur)

| ID | entries caller | Bloc attendu | Verdict |
|---|---|---|---|
| A01 | [] | `␀␀` (2) | ACCEPT — env vide, allowlist, aucun héritage |
| A02 | [A=1, B=2, path=C:\x] | `A=1␀B=2␀path=C:\x␀␀` (19) | ACCEPT identité |
| A03a | [a=1, B=2] | `a=1␀B=2␀␀` (9) | ACCEPT (a<b ignore-case) |
| A03b | [B=2, a=1] | `a=1␀B=2␀␀` (9) | ACCEPT — **l'encodeur trie** (correction 2) |
| A03c | [B=2, A=1] | `A=1␀B=2␀␀` (9) | ACCEPT — tri |
| A04 | [PATH=1, path=2] | — | REFUSE doublon ignore-case (le tri ne peut pas ordonner deux noms égaux) |
| A04b | [a=1, A=2] | — | REFUSE idem |
| A05/A06 | [A] / [=C:\x] | — | REFUSE '=' absent / position 0 |
| A07 | [A=1, "", B=2] | — | REFUSE entrée vide (double NUL interne) |
| A08/A09/A10 | tab / NUL / surrogate seule dans entrée | — | REFUSE |
| A11 | [A=1] | `A=1␀␀` (5) | ACCEPT |
| A12 | A= + x×32763 | bloc 32767 exact | ACCEPT **codec-only** — coût plan réel dépassant souvent ControlFiles32768 (correction 3) |
| A13 | A= + x×32764 | bloc 32768 | REFUSE |
| A14 | A= + x×32765 | entrée 32767 > borne 32765 | REFUSE |
| A16 | [path=C:\Program Files\x] | `path=C:\Program Files\x␀␀` (25 — entrée 23 + 2 NUL) | ACCEPT |

Couche B (CONDITIONAL, si validateur de bloc exposé) : bloc non trié `B=2␀a=1␀␀`
→ REFUSE-if-API ; doublon ignore-case / entrée vide / `␀` final manquant /
entrée sans `=` / `=` à 0 / tab / doublon exact → REFUSE-if-API ; `␀␀`, bloc
trié, bloc 32767 exact → ACCEPT-if-API ; 32768 → REFUSE-if-API.

## 5. Oracles plan DTO (couche C) et hors-slice

- Chemins : argv[0] ≠ image → REFUSE ; slash/relatif/non-.exe/quote/wildcard/
  lettre de lecteur non-ASCII → REFUSE ; longueur 259 exacte → ACCEPT
  (domaine commun proposé), 260 → REFUSE ; cwd non-DosPath → REFUSE.
  Cas résolus R2 (décision parent `FULL44_QA0_LITERAL_DELTA_DECISION.md`) :
  TargetImagePath finissant par espace ou point → **REFUSE** par le suffixe
  `.exe` OrdinalIgnoreCase déjà requis (sans modifier DosPath, sans canon/
  reparse prétendus) ; cwd finissant espace/point reste **syntaxique-only**
  selon le prédicat core — ne pas confondre — ; le host réel futur vérifiera
  le chemin effectif, aucune normalisation OS ni permission acquise.
- Identity/pins : nonce uppercase/63/65/'g'/epoch≤0 → REFUSE ; pin uppercase/
  longueur≠64/non-hex → REFUSE ; **SHA répétés dans SourcePins : AUCUNE
  contrainte d'unicité au niveau plan** (correction 5 — distinct TargetPin du
  ledger HostComplete ≠ interdiction de digest répété ; sources distinctes
  peuvent avoir les mêmes bytes).
- Profil/modes : TimeProfileId `V3-Q1` → ACCEPT ; `T-FULL44-TIME-PROPOSAL-1`
  (125 s) et tout autre → REFUSE (non ratifié) ; constantes dérivées ≠
  5000/20000/30000/55000 → REFUSE ; QualificationMode C01/C14 → ACCEPT, hors
  C01–C14 (C00/C15/FULL44) → REFUSE.
- Agrégat contrôle : 32767/32768 → ACCEPT, 32769 → REFUSE, tag
  `awaiting_canonical_encoding_fixation` (correction 3).
- Copies défensives (purs C#, sans filesystem/process) : mutation caller des
  tableaux entrée → encodé inchangé ; mutation tableau sortie → état interne
  intact ; tableau partagé → aucune contamination. Tag `awaiting_api_fixation`.
- DATA_ONLY : toute valeur validée reste DATA_ONLY — pas trusted authority,
  lease, proof, OS pin acquis.
- **Hors slice, sans oracle exécutable (correction 4)** : MaxChunk 4096 (writes
  runtime futurs, pas taille document/array/Encode), framing GTC1 16B, seuils
  capture 114688 et total 262144 (obligations broker/qualification futures),
  broker/writer/authority absents de cette slice.

## 6. Règle d'exactitude (correction parent 6)

1. ACCEPT/REFUSE des codecs sont exacts sur le domaine commun fixé.
2. Une restriction additionnelle ne s'auto-ratifie pas : remontée avant adoption.
3. Hors table, un écart est à adjudication parent, jamais « autorisé par défaut ».
4. Ne jamais accepter une implémentation qui refuse un positif contractualisé
   pour éviter le défaut.

## 7. Unknowns — statut après suppléments R2 (chronologie distinguée, pas de rétroactivité)

- **U2 RÉSOLU prospectivement** : `FULL44_Q1_API_FIXED_R1.md` fixe
  `WindowsArgvCodecId=win-quote-v1` (quote ssi vide/espace/quote ; n backslashes
  avant une quote → 2n+1, avant quote finale → 2n, sinon inchangés) — équivalent
  à l'hypothèse QA0 `win-argv-quote-1` ; littéraux A04/A06/A07/A09/A10/A15
  vérifiés conformes par QA à la réception R2. QA0-R1 avait ignoré l'API
  légitimement.
- **U3 RÉSOLU prospectivement** : surface C#4 interne exacte fixée (TryBuild,
  codecs, prédicats, ordre de refus, E1–E10). GenericTargetPlanTests.cs reste
  **non écrit** : QA1 = nouvelle tâche/pins/gate distincts après réception du
  delta corrigé.
- **U4 RÉSOLU prospectivement** : layout canonique `gtplan-canonical-v1` fixé
  (E6 : `AdditionalControlArtifacts` obligatoire, `ControlFileByteCount` =
  canonical + somme des artifacts ≤ 32768 dans TryBuild lui-même) ; la
  réconciliation des seuils PLAN-C11 se fera en QA1 contre cette API.
- **U5 RÉSOLU prospectivement** : constantes fixées par l'API (Version
  `generic-t-dual-1`, TimeProfile `V3-Q1`, modes C01–C14, limites E7) —
  cohérent avec l'hypothèse QA0.
- **U7 inchangé** : référence ContractPin absente du paquet — reste une vraie
  déclaration documentaire (SHA256 déclaré dans contracts/MANIFEST.json),
  pas d'origin, pas de réseau.

## 8. Frontières et suite

- QA0 = 3 outputs possédés (ce fichier, `ARG_ENV_ORACLES.json`, `MANIFEST.json`),
  9 pins conservés intacts, hash de l'adjudication déclaré dans le manifest,
  rehash final après écriture.
- Pas de GenericTargetPlanTests.cs avant API parent ; pas de compile/run/
  validateur/import produit ; pas de broker/writer/authority ; pas de
  full44/Q1 réel, time125, capability ; pas de team tools.
- Suite : parent fixe API/encoding → QA1 écrit `GenericTargetPlanTests.cs`
  indépendante (purs tests sans filesystem ni process) → V fresh composé →
  gates compile/qualification parent séparées. Verdict final QA0 : livraison
  partielle seulement.
