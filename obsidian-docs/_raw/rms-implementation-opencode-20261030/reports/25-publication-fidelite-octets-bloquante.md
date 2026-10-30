# 25. Publication : la fidélité des octets bloque l'intégration

## Problème et conséquence

La publication doit préserver les octets source lorsqu'un artéfact est déclaré « résultat stocké ». La revue indépendante identifie un défaut concret : le contenu JSON brut peut être indenté, mais la validation exige une reconstruction canonique pour l'artéfact, et non les octets bruts. Une transformation peut ainsi passer sans déclaration explicite de dérivation parent.

Le parent confirme ce chemin dans le code. Les23 tests réussis utilisent des contenus déjà canoniques et ne distinguent donc pas ces deux contrats. Leur réussite reste réelle, mais ne suffit pas à lever ce risque. **Intégration suspendue.** Aucun appel natif ou publication réelle hors fixtures n'est intervenu.

## Correction et preuve décidées

Le même développeur ajoute d'abord les tests seuls, sans modification de production : une source de résultat R JSON valide volontairement non canonique, injectée avant rétention par le port de lecture de fixture, avec empreinte cohérente. La normalisation déclarée comme résultat stocké doit être refusée avant écriture ; la sélection des octets bruts doit publier, conserver hash et binding exacts et reprendre sans substitution ni second effet.

Le parent vérifiera RED sur le code actuel avant d'autoriser le correctif minimal. Toutes les voies prospectives de validation, publication et liaison d'artéfact doivent préserver la source brute ; les chemins historiques sans opt-in ne changent pas. Une normalisation peut rester une dérivation parent seulement si elle est explicitement déclarée et attestée. Aucun nouveau framework, schéma ou changement de scientificCommitId.

La revue reprendra sur ce bloquant et ses impacts, sans répétition des contrôles inchangés ni recherche de couverture maximale. Les autres limites natives et la tâche du contexte suivant restent séparées. Aucun nouveau GO utilisateur requis.

## Preuves

- Revue conservée : `../evidence/ses_e7b871c97ffejOzcuBv1QZZe4s-native-finals-bundle-r1.json` ; finale principale `msg_1847b8e1a001DzrjCYGdpjPww9`, SHA256 texte `b71eb4fbd384294ddb16c8df20abd408a695e534bab0ff70da7f17bf155a2423`.
- Model.Ref natif : OpenAI Sol high, session fresh distincte de l'auteur ; aucun test par le reviewer.
- Code vérifié par parent : graph-store.ts:843–846 conserve les pins raw/document/record mais compare sémantiquement le JSON ; ligne860 exige les octets canoniques de scientificResult. Le helper test ligne29 sélectionne canonical(r.document). La voie recordArtifactBinding doit également être vérifiée pour éviter une recanonicalisation après commit.
- Le reviewer a vérifié363 pins conformes et six différences exactes ; les régressions historiques ciblées restent vertes dans leur portée.

Localisation : contrat des octets prospectifs et binding, non la route native. Impact : cas négatifs/positifs ciblés puis correction compatible avant intégration. Limites : défaut statique non encore reproduit ; aucune acceptation de publication ou clôture globale.
