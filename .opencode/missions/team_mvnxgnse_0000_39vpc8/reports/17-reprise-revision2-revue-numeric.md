# M2 — 17 : révision 2 reçue, admission de la revue indépendante

## Autorité et étape

Approbation utilisateur reçue : politique révision 2, hash `caff6ab11256cd1ecc7b1c299dce3bf51759d7bc7807b0540f186abc2673e02e`. Catalogue OpenAI et QA reinforced inchangés ; aucune commande start lancée par le superviseur. Les admissions nouvelles suivent désormais cette révision ; l'auteur numeric conserve son admission historique.

Correction du pilotage : le parent est bien le superviseur de cette mission, pas un simple conseiller de préparation. Les réponses antérieures renvoyant au superviseur sans déclencher la suite n'étaient pas un avancement. La revue indépendante doit maintenant être admise effectivement, sans relancer l'auteur sur ses livrables déjà terminés.

## État observé et preuves réutilisées

Le candidat isolé est livré sous `C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-39vpc8-numeric-candidate-r1/.tmp/m2-numeric-candidate-r1/l1-20261025-r1` (W).

- `W/outputs/L2_REVIEW_PACKET.md` et `L2_RUN_INPUTS.json` lus par le parent ; manifeste de 36 pins présent, hash annoncé par l'auteur `be939bd3eba1911ad615de4ae58d2ad51046018e307e406e909419c217a76ca8`, pas encore revérifié intégralement par le parent.
- Footers logs UTF8 rouge99/2 puis vert101/0/2041 assertions effectivement lus par le parent, sans rejeu.
- Footers L2 rouge40/2 puis vert42/0/74 assertions effectivement lus par le parent ; dernière passe après modification de fermeture annoncée par le worker, à rattacher au reçu courant.
- Les 450 paires, neuf régressions, collecteur et inspector scientifique ne sont pas exécutés. Les 42 tests purs ne typent pas le consommateur complet.

## Décisions et progression utile

1. Créer une sous-gate de revue pré-exécution indépendante en lecture seule : `task_mvpdk0wl_0001_hmlqab`. La tâche QA globale existante dépend d'une implémentation restée partielle ; ne pas déclarer cette dernière complète artificiellement pour franchir ce cycle. Cette inspection préalable fournit une preuve réutilisable à la QA globale, ne la remplace pas et n'introduit pas de pipeline supplémentaire.
2. Autoriser cette recherche directe sur Sol high via décision d'exécution gouvernée, pas override de spawn/message. Risques distincts : autorité native, receiver/builtin, normalisation Error, custody, deadline/publication et état d'arrêt inconnu.
3. Session fraîche, accès candidat en lecture seule ; aucune édition/test/science/inspector/Git confié à ce reviewer. Retour avec code/scénario de bloquants et suggestions séparés.
4. Le parent prépare en parallèle la commande de typing ciblé et vérifie les pins/conditions. Aucun rejeu des tests verts au seul motif d'un nouveau reviewer. Une exécution de typing ne remplacera ni cette revue ni l'équivalence native.
5. Après revue et typing recevables seulement : arbitrage des corrections, puis gate commande/fixture/environnement avant l'unique invocation inspectée possible sous les bornes existantes (180 s, attente provenance ≤10 s, sans retry automatique).

## Limites

Aucun PASS global, intégration S1 ou clôture M2. Aucun Git final/clean/install/configuration globale, aucun jeu/live/IDA. La disponibilité effective du worker et son modèle doivent être confirmés par admission/readback, pas par ce rapport seul.

## Admission et préflight effectifs

Reviewer `numeric-preflight-review-r2` admis sous politique v2, task `task_mvpdk0wl_0001_hmlqab`, session fraîche `ses_e874d476dffe70l4sH5xCToLap` ; statut native busy observé. GET natif confirme `Model.Ref={providerID:openai,id:gpt-6.1-sol,variant:high}`. Pas d'override au spawn, pas de contexte auteur hérité.

Parent : manifeste 36 pins/6061 octets, SHA annoncé retrouvé et **36/36 conformes, zéro écart**, vérification read-only. TS API 5.9.3 de référence conforme au pin (9112572 octets/SHA3ae902c9…). Déclarations existantes présentes : @types/bun1.4.0, bun-types1.4.0, @types/node26.6.5 ; aucun install.

Typing ciblé décidé : config nouvelle possédée `W/tsconfig.parent-preflight-r2.json`, strict/noEmit/skipLibCheck et mêmes target/module/bundler que le harness, typeRoots explicite vers déclarations existantes. Sept entrées (différentiel complet, deux tests purs, trois helpers natifs, neuf régressions) et leur fermeture transitive ; aucun module évalué, aucune science/inspector exécuté. Collecteur CJS non couvert par cette preuve TS (syntaxe seulement historique, revue séparée). Commande parent autorisée dans le périmètre : `node <harness>/node_modules/typescript/lib/tsc.js --project <W>/tsconfig.parent-preflight-r2.json --pretty false`, cwd W, timeout60s, une invocation initiale et diagnostics conservés. Ne pas confondre avec le `bun run typecheck` global futur. Toute reprise doit être justifiée par une correction pertinente.

## Typing 01 et correction de fixture de composition

Invocation parent 01 effectivement exécutée : exit2, 16 diagnostics TS2307 dans les deux domain.ts, imports `./graph`, `./planner`, `./bulletin-audit` manquants. Reçu et logs `W/evidence/parent-r2-typecheck-01.*`. Aucun résultat scientifique observé.

Analyse statique des imports via l'API TS pinnée : fermeture de 23 fichiers, dont cinq TS déjà présents à ne pas écraser ; 18 supports manquants ont été projetés byte-exact depuis les versions GO, soit36 copies/891486 octets pour deux branches. Sources et destinations pinnées : `../evidence/numeric-type-support-r2.json`, copie W/evidence/parent-r2-type-support.json. Aucun stub, import supprimé, relâchement strict ou source scientifique modifiée. Les36pins du candidat initial restent inchangés. Les supports sont accessibles au typechecker seulement ; leur présence ne les admet pas dans l'inventaire des scripts runtime scientifiques. Un module runtime supplémentaire doit toujours faire échouer la collecte.

Autoriser une deuxième invocation **identique de commande** avec ces seules entrées complétées : reprise motivée par le correctif de composition, pas le changement de reviewer. Préserver le premier échec et ses diagnostics. Aucun changement du budget des tests L1/L2 ni exécution des corps.

Invocation02 : exit2, quatre TS2307 restants, client.ts de chaque branche ne trouve pas `@opencode/client` et `@opencode/client/service` car le namespace isolé n'a pas les node_modules canoniques. Package existant `@opencode/client`2.0.26 relu : exports types réels dist/promise/index.d.ts et service.d.ts. Décision : chemins TS explicites vers ces déclarations existantes, sans stub/copier node_modules/installer ni évaluer le client. Troisième invocation ciblée autorisée après cette correction de résolution uniquement ; options strict/noEmit et toutes sources scientifiques inchangées. Préserver les deux échecs précédents, pas les appeler rouge scientifique.

## Résultat de typing obtenu

Invocation03 effectivement exécutée : **exit0, zéro diagnostic, stderr vide**. Reçu versionné W/evidence/parent-r2-typecheck-03.json et stdout/stderr ; hashes de config/compilateur/supports et déclarations du package conservés. Le différentiel complet, les neuf régressions et les helpers/tests TS ciblés sont donc maintenant vérifiés statiquement dans cette composition explicite. Aucun de leurs corps n'a été évalué. Les deux erreurs de layout antérieures restent dans les reçus01/02.

Preuve bornée : strict/noEmit, skipLibCheck identique au harness (ne qualifie pas le corps des bibliothèques tierces). Le collecteur CJS ne fait pas partie de ce typing ; sa correction reste à examiner. Ni un PASS des450/9, ni le typecheck global convenu, ni une intégration S1 ne s'en déduisent. Aucun rejeu supplémentaire du typecheck à composition inchangée.
