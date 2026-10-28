# M2 — 31 : proposition S1 complète, revue fraîche avant code

## Livraison vérifiée

Les quatre parties et la correction finale de statut sont maintenant persistées dans [proposal](../inputs/s1-contract-r2/proposal/), avec provenance native, tailles et hashes dans `COMPLETE_RECEIPT.json`. Les deux dernières restitutions proviennent des messages publics `msg_1796e247a0014j4g530aIO5pkX` et `msg_1796ec77d001np929YsyOu3d67` : extraction de littéraux par AST, sans eval ni conservation du raisonnement privé.

Le parent a lu les cinq documents : définitions root/enveloppe/T0, knowledge, numeric/context, imports/pins/versions et correction. La proposition est suffisamment matérialisée pour la revue ; cela ferme la livraison de la tâche contrat, **pas la ratification de son contenu**. Les huit dépendances du supplément sont fournies : le paragraphe 4/4 les disant absentes est explicitement remplacé par la correction finale. Leur présence ne prouve pas la fermeture du futur candidat.

## Décision et vérification prévue

Débloquer la tâche de revue S1 déjà prévue, en session fraîche indépendante de l'auteur, lecture seule. Aucun code avant verdict et ratification parent. Examiner les risques distincts suivants contre les sources pinnées, sans relancer numeric/planner :

1. Types/imports et joins réellement fermés ; null inspectable versus refus obligatoire pour un consommateur, notamment provenance et nativeAuthor conditionnel.
2. Grants indépendants, budgets et labels modèles ; cohérence S1 sans acquisition/authentification/CAS implicites.
3. Provenance result → unité → pending → effet/readback → commit, domaines de digests distincts et publication sans autorité auto-déclarée.
4. Numeric/context et planner fixes : codecs purs, sources qualifiées exactes, absence de recalcul producteur au chargement.
5. Compatibilité des tags envelope-v1/run-v3 non publiés et consommateurs réels ; cinq fichiers cibles proposés ne valent pas une fermeture d'implémentation déjà prouvée.

Les choix structurants restent des propositions : un défaut bloquant devra citer obligation, source et scénario observable ; suggestions différables séparées. Les négatifs de QA API sont examinés comme contrat, pas exécutés par le reviewer. Une reprise éventuelle portera sur les défauts et impacts, pas sur un nouvel audit systématique.

## Admission effective

Tâche livraison `task_mvo1ayx4_0007_mr28wc` complétée par le parent après matérialisation, débloquant la revue prévue `task_mvo1ayx4_0008_m2b342`. Worker `s1-contract-review-r2` admis en session fraîche `ses_e868d2b09ffeN6dHLwdgmjJLCQ`, lecture seule sans worktree ; **busy observé**. Sélection via décision d'exécution gouvernée, sans override de spawn ; GET natif confirme `Model.Ref={providerID:openai,id:gpt-6.1-sol,variant:high}`. L'auteur n'est pas réactivé sur une livraison déjà complète. Aucune implémentation autorisée par cette clôture de tâche.

## Preuves réutilisées et limites

[Numeric accepté](29-numeric-accepte-passage-s1.md), paquet S1 51 pins et supplément huit fichiers conservés ; aucun rejeu de tests, aucune mutation des gels ou du WIP canonique. Aucun commit, merge, push ou nettoyage. Les trois commandes consolidées M2 restent non exécutées ; S1 implémentation/QA, S2–S4 et L7/L9/L10 restent ouverts. Pas de nouvelle question utilisateur nécessaire pour cette revue déjà approuvée.
