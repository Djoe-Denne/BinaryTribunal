# bridges-rare — incompatibilité de fixture L1 avec le L2 courant

2026-10-15. **Anomalie de données L1 confirmée, OPEN.** Ce n'est pas un défaut
du guard L2 ni une permission de modifier une fixture gelée. Aucun fichier L1,
schéma, manifeste, validateur ou source accepté n'est changé par cet arbitrage.

## Reproduction parent indépendante

`test/fixtures/graph/bridges-rare/content.json`, SHA256 brute
`69278ee8e28390b623f525774e8fe036231873934fb30ed0e98a2c33353105c4`.
Le vrai `validateGraphSnapshot` main retourne exactement :
`edge instruction site is outside source function chunks`.

L'arête `edge:b6d08bd48f2db9a252d08e39bac277cbb23849d9d963407889566b4ab4285fb1`
part du caller `…:0x2100`, span unique **[0x2100,0x2110)**, taille connue 16.
Son site instruction/provenance est **0x2110**, donc hors du span à borne exclusive.
Le rejet est correct et ne doit jamais être contourné.

Deux digests différents, tous deux reproduits :

- SHA du contenu canonique **complet**, celui du manifeste :
  `21e7adc63cdb73a8b78f2cacd9258258e46117e1d0f9bc5fdde7a022686a28f0` ;
- `normalizedFingerprint`, calcul excluant ce champ :
  `21e42bba205f9b55415f74176c005bb7e766a690592b8e9ee15f841c776b9774`.

Le manifeste gelé déclare expectedContract=accept ; cette déclaration ne peut
pas annuler les invariants cross-field du L2 accepté. L'ancienne couverture L1
n'est pas rétroactivement présentée comme validation de ce guard supplémentaire.

## Décision pour la tranche QA en cours

1. Garder une régression distincte : hash original exact et rejet réel de
   l'original, pas de skip, whitelist, auto-réparation ou loader permissif.
2. Pour le **positif topologique rare-bridge**, autoriser un constructeur de test
   explicite `syntheticRareBridgeDeclaredSpanV1` dans les chemins QA déjà approuvés.
   Deep-clone, préconditions source/pins/edge/span/size/site exactes ; changer
   seulement le caller end→**0x2111**, size known→**17**, et l'identité/fingerprint
   d'un **nouveau** snapshot dérivé. Aucune arête/site/provenance, fonction-ID,
   couverture ou déclaration d'accord/oracle n'est réécrite.
3. Identité du dérivé : `fixture:bridges-rare:caller-span-v1:` + SHA256 canonique
   de `{domain:"re-graph-scheduler-test-only-bridges-rare-span-v1",
   originalContentSha256:<digest complet ci-dessus>, callerId:<ID complet>,
   oldEnd:"0x2110", newEnd:"0x2111"}`. Fingerprint du snapshot recalculé normalement.
4. Vérifier le vrai validateur, le non-overlap, la topologie/provenance inchangée,
   les champs unknown/nonoracle inchangés, les octets source intacts. Ne pas
   imposer aux nouveaux hashes/coûts/plan IDs d'être ceux de l'ancien snapshot.

Parent a exécuté ce dérivé : strict validation `[]`, nouveau snapshotId
`fixture:bridges-rare:caller-span-v1:dfa3df47740344acc62b2fcd56d1579b3e9d695fc06ad7cc50da699c056a4cef`,
normalizedFingerprint
`bb3b194a9d51d181c61118a742223d91676983059a8ea8a549116a3627204630`.
Les sources/edges/sites/provenance/coverage restent exacts ; tous nodes nonoracle,
byteAgreement unknown. **Aucune preuve de vrais bytes ou réparation canonique L1.**

La revue des nouveaux tests devra vérifier ce dérivé et le rejet original. Cette
décision permet de poursuivre les autres croisements ; elle **ne clôt pas** l'anomalie
L1 et n'autorise pas une déclaration « tous les originaux L1 sont valides au L2 ».
L9/L10 devront conserver la limitation et arbitrer une éventuelle révision additive
explicite ou sa portée finale ; aucun gel historique n'est réécrit implicitement.

## Autres erreurs de setup déclarées par l'auteur QA

Les liens L4 `validation=validated` ne sont autorisés que comme déclarations
**synthétiques explicites** ; conserver le négatif non validé, pas de faux niveau
réel/native. Le raw98 doit effectivement refuser le planning avec
`selfLoopsPreserved=false` : tester la raison et l'absence d'effet, ne jamais
modifier ces flags pour obtenir un positif. Les positifs planning utilisent les
autres fixtures complètes contrôlées. Pas d'acceptation sur les premiers tests verts.

Artefacts parent : `.tmp/coordination-three-20261014/bridges-rare-parent-arbitration.json`,
`bridges-rare-derived-synthetic.json` et script de reproduction associé.
