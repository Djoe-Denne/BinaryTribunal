---
title: RMS — publication durable et acquisition du contexte suivant
category: concept
tags: [reverse-engineering, testing, concept]
summary: Un KnowledgeCommit et un receipt peuvent débloquer le travail sans prouver que son contexte acquiert les nouveaux octets de connaissance.
sources:
  - docs/missions/re-graph-scheduler/rms-static-documentation-20261028/02-parcours-et-frontieres.md
  - docs/missions/re-graph-scheduler/rms-static-documentation-20261028/05-verification-et-scenario-final.md
  - docs/missions/re-graph-scheduler/rms-static-documentation-20261028/06-plan-et-decisions.md
provenance: {extracted: 1.0, inferred: 0.0, ambiguous: 0.0}
created: 2026-10-28
updated: 2026-10-28
---

# Publication et acquisition sont deux preuves

> État documentaire historique du 28 octobre. Des primitives ont ensuite été intégrées, mais [[projects/re-ff8/references/rms-implementation-cloture-partielle-20261030|la mission du 30 octobre reste partielle, sans scénario final natif]]. La [[projects/re-ff8/concepts/rms-plugin-hote-opencode-v2|reprise plugin dans l'hôte]] est préparée, non démarrée ; aucun résultat IDA publié n'est revendiqué.

Le contrat KnowledgeCommit exige `outputRevision = inputRevision + 1`, le readback vérifié, le niveau de publication requis et un effet admissible sur le prérequis. Pending, mismatch ou niveau insuffisant ne débloquent rien. **COMMITTED appartient à la WorkUnit**, pas à l'attempt, à une tâche Ensemble ou à un commit Git.

Le parcours fixture lu prépare une publication, écrit une cible stable, relit les octets puis commet ; ses receipts exacts peuvent rendre du travail disponible. Cela n'établit pas une publication générale qualifiée ni une acquisition automatique de connaissance.

## Limite constatée dans les consommateurs

Le parent a relu `GraphEngine.finish` : après commit et receipts, il appelle `fill` sans attendre une branche indépendante. Il a aussi relu `graphInputs` : les entrées viennent de `inputManifestSource.cycleKnowledge`, **gelé**. Un receipt peut donc prouver ordering et prérequis sans prouver les nouveaux octets du contexte suivant.

Le passage publication → matérialisation → approbation → projection versionnée reste à définir. Ne pas rafraîchir silencieusement le cycle gelé, replanifier ou donner les sorties croisées aux auteurs aveugles pour combler cette limite. Sources de code : `graph-engine.ts:361–419`, `graph-adapter.ts:142–171` ; contrat:465–519, rapprochés par le dossier.

## Scénario futur, pas un PASS

Reprendre les coupures L7 autour de prepare, write/réponse perdue, readback avant commit et commit/réponse perdue. Le retry exact doit garder cible/body/digest et un seul effet durable ; ancien résultat, résultat retiré et doublon divergent ne publient rien.

Dans le DAG indépendant L7, D/E débloquent B même si F reste actif ; C attend F, A attend B/C. Ce test d'ordonnancement ne dispense pas de vérifier séparément la provenance des nouveaux contenus effectivement remis au prochain travail. Replay décisionnel ne signifie pas identité des PID ou temps muraux.

Ces exigences ont été documentées mais non exécutées. Voir [[projects/re-ff8/references/rms-documentation-cloture-20261028|clôture documentaire]], [[projects/re-ff8/concepts/rms-frontieres-runtime-v2-v3|frontières runtime/public]] et [[projects/re-ff8/concepts/rms-remplacement-et-preuves|résultats retirés et autorité courante]].
