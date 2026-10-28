# Vérification parent — v18

## Correctifs du harnais writer avant sa première exécution native

Le nouveau writer harnais réutilisait une continuation synthétique `E9` à
`site+6`, sans remettre ses propres voisins avant le restore. Cela aurait
invalidé à juste titre le nouveau readback de 14 octets du candidat. Le parent
a ajouté sauvegarde/restauration de ces cinq octets de continuation et flush
cache, sans modifier le candidat ni sa fenêtre sauvegardée.

Le contrôleur writer copie maintenant DLL/source en streaming, vérifie le
hash des données parsées contre celui du fichier et conserve le code de sortie
du sous-processus dans le reçu avant tout refus de gate.

Les tests historiques ont été adaptés pour inclure le nouveau build dans les
matrices mixed-build ; les cas négatifs `0x5645` restent négatifs. Aucun reset
du lifecycle et aucun monkeypatch de `lot24_contract.BUILD`.

## Arbitrage de la revue indépendante

La revue source du candidat n'a identifié aucun défaut bloquant supplémentaire
dans le périmètre stage0 décidé. Les preuves dynamiques restent nécessaires.
Le parent a vérifié le build, ses hashes et le désassemblage indépendamment.

Corrections d'interprétation de la revue : les détours génériques Present/ODS
sont des **E9**, pas les E8 stage0 ; `nohook` à l'attach empêche leur pose.
Le magic `0x3831434C` se sérialise `4C 43 31 38`, soit bien `LC18`.
Les dix corps comparés dans `unchanged_bodies.json` sont identiques au **source**
normalisé v17 ; cela ne signifie pas que leurs adresses ou bytes machine après
relink sont identiques. `/W3` stdout+stderr sont capturés ; aucun rebuild `/W4`
n'est requis pour conclure à la réussite du build effectivement exécuté.

Retenus : documenter les valeurs de state LC18, rejeter l'identité de création
nulle dans la gate et déclarer les anciens détours désactivés dans les hôtes
synthétiques. La concurrence d'exécution des sites/wrappers reste hors preuve ;
aucune gate séquentielle n'est présentée comme un stress test concurrent.

## Validation de l'ingestion déléguée

Le parent a corrigé la ligne de journal wiki nouvellement générée : elle
mentionnait par erreur `0x5645`, un multiplicateur « x8 » pour la gate I et
une explication erronée du blocage live. Les faits sont `0x5646`, deux passes
writer de 684+106 checks chacune et un blocage par les durées de vie hors
stage0. Les copies brutes sont vérifiées séparément contre les originaux ;
la prose d'un sous-agent ne remplace pas ces preuves.

Les fichiers `review_*` conservent le diff de la livraison initiale du writer ;
les `final_review_*` montrent la version effectivement exécutée après les
corrections du parent.
