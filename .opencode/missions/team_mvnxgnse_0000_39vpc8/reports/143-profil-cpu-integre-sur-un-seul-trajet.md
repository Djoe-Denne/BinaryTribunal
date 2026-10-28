# M2 — 143 : profiler un seul trajet avec l'outil déjà installé

## Capacité constatée et objectif

L'aide142 du Bun pinné a réellement terminé exit0/17ms sans produit/test évalué. Elle expose --cpu-prof, --cpu-prof-name, --cpu-prof-dir et l'intervalle par défaut1000µs. Aucun outil installé, framework ou instrumentation de validation ajouté. Source138 gelée et revues/typing140 toujours valides.

L'objectif est d'identifier les coûts dominants du trajet OLDREADY→swap→freshfinal, après deux runs où ce cas dépasse largement15s. Le lot141 rouge est conservé ; son éventuel déroulement d'assertions ne vaut pas qualification. Ne pas optimiser encore sur la seule multiplicité statique.

## Gate diagnostic autorisé

Une invocation Bun test avec profileur intégré, **un seul cas exact** : replacement old READY final/attempt cannot activate NEW; fresh final binds replacement and root attempt2. Filtre positif ancré ; les trois corps de thread ne correspondent pas et restent HOLD125. Test inchangé15s, concurrence1, plafond processus150s, zéro retry. Profilage peut ajouter du coût ; aucune comparaison de vitesse brute ni PASS obtenu en levant un délai.

Ajouter avant la commande test les options --cpu-prof, --cpu-prof-name=old-ready-143.cpuprofile et --cpu-prof-dir pointant vers le répertoire profiles neuf de cette gate. Aucun heapprofile, profileur externe, service, flag d'inspection/débogage public, replaninstrumenté ou callback dans une transaction. Intervalle1000µs par défaut. Seul fichier profile attendu ; conserver et hasher tout résultat ou anomalie, ne pas nettoyer.

Namespace evidence/s2-replacement-138-cpu et environnement homonyme neufs. Même pins138+4baseline/base309/extras/contrôles/dixinputs et reçu typing140vert au même sourceSet ; nouveau reçu de commande inclut les flags et la finalitéDIAGNOSTIC. Réserver DB/leasesassets neufs sous le contrat précédent (une fixture attendue, réservations surdimensionnées non créées distinctes), profil écrit seulement dans son chemin possédé. Environnement isolé/no-env/configvide/Bunpinné, aucun source modifiée.

Rouge de test15s attendu possible mais toujours enregistré **FAIL**, pas transformé en succès produit. Statut du diagnostic séparé : profil complet lisible, source/ressources intègres et commande terminée. Un timeout150s/signal ou profil absent/incomplet limite ou bloque le diagnostic, sans retry implicite. Les erreurs primaires et secondaires restent séparées comme141.

## Analyse et limites

Lire le profil via ContextMode, pas de dump brut : structure/nombre d'échantillons/durée, temps propres et inclusifs dominants, arêtes vers bind/stage/finalDocument/canonical et SQL si visibles. Conserver les fonctions internes/natives/GC et temps sanssymboles comme inconnus, sans les attribuer arbitrairement au produit. Dédoublonner les cadres récursifs lors de l'agrégation inclusive pour ne pas gonfler leur poids.

Ce profil échantillonné ne prouve ni latence de chaque phase, ni taille parrecord, ni causalité comparative. Il donnera une piste mesurée pour le plus petit correctif suivant, qui devra encore préserver toutes les preuves et être revu/validé. Aucun nouveau code perf autorisé dans ce rapport. Les57autres cas sans thread ne sont pas rejoués ; les3cas thread restent non lancés, jamais PASS.

S2/M2/remplacement/S1concret global/contention non acceptés ; trois commandes consolidées non lancées. Aucune hausse15s/300s, suppression de cas, framework/confinement, Git, live ou exécution de code reconstruit.
