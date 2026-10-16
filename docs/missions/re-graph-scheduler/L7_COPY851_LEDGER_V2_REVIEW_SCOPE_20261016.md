# L7 review V2 — dépendance ledger complète, sources/tests inchangés

GO autonome :`AUTONOMY_CONTINUATION_20261016.md`. La cibleV1 reste254P1FAIL/17608assert,
255tests14files :ledger omis par le parent, pasrégression851établie. Oldgel393,
préambulequalifié,TSC0,setupenv/cache,rougeet10DBreviewer restent préservés.

## Nouveau gel et couverture des entrées

Mêmes370sources/tests/rootfixtures,4candidats195451B (851/74f/5ed73/cb111),33DTO,
contrats et qualifications NONBLIND/standalone. Les payloadsV1 sont copiés byte-exact ;
anciensSCOPE/NOTES/manifest sont archivés sous HISTORICAL pour éviter de réactiver
leurs stades ou la phrase FAUSSE «ledger non nécessaire». Le présentSCOPE etNOTES
sont actifs. Aucun code/test/oracle/dépendance ou anciennepreuve n'est corrigé.

Le helper prépare seulement ses fichiers≤8MiB. `PARENT/LARGE_FIXTURE_BINDING.json`
déclare la fixture offline au chemin relatif
`docs/tech/investigation/battle-static-discovery/battle-graph-ledger.json`,8943882B,
SHA256 b5c9dfa112e53ffde99d7a30ef54a1ce13ae28a4e3c8e14432f085536310e4d4.
Le parent matérialise ensuite ce fichier byte-exact, en lecture seule, dans CE
nouveau gel. `LARGE_FIXTURE_PARENT_RECEIPT.json` atteste ce transfert local séparé,
non couvert par le reçu helper. Ni limite/config du helper modifiée,ni split,
troncage,parse/résérialisation,symlink ou interceptionIO. RAW98+ledger+registries
restent offline/PARTIAL/quarantined,pas nouveau run01/extraction/nativevalidation.

Initialement ACCÈS SEUL :lire touslescontrats actifs etnouveauxreçus/manifest,
hashdupaquethelper ETduledger matérialisé/flagsreadonly,rôleconditionsACK puisHOLD.
Ne pas dumper9MB dans le contexte ;hashstream/bytes enoutil seulement. Aucun droit
au ledger main/auteur,autreOWN/32DBL7/636L8 outranscripts:index/cheminsarchivés ne
confèrentaucunepermission. Exactnouveaugel+proofdirnouveau+preuvespropresV1 nommées
parparent seulement ;anciengel inchangé/aucunctx_search/inboxboard/team_results.

## Review conservée, seule nouvelle ciblée après GO parent distinct

Même sessionfreshNONBLIND SolMAX/Plan, tâche encore ouverte, pasfork/ancienreviewer
repris. La lecturestatiqueentière1385lignes/85membres etTSC0 sont réutilisables si
le parent confirme tous les fichierssources/tests/configs identiques. Les inputs
data complétés sont explicitement déclarés,pas une nouvelle conclusion scientifique.
Préambuleexposéauxrésuméspublics etSimStorestandalone partagenestedfreeze restent
limites finales,aucun oracle d'anciennesconclusions niwaiverpublication.

Après ACK/readback et GO FINAL TARGET_V2 distinct :UNE commande EXACTE255/14paths,
`bun test --timeout 30000`≤180s,mêmes14tests,cwdNOUVEAUGEL/tools/ff8-harness. Aucun
TSC supplémentaire,sourcefix ou repriseauto. Nouveau proofdir etTEMPcourt propres,
créés aprèsGO seulement,root[opencode]/nestedEMPTY/nonsymlinksmesurés ;TEMP/TMPspawn
=ROOT,guardstrictcase-insensitiveABSENT,LOCALAPPDATA/APPDATAuniqueségauxauxpinsTSC.
Digestenv avant/après DANSchaquectx_execute,seulsTEMP/TMPchilddifférent,pasSHAcomparé
àunautresandbox/pasclearenv. Nouveau lockexclusif pourl'unique invocationV2.

Avant/après :sourceshelper/reçus,parentcontrolsetledger8943882B exacts ;oldV1preuves
immutables. Fin naturelle annoncéeavantcollecte,comptesréels,puisDBgraphNEUVESretours
stdout≤12fermées/conservées/perclose-posthash-sidecarsqualifiés,TEMPcacheoutilopaque
retenu/hashé sansdésérialisation/deletion. Aucun oldTempglob/SQLdirect/ancienDB.
Rouge/setup/drift/refus→HOLDparent,sansfix/rerun/lockdelete/bypassnativepermission.

Probes EXTRA toujours SUSPENDUES mêmeGREEN :GOparent aprèsqualificationV2,puisverdict
indépendantscopéetgatescroisées avantintégration. Pasfull100k/Git/install/helperpatch/
autreworker/LLM/IDA/live/native/power/configglobal par cette projection ou sonaccès.
