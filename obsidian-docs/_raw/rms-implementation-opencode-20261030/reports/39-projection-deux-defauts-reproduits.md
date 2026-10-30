# 39. Projection : les deux défauts sont reproduits sans parcours coûteux

## Résultats observés

Le parent a exécuté séparément les deux nouveaux négatifs, chacun sous la borne externe de quinze secondes, sur les sources encore inchangées :

- **Policy sans droit R :0 PASS/1 FAIL, deux assertions**,247 ms Bun. La fonction ne refuse pas et rend un GraphEngine malgré les grantsA-seul/B-seul. Le rejet attendu manque réellement.
- **Expiration après événement :0 PASS/1 FAIL, quatre assertions**,92 ms Bun. Le compteur de transport vaut **un au lieu de zéro** après que admission_sending a atteint l'expiration de la lease.

Ce sont des échecs d'oracle attendus pour reproduire les défauts, pas des timeouts ni des erreurs de fixture. Les assertions postérieures au premier échec ne sont pas réputées atteintes. Aucun parcours central, publication coûteuse, thread ou appel natif.

## Intégrité et autorisation

Avant les tests, seuls les deux fichiers de tests changent depuis r3 ; les cinq sources sont identiques. Après exécution,365 pins relus sans dérive. Le même développeur reçoit les deux RED et l'autorisation de réaliser les correctifs38 : fermer la policy incompatible avec R et contrôler après append dans la transaction d'envoi, avec rollback avant transport.

Les deux nouveaux négatifs restent inchangés. La fixture positive des rôles peut devenir A+R/B+R, avec union exacte explicitement autorisée pour R, sans supprimer la protection croisée A/B ni réécrire les propositions. Aucun rôle n'est ajouté silencieusement à une policy existante.

## Blocage de délai distinct

Ces deux défauts ne démontrent pas la cause du cas central interrompu avec des grants complets et un TTL normal. Leur correction ne vaut donc pas autorisation de relancer automatiquement ce cas, d'élargir aux47 scénarios ou d'augmenter son délai. La preuve centrale reste manquante et bloque toujours l'intégration.

Après livraison stable, le parent exécutera compilation, GREEN ciblés et contrôles d'impact justifiés, puis la même revue indépendante reprendra sur les deux défauts et leurs impacts. Aucun nouveau GO utilisateur requis.

## Preuves

- `../evidence/projection-r4-manifest.json`, SHA256 `00fc10299afc2a2deca2224d3a253724f5f7b7e3b385d2dd8d7a82a0c546bede` ; HEAD test-seul `d4fe431d2204ff3cd32cde114b374b09ea5a40dd`.
- `../evidence/projection-r4-targeted-reds.json` ; reçus et captures `projection-role-red-r4` et `projection-fence-red-r4`.
- Assertions : next-context.test.ts:187 et eventlog.test.ts:569. RessourcesOWN et cleanup limité aux nouvelles fixtures de cette sélection, aucune fixture interrompue réouverte ou effacée.

Localisation : refus de policy avant anchor et frontière transactionnelle d'envoi. Impact : deux preuves RED obtenues et correctifs locaux autorisés. Limites : GREEN, revue et acquisition centrale non acquis ; v3/natif et clôture globale toujours hors preuve.
