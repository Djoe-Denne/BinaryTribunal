# M2 — 125 : ne pas confondre attente bornée et sortie garantie

## Objectif et limite signalée

Le test de concurrence doit vérifier un échange unique sans laisser de thread orphelin. L'auteur signale pendant le correctif124 qu'il peut borner les attentes et demander la terminaison, mais que Worker.terminate ne garantit pas une sortie native dans ce délai si le runtime bloque. Aucun thread n'a été lancé ; il s'agit d'une limite du mécanisme proposé, pas d'un incident observé.

Le parent retient la distinction : seul l'événement exit constitue une sortie observée. Une expiration du délai, une promesse terminate non résolue ou une fin du test ne permettent pas d'affirmer que le thread est joint. La garantie supplémentaire invoquée nécessiterait un confinement externe, non autorisé à ce stade.

## Décision

Continuer la livraison **source seulement** des trois corrections124, y compris les échéances explicites, les deux fautes locales et la conservation des erreurs primaires/nettoyage. Ne pas remplacer la garantie manquante par un statut PASS, un SKIP, une hausse de délai ou une assertion sur la seule demande de terminaison.

**L'exécution des chemins lançant le contendeur reste HOLD avant RUN** jusqu'à résolution et revue de cette condition de sûreté. Aucun confinement externe, subprocess/runner supplémentaire, service, changement de permissions ou action d'alimentation n'est autorisé. Une nouvelle infrastructure importante exigerait un arbitrage explicite ; elle ne doit pas être ajoutée par le worker pour fermer la gate.

Après livraison et revue, le parent séparera les contrôles sans thread qui peuvent utilement progresser de la preuve de contention encore bloquée. Aucun nouveau gate ni test n'est autorisé ici. Les cas non lancés seront déclarés comme tels ; le remplacement global ne sera pas accepté sans les preuves obligatoires.

## Livraison attendue

Documenter les bornes de travail et nettoyage proposées, les branches exitObserved et exitUNOBSERVED, l'absence de fausse annonce joined, et la frontière exacte qui demanderait une permission supplémentaire. Les bornes proposées5s+2s sont à vérifier statiquement avec le budget complet et le timeout15s, non des timings observés ni un relèvement autorisé. Les corrections observation/hôte LIVE continuent sans dépendre de ce débat de sûreté.

Le reviewer examinera les défauts124 et leur impact, pas une garantie native inventée. S2/M2 restent ouvertes ; contention non obtenue, aucune dérogation à l'absence d'orphelin. Pas d'import, test, thread, SQL/DB, asset, Git ou nouvelle infrastructure exécuté.
