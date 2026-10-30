# 28. Publication reçue dans sa portée ; intégration autorisée

## Décision

La reprise indépendante rend **ACCEPTABLE_SCOPED sur r3**, sans bloquant résiduel identifié dans le correctif et ses impacts. Le parent reçoit le livrable de publication statique après examen du code, des oracles RED/GREEN et des régressions pertinentes ; l'intégration des six fichiers est autorisée.

Le résultat stocké conserve maintenant les octets bruts attribués et vérifiés dans la publication, le binding et sa relecture. La normalisation relève d'une dérivation parent déclarée, pas d'une substitution cachée. La branche historique sans policy demeure inchangée.

## Vérifications et protection du dépôt

Les deux tests non canoniques sont inchangés entre RED et GREEN ; le fichier de publication compte25 tests réussis et249 assertions, typecheck réussi, deux régressions historiques filtrées réussies. Les363 pins ont été vérifiés par parent et reviewer. Aucun SKIP compté PASS, thread ou suite globale.

Avant intégration, le parent a rapproché les six chemins du delta et les363 fichiers du candidat. L'index est vide ; les onze modifications préexistantes ne se recouvrent pas avec les six fichiers et leurs empreintes sont enregistrées. Aucune collision de source non suivie. La branche du développeur est propre et son HEAD est celui du candidat reçu.

Procédure : shutdown puis fusion native team_merge, readback exact, contrôles affectés par le transfert puis commit parent borné. Aucun merge manuel, bypass de hook, push distant ou amend. La préparation ne prouve pas encore que l'intégration a été réalisée.

## Preuves et limites

- Finale indépendante : `../evidence/ses_e7b871c97ffejOzcuBv1QZZe4s-native-finals-bundle-r3.json`, message `msg_184856ab200183P7zDj1svWGB2`, SHA256 texte `d0980c2813d6788f16e8256df0413407c71ca4d7b8375676c57c201ec3f042db` ; même Model.Ref OpenAI Sol high.
- Garde d'intégration : `../evidence/premerge-publication-r3.json`.
- Candidat : `../evidence/publication-r3-manifest.json`, HEAD `7d3fae678032a86964a98ab09c12c330dadf9d50` ; contrôles dans `publication-r3-parent-checks.json`.

Localisation : store prospectif, binding et tests gelés. Impact : réception et intégration logicielle statique bornée. Limites : route native, acquisition du prochain contexte, scénario final, revue finale L9 et acceptation L10 toujours non acquises. Ce verdict ne clôt pas M2.
