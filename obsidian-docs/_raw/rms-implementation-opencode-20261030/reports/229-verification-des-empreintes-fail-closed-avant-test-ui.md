# 229. Bloquer le test si une empreinte ne peut pas être vérifiée

## Défaut reçu et correction

L'avis indépendant `result_mvvbtqmr_0019_jhnx56` identifie un seul blocage local avant le test d'interface : le lanceur marquait pinsAfter vrai avant de terminer les rehashes. Une exception de lecture pouvait laisser ce drapeau vrai et autoriser un statut extérieur trompeur. Aucun essai n'avait été lancé.

Le parent conserve l'original5094/66880718 dans `qa-private-ui-227/launcher-before-pin-fix-229.ps1`. Le correctif ne touche que le lanceur : le drapeau reste faux pendant toute la boucle, une divergence lève une erreur, vrai n'est affecté qu'après toutes les comparaisons réussies, et le catch remet explicitement faux. Les conditions de sortie, drains, délai et absence de kill restent inchangées.

## Vérification et portée

Syntaxe PowerShell : zéro erreur,29ms ; les cinq attentes restent explicitement bornées. Aucune évaluation, fenêtre, processus de test ou connexion. Le nouveau lanceur fait5148octets, SHA256 `9131ea1a43ff20fdf922e4d5980121ff2a272a74691c38ef4a74e59950e0ffef`.

Le même reviewer reprend uniquement cette correction et son impact, comme demandé ; aucun besoin de rouvrir les fichiers UI225 ou le produit226. Il avait confirmé réservation avant effet, environnement fermé, attentes/drains et séparation du vrai reçu de test. Les preuves antérieures restent liées à leurs octets, sans reclassification rétroactive.

Le petit test factice reste non exécuté tant que la réception de cette correction manque. Une fois reçue, le parent pourra effectuer les deux scénarios bornés prévus228, sans nouveau GO de routine, sans appel OpenAI ou clic navigateur. Leur résultat ne vaudra toujours pas connexion native, ACL privée ou parcours RMS complet.
