# L8 — transport QA ciblée verte ; nouvelle admission suspendue

## Périmètre accepté

Le parent accepte la revue native `result_mvdw5mvw_0009_xbscer`
(`task_mvdvv316_0000_387rby`, session `ses_eb0b85cbdffecPS95Xc1JbDTFV`) :
**ACCEPTABLE_TYPE_ONLY_DELTA**. Onze insertions `<unknown>` seulement, 99 octets ;
aucune modification des valeurs attendues ou du JavaScript émis. Revue limitée
au delta de typage, distincte de la revue R5 des sources/oracles. Les six pins
(79488 octets) et le test déployé ont été rehashés par le parent.

Test courant : 37615 octets,
`08d43c6f97763bff4d55c179494619468d57deee323318de05e4d615e965724b`.
Le précédent gate rouge TS2769 reste intact ; il n'a pas été relancé.

Nouveau gate parent `l8-transport-qa-typefix-gate.cjs`, sans redéploiement du test :

- Typecheck : exit 0.
- Transport/numérique : **32 tests, 992 assertions, 2 fichiers**, zéro échec.
- Régression ciblée : **107 tests, 714 assertions, 7 fichiers**, zéro échec.
- 263 sources inchangées avant/après dans le dépôt et le snapshot retenu.
- 96 bases conservées, **24731648 octets** dans ce run ; 178 réservations dont
  82 sans base, 274 événements de registre. Aucun WAL/SHM/journal résiduel.
- Parent : rehash indépendant des sources, bases et logs après le gate ; exact.

Receipt : `.tmp/mission-v2-20261018-continuous/l8-transport-qa-typefix-receipt.json`,
SHA256 `1171be60425ac7a1d7a620d07932f570016566a9882e833aa40801171a99df64`.
Snapshot retenu :
`C:/Users/djden/AppData/Local/Temp/opencode/L8-TRANSPORT-QA-TYPEFIX-1792332532571`.
Adjudication : `l8-qa-types-parent-adjudication.json` dans le même lot scratch.
Aucun nettoyage, commit ou push. Ceci n'est pas une acceptation globale L8,
une qualification native, une admission full44 ou une promotion G5–G7.

## R3 documentaire préparé, pas encore ratifié

Le parent a précisé que l'unicité porte sur le candidat courant sélectionné par
`head.candidateGenerationId`, non sur toutes les origins PREPARED. Le staging
durable reste non autorisant, borné par les compteurs root existants ; le CAS seul
sélectionne le remplacement sous barrière continue. Les oracles Q1/Q2 couvrent
restart, deux stages et un seul gagnant. L'enveloppe est byte-identique.

Sorties : `.tmp/mission-v2-20261018-continuous/l8-phase2-r3-fix/outputs/` ;
manifest SHA256 `fdef256266c279a96abfb67c7df30dde10fca673bba61fa5c6163354f7041e25`.
Paquet de revue : `l8-phase2-r3-review/inputs/`, 9 pins/197805 octets ;
manifest SHA256 `59c7c061c6267a2ea2875903c1f158e26dc27dc3d24dc780ab9161d8e24e97d2`.
La tâche `task_mvdwb1gr_000c_l8wn65` reste pending : aucun reviewer créé,
aucune acceptation R3, aucun démarrage S1/S2.

## Blocage nécessitant l'opérateur

`team_spawn` a refusé l'admission : **Mission policy is not approved**.
Le statut effectif indique draft, contrairement à l'approbation v1 historique.
Le JSON actuel a pour hash
`53822921c94bed937cef8d14a64ccef6ee9034b7fc0e8788430c59f8fd3f504d` ;
le hash approuvé historique était
`b97d940a25f7e2db6feab6224441e5f5a12e4d81e22220a80ce84aee00586f11`.
Ces deux valeurs ont des domaines d'encodage différents ; elles ne prouvent PAS
une modification de contenu. Vérification à la reprise : SHA256 de
`JSON.stringify(JSON.parse(rawFile))` vaut exactement `b97d940a…586f11`, égal à la
proposition approuvée. Le refus effectif draft/not approved était réel, mais aucun
changement de contenu ou auteur de changement n'est établi. Aucun changement de
configuration, restauration aveugle, override de modèle ou autre harness.

L'opérateur doit afficher et vérifier la politique exacte par
`/ensemble-mission config`, puis approuver avec `/ensemble-mission start`.
Un simple « go » de conversation ne rétablit pas cette gate. Les tâches déjà
admises et les contrôles parent autorisés ont pu être terminés ; toute nouvelle
délégation reste fermée jusqu'à l'approbation effective.

Après réouverture : revue fresh R3 puis ratification/S1–S4 selon dépendances ;
ratification écrite partielle full44 Q1 DTO/codec et paquet source encore à faire.
Full44 exécution, run01/live/FF8 et G5–G7 restent exclus sans leurs gates propres.

## Reprise — blocage levé par approbation opérateur révision 2

L'opérateur a affiché la proposition puis approuvé `/ensemble-mission start` ;
`team_status` confirme approved v2. Même hash normalisé `b97d940a…586f11`.
La revue R3 native fresh `result_mvdy2nv4_000n_4nsytw` est ensuite acceptée,
avec rehash indépendant des neuf pins et comparaison raw E avant/après exacte.
Le parent ratifie S1 source pure seulement. Full44 Q1 data/codec dispose aussi
d'une ratification écrite partielle ; trois nouveaux workers disjoints sont
admis sous v2, sans overrides, Model.Ref natifs vérifiés. Voir
`SOURCE_RATIFICATIONS_AND_POLICY_V2_20261018.md` pour la frontière actuelle.
