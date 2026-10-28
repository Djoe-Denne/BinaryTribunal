# Factoring L8 intégré — premier typecheck rouge, correction type-only en revue

## Chaîne source/QA statique acceptée scoped

R1 source/QA : result_mve1fn73_0009_1tjs9j CORRIGE ; R2 :
result_mve3a11b_001d_at9qz2 confirme delta source et cinq réparations QA,
reste F1 wording ; final result_mve3thnm_0028_kv7jmj accepte ce delta après GO.
Parent combine ces revues dans l8-factoring-parent-final-adjudication.json.
Ce sont acceptations source scoped, pas qualification runtime ou globale L8.

## Intégration parent et incident conservé

Douze cibles revues (11sourcesTS et1test) déployées byte-exactes ; 268guards
cohérents après déploiement, backups des originaux retenus. Premier arrêt EPERM
sur graph-pipeline.ts readonly documenté ; les deux premières cibles déjà copiées
et autres cibles baseline/absentes vérifiées, backups hashés. Reprise distincte
autorisée, aucune relance aveugle : attributs de la seule cible en écriture rendus
temporaires puis restaurés ; aucune opération globale ACL/config. Attributs des
deux copies initiales non reconstruits rétroactivement, limite déclarée.
Receipts : l8-factoring-integration-interrupted.json et
l8-factoring-integration-receipt.json dans le lot scratch continu.

## Premier typecheck — ROUGE retenu

`tsc --noEmit`, exit2, 6890ms, une TS2769 à
test/graph-phase2/pure-codecs.test.ts:579 : expected fixtureunknown non compatible
avec matcher GraphAdmissionSource inféré. Aucun test lancé. Receipt
l8-factoring-typecheck-receipt.json SHA256
9115f2f60041018c47411db41630abf22e3342734290b81d1fcb578060895e5f,
stdout/stderr conservés. Ne pas annoncer les anciens32/107tests comme un run de
ce factoring et ne pas effacer ce rouge.

## Correction parent proposée — type seul

Une insertion expect<unknown>, +9B ; opérandes/toEqual/fixtures/bodies inchangés.
Avant68151B/ba8d95fa…, après68160B/
c2ba506ffb630e4bf80e85c55d2b729ab73bc2cebb14867533d19b198af68d53.
267autresguards intacts. Transpilation parent sous options fixes identiques :
émissionJS byte-identique,68529B,
44734b0b28398dc12393714166dd7ad9c7802a5e6a78d9daf5ac0bf5920cba3d.
Émission retenue en données, jamais évaluée ; pas nouveau succès typecheck.

Fresh vérification minimale task_mve46t2j_002e_pufx0o,
l8-factoring-qa-typefix-review-r1, session ses_eafe2fc2effeMYQiIq6IDdiJz3 :
grille20/25 → Luna none natif vérifié, sans override.7pins248047B,
manifest88020f20eca5cf5b491093e586495383e8a56656e44682c52199af3dca5b5323.
ACK puis GOaudit nécessaires. Après acceptation : gate distincte, nouveau
typecheck ; tests seulement si vert et ressources de chaque suite comptabilisées.
La suite planner-admission-budget contient une fixtureDB réelle, pas heap-only.

S1code resteHOLD jusqu'au repin qualifié ; source C# corrective en revue séparée.
Aucune activation native/full44/G5G7 ni portabilité Linux acquise ou migration.
