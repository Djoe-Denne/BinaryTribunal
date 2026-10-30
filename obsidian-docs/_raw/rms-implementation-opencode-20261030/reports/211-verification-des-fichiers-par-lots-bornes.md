# 211. Vérification des fichiers par lots bornés

## Décision locale

Pour terminer la préparation avant le lancement de l'hôte, le parent retient la proposition du constructeur : petits lots de quatre fichiers indépendants au maximum et32Mio de lectures déclarées en vol. Un fichier dépassant32Mio reste traité seul, sous la limite existante100Mio. Cette limite vise les buffers applicatifs, pas une garantie sur toute la mémoire du processus.

L'hypothèse est qu'une vérification asynchrone bornée évite les attentes sérielles de la boucle actuelle. Ce n'est pas encore une mesure de performance ni une promesse de qualification. Le refus209 reste conservé et la cause précise de sa lenteur n'est pas déclarée démontrée.

## Contrat du correctif

Tous les32227fichiers doivent toujours être vérifiés : manifeste épinglé, chemins sûrs et uniques, fichier régulier sans lien, chemins réels avant/après lecture, hashes de tous les octets lus et identités BigInt exactes avec tailles et horodatages. Aucun cache de succès, comparaison stat-only ou abandon d'un fichier pour tenir le délai.

Les contrôles d'autorité, d'expiration et du budget restent actifs. Au premier échec ou arrêt, aucune nouvelle lecture n'est admise ; les seules lectures déjà lancées sont suivies jusqu'à leur fin connue, avec erreur conservée. Une fin tardive ne peut pas transformer HOLD en succès. Les API de métadonnées n'offrent pas d'annulation forte : un blocage du système reste un échec de la qualification sous le contrôle extérieur, pas une raison d'allonger120secondes.

Une progression non secrète doit exister avant le premier await : phase, indices admis/démarrés/vérifiés/terminés, nombre en vol, octets vérifiés et dernier stade. Elle reste visible dans les artefacts d'échec. Elle ne remplace aucune preuve native et ne contient ni chemins individuels, contenus ou environnement.

## Périmètre autorisé

Le correctif est autorisé uniquement dans `src/client.ts`, `src/graph-runtime-binding.ts` et `test/runtime-binding.test.ts` du candidat198. Le helper éventuel est limité à cette vérification de fichiers, sans issuer, capability, store, moteur ou scheduler RMS. Le client conserve la composition privée et ne peut émettre sa capability avant le contrôle complet, sans lecture en vol ni erreur.

Le transport, les tests client, le bootstrap180, les scripts de lancement et la base RMS ne sont pas modifiés. Les POST restent refusés. Le constructeur n'exécute ni import, test, benchmark, base, serveur ou réseau.

## QA affectée prévue

Le parent vérifiera le nouveau gel puis exécutera le typecheck et les seuls tests affectés après inspection de leurs chemins. Deux oracles offline sont prévus dans le fichier existant :

- lots désordonnés, limites de nombre/octets, chaque fichier vérifié une fois, refus des chemins, hashes ou identités divergents ;
- arrêt d'admission et suivi des lectures en vol après erreur, annulation, changement d'autorité ou coût simulé excessif ; HOLD conservé après fins tardives.

Le même reviewer examinera les risques du delta et les points d'admission/finalisation. Aucun scan natif, rejeu du diagnostic gelé ou nouvel essai de qualification n'est autorisé par cet ordre d'implémentation. Les preuves valides203 sont réutilisées pour les frontières inchangées.

## Provenance et limites

Contrat consultatif reçu : `READONLY_BOUNDED_PREFLIGHT_CORRECTION_CONTRACT_ONLY_PENDING_PARENT_DECISION`, dix points, sans édition ou exécution. Le manifeste déclaré contient332635368octets ; son plus gros fichier est de13931520octets. Ces données aident à borner la mémoire, sans prouver les contenus actuels.

Le plafond de trois origines, l'origine déjà comptée et tous les débits restent inchangés. Qualification Bun→Bun, tranche B, droits B/R, D5 et M2 restent ouverts.

## Compatibilité locale des API, sans scan

Le parent a vérifié les API asynchrones sur **le seul fichier du plan retenu**, sous Bun1.4.2 : lstat BigInt avant/après, realpath avant/après, lecture avec signal, hash exact et champs dev/ino/size/mtimeNs/ctimeNs cohérents. Une lecture avec signal déjà annulé est refusée par AbortError. Le reçu `evidence/bun-async-file-api-211.json` conserve ces résultats (2,57ms).

Ce contrôle stdlib n'importe pas le produit, n'ouvre aucune base et ne lit pas les32227fichiers. Il prouve cette compatibilité locale, pas un délai du scan, une custody native ou la fin d'un appel système bloqué. La première rédaction du script a échoué sur un échappement avant évaluation ; elle a été corrigée, sans attribuer un PASS à cet appel en erreur. Le résultat valide est transmis au constructeur sans lui demander de le rejouer.

## Précision sur la mémoire, sans nouvelle exigence

Un complément préparatoire du constructeur signale correctement que readFile peut allouer davantage si un fichier grandit après le premier stat. Le parent retient l'API de lecture existante pour cette correction locale : les32Mio sont donc une **borne d'admission des tailles déclarées**, non une garantie stricte d'allocation, même hors RSS. Les compteurs et commentaires doivent le nommer explicitement. Un fichier modifié est toujours refusé par le hash, la longueur et les contrôles d'identité après lecture ; cette détection ne prétend pas empêcher une allocation transitoire supérieure.

Un nouveau lecteur par descripteur avec buffer strict, contrôles EOF et nouvelles garanties mémoire n'est pas requis par le contrat utilisateur et n'est pas ajouté pour fermer ce correctif. La règle de fichier volumineux seul, sous la limite existante100Mio, reste inchangée ; le manifeste actuellement épinglé n'en contient aucun au-dessus de32Mio. Aucun manifeste nouveau n'est admis implicitement.

Ce complément clôt la préparation et ne remet pas l'ordre d'implémentation211 en attente d'une ratification. Les trois fichiers, les deux oracles, les délais, l'absence d'exécution par le constructeur et la revue affectée restent ceux déjà autorisés.
