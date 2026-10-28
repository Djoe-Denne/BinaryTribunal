# Fresh revue étroite — deux assertions QA pour les deux vrais guards

ACK pins/tailles+NONBLIND+microplan puis attendre GOaudit parent. Rouge réel :
typecheckvert,90PASS/1FAIL ; missingunitId observé au lieu du type attendu.
Before/after complets, codec/schema réels pinnés et diagnostic fournis.

Vérifier delta EXACT : garder l'entrée work-unit incomplète pour affirmer le
guard required.unitId ; ajouter le type erroné depuis partitionDoc complet,
déjà testé positivement dans le même fichier. Le nouveau négatif modifie seul
schemaVersion="x". Ainsi l'ordre required→types reste contrôlé, et le refus de
type initialement visé a enfin les prérequis nécessaires. Pas matcher permissif,
skip/catch ni produit modifié ; ne pas prétendre coverage complète work-unit.
Un expect ajouté, mêmes59tests, annotation expect<unknown> antérieure intacte.
Le JS n'est PAS byte-identique pour ce delta de fixture volontaire.

Ré-dériver required avant parcours Object.entries puis type avant enum dans le
codec pinné, et complétude de partitionDoc par schema/positif. Pas réaudit des
algorithmes ni59tests. Verdict NATIF ACCEPTABLE_GUARD_ORDER_QA_FIX | CORRIGE |
BLOCK,2–4ancres et limites/rehashfinal. Aucune exécution/test/transpilation/
compiler/validator/import produit, écriture/OS/DB/git/IDA/live/réseau/délégation/
teamtools/claim/complete. Lecture/hash/parsingpinnés autorisés. Les résultats
90/1 restent rouges ; nouvelle gate parent distincte seulement après acceptation.
