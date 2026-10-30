# 17. Rétention corrigée et contrôles affectés réussis

## Résultat observé

Le même négatif de rétention, sans modification pendant le correctif, passe désormais ses six assertions : une interposition, zéro émission, body brut inchangé et retry exact conservé. Le premier négatif d'émission reste lui aussi dans la suite client et réussit.

La seule modification de code depuis le test-seul est une transaction immédiate entourant contrôle de classification et UPDATE pending. Aucun await sous verrou, nouveau schéma ou store. Les deux documents d'audit ont été actualisés ; les configurations et le fichier de tests sont identiques à ceux du RED rétention.

## Vérifications parent sur le candidat r6

- Rétention ciblée : **1 PASS / 0 FAIL, six assertions**.
- Typecheck complet : **code 0**, environ 3,3 secondes.
- Client : **22 PASS / 0 FAIL, 82 assertions**, incluant les deux négatifs de course.
- Protocole : **6 PASS / 0 FAIL, 26 assertions**.

Quinze secondes par test ; 360 fichiers relus après, aucune dérive. Le contrôle ciblé est inclus dans les 22 tests client, pas additionné comme couverture distincte. Aucun thread, appel natif ou suite globale exécuté.

Les preuves des chemins non affectés restent réutilisées dans leur portée. Les deux RED historiques sont conservés comme échecs sur leurs anciennes versions, pas convertis en succès rétroactifs.

## Suite décidée

La même revue indépendante reprend uniquement la protection pending et ses impacts pour lever ou maintenir le résidu. L'intégration reste suspendue jusqu'à ce verdict. Les obligations natives et les étapes publication/contexte suivant ne sont pas considérées réalisées.

## Preuves

- `../evidence/writer-r6-manifest.json`, SHA256 `d982b55d4c813e8e94066af41cc95bfb0c639ef9b4191bf0371ef8dac71d5d42` ; HEAD `b0d10f6d19ad54c21a9635e90d6b4946fde4ffd0`.
- `../evidence/writer-r6-parent-checks.json`, reçus/captures `retention-green-r6`, `typecheck-r6`, `client-r6`, `protocol-r6`.
- Test inchangé depuis r5 : SHA256 `77143b27827827fba2719feb049ce9ebaf52b94dc86cd83b9efb5e3b950983f9`.

Localisation : mutation pending du journal client existant. Impact : rétention et retry corrigés, vérification ciblée renouvelée. Limites : verdict indépendant encore attendu, aucune acceptation native ou globale.
