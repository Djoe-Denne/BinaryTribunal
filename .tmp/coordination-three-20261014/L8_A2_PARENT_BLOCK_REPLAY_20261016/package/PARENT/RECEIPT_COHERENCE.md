# Receipts niveau2/fixture-only — cohérence avant satisfaction

2026-10-15. STOP ciblé Astra simulateur conforme au plan ; décision parent bornée
sur l'admissibilité de l'entrée SIM, pas modification de L5/L6 ou preuve native.

## Repro parent et norme

Requirement niveau1/fixture-only ; receipt exacts artefact/function/module/hash,
commit SHA valide, readback verified, effect satisfies, producer null, révision
dans la fenêtre, mais **publicationLevel2/validation fixture-only**.

Parent constate sur les vrais modules :
- ancien planner accepté37723edf : receiptSatisfies=true, external_satisfied dans
  le vrai plan, aucun diagnostic ;
- candidat budget985e5e : même booléen et planning legacy byte-exact à l'ancien ;
- simulateur ac82 piné : validateSimPlan accepte aussi ce cas.

Probe `.tmp/coordination-three-20261014/probe-l5-receipt-level-validation-parent-20261015.ts`,
sortie `l5-receipt-level-validation-parent.json`. Aucun DB/submit/publication,
ni mutation de source ou de receipt historique. **Pas régression d'allocation**.

CONTRAT.md:492–494 : niveau1=store fixture, aucune promotion RE ; niveau2=validation
parent réellement exécutée, écriture durable/readback local autorisé. Le booléen
de satisfaction de planner.ts:269–278 n'établit pas cette cohérence/autorité ; il
compare niveaux/force sur un receipt supposé admissible. validRequirement impose
déjà parent-validated pour une requirement niveau2, pas ce même test sur le receipt.
Le champ contradictoire ne devient jamais une publication scientifique valide.

## Décision SIM/test

**Refus fail-closed explicite de niveau2 + fixture-only AVANT satisfaction SIM.**
Ne pas rétrograder en niveau1, relabel parent-validated, remplacer par unknown
satisfait, fabriquer une publication ou rehasher un ancien export pour le blanchir.
Ajouter le négatif et le diagnostic dans les trois paths SIM déjà ratifiés ;
README peut préciser ce prérequis de cohérence/non-équivalence.

Le différentiel au vrai receiptSatisfies porte sur les receipts **sémantiquement
cohérents**. Le test contradictoire documente expressément L5=true mais SIM=refus ;
pas assertion «équivalence pour tout valid-typed». Garder positifs légaux parent-
validated plus forts et publicationLevel>=minimum, tous autres hashes/revisions/
readback/effect exacts. Aucun droit de modifier le helper L5/L6 dans ce correctif.

## Limite upstream ouverte

L5 pur ne fait pas cette prévalidation intrinsèque. **Limite/contradiction upstream
OPEN** : le guard SIM ne la résout pas dans L5 ou le host. Le futur boundary L8 doit
exiger une entrée cohérente et les vrais ports/proofs parent pour un niveau2, avant
promotion/utilisation ; L9/L10 doivent conserver une disposition explicite. Un
champ ou un booléen seul ne suffit jamais. Ni extension L5 silencieuse, ni waiver
de science/native ou clôture globale par la présente décision.

Reviewer L5 actif informé du contre-exemple **parent** et de son caractère ancien/
inchangé ; qualification indépendante demandée, pas verdict global imposé ou code
autorisé. Le correcteur SIM ACK avant application de cette précision, autres axes
indépendants continuent, nouvelles décisions hors scope remontent au parent.
