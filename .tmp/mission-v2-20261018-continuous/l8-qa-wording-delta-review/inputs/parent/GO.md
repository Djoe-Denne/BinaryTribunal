# Parent — unique finding F1, GO correction de formulation QA seulement

Vdelta R2 result_mve3a11b_001d_at9qz2 / msg_150042182001FtrjggenEPFiUh,
task task_mve2mky4_000x_zwodmj : CORRIGE formulation uniquement,68pins2226691B
exacts final. Rapport accepté comme revue, pas source/QA/gate acceptées.
Parent a relu les lignes QA_PLAN206–207, test922–943 et jsonData931–937 :
finding fondé. Objets plain inspectés via descriptors ; indices de tableaux lus
directement. Un getter d'index dense peut être invoqué ; pas garantie universelle.

Owner/task QA existants l8-pure-factoring-qa-r1/task_mvdyy9ti_001i_4pvgrf.
R2 déjà figée dans l8-pure-factoring-qa-r2-frozen, intangible. GO trois outputs
QA possédés seulement : test/graph-phase2/pure-codecs.test.ts, QA_PLAN.md,
MANIFEST.json. Aucune implémentation source autre worker ne doit être consultée.

Delta déterministe :
- Test title : remplacer la généralisation «getters jamais invoqués» par
  «accessor d'objet plain instrumenté refusé sans invoquer son getter».
- QA_PLAN : limiter cette propriété à l'objet plain effectivement instrumenté,
  préciser que les tableaux lisent leurs indices et peuvent invoquer un getter ;
  pas garantie sur tableaux ni Proxy avec traps. Ne pas généraliser ce cas à
  graphJson, immutableSnapshot ou à une autre API.
- MANIFEST/provenance : actualiser hashes/tailles/référence au présent supplément,
  et restreindre la même affirmation si elle est répétée dans ses données.

NE PAS modifier assertions, fixtures, bodies, imports, contrôle produit, schema,
le Proxy transparent attendutrue ou nombre des59tests syntaxiques. Pas nouveau
test ni réaudit ni changement d'algorithme pour accommoder un texte erroné.
SourceR2 demeure13pins figés, inchangés. Parent comparera tous les testbodies
avant/après indépendamment des titres ; aucune couverture exécutée inférée.

Rehash36pins et suppléments autorisés ; trois hashes/tailles/diff/limites dans
réponse NATIF finale. Pas compile/run/validator/import produit/OS/DB/git/IDA/live/
réseau/délégation/teamtools/claim/complete. Vérification delta fresh étroite après
réception, pas de nouvelle revue globale ; gates parent encore fermées.
