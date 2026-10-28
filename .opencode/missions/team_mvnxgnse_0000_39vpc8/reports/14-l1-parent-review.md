# M2 — 14 : L1 livré, résultats contrôlés et défaut de frontière UTF-8 isolé

## Vérifications réellement effectuées

Preuve parent : `../evidence/numeric-l1-parent-review.json`. Onze pins (sources et logs natifs red2/green) vérifiés, zéro écart. Suffixe scientifique depuis `type Writer` byte-exact ; fichier des neuf régressions byte-exact. Aucun test rejoué.

Les logs conservés montrent le rouge comparable (98 tests : 8 succès/90 échecs, 199 assertions), puis le vert (98 succès/0 échec, 2 023 assertions). Le premier rouge est conservé avec sa limitation de réencodage PowerShell ; il n'est pas requis comme preuve byte-raw quand red2/green sont disponibles.

Lecture du seam : débit avant I/O, readback avant admission, terminal/charges/ordinal conservés. Le test local importe uniquement bun:test et le seam privé, celui-ci seulement node:path. Aucun des 450 cas, des neuf régressions ou des trois checks globaux M2 n'a été exécuté.

## Défaut concret encore ouvert

Le writer vérifie le texte et sa longueur réencodée UTF-8, mais le lecteur de production du différentiel (`qualification/test/numeric-differential.test.ts:897–898`) utilise `readFileSync(path, "utf8")`. Des octets invalides peuvent être remplacés au décodage.

Contre-exemple minimal calculé indépendamment (sans code scientifique ni altération de fichier) : texte attendu U+FFFD = trois octets UTF-8 valides ; fichier hypothétique `80` = un octet invalide. Le décodage donne U+FFFD, texte et longueur réencodée correspondent, alors que les bytes physiques diffèrent. L1 ne prouve donc pas encore la custody byte-exacte de sa vraie frontière de lecture.

Ce défaut ne transforme pas les 98 résultats observés en faux résultats : ils restent valides pour leurs scénarios, mais ne couvrent pas cette frontière. Aucun nouveau framework ou oracle scientifique nécessaire pour la correction.

## Correction ciblée à reprendre sous admission applicable

Proposition : lire/borner les bytes réels avant décodage et vérifier qu'ils correspondent à l'encodage UTF-8 canonique du texte restitué, ou fournir une comparaison byte-exacte équivalente. Rejeter les bytes invalides/corrompus comme FS_READ, jamais les normaliser silencieusement. Accepter le véritable UTF-8 valide de U+FFFD ; ne pas bannir le caractère de remplacement légitime. Ajouter le seul négatif distinct et ses nominaux pertinents ; conserver les 450 cas et leurs attentes.

Toute modification du lecteur de production doit être déclarée dans le diff et les nouveaux pins ; l'ancienne revendication « suffixe entier inchangé » ne sera plus réutilisée pour ce code modifié. Contrôler séparément l'identité des cas/oracles et le patch reader, sans prétendre que tout le fichier reste inchangé.

## État de configuration et suite

Nouvelle révision de configuration demandée : long_run, classification manuelle, catalogue et QA conservés. Brouillon modifié et vérifié ; son config/start reste à effectuer par l'utilisateur. Aucune nouvelle admission ni réactivation de worker dans ce contrôle parent. Les preuves livrées sous la révision 1 ne sont pas rejetées du seul fait de la révision future.

Numeric reste partiel. Avant science : correction custody ciblée, candidat/contrat L2 fermés et QA indépendante, puis validation parent de la seule invocation inspectée autorisable selon le rapport 12. Pas de nouvelle campagne pour améliorer une couverture abstraite.
