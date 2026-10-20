# Parent — plan Q2a reçu, deux corrections bornées avant GOcode

ACK result_mvf0e9ne_001c_wj0bge,22pins333909B/manifest7c438c99 exacts,
NONBLIND reçu ; plan global accepté comme direction, PAS GOcode.

Décisions ratifiées :
- API sibling/budgetunique/owners/epochs/permitsopaques, créditsinitiaux
  Acontrolactual+19328 sansdoubledebit, bornes256/256 et préterminales inchangés.
- Capture Read manuel souspermit4096/read4064, deuxheaders/GTC1batchlocal ;
  aucun thread/pump/coordinator/host. ICaptureSource est un port de code de
  confiance piné, pas un adversaire CLR arbitraire ; provenance/joins restent gaps.
- Source2a s'arrête à WaitingGuardianAcknowledgement. Pas API boolACK/Sealed echo,
  ni construction GuardianSupervisorAcknowledgement, ni CLOSED atteignable.
  FinalRecords/Closed peuvent rester valeursréservéesinaccessibles avec limite
  documentaire explicite, pas nouveaucontrat ni promesse d'activation/release.
- Aucun rapprochement de labels durableReservation avec acquisitionHOST, aucune
  preuve de heapglobal4096B ; cardinalités bornéesseulement, overheadCLR distinct.

Corrections obligatoires de surface :
1. NE PAS rendre un buffer privé via TryBeginProduction(out byte[] buffer,...).
   Ce prêt conserverait un alias modifiable après Complete, donc compter les
   producteurs ne suffirait pas à garantir les octetscommittés.
   Remplacer les deux méthodes TryBeginProduction/TryCompleteProduction par :

   internal bool TryStage(WritePermit permit, byte[] source, int offset, int count);

   L'admission complète du permit/A et de la plage précède la copie bornée.
   La cellule privée copie les octets à Stage et n'est jamais rendue au caller ;
   mutation du source après retour n'affecte pas le commit. L'appelant doit avoir
   obtenu son permit avant production ; le broker ne prétend pas empêcher du
   travail arbitraire chez un caller externe. Un countgénérique<=4096,
   invalid/reentrant/stale→HOLD selon politique, aucune queuealloc secondaire.
   Un snapshotreadonly ne doit pas exposer des tableaux privés mutables nonplus.
   Le slotcapture interdit TryStage : capture reste uniquement ReadReserved.
   ActiveProducers peut être supprimé de snapshot si plusaucunétatproducing réel,
   ou compter seulement opérations internes en cours ; ne pas fabriquer un témoin.

2. Quatre cellulesnoncapture au TOTAL, dont une toujours disponible au protocole
   interne GR192 puis receipt192(reuse séquentielle). Un ensemble de commandes
   DeferredFinal ne doit pas occuper les quatre et bloquer son propre GR/readback.
   Conserver au plus3permitsnoncaptureexternes simultanés, plus1celluleinterne
   réservée. Tous leurs octets ET grantsinternes comptent dans capsA/256 ; les
   bufferscellules restent4096max, pas cinquièmecellulecachée. DeferredFinal
   prépayés demeurent locaux et noncommittables pendant attenteACK2a ; ne pas
   les traiter comme terminés/Spents pour fabriquerCLOSED. Finalisation exige
   ordinaryoutstanding0,EOFcommitted2,Reads0/commits0,absenceHOLD et vraiidle.

Demande de retour : ACKcourt modifications + signatures API réconciliées exactes
et1–3choixlocaux nécessaires, PAS nouvel audit ou grandplan. AUCUNEécriture tant
que GOcodeparentexplicite manque. Le parent figera ensuite la surface pourQA
indépendante avant source/proofs. Les nouveaux docs ne changent aucun gelV3,
Q1data ou contratcaps/timings. Aucun run/compile/validator/OS/native/full44.
