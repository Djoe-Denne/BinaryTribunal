# Parent : planner R1 typecheck et équivalence sans intégration main

StaticV acceptable result_mvf7mi8m_0073_ou1rbj, parent28pins/6ASTbodies/ancres lus.
GO une fois : deux arbres complets baseline269guards/candidat+4sources gelées,
outils/bun/déclarations typées pin avant/après. TSC strict dans candidat scratch
(typeRoots pointeurs read-only vers déclarations pin, pas node_modules partagé écrit).
Puis mêmes tests planner.test.ts/lineage.test.ts dans baseline et candidat.

Adapter de test identique intercepte uniquement appels externes planMission et
compareGranularities depuis planner.test. Aucune modification de corps producteur.
Trace entière arguments avant/après et résultats/erreurs structurés (Maps/Sets,
NaN/-0/undefined inclus) conservée JSONL ; égalité BYTE requise, pas seulement
assertions ni hashes inclus dans les outputs. Stacks exclus car chemins diffèrent.
Traces nonvides >=10 appels et au moins un refus exigés. Compteurs tests/asserts/
fichiers identiques, aucun skip/fail. Différence rouge retenue, pas retry automatique.

Cette matrice de fixtures n'est pas preuve universelle ni validation du nouveau
fixedadapter numérique, qui reste en R2fix. Compléments budget/context/importclosure
et S1witness/joins restent distincts. Pas main/S1/DB/live/native/full44/commit.
