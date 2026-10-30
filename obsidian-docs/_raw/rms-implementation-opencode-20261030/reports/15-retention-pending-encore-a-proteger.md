# 15. Émission corrigée, rétention encore à protéger

## Résultat de la reprise indépendante

Le reviewer confirme la correction de l'émission et les résultats verts r4, mais maintient un bloquant du même périmètre : une seconde connexion peut retenir une requête prospective entre la première vérification de jointure et la lecture de requête par le chemin historique.

Ce chemin entre alors dans sa branche pending, attend le snapshot, puis **réécrit le body avant le garde final**. Le garde final empêche l'envoi, mais le body peut ne plus correspondre à la jointure. Le retry exact prospectif devient conflictuel. Le défaut résiduel concerne donc la rétention, pas une nouvelle émission native observée.

Le parent confirme que cette réécriture n'est pas protégée transactionnellement contre le domaine prospectif. Les succès précédents sont réels mais ne couvrent pas cette interposition initiale ; ils ne permettent pas de lever le bloquant.

## Décision du superviseur

Intégration toujours suspendue. Le même développeur reprend un correctif minimal : vérifier la classification et protéger la réécriture pending dans la même transaction immédiate, ou une solution équivalente démontrant que toutes les mutations sont gardées. Aucun verrou sur await, nouveau schéma, store ou extension de mandat.

Un négatif ciblé doit vérifier les octets retenus et le retry exact. Une interposition test-only entre deux lectures SQLite, avec deux connexions locales, est proposée pour simuler l'ordonnancement sans thread ; aucun nouveau framework. Le développeur livre d'abord le test seul si cette technique reste minimale ; le parent obtient RED avant correction. Si la technique exige une infrastructure importante, elle remonte au lead au lieu de contourner les interdits ou inventer un résultat.

Le premier test de course est conservé inchangé. Aucun nouveau test exécuté à cette étape, ni rejeu de zones non affectées ; revue suivante limitée au résidu et à ses impacts.

## Preuves et portée

- Finale de reprise : `../evidence/ses_e7bd3ecb9ffevCYWkaFJF5KMn3-native-finals-bundle-r4.json`, message `msg_18439f27b001QtmMv4CUzsGZtF`, SHA256 texte `14e6ad2ded3589fdc5581e861fe1c969f74684786ccc81b446a52f56aeed2d02`.
- Model.Ref natif : même OpenAI Sol high. Aucune délégation ou exécution de test par le reviewer.
- Sources r4 : client.ts:119–120 et140–160 ; UPDATE durable avant garde final. Le manifeste r4 est confirmé à360 pins conformes.
- Défaut déduit statiquement, pas encore reproduit. Les preuves RED/GREEN précédentes restent liées à leurs scénarios exacts, sans substitution d'oracle.

Localisation : branche pending du client existant. Impact : protection supplémentaire de rétention requise avant intégration. Limites : correction et preuve ciblée en attente ; aucune acceptation native ou globale, aucune levée d'arrêt.
