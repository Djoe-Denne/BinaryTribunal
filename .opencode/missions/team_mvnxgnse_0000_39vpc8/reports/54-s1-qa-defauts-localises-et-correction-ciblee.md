# M2 — 54 : défauts QA localisés, correction ciblée sans changement produit

## Résultats relus par le parent

GO53 clos : qa10-root-sources exit1, **56PASS/1FAIL/121assertions**,2840ms ; qa11-typecheck exit2, **six TS2769**,1885ms. Reçus ont le même sourceSet22d6d8c5… ; ledger11runs/6reprises/8980ms/nonbloqué. Knowledge et nouvelle isolation NON EXÉCUTÉS, pas SKIP/PASS. Aucun défaut produit établi.

Parent lit root-sources:27–48, manual-context:6–17, sparse-graph-codecs:188–198 et les six diagnostics de typing. Le nominal A, les cas B, multifonction et contextes divergents ont été atteints lors de qa10 ; ce n'est plus le blocage global des anciens prérequis. Le groupe demeure rouge tant que son cas restant n'est pas correctement qualifié.

## Adjudication du cas N1

Le cas positif « retained summands preserved » fournit source-summands avec **zéro source et zéro arc canonique**. Le codec qualifié exige rawArcCount positif et strictement supérieur au nombre canonique (191–192). Ce témoin ne relève donc pas du domaine accepté. Ce n'est pas une raison d'assouplir le codec ou les seuils numeric450+9.

**Correction explicite d'une attente QA erronée, pas suppression de cas** : conserver la fixture retainedEmptySummands et la tester comme refus source count ; garder un cas positif N1 de préservation sans producteur, sur le témoin non vide manuel déjà construit raw (3summands .5+.5/1 pour2arcs canoniques). Vérifier le contenu exact des summands et leur rétention/nonmutation, pas seulement ok=true. Le graphe vide canonique sans source retenue reste couvert par le nominal de base. Ne pas déclarer l'ancien rouge PASS rétroactivement ni substituer silencieusement les nouveaux nominaux à son obligation. Les57cas existants restent représentés et un négatif explicite s'ajoute (58root attendus).

## Correction des six erreurs QA de typing

TS2769 aux comparaisons profondes (envelope Data, version de run inférée string, externalContextIds inféré never[]). Corriger les annotations des attendus lorsque leur DTO est réellement constructible ; ne pas affaiblir la signature du produit, le tsconfig, supprimer un champ ou masquer un diagnostic.

Si le problème est uniquement la contrainte générique de Bun expect entre DTO readonly et donnée attendue manuelle, `expect<unknown>(actual).toEqual(expected)` est autorisé aux six assertions concernées : ce n'est pas un cast, le deep-equality runtime est inchangé et les types du résultat produit restent contrôlés ailleurs. Cette assertion ne prouve pas à elle seule que l'attendu porte statiquement le DTO. Aucun any/cast/suppression ajouté pour éviter une vraie incompatibilité des données, aucun remplacement par comparaison partielle ou stringify.

## Mandat et vérification fermés

Même QA indépendante, mêmes fichiers autorisés. Éditer uniquement les tests/oracles/annotations concernés, conserver les attentes indépendantes des autres cas et les42inputs RO. Rapports mettent en évidence ces corrections, hashes avant/après et raison de l'attente N1 corrigée. Pas nouvelle revue obligatoire, cadre ou harnais.

Après correction complète, paquet **typecheck → root-sources → knowledge → isolation**, une invocation de chaque maximum, aucune édition entre contrôles. Typing d'abord pour ne pas dépenser du runtime sur une version déjà invalide ; si tout le reste reste identique, ce typing est la preuve finale et n'a pas à être rejoué à la fin. Un seul groupe rouge ou nominal non atteint ferme le paquet et suspend tous les suivants. Pas de nouvelles corrections/relances sous ce GO ; rapport de cause/version/portée au parent.

Runner parent : plafond15runs/9reprises, quatre places depuis ledger11 ;300s cumulées,60s typing et30s groupe inchangés. Ordre imposé et sourceSet identique à celui de la première invocation. Reçus/counters historiques intacts, aucun16e/directCLI/groupe renommé autorisé. Les56PASS sont rejoués dans leur groupe uniquement parce que fixture/test/oracle de ce fichier et types comparés sont affectés ; wire/projection et numeric450+9 inchangés réutilisés sans rejeu.

## Limites et objectif final

Ces corrections retirent deux causes QA précises maintenant démontrées, pas un contrat produit revu ni une campagne exploratoire. Elles rendent possibles les preuves knowledge/isolation encore obligatoires. Un paquet vert sera soumis au jugement parent, pas autoaccepté. Body natif complet03:26 reste non prouvé par DATA S1/Sscientifique/caps, sans waiver ; attribution de frontière encore à fermer avant promotion dépendante. S1 non accepté/intégré,000a ouverte. Trois commandes consolidées M2 NON EXÉCUTÉES ; aucun Git/DB/native/jeu/IDA/C#/framework/configglobal ou nouvelle permission.

Runner révisé : node --check PASS, SHA **9df09c56637eb7c1e70b55975eec5ec781f8564fdb07ad3035ab94ad2a88493e**, ledger toujours11runs/6reprises/8980ms/nonbloqué après ce contrôle ; aucun test/typing produit lancé par le parent.
