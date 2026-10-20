# M1 / C — remplacements minimaux, 2026-10-20

**Résultat : BLOCKED, candidat partiel non intégré.** Ce n'est ni une réussite
M1, ni un report de contrats indépendants, ni un GO M2. Autorité : ordre M1
§5C, inventaire T1, conservation T2 et clarification du superviseur autorisant
la création de fichiers sous `tools/ff8-harness/`.

Le [mapping JSON](M1_REMPLACEMENTS_20261020.json) développe **112 familles
uniques**, avec ancien scénario, test exact ou absence explicite, statut,
référence/oracle et raison des blocages. Les nombres de familles, de tests
exécutés et d'assertions ne sont pas interchangeables.

## 1. Candidat livré, sans nouveau framework ou exécutable

- `tools/ff8-harness/src/generic-target-primitives.ts` : constantes, modes et
  refus Q1 ; primitifs purs d'encodage d'argument/commande Windows ; comptage des
  octets réellement fournis. Aucun OS, fichier, processus, horloge ou SDK appelé.
- `tools/ff8-harness/test/generic-target-primitives.test.ts` : port à oracles
  indépendants, erreurs/bornes UTF-16, encodages littéraux, absence de mutation,
  null/sparse/accessors et taille intrinsèque des vues binaires.
- `tools/ff8-harness/test/fixtures/generic-target-reference.json` : golden
  historique **littéral**, métadonnées et hash de sa QA ; aucune source C#
  embarquée. Autocontrôle SHA/longueur, pas reconstruction d'un résultat candidat.
- `tools/ff8-harness/package.json` : ajout **seulement** de `test:q1-primitives`.
  Les entrées, le build, le test global et les dépendances existantes restent.
- `tools/ff8-harness/README.md` : paquet Bun/TS identifié, portée des primitifs,
  blocages, limites OS, archive et statut d'installation du plugin explicités.
- Les deux présents livrables de mapping.

Aucun autre fichier modifié intentionnellement. Aucun git, changement global,
compilateur .NET, binaire, framework, action live/power, déplacement/suppression
de `.cs`, modification de gel/reçu/préparation historique ou retrait de garde.

## 2. Référence indépendante et résultats observables préservés

La QA historique R2/R3 identique était indépendante et qualifiée DATA_ONLY
**avant** ce candidat. Le port reprend ses littéraux, IDs et bornes, pas des
sorties du nouveau module. Références lues, jamais modifiées :

- Q1 R3 source : `.tmp/mission-v2-20261018-continuous/full44-source-r3-frozen/GenericTargetPlan.cs`,
  SHA-256 `ce19bd43052bd46ce65ea355fb4af12ade30c6d6a36174b4bf5dd02d19d6aee1`.
- QA : `.tmp/mission-v2-20261018-continuous/full44-qa1-r3-frozen/GenericTargetPlanTests.cs`,
  SHA-256 `a3a910bfffe77c0c4256c1f6d3e08eb0ed479838b758b703fba3bb2318106f95`.
- `GuardianPredicates.PlainBounded`, source `GuardianCore.cs` hash T1
  `7d4d2c660317e0f2757aaec640dec5af2036bf77990390bbff0ef98287a52a3f`,
  fixe les C0 et les paires de surrogates, sans interdire DEL.

Le test n'a **aucune dépendance d'exécution** vers ces fichiers, leurs copies,
les reçus C# ou les PE historiques. Les octets du golden copié ont été comparés
au littéral historique : identiques. Son SHA attendu reste une constante de QA.

Adaptation d'interface : `bool + out string` devient `{ok,value}` ; un refus
renvoie toujours `value:null`. `bool + out long` devient `{ok,totalBytes}` ;
un refus remet toujours le total à zéro, jamais à un total partiel. Aucun code
de refus nouveau n'est inventé pour les primitifs, qui n'en avaient pas.
Les codes du plan ne sont que métadonnées tant que le builder manque.

Les bornes restent 128 arguments et 32 766 **unités UTF-16** pour la commande
encodée, pas des octets UTF-8 ni des points de code. Les raw data sont contrôlées
avant l'encodage ; les expansions de quoting sont mesurées avant allocation de
la sortie. `-r`/`--preload` restent des données admises par le primitif : seule
la politique du plan, encore manquante, devait les refuser. Le compteur autonome
ne réserve pas implicitement le canonical et n'impose pas la limite de 16
artefacts propre au builder. Il lit la taille intrinsèque des vues, pas une
propriété `byteLength` falsifiable par un appelant JS.

## 3. Correspondance résumée, aucun masquage des trous

- **TS01–TS39** : tests existants inchangés ; mapping exact dans le JSON, pas
  réétiquetés comme remplacements Q/B/D. Qualification actuelle globale = D.
- **Q01 / T01** : valeurs complètes des constantes/modes/refus → test
  `Q01 / T01 fixed contract constants`.
- **Q02 / T02** : sept autocontrôles de la référence →
  `Q02 / T02 independent reference self-check`. Ce n'est **pas** Q07.
- **Q03 / T03** : tous les littéraux positifs historiques et leurs boucles
  (dont 128 éléments, 32 766 unités) → `Q03 / T03 primitive argv positives`.
- **Q04 / T04** : tous les refus historiques, IDs conservés →
  `Q04 / T04 primitive argv refusals`.
- **Q09 / T09-tc** : dix sous-cas autonomes de comptage →
  `Q09 / T09-tc standalone control-file counting ONLY`. **Q09 reste PARTIAL_BLOCKED**
  pour ses cas de builder, structures, nulls, cardinalités, copies/aliases.
- **Q05/Q06/Q07/Q08/Q10/Q11/Q12** : **BLOCKED**, aucun test substitué.
- **B01–B18** : **BLOCKED**, chaque groupe QA nommé individuellement dans le JSON.
- **D01–D30** : **BLOCKED**, chaque famille et ses boucles historiques restent
  référencées ; les 72 cas heap anciens ne sont pas remplacés par les tests argv.
- **V01/V04** : **BLOCKED** pour les invariants budget/capture/ledger/host partagés.
- **V02/V03 et N01–N06** : archive Windows, **aucun équivalent revendiqué**.
  Leurs négatifs, états UNKNOWN et garanties conditionnelles ne deviennent pas
  des PASS. Toute réutilisation d'une garantie par RMS demande son équivalent
  qualifié, pas un waiver tiré de l'archive.
- **P01/P02/P03** : proposés/plans non qualifiés ; aucune acquisition ni
  qualification S1/numeric/OS héritée des nouveaux tests.

Bilan des 112 familles : 39 TS inchangées, trois ports de famille (Q01/Q03/Q04),
un autocontrôle de référence (Q02), **57 familles BLOCKED + une PARTIAL_BLOCKED**,
huit familles Windows archivées sans remplacement revendiqué et trois plans.

## 4. Blocages et escalades précis

1. Le paquet existant n'a pas de plan Q1/builder/canonical complet, de broker
   Q2a, de coordinator Q2b1 ou d'équivalent huit slots `BudgetedEvidence`.
   `inputs.ts`, `mechanical-preparation.ts`, les codecs de graphe et les tests
   de timeout traitent d'autres invariants. Leur présence n'est pas un équivalent.
2. Le primitif environnement exige le comparateur **OrdinalIgnoreCase .NET4**
   sur son domaine complet, pas `toUpperCase`, un tri dépendant de locale ou une
   nouvelle restriction ASCII. Aucun équivalent complet qualifié n'est livré.
   C'est une absence d'équivalence vérifiée, **pas** une preuve que TS ne puisse
   jamais l'implémenter. Les noms/allowlists du builder ne doivent pas masquer
   le domaine plus large du primitif.
3. Les gates compile/run Q1/Q2a/Q2b1 et préparations `prepare/freeze/audit/verify`
   de T1 sont **hors ownership** et restent inchangées. Leurs compilations C#
   requises ne sont pas devenues facultatives : le remplacement **complet de
   ces flows reste BLOCKED**. La nouvelle commande ne signifie que primitifs Q1.
4. Aucun besoin démontré d'exécutable compilé pour la tranche pure ; aucun
   exécutable n'a été implémenté. Si les garanties OS requises l'exigent ensuite,
   escalade au superviseur, préférence Rust/C++, sans remplacer la sûreté par
   `Abort`, timeout, Promise ou comptage de sessions OpenCode.
5. **A09** : l'emplacement/installation du plugin RMS OpenCode V2 générique
   n'est pas établi. Le README ne rebaptise pas le CLI FF8/Ensemble en plugin RMS.
   **A01/A02/A05/A06** et les autres objets étrangers restent aux propriétaires
   désignés par T1, pas ignorés pour annoncer un zéro-C# global.

GrepAI recherche et état d'index ont tous deux retourné `Error calling tool`
à la racine commune confirmée ; Serena est correctement liée à `retro-eng`
mais n'a que le serveur C++, donc refuse les symboles TS. Lecture ciblée des
chemins exacts fournis par T1 et contrôles de contenu via Context Mode, sans
reconfiguration du pool ni initialisation d'index. Context Mode est opérationnel.

## 5. Vérification bornée et préservation

Commande ciblée : `bun run test:q1-primitives` dans `tools/ff8-harness`.
Typecheck : `bun run typecheck` (`tsc --noEmit`), sans émission de fichiers.
Versions et reçu final sont dans le JSON ; aucune cible ni descendant natif
n'est lancé par la suite pure. Ce contrôle local ne remplace ni la vérification
globale D, ni sa review indépendante, ni l'intégration E réservée au superviseur.

Run final 2026-10-20 12:57 UTC : **55 tests PASS, zéro échec, 125 `expect()`**, exit 0,
Bun `1.4.2 (744846f84)`. Typecheck complet TypeScript `5.9.3` : **PASS**, exit 0.
Les commandes bornées à 60 s, heures, stdout/stderr complets et erreurs nulles
sont conservés dans le JSON. Contrôle mapping : 112 IDs uniques, aucun test
référencé absent. Aucun résultat de suite globale n'est déduit de ces 55 tests.

Avant modifications de README/package : 263 chemins harness lus dans DIRC v2,
262 hors README, empreinte ordonnée de leurs `[chemin,SHA256]`
`dde2acc9e84f4af4786daef0ce13edf947783fe9178b4d916e2ff2c5f4b5221d`.
Index lu seulement : SHA-256
`d51d5957af0af0ccb953d30d8ac2164f90e356aad6d394926f6ad80b6c932ceb`.
Le contrôle final distingue les deux éditions connues des autres chemins.
Après retrait en mémoire de la seule ligne ajoutée à `package.json`, cette
empreinte des 262 chemins est **identique** ; l'index est également identique.
Ce contrôle ne prétend pas inventorier les centaines de dirty étrangers :
leur preuve globale reste au superviseur/T4.

Archive préservée et retrouvable : `dev/windows-process-supervision`, commit
`9f789ff931a3dfe2aeb6497addd067368faffb88`, manifest
`M1_HELPER_PRESERVATION_20261020.json`. Readback final : **1 471 originaux** de ce
manifest rehashés, dont 368 références `.cs` internes/externes, **zéro absent ou
hash divergent** ; les deux manifests d'entrée sont toujours byte-exacts.
Aucun original sous `.tmp/inputs` n'a été
déplacé, retiré ou re-pinné. La préservation n'est pas l'acquisition d'un
remplacement sans C#. **Risque résiduel : M1 demeure bloquée, donc pas de GO M2.**
