# 191. Retrait ciblé des ajouts d'environnement avant import

## Décision

La sonde190 identifie six noms ajoutés au runtime malgré l'environnement fourni réduit. Le parent choisit de **retirer ces seuls ajouts avant les imports**, plutôt que d'élargir l'allowlist ou d'admettre leurs valeurs provenant du profil Windows.

Une correction de `bootstrap-host.mjs` et des pins de `host-plan.json` est autorisée. Le runner corrigé5e612 reste inchangé. Le parent a préservé les trois fichiers courants sous `baseline-candidate-189` avant modification ; la qualification échouée et ses preuves ne seront pas écrasées.

## Contrat de correction et vérification

La sélection des six noms doit être exacte et insensible à la casse : HOMEDRIVE, HOMEPATH, LOGONSERVER, SYSTEMDRIVE, USERDOMAIN, USERNAME. Le code ne doit pas lire leurs valeurs ni les utiliser pour résoudre des chemins. Il supprime les entrées présentes, vérifie leur absence puis applique l'allowlist initiale inchangée. Une variable inconnue reste refusée.

HOME, USERPROFILE, les chemins XDG, SystemRoot et ProgramData propres restent contrôlés comme avant. Aucune variable de préchargement, proxy, identifiant fournisseur ou override d'asset n'est admise par cette correction.

Le constructeur ne lance aucun script. Le parent vérifiera syntaxe et fonction isolée avec des environnements simulés, puis demandera au même reviewer de revoir le delta et sa portée. Une éventuelle nouvelle qualification devra être décidée explicitement sur le candidat corrigé ; elle n'est pas autorisée par ce rapport. Aucun nouvel audit global ou harnais important n'est engagé.

## Limites conservées

Les ajouts sont prouvés dans la sonde, pas identifiés rétroactivement dans les logs189. Le correctif répond à cette incompatibilité reproduite mais ne garantit pas le prochain démarrage. La réussite IPC de la sonde ne qualifie pas les chargements natifs, HTTP ou la fermeture d'un scope serveur.

Aucun secret lu, session, prompt, modèle ou origine ajouté. Les droits170 et le périmètre D5/M2 restent inchangés.
