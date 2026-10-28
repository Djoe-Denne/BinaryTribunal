# L2 — arbitrage de projection des IDs, RV2FINAL-01

2026-10-14. Parent choisit **optionA** du plan l2-ids-astra, task
`task_mv8fxhjq_00lh_ap0fn4`. Source SolMAX et reviewSolMAX encoreBLOQUANTS ;
route corrective renforcée AstraMAX dernierrecours préautorisé, même préférence
mission, pas fallbackgénéral. Edit2 capabilities.ts/graph-extract.test.ts.

## Contrat approuvé avantwrite

1. Sujets régionaux originaux **représentables ≤128 points Unicode** restent
   exactement leur ancien subjectId. FonctionIDs, objets/sourceIDs, refs, historiques
   et familles ne changent pas. L1 inchangé, entréesobjectID160 toujours légales.
2. Pour régionoriginale >128points, projectionprivée déterministe domain-separated
   SHA256(moduleSha256+originalObjectId), **jamais nom/troncature**. Réserver TOUS
   lesobjectIDs originaux avantallocation et toutesaliases produites ; allocation
   deslongs en ordrecanonique, suffixe déterministe borné si collision naturelle
   de namespace. Ne pas se contenter de «SHAcollision improbable» : un objetcourt
   peut avoir le texte exact de l'alias d'un autre. Nombre d'essais borné par
   nombre d'IDs réservés/produits ; IDfinal≤128, Unicodecodepoints selonvraiL1.
3. Map interne **originalObjectId→fact régional** pour import-use ; ne pas relier
   unresolved.referencedObjectId à l'alias par accident. Citationlossless de l'ID
   original dans EvidenceRef.detail existant, sha256 exact du recordsource complet
   et provenance/module inchangés. Pas API/champ de transportnouveau ; binding
   local revalidé au hit selon ce mapping et règles explicites.
4. IDs de preuves générés fullSHA256/domain-separated, bornés/stables, citations
   complètes séparéesdansdetail ; aucun nom comme identité/pasde simpletroncature.
   FactIDs restent fullSHA256. Nouveaux exports/ruleset **v5** et cache namespace
   versionné ; snapshots/CAPv4 déjàfrozen ne sont pas réécrits/migrés.
5. ValidationvraieL1+bindings des sorties raw ETmiss avant return/cache.set,
   hit revalidé. Aucune sortie invalide etaucun cachepollué/premierappelpassant
   puissecondfailing pourmêmesbytes. Caches ordinaires/clones/invalidation/stats
   preservés ; alloldchrono/provenance/PEunknown/shardguards inchangés.
6. 146ancienscas préservés, append125/126/128/129/160 imports/tables/Unicode,
   functionseed/multimodule, collisionprefix/suffix/répacking sourceordre,
   identity/citation/hash/binding, raw=candidate=miss=hit. Graph/normalizer/deps
   byteexact, delta productioninverse mémoire→caps121352d7. GatesContextMode
   ownWT/typecheck/focused/full puis newfreshreview **ciblée**+gatesparent.

Un fallbacklossy/erreurglobale/rétrécissement d'entrée ne remplace pas cette optionA.
Besoin API ouautreexception : escalader avantwrite. Aucun Git/L1/central/config/
registry/install/newdeps/subagent/IDA/live/native/promotionL8/G4/G6/G7.

## Projection d'entrée et scope réel des pins

OWNWT l2-ids-astra, native session `ses_ec45597bcffenclpBgs4ukh2Dn`
openai/gpt-6-astra/max verified, directoryown fixéparent. Inputsnapshot complet
343/343 byteexact à `.tmp/re-graph-scheduler/inputs/L2FINAL/`, manifestf3402be1.
Runtime324pins (code/schema/tests/5refs/raw98+manifestoriginal) transférés/compatibles
sans écraser aucunexistingruntime. Comparer343 dans **inputs**, ne pas inférer
qu'anciensdocuments parentHEAD sont les mêmes que les projections tardives.
Depspréinstallées node_modulesjunctionREADONLY/package+lockcompatibles, noinstall.
