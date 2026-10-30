# Point de contrôle 01 — Retours tardifs : tests numériques et proposition S1

Date de réception : 2026-10-29. Aucune reprise de mission.

Suite de la réception :
[huit rapports supplémentaires, point de contrôle 02](20261029_02_complement_retours_historiques.md).

## 1. Objectif et conséquence pour la reprise

Préparer la reprise du RMS statique sans C#, sans refaire des analyses dont le
résultat existe désormais. Deux candidats natifs auparavant non récupérables
sont devenus accessibles : une revue numérique complète et un plan de contrat
public S1. Leur réception ne valide ni les tests ni le contrat.

La revue demande deux corrections ciblées dans les contrôles de tests. Le plan
S1 est une proposition utilisable pour une future revue, pas une norme ratifiée.
Recommandation : sous GO M2, confronter ces retours à la version effectivement
retenue, corriger les défauts encore présents et compléter les références
manquantes ; ne pas relancer automatiquement les anciens auteurs/reviewers.

## 2. Revue numérique : deux défauts corroborés sur l'ancien paquet

Le candidat annonce `CORRIGE`, avec qualification opérationnelle `BLOCK`.
La lecture parent des extraits cités du paquet gelé confirme les mécanismes :

1. Dans `after-R4/numeric-differential.test.ts:224–245`, ligne 233, le contrôle
   construit un « mauvais chemin » avec le nom fixe `wrong-catalogue.json`.
   Si le catalogue autorisé porte déjà ce nom, la modification produit le même
   chemin. Le test attend alors un rejet d'une entrée restée valide.
2. Lignes 183–193 et 986–990, le contrôle du footer modifie la première
   occurrence de `//# sourceURL=` par `String.replace`, sans ancrage de ligne.
   Une occurrence dans un littéral du module peut être modifiée à la place du
   footer effectivement contrôlé par `nativeInlineProof`. Le scénario décrit
   reste un contre-exemple statique : aucun buffer émis n'a été exécuté ici.

Ce sont des risques de faux échec des contrôles négatifs, pas une preuve de
contournement de l'authenticité ni de défaut des algorithmes scientifiques.
Corrections à examiner : chemin nécessairement différent avec témoin explicite ;
modification de la seule ligne de footer reconnue avec vérification du changement.
Aucune correction n'est appliquée par ce point de contrôle.

Le reviewer décrit aussi un réemploi Error par slot unique et identité, **pas
une WeakMap multi-Error**. Ne pas reprendre l'ancienne description du brief comme
une propriété vérifiée ; confronter ce point au contrat de capture retenu.

Les 77 pins / 1 315 076 octets et les bookends conformes sont rapportés par le
reviewer sur le manifeste RAW
`fc3193e9711a5e9eaaf3e637c057d7013e7031c0c446b78f25babbd7dcdf5213`.
Le parent n'a pas refait ce rehash complet à cette réception. Les constats
ci-dessus sont limités au paquet historique lu, pas à un éventuel candidat plus
récent. Aucune qualification des 450 paires ou des neuf régressions n'en découle.

## 3. Plan S1 reçu : proposition, pas ratification

Le candidat propose des types fermés pour les grants root, les bindings modèles,
la provenance de connaissance, leur placement et leurs cas API-only. Sa table
distingue les directions parent des noms/types/champs encore proposés.

Il maintient notamment les blocages suivants :

- qualification comportementale numeric/context non acquise ;
- schémas et feuilles transitives pas tous fournis dans la closure du paquet ;
- evidence `KnowledgeCommit`/`UnitValidation` à fermer, provenance de la
  correspondance faits validés et contrat de rétention/readback à compléter ;
- acquisition/bootstrap, historique et autorité/ledger/CAS relevant de S2.

La réception parent est une lecture de cadrage et des blocages, **pas une revue
exhaustive des types ni une acceptation contractuelle**. Le futur travail doit
réutiliser ce candidat lorsqu'applicable, compléter ses références, puis faire
la revue et l'arbitrage prévus par M2. Aucun GO source/QA/implémentation.

Les 51 pins / 985 343 octets et le manifeste RAW
`a81b74f4e1e36c9eaf81fbd1e71c1aa3c5a2be62fec2f383e3a7b9be916ebf5b`
sont les bookends rapportés par l'auteur. Ils ne prouvent pas à eux seuls que la
closure documentaire du contrat proposé est complète.

## 4. État et limites

L'ordre M2 reste explicitement non lancé ; son amendement QA renforcée du
2026-10-22 (§7.1 et condition d'arrêt §8) n'est pas modifié. L'ordre est seulement
actualisé pour ne plus dire que ces deux retours n'existent pas.

Aucun worker créé/réveillé, aucune tâche acceptée ou clôturée, aucun test,
typecheck, compilation, import produit, action live/IDA ou opération Git mutante.
Les sources gelées ne sont pas modifiées. Ces retours n'établissent toujours
aucune cause des anciens arrêts de sessions.

## 5. Annexe technique — provenance des candidats conservés

Les textes complets restent récupérables par `team_results(candidate_id: ...)` :

- Revue FULL R4 : `result_mvtsdubj_0000_u47rsh`, session
  `ses_ea783de9dffe3Dp6ySwUrZ12pT`, message
  `msg_158890df4001kHNYeq04Flz0BE`, tâche historique
  `task_mvgfsogs_0002_dwmdcf`, 7 807 caractères reçus.
- Plan S1 : `result_mvtsduud_0002_y54vja`, session
  `ses_ea77880ddffenc7wMSojQd7eP4`, message
  `msg_1588f2b6d001ApX7T01meZaGzG`, tâche historique
  `task_mvgg8nsr_0003_l02t1p`, 28 980 caractères reçus.

Les résultats ont également été indexés dans Context Mode sous les sources
`late-native-review-20261029-numeric-qualification-r4-full-review-r2` et
`late-native-review-20261029-s1-common-contract-final-r1`. Cet index de lecture
n'est ni un gel scientifique nouveau, ni une publication dans Obsidian.
