# M2 — 36 : implémentation S1 démarrée, premiers contrôles ciblés

## État vérifié

Le worker rapporte le passage natif en implementation/high et une édition autorisée sous C interne. Readback API parent confirme `Model.Ref={providerID:openai,id:gpt-6.1-sol,variant:high}` ; pas de changement hors catalogue ni accès au worktree externe refusé.

Le parent a lu les deux reçus et les diagnostics/footers conservés sous `D/evidence` (D=.tmp/m2-s1-candidate-r2), sans rejouer les commandes :

- `author-01-typecheck.result.json` : exit2, 4505ms, aucune erreur d'outil. Quatre exports ratifiés encore absents du module envelope ; TS2589 dans bindExecutionPreparationV1 à la ligne701. Le worker identifie ce dernier comme hérité de R4, dans une cible éditable ; l'origine historique n'est pas requalifiée par ce seul log.
- `author-02-envelope.result.json` : exit0, 35ms, **3 PASS / 0 FAIL / 22 assertions**. Portée déclarée : primitives UTF8/domaines/refus non-data réutilisées, pas les nouveaux joins S1.

Budget constaté : 1 test et 1 typing, 4540ms au total ; aucun timeout ou erreur d'outil. Le runner n'est pas bloqué selon le worker. Ces premiers résultats ne valent ni typing final ni qualification des clauses root/knowledge/context.

## Décision de supervision

Continuer le code/TDD déjà autorisé : fermer les exports et validateurs ratifiés, corriger le diagnostic typologique dans la cible autorisée sans any/stub ni affaiblissement de l'oracle, puis ne rejouer que les vérifications affectées dans le budget restant. Une modification de support RO ou un changement de contrat reste à remonter ; aucun élargissement accordé par ce checkpoint.

La QA API indépendante sera admise sur le candidat identifié, pas sur ces trois primitives seules. Numeric450+9 et planner qualifié restent réutilisés sans rejeu. Trois checks consolidés M2 NON EXÉCUTÉS ; aucun commit/merge/push, DB/live/IDA ou nouvelle exécution scientifique.
