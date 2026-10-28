# M2 — 32 : revue S1 CORRIGER, deux clauses locales corrigées

## Verdict et vérification parent

La revue fraîche `s1-contract-review-r2` conclut **CORRIGER**, sans réaudit numeric/planner : deux fermetures DATA manquent avant ratification. Aucun bug produit observé ni test exécuté. Sa clôture de tâche signifie revue livrée ; le déblocage mécanique du board n'autorise pas le code.

Le parent a lu les règles citées : `graph-store.ts:828,873–888` impose sessions natives uniques et parent distinct de chaque authorId/sessionId ; `PARENT_R2_SCOPE.md:41–46` exige réduction seule champ-à-champ et `planner.ts:551–557` nomme les capacités. Ces défauts sont contractuels et concrets, pas de nouvelles obligations d'infrastructure.

## Correction bornée

[Amendement 06](../inputs/s1-contract-r2/proposal/06-parent-corrections-b1-b2.md) ajouté sans réécrire la proposition historique :

1. Lorsqu'une attestation consomme les auteurs, unicité de leurs sessionId et séparation parentActorId/authorId/sessionId, avec négatifs correspondants. `nativeAuthor:null` demeure permis au niveau1 sans auteur/attestation consommé.
2. Worker slots/cpu/gpu/budget et account slots/budget courants comparés chacun à leur root exact par `<=`, mêmes contraintes/unités upstream ; available demeure observation mutable, sans somme worker/account ni acquisition déduite. Négatifs hausse isolée et positifs réduction explicités.

Le parent retient explicitement `contextSources` dans le common, choix jugé cohérent par la revue. La suggestion de lisibilité des invariants d'attestation est différable, sans retrait de leur validation existante.

## Décision et prochaine gate

Faire réexaminer **le même reviewer** sur ces deux clauses et impacts uniquement. Pas de nouveau reviewer/pipeline, code, test ou run numeric. Les conclusions favorables root/hashs/pending-readback-final/projections fixes/compatibilité restent valides sauf impact démontré de cette correction. Ratification parent après verdict correctif recevable ; fermeture exacte des pins du candidat et QA S1 restent des étapes distinctes.

Numeric450+9 reste accepté ; trois checks consolidés M2 NON EXÉCUTÉS. Aucun Git final/merge/nettoyage, aucune mutation du gel ni du WIP produit. Aucune question utilisateur nécessaire pour ces corrections dans le périmètre approuvé.
