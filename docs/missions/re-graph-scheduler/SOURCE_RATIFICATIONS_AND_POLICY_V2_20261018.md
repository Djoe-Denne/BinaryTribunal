# Reprise v2 — ratifications source limitées

## Politique et preuve native

Approbation utilisateur révision **2**, proposition SHA256
`b97d940a25f7e2db6feab6224441e5f5a12e4d81e22220a80ce84aee00586f11`.
Statut effectif `approved v2` vérifié avant nouvelle admission. Routage par grille
Ensemble, aucun override ; modèles/variantes natifs vérifiés via API session et
receipts `*-native-ref.json` sous `.tmp/mission-v2-20261018-continuous/`.

Correction de lecture des hashes : rawFile SHA256 `53822921…f504d` et hash de la
proposition ne sont pas comparables directement. SHA256 de
`JSON.stringify(JSON.parse(rawFile))` vaut exactement le hash approuvé ci-dessus.
Le refus draft précédent était réel ; aucun changement de contenu n'est prouvé.

## R3 et S1 L8

V fresh R3 `result_mvdy2nv4_000n_4nsytw`, session
`ses_eb0843d98ffePGKGDZqF7P9eBj`, verdict ACCEPTABLE_R3_CONTRACT_DELTA.
Ancres : DRAIN 18–44/395–426, QA 244–247/273–288 et MANIFEST 185–233 du paquet.
Parent rehash 9 pins/197805 octets et comparaison raw E byte-identique.
Adjudication persistée ; tâche `task_mvdwb1gr_000c_l8wn65` clôturée et reviewer arrêté.
Pas d'implémentation ou d'exécution prouvée par cette revue documentaire.

Ratification parent : `L8_PHASE2_PARENT_RATIFICATION_S1.md` dans le lot scratch.
Seuls quatre nouveaux fichiers purs source/schema sont attribués :
`graph-execution-envelope.ts`, `graph-b-projection.ts`,
`l8-execution-envelope-v1.schema.json`, `l8-graph-run-v3.schema.json`.
Bootstrap-A/transition-A/proposal-B séparés ; full source lossless ; T0 immuable,
cut T1 et final ActivationAttempt/T2 distincts ; current/staged et barrière bornés.
Pas d'autorité HOST/activation/handle depuis JSON, pas de B casté A.

Closure statique fermée : 31 sources/schema/config, 38 pins/1059038 octets,
manifest `a63cb2cc88874e666371005fa53adab6cc61e2fcbdebd546a24c96d50487c59f`.
Toutes les sources copiées correspondent aux 263 guards du gate parent vert.
Les dépendances runtime présentes comme références ne sont pas une permission
d'import/exécution dans les modules purs. Manque/factoring réel à escalader au plan.

Auteur `l8-s1-source-author-r1`, tâche `task_mvdy6khz_000q_0ee18w`, session
`ses_eb07cef8effeoP7VVdEqs74O64` ; grille 85/85 → Sol xhigh vérifié.
ACK/plan API avant GO code ; outputs isolés, QA indépendante et V fresh puis
gate parent requis. S2/S3/S4 restent dépendants, aucun fichier central attribué.

## Full44 Q1 data/codec

Ratification partielle `FULL44_Q1_DATA_SOURCE_RATIFICATION.md`, fondée sur le
contrat corrigé/revu source-scoped (manifest `0e4aa244…120c`). Seule slice1 pure
est autorisée : DTO, Windows argv/env, pins/epochs/immutabilité et contrôle32768.
CaseIdentity existant réutilisé, aucune capability/lease/OS pin acquise depuis data.
Q1 5/20/30/55 secondes et caps evidence262144/capture114688 inchangés ; profil125s,
DB/cache tiers, broker et lancement restent non ratifiés/non qualifiés.

Auteur `full44-q1-data-author-r1`, tâche `task_mvdy1o3t_000j_oo31db`, session
`ses_eb080731effeQovVTwrHKQEaUR` ; grille60/60 → Flash max vérifié.
Paquet9pins/150960 octets, manifest
`c5340417f5270049fbd8ba0ae6dd40e9d45aeb12f8dd648f8e3d7eb8dcaac6e3`.
API proposée avant code ; `GenericTargetPlan.cs`, DESIGN, MANIFEST seulement.

QA `full44-q1-data-qa-r1`, tâche `task_mvdy1o3t_000k_0fwlcc`, session
`ses_eb080176cffeVH2kmfTR36kTwp` ; grille48/50 → Flash max vérifié.
Paquet9pins/150730 octets, manifest
`384734b29766a3bc5c99c0e15ba668c4eba6594adb4485265070fa2d6e26c557`.
QA0 oracles littéraux et plan indépendants sans voir l'implémentation ; source
C# test après API fixée par parent. Pas de couverture exécutée inférée.

## Frontières inchangées

Workers : sorties disjointes seulement, pas git/registre/IDB, compilation,
exécution produit, API OS, DB, réseau, live ou délégation. Parent : intégration
sérialisée après V fresh, puis gates compile/tests distinctes avec evidence.
Les 32+107 tests verts précédents qualifient le transport courant, pas ces
nouvelles sources. Aucun GO 000d/full44, L9/L10, run01/live/FF8 ou G5–G7 implicite.
