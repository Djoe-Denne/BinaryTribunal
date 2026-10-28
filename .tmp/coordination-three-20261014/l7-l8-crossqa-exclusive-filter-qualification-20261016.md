# Qualification du premier préflight de créneau — aucun GO émis

Le premier appel de l7-l8-crossqa-dynamic-final-go-20261016.ts a arrêté sur quatre
processus Node language-server, avant toute écriture de réservation/FINALGO et
avant toute création runtime. Son résultat d'outil d'origine reste conservé dans
le transcript parent ; ce document ne prétend pas être un log brut byte-exact.

PIDs observés14224/25012 : tsserver.js opencode-ensemble-session ;43336/45068 :
tsserver.js Serena. Le sélecteur parent trop large `tsc(?:\.js)?` a reconnu le
préfixe `tscancellation` de leurs arguments cancellationPipeName. Ce n'était pas
une preuve de test/TSC/probe concurrent ; aucun de ces processus n'a été arrêté.

Correction du SEUL sélecteur d'observation : le nom tsc doit être un token ou
basename complet, éventuellement .js/.cjs, avec frontières quote/espace/fin.
Le préflight corrigé conserve son propre JSON avant assert. On réobserve le
créneau ; pas une relance produit, pas correction d'oracle ni de fixture, pas
waiver d'exclusivité, changement d'environnement/globalconfig ou droits worker.
