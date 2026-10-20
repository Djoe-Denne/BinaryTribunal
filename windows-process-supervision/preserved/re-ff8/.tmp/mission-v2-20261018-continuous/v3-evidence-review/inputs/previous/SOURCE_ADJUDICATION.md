# V3 matrix — adjudication parent source bornée

**ACCEPTABLE_SOURCE_SCOPED_WITH_READING_NOTES — UNCOMPILED_UNEXECUTED.**
Décision de ce relais uniquement. Aucun résultat de compilation, test, Job,
processus ou événement OS candidat n'a été observé. Aucune intégration,
publication000c, qualification globale ou tâche historique clôturée.

## Livrable physique accepté dans ce seul périmètre

Répertoire `v3-matrix-source/outputs/`, exactement3 fichiers, nlink1 et gelés :
- RunnerMatrix.cs,35669B,
  ee6a830ce4e6e03fcdc7c3d743835bc87b1e96b9ce86cf05a635604fc2e16a7c.
- DESIGN.md,17576B,
  f230ef21b8be82356e401b690767283be18e82e0c41512a0459f44490c05a75a.
- MANIFEST.json,4186B,
  2226b3fbc313a81851a42b7d71c5787287b47e33005e4d7cd475f6f97f958232.

Auteur v3-matrix-source-r1 / ses_eb1bcd297ffeBMGIuAWnXb6pkB,
task_mvdlnm56_000m_uhifru, Sol/xhigh natif vérifié, arrêté après gel.
V fresh v3-matrix-review-r1 / ses_eb1a6afeaffewN7eONL1u7q4b5,
task_mvdmkde2_001w_j7jz3b, Sol/xhigh natif vérifié, sans fork de l'auteur.
V voit source/DESIGN volontairement, pas un rôle B aveugle. Verdict public V :
ACCEPTABLE_SOURCE_SCOPED, aucun défaut source bloquant dans les cinq cas bornés.

Parent a relu directement les délégations, injection/WaitControl, host/thread/
ACK, flux192B, contrôle de faits, retours précondition/finally et cleanup. Rehash
final indépendant : V20/20,319720B, manifeste
6d1b1f3d87339c7dac1e44e4a68c48892484c3c7dfd8d517a5fdf5fd19f488f8 ;
3 sorties originales égales aux copies review et au manifeste. Les14+2 pins
d'entrée auteur restent intacts. Aucune compilation/parser/import produit.

## Six preuves retenues (ancres RunnerMatrix.cs sauf indication)

1. :171-240 : 14 membres owner correspondent à l'interface réelle et délèguent
   à RealNative. Injection ciblée débite sa tentative avant SetEvent, seulement
   après Resume réel=1 ; WaitControl réel, échec d'instrumentation exposé.
2. :245-307 : IsAlive réel, thread dédié dans le seul cas G, Run puis faute
   managée capturée et terminaison ; Join borné, timeout→null ; ACK réservé au
   thread propriétaire non-G, aucune fabrication de liveness/Thread.Abort.
3. :312-349 + WriterLedger corrigé:114-139 : vrai FileStream, une Write192B,
   copie bornée/XOR191/diff1 après sink débité, Read/Seek délégués. Le readback
   n'est pas la source publication ; l'ACK core compare192 octets exacts.
4. :474-507 : gardes de faits par cas, liveness/phase/injection/stop/ACK/budget
   requis ; attestationlength4 exige incohérence et zéro core/owner. Aucune
   absence d'injection ou timeout ne peut satisfaire les attendus complets.
5. :361-388,575-600 : frontière de handoff conservatrice, closes des seuls
   bouts possédés/fichiers ; cleanupFailed interdit le chemin de correspondance
   normale. J n'est pas stocké/clos par le harness.
6. DESIGN:85-108,146-177,211-237,266-278 : enfant/join60s, proposition de borne
   globale70s pour un futur run ; stdout horsledger, stderr non observé,
   fermeture OS de J jamais une preuve de last-close, gate parent séparée.

## Deux notes opposables à toute lecture/publication future

**Résultat G absent :** :521-524 émettent notamment QUIET=false et
JOB_RETAINED=false quand g==null. Ce sont des valeurs de sérialisation sans
résultat, PAS des preuves de non-quiescence/non-retention. Toute lecture future
doit suivre STATE/PHASE/MATRIX_HOLD, présence effective du résultat et le cas.
Pour les quatre cas core, PHASE=none/null invalide les preuves ; pour attestation
incohérente, absence core est attendue et doit être croisée avec owner/corecalls0.
Ne jamais agréger les booléens seuls. Aucun décodeur/témoin n'est validé ici.

**Ordre émission/cleanup :** DESIGN:168-170 décrit le chemin normal. Les retours
de précondition :373-378 émettent via Precondition AVANT le finally Release:385.
Ils restent exit2, jamais succès ; erreur stdout sur ce chemin reste2 et non3.
Ne pas citer DESIGN comme garantie uniforme d'émission après cleanup pour tous
les chemins. Source et DESIGN gelés préservés ; cette note restreint la lecture,
elle n'est pas une correction source ou une preuve runtime.

## Périmètre exact, reste non établi

- D/S : événements signallés, pas disparition de processus D ni mort réelle S.
- G : g-thread-loss-postRun-preACK seulement, pas perte midRun, crash non géré,
  ni processus S/G séparés. Capturer la faute préserve S co-localisé.
- ACK mismatch : injection volontaire annoncée, pas une corruption OS observée.
- Attestation : events/pipes/fichiers préparatoires existent ; zéro Job/T n'est
  qu'un attendu conditionnel, non une absence générale de toute API native.
- Budget intégré cross-process NOT_PROVEN ; last-close case6 NOT_ESTABLISHED.
- Exit0 signifie seulement correspondance des faits conditionnels, jamais PASS
  de DriverLoss, acceptance native, promotion G5/G6/G7, C3-C5 ou full44.
- Les délais et sorties sont des propositions de contrat futur. Une terminaison
  externe/timeout effectif nécessite son propre GO, bail et preuve d'ownership.

## Gates non ouvertes

La compilation exacte x64/C#5 avec8 dépendances pinnées reste NON AUTORISÉE par
ce rapport. Un éventuel GO compile-only devra préciser compilateur/arguments/
hashes et ne chargera/exécutera rien. Un run ultérieur exige encore une gate
séparée (cas unique, captures bornées, fichiers réels192B/diff191, injection
exercée, aucun HOLD/cleanup error, délais/actions externes autorisés). Le relais
ne possède ni ne clôture la gate historique000c ou full-admission000d.
