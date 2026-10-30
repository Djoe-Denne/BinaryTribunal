# 182. Archives et fichiers acquis épinglés, sans chargement

## Résultat obtenu

Le parent vérifie dans le cache possédé **367archives uniques réellement reçues**, dont les SRI SHA512 correspondent au verrou. Elles alimentent381paquets installés ;48entrées du verrou sont absentes dans cette installation de plateforme. Aucun paquet requis non optionnel compatible ne manque à ce contrôle.

Les32227fichiers installés sont hachés, pour332635368octets, avec un manifeste de fermeture réel. L'archive publiée du serveur2.2.1 est copiée byte-exactement depuis le cache après vérification, pas téléchargée à nouveau ni exécutée. Elle est distincte du manifeste de versions et de l'archive source desktop158.

**Cela prouve les fichiers acquis, pas leur importabilité, la correspondance au code en mémoire ou un serveur fonctionnel.** Les signatures/attestations npm n'ont pas été vérifiées et ne sont pas revendiquées. Aucun nouveau sourceSha de permis n'est encore ratifié depuis ces seuls fichiers.

## Première capture incomplète conservée

La première capture sous Bun ne produit aucun reçu final : le wrapper remonte exit=null, sans stdout/stderr, sous une borne120s. Il n'a pas conservé le signal ou le code d'erreur, donc la cause et la durée réelle ne sont pas affirmées. Seule l'archive serveur avait été écrite ; aucun helper de capture correspondant n'était encore trouvé actif lors du contrôle ciblé suivant. Cette tentative reste non réussie.

Le parent conserve la version initiale du script et l'archive partielle. Une reprise explicite, sous Node24, relit les mêmes fichiers sans acquisition, vérifie l'archive existante au lieu de l'écraser et écrit le manifeste des archives avant la lecture exhaustive. Elle réussit en3,721s, avec progression et reçu final. Aucun échec de permission n'a été contourné, aucun code applicatif importé ou nœud de serveur lancé. Ce résultat ne diagnostique pas une incompatibilité du futur runtime Bun ; le script d'outillage et l'application sont des consommateurs distincts.

## Gate suivante

Le constructeur inspecte seulement les assets réellement présents et les sélections des loaders : formats, architecture, hashes et limites. Un avis indépendant de ces actifs et de la provenance précédera le plan exécutable de bootstrap. Les scripts de dépendance restent interdits, même si un fichier manque. Rien n'est réparé par build ou patch du core.

## Preuves

Sous le namespace rms-owned-http-host-180/provenance :

- archives.json :350336octets/SHA329b744c3520380553e68331cc203f14b1d8995fc49e2f09de6c1532f38c938e.
- installed-files.json :5991608octets/SHA5e03043e9d68835d5a0bc5b6ee9d627c20e63202c36ddaf9756fb6db5dc80708.
- receipt.json :1425octets/SHA80bbcd397f9d167941b4ba0b384b3c3535822305e9212b51dd81ff38fb626729.
- server-2.2.1.tgz :62480octets/SHA216d297fe87af4f1937c85cdcfae6ae552edc72eaa1f43305defe150c439bc8f ; SRI public exact vérifié.
- provenance-attempt2-execution.json : sortie0/signalnull,3721ms ; script initial préservé sous capture-host-provenance-182.baseline.mjs,6152octets/SHA0a1b362ed9304eebeb96e3b5351d36808336b0c2128bfb98e70094bfe4e732b5.

Origine RMS toujours1, invocation170 expirée, aucun nouveau prompt ou serveur. M2 reste ouvert.
