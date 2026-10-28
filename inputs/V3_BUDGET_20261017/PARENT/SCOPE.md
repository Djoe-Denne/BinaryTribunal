# BudgetedEvidence V3-Q1 — GO de préparation source pure, contrat local parent

Sous-module indépendantREADY, aucun Job/guardian/native privilégié. Parent ratifie
localement ce sous-contrat SOURCE uniquement ;le contrat guardian général attend
review. Fresh build/SolMax, sorties disjointes dans .tmp parentnommé. Paquet/ACK
d'accès puis GOsource requis ;pas compilation ou test exécuté par le worker.

Livrer `BudgetedEvidence.cs`, `BudgetedEvidence.Tests.cs`, `DESIGN.md`, `MANIFEST.json`.
Namespace ReGraph.GuardV3 ;C#5/.NETFramework4.x, aucune dépendance installée. Module
pur autour de `Stream` déjà fourni comme capacité par le futur owner :ne crée pas
de fichier, chemin, process, Job, socket, cache ou IPC. Tests source MemoryStream/
streams simulés, pas oracle copie de l'algorithme ;eux nonplus ne sont pas exécutés.

Slots immuables octets :ControlFiles32768,FixtureMarkers57344,CapturedStreams114688,
GuardianEvidence24576,DriverEvidence8192,GuardianResult8192,SupervisorResult8192,
SupervisorReceipt8192. Somme262144, vérifiée statiquement. FixtureMarkers est une
réservation conservatrice pour des writersSOURCEfermés existants, pas un sink que
ce module peut prétendre contrôler à distance. Contrat d'unicité crossprocess
reste à prouver par le futur parent/guardian, pas via un compteur local fictif.

API minimale proposée à préserver sauf escalade :enum EvidenceSlot, enum HoldReason,
`CaseBudgetV3` lié nonce/version, `OpenSink(slot, Stream)` une fois parslot,
`BudgetedSink.TryWrite(byte[], offset, count)` bool, snapshots readonly compteurs/
Held/HoldReason. Une instance n'est pas une autorité crossprocess ou une permission
filesystem. Ne pas inventer sécuritéMAC/nonce ;capacité vient de l'owner réel.

Invariants :count/offset/types et overflow validés ;chunks≤4096 ;charge atomique
monotone AVANT Stream.Write, capslot/global ;lock synchronise admissions ;pas de
remboursement après échec/partiel inconnu. StickyHOLD irréversible pour erreurs/cap/
slotdupliqué. Aucune NOUVELLE admission de write aprèsHOLD ;un I/O déjà préchargé
peut finir/échouer partiellement, reste chargé et le cas resteHOLD. Pas logging récursif/Console/Error ou exception
message arbitraire en résultat. Une erreur est enum+codeborné, données capturées
restent dans le Stream fourni, aucun seek/truncate/delete/overwrite/dispose du
Stream caller sans contrat explicite. Ownership stream reste caller ;module
serialise ses writes, ne revendique pas qu'un autre code ne peut écrire auStream.
Sinks de production supposés exclusifs/byte-preserving fournis par l'owner ;un
Stream hostile qui écrit ailleurs n'est pas une garantie offerte par ce module.
Réentrance doit être refusée sans nouveau write/deadlock, pas récursion illimitée
sur un payload0. Counter capturepipe s'effectue AVANT lecture dans le futur contrôleur, pas ici.

Tests SOURCE :sommeconstantes indépendante, frontières exactes,1octetau-delà,
invalidrange/overflow,0byte,slotduplicate,HOLDpersiste,multiwrites/slots,stream
qui écrit partiellement puis jette, pas remboursement, pas réentrance/deadlock,
concurrence bornée. FixturesExpected numériques indépendants, pas résultat module
utilisé pour produire l'attendu. Signaler toute ambiguityinterface avant divergence.

Le parent fera review indépendante puis compilation/tests mémoire sous GO distincts.
Ce code ne valide ni tous les writers V3, ni le budget globalhost, ni l'ancienhelper.
Pas API/compile/import/test/runtime/DB/Git/sourcecentralL8/config/FF8/native/achat/
délégation. Seuls4fichiersnouveaux,hashs/docs/risques puisHOLD. ToutContextMode
stdout<2800Bavantémission, pasindexquery/inbox/board/provenancehorspaquet.
