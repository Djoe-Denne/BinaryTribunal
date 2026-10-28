# ABI physique core V3 — frontière et ownership avant source

ABI parent `guard-v3-core-abi1`, fichier neuf .tmp/coordination-three-20261014/
V3_CORE_ABI1_20261017/GuardV3.Contracts.cs. Déclarations C#5/System seulement,
aucune PInvoke/I/O/process/Job exécuté, aucune compilation. Le fichier doit être
hashé/frozen avant admission aux deux auteurs ; pas deux copies divergentes.

Complète draft2, ne change aucun ancien gel. Les enums/records sont internes à
l'assembly trusted. CaseIdentity64hex+epoch n'est pas une capacité kernel depuis
JSON. IGuardBorrowSource ne peut être implémenté que par l'ownerG contrôlé/revu,
avec référence identity exacte, kind, liveness et contrôle mono-thread pendant
borrow/query/close. Cette invariant est source/protocole, pas une protection contre
un code arbitraire déjà chargé dans le même assembly. Aucun faux security claim.

Root wait et accounting/list sont séparés : au plus4096 RootWait normales et300
cleanup EN PLUS des4096/300 tentatives de paire de draft2. Chaque compteur est
cumulatif et préchargé avant appel, mêmes deadlines5000/20000/30000/55000ms,
waitslice≤100ms. C'est la borne explicite de cette autre boucle demandée dans
draft2, pas un reset des crédits de queries. Un épuisement reste HOLD.

Sourceguardian : nouveau core natif/état/ownerG, seul créateur/assignateur/terminateur
de J/T. Sourceobserver indépendante : ObserveRoot/CapturePair uniquement,
ne ferme ni duplique ni assigne de handle, ne décide pas publication/libération.
Guardian vérifie rawsizes/champs/identité/seq et RootExitWitness après libération
références de T. Pas de booléen D ou fakeIntPtr accepté comme binding hôte.

Cette première tranche ne contient pas encore un launcherS qualifié ni son driverD,
capture préchargée/globalledger. Le core doit être réellement implémenté mais
refuser l'exécution si ces host bindings sont absents ; interfaces ou mocks ne les
qualifient pas. Le prochain contrat/sourceS et la revue de wiring restent requis
avant GO qualifications. Sourcecore n'autorise aucun run, même canary inoffensif.
