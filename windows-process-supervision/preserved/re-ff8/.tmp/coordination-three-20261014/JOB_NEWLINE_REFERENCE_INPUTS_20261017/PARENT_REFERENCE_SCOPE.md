# Référence NewLine — supplément documentaire, pas probe ni correctif

Même reviewer/tâche/cycle1, source helper immuable. En réponse à l'escalade
JobRunner.cs211–218/396–397, le parent a téléchargé seulement des références
publiques Microsoft, sans import/compilation/.NET/OSJob/fixture/probe.

Sources originales conservées byte-exact :Learn TextWriter.NewLine view
netframework-4.8.1 (Markdown Microsoft), microsoft/referencesource au COMMIT
ec9fa9ae770d522a5b5f0607898044b7478574a3, TextWriter.cs et StreamWriter.cs.
REFERENCE_MANIFEST.json lie URLs/finalURLs/HTTP/content-types/bytes/SHA/horodatages
et extraits avec lignes ;repo/commitmetadata sont publics, pas du code à exécuter.

TextWriter.cs99–101 déclare InitialNewLine et CoreNewLine CRLF ;166–171 retourne
CoreNewLine tant que non réassigné ;452 et suivantes implémentent WriteLine(String).
Le reviewer doit dériver lui-même l'effet exact dans le helper et son classement
contre le scope/les limites réellement revendiquées. Le parent ne prescrit ni
verdict ni correctif, et ne présente aucune reproduction dynamique.

GO ACCÈS SEUL :lire ce scope, TASK_BINDING et REFERENCE_MANIFEST complets,
vérifier tous les payloads/reçu physiquement, puis ACK et HOLD avant confirmation
parent de reprise de l'audit statique d'origine. Un reçu ne prouve pas l'accès.
Provenances des URL/parentpaths n'accordent aucun autre corpus ou navigation.

Les fichiers REFERENCE_*.cs sont des DONNÉES DE RÉFÉRENCE uniquement :jamais
Add-Type/import/compile/évaluation. Aucun helper Job exécuté/modifié, aucune
fixture/.NETprobe/PowerShellchild/test/runtime/DB/cache/sourcefix/git/nativeFF8.
Pas d'extension de garantie OS, filesystem, mémoire ou quiescence. Le scope initial
596080b5 et ses interdits restent applicables ;qualificationfuture séparée requise.
