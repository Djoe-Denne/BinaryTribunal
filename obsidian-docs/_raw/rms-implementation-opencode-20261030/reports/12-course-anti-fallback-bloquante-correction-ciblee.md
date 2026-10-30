# 12. La revue révèle une course anti-fallback : intégration suspendue

## Objectif et conséquence concrète

Le raccord doit empêcher toute préparation prospective non qualifiée d'atteindre le transport historique. La revue indépendante identifie un ordonnancement qui contourne ce refus. Les contrôles précédents réussis ne couvrent pas ce cas concurrent ; ils ne suffisent donc pas à accepter l'incrément.

Le superviseur confirme le défaut dans le code et suspend l'intégration. Aucun appel natif réel n'a été effectué : le risque est établi par analyse statique, pas par une admission native observée.

## Défaut confirmé

Dans client.submit, le garde vérifie l'absence de jointure prospective, puis attend snapshot et éventuellement renew. Pendant cette attente, prepareRuntimeDispatch peut retenir la jointure et la requête pour la même clé. À la reprise, l'insertion historique ignore le conflit et relit la requête prospective. Le digest de commande correspond et le chemin historique peut appeler le transport sans nouveau contrôle du domaine réservé.

Le test séquentiel existant (« préparer, puis appeler submit ») ne couvre pas cet entrelacement. Un éventuel rejet ultérieur du faux serveur pour révision divergente ne satisferait pas le contrat : **zéro émission** est l'oracle nécessaire.

## Correction et vérification décidées

Le même développeur reprend uniquement ce défaut, dans sa session et son worktree :

1. Ajouter d'abord un test négatif avec snapshot différé par Promise/barrière JavaScript, sans thread ni nouveau harnais. Préparer pendant l'attente puis libérer ; vérifier refus et compteur transport submit égal à zéro, jointure et body conservés.
2. Geler le test seul. Le parent exécutera ce contrôle sur le code encore fautif pour obtenir la preuve RED ; aucun test produit par le développeur.
3. Après ce résultat, arbitrer atomiquement réservation historique et jointure prospective dans le journal existant. Un simple second contrôle hors transaction ne suffit pas à exclure l'interposition d'une autre connexion. Aucun verrou détenu pendant await, second store ou architecture ajouté.
4. Exécuter GREEN puis les contrôles affectés sur une nouvelle révision pinnée. La reprise de revue indépendante portera sur ce bloquant et ses impacts, pas sur une nouvelle étude générale.

Quinze secondes par test, suite globale et threads toujours interdits. Les corrections documentaires précédentes restent acquises. Les preuves sur zones inchangées restent réutilisables ; les preuves client ne sont pas transférées silencieusement à un futur code modifié.

## Preuves et état

- Review fresh conservée : `../evidence/ses_e7bd3ecb9ffevCYWkaFJF5KMn3-native-finals-bundle.json`.
- Finale initiale : `msg_1842e618e001MJ0ZOOV5Etyuug`, SHA256 texte `447b26a4857015516e806de81a80dd55cae00e34269f4c199b50585aa6e181e1` ; addenda de provenance et r2 sans nouveau bloquant.
- Model.Ref natif relu : OpenAI Sol high. Le reviewer n'a exécuté aucun test et ne délègue pas.
- Vérification parent : src/client.ts:114–149, en particulier garde116, attente121/123, transaction125, relecture126 et émission149 dans le worktree r2.
- Verdict indépendant : BLOQUANTS, un défaut de code ; limites natives déjà admises séparées, aucun autre bloquant de code ajouté.
- Les trois finales ont été récupérées directement dans la session native après notifications incomplètes, sans remplacer le reviewer ou changer de modèle.

Localisation : journal client et test ciblé existant. Impact : correction locale et preuve concurrente déterministe nécessaires avant intégration. Limites : scénario pas encore exécuté, correctif pas encore réalisé, activation native et acceptation complète toujours non acquises. Décision prise dans la délégation, sans nouveau GO utilisateur.
