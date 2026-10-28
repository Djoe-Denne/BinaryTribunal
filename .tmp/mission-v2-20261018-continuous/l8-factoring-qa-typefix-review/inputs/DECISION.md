# Parent — une annotation seule après rouge TS2769, pas retry aveugle

Intégration12targets terminée après incidentReadonly documenté ; guards268exacts.
Premier typecheck nonémettant exit2/6890ms, une erreur à
test/graph-phase2/pure-codecs.test.ts:579 TS2769 : matcher inféré
GraphAdmissionSource ne peut recevoir expectedfixture de typeunknown.
Receipt rouge SHA2569115f2f60041018c47411db41630abf22e3342734290b81d1fcb578060895e5f
et diagnostics conservés sans écrasement ; aucun test n'a été exécuté.

Parent corrige mécaniquement UNE occurrence : expect(...) → expect<unknown>(...)
sur cette assertion. Même comparaison runtime toEqual, mêmes opérandes/fixture,
pas cast produit ou guard affaibli. Source11TS factoring byte-identique.
QA R3 complète gelée readonly avant ; seule cible intégrée de QA change de9B.

Avant toute nouvelle gate : preuve parent transpileModule before/after avec
options/fichier identiques, JavaScript émis byte-identique et hashes retenus ;
diff exact unique et268guards dont267inchangés ; vérification fresh minimale
du type-only contre le rouge. Ne pas transformer cette transpilation en succès
du typecheck ou en exécution des tests.

Puis gate distincte/once-only seulement après revue acceptable, sans réutiliser
le receipt rouge. Si typecheck vert, tests ciblés retenus et leurs ressources
qualifiés sous snapshot propre. Pas acceptanceglobale/native/full44/S1codeGO.
Le test admission-budget legacy contient un vrai fixtureDB (test:432–491), pas
heap-only : sa qualification devra réserver/comptabiliser ce namespace possédé
et vérifier fermeture/fichiers/sidecars, ou déclarer explicitement sa sélection
limitée. Aucune fausse assertion «suite intégralement pure» autorisée.
