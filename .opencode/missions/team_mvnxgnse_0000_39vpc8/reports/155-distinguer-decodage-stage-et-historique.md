# M2 — 155 : distinguer le décodage du stage de la lecture historique

## Problème et décision

La revue154 accepte statiquement le mémo produit153, mais bloque TEST-PARSE153. Le parent recoupe replacement.test315–368 : le spy compte tous les JSON.parse des mêmes octets. Chaque appel complet comprend un décodage du stage et un parse de son événement par EventLog.read. Deux appels produisent donc quatre parses totaux, et non les deux attendus. Aucun échec runtime n'est observé ; aucune compilation153 n'est acquise.

Autoriser une correction **du seul test/s2-author/replacement.test.ts**, après préservation byte-exacte des quatorze sources153 et du manifeste. Le produit accepté et les treize autres sources restent gelés. Ne pas simplement remplacer2par4 : établir séparément le décodage du préambule et les parses de l'historique, ou démontrer explicitement leur décomposition avec des compteurs indépendants et pass-through natif.

Conserver la preuve d'un seul décodage pur par préambule, du contexte neuf au second appel, des quatre lectures natives, des contrôles courants de métadonnées et des cinq variantes. Aucun audit produit retiré, hook produit, framework, toThrow générique, cas ou assertion de sûreté supprimé. Les spies doivent être restaurés et ne pas fabriquer de résultat ; la mesure de l'historique doit garder le même EventLog et les mêmes exceptions.

## Vérification et suite

Livrer hash/diff et justification des compteurs attendus, sans exécution. Même reviewer : reprise du seul défaut TEST-PARSE153 et impact du raccord ; constats produit154 et preuves antérieures réutilisés hors impact. Après acceptation, nouveau paquet de compilation avec308base+overlaycodec exact, puis mutations ciblées et diagnostic existant sur ressources neuves. Aucun rejeu scientifique450+9 ou ancien paquet clos.

Source seulement : aucun import évalué, typing, test, thread, SQL/DB, asset, provider, Git ou délégation. Aucun commit/merge/push/cleanup. Seuil15s inchangé, gain inconnu ; HOLD125 intégral sur les trois lancements thread. Les66cas ne sont pas exécutés sur153 ; S2/M2 restent non acceptés, commandes consolidées non lancées.
