# Extension de contexte CaptureWiring — source seulement

Le parent ajoute la copie byte-identique de CaptureWiring.cs, 6029 octets,
SHA256 d08beba3b371661a1c7a12d4ddda697514556bdc2f91dc16028b0fa20cc2987f.
Provenance : V3_HOST_SOURCE_OUTPUT_20261017/MANIFEST.json et ORDER.md:47 ;
hash intégral parent comparé au manifeste d'origine, pas seulement au pin court.
WriterLedger reste exclusivement la version corrigée déjà pinnée dans les 14
inputs initiaux, jamais celle du premier manifeste host. Aucun gel modifié.

Cette extension fournit le corps ICaptureSource, CapturePump,
HostCaptureReservation et CaptureStatus requis par la closure. Elle n'ajoute
aucune autorisation de compilation, import, exécution, test ou API native.

Disposition parent du plan : faisable comme source candidate bornée. Le cas G
sera nommé explicitement g-thread-loss-postRun-preACK : faute managée injectée,
capturée au sommet du thread puis thread réellement terminé. Ce n'est ni une
perte mid-Run, ni un crash non géré, ni une perte de processus G/S séparés.
Ces trois propriétés demeurent NON ÉTABLIES et n'empêchent pas une livraison
source de ce seul cas borné. S-loss et D-loss restent des événements signallés.
Ne pas présenter ces cinq variantes comme matrice exhaustive de pertes réelles.

Avant écriture : ACK des deux fichiers supplémentaires et hashes, puis attendre
l'approbation native du plan. Rehash final des deux manifestes, ancien 14/14 et
supplément 2/2 ; leurs versions restent disjointes, pas de réécriture de l'ancien.

Contraintes de source pour approbation :
- un cas par lancement parent futur ; source enfant inerte et bornée ; aucune
  terminaison de processus externe, aucun Thread.Abort, no bypass du noyau G ;
- le décorateur délègue les 14 membres à RealNative ; injection SetEvent
  annoncée, tentative unique, échec observable fail-closed, jamais succès inventé ;
- ACK sur le thread propriétaire du core seulement ; pas d'appel propriétaire
  depuis un autre thread, pas de faux GuardianAlive ou d'ACK après terminaison G ;
- ACK mismatch = une seule écriture complète de 192 octets vérifiée, copie
  bornée et XOR de l'octet 191 au seul slot GuardianResult, vrai FileStream et
  vrai readback, jamais source readback substituée ni IO hors budget ;
- attestation length=4 : vérifier l'incohérence avant core/owner ; distinguer
  préparation des events/pipes des appels Job/T, et documenter leurs propriétés ;
- aucun close manuel de J par harness, aucun crédit de budget recréé ;
- sortie honnête fail/HOLD pour timeout ou injection non exercée, jamais PASS.

Livrables autorisables après approbation : RunnerMatrix.cs, DESIGN.md,
MANIFEST.json dans outputs uniquement. Toute nouvelle extension de closure ou
contrat se demande avant écriture. Aucun résultat d'exécution n'est autorisé.
