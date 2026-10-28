# L7 reviewer — reprise ciblée seule, correction exacte du wrapper de setup

Le diagnostic604a5c8b/4016B est conforme :guardabsent,LOCALAPPDATA/APPDATA uniques
etidentiques au préflight,393pins etdeuxreceipts exacts,envinchangé dans CE sandbox,
quatrepreuvesTSC inchangées. La clef oubranche de l'ancien OR reste non attribuée.
TSCuniqueexit0 reste acquis ;ciblée/probes n'ont pas été lancées.

Parent vérifie enbytes le cache propre `l7rv-5620a967a0ed/node-compile-cache` :un
fichier1357764B,nonSQLite,nonsymlinks,sansdésérialisation ni suppression. Le créateur
exact n'estpas instrumenté. Le cache est un artefact outil opaque,pas inputsource
immuable ou preuve sémantique. Une copieopaque avant ciblée est conservée au proofdir,
pinée ;les éventuels changements runtime seront qualifiés après, jamais cachés.

Le flag FALSE `tempExistingOwnedDirsNonLinksAndEmpty` du diagnostic reste FALSE.
Le préflight initial préTSC `[opencode]`/nestedEMPTY reste historiquement vrai.
Pour CE stade postTSC seulement, root attend exactement `[node-compile-cache,
opencode]`,deux répertoires nonlinks etnestedopencode toujours vide AVANT la ciblée.
Ne pas vider, recréer ou remplacer ce TEMP autorisé ;c'est la continuation des
étapes de la même review,pas réemploi pour une nouvelle campagne.

## Seules corrections de wrapper permises par le GO TARGET_ONLY distinct

1. Conserver oldpreflight/lifecycle/logs/erreurpublique/diagnostic byte-exacts ;
   aucun re-run TSC,source/test/oracle/dépendance/helper modifiés.
2. Chaque nouveau ctx_execute prend SON digestprocess.env au début et le compare
   avant/après les checks puis la commande dans CE processus. Ne plus utiliser le
   SHA d'un autre sandbox comme gate d'égalitéenv. L'ancien SHA reste historique.
3. Vérifier séparément guardcase-insensitive absent etLOCALAPPDATA/APPDATA uniques
   égaux auxvaleursoriginales. Messagesdiagnostiques distincts, pas OR ambigu.
   Jamaisclearenv/repair. Le childenv copie l'environnement ACTUEL sans override
   hormis TEMP/TMP=rootcourt exact ;diff parent/child limité àcesdeuxclefs.
4. Rehash393pins/deuxreceipts/old4/diagnostic/contrôleparent,copiecachepréservée,
   constaterabsence de target.lifecycle/start/lock avant réservation de l'unique
   invocation via nouveau lock exclusif. Refus/setup/drift→HOLD,sansdelete/retry.
5. Capturer postTSC layout/cache avant ciblée, puis mêmespins etétatopaque après.
   Aucunmkdircache/cleanup/SQL/désérialisation ;toutobjetimprévu/DBpréalable→HOLD.

Après readback parent natif/ownership/pins/zéroconcurrent, GO TARGET_ONLY autorise
UNE commande EXACTE14paths de PARENT_DYNAMIC_REVIEW_GO, `bun test --timeout 30000`,
global≤180s,255attendus pasoracle. Aucun TSC ni full supplémentaire. Fin naturelle/
codes/comptesréels avantcollecte,puisgel/DBgraphNEUVESretoursstdout≤12ferméesconservées
etHOLDparent. Cache/DBsidecars posthashqualifiés,old22L7/636L8/ancienTempglob interdits.

**Les probes supplémentaires restent suspendues**, même si255PASS :nouveauGOparent
aprèsqualificationtarget. Rouge/setup/drift→aucunfixrerun automatique. Leslimites
NONBLIND/préambule etSimStorestandalone demeurentdéclarées,indexpartagé/inboxboard
interdits. Aucunprofil/modèle/provider/config/Git/LLM/native/intégration changé.
