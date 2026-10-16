# L8 A2 — RED conforme, accès puis GO séparé pour DEUX sources seulement

Prolonge la route utilisateur Sol/max ciblée et le plan 00fbd781 ratifié A–E dans
`L8_A2_CORRECTIVE_PLAN_APPROVAL_20261016.md`. Même auteur/task/OWN/Sol max ; aucun
autre modèle, reviewer réouvert ou ancienne permission 6+7 réactivée.

## RED reçu et vérifié, pas correctif validé

Unique run RED-e4394246c19a, PID41468, 13:25:28.926Z→13:25:36.878Z, 7952.0021ms,
exit1 naturel sans timeout/rerun. **20PASS/27FAIL/47tests/221assertions**, 16 échecs
client et 11 pause aux assertions de régression. Pas 27 proofs de chemins ensuite
non exécutés : assertions après le premier expect raté, observateurs PREPARED
nonpositifs non entrés et checkerC ne sont pas encore validés.

Parent contrôle 14 artefacts/1400575B, 791 checks/764 chemins nonDB protégés exacts,
15 baseline/60 anciens et test nouveau 39246B/70857679…a145 inchangés. Registry ancien
préfixe123186B exact, tail34071B/118rows = 71 réservations/47closes/24sansDB.
47 DB8269824B et leurs receipts closes/pins identiques après exit, sans sidecars,
95fichiers8296180B retenus. Aucun ancienTemp/248DB historiques ouvert pour cet audit.
Deux seeds C de CE RED (cohérent460fb7d2 et incohérent282bf344, chacun53248B)
conservés FERMÉS ; aucune copie/reopen/SQL ni checkerC exécutés.

## Permission en deux étapes, pas d'exécution maintenant

Lire entièrement cette décision, BASELINE et vérification parent, hash/conditions/
rôleACK puis attendre **GO FINAL TWO_SOURCE_WRITE_ONLY** distinct.

Après ce GO seulement, autorisés sous OWN/tools/ff8-harness :
- `src/client.ts` : imagecanonique détachée + cohérence des rows utilisés, borné A/C ;
- `src/graph-engine.ts` : guards pause locaux / préparation atomique sameDB et
  observations maintenues, borné B/D.

Nouveau test70857679 reste BYTE-EXACT, pas de changement d'oracle ou de données pour
verdir. Les13 autres runtime, 60 anciens tests, fixture-driver/adapter/L1–L6/Store/
validation/schema/config sont readonly. Pas getter/proxyblacklist, codec nouveau,
cast pour contourner autorité, blanketreturn de step, faux quota/reject, remboursement
N, ni réseau interconnexion atomique prétendu. Conditions A–E restent intégrales.

Écrire seulement la source et un livrable DELTA/pins/justifications/risques dans
OWN/.tmp/L8_A2_CORRECTIVE_20261016/WRITE-<fresh>/, sans charger/exécuter le module.
Pas probe/typecheck/test/SQLite/DB/copieSCRATCH/reopen/registryappend dans cette phase.
Pas source/test tiers, import d'evidence ignorée dans le code permanent, nouveauport,
API privée/readonly/SQL/migration. Toute nécessité supplémentaire → STOP parent.

Remettre les2 nouveaux pins et diff, 13runtime et test47 exacts, tous anciens gels/
RED/DB conservés ; task globale reste ouverte et candidat BLOCK/non accepté.
Puis gates distinctes : contrôle diff parent → TC+60anciens+47nouveaux/fixturespropres
autorisées, checkerC sur COPIESscratch spécifiques (jamais originals rouges), gel
runtime16/fullunique exclusif, review FRESH indépendante du runtime complet et
gates parent. Aucun de ces tests/copies/full/intégration n'est autorisé maintenant.

L7 nouvel échec P1/routageWAIT est indépendant, pas raison de modifier son source.
Pas Git/install/sous-agent/inbox/LLM/dispatchréel/IDA/live/autremission/power/native/
science/régimeB/simCLI/L9/L10. Source-write ne vaut ni maintransfert ni acceptation.
