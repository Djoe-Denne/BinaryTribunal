# M2 — 39 : témoin d'admission historique fermé et ratifié

## Avis indépendant et décision

Même reviewer : **ACCEPTABLE sous clauses exactes**. Une projection indépendante de l'outbox historique suffit à la garantie de comparaison DATA S1 ; le body complet servirait la garantie supplémentaire de recalculer sa préimage/dériver la commande. Cette garantie plus forte n'est pas requise pour la frontière S1 retenue. Le reviewer exige le complément receiptIdentity pour ne pas perdre les comparaisons réellement consommées à graph-store825–827/880–883.

Le parent ratifie [amendement07](../inputs/s1-contract-r2/proposal/07-historical-admission-projection.md) : vue fermée et byte-bound ajoutée à ResultProvenance, mission/unit/execution/subIntent/token/digest + profile/model + receiptIdentity. Source indépendante retenue et comparaison complète au knowledgeSource ; aucun calcul depuis NativeAuthor/candidat/génération courante. Les identités optionnelles du receipt sont absentes seulement si l'absence est connue dans la source inspectée ; receipt inconnu = refus de consommation, pas omission normalisée.

## Portée sans surpromesse

requestDigest demeure le fingerprint upstream opaque du body COMPLET historique, pas le hash de cette projection. S1 ne recalcule pas le body et n'authentifie pas la projection. Un fournisseur qui cofabrique digest/body/profile n'est pas détectable sans autre source ; cette limite est désormais explicitement écrite, sans prétendre valider une admission durable ou hasScientificCompletion. S2–S4 restent nécessaires pour les garanties d'autorité déjà séparées.

Cette décision ferme le manque documentaire concret, ne remplace pas une preuve d'exécution. Aucun body complet, reçu libre, nouvel API/backend/store ou harnais important ajouté ; aucune source scientifique modifiée. Le cas niveau1 sans auteur consommé conserve ses nullable.

## Reprise bornée

Réactiver le même implémenteur sur l'amendement07 uniquement en plus du contrat01–06, puis terminer le candidat S1 prévu. Pas renvoi du GO antérieur comme s'il résolvait le défaut : 07 est la correction normative nouvelle. Les fichiers et commandes restent ceux du GO35 ; aucun support RO modifiable ou nouvelle dépendance autorisée.

Budget conservé, pas réinitialisé : annoncé 1/12 test et 2/4 typings utilisés, 6347ms ; 11 tests et 2 typings au plus restent dans le plafond600s. Les échecs antérieurs sont préservés. Les négatifs07 sont à observer dans ces contrôles puis dans la QA API indépendante ; aucun rejeu numeric/planner acquis. Tout nouveau blocage précis revient au parent, pas nouveau payload imaginé ou refus assoupli.

Les trois checks consolidés M2 restent NON EXÉCUTÉS. L7 indépendant sera traité en session fraîche, sans oracle de l'auteur contrat arrêté. Aucun Git/merge/cleanup/configuration/native/DB/live/IDA autorisé.

Reprise effectivement envoyée avec force au même implémenteur, amendement07 et clause de reprise du GO35 fournis ; `team_view` confirme **busy** dans `ses_e8681b156ffeQ5mA4t51Jg6fjc`. Aucun nouveau test ou résultat S1 n'est déduit de ce seul statut.
