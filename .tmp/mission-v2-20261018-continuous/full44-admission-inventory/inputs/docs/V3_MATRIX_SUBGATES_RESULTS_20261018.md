# V3 — résultats et limites des sous-gates, 2026-10-18

État de ce checkpoint : compilation matrix et cinq cas réellement exécutés ;
faits bornés recoupés par parent, audit fresh ACCEPTABLE_EVIDENCE_SCOPED. Pas de PASS
natif global, de FF8/live, d'intégration ou de clôture administrative anticipée.

## Autorité et provenance

Reprise continue utilisateur explicite ; gates parent distinctes compile/run,
source candidate acceptée après V fresh + adjudication. Politique mission r1
hash b97d940a25f7e2db6feab6224441e5f5a12e4d81e22220a80ce84aee00586f11,
routage Ensemble imposé sans override. Ancienne équipe et receipts conservés.
Scratch parent : `.tmp/mission-v2-20261018-continuous/` ; tous détails/argv/raws
et cheminsTemp figurent dans v3-compile-receipt.json et v3-matrix-summary.json.

## Sous-gates antérieures conservées, non réexécutées

- Slice1 : batch mémoire pure,4suites,exit0/247ms ; suites Budget17ms,
  Guardian30ms,Kernel19ms,Host14ms ; deux CS0649 documentés. FakeNative/
  FakeObserver/MemoryStream, aucun vrai Job/T. Receipt historique
  `.tmp/coordination-three-20261014/v3-batchrun-receipt-20261017.json`.
- Slice2 : premier vrai Job/T,chemin naturel seulement,exit0/184ms,
  AcknowledgedSealed/Sealed/NaturalQuiescent,QQtrue,Jretainedfalse,reservedtrue ;
  huit fichiers dont GR/SupervisorReceipt192B exacts. Receipt historique
  `.tmp/coordination-three-20261014/v3-slice2-receipt-20261017.json`.
  Premier essai préconditionrépertoire existant conservé, puis invocation
  corrigée ; aucune confusion avec le nouveau batch matrix.

## Compilation matrix observée

Une invocation csc Framework64,9sources,3refs explicites,C#5,x64,winexe,
Main ReGraph.GuardV3.RunnerMatrix. Exit0/194ms,zéro diagnostic ; pas RunnerReal
ou tests dans la closure. Compilateur/refs/sources rehashés avant/après.
EXE PE32+/AMD64/WindowsGUI,76288B,
SHA8fec39602f3a8a1fa47c2b43bbe5187dc2d53697b61db7eb75b838083265deec.
Compile-only puis gate d'exécution séparée ; aucun chargement implicite avant GO.

## Cinq invocations uniques, séquentielles, observées

- **d-loss-signalled** : exit0/212ms,AcknowledgedSealed/Sealed,
  HoldReasonDriverLost,OutcomeForcedQuiescent,QQtrue,Jretainedfalse,
  sealedtrue,reservedtrue ; signalréel postResume,un stopowned,un ACK.
  Huit fichiers ; seuls GR/SupervisorReceipt192B,égaux,padding168..191zéro.
  DriverLoss forcé est un FAIT, jamais un PASS.
- **s-loss-signalled** : exit0/88ms,HeldNotQuiescent/Quarantined,
  ControllerLost/HoldQuarantined,QQtrue,Jretainedtrue,sealedfalse,reservedtrue ;
  un stopowned,zéro ACK. Huit fichiers vides. HOLD scientifique négatif attendu,
  pas un MATRIX_HOLD d'échec de qualification et pas une adoption positive.
- **g-thread-loss-postRun-preACK** : exit0/116ms,GuardianLostBeforeProof,
  KernelQuiescent/NaturalQuiescent,QQtrue,Jretainedtrue,sealedfalse,reservedtrue ;
  thread réel terminé après faute managée capturée postRun,Join observé,
  zéro ACK/stop. Huit fichiers vides. Ce n'est PAS perte midRun/crash non géré
  ou disparition d'un processus G distinct.
- **ack-mismatch-byte191** : exit0/115ms,HeldNoAcknowledgement/Quarantined,
  PublicationUnacknowledged/HoldQuarantined,QQtrue,Jretainedtrue,
  sealedfalse,reservedtrue ; une mutation192B/diff1,readback192 réel,
  un ACK rejeté,un stopowned. GR/SupervisorReceipt192B égaux,byte191=1 et
  padding168..190zéro,6autres slots0. Publication persistée PRÉ-ACK natural/nohold,
  non contradictoire avec le résultat final quarantined ; aucune comparaison
  intégrale prétendue contre une publication originale non persistée.
- **attestation-incoherent-length4** : exit0/55ms,AttestationIncoherent,
  aucun résultatG,corelaunches0/ownercalls0,huit fichiers vides. Events/pipes/
  fichiers préparatoires ont bien été préparés ; absence de core ne prouve
  pas absence de toute API OS. QQ/Jretained typés UNKNOWN, pas négatifs prouvés.

Parent recoupe les cinq raws,les40fichiers réels/tailles/SHA,les4records192B,
signatureGCV3/version1/nonce64hex/epochsequence,bornes/caps,GR==receipt et padding.
Flags0x2208/8/4GiB sont les valeurs de contrat portées par la publication ; le
chemin setup natif vérifie le readback avant Resume,ce ne sont pas des dumps
bruts indépendants des structs noyau. Post-pins exacts ; aucun timeout/retry,
stderr du runner vide,capture parent bornée ; stderr T non observé.

## Limites opposables et prochaine gate

Exit0 signifie correspondance des faits conditionnels uniquement. Cas négatifs
attendus ne deviennent jamais PASS globaux. D/S =eventsstand-ins ; G=thread
postRun-préACK. Réservation tenue au point de décision, pas lease durable prouvée
après fin de processus. Budgetcross-processNOT_PROVEN,last-closecase6NOT_ESTABLISHED,
reparse/canonicité et répétabilité/multi-processusS/G non démontrés. Aucun G5-G7,
full44,C3-C5,L9/L10 ou intégration promu par ces captures.

Audit indépendant v3-evidence-review-r1,task_mvdqun2p_0047_c44j1g,
Sol/xhigh natif vérifié ; paquet77pins/367065B,
manifest13b700e489db97b77f18e46ba891629ba20e46be6884b0e80e2d6a2d957c477c.
Audit achevé ACCEPTABLE_EVIDENCE_SCOPED,aucune divergence,rehash77/77 exact.
V a re-dérivé le layout depuis source avant de comparer le décodeur,recoupé
les40fichiers et raw/receipts,lu l'EXE en octets uniquement. Références/compiler
non transférés : leurs hashes sont attestés par receipt,parent les a rehashés ;
pas de reconstruction/reproductibilité source→IL prétendue. Aucun rerun fait.

**Adjudication parent : sous-gates compile+slice1+slice2+matrix qualifiées dans
ce périmètre borné, résultats/limites publiés pour l'exigence000c.** Cela satisfait
la précondition technique de préparation000d ; ni admission000d,ni full44,ni
source centrale ne sont exécutés/promus implicitement. Les anciens IDs de
tâches restent historiques : aucune clôture d'une tâche d'autre équipe n'est
effectuée silencieusement. La continuation prépare le mapping/context000d et
maintient les exigences de preuves/ownership/gates existantes.
