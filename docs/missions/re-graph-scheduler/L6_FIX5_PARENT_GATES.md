# L6 v5 corrigé Max — gates parent et re-review

2026-10-14. **NON ACCEPTÉ, EN RE-REVIEW** ; aucun G4/G6/native ni L8 validé.

**Mise à jour : re-review finale BLOQUANTE** malgré ces gates. Projection sous-intent non liée au node/binary canonique (wrongEA deuxownedIDs→mêmeinput/I/O), attestation PASS mutable enFAIL pendanthook puisCOMMITTED, reçu artifactF0 relabelF1 débloqueG1, pendingeffect/cibleIDBembedded horsoracleL1. Parent confronte addUnit321–323 et attestation681–716 au code, confirme trous de guards ; probes dynamiques reviewer mémoire/fixtures, pas native. Détails et reprise indépendante **Astra max dernier recours** : `L6_V5_LAST_RESORT.md`. Gelci-dessous préservé, aucune acceptance/déblocageG4 déduit des69tests.

Auteur `l6-fix-max`, Sol max natif vérifié, own4 (eventlog inchangé). Livraison finale69 tests ; ancienne source/gels/historique conservés, aucune écriture worker Git/IDA/config/L1/central. Shutdown demandé après livraison.

## Gel final confirmé

- eventlog.ts `5dad943a6c3edc6c3045dd2e91715953db6eb1aff85d74915d5811bb7e02d31e`
- unit-lease.ts `e22c6bddee9431add377cf15c74edb17bcc8d1972d66ee2360fbb4df34264842`
- graph-store.ts `91089eed765f69c5b42425a2d62b85f5b25931d7f1cc29491fd8cd37f9d8a30f`
- eventlog.test.ts `2aef57e8c9b3aa00de469ef15372f38305616ccd49cc27c07e573d4e2ae12f14`

Bundle parent `.tmp/re-graph-scheduler/review-20261014/L6FIX5`,32 chemins canoniques, manifest `dc1cb8d35df0527916e8e17d9879b6668df4e02d7a4acd45ad3693536e90753f`, SHA auteur/copied exacts. Dépendances originalL6 gelées ; `.tmp` hors git.

## Gates relancés parent

Context Mode, commandes séquentielles/cwd absolu auteur, chaque exit0 :

- `bun run typecheck`.
- `bun test test/eventlog.test.ts` : **69pass/0fail**,507assertions, **trois runs ciblés complets**.
- `bun test` : **442pass/1skip/0fail**,443tests18fichiers,19840assertions.

Les ciblés contiennent trois scénarios multiprocess réels (réservation/pin collision/double readback), exercés dans les trois runs ; ceci ne prouve pas tous interleavings/fautes système. Aucun vrai FF8/APIEnsemble ni authentification native exercés.

## Re-review

Task `task_mv7xnv10_002k_7zlqly`, membre `l6-rv2-max`, session `ses_ec628dec6ffeQrQ9boaf1v5dP1`, fresh/read-only/plan/worktreefalse, **Model.Ref natif openai/gpt-6.1-sol/max relu**. Manifest/code/contrat/anciens contre-exemples, pas verdict auteur comme preuve. R1noop-time/reopen/intégrité, R2pins/projection/manifest/authority/fence/dispatch, R3absence/postIO/rejection/CAS/legacy, R4contentId scientifique/opération/readback/attest-revoke/legacy à attaquer avant parentacceptance.

Limite d'intégration annoncée : client.ts actuel perd le discriminant protocolaire du rejet ; erreurs simplement classifiées restent désormais AMBIGUOUS fail-closed. L8 devra conserver une preuve négative native réelle pour autoriser retry, pas recopier un booléen/catégorie. Replay reste audit, TTL globalv1/scans/layouts connus maintenus. Inputs R sur artefacts/propositions réellement disponibles, jamais empreintes de sorties futures.
