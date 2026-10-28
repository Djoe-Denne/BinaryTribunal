# M2 — 11 : GO limité au correctif local L1, provenance scientifique L2 non autorisée

## Étape et décision autonome

Plan numeric reçu. Dans le mandat de corrections ciblées (§7.1), autoriser uniquement L1 : extraction privée minimale du writer/observateur purs pour tests isolés, readback des artefacts nonterminaux avant admission et tests TDD ciblés. Aucun changement des 450 paires, neuf régressions ou oracles scientifiques ; aucun nouveau framework, ledger ou service.

L2 (contrat Error/native et éventuelle adaptation du collecteur/auditeur) reste **non autorisé à l'exécution**. Demander une fiche de décision fermée avant tout arbitrage : champs exacts, relation d'équivalence, preuves par champ/frame, moyens existants, coûts et limites. Ni catalogue R4 ni alternative RAW ne sont ratifiés par la seule présence d'un test proposé.

## Isolation corrigée et preuves

Le parent a vérifié le worktree : `.git` fichier de liaison, HEAD `c1de250979cf8c419003035eb6e1ccefd38cc311`, branche `ensemble-ee891ca8-0d7c-48d2-9e9e-87fd9731403a`, zéro chemin sale observé avant projection.

La session numeric a été déplacée explicitement vers son worktree par `opencode.session_move`. Readback natif confirme désormais la location isolée et Sol high inchangé. Le WIP canonique n'a été ni déplacé, ni nettoyé, ni modifié.

Projection parent neuve et vérifiée par readback : `../evidence/numeric-l1-projection.json`. Namespace absolu :
`C:/Users/djden/.local/share/opencode/worktree/68ae5f/ensemble-793e3f62-39vpc8-numeric-candidate-r1/.tmp/m2-numeric-candidate-r1/l1-20261025-r1`.

Six fichiers seulement : deux sources proposées R4 en inputs, leurs deux copies candidates de travail, politique de scripts fournie et bunfig vide. Aucun module scientifique source copié, aucune copie massive de WIP/node_modules ou de C#.

Validation/re-policy/domain actuels identifiés par hash et conformes à GO, mais pas projetés ni réputés fermeture scientifique complète. Bun identifié : 86 096 984 octets, SHA `15277c59ccd6c6c20f8dc9716c2b59c1776320d606b6a8658f70be8799519ca4`.

## Contrat local fermé

- Une seule implémentation partagée privée du writer ; extractions littérales/liaisons minimales, pas copie divergente ou faux catalogue pour charger les tests.
- Les tests L1 importent uniquement ce seam pur et les builtins permis. Aucune importation transitive des branches scientifiques, du test différentiel complet ou des neuf régressions.
- Readback borné via EvidenceIO.read après write et avant accepted.push/ordinal. Comparer le texte entier et le nombre d'octets UTF-8 ; mutation/troncature/exception = FS_READ terminal, charge conservée, artefact non admis. Garder les readbacks explicites existants.
- Préserver caps/réserve, débit avant I/O, charge des échecs partiels, préfixe déjà admis, ordinal unique, propagation terminale sans réobservation ni retry ; marker failure UNKNOWN. Aucune promesse fsync/kill/OOM ajoutée.
- TDD : rouge précis reproduisant le manque, puis vert après correction. Assertions d'événements, compteurs et admissions fondées sur le contrat, pas copie de l'algorithme.
- Maximum quatre invocations de tests locaux justifiées par code/fixture modifiés, en série, 30 s chacune, avec logs/statuts conservés. Aucun rejeu inchangé automatique. Si épuisement ou problème d'outil/fixture, diagnostic et retour parent ; pas de nouvelle infrastructure.
- Processus autorisé : Bun vérifié, `--no-env-file`, configuration vide possédée, `test --max-concurrency=1` avec chemin explicite du seul test writer. Aucun install, inspecteur, réseau, DB, Git ou contrôle du runtime partagé.

## Critères de retour

Diff/pins avant-après, fermeture du test pur, rouges/verts réellement observés et limites ; conservation byte-exact des neuf régressions et des corps/oracles/450 IDs du différentiel hors extraction mécanique. Toute modification de source qui affecte une future fermeture native doit être déclarée, pas masquée comme version inchangée.

Ces tests locaux ne qualifient ni les 450 paires, ni les neuf régressions, ni l'intégration S1/public. Les trois checks globaux convenus restent non exécutés à cette étape ; leur consolidation suit le candidat intégré et l'impact. Toute extension d'oracle ou infrastructure importante demeure soumise à décision préalable.

## Transmission à la session possédée

L'approbation L1 a été stockée pendant que le worker avait terminé son tour de planification. Réactivation explicite ensuite envoyée à la même session avec `force:true`, sans nouveau worker/modèle ni modification de politique. La plan-approval était déjà appliquée ; aucun contournement de ce contrôle. Réception de message confirmée, réussite de code/tests non encore observée. La tâche numeric globale ne doit pas être déclarée achevée sur le seul plan ou sur L1.
