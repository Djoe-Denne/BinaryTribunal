# M2 — 128 : compilation refusée, corriger les raccords locaux

## Résultat réel

Paquet127 : TypeScript exit2,11diagnostics,2160ms, une invocation sans retry ; sources stables. Aucune base, aucun asset ou thread créé. Paquet clos rouge ; logs et reçu conservés, hashes vérifiés. Les contrôles source126 ne sont pas une preuve de compilation ou de runtime.

## Causes recoupées et correctif source

1. final-inventory389 appelle verifyControllerScope98 avec quatre arguments alors que sa signature133 en exige cinq, dont EventLog. Le second appel237 passe déjà events. Raccorder le même EventLog réel ; ne pas retirer le contrôle ni rendre l'argument optionnel. C'est un raccord fonctionnel manquant, pas une simple annotation.
2. replacement-fixtures86 et t2-fixtures48 passent une origine readonly à un helper qui demande ParsedExecutionEnvelopeV1 mutable. Adapter les signatures des helpers privés réellement lecteurs vers ReadonlyData existant, en préservant bytes et absence de mutation ; pas de cast, any, désactivation readonly ou reconstruction de preuve.
3. replacement.test43 compare un CandidateRef non nullable à candidateRef nullable : garder l'égalité et la preuve de non-nullité attendue sans assertion non vérifiée qui masquerait une absence. À88, l'inférence du résultat exitObserved n'est pas compatible avec l'assertiontrue : préserver l'observation réelle depuis callback, jamais remplacer par l'attendu. Éviter les modifications du lifecycle déjà revu ; besoin dans un fichier supplémentaire à escalader avant édition.
4. Les deux test.each175/183 reçoivent hostFaults124 readonly, incompatible avec la surcharge Bun installée. Fournir une copie de table correctement typée, même ordre/six causes et mêmes assertions précises ; ne pas supprimer de variantes ou convertir defect en unknown/any. Les diagnostics dérivés178/179/190/194 se traitent avec ce raccord.

Après snapshot des douze sources124, du manifeste et du contrôleur127, autoriser au plus **cinq fichiers existants** : src/graph-final-inventory.ts ; test/s2-author/final-host-fixture.ts, t2-fixtures.ts, replacement-fixtures.ts, replacement.test.ts. Modifier seulement ce qui est nécessaire ; aucun autre produit ou lifecyclecontender dégelé. Aucun test historique ou input122 modifié. Si les signatures readonly révèlent une vraie mutation, signaler ce fait avant refactor plus large ou cast.

Revue indépendante sur les deltas et impacts de l'EventLog/readonly/observations uniquement ; réutiliser les preuves126 hors impact. Les cinquante cas et leur sens restent conservés. Source seulement, aucun import évalué/replan/seal/bind/typing/test/thread/SQL/DB/opener/asset/provider/native/Git/délégation/oracleQA. Après livraison/gel, nouveau paquet de compilation distinct seulement après revue ; ne pas rejouer127.

## Sûreté et limites

HOLD125 reste applicable à tous les lancements de thread. Aucun défaut de compilation ne justifie de lever ce blocage, de changer les bornes ou d'ajouter une infrastructure. Remplacement/S1concret/contention non obtenus ; S2/M2 ouvertes. Les trois commandes consolidées restent non lancées.

## Annexe preuve

Evidence `s2-replacement-124-typing/typecheck.result.json` ; sourceSet exécuté `c4df3c659069af9c934cae83fa428eabc54d4b1dd3fbdf2ba9578340370b5c84`, reçu SHA256 `d58d225eff51fdd1cf2d102d76cdf03677e931155c8e1bd133ae219dc8f74655`. Un premier comptage de diagnostic par regex du script d'analyse a été mal échappé et donnait0 ; le comptage corrigé par lignes contenant «error TS» donne11, sans réexécuter TypeScript.
