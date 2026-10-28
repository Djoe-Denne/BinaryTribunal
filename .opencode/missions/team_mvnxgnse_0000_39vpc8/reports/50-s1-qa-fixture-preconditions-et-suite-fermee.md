# M2 — 50 : préconditions QA rouges, paquet final de contrôles borné

## Constat vérifié et version des données

Parent lit qa05/qa06 root-sources : exit1,0PASS/27FAIL à chaque invocation, causes répétées « subsetSize OR budget requis » puis chemins absolus exacts. Pas de signal/erreur d'outil ; aucun négatif sémantique de root crédité derrière ces préconditions.

Pendant ce contrôle, qa07 a déjà terminé dans le budget48 : exit1 sur « new admission policy version required (maximum32UTF16) ». Ledger7runs/2reprises/2287ms/nonbloqué. Le fichier manuel actuel est déjà différent du snapshot hashé dans qa07 (91b791…→02c61c…) : les lectures statiques de la version courante ne prouvent pas les valeurs réellement passées lors du rouge. Garder le lien version/reçu, ne pas déclarer un bug produit sur le seul message.

Le parent a identifié la règle source dans le codec qualifié (`graph-pure-codecs.ts:365–371,425–430`) : préfixe et longueur de version, pas seulement sa longueur. Cette localisation aide à examiner une précondition ; elle ne fournit pas un oracle de résultat du candidat.

## Décision proportionnée

Le premier budget ne peut plus couvrir les trois vérifications obligatoires restantes : root nominal corrigé, knowledge indépendant puis typing des nouvelles sources QA. La construction manuelle de la fixture a changé ; les typing/verts initiaux ne couvrent pas ces nouveaux bytes. Il ne faut ni supprimer un contrôle ni transformer un prérequis manquant en succès pour tenir artificiellement le compteur.

Le parent autorise **un paquet fermé de trois contrôles à partir du ledger7** :

1. Une invocation root-sources après examen statique complet des préconditions/types/schémas publics et correction identifiée. Nominal atteignant réellement les joins, sélection/unités/grants pertinents ; négatifs actualisent les hashes requis sans devenir refus précoces d'autre chose.
2. Première invocation knowledge après construction indépendante complète, si ses préconditions sont recevables. Pas de fixture/oracle auteur ni producteur de référence du SUT.
3. Typing final des sources QA actualisées après ces compléments.

Si le nouveau nominal reste refusé et la cause n'est pas établie, arrêter les runs dépendant de ce nominal et rendre diagnostic/versions/portée partielle ; pas de suite de probes automatiques, champ après champ. Les contrôles indépendants déjà valides restent acquis et non rejoués. Aucun candidat produit RO à modifier pour faciliter la fixture.

## Compteurs et conditions

Runner parent modifié uniquement : maximum8→10invocations, reprises2→4. **300s cumulées,30s/test,60s/typing restent inchangés**, aucun reçu ou compteur effacé. Les deux invocations supplémentaires au-delà du plafond initial couvrent la reprise root supplémentaire et le typing actualisé ; la connaissance reste son premier check prévu. Pas de 11e invocation, reprise additionnelle ou autre groupe valide rejoué par cette décision.

Ce correctif de budget cible des données QA réellement modifiées et la preuve de typing manquante, dans M2§7.1 ; pas nouvelle infrastructure, algorithme ou extension fonctionnelle. Une erreur de fixture n'est ni un échec de science ni une raison de baisser les seuils ou enlever les cas.

## Restant

37PASS initiaux restent limités au wire/projection simple/isolation de ces chemins. Nominaux root/enveloppe/run/knowledge/context et pureté des nouveaux chemins ne sont pas réputés satisfaits. Verdict S1 demeure ouvert ; si une preuve obligatoire reste absente après le paquet, résultat partiel/bloqué explicite, pas acceptation.

Trois checks consolidés M2 NON EXÉCUTÉS ; numeric450+9 accepté réutilisé, pas de benchmark/DB/native/jeu/IDA/Git/cleanup ou permission supplémentaire.

Runner révisé syntaxe node --check PASS, SHA `f9464a4eeb9eae946e292f5fb3a33dcce2ec7d26673e1a34f23136fa66432afd`. Ledger relu7runs/2reprises/2287ms/nonbloqué avant reprise, aucun test parent exécuté ni compteur réinitialisé.
