# DESIGN — proposition source R3 DATA_ONLY, non acceptée

Auteur correctif : `full44-q1-source-fix-r1`, tâche `task_mve2v30s_0016_i0tyxz`.
Ownership limité aux trois outputs de `full44-q1-source-fix/outputs/`.
Source historique R2, sources V3, contrats et QA restent intacts.

## 1. Autorisation et provenance

- Plan natif approuvé : `result_mve323e5_0018_bynmfu`.
- Supplément parent `FULL44_Q1_SOURCE_R3_PLAN_GO.md`, 3054 B,
  SHA-256 `ae4b8416c06d848015ca2878ddae1e7ce01caff14e7d4c208b4cd76ab173cfa4`.
- Paquet initial : 16 pins, 259347 B ; SHA-256 brut de `INPUT_MANIFEST.json`
  `74b968c6ae37244e5c4eb2c63d8c42d5b9a55fd7d23569b45db1ac5096609d33`.
- Baseline copiée dans les inputs : `source-r2/GenericTargetPlan.cs`, 59342 B,
  SHA-256 `4fe5da4de15157e422d3e1baa7d093a7f6c853f82c8f42155e502e0a16ef6626`.
- NONBLIND : correction de cette baseline après adjudication parent fondée ;
  aucune implémentation QA consultée. Les chemins d'origine ne sont pas suivis.
- Références lues sélectivement : SCOPE, RATIFICATION, API R1/R2/R3,
  adjudication parent, contrats, prédicats et DTOs gelés fournis dans les inputs.

Il s'agit de source proposée, pas d'une acceptation ou d'un résultat de tests.
Aucune compilation, exécution, import produit, validation produit, action OS,
git, DB, réseau, IDA, live, délégation ou team tool n'a été utilisée. Les scripts
de travail ne font que lire/parcourir du texte, parser du JSON, comparer des
lignes et calculer les hashes de fichiers. Les écritures passent par patch.

## 2. Surface et invariants inchangés

Namespace `ReGraph.GuardV3`, C#4/.NET4 ; pas de nouveau framework, contexte,
politique, DTO public, API host ou capacité. Le seul import ajouté est
`System.Collections.Generic`, pour résoudre l'unique `IComparer<string>`.

Constantes et codes : `generic-t-dual-1`, `V3-Q1`, `win-quote-v1`, `win-env-v1`,
`gtplan-canonical-v1` ; args128, commande32766, env32767, entries/allowlist4096,
pins64, roots16, labels259, additional artifacts16, ControlFiles32768.
Enums `C01..C14` et tous les IDs de refus restent identiques. La comparaison
textuelle des déclarations/DTOs/constructeur/getters avant le codec, sans
commentaires ni lignes vides, ne montre que l'import ajouté.

Les prédicats `GuardianPredicates` et `CaseIdentity` sont réutilisés sans
modification. Les labels/hashes/epochs sont des données, jamais un droit,
lease, pin OS acquis ou autorité. Pas de lecture d'environnement hérité.

## 3. Entrée et snapshots par stade

`TryBuild`, source lignes 231–459 : initialiser les sorties, refuser input null,
puis capturer une fois les quatorze champs en scalaires/références locaux
(240–253). Aucun parcours de tableau ou clone de payload à cette capture.
Aucune lecture de `input.*` ne suit cette zone.

À chaque stade, vérifier la cardinalité du tableau capturé avant sa copie
extérieure. Les tableaux de chaînes partagent seulement les chaînes immuables ;
les tableaux de DTOs partagent seulement leurs objets readonly. Chaque élément
ensuite validé est celui du snapshot possédé, pas une relecture du tableau
caller. Aucune copie d'array arbitrairement grand n'est faite pour découvrir
ensuite que son count est interdit.

Il n'y a pas de transaction atomique sur l'ensemble des champs ou face à un
caller concurrent. Une mutation pendant la capture d'éléments ou le clone de
bytes peut influencer la copie obtenue. En revanche, validation et construction
ne changent plus de références après leur snapshot ; les SHA lient exactement
les copies de bytes possédées et conservées. Une mutation après construction
ne doit pas affecter le plan.

## 4. Argv : validation brute, mesure, écriture

### `ValidRawArgument` et `TryEncodeWindowsArgument`

- `ValidRawArgument` (644) accepte vide explicitement ; sinon réutilise
  `PlainBounded(argument,32766)` : nonnull, raw UTF16 ≤32766, pas de NUL,
  char<32 ou surrogate isolé. Les paires valides restent admises.
- Primitive publique (462) : raw validation avant toute expansion, puis
  `TryMeasureWindowsArgument` (658), puis allocation seulement si l'encodage
  compte ≤32766 unités UTF16. Une chaîne non quotée peut être retournée telle
  quelle ; aucun flag de politique n'est examiné.
- Mesure en `long` checked ; aucune chaîne encodée ni buffer UTF8 intermédiaire.
- Écriture par `AppendWindowsArgument` (712), même algorithme `win-quote-v1` :
  quote ssi vide/espace/quote ; n backslashes avant quote → 2n+1 puis quote,
  avant quote finale → 2n, sinon inchangés. `a\` reste non quoté.
- Le vide produit deux quotes. Une chaîne brute non quotée de 32766 unités
  reste dans la borne ; la limite encodée ne remplace pas la limite brute.
- L'écriture vérifie la longueur mesurée. Exception → false/output null.

### `TryEncodeWindowsCommandLine` et stades 6/7

- Primitive publique (482) : count 1..128 AVANT `CopyStrings`, snapshot de
  références, validation de TOUT le vecteur brut, puis mesure, puis écriture.
- `TryMeasureWindowsCommandLine` (691) additionne les longueurs encodées et
  `argc-1` espaces, checked ; borne totale inclusive32766, pas int.MaxValue.
- `WriteWindowsCommandLine` (744) alloue un StringBuilder de capacité mesurée
  et appelle directement l'appender ; pas de tableau de chaînes expansées.
- `TryBuild` : stade6 (270–288), argv[0] exact image Ordinal, tous les raws et
  flags avant mesure7 (290–298). Un raw tardif invalide n'est pas masqué par
  une commande déjà trop grande. Un raw valide mais encodage/jointure trop
  long donne7, pas6.
- Politique uniquement dans `ClosedArgvArgument` (800) : exacts/`flag=` pour
  les longs flags gelés ; `-r` exact et `-r=` refusés, pas `-rmodule` blanket.
  `--no-env-file` reste permis. Les primitives encodent ces flags.

## 5. Allowlist, entries, environnement

### Allowlist18, puis entries9

- Allowlist (300–313) : count≤4096 avant copie, validation ASCII/longueur259,
  noms fermés, tri du snapshot OrdinalIgnoreCase, doublons refusés. Vide admis.
- Entries (315–331) : count≤4096 avant copie, toutes les validations brutes
  puis membership avant tri/doublons. `ValidRawEnvironmentEntry` (758) vérifie
  d'abord la longueur/les caractères par `PlainBounded(entry,32765)`, puis
  l'existence d'un `=` à index>0. Valeur vide admise.
- `AllowlistedName` (845) fait une recherche dans l'allowlist possédée triée.
  `CompareNames` (837) compare les préfixes de noms OrdinalIgnoreCase, sans
  Substring. Pas de normalisation/réécriture de casse.
- `EnvironmentEntryComparer` (1153), résolution générique explicite par import,
  trie les références par nom sans allouer de sous-chaîne à chaque comparaison.
  Les helpers doublons (862/870) parcourent les snapshots déjà triés, sans les
  recopier et sans créer des milliers de noms dérivés.
- Un nom non allowlisté, doublon ou raw tardif invalide donne9 avant mesure10.

### `TryEncodeEnvironmentBlock`, mesure10 et écriture

- Primitive (502) : count avant copie≤4096, phase brute entière, tri et
  doublons ; aucune politique d'allowlist/noms fermés dans cette primitive.
- `TryMeasureEnvironmentBlock` (766) : vide=2 ; nonvide=
  `1 + somme(entry.Length + 1)`, checked, ≤32767 avant toute expansion.
- `WriteEnvironmentBlock` (780) : vide retourne explicitement `"\0\0"`,
  exactement deux NUL. Nonvide alloue à taille mesurée, ajoute chaque entrée,
  son NUL puis le NUL final ; vérifie la longueur.
- `TryBuild` (333–339) applique ensuite le prédicat env gelé sur ce résultat
  borné. Empty allowlist + empty entries peut donc réussir DATA_ONLY, sous
  réserve des autres champs/du budget, sans héritage injecté.
- Aucun StringBuilder/ToString ne matérialise l'agrégat d'environ134M unités
  que 4096 raws de longueur maximale pourraient représenter. Leur validation
  brute peut néanmoins parcourir tous ces caractères déjà détenus par caller.

## 6. Réservation, pins, roots, mode

- Réservation11 (341) : DTO immuable capturé, SHA lowercasehex64/epoch>0.
- Sources12 (346) : count1..64 AVANT copie, labels≤259, SHA, bytes0..int.MaxValue,
  labels distincts Ordinal, exactement le pin image lié SHA/label et bytes>0.
  SHA répétés sous labels distincts restent permis.
- Roots13 (382) : count1..16 AVANT copie, labels distincts Ordinal, SHA/epoch.
- Mode14 (399) : valeur1..14. Pas de changement d'ordre ou d'autorité.

## 7. Artifacts17, cap15, puis payloads/hash/UTF8

- Artifacts17 (403–417) : outer obligatoire count≤16, puis
  `CopyArtifactReferences` (637), pas `CopyJagged`. Snapshot≤16 références et
  tableau≤16 longueurs. Tous les innernull/longueurs>32768 sont refusés AVANT
  somme, budget, clone ou hash. Vide admis.
- Un artifact64MiB est refusé17 sans clone. Si les premiers artifacts valides
  dépasseraient déjà le cap mais le dernier est invalide, le refus reste17.
- `BuildSnapshot` (935) prépare seulement des métadonnées : tableaux de
  labels/bytes/SHA de pins≤64, roots≤16, références de chaînes déjà validées,
  longueurs effectivement capturées des artifacts. Aucun payload ni digest
  n'est calculé à cette étape.
- `CountedUtf8Length` (1023) = `checked(4L+StrictUtf8.GetByteCount(value))`.
  `MeasureCanonical` (1028) additionne dans un bloc checked. Aucun GetBytes,
  buffer UTF8 expansé ou faux crédit issu d'un entier caller déclaré.
- Table d'artifacts : u32 count puis count×(u32 actualLength+raw32 digest).
  Sa mesure ne dépend pas des valeurs des digests et ne nécessite pas de hash.
- `SumArtifactBytes` (878) additionne les longueurs réelles du snapshot.
- Cap15 (420–428) : `canonicalLength+sum(actualLengths)≤32768`, inclusif.
  Tous les guards17 sont terminés ; en cas de dépassement, aucun payload cloné.
- Après cap seulement (433) : `CopyJagged` depuis le snapshot extérieur possédé.
  La somme des bytes clonés est désormais≤32768, pas16×32768 par défaut.
- `HashOwnedArtifacts` (986) vérifie count/longueurs et SHA256 des copies
  effectives ; c'est ce même jagged possédé que le constructeur conserve.
- Buffer canonique exact (435), UTF8 strict directement dans ce buffer
  (`WriteCountedUtf8`,1076), record (1087), longueur écrite vérifiée, intent
  SHA256 lowercasehex64, puis publication unique du plan (442).
- Aucun raw payload original ni builder n'est relu pour calculer un hash,
  encoder le record ou remplir le plan. Les bytes d'artifacts ne sont pas
  également embarqués dans le record, donc pas de double crédit.

## 8. Layout canonique inchangé

Primitives u32LE/i64LE ; countedUtf8=u32LE(length UTF8)+UTF8 strict sans BOM.

1. `GTPL`, u32(1), Version, ArgvCodecId, EnvCodecId.
2. NonceHex, Epoch, LeaseReceiptSha256, ReservationSha256, ReservationEpoch.
3. TargetImagePath, TargetImageSha256, argc, chaque arg, WorkingDirectory.
4. envCount, chaque entrée triée ; allowedCount, chaque nom trié, casse conservée.
5. pinCount, chaque label/bytes/SHA dans l'ordre caller possédé.
6. LedgerPlanSha256, TimeProfileId, u32(mode).
7. rootCount, chaque label/SHA/epoch dans l'ordre caller possédé.
8. additionalCount, chaque u32(actualLength)/raw32 SHA256(copy effective).

WindowsCommandLine/EnvironmentBlock sont dérivés, pas ajoutés au record ;
CanonicalEncodingId n'est pas ajouté au layout R1. IntentSha256=SHA256(record),
hors self-reference. SourcePins, roots et artifacts ne sont pas silencieusement
triés. Aucun changement de longueur/champ/offset voulu par ce correctif.

## 9. Réencodage, compte standalone, getters

- `TryEncodeCanonical` (523) : null→false/canonical null/NullInput. Pour un plan
  déjà construit immuable, vérifie d'abord ses comptes validés : canonical>0,
  canonical≤control≤32768, avant d'appeler les getters de copies.
- Recalcule les codecs dérivés et les compare ; `SnapshotFromPlan` (1004)
  récupère des copies fraîches déjà bornées par le plan construit, pas des
  entrées externes non validées. Le premier budget a précédé leurs copies lors
  de TryBuild ; le contrôle préliminaire de réencodage ne remplace pas cette
  validation par une simple confiance en un compteur input.
- Mesure à nouveau, compare canonical/control counts aux comptes immuables,
  hashe les mêmes copies effectives, encode, compare longueur/intent. Toute
  incohérence/panne donne16, canonical null. Pas d'inventaire host certifié.
- `TryCountControlFiles` (580) capture chaque référence fournie une fois dans
  la boucle, ajoute sa longueur réelle checked, total≤32768 inclusif. Pas de
  copie extérieure de cardinalité arbitraire, pas de cap implicite16, pas de
  réserve canonique. Zéro/plus de16 arrays sont permis si leurs données tiennent.
  Null/innernull/dépassement→false,totalBytes=0. Aucune garantie atomique en
  présence d'un caller concurrent, ni preuve d'inventaire complet.
- Constructeur, champs readonly et getters de `GenericTargetPlanV1` inchangés.
  Chaque array getter rend une copie fraîche, payloads inclus ; les getters
  n'ont pas de signature Try et une pénurie mémoire peut empêcher leur copie.
  `CopyJagged` (625) n'est plus une opération eager sur une entrée non gardée.

## 10. Ordre firstfailure et exceptions

Ordre opposable, non trié par valeur numérique :

`NullInput1 → Identity2 → pins3 → ledger4 → target5 → argv6 → cmd7 → cwd8 →
allowlist18 → entries9 → envblock10 → reservation11 → sources12 → roots13 →
mode14 → artifacts17 → cap15 → encodingfailure16`.

Dans les phases ordinaires : raw argv complet avant mesure7, entries/raw/
membership/doublons avant mesure10, artifacts17 entièrement avant cap15. Aucune
décision anticipée sur un budget ultérieur ne masque un défaut de données antérieur.

Toutes les allocations après capture de TryBuild sont dans la frontière try/
catch16 (257–459), y compris les petits snapshots et les allocations cachées des
prédicats gelés. TryBuild n'appelle pas les wrappers primitifs qui convertissent
leurs exceptions en false : helpers privés propagent les pannes jusqu'à16,
sans les déguiser en6/7/10. Mesure/écriture/hash incohérents ne donnent pas succès.
Le plan n'est assigné qu'après encodage et intent ; catch remet plan null.

Wrappers string : false/output null en cas de refus ou exception. Réencodage :
false/canonical null/refusal nonNone. Aucun catch ne transforme un état inconnu
en succès. Une pénurie empêchant le snapshot peut empêcher de découvrir un défaut
ultérieur ; ce n'est pas une promesse de terminer toutes les phases sous panne.
Aucune garantie sur les événements fatals du runtime, hard-RT ou disponibilité.

## 11. Diff R2→R3 et limites de preuve

Comparaison textuelle de lignes par difflib, sans git, compilation ou exécution :
R2=1161 lignes, R3=1164 ; 569 lignes retirées, 572 ajoutées, 24 hunks à contexte3.
Ce compte inclut le remplacement des commentaires/provenances et le déplacement
de helpers ; ce n'est pas un compte d'assertions ou de résultats runtime.

Deltas ciblés :
- import générique ; primitives argv gardées/mesurées au lieu de null-only/intMax ;
- empty env2NUL et taille mesurée avant StringBuilder ;
- snapshots extérieurs échelonnés au lieu de toutes copies eager à l'entrée ;
- comparaisons de noms sans Substring répétés et tri de snapshots possédés ;
- snapshot canonique métadonnées/longueurs avant budget, copie/hash après budget ;
- arithmétique checked et frontières d'échec fermées, réencodage adapté ;
- compteur standalone sans nouvelle cardinalité ou réserve cachée.

Limites : les caps de contrôle ne bornent pas toute mémoire du CLR ni celle des
inputs déjà détenus par caller. Les snapshots/métadonnées, builders de capacité
mesurée et strings finales ont un coût mémoire non assimilé à un débit ledger.
Validation brute, tri et comparaisons sont bornés par les caps data mais ne
prouvent pas un temps maximum. Pas de nouvelle sous-cap pour simplifier.

Restent hors slice : image réelle/hash/reparse, ownership/leases/OWNER/registry,
inventaire host complet, broker/pumps, filesystem/OS/native, budgets runtime et
qualification full44/G5/G7/125s. Q1 existant seulement, aucune portabilité nouvelle.
La prochaine gate est une Vdelta FRESH composée sourceR3+QA R2 puis décision et
gates parent distinctes. Aucun résultat de compilation/test n'est revendiqué.
