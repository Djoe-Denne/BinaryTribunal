# 224. Gel final de connexion et reprise des contrôles affectés

## Situation et décision

Les premiers contrôles223 avaient réussi, puis quatre fichiers avaient changé. Le constructeur livre maintenant un gel final et annonce l'arrêt des éditions. Le delta supplémentaire répond à la précision sur les erreurs publiques : distinguer refus, délai dépassé, état d'authentification et fermeture physique. Il ne réalise pas le relais vers l'utilisateur et ne lance aucune connexion.

Le parent a recalculé les huit pins finaux et préservé les huit fichiers dans `qa-owned-auth-223/final-gel-224`, sans base de données. Les pins correspondent à cette livraison finale. L'acceptation reprend sur ces seuls octets, pas sur une attribution des tests223 aux fichiers modifiés.

## Vérifications autorisées et bornées

Le parent a lu le helper de statuts, son utilisation réelle dans le résultat, les erreurs fermées du transport et les assertions ajoutées au test de projection. Il autorise le typecheck et les mêmes neuf tests exacts223 : cinq client et quatre binding, mêmes filtres ancrés et mêmes imports hors ligne déjà inspectés. Les fichiers client, transport et binding modifiés justifient cette reprise ciblée ; aucune suite générale n'est ajoutée. Dix minutes par invocation, sans retry automatique, sortie0 et nombres de tests exacts attendus.

Les reçus seront dans `qa-owned-auth-224`, avec huit pins avant/après chaque commande. La syntaxe du bootstrap candidat pourra être vérifiée par `node --check`, sans import ni évaluation ; elle ne prouvera aucun comportement natif. Aucun déploiement ou OAuth n'est autorisé par ces contrôles.

La revue indépendante est informée du gel final et ne reprend que les défauts bloquants et l'impact des corrections. Les résultats223 et219 restent des preuves historiques dans leur portée. Le relais IPC privé vers l'utilisateur, les droits d'accès Windows et le contrôle extérieur de la vraie invocation sont encore à réaliser et vérifier avant connexion.

## Pins finaux

- Client130585 : `9724e7d04402f59fc9f05a486079f528ac31222a0f38187d036a286df3daddf5`.
- Transport30130 : `adaea927c6ba15f5a1a9228f6aa1f7f934fcc77c1d8c5856a02482b70f77ac8c`.
- Binding39342 : `b29fea6f6348a0d1af9b525657030c4d527952029c0e56d6d397579210414937`.
- Testbinding31652 : `adf58228b746083bc852ebf20b3e9fa9fd0bdb46ab27193085a1fb807658aee1`.
- GraphStore8969c150, testclientc64568d2, bootstrap398a184a et plan2fdeb0e5 inchangés ; valeurs complètes dans les reçus.

Aucun modèle, session, effet IDA, crédit ou origine RMS acquis par cette livraison. Le petit parcours et M2 restent ouverts.

## Résultats réels

Typecheck PASS3922ms ; cinq tests client PASS80assertions1132ms ; quatre tests binding PASS77assertions103ms. Zéro échec/timeout ;117cas client et14binding filtrés non exécutés. Les huit pins correspondent avant et après chaque commande. La syntaxe du bootstrap passe aussi en85ms, sans évaluation. Reçus et sorties dans `qa-owned-auth-224`.

## Contrôle Windows et suite nécessaire

Une lecture native de l'ACL — la liste des droits d'accès Windows — de l'hôte180 constate des droits héritables en lecture/écriture pour plusieurs identités autres que l'utilisateur, SYSTEM et les administrateurs. Aucun droit n'a été changé par cette lecture. Le mode0700 du mkdir ne suffit donc pas à établir la confidentialité du futur dossier Auth.

Le parent retient une correction locale : préallouer le seul sous-dossier Auth avec des droits Windows protégés, puis lire réellement ces droits avant lancement et à réception. Le reste du namespace180 et ses dépendances partagées ne doivent pas être modifiés. Le client doit exiger un dossier préalloué vide, réel et sans lien symbolique, plutôt que le créer sous des droits hérités. Ce raccord reste à réaliser et vérifier, avec le relais privé d'interface ; les tests hors ligne ne prouvent pas ces propriétés natives.
