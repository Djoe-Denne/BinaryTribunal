# M2 — 144 : profil absent, vérifier la capacité réelle avant de relancer le produit

## Résultat143 et décision d'arrêt

La commande143 a réellement exécuté un seul test :0PASS/1FAIL,7assertions,105975ms, exit1 sans signal, sources138 stables. Le test dépasse15s après105686ms ; il reste FAIL. Le répertoire profiles réservé est vide : le contrôle PROFILE_ARTIFACT_MISMATCH est légitime et aucun coût CPU n'a été mesuré.

L'aide globale de Bun annonçait --cpu-prof, mais cela ne prouve pas que ces options, placées avant test, instrumentent le runner. Ni support effectif du runner ni mauvais emplacement du fichier ne sont encore établis. Ne pas rechercher largement le disque ou adopter un profil trouvé ailleurs : seul le répertoire explicitement possédé était autorisé.

Paquet143 clos, aucune relance produit. Les logs/reçus/DB/assets sont conservés ; aucun résultat CPU ou gain inventé. Avant un autre run de plus100s, fermer la capacité sur un canary inoffensif.

## Préparation bornée autorisée

Autoriser une consultation de **bun test --help**,10s maximum, dans un environnement neuf isolé/configvide/no-env, sans source produit. Conserver les options et leur portée. Si les optionsCPU sont réellement exposées au runner, autoriser ensuite **une seule sonde de profilage du canary existant133**,10s maximum, même filtre sûr et même Bun pinné, optionsCPU placées au niveau test selon cette aide. Aucun produit, SQL/DB/asset/worker possible dans le canary ; ses trois sentinelles doivent rester non exécutées.

Répertoires de logs/profil/env neufs sous evidence/s2-profile-probe-144 et environnementhomonyme. Une seule séquence help→canary, pas boucle d'essais. Profil attendu probe-144.cpuprofile, chemin exact possédé ; sourcecanary133hash8afad18b… inchangée. Une sonde doit fournir effectivement un fichier lisible et un test sûr PASS,0FAIL, pour fermer cette capacité. Les trois exclus ne deviennent pas PASS ; cette sonde n'est jamais un test produit.

Si runnerhelp n'expose pas les options ou si la sonde ne produit pas de profil, déclarer ce moyen indisponible dans les conditions testées. Ne pas relancer le produit, installer un profiler externe, créer un runner général ou changer les permissions. Une instrumentation source privée minimale pourra être proposée séparément si nécessaire ; elle n'est pas autorisée ici.

## Limites

Aucune nouvelle exécution de remplacement, threshold15s/300s inchangé, HOLD125 intégral pour les trois vrais cas thread. Sources138 gelées ; aucune modification de validation ou oracle. Les trois commandes consolidées non lancées et S2/M2/remplacement/S1concret global/contention restent non acceptés.
