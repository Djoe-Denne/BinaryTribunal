# Review V3 — addendum officiel kernel, accès documentaire seulement

Task task_mvc422gx_0000_rrxckr, même reviewer fresh indépendant
v3-contract-review-r1/ses_eb7196c7dffejBDJG36NRqMwC7, même rôle/cycle1/SolMax.
La demande concerne le nouveau contrat, pas une reprise du résultat historique.

Le parent admet dans un paquet séparé les huit documents Microsoft déjà récupérés
en HTTP GET, leurs tailles/hashes et manifeste original. Lire les octets complets,
vérifier le reçu/manifest et confirmer le rôle/conditions ; poursuivre ensuite la
review déjà admise, avec un GO documentaire distinct. Aucun appel kernel/Job,
compilation, code, fixture, runtime ou navigation par lien n'est autorisé.

Documents : QueryInformationJobObject ; AssignProcessToJobObject ;
TerminateJobObject ; IsProcessInJob ; JOBOBJECT_BASIC_ACCOUNTING_INFORMATION ;
JOBOBJECT_BASIC_PROCESS_ID_LIST ; JOBOBJECT_EXTENDED_LIMIT_INFORMATION ; Nested Jobs.
Ils servent à attaquer les classes/champs, portée nested, buffers/troncature et
conditions de cohérence. Deux appels successifs ne sont pas réputés snapshot
atomique ; la review doit définir ce que le prédicat peut réellement démontrer,
notamment après scellement des admissions et terminaison du root.

Les contenus officiels sont des sources, pas un verdict proposé. Signalement de
lacunes documentaires permis ; ne pas transformer une référence absente en preuve
d'impossibilité ou inversement en permission. Tout ancien last-close non établi,
budget intégré non prouvé et gates runtime restent inchangés. Aucune référence
supplémentaire n'est autorisée par ses liens seuls.
