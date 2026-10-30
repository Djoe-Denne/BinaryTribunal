# Point de contrôle 02 — Huit rapports historiques supplémentaires récupérés

Date : 2026-10-29. Complément au
[premier point de réception](20261029_01_retours_tardifs_numeric_s1.md).

## 1. Objectif et décision de réception

Maintenir une reprise RMS fondée sur les résultats disponibles, sans recréer
inutilement des reviews ou des plans. La notification de rapports non livrés a
permis de récupérer huit autres candidats et les notifications qui les annoncent.

La décision ne change pas : **numérique non qualifié, contrat S1 non ratifié,
M2 non lancée**. Les avis favorables sont limités à leur périmètre. Ils ne
réfutent pas les deux défauts de contrôles négatifs identifiés par la revue FULL
R4 et corroborés dans le paquet historique au premier point de réception.

## 2. Classement des huit retours

- Trois avis `ACCEPTABLE_F1_OBSERVER_LEDGER_SCOPED` sur la partie A : F1,
  observateur/nonmutation et préservation des cas scientifiques. L'un n'est
  qu'un bref avis renvoyant à des détails « livrés précédemment » non joints.
- Trois avis `ACCEPTABLE_ERROR_NATIVE_SEAL_SCOPED` sur la partie B : capture
  d'erreur, admission du catalogue/SEAL et chaînes d'origines. Ils ne constituent
  pas une exécution des contrôles négatifs ni du producteur natif. Ils décrivent
  le cache Error comme un slot unique sous contrat zéro/un Error, pas une WeakMap.
- Un bref retour de la première revue FULL R4 maintient le blocage opérationnel
  `native:1:11`. Il renvoie aussi à des findings antérieurs non joints ; ne pas
  lui attribuer le contenu d'un rapport complet absent de ce texte.
- Un second candidat de PLAN S1, PROPOSÉ, maintient les blocages de ratification :
  closure des schémas/codecs, records de connaissance résolus, qualification
  numeric/context, acquisition/historique/ledger/CAS S2.

La mention « r2 » du second auteur S1 est un nom de tentative/session, pas la
preuve d'une révision normative remplaçant le premier candidat. Comparer les
propositions en future revue ; ne pas choisir automatiquement la dernière ni
fusionner leurs types sans arbitrage contre les contrats et sources retenus.

## 3. Traitement à la reprise, sous GO M2

Réutiliser les constats scoped lorsqu'ils sont applicables à la même entrée.
La règle historique de composition A+B ne permet pas de convertir une revue
FULL `CORRIGE` en acceptation par vote : traiter les défauts précis encore
présents, puis revalider les contrôles affectés conformément au contrat QA M2.
Le problème de couverture des frames natives reste distinct des deux corrections.

Pour S1, partir des deux plans disponibles, compléter les dépendances réellement
manquantes et examiner les divergences utiles. Ne pas refaire aveuglément le
travail, mais ne pas confondre réception d'un plan et acceptation de son API.

Les deux retours A/B en lecture pure ne rapportent pas de rehash indépendant ; les
autres annoncent des bookends. Cette différence est conservée, pas transformée
en garantie supplémentaire. Aucun scénario n'a été exécuté par cette réception.

## 4. Portée de la revue parent et état des actions

Les textes natifs ont été récupérés, leurs verdicts/périmètres classés et les
blocages du second plan examinés. Il ne s'agit pas d'une nouvelle review exhaustive
des deux ensembles de types S1 ni d'une requalification du code courant.

Les notifications système rappellent toutes que disponibilité d'un candidat ne
vaut pas validation/intégration. Aucune tâche historique n'est complétée ici.
Les causes des anciens arrêts ne se déduisent toujours pas de ces réceptions.

Modifications limitées aux points de contrôle et aux mentions de réception dans
l'ordre M2. Ses critères QA renforcés, ses conditions d'arrêt, les sources gelées
et les preuves scientifiques restent inchangés. Aucun worker relancé, test,
compilation, typecheck, live/IDA ou opération Git mutante.

## 5. Annexe technique — candidats natifs retenus pour consultation

Récupération exacte possible avec `team_results(candidate_id: ...)` :

- Partie B, tentative 1 : `result_mvtsdv24_0004_mecien`, 4 542 caractères.
- Partie A, tentative 2 : `result_mvtsdv9c_0006_e7l7b8`, 3 545 caractères.
- Partie B, tentative 2 : `result_mvtsdvu6_0000_7uusqx`, 4 146 caractères.
- Second PLAN S1 : `result_mvtse0gs_0002_z90gzu`, 33 952 caractères.
- Partie A, tentative 3 lecture pure : `result_mvtse0z3_0000_0zc1z8`, 3 163 caractères.
- Partie B, tentative 3 lecture pure : `result_mvtse1g9_0002_eh56ju`, 2 614 caractères.
- Première revue FULL R4, avis bref : `result_mvtse1t6_0004_n8z4jm`, 598 caractères.
- Partie A, tentative 1, avis bref : `result_mvtse1yg_0006_rglwrs`, 468 caractères.

Le lot natif et ses notifications (57 065 caractères) ont été indexés pour lecture
dans Context Mode, source `undelivered-team-reports-20261029`. Ce stockage de
consultation n'est pas une acceptation scientifique ni une publication Obsidian.
