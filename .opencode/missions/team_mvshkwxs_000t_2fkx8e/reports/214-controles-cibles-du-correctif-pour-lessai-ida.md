# 214. Contrôles ciblés du correctif pour l'essai IDA

## Objectif et état reçu

Le cap rappelé au point213 est le petit essai concret avec IDA. La correction actuelle doit seulement permettre de terminer la vérification des fichiers du lanceur, là où l'essai209 s'était arrêté. Elle n'est pas une nouvelle mission ou une raison d'élargir les garanties à vérifier.

Le parent a déjà recalculé les cinq pins du gel corrigé414a/7d5b/adf0, confirmé le diff limité aux cinq cibles historiques et lu les parties affectées : lecteur readFileAsync, boucle par lots, intégration privée avant lancement et deux nouveaux tests. Le lecteur hors contrat est absent. Les confirmations répétées du constructeur ne constituent pas de nouvelles éditions et ne déclenchent pas de nouvelle revue générale.

## Sélection fermée avant exécution

Depuis le harness du candidat198, le parent autorise :

1. `bun run typecheck`.
2. Le fichier client existant, filtré sur les trois cas précédents : absence d'issuer public, faux objets refusés et POST toujours interdit.
3. Le fichier runtime-binding existant, filtré sur ses sept cas RMSN-OWNED-RO : les cinq précédents et les deux nouveaux oracles de lots et de HOLD/drain.

Les expressions exactes, argv, pins avant/après et durées seront conservés dans `qa-owned-runtime-214`. Critères fermés : sortie0, exactement3cas client et7cas binding attendus, aucun échec ou timeout. Les cas filtrés sont non exécutés, jamais comptés PASS. Dix minutes au maximum par invocation, sans retry automatique ou élargissement de sélection.

Les corps des deux nouveaux tests sont offline : promesses contrôlées, petits contenus en mémoire et données d'identité. Ils n'appellent ni fichiers réels, base, processus, réseau ou serveur. Les tailles40Mio de l'oracle d'admission ne sont pas allouées. Les imports existants restent ceux inspectés aux contrôles203 ; aucun nouveau hook d'exécution n'est ajouté. L'entrée privée du client ne s'exécute pas par import de bibliothèque.

## Preuves réutilisées et gate restante

Les primitives Q1 sans modification et les frontières produit non affectées réutilisent leurs preuves valides ; pas de suite globale ou de nouveau scan32227. La revue indépendante déjà engagée porte sur le delta et son impact, pas sur une revalidation des acquis.

Même avec ces contrôles réussis, le gain réel et la qualification Bun→Bun resteront à prouver par un nouvel acte distinct, borné et reçu extérieurement. Aucun essai natif, origine, permis modèle, accès IDA supplémentaire ou écriture de sa base n'est autorisé par cette QA logicielle. M2 reste ouvert.

## Pins effectivement sélectionnés

- client97814octets/SHA `414afd9d5cdcda9448615c32851d436031f1223c6e2e55b64710aba2777aab70`.
- binding28637octets/SHA `7d5bd1104015211994fb5c541e5d75a9134da9352fd9098de7e0e1dceaf3251e`.
- tests binding21276octets/SHA `adf094ce338030bca2d2e39c1cbb9c89f667744d6bd99b26f54181e4038addd4`.
- transport25629/54d35747 et tests client112023/35d881db inchangés ; pins complets dans les reçus.
